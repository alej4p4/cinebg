# CineBG - Architecture Documentation

> **Versão**: v1.2.87  
> **Última atualização**: 2026-10-25

---

## 🏗️ Visão Geral da Arquitetura

```
cinebg/
├── src/
│   ├── components/          # Componentes React reutilizáveis
│   │   ├── player/          # StreamPlayer, LivePlayer, EpisodeSelector, PlaybackSettingsModal
│   │   ├── ui/              # Componentes base (Button, Card, Modal, Skeleton, ErrorState, etc.)
│   │   └── Layout/          # Header, Footer, Navigation
│   ├── pages/               # Páginas/telas principais
│   │   ├── Home.tsx         # Home com Hero + Carrosséis
│   │   ├── Movies.tsx       # Lista de filmes
│   │   ├── Series.tsx       # Lista de séries
│   │   ├── Details.tsx      # Detalhes + modais
│   │   ├── LiveTV.tsx       # TV ao vivo + EPG
│   │   ├── Search.tsx       # Busca
│   │   ├── Watch.tsx        # Player page
│   │   └── Settings.tsx     # Configurações
│   ├── hooks/               # Custom hooks
│   │   ├── useLicense.ts    # Gestão de licença/trial
│   │   ├── useAppStore.ts   # Zustand store global
│   │   └── useTV.ts         # Detecção TV/Dispositivo
│   ├── services/            # Serviços e integrações
│   │   ├── observability.ts # Sentry + Datadog + NewRelic + OTLP
│   │   ├── appUpdater.ts    # OTA updates (DownloadManager)
│   │   ├── trial.ts         # Trial period logic
│   │   └── live/            # LiveService, EPG
│   ├── store/               # Zustand stores
│   │   └── useAppStore.ts   # Estado global (audio, subtitle, user, etc.)
│   ├── utils/               # Utilitários puros
│   │   ├── tv.ts            # isTVDevice, isMobileDevice, getDeviceUpdateUrl
│   │   ├── motion.ts        # Tokens de animação (Kyle Zantos)
│   │   └── antiRedirect.ts  # Anti-redirect shield
│   ├── types/               # TypeScript types
│   └── styles/              # CSS/Theme (YouCine)
├── android/                 # Projeto Android (Capacitor)
│   └── app/
│       ├── src/main/java/.../MainActivity.kt
│       └── build.gradle
├── public/
│   └── update.json          # OTA manifest (versão 1.2.87)
├── tests/
│   ├── unit/                # Testes unitários (Node.js --test)
│   └── e2e/                 # Testes E2E (Playwright)
├── scripts/
│   └── arch-contract.mjs    # Validação de fronteiras arquiteturais
├── capacitor.config.ts      # Capacitor config (sem server.url - evita connection refused)
└── Config files: biome.json, tsconfig.json, vite.config.ts, knip.json, stryker.config.json
```

---

## 🔑 Princípios Arquiteturais

### 1. Separação de Camadas (Arch Contract)
```
src/types/          → Não importa camadas superiores
src/components/ui/  → Não importa src/pages/
src/hooks/          → Não importa src/components/ (exceto ui)
src/services/       → Não importa src/components/ nem src/pages/
src/pages/          → Importa tudo (camada superior)
```
**Validação**: `npm run test:arch` (scripts/arch-contract.mjs)

### 2. Motion Design (Kyle Zantos)
- **Skeletons obrigatórios**: Todas as telas (Hero, Carousel, Grid, Details, LiveTV)
- **Lazy Loading**: IntersectionObserver + placeholder shimmer + transição opacity/scale
- **Curvas de animação**: `FLUID_EASE`, `SPRING_SNAPPY`, `SPRING_GENTLE` (src/utils/motion.ts)
- **60fps constante**: Smart TVs e TV Boxes

### 3. Observabilidade Full-Stack (4 provedores)
| Provedor | Uso |
|----------|-----|
| **Sentry** | ErrorBoundary React, window.onerror, unhandledrejection |
| **Datadog (RUM + Logs)** | User interactions, routes, session metrics, structured logs |
| **New Relic** | Custom events: stream_start, stream_switch, stream_error, WebView/Android TV perf |
| **OpenTelemetry (OTLP)** | Distributed tracing, traceId/spanId (W3C), TMDB API, stream resolution, live channels |

