import React from 'react'
import { motion } from 'framer-motion'
import type { LiveChannel } from '@/services/liveChannels'

interface YuCineChannelCardProps {
  channel: LiveChannel
  isSelected?: boolean
  onClick: () => void
  isFavorite?: boolean
  onToggleFavorite?: () => void
}

const YuCineChannelCard: React.FC<YuCineChannelCardProps> = ({
  channel,
  isSelected,
  onClick,
  isFavorite,
  onToggleFavorite,
}) => {
  // Renderiza o corpo do card no padrão visual idêntico ao YuCine (Imagem 2)
  const renderCardContent = () => {
    switch (channel.cardBg) {
      case 'sbt':
        return (
          <div className="w-full h-full bg-white flex flex-col items-center justify-center p-3 text-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-cyan-400 flex items-center justify-center p-1 shadow-md">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <span className="font-display font-black text-xl tracking-tighter text-[#0d3b66]">
                  sbt
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mt-1">
              A TV QUE TEM TORCIDA
            </span>
          </div>
        )

      case 'globo-nordeste':
        return (
          <div className="w-full h-full bg-gradient-to-b from-[#141b2d] via-[#0b101c] to-[#05070c] flex flex-col items-center justify-center p-3 text-center relative overflow-hidden">
            {/* Globo Sphere 3D */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-slate-400 via-white to-slate-300 p-0.5 shadow-xl flex items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-400 via-emerald-400 to-amber-400 flex items-center justify-center p-1 shadow-inner">
                <div className="w-5 h-5 rounded-full bg-gradient-to-b from-white to-slate-200 shadow-md" />
              </div>
            </div>
            <span className="font-display font-black text-sm tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-blue-300 uppercase mt-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              NORDESTE
            </span>
          </div>
        )

      case 'globo-sp':
        return (
          <div className="w-full h-full bg-gradient-to-b from-[#1a2238] via-[#0d1322] to-[#060810] flex flex-col items-center justify-center p-3 text-center relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-slate-400 via-white to-slate-300 p-0.5 shadow-xl flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 via-emerald-400 to-amber-400 flex items-center justify-center p-1">
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </div>
            </div>
            <span className="text-[11px] font-bold text-white/90 tracking-wider uppercase mt-1">
              São Paulo
            </span>
          </div>
        )

      case 'globo-rj':
        return (
          <div className="w-full h-full bg-gradient-to-b from-[#11192e] via-[#0a0f1d] to-[#04060b] flex flex-col items-center justify-center p-3 text-center relative">
            <div className="absolute top-2 right-3 text-[10px] font-bold text-white/80">
              Rio de Janeiro
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-slate-400 via-white to-slate-300 p-0.5 shadow-xl flex items-center justify-center mt-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 via-emerald-400 to-amber-400 flex items-center justify-center p-1">
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </div>
            </div>
          </div>
        )

      case 'record':
        return (
          <div className="w-full h-full bg-gradient-to-tr from-[#0a2044] via-[#123875] to-[#1c54b0] flex flex-col items-center justify-center p-3 text-center">
            {/* Record TV Metallic Emblem */}
            <div className="w-14 h-14 rounded-full border-4 border-slate-300/80 bg-gradient-to-b from-blue-300 to-blue-700 flex items-center justify-center shadow-lg">
              <div className="w-8 h-8 rounded-full bg-white/90 shadow-inner" />
            </div>
            <span className="font-display font-black text-xs text-white tracking-wider uppercase mt-1.5 drop-shadow">
              RECORDTV
            </span>
          </div>
        )

      case 'cinemax':
        return (
          <div className="w-full h-full bg-black relative flex items-center justify-center overflow-hidden">
            {/* Faixa Amarela Diagonal Cinemax */}
            <div className="absolute inset-0 bg-[#f5b300] transform -skew-x-12 origin-top-left -ml-4 w-[110%]" />
            <div className="relative z-10 font-display font-black text-2xl tracking-tighter text-black uppercase">
              CINEMAX
            </div>
          </div>
        )

      case 'tc-touch':
        return (
          <div className="w-full h-full bg-white flex items-center justify-center gap-3 p-3">
            <span className="font-display font-black text-4xl text-black tracking-tighter">
              TC
            </span>
            <div className="flex flex-col">
              <div className="flex gap-1 text-[#4caf50] font-black text-lg leading-none">
                <span>/</span><span>/</span><span>/</span><span>/</span>
              </div>
              <span className="font-display font-black text-xs text-black uppercase tracking-wider mt-0.5">
                TOUCH
              </span>
            </div>
          </div>
        )

      case 'tc-premium':
        return (
          <div className="w-full h-full bg-white flex items-center justify-center gap-3 p-3">
            <span className="font-display font-black text-4xl text-black tracking-tighter">
              TC
            </span>
            <div className="flex flex-col">
              <div className="flex gap-1 text-[#00bcd4] font-black text-lg leading-none">
                <span>/</span><span>/</span><span>/</span><span>/</span>
              </div>
              <span className="font-display font-black text-[11px] text-black uppercase tracking-wider mt-0.5">
                PREMIUM
              </span>
            </div>
          </div>
        )

      case 'tc-action':
        return (
          <div className="w-full h-full bg-white flex items-center justify-center gap-3 p-3">
            <span className="font-display font-black text-4xl text-black tracking-tighter">
              TC
            </span>
            <div className="flex flex-col">
              <div className="flex gap-1 text-[#f44336] font-black text-lg leading-none">
                <span>/</span><span>/</span><span>/</span><span>/</span>
              </div>
              <span className="font-display font-black text-[11px] text-black uppercase tracking-wider mt-0.5">
                ACTION
              </span>
            </div>
          </div>
        )

      case 'tc-pipoca':
        return (
          <div className="w-full h-full bg-white flex items-center justify-center gap-3 p-3">
            <span className="font-display font-black text-4xl text-black tracking-tighter">
              TC
            </span>
            <div className="flex flex-col">
              <div className="flex gap-1 text-[#ff9800] font-black text-lg leading-none">
                <span>/</span><span>/</span><span>/</span><span>/</span>
              </div>
              <span className="font-display font-black text-[11px] text-black uppercase tracking-wider mt-0.5">
                PIPOCA
              </span>
            </div>
          </div>
        )

      case 'nfl':
        return (
          <div className="w-full h-full bg-gradient-to-r from-[#013369] to-[#0a192f] flex flex-col items-center justify-center p-3 text-center relative overflow-hidden">
            <div className="flex items-center gap-3">
              {/* NFL Shield */}
              <div className="w-8 h-10 bg-[#d50a0a] rounded-b-xl border-2 border-white flex flex-col items-center justify-center shadow-lg">
                <span className="text-[9px] font-black text-white">NFL</span>
              </div>
              <div className="text-left">
                <span className="font-display font-black text-sm text-white tracking-wide block">
                  YouCine NFL
                </span>
                <span className="text-[10px] text-white/70 block">
                  Chiefs vs Chargers • AO VIVO
                </span>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="w-full h-full bg-gradient-to-br from-[#1b1c2b] to-[#0c0d16] flex flex-col items-center justify-center p-3 text-center">
            {channel.logo ? (
              <img
                src={channel.logo}
                alt={channel.name}
                className="max-h-12 max-w-[80%] object-contain drop-shadow-md"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none'
                }}
              />
            ) : (
              <span className="font-display font-black text-base text-white/90 uppercase tracking-wider">
                {channel.name}
              </span>
            )}
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col group cursor-pointer select-none">
      {/* Container 16:9 Landscape Card */}
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all duration-200 shadow-lg ${
          isSelected
            ? 'border-amber-400 ring-4 ring-amber-400/40 shadow-[0_0_25px_rgba(251,191,36,0.6)] scale-[1.03]'
            : 'border-transparent hover:border-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.4)] group-focus:border-amber-400'
        }`}
      >
        {renderCardContent()}

        {/* Botão de Favorito Discreto */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite()
            }}
            className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-sm text-white/70 hover:text-white transition-colors"
            title={isFavorite ? 'Remover dos favoritos' : 'Favoritar canal'}
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
        )}

        {/* Badge HD/Ao Vivo */}
        <div className="absolute bottom-2 left-2 z-10 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white/80">
          HD
        </div>
      </motion.div>

      {/* Rótulo do Canal Centralizado Abaixo do Card (Estilo YuCine) */}
      <span className="text-white/80 font-medium text-xs sm:text-sm text-center mt-2 group-hover:text-white group-focus:text-amber-300 transition-colors truncate px-1">
        {channel.name}
      </span>
    </div>
  )
}

export default YuCineChannelCard
