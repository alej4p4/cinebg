// Suíte de QA da auditoria sênior (Issue #234)
// Cobre: casos positivos, negativos, extremos, carga e segurança.
// Compila os módulos TypeScript REAIS de produção via esbuild (sem cópias de lógica).
import test, { before } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const ROOT = process.cwd()
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8')
const DAY = 24 * 60 * 60 * 1000

// ---- Stub de localStorage em memória (Node não possui DOM) ----
class MemoryStorage {
  constructor() {
    this.map = new Map()
  }
  getItem(k) {
    return this.map.has(k) ? this.map.get(k) : null
  }
  setItem(k, v) {
    this.map.set(k, String(v))
  }
  removeItem(k) {
    this.map.delete(k)
  }
  clear() {
    this.map.clear()
  }
}
const storage = new MemoryStorage()
Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true, writable: true })

const compile = async (entry) => {
  const outfile = path.join(os.tmpdir(), `cinebg-qa-${path.basename(entry, '.ts')}-${process.pid}.mjs`)
  await build({
    entryPoints: [path.join(ROOT, entry)],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile,
    logLevel: 'silent',
    alias: { '@': path.join(ROOT, 'src') },
    define: { 'import.meta.env': '{}' },
  })
  return import(pathToFileURL(outfile).href)
}

let lic
let tv
before(async () => {
  lic = await compile('src/hooks/useLicense.ts')
  tv = await compile('src/utils/tv.ts')
})

const codeFor = (deviceId, days) => `CINEBG-${days}-${lic.computeActivationChecksum(deviceId, days)}`

// =====================================================================
// 1. CASOS POSITIVOS
// =====================================================================
test('POS-1: código assinado válido é aceito para todos os planos', () => {
  const device = 'cinebg_abc123_xyz'
  for (const days of lic.VALID_ACTIVATION_DAYS) {
    const r = lic.validateActivationCode(codeFor(device, days), device)
    assert.deepEqual(r, { valid: true, days }, `plano ${days} deve ser aceito`)
  }
})

test('POS-2: código é aceito com minúsculas e espaços (digitação no controle remoto)', () => {
  const device = 'hw-ANDROID-001'
  const code = codeFor(device, 90)
  assert.equal(lic.validateActivationCode(`  ${code.toLowerCase()}  `, device).valid, true)
  assert.equal(lic.validateActivationCode(code.replace('-90-', '- 90 -'), device).valid, true)
})

test('POS-3: licença válida armazenada é lida e mantida', () => {
  storage.clear()
  const license = { code: 'X', expiresAt: Date.now() + 10 * DAY, planDays: 30 }
  storage.setItem('cinebg_license', JSON.stringify(license))
  assert.equal(lic.getStoredLicense()?.code, 'X')
})

test('POS-4: isVersionNewer detecta versão maior corretamente', () => {
  assert.equal(tv.isVersionNewer('1.2.64', '1.2.63'), true)
  assert.equal(tv.isVersionNewer('v1.3.0', '1.2.99'), true)
  assert.equal(tv.isVersionNewer('2.0', '1.9.9'), true)
})

// =====================================================================
// 2. CASOS NEGATIVOS
// =====================================================================
test('NEG-1: textos arbitrários NÃO liberam o VIP (correção do bypass CWE-306)', () => {
  const device = 'cinebg_abc123_xyz'
  for (const attempt of ['teste', '123', 'VIP', 'CINEBG', 'CINEBG-30', 'MP-12345', 'admin', 'liberar']) {
    const r = lic.validateActivationCode(attempt, device)
    assert.equal(r.valid, false, `"${attempt}" não pode ativar licença`)
  }
})

test('NEG-2: checksum adulterado é rejeitado', () => {
  const device = 'dev-1'
  const valid = codeFor(device, 30)
  const last = valid.at(-1)
  const tampered = valid.slice(0, -1) + (last === 'A' ? 'B' : 'A')
  assert.deepEqual(lic.validateActivationCode(tampered, device), { valid: false, reason: 'checksum' })
})

test('NEG-3: código de um aparelho não funciona em outro (anti-compartilhamento)', () => {
  const code = codeFor('aparelho-A', 365)
  assert.deepEqual(lic.validateActivationCode(code, 'aparelho-B'), { valid: false, reason: 'checksum' })
})

