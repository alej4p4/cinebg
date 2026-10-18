# Graph Report - cinebg  (2026-10-18)

## Corpus Check
- 89 files · ~378,680 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .xml 9, (none) 3, .properties 2)

## Summary
- 592 nodes · 1398 edges · 30 communities (20 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e0df722f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- index.ts
- index.ts
- react
- package.json
- LiveTV.tsx
- notifications.ts
- compilerOptions
- dependencies
- devDependencies
- AppInstallerPlugin.java
- compilerOptions
- main
- MainActivity.java
- StreamPlayer.tsx
- UpdateModal.tsx
- bug_fix.md
- PULL_REQUEST_TEMPLATE.md
- feature_request.md
- improvement.md
- Watch.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 35 edges
2. `useAppStore` - 34 edges
3. `framer-motion` - 31 edges
4. `lucide-react` - 27 edges
5. `AnimatedRoutes()` - 20 edges
6. `Home()` - 18 edges
7. `compilerOptions` - 18 edges
8. `Focusable()` - 17 edges
9. `forKids()` - 17 edges
10. `getPosterUrl()` - 17 edges

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

## Communities (30 total, 10 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.08
Nodes (45): lucide-react, @noriginmedia/norigin-spatial-navigation, react-router-dom, AnimatedRoutes(), Anime, Details, Downloads, Favorites (+37 more)

### Community 1 - "index.ts"
Cohesion: 0.09
Nodes (57): framer-motion, Carousel(), CarouselProps, ErrorState(), ErrorStateProps, HeroBannerProps, MovieCard(), MovieCardProps (+49 more)

### Community 2 - "index.ts"
Cohesion: 0.10
Nodes (23): EmptyDownloads(), EmptyHistory(), EmptyLiveTV(), EmptyMyList(), EmptySearch(), EmptyState(), EmptyStateProps, illustrations (+15 more)

### Community 3 - "react"
Cohesion: 0.07
Nodes (33): react, react-dom, App(), ErrorBoundary, Props, State, CATEGORIES_GRID, NAV_LINKS (+25 more)

### Community 4 - "package.json"
Cohesion: 0.06
Nodes (35): config, name, private, scripts, build, build:apk, cap:open, cap:sync (+27 more)

### Community 5 - "LiveTV.tsx"
Cohesion: 0.12
Nodes (27): hls.js, LivePlayer(), LivePlayerProps, YuCineChannelCard(), YuCineChannelCardProps, LiveTV(), ChannelScheduleSlot, DailyScheduleItem (+19 more)

### Community 7 - "notifications.ts"
Cohesion: 0.10
Nodes (32): useAppUpdate(), useEpisodeNotifications(), COLORS, EMOJIS, ProfileCard(), Profiles(), checkForNewEpisodes(), daysAgoISO() (+24 more)

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

### Community 21 - "StreamPlayer.tsx"
Cohesion: 0.11
Nodes (30): EpisodeSelector(), EpisodeSelectorProps, StreamPlayer(), StreamPlayerProps, SkeletonEpisodeList(), buildMovieUrl(), buildShowUrl(), DirectCandidate (+22 more)

### Community 25 - "UpdateModal.tsx"
Cohesion: 0.17
Nodes (13): @capacitor/core, @capacitor/status-bar, UpdateModal(), UpdateModalProps, UpdateStage, useOrientationFullscreen(), AppInstaller, AppInstallerPluginInterface (+5 more)

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

### Community 30 - "Watch.tsx"
Cohesion: 0.15
Nodes (25): @capacitor/filesystem, Focusable(), FocusableProps, GenreBadge(), GenreBadgeProps, HeroBanner(), LoadingSpinner(), SkeletonHero() (+17 more)

## Knowledge Gaps
- **10 isolated node(s):** `@capacitor/android`, `@capacitor/haptics`, `@capacitor/keyboard`, `@types/react`, `@types/react-dom` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 222 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `App.tsx`, `index.ts`, `index.ts`, `package.json`, `LiveTV.tsx`, `notifications.ts`, `StreamPlayer.tsx`, `UpdateModal.tsx`, `Watch.tsx`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **What connects `@capacitor/android`, `@capacitor/haptics`, `@capacitor/keyboard` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08166969147005444 - nodes in this community are weakly interconnected._
- **Why does `framer-motion` connect `index.ts` to `App.tsx`, `index.ts`, `react`, `package.json`, `LiveTV.tsx`, `notifications.ts`, `StreamPlayer.tsx`, `UpdateModal.tsx`, `Watch.tsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09192546583850932 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `App.tsx` to `index.ts`, `index.ts`, `react`, `package.json`, `LiveTV.tsx`, `notifications.ts`, `StreamPlayer.tsx`, `UpdateModal.tsx`, `Watch.tsx`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10052910052910052 - nodes in this community are weakly interconnected._