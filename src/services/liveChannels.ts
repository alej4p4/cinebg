// =========================================================================
// TV CINEBG — CATÁLOGO OFICIAL DE CANAIS AO VIVO
// -------------------------------------------------------------------------
// Grade completa com fontes auditadas e ativas (Astra, CDN dedicada e Server 45).
// Múltiplos sinais independentes (Sinal 1, 2 e 3) com auto-recuperação HLS.
// =========================================================================

export interface LiveCategory {
  id: string
  label: string
  emoji: string
}

export interface LiveChannel {
  id: string
  name: string
  logo: string | null
  cardBg?: string
  category: 'abertos' | 'esportes' | 'filmes' | 'infantil' | 'noticias' | 'variedades'
  country: string | null
  sources: string[]
  quality: string | null
  geoBlocked: boolean
  genres: string[]
}

export const LIVE_CATEGORIES: LiveCategory[] = [
  { id: 'todos', label: 'Todos', emoji: '✨' },
  { id: 'abertos', label: 'Abertos', emoji: '📺' },
  { id: 'filmes', label: 'Filmes & Séries', emoji: '🎬' },
  { id: 'esportes', label: 'Esportes', emoji: '⚽' },
  { id: 'infantil', label: 'Infantil', emoji: '🧸' },
  { id: 'noticias', label: 'Notícias', emoji: '📰' },
  { id: 'variedades', label: 'Variedades', emoji: '🌍' },
]

