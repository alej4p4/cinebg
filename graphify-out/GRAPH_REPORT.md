# Graph Report - cinebg  (2026-10-19)

## Corpus Check
- 102 files · ~400,479 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .xml 9, (none) 3, .properties 2)

## Summary
- 764 nodes · 1828 edges · 41 communities (26 shown, 15 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `423fd252`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UpdateModal.tsx
- index.ts
- react
- StreamPlayer.tsx
- package.json
- LiveTV.tsx
- notifications.ts
- App.tsx
- compilerOptions
- dependencies
- devDependencies
- AppInstallerPlugin.java
- compilerOptions
- main
- MainActivity.java
- biome.json
- observability.ts
- bug_fix.md
- PULL_REQUEST_TEMPLATE.md
- feature_request.md
- improvement.md
- scripts
- arch-contract.mjs
- vite.config.ts
- capacitor.config.ts
- stryker.config.json
- EmptyState.tsx
- knip.json
- GenreBadge.tsx
- eslint.config.js

## God Nodes (most connected - your core abstractions)
1. `useAppStore` - 42 edges
2. `react` - 37 edges
3. `framer-motion` - 30 edges
4. `lucide-react` - 29 edges
5. `isMobileDevice()` - 27 edges
6. `Home()` - 24 edges
7. `isTVDevice()` - 24 edges
8. `Focusable()` - 22 edges
9. `AnimatedRoutes()` - 21 edges
10. `@noriginmedia/norigin-spatial-navigation` - 20 edges

## Surprising Connections (you probably didn't know these)
- `1.3 Gerenciar Deploys estritamente por Pull Requests (PRs)` --references--> `main()`  [INFERRED]
  AGENTS.md → scripts/create-issues.py
- `2. Padrão de Nomenclatura de Branches` --references--> `main()`  [INFERRED]
  CONTRIBUTING.md → scripts/create-issues.py
- `📌 Regra Fundamental: GitHub Flow com Issues e PRs` --references--> `main()`  [INFERRED]
  CONTRIBUTING.md → scripts/create-issues.py
- `2. Fluxo de Branch e Desenvolvimento` --references--> `main()`  [INFERRED]
  README.md → scripts/create-issues.py
- `🔭 3. OBSERVABILIDADE FULL-STACK` --references--> `ErrorBoundary`  [INFERRED]
  AGENTS.md → src/components/ErrorBoundary.tsx

## Import Cycles
- None detected.

## Communities (41 total, 15 thin omitted)

### Community 0 - "UpdateModal.tsx"
Cohesion: 0.26
Nodes (11): @capacitor/core, UpdateModal(), UpdateModalProps, UpdateStage, AppInstaller, AppInstallerPluginInterface, canInstallUnknownApps(), DownloadProgress (+3 more)

### Community 1 - "index.ts"
Cohesion: 0.07
Nodes (67): @capacitor/filesystem, LiveTvCarousel(), SkeletonDetailPage(), Details(), Downloads(), Home(), Watch(), buildFileName() (+59 more)

### Community 2 - "react"
Cohesion: 0.07
Nodes (66): ✨ 2. DESIGN & MOTION PRINCIPLES (KYLE ZANTOS), framer-motion, lucide-react, @noriginmedia/norigin-spatial-navigation, react, PlaybackSettingsProps, FEATURED_CHANNEL_IDS, LiveTvCarouselProps (+58 more)

### Community 3 - "StreamPlayer.tsx"
Cohesion: 0.08
Nodes (40): EpisodeSelector(), EpisodeSelectorProps, PlaybackSettingsModal(), StreamPlayer(), StreamPlayerProps, SkeletonEpisodeList(), buildMovieUrl(), buildShowUrl() (+32 more)

### Community 4 - "package.json"
Cohesion: 0.11
Nodes (18): name, private, type, version, autoprefixer, axios, @capacitor/android, @capacitor/app (+10 more)

### Community 5 - "LiveTV.tsx"
Cohesion: 0.09
Nodes (30): @capacitor/status-bar, hls.js, LivePlayer(), LivePlayerProps, YuCineChannelCard(), YuCineChannelCardProps, useOrientationFullscreen(), LiveTV() (+22 more)

### Community 6 - "notifications.ts"
Cohesion: 0.08
Nodes (43): LicenseGate(), LicenseGateProps, Focusable(), FocusableProps, useEpisodeNotifications(), getDeviceId(), getFirstUse(), getStoredLicense() (+35 more)

### Community 7 - "App.tsx"
Cohesion: 0.08
Nodes (50): react-router-dom, AnimatedRoutes(), Anime, App(), Details, Downloads, Favorites, History (+42 more)

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
Nodes (29): 1.1 Criar ou Vincular a Issue no GitHub, 1.2 Isolar em Branch de Trabalho, 1.3 Gerenciar Deploys estritamente por Pull Requests (PRs), 🚨 1. PROTOCOLO MANDATÓRIO DE FLUXO DE TRABALHO (ISSUES & PRs), 🛡️ 4. QUALIDADE E INTEGRIDADE DE CÓDIGO, 🧪 5. TESTES UNITÁRIOS, INTEGRAÇÃO E END-TO-END (E2E), ✅ 6. CRITÉRIO DE ACEITE TÉCNICO, 🧠 7. GRAPHIFY (KNOWLEDGE GRAPH) (+21 more)

### Community 15 - "MainActivity.java"
Cohesion: 0.06
Nodes (5): ExampleInstrumentedTest, MainActivity, BridgeWebViewClient, WebChromeClient, ExampleUnitTest

### Community 21 - "biome.json"
Cohesion: 0.05
Nodes (36): noSvgWithoutTitle, useButtonType, useKeyWithClickEvents, useMediaCaption, noUnusedVariables, useExhaustiveDependencies, files, ignore (+28 more)

### Community 25 - "observability.ts"
Cohesion: 0.12
Nodes (22): 🔭 3. OBSERVABILIDADE FULL-STACK, react-dom, ErrorBoundary, Props, State, activeSpans, addBreadcrumb(), Breadcrumb (+14 more)

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
Cohesion: 0.14
Nodes (14): scripts, build, build:apk, cap:open, cap:sync, check:knip, dev, lint (+6 more)

### Community 31 - "arch-contract.mjs"
Cohesion: 0.15
Nodes (7): files, requiredFiles, ROOT, SRC_DIR, violations, walkFiles(), ROOT

### Community 34 - "stryker.config.json"
Cohesion: 0.15
Nodes (12): commandRunner, command, coverageAnalysis, mutate, packageManager, reporters, $schema, testRunner (+4 more)

### Community 35 - "EmptyState.tsx"
Cohesion: 0.26
Nodes (10): EmptyDownloads(), EmptyFavorites(), EmptyHistory(), EmptyLiveTV(), EmptyMyList(), EmptySearch(), EmptyState(), EmptyStateProps (+2 more)

### Community 36 - "knip.json"
Cohesion: 0.33
Nodes (5): entry, ignore, ignoreDependencies, project, $schema

### Community 40 - "eslint.config.js"
Cohesion: 0.33
Nodes (5): @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, typescript-eslint

## Knowledge Gaps
- **10 isolated node(s):** `@capacitor/android`, `@capacitor/haptics`, `@capacitor/keyboard`, `@types/react`, `@types/react-dom` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 307 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `🤖 Instruções para Agentes de IA — CineBG` connect `main` to `observability.ts`, `react`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **What connects `@capacitor/android`, `@capacitor/haptics`, `@capacitor/keyboard` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07497565725413827 - nodes in this community are weakly interconnected._
- **Why does `✨ 2. DESIGN & MOTION PRINCIPLES (KYLE ZANTOS)` connect `react` to `index.ts`, `main`, `LiveTV.tsx`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.06974921630094044 - nodes in this community are weakly interconnected._
- **Should `StreamPlayer.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0797872340425532 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._