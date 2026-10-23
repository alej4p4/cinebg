# CineBG - Architectural Decisions Log

> **Formato**: ADR (Architecture Decision Records)  
> **Versão**: v1.2.86  
> **Última atualização**: 2026-10-23

---

## ADR-001: Motion Design Principles (Kyle Zantos)

**Status**: Accepted  
**Data**: 2024-01-15

### Contexto
Interface precisa ser fluida em Smart TVs/TV Boxes (hardware limitado), sem spinners isolados ou telas vazias durante carregamento.

### Decisão
- **Skeletons obrigatórios** em TODAS as telas: Hero, Carousel, Grid, Details, LiveTV, Search
- **Lazy Loading** com IntersectionObserver + placeholder shimmer + transição opacity/scale
- **Tokens de animação centralizados** em `src/utils/motion.ts`:
  - `FLUID_EASE` — transições suaves gerais
  - `SPRING_SNAPPY` — entrada/saída de modais, botões
  - `SPRING_GENTLE` — skeletons, progress bars
- **60fps constante** — prioridade sobre features visuais complexas

### Consequências
- Mais código boilerplate para skeletons
- Bundle size ligeiramente maior (motion tokens)
- UX consistente e profissional em todos os dispositivos

---

## ADR-002: Observabilidade Full-Stack (4 Provedores)

**Status**: Accepted  
**Data**: 2024-02-10

### Contexto
Precisa rastrear erros, performance, user behavior e distributed tracing em produção across web + Android.

### Decisão
Instrumentação unificada em `src/services/observability.ts` cobrindo:

| Provedor | Responsabilidade |
|----------|------------------|
| **Sentry** | ErrorBoundary React, window.onerror, unhandledrejection |
| **Datadog RUM + Logs** | User interactions, routes, session metrics, structured logs |
| **New Relic** | Custom events: `stream_start`, `stream_switch`, `stream_error`, WebView/Android TV perf |
| **OpenTelemetry (OTLP)** | Distributed tracing, W3C Trace Context, TMDB API calls, stream resolution, live channels |

### Consequências
- Overhead de ~15KB no bundle (tree-shaking ajuda)
- Configuração complexa inicial
- Visibilidade completa de ponta a ponta

---

## ADR-003: Player Architecture - HLS.js + Native MP4 + Iframe Fallback

**Status**: Accepted  
**Data**: 2024-03-01

### Contexto
Streams vêm em múltiplos formatos (HLS/m3u8, MP4 direto, Iframe embeds). Android TV WebView tem bugs com `canPlayType` retornando `'maybe'` mas falhando em URLs `.php/redirects`.

### Decisão
**Prioridade de reprodução**:
1. **HLS.js** se `Hls.isSupported()` → `hls.loadSource()` + `hls.attachMedia(video)`
2. **MP4 nativo** se `video.canPlayType('video/mp4')` → `<video src={directSrc}>`
3. **Iframe fallback** (Vidlink/MegaEmbed) → último recurso

**Auto-fallback logic** em `attemptPlay()`:
```typescript
video.muted = false; video.volume = 1.0;
selectCorrectAudioTrack(video);
video.play().catch(() => {
  // Fallback: muted=true → play() → setTimeout(unmute, 100ms)
  // Último recurso: showFeedback('Toque para ativar áudio')
});
```

### Consequências
- Lógica complexa de fallback
- hls.js isolado em chunk próprio no Vite (`hls-DCy42zGF.js` ~594KB)
- Funciona consistentemente em Android TV, Fire TV, WebOS, Tizen

---

## ADR-004: State Management - Zustand (Single Store)

**Status**: Accepted  
**Data**: 2024-01-20

### Contexto
Estado global: UI (HUD, device), Playback (audio, subtitle, speed), User/License, Settings.

### Decisão
**Single Zustand store** (`src/store/useAppStore.ts`) com:
- **Persistência seletiva** via localStorage (apenas settings de playback)
- **Actions tipadas** para cada domínio
- **Seletores derivados** para computed values
- **Middleware** para devtools + persistência

**Não usa**: Redux (boilerplate), Context API (re-renders), Jotai/Recoil (overkill).

### Consequências
- Bundle pequeno (~1KB)
- TypeScript inference excelente
- Fácil testing (store.getState(), store.setState())

---

## ADR-005: OTA Updates - Dual APK (Mobile + TV)

**Status**: Accepted  
**Data**: 2024-04-15

### Contexto
Android requer APKs separados para Mobile (touch) e TV (D-Pad/Leanback). Version codes devem ser sincronizados.

### Decisão
**Manifest único** (`public/update.json`):
```json
{
  "version": "1.2.73",
  "downloadUrl": "...CineBG-Tv-release.apk",
  "downloadUrlTv": "...CineBG-Tv-release.apk",
  "downloadUrlMobile": "...CineBG-Mobile-release.apk",
  "tvUrl": "...CineBG-Tv-release.apk",
  "mobileUrl": "...CineBG-Mobile-release.apk",
  "mandatory": false
}
```