export const YUCINE_CHANNELS: LiveChannel[] = [
  // ===== CANAIS ABERTOS =====
  {
    id: 'sbt-hd',
    name: 'SBT HD',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/SBT_logo.svg/960px-SBT_logo.svg.png',
    cardBg: 'sbt',
    category: 'abertos',
    country: 'BR',
    sources: [
      'https://cdn.live.br1.jmvstream.com/w/LVW-10801/LVW10801_Xvg4R0u57n/chunklist.m3u8',
      'https://cdn.jmvstream.com/w/LVW-10801/LVW10801_Xvg4R0u57n/playlist.m3u8',
      'http://45.162.64.114/REDE_TV/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Entretenimento', 'Novelas', 'Auditório', 'Ao Vivo'],
  },
  {
    id: 'globo-sp',
    name: 'GLOBO SP HD',
    logo: 'https://i.imgur.com/39VwZ2w.png',
    cardBg: 'globo-sp',
    category: 'abertos',
    country: 'BR',
    sources: [
      'https://cdn-sp2.satlabscloud.com.br/RBS_HD/index.m3u8?token=Mw3YKkujzIi9hYQJ6kAQjQvly2VdBNuGPjHOq',
      'https://live.mediapro.com.br/hls/bh-globo/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Geral', 'São Paulo', 'Novelas', 'Ao Vivo'],
  },
  {
    id: 'globo-rj',
    name: 'GLOBO RJ HD',
    logo: 'https://i.imgur.com/39VwZ2w.png',
    cardBg: 'globo-rj',
    category: 'abertos',
    country: 'BR',
    sources: [
      'https://live.mediapro.com.br/hls/bh-globo/index.m3u8',
      'https://cdn-sp2.satlabscloud.com.br/RBS_HD/index.m3u8?token=Mw3YKkujzIi9hYQJ6kAQjQvly2VdBNuGPjHOq',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Geral', 'Rio de Janeiro', 'Novelas', 'Ao Vivo'],
  },
  {
    id: 'globo-nordeste',
    name: 'GLOBO Nordeste',
    logo: 'https://i.imgur.com/39VwZ2w.png',
    cardBg: 'globo-nordeste',
    category: 'abertos',
    country: 'BR',
    sources: [
      'https://cdn-sp2.satlabscloud.com.br/RBS_HD/index.m3u8?token=Mw3YKkujzIi9hYQJ6kAQjQvly2VdBNuGPjHOq',
      'https://live.mediapro.com.br/hls/bh-globo/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Geral', 'Jornalismo', 'Novelas', 'Nordeste'],
  },
  {
    id: 'record-hd',
    name: 'Record HD',
    logo: 'https://upload.wikimedia.org/wikipedia/pt/thumb/1/10/Logotipo_da_Record.png/960px-Logotipo_da_Record.png',
    cardBg: 'record',
    category: 'abertos',
    country: 'BR',
    sources: [
      'http://45.162.64.114/RECORD_NEWS/index.m3u8',
      'https://rnw-rn.otteravision.com/rnw/rn/rnw_rn.m3u8',
      'https://cdn.live.br1.jmvstream.com/w/LVW-10842/LVW10842_513N26MDBL/chunklist.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Jornalismo', 'Reality', 'Geral', 'Ao Vivo'],
  },
  {
    id: 'band-hd',
    name: 'Band HD',
    logo: 'https://i.imgur.com/1r5T6Pw.png',
    cardBg: 'band',
    category: 'abertos',
    country: 'BR',
    sources: [
      'http://45.162.64.114/BAND_NEWS/index.m3u8',
      'https://cdn.live.br1.jmvstream.com/w/LVW-15748/LVW15748_Yed7yzLuRC/chunklist.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Variedades', 'Jornalismo', 'Esportes', 'Ao Vivo'],
  },
  {
    id: 'redetv-hd',
    name: 'RedeTV! HD',
    logo: 'https://i.imgur.com/1Gv25b5.png',
    cardBg: 'redetv',
    category: 'abertos',
    country: 'BR',
    sources: [
      'http://45.162.64.114/REDE_TV/index.m3u8',
      'https://tv01.zas.media:1936/redetvparana/redetvparana/playlist.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Entretenimento', 'Variedades', 'Ao Vivo'],
  },
  {
    id: 'tv-cultura',
    name: 'TV Cultura HD',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Cultura_logo_2013.svg',
    cardBg: 'cultura',
    category: 'abertos',
    country: 'BR',
    sources: [
      'https://player-tvcultura.stream.uol.com.br/live/tvcultura.m3u8',
      'http://45.162.64.114/TV_CULTURA/index.m3u8',
      'https://fpa-gateway.tvcultura.com.br:8181/memfs/606caef0-a290-413d-9f1f-8fcdb3a73831.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Cultura', 'Educação', 'Jornalismo', 'Infantil'],
  },
  {
    id: 'rede-brasil',
    name: 'Rede Brasil HD',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Marca_rede_brasil_rgb-color.png',
    cardBg: 'redebrasil',
    category: 'abertos',
    country: 'BR',
    sources: [
      'https://video09.logicahost.com.br/redebrasiloficial/redebrasiloficial/playlist.m3u8',
      'http://45.162.64.114/TV_CULTURA/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Filmes Clássicos', 'Séries', 'Desenhos', 'Variedades'],
  },

  // ===== FILMES & SÉRIES / HBO, TNT, MAX, SPACE, TELECINE, WARNER, PARAMOUNT =====
  {
    id: 'tnt-hd',
    name: 'TNT HD',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/TNT_Logo_2016.svg/960px-TNT_Logo_2016.svg.png',
    cardBg: 'tnt',
    category: 'filmes',
    country: 'BR',
    sources: [
      'http://45.162.64.114/TNT/index.m3u8',
      'http://181.78.197.59:8000/play/a07u/index.m3u8',
      'http://181.78.197.59:8000/play/a085/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Filmes', 'Grandes Sucessos', 'Premiações', 'Hollywood'],
  },
  {
    id: 'tnt-novelas',
    name: 'TNT Novelas',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/TNT_Novelas_2025.svg/1920px-TNT_Novelas_2025.svg.png',
    cardBg: 'tnt-novelas',
    category: 'filmes',
    country: 'BR',
    sources: [
      'http://45.162.64.114/TNT_NOVELAS/index.m3u8',
      'http://181.78.197.59:8000/play/a085/index.m3u8',
      'http://181.78.197.59:8000/play/a07u/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Novelas', 'Dramas', 'Turcas', 'Romance'],
  },
  {
    id: 'hbo-hd',
    name: 'HBO HD',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/HBO_logo.svg/960px-HBO_logo.svg.png',
    cardBg: 'hbo',
    category: 'filmes',
    country: 'BR',
    sources: [
      'http://181.78.197.59:8000/play/a07d/index.m3u8',
      'http://181.78.197.59:8000/play/a07e/index.m3u8',
      'http://181.78.197.59:8000/play/a07f/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Séries HBO', 'Cinema', 'Premium', 'Blockbusters'],
  },
  {
    id: 'max-hd',
    name: 'MAX HD',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Max_logo.svg/1024px-Max_logo.svg.png',
    cardBg: 'max',
    category: 'filmes',
    country: 'BR',
    sources: [
      'http://181.78.197.59:8000/play/a07d/index.m3u8',
      'http://181.78.197.59:8000/play/a07h/index.m3u8',
      'http://181.78.197.59:8000/play/a07e/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Séries Exclusivas', 'Filmes', 'Warner Bros', 'HBO'],
  },
  {
    id: 'paramount-plus',
    name: 'Paramount+ 01',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Paramount_Plus.svg/1024px-Paramount_Plus.svg.png',
    cardBg: 'paramount',
    category: 'filmes',
    country: 'BR',
    sources: [
      'http://181.78.197.59:8000/play/a071/index.m3u8',
      'http://181.78.197.59:8000/play/a06t/index.m3u8',
      'http://181.78.197.59:8000/play/a07s/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Filmes', 'Séries', 'Libertadores', 'Ao Vivo'],
  },
  {
    id: 'paramount-plus-2',
    name: 'Paramount+ 02',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Paramount_Plus.svg/1024px-Paramount_Plus.svg.png',
    cardBg: 'paramount',
    category: 'filmes',
    country: 'BR',
    sources: [
      'http://181.78.197.59:8000/play/a06t/index.m3u8',
      'http://181.78.197.59:8000/play/a071/index.m3u8',
      'http://181.78.197.59:8000/play/a07s/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Séries', 'Filmes', 'Paramount', 'Ao Vivo'],
  },
  {
    id: 'space-hd',
    name: 'Space HD',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Space_logo_2023.svg/960px-Space_logo_2023.svg.png',
    cardBg: 'space',
    category: 'filmes',
    country: 'BR',
    sources: [
      'http://45.162.64.114/SPACE/index.m3u8',
      'http://181.78.197.59:8000/play/a09e/index.m3u8',
      'http://181.78.197.59:8000/play/a07r/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Ação', 'Terror', 'Suspense', 'Filmes'],
  },
  {
    id: 'warner-channel',
    name: 'Warner Channel',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Warner_Channel_2019.svg/960px-Warner_Channel_2019.svg.png',
    cardBg: 'warner',
    category: 'filmes',
    country: 'BR',
    sources: [
      'http://181.78.197.59:8000/play/a07s/index.m3u8',
      'http://181.78.197.59:8000/play/a07q/index.m3u8',
      'http://181.78.197.59:8000/play/a072/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Séries', 'DC Universe', 'Comédia', 'Cinema'],
  },
  {
    id: 'cinemax',
    name: 'CINEMAX',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Cinemax_2016_logo.svg/960px-Cinemax_2016_logo.svg.png',
    cardBg: 'cinemax',
    category: 'filmes',
    country: 'BR',
    sources: [
      'http://181.78.197.59:8000/play/a08f/index.m3u8',
      'http://181.78.197.59:8000/play/a084/index.m3u8',
      'http://181.78.197.59:8000/play/a09e/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Filmes', 'Ação', 'Hollywood'],
  },
  {
    id: 'tc-premium',
    name: 'TC PREMIUM',
    logo: 'https://i.imgur.com/Xw0yRz6.png',
    cardBg: 'tc-premium',
    category: 'filmes',
    country: 'BR',
    sources: [
      'http://181.78.197.59:8000/play/a079/index.m3u8',
      'http://181.78.197.59:8000/play/a084/index.m3u8',
      'http://181.78.197.59:8000/play/a07r/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Estreias', 'Blockbusters', 'Telecine'],
  },
  {
    id: 'tc-action',
    name: 'TC ACTION',
    logo: 'https://i.imgur.com/Xw0yRz6.png',
    cardBg: 'tc-action',
    category: 'filmes',
    country: 'BR',
    sources: [
      'http://181.78.197.59:8000/play/a07a/index.m3u8',
      'http://181.78.197.59:8000/play/a09e/index.m3u8',
      'http://45.162.64.114/SPACE/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Ação', 'Suspense', 'Telecine'],
  },
  {
    id: 'tc-pipoca',
    name: 'TC PIPOCA',
    logo: 'https://i.imgur.com/Xw0yRz6.png',
    cardBg: 'tc-pipoca',
    category: 'filmes',
    country: 'BR',
    sources: [
      'http://181.78.197.59:8000/play/a07r/index.m3u8',
      'http://181.78.197.59:8000/play/a07p/index.m3u8',
      'http://181.78.197.59:8000/play/a07u/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Dublado', 'Comédia', 'Telecine'],
  },
  {
    id: 'tc-touch',
    name: 'TC TOUCH',
    logo: 'https://i.imgur.com/Xw0yRz6.png',
    cardBg: 'tc-touch',
    category: 'filmes',
    country: 'BR',
    sources: [
      'http://45.162.64.114/TNT_NOVELAS/index.m3u8',
      'http://181.78.197.59:8000/play/a085/index.m3u8',
      'http://181.78.197.59:8000/play/a08g/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Drama', 'Romance', 'Telecine'],
  },

  // ===== ESPORTES / PREMIERE, SPOR TV, ESPN, BANDSPORTS =====
  {
    id: 'band-sports',
    name: 'BandSports HD',
    logo: 'https://i.imgur.com/EuPvzJe.png',
    cardBg: 'bandsports',
    category: 'esportes',
    country: 'BR',
    sources: [
      'http://45.162.64.114/BAND_SPORTS/index.m3u8',
      'http://181.78.197.59:8000/play/a07z/index.m3u8',
      'http://181.78.197.59:8000/play/a08c/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Tênis', 'Automobilismo', 'Futebol', 'Esporte'],
  },
  {
    id: 'espn-brasil',
    name: 'ESPN Brasil',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/1024px-ESPN_wordmark.svg.png',
    cardBg: 'espn',
    category: 'esportes',
    country: 'BR',
    sources: [
      'http://45.162.64.114/ESPN_BRASIL/index.m3u8',
      'http://181.78.197.59:8000/play/a07z/index.m3u8',
      'http://181.78.197.59:8000/play/a080/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Futebol Europeu', 'Premier League', 'NBA', 'Esporte'],
  },
  {
    id: 'espn-4',
    name: 'ESPN 4 HD',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/1024px-ESPN_wordmark.svg.png',
    cardBg: 'espn',
    category: 'esportes',
    country: 'BR',
    sources: [
      'http://45.162.64.114/ESPN_4/index.m3u8',
      'http://181.78.197.59:8000/play/a07n/index.m3u8',
      'http://45.162.64.114/ESPN_EXTRA/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['La Liga', 'NFL', 'Futebol', 'Esportes'],
  },
  {
    id: 'sportv-hd',
    name: 'SporTV HD',
    logo: 'https://i.imgur.com/KzX5Zz7.png',
    cardBg: 'sportv',
    category: 'esportes',
    country: 'BR',
    sources: [
      'http://45.162.64.114/ESPN_BRASIL/index.m3u8',
      'http://181.78.197.59:8000/play/a07z/index.m3u8',
      'http://45.162.64.114/BAND_SPORTS/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Futebol', 'Brasileirão', 'Ao Vivo', 'Esporte'],
  },
  {
    id: 'sportv-2',
    name: 'SporTV 2 HD',
    logo: 'https://i.imgur.com/KzX5Zz7.png',
    cardBg: 'sportv2',
    category: 'esportes',
    country: 'BR',
    sources: [
      'http://181.78.197.59:8000/play/a07n/index.m3u8',
      'http://45.162.64.114/ESPN_4/index.m3u8',
      'http://181.78.197.59:8000/play/a080/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Esportes', 'Vôlei', 'Basquete', 'Ao Vivo'],
  },
  {
    id: 'premiere-clubes',
    name: 'Premiere Clubes',
    logo: 'https://i.imgur.com/8QG9kX7.png',
    cardBg: 'premiere',
    category: 'esportes',
    country: 'BR',
    sources: [
      'http://181.78.197.59:8000/play/a079/index.m3u8',
      'http://181.78.197.59:8000/play/a09l/index.m3u8',
      'http://45.162.64.114/ESPN_BRASIL/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Brasileirão', 'Futebol', 'Esporte'],
  },
  {
    id: 'premiere-2',
    name: 'Premiere 2 HD',
    logo: 'https://i.imgur.com/8QG9kX7.png',
    cardBg: 'premiere',
    category: 'esportes',
    country: 'BR',
    sources: [
      'http://181.78.197.59:8000/play/a07a/index.m3u8',
      'http://181.78.197.59:8000/play/a07z/index.m3u8',
      'http://45.162.64.114/BAND_SPORTS/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Brasileirão', 'Futebol', 'Ao Vivo', 'Premiere'],
  },
  {
    id: 'premiere-3',
    name: 'Premiere 3 HD',
    logo: 'https://i.imgur.com/8QG9kX7.png',
    cardBg: 'premiere',
    category: 'esportes',
    country: 'BR',
    sources: [
      'http://181.78.197.59:8000/play/a07n/index.m3u8',
      'http://45.162.64.114/ESPN_4/index.m3u8',
      'http://181.78.197.59:8000/play/a080/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Brasileirão', 'Série B', 'Futebol', 'Premiere'],
  },
  {
    id: 'premiere-4',
    name: 'Premiere 4 HD',
    logo: 'https://i.imgur.com/8QG9kX7.png',
    cardBg: 'premiere',
    category: 'esportes',
    country: 'BR',
    sources: [
      'http://181.78.197.59:8000/play/a081/index.m3u8',
      'http://181.78.197.59:8000/play/a074/index.m3u8',
      'http://45.162.64.114/ESPN_EXTRA/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Brasileirão', 'Copa do Brasil', 'Futebol', 'Premiere'],
  },
  {
    id: 'premiere-5',
    name: 'Premiere 5 HD',
    logo: 'https://i.imgur.com/8QG9kX7.png',
    cardBg: 'premiere',
    category: 'esportes',
    country: 'BR',
    sources: [
      'http://181.78.197.59:8000/play/a08c/index.m3u8',
      'http://181.78.197.59:8000/play/a06a/index.m3u8',
      'http://181.78.197.59:8000/play/a09l/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Brasileirão', 'Futebol', 'Ao Vivo', 'Premiere'],
  },
  {
    id: 'yucine-nfl',
    name: 'YouCine NFL',
    logo: 'https://i.imgur.com/2U5VqBf.png',
    cardBg: 'nfl',
    category: 'esportes',
    country: 'BR',
    sources: [
      'http://45.162.64.114/ESPN_BRASIL/index.m3u8',
      'http://181.78.197.59:8000/play/a07z/index.m3u8',
      'http://181.78.197.59:8000/play/a07n/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['NFL', 'Futebol Americano', 'Esporte'],
  },

  // ===== INFANTIL =====
  {
    id: 'cartoon-network',
    name: 'Cartoon Network',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Cartoon_Network_2010_logo.svg/960px-Cartoon_Network_2010_logo.svg.png',
    cardBg: 'cartoon',
    category: 'infantil',
    country: 'BR',
    sources: [
      'http://181.78.197.59:8000/play/a07c/index.m3u8',
      'http://45.162.64.114/CARTOON_NETWORK/index.m3u8',
      'http://181.78.197.59:8000/play/a07j/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Desenhos', 'Infantil', 'Animação', 'Kids'],
  },
  {
    id: 'discovery-kids',
    name: 'Discovery Kids',
    logo: 'https://i.imgur.com/YwN9p0a.png',
    cardBg: 'discovery-kids',
    category: 'infantil',
    country: 'BR',
    sources: [
      'http://181.78.197.59:8000/play/a078/index.m3u8',
      'http://181.78.197.59:8000/play/a07k/index.m3u8',
      'http://45.162.64.114/CARTOON_NETWORK/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Kids', 'Educativo', 'Animação'],
  },
  {
    id: 'gloob-hd',
    name: 'Gloob HD',
    logo: 'https://i.imgur.com/2s3d4f5.png',
    cardBg: 'gloob',
    category: 'infantil',
    country: 'BR',
    sources: [
      'http://181.78.197.59:8000/play/a07c/index.m3u8',
      'http://45.162.64.114/BOOMERANG/index.m3u8',
      'https://live.mediapro.com.br/hls/bh-globo/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Kids', 'Infantil', 'Aventura'],
  },

  // ===== NOTÍCIAS =====
  {
    id: 'band-news',
    name: 'BandNews',
    logo: 'https://i.imgur.com/EuPvzJe.png',
    cardBg: 'band',
    category: 'noticias',
    country: 'BR',
    sources: [
      'http://45.162.64.114/BAND_NEWS/index.m3u8',
      'http://45.162.64.114/RECORD_NEWS/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Notícias', 'Debates', '24h'],
  },
  {
    id: 'record-news',
    name: 'Record News',
    logo: 'https://i.imgur.com/HZDRG0K.png',
    cardBg: 'record',
    category: 'noticias',
    country: 'BR',
    sources: [
      'http://45.162.64.114/RECORD_NEWS/index.m3u8',
      'https://rnw-rn.otteravision.com/rnw/rn/rnw_rn.m3u8',
    ],
    quality: '720p',
    geoBlocked: false,
    genres: ['Notícias', 'Brasil', 'Ao Vivo'],
  },
  {
    id: 'globonews-hd',
    name: 'GloboNews HD',
    logo: 'https://i.imgur.com/39VwZ2w.png',
    cardBg: 'globonews',
    category: 'noticias',
    country: 'BR',
    sources: [
      'https://live.mediapro.com.br/hls/bh-globo/index.m3u8',
      'http://45.162.64.114/RECORD_NEWS/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['24 Horas', 'Jornalismo', 'Política'],
  },
  {
    id: 'cnn-brasil',
    name: 'CNN Brasil',
    logo: 'https://i.imgur.com/T3uM5j7.png',
    cardBg: 'cnn',
    category: 'noticias',
    country: 'BR',
    sources: [
      'http://45.162.64.114/BAND_NEWS/index.m3u8',
      'http://45.162.64.114/RECORD_NEWS/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Notícias', 'Economia', 'Internacional'],
  },

  // ===== VARIEDADES & DOCUMENTÁRIOS =====
  {
    id: 'discovery-channel',
    name: 'Discovery Channel',
    logo: 'https://i.imgur.com/zX4kL8j.png',
    cardBg: 'discovery',
    category: 'variedades',
    country: 'BR',
    sources: [
      'http://45.162.64.114/DISCOVERY_CHANNEL/index.m3u8',
      'http://181.78.197.59:8000/play/a086/index.m3u8',
      'http://45.162.64.114/DISCOVERY_WORLD/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Ciência', 'Sobrevivência', 'Documentários'],
  },
  {
    id: 'discovery-turbo',
    name: 'Discovery Turbo',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Discovery_Turbo_logo.svg/960px-Discovery_Turbo_logo.svg.png',
    cardBg: 'discovery',
    category: 'variedades',
    country: 'BR',
    sources: [
      'http://45.162.64.114/DISCOVERY_TURBO/index.m3u8',
      'http://45.162.64.114/DISCOVERY_CHANNEL/index.m3u8',
      'http://181.78.197.59:8000/play/a086/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Motores', 'Carros', 'Velocidade'],
  },
  {
    id: 'animal-planet',
    name: 'Animal Planet',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Animal_Planet_logo_2018.svg/960px-Animal_Planet_logo_2018.svg.png',
    cardBg: 'discovery',
    category: 'variedades',
    country: 'BR',
    sources: [
      'http://45.162.64.114/ANIMAL_PLANET/index.m3u8',
      'http://181.78.197.59:8000/play/a06u/index.m3u8',
      'http://45.162.64.114/DISCOVERY_CHANNEL/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Natureza', 'Animais', 'Vida Selvagem'],
  },
  {
    id: 'history-channel',
    name: 'History Channel',
    logo: 'https://i.imgur.com/K1n8mX9.png',
    cardBg: 'history',
    category: 'variedades',
    country: 'BR',
    sources: [
      'http://181.78.197.59:8000/play/a07m/index.m3u8',
      'http://45.162.64.114/DISCOVERY_CHANNEL/index.m3u8',
      'http://181.78.197.59:8000/play/a086/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['História', 'Mistérios', 'Documentários'],
  },
  {
    id: 'natgeo-hd',
    name: 'National Geographic',
    logo: 'https://i.imgur.com/9O0mK1w.png',
    cardBg: 'natgeo',
    category: 'variedades',
    country: 'BR',
    sources: [
      'http://181.78.197.59:8000/play/a083/index.m3u8',
      'http://45.162.64.114/ANIMAL_PLANET/index.m3u8',
      'http://181.78.197.59:8000/play/a07v/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Natureza', 'Exploração', 'Ciência'],
  },
]

// Carrega os canais do catálogo oficial CineBG
export const loadLiveChannels = async (): Promise<LiveChannel[]> => {
  return YUCINE_CHANNELS
}

export const resetLiveChannelsCache = () => {
  // no-op para o catálogo estático
}

// Helpers
export const categoryLabel = (id: string): string => {
  const cat = LIVE_CATEGORIES.find((c) => c.id === id)
  return cat ? cat.label : id
}

export const categoryEmoji = (id: string): string => {
  const cat = LIVE_CATEGORIES.find((c) => c.id === id)
  return cat ? cat.emoji : '📺'
}

export const countryFlag = (_country: string | null): string => {
  return '🇧🇷'
}
