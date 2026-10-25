# CineBG Streams API Documentation

> **Versão**: v1.2.67  
> **Arquivo principal**: `src/services/streams.ts`  
> **Última atualização**: 2026-10-21

---

## 🎯 Visão Geral

O `streams.ts` é o **motor de streaming nativo estilo YouCine** — zero propagandas, zero anúncios. Prioridade absoluta para extração e reprodução nativa de fontes diretas **MP4** e **HLS** via MegaEmbed, com fallback inteligente e filtros anti-1xBet/CAMRIP.

### Fluxo Principal
```
TMDB ID → resolveMegaEmbed() → fetchMegaEmbedSources() → 
  → Filtro anti-IP-locked (streamtape, 97bf1)
  → Filtro anti-1xBet/CAMRIP
  → Deduplicação canônica
  → Classificação dub/legendado (MP4 > HLS)
  → Cache LRU (TTL 15min, max 50 entradas)
  → Retorno: MegaEmbedResolved { dubbedMp4, hlsProxy, candidates[] }
```

---

## 🔧 Tipos Principais

```typescript
// Opções de áudio
type AudioOption = 'dub' | 'orig' | 'sub'
type Language = 'pt' | 'en' | 'es'

// Espelhos/Provedores de streaming
interface StreamMirror {
  id: string
  name: string
  flagEmoji: string
  quality: string
  type: 'dubbed_br' | 'multi_sub'
  sandboxed: boolean
  getMovieUrl: (tmdbId: number, audio: AudioOption | Language) => string
  getShowUrl: (tmdbId: number, season: number, episode: number, audio: AudioOption | Language) => string
}

// Fonte direta extraída do MegaEmbed
interface DirectCandidate {
  url: string          // URL limpa (HTTPS, sem porta :80)
  kind: 'mp4' | 'hls'  // Tipo de stream
  label: string        // Rótulo amigável (ex: "Opção 1 (Dublado)")
  isDubbedHint: boolean // True se áudio dublado PT-BR detectado
}

// Resultado da resolução MegaEmbed
interface MegaEmbedResolved {
  dubbedMp4: string | null      // Melhor MP4 dublado
  hlsProxy: string | null       // Melhor HLS (multi-áudio/legendado)
  candidates: DirectCandidate[] // Todas as fontes limpas ordenadas
}
```

---

## 📦 Espelhos Configurados (MIRRORS)

| ID | Nome | Tipo | Qualidade | Sandboxed | Uso |
|----|------|------|-----------|-----------|-----|
| `megaembed` | CineBG Dublado (MegaEmbed) | `dubbed_br` | FHD 1080p | false | Prioridade para dublado PT-BR |
| `vidlink` | CineBG Ultra (VidLink Pro) | `multi_sub` | FHD 1080p | false | Fallback multi-áudio/legendas |

### URLs de Embed
```typescript
// Filme
megaembed: https://mgeb.site/embed/{tmdbId}?autoplay=1&ads=0&adblock=1
vidlink:   https://vidlink.pro/movie/{tmdbId}?primaryColor=ef4444&secondaryColor=10b981&sub_lang=pt&autoplay=true&ads=0

// Série
megaembed: https://mgeb.site/embed/{tmdbId}/{season}/{episode}?autoplay=1&ads=0&adblock=1
vidlink:   https://vidlink.pro/tv/{tmdbId}/{season}/{episode}?primaryColor=ef4444&secondaryColor=10b981&sub_lang=pt&autoplay=true&ads=0
```

---

## 🛡️ Filtros de Segurança

### Hosts IP-Locked (Bloqueados)
```typescript
const BROKEN_IP_LOCKED_HOSTS = [
  'streamtape.com',  // get_video retorna text/html no cliente
  '97bf1.com',       // Retorna 404 no cliente
]
```

### Palavras-chave Bloqueadas (1xBet / CAMRIP)
```typescript
const BANNED_AD_STREAM_HINTS = [
  // Apostas
  '1xbet', '1xbt', 'xbet', 'melbet', 'mostbet', 'linebet', 
  'betwinner', 'parimatch', '22bet', 'megapari', '888starz',
  // CAMRIP / Gravações de cinema
  'hdcam', 'camrip', 'cam-rip', 'telesync', 'tsrip', 
  'hdts', 'telecine', 'clean.cam', 'cleancam'
]
```

