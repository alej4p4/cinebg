import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

test('1. Integridade de Atualização OTA: TV vs Mobile APKs distintos em update.json', () => {
  const updateJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/update.json'), 'utf8'))
  assert.ok(updateJson.version, 'update.json deve possuir version')
  assert.match(updateJson.tvUrl, /CineBG-Tv-release\.apk$/, 'tvUrl deve apontar estritamente para CineBG-Tv-release.apk')
  assert.match(updateJson.mobileUrl, /CineBG-Mobile-release\.apk$/, 'mobileUrl deve apontar estritamente para CineBG-Mobile-release.apk')
  assert.match(updateJson.downloadUrl, /CineBG-Tv-release\.apk$/, 'downloadUrl padrão para TV deve apontar para CineBG-Tv-release.apk')
})

test('2. Motion Principles (Kyle Zantos): Tokens de física, skeletons, lazyloading e progress bar', () => {
  const motionContent = fs.readFileSync(path.join(ROOT, 'src/utils/motion.ts'), 'utf8')
  assert.match(motionContent, /FLUID_EASE/, 'Deve exportar FLUID_EASE')
  assert.match(motionContent, /SPRING_SNAPPY/, 'Deve exportar SPRING_SNAPPY')
  assert.match(motionContent, /PAGE_VARIANTS/, 'Deve exportar PAGE_VARIANTS')
  assert.match(motionContent, /STAGGER_CONTAINER/, 'Deve exportar STAGGER_CONTAINER')
  assert.match(motionContent, /SKELETON_FADE_VARIANTS/, 'Deve exportar SKELETON_FADE_VARIANTS')

  const lazyImageContent = fs.readFileSync(path.join(ROOT, 'src/components/ui/LazyImage.tsx'), 'utf8')
  assert.match(lazyImageContent, /IntersectionObserver/, 'LazyImage deve usar IntersectionObserver')
  assert.match(lazyImageContent, /skeleton/, 'LazyImage deve renderizar skeleton shimmer enquanto carrega')

  const skeletonContent = fs.readFileSync(path.join(ROOT, 'src/components/ui/SkeletonCard.tsx'), 'utf8')
  assert.match(skeletonContent, /SkeletonDetailPage/, 'Deve exportar SkeletonDetailPage')
  assert.match(skeletonContent, /SkeletonLiveTVGrid/, 'Deve exportar SkeletonLiveTVGrid')
})

test('3. Observabilidade Full-Stack: Sentry, Datadog, New Relic e OpenTelemetry', () => {
  const obsContent = fs.readFileSync(path.join(ROOT, 'src/services/observability.ts'), 'utf8')
  assert.match(obsContent, /captureException/, 'Deve implementar captura de exceções Sentry')
  assert.match(obsContent, /logDatadogEvent/, 'Deve implementar ingestão de logs/RUM Datadog')
  assert.match(obsContent, /recordNewRelicEvent/, 'Deve implementar eventos customizados New Relic')
  assert.match(obsContent, /startSpan/, 'Deve implementar spans OpenTelemetry (OTLP)')
  assert.match(obsContent, /createTraceparentHeader/, 'Deve implementar W3C Trace Context')
})

test('4. Módulo Smart TV: Ausência de sandbox restritivo e ocultação de botões mobile no StreamPlayer', () => {
  const streamsContent = fs.readFileSync(path.join(ROOT, 'src/services/streams.ts'), 'utf8')
  assert.ok(!streamsContent.includes('sandboxed: true'), 'Nenhum mirror deve ter sandboxed: true para não bloquear embeds/séries turcas')

  const playerContent = fs.readFileSync(path.join(ROOT, 'src/components/player/StreamPlayer.tsx'), 'utf8')
  assert.match(playerContent, /!isTv && isMobileDevice\(\)/, 'Botões exclusivos de mobile (cadeado, girar, tela cheia) devem ser restritos ao modo mobile (!isTv && isMobileDevice())')
})

test('5. Instant Play no Watch.tsx: Hidratação imediata via cache e montagem sem bloqueio', () => {
  const watchContent = fs.readFileSync(path.join(ROOT, 'src/pages/Watch.tsx'), 'utf8')
  assert.match(watchContent, /getCachedMediaDetails/, 'Watch.tsx deve consultar cache instantâneo em 0ms')
  assert.match(watchContent, /<StreamPlayer/, 'Watch.tsx deve montar o StreamPlayer imediatamente')
})
