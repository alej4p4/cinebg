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

test('9. Varredura de Links de Filmes/Séries e Motor HLS na Smart TV (Sem Fontes IP-Locked e Hls.isSupported Prioritário)', () => {
  const streamsContent = fs.readFileSync(path.join(ROOT, 'src/services/streams.ts'), 'utf8')
  assert.match(streamsContent, /BROKEN_IP_LOCKED_HOSTS/, 'streams.ts deve filtrar hosts com token travado por IP (streamtape.com / 97bf1.com)')
  assert.match(streamsContent, /DUBBED_HOST_HINTS/, 'streams.ts deve reconhecer todos os CDNs dublados PT-BR (MP4 e HLS)')
  assert.match(streamsContent, /RESOLVED_CACHE_TTL_MS/, 'streams.ts deve aplicar TTL de expiração no cache de fontes resolvidas')

  const playerContent = fs.readFileSync(path.join(ROOT, 'src/components/player/StreamPlayer.tsx'), 'utf8')
  assert.match(playerContent, /if \(Hls\.isSupported\(\)\)/, 'StreamPlayer.tsx deve priorizar Hls.isSupported() antes de video.canPlayType no Android TV')
  assert.match(playerContent, /enableWorker: false/, 'StreamPlayer.tsx deve desativar Web Worker do hls.js para evitar travamentos em TV Box')
  assert.match(playerContent, /handleCycleServerOption/, 'StreamPlayer.tsx deve permitir alternância cíclica entre opções de servidor')
})

test('10. Separação Estrita de Downloads OTA: Mobile (Celular) vs Smart TV em Web e Android Nativo', () => {
  const tvContent = fs.readFileSync(path.join(ROOT, 'src/utils/tv.ts'), 'utf8')
  assert.match(tvContent, /getDeviceFlavor/, 'tv.ts deve exportar getDeviceFlavor para distinguir estritamente mobile e tv')
  assert.match(tvContent, /getDeviceUpdateUrl/, 'tv.ts deve exportar getDeviceUpdateUrl para rotear URLs de APK por dispositivo')
  assert.match(tvContent, /getDeviceApkFilename/, 'tv.ts deve exportar getDeviceApkFilename')
  assert.match(tvContent, /CineBGNative/, 'tv.ts deve consultar a ponte nativa CineBGNative do Android')

  const storeContent = fs.readFileSync(path.join(ROOT, 'src/store/useAppStore.ts'), 'utf8')
  assert.match(storeContent, /getDeviceUpdateUrl/, 'useAppStore.ts deve resolver a URL de atualização via getDeviceUpdateUrl')

  const modalContent = fs.readFileSync(path.join(ROOT, 'src/components/UpdateModal.tsx'), 'utf8')
  assert.match(modalContent, /getDeviceUpdateUrl/, 'UpdateModal.tsx deve resolver a URL de download via getDeviceUpdateUrl')
  assert.match(modalContent, /getDeviceFlavor/, 'UpdateModal.tsx deve identificar o dispositivo via getDeviceFlavor')

  const updaterContent = fs.readFileSync(path.join(ROOT, 'src/services/appUpdater.ts'), 'utf8')
  assert.match(updaterContent, /getDeviceUpdateUrl/, 'appUpdater.ts deve normalizar a URL de download via getDeviceUpdateUrl')
  assert.match(updaterContent, /getDeviceApkFilename/, 'appUpdater.ts deve definir o nome do arquivo específico (Mobile vs TV)')

  const installerJava = fs.readFileSync(
    path.join(ROOT, 'android/app/src/main/java/com/barrasoft/cinebg/AppInstallerPlugin.java'),
    'utf8'
  )
  assert.match(
    installerJava,
    /MainActivity\.isRealTelevisionDevice/,
    'AppInstallerPlugin.java deve validar o hardware real (TV vs Celular) antes de baixar o APK'
  )
  assert.match(
    installerJava,
    /CineBG-Mobile-release\.apk/,
    'AppInstallerPlugin.java deve forçar CineBG-Mobile-release.apk em celulares'
  )
  assert.match(
    installerJava,
    /CineBG-Tv-release\.apk/,
    'AppInstallerPlugin.java deve forçar CineBG-Tv-release.apk em Smart TVs e TV Boxes'
  )

  const buildGradle = fs.readFileSync(path.join(ROOT, 'android/app/build.gradle'), 'utf8')
  assert.match(
    buildGradle,
    /screenOrientation:\s*"portrait"/,
    'build.gradle deve configurar screenOrientation: "portrait" no flavor mobile para abrir em pé no celular'
  )

  const mainActivityJava = fs.readFileSync(
    path.join(ROOT, 'android/app/src/main/java/com/barrasoft/cinebg/MainActivity.java'),
    'utf8'
  )
  assert.match(
    mainActivityJava,
    /SCREEN_ORIENTATION_PORTRAIT/,
    'MainActivity.java deve forçar SCREEN_ORIENTATION_PORTRAIT em celulares fora do player de vídeo'
  )
  assert.match(
    mainActivityJava,
    /setPlayerLandscape/,
    'MainActivity.java deve expor setPlayerLandscape na ponte CineBGNative'
  )
})