### Hosts Dublados Confirmados (PT-BR)
```typescript
const DUBBED_HOST_HINTS = [
  'fontedecanais', 'gviudclrb.com', 'mgeb.space/cache/hls',
  '123flmsfree.com', '321moviesfree.com', '123pelicula.com',
  'flixlat.com', 'onfilom.com', 'cuevana4br.com', 'playspelis.com'
]
```

---

## ⚡ Funções Exportadas

### Resolução de Streams

#### `resolveMegaEmbed()`
```typescript
async function resolveMegaEmbed(
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  season = 1,
  episode = 1
): Promise<MegaEmbedResolved>
```
**Descrição**: Função principal — resolve fontes diretas do MegaEmbed com cache LRU (TTL 15min, max 50 entradas).

**Fluxo**:
1. Verifica cache válido (`getValidCachedEntry`)
2. `fetchMegaEmbedSources()` → HTML do MegaEmbed
3. Parse `var sources = [...]` do HTML
4. Filtros: IP-locked → 1xBet/CAMRIP → Deduplicação canônica
5. Classificação: `isDubbedHint` + `kind` (MP4 > HLS)
6. Ordenação: Dublado primeiro → MP4 antes de HLS
7. Cache resultado (`setResolvedCache`)
8. Timeout global: 10s

**Retorno**: `MegaEmbedResolved { dubbedMp4, hlsProxy, candidates[] }`

---

#### `getCachedMegaEmbed()`
```typescript
function getCachedMegaEmbed(
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  season = 1,
  episode = 1
): MegaEmbedResolved | null
```
**Descrição**: Leitura instantânea do cache (0ms) — usado para **Instant Play** no `Watch.tsx`.

---

#### `resolveMegaEmbedDubbedSource()`
```typescript
async function resolveMegaEmbedDubbedSource(
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  season = 1,
  episode = 1
): Promise<string | null>
```
**Descrição**: Helper que retorna apenas o `dubbedMp4` (melhor MP4 dublado).

---

### Builders de URL (Embeds)

#### `buildMovieUrl()` / `buildShowUrl()`
```typescript
function buildMovieUrl(
  tmdbId: number,
  audio: AudioOption | Language = 'dub',
  mirrorId?: string
): string

function buildShowUrl(
  tmdbId: number,
  season: number,
  episode: number,
  audio: AudioOption | Language = 'dub',
  mirrorId?: string
): string
```
**Descrição**: Constrói URLs de embed para iframes (fallback). Usa `normalizeAudio()` para mapear `pt→dub`, `en→orig`.

---

### Utilitários de Espelhos

#### `getInitialMirrorForAudio()`
```typescript
function getInitialMirrorForAudio(audio: AudioOption = 'dub'): string
```
Retorna `'megaembed'` (sempre começa pelo MegaEmbed).

#### `getNextSilentMirrorId()`
```typescript
function getNextSilentMirrorId(currentId: string, audio: AudioOption = 'dub'): string
```
Alternância cíclica silenciosa entre espelhos (sem anúncios):
- `dub`: `megaembed` → `vidlink` → `megaembed`...
- `orig`: `vidlink` → `megaembed` → `vidlink`...

---

### Filtros & Utilitários

#### `isAdOrCamripStream()`
```typescript
function isAdOrCamripStream(value: string | null | undefined): boolean
```
Detecta streams com propaganda 1xBet ou CAMRIP via `BANNED_AD_STREAM_HINTS` + regex `CAMRIP_LABEL_REGEX`.

#### `formatDirectStreamUrl()`
```typescript
function formatDirectStreamUrl(url: string | null): string | null
```
Normaliza: `http://` → `https://`, remove porta `:80`, trim.

#### `getCanonicalMediaKey()`
```typescript
function getCanonicalMediaKey(url: string): string
```
Chave canônica para deduplicação. Para HLS PHP (`/includes/hls.php`), usa `hostname + pathname + ?url=...`.

---