---

## 🎬 Player Architecture

### StreamPlayer.tsx (Web)
```
┌─────────────────────────────────────────────────────────┐
│  StreamPlayer (React Component)                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  HLS (m3u8) │  │  MP4 Direct │  │  Iframe Fallback │  │
│  │  hls.js     │  │  <video>    │  │  (Vidlink/Mega)  │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
│         │                │                   │            │
│         └────────────────┼───────────────────┘            │
│                          ▼                                │
│              ┌─────────────────────┐                      │
│              │  selectCorrectAudioTrack()                │
│              │  attemptPlay()        │                      │
│              │  Auto-fallback logic  │                      │
│              └─────────────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

**Fluxo de reprodução**:
1. `candidatesRef` → lista de fontes (MP4/HLS/Iframe)
2. `switchAudio('dub'|'orig')` → seleciona fonte + define `audioOption`/`subtitleOption`
3. `directSrc` + `directKind` → dispara `useEffect` HLS ou MP4 nativo
4. `attemptPlay()` → garante `video.muted=false`, `volume=1.0`, seleciona faixa correta
5. Auto-fallback: muted→unmute → iframe se falhar (sem botão de retry, estilo YuCine)
6. Error handler global (`main.tsx`): captura erros de rede e recarrega a página

### Android (ExoPlayer)
- `StreamPlayerFragment.kt` → MediaSession + MediaController
- Cache: `CacheDataSource` + `SimpleCache`
- Auto-fallback nativo entre fontes

---

## 📦 State Management (Zustand)

### useAppStore.ts - Estado Global
```typescript
interface AppState {
  // UI
  isTV: boolean
  isMobile: boolean
  showHud: boolean
  
  // Playback
  audioOption: 'dub' | 'orig' | 'sub'
  subtitleOption: 'off' | 'pt' | 'en'
  speed: number
  subSize: 'sm'|'md'|'lg'|'xl'
  subColor: 'yellow'|'white'|'cyan'|'green'
  subBg: 'solid'|'box'|'transparent'
  
  // User/License
  user: UserProfile | null
  isPremium: boolean
  trialEndsAt: number | null
  
  // Actions
  setAudioOption, setSubtitleOption, setSpeed, etc.
}
```

**Persistência**: localStorage (chaves: `cinebg_subs_size`, `cinebg_subs_color`, `cinebg_subs_bg`, `cinebg_audio`, `cinebg_subtitle`)

---

## 🔄 OTA Update System

### Web → Android
```
public/update.json
{
  "version": "1.2.73",
  "downloadUrl": "https://github.com/alej4p4/cinebg/releases/download/v1.2.74/CineBG-Tv-release.apk",
  "downloadUrlTv": "...CineBG-Tv-release.apk",
  "downloadUrlMobile": "...CineBG-Mobile-release.apk",
  "tvUrl": "...CineBG-Tv-release.apk",
  "mobileUrl": "...CineBG-Mobile-release.apk",
  "mandatory": false
}
```

### Fluxo
1. App inicia → `appUpdater.checkForUpdates()`
2. Baixa `update.json` → compara versão
3. Se novo → `DownloadManager` baixa APK em background
4. `UpdateModal` aparece → auto-dismiss após install
5. `SpatialNav.reinit()` após update

### Detecção de Pacote (Fix "App não instalado")
O `AppInstallerPlugin.java` detecta o package name realmente instalado (`com.barrasoft.cinebg` vs `com.barrasoft.cinebg.tv`) e escolhe o APK correto, evitando erro "App não instalado" por mismatch de package name.

### Importante: `capacitor.config.ts`
- **NÃO definir `server.url`**: faria o WebView Android tentar conectar a `http://localhost` dentro do dispositivo (porta 80 inexistente) → `connection refused`
- Assets locais (`dist/`) são carregados automaticamente pelo Capacitor de `android/app/src/main/assets/public/`

---

