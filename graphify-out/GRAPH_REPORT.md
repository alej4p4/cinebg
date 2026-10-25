# Graph Report - cinebg  (2026-10-25)

## Corpus Check
- 117 files · ~426,134 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: .xml 10, (none) 3, .properties 3)

## Summary
- 1135 nodes · 2474 edges · 74 communities (54 shown, 20 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 67 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `85d98048`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useAppStore
- tmdb.ts
- App.tsx
- useLicense.ts
- 🤖 Instruções para Agentes de IA — CineBG
- qa-audit.test.mjs
- biome.json
- src/components/player/StreamPlayer.tsx
- observability.ts
- AppInstallerPlugin.java
- ✅ PROBLEMAS CORRIGIDOS
- src/types/index.ts
- notifications.ts
- package.json
- compilerOptions
- Favorites.tsx
- dependencies
- devDependencies
- ExampleInstrumentedTest.java
- scripts
- src/pages/LiveTV.tsx
- stryker.config.json
- MainActivity
- useSpeechRecognition.ts
- epgCache.ts
- compilerOptions
- eslint.config.js
- bug_fix.md
- PULL_REQUEST_TEMPLATE.md
- knip.json
- feature_request.md
- improvement.md
- vite.config.ts
- capacitor.config.ts
- ref_playwright_test
- GenreBadge.tsx
- Search.tsx
- CineBG Streams API Documentation
- CineBG - Architecture Documentation
- src/utils/motion.ts
- �� CORREÇÕES DEFINITIVAS
- CineBG - Task Backlog & Roadmap
- CineBG - Project Status
- Object
- dashboard.ts
- SkeletonCard.tsx
- CineBG - Architectural Decisions Log
- buffer.ts
- ADR-005: OTA Updates - Dual APK (Mobile + TV)
- ADR-012: Capacitor server.url Removido (Fix connection refused)
- ADR-001: Motion Design Principles (Kyle Zantos)
- ADR-002: Observabilidade Full-Stack (4 Provedores)
- ADR-003: Player Architecture - HLS.js + Native MP4 + Iframe Fallback
- ADR-004: State Management - Zustand (Single Store)
- ADR-006: License System - Signed Codes + Device Binding
- ADR-007: Arch Contract - Boundary Validation
- ADR-008: Quality Gates - CI Pipeline
- ADR-009: Android - Capacitor + Native Fragments
- ADR-013: SplashScreen Watchdog + Error Handler Global (Fix tela preta)
- ADR-014: Player Sem Botão de Retry (Estilo YuCine)
- ADR-015: Correção Definitiva da Inicialização do APK e Eliminação do Loop de Tela Preta
- ref_vitest

## God Nodes (most connected - your core abstractions)
1. `useAppStore` - 46 edges
2. `Focusable()` - 41 edges
3. `react` - 39 edges
4. `framer-motion` - 31 edges
5. `lucide-react` - 30 edges
6. `isMobileDevice()` - 29 edges
7. `@noriginmedia/norigin-spatial-navigation` - 24 edges
8. `Home()` - 24 edges
9. `AnimatedRoutes()` - 22 edges
10. `useLicense()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `License Validation (src/hooks/useLicense.ts)` --references--> `PremiumContentGate()`  [INFERRED]
  ARCHITECTURE.md → src/components/PremiumContentGate.tsx
- `Fluxo` --references--> `UpdateModal()`  [INFERRED]
  ARCHITECTURE.md → src/components/UpdateModal.tsx
- `Contexto` --references--> `StreamPlayer()`  [INFERRED]
  DECISIONS.md → src/components/player/StreamPlayer.tsx
- `Consequências` --references--> `ErrorState()`  [INFERRED]
  DECISIONS.md → src/components/ui/ErrorState.tsx
- `Decisão` --references--> `ErrorState()`  [INFERRED]
  DECISIONS.md → src/components/ui/ErrorState.tsx

## Import Cycles
- None detected.

## Communities (74 total, 20 thin omitted)

### Community 0 - "useAppStore"
Cohesion: 0.20
Nodes (19): lucide-react, react, react-router-dom, CATEGORIES_GRID, NAV_LINKS, Focusable(), FocusableProps, HeroBanner() (+11 more)

### Community 1 - "tmdb.ts"
Cohesion: 0.11
Nodes (49): 2.3 CRÍTICO - Performance, LiveTvCarousel(), Carousel, Home(), Movies(), Series(), BANNED_CATALOG_KEYWORDS, buildCacheKey() (+41 more)

### Community 2 - "App.tsx"
Cohesion: 0.07
Nodes (60): 🔗 Arquivos Relacionados, @capacitor/core, AnimatedRoutes(), Anime, App(), Details, Downloads, Favorites (+52 more)

### Community 3 - "useLicense.ts"
Cohesion: 0.10
Nodes (39): LicenseGate(), LicenseGateProps, ActivationValidation, computeActivationChecksum(), fnv1a(), getDeviceId(), getFirstUse(), getStoredLicense() (+31 more)

### Community 4 - "🤖 Instruções para Agentes de IA — CineBG"
Cohesion: 0.06
Nodes (29): 1.1 Criar ou Vincular a Issue no GitHub, 1.2 Isolar em Branch de Trabalho, 1.3 Gerenciar Deploys estritamente por Pull Requests (PRs), 🚨 1. PROTOCOLO MANDATÓRIO DE FLUXO DE TRABALHO (ISSUES & PRs), 🛡️ 4. QUALIDADE E INTEGRIDADE DE CÓDIGO, 🧪 5. TESTES UNITÁRIOS, INTEGRAÇÃO E END-TO-END (E2E), ✅ 6. CRITÉRIO DE ACEITE TÉCNICO, 🧠 7. GRAPHIFY (KNOWLEDGE GRAPH) (+21 more)

### Community 5 - "qa-audit.test.mjs"
Cohesion: 0.07
Nodes (13): files, requiredFiles, ROOT, SRC_DIR, violations, walkFiles(), ROOT, MemoryStorage (+5 more)

### Community 6 - "biome.json"
Cohesion: 0.05
Nodes (36): noSvgWithoutTitle, useButtonType, useKeyWithClickEvents, useMediaCaption, noUnusedVariables, useExhaustiveDependencies, files, ignore (+28 more)

### Community 7 - "src/components/player/StreamPlayer.tsx"
Cohesion: 0.05
Nodes (62): 🔒 SEGURANÇA, Builders de URL (Embeds), `buildMovieUrl()` / `buildShowUrl()`, Filtros & Utilitários, `formatDirectStreamUrl()`, ⚡ Funções Exportadas, `getCachedMegaEmbed()`, `getCanonicalMediaKey()` (+54 more)

### Community 8 - "observability.ts"
Cohesion: 0.12
Nodes (23): 🔭 3. OBSERVABILIDADE FULL-STACK, react-dom, ErrorBoundary, Props, State, activeSpans, addBreadcrumb(), Breadcrumb (+15 more)

### Community 10 - "✅ PROBLEMAS CORRIGIDOS"
Cohesion: 0.09
Nodes (22): 1. **Character Encoding / UTF-8 Corruption** (CRÍTICO - CORRIGIDO), 2. **TypeScript Errors - Focusable.tsx** (CRÍTICO - CORRIGIDO), 3. **Focusable.tsx - TypeError "not callable"** (CRÍTICO - CORRIGIDO), 3. **TypeScript Errors - StreamPlayer.tsx** (CRÍTICO - CORRIGIDO), 4. **Android SDK Setup no CI/CD** (ALTO - CORRIGIDO), 5. **Versão Inconsistente no update.json** (ALTO - CORRIGIDO), 6. **Duplicate Setup Node.js Step** (MÉDIO - CORRIGIDO), 7. **Android SDK Setup no CI/CD** (ALTO - CORRIGIDO) (+14 more)

### Community 11 - "src/types/index.ts"
Cohesion: 0.10
Nodes (38): zustand, useAppUpdate(), Details(), Watch(), buildFileName(), deleteVideo(), downloadsSupported(), downloadVideo() (+30 more)

### Community 12 - "notifications.ts"
Cohesion: 0.16
Nodes (21): 2.2 CRÍTICO - Funcionalidade / Estabilidade, useEpisodeNotifications(), COLORS, EMOJIS, ProfileCard(), Profiles(), checkForNewEpisodes(), daysAgoISO() (+13 more)

### Community 13 - "package.json"
Cohesion: 0.08
Nodes (24): name, private, type, version, autoprefixer, axios, c8, @capacitor/android (+16 more)

### Community 14 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+12 more)

### Community 16 - "Favorites.tsx"
Cohesion: 0.19
Nodes (13): EmptyDownloads(), EmptyFavorites(), EmptyHistory(), EmptyLiveTV(), EmptyMyList(), EmptySearch(), EmptyState(), EmptyStateProps (+5 more)

### Community 17 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, axios, @capacitor/android, @capacitor/app, @capacitor/core, @capacitor/filesystem, @capacitor/haptics, @capacitor/keyboard (+10 more)

### Community 18 - "devDependencies"
Cohesion: 0.09
Nodes (23): devDependencies, autoprefixer, c8, @capacitor/cli, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh (+15 more)

### Community 20 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, build:apk, cap:open, cap:sync, check:knip, dev, lint (+6 more)

### Community 22 - "src/pages/LiveTV.tsx"
Cohesion: 0.12
Nodes (21): @capacitor/status-bar, LivePlayer(), LivePlayerProps, FEATURED_CHANNEL_IDS, LiveTvCarouselProps, YuCineChannelCard(), YuCineChannelCardProps, LiveTV() (+13 more)

### Community 24 - "stryker.config.json"
Cohesion: 0.15
Nodes (12): commandRunner, command, coverageAnalysis, mutate, packageManager, reporters, $schema, testRunner (+4 more)

### Community 25 - "MainActivity"
Cohesion: 0.22
Nodes (5): MainActivity, ADR-016: Eliminação do Bloqueio de Inicialização e Correção de Renderização no Android WebView, Consequências, Contexto, Decisão

### Community 27 - "useSpeechRecognition.ts"
Cohesion: 0.20
Nodes (9): ISpeechRecognitionInstance, IWindowWithSpeech, SpeechRecognitionConstructor, SpeechRecognitionErrorEventLike, SpeechRecognitionEventLike, SpeechRecognitionHook, SpeechRecognitionResultAlternative, SpeechRecognitionResultItem (+1 more)

### Community 28 - "epgCache.ts"
Cohesion: 0.17
Nodes (28): ChannelScheduleSlot, DailyScheduleItem, EPGProgram, formatSlotTitle(), formatTime(), getBrasiliaMinutes(), getChannelDailySchedule(), getLiveChannelEPG() (+20 more)

### Community 30 - "compilerOptions"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, strict, include

### Community 31 - "eslint.config.js"
Cohesion: 0.33
Nodes (5): @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, typescript-eslint

### Community 32 - "bug_fix.md"
Cohesion: 0.33
Nodes (5): 📱 Ambiente de Ocorrência, 🎯 Comportamento Esperado, ✅ Critérios de Aceite, 🐛 Descrição do Problema, 🔄 Passos para Reproduzir

### Community 33 - "PULL_REQUEST_TEMPLATE.md"
Cohesion: 0.33
Nodes (5): 🏷️ Categoria da Mudança, 📝 Descrição do Pull Request, 🔗 Issue(s) Relacionada(s), 📸 Screenshots / Evidências (Opcional), 🧪 Validação e Testes Realizados

### Community 34 - "knip.json"
Cohesion: 0.33
Nodes (5): entry, ignore, ignoreDependencies, project, $schema

### Community 36 - "feature_request.md"
Cohesion: 0.40
Nodes (4): 🎯 Caso de Uso / Motivação, ✅ Critérios de Aceite, 🌟 Descrição da Funcionalidade, 🛠️ Especificação Técnica Preliminar

### Community 37 - "improvement.md"
Cohesion: 0.40
Nodes (4): 📊 Benefícios Esperados, ✅ Critérios de Aceite, 💡 Oportunidade de Melhoria, 🚀 Proposta de Solução

### Community 50 - "Search.tsx"
Cohesion: 0.17
Nodes (24): @noriginmedia/norigin-spatial-navigation, PremiumContentGate(), CarouselProps, ErrorState(), ErrorStateProps, HeroBannerProps, MovieCard, MovieCardProps (+16 more)

### Community 52 - "CineBG Streams API Documentation"
Cohesion: 0.09
Nodes (21): Android Nativo (Capacitor), 🧠 Cache LRU, CineBG Streams API Documentation, ⚙️ Configurações & Constantes, 📦 Espelhos Configurados (MIRRORS), 📝 Exemplo de Uso Completo, 🌐 fetchMegaEmbedSources() — Detalhado, 🛡️ Filtros de Segurança (+13 more)

### Community 57 - "CineBG - Architecture Documentation"
Cohesion: 0.06
Nodes (32): 1. Separação de Camadas (Arch Contract), 2. Motion Design (Kyle Zantos), 3. Observabilidade Full-Stack (4 provedores), Android (ExoPlayer), 📱 Android Specifics, Build Variants, Capacitor + Native, 🚀 CI/CD Pipeline (+24 more)

### Community 58 - "src/utils/motion.ts"
Cohesion: 0.11
Nodes (17): framer-motion, PlaybackSettingsProps, CONTENT_LABEL, PremiumContentGateProps, PremiumContentType, ProgressBarProps, BUTTON_INTERACTIONS, CARD_HOVER_INTERACTION (+9 more)

### Community 73 - "�� CORREÇÕES DEFINITIVAS"
Cohesion: 0.10
Nodes (19): 1.1 Estrutura de Módulos, 1.2 Dependências Externas Críticas, 1.3 Fluxos de Entrada/Saída de Dados, 2.1 CRÍTICO - Segurança, 2.4 CRÍTICO - Qualidade / Código Morto, 2.5 CRÍTICO - Escalabilidade / Banco de Dados, 2.6 CRÍTICO - CI/CD / Deploy, �� AUDITORIA COMPLETA - CineBG (+11 more)

### Community 76 - "CineBG - Task Backlog & Roadmap"
Cohesion: 0.10
Nodes (19): 📋 Backlog Priorizado, 🐛 Bugs Conhecidos (Non-blocking), CineBG - Task Backlog & Roadmap, 📝 Convenções de Task, 🔴 Crítico (Blockers para próxima release), Definition of Done, 🟢 Desejável (Backlog longo), ✅ Done (+11 more)

### Community 82 - "CineBG - Project Status"
Cohesion: 0.12
Nodes (16): 📁 Arquivos Principais Modificados Recentemente, Build & Qualidade, CineBG - Project Status, Correções Críticas (últimas releases - AUDITORIA COMPLETA), Details, ✅ Estado Atual, 🎯 Funcionalidades Implementadas, Home UI (+8 more)

### Community 85 - "dashboard.ts"
Cohesion: 0.13
Nodes (9): ALL_DASHBOARDS, ConditionalFormat, DashboardLayout, DashboardPanel, OTA_HEALTH_DASHBOARD, PLAYER_QOS_DASHBOARD, STREAM_HEALTH_DASHBOARD, SYSTEM_HEALTH_DASHBOARD (+1 more)

### Community 89 - "SkeletonCard.tsx"
Cohesion: 0.36
Nodes (10): ✨ 2. DESIGN & MOTION PRINCIPLES (KYLE ZANTOS), HeroSkeleton(), SkeletonCard(), SkeletonCarousel(), SkeletonDetailPage(), SkeletonLiveTV(), SkeletonLiveTVGrid(), SkeletonMoviesPage() (+2 more)

### Community 97 - "CineBG - Architectural Decisions Log"
Cohesion: 0.22
Nodes (8): ADR-010: StreamPlayer.tsx Encoding Fix (v1.2.67), ADR-011: Documentation as Code, CineBG - Architectural Decisions Log, Consequências, Contexto, Contexto, Decisão, Decisão

### Community 98 - "buffer.ts"
Cohesion: 0.31
Nodes (8): BUFFER_PRESETS, BufferConfig, Connection, ConnectionType, getAdaptiveBufferConfig(), getBufferConfigForHls(), getConnectionType(), useAdaptiveBufferConfig()

### Community 105 - "ADR-005: OTA Updates - Dual APK (Mobile + TV)"
Cohesion: 0.40
Nodes (5): ADR-005: OTA Updates - Dual APK (Mobile + TV), Consequências, Contexto, Decisão, Detecção de pacote instalado (Fix "App não instalado")

### Community 106 - "ADR-012: Capacitor server.url Removido (Fix connection refused)"
Cohesion: 0.40
Nodes (5): ADR-012: Capacitor server.url Removido (Fix connection refused), Consequências, Contexto, Decisão, Manter

### Community 109 - "ADR-001: Motion Design Principles (Kyle Zantos)"
Cohesion: 0.50
Nodes (4): ADR-001: Motion Design Principles (Kyle Zantos), Consequências, Contexto, Decisão

### Community 110 - "ADR-002: Observabilidade Full-Stack (4 Provedores)"
Cohesion: 0.50
Nodes (4): ADR-002: Observabilidade Full-Stack (4 Provedores), Consequências, Contexto, Decisão

### Community 111 - "ADR-003: Player Architecture - HLS.js + Native MP4 + Iframe Fallback"
Cohesion: 0.50
Nodes (4): ADR-003: Player Architecture - HLS.js + Native MP4 + Iframe Fallback, Consequências, Contexto, Decisão

### Community 112 - "ADR-004: State Management - Zustand (Single Store)"
Cohesion: 0.50
Nodes (4): ADR-004: State Management - Zustand (Single Store), Consequências, Contexto, Decisão

### Community 113 - "ADR-006: License System - Signed Codes + Device Binding"
Cohesion: 0.50
Nodes (4): ADR-006: License System - Signed Codes + Device Binding, Consequências, Contexto, Decisão

### Community 114 - "ADR-007: Arch Contract - Boundary Validation"
Cohesion: 0.50
Nodes (4): ADR-007: Arch Contract - Boundary Validation, Consequências, Contexto, Decisão

### Community 115 - "ADR-008: Quality Gates - CI Pipeline"
Cohesion: 0.50
Nodes (4): ADR-008: Quality Gates - CI Pipeline, Consequências, Contexto, Decisão

### Community 116 - "ADR-009: Android - Capacitor + Native Fragments"
Cohesion: 0.50
Nodes (4): ADR-009: Android - Capacitor + Native Fragments, Consequências, Contexto, Decisão

### Community 117 - "ADR-013: SplashScreen Watchdog + Error Handler Global (Fix tela preta)"
Cohesion: 0.50
Nodes (4): ADR-013: SplashScreen Watchdog + Error Handler Global (Fix tela preta), Consequências, Contexto, Decisão

### Community 118 - "ADR-014: Player Sem Botão de Retry (Estilo YuCine)"
Cohesion: 0.50
Nodes (4): ADR-014: Player Sem Botão de Retry (Estilo YuCine), Consequências, Contexto, Decisão

### Community 119 - "ADR-015: Correção Definitiva da Inicialização do APK e Eliminação do Loop de Tela Preta"
Cohesion: 0.50
Nodes (4): ADR-015: Correção Definitiva da Inicialização do APK e Eliminação do Loop de Tela Preta, Consequências, Contexto, Decisão

## Knowledge Gaps
- **15 isolated node(s):** `@capacitor/android`, `@capacitor/haptics`, `@capacitor/keyboard`, `@stryker-mutator/core`, `@stryker-mutator/html-reporter` (+10 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 520 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ADR-015: Correção Definitiva da Inicialização do APK e Eliminação do Loop de Tela Preta` connect `ADR-015: Correção Definitiva da Inicialização do APK e Eliminação do Loop de Tela Preta` to `CineBG - Architectural Decisions Log`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **What connects `@capacitor/android`, `@capacitor/haptics`, `@capacitor/keyboard` to the rest of the system?**
  _15 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `tmdb.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10649350649350649 - nodes in this community are weakly interconnected._
- **Why does `Decisão` connect `ADR-015: Correção Definitiva da Inicialização do APK e Eliminação do Loop de Tela Preta` to `SkeletonCard.tsx`, `App.tsx`, `Search.tsx`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07003129890453834 - nodes in this community are weakly interconnected._
- **Why does `Contexto` connect `ADR-015: Correção Definitiva da Inicialização do APK e Eliminação do Loop de Tela Preta` to `MainActivity`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Should `useLicense.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10077519379844961 - nodes in this community are weakly interconnected._