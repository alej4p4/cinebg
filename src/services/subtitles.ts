import { tmdb } from './tmdb'
import { Capacitor, CapacitorHttp } from '@capacitor/core'

export interface SubtitleTrackOption {
  id: string
  label: string
  vttUrl: string
  isForced: boolean
  language: string
}

export function srtToVtt(srt: string): string {
  const normalized = srt
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove tags obsoletas de formatação
    .replace(/<font[^>]*>/gi, '')
    .replace(/<\/font>/gi, '')
    .replace(/\{\\an\d\}/g, '')
    // Substitui vírgula por ponto nos timestamps de tempo (00:00:20,123 -> 00:00:20.123)
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')

  return `WEBVTT\n\n${normalized.trim()}\n`
}

// Cache de IMDb IDs para evitar requisições repetidas
const imdbIdCache = new Map<string, string>()

// Cache de faixas VTT prontas (blob URLs)
const activeBlobUrls: string[] = []

/**
 * Obtém o IMDb ID de um filme ou série pelo TMDB ID.
 */
export async function getImdbId(
  type: 'movie' | 'tv' | 'anime',
  tmdbId: number
): Promise<string | null> {
  const cacheKey = `${type}-${tmdbId}`
  if (imdbIdCache.has(cacheKey)) {
    return imdbIdCache.get(cacheKey)!
  }

  try {
    if (type === 'movie') {
      const res = await tmdb.get<{ imdb_id?: string }>(`/movie/${tmdbId}`)
      if (res.data?.imdb_id) {
        imdbIdCache.set(cacheKey, res.data.imdb_id)
        return res.data.imdb_id
      }
    } else {
      const res = await tmdb.get<{ imdb_id?: string }>(`/tv/${tmdbId}/external_ids`)
      if (res.data?.imdb_id) {
        imdbIdCache.set(cacheKey, res.data.imdb_id)
        return res.data.imdb_id
      }
    }
  } catch (err) {
    console.warn('[Subtitles] Não foi possível obter o IMDb ID:', err)
  }
  return null
}

interface StremioSubtitle {
  id: string
  url: string
  lang: string
  subtitleFileName?: string
  movieReleaseName?: string
}

/**
 * Busca legendas em Português (PT-BR) públicas via Stremio OpenSubtitles.
 * Retorna as faixas já convertidas em WebVTT prontas para injeção no player.
 */
export async function fetchPortugueseSubtitles(
  type: 'movie' | 'tv' | 'anime',
  tmdbId: number,
  season = 1,
  episode = 1
): Promise<SubtitleTrackOption[]> {
  const imdbId = await getImdbId(type, tmdbId)
  if (!imdbId) return []

  const targetPath =
    type === 'movie'
      ? `movie/${imdbId}`
      : `series/${imdbId}:${season}:${episode}`

  const endpoint = `https://opensubtitles-v3.strem.io/subtitles/${targetPath}.json`

  try {
    let rawSubtitles: StremioSubtitle[] = []

    if (Capacitor.isNativePlatform()) {
      const resp = await CapacitorHttp.get({ url: endpoint })
      if (resp.status === 200 && resp.data?.subtitles) {
        rawSubtitles = resp.data.subtitles
      }
    } else {
      const resp = await fetch(endpoint)
      if (resp.ok) {
        const data = await resp.json()
        if (Array.isArray(data?.subtitles)) {
          rawSubtitles = data.subtitles
        }
      }
    }

    // Filtra legendas em Português do Brasil (pob) e Português (por)
    const ptSubs = rawSubtitles.filter(
      (s) => s.lang === 'pob' || s.lang === 'por' || s.lang === 'pt' || s.lang === 'pt-br'
    )

    if (ptSubs.length === 0) return []

    // Procura por legenda especificamente marcada como Forçada (falas em outro idioma)
    const forcedMatch = ptSubs.find((s) => {
      const fn = (s.subtitleFileName || '').toLowerCase()
      const rel = (s.movieReleaseName || '').toLowerCase()
      return (
        fn.includes('forced') ||
        fn.includes('forcad') ||
        fn.includes('forçad') ||
        rel.includes('forced') ||
        rel.includes('forcad') ||
        rel.includes('forçad')
      )
    })

    const fullMatch = ptSubs.find((s) => s !== forcedMatch) || ptSubs[0]

    const toProcess: { sub: StremioSubtitle; isForced: boolean; label: string }[] = []

    if (forcedMatch) {
      toProcess.push({
        sub: forcedMatch,
        isForced: true,
        label: '🇧🇷 Português (Falas em outro idioma / Forçada)',
      })
    } else {
      // Quando não há arquivo específico 'forced', a primeira legenda serve para tradução
      toProcess.push({
        sub: fullMatch,
        isForced: true,
        label: '🇧🇷 Português (Tradução / Forçada)',
      })
    }

    if (fullMatch && fullMatch !== forcedMatch) {
      toProcess.push({
        sub: fullMatch,
        isForced: false,
        label: '🇧🇷 Português Completo (PT-BR)',
      })
    }

    const results: SubtitleTrackOption[] = []

    for (const item of toProcess) {
      try {
        let srtText = ''
        if (Capacitor.isNativePlatform()) {
          const resp = await CapacitorHttp.get({ url: item.sub.url })
          if (resp.status === 200 && typeof resp.data === 'string') {
            srtText = resp.data
          }
        } else {
          const resp = await fetch(item.sub.url)
          if (resp.ok) {
            srtText = await resp.text()
          }
        }

        if (srtText && srtText.length > 20) {
          const vtt = srtToVtt(srtText)
          const blob = new Blob([vtt], { type: 'text/vtt;charset=utf-8' })
          const blobUrl = URL.createObjectURL(blob)
          activeBlobUrls.push(blobUrl)

          results.push({
            id: `pt-${item.sub.id}-${item.isForced ? 'forced' : 'full'}`,
            label: item.label,
            vttUrl: blobUrl,
            isForced: item.isForced,
            language: 'pt',
          })
        }
      } catch (err) {
        console.warn('[Subtitles] Erro ao baixar ou converter legenda:', err)
      }
    }

    return results
  } catch (err) {
    console.warn('[Subtitles] Erro ao buscar legendas:', err)
    return []
  }
}

/**
 * Libera os recursos de Blob URLs gerados para legendas.
 */
export function clearActiveSubtitleBlobs() {
  while (activeBlobUrls.length > 0) {
    const url = activeBlobUrls.pop()
    if (url) {
      try {
        URL.revokeObjectURL(url)
      } catch {}
    }
  }
}
