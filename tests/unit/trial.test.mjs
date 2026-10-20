// Testes do período de teste de 3 dias (Issue #237)
// Compila o módulo TypeScript REAL de produção via esbuild (sem cópias de lógica).
import test, { before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const ROOT = process.cwd()
const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000

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

let trial
before(async () => {
  const outfile = path.join(os.tmpdir(), `cinebg-trial-${process.pid}.mjs`)
  await build({
    entryPoints: [path.join(ROOT, 'src/services/trial.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile,
    logLevel: 'silent',
    alias: { '@': path.join(ROOT, 'src') },
    define: { 'import.meta.env': '{}' },
  })
  trial = await import(pathToFileURL(outfile).href)
})

beforeEach(() => storage.clear())

test('TRIAL-1: janela ativa no primeiro uso com 3 dias / 72 horas', () => {
  const now = Date.UTC(2026, 9, 20, 12)
  const w = trial.computeTrialWindow(now, 3, now)
  assert.equal(w.active, true)
  assert.equal(w.daysLeft, 3)
  assert.equal(w.hoursLeft, 72)
  assert.equal(w.endsAt, now + 3 * DAY)
})

test('TRIAL-2: janela vence exatamente após 3 dias e nunca fica negativa', () => {
  const start = Date.UTC(2026, 9, 1)
  assert.equal(trial.computeTrialWindow(start, 3, start + 3 * DAY - 1).active, true)
  const expired = trial.computeTrialWindow(start, 3, start + 3 * DAY)
  assert.equal(expired.active, false)
  assert.equal(expired.daysLeft, 0)
  assert.equal(expired.hoursLeft, 0)
  assert.equal(trial.computeTrialWindow(start, 3, start + 30 * DAY).msLeft, 0)
})

test('TRIAL-3: última hora mostra 1 dia / 1 hora restante (arredonda para cima)', () => {
  const start = Date.UTC(2026, 9, 1)
  const w = trial.computeTrialWindow(start, 3, start + 3 * DAY - 30 * 60 * 1000)
  assert.equal(w.daysLeft, 1)
  assert.equal(w.hoursLeft, 1)
})

test('CLOCK-1: relógio avançando normalmente é aceito', () => {
  const t0 = Date.UTC(2026, 9, 20)
  assert.equal(trial.getTrustedNow(t0), t0)
  assert.equal(trial.getTrustedNow(t0 + HOUR), t0 + HOUR)
})

test('CLOCK-2: voltar o relógio do aparelho NÃO estende o teste', () => {
  const start = Date.UTC(2026, 9, 1)
  const afterExpiry = start + 4 * DAY
  trial.getTrustedNow(afterExpiry) // app aberto depois do vencimento
  const rolledBack = trial.getTrustedNow(start + DAY) // usuário volta o relógio 3 dias
  assert.equal(rolledBack, afterExpiry)
  assert.equal(trial.computeTrialWindow(start, 3, rolledBack).active, false)
})

test('CLOCK-3: TV Box ligando em 1970 (antes do NTP) usa o último instante conhecido', () => {
  const t0 = Date.UTC(2026, 9, 20)
  trial.getTrustedNow(t0)
  assert.equal(trial.getTrustedNow(1000), t0)
  assert.equal(trial.getTrustedNow(Number.NaN), t0)
})

test('CLOCK-4: relógio divergente NÃO encerra nem reinicia o teste (sem rede)', () => {
  const start = Date.UTC(2026, 9, 20)
  // relógio 10 minutos adiantado em relação ao "real": teste continua ativo normalmente
  const skewed = trial.getTrustedNow(start + 10 * 60 * 1000)
  const w = trial.computeTrialWindow(start, 3, skewed)
  assert.equal(w.active, true)
  assert.equal(w.daysLeft, 3)
})

test('CLOCK-5: armazenamento corrompido não derruba o relógio confiável', () => {
  storage.setItem('cinebg_clock_last_seen', 'lixo')
  const t0 = Date.UTC(2026, 9, 20)
  assert.equal(trial.getTrustedNow(t0), t0)
})

test('AUDIT-1: início e fim do teste são registrados apenas uma vez por instalação', () => {
  const start = Date.UTC(2026, 9, 1)
  const active = trial.computeTrialWindow(start, 3, start + HOUR)
  const expired = trial.computeTrialWindow(start, 3, start + 5 * DAY)
  for (let i = 0; i < 10; i += 1) {
    trial.logTrialStartedOnce(active)
    trial.logTrialEndedOnce(expired)
  }
  const events = trial.getAuditLogs().map((e) => e.event)
  assert.deepEqual(events, ['trial_started', 'trial_ended'])
})

test('AUDIT-2: log de auditoria é limitado a 200 entradas', () => {
  for (let i = 0; i < 250; i += 1) trial.logPlanActivated('activation_code', 'Plano 30 Dias', 30)
  assert.equal(trial.getAuditLogs().length, 200)
})

test('AUDIT-3: log corrompido é ignorado com segurança', () => {
  storage.setItem('cinebg_audit_log', '{corrompido')
  assert.deepEqual(trial.getAuditLogs(), [])
  trial.logPlanActivated('mercado_pago', 'Plano 90 Dias', 90)
  assert.equal(trial.getAuditLogs().length, 1)
})

test('SEC-1: serviço de teste não faz chamadas de rede nem depende de relógio externo', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/services/trial.ts'), 'utf8')
  assert.doesNotMatch(src, /worldtimeapi|fetch\(/, 'trial.ts não deve depender de rede')
})

test('SEC-2: páginas premium usam o gate e LiveTV permanece livre', () => {
  for (const page of ['Movies', 'Series', 'Anime', 'Watch']) {
    const src = fs.readFileSync(path.join(ROOT, `src/pages/${page}.tsx`), 'utf8')
    assert.match(src, /<PremiumContentGate/, `${page}.tsx deve usar PremiumContentGate`)
  }
  const live = fs.readFileSync(path.join(ROOT, 'src/pages/LiveTV.tsx'), 'utf8')
  assert.doesNotMatch(live, /PremiumContentGate/, 'LiveTV (TV aberta) não deve ser bloqueada')
})

test('OTA-1: versionName do APK coincide com update.json (OTA consegue comparar versões)', () => {
  const gradle = fs.readFileSync(path.join(ROOT, 'android/app/build.gradle'), 'utf8')
  const update = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/update.json'), 'utf8'))
  const versionName = /versionName\s+"([^"]+)"/.exec(gradle)?.[1]
  assert.equal(versionName, update.version, 'versionName do build.gradle deve ser igual à versão do update.json')
  for (const key of ['downloadUrl', 'downloadUrlTv', 'downloadUrlMobile']) {
    assert.ok(update[key].includes(`/v${update.version}/`), `${key} deve apontar para a release v${update.version}`)
  }
})
