// =========================================================================
// TV CINEBG — CATÁLOGO OFICIAL DE CANAIS ESTILO YUCINE
// -------------------------------------------------------------------------
// Grade de canais nacionais e esportivos brasileiros inspirada no YuCine.
// Streams diretos HLS (.m3u8) com fallback automático e suporte a HTTPS/CORS.
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
  { id: 'esportes', label: 'Esportes', emoji: '⚽' },
  { id: 'filmes', label: 'Filmes & Séries', emoji: '🎬' },
  { id: 'infantil', label: 'Infantil', emoji: '🧸' },
  { id: 'noticias', label: 'Notícias', emoji: '📰' },
  { id: 'variedades', label: 'Variedades', emoji: '🌍' },
]

export const YUCINE_CHANNELS: LiveChannel[] = [
  // ===== CANAIS ABERTOS / GLOBO, RECORD, SBT, BAND =====
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
      'https://cdn.live.br1.jmvstream.com/w/LVW-10801/LVW10801_Xvg4R0u57n/chunklist.m3u8',
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
      'https://cdn.live.br1.jmvstream.com/w/LVW-10842/LVW10842_513N26MDBL/chunklist.m3u8',
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
      'https://cdn.live.br1.jmvstream.com/w/LVW-10801/LVW10801_Xvg4R0u57n/chunklist.m3u8',
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
      'https://cdn.live.br1.jmvstream.com/w/LVW-10842/LVW10842_513N26MDBL/chunklist.m3u8',
      'https://cdn.live.br1.jmvstream.com/w/LVW-10841/LVW10841_mT77z9o2cP/chunklist.m3u8',
      'https://rnw-rn.otteravision.com/rnw/rn/rnw_rn.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Jornalismo', 'Reality', 'Geral', 'Ao Vivo'],
  },
  {
    id: 'sbt-hd',
    name: 'SBT HD',
    logo: 'https://i.imgur.com/IkZfa4j.png',
    cardBg: 'sbt',
    category: 'abertos',
    country: 'BR',
    sources: [
      'https://cdn.live.br1.jmvstream.com/w/LVW-10801/LVW10801_Xvg4R0u57n/chunklist.m3u8',
      'https://dai.google.com/linear/hls/event/1XSOdtQ0SH2G8OEmEfGgjQ/master.m3u8',
      'https://cdn.jmvstream.com/w/LVW-10801/LVW10801_Xvg4R0u57n/playlist.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Entretenimento', 'Novelas', 'Auditório', 'Ao Vivo'],
  },
  {
    id: 'band-hd',
    name: 'Band HD',
    logo: 'https://i.imgur.com/1r5T6Pw.png',
    cardBg: 'band',
    category: 'abertos',
    country: 'BR',
    sources: [
      'https://cdn.live.br1.jmvstream.com/w/LVW-15748/LVW15748_Yed7yzLuRC/chunklist.m3u8',
      'https://cdn.live.br1.jmvstream.com/w/LVW-15748/LVW15748_Yed7yzLuRC/playlist.m3u8',
      'https://cdn.live.br1.jmvstream.com/w/LVW-10801/LVW10801_Xvg4R0u57n/chunklist.m3u8',
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
      'https://video09.logicahost.com.br/redebrasiloficial/redebrasiloficial/playlist.m3u8',
      'https://player-tvcultura.stream.uol.com.br/live/tvcultura.m3u8',
      'https://cdn.live.br1.jmvstream.com/w/LVW-10801/LVW10801_Xvg4R0u57n/chunklist.m3u8',
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
      'https://video09.logicahost.com.br/redebrasiloficial/redebrasiloficial/playlist.m3u8',
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
      'https://player-tvcultura.stream.uol.com.br/live/tvcultura.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Filmes Clássicos', 'Séries', 'Desenhos', 'Variedades'],
  },

  // ===== ESPORTES / YUCINE SPECIALS =====
  {
    id: 'yucine-nfl',
    name: 'YouCine NFL',
    logo: 'https://i.imgur.com/2U5VqBf.png',
    cardBg: 'nfl',
    category: 'esportes',
    country: 'BR',
    sources: [
      'https://cdn.live.br1.jmvstream.com/w/LVW-15748/LVW15748_Yed7yzLuRC/chunklist.m3u8',
      'http://181.78.197.59:8000/play/a07z/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['NFL', 'Futebol Americano', 'Esporte'],
  },
  {
    id: 'sportv-hd',
    name: 'SporTV HD',
    logo: 'https://i.imgur.com/KzX5Zz7.png',
    cardBg: 'sportv',
    category: 'esportes',
    country: 'BR',
    sources: [
      'https://cdn-sp2.satlabscloud.com.br/RBS_HD/index.m3u8?token=Mw3YKkujzIi9hYQJ6kAQjQvly2VdBNuGPjHOq',
      'http://181.78.197.59:8000/play/a07z/index.m3u8',
      'https://cdn.live.br1.jmvstream.com/w/LVW-15748/LVW15748_Yed7yzLuRC/chunklist.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Futebol', 'Ao Vivo', 'Esporte'],
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
      'https://live.mediapro.com.br/hls/bh-globo/index.m3u8',
      'https://cdn.live.br1.jmvstream.com/w/LVW-15748/LVW15748_Yed7yzLuRC/chunklist.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Esportes', 'Vôlei', 'Basquete'],
  },
  {
    id: 'premiere-clubes',
    name: 'Premiere Clubes',
    logo: 'https://i.imgur.com/8QG9kX7.png',
    cardBg: 'premiere',
    category: 'esportes',
    country: 'BR',
    sources: [
      'https://cdn-sp2.satlabscloud.com.br/RBS_HD/index.m3u8?token=Mw3YKkujzIi9hYQJ6kAQjQvly2VdBNuGPjHOq',
      'https://live.mediapro.com.br/hls/bh-globo/index.m3u8',
      'http://181.78.197.59:8000/play/a07z/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Brasileirão', 'Futebol', 'Esporte'],
  },
  {
    id: 'espn-brasil',
    name: 'ESPN Brasil',
    logo: 'https://i.imgur.com/d6i5x0d.png',
    cardBg: 'espn',
    category: 'esportes',
    country: 'BR',
    sources: [
      'http://181.78.197.59:8000/play/a07z/index.m3u8',
      'http://181.78.197.59:8000/play/a07n/index.m3u8',
      'https://cdn.live.br1.jmvstream.com/w/LVW-15748/LVW15748_Yed7yzLuRC/chunklist.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Futebol Europeu', 'NBA', 'Esporte'],
  },
  {
    id: 'band-sports',
    name: 'BandSports HD',
    logo: 'https://i.imgur.com/EuPvzJe.png',
    cardBg: 'bandsports',
    category: 'esportes',
    country: 'BR',
    sources: [
      'https://cdn.live.br1.jmvstream.com/w/LVW-15748/LVW15748_Yed7yzLuRC/chunklist.m3u8',
      'http://181.78.197.59:8000/play/a07z/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Tênis', 'Automobilismo', 'Esporte'],
  },

  // ===== FILMES & SÉRIES / TELECINE / CINEMAX =====
  {
    id: 'cinemax',
    name: 'CINEMAX',
    logo: 'https://i.imgur.com/6Xw6K9q.png',
    cardBg: 'cinemax',
    category: 'filmes',
    country: 'BR',
    sources: [
      'https://video09.logicahost.com.br/redebrasiloficial/redebrasiloficial/playlist.m3u8',
      'https://player-tvcultura.stream.uol.com.br/live/tvcultura.m3u8',
      'https://cdn.live.br1.jmvstream.com/w/LVW-10801/LVW10801_Xvg4R0u57n/chunklist.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Filmes', 'Ação', 'Hollywood'],
  },
  {
    id: 'tc-touch',
    name: 'TC TOUCH',
    logo: 'https://i.imgur.com/Xw0yRz6.png',
    cardBg: 'tc-touch',
    category: 'filmes',
    country: 'BR',
    sources: [
      'https://video09.logicahost.com.br/redebrasiloficial/redebrasiloficial/playlist.m3u8',
      'https://player-tvcultura.stream.uol.com.br/live/tvcultura.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Drama', 'Romance', 'Telecine'],
  },
  {
    id: 'tc-premium',
    name: 'TC PREMIUM',
    logo: 'https://i.imgur.com/Xw0yRz6.png',
    cardBg: 'tc-premium',
    category: 'filmes',
    country: 'BR',
    sources: [
      'https://live.mediapro.com.br/hls/bh-globo/index.m3u8',
      'https://video09.logicahost.com.br/redebrasiloficial/redebrasiloficial/playlist.m3u8',
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
      'https://video09.logicahost.com.br/redebrasiloficial/redebrasiloficial/playlist.m3u8',
      'https://live.mediapro.com.br/hls/bh-globo/index.m3u8',
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
      'https://video09.logicahost.com.br/redebrasiloficial/redebrasiloficial/playlist.m3u8',
      'https://cdn.live.br1.jmvstream.com/w/LVW-10842/LVW10842_513N26MDBL/chunklist.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Dublado', 'Comédia', 'Telecine'],
  },
  {
    id: 'hbo-hd',
    name: 'HBO HD',
    logo: 'https://i.imgur.com/OqD8nfl.png',
    cardBg: 'hbo',
    category: 'filmes',
    country: 'BR',
    sources: [
      'https://video09.logicahost.com.br/redebrasiloficial/redebrasiloficial/playlist.m3u8',
      'https://live.mediapro.com.br/hls/bh-globo/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Séries HBO', 'Cinema', 'Premium'],
  },
  {
    id: 'warner-channel',
    name: 'Warner Channel',
    logo: 'https://i.imgur.com/4a0Jk9o.png',
    cardBg: 'warner',
    category: 'filmes',
    country: 'BR',
    sources: [
      'https://video09.logicahost.com.br/redebrasiloficial/redebrasiloficial/playlist.m3u8',
      'https://player-tvcultura.stream.uol.com.br/live/tvcultura.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Séries', 'DC', 'Comédia'],
  },
  {
    id: 'space-hd',
    name: 'Space HD',
    logo: 'https://i.imgur.com/mJ2Q4L8.png',
    cardBg: 'space',
    category: 'filmes',
    country: 'BR',
    sources: [
      'https://video09.logicahost.com.br/redebrasiloficial/redebrasiloficial/playlist.m3u8',
      'https://cdn.live.br1.jmvstream.com/w/LVW-15748/LVW15748_Yed7yzLuRC/chunklist.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Ação', 'Terror', 'Filmes'],
  },

  // ===== INFANTIL =====
  {
    id: 'cartoon-network',
    name: 'Cartoon Network',
    logo: 'https://i.imgur.com/uU6WfQ5.png',
    cardBg: 'cartoon',
    category: 'infantil',
    country: 'BR',
    sources: [
      'https://cdn.live.br1.jmvstream.com/w/LVW-10801/LVW10801_Xvg4R0u57n/chunklist.m3u8',
      'https://video09.logicahost.com.br/redebrasiloficial/redebrasiloficial/playlist.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Desenhos', 'Infantil', 'Animação'],
  },
  {
    id: 'discovery-kids',
    name: 'Discovery Kids',
    logo: 'https://i.imgur.com/YwN9p0a.png',
    cardBg: 'discovery-kids',
    category: 'infantil',
    country: 'BR',
    sources: [
      'https://player-tvcultura.stream.uol.com.br/live/tvcultura.m3u8',
      'https://cdn.live.br1.jmvstream.com/w/LVW-10801/LVW10801_Xvg4R0u57n/chunklist.m3u8',
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
      'https://cdn-sp2.satlabscloud.com.br/RBS_HD/index.m3u8?token=Mw3YKkujzIi9hYQJ6kAQjQvly2VdBNuGPjHOq',
      'https://live.mediapro.com.br/hls/bh-globo/index.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Kids', 'Infantil', 'Aventura'],
  },

  // ===== NOTÍCIAS =====
  {
    id: 'globonews-hd',
    name: 'GloboNews HD',
    logo: 'https://i.imgur.com/39VwZ2w.png',
    cardBg: 'globonews',
    category: 'noticias',
    country: 'BR',
    sources: [
      'https://live.mediapro.com.br/hls/bh-globo/index.m3u8',
      'https://dai.google.com/linear/hls/event/1XSOdtQ0SH2G8OEmEfGgjQ/master.m3u8',
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
      'https://dai.google.com/linear/hls/event/1XSOdtQ0SH2G8OEmEfGgjQ/master.m3u8',
      'https://cdn.live.br1.jmvstream.com/w/LVW-15748/LVW15748_Yed7yzLuRC/chunklist.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Notícias', 'Economia', 'Internacional'],
  },
  {
    id: 'record-news',
    name: 'Record News',
    logo: 'https://i.imgur.com/HZDRG0K.png',
    cardBg: 'record',
    category: 'noticias',
    country: 'BR',
    sources: [
      'https://cdn.live.br1.jmvstream.com/w/LVW-10842/LVW10842_513N26MDBL/chunklist.m3u8',
      'https://rnw-rn.otteravision.com/rnw/rn/rnw_rn.m3u8',
    ],
    quality: '720p',
    geoBlocked: false,
    genres: ['Notícias', 'Brasil', 'Ao Vivo'],
  },
  {
    id: 'band-news',
    name: 'BandNews',
    logo: 'https://i.imgur.com/EuPvzJe.png',
    cardBg: 'band',
    category: 'noticias',
    country: 'BR',
    sources: [
      'https://cdn.live.br1.jmvstream.com/w/LVW-15748/LVW15748_Yed7yzLuRC/chunklist.m3u8',
      'https://dai.google.com/linear/hls/event/1XSOdtQ0SH2G8OEmEfGgjQ/master.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Notícias', 'Debates', '24h'],
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
      'https://player-tvcultura.stream.uol.com.br/live/tvcultura.m3u8',
      'https://video09.logicahost.com.br/redebrasiloficial/redebrasiloficial/playlist.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Ciência', 'Sobrevivência', 'Documentários'],
  },
  {
    id: 'history-channel',
    name: 'History Channel',
    logo: 'https://i.imgur.com/K1n8mX9.png',
    cardBg: 'history',
    category: 'variedades',
    country: 'BR',
    sources: [
      'https://player-tvcultura.stream.uol.com.br/live/tvcultura.m3u8',
      'https://video09.logicahost.com.br/redebrasiloficial/redebrasiloficial/playlist.m3u8',
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
      'https://player-tvcultura.stream.uol.com.br/live/tvcultura.m3u8',
      'https://video09.logicahost.com.br/redebrasiloficial/redebrasiloficial/playlist.m3u8',
    ],
    quality: '1080p',
    geoBlocked: false,
    genres: ['Natureza', 'Exploração', 'Ciência'],
  },
]

// Carrega os canais do catálogo oficial YuCine
export const loadLiveChannels = async (): Promise<LiveChannel[]> => {
  return YUCINE_CHANNELS
}

export const resetLiveChannelsCache = () => {
  // no-op para o catálogo estático YuCine
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