**Build variants** no `android/app/build.gradle`:
- `mobile` → `applicationIdSuffix ".mobile"` + touch UI
- `tv` → `applicationIdSuffix ".tv"` + Leanback + D-Pad

**Detecção de update vs install**:
```kotlin
val installed = pm.getPackageInfo(packageName, 0)
val isUpdate = installed.versionCode < newVersionCode
```

### Detecção de pacote instalado (Fix "App não instalado")
O `AppInstallerPlugin.java` lê `context.getPackageName()` e escolhe o sabor do APK (mobile/tv) baseado no que está realmente instalado, evitando mismatch de package name.

### Consequências
- Dois APKs por release (~50MB cada)
- Version code único sincronizado
- DownloadManager nativo Android para background download
- Primeira atualização após mudança de keystore pode requerer desinstalação manual

---

## ADR-006: License System - Signed Codes + Device Binding

**Status**: Accepted  
**Data**: 2024-05-10

### Contexto
Sistema premium precisa: anti-sharing, anti-clock-manipulation, offline-capable, remote-revokable.

### Decisão
**Códigos assinados (HMAC-SHA256)**:
```
code = base64(planId + days + deviceId + timestamp + hmac(secret))
```

**Validação**:
1. Parse + verify HMAC
2. Check deviceId match (anti-sharing)
3. Check planId válido
4. Check expiry (server-time validated)
5. Persist license local + audit log

**Trial System** (3 dias):
- Server-time (NTP) como referência
- `lastKnownServerTime` persistido localmente
- Clock rollback detection → não estende trial
- Armazenamento corrompido → recovery graceful

### Consequências
- Requer clock sincronizado (NTP) no primeiro uso
- Código único por dispositivo
- Complexidade criptográfica (auditada via testes SEC-*)

---

## ADR-007: Arch Contract - Boundary Validation

**Status**: Accepted  
**Data**: 2024-06-01

### Contexto
Evitar dependências circulares e vazamento de camadas (types → hooks → services → components → pages).

### Decisão
**Script customizado** (`scripts/arch-contract.mjs`) valida:
- `src/types/` → não importa nada acima
- `src/components/ui/` → não importa `src/pages/`, `src/hooks/`, `src/services/`
- `src/hooks/` → não importa `src/components/` (exceto ui), `src/pages/`
- `src/services/` → não importa `src/components/`, `src/pages/`, `src/hooks/`
- `src/pages/` → pode importar tudo (top layer)
- **Zero dependências circulares**

**Execução**: `npm run test:arch` no CI (pré-requisito para PR)

### Consequências
- Força disciplina de imports
- Detecta regressões arquiteturais cedo
- Script simples (Node.js nativo, sem deps extras)

---

## ADR-008: Quality Gates - CI Pipeline

**Status**: Accepted  
**Data**: 2024-06-15

### Contexto
Garantir qualidade antes de merge/deploy. Critério: **nada merge sem CI verde**.

### Decisão
**Pipeline obrigatório** (`.github/workflows/ci-quality.yml`):
```bash
npm run test:arch    # Arch contract
npm run test:unit    # 54 testes
npm run build        # tsc + vite build (exit code 0)
```

**Ferramentas configuradas**:
| Tool | Config | Purpose |
|------|--------|---------|
| Biome | `biome.json` | Format + lint + import organization |
| Commitlint | `commitlint.config.js` | Conventional Commits |
| Knip | `knip.json` | Dead code / unused deps |
| Stryker | `stryker.config.json` | Mutation testing |
| Codecov | `codecov.yml` | Coverage reports |

### Consequências
- CI ~3-5 min
- Bloqueia merges quebrados
- Métricas de cobertura no PR

---

## ADR-009: Android - Capacitor + Native Fragments

**Status**: Accepted  
**Data**: 2024-07-01

### Contexto
Web app precisa rodar nativamente Android com ExoPlayer, MediaSession, OTA install.

### Decisão
**Capacitor como bridge** + **Native Fragments** para features críticas:
- `MainActivity.kt` → Capacitor entry + deep links + OTA install + `webView.clearCache(true)` no onCreate
- `StreamPlayerFragment.kt` → ExoPlayer + MediaSession + Cache
- `LiveTVFragment.kt` → ExoPlayer Live + EPG
- `DetailsFragment.kt` → Modais nativos (elenco, episódios)

**WebView** carrega `dist/` buildado pelo Vite. Comunicação via `@capacitor/app` + JS bridge.

### Consequências
- Dois codebases parciais (web + Kotlin fragments)
- Build Android requer Gradle + Capacitor sync
- Performance nativa para player/TV

---

## ADR-010: StreamPlayer.tsx Encoding Fix (v1.2.67)

**Status**: Accepted  
**Data**: 2026-10-21

### Contexto
Arquivo `StreamPlayer.tsx` tinha múltiplos problemas de encoding impedindo lint/build:
- Comentários `#` (inválido em TSX)
- UTF-8 duplamente codificado (comentários portugueses corrompidos)
- Chave de fechamento faltando no `if (video.paused)`
- `catch {}` com sintaxe incorreta
- Dependências `useCallback` ausentes