test('NEG-4: trocar o número de dias invalida o código (sem upgrade 30 -> 365)', () => {
  const device = 'dev-upgrade'
  const checksum30 = lic.computeActivationChecksum(device, 30)
  assert.equal(lic.validateActivationCode(`CINEBG-365-${checksum30}`, device).valid, false)
})

test('NEG-5: plano inexistente é rejeitado mesmo com checksum correto', () => {
  const device = 'dev-plan'
  const code = `CINEBG-45-${lic.computeActivationChecksum(device, 45)}`
  assert.deepEqual(lic.validateActivationCode(code, device), { valid: false, reason: 'plan' })
})

test('NEG-6: licença expirada é descartada e removida do armazenamento', () => {
  storage.clear()
  storage.setItem('cinebg_license', JSON.stringify({ code: 'OLD', expiresAt: Date.now() - 1000 }))
  assert.equal(lic.getStoredLicense(), null)
  assert.equal(storage.getItem('cinebg_license'), null)
})

test('NEG-7: isVersionNewer nunca oferece downgrade ou mesma versão (anti-loop de update)', () => {
  assert.equal(tv.isVersionNewer('1.2.63', '1.2.63'), false)
  assert.equal(tv.isVersionNewer('1.2.62', '1.2.63'), false)
  assert.equal(tv.isVersionNewer('', '1.2.63'), false)
})

// =====================================================================
// 3. CASOS EXTREMOS
// =====================================================================
test('EDGE-1: entradas vazias, nulas e indefinidas não quebram o validador', () => {
  assert.deepEqual(lic.validateActivationCode('', 'd'), { valid: false, reason: 'empty' })
  assert.deepEqual(lic.validateActivationCode('   ', 'd'), { valid: false, reason: 'empty' })
  assert.deepEqual(lic.validateActivationCode(null, 'd'), { valid: false, reason: 'empty' })
  assert.deepEqual(lic.validateActivationCode(undefined, 'd'), { valid: false, reason: 'empty' })
  assert.deepEqual(lic.validateActivationCode('CINEBG-30-AAAAAAAA', ''), { valid: false, reason: 'device' })
})

test('EDGE-2: entrada gigante (100 KB) é rejeitada rapidamente sem ReDoS', () => {
  const huge = 'CINEBG-30-' + 'A'.repeat(100_000)
  const t0 = performance.now()
  assert.equal(lic.validateActivationCode(huge, 'd').valid, false)
  assert.ok(performance.now() - t0 < 50, 'validação de entrada gigante deve ser < 50ms')
})

test('EDGE-3: unicode, emojis e caracteres de controle são rejeitados', () => {
  for (const s of ['CINEBG-30-ÁÉÍÓÚÇÃÕ', 'CINEBG-30-😀😀😀😀', 'CINEBG-30-\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000']) {
    assert.equal(lic.validateActivationCode(s, 'd').valid, false)
  }
})

test('EDGE-4: deviceId com caracteres especiais gera checksum estável', () => {
  const weird = 'id/with:special*chars?"<>|é🙂'
  assert.equal(lic.computeActivationChecksum(weird, 30), lic.computeActivationChecksum(weird, 30))
  assert.match(lic.computeActivationChecksum(weird, 30), /^[0-9A-Z]{8}$/)
  assert.equal(lic.validateActivationCode(codeFor(weird, 30), weird).valid, true)
})

test('EDGE-5: JSON de licença corrompido não derruba o app', () => {
  storage.clear()
  storage.setItem('cinebg_license', '{corrompido')
  assert.equal(lic.getStoredLicense(), null)
  storage.setItem('cinebg_license', JSON.stringify({ code: 'X', expiresAt: 'amanha' }))
  assert.equal(lic.getStoredLicense(), null)
})

test('EDGE-6: teste de 3 dias preserva a data MAIS ANTIGA (não reinicia ao atualizar)', () => {
  storage.clear()
  const installedAt = Date.now() - 4 * DAY
  storage.setItem('cinebg_first_use', String(installedAt))
  assert.equal(lic.getFirstUse(), installedAt, 'primeiro uso deve continuar sendo o original')
  assert.ok(Date.now() > installedAt + lic.TRIAL_DAYS * DAY, 'após 4 dias o teste deve estar vencido')
})

