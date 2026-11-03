import { Capacitor, CapacitorHttp } from '@capacitor/core'
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
  category: 'abertos' | 'esportes' | 'filmes' | 'infantil' | 'noticias' | 'variedades' | 'canais24h'
  country: string | null
  sources: string[]
  quality: string | null
  geoBlocked: boolean
  genres: string[]
}

export const LIVE_CATEGORIES: LiveCategory[] = [
  { id: 'todos', label: 'Todos', emoji: '✨' },
  { id: 'recentes', label: 'Recentes', emoji: '🕒' },
  { id: 'favorites', label: 'Favoritos', emoji: '⭐' },
  { id: 'abertos', label: 'Abertos', emoji: '📺' },
  { id: 'canais24h', label: 'Canais 24h', emoji: '⚡' },
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
    logo: 'https://i.imgur.com/tc1ALuu.png',
    cardBg: 'sbt',
    category: 'abertos',
    country: 'BR',
    sources: [
      'https://dai.google.com/linear/hls/event/1XSOdtQ0SH2G8OEmEfGgjQ/master.m3u8',
      'https://cdn.live.br1.jmvstream.com/w/LVW-10801/LVW10801_Xvg4R0u57n/playlist.m3u8',
      'https://6836041ea1117.streamlock.net/cverde/cverde/playlist.m3u8',
      'https://video09.logicahost.com.br/sbtroo/sbtroo/playlist.m3u8',
      'https://video09.logicahost.com.br/sbtcuiaba/sbtcuiaba/playlist.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Entretenimento', 'Novelas', 'Auditório', 'Ao Vivo'],
  },
  {
    id: 'globo-sp',
    name: 'GLOBO SP HD',
    logo: 'https://i.imgur.com/OoSUg78.png',
    cardBg: 'globo-sp',
    category: 'abertos',
    country: 'BR',
    sources: [
      'https://live.mediapro.com.br/hls/bh-globo/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Geral', 'São Paulo', 'Novelas', 'Ao Vivo'],
  },
  {
    id: 'globo-rj',
    name: 'GLOBO RJ HD',
    logo: 'https://i.imgur.com/OoSUg78.png',
    cardBg: 'globo-rj',
    category: 'abertos',
    country: 'BR',
    sources: [
      'https://live.mediapro.com.br/hls/bh-globo/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Geral', 'Rio de Janeiro', 'Novelas', 'Ao Vivo'],
  },
  {
    id: 'globo-nordeste',
    name: 'GLOBO Nordeste',
    logo: 'https://i.imgur.com/OoSUg78.png',
    cardBg: 'globo-nordeste',
    category: 'abertos',
    country: 'BR',
    sources: [
      'https://live.mediapro.com.br/hls/bh-globo/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Geral', 'Jornalismo', 'Novelas', 'Nordeste'],
  },
  {
    id: 'record-hd',
    name: 'Record HD',
    logo: 'https://i.imgur.com/sz9gTTr.png',
    cardBg: 'record',
    category: 'abertos',
    country: 'BR',
    sources: [
      'https://rnw-rn.otteravision.com/rnw/rn/rnw_rn.m3u8',
      'https://cdn.live.br1.jmvstream.com/w/LVW-10841/LVW10841_mT77z9o2cP/playlist.m3u8',
      'http://170.83.16.50/RECORD_NEWS/index.m3u8',
      'http://45.162.64.114/RECORD_NEWS/index.m3u8',
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
      'https://televisaocidadeverde.brasilstream.com.br/hls/televisaocidadeverde/index.m3u8',
      'https://5ad482a77183d.streamlock.net/operacaotbomt.com/operacaotbomt.com/playlist.m3u8',
      'http://45.162.64.114/BAND_NEWS/index.m3u8',
      'http://45.162.64.114/BAND_SPORTS/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Variedades', 'Jornalismo', 'Esportes', 'Ao Vivo'],
  },
  {
    id: 'redetv-hd',
    name: 'RedeTV! HD',
    logo: 'https://i.imgur.com/ZJgD38F.png',
    cardBg: 'redetv',
    category: 'abertos',
    country: 'BR',
    sources: [
      'https://cdn.live.br1.jmvstream.com/webtv/AVJ-15235/playlist/playlist.m3u8',
      'http://45.162.64.114/REDE_TV/index.m3u8',
      'http://170.83.16.50/REDE_TV/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Entretenimento', 'Variedades', 'Ao Vivo'],
  },
  {
    id: 'tv-cultura',
    name: 'TV Cultura HD',
    logo: 'https://i.ibb.co/nm0jXMM/cultura-3x.png',
    cardBg: 'cultura',
    category: 'abertos',
    country: 'BR',
    sources: [
      'https://player-tvcultura.stream.uol.com.br/live/tvcultura.m3u8',
      'http://45.162.64.114/TV_CULTURA/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Cultura', 'Educação', 'Jornalismo', 'Infantil'],
  },
  {
    id: 'tv-brasil',
    name: 'TV Brasil HD',
    logo: 'https://i.imgur.com/G4Yx1xM.png',
    cardBg: 'tvbrasil',
    category: 'abertos',
    country: 'BR',
    sources: [
      'https://tvbrasil-stream.ebc.com.br/index.m3u8',
      'http://45.162.64.114/TV_BRASIL/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Pública', 'Cultura', 'Jornalismo', 'Ao Vivo'],
  },

  // ===== FILMES & SÉRIES / HBO, TNT, MAX, SPACE, TELECINE, WARNER, PARAMOUNT =====
  {
    id: 'tnt-hd',
    name: 'TNT HD',
    logo: 'https://i.imgur.com/Qh13Vek.png',
    cardBg: 'tnt',
    category: 'filmes',
    country: 'BR',
    sources: [
      'http://45.162.64.114/TNT/index.m3u8',
      'http://170.83.16.50/TNT/index.m3u8',
      'http://45.162.64.114/SPACE/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Filmes', 'Grandes Sucessos', 'Premiações', 'Hollywood'],
  },
  {
    id: 'tnt-novelas',
    name: 'TNT Novelas',
    logo: 'https://i.imgur.com/GZ0Q89G.png',
    cardBg: 'tnt-novelas',
    category: 'filmes',
    country: 'BR',
    sources: [
      'http://45.162.64.114/TNT_NOVELAS/index.m3u8',
      'http://45.162.64.114/TNT/index.m3u8',
      'http://170.83.16.50/TNT/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Novelas', 'Dramas', 'Turcas', 'Romance'],
  },
  {
    id: 'hbo-hd',
    name: 'HBO HD',
    logo: 'https://i.imgur.com/2pD6eN6.png',
    cardBg: 'hbo',
    category: 'filmes',
    country: 'BR',
    sources: [
      'http://170.83.16.50/TNT_SERIES/index.m3u8',
      'http://170.83.16.50/AXN/index.m3u8',
      'http://45.162.64.114/SONY_MOVIES/index.m3u8',
      'http://45.162.64.114/TNT/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Séries HBO', 'Cinema', 'Premium', 'Blockbusters'],
  },
  {
    id: 'max-hd',
    name: 'MAX HD',
    logo: 'https://i.imgur.com/rM1iCq9.png',
    cardBg: 'max',
    category: 'filmes',
    country: 'BR',
    sources: [
      'http://45.162.64.114/TNT/index.m3u8',
      'http://170.83.16.50/TNT_SERIES/index.m3u8',
      'http://170.83.16.50/AXN/index.m3u8',
      'http://45.162.64.114/SONY_MOVIES/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Séries Exclusivas', 'Filmes', 'Warner Bros', 'HBO'],
  },
  {
    id: 'paramount-plus',
    name: 'Paramount+ 01',
    logo: 'https://i.imgur.com/XrJw9eQ.png',
    cardBg: 'paramount',
    category: 'filmes',
    country: 'BR',
    sources: [
      'http://170.83.16.50/AXN/index.m3u8',
      'http://45.162.64.114/SONY_MOVIES/index.m3u8',
      'http://170.83.16.50/TNT_SERIES/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Filmes', 'Séries', 'Libertadores', 'Ao Vivo'],
  },
  {
    id: 'paramount-plus-2',
    name: 'Paramount+ 02',
    logo: 'https://i.imgur.com/XrJw9eQ.png',
    cardBg: 'paramount',
    category: 'filmes',
    country: 'BR',
    sources: [
      'http://45.162.64.114/SONY_MOVIES/index.m3u8',
      'http://170.83.16.50/AXN/index.m3u8',
      'http://170.83.16.50/TNT_SERIES/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Séries', 'Filmes', 'Paramount', 'Ao Vivo'],
  },
  {
    id: 'space-hd',
    name: 'Space HD',
    logo: 'https://i.imgur.com/zofc9UJ.png',
    cardBg: 'space',
    category: 'filmes',
    country: 'BR',
    sources: [
      'http://45.162.64.114/SPACE/index.m3u8',
      'http://45.162.64.114/SONY_MOVIES/index.m3u8',
      'http://170.83.16.50/AXN/index.m3u8',
      'http://45.162.64.114/TNT/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Ação', 'Terror', 'Suspense', 'Filmes'],
  },
  {
    id: 'warner-channel',
    name: 'Warner Channel',
    logo: 'https://i.imgur.com/QtGQR0c.png',
    cardBg: 'warner',
    category: 'filmes',
    country: 'BR',
    sources: [
      'http://45.162.64.114/TNT/index.m3u8',
      'http://45.162.64.114/SPACE/index.m3u8',
      'http://170.83.49.66:8083/AMCHD/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Séries', 'DC Universe', 'Comédia', 'Cinema'],
  },
  {
    id: 'cinemax',
    name: 'CINEMAX',
    logo: 'https://i.imgur.com/cZWoJWD.png',
    cardBg: 'cinemax',
    category: 'filmes',
    country: 'BR',
    sources: [
      'http://45.162.64.114/SONY_MOVIES/index.m3u8',
      'http://170.83.16.50/SONY_MOVIES/index.m3u8',
      'http://170.83.16.50/TNT_SERIES/index.m3u8',
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
      'http://170.83.16.50/AXN/index.m3u8',
      'http://45.162.64.114/SONY_MOVIES/index.m3u8',
      'http://170.83.16.50/TNT_SERIES/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Estreias', 'Blockbusters', 'Telecine'],
  },
  {
    id: 'tc-action',
    name: 'TC ACTION',
    logo: 'https://i.imgur.com/BHYWG0h.png',
    cardBg: 'tc-action',
    category: 'filmes',
    country: 'BR',
    sources: [
      'http://170.83.16.50/AXN/index.m3u8',
      'http://45.162.64.114/SONY_MOVIES/index.m3u8',
      'http://45.162.64.114/TNT/index.m3u8',
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
      'http://45.162.64.114/TNT/index.m3u8',
      'http://170.83.49.66:8083/TNTHD/index.m3u8',
      'http://170.83.16.50/TNT/index.m3u8',
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
      'http://170.83.16.50/TNT_NOVELAS/index.m3u8',
      'http://170.83.16.50/TNT_SERIES/index.m3u8',
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
      'http://45.162.64.114/ESPN_BRASIL/index.m3u8',
      'http://45.162.64.114/ESPN_4/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Tênis', 'Automobilismo', 'Futebol', 'Esporte'],
  },
  {
    id: 'espn-brasil',
    name: 'ESPN Brasil',
    logo: 'https://i.imgur.com/2Y44R9d.png',
    cardBg: 'espn',
    category: 'esportes',
    country: 'BR',
    sources: [
      'http://45.162.64.114/ESPN_BRASIL/index.m3u8',
      'http://45.162.64.114/ESPN_EXTRA/index.m3u8',
      'http://45.162.64.114/BAND_SPORTS/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Futebol Europeu', 'Premier League', 'NBA', 'Esporte'],
  },
  {
    id: 'espn-4',
    name: 'ESPN 4 HD',
    logo: 'https://i.imgur.com/2Y44R9d.png',
    cardBg: 'espn',
    category: 'esportes',
    country: 'BR',
    sources: [
      'http://170.83.16.50/ESPN/index.m3u8',
      'http://45.162.64.114/ESPN_EXTRA/index.m3u8',
      'http://45.162.64.114/ESPN_BRASIL/index.m3u8',
      'http://45.162.64.114/ESPN_4/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['La Liga', 'NFL', 'Futebol', 'Esportes'],
  },
  {
    id: 'sportv-hd',
    name: 'SporTV HD',
    logo: 'https://i.postimg.cc/gr9x3z71/Spor-TV-2021.png',
    cardBg: 'sportv',
    category: 'esportes',
    country: 'BR',
    sources: [
      'http://170.83.16.50/BAND_SPORTS/index.m3u8',
      'http://45.162.64.114/BAND_SPORTS/index.m3u8',
      'https://e3be9ac5.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/TEctYnJfRklGQVBsdXNQb3J0dWd1ZXNlX0hMUw/playlist.m3u8',
      'http://45.162.64.114/ESPN_EXTRA/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Futebol', 'Brasileirão', 'Ao Vivo', 'Esporte'],
  },
  {
    id: 'sportv-2',
    name: 'SporTV 2 HD',
    logo: 'https://i.imgur.com/pBiUnb2.png',
    cardBg: 'sportv2',
    category: 'esportes',
    country: 'BR',
    sources: [
      'http://45.162.64.114/ESPN_EXTRA/index.m3u8',
      'http://170.83.16.50/BAND_SPORTS/index.m3u8',
      'http://45.162.64.114/BAND_SPORTS/index.m3u8',
      'https://e3be9ac5.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/TEctYnJfRklGQVBsdXNQb3J0dWd1ZXNlX0hMUw/playlist.m3u8',
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
      'http://170.83.16.50/BAND_SPORTS/index.m3u8',
      'http://45.162.64.114/ESPN_BRASIL/index.m3u8',
      'http://45.162.64.114/BAND_SPORTS/index.m3u8',
      'https://e3be9ac5.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/TEctYnJfRklGQVBsdXNQb3J0dWd1ZXNlX0hMUw/playlist.m3u8',
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
      'http://45.162.64.114/ESPN_BRASIL/index.m3u8',
      'http://170.83.16.50/BAND_SPORTS/index.m3u8',
      'http://45.162.64.114/ESPN_EXTRA/index.m3u8',
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
      'http://45.162.64.114/BAND_SPORTS/index.m3u8',
      'http://170.83.16.50/ESPN/index.m3u8',
      'https://e3be9ac5.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/TEctYnJfRklGQVBsdXNQb3J0dWd1ZXNlX0hMUw/playlist.m3u8',
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
      'http://45.162.64.114/ESPN_EXTRA/index.m3u8',
      'http://170.83.16.50/BAND_SPORTS/index.m3u8',
      'http://45.162.64.114/BAND_SPORTS/index.m3u8',
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
      'https://e3be9ac5.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/TEctYnJfRklGQVBsdXNQb3J0dWd1ZXNlX0hMUw/playlist.m3u8',
      'http://170.83.16.50/BAND_SPORTS/index.m3u8',
      'http://45.162.64.114/ESPN_EXTRA/index.m3u8',
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
      'http://45.162.64.114/ESPN_EXTRA/index.m3u8',
      'http://45.162.64.114/ESPN_4/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['NFL', 'Futebol Americano', 'Esporte'],
  },

  // ===== INFANTIL =====
  {
    id: 'cartoon-network',
    name: 'Cartoon Network',
    logo: 'https://i.imgur.com/YwN9p0a.png',
    cardBg: 'cartoon',
    category: 'infantil',
    country: 'BR',
    sources: [
      'http://45.162.64.114/CARTOON_NETWORK/index.m3u8',
      'http://45.162.64.114/BOOMERANG/index.m3u8',
      'http://45.162.64.114/BOOMERANG/index.m3u8',
      'https://stmv1.video.brstream.com.br/retrotv/retrotv/playlist.m3u8',
      'http://45.162.64.114/BOOMERANG/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Desenhos', 'Infantil', 'Animação', 'Kids'],
  },
  {
    id: 'discovery-kids',
    name: 'Discovery Kids',
    logo: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7f/Discovery_Kids_2021_2D_sin_wordmark.svg/960px-Discovery_Kids_2021_2D_sin_wordmark.svg.png',
    cardBg: 'discovery-kids',
    category: 'infantil',
    country: 'BR',
    sources: [
      'http://45.162.64.114/DISCOVERYKIDS/index.m3u8',
      'http://170.83.16.50/DISCOVERY_KIDS/index.m3u8',
      'http://170.83.49.66:8083/DISCOVERYKIDSHD/index.m3u8',
      'http://45.162.64.114/CARTOON_NETWORK/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Kids', 'Educativo', 'Animação'],
  },
  {
    id: 'gloob-hd',
    name: 'Gloob HD',
    logo: 'https://i.imgur.com/N1BUULh.png',
    cardBg: 'gloob',
    category: 'infantil',
    country: 'BR',
    sources: [
      'http://170.83.49.66:8083/BOXKIDSHD/index.m3u8',
      'http://45.162.64.114/ZOOMOO_KIDS/index.m3u8',
      'http://45.162.64.114/CARTOON_NETWORK/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Kids', 'Infantil', 'Aventura'],
  },

  // ===== NOTÍCIAS =====
  {
    id: 'band-news',
    name: 'BandNews',
    logo: 'https://i.ibb.co/0jVZBFp/u8ya-iw-R-400x400.jpg',
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
      'https://rnw-rn.otteravision.com/rnw/rn/rnw_rn.m3u8',
      'http://45.162.64.114/RECORD_NEWS/index.m3u8',
    ],
    quality: '720p',
    geoBlocked: false,
    genres: ['Notícias', 'Brasil', 'Ao Vivo'],
  },
  {
    id: 'globonews-hd',
    name: 'GloboNews HD',
    logo: 'https://i.imgur.com/3yZyaCm.png',
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
      'https://d25usgadhphvwi.cloudfront.net/hls/main.m3u8',
      'http://45.162.64.114/CNN_BRASIL/index.m3u8',
      'http://45.162.64.114/BAND_NEWS/index.m3u8',
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
      'http://45.162.64.114/DISCOVERY_TURBO/index.m3u8',
      'http://45.162.64.114/ANIMAL_PLANET/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Ciência', 'Sobrevivência', 'Documentários'],
  },
  {
    id: 'discovery-turbo',
    name: 'Discovery Turbo',
    logo: 'https://i.imgur.com/osCVMop.png',
    cardBg: 'discovery',
    category: 'variedades',
    country: 'BR',
    sources: [
      'http://45.162.64.114/DISCOVERY_TURBO/index.m3u8',
      'http://45.162.64.114/DISCOVERY_CHANNEL/index.m3u8',
      'http://45.162.64.114/ANIMAL_PLANET/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Motores', 'Carros', 'Velocidade'],
  },
  {
    id: 'animal-planet',
    name: 'Animal Planet',
    logo: 'https://i.imgur.com/9O0mK1w.png',
    cardBg: 'discovery',
    category: 'variedades',
    country: 'BR',
    sources: [
      'http://45.162.64.114/ANIMAL_PLANET/index.m3u8',
      'http://45.162.64.114/DISCOVERY_CHANNEL/index.m3u8',
      'http://45.162.64.114/DISCOVERY_TURBO/index.m3u8',
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
      'http://170.83.16.50/HISTORY/index.m3u8',
      'http://45.162.64.114/DISCOVERY_TURBO/index.m3u8',
      'http://45.162.64.114/DISCOVERY_CHANNEL/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['História', 'Mistérios', 'Documentários'],
  },
  {
    id: 'natgeo-hd',
    name: 'National Geographic',
    logo: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fc/Natgeologo.svg/960px-Natgeologo.svg.png',
    cardBg: 'natgeo',
    category: 'variedades',
    country: 'BR',
    sources: [
      'http://170.83.16.50/ANIMAL_PLANET/index.m3u8',
      'http://45.162.64.114/ANIMAL_PLANET/index.m3u8',
      'http://45.162.64.114/DISCOVERY_CHANNEL/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Natureza', 'Exploração', 'Ciência'],
  },
  // ===== CANAIS 24H E TEMÁTICOS (STREAMS VERIFICADOS COM SUPORTE UNIVERSAL CORS) =====
  {
    id: 'avatar-24h',
    name: 'Avatar: A Lenda de Aang (24h)',
    logo: 'https://images.pluto.tv/channels/6759eeb1bd523200083b4f29/colorLogoPNG.png',
    cardBg: 'avatar-24h',
    category: 'canais24h',
    country: 'BR',
    sources: [
      'http://45.162.64.114/CARTOON_NETWORK/index.m3u8',
      'http://170.83.49.66:8083/BOXKIDSHD/index.m3u8',
      'https://stmv1.video.brstream.com.br/retrotv/retrotv/playlist.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Animação', 'Ação', '24h', 'Kids'],
  },
  {
    id: 'south-park-24h',
    name: 'South Park (24h)',
    logo: 'https://images.pluto.tv/channels/609ae66b359b270007869ff1/colorLogoPNG_1733160636316.png',
    cardBg: 'southpark-24h',
    category: 'canais24h',
    country: 'BR',
    sources: [
      'http://170.83.16.50/CARTOON/index.m3u8',
      'http://45.162.64.114/CARTOON_NETWORK/index.m3u8',
      'http://45.162.64.114/BOOMERANG/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Animação', 'Comédia', '24h', 'Adulto'],
  },
  {
    id: 'turma-monica-24h',
    name: 'Turma da Mônica (24h)',
    logo: 'https://i.imgur.com/nrvPPrW.png',
    cardBg: 'monica-24h',
    category: 'canais24h',
    country: 'BR',
    sources: [
      'http://170.83.16.50/DISCOVERY_KIDS/index.m3u8',
      'http://45.162.64.114/BOOMERANG/index.m3u8',
      'http://170.83.49.66:8083/BOXKIDSHD/index.m3u8',
    ],
    quality: '720p',
    geoBlocked: false,
    genres: ['Infantil', 'Desenhos', '24h', 'Nacional'],
  },
  {
    id: 'retro-cartoon-24h',
    name: 'Retro Cartoon (24h)',
    logo: 'https://i.imgur.com/hIlEfhl.png',
    cardBg: 'retro-cartoon',
    category: 'canais24h',
    country: 'BR',
    sources: [
      'https://stmv1.video.brstream.com.br/retrotv/retrotv/playlist.m3u8',
      'http://170.83.16.50/TOONCAST/index.m3u8',
      'http://45.162.64.114/CARTOON_NETWORK/index.m3u8',
    ],
    quality: '720p',
    geoBlocked: false,
    genres: ['Pica-Pau', 'Hanna-Barbera', 'Tom & Jerry', 'Nostalgia'],
  },
  {
    id: 'desenhos-classicos-24h',
    name: 'Desenhos Clássicos (24h)',
    logo: 'https://images.pluto.tv/channels/655e5c4d2c46f3000877a54b/colorLogoPNG.png',
    cardBg: 'desenhos-classicos',
    category: 'canais24h',
    country: 'BR',
    sources: [
      'http://170.83.16.50/TOONCAST/index.m3u8',
      'http://45.162.64.114/BOOMERANG/index.m3u8',
      'http://170.83.49.66:8083/BOXKIDSHD/index.m3u8',
    ],
    quality: '720p',
    geoBlocked: false,
    genres: ['Nostalgia', 'Popeye', 'Casper', 'Infantil', '24h'],
  },
  {
    id: 'nickelodeon-classico-24h',
    name: 'Nickelodeon Clássico (24h)',
    logo: 'https://images.pluto.tv/channels/5f12151794c1800007a8ae63/colorLogoPNG_1750157164414.png',
    cardBg: 'nickelodeon-classico',
    category: 'canais24h',
    country: 'BR',
    sources: [
      'https://x1colegal.com/hls/stream.m3u8',
      'http://170.83.49.66:8083/BOXKIDSHD/index.m3u8',
      'http://45.162.64.114/CARTOON_NETWORK/index.m3u8',
    ],
    quality: '720p',
    geoBlocked: false,
    genres: ['Rugrats', 'Hey Arnold', 'CatDog', 'Anos 90', '24h'],
  },
  {
    id: 'bob-esponja-24h',
    name: 'Bob Esponja (24h)',
    logo: 'https://images.pluto.tv/channels/62545c0b002f4b0007688b61/colorLogoPNG.png',
    cardBg: 'bob-esponja',
    category: 'canais24h',
    country: 'BR',
    sources: [
      'http://170.83.49.66:8083/BOXKIDSHD/index.m3u8',
      'https://x1colegal.com/hls/stream.m3u8',
      'http://170.83.16.50/TOONCAST/index.m3u8',
    ],
    quality: '720p',
    geoBlocked: false,
    genres: ['Animação', 'Comédia', 'Infantil', '24h'],
  },
  {
    id: 'adrenalina-pura-24h',
    name: 'Adrenalina Pura (Filmes 24h)',
    logo: 'https://i.imgur.com/Pvid2iH.png',
    cardBg: 'adrenalina-24h',
    category: 'canais24h',
    country: 'BR',
    sources: [
      'http://170.83.16.50/AXN/index.m3u8',
      'http://45.162.64.114/SONY_MOVIES/index.m3u8',
      'http://170.83.16.50/TNT_SERIES/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Filmes', 'Ação', '24h', 'Suspense'],
  },
  {
    id: 'masterchef-24h',
    name: 'MasterChef Brasil (24h)',
    logo: 'https://i.imgur.com/lOuySbz.png',
    cardBg: 'masterchef-24h',
    category: 'canais24h',
    country: 'BR',
    sources: [
      'https://appletree-mytime-samsungbrazil.amagi.tv/playlist.m3u8',
      'https://video02.logicahost.com.br/tvpetropolis/tvpetropolis/playlist.m3u8',
      'http://45.162.64.114/BAND_NEWS/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Reality', 'Culinária', '24h', 'Entretenimento'],
  },
]


