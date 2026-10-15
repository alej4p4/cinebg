import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Maximize2, RefreshCw, Volume2, VolumeX } from 'lucide-react'
import type { LiveChannel } from '@/services/liveChannels'
import { categoryLabel, countryFlag } from '@/services/liveChannels'

interface LivePlayerProps {
  channel: LiveChannel
}

const LivePlayer = ({ channel }: LivePlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [sourceIndex, setSourceIndex] = useState(0)
  const [mountKey, setMountKey] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [muted, setMuted] = useState(false)

  // Reinicia o player quando o canal muda.
  useEffect(() => {
    setSourceIndex(0)
    setMountKey(0)
    setLoaded(false)
    setError(false)
  }, [channel.id])

  // Anexa o stream HLS atual. Em falha fatal, alterna silenciosamente para a
  // próxima fonte do canal; se a lista esgotar, exibe o aviso de erro.
  useEffect(() => {
    const video = videoRef.current
    const src = channel.sources[sourceIndex]
    if (!video || !src) {
      setError(true)
      return
    }

    setLoaded(false)
    setError(false)

    let cancelled = false
    let hlsInstance: { destroy: () => void } | null = null

    const goNext = () => {
      if (cancelled) return
      if (sourceIndex < channel.sources.length - 1) {
        setSourceIndex((i) => i + 1)
      } else {
        setError(true)
      }
    }

    // Safari/iOS reproduz HLS nativamente.
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      video.play().catch(() => {})
      const onErr = () => goNext()
      video.addEventListener('error', onErr)
      return () => {
        cancelled = true
        video.removeEventListener('error', onErr)
        video.removeAttribute('src')
      }
    }

    void import('hls.js').then((mod) => {
      if (cancelled) return
      const Hls = mod.default
      if (!Hls.isSupported()) {
        setError(true)
        return
      }

      const hls = new Hls({ enableWorker: true, liveDurationInfinity: true })
      hlsInstance = hls
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!cancelled) video.play().catch(() => {})
      })
      hls.on(Hls.Events.ERROR, (_event: unknown, data: unknown) => {
        if (cancelled) return
        const payload = data as { fatal?: boolean; type?: string }
        if (!payload.fatal) return
        if (payload.type === Hls.ErrorTypes.MEDIA_ERROR) {
          try {
            hls.recoverMediaError()
            return
          } catch {
            /* segue para a proxima fonte */
          }
        }
        hls.destroy()
        goNext()
      })
    })

    return () => {
      cancelled = true
      if (hlsInstance) hlsInstance.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.id, sourceIndex, mountKey])

  const reload = () => {
    setSourceIndex(0)
    setLoaded(false)
    setError(false)
    setMountKey((k) => k + 1)
  }

  const handleFullscreen = () => {
    const node = containerRef.current
    if (!node) return
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      node.requestFullscreen().catch(() => {})
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }

  return (
    <div className="space-y-0">
      {/* Barra de identificação do canal */}
      <div className="flex flex-wrap items-center justify-between bg-[#111118] border border-white/5 rounded-t-xl px-4 py-2.5 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex items-center gap-1.5 text-[10px] font-black tracking-wide text-white bg-accent-red px-2 py-0.5 rounded-full uppercase flex-shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Ao Vivo
          </span>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">{channel.name}</p>
            <p className="text-white/40 text-xs truncate">
              {categoryLabel(channel.category)} · {countryFlag(channel.country)}
              {channel.quality ? ` · ${channel.quality}` : ''}
            </p>
          </div>
        </div>
        <button
          onClick={reload}
          className="p-1.5 text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/5 flex-shrink-0"
          title="Recarregar canal"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Container do player */}
      <div
        ref={containerRef}
        className="relative bg-black overflow-hidden rounded-b-xl aspect-video"
      >
        {!loaded && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a10] z-10 gap-3">
            <div className="w-12 h-12 border-2 border-white/5 border-t-accent-red rounded-full animate-spin" />
            {channel.logo && (
              <img
                src={channel.logo}
                alt={channel.name}
                className="h-12 max-w-[140px] object-contain opacity-60"
              />
            )}
            <p className="text-white/70 text-sm font-semibold">Sintonizando canal...</p>
            {channel.sources.length > 1 && sourceIndex > 0 && (
              <p className="text-white/30 text-xs">
                Fonte alternativa {sourceIndex + 1}/{channel.sources.length}
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a10] z-10 gap-4 p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <div>
              <p className="text-white font-bold text-lg">Canal indisponível</p>
              <p className="text-white/40 text-sm mt-1 max-w-sm">
                Não foi possível sintonizar este canal agora. Ele pode estar fora do ar ou
                bloqueado na sua região.
              </p>
            </div>
            <button
              onClick={reload}
              className="flex items-center gap-2 bg-accent-red text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-900/40"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </button>
          </div>
        )}

        <video
          key={`${channel.id}-${mountKey}`}
          ref={videoRef}
          title={channel.name}
          controls
          autoPlay
          playsInline
          className="w-full h-full bg-black"
          onLoadedData={() => setLoaded(true)}
          onPlaying={() => setLoaded(true)}
        />

        {/* Controles flutuantes */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 z-30">
          <button
            onClick={toggleMute}
            className="p-2 bg-black/70 hover:bg-black/90 rounded-lg text-white/70 hover:text-white transition-colors backdrop-blur-sm"
            title={muted ? 'Ativar som' : 'Silenciar'}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            onClick={handleFullscreen}
            className="p-2 bg-black/70 hover:bg-black/90 rounded-lg text-white/70 hover:text-white transition-colors backdrop-blur-sm"
            title="Tela cheia"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default LivePlayer