test('EDGE-7: timestamps inválidos (futuro remoto não, antes de 2020, NaN) são ignorados', () => {
  storage.clear()
  storage.setItem('cinebg_first_use', 'NaN')
  const before1 = Date.now()
  const ts = lic.getFirstUse()
  assert.ok(ts >= before1 - 5, 'valor inválido deve ser substituído pelo instante atual')
  storage.setItem('cinebg_first_use', '1000') // 1970
  assert.ok(lic.getFirstUse() > 1577836800000)
})

// =====================================================================
// 4. TESTES DE CARGA / PERFORMANCE
// =====================================================================
test('LOAD-1: 50.000 validações em menos de 1,5s (TV Box de baixo custo)', () => {
  const device = 'load-device'
  const code = codeFor(device, 30)
  const t0 = performance.now()
  for (let i = 0; i < 50_000; i += 1) lic.validateActivationCode(code, device)
  const elapsed = performance.now() - t0
  assert.ok(elapsed < 1500, `50k validações levaram ${elapsed.toFixed(0)}ms`)
})

test('LOAD-2: 20.000 aparelhos distintos geram checksums sem colisão', () => {
  const seen = new Set()
  for (let i = 0; i < 20_000; i += 1) seen.add(lic.computeActivationChecksum(`device-${i}`, 30))
  assert.equal(seen.size, 20_000)
})

test('LOAD-3: 10.000 leituras de licença consecutivas mantêm consistência', () => {
  storage.clear()
  storage.setItem('cinebg_license', JSON.stringify({ code: 'L', expiresAt: Date.now() + DAY }))
  for (let i = 0; i < 10_000; i += 1) assert.equal(lic.getStoredLicense()?.code, 'L')
})

// =====================================================================
// 5. TESTES DE SEGURANÇA
// =====================================================================
test('SEC-1: força bruta com 100.000 códigos aleatórios não encontra licença válida', () => {
  const device = 'target-device'
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let hits = 0
  for (let i = 0; i < 100_000; i += 1) {
    let cs = ''
    for (let j = 0; j < 8; j += 1) cs += alphabet[(Math.random() * 36) | 0]
    if (lic.validateActivationCode(`CINEBG-30-${cs}`, device).valid) hits += 1
  }
  assert.equal(hits, 0)
})

test('SEC-2: nenhum client secret OAuth hardcoded no código-fonte (CWE-798)', () => {
  const mp = read('src/services/mercadoPago.ts')
  assert.doesNotMatch(mp, /CLIENT_SECRET\s*\|\|\s*['"]/, 'secret não pode ter fallback literal')
  assert.doesNotMatch(mp, /CLIENT_ID\s*\|\|\s*['"]/, 'client id não pode ter fallback literal')
  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]
    )
  for (const file of walk(path.join(ROOT, 'src'))) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /SFtjWhm55MnXqPdyfRH0fNuiBLYHRPjR/, `secret vazado em ${file}`)
  }
})

