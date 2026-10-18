# Graph Report - cinebg  (2026-10-18)

## Corpus Check
- 89 files · ~380,182 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .xml 9, (none) 3, .properties 2)

## Summary
- 593 nodes · 1401 edges · 33 communities (21 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `30f078c2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- index.ts
- framer-motion
- react
- package.json
- LiveTV.tsx
- scripts
- notifications.ts
- compilerOptions
- dependencies
- devDependencies
- AppInstallerPlugin.java
- compilerOptions
- main
- MainActivity.java
- index.ts
- UpdateModal.tsx
- bug_fix.md
- PULL_REQUEST_TEMPLATE.md
- feature_request.md
- improvement.md
- eslint.config.js
- vite.config.ts
- capacitor.config.ts

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
- `AnimatedRoutes()` --calls--> `useAppStore`  [EXTRACTED]
  src/App.tsx → src/store/useAppStore.ts

## Import Cycles
- None detected.

## Communities (33 total, 12 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.10
Nodes (29): AnimatedRoutes(), Anime, Details, Downloads, Favorites, History, Home, LiveTV (+21 more)

### Community 1 - "index.ts"
Cohesion: 0.10
Nodes (47): Carousel(), ProgressBar(), ProgressBarProps, HeroSkeleton(), SkeletonCard(), SkeletonCarousel(), SkeletonLiveTV(), SkeletonMoviesPage() (+39 more)

### Community 2 - "framer-motion"
Cohesion: 0.08
Nodes (43): framer-motion, lucide-react, CarouselProps, EmptyDownloads(), EmptyFavorites(), EmptyHistory(), EmptyLiveTV(), EmptyMyList() (+35 more)

### Community 3 - "react"
Cohesion: 0.07
Nodes (45): @noriginmedia/norigin-spatial-navigation, react, react-dom, react-router-dom, App(), CATEGORIES_GRID, NAV_LINKS, Navbar() (+37 more)

### Community 4 - "package.json"
Cohesion: 0.10
Nodes (19): name, private, type, version, autoprefixer, axios, @capacitor/android, @capacitor/app (+11 more)

### Community 5 - "LiveTV.tsx"
Cohesion: 0.12
Nodes (27): LivePlayer(), LivePlayerProps, YuCineChannelCard(), YuCineChannelCardProps, LiveTV(), ChannelScheduleSlot, DailyScheduleItem, EPGProgram (+19 more)

### Community 6 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, build:apk, cap:open, cap:sync, dev, lint, preview

### Community 7 - "notifications.ts"
Cohesion: 0.25
Nodes (13): useEpisodeNotifications(), checkForNewEpisodes(), daysAgoISO(), ensureNotificationChannel(), ensureNotificationPermission(), episodeKey(), hashId(), loadNotified() (+5 more)

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

### Community 21 - "index.ts"
Cohesion: 0.06
Nodes (68): @capacitor/filesystem, EpisodeSelector(), EpisodeSelectorProps, StreamPlayer(), StreamPlayerProps, GenreBadge(), GenreBadgeProps, SkeletonEpisodeList() (+60 more)

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

### Community 30 - "eslint.config.js"
Cohesion: 0.33
Nodes (5): @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, typescript-eslint

## Knowledge Gaps
- **10 isolated node(s):** `@capacitor/android`, `@capacitor/haptics`, `@capacitor/keyboard`, `@types/react`, `@types/react-dom` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 222 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `App.tsx`, `index.ts`, `framer-motion`, `package.json`, `LiveTV.tsx`, `notifications.ts`, `index.ts`, `UpdateModal.tsx`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **What connects `@capacitor/android`, `@capacitor/haptics`, `@capacitor/keyboard` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10128205128205128 - nodes in this community are weakly interconnected._
- **Why does `framer-motion` connect `framer-motion` to `App.tsx`, `index.ts`, `react`, `package.json`, `LiveTV.tsx`, `index.ts`, `UpdateModal.tsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10401002506265664 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `framer-motion` to `App.tsx`, `index.ts`, `react`, `package.json`, `LiveTV.tsx`, `index.ts`, `UpdateModal.tsx`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Should `framer-motion` be split into smaller, more focused modules?**
  _Cohesion score 0.08458646616541353 - nodes in this community are weakly interconnected._