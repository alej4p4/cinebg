# Graph Report - cinebg  (2026-10-16)

## Corpus Check
- 84 files · ~77,527 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .xml 9, (none) 3, .properties 2)

## Summary
- 528 nodes · 1244 edges · 34 communities (20 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3306937c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- react
- index.ts
- LicenseGate.tsx
- package.json
- LiveTV.tsx
- StreamPlayer.tsx
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
- scripts
- eslint.config.js
- vite.config.ts
- capacitor.config.ts

## God Nodes (most connected - your core abstractions)
1. `react` - 32 edges
2. `framer-motion` - 31 edges
3. `useAppStore` - 30 edges
4. `lucide-react` - 26 edges
5. `AnimatedRoutes()` - 20 edges
6. `compilerOptions` - 18 edges
7. `getPosterUrl()` - 17 edges
8. `MovieCard()` - 16 edges
9. `Home()` - 16 edges
10. `checkForNewEpisodes()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `3. Gerenciar Deploys estritamente por Pull Requests (PRs)` --references--> `main()`  [INFERRED]
  AGENTS.md → scripts/create-issues.py
- `2. Padrão de Nomenclatura de Branches` --references--> `main()`  [INFERRED]
  CONTRIBUTING.md → scripts/create-issues.py
- `📌 Regra Fundamental: GitHub Flow com Issues e PRs` --references--> `main()`  [INFERRED]
  CONTRIBUTING.md → scripts/create-issues.py
- `2. Fluxo de Branch e Desenvolvimento` --references--> `main()`  [INFERRED]
  README.md → scripts/create-issues.py
- `YuCineHeroProps` --references--> `MediaItem`  [EXTRACTED]
  src/components/ui/YuCineHero.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (34 total, 14 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.07
Nodes (36): react, AnimatedRoutes(), Anime, App(), Details, Downloads, Favorites, History (+28 more)

### Community 1 - "react"
Cohesion: 0.09
Nodes (61): framer-motion, lucide-react, Carousel(), CarouselProps, ErrorState(), ErrorStateProps, HeroBanner(), HeroBannerProps (+53 more)

### Community 2 - "index.ts"
Cohesion: 0.08
Nodes (45): @capacitor/core, @capacitor/filesystem, react-router-dom, Focusable(), FocusableProps, GenreBadge(), GenreBadgeProps, LoadingSpinner() (+37 more)

### Community 3 - "LicenseGate.tsx"
Cohesion: 0.18
Nodes (19): LicenseGate(), LicenseGateProps, getDeviceId(), getFirstUse(), getStoredLicense(), License, LicenseResponse, TRIAL_DAYS (+11 more)

### Community 4 - "package.json"
Cohesion: 0.10
Nodes (19): name, private, type, version, autoprefixer, axios, @capacitor/android, @capacitor/app (+11 more)

### Community 5 - "LiveTV.tsx"
Cohesion: 0.16
Nodes (18): @noriginmedia/norigin-spatial-navigation, LivePlayer(), LivePlayerProps, YuCineChannelCard(), YuCineChannelCardProps, LiveTV(), categoryLabel(), countryFlag() (+10 more)

### Community 6 - "StreamPlayer.tsx"
Cohesion: 0.11
Nodes (29): hls.js, EpisodeSelector(), EpisodeSelectorProps, StreamPlayer(), StreamPlayerProps, SkeletonEpisodeList(), buildMovieUrl(), buildShowUrl() (+21 more)

### Community 7 - "notifications.ts"
Cohesion: 0.11
Nodes (31): zustand, useEpisodeNotifications(), COLORS, EMOJIS, ProfileCard(), Profiles(), checkForNewEpisodes(), daysAgoISO() (+23 more)

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

### Community 30 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, build:apk, cap:open, cap:sync, dev, lint, preview

### Community 31 - "eslint.config.js"
Cohesion: 0.33
Nodes (5): @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, typescript-eslint

## Knowledge Gaps
- **10 isolated node(s):** `@capacitor/android`, `@capacitor/haptics`, `@capacitor/keyboard`, `@types/react`, `@types/react-dom` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 199 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App.tsx` to `react`, `index.ts`, `LicenseGate.tsx`, `package.json`, `LiveTV.tsx`, `StreamPlayer.tsx`, `notifications.ts`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **What connects `@capacitor/android`, `@capacitor/haptics`, `@capacitor/keyboard` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Why does `framer-motion` connect `react` to `App.tsx`, `index.ts`, `LicenseGate.tsx`, `package.json`, `LiveTV.tsx`, `StreamPlayer.tsx`, `notifications.ts`, `EmptyState.tsx`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.08925673482635509 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `App.tsx`, `index.ts`, `LicenseGate.tsx`, `package.json`, `LiveTV.tsx`, `StreamPlayer.tsx`, `notifications.ts`, `EmptyState.tsx`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08166969147005444 - nodes in this community are weakly interconnected._