## 🧠 Cache LRU

```typescript
const MAX_RESOLVED_CACHE = 50           // Máximo 50 entradas
const RESOLVED_CACHE_TTL_MS = 15 * 60 * 1000  // 15 minutos
const resolvedSourcesCache = new Map<string, { data: MegaEmbedResolved; timestamp: number }>()
```

**Operações**:
- `getValidCachedEntry(key)`: Retorna dados se não expirou, senão deleta e retorna null
- `setResolvedCache(key, value)`: Insere com LRU eviction (remove mais antiga se ≥ 50)

---

## 🌐 fetchMegaEmbedSources() — Detalhado

### Android Nativo (Capacitor)
```typescript
if (Capacitor.isNativePlatform()) {
  // CapacitorHttp com timeout 8s
  const resp = await Promise.race([
    CapacitorHttp.get({ url, headers, connectTimeout: 8000, readTimeout: 8000 }),
    new Promise(resolve => setTimeout(() => resolve(null), 8500))
  ])
  // Parse: var sources = [...]
}
```

### Web (Vite Proxy / Fetch Direto)
```typescript
const endpoints = [
  window.location.port === '5173' ? `/api/mgeb/embed/${targetPath}` : null,
  targetUrl  // https://mgeb.site/embed/...
].filter(Boolean)

for (const url of endpoints) {
  const res = await fetch(url, { 
    signal: AbortController(5s).signal,
    credentials: 'omit',
    referrerPolicy: 'no-referrer'
  })
  // Parse HTML → var sources = [...]
}
```

**Timeouts**: 8s (Android), 5s (Web). **Headers**: User-Agent Chrome 124, Accept-Language pt-BR.

---

## 🔄 Integração com StreamPlayer

### Fluxo no StreamPlayer.tsx
```typescript
// 1. Pré-carrega na tela de detalhes
useEffect(() => {
  resolveMegaEmbed(tmdbId, type, season, episode)
}, [tmdbId, type, season, episode])

// 2. Instant Play no Watch.tsx
const cached = getCachedMegaEmbed(tmdbId, type, season, episode)
if (cached?.dubbedMp4) {
  // Play imediato 0ms
}

// 3. Auto-fallback HLS → MP4 → Iframe
// HLS: hls.js se Hls.isSupported()
// MP4: <video src={directSrc}>
// Iframe: vidlink/megaembed (último recurso)
```

### Seleção de Áudio
```typescript
const switchAudio = (opt: AudioOption) => {
  if (opt === 'orig') {
    setSubLang('pt'); setSubtitleOption('pt')
    const origIdx = candidates.findIndex(c => !c.isDubbedHint)
    // Play original + legenda PT
  } else {
    setSubLang('off'); setSubtitleOption('off')
    const dubIdx = candidates.findIndex(c => c.isDubbedHint)
    // Play dublado
  }
}
```

---

## ⚙️ Configurações & Constantes

| Constante | Valor | Descrição |
|-----------|-------|-----------|
| `MAX_RESOLVED_CACHE` | 50 | Limite LRU do cache |
| `RESOLVED_CACHE_TTL_MS` | 900000 (15min) | TTL do cache |
| `BROKEN_IP_LOCKED_HOSTS` | `['streamtape.com', '97bf1.com']` | Hosts IP-locked |
| `DUBBED_HOST_HINTS` | 11 hosts | CDNs com áudio PT-BR confirmado |
| `BANNED_AD_STREAM_HINTS` | 21 keywords | Anti-1xBet/CAMRIP |
| `CAPACITOR_HTTP_TIMEOUT` | 8000ms | Timeout Android nativo |
| `WEB_FETCH_TIMEOUT` | 5000ms | Timeout Web |
| `RESOLVE_TIMEOUT` | 10000ms | Timeout global resolve |

---

## 🧪 Testes Relacionados