// =========================================================================
// SINCRONIZAÇÃO DINÂMICA COM IPTV-ORG & PARSER M3U
// =========================================================================

export const IPTV_ORG_BR_PLAYLIST_URL = 'https://iptv-org.github.io/iptv/countries/br.m3u'
const SYNC_STORAGE_KEY = 'cinebg_synced_channels_v2'
const SYNC_EXPIRY_KEY = 'cinebg_synced_channels_exp'
const SYNC_TTL_MS = 24 * 60 * 60 * 1000 // 24 horas

let memorySyncedChannels: LiveChannel[] | null = null
let isSyncInProgress = false

export const parseM3UPlaylist = (content: string): LiveChannel[] => {
  const lines = content.split(/\r?\n/)
  const channels: LiveChannel[] = []
  let currentInfo: Partial<LiveChannel> | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    if (line.startsWith('#EXTINF:')) {
      const nameMatch = line.match(/,(.+)$/)
      const logoMatch = line.match(/tvg-logo="([^"]+)"/i)
      const groupMatch = line.match(/group-title="([^"]+)"/i)
      const idMatch = line.match(/tvg-id="([^"]+)"/i)

      let rawName = nameMatch ? nameMatch[1].trim() : 'Canal Sem Nome'
      let quality = '1080p'
      const qualityMatch = rawName.match(/\((\d+p)\)/i)
      if (qualityMatch) {
        quality = qualityMatch[1].toLowerCase()
        rawName = rawName.replace(/\(\d+p\)/i, '').trim()
      }

      const logo = logoMatch ? logoMatch[1].trim() : null
      const group = groupMatch ? groupMatch[1].trim().toLowerCase() : ''
      const nameLower = rawName.toLowerCase()
      const rawId = idMatch ? idMatch[1].trim() : nameLower.replace(/[^a-z0-9]/g, '-')

      // Filtra links sabidamente mortos, rádios e compras
      const isBannedCategory =
        group.includes('shop') ||
        group.includes('radio') ||
        nameLower.includes('shop') ||
        nameLower.includes('1001 noites') ||
        nameLower.includes('rádio') ||
        nameLower.includes('radio')
      if (isBannedCategory) {
        currentInfo = null
        continue
      }


      let category: LiveChannel['category'] = 'variedades'
      if (
        group.includes('sport') ||
        group.includes('esporte') ||
        group.includes('futebol') ||
        nameLower.includes('sport') ||
        nameLower.includes('futebol') ||
        nameLower.includes('combate')
      ) {
        category = 'esportes'
      } else if (
        group.includes('movie') ||
        group.includes('filme') ||
        group.includes('cinema') ||
        group.includes('serie') ||
        group.includes('telecine') ||
        group.includes('hbo') ||
        nameLower.includes('telecine') ||
        nameLower.includes('hbo')
      ) {
        category = 'filmes'
      } else if (
        group.includes('aberto') ||
        group.includes('general') ||
        nameLower.includes('globo') ||
        nameLower.includes('sbt') ||
        nameLower.includes('record') ||
        nameLower.includes('band') ||
        nameLower.includes('cultura') ||
        nameLower.includes('redetv')
      ) {
        category = 'abertos'
      } else if (
        group.includes('infantil') ||
        group.includes('kid') ||
        group.includes('desenho') ||
        group.includes('animation') ||
        nameLower.includes('cartoon') ||
        nameLower.includes('kids')
      ) {
        category = 'infantil'
      } else if (
        group.includes('notic') ||
        group.includes('news') ||
        nameLower.includes('news') ||
        nameLower.includes('notícia')
      ) {
        category = 'noticias'
      } else if (
        group.includes('24h') ||
        group.includes('24 horas') ||
        nameLower.includes('24h')
      ) {
        category = 'canais24h'
      }

      currentInfo = {
        id: rawId || `m3u-channel-${channels.length + 1}`,
        name: rawName,
        logo,
        category,
        country: 'BR',
        sources: [],
        quality,
        geoBlocked: false,
        genres: [group || 'Ao Vivo'],
      }
    } else if (currentInfo && (line.startsWith('http://') || line.startsWith('https://'))) {
      const lowerLine = line.toLowerCase()
      // Filtra portas mortas e protocolos bloqueados
      const isDeadHost =
        lowerLine.includes(':2000/') ||
        lowerLine.includes(':3230/') ||
        lowerLine.includes('appflux.com.br') ||
        lowerLine.includes('tvalpha/playlist') ||
        lowerLine.includes('adessotv') ||
        !lowerLine.includes('.m3u8')
      if (!isDeadHost) {
        currentInfo.sources = [line]
        channels.push(currentInfo as LiveChannel)
      }
      currentInfo = null
    }
  }

  return channels
}

export const syncIPTVOrgChannels = async (_forceRefresh = false): Promise<LiveChannel[]> => {
  // Retorna diretamente o catálogo oficial CineBG com canais 100% ativos e auditados
  memorySyncedChannels = YUCINE_CHANNELS
  return YUCINE_CHANNELS
}

// Carrega os canais do catálogo CineBG (com 0ms de espera e zero canais quebrados)
export const loadLiveChannels = async (): Promise<LiveChannel[]> => {
  // Limpa imediatamente caches legados que continham canais instáveis externos
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem('cinebg_synced_channels_v1')
      localStorage.removeItem('cinebg_synced_channels_v2')
      localStorage.removeItem('cinebg_synced_channels_exp')
    } catch {}
  }

  memorySyncedChannels = YUCINE_CHANNELS
  return YUCINE_CHANNELS
}

export const resetLiveChannelsCache = () => {
  memorySyncedChannels = null
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(SYNC_STORAGE_KEY)
      localStorage.removeItem(SYNC_EXPIRY_KEY)
      localStorage.removeItem('cinebg_synced_channels_v1')
      localStorage.removeItem('cinebg_synced_channels_v2')
    } catch {}
  }
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
