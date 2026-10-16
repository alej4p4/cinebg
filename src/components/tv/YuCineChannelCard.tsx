import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
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
  const { ref, focused } = useFocusable({
    focusKey: `channel-${channel.id}`,
    onEnterPress: onClick,
    onFocus: () => {
      ref.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    },
  })

  useEffect(() => {
    if (focused && ref.current) {
      ref.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [focused])
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

      case 'tnt':
        return (
          <div className="w-full h-full bg-[#d61a21] flex flex-col items-center justify-center p-3 text-center relative overflow-hidden">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-xl">
              <span className="font-display font-black text-2xl tracking-tighter text-[#d61a21]">
                TNT
              </span>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-white/90 mt-1">
              HD
            </span>
          </div>
        )

      case 'tnt-novelas':
        return (
          <div className="w-full h-full bg-gradient-to-r from-[#7b1fa2] via-[#e91e63] to-[#ff9800] flex flex-col items-center justify-center p-3 text-center relative overflow-hidden">
            <div className="flex flex-col items-center">
              <span className="font-display font-black text-2xl tracking-tighter text-white drop-shadow">
                TNT
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-200 mt-0.5">
                NOVELAS
              </span>
            </div>
          </div>
        )

      case 'hbo':
        return (
          <div className="w-full h-full bg-black flex flex-col items-center justify-center p-3 text-center relative overflow-hidden">
            <div className="flex items-center tracking-tighter font-display font-black text-4xl text-white">
              <span>H</span>
              <span>B</span>
              <div className="relative inline-flex items-center justify-center">
                <span>O</span>
                <div className="absolute w-2.5 h-2.5 rounded-full bg-white" />
              </div>
            </div>
            <span className="text-[9px] font-bold text-white/50 tracking-widest uppercase mt-1">
              ORIGINAL
            </span>
          </div>
        )

      case 'max':
        return (
          <div className="w-full h-full bg-gradient-to-br from-[#002be7] via-[#001f99] to-[#000d44] flex flex-col items-center justify-center p-3 text-center relative overflow-hidden">
            <span className="font-display font-black text-4xl tracking-tighter text-white italic drop-shadow-md">
              max
            </span>
            <span className="text-[9px] font-semibold text-blue-200/80 tracking-widest uppercase mt-0.5">
              STREAMING
            </span>
          </div>
        )

      case 'space':
        return (
          <div className="w-full h-full bg-[#0d0d0d] flex flex-col items-center justify-center p-3 text-center relative overflow-hidden">
            <span className="font-display font-black text-3xl tracking-widest text-white uppercase border-b-2 border-[#e31b23] pb-1">
              SPACE
            </span>
          </div>
        )

      case 'warner':
        return (
          <div className="w-full h-full bg-gradient-to-b from-[#003466] to-[#001428] flex flex-col items-center justify-center p-3 text-center relative">
            <div className="w-12 h-14 bg-gradient-to-b from-[#005cb9] to-[#002e62] border-2 border-white/80 rounded-b-full flex items-center justify-center shadow-lg">
              <span className="font-display font-black text-xl text-white">WB</span>
            </div>
            <span className="text-[9px] font-bold text-white/80 tracking-widest uppercase mt-1">
              WARNER CHANNEL
            </span>
          </div>
        )

      case 'espn':
        return (
          <div className="w-full h-full bg-[#cc0000] flex flex-col items-center justify-center p-3 text-center relative overflow-hidden">
            <span className="font-display font-black text-3xl tracking-wider text-white italic drop-shadow">
              ESPN
            </span>
          </div>
        )

      case 'paramount':
        return (
          <div className="w-full h-full bg-gradient-to-b from-[#003478] via-[#002253] to-[#00102b] flex flex-col items-center justify-center p-3 text-center relative overflow-hidden">
            <span className="font-display font-black text-2xl tracking-tight text-white uppercase drop-shadow">
              Paramount<span className="text-[#0064ff] font-black">+</span>
            </span>
            <span className="text-[10px] font-bold text-blue-200/90 tracking-widest uppercase mt-0.5">
              {channel.name}
            </span>
          </div>
        )

      case 'premiere':
        return (
          <div className="w-full h-full bg-gradient-to-br from-[#0c4a28] via-[#08301a] to-[#03150b] flex flex-col items-center justify-center p-3 text-center relative overflow-hidden border border-emerald-500/20">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-display font-black text-xl tracking-wider text-white uppercase">
                PREMIERE
              </span>
            </div>
            <span className="text-[10px] font-black text-[#facc15] tracking-widest uppercase mt-0.5">
              {channel.name.replace(/premiere/i, '').trim() || 'FUTEBOL'}
            </span>
          </div>
        )

      case 'bandsports':
        return (
          <div className="w-full h-full bg-gradient-to-r from-[#005a36] to-[#003822] flex flex-col items-center justify-center p-3 text-center relative">
            <span className="font-display font-black text-lg text-white tracking-tight uppercase">
              Band<span className="text-[#ffcb05]">Sports</span>
            </span>
          </div>
        )

      case 'cartoon':
        return (
          <div className="w-full h-full bg-black flex items-center justify-center gap-1.5 p-3">
            <div className="w-10 h-10 bg-white text-black font-display font-black text-2xl flex items-center justify-center shadow">
              C
            </div>
            <div className="w-10 h-10 bg-black text-white border-2 border-white font-display font-black text-2xl flex items-center justify-center shadow">
              N
            </div>
          </div>
        )

      case 'discovery':
        return (
          <div className="w-full h-full bg-gradient-to-r from-[#002b49] via-[#004b7a] to-[#002b49] flex flex-col items-center justify-center p-3 text-center">
            <span className="font-display font-black text-base text-white tracking-widest uppercase">
              DISCOVERY
            </span>
            <span className="text-[9px] font-bold text-[#00a3e0] uppercase tracking-wider">
              CHANNEL
            </span>
          </div>
        )

      case 'band':
        return (
          <div className="w-full h-full bg-gradient-to-br from-[#0c1824] via-[#102a45] to-[#0a1420] flex flex-col items-center justify-center p-3 text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg">
              <div className="w-6 h-6 rounded-full bg-[#0c1824]" />
            </div>
            <span className="font-display font-black text-sm text-white tracking-wider uppercase mt-1">
              BAND
            </span>
          </div>
        )

      case 'cultura':
        return (
          <div className="w-full h-full bg-white flex flex-col items-center justify-center p-3 text-center">
            <div className="w-11 h-11 rounded-full bg-[#009b3a] flex items-center justify-center shadow">
              <span className="text-white font-black text-lg">c</span>
            </div>
            <span className="font-display font-black text-xs text-black tracking-wider uppercase mt-1">
              CULTURA
            </span>
          </div>
        )

      case 'redetv':
        return (
          <div className="w-full h-full bg-gradient-to-tr from-[#021b3a] to-[#053875] flex flex-col items-center justify-center p-3 text-center">
            <span className="font-display font-black text-xl text-white tracking-tight uppercase">
              Rede<span className="text-emerald-400">TV!</span>
            </span>
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
    <div
      ref={ref}
      onClick={onClick}
      className={`flex flex-col group cursor-pointer select-none rounded-xl transition-all duration-200 outline-none ${
        focused ? 'tv-focused scale-[1.04]' : ''
      }`}
    >
      {/* Container 16:9 Landscape Card */}
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all duration-200 shadow-lg ${
          isSelected || focused
            ? 'border-amber-400 ring-4 ring-amber-400/40 shadow-[0_0_25px_rgba(251,191,36,0.6)] scale-[1.02]'
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