## 🎯 Device Detection

### src/utils/tv.ts
Detecta dispositivo (mobile vs TV) via:
1. Ponte nativa Android (`CineBGNative` bridge)
2. User-Agent (DeviceType/Mobile, DeviceType/TV)
3. User-Agent dedicado (Android TV, FireTV, etc.)
4. Touch screen + tamanho de tela
5. `localStorage` (modo TV forçado)

**Uso**: Condiciona UI (botões mobile vs D-Pad), player (hls.js vs ExoPlayer), download OTA (Mobile vs TV APK)

---

## 🛡️ Security & License

### Trial System (src/services/trial.ts)
- **3 dias / 72 horas** a partir do primeiro uso
- **Server-time validation** (NTP) → evita clock manipulation
- **Persistência**: `lastKnownServerTime` + `trialStartTs`
- **Anti-cheat**: Clock rollback detection, armazenamento corrompido

### License Validation (src/hooks/useLicense.ts)
- **Signed codes** (HMAC-SHA256)
- **Device binding** (deviceId no checksum)
- **Anti-sharing**: código de um aparelho não funciona em outro
- **Plans**: 30d, 90d, 365d, lifetime
- **Premium gate**: `PremiumContentGate` component

---

## 📱 Android Specifics

### Capacitor + Native
- `MainActivity.kt` → Capacitor entry, deep links, OTA install, `clearCache(true)` no WebView
- `StreamPlayerFragment.kt` → ExoPlayer + MediaSession + Cache
- `LiveTVFragment.kt` → ExoPlayer live + EPG
- `DetailsFragment.kt` → Modais nativos (elenco, episódios)

### Build Variants
| Variant | ApplicationId | VersionCode | Features |
|---------|---------------|-------------|----------|
| `mobile` | `com.cinebg.mobile` | 70 | Touch UI, Mobile player |
| `tv` | `com.cinebg.tv` | 70 | D-Pad, Leanback, ExoPlayer |

---

## 🧪 Testing Strategy

| Tipo | Tool | Comando | Cobertura |
|------|------|---------|-----------|
| Unit/Integration | Node.js --test | `npm run test:unit` | 54 testes |
| Arch Contract | Custom (arch-contract.mjs) | `npm run test:arch` | 67 módulos |
| E2E | Playwright | `npm run test:e2e` | Fluxos críticos D-Pad |
| Mutation | Stryker | `npm run test:mutation` | Eficácia dos testes |
| Dead Code | Knip | `npm run knip` | Unused exports/deps |

---

## 📦 Dependencies Principais

### Runtime
- `react`, `react-dom`, `react-router-dom`
- `zustand` (state)
- `hls.js` (HLS streaming) - **chunk isolado no Vite**
- `@capacitor/app`, `@capacitor/core` (Android bridge)

### Dev/Quality
- `biome` (lint + format)
- `typescript` (type check)
- `vite` (build)
- `knip` (dead code)
- `stryker` (mutation testing)
- `commitlint` (conventional commits)

---

## 🚀 CI/CD Pipeline

### .github/workflows/
- `ci-quality.yml` → Lint + TypeScript + Arch + Unit Tests + Knip
- `release.yml` → Build web + Android (Mobile + TV) + Create Release + Upload APKs

### Release Process
1. Push tag `vX.Y.Z` → Release workflow disparam automaticamente
2. Build web → `dist/`
3. Build Android → `CineBG-Mobile-release.apk` + `CineBG-Tv-release.apk`
4. GitHub Release criado automaticamente com ambos os APKs
5. `update.json` deve ser atualizado manualmente para a nova versão para notificar usuários

### Secrets necessários no GitHub Actions
- `KEYSTORE_BASE64` — keystore assinada codificada em base64
- `KEYSTORE_PASSWORD` — senha do keystore
- `KEY_ALIAS` — alias da chave
- `KEY_PASSWORD` — senha da chave

**Nota**: Se `KEYSTORE_BASE64` não estiver configurado, o workflow gera uma keystore nova automaticamente (fallback), mas isso invalida atualizações de APKs anteriores (assinatura diferente).