| Teste | Arquivo | Cobertura |
|-------|---------|-----------|
| `Integridade OTA` | `integrity.test.mjs` | URLs APK, versionCode |
| `Motion Principles` | `integrity.test.mjs` | Tokens motion, skeletons |
| `Observabilidade` | `integrity.test.mjs` | Sentry, Datadog, NR, OTLP |
| `Smart TV Module` | `integrity.test.mjs` | Sandbox, botões mobile |
| `Instant Play` | `integrity.test.mjs` | Cache, hidratação |
| `Performance TV` | `integrity.test.mjs` | RAM, D-Pad, Main Thread |
| `YouCine Fixes` | `integrity.test.mjs` | D-Pad, autoplay, sem trailer |
| `Sinopse YouCine` | `integrity.test.mjs` | Voltar, MovieCard, Hero |
| `Varredura Links` | `integrity.test.mjs` | IP-locked, Hls.isSupported |
| `Separação OTA` | `integrity.test.mjs` | Mobile vs TV, getDeviceFlavor |
| `Persistência OTA` | `integrity.test.mjs` | isVersionNewer, trial, 1xBet |
| `QA Auditoria` | `qa-audit.test.mjs` | 54 testes: POS, NEG, EDGE, LOAD, SEC, REG |
| `Trial System` | `trial.test.mjs` | 3 dias, server-time, clock rollback |

---

## 📝 Exemplo de Uso Completo

```typescript
import { 
  resolveMegaEmbed, 
  getCachedMegaEmbed, 
  buildMovieUrl, 
  getNextSilentMirrorId,
  MIRRORS 
} from '@/services/streams'

// 1. Na tela de detalhes — pré-carrega
const preload = async (tmdbId: number, type: 'movie' | 'tv', season = 1, episode = 1) => {
  const resolved = await resolveMegaEmbed(tmdbId, type, season, episode)
  console.log('Dublado MP4:', resolved.dubbedMp4)
  console.log('HLS Proxy:', resolved.hlsProxy)
  console.log('Todas opções:', resolved.candidates.map(c => `${c.label} [${c.kind}]`))
}

// 2. No Watch.tsx — Instant Play
const playInstant = (tmdbId: number, type: 'movie' | 'tv', season = 1, episode = 1) => {
  const cached = getCachedMegaEmbed(tmdbId, type, season, episode)
  if (cached?.dubbedMp4) {
    return cached.dubbedMp4  // Play 0ms
  }
  // Fallback: await resolveMegaEmbed()
}

// 3. Troca de fonte (botão "Próximo servidor")
const switchSource = (currentMirrorId: string, audio: AudioOption) => {
  const next = getNextSilentMirrorId(currentMirrorId, audio)
  const url = audio === 'dub' 
    ? buildMovieUrl(tmdbId, 'dub', next)
    : buildMovieUrl(tmdbId, 'orig', next)
  return url
}

// 4. Filtro de segurança
import { isAdOrCamripStream, BANNED_AD_STREAM_HINTS } from '@/services/streams'
const isSafe = !isAdOrCamripStream(suspiciousUrl)
```

---

## 🔗 Arquivos Relacionados

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/components/player/StreamPlayer.tsx` | Player principal (HLS.js, MP4, Iframe, auto-fallback) |
| `src/pages/Watch.tsx` | Instant Play via cache |
| `src/pages/Details.tsx` | Pré-carregamento `resolveMegaEmbed` |
| `src/store/useAppStore.ts` | Estado global `audioOption`, `subtitleOption`, `candidatesRef` |
| `src/utils/tv.ts` | `getDeviceFlavor`, `getDeviceUpdateUrl` (OTA Mobile vs TV) |
| `android/app/src/main/java/.../MainActivity.java` | Detecção hardware real, WebView config |
| `android/app/src/main/java/.../AppInstallerPlugin.java` | Instalação APK Mobile vs TV |

---

## 🚀 Roadmap de Melhorias

- [ ] **Adaptive Bitrate**: Seleção automática de qualidade baseada em `navigator.connection.effectiveType`
- [ ] **ETag/If-None-Match**: Cache HTTP condicional para `fetchMegaEmbedSources`
- [ ] **WebWorker HLS**: Reativar `enableWorker: true` quando hls.js suportar Android TV
- [ ] **DRM Support**: Detecção e fallback para streams Widevine/PlayReady
- [ ] **Metrics**: Exportar `stream_resolution_time`, `cache_hit_rate` para observabilidade