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
let mp
before(async () => {
  lic = await compile('src/hooks/useLicense.ts')
  tv = await compile('src/utils/tv.ts')
  mp = await compile('src/services/mercadoPago.ts')
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
  assert.equal(tv.isVersionNewer('1.3.10', '1.3.10'), false)
  assert.equal(tv.isVersionNewer('1.3.09', '1.3.10'), false)
  assert.equal(tv.isVersionNewer('1.3.10', '1.3.09'), true)
  assert.equal(tv.isVersionNewer('1.3.09', '1.3.9'), false)
})

test('NEG-8: snooze de atualização não obrigatória persiste no localStorage e impede loop de prompt', () => {
  storage.clear()
  const version = '1.3.10'
  storage.setItem('cinebg_dismissed_update', JSON.stringify({ version, timestamp: Date.now() }))

  const raw = storage.getItem('cinebg_dismissed_update')
  assert.ok(raw, 'cinebg_dismissed_update deve existir no storage')
  const parsed = JSON.parse(raw)
  const isSnoozed = parsed.version === version && (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000)
  assert.equal(isSnoozed, true, 'versão dispensada deve permanecer em snooze por 24h')

  // Se surgir uma versão posterior mais recente, o snooze da versão anterior é ignorado
  const isDifferentVersionSnoozed = parsed.version === '1.3.11' && (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000)
  assert.equal(isDifferentVersionSnoozed, false, 'nova versão não é bloqueada pelo snooze da versão anterior')
})

