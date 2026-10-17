# Graph Report - cinebg  (2026-10-17)

## Corpus Check
- 84 files · ~70,039 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .xml 9, (none) 3, .properties 2)

## Summary
- 533 nodes · 1260 edges · 31 communities (19 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dc6d8967`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- react
- index.ts
- LicenseGate.tsx
- package.json
- LiveTV.tsx
- react
- notifications.ts
- compilerOptions
- dependencies
- devDependencies
- ExampleInstrumentedTest.java
- compilerOptions
- main
- MainActivity.java
- EmptyState.tsx
- bug_fix.md
- PULL_REQUEST_TEMPLATE.md
- feature_request.md
- improvement.md
- index.ts

## God Nodes (most connected - your core abstractions)
1. `react` - 32 edges
2. `useAppStore` - 32 edges
3. `framer-motion` - 31 edges
4. `lucide-react` - 26 edges
5. `AnimatedRoutes()` - 20 edges
6. `compilerOptions` - 18 edges
7. `Focusable()` - 17 edges
8. `getPosterUrl()` - 17 edges
9. `MovieCard()` - 16 edges
10. `Home()` - 16 edges

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

## Communities (31 total, 12 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.11
Nodes (22): AnimatedRoutes(), Anime, Details, Downloads, Favorites, History, Home, LiveTV (+14 more)

### Community 1 - "react"
Cohesion: 0.18
Nodes (25): Home(), buildCacheKey(), cachedGet(), discoverMovies(), discoverShows(), forKids(), getAiringToday(), getNowPlayingMovies() (+17 more)

### Community 2 - "index.ts"
Cohesion: 0.15
Nodes (22): hls.js, StreamPlayer(), buildMovieUrl(), buildShowUrl(), fetchMegaEmbedSources(), formatDirectStreamUrl(), getInitialMirrorForAudio(), isMirrorSandboxed() (+14 more)

### Community 3 - "LicenseGate.tsx"
Cohesion: 0.09
Nodes (34): react, react-dom, App(), CATEGORIES_GRID, NAV_LINKS, Navbar(), LicenseGate(), LicenseGateProps (+26 more)

### Community 4 - "package.json"
Cohesion: 0.05
Nodes (38): config, name, private, scripts, build, build:apk, cap:open, cap:sync (+30 more)

### Community 5 - "LiveTV.tsx"
Cohesion: 0.17
Nodes (17): LivePlayer(), LivePlayerProps, YuCineChannelCard(), YuCineChannelCardProps, LiveTV(), categoryLabel(), countryFlag(), LIVE_CATEGORIES (+9 more)

### Community 6 - "react"
Cohesion: 0.09
Nodes (56): framer-motion, lucide-react, @noriginmedia/norigin-spatial-navigation, react-router-dom, Carousel(), CarouselProps, ErrorState(), ErrorStateProps (+48 more)

### Community 7 - "notifications.ts"
Cohesion: 0.16
Nodes (20): useEpisodeNotifications(), COLORS, EMOJIS, ProfileCard(), Profiles(), checkForNewEpisodes(), daysAgoISO(), ensureNotificationChannel() (+12 more)

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

### Community 30 - "index.ts"
Cohesion: 0.08
Nodes (46): @capacitor/filesystem, EpisodeSelector(), EpisodeSelectorProps, StreamPlayerProps, GenreBadge(), GenreBadgeProps, SkeletonEpisodeList(), useAppUpdate() (+38 more)

## Knowledge Gaps
- **10 isolated node(s):** `@capacitor/android`, `@capacitor/haptics`, `@capacitor/keyboard`, `@types/react`, `@types/react-dom` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 202 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `LicenseGate.tsx` to `App.tsx`, `react`, `index.ts`, `package.json`, `LiveTV.tsx`, `react`, `notifications.ts`, `index.ts`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **What connects `@capacitor/android`, `@capacitor/haptics`, `@capacitor/keyboard` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11491935483870967 - nodes in this community are weakly interconnected._
- **Why does `framer-motion` connect `react` to `App.tsx`, `react`, `LicenseGate.tsx`, `package.json`, `LiveTV.tsx`, `notifications.ts`, `EmptyState.tsx`, `index.ts`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14814814814814814 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `App.tsx`, `index.ts`, `LicenseGate.tsx`, `package.json`, `LiveTV.tsx`, `notifications.ts`, `EmptyState.tsx`, `index.ts`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Should `LicenseGate.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08985200845665962 - nodes in this community are weakly interconnected._