# Graph Report - cinebg  (2026-10-25)

## Corpus Check
- 262 files · ~875,686 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 43 file(s) not represented in the graph (top: .xml 19, (none) 6, .properties 5)

## Summary
- 2159 nodes · 4780 edges · 152 communities (99 shown, 53 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4d0136dd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ref_react
- tmdb.ts
- src/utils/tv.ts
- useLicense.ts
- 🤖 Instruções para Agentes de IA — CineBG
- scripts/arch-contract.mjs
- biome.json
- src/components/player/StreamPlayer.tsx
- observability.ts
- android/app/src/main/java/com/barrasoft/cinebg/AppInstallerPlugin.java
- ✅ PROBLEMAS CORRIGIDOS
- src/types/index.ts
- notifications.ts
- package.json
- compilerOptions
- Override
- dependencies
- devDependencies
- sandbox-hdtGRZ/src/services/tmdb.ts
- scripts
- sandbox-hdtGRZ/src/components/player/StreamPlayer.tsx
- src/pages/LiveTV.tsx
- useAppStore
- stryker.config.json
- MainActivity
- CineBG - Architectural Decisions Log
- useSpeechRecognition.ts
- epgCache.ts
- sandbox-hdtGRZ/package.json
- compilerOptions
- bug_fix.md
- PULL_REQUEST_TEMPLATE.md
- knip.json
- feature_request.md
- improvement.md
- capacitor.config.ts
- GenreBadge.tsx
- Focusable
- useAppStore
- CineBG Streams API Documentation
- sandbox-hdtGRZ/biome.json
- sandbox-hdtGRZ/src/pages/LiveTV.tsx
- Focusable
- sandbox-hdtGRZ/src/utils/tv.ts
- CineBG - Architecture Documentation
- src/utils/motion.ts
- sandbox-hdtGRZ/src/App.tsx
- sandbox-hdtGRZ/src/services/observability.ts
- CineBG - Architecture Documentation
- sandbox-hdtGRZ/src/pages/Series.tsx
- sandbox-hdtGRZ/src/hooks/useLicense.ts
- sandbox-hdtGRZ/src/services/notifications.ts
- MainActivity
- ✅ PROBLEMAS CORRIGIDOS
- src/App.tsx
- devDependencies
- sandbox-hdtGRZ/src/types/index.ts
- sandbox-hdtGRZ/src/utils/motion.ts
- �� CORREÇÕES DEFINITIVAS
- Diretrizes de Desenvolvimento e Contribuição — CineBG
- compilerOptions
- CineBG - Task Backlog & Roadmap
- src/components/UpdateModal.tsx
- CineBG - Task Backlog & Roadmap
- src/components/LicenseGate.tsx
- dependencies
- sandbox-hdtGRZ/src/components/LicenseGate.tsx
- CineBG - Project Status
- Object
- sandbox-hdtGRZ/src/components/UpdateModal.tsx
- dashboard.ts
- 🎯 Funcionalidades Implementadas
- scripts
- sandbox-hdtGRZ/stryker.config.json
- 🤖 Instruções para Agentes de IA — CineBG
- 🤖 Instruções para Agentes de IA — CineBG
- sandbox-hdtGRZ/tests/unit/qa-audit.test.mjs
- tests/unit/qa-audit.test.mjs
- sandbox-hdtGRZ/tests/unit/trial.test.mjs
- scripts/create-issues.py
- tests/unit/trial.test.mjs
- sandbox-hdtGRZ/src/hooks/useSpeechRecognition.ts
- CineBG - Architectural Decisions Log
- buffer.ts
- compilerOptions
- src/components/ErrorBoundary.tsx
- sandbox-hdtGRZ/scripts/arch-contract.mjs
- sandbox-hdtGRZ/.github/ISSUE_TEMPLATE/bug_fix.md
- sandbox-hdtGRZ/.github/PULL_REQUEST_TEMPLATE.md
- sandbox-hdtGRZ/knip.json
- ADR-005: OTA Updates - Dual APK (Mobile + TV)
- ADR-012: Capacitor server.url Removido (Fix connection refused)
- sandbox-hdtGRZ/.github/ISSUE_TEMPLATE/feature_request.md
- sandbox-hdtGRZ/.github/ISSUE_TEMPLATE/improvement.md
- ADR-001: Motion Design Principles (Kyle Zantos)
- ADR-002: Observabilidade Full-Stack (4 Provedores)
- ADR-003: Player Architecture - HLS.js + Native MP4 + Iframe Fallback
- ADR-004: State Management - Zustand (Single Store)
- ADR-006: License System - Signed Codes + Device Binding
- ADR-007: Arch Contract - Boundary Validation
- ADR-008: Quality Gates - CI Pipeline
- ADR-009: Android - Capacitor + Native Fragments
- ADR-013: SplashScreen Watchdog + Error Handler Global (Fix tela preta)
- ADR-014: Player Sem Botão de Retry (Estilo YuCine)
- ADR-015: Correção Definitiva da Inicialização do APK e Eliminação do Loop de Tela Preta
- sandbox-hdtGRZ/src/components/ui/GenreBadge.tsx

## God Nodes (most connected - your core abstractions)
1. `useAppStore` - 46 edges
2. `useAppStore` - 46 edges
3. `Focusable()` - 41 edges
4. `Focusable()` - 41 edges
5. `isMobileDevice()` - 31 edges
6. `isMobileDevice()` - 29 edges
7. `Home()` - 24 edges
8. `isTVDevice()` - 24 edges
9. `Home()` - 24 edges
10. `AnimatedRoutes()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Decisão` --references--> `WebChromeClient`  [INFERRED]
  DECISIONS.md → .stryker-tmp/sandbox-hdtGRZ/android/app/src/main/java/com/barrasoft/cinebg/MainActivity.java
- `PersistedState` --references--> `DownloadItem`  [EXTRACTED]
  src/store/useAppStore.ts → src/types/index.ts
- `PageFallback()` --calls--> `ProgressBar()`  [EXTRACTED]
  .stryker-tmp/sandbox-hdtGRZ/src/App.tsx → .stryker-tmp/sandbox-hdtGRZ/src/components/ui/ProgressBar.tsx
- `PageFallback()` --calls--> `SkeletonCarousel()`  [EXTRACTED]
  .stryker-tmp/sandbox-hdtGRZ/src/App.tsx → .stryker-tmp/sandbox-hdtGRZ/src/components/ui/SkeletonCard.tsx
- `AnimatedRoutes()` --calls--> `useSpatialNavigation()`  [EXTRACTED]
  .stryker-tmp/sandbox-hdtGRZ/src/App.tsx → .stryker-tmp/sandbox-hdtGRZ/src/hooks/useSpatialNavigation.ts

## Import Cycles
- None detected.

## Communities (152 total, 53 thin omitted)

### Community 0 - "ref_react"
Cohesion: 0.08
Nodes (26): BOTTOM_NAV_ITEMS, CATEGORIES_GRID, NAV_LINKS, Navbar(), PlaybackSettingsProps, FEATURED_CHANNEL_IDS, LiveTvCarouselProps, CarouselProps (+18 more)

### Community 1 - "tmdb.ts"
Cohesion: 0.10
Nodes (47): Carousel, Home(), Series(), SERIES_GENRES, STREAMING_PLATFORMS, StreamingPlatform, BANNED_CATALOG_KEYWORDS, buildCacheKey() (+39 more)

### Community 2 - "src/utils/tv.ts"
Cohesion: 0.23
Nodes (17): Direction, getDirectionFromEvent(), isEnterEvent(), isToggleModeEvent(), NavigationMode, TvCursorOverlay(), TvCursorOverlayContent(), useOrientationFullscreen() (+9 more)

### Community 3 - "useLicense.ts"
Cohesion: 0.16
Nodes (23): ActivationValidation, computeActivationChecksum(), fnv1a(), getDeviceId(), getFirstUse(), getStoredLicense(), License, LicenseResponse (+15 more)

### Community 4 - "🤖 Instruções para Agentes de IA — CineBG"
Cohesion: 0.10
Nodes (19): 1. Classificação e Criação de Issues, 2. Padrão de Nomenclatura de Branches, 3. Gestão de Deploys via Pull Requests (PRs), 4. Diretrizes para Agentes de IA, Diretrizes de Desenvolvimento e Contribuição — CineBG, Estrutura Obrigatória da Issue:, Modelo de Descrição do PR:, Regra Crítica de Descrição do PR: (+11 more)

### Community 5 - "scripts/arch-contract.mjs"
Cohesion: 0.16
Nodes (8): files, requiredFiles, ROOT, SRC_DIR, violations, walkFiles(), ROOT, ROOT

### Community 6 - "biome.json"
Cohesion: 0.05
Nodes (36): noSvgWithoutTitle, useButtonType, useKeyWithClickEvents, useMediaCaption, noUnusedVariables, useExhaustiveDependencies, files, ignore (+28 more)

### Community 7 - "src/components/player/StreamPlayer.tsx"
Cohesion: 0.07
Nodes (43): EpisodeSelectorProps, PlaybackSettingsModal(), ScreenOrientationWithLock, StreamPlayer(), StreamPlayerProps, BANNED_AD_STREAM_HINTS, BROKEN_IP_LOCKED_HOSTS, buildMovieUrl() (+35 more)

### Community 8 - "observability.ts"
Cohesion: 0.22
Nodes (17): activeSpans, addBreadcrumb(), Breadcrumb, breadcrumbs, captureException(), endSpan(), getDeviceContext(), getObservabilityConfig() (+9 more)

### Community 9 - "android/app/src/main/java/com/barrasoft/cinebg/AppInstallerPlugin.java"
Cohesion: 0.10
Nodes (6): ExampleInstrumentedTest, AppInstallerPlugin, ExampleUnitTest, ExampleInstrumentedTest, AppInstallerPlugin, ExampleUnitTest

### Community 10 - "✅ PROBLEMAS CORRIGIDOS"
Cohesion: 0.08
Nodes (23): 1. **Character Encoding / UTF-8 Corruption** (CRÍTICO - CORRIGIDO), 2. **TypeScript Errors - Focusable.tsx** (CRÍTICO - CORRIGIDO), 3. **Focusable.tsx - TypeError "not callable"** (CRÍTICO - CORRIGIDO), 3. **TypeScript Errors - StreamPlayer.tsx** (CRÍTICO - CORRIGIDO), 4. **Android SDK Setup no CI/CD** (ALTO - CORRIGIDO), 5. **Versão Inconsistente no update.json** (ALTO - CORRIGIDO), 6. **Duplicate Setup Node.js Step** (MÉDIO - CORRIGIDO), 7. **Android SDK Setup no CI/CD** (ALTO - CORRIGIDO) (+15 more)

### Community 11 - "src/types/index.ts"
Cohesion: 0.17
Nodes (22): SkeletonDetailPage(), Details(), Watch(), buildFileName(), downloadsSupported(), downloadVideo(), getCachedMediaDetails(), getMovieDetails() (+14 more)

### Community 12 - "notifications.ts"
Cohesion: 0.18
Nodes (19): COLORS, EMOJIS, ProfileCard(), Profiles(), checkForNewEpisodes(), daysAgoISO(), ensureNotificationChannel(), ensureNotificationPermission() (+11 more)

### Community 13 - "package.json"
Cohesion: 0.05
Nodes (43): autoprefixer, axios, c8, @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor/core, @capacitor/filesystem (+35 more)

### Community 14 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+12 more)

### Community 16 - "Override"
Cohesion: 0.16
Nodes (3): BridgeWebViewClient, BridgeWebViewClient, WebChromeClient

### Community 17 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, axios, @capacitor/android, @capacitor/app, @capacitor/core, @capacitor/filesystem, @capacitor/haptics, @capacitor/keyboard (+10 more)

### Community 18 - "devDependencies"
Cohesion: 0.09
Nodes (23): devDependencies, autoprefixer, c8, @capacitor/cli, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh (+15 more)

### Community 19 - "sandbox-hdtGRZ/src/services/tmdb.ts"
Cohesion: 0.11
Nodes (46): LiveTvCarousel(), Home(), MOVIE_GENRES, Movies(), STREAMING_PLATFORMS, Series(), BANNED_CATALOG_KEYWORDS, buildCacheKey() (+38 more)

### Community 20 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, build:apk, cap:open, cap:sync, check:knip, dev, lint (+6 more)

### Community 21 - "sandbox-hdtGRZ/src/components/player/StreamPlayer.tsx"
Cohesion: 0.08
Nodes (40): PlaybackSettingsModal(), ScreenOrientationWithLock, StreamPlayer(), BANNED_AD_STREAM_HINTS, BROKEN_IP_LOCKED_HOSTS, buildMovieUrl(), buildShowUrl(), DirectCandidate (+32 more)

### Community 22 - "src/pages/LiveTV.tsx"
Cohesion: 0.12
Nodes (19): LivePlayer(), LivePlayerProps, LiveTvCarousel(), YuCineChannelCard(), YuCineChannelCardProps, LiveTV(), categoryLabel(), LIVE_CATEGORIES (+11 more)

### Community 23 - "useAppStore"
Cohesion: 0.14
Nodes (23): LazyImage, LazyImageProps, useAppUpdate(), Downloads(), History(), MyList(), deleteVideo(), getPlayableUrl() (+15 more)

### Community 24 - "stryker.config.json"
Cohesion: 0.15
Nodes (12): commandRunner, command, coverageAnalysis, mutate, packageManager, reporters, $schema, testRunner (+4 more)

### Community 26 - "CineBG - Architectural Decisions Log"
Cohesion: 0.04
Nodes (45): ADR-001: Motion Design Principles (Kyle Zantos), ADR-002: Observabilidade Full-Stack (4 Provedores), ADR-003: Player Architecture - HLS.js + Native MP4 + Iframe Fallback, ADR-004: State Management - Zustand (Single Store), ADR-005: OTA Updates - Dual APK (Mobile + TV), ADR-006: License System - Signed Codes + Device Binding, ADR-007: Arch Contract - Boundary Validation, ADR-008: Quality Gates - CI Pipeline (+37 more)

### Community 27 - "useSpeechRecognition.ts"
Cohesion: 0.18
Nodes (10): ISpeechRecognitionInstance, IWindowWithSpeech, SpeechRecognitionConstructor, SpeechRecognitionErrorEventLike, SpeechRecognitionEventLike, SpeechRecognitionHook, SpeechRecognitionResultAlternative, SpeechRecognitionResultItem (+2 more)

### Community 28 - "epgCache.ts"
Cohesion: 0.17
Nodes (28): ChannelScheduleSlot, DailyScheduleItem, EPGProgram, formatSlotTitle(), formatTime(), getBrasiliaMinutes(), getChannelDailySchedule(), getLiveChannelEPG() (+20 more)

### Community 29 - "sandbox-hdtGRZ/package.json"
Cohesion: 0.05
Nodes (43): autoprefixer, axios, c8, @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor/core, @capacitor/filesystem (+35 more)

### Community 30 - "compilerOptions"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, strict, include

### Community 32 - "bug_fix.md"
Cohesion: 0.33
Nodes (5): 📱 Ambiente de Ocorrência, 🎯 Comportamento Esperado, ✅ Critérios de Aceite, 🐛 Descrição do Problema, 🔄 Passos para Reproduzir

### Community 33 - "PULL_REQUEST_TEMPLATE.md"
Cohesion: 0.33
Nodes (5): 🏷️ Categoria da Mudança, 📝 Descrição do Pull Request, 🔗 Issue(s) Relacionada(s), 📸 Screenshots / Evidências (Opcional), 🧪 Validação e Testes Realizados

### Community 34 - "knip.json"
Cohesion: 0.33
Nodes (5): entry, ignore, ignoreDependencies, project, $schema

### Community 36 - "feature_request.md"
Cohesion: 0.40
Nodes (4): 🎯 Caso de Uso / Motivação, ✅ Critérios de Aceite, 🌟 Descrição da Funcionalidade, 🛠️ Especificação Técnica Preliminar

### Community 37 - "improvement.md"
Cohesion: 0.40
Nodes (4): 📊 Benefícios Esperados, ✅ Critérios de Aceite, 💡 Oportunidade de Melhoria, 🚀 Proposta de Solução

### Community 50 - "Focusable"
Cohesion: 0.12
Nodes (33): PremiumContentGate(), Focusable(), FocusableProps, EmptyDownloads(), EmptyFavorites(), EmptyHistory(), EmptyLiveTV(), EmptyMyList() (+25 more)

### Community 51 - "useAppStore"
Cohesion: 0.14
Nodes (31): LazyImage, LazyImageProps, ProgressBar(), SkeletonDetailPage(), useAppUpdate(), Details(), Downloads(), History() (+23 more)

### Community 52 - "CineBG Streams API Documentation"
Cohesion: 0.05
Nodes (36): Android Nativo (Capacitor), 🔗 Arquivos Relacionados, Builders de URL (Embeds), `buildMovieUrl()` / `buildShowUrl()`, 🧠 Cache LRU, CineBG Streams API Documentation, ⚙️ Configurações & Constantes, 📦 Espelhos Configurados (MIRRORS) (+28 more)

### Community 53 - "sandbox-hdtGRZ/biome.json"
Cohesion: 0.05
Nodes (36): noSvgWithoutTitle, useButtonType, useKeyWithClickEvents, useMediaCaption, noUnusedVariables, useExhaustiveDependencies, files, ignore (+28 more)

### Community 54 - "sandbox-hdtGRZ/src/pages/LiveTV.tsx"
Cohesion: 0.11
Nodes (26): LivePlayer(), YuCineChannelCard(), SkeletonLiveTV(), SkeletonLiveTVGrid(), LiveTV(), ChannelScheduleSlot, DailyScheduleItem, EPGProgram (+18 more)

### Community 55 - "Focusable"
Cohesion: 0.13
Nodes (27): PremiumContentGate(), Focusable(), FocusableProps, EmptyDownloads(), EmptyFavorites(), EmptyHistory(), EmptyLiveTV(), EmptyMyList() (+19 more)

### Community 56 - "sandbox-hdtGRZ/src/utils/tv.ts"
Cohesion: 0.16
Nodes (27): Direction, getDirectionFromEvent(), isEnterEvent(), isToggleModeEvent(), NavigationMode, TvCursorOverlay(), TvCursorOverlayContent(), useOrientationFullscreen() (+19 more)

### Community 57 - "CineBG - Architecture Documentation"
Cohesion: 0.06
Nodes (32): 1. Separação de Camadas (Arch Contract), 2. Motion Design (Kyle Zantos), 3. Observabilidade Full-Stack (4 provedores), Android (ExoPlayer), 📱 Android Specifics, Build Variants, Capacitor + Native, 🚀 CI/CD Pipeline (+24 more)

### Community 58 - "src/utils/motion.ts"
Cohesion: 0.09
Nodes (28): EpisodeSelector(), CONTENT_LABEL, PremiumContentGateProps, PremiumContentType, ProgressBarProps, HeroSkeleton(), SkeletonCard(), SkeletonCarousel() (+20 more)

### Community 59 - "sandbox-hdtGRZ/src/App.tsx"
Cohesion: 0.11
Nodes (24): AnimatedRoutes(), Anime, App(), Details, Downloads, Favorites, History, Home (+16 more)

### Community 60 - "sandbox-hdtGRZ/src/services/observability.ts"
Cohesion: 0.19
Nodes (23): Props, State, activeSpans, addBreadcrumb(), Breadcrumb, captureException(), createTraceparentHeader(), endSpan() (+15 more)

### Community 61 - "CineBG - Architecture Documentation"
Cohesion: 0.06
Nodes (30): 1. Separação de Camadas (Arch Contract), 2. Motion Design (Kyle Zantos), 3. Observabilidade Full-Stack (4 provedores), Android (ExoPlayer), 📱 Android Specifics, Build Variants, Capacitor + Native, 🚀 CI/CD Pipeline (+22 more)

### Community 62 - "sandbox-hdtGRZ/src/pages/Series.tsx"
Cohesion: 0.16
Nodes (21): Carousel, CarouselProps, HeroBanner(), HeroBannerProps, MovieCard, MovieCardProps, HeroSkeleton(), SkeletonCard() (+13 more)

### Community 63 - "sandbox-hdtGRZ/src/hooks/useLicense.ts"
Cohesion: 0.16
Nodes (23): ActivationValidation, computeActivationChecksum(), fnv1a(), getDeviceId(), getFirstUse(), getStoredLicense(), License, LicenseResponse (+15 more)

### Community 64 - "sandbox-hdtGRZ/src/services/notifications.ts"
Cohesion: 0.15
Nodes (20): useEpisodeNotifications(), COLORS, EMOJIS, ProfileCard(), Profiles(), checkForNewEpisodes(), daysAgoISO(), ensureNotificationChannel() (+12 more)

### Community 66 - "✅ PROBLEMAS CORRIGIDOS"
Cohesion: 0.08
Nodes (23): 1. **Character Encoding / UTF-8 Corruption** (CRÍTICO - CORRIGIDO), 2. **TypeScript Errors - Focusable.tsx** (CRÍTICO - CORRIGIDO), 3. **Focusable.tsx - TypeError "not callable"** (CRÍTICO - CORRIGIDO), 3. **TypeScript Errors - StreamPlayer.tsx** (CRÍTICO - CORRIGIDO), 4. **Android SDK Setup no CI/CD** (ALTO - CORRIGIDO), 5. **Versão Inconsistente no update.json** (ALTO - CORRIGIDO), 6. **Duplicate Setup Node.js Step** (MÉDIO - CORRIGIDO), 7. **Android SDK Setup no CI/CD** (ALTO - CORRIGIDO) (+15 more)

### Community 67 - "src/App.tsx"
Cohesion: 0.17
Nodes (20): AnimatedRoutes(), Anime, App(), Details, Downloads, Favorites, History, Home (+12 more)

### Community 68 - "devDependencies"
Cohesion: 0.09
Nodes (23): devDependencies, autoprefixer, c8, @capacitor/cli, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh (+15 more)

### Community 71 - "sandbox-hdtGRZ/src/types/index.ts"
Cohesion: 0.11
Nodes (21): EpisodeSelector(), EpisodeSelectorProps, StreamPlayerProps, SkeletonEpisodeList(), getSeasonDetails(), AppStore, MOVIE_GENRES, StreamSource (+13 more)

### Community 72 - "sandbox-hdtGRZ/src/utils/motion.ts"
Cohesion: 0.11
Nodes (17): CONTENT_LABEL, PremiumContentGateProps, PremiumContentType, ProgressBarProps, BUTTON_INTERACTIONS, CARD_HOVER_INTERACTION, EXIT_EASE, FLUID_EASE (+9 more)

### Community 73 - "�� CORREÇÕES DEFINITIVAS"
Cohesion: 0.09
Nodes (21): 1.1 Estrutura de Módulos, 1.2 Dependências Externas Críticas, 1.3 Fluxos de Entrada/Saída de Dados, 2.1 CRÍTICO - Segurança, 2.2 CRÍTICO - Funcionalidade / Estabilidade, 2.3 CRÍTICO - Performance, 2.4 CRÍTICO - Qualidade / Código Morto, 2.5 CRÍTICO - Escalabilidade / Banco de Dados (+13 more)

### Community 74 - "Diretrizes de Desenvolvimento e Contribuição — CineBG"
Cohesion: 0.10
Nodes (19): 1. Classificação e Criação de Issues, 2. Padrão de Nomenclatura de Branches, 3. Gestão de Deploys via Pull Requests (PRs), 4. Diretrizes para Agentes de IA, Diretrizes de Desenvolvimento e Contribuição — CineBG, Estrutura Obrigatória da Issue:, Modelo de Descrição do PR:, Regra Crítica de Descrição do PR: (+11 more)

### Community 75 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+12 more)

### Community 76 - "CineBG - Task Backlog & Roadmap"
Cohesion: 0.10
Nodes (19): 📋 Backlog Priorizado, 🐛 Bugs Conhecidos (Non-blocking), CineBG - Task Backlog & Roadmap, 📝 Convenções de Task, 🔴 Crítico (Blockers para próxima release), Definition of Done, 🟢 Desejável (Backlog longo), ✅ Done (+11 more)

### Community 77 - "src/components/UpdateModal.tsx"
Cohesion: 0.24
Nodes (17): UpdateModal(), UpdateModalProps, UpdateStage, AppInstaller, AppInstallerPluginInterface, cancelDownload(), canInstallUnknownApps(), DownloadProgress (+9 more)

### Community 78 - "CineBG - Task Backlog & Roadmap"
Cohesion: 0.11
Nodes (18): 📋 Backlog Priorizado, 🐛 Bugs Conhecidos (Non-blocking), CineBG - Task Backlog & Roadmap, 📝 Convenções de Task, 🔴 Crítico (Blockers para próxima release), Definition of Done, 🟢 Desejável (Backlog longo), ✅ Done (+10 more)

### Community 79 - "src/components/LicenseGate.tsx"
Cohesion: 0.23
Nodes (16): LicenseGate(), LicenseGateProps, isLicensedRemotely(), validateActivationCode(), checkMercadoPagoStatus(), createMercadoPagoPix(), CreatePixPaymentResult, DEFAULT_PIX_KEY (+8 more)

### Community 80 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, axios, @capacitor/android, @capacitor/app, @capacitor/core, @capacitor/filesystem, @capacitor/haptics, @capacitor/keyboard (+10 more)

### Community 81 - "sandbox-hdtGRZ/src/components/LicenseGate.tsx"
Cohesion: 0.23
Nodes (16): LicenseGate(), LicenseGateProps, isLicensedRemotely(), validateActivationCode(), checkMercadoPagoStatus(), createMercadoPagoPix(), CreatePixPaymentResult, DEFAULT_PIX_KEY (+8 more)

### Community 82 - "CineBG - Project Status"
Cohesion: 0.12
Nodes (16): 📁 Arquivos Principais Modificados Recentemente, Build & Qualidade, CineBG - Project Status, Correções Críticas (últimas releases - AUDITORIA COMPLETA), Details, ✅ Estado Atual, 🎯 Funcionalidades Implementadas, Home UI (+8 more)

### Community 84 - "sandbox-hdtGRZ/src/components/UpdateModal.tsx"
Cohesion: 0.27
Nodes (12): UpdateModal(), UpdateModalProps, UpdateStage, AppInstaller, AppInstallerPluginInterface, canInstallUnknownApps(), DownloadProgress, openAppInstallSettings() (+4 more)

### Community 85 - "dashboard.ts"
Cohesion: 0.13
Nodes (9): ALL_DASHBOARDS, ConditionalFormat, DashboardLayout, DashboardPanel, OTA_HEALTH_DASHBOARD, PLAYER_QOS_DASHBOARD, STREAM_HEALTH_DASHBOARD, SYSTEM_HEALTH_DASHBOARD (+1 more)

### Community 86 - "🎯 Funcionalidades Implementadas"
Cohesion: 0.13
Nodes (14): 📁 Arquivos Principais Modificados Recentemente, Build & Qualidade, CineBG - Project Status, Correções Críticas, Details, ✅ Estado Atual, 🎯 Funcionalidades Implementadas, Home UI (+6 more)

### Community 87 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, build:apk, cap:open, cap:sync, check:knip, dev, lint (+6 more)

### Community 88 - "sandbox-hdtGRZ/stryker.config.json"
Cohesion: 0.15
Nodes (12): commandRunner, command, coverageAnalysis, mutate, packageManager, reporters, $schema, testRunner (+4 more)

### Community 89 - "🤖 Instruções para Agentes de IA — CineBG"
Cohesion: 0.17
Nodes (11): 1.1 Criar ou Vincular a Issue no GitHub, 1.2 Isolar em Branch de Trabalho, 1.3 Gerenciar Deploys estritamente por Pull Requests (PRs), 🚨 1. PROTOCOLO MANDATÓRIO DE FLUXO DE TRABALHO (ISSUES & PRs), ✨ 2. DESIGN & MOTION PRINCIPLES (KYLE ZANTOS), 🔭 3. OBSERVABILIDADE FULL-STACK, 🛡️ 4. QUALIDADE E INTEGRIDADE DE CÓDIGO, 🧪 5. TESTES UNITÁRIOS, INTEGRAÇÃO E END-TO-END (E2E) (+3 more)

### Community 90 - "🤖 Instruções para Agentes de IA — CineBG"
Cohesion: 0.17
Nodes (11): 1.1 Criar ou Vincular a Issue no GitHub, 1.2 Isolar em Branch de Trabalho, 1.3 Gerenciar Deploys estritamente por Pull Requests (PRs), 🚨 1. PROTOCOLO MANDATÓRIO DE FLUXO DE TRABALHO (ISSUES & PRs), ✨ 2. DESIGN & MOTION PRINCIPLES (KYLE ZANTOS), 🔭 3. OBSERVABILIDADE FULL-STACK, 🛡️ 4. QUALIDADE E INTEGRIDADE DE CÓDIGO, 🧪 5. TESTES UNITÁRIOS, INTEGRAÇÃO E END-TO-END (E2E) (+3 more)

### Community 91 - "sandbox-hdtGRZ/tests/unit/qa-audit.test.mjs"
Cohesion: 0.21
Nodes (3): MemoryStorage, ROOT, storage

### Community 92 - "tests/unit/qa-audit.test.mjs"
Cohesion: 0.21
Nodes (3): MemoryStorage, ROOT, storage

### Community 93 - "sandbox-hdtGRZ/tests/unit/trial.test.mjs"
Cohesion: 0.22
Nodes (3): MemoryStorage, ROOT, storage

### Community 95 - "tests/unit/trial.test.mjs"
Cohesion: 0.24
Nodes (3): MemoryStorage, ROOT, storage

### Community 96 - "sandbox-hdtGRZ/src/hooks/useSpeechRecognition.ts"
Cohesion: 0.20
Nodes (9): ISpeechRecognitionInstance, IWindowWithSpeech, SpeechRecognitionConstructor, SpeechRecognitionErrorEventLike, SpeechRecognitionEventLike, SpeechRecognitionHook, SpeechRecognitionResultAlternative, SpeechRecognitionResultItem (+1 more)

### Community 97 - "CineBG - Architectural Decisions Log"
Cohesion: 0.22
Nodes (8): ADR-010: StreamPlayer.tsx Encoding Fix (v1.2.67), ADR-011: Documentation as Code, CineBG - Architectural Decisions Log, Consequências, Contexto, Contexto, Decisão, Decisão

### Community 98 - "buffer.ts"
Cohesion: 0.31
Nodes (8): BUFFER_PRESETS, BufferConfig, Connection, ConnectionType, getAdaptiveBufferConfig(), getBufferConfigForHls(), getConnectionType(), useAdaptiveBufferConfig()

### Community 99 - "compilerOptions"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, strict, include

### Community 100 - "src/components/ErrorBoundary.tsx"
Cohesion: 0.25
Nodes (3): ErrorBoundary, Props, State

### Community 101 - "sandbox-hdtGRZ/scripts/arch-contract.mjs"
Cohesion: 0.25
Nodes (6): files, requiredFiles, ROOT, SRC_DIR, violations, walkFiles()

### Community 102 - "sandbox-hdtGRZ/.github/ISSUE_TEMPLATE/bug_fix.md"
Cohesion: 0.33
Nodes (5): 📱 Ambiente de Ocorrência, 🎯 Comportamento Esperado, ✅ Critérios de Aceite, 🐛 Descrição do Problema, 🔄 Passos para Reproduzir

### Community 103 - "sandbox-hdtGRZ/.github/PULL_REQUEST_TEMPLATE.md"
Cohesion: 0.33
Nodes (5): 🏷️ Categoria da Mudança, 📝 Descrição do Pull Request, 🔗 Issue(s) Relacionada(s), 📸 Screenshots / Evidências (Opcional), 🧪 Validação e Testes Realizados

### Community 104 - "sandbox-hdtGRZ/knip.json"
Cohesion: 0.33
Nodes (5): entry, ignore, ignoreDependencies, project, $schema

### Community 105 - "ADR-005: OTA Updates - Dual APK (Mobile + TV)"
Cohesion: 0.40
Nodes (5): ADR-005: OTA Updates - Dual APK (Mobile + TV), Consequências, Contexto, Decisão, Detecção de pacote instalado (Fix "App não instalado")

### Community 106 - "ADR-012: Capacitor server.url Removido (Fix connection refused)"
Cohesion: 0.40
Nodes (5): ADR-012: Capacitor server.url Removido (Fix connection refused), Consequências, Contexto, Decisão, Manter

### Community 107 - "sandbox-hdtGRZ/.github/ISSUE_TEMPLATE/feature_request.md"
Cohesion: 0.40
Nodes (4): 🎯 Caso de Uso / Motivação, ✅ Critérios de Aceite, 🌟 Descrição da Funcionalidade, 🛠️ Especificação Técnica Preliminar

### Community 108 - "sandbox-hdtGRZ/.github/ISSUE_TEMPLATE/improvement.md"
Cohesion: 0.40
Nodes (4): 📊 Benefícios Esperados, ✅ Critérios de Aceite, 💡 Oportunidade de Melhoria, 🚀 Proposta de Solução

### Community 109 - "ADR-001: Motion Design Principles (Kyle Zantos)"
Cohesion: 0.50
Nodes (4): ADR-001: Motion Design Principles (Kyle Zantos), Consequências, Contexto, Decisão

### Community 110 - "ADR-002: Observabilidade Full-Stack (4 Provedores)"
Cohesion: 0.50
Nodes (4): ADR-002: Observabilidade Full-Stack (4 Provedores), Consequências, Contexto, Decisão

### Community 111 - "ADR-003: Player Architecture - HLS.js + Native MP4 + Iframe Fallback"
Cohesion: 0.50
Nodes (4): ADR-003: Player Architecture - HLS.js + Native MP4 + Iframe Fallback, Consequências, Contexto, Decisão

### Community 112 - "ADR-004: State Management - Zustand (Single Store)"
Cohesion: 0.50
Nodes (4): ADR-004: State Management - Zustand (Single Store), Consequências, Contexto, Decisão

### Community 113 - "ADR-006: License System - Signed Codes + Device Binding"
Cohesion: 0.50
Nodes (4): ADR-006: License System - Signed Codes + Device Binding, Consequências, Contexto, Decisão

### Community 114 - "ADR-007: Arch Contract - Boundary Validation"
Cohesion: 0.50
Nodes (4): ADR-007: Arch Contract - Boundary Validation, Consequências, Contexto, Decisão

### Community 115 - "ADR-008: Quality Gates - CI Pipeline"
Cohesion: 0.50
Nodes (4): ADR-008: Quality Gates - CI Pipeline, Consequências, Contexto, Decisão

### Community 116 - "ADR-009: Android - Capacitor + Native Fragments"
Cohesion: 0.50
Nodes (4): ADR-009: Android - Capacitor + Native Fragments, Consequências, Contexto, Decisão

### Community 117 - "ADR-013: SplashScreen Watchdog + Error Handler Global (Fix tela preta)"
Cohesion: 0.50
Nodes (4): ADR-013: SplashScreen Watchdog + Error Handler Global (Fix tela preta), Consequências, Contexto, Decisão

### Community 118 - "ADR-014: Player Sem Botão de Retry (Estilo YuCine)"
Cohesion: 0.50
Nodes (4): ADR-014: Player Sem Botão de Retry (Estilo YuCine), Consequências, Contexto, Decisão

### Community 119 - "ADR-015: Correção Definitiva da Inicialização do APK e Eliminação do Loop de Tela Preta"
Cohesion: 0.50
Nodes (4): ADR-015: Correção Definitiva da Inicialização do APK e Eliminação do Loop de Tela Preta, Consequências, Contexto, Decisão

## Knowledge Gaps
- **78 isolated node(s):** `@capacitor/android`, `@capacitor/app`, `@capacitor/core`, `@capacitor/filesystem`, `@capacitor/haptics` (+73 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1031 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **53 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAppStore` connect `useAppStore` to `ref_react`, `tmdb.ts`, `src/utils/tv.ts`, `src/App.tsx`, `src/components/player/StreamPlayer.tsx`, `src/types/index.ts`, `notifications.ts`, `src/components/UpdateModal.tsx`, `Focusable`, `src/pages/LiveTV.tsx`, `src/utils/motion.ts`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `@capacitor/android`, `@capacitor/app`, `@capacitor/core` to the rest of the system?**
  _78 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ref_react` be split into smaller, more focused modules?**
  _Cohesion score 0.07597402597402597 - nodes in this community are weakly interconnected._
- **Why does `ErrorBoundary` connect `sandbox-hdtGRZ/src/App.tsx` to `sandbox-hdtGRZ/src/services/observability.ts`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Should `tmdb.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1025974025974026 - nodes in this community are weakly interconnected._
- **Why does `useAppStore` connect `useAppStore` to `ref_react`, `sandbox-hdtGRZ/src/services/notifications.ts`, `sandbox-hdtGRZ/src/utils/motion.ts`, `sandbox-hdtGRZ/src/services/tmdb.ts`, `sandbox-hdtGRZ/src/components/UpdateModal.tsx`, `sandbox-hdtGRZ/src/components/player/StreamPlayer.tsx`, `sandbox-hdtGRZ/src/pages/LiveTV.tsx`, `Focusable`, `sandbox-hdtGRZ/src/utils/tv.ts`, `sandbox-hdtGRZ/src/App.tsx`, `sandbox-hdtGRZ/src/pages/Series.tsx`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **Should `🤖 Instruções para Agentes de IA — CineBG` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._