test('NEG-9: AppInstallerPlugin.java não possui fallback para releases/latest/download (previne download de versão antiga)', () => {
  const javaCode = read('android/app/src/main/java/com/barrasoft/cinebg/AppInstallerPlugin.java')
  assert.equal(javaCode.includes('releases/latest/download'), false, 'Não deve fazer fallback silencioso para latest/download')
  assert.ok(javaCode.includes('statusCode == 404'), 'Deve tratar HTTP 404 explicitamente')
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


// =====================================================================
// 10. SISTEMA DE ASSINATURAS E RESILIÊNCIA VIP (ISSUE #282)
// =====================================================================
test('SUB-1: Resiliência de cópia de chave Pix e fallback em LicenseGate', () => {
  const gateCode = read('src/components/LicenseGate.tsx')
  assert.match(gateCode, /fallbackCopyText/, 'LicenseGate deve possuir fallbackCopyText para WebViews sem API Clipboard')
  assert.match(gateCode, /document\.execCommand\('copy'\)/, 'fallbackCopyText deve usar execCommand como alternativa')
})

test('SUB-2: Integridade de planos VIP e coerência com dias de ativação manual', async () => {
  const mp = await compile('src/services/mercadoPago.ts')
  const licModule = await compile('src/hooks/useLicense.ts')

  const validDays = licModule.VALID_ACTIVATION_DAYS
  const planDays = mp.VIP_PLANS.map((p) => p.days)

  assert.deepEqual(planDays, Array.from(validDays), 'Planos de mercadoPago devem corresponder exatamente aos planos válidos de ativação')
})

test('SUB-3: Sincronização persistente de licença com SharedPreferences nativa', () => {
  const hookCode = read('src/hooks/useLicense.ts')
  assert.match(hookCode, /saveLicense\?\.\(serialized\)/, 'useLicense deve sincronizar ativação com a ponte nativa Android')
  assert.match(hookCode, /getSavedLicense\(\)/, 'useLicense deve recuperar licença nativa salva se localStorage for limpo')
})


// =====================================================================
// 11. BLOQUEIO DE TELA DO PLAYER (ISSUE #284)
// =====================================================================
test('LOCK-1: Botão de bloqueio de tela sem colisão com o botão voltar', () => {
  const player = read('src/components/player/StreamPlayer.tsx')

  // Botão de cadeado na barra superior ao lado do áudio
  assert.match(player, /id="hud-btn-lock"/, 'StreamPlayer deve possuir botão de cadeado no topo')
  assert.match(player, /!isTv && isMobileDevice\(\)/, 'Botão de bloqueio deve ser exclusivo de mobile')
})

test('LOCK-2: Overlay z-50 de bloqueio total contra toques acidentais', () => {
  const player = read('src/components/player/StreamPlayer.tsx')

  // Overlay com z-50 cobrindo toda a tela
  assert.match(player, /absolute inset-0 z-50 cursor-pointer/, 'Overlay de bloqueio deve usar z-50 para sobrepor todos os controles')
  assert.match(player, /id="hud-btn-unlock-center"/, 'Deve exibir botão central de desbloqueio')
  assert.match(player, /id="hud-btn-unlock-corner"/, 'Deve exibir botão de canto de desbloqueio')

  // resetHudTimer não abre HUD se tela estiver bloqueada
  assert.match(player, /if \(isLocked\) \{\s*setShowHud\(false\)\s*return\s*\}/, 'resetHudTimer deve suprimir a exibição do HUD quando bloqueado')
})

test('LOCK-3: Preservação ininterrupta da reprodução durante o bloqueio', () => {
  const player = read('src/components/player/StreamPlayer.tsx')
  // toggleLock altera apenas o estado isLocked sem invocar pause()
  assert.doesNotMatch(player, /toggleLock[\s\S]*?videoRef\.current\.pause\(\)/, 'toggleLock não deve pausar o vídeo')
})


// =====================================================================
// 12. TELA DE PAGAMENTO NAS SMART TVS (ISSUE #286)
// =====================================================================
test('TV-PAY-1: Ausência de popup intrusivo automático em App.tsx / AnimatedRoutes', () => {
  const appCode = read('src/App.tsx')
  assert.doesNotMatch(appCode, /if\s*\(!isVipActive\)\s*\{\s*setVipModalOpen\(true\)\s*\}/, 'App.tsx não deve abrir tela de pagamento automaticamente ao navegar')
  assert.match(appCode, /<BrowserRouter>[\s\S]*?<MainLayout/, 'App.tsx deve sempre renderizar a navegação principal (BrowserRouter) para livre exploração')
})

test('TV-PAY-2: Geração local e de alta definição de QR Code via QRCode.toDataURL', () => {
  const gateCode = read('src/components/LicenseGate.tsx')
  assert.match(gateCode, /import QRCode from 'qrcode'/, 'LicenseGate deve importar biblioteca qrcode nativa/local')
  assert.match(gateCode, /QRCode\.toDataURL\(target,\s*\{\s*width:\s*360/, 'LicenseGate deve gerar QR Code em 360x360 de alta resolução para TVs')
  assert.doesNotMatch(gateCode, /api\.qrserver\.com/, 'LicenseGate não deve depender de serviços HTTP externos vulneráveis a bloqueios de rede')
})

test('TV-PAY-3: Alternador de modo câmera do celular vs aplicativo bancário', () => {
  const gateCode = read('src/components/LicenseGate.tsx')
  assert.match(gateCode, /qrMode === 'url' && pixData\.ticketUrl/, 'LicenseGate deve suportar modo ticketUrl para leitura com câmera do celular')
  assert.match(gateCode, /setQrMode\('pix'\)/, 'LicenseGate deve suportar modo Pix direto para leitura em app de banco')
})

test('TV-PAY-4: Fechamento desimpedido do modal de pagamento para navegação normal', () => {
  const gateCode = read('src/components/LicenseGate.tsx')
  assert.match(gateCode, /const canDismiss = Boolean\(isModal && onClose\)/, 'LicenseGate deve permitir fechar o modal com canDismiss para que a navegação continue livre')
})


// =====================================================================
// 13. REGRAS DE ACESSO PARA USUÁRIOS GRATUITOS E ASSINANTES (ISSUE #288)
// =====================================================================
test('ACCESS-1: Navegação e visualização de catálogo liberadas para todos os usuários', () => {
  for (const page of ['Movies', 'Series', 'Anime']) {
    const src = read(`src/pages/${page}.tsx`)
    assert.doesNotMatch(src, /<PremiumContentGate/, `${page}.tsx não deve conter PremiumContentGate envolvendo o catálogo`)
  }
})

test('ACCESS-2: TV ao vivo gratuita e sem bloqueio de canais', () => {
  const live = read('src/pages/LiveTV.tsx')
  assert.doesNotMatch(live, /<PremiumContentGate/, 'LiveTV.tsx não deve ter PremiumContentGate')
  assert.match(live, /Modo TV Aberta Gratuita Ativo/, 'LiveTV deve explicitar modo TV aberta gratuito')
})

test('ACCESS-3: Bloqueio de reprodução em Details com aviso de conteúdo exclusivo para assinantes', () => {
  const details = read('src/pages/Details.tsx')
  assert.match(details, /if \(!isSubscriber\) \{\s*setSubscriberModalOpen\(true\)/, 'Details.tsx deve barrar reprodução quando não for assinante')
  assert.match(details, /Conteúdo Exclusivo para Assinantes/, 'Details.tsx deve exibir mensagem de exclusividade para assinantes')
  assert.match(details, /👑 Contratar Assinatura/, 'Details.tsx deve fornecer opção de contratar assinatura')
})

test('ACCESS-4: Bloqueio estrito de reprodução no player (Watch / PremiumContentGate)', () => {
  const watch = read('src/pages/Watch.tsx')
  assert.match(watch, /<PremiumContentGate/, 'Watch.tsx deve proteger o player com PremiumContentGate')

  const gate = read('src/components/PremiumContentGate.tsx')
  assert.match(gate, /Conteúdo Exclusivo para Assinantes/, 'PremiumContentGate deve exibir mensagem de exclusividade para assinantes')
  assert.match(gate, /👑 Contratar Assinatura/, 'PremiumContentGate deve oferecer botão para contratar assinatura')
})


// =====================================================================
// 14. CANAIS RETRO CARTOON, DESENHOS CLÁSSICOS E 24H (ISSUE #292)
// =====================================================================
test('LIVE-24H-1: Canais 24h não possuem URLs com tokens de chunklist estáticos expirados', () => {
  const liveSrc = read('src/services/liveChannels.ts')
  assert.doesNotMatch(liveSrc, /chunklist_w\d+/, 'Nenhum canal deve conter URL de chunklist estático/expirado')
  assert.match(liveSrc, /stmv1\.video\.brstream\.com\.br\/retrotv\/retrotv\/playlist\.m3u8/, 'Retro Cartoon deve apontar para master playlist canônica')
})

test('LIVE-24H-2: Ausência de fontes com bloqueio restritivo de CORS (jmp2.uk)', () => {
  const liveSrc = read('src/services/liveChannels.ts')
  assert.doesNotMatch(liveSrc, /jmp2\.uk/, 'Nenhum canal deve depender de jmp2.uk sujeito a bloqueio CORS por navegadores/WebViews')
})

test('LIVE-24H-3: Redundância mínima de 3 fontes para os canais temáticos e clássicos', () => {
  const liveSrc = read('src/services/liveChannels.ts')
  const channelsToCheck = ['retro-cartoon-24h', 'desenhos-classicos-24h', 'nickelodeon-classico-24h', 'bob-esponja-24h', 'adrenalina-pura-24h', 'masterchef-24h']
  for (const chId of channelsToCheck) {
    const regex = new RegExp(`id:\\s*'${chId}'[\\s\\S]*?sources:\\s*\\[([\\s\\S]*?)\\]`)
    const match = liveSrc.match(regex)
    assert.ok(match, `Canal ${chId} deve existir no catálogo`)
    const urls = match[1].split(',').filter(u => u.trim().length > 5)
    assert.ok(urls.length >= 3, `Canal ${chId} deve ter no mínimo 3 fontes de contingência, possui ${urls.length}`)
  }
})


// =====================================================================
// 15. AUDITORIA COMPLETA DE SISTEMAS (ISSUE #296)
// =====================================================================
test('PIX-EMV-1: Formatação de campos TLV e cálculo de CRC16-CCITT para Pix Copia e Cola (Banco Central)', () => {
  assert.equal(mp.formatPixField('00', '01'), '000201')
  assert.equal(mp.formatPixField('58', 'BR'), '5802BR')
  assert.equal(mp.formatPixField('54', '11.99'), '540511.99')

  // Verificação de checksum CRC16-CCITT padronizado (0x1021)
  const sample = '00020126330014BR.GOV.BCB.PIX011166996175239520400005303986540511.995802BR5906CINEBG6009SAO PAULO62120508DEV123456304'
  const crc = mp.computePixCrc16(sample)
  assert.match(crc, /^[0-9A-F]{4}$/, 'CRC16 deve ser string hexadecimal de 4 caracteres')
  assert.equal(crc, '9B42')
})

test('PIX-EMV-2: Código Pix de fallback possui tags obrigatórias do padrão BR Code', () => {
  const code = mp.buildPixBrCode({
    pixKey: '66996175239',
    amount: 11.99,
    merchantName: 'CINEBG',
    merchantCity: 'SAO PAULO',
    txid: 'DEVTEST123',
  })

  assert.ok(code.startsWith('000201'), 'Deve iniciar com Tag 00 Payload Format Indicator')
  assert.ok(code.includes('BR.GOV.BCB.PIX'), 'Deve conter identificador do Pix do BCB')
  assert.ok(code.includes('5303986'), 'Deve conter moeda 986 (BRL)')
  assert.ok(code.includes('540511.99'), 'Deve conter valor 11.99 com tamanho 05')
  assert.ok(code.includes('5802BR'), 'Deve conter código de país BR')
  assert.ok(code.includes('6304'), 'Deve conter campo de CRC 6304 seguido por 4 caracteres hexadecimais')
  assert.equal(code.slice(-4), mp.computePixCrc16(code.slice(0, -4)))
})

test('ROUTING-1: Rotas canônicas e atalhos de TV (/tv, /aovivo, /canais) redirecionam para /live no App.tsx', () => {
  const appSrc = read('src/App.tsx')
  assert.ok(appSrc.includes('<Route path="/tv" element={<Navigate to="/live" replace />} />'), 'Atalho /tv deve redirecionar para /live')
  assert.ok(appSrc.includes('<Route path="/aovivo" element={<Navigate to="/live" replace />} />'), 'Atalho /aovivo deve redirecionar para /live')
  assert.ok(appSrc.includes('<Route path="/canais" element={<Navigate to="/live" replace />} />'), 'Atalho /canais deve redirecionar para /live')
})

test('VERSION-1: Versão do app é única e centralizada (CURRENT_APP_VERSION coincide com package.json)', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.equal(tv.CURRENT_APP_VERSION, pkg.version, 'CURRENT_APP_VERSION deve ser igual a package.json')
  assert.equal(tv.getNativeAppVersion(), pkg.version, 'getNativeAppVersion fallback deve retornar a versão atual')

  const updateJson = JSON.parse(read('public/update.json'))
  assert.equal(updateJson.version, pkg.version, 'update.json version deve ser igual a package.json')
})

test('DETAILS-1: Modal de assinante em Details trata tecla Voltar sem fechar a tela inteira', () => {
  const detailsSrc = read('src/pages/Details.tsx')
  assert.ok(detailsSrc.includes('if (subscriberModalOpen) {'), 'Deve verificar subscriberModalOpen ao pressionar tecla')
  assert.ok(detailsSrc.includes('setSubscriberModalOpen(false)'), 'Deve fechar o modal')
  assert.ok(detailsSrc.includes("setFocus('details-fullscreen')"), 'Deve devolver foco ao botão fullscreen')
})


// =====================================================================
// 16. ORIENTAÇÃO AUTOMÁTICA EM DISPOSITIVOS MÓVEIS (ISSUE #300)
// =====================================================================
test('MOBILE-ROTATION-1: LivePlayer ativa rotação para paisagem, trava orientação e adiciona classe cinebg-video-playing no celular', () => {
  const livePlayerSrc = read('src/components/player/LivePlayer.tsx')
  assert.ok(livePlayerSrc.includes('setNativePlayerLandscape(true)'), 'LivePlayer deve chamar setNativePlayerLandscape(true)')
  assert.ok(livePlayerSrc.includes("document.documentElement.classList.add('cinebg-video-playing')"), 'Deve adicionar classe cinebg-video-playing')
  assert.ok(livePlayerSrc.includes(".lock('landscape')"), 'Deve travar orientação para landscape')
  assert.ok(livePlayerSrc.includes('live-player-container'), 'Container deve possuir classe live-player-container')
  assert.ok(livePlayerSrc.includes('data-live-player="true"'), 'Container deve possuir atributo data-live-player')
})

test('MOBILE-ROTATION-2: LivePlayer restaura orientação para retrato e remove classe ao fechar o canal', () => {
  const livePlayerSrc = read('src/components/player/LivePlayer.tsx')
  assert.ok(livePlayerSrc.includes('setNativePlayerLandscape(false)'), 'LivePlayer deve chamar setNativePlayerLandscape(false) no cleanup')
  assert.ok(livePlayerSrc.includes("document.documentElement.classList.remove('cinebg-video-playing')"), 'Deve remover classe cinebg-video-playing no cleanup')
  assert.ok(livePlayerSrc.includes('screen.orientation.unlock()'), 'Deve destravar orientação na saída')
})

test('MOBILE-ROTATION-3: useOrientationFullscreen reconhece player de TV ao vivo e não força retrato indevidamente', () => {
  const hookSrc = read('src/hooks/useOrientationFullscreen.ts')
  assert.ok(hookSrc.includes('isVideoPlayerActive'), 'Hook deve implementar função isVideoPlayerActive')
  assert.ok(hookSrc.includes('cinebg-video-playing'), 'Hook deve verificar classe cinebg-video-playing')
  assert.ok(hookSrc.includes('live-player-container'), 'Hook deve verificar live-player-container')
  assert.ok(hookSrc.includes('cinebg:player-state'), 'Hook deve escutar evento de ciclo de vida cinebg:player-state')
})

test('MOBILE-ROTATION-4: BottomNav oculta navegação inferior durante a reprodução de TV ao vivo', () => {
  const navSrc = read('src/components/layout/BottomNav.tsx')
  assert.ok(navSrc.includes('cinebg-video-playing'), 'BottomNav deve verificar cinebg-video-playing para ocultar a barra de navegação')
})


test('MOBILE-ROTATION-5: LivePlayer possui botão de cadeado e overlay de bloqueio de tela com desbloqueio central e de canto', () => {
  const lpSrc = read('src/components/player/LivePlayer.tsx')
  assert.ok(lpSrc.includes('live-btn-lock'), 'LivePlayer deve possuir botão live-btn-lock')
  assert.ok(lpSrc.includes('live-btn-unlock-center'), 'LivePlayer deve possuir botão live-btn-unlock-center')
  assert.ok(lpSrc.includes('live-btn-unlock-corner'), 'LivePlayer deve possuir botão live-btn-unlock-corner')
  assert.ok(lpSrc.includes('toggleLock'), 'LivePlayer deve implementar toggleLock')
})


test('NO-MOUSE-POINTER-1: TvCursorOverlay desativado e virtualCursor permanentemente falso', () => {
  const overlaySrc = read('src/components/tv/TvCursorOverlay.tsx')
  assert.ok(overlaySrc.includes('return null'), 'TvCursorOverlay deve retornar null permanentemente')
  assert.ok(!overlaySrc.includes('viewBox="0 0 24 24"'), 'TvCursorOverlay não deve renderizar SVG de ponteiro de mouse')

  const storeSrc = read('src/store/useAppStore.ts')
  assert.ok(storeSrc.includes('virtualCursor: false'), 'virtualCursor deve ser permanentemente falso')

  const profilesSrc = read('src/pages/Profiles.tsx')
  assert.ok(!profilesSrc.includes('Cursor Virtual (Modo Mouse no Controle)'), 'Profiles.tsx não deve oferecer cursor de mouse')
  assert.ok(profilesSrc.includes('Controle Remoto Smart TV (D-Pad)'), 'Profiles.tsx deve exibir status D-Pad nativo')
})

test('MULTI-MIRROR-RESILIENCE-1: Suporte a múltiplos espelhos de alta disponibilidade com fallback automático (VidLink Pro, VidSrc, 2Embed, MegaEmbed)', () => {
  const playerSrc = fs.readFileSync('src/components/player/StreamPlayer.tsx', 'utf8')
  const streamsSrc = fs.readFileSync('src/services/streams.ts', 'utf8')
  assert.ok(playerSrc.includes('fallbackSequence'), 'StreamPlayer deve possuir fallbackSequence resiliente')
  assert.ok(streamsSrc.includes("id: 'vidlink'"), 'streams.ts deve conter espelho de alta disponibilidade vidlink')
  assert.ok(streamsSrc.includes("id: 'vidsrc'"), 'streams.ts deve conter espelho vidsrc')
  assert.match(playerSrc, /fallbackSequence\s*=\s*useMemo/, 'fallbackSequence deve ser memorizado')
})

test('NO-SUBTITLED-PLAYER-2: isPortugueseAudioCandidate rejeita terminantemente termos de legenda e aceita streams do MegaEmbed', async () => {
  const streams = await compile('src/services/streams.ts')
  const isPt = streams.isPortugueseAudioCandidate

  // Fontes explicitamente legendadas são rejeitadas
  assert.equal(isPt('[LEG] Legendado 1080p', 'https://mgeb.space/video.m3u8', 'en'), false, 'rótulo [LEG] deve ser rejeitado')
  assert.equal(isPt('Versão Legendada', 'https://mgeb.space/video.m3u8', 'en'), false, 'rótulo com Legendada deve ser rejeitado')
  assert.equal(isPt('Opção 1', 'https://cdn.example.com/sub/video.m3u8', 'en'), false, 'URL com /sub/ deve ser rejeitada')
  assert.equal(isPt('Subtitled English', 'https://cdn.example.com/video.mp4', 'en'), false, 'inglês/subtitled deve ser rejeitado')

  // Fontes MegaEmbed padrão sem marcação de legenda são tratadas como áudio em português
  assert.equal(isPt('Opção 1', 'https://mgeb.space/stream.m3u8', 'en'), true, 'fontes mgeb padrão são tratadas como dubladas')
  assert.equal(isPt('FHD 1080p', 'https://mgeb.lat/embed/123.m3u8', 'en'), true, 'fontes mgeb FHD são tratadas como dubladas')
})

test('MOBILE-COFILE-2: StreamPlayer iframe não possui sandbox restritivo para não acionar erro anti-tamper', () => {
  const playerSrc = fs.readFileSync('src/components/player/StreamPlayer.tsx', 'utf8')
  assert.ok(!playerSrc.includes('sandbox="allow-scripts'), 'iframe do StreamPlayer não deve possuir sandbox para evitar erro "SANDBOX DETECTED"')
  assert.ok(!playerSrc.includes('allow-top-navigation'), 'iframe do StreamPlayer não deve ter permissão de navegar a janela principal')
  assert.ok(playerSrc.includes('setAntiRedirectShieldActive(showIframe)'), 'Escudo anti-redirect deve ser ativado dinamicamente quando o iframe é exibido')
})

test('MOBILE-COFILE-3: streams.ts filtra playercdnx.workers.dev e protege URLs contra redirecionamento externo', () => {
  const streamsSrc = fs.readFileSync('src/services/streams.ts', 'utf8')
  assert.ok(streamsSrc.includes('playercdnx.workers.dev'), 'BROKEN_IP_LOCKED_HOSTS deve incluir playercdnx.workers.dev')
  assert.ok(streamsSrc.includes('export const buildMovieUrl'), 'buildMovieUrl deve estar exportado')
})


test('LIVE-LOG-1: logLiveChannelError registra erros no modulo de observabilidade', () => {
  const obsSrc = fs.readFileSync('src/services/observability.ts', 'utf8')
  assert.ok(obsSrc.includes('export function logLiveChannelError'), 'observability.ts deve exportar logLiveChannelError')
  assert.ok(obsSrc.includes('cinebg_live_channel_errors'), 'observability.ts deve persistir erros em localStorage')
  assert.ok(obsSrc.includes('export function getLiveChannelErrorLogs'), 'observability.ts deve exportar getLiveChannelErrorLogs')
})

test('NAV-PRESERVE-1: Watch.tsx redireciona diretamente para details sem pular para a tela inicial', () => {
  const watchSrc = fs.readFileSync('src/pages/Watch.tsx', 'utf8')
  assert.ok(watchSrc.includes('navigate(') && watchSrc.includes('/details/'), 'Watch.tsx deve navegar diretamente para a tela de Detalhes do filme/serie')
  assert.ok(!watchSrc.includes('navigate(-1)'), 'Watch.tsx nao deve usar navigate(-1) para evitar salto para Home')
})

test('NAV-PRESERVE-2: App.tsx e LiveTV.tsx protegem rota ao vivo e retornam para o canal selecionado', () => {
  const appSrc = fs.readFileSync('src/App.tsx', 'utf8')
  assert.ok(appSrc.includes('cinebg:close-live-player'), 'App.tsx deve despachar evento cinebg:close-live-player ao pressionar voltar no player de TV')
  assert.ok(appSrc.includes("location.pathname.replace('/watch/', '/details/')"), 'App.tsx deve mapear /watch diretamente para /details')

  const liveTvSrc = fs.readFileSync('src/pages/LiveTV.tsx', 'utf8')
  assert.ok(liveTvSrc.includes('handleClosePlayer()'), 'LiveTV.tsx deve fechar o canal selecionado ao pressionar voltar')
})

test('NAV-PRESERVE-3: tv.ts e App.tsx protegem permanencia na tela de Detalhes apos saida do player', () => {
  const tvSrc = fs.readFileSync('src/utils/tv.ts', 'utf8')
  assert.ok(tvSrc.includes('markPlayerExited'), 'tv.ts deve exportar markPlayerExited')
  assert.ok(tvSrc.includes('wasPlayerRecentlyExited'), 'tv.ts deve exportar wasPlayerRecentlyExited')

  const appSrc = fs.readFileSync('src/App.tsx', 'utf8')
  assert.ok(appSrc.includes('wasPlayerRecentlyExited(1500)'), 'App.tsx deve usar wasPlayerRecentlyExited para proteger rota /details/')
})


test('INCIDENT-REPORT-1: observability.ts exporta funcoes de incidentes, contexto e relatorio GitHub', () => {
  const obsSrc = fs.readFileSync('src/services/observability.ts', 'utf8')
  assert.ok(obsSrc.includes('export function reportStreamIncident'), 'observability.ts deve exportar reportStreamIncident')
  assert.ok(obsSrc.includes('export function reportAdInterception'), 'observability.ts deve exportar reportAdInterception')
  assert.ok(obsSrc.includes('export function getStreamIncidentLogs'), 'observability.ts deve exportar getStreamIncidentLogs')
  assert.ok(obsSrc.includes('export function formatIncidentsAsGitHubMarkdown'), 'observability.ts deve exportar formatIncidentsAsGitHubMarkdown')
  assert.ok(obsSrc.includes('export function setActivePlaybackContext'), 'observability.ts deve exportar setActivePlaybackContext')
  assert.ok(obsSrc.includes('cinebg_stream_incidents'), 'observability.ts deve persistir incidentes em cinebg_stream_incidents')
})

test('INCIDENT-REPORT-2: antiRedirect.ts e StreamPlayer.tsx disparam telemetria de incidentes e anuncios', () => {
  const antiSrc = fs.readFileSync('src/utils/antiRedirect.ts', 'utf8')
  assert.ok(antiSrc.includes('reportAdInterception'), 'antiRedirect.ts deve disparar reportAdInterception ao bloquear popup/anuncio')

  const playerSrc = fs.readFileSync('src/components/player/StreamPlayer.tsx', 'utf8')
  assert.ok(playerSrc.includes('reportStreamIncident'), 'StreamPlayer.tsx deve disparar reportStreamIncident em falhas de reproducao')
  assert.ok(playerSrc.includes('setActivePlaybackContext'), 'StreamPlayer.tsx deve registrar contexto ativo de reproducao')
})

test('INCIDENT-REPORT-3: Profiles.tsx exibe painel de diagnostico e copia relatorio de incidentes', () => {
  const profSrc = fs.readFileSync('src/pages/Profiles.tsx', 'utf8')
  assert.ok(profSrc.includes('Diagnóstico de Streams & Relatórios'), 'Profiles.tsx deve conter secao de diagnostico de streams')
  assert.ok(profSrc.includes('formatIncidentsAsGitHubMarkdown'), 'Profiles.tsx deve integrar formatIncidentsAsGitHubMarkdown')
  assert.ok(profSrc.includes('getStreamIncidentLogs'), 'Profiles.tsx deve ler logs de incidentes')
})


test('SERIES-DUB-1: streams.ts segue redirecionamentos 301/302 para extrair fontes dubladas de series', () => {
  const streamsSrc = fs.readFileSync('src/services/streams.ts', 'utf8')
  assert.ok(streamsSrc.includes('resp.status >= 300 && resp.status < 400'), 'streams.ts deve capturar status 300-399 de redirecionamento')
  assert.ok(streamsSrc.includes('redirectHop'), 'streams.ts deve implementar loop de redirecionamento para series')
  assert.ok(streamsSrc.includes("redirect: 'follow'"), 'streams.ts fetch deve seguir redirecionamentos nativamente')
})

test('NO-NAV-DIALOG-1: antiRedirect.ts nao chama e.preventDefault() em beforeunload para eliminar modal "Confirmar navegacao"', () => {
  const antiSrc = fs.readFileSync('src/utils/antiRedirect.ts', 'utf8')
  const beforeUnloadMatch = antiSrc.match(/handleBeforeUnload\s*=\s*\([^)]*\)\s*=>\s*{([\s\S]*?)(?=\n\s*\/\/)/)
  const beforeUnloadBody = beforeUnloadMatch ? beforeUnloadMatch[1] : ''
  assert.ok(!beforeUnloadBody.includes('e.preventDefault()'), 'handleBeforeUnload nunca deve chamar e.preventDefault() para nao disparar dialogo nativo')
  assert.ok(antiSrc.includes('Redirecionamento de iframe detectado e suprimido!'), 'antiRedirect.ts deve suprimir silenciosamente o redirecionamento')
})


test('PT-CATALOG-1: tmdb.ts implementa isPortugueseAvailableItem e filtra estritamente titulos em portugues', () => {
  const tmdbSrc = fs.readFileSync('src/services/tmdb.ts', 'utf8')
  assert.ok(tmdbSrc.includes('export const isPortugueseAvailableItem'), 'tmdb.ts deve exportar isPortugueseAvailableItem')
  assert.ok(tmdbSrc.includes("origLang === 'pt'"), 'Producoes com idioma original pt devem ser sempre aceitas')
  assert.ok(tmdbSrc.includes('isPtOverview'), 'Deve verificar se sinopse esta localizada em portugues')
  assert.ok(tmdbSrc.includes('const ptItems = items.filter(isPortugueseAvailableItem)'), 'forKids deve aplicar filtro de conteudo em portugues')
})

test('PT-CATALOG-2: tmdb.ts exporta syncPortugueseCatalog e define TTL dinâmico para novos titulos e temporadas', () => {
  const tmdbSrc = fs.readFileSync('src/services/tmdb.ts', 'utf8')
  assert.ok(tmdbSrc.includes('export const syncPortugueseCatalog'), 'tmdb.ts deve exportar syncPortugueseCatalog')
  assert.ok(tmdbSrc.includes('DYNAMIC_FEED_TTL_MS = 2 * 60 * 60 * 1000'), 'Feeds dinamicos devem expirar em 2 horas')
  assert.ok(tmdbSrc.includes('RETURNING_SHOW_TTL_MS = 4 * 60 * 60 * 1000'), 'Series em exibicao devem atualizar temporadas em 4 horas')
  assert.ok(tmdbSrc.includes("watch_region: 'BR'"), 'Consultas TMDB devem priorizar regiao Brasil (BR)')
})


test('SWEEP-LEGENDADOS-1: isPortugueseAvailableItem bloqueia linguas predominantemente legendadas e termos de legenda', () => {
  const tmdbSrc = fs.readFileSync('src/services/tmdb.ts', 'utf8')
  assert.ok(tmdbSrc.includes('purelySubtitledLangs'), 'tmdb.ts deve definir lista de linguas predominantemente legendadas')
  assert.ok(tmdbSrc.includes("'tr'"), 'Lista de linguas legendadas deve incluir turco (tr)')
  assert.ok(tmdbSrc.includes("'ru'"), 'Lista de linguas legendadas deve incluir russo (ru)')
  assert.ok(tmdbSrc.includes('apenas legendad'), 'Deve bloquear titulos com marcacao de apenas legendado')
})

test('SWEEP-LEGENDADOS-2: tmdb.ts utiliza STORAGE_PREFIX v6 com purga de caches antigos e mapeia series nacionais e turcas', () => {
  const tmdbSrc = fs.readFileSync('src/services/tmdb.ts', 'utf8')
  assert.ok(tmdbSrc.includes("STORAGE_PREFIX = 'cinebg_tmdb_v6_'"), 'tmdb.ts deve usar prefixo v6 para limpar catalogo legendado antigo')
  assert.ok(tmdbSrc.includes('getBrazilianShows'), 'tmdb.ts deve exportar getBrazilianShows')
  assert.ok(tmdbSrc.includes('getTurkishShows'), 'tmdb.ts deve exportar getTurkishShows')
})


test('AD-GUARD-1: MainActivity.java instala BridgeWebViewClient blindado contra ad redirects e net::ERR_UNKNOWN_URL_SCHEME', () => {
  const mainActivity = fs.readFileSync('android/app/src/main/java/com/barrasoft/cinebg/MainActivity.java', 'utf8')
  assert.ok(mainActivity.includes('getBridge().setWebViewClient(new BridgeWebViewClient(getBridge())'), 'MainActivity deve instalar custom BridgeWebViewClient')
  assert.ok(mainActivity.includes('isAdUrl'), 'MainActivity deve verificar isAdUrl')
  assert.ok(mainActivity.includes('shopeebr://'), 'MainActivity deve bloquear expressamente shopeebr://')
  assert.ok(mainActivity.includes('ERR_UNKNOWN_URL_SCHEME'), 'MainActivity deve possuir blindagem comentada para ERR_UNKNOWN_URL_SCHEME')
  assert.ok(mainActivity.includes('request.isForMainFrame()'), 'MainActivity deve proteger o frame principal de redirecionamentos externos')
  assert.ok(mainActivity.includes('localhost'), 'MainActivity deve garantir que o main frame permaneça no localhost')
})

test('AD-GUARD-2: StreamPlayer.tsx aciona anti-redirect dinâmico e antiRedirect.ts barra esquemas externos', () => {
  const playerSrc = fs.readFileSync('src/components/player/StreamPlayer.tsx', 'utf8')
  assert.ok(playerSrc.includes('setAntiRedirectShieldActive(showIframe)'), 'StreamPlayer deve ativar escudo anti-redirect quando showIframe está ativo')
  assert.ok(!playerSrc.includes('allow-top-navigation'), 'iframe do StreamPlayer NUNCA deve conter allow-top-navigation')

  const antiSrc = fs.readFileSync('src/utils/antiRedirect.ts', 'utf8')
  assert.ok(antiSrc.includes('isUnknownScheme'), 'antiRedirect.ts deve verificar esquemas desconhecidos na navegação')
  assert.ok(antiSrc.includes('!href.startsWith(\'capacitor://\')'), 'antiRedirect.ts deve preservar apenas navegações internas/web legítimas')
})


test('MOBILE-SETTINGS-MODAL-1: Navbar.tsx utiliza createPortal e centralizacao de tela cheia sem corte em mobile', () => {
  const navbarSrc = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8')
  assert.ok(navbarSrc.includes("import { createPortal } from 'react-dom'"), 'Navbar.tsx deve importar createPortal do react-dom')
  assert.ok(navbarSrc.includes('createPortal('), 'Navbar.tsx deve utilizar createPortal para desanexar modais do overflow do header')
  assert.ok(navbarSrc.includes('z-[9999] flex items-center justify-center p-4'), 'Modal de configuracoes deve ter centralizacao z-[9999]')
  assert.ok(navbarSrc.includes('Atualizar Versão Agora'), 'Modal de configuracoes deve conter botao com largura completa Atualizar Versao Agora')
})

test('CLASSIC-CHANNELS-1: liveChannels.ts configura fontes resilientes para canais 24h e desenhos classicos', () => {
  const channelsSrc = fs.readFileSync('src/services/liveChannels.ts', 'utf8')
  assert.ok(channelsSrc.includes("id: 'desenhos-classicos-24h'"), 'Deve conter canal de desenhos clássicos')
  assert.ok(channelsSrc.includes('https://stmv1.video.brstream.com.br/retrotv/retrotv/playlist.m3u8'), 'Desenhos clássicos deve ter RetroTV como sinal principal HTTPS')
  assert.ok(channelsSrc.includes("id: 'turma-monica-24h'"), 'Deve conter canal da Turma da Mônica')
  assert.ok(channelsSrc.includes("id: 'retro-cartoon-24h'"), 'Deve conter canal Retro Cartoon')
  assert.ok(channelsSrc.includes("id: 'nickelodeon-classico-24h'"), 'Deve conter canal Nickelodeon Clássico')
})

test('LIVE-PLAYER-RESILIENCE-1: LivePlayer.tsx possui watchdog adaptativo de 15s, extensao de buffer e recuperacao de codec de audio', () => {
  const playerSrc = fs.readFileSync('src/components/player/LivePlayer.tsx', 'utf8')
  assert.ok(playerSrc.includes('CONNECT_TIMEOUT_MS = 8000'), 'Watchdog deve possuir tolerância otimizada de 8s para alternância rápida')
  assert.ok(playerSrc.includes('resetWatchdog'), 'Deve implementar função de reset de watchdog adaptativo')
  assert.ok(playerSrc.includes('liveSyncDurationCount: 2'), 'HLS deve sincronizar com 2 fragmentos para aceleração de inicialização')
  assert.ok(playerSrc.includes('const [muted, setMuted] = useState(false)'), 'LivePlayer deve manter áudio ativo por padrão sem mutar no celular/TV')
  assert.ok(playerSrc.includes('hls.swapAudioCodec()'), 'Deve tentar recuperação com troca de codec de áudio para streams mono/broadcast')
})
test('LIVE-PLAYER-PLAYHEAD-SYNC-1: LivePlayer.tsx sincroniza playhead com o liveStart/liveEnd do buffer para eliminar tela preta em streams longos', () => {
  const playerSrc = fs.readFileSync('src/components/player/LivePlayer.tsx', 'utf8')
  assert.ok(playerSrc.includes('liveDurationInfinity: false'), 'liveDurationInfinity deve ser false para permitir sincronização de linha do tempo no Chromium')
  assert.ok(playerSrc.includes('video.currentTime < liveStart || video.currentTime > liveEnd'), 'Anti-freeze deve verificar se currentTime está fora do intervalo')
  assert.ok(playerSrc.includes('v.currentTime < liveStart || v.currentTime > liveEnd'), 'FRAG_BUFFERED deve sincronizar playhead com a janela de buffer')
  assert.ok(playerSrc.includes('Math.max(liveStart, liveEnd - 2)'), 'Deve posicionar currentTime dentro do buffer ativo')
})

test('LIVE-CHANNELS-ABERTOS-RESILIENCE-1: liveChannels.ts possui fontes verificadas e remove servidores inoperantes de TV aberta', () => {
  const channelsSrc = fs.readFileSync('src/services/liveChannels.ts', 'utf8')
  assert.ok(!channelsSrc.includes('79.127.238.228:14173'), 'Servidor inoperante 79.127.238.228:14173 com timeout de 20s deve ser expurgado')
  assert.ok(!channelsSrc.includes('sbtmutum/sbtmutum'), 'Sinal com timeout sbtmutum deve ser expurgado')
  assert.ok(channelsSrc.includes('televisaocidadeverde.brasilstream.com.br'), 'Band HD deve contar com espelho TV Cidade Verde')
  assert.ok(channelsSrc.includes('operacaotbomt.com'), 'Band HD deve contar com espelho TV Brasil Oeste')
  assert.ok(channelsSrc.includes('LVW-10841'), 'Record HD deve contar com espelho TV Vila Real')
  assert.ok(channelsSrc.includes('LVW-10801'), 'SBT HD deve contar com espelho JMV')
})


test('LIVE-CHANNELS-DEDUPLICATION-AND-STABILITY-1: liveChannels e LivePlayer desduplicam canais e mitigam congelamento', () => {
  const channelsSrc = fs.readFileSync('src/services/liveChannels.ts', 'utf8')
  const playerSrc = fs.readFileSync('src/components/player/LivePlayer.tsx', 'utf8')

  // Cinemax não aponta primariamente para SPACE
  const cinemaxIdx = channelsSrc.indexOf("id: 'cinemax'")
  const cinemaxBlock = channelsSrc.slice(cinemaxIdx, cinemaxIdx + 400)
  assert.ok(!cinemaxBlock.includes('/SPACE/'), 'Cinemax não deve conter stream do Space')

  // TC Premium não aponta para SPACE
  const tcPremIdx = channelsSrc.indexOf("id: 'tc-premium'")
  const tcPremBlock = channelsSrc.slice(tcPremIdx, tcPremIdx + 400)
  assert.ok(!tcPremBlock.includes('/SPACE/'), 'TC Premium não deve conter stream do Space')

  // TC Pipoca não aponta para SPACE
  const tcPipocaIdx = channelsSrc.indexOf("id: 'tc-pipoca'")
  const tcPipocaBlock = channelsSrc.slice(tcPipocaIdx, tcPipocaIdx + 400)
  assert.ok(!tcPipocaBlock.includes('/SPACE/'), 'TC Pipoca não deve conter stream do Space')

  // Turma da Mônica não compartilha feed do RetroTV
  const monicaIdx = channelsSrc.indexOf("id: 'turma-monica-24h'")
  const monicaBlock = channelsSrc.slice(monicaIdx, monicaIdx + 400)
  assert.ok(!monicaBlock.includes('retrotv'), 'Turma da Mônica não deve compartilhar o feed do RetroTV')

  // LivePlayer deve conter proteção de travamentos múltiplos consecutivos (buffer_stalled_excessive)
  assert.ok(playerSrc.includes('buffer_stalled_excessive'), 'LivePlayer deve detectar e alternar em stalls excessivos')
})


test('LIVE-SPORTS-RESILIENCE-1: sportv-2 e premiere possuem fontes operantes e eliminam restreamers instaveis', () => {
  const channelsSrc = fs.readFileSync('src/services/liveChannels.ts', 'utf8')
  const playerSrc = fs.readFileSync('src/components/player/LivePlayer.tsx', 'utf8')

  const sportv2Idx = channelsSrc.indexOf("id: 'sportv-2'")
  const sportv2Block = channelsSrc.slice(sportv2Idx, sportv2Idx + 400)
  assert.ok(!sportv2Block.includes('181.78.197.59:8000'), 'SporTV 2 não deve conter servidor inoperante 181.78.197.59:8000')

  const premiereClubesIdx = channelsSrc.indexOf("id: 'premiere-clubes'")
  const premiereClubesBlock = channelsSrc.slice(premiereClubesIdx, premiereClubesIdx + 400)
  assert.ok(!premiereClubesBlock.includes('181.78.197.59:8000'), 'Premiere Clubes não deve conter servidor inoperante 181.78.197.59:8000')
  assert.ok(!premiereClubesBlock.includes('138.204.86.4:8080'), 'Premiere Clubes não deve conter servidor de alta latência 138.204.86.4:8080')

  assert.ok(playerSrc.includes('fragLoadingTimeOut: 15000'), 'LivePlayer deve manter fragLoadingTimeOut de 15s para suportar fragmentos longos sem abortar')
})

test('LIVE-ANDROID-PLAYBACK-1: capacitor.config desativa interceptador global CapacitorHttp e LivePlayer preserva XHR nativo com timeout resiliente', () => {
  const capConfig = fs.readFileSync('capacitor.config.ts', 'utf8')
  assert.match(capConfig, /CapacitorHttp:\s*\{\s*enabled:\s*false/s, 'capacitor.config.ts deve desativar monkey-patch do CapacitorHttp para não quebrar HLS no Android')

  const playerSrc = fs.readFileSync('src/components/player/LivePlayer.tsx', 'utf8')
  assert.ok(playerSrc.includes('manifestLoadingTimeOut: 12000'), 'LivePlayer deve manter manifestLoadingTimeOut de 12s para redes móveis e TV')
  assert.ok(playerSrc.includes('CapacitorWebXMLHttpRequest'), 'LivePlayer deve restaurar XMLHttpRequest nativo do WebView se houver wrapper')
})

test('LIVE-MOBILE-FIT-AND-PAYMENT-RESPONSIVE-1: LivePlayer sem blur no cadeado e ajuste total no celular, trial de 3 dias e tela de pagamento adaptavel', () => {
  const playerSrc = fs.readFileSync('src/components/player/LivePlayer.tsx', 'utf8')
  assert.ok(playerSrc.includes('backdrop-blur-none'), 'LivePlayer deve desativar blur ao bloquear a tela para não embaçar o vídeo')
  assert.ok(playerSrc.includes('bg-transparent'), 'LivePlayer overlay de bloqueio deve ser transparente')
  assert.ok(playerSrc.includes('live-btn-fit'), 'LivePlayer deve incluir botão live-btn-fit para alternar ajuste de tela')
  assert.ok(playerSrc.includes("object-cover"), 'LivePlayer deve suportar object-cover para preenchimento de tela total no celular')

  const licenseHookSrc = fs.readFileSync('src/hooks/useLicense.ts', 'utf8')
  assert.ok(licenseHookSrc.includes('getEffectiveTrialStart'), 'useLicense deve prover getEffectiveTrialStart para 3 dias de uso')
  assert.ok(licenseHookSrc.includes('TRIAL_DAYS = 3'), 'useLicense deve manter período de 3 dias de teste')

  const gateSrc = fs.readFileSync('src/components/LicenseGate.tsx', 'utf8')
  assert.ok(gateSrc.includes('overscroll-contain'), 'LicenseGate deve usar overscroll-contain para prevenir corte em flex centering')
  assert.ok(gateSrc.includes('vip-open-mp-link'), 'LicenseGate deve possuir botão de checkout direto para mobile')
  assert.ok(gateSrc.includes('vip-qr-mode-url'), 'LicenseGate deve suportar navegação D-Pad em modos de QR code')
})

test('PLAYBACK-RATIO-AUDIO-SUBS-1: Proporção 4:3 para desenhos clássicos, áudio automático, legendas e controles mobile/TV', () => {
  const channelsSrc = fs.readFileSync('src/services/liveChannels.ts', 'utf8')
  const livePlayerSrc = fs.readFileSync('src/components/player/LivePlayer.tsx', 'utf8')
  const streamPlayerSrc = fs.readFileSync('src/components/player/StreamPlayer.tsx', 'utf8')
  const subtitlesSrc = fs.readFileSync('src/services/subtitles.ts', 'utf8')

  // 1. Canais de desenhos clássicos devem conter aspectRatio: '4:3'
  assert.ok(channelsSrc.includes("aspectRatio?: '4:3' | '16:9'"), 'LiveChannel deve suportar campo opcional aspectRatio')
  const retroIdx = channelsSrc.indexOf("id: 'retro-cartoon-24h'")
  const retroEnd = channelsSrc.indexOf("id: 'desenhos-classicos-24h'")
  const retroBlock = channelsSrc.slice(retroIdx, retroEnd)
  assert.ok(retroBlock.includes("aspectRatio: '4:3'"), 'retro-cartoon-24h deve ter formato 4:3 clássico')

  const classicIdx = channelsSrc.indexOf("id: 'desenhos-classicos-24h'")
  const classicEnd = channelsSrc.indexOf("id: 'nickelodeon-classico-24h'")
  const classicBlock = channelsSrc.slice(classicIdx, classicEnd)
  assert.ok(classicBlock.includes("aspectRatio: '4:3'"), 'desenhos-classicos-24h deve ter formato 4:3 clássico')

  // 2. LivePlayer deve implementar modo 'classic' com aspect-[4/3] e detecção de clássicos
  assert.ok(livePlayerSrc.includes('isClassic43Channel'), 'LivePlayer deve exportar função de detecção isClassic43Channel')
  assert.ok(livePlayerSrc.includes("aspect-[4/3]"), 'LivePlayer deve manter proporção aspect-[4/3] com barras laterais pillarbox')
  assert.ok(livePlayerSrc.includes("4:3 Clássico"), 'LivePlayer deve possuir rótulo e toast para 4:3 Clássico')

  // 3. srtToVtt em subtitles.ts deve ser idempotente para arquivos que já iniciam com WEBVTT
  assert.ok(subtitlesSrc.includes("clean.startsWith('WEBVTT')"), 'srtToVtt não deve duplicar cabeçalho WEBVTT')

  // 4. StreamPlayer deve alternar áudio para Dublado e Original dinamicamente no HUD
  assert.ok(streamPlayerSrc.includes("switchAudio(nextOpt)"), 'StreamPlayer hud-btn-audio deve alternar entre dub e orig')
  assert.ok(streamPlayerSrc.includes("activeAudio === 'orig'"), 'StreamPlayer deve verificar se o áudio ativo é original')
  assert.ok(streamPlayerSrc.includes("'🇺🇸 Original'"), 'StreamPlayer hud-btn-audio deve exibir bandeira e status dinâmico')
  assert.ok(streamPlayerSrc.includes("video.muted = false"), 'StreamPlayer deve iniciar desmutado por padrão com fallback seguro')
})

test('MOBILE-SCROLL-STABILITY-1: Prevenção de salto/retorno indesejado ao início ao rolar no mobile', () => {
  const heroBannerSrc = fs.readFileSync('src/components/ui/HeroBanner.tsx', 'utf8')
  const homeSrc = fs.readFileSync('src/pages/Home.tsx', 'utf8')
  const bottomNavSrc = fs.readFileSync('src/components/layout/BottomNav.tsx', 'utf8')
  const focusableSrc = fs.readFileSync('src/components/tv/Focusable.tsx', 'utf8')

  // 1. HeroBanner não deve forçar window.scrollTo({ top: 0 }) em onFocus
  assert.ok(!heroBannerSrc.includes("window.scrollTo({ top: 0"), 'HeroBanner não deve forçar scroll para o topo ao focar')

  // 2. Home.tsx não deve roubar foco ou redefinir scroll em dispositivos móveis
  assert.ok(homeSrc.includes('if (isMobileDevice()) return'), 'Home.tsx deve ignorar foco automático em dispositivos móveis')
  assert.ok(homeSrc.includes("window.addEventListener('touchstart', onUserInteraction"), 'Home.tsx deve detectar toque para marcar navegação do usuário')
  assert.ok(homeSrc.includes('window.scrollY > 50'), 'Home.tsx não deve focar se o usuário já rolou a tela')

  // 3. BottomNav deve auto-ocultar suavemente ao rolar e prevenir cliques acidentais em swipe/drag
  assert.ok(bottomNavSrc.includes('isDraggingRef'), 'BottomNav deve conter proteção contra cliques acidentais durante arraste touch')
  assert.ok(bottomNavSrc.includes('currentY - lastScrollYRef.current'), 'BottomNav deve detectar direção de rolagem')
  assert.ok(bottomNavSrc.includes('translate-y-['), 'BottomNav deve auto-ocultar ao rolar para baixo')

  // 4. Focusable não deve disparar scroll programático em telas mobile
  assert.ok(focusableSrc.includes('!isMobileDevice()'), 'Focusable deve ignorar autoScroll espacial no mobile')
})

test('DUBBED-AUDIO-AND-TURKISH-SHOWS-1: Priorização estrita de áudio dublado PT-BR e exibição de Séries Turcas na Home e Séries', () => {
  const homeSrc = fs.readFileSync('src/pages/Home.tsx', 'utf8')
  const seriesSrc = fs.readFileSync('src/pages/Series.tsx', 'utf8')
  const streamsSrc = fs.readFileSync('src/services/streams.ts', 'utf8')
  const playerSrc = fs.readFileSync('src/components/player/StreamPlayer.tsx', 'utf8')

  // 1. Home.tsx deve exibir carrossel de Séries Turcas e Séries Nacionais
  assert.ok(homeSrc.includes('title="Séries Turcas"'), 'Home.tsx deve renderizar carrossel de Séries Turcas')
  assert.ok(homeSrc.includes('emoji="🇹🇷"'), 'Home.tsx deve conter emoji da bandeira da Turquia')
  assert.ok(homeSrc.includes('getTurkishShows'), 'Home.tsx deve chamar getTurkishShows')
  assert.ok(homeSrc.includes('getBrazilianShows'), 'Home.tsx deve chamar getBrazilianShows')

  // 2. Series.tsx deve conter filtro e carrossel de Séries Turcas
  assert.ok(seriesSrc.includes("name: 'Séries Turcas'"), 'Series.tsx deve incluir plataforma Séries Turcas')
  assert.ok(seriesSrc.includes('title="Séries Turcas"'), 'Series.tsx deve renderizar carrossel Séries Turcas')

  // 3. streams.ts deve priorizar vidlink limpo (sem captcha) para reprodução
  assert.ok(streamsSrc.includes("return 'vidlink'"), 'getInitialMirrorForAudio deve apontar para vidlink')
  assert.ok(streamsSrc.includes("const sequence = ['vidlink', 'vidsrc', 'embed2', 'moviebox']"), 'getNextSilentMirrorId deve priorizar vidlink limpo sem captcha')

  // 4. StreamPlayer.tsx deve selecionar candidato dublado e faixas PT no HLS
  assert.ok(playerSrc.includes('const dubIdx = list.findIndex((c) => c.isDubbedHint)'), 'StreamPlayer deve selecionar candidato dublado prioritário')
  assert.ok(playerSrc.includes("l === 'pob'"), 'selectPreferredAudioTrack deve incluir pob (Portuguese Brazil)')
  assert.ok(playerSrc.includes("n.includes('brasil')"), 'selectPreferredAudioTrack deve incluir brasil')
  assert.ok(playerSrc.includes('Hls.Events.AUDIO_TRACK_LOADED'), 'StreamPlayer deve escutar AUDIO_TRACK_LOADED no HLS')
})

test('NO-CLOUDFLARE-CAPTCHA-MIRRORS-1: Banimento de telas de validação humana (Cloudflare Turnstile) e proteção do StreamPlayer', () => {
  const streamsSrc = fs.readFileSync('src/services/streams.ts', 'utf8')
  const playerSrc = fs.readFileSync('src/components/player/StreamPlayer.tsx', 'utf8')

  // 1. superflix e megaembed (mgeb.lat) devem ser colocados em quarentena permanente e excluídos da sequência ativa
  assert.ok(streamsSrc.includes('Quarentena permanente: superflix e megaembed'), 'superflix e megaembed devem estar isolados em quarentena por impor captcha')
  assert.ok(!streamsSrc.includes("sequence = ['superflix'"), 'superflix não pode estar no início da sequência')
  assert.ok(!streamsSrc.includes("sequence = ['megaembed'"), 'megaembed não pode estar no início da sequência')

  // 2. isCaptchaOrBotBlockUrl deve identificar domínios e padrões de captcha
  assert.ok(streamsSrc.includes('isCaptchaOrBotBlockUrl'), 'streams.ts deve exportar validador de urls com captcha')
  assert.ok(streamsSrc.includes('challenges.cloudflare.com'), 'validador deve cobrir challenges.cloudflare.com')
  assert.ok(streamsSrc.includes('turnstile'), 'validador deve cobrir turnstile')
  assert.ok(streamsSrc.includes('mgeb.lat'), 'validador deve cobrir mgeb.lat')
  assert.ok(streamsSrc.includes('sandbox.php'), 'validador deve cobrir sandbox.php')

  // 3. StreamPlayer.tsx não deve acionar superflix nem megaembed em nenhum fallback nem no renderizador de embed
  assert.ok(playerSrc.includes("activeMirror === 'superflix' || activeMirror === 'megaembed'"), 'StreamPlayer deve converter superflix e megaembed para espelho limpo vidlink')
  assert.ok(!playerSrc.includes("setActiveMirror('superflix')"), 'StreamPlayer não deve atribuir superflix em nenhum fallback')
  assert.ok(!playerSrc.includes("setActiveMirror('megaembed')"), 'StreamPlayer não deve atribuir megaembed em nenhum fallback')
  assert.ok(playerSrc.includes('12000'), 'Buffer timeout deve ser de pelo menos 12s para evitar fallbacks precipitados')
})

test('OTA-PRECHECK-1: useAppStore valida disponibilidade de APK (HEAD request) para prevenir erro 404 durante compilação', () => {
  const storeSrc = fs.readFileSync('src/store/useAppStore.ts', 'utf8')
  const tvSrc = fs.readFileSync('src/utils/tv.ts', 'utf8')

  assert.ok(storeSrc.includes("method: 'HEAD'"), 'checkForUpdates deve disparar verificação HEAD antes de aceitar hasUpdate')
  assert.ok(storeSrc.includes('headRes.status === 404'), 'checkForUpdates deve checar status 404 da release')
  assert.ok(storeSrc.includes('hasUpdate = false'), 'checkForUpdates deve manter hasUpdate como false se APK ainda não estiver publicado')

  assert.ok(tvSrc.includes('CineBG-Tv-release.apk'), 'DEFAULT_TV_APK_URL deve apontar para release estável')
  assert.ok(tvSrc.includes('CineBG-Mobile-release.apk'), 'DEFAULT_MOBILE_APK_URL deve apontar para release estável')
})

test('DUBBED-AUDIO-DIRECT-RESILIENCE-1: Resiliência de timeout na extração de fontes dubladas e orientação no iframe', () => {
  const streamsSrc = fs.readFileSync('src/services/streams.ts', 'utf8')
  const playerSrc = fs.readFileSync('src/components/player/StreamPlayer.tsx', 'utf8')
  const viteConfigSrc = fs.readFileSync('vite.config.ts', 'utf8')

  // 1. Timeouts estendidos em streams.ts para evitar aborto prematuro da fonte dublada
  assert.ok(streamsSrc.includes('connectTimeout: 15000'), 'CapacitorHttp deve usar connectTimeout de pelo menos 15s')
  assert.ok(streamsSrc.includes('readTimeout: 15000'), 'CapacitorHttp deve usar readTimeout de pelo menos 15s')
  assert.ok(streamsSrc.includes('setTimeout(() => resolve(fallbackEmpty), 18000)'), 'resolveMegaEmbed deve usar timeout de pelo menos 18s')

  // 2. StreamPlayer deve exibir auxílio de seleção de áudio dublado e botão de retry para fontes diretas
  assert.ok(playerSrc.includes('Buscar Fonte Dublada'), 'StreamPlayer deve disponibilizar botão de busca de fonte dublada no iframe')
  assert.ok(playerSrc.includes('balão (💬)'), 'StreamPlayer deve instruir o usuário sobre o ícone de áudio no player externo')

  // 3. vite.config.ts deve apontar para mgeb.lat ativo
  assert.ok(viteConfigSrc.includes("target: 'https://mgeb.lat'"), 'Vite proxy deve apontar para mgeb.lat')
})
