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

test('6. Otimização de Performance e Memória para Smart TV (RAM, Renderização, D-Pad, Main Thread e Cache)', () => {
  const tmdbContent = fs.readFileSync(path.join(ROOT, 'src/services/tmdb.ts'), 'utf8')
  assert.match(tmdbContent, /MAX_MEMORY_CACHE_ENTRIES/, 'tmdb.ts deve aplicar limite LRU em memória')
  assert.match(tmdbContent, /scheduleStorageFlush/, 'tmdb.ts deve enfileirar gravações de localStorage de forma assíncrona fora da Main Thread')
  assert.match(tmdbContent, /effectiveSize = size === 'original' \? 'w1280' : size/, 'tmdb.ts deve limitar backdrops 4K para w1280 evitando estouro de VRAM na TV')

  const homeContent = fs.readFileSync(path.join(ROOT, 'src/pages/Home.tsx'), 'utf8')
  assert.match(homeContent, /Estágio 1/, 'Home.tsx deve utilizar carregamento escalonado em 2 estágios para evitar ANR na Main Thread')

  const carouselContent = fs.readFileSync(path.join(ROOT, 'src/components/ui/Carousel.tsx'), 'utf8')
  assert.match(carouselContent, /INITIAL_TV_CARDS_PER_ROW/, 'Carousel.tsx deve aplicar reciclagem/paginação progressiva de cards na TV')

  const cursorContent = fs.readFileSync(path.join(ROOT, 'src/components/tv/TvCursorOverlay.tsx'), 'utf8')
  assert.match(cursorContent, /startMoveLoop/, 'TvCursorOverlay.tsx deve rodar requestAnimationFrame apenas sob demanda quando teclas direcionais estiverem pressionadas')
})

test('7. Correções YouCine TV: D-Pad nos botões sem alterar volume/avançar vídeo, Autoplay sem tela de play e Detalhes sem trailer', () => {
  const playerContent = fs.readFileSync(path.join(ROOT, 'src/components/player/StreamPlayer.tsx'), 'utf8')
  assert.ok(!playerContent.includes('videoRef.current.volume ='), 'Setas Cima/Baixo do D-Pad nunca devem alterar o volume do vídeo ao navegar até os botões')
  assert.ok(!playerContent.includes('id="central-play-button"'), 'StreamPlayer não deve exibir imagem/botão de play central antes de iniciar o filme/série')
  assert.match(playerContent, /getCachedMegaEmbed/, 'StreamPlayer deve hidratar a fonte direta instantaneamente do cache em 0ms')

  const detailsContent = fs.readFileSync(path.join(ROOT, 'src/pages/Details.tsx'), 'utf8')
  assert.ok(!detailsContent.includes('youtube.com/embed/'), 'Details.tsx não deve apresentar trailer do YouTube ao entrar no filme ou série (estilo YouCine)')
  assert.match(detailsContent, /resolveMegaEmbed/, 'Details.tsx deve pré-carregar a fonte direta do filme/episódio ao abrir os detalhes')

  const streamsContent = fs.readFileSync(path.join(ROOT, 'src/services/streams.ts'), 'utf8')
  assert.match(streamsContent, /autoplay=/, 'Espelhos em streams.ts devem incluir parâmetro autoplay para início imediato')
})

test('8. Fluxo de Sinopse YouCine e Proteção do Botão Voltar na TV (sem pular para Tela Inicial)', () => {
  const tvContent = fs.readFileSync(path.join(ROOT, 'src/utils/tv.ts'), 'utf8')
  assert.match(tvContent, /markBackHandled/, 'tv.ts deve exportar markBackHandled para evitar duplo disparo do botão Voltar')
  assert.match(tvContent, /wasBackRecentlyHandled/, 'tv.ts deve exportar wasBackRecentlyHandled')

  const appContent = fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf8')
  assert.match(appContent, /wasBackRecentlyHandled/, 'App.tsx deve proteger o listener global de Voltar contra eventos duplicados')
  assert.match(appContent, /location\.pathname\.replace\('\/watch\/', '\/details\/'\)/, 'App.tsx deve garantir que Voltar no /watch retorne para /details')

  const cardContent = fs.readFileSync(path.join(ROOT, 'src/components/ui/MovieCard.tsx'), 'utf8')
  assert.ok(!cardContent.includes('`/watch/${item.type}/${item.id}`'), 'MovieCard deve sempre abrir a tela de sinopse (/details) antes do player')

  const heroContent = fs.readFileSync(path.join(ROOT, 'src/components/ui/YuCineHero.tsx'), 'utf8')
  assert.ok(!heroContent.includes('`/watch/'), 'YuCineHero deve sempre abrir a tela de sinopse (/details) antes do player')
})