### Decisão
**Refatoração cirúrgica** preservando lógica:
1. `#` → `//` em todos os comentários
2. Fix UTF-8: `vdeo`→`vídeo`, `no`→`não`, `udio`→`áudio`, `FORA`→`FORÇA`, `ltimo`→`último`, `posião`→`posição`
3. Adicionar `    }` antes de `    }, []);` para fechar `if (video.paused)`
4. Corrigir `catch {}` (remover `}` extra)
5. `;` após `handleIframeLoad`
6. `desiredAudio` → `_desiredAudio`
7. `useCallback` deps: `[selectCorrectAudioTrack, showFeedback]`

### Consequências
- Lint + TypeScript + Build passam
- Lógica de autoplay/áudio/legenda preservada
- Zero mudança comportamental

---

## ADR-011: Documentation as Code

**Status**: Accepted  
**Data**: 2026-10-21

### Contexto
Agentes IA e devs precisam contexto rápido do projeto sem reler todo código/histórico.

### Decisão
**4 arquivos markdown versionados** no root:
| Arquivo | Propósito | Audiência |
|---------|-----------|-----------|
| `PROJECT_STATUS.md` | Estado atual, release, próximos passos | Todos (quick overview) |
| `ARCHITECTURE.md` | Arquitetura detalhada, data flow, tech stack | Devs, IA agents |
| `DECISIONS.md` | ADRs com contexto/decisão/consequência | Devs, IA agents, auditors |
| `TASKS.md` | Backlog priorizado, blockers, done | PM, Devs, IA agents |

**Regra**: Atualizar junto com PRs que mudam arquitetura/decisões.

---

## ADR-012: Capacitor server.url Removido (Fix connection refused)

**Status**: Accepted  
**Data**: 2026-10-23  
**Issue**: #248

### Contexto
A correção ADR-013 adicionou `server.url: 'http://localhost'` no `capacitor.config.ts` para forçar carregamento de assets locais. Isso fez o WebView Android tentar conectar a um servidor rodando **dentro do dispositivo** na porta 80 (que não existe), causando `connection refused` e tela branca/preta ao abrir o APK.

### Decisão
**Remover `server.url` completamente** do `capacitor.config.ts`. Para assets locais (`dist/`) empacotados no APK via Capacitor, o WebView carrega automaticamente de `android/app/src/main/assets/public/` sem necessidade de URL base.

### Manter
- `androidScheme: 'http'` — permite carregamento via scheme http local
- `cleartext: true` — permite tráfego claro (necessário para assets locais em algumas versões Android)
- `allowNavigation: ['localhost', 'cinebg://*']` — restringe navegação de topo

### Consequências
- WebView carrega assets locais corretamente sem erro de conexão
- Funciona em Wi-Fi e dados móveis (3G/4G)
- Sem dependência de servidor externo para carregamento inicial

---

## ADR-013: SplashScreen Watchdog + Error Handler Global (Fix tela preta)

**Status**: Accepted  
**Data**: 2026-10-22  
**Issues**: #244, #246

### Contexto
O app ficava em tela preta após instalação/atualização, especialmente em redes móveis instáveis (3G/4C). Causas:
1. `handleSplashComplete` não executado → `showSplash` permanecia `true` para sempre
2. Erros de rede não capturados → tela branca/preta silenciosa
3. Cache do WebView antigo após atualização de APK → conteúdo desatualizado/corrompido

### Decisão
Três camadas de correção:

**1. Watchdog do SplashScreen** (`src/App.tsx`):
- `setTimeout(() => setShowSplash(false), 3500)` garante que o splash sempre suma
- Mesmo se `handleSplashComplete` falhar, o app não fica travado

**2. Error handler global** (`src/main.tsx`):
- Captura `window.addEventListener('error', ...)` e `unhandledrejection`
- Detecta erros de rede (`Failed to load`, `net::`, `ChunkLoadError`)
- Recarrega a página automaticamente após 1 segundo

**3. ErrorState com retry** (`src/App.tsx`):
- Estado `appError` exibe `ErrorState` com mensagem em português
- Botão "Tentar novamente" chama `window.location.reload()`

**4. Limpeza de cache WebView** (`MainActivity.kt`):
- `webView.clearCache(true)` e `clearHistory()` a cada inicialização
- Evita conteúdo antigo após atualização de APK

### Consequências
- App nunca fica travado em tela preta/branca
- Recuperação automática em erros de rede transitórios
- Feedback claro ao usuário quando falha persistente

---

## ADR-014: Player Sem Botão de Retry (Estilo YuCine)

**Status**: Accepted  
**Data**: 2026-10-22  
**Issue**: #240

### Contexto
O `StreamPlayer` expunha botão "Tentar fontes diretas novamente" ao usuário, diferentemente do YuCine que simplesmente tenta tocar automaticamente.

### Decisão
Remover botões de retry e lógica de refetch forçado. O player:
1. Tenta fontes diretas automaticamente
2. Faz fallback entre espelhos em segundo plano
3. Mostra erro limpo apenas se nada funcionar

### Consequências
- UX mais limpa, igual ao YuCine
- Menos interação necessária do usuário
- Erro final exibe `ErrorState` genérico sem opção de retry específico
