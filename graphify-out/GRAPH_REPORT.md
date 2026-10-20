# Graph Report - cinebg  (2026-10-20)

## Corpus Check
- 107 files · ~411,152 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .xml 9, (none) 3, .properties 2)

## Summary
- 887 nodes · 2157 edges · 47 communities (27 shown, 20 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2e8efa81`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- LicenseGate.tsx
- Override
- react
- StreamPlayer.tsx
- package.json
- react
- index.ts
- App.tsx
- compilerOptions
- dependencies
- devDependencies
- AppInstallerPlugin.java
- compilerOptions
- main
- biome.json
- observability.ts
- bug_fix.md
- PULL_REQUEST_TEMPLATE.md
- feature_request.md
- improvement.md
- scripts
- qa-audit.test.mjs
- vite.config.ts
- capacitor.config.ts
- stryker.config.json
- notifications.ts
- knip.json
- GenreBadge.tsx
- eslint.config.js
- Object
- MainActivity
- ExampleInstrumentedTest.java
- ✅ PROBLEMAS CORRIGIDOS
- LivePlayer.tsx
- useSpeechRecognition.ts

## God Nodes (most connected - your core abstractions)
1. `useAppStore` - 46 edges
2. `Focusable()` - 41 edges
3. `react` - 38 edges
4. `framer-motion` - 31 edges
5. `lucide-react` - 30 edges
6. `isMobileDevice()` - 29 edges
7. `@noriginmedia/norigin-spatial-navigation` - 24 edges
8. `Home()` - 24 edges
9. `AnimatedRoutes()` - 22 edges
10. `useLicense()` - 22 edges

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

## Communities (47 total, 20 thin omitted)

### Community 0 - "LicenseGate.tsx"
Cohesion: 0.10
Nodes (39): LicenseGate(), LicenseGateProps, ActivationValidation, computeActivationChecksum(), fnv1a(), getDeviceId(), getFirstUse(), getStoredLicense() (+31 more)

### Community 2 - "react"
Cohesion: 0.11
Nodes (44): LiveTvCarousel(), HeroBanner(), Home(), BANNED_CATALOG_KEYWORDS, buildCacheKey(), cachedGet(), discoverMovies(), discoverShows() (+36 more)

### Community 3 - "StreamPlayer.tsx"
Cohesion: 0.07
Nodes (48): 🔒 SEGURANÇA, EpisodeSelector(), EpisodeSelectorProps, PlaybackSettingsModal(), ScreenOrientationWithLock, StreamPlayer(), StreamPlayerProps, SkeletonEpisodeList() (+40 more)

### Community 4 - "package.json"
Cohesion: 0.10
Nodes (20): name, private, type, version, autoprefixer, axios, @capacitor/android, @capacitor/app (+12 more)

### Community 5 - "react"
Cohesion: 0.06
Nodes (86): ✨ 2. DESIGN & MOTION PRINCIPLES (KYLE ZANTOS), framer-motion, lucide-react, @noriginmedia/norigin-spatial-navigation, react, react-router-dom, PlaybackSettingsProps, CONTENT_LABEL (+78 more)

### Community 6 - "index.ts"
Cohesion: 0.10
Nodes (38): useAppUpdate(), Details(), Watch(), buildFileName(), deleteVideo(), downloadsSupported(), downloadVideo(), getBackdropUrl() (+30 more)

### Community 7 - "App.tsx"
Cohesion: 0.08
Nodes (55): AnimatedRoutes(), Anime, App(), Details, Downloads, Favorites, History, Home (+47 more)

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

### Community 21 - "biome.json"
Cohesion: 0.05
Nodes (36): noSvgWithoutTitle, useButtonType, useKeyWithClickEvents, useMediaCaption, noUnusedVariables, useExhaustiveDependencies, files, ignore (+28 more)

### Community 25 - "observability.ts"
Cohesion: 0.12
Nodes (23): 🔭 3. OBSERVABILIDADE FULL-STACK, react-dom, ErrorBoundary, Props, State, activeSpans, addBreadcrumb(), Breadcrumb (+15 more)

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

### Community 31 - "qa-audit.test.mjs"
Cohesion: 0.07
Nodes (13): files, requiredFiles, ROOT, SRC_DIR, violations, walkFiles(), ROOT, MemoryStorage (+5 more)

### Community 34 - "stryker.config.json"
Cohesion: 0.15
Nodes (12): commandRunner, command, coverageAnalysis, mutate, packageManager, reporters, $schema, testRunner (+4 more)

### Community 35 - "notifications.ts"
Cohesion: 0.16
Nodes (20): useEpisodeNotifications(), COLORS, EMOJIS, ProfileCard(), Profiles(), checkForNewEpisodes(), daysAgoISO(), ensureNotificationChannel() (+12 more)

### Community 36 - "knip.json"
Cohesion: 0.33
Nodes (5): entry, ignore, ignoreDependencies, project, $schema

### Community 40 - "eslint.config.js"
Cohesion: 0.33
Nodes (5): @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, typescript-eslint

### Community 44 - "✅ PROBLEMAS CORRIGIDOS"
Cohesion: 0.09
Nodes (22): 1. **Character Encoding / UTF-8 Corruption** (CRÍTICO - CORRIGIDO), 2. **TypeScript Errors - Focusable.tsx** (CRÍTICO - CORRIGIDO), 3. **Focusable.tsx - TypeError "not callable"** (CRÍTICO - CORRIGIDO), 3. **TypeScript Errors - StreamPlayer.tsx** (CRÍTICO - CORRIGIDO), 4. **Android SDK Setup no CI/CD** (ALTO - CORRIGIDO), 5. **Versão Inconsistente no update.json** (ALTO - CORRIGIDO), 6. **Duplicate Setup Node.js Step** (MÉDIO - CORRIGIDO), 7. **Android SDK Setup no CI/CD** (ALTO - CORRIGIDO) (+14 more)

### Community 45 - "LivePlayer.tsx"
Cohesion: 0.10
Nodes (30): @capacitor/core, @capacitor/status-bar, LivePlayer(), LivePlayerProps, YuCineChannelCard(), YuCineChannelCardProps, useOrientationFullscreen(), LiveTV() (+22 more)

### Community 46 - "useSpeechRecognition.ts"
Cohesion: 0.20
Nodes (9): ISpeechRecognitionInstance, IWindowWithSpeech, SpeechRecognitionConstructor, SpeechRecognitionErrorEventLike, SpeechRecognitionEventLike, SpeechRecognitionHook, SpeechRecognitionResultAlternative, SpeechRecognitionResultItem (+1 more)

## Knowledge Gaps
- **10 isolated node(s):** `@capacitor/android`, `@capacitor/haptics`, `@capacitor/keyboard`, `@types/react`, `@types/react-dom` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 362 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `🤖 Instruções para Agentes de IA — CineBG` connect `main` to `observability.ts`, `react`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **What connects `@capacitor/android`, `@capacitor/haptics`, `@capacitor/keyboard` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LicenseGate.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10077519379844961 - nodes in this community are weakly interconnected._
- **Why does `✨ 2. DESIGN & MOTION PRINCIPLES (KYLE ZANTOS)` connect `react` to `main`, `LivePlayer.tsx`, `index.ts`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.11215686274509803 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `LicenseGate.tsx`, `react`, `StreamPlayer.tsx`, `package.json`, `notifications.ts`, `index.ts`, `App.tsx`, `LivePlayer.tsx`, `useSpeechRecognition.ts`, `observability.ts`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Should `StreamPlayer.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06818181818181818 - nodes in this community are weakly interconnected._