import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { Play, Pause, Volume2, VolumeX, Maximize2, SkipForward } from 'lucide-react'

interface NativePlayerProps {
  src: string
  title: string
  poster?: string
  onNextEpisode?: () => void
}

const NativePlayer = ({ src, title, poster, onNextEpisode }: NativePlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)

  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let hls: Hls | null = null

    if (src.endsWith('.m3u8') || src.includes('.m3u8')) {
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        })
        hls.loadSource(src)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {})
        })
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src
      }
    } else {
      video.src = src
    }

    return () => {
      if (hls) {
        hls.destroy()
      }
    }
  }, [src])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress(videoRef.current.currentTime)
      setDuration(videoRef.current.duration || 0)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setProgress(time)
    }
  }

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        containerRef.current.requestFullscreen()
      }
    }
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3500)
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative bg-black rounded-xl overflow-hidden group aspect-video"
    >
      <video
        ref={videoRef}
        poster={poster}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
      />

      {/* Controles Customizados Nativo YuCine */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 flex flex-col justify-between p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center text-white">
          <h3 className="font-bold text-sm md:text-base line-clamp-1">{title}</h3>
          <span className="bg-accent-red/90 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">
            Nativo 4K / Dublado
          </span>
        </div>

        {/* Big Center Play/Pause Button */}
        <div className="flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="p-4 rounded-full bg-accent-red/90 hover:bg-red-600 text-white shadow-xl transition-transform transform hover:scale-110"
          >
            {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 fill-current ml-0.5" />}
          </button>
        </div>

        {/* Timeline & Controls Bottom Bar */}
        <div className="space-y-2">
          {/* Progress bar */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={progress}
            onChange={handleSeek}
            className="w-full accent-accent-red bg-white/20 h-1.5 rounded-lg cursor-pointer"
          />

          <div className="flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="hover:text-accent-red">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
              </button>
              <button onClick={toggleMute} className="hover:text-accent-red">
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <span>
                {formatTime(progress)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {onNextEpisode && (
                <button
                  onClick={onNextEpisode}
                  className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded text-xs font-bold"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                  Próximo Ep
                </button>
              )}
              <button onClick={toggleFullscreen} className="hover:text-accent-red">
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NativePlayer
