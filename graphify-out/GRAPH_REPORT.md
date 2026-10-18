# Graph Report - cinebg  (2026-10-18)

## Corpus Check
- 91 files · ~386,619 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .xml 9, (none) 3, .properties 2)

## Summary
- 630 nodes · 1507 edges · 30 communities (21 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ee0c7562`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- index.ts
- index.ts
- StreamPlayer.tsx
- package.json
- LiveTV.tsx
- useAppStore.ts
- EmptyState.tsx
- compilerOptions
- dependencies
- devDependencies
- AppInstallerPlugin.java
- compilerOptions
- main
- MainActivity.java
- Watch.tsx
- LicenseGate.tsx
- bug_fix.md
- PULL_REQUEST_TEMPLATE.md
- feature_request.md
- improvement.md

## God Nodes (most connected - your core abstractions)
1. `react` - 36 edges
2. `useAppStore` - 34 edges
3. `framer-motion` - 32 edges
4. `lucide-react` - 28 edges
5. `AnimatedRoutes()` - 20 edges
6. `Home()` - 19 edges
7. `Focusable()` - 18 edges
8. `forKids()` - 18 edges
9. `compilerOptions` - 18 edges
10. `MovieCard()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `3. Gerenciar Deploys estritamente por Pull Requests (PRs)` --references--> `main()`  [INFERRED]
  AGENTS.md → scripts/create-issues.py
- `2. Padrão de Nomenclatura de Branches` --references--> `main()`  [INFERRED]
  CONTRIBUTING.md → scripts/create-issues.py
- `📌 Regra Fundamental: GitHub Flow com Issues e PRs` --references--> `main()`  [INFERRED]
  CONTRIBUTING.md → scripts/create-issues.py
- `2. Fluxo de Branch e Desenvolvimento` --references--> `main()`  [INFERRED]
  README.md → scripts/create-issues.py
- `useAppUpdate()` --calls--> `useAppStore`  [EXTRACTED]
  src/hooks/useAppUpdate.ts → src/store/useAppStore.ts

## Import Cycles
- None detected.

## Communities (30 total, 9 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.09
Nodes (32): react-dom, AnimatedRoutes(), Anime, App(), Details, Downloads, Favorites, History (+24 more)

### Community 1 - "index.ts"
Cohesion: 0.10
Nodes (55): Carousel(), ErrorState(), ErrorStateProps, MovieCard(), ProgressBar(), ProgressBarProps, HeroSkeleton(), SkeletonCard() (+47 more)

### Community 2 - "index.ts"
Cohesion: 0.06
Nodes (61): framer-motion, lucide-react, @noriginmedia/norigin-spatial-navigation, react, react-router-dom, CATEGORIES_GRID, NAV_LINKS, Navbar() (+53 more)

### Community 3 - "StreamPlayer.tsx"
Cohesion: 0.08
Nodes (40): @capacitor/core, EpisodeSelector(), EpisodeSelectorProps, PlaybackSettingsModal(), StreamPlayer(), StreamPlayerProps, SkeletonEpisodeList(), buildMovieUrl() (+32 more)

### Community 4 - "package.json"
Cohesion: 0.05
Nodes (36): config, name, private, scripts, build, build:apk, cap:open, cap:sync (+28 more)

### Community 5 - "LiveTV.tsx"
Cohesion: 0.12
Nodes (27): LivePlayer(), LivePlayerProps, YuCineChannelCard(), YuCineChannelCardProps, LiveTV(), ChannelScheduleSlot, DailyScheduleItem, EPGProgram (+19 more)

### Community 6 - "useAppStore.ts"
Cohesion: 0.10
Nodes (33): zustand, useAppUpdate(), useEpisodeNotifications(), COLORS, EMOJIS, ProfileCard(), Profiles(), checkForNewEpisodes() (+25 more)

### Community 7 - "EmptyState.tsx"
Cohesion: 0.26
Nodes (10): EmptyDownloads(), EmptyFavorites(), EmptyHistory(), EmptyLiveTV(), EmptyMyList(), EmptySearch(), EmptyState(), EmptyStateProps (+2 more)

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
Cohesion: 0.10
Nodes (4): MainActivity, Runnable, BridgeWebViewClient, WebChromeClient

### Community 21 - "Watch.tsx"
Cohesion: 0.15
Nodes (23): @capacitor/filesystem, GenreBadge(), GenreBadgeProps, LoadingSpinner(), Details(), Downloads(), Watch(), buildFileName() (+15 more)

### Community 25 - "LicenseGate.tsx"
Cohesion: 0.17
Nodes (20): LicenseGate(), LicenseGateProps, getDeviceId(), getFirstUse(), getStoredLicense(), License, LicenseResponse, TRIAL_DAYS (+12 more)

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

## Knowledge Gaps
- **10 isolated node(s):** `@capacitor/android`, `@capacitor/haptics`, `@capacitor/keyboard`, `@types/react`, `@types/react-dom` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 229 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `index.ts` to `App.tsx`, `index.ts`, `StreamPlayer.tsx`, `package.json`, `LiveTV.tsx`, `useAppStore.ts`, `Watch.tsx`, `LicenseGate.tsx`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **What connects `@capacitor/android`, `@capacitor/haptics`, `@capacitor/keyboard` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0919661733615222 - nodes in this community are weakly interconnected._
- **Why does `framer-motion` connect `index.ts` to `App.tsx`, `index.ts`, `StreamPlayer.tsx`, `package.json`, `LiveTV.tsx`, `useAppStore.ts`, `EmptyState.tsx`, `Watch.tsx`, `LicenseGate.tsx`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10221619176843058 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `index.ts` to `App.tsx`, `index.ts`, `StreamPlayer.tsx`, `package.json`, `LiveTV.tsx`, `useAppStore.ts`, `EmptyState.tsx`, `Watch.tsx`, `LicenseGate.tsx`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05966724039013196 - nodes in this community are weakly interconnected._