import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Play, Trash2, WifiOff } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { deleteVideo, downloadsSupported, getPlayableUrl } from '@/services/downloads'
import { getPosterUrl } from '@/services/tmdb'
import type { DownloadItem } from '@/types'

const Downloads = () => {
  const navigate = useNavigate()
  const { downloads, removeDownload } = useAppStore()
  const [playing, setPlaying] = useState<{ item: DownloadItem; url: string } | null>(null)

  const handlePlay = async (item: DownloadItem) => {
    const url = await getPlayableUrl(item.path)
    if (url) setPlaying({ item, url })
  }

  const handleDelete = async (item: DownloadItem) => {
    await deleteVideo(item.path)
    removeDownload(item.id, item.season, item.episode)
    if (playing?.item.id === item.id) setPlaying(null)
  }

  return (
    <motion.div
      className="min-h-screen bg-bg-primary pt-20 pb-16 page-enter"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/70 hover:text-white mt-4 mb-4 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <div className="py-2 mb-4">
          <h1 className="font-display font-black text-3xl text-white flex items-center gap-2">
            <Download className="h-7 w-7 text-accent-red" />
            Downloads
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Assista offline, sem precisar de internet.
          </p>
        </div>

        {playing && (
          <div className="mb-8 rounded-xl overflow-hidden bg-black">
            <video
              src={playing.url}
              controls
              autoPlay
              playsInline
              className="w-full aspect-video"
            />
            <div className="px-4 py-3 flex items-center justify-between bg-[#111118]">
              <span className="text-white text-sm font-semibold truncate">
                {playing.item.title}
                {playing.item.season != null
                  ? ` — T${playing.item.season} E${playing.item.episode}`
                  : ''}
              </span>
              <button
                onClick={() => setPlaying(null)}
                className="text-white/60 hover:text-white text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {downloads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <WifiOff className="h-12 w-12 text-white/30" />
            <p className="text-white font-bold">Nenhum download ainda</p>
            <p className="text-white/40 text-sm max-w-sm">
              {downloadsSupported()
                ? 'Baixe um filme ou episódio na tela de reprodução para assistir offline.'
                : 'Downloads estão disponíveis apenas no aplicativo Android.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {downloads.map((item) => (
              <div
                key={`${item.id}-${item.season}-${item.episode}`}
                className="glass rounded-xl p-3 flex items-center gap-4"
              >
                <img
                  src={getPosterUrl(item.posterPath, 'w185')}
                  alt={item.title}
                  className="w-12 h-18 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{item.title}</p>
                  <p className="text-white/50 text-xs mt-0.5">
                    {item.season != null
                      ? `Temporada ${item.season} · Episódio ${item.episode}`
                      : 'Filme'}
                  </p>
                </div>
                <button
                  onClick={() => handlePlay(item)}
                  className="flex items-center gap-2 bg-accent-red hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex-shrink-0"
                >
                  <Play className="h-4 w-4 fill-white" />
                  Assistir
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="p-2 text-white/40 hover:text-red-400 transition-colors flex-shrink-0"
                  title="Remover download"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default Downloads
