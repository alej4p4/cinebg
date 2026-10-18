import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2, Captions, Clock, Type, Palette } from 'lucide-react'

export interface PlaybackSettingsProps {
  isOpen: boolean
  onClose: () => void
  audioOption: 'dub' | 'orig'
  onChangeAudio: (opt: 'dub' | 'orig') => void
  subtitleLang: 'off' | 'pt' | 'en'
  onChangeSubtitleLang: (lang: 'off' | 'pt' | 'en') => void
  subtitleDelay: number
  onChangeSubtitleDelay: (delta: number) => void
  onResetSubtitleDelay: () => void
  subtitleSize: 'sm' | 'md' | 'lg'
  onChangeSubtitleSize: (size: 'sm' | 'md' | 'lg') => void
  subtitleStyle: 'white' | 'yellow' | 'boxed'
  onChangeSubtitleStyle: (style: 'white' | 'yellow' | 'boxed') => void
}

export const PlaybackSettingsModal: React.FC<PlaybackSettingsProps> = ({
  isOpen,
  onClose,
  audioOption,
  onChangeAudio,
  subtitleLang,
  onChangeSubtitleLang,
  subtitleDelay,
  onChangeSubtitleDelay,
  onResetSubtitleDelay,
  subtitleSize,
  onChangeSubtitleSize,
  subtitleStyle,
  onChangeSubtitleStyle,
}) => {
  const firstFocusRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => {
      firstFocusRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [isOpen])

  // Trata tecla Voltar (Escape / Back)
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.keyCode || e.which
      if (e.key === 'Escape' || code === 27 || code === 10009 || code === 4) {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-[#161822]/95 border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl text-white max-h-[90vh] overflow-y-auto scroll-hide"
        >
          {/* Cabeçalho */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
            <h2 className="font-display font-black text-xl md:text-2xl text-white tracking-wide">
              Configurações de reprodução
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6 text-sm">
            {/* 1. Áudio */}
            <div>
              <div className="flex items-center gap-2 text-white/90 font-bold mb-3">
                <Volume2 className="w-4 h-4 text-yellow-400" />
                <span>Áudio</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  ref={firstFocusRef}
                  onClick={() => onChangeAudio('dub')}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold transition-all border ${
                    audioOption === 'dub'
                      ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg shadow-yellow-500/30'
                      : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                  } focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:scale-105`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${audioOption === 'dub' ? 'border-black bg-black' : 'border-white/40'}`}>
                    {audioOption === 'dub' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
                  </span>
                  <span>Português (Dublado)</span>
                </button>

                <button
                  onClick={() => onChangeAudio('orig')}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold transition-all border ${
                    audioOption === 'orig'
                      ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg shadow-yellow-500/30'
                      : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                  } focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:scale-105`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${audioOption === 'orig' ? 'border-black bg-black' : 'border-white/40'}`}>
                    {audioOption === 'orig' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
                  </span>
                  <span>Inglês (Original)</span>
                </button>
              </div>
            </div>

            {/* 2. Idioma da Legenda */}
            <div>
              <div className="flex items-center gap-2 text-white/90 font-bold mb-3">
                <Captions className="w-4 h-4 text-yellow-400" />
                <span>Idioma da legenda</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => onChangeSubtitleLang('off')}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-xl font-semibold transition-all border ${
                    subtitleLang === 'off'
                      ? 'bg-yellow-400 text-black border-yellow-400 shadow-md shadow-yellow-500/30'
                      : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                  } focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:scale-105`}
                >
                  <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${subtitleLang === 'off' ? 'border-black bg-black' : 'border-white/40'}`}>
                    {subtitleLang === 'off' && <span className="w-1 h-1 rounded-full bg-yellow-400" />}
                  </span>
                  <span>Sem legendas</span>
                </button>

                <button
                  onClick={() => onChangeSubtitleLang('pt')}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-xl font-semibold transition-all border ${
                    subtitleLang === 'pt'
                      ? 'bg-yellow-400 text-black border-yellow-400 shadow-md shadow-yellow-500/30'
                      : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                  } focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:scale-105`}
                >
                  <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${subtitleLang === 'pt' ? 'border-black bg-black' : 'border-white/40'}`}>
                    {subtitleLang === 'pt' && <span className="w-1 h-1 rounded-full bg-yellow-400" />}
                  </span>
                  <span>Português</span>
                </button>

                <button
                  onClick={() => onChangeSubtitleLang('en')}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-xl font-semibold transition-all border ${
                    subtitleLang === 'en'
                      ? 'bg-yellow-400 text-black border-yellow-400 shadow-md shadow-yellow-500/30'
                      : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                  } focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:scale-105`}
                >
                  <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${subtitleLang === 'en' ? 'border-black bg-black' : 'border-white/40'}`}>
                    {subtitleLang === 'en' && <span className="w-1 h-1 rounded-full bg-yellow-400" />}
                  </span>
                  <span>Inglês</span>
                </button>
              </div>
            </div>

            {/* 3. Tiempo de subtítulos (Sincronização) */}
            <div>
              <div className="flex items-center gap-2 text-white/90 font-bold mb-3">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span>Tiempo de subtítulos</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onChangeSubtitleDelay(-0.5)}
                  className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 font-bold text-base focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400"
                >
                  −
                </button>
                <span className="font-mono font-bold text-yellow-300 min-w-[70px] text-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                  {subtitleDelay > 0 ? `+${subtitleDelay.toFixed(1)}` : subtitleDelay.toFixed(1)} s
                </span>
                <button
                  onClick={() => onChangeSubtitleDelay(0.5)}
                  className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 font-bold text-base focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400"
                >
                  +
                </button>
                <button
                  onClick={onResetSubtitleDelay}
                  className="ml-2 px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white text-xs font-semibold border border-white/10 focus:outline-none focus:ring-4 focus:ring-yellow-400"
                >
                  Hora das legendas (Resetar)
                </button>
              </div>
            </div>

            {/* 4. Tamanho da Legenda */}
            <div>
              <div className="flex items-center gap-2 text-white/90 font-bold mb-3">
                <Type className="w-4 h-4 text-yellow-400" />
                <span>Tamanho da legenda</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  ['md', 'Normal'],
                  ['lg', 'Grande'],
                  ['sm', 'Pequeno'],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => onChangeSubtitleSize(val as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all border ${
                      subtitleSize === val
                        ? 'bg-yellow-400 text-black border-yellow-400 shadow-md shadow-yellow-500/30'
                        : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                    } focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:scale-105`}
                  >
                    <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${subtitleSize === val ? 'border-black bg-black' : 'border-white/40'}`}>
                      {subtitleSize === val && <span className="w-1 h-1 rounded-full bg-yellow-400" />}
                    </span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Estilo da Legenda */}
            <div>
              <div className="flex items-center gap-2 text-white/90 font-bold mb-3">
                <Palette className="w-4 h-4 text-yellow-400" />
                <span>Estilo da legenda</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => onChangeSubtitleStyle('white')}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-xl font-semibold transition-all border ${
                    subtitleStyle === 'white'
                      ? 'bg-yellow-400 text-black border-yellow-400'
                      : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                  } focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:scale-105`}
                >
                  <span className="font-bold text-white bg-black/60 px-2 py-0.5 rounded text-xs border border-white/20">Aa Branco</span>
                </button>

                <button
                  onClick={() => onChangeSubtitleStyle('yellow')}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-xl font-semibold transition-all border ${
                    subtitleStyle === 'yellow'
                      ? 'bg-yellow-400 text-black border-yellow-400'
                      : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                  } focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:scale-105`}
                >
                  <span className="font-bold text-yellow-400 bg-black/60 px-2 py-0.5 rounded text-xs border border-white/20">Aa Amarelo</span>
                </button>

                <button
                  onClick={() => onChangeSubtitleStyle('boxed')}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-xl font-semibold transition-all border ${
                    subtitleStyle === 'boxed'
                      ? 'bg-yellow-400 text-black border-yellow-400'
                      : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                  } focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:scale-105`}
                >
                  <span className="font-bold text-yellow-300 bg-black px-2 py-0.5 rounded text-xs border border-yellow-400/40">Aa Fundo Preto</span>
                </button>
              </div>
            </div>
          </div>

          {/* Botão Sair */}
          <div className="mt-8 pt-4 border-t border-white/10 flex flex-col items-center gap-3">
            <button
              onClick={onClose}
              className="w-full sm:w-60 py-3 rounded-2xl bg-white/10 hover:bg-yellow-400 hover:text-black font-bold text-base transition-all border border-white/20 focus:outline-none focus:bg-yellow-400 focus:text-black focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 focus:scale-105 shadow-xl"
            >
              Sair
            </button>
            <p className="text-[11px] text-white/40 text-center">
              Se quiser aplicar essa configuração a todos os programas, vá para Centro Pessoal → Configurações globais de reprodução
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default PlaybackSettingsModal
