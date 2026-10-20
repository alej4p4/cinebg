# Graph Report - cinebg  (2026-10-19)

## Corpus Check
- 93 files · ~396,324 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .xml 9, (none) 3, .properties 2)

## Summary
- 647 nodes · 1625 edges · 40 communities (27 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0dd500ab`
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
- Details.tsx
- useAppStore
- bug_fix.md
- PULL_REQUEST_TEMPLATE.md
- feature_request.md
- improvement.md
- scripts
- eslint.config.js
- vite.config.ts
- capacitor.config.ts
- index.ts
- EmptyState.tsx
- subtitles.ts
- ErrorBoundary
- EpisodeSelector.tsx
- GenreBadge.tsx

## God Nodes (most connected - your core abstractions)
1. `useAppStore` - 42 edges
2. `react` - 37 edges
3. `framer-motion` - 32 edges
4. `lucide-react` - 29 edges
5. `isMobileDevice()` - 25 edges
6. `Home()` - 24 edges
7. `Focusable()` - 22 edges
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
- `PageFallback()` --calls--> `LoadingSpinner()`  [EXTRACTED]
  src/App.tsx → src/components/ui/LoadingSpinner.tsx

## Import Cycles
- None detected.

## Communities (40 total, 13 thin omitted)

### Community 0 - "notifications.ts"
Cohesion: 0.25
Nodes (13): useEpisodeNotifications(), checkForNewEpisodes(), daysAgoISO(), ensureNotificationChannel(), ensureNotificationPermission(), episodeKey(), hashId(), loadNotified() (+5 more)

### Community 1 - "index.ts"
Cohesion: 0.10
Nodes (55): Carousel(), ErrorState(), HeroBanner(), ProgressBar(), ProgressBarProps, HeroSkeleton(), SkeletonCard(), SkeletonCarousel() (+47 more)

### Community 2 - "react"
Cohesion: 0.10
Nodes (41): framer-motion, lucide-react, @noriginmedia/norigin-spatial-navigation, react, react-router-dom, PlaybackSettingsProps, FocusableProps, FEATURED_CHANNEL_IDS (+33 more)

### Community 3 - "StreamPlayer.tsx"
Cohesion: 0.13
Nodes (24): PlaybackSettingsModal(), StreamPlayer(), buildMovieUrl(), buildShowUrl(), DirectCandidate, fetchMegaEmbedSources(), formatDirectStreamUrl(), getInitialMirrorForAudio() (+16 more)

### Community 4 - "package.json"
Cohesion: 0.11
Nodes (17): name, private, type, version, autoprefixer, axios, @capacitor/android, @capacitor/app (+9 more)

### Community 5 - "LiveTV.tsx"
Cohesion: 0.09
Nodes (31): @capacitor/core, @capacitor/status-bar, hls.js, LivePlayer(), LivePlayerProps, LiveTvCarousel(), YuCineChannelCard(), YuCineChannelCardProps (+23 more)

### Community 6 - "LicenseGate.tsx"
Cohesion: 0.27
Nodes (13): LicenseGateProps, checkMercadoPagoStatus(), createMercadoPagoPix(), CreatePixPaymentResult, DEFAULT_PIX_KEY, ensureValidMercadoPagoToken(), generateFallbackPix(), getMercadoPagoToken() (+5 more)

### Community 7 - "App.tsx"
Cohesion: 0.06
Nodes (65): react-dom, AnimatedRoutes(), Anime, App(), Details, Downloads, Favorites, History (+57 more)

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

### Community 21 - "Details.tsx"
Cohesion: 0.31
Nodes (13): @capacitor/filesystem, LoadingSpinner(), Details(), Downloads(), Watch(), buildFileName(), deleteVideo(), downloadsSupported() (+5 more)

### Community 25 - "useAppStore"
Cohesion: 0.23
Nodes (14): zustand, useAppUpdate(), AppState, AppUpdateInfo, dataFor(), DEFAULT_PROFILE, emptyData(), PersistedState (+6 more)

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

### Community 34 - "index.ts"
Cohesion: 0.15
Nodes (14): AppStore, MediaType, MOVIE_GENRES, StreamSource, TMDBCast, TMDBCredits, TMDBGenre, TMDBMovie (+6 more)

### Community 35 - "EmptyState.tsx"
Cohesion: 0.26
Nodes (10): EmptyDownloads(), EmptyFavorites(), EmptyHistory(), EmptyLiveTV(), EmptyMyList(), EmptySearch(), EmptyState(), EmptyStateProps (+2 more)

### Community 36 - "subtitles.ts"
Cohesion: 0.28
Nodes (8): activeBlobUrls, fetchPortugueseSubtitles(), getImdbId(), imdbIdCache, srtToVtt(), StremioSubtitle, SubtitleTrackOption, tmdb

### Community 37 - "ErrorBoundary"
Cohesion: 0.25
Nodes (3): ErrorBoundary, Props, State

### Community 38 - "EpisodeSelector.tsx"
Cohesion: 0.36
Nodes (7): EpisodeSelector(), EpisodeSelectorProps, StreamPlayerProps, SkeletonEpisodeList(), getSeasonDetails(), TMDBEpisode, TMDBSeason

## Knowledge Gaps
- **10 isolated node(s):** `@capacitor/android`, `@capacitor/haptics`, `@capacitor/keyboard`, `@types/react`, `@types/react-dom` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 239 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `notifications.ts`, `index.ts`, `StreamPlayer.tsx`, `package.json`, `ErrorBoundary`, `EpisodeSelector.tsx`, `LicenseGate.tsx`, `App.tsx`, `LiveTV.tsx`, `Details.tsx`, `useAppStore`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **What connects `@capacitor/android`, `@capacitor/haptics`, `@capacitor/keyboard` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0993006993006993 - nodes in this community are weakly interconnected._
- **Why does `framer-motion` connect `react` to `index.ts`, `EmptyState.tsx`, `package.json`, `LiveTV.tsx`, `EpisodeSelector.tsx`, `LicenseGate.tsx`, `App.tsx`, `Details.tsx`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.096045197740113 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `index.ts`, `StreamPlayer.tsx`, `package.json`, `LiveTV.tsx`, `ErrorBoundary`, `LicenseGate.tsx`, `App.tsx`, `EmptyState.tsx`, `Details.tsx`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Should `StreamPlayer.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._