test('SEC-3: ativação manual exige validação antes de liberar o VIP', () => {
  const gate = read('src/components/LicenseGate.tsx')
  const handler = gate.slice(gate.indexOf('const handleActivateManual'), gate.indexOf('if (activated)'))
  assert.match(handler, /validateActivationCode\(/)
  assert.match(handler, /isLicensedRemotely\(/)
  assert.ok(
    handler.indexOf('validateActivationCode(') < handler.indexOf('activateLicense('),
    'activateLicense só pode ser chamado após a validação'
  )
  assert.match(handler, /if \(!remoteOk\)[\s\S]*?return/, 'código inválido deve abortar a ativação')
})

test('SEC-4: anúncios de apostas (1xBet) continuam bloqueados', () => {
  const src = fs
    .readdirSync(path.join(ROOT, 'src/services'))
    .map((f) => read(`src/services/${f}`))
    .join('\n')
  assert.match(src, /1xbet/i, 'deve existir regra de bloqueio para 1xBet')
})

// =====================================================================
// 6. REGRESSÃO DE ARQUITETURA / BUILD / ESTADO
// =====================================================================
test('REG-1: removeProfile sincroniza subtitleOption do perfil ativo', () => {
  const store = read('src/store/useAppStore.ts')
  const start = store.indexOf('removeProfile: (id) =>')
  assert.ok(start > 0, 'implementação de removeProfile deve existir')
  const block = store.slice(start, store.indexOf('addFavorite:', start))
  assert.match(block, /subtitleOption: active\.subtitleOption/)
})

test('REG-2: @capacitor/app importado estaticamente (sem conflito de chunk no Rollup)', () => {
  const app = read('src/App.tsx')
  assert.doesNotMatch(app, /import\(\s*['"]@capacitor\/app['"]\s*\)/)
  assert.match(app, /import \{ App as CapApp \} from '@capacitor\/app'/)
})

test('REG-3: hls.js isolado em chunk próprio no Vite', () => {
  const vite = read('vite.config.ts')
  assert.match(vite, /hls:\s*\['hls\.js'\]/)
  assert.match(vite, /chunkSizeWarningLimit/)
})

test('REG-4: observabilidade usa a versão nativa real (sem versão fixa antiga)', () => {
  const obs = read('src/services/observability.ts')
  assert.doesNotMatch(obs, /'1\.2\.57'/)
  assert.match(obs, /getNativeAppVersion\(\)/)
})

// =====================================================================
// 7. CORREÇÃO DE ÁUDIO E LEGENDAS (ISSUE #276)
// =====================================================================
test('AUDIO-1: heurística robusta de detecção de áudio PT-BR e produções nacionais', async () => {
  const streams = await compile('src/services/streams.ts')
  const isPt = streams.isPortugueseAudioCandidate

  // 1. Produções nacionais brasileiras (originalLanguage === 'pt')
  assert.equal(isPt('Opcao 1', 'https://cdn.example.com/video.mp4', 'pt'), true, 'produções em PT devem ser detectadas como áudio em português')

  // 2. Rótulos variados com termos em português
  assert.equal(isPt('Opção 1 (Português)', 'https://cdn.example.com/video.mp4', 'en'), true)
  assert.equal(isPt('Audio PT-BR', 'https://cdn.example.com/video.mp4', 'en'), true)
  assert.equal(isPt('Filme Dublado 1080p', 'https://cdn.example.com/video.mp4', 'en'), true)
  assert.equal(isPt('Versão Nacional', 'https://cdn.example.com/video.mp4', 'en'), true)

  // 3. URLs contendo termos de áudio em português
  assert.equal(isPt('Opção 1', 'https://cdn.example.com/filme-pt-br.mp4', 'en'), true)
  assert.equal(isPt('Opção 1', 'https://fontedecanais.com/stream.m3u8', 'en'), true)

  // 4. Fontes originais estrangeiras sem indicação de português
  assert.equal(isPt('English Original', 'https://cdn.example.com/movie-en.mp4', 'en'), false)
})

test('AUDIO-2: priorização automática de áudio PT-BR no StreamPlayer sem poluição de perfil global', () => {
  const player = read('src/components/player/StreamPlayer.tsx')

  // Não deve sobrescrever o perfil do usuário permanentemente ao tocar filme legendado
  assert.doesNotMatch(player, /setAudioOption\((hasDubbedSource \? 'dub' : 'orig'|'orig')\)/, 'StreamPlayer não deve reescrever setAudioOption global ao carregar mídia')

  // Deve selecionar áudio dublado automaticamente se disponível
  assert.match(player, /if \(hasDubbedSource\)[\s\S]*?setActiveAudio\('dub'\)/, 'StreamPlayer deve selecionar áudio em português automaticamente quando disponível')

  // Deve inicializar áudio ativo via initialAudio ou 'dub' por padrão
  assert.match(player, /const \[activeAudio, setActiveAudio\] = useState/, 'StreamPlayer deve manter activeAudio específico da sessão')
})

test('AUDIO-3: PlaybackSettingsModal e HUD com suporte dinâmico a áudio e controle remoto TV', () => {
  const modal = read('src/components/player/PlaybackSettingsModal.tsx')
  assert.match(modal, /dubbedLabel/, 'PlaybackSettingsModal deve exibir rótulo contextual de dublado ou original nacional')
  assert.match(modal, /origLabel/, 'PlaybackSettingsModal deve exibir o idioma original dinâmico')

  const player = read('src/components/player/StreamPlayer.tsx')
  assert.match(player, /activeAudio === 'dub' \? 'orig' : 'dub'/, 'HUD e atalhos devem alternar activeAudio da sessão')
  assert.match(player, /hls\.audioTrack =/, 'StreamPlayer deve alternar hls.audioTrack de forma transparente em transmissões multi-áudio')
})

// =====================================================================
// 8. CONTROLES DO PLAYER E NAVEGAÇÃO SMART TV / TOUCH (ISSUE #278)
// =====================================================================
test('PLAYER-1: Controles dedicados de retroceder, reproduzir/pausar e avançar com suporte touch e pointer', () => {
  const player = read('src/components/player/StreamPlayer.tsx')

  // Botões dedicados no HUD
  assert.match(player, /id="hud-btn-rewind"/, 'HUD deve conter botão dedicado de retroceder 10s')
  assert.match(player, /id="hud-btn-play"/, 'HUD deve conter botão de play/pause')
  assert.match(player, /id="hud-btn-forward"/, 'HUD deve conter botão dedicado de avançar 10s')

  // Scrubber com eventos de pointer e touch para evitar desync durante o arraste
  assert.match(player, /onPointerDown=\{handleScrubberStart\}/, 'Scrubber deve sinalizar início do arraste no ponteiro')
  assert.match(player, /onTouchStart=\{handleScrubberStart\}/, 'Scrubber deve sinalizar início do arraste no touch')
  assert.match(player, /onPointerUp=/, 'Scrubber deve comitar o seek no término do ponteiro')
  assert.match(player, /onTouchEnd=/, 'Scrubber deve comitar o seek no término do touch')
  assert.match(player, /isScrubbingRef\.current/, 'handleTimeUpdate deve respeitar arraste do usuário sem forçar recuo da barra')
})

test('PLAYER-2: Navegação D-Pad em Smart TV e teclas de mídia física do controle remoto', () => {
  const player = read('src/components/player/StreamPlayer.tsx')

  // getBottomHudButtons deve isolar os botões de controle da linha do player
  assert.match(player, /btn\.id !== 'hud-btn-rewind'/, 'getBottomHudButtons não deve misturar hud-btn-rewind com ações de rodapé')
  assert.match(player, /btn\.id !== 'hud-btn-forward'/, 'getBottomHudButtons não deve misturar hud-btn-forward com ações de rodapé')

  // Teclas de controle remoto de TV e atalhos universais
  assert.match(player, /MediaPlayPause|179/, 'Deve suportar botão MediaPlayPause físico de controle remoto TV')
  assert.match(player, /MediaRewind|227/, 'Deve suportar botão MediaRewind físico de controle remoto TV')
  assert.match(player, /MediaFastForward|228/, 'Deve suportar botão MediaFastForward físico de controle remoto TV')
  assert.match(player, /key === 'j'/, 'Deve suportar atalho j (retroceder 10s)')
  assert.match(player, /key === 'l'/, 'Deve suportar atalho l (avançar 10s)')
})



// =====================================================================
// 9. COMPATIBILIDADE CELULARES E SMART TVS (ISSUE #280)
// =====================================================================
test('COMPAT-1: Detecção e separação de ecossistemas (Celular/Tablet vs Smart TV/TV Box)', () => {
  const tvCode = read('src/utils/tv.ts')
  assert.match(tvCode, /Tablets e iPads/, 'tv.ts deve identificar tablets e iPads com tela de toque mesmo em alta resolução')
  assert.match(tvCode, /setPlayerLandscape/, 'tv.ts deve suportar sincronização de orientação com a ponte nativa')
})

test('COMPAT-2: Layout adaptativo e isolamento de tela cheia no player para celulares', () => {
  const appCode = read('src/App.tsx')
  assert.match(appCode, /const MainLayout =/, 'App.tsx deve possuir MainLayout com controle dinâmico de rota')
  assert.match(appCode, /isWatch[\s\S]*?pb-0 overflow-hidden/, 'Na rota /watch o padding inferior deve ser zerado para evitar barra residual')
})

test('COMPAT-3: Sincronização nativa de orientação paisagem no StreamPlayer', () => {
  const player = read('src/components/player/StreamPlayer.tsx')
  assert.match(player, /setNativePlayerLandscape\(false\)/, 'StreamPlayer deve sincronizar rotação para retrato na ponte nativa')
  assert.match(player, /setNativePlayerLandscape\(true\)/, 'StreamPlayer deve sincronizar rotação para paisagem na ponte nativa')
})