test('11. Persistência de Atualização OTA sem Loop, Bloqueio Estrito de 3 Dias de Teste e Filtro Anti-1xBet/Camrip', () => {
  const tvContent = fs.readFileSync(path.join(ROOT, 'src/utils/tv.ts'), 'utf8')
  assert.match(tvContent, /isVersionNewer/, 'tv.ts deve exportar isVersionNewer para impedir downgrade ou loop de atualização por cache de CDN')
  assert.match(tvContent, /getNativeAppVersion/, 'tv.ts deve exportar getNativeAppVersion lendo a versão real do APK nativo')

  const storeContent = fs.readFileSync(path.join(ROOT, 'src/store/useAppStore.ts'), 'utf8')
  assert.match(storeContent, /isVersionNewer\(remoteVersion, currentVersion\)/, 'useAppStore.ts deve validar que a versão remota é estritamente superior à atual')

  const licenseContent = fs.readFileSync(path.join(ROOT, 'src/hooks/useLicense.ts'), 'utf8')
  assert.match(licenseContent, /getFirstInstallTime/, 'useLicense.ts deve sincronizar o início dos 3 dias de teste com o timestamp nativo de instalação do Android')
  assert.match(licenseContent, /TRIAL_DAYS = 3/, 'useLicense.ts deve definir estritamente 3 dias de teste')

  const appContent = fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf8')
  assert.match(appContent, /!isVipOrTrialActive[\s\S]*?<LicenseGate isModal=\{false\}/, 'App.tsx deve forçar a tela de ativação paga (LicenseGate) após o vencimento dos 3 dias de teste')

  const gateContent = fs.readFileSync(path.join(ROOT, 'src/components/LicenseGate.tsx'), 'utf8')
  assert.match(gateContent, /const canDismiss = Boolean\(isModal && onClose && \(isLicensed \|\| isTrial\)\)/, 'LicenseGate.tsx deve impedir o fechamento do paywall quando os 3 dias de teste vencerem')

  const streamsContent = fs.readFileSync(path.join(ROOT, 'src/services/streams.ts'), 'utf8')
  assert.match(streamsContent, /BANNED_AD_STREAM_HINTS/, 'streams.ts deve definir lista de bloqueio contra streams com propaganda 1xBet (1xbt) e camrips')
  assert.match(streamsContent, /isAdOrCamripStream/, 'streams.ts deve filtrar streams com marca d-água 1xBet/1xbt ou HDCAM')

  const tmdbContent = fs.readFileSync(path.join(ROOT, 'src/services/tmdb.ts'), 'utf8')
  assert.match(tmdbContent, /isCleanDigitalCatalogItem/, 'tmdb.ts deve filtrar filmes exclusivos de cinema em janela de CAMRIP/1xBet')
  assert.match(tmdbContent, /with_release_type:\s*'4\|5\|6'/, 'tmdb.ts deve exigir lançamentos Digitais/VOD (4|5|6) nos catálogos de filmes recentes')

  const mainActivityJava = fs.readFileSync(
    path.join(ROOT, 'android/app/src/main/java/com/barrasoft/cinebg/MainActivity.java'),
    'utf8'
  )
  assert.match(mainActivityJava, /resolvePersistentFirstInstallTime/, 'MainActivity.java deve persistir o firstInstallTime nativo do Android independente de atualizações')
  assert.match(mainActivityJava, /clearCache\(true\)/, 'MainActivity.java deve limpar o cache do WebView automaticamente quando o versionCode subir')
  assert.match(mainActivityJava, /1xbt/, 'MainActivity.java deve bloquear domínios e vídeos 1xbt/1xbet no WebView')
})
