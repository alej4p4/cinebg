# Graph Report - cinebg  (2026-10-19)

## Corpus Check
- 93 files · ~394,431 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .xml 9, (none) 3, .properties 2)

## Summary
- 645 nodes · 1610 edges · 46 communities (34 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `165ac82d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- notifications.ts
- index.ts
- react
- StreamPlayer.tsx
- package.json
- LiveTV.tsx
- LicenseGate.tsx
- App.tsx
- compilerOptions
- dependencies
- devDependencies
- AppInstallerPlugin.java
- compilerOptions
- main
- MainActivity.java
- useAppStore.ts
- EmptyState.tsx
- bug_fix.md
- PULL_REQUEST_TEMPLATE.md
- feature_request.md
- improvement.md
- scripts
- eslint.config.js
- vite.config.ts
- capacitor.config.ts
- UpdateModal.tsx
- react
- isMobileDevice
- streams.ts
- index.ts
- Search.tsx
- Watch.tsx
- subtitles.ts
- ErrorBoundary
- EpisodeSelector.tsx
- Details.tsx
- SplashScreen.tsx

## God Nodes (most connected - your core abstractions)
1. `useAppStore` - 42 edges
2. `react` - 37 edges
3. `framer-motion` - 32 edges
4. `lucide-react` - 29 edges
5. `isMobileDevice()` - 25 edges
6. `Focusable()` - 22 edges
7. `Home()` - 21 edges
8. `@noriginmedia/norigin-spatial-navigation` - 20 edges
9. `AnimatedRoutes()` - 20 edges
10. `forKids()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `3. Gerenciar Deploys estritamente por Pull Requests (PRs)` --references--> `main()`  [INFERRED]
  AGENTS.md → scripts/create-issues.py
- `2. Padrão de Nomenclatura de Branches` --references--> `main()`  [INFERRED]
  CONTRIBUTING.md → scripts/create-issues.py
- `📌 Regra Fundamental: GitHub Flow com Issues e PRs` --references--> `main()`  [INFERRED]
  CONTRIBUTING.md → scripts/create-issues.py
- `2. Fluxo de Branch e Desenvolvimento` --references--> `main()`  [INFERRED]
  README.md → scripts/create-issues.py
- `HeroBannerProps` --references--> `MediaItem`  [EXTRACTED]
  src/components/ui/HeroBanner.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (46 total, 12 thin omitted)

### Community 0 - "notifications.ts"
Cohesion: 0.17
Nodes (20): useEpisodeNotifications(), COLORS, EMOJIS, ProfileCard(), Profiles(), checkForNewEpisodes(), daysAgoISO(), ensureNotificationChannel() (+12 more)

### Community 1 - "index.ts"
Cohesion: 0.11
Nodes (51): Carousel(), ErrorState(), ProgressBar(), ProgressBarProps, HeroSkeleton(), SkeletonCard(), SkeletonCarousel(), SkeletonLiveTV() (+43 more)

### Community 2 - "react"
Cohesion: 0.13
Nodes (27): framer-motion, lucide-react, PlaybackSettingsProps, FEATURED_CHANNEL_IDS, LiveTvCarouselProps, CarouselProps, LazyImage(), LazyImageProps (+19 more)

### Community 3 - "StreamPlayer.tsx"
Cohesion: 0.24
Nodes (13): PlaybackSettingsModal(), StreamPlayer(), buildMovieUrl(), buildShowUrl(), getInitialMirrorForAudio(), isMirrorSandboxed(), MIRRORS, normalizeAudio() (+5 more)

### Community 4 - "package.json"
Cohesion: 0.09
Nodes (21): name, private, type, version, autoprefixer, axios, @capacitor/android, @capacitor/filesystem (+13 more)

### Community 5 - "LiveTV.tsx"
Cohesion: 0.11
Nodes (27): LivePlayer(), LivePlayerProps, LiveTvCarousel(), YuCineChannelCard(), YuCineChannelCardProps, LiveTV(), ChannelScheduleSlot, DailyScheduleItem (+19 more)

### Community 6 - "LicenseGate.tsx"
Cohesion: 0.16
Nodes (21): LicenseGate(), LicenseGateProps, getDeviceId(), getFirstUse(), getStoredLicense(), License, LicenseResponse, TRIAL_DAYS (+13 more)

### Community 7 - "App.tsx"
Cohesion: 0.14
Nodes (23): @capacitor/app, react-router-dom, AnimatedRoutes(), Anime, App(), Details, Downloads, Favorites (+15 more)

### Community 8 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+12 more)

### Community 9 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, axios, @capacitor/android, @capacitor/app, @capacitor/core, @capacitor/filesystem, @capacitor/haptics, @capacitor/keyboard (+10 more)

### Community 10 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, autoprefixer, @capacitor/cli, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+8 more)

### Community 12 - "compilerOptions"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, strict, include

### Community 13 - "main"
Cohesion: 0.06
Nodes (27): 1. Criar ou Vincular a Issue, 2. Isolar em Branch de Trabalho, 3. Gerenciar Deploys estritamente por Pull Requests (PRs), 4. Critério de Aceite Técnico, graphify, 🤖 Instruções para Agentes de IA — CineBG, 🚨 PROTOCOLO MANDATÓRIO DE TRABALHO, 1. Classificação e Criação de Issues (+19 more)

### Community 15 - "MainActivity.java"
Cohesion: 0.07
Nodes (5): ExampleInstrumentedTest, MainActivity, BridgeWebViewClient, WebChromeClient, ExampleUnitTest

### Community 21 - "useAppStore.ts"
Cohesion: 0.21
Nodes (13): useAppUpdate(), AppState, AppUpdateInfo, dataFor(), DEFAULT_PROFILE, emptyData(), PersistedState, ProfileData (+5 more)

### Community 25 - "EmptyState.tsx"
Cohesion: 0.26
Nodes (10): EmptyDownloads(), EmptyFavorites(), EmptyHistory(), EmptyLiveTV(), EmptyMyList(), EmptySearch(), EmptyState(), EmptyStateProps (+2 more)

### Community 26 - "bug_fix.md"
Cohesion: 0.33
Nodes (5): 📱 Ambiente de Ocorrência, 🎯 Comportamento Esperado, ✅ Critérios de Aceite, 🐛 Descrição do Problema, 🔄 Passos para Reproduzir

### Community 27 - "PULL_REQUEST_TEMPLATE.md"
Cohesion: 0.33
Nodes (5): 🏷️ Categoria da Mudança, 📝 Descrição do Pull Request, 🔗 Issue(s) Relacionada(s), 📸 Screenshots / Evidências (Opcional), 🧪 Validação e Testes Realizados

### Community 28 - "feature_request.md"
Cohesion: 0.40
Nodes (4): 🎯 Caso de Uso / Motivação, ✅ Critérios de Aceite, 🌟 Descrição da Funcionalidade, 🛠️ Especificação Técnica Preliminar

### Community 29 - "improvement.md"
Cohesion: 0.40
Nodes (4): 📊 Benefícios Esperados, ✅ Critérios de Aceite, 💡 Oportunidade de Melhoria, 🚀 Proposta de Solução

### Community 30 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, build:apk, cap:open, cap:sync, dev, lint, preview

### Community 31 - "eslint.config.js"
Cohesion: 0.33
Nodes (5): @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, typescript-eslint

### Community 34 - "UpdateModal.tsx"
Cohesion: 0.27
Nodes (10): UpdateModal(), UpdateModalProps, UpdateStage, AppInstaller, AppInstallerPluginInterface, canInstallUnknownApps(), DownloadProgress, openAppInstallSettings() (+2 more)

### Community 35 - "react"
Cohesion: 0.27
Nodes (11): @noriginmedia/norigin-spatial-navigation, react, CATEGORIES_GRID, NAV_LINKS, Focusable(), FocusableProps, HeroBanner(), HeroBannerProps (+3 more)

### Community 36 - "isMobileDevice"
Cohesion: 0.37
Nodes (12): Direction, getDirectionFromEvent(), isEnterEvent(), isToggleModeEvent(), NavigationMode, TvCursorOverlay(), TvCursorOverlayContent(), useSpatialNavigation() (+4 more)

### Community 37 - "streams.ts"
Cohesion: 0.20
Nodes (11): DirectCandidate, fetchMegaEmbedSources(), formatDirectStreamUrl(), MegaEmbedResolved, MegaEmbedSource, resolvedSourcesCache, resolveMegaEmbed(), resolveMegaEmbedDubbedSource() (+3 more)

### Community 38 - "index.ts"
Cohesion: 0.16
Nodes (13): AppStore, MOVIE_GENRES, StreamSource, TMDBCast, TMDBCredits, TMDBGenre, TMDBMovie, TMDBMovieDetails (+5 more)

### Community 39 - "Search.tsx"
Cohesion: 0.21
Nodes (9): ErrorStateProps, SkeletonGrid(), IWindowWithSpeech, SpeechRecognitionHook, useSpeechRecognition(), ALL_GENRES, KEYBOARD_LAYOUT, POPULAR_SEARCH_TAGS (+1 more)

### Community 40 - "Watch.tsx"
Cohesion: 0.38
Nodes (9): Downloads(), Watch(), buildFileName(), deleteVideo(), downloadsSupported(), downloadVideo(), getPlayableUrl(), getMovieDetails() (+1 more)

### Community 41 - "subtitles.ts"
Cohesion: 0.24
Nodes (9): @capacitor/core, activeBlobUrls, fetchPortugueseSubtitles(), getImdbId(), imdbIdCache, srtToVtt(), StremioSubtitle, SubtitleTrackOption (+1 more)

### Community 42 - "ErrorBoundary"
Cohesion: 0.25
Nodes (3): ErrorBoundary, Props, State

### Community 43 - "EpisodeSelector.tsx"
Cohesion: 0.36
Nodes (7): EpisodeSelector(), EpisodeSelectorProps, StreamPlayerProps, SkeletonEpisodeList(), getSeasonDetails(), TMDBEpisode, TMDBSeason

### Community 44 - "Details.tsx"
Cohesion: 0.43
Nodes (5): GenreBadge(), GenreBadgeProps, LoadingSpinner(), Details(), getProfileUrl()

### Community 45 - "SplashScreen.tsx"
Cohesion: 0.38
Nodes (4): CineBGLogo(), CineBGLogoProps, SplashScreen(), SplashScreenProps

## Knowledge Gaps
- **10 isolated node(s):** `@capacitor/android`, `@capacitor/haptics`, `@capacitor/keyboard`, `@types/react`, `@types/react-dom` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 236 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `notifications.ts`, `index.ts`, `react`, `StreamPlayer.tsx`, `package.json`, `LiveTV.tsx`, `LicenseGate.tsx`, `App.tsx`, `isMobileDevice`, `UpdateModal.tsx`, `ErrorBoundary`, `EpisodeSelector.tsx`, `Search.tsx`, `SplashScreen.tsx`, `Details.tsx`, `Watch.tsx`, `useAppStore.ts`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **What connects `@capacitor/android`, `@capacitor/haptics`, `@capacitor/keyboard` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11092896174863388 - nodes in this community are weakly interconnected._
- **Why does `framer-motion` connect `react` to `notifications.ts`, `index.ts`, `UpdateModal.tsx`, `react`, `package.json`, `LiveTV.tsx`, `LicenseGate.tsx`, `App.tsx`, `Watch.tsx`, `Search.tsx`, `EpisodeSelector.tsx`, `Details.tsx`, `SplashScreen.tsx`, `EmptyState.tsx`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.12955465587044535 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `notifications.ts`, `index.ts`, `UpdateModal.tsx`, `react`, `package.json`, `LiveTV.tsx`, `LicenseGate.tsx`, `App.tsx`, `StreamPlayer.tsx`, `isMobileDevice`, `ErrorBoundary`, `Search.tsx`, `Details.tsx`, `Watch.tsx`, `EmptyState.tsx`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._