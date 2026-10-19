# Graph Report - cinebg  (2026-10-19)

## Corpus Check
- 92 files · ~392,289 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .xml 9, (none) 3, .properties 2)

## Summary
- 637 nodes · 1581 edges · 38 communities (27 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e9fcc0b9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useAppStore.ts
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
- index.ts
- bug_fix.md
- PULL_REQUEST_TEMPLATE.md
- feature_request.md
- improvement.md
- scripts
- eslint.config.js
- vite.config.ts
- capacitor.config.ts
- UpdateModal.tsx
- Navbar.tsx
- ErrorBoundary
- useLicense
- useOrientationFullscreen.ts

## God Nodes (most connected - your core abstractions)
1. `useAppStore` - 40 edges
2. `react` - 37 edges
3. `framer-motion` - 32 edges
4. `lucide-react` - 28 edges
5. `Focusable()` - 22 edges
6. `Home()` - 21 edges
7. `@noriginmedia/norigin-spatial-navigation` - 20 edges
8. `AnimatedRoutes()` - 20 edges
9. `forKids()` - 19 edges
10. `isMobileDevice()` - 18 edges

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

## Communities (38 total, 11 thin omitted)

### Community 0 - "useAppStore.ts"
Cohesion: 0.09
Nodes (45): @capacitor/app, Direction, getDirectionFromEvent(), isEnterEvent(), isToggleModeEvent(), NavigationMode, TvCursorOverlay(), useAppUpdate() (+37 more)

### Community 1 - "index.ts"
Cohesion: 0.11
Nodes (52): Carousel(), ErrorState(), ErrorStateProps, ProgressBar(), ProgressBarProps, HeroSkeleton(), SkeletonCard(), SkeletonCarousel() (+44 more)

### Community 2 - "react"
Cohesion: 0.07
Nodes (54): framer-motion, lucide-react, @noriginmedia/norigin-spatial-navigation, react, react-router-dom, PlaybackSettingsProps, FEATURED_CHANNEL_IDS, LiveTvCarouselProps (+46 more)

### Community 3 - "StreamPlayer.tsx"
Cohesion: 0.08
Nodes (39): EpisodeSelector(), EpisodeSelectorProps, PlaybackSettingsModal(), StreamPlayer(), StreamPlayerProps, SkeletonEpisodeList(), buildMovieUrl(), buildShowUrl() (+31 more)

### Community 4 - "package.json"
Cohesion: 0.11
Nodes (18): name, private, type, version, autoprefixer, axios, @capacitor/android, @capacitor/haptics (+10 more)

### Community 5 - "LiveTV.tsx"
Cohesion: 0.11
Nodes (27): LivePlayer(), LivePlayerProps, LiveTvCarousel(), YuCineChannelCard(), YuCineChannelCardProps, LiveTV(), ChannelScheduleSlot, DailyScheduleItem (+19 more)

### Community 6 - "LicenseGate.tsx"
Cohesion: 0.27
Nodes (13): LicenseGateProps, checkMercadoPagoStatus(), createMercadoPagoPix(), CreatePixPaymentResult, DEFAULT_PIX_KEY, ensureValidMercadoPagoToken(), generateFallbackPix(), getMercadoPagoToken() (+5 more)

### Community 7 - "App.tsx"
Cohesion: 0.22
Nodes (15): AnimatedRoutes(), Anime, Details, Downloads, Favorites, History, Home, LiveTV (+7 more)

### Community 8 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+12 more)

### Community 9 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, axios, @capacitor/android, @capacitor/app, @capacitor/core, @capacitor/filesystem, @capacitor/haptics, @capacitor/keyboard (+10 more)

### Community 10 - "devDependencies"
Cohesion: 0.12
Nodes (16): devDependencies, autoprefixer, @capacitor/cli, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+8 more)

### Community 11 - "AppInstallerPlugin.java"
Cohesion: 0.09
Nodes (3): ExampleInstrumentedTest, AppInstallerPlugin, ExampleUnitTest

### Community 12 - "compilerOptions"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, strict, include

### Community 13 - "main"
Cohesion: 0.06
Nodes (27): 1. Criar ou Vincular a Issue, 2. Isolar em Branch de Trabalho, 3. Gerenciar Deploys estritamente por Pull Requests (PRs), 4. Critério de Aceite Técnico, graphify, 🤖 Instruções para Agentes de IA — CineBG, 🚨 PROTOCOLO MANDATÓRIO DE TRABALHO, 1. Classificação e Criação de Issues (+19 more)

### Community 15 - "MainActivity.java"
Cohesion: 0.11
Nodes (3): MainActivity, BridgeWebViewClient, WebChromeClient

### Community 21 - "index.ts"
Cohesion: 0.12
Nodes (28): @capacitor/filesystem, GenreBadge(), GenreBadgeProps, LoadingSpinner(), Details(), Downloads(), Watch(), buildFileName() (+20 more)

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
Cohesion: 0.22
Nodes (12): Focusable(), FocusableProps, UpdateModal(), UpdateModalProps, UpdateStage, AppInstaller, AppInstallerPluginInterface, canInstallUnknownApps() (+4 more)

### Community 35 - "Navbar.tsx"
Cohesion: 0.18
Nodes (9): react-dom, App(), CATEGORIES_GRID, NAV_LINKS, Navbar(), CineBGLogo(), CineBGLogoProps, SplashScreen() (+1 more)

### Community 36 - "ErrorBoundary"
Cohesion: 0.25
Nodes (3): ErrorBoundary, Props, State

### Community 37 - "useLicense"
Cohesion: 0.33
Nodes (8): LicenseGate(), getDeviceId(), getFirstUse(), getStoredLicense(), License, LicenseResponse, TRIAL_DAYS, useLicense()

### Community 38 - "useOrientationFullscreen.ts"
Cohesion: 0.40
Nodes (3): @capacitor/core, @capacitor/status-bar, useOrientationFullscreen()

## Knowledge Gaps
- **10 isolated node(s):** `@capacitor/android`, `@capacitor/haptics`, `@capacitor/keyboard`, `@types/react`, `@types/react-dom` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 232 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `useAppStore.ts`, `index.ts`, `UpdateModal.tsx`, `Navbar.tsx`, `package.json`, `ErrorBoundary`, `LicenseGate.tsx`, `App.tsx`, `StreamPlayer.tsx`, `LiveTV.tsx`, `useLicense`, `useOrientationFullscreen.ts`, `index.ts`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **What connects `@capacitor/android`, `@capacitor/haptics`, `@capacitor/keyboard` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useAppStore.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08853410740203194 - nodes in this community are weakly interconnected._
- **Why does `framer-motion` connect `react` to `useAppStore.ts`, `index.ts`, `UpdateModal.tsx`, `StreamPlayer.tsx`, `Navbar.tsx`, `package.json`, `LicenseGate.tsx`, `App.tsx`, `LiveTV.tsx`, `index.ts`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10599078341013825 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `useAppStore.ts`, `index.ts`, `UpdateModal.tsx`, `Navbar.tsx`, `package.json`, `LiveTV.tsx`, `ErrorBoundary`, `LicenseGate.tsx`, `StreamPlayer.tsx`, `index.ts`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.0745814307458143 - nodes in this community are weakly interconnected._