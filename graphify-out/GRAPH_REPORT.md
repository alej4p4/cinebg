# Graph Report - cinebg  (2026-11-03)

## Corpus Check
- 120 files · ~445,607 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: .xml 10, (none) 3, .properties 3)

## Summary
- 1218 nodes · 2686 edges · 79 communities (58 shown, 21 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 72 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3ff45381`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- �� CORREÇÕES DEFINITIVAS
- observability.ts
- UpdateModal.tsx
- useLicense.ts
- 🤖 Instruções para Agentes de IA — CineBG
- qa-audit.test.mjs
- biome.json
- useAppStore.ts
- .shouldOverrideUrlLoading
- AppInstallerPlugin.java
- ✅ PROBLEMAS CORRIGIDOS
- tmdb.ts
- StreamPlayer.tsx
- package.json
- compilerOptions
- moviebox.ts
- dependencies
- devDependencies
- ExampleInstrumentedTest.java
- scripts
- Focusable
- subtitles.ts
- lucide-react
- stryker.config.json
- MainActivity
- framer-motion
- useSpeechRecognition.ts
- LiveTV.tsx
- App.tsx
- compilerOptions
- eslint.config.js
- bug_fix.md
- PULL_REQUEST_TEMPLATE.md
- knip.json
- streams.ts
- feature_request.md
- improvement.md
- vite.config.ts
- capacitor.config.ts
- ref_playwright_test
- GenreBadge.tsx
- Favorites.tsx
- buildMovieUrl
- antiRedirect.ts
- resolveMegaEmbed
- Filtros & Utilitários
- CineBG - Architecture Documentation
- ADR-011: Documentation as Code
- CineBG - Task Backlog & Roadmap
- CineBG - Project Status
- Object
- dashboard.ts
- ADR-010: StreamPlayer.tsx Encoding Fix (v1.2.67)
- buffer.ts
- ADR-005: OTA Updates - Dual APK (Mobile + TV)
- ADR-012: Capacitor server.url Removido (Fix connection refused)
- ADR-001: Motion Design Principles (Kyle Zantos)
- ADR-002: Observabilidade Full-Stack (4 Provedores)
- ADR-003: Player Architecture - HLS.js + Native MP4 + Iframe Fallback
- ADR-004: State Management - Zustand (Single Store)
- CineBG - Architectural Decisions Log
- ADR-007: Arch Contract - Boundary Validation
- ADR-008: Quality Gates - CI Pipeline
- ADR-009: Android - Capacitor + Native Fragments
- ADR-013: SplashScreen Watchdog + Error Handler Global (Fix tela preta)
- ADR-014: Player Sem Botão de Retry (Estilo YuCine)
- ref_vitest

## God Nodes (most connected - your core abstractions)
1. `useAppStore` - 44 edges
2. `Focusable()` - 42 edges
3. `react` - 40 edges
4. `isMobileDevice()` - 36 edges
5. `framer-motion` - 32 edges
6. `lucide-react` - 29 edges
7. `StreamPlayer()` - 27 edges
8. `Home()` - 27 edges
9. `@noriginmedia/norigin-spatial-navigation` - 24 edges
10. `AnimatedRoutes()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `🔭 3. OBSERVABILIDADE FULL-STACK` --references--> `ErrorBoundary`  [INFERRED]
  AGENTS.md → src/components/ErrorBoundary.tsx
- `License Validation (src/hooks/useLicense.ts)` --references--> `PremiumContentGate()`  [INFERRED]
  ARCHITECTURE.md → src/components/PremiumContentGate.tsx
- `Fluxo` --references--> `UpdateModal()`  [INFERRED]
  ARCHITECTURE.md → src/components/UpdateModal.tsx
- `Contexto` --references--> `StreamPlayer()`  [INFERRED]
  DECISIONS.md → src/components/player/StreamPlayer.tsx
- `Consequências` --references--> `ErrorState()`  [INFERRED]
  DECISIONS.md → src/components/ui/ErrorState.tsx

## Import Cycles
- None detected.

## Communities (79 total, 21 thin omitted)

### Community 0 - "�� CORREÇÕES DEFINITIVAS"
Cohesion: 0.10
Nodes (19): 1.1 Estrutura de Módulos, 1.2 Dependências Externas Críticas, 1.3 Fluxos de Entrada/Saída de Dados, 2.1 CRÍTICO - Segurança, 2.4 CRÍTICO - Qualidade / Código Morto, 2.5 CRÍTICO - Escalabilidade / Banco de Dados, 2.6 CRÍTICO - CI/CD / Deploy, �� AUDITORIA COMPLETA - CineBG (+11 more)

### Community 1 - "observability.ts"
Cohesion: 0.06
Nodes (55): 2.2 CRÍTICO - Funcionalidade / Estabilidade, @capacitor/local-notifications, react-dom, ErrorBoundary, Props, State, useEpisodeNotifications(), bootLoader (+47 more)

### Community 2 - "UpdateModal.tsx"
Cohesion: 0.09
Nodes (21): Android Nativo (Capacitor), 🧠 Cache LRU, CineBG Streams API Documentation, ⚙️ Configurações & Constantes, 📦 Espelhos Configurados (MIRRORS), 📝 Exemplo de Uso Completo, 🌐 fetchMegaEmbedSources() — Detalhado, 🛡️ Filtros de Segurança (+13 more)

### Community 3 - "useLicense.ts"
Cohesion: 0.09
Nodes (45): qrcode, LicenseGate(), LicenseGateProps, ActivationValidation, computeActivationChecksum(), fnv1a(), getDeviceId(), getEffectiveTrialStart() (+37 more)

### Community 4 - "🤖 Instruções para Agentes de IA — CineBG"
Cohesion: 0.06
Nodes (30): 1.1 Criar ou Vincular a Issue no GitHub, 1.2 Isolar em Branch de Trabalho, 1.3 Gerenciar Deploys estritamente por Pull Requests (PRs), 🚨 1. PROTOCOLO MANDATÓRIO DE FLUXO DE TRABALHO (ISSUES & PRs), 🔭 3. OBSERVABILIDADE FULL-STACK, 🛡️ 4. QUALIDADE E INTEGRIDADE DE CÓDIGO, 🧪 5. TESTES UNITÁRIOS, INTEGRAÇÃO E END-TO-END (E2E), ✅ 6. CRITÉRIO DE ACEITE TÉCNICO (+22 more)

### Community 5 - "qa-audit.test.mjs"
Cohesion: 0.07
Nodes (15): esbuild, files, requiredFiles, ROOT, SRC_DIR, violations, walkFiles(), ROOT (+7 more)

### Community 6 - "biome.json"
Cohesion: 0.05
Nodes (38): noSvgWithoutTitle, useButtonType, useKeyWithClickEvents, useMediaCaption, source, assist, actions, noUnusedVariables (+30 more)

### Community 7 - "useAppStore.ts"
Cohesion: 0.12
Nodes (23): zustand, BOTTOM_NAV_ITEMS, CATEGORIES_GRID, NAV_LINKS, CONTENT_LABEL, PremiumContentGate(), PremiumContentGateProps, PremiumContentType (+15 more)

### Community 8 - ".shouldOverrideUrlLoading"
Cohesion: 0.22
Nodes (5): BridgeWebViewClient, ADR-016: Eliminação do Bloqueio de Inicialização e Correção de Renderização no Android WebView, Consequências, Contexto, Decisão

### Community 10 - "✅ PROBLEMAS CORRIGIDOS"
Cohesion: 0.09
Nodes (22): 1. **Character Encoding / UTF-8 Corruption** (CRÍTICO - CORRIGIDO), 2. **TypeScript Errors - Focusable.tsx** (CRÍTICO - CORRIGIDO), 3. **Focusable.tsx - TypeError "not callable"** (CRÍTICO - CORRIGIDO), 3. **TypeScript Errors - StreamPlayer.tsx** (CRÍTICO - CORRIGIDO), 4. **Android SDK Setup no CI/CD** (ALTO - CORRIGIDO), 5. **Versão Inconsistente no update.json** (ALTO - CORRIGIDO), 6. **Duplicate Setup Node.js Step** (MÉDIO - CORRIGIDO), 7. **Android SDK Setup no CI/CD** (ALTO - CORRIGIDO) (+14 more)

### Community 11 - "tmdb.ts"
Cohesion: 0.06
Nodes (86): ✨ 2. DESIGN & MOTION PRINCIPLES (KYLE ZANTOS), 2.3 CRÍTICO - Performance, Decisão, LiveTvCarousel(), YuCineChannelCard(), Carousel, ProgressBar(), SkeletonCard() (+78 more)

### Community 12 - "StreamPlayer.tsx"
Cohesion: 0.20
Nodes (14): EpisodeSelector(), EpisodeSelectorProps, PlaybackSettingsModal(), ScreenOrientationWithLock, StreamPlayer(), StreamPlayerProps, setActivePlaybackContext(), clearResolvedSourcesCache() (+6 more)

### Community 13 - "package.json"
Cohesion: 0.08
Nodes (25): name, private, type, version, autoprefixer, axios, c8, @capacitor/android (+17 more)

### Community 14 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+12 more)

### Community 16 - "moviebox.ts"
Cohesion: 0.15
Nodes (26): buildCanonicalString(), DEFAULT_CLIENT_INFO, DEFAULT_SECRET_BYTES, ensureMovieBoxSession(), executeRawRequest(), generateXClientToken(), generateXTrSignature(), getMovieBoxDetails() (+18 more)

### Community 17 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, axios, @capacitor/android, @capacitor/app, @capacitor/core, @capacitor/filesystem, @capacitor/haptics, @capacitor/keyboard (+11 more)

### Community 18 - "devDependencies"
Cohesion: 0.08
Nodes (25): devDependencies, autoprefixer, c8, @capacitor/cli, esbuild, eslint, @eslint/js, eslint-plugin-react-hooks (+17 more)

### Community 20 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, build:apk, cap:open, cap:sync, check:knip, dev, lint (+6 more)

### Community 21 - "Focusable"
Cohesion: 0.18
Nodes (23): @noriginmedia/norigin-spatial-navigation, react, Focusable(), FocusableProps, CarouselProps, ErrorState(), ErrorStateProps, MovieCard (+15 more)

### Community 22 - "subtitles.ts"
Cohesion: 0.28
Nodes (8): activeBlobUrls, fetchPortugueseSubtitles(), getImdbId(), imdbIdCache, srtToVtt(), StremioSubtitle, SubtitleTrackOption, tmdb

### Community 23 - "lucide-react"
Cohesion: 0.23
Nodes (11): lucide-react, react-router-dom, PlaybackSettingsProps, LazyImage, LazyImageProps, Downloads(), History(), MyList() (+3 more)

### Community 24 - "stryker.config.json"
Cohesion: 0.14
Nodes (13): commandRunner, command, coverageAnalysis, mutate, packageManager, reporters, $schema, symlinkNodeModules (+5 more)

### Community 26 - "framer-motion"
Cohesion: 0.10
Nodes (26): framer-motion, FEATURED_CHANNEL_IDS, LiveTvCarouselProps, HeroBanner(), HeroBannerProps, ProgressBarProps, HeroSkeleton(), SkeletonEpisodeList() (+18 more)

### Community 27 - "useSpeechRecognition.ts"
Cohesion: 0.20
Nodes (9): ISpeechRecognitionInstance, IWindowWithSpeech, SpeechRecognitionConstructor, SpeechRecognitionErrorEventLike, SpeechRecognitionEventLike, SpeechRecognitionHook, SpeechRecognitionResultAlternative, SpeechRecognitionResultItem (+1 more)

### Community 28 - "LiveTV.tsx"
Cohesion: 0.08
Nodes (48): isClassic43Channel(), LivePlayer(), LivePlayerProps, YuCineChannelCardProps, LiveTV(), ChannelScheduleSlot, DailyScheduleItem, EPGProgram (+40 more)

### Community 29 - "App.tsx"
Cohesion: 0.07
Nodes (56): 🔗 Arquivos Relacionados, @capacitor/core, AnimatedRoutes(), Anime, App(), Details, Downloads, Favorites (+48 more)

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

### Community 35 - "streams.ts"
Cohesion: 0.13
Nodes (14): MovieBoxStreamRelease, BANNED_AD_STREAM_HINTS, BROKEN_IP_LOCKED_HOSTS, DirectCandidate, DUBBED_HOST_HINTS, MEGAEMBED_BASES, MegaEmbedResolved, MegaEmbedSource (+6 more)

### Community 36 - "feature_request.md"
Cohesion: 0.40
Nodes (4): 🎯 Caso de Uso / Motivação, ✅ Critérios de Aceite, 🌟 Descrição da Funcionalidade, 🛠️ Especificação Técnica Preliminar

### Community 37 - "improvement.md"
Cohesion: 0.40
Nodes (4): 📊 Benefícios Esperados, ✅ Critérios de Aceite, 💡 Oportunidade de Melhoria, 🚀 Proposta de Solução

### Community 50 - "Favorites.tsx"
Cohesion: 0.19
Nodes (13): EmptyDownloads(), EmptyFavorites(), EmptyHistory(), EmptyLiveTV(), EmptyMyList(), EmptySearch(), EmptyState(), EmptyStateProps (+5 more)

### Community 51 - "buildMovieUrl"
Cohesion: 0.25
Nodes (11): Builders de URL (Embeds), `buildMovieUrl()` / `buildShowUrl()`, ⚡ Funções Exportadas, `getInitialMirrorForAudio()`, `getNextSilentMirrorId()`, Utilitários de Espelhos, buildMovieUrl(), buildShowUrl() (+3 more)

### Community 52 - "antiRedirect.ts"
Cohesion: 0.52
Nodes (6): 🔒 SEGURANÇA, reportAdInterception(), destroyAntiRedirectShield(), handleBeforeUnload(), initAntiRedirectShield(), setAntiRedirectShieldActive()

### Community 53 - "resolveMegaEmbed"
Cohesion: 0.27
Nodes (11): `getCachedMegaEmbed()`, Resolução de Streams, `resolveMegaEmbed()`, `resolveMegaEmbedDubbedSource()`, fetchMegaEmbedSources(), getCachedMegaEmbed(), getValidCachedEntry(), isPortugueseAudioCandidate() (+3 more)

### Community 54 - "Filtros & Utilitários"
Cohesion: 0.29
Nodes (7): Filtros & Utilitários, `formatDirectStreamUrl()`, `getCanonicalMediaKey()`, `isAdOrCamripStream()`, formatDirectStreamUrl(), getCanonicalMediaKey(), isAdOrCamripStream()

### Community 57 - "CineBG - Architecture Documentation"
Cohesion: 0.06
Nodes (32): 1. Separação de Camadas (Arch Contract), 2. Motion Design (Kyle Zantos), 3. Observabilidade Full-Stack (4 provedores), Android (ExoPlayer), 📱 Android Specifics, Build Variants, Capacitor + Native, 🚀 CI/CD Pipeline (+24 more)

### Community 60 - "ADR-011: Documentation as Code"
Cohesion: 0.67
Nodes (3): ADR-011: Documentation as Code, Contexto, Decisão

### Community 76 - "CineBG - Task Backlog & Roadmap"
Cohesion: 0.10
Nodes (19): 📋 Backlog Priorizado, 🐛 Bugs Conhecidos (Non-blocking), CineBG - Task Backlog & Roadmap, 📝 Convenções de Task, 🔴 Crítico (Blockers para próxima release), Definition of Done, 🟢 Desejável (Backlog longo), ✅ Done (+11 more)

### Community 82 - "CineBG - Project Status"
Cohesion: 0.12
Nodes (16): 📁 Arquivos Principais Modificados Recentemente, Build & Qualidade, CineBG - Project Status, Correções Críticas (últimas releases - AUDITORIA COMPLETA), Details, ✅ Estado Atual, 🎯 Funcionalidades Implementadas, Home UI (+8 more)

### Community 85 - "dashboard.ts"
Cohesion: 0.13
Nodes (9): ALL_DASHBOARDS, ConditionalFormat, DashboardLayout, DashboardPanel, OTA_HEALTH_DASHBOARD, PLAYER_QOS_DASHBOARD, STREAM_HEALTH_DASHBOARD, SYSTEM_HEALTH_DASHBOARD (+1 more)

### Community 97 - "ADR-010: StreamPlayer.tsx Encoding Fix (v1.2.67)"
Cohesion: 0.50
Nodes (4): ADR-010: StreamPlayer.tsx Encoding Fix (v1.2.67), Consequências, Contexto, Decisão

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

### Community 113 - "CineBG - Architectural Decisions Log"
Cohesion: 0.22
Nodes (8): ADR-006: License System - Signed Codes + Device Binding, ADR-015: Correção Definitiva da Inicialização do APK e Eliminação do Loop de Tela Preta, CineBG - Architectural Decisions Log, Consequências, Consequências, Contexto, Contexto, Decisão

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

## Knowledge Gaps
- **16 isolated node(s):** `@capacitor/android`, `@capacitor/haptics`, `@capacitor/keyboard`, `@stryker-mutator/core`, `@stryker-mutator/html-reporter` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 544 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Decisão` connect `tmdb.ts` to `.shouldOverrideUrlLoading`, `CineBG - Architectural Decisions Log`, `App.tsx`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **What connects `@capacitor/android`, `@capacitor/haptics`, `@capacitor/keyboard` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `�� CORREÇÕES DEFINITIVAS` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Why does `ProgressBar()` connect `tmdb.ts` to `framer-motion`, `Focusable`, `LiveTV.tsx`, `App.tsx`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Should `observability.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0567287784679089 - nodes in this community are weakly interconnected._
- **Why does `CineBG - Architectural Decisions Log` connect `CineBG - Architectural Decisions Log` to `ADR-010: StreamPlayer.tsx Encoding Fix (v1.2.67)`, `.shouldOverrideUrlLoading`, `ADR-005: OTA Updates - Dual APK (Mobile + TV)`, `ADR-012: Capacitor server.url Removido (Fix connection refused)`, `ADR-001: Motion Design Principles (Kyle Zantos)`, `ADR-002: Observabilidade Full-Stack (4 Provedores)`, `ADR-003: Player Architecture - HLS.js + Native MP4 + Iframe Fallback`, `ADR-004: State Management - Zustand (Single Store)`, `ADR-007: Arch Contract - Boundary Validation`, `ADR-008: Quality Gates - CI Pipeline`, `ADR-009: Android - Capacitor + Native Fragments`, `ADR-013: SplashScreen Watchdog + Error Handler Global (Fix tela preta)`, `ADR-014: Player Sem Botão de Retry (Estilo YuCine)`, `ADR-011: Documentation as Code`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `UpdateModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._