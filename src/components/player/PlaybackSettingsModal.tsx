import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2, Captions, Clock, Type, Palette, Check } from 'lucide-react'
import { SpatialNavigation } from '@noriginmedia/norigin-spatial-navigation'

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
  // Navegação D-Pad para controle remoto de Smart TV / Android TV:
  // Row 0: Áudio (2 colunas: dub, orig)
  // Row 1: Idioma Legenda (3 colunas: off, pt, en)
  // Row 2: Sincronização (3 colunas: -0.5s, +0.5s, resetar)
  // Row 3: Tamanho (3 colunas: md, lg, sm)
  // Row 4: Estilo (3 colunas: white, yellow, boxed)
  // Row 5: Sair (1 coluna)
  const [focusedRow, setFocusedRow] = useState<number>(1)
  const [focusedCol, setFocusedCol] = useState<number>(() => {
    return subtitleLang === 'off' ? 0 : subtitleLang === 'pt' ? 1 : 2
  })

  // Pausa a navegação espacial externa enquanto o modal de configurações estiver aberto
  useEffect(() => {
    if (isOpen) {
      try {
        SpatialNavigation.pause()
      } catch {}
      return () => {
        try {
          SpatialNavigation.resume()
        } catch {}
      }
    }
  }, [isOpen])

  // Ao abrir o modal, posiciona o foco diretamente na linha de legendas
  useEffect(() => {
    if (isOpen) {
      setFocusedRow(1)
      setFocusedCol(subtitleLang === 'off' ? 0 : subtitleLang === 'pt' ? 1 : 2)
    }
  }, [isOpen])

  // Move o foco DOM e faz scroll suave até o item ativo no controle remoto
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => {
      const el = document.querySelector(
        `[data-dpad-row="${focusedRow}"][data-dpad-col="${focusedCol}"]`
      ) as HTMLElement | null
      if (el) {
        el.focus()
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }, 40)
    return () => clearTimeout(timer)
  }, [isOpen, focusedRow, focusedCol])

  const getColCount = useCallback((row: number) => {
    switch (row) {
      case 0:
        return 2 // dub, orig
      case 1:
        return 3 // off, pt, en
      case 2:
        return 3 // -0.5, +0.5, reset
      case 3:
        return 3 // md, lg, sm
      case 4:
        return 3 // white, yellow, boxed
      case 5:
        return 1 // sair
      default:
        return 1
    }
  }, [])

  // Listener para teclas do Controle Remoto (D-Pad, OK, Voltar)
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.keyCode || e.which

      // Tecla Voltar / Escape (Android TV keycode 4, 10009, Escape, GoBack)
      if (
        e.key === 'Escape' ||
        code === 27 ||
        code === 10009 ||
        code === 4 ||
        e.key === 'GoBack' ||
        e.key === 'Backspace'
      ) {
        e.preventDefault()
        e.stopPropagation()
        onClose()
        return
      }

      // D-Pad Para Cima (ArrowUp / Keycode 19 / 38)
      if (e.key === 'ArrowUp' || code === 38 || code === 19) {
        e.preventDefault()
        e.stopPropagation()
        setFocusedRow((prevRow) => {
          const nextRow = Math.max(0, prevRow - 1)
          const colsInNext = getColCount(nextRow)
          setFocusedCol((prevCol) => Math.min(prevCol, colsInNext - 1))
          return nextRow
        })
        return
      }

      // D-Pad Para Baixo (ArrowDown / Keycode 20 / 40)
      if (e.key === 'ArrowDown' || code === 40 || code === 20) {
        e.preventDefault()
        e.stopPropagation()
        setFocusedRow((prevRow) => {
          const nextRow = Math.min(5, prevRow + 1)
          const colsInNext = getColCount(nextRow)
          setFocusedCol((prevCol) => Math.min(prevCol, colsInNext - 1))
          return nextRow
        })
        return
      }

      // D-Pad Para Esquerda (ArrowLeft / Keycode 21 / 37)
      if (e.key === 'ArrowLeft' || code === 37 || code === 21) {
        e.preventDefault()
        e.stopPropagation()
        setFocusedCol((prevCol) => Math.max(0, prevCol - 1))
        return
      }

      // D-Pad Para Direita (ArrowRight / Keycode 22 / 39)
      if (e.key === 'ArrowRight' || code === 39 || code === 22) {
        e.preventDefault()
        e.stopPropagation()
        setFocusedCol((prevCol) => {
          const maxCols = getColCount(focusedRow)
          return Math.min(maxCols - 1, prevCol + 1)
        })
        return
      }

      // Tecla OK / Enter / D-Pad Center (Keycode 13, 23, 66)
      if (e.key === 'Enter' || code === 13 || code === 23 || code === 66) {
        e.preventDefault()
        e.stopPropagation()

        switch (focusedRow) {
          case 0:
            if (focusedCol === 0) onChangeAudio('dub')
            else onChangeAudio('orig')
            break
          case 1:
            if (focusedCol === 0) {
              onChangeSubtitleLang('off')
            } else if (focusedCol === 1) {
              onChangeSubtitleLang(subtitleLang === 'pt' ? 'off' : 'pt')
            } else {
              onChangeSubtitleLang(subtitleLang === 'en' ? 'off' : 'en')
            }
            break
          case 2:
            if (focusedCol === 0) onChangeSubtitleDelay(-0.5)
            else if (focusedCol === 1) onChangeSubtitleDelay(0.5)
            else onResetSubtitleDelay()
            break
          case 3:
            if (focusedCol === 0) onChangeSubtitleSize('md')
            else if (focusedCol === 1) onChangeSubtitleSize('lg')
            else onChangeSubtitleSize('sm')
            break
          case 4:
            if (focusedCol === 0) onChangeSubtitleStyle('white')
            else if (focusedCol === 1) onChangeSubtitleStyle('yellow')
            else onChangeSubtitleStyle('boxed')
            break
          case 5:
            onClose()
            break
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [
    isOpen,
    focusedRow,
    focusedCol,
    getColCount,
    onChangeAudio,
    onChangeSubtitleLang,
    onChangeSubtitleDelay,
    onResetSubtitleDelay,
    onChangeSubtitleSize,
    onChangeSubtitleStyle,
    onClose,
  ])

  if (!isOpen) return null

  // Helpers de classes visuais para feedback de foco no controle remoto da TV
  const getOptionBtnClass = (row: number, col: number, isSelected: boolean) => {
    const isFocused = focusedRow === row && focusedCol === col
    if (isSelected && isFocused) {
      return 'bg-yellow-400 text-black border-yellow-300 ring-4 ring-white shadow-xl shadow-yellow-500/50 scale-105 z-10 font-bold'
    }
    if (isSelected) {
      return 'bg-yellow-400 text-black border-yellow-400 shadow-md shadow-yellow-500/30 font-bold'
    }
    if (isFocused) {
      return 'bg-white/20 text-white border-yellow-400 ring-4 ring-yellow-400 scale-105 z-10 shadow-lg font-bold'
    }
    return 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10 font-semibold'
  }

  const getActionBtnClass = (row: number, col: number) => {
    const isFocused = focusedRow === row && focusedCol === col
    if (isFocused) {
      return 'bg-yellow-400 text-black border-yellow-400 ring-4 ring-white scale-105 z-10 shadow-lg font-bold'
    }
    return 'bg-white/10 hover:bg-white/20 text-white border-white/10 font-bold'
  }

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
              title="Fechar (Voltar)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6 text-sm">
            {/* 1. Áudio (Row 0) */}
            <div>
              <div className="flex items-center gap-2 text-white/90 font-bold mb-3">
                <Volume2 className="w-4 h-4 text-yellow-400" />
                <span>Áudio</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  data-dpad-row="0"
                  data-dpad-col="0"
                  onClick={() => {
                    setFocusedRow(0)
                    setFocusedCol(0)
                    onChangeAudio('dub')
                  }}
                  onMouseEnter={() => {
                    setFocusedRow(0)
                    setFocusedCol(0)
                  }}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all border ${getOptionBtnClass(
                    0,
                    0,
                    audioOption === 'dub'
                  )} focus:outline-none`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                      audioOption === 'dub' ? 'border-yellow-400 bg-yellow-400' : 'border-white/40 bg-black/40'
                    }`}
                  >
                    {audioOption === 'dub' && <Check className="w-3 h-3 text-black stroke-[3.5]" />}
                  </span>
                  <span>Português (Dublado)</span>
                </button>

                <button
                  type="button"
                  data-dpad-row="0"
                  data-dpad-col="1"
                  onClick={() => {
                    setFocusedRow(0)
                    setFocusedCol(1)
                    onChangeAudio('orig')
                  }}
                  onMouseEnter={() => {
                    setFocusedRow(0)
                    setFocusedCol(1)
                  }}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all border ${getOptionBtnClass(
                    0,
                    1,
                    audioOption === 'orig'
                  )} focus:outline-none`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                      audioOption === 'orig' ? 'border-yellow-400 bg-yellow-400' : 'border-white/40 bg-black/40'
                    }`}
                  >
                    {audioOption === 'orig' && <Check className="w-3 h-3 text-black stroke-[3.5]" />}
                  </span>
                  <span>Inglês (Original)</span>
                </button>
              </div>
            </div>

            {/* 2. Idioma da Legenda (Row 1) */}
            <div>
              <div className="flex items-center gap-2 text-white/90 font-bold mb-3">
                <Captions className="w-4 h-4 text-yellow-400" />
                <span>Idioma da legenda</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  data-dpad-row="1"
                  data-dpad-col="0"
                  onClick={() => {
                    setFocusedRow(1)
                    setFocusedCol(0)
                    onChangeSubtitleLang('off')
                  }}
                  onMouseEnter={() => {
                    setFocusedRow(1)
                    setFocusedCol(0)
                  }}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all border ${getOptionBtnClass(
                    1,
                    0,
                    subtitleLang === 'off'
                  )} focus:outline-none`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                      subtitleLang === 'off' ? 'border-yellow-400 bg-yellow-400' : 'border-white/40 bg-black/40'
                    }`}
                  >
                    {subtitleLang === 'off' && <Check className="w-3 h-3 text-black stroke-[3.5]" />}
                  </span>
                  <span>Sem legendas</span>
                </button>

                <button
                  type="button"
                  data-dpad-row="1"
                  data-dpad-col="1"
                  onClick={() => {
                    setFocusedRow(1)
                    setFocusedCol(1)
                    onChangeSubtitleLang(subtitleLang === 'pt' ? 'off' : 'pt')
                  }}
                  onMouseEnter={() => {
                    setFocusedRow(1)
                    setFocusedCol(1)
                  }}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all border ${getOptionBtnClass(
                    1,
                    1,
                    subtitleLang === 'pt'
                  )} focus:outline-none`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                      subtitleLang === 'pt' ? 'border-yellow-400 bg-yellow-400' : 'border-white/40 bg-black/40'
                    }`}
                  >
                    {subtitleLang === 'pt' && <Check className="w-3 h-3 text-black stroke-[3.5]" />}
                  </span>
                  <span>Português (PT-BR)</span>
                </button>

                <button
                  type="button"
                  data-dpad-row="1"
                  data-dpad-col="2"
                  onClick={() => {
                    setFocusedRow(1)
                    setFocusedCol(2)
                    onChangeSubtitleLang(subtitleLang === 'en' ? 'off' : 'en')
                  }}
                  onMouseEnter={() => {
                    setFocusedRow(1)
                    setFocusedCol(2)
                  }}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all border ${getOptionBtnClass(
                    1,
                    2,
                    subtitleLang === 'en'
                  )} focus:outline-none`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                      subtitleLang === 'en' ? 'border-yellow-400 bg-yellow-400' : 'border-white/40 bg-black/40'
                    }`}
                  >
                    {subtitleLang === 'en' && <Check className="w-3 h-3 text-black stroke-[3.5]" />}
                  </span>
                  <span>Inglês (EN)</span>
                </button>
              </div>
            </div>

            {/* 3. Tempo de legendas / Sincronização (Row 2) */}
            <div>
              <div className="flex items-center gap-2 text-white/90 font-bold mb-3">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span>Tempo de legendas (Sincronização)</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  data-dpad-row="2"
                  data-dpad-col="0"
                  onClick={() => {
                    setFocusedRow(2)
                    setFocusedCol(0)
                    onChangeSubtitleDelay(-0.5)
                  }}
                  onMouseEnter={() => {
                    setFocusedRow(2)
                    setFocusedCol(0)
                  }}
                  className={`px-4 py-2 rounded-lg text-base border transition-all ${getActionBtnClass(
                    2,
                    0
                  )} focus:outline-none`}
                  title="Atrasar legenda 0.5s"
                >
                  − 0.5s
                </button>

                <span className="font-mono font-bold text-yellow-300 min-w-[70px] text-center bg-black/40 px-3 py-2 rounded-lg border border-white/10 text-sm">
                  {subtitleDelay > 0 ? `+${subtitleDelay.toFixed(1)}` : subtitleDelay.toFixed(1)} s
                </span>

                <button
                  type="button"
                  data-dpad-row="2"
                  data-dpad-col="1"
                  onClick={() => {
                    setFocusedRow(2)
                    setFocusedCol(1)
                    onChangeSubtitleDelay(0.5)
                  }}
                  onMouseEnter={() => {
                    setFocusedRow(2)
                    setFocusedCol(1)
                  }}
                  className={`px-4 py-2 rounded-lg text-base border transition-all ${getActionBtnClass(
                    2,
                    1
                  )} focus:outline-none`}
                  title="Adiantar legenda 0.5s"
                >
                  + 0.5s
                </button>

                <button
                  type="button"
                  data-dpad-row="2"
                  data-dpad-col="2"
                  onClick={() => {
                    setFocusedRow(2)
                    setFocusedCol(2)
                    onResetSubtitleDelay()
                  }}
                  onMouseEnter={() => {
                    setFocusedRow(2)
                    setFocusedCol(2)
                  }}
                  className={`ml-2 px-3.5 py-2 rounded-lg text-xs border transition-all ${getActionBtnClass(
                    2,
                    2
                  )} focus:outline-none`}
                >
                  Resetar (0s)
                </button>
              </div>
            </div>

            {/* 4. Tamanho da Legenda (Row 3) */}
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
                ].map(([val, label], colIdx) => (
                  <button
                    key={val}
                    type="button"
                    data-dpad-row="3"
                    data-dpad-col={colIdx}
                    onClick={() => {
                      setFocusedRow(3)
                      setFocusedCol(colIdx)
                      onChangeSubtitleSize(val as any)
                    }}
                    onMouseEnter={() => {
                      setFocusedRow(3)
                      setFocusedCol(colIdx)
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border ${getOptionBtnClass(
                      3,
                      colIdx,
                      subtitleSize === val
                    )} focus:outline-none`}
                  >
                    <span
                      className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                        subtitleSize === val ? 'border-black bg-black' : 'border-white/40'
                      }`}
                    >
                      {subtitleSize === val && <span className="w-1 h-1 rounded-full bg-yellow-400" />}
                    </span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Estilo da Legenda (Row 4) */}
            <div>
              <div className="flex items-center gap-2 text-white/90 font-bold mb-3">
                <Palette className="w-4 h-4 text-yellow-400" />
                <span>Estilo da legenda</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  data-dpad-row="4"
                  data-dpad-col="0"
                  onClick={() => {
                    setFocusedRow(4)
                    setFocusedCol(0)
                    onChangeSubtitleStyle('white')
                  }}
                  onMouseEnter={() => {
                    setFocusedRow(4)
                    setFocusedCol(0)
                  }}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all border ${getOptionBtnClass(
                    4,
                    0,
                    subtitleStyle === 'white'
                  )} focus:outline-none`}
                >
                  <span className="font-bold text-white bg-black/60 px-2 py-0.5 rounded text-xs border border-white/20">
                    Aa Branco
                  </span>
                </button>

                <button
                  type="button"
                  data-dpad-row="4"
                  data-dpad-col="1"
                  onClick={() => {
                    setFocusedRow(4)
                    setFocusedCol(1)
                    onChangeSubtitleStyle('yellow')
                  }}
                  onMouseEnter={() => {
                    setFocusedRow(4)
                    setFocusedCol(1)
                  }}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all border ${getOptionBtnClass(
                    4,
                    1,
                    subtitleStyle === 'yellow'
                  )} focus:outline-none`}
                >
                  <span className="font-bold text-yellow-400 bg-black/60 px-2 py-0.5 rounded text-xs border border-white/20">
                    Aa Amarelo
                  </span>
                </button>

                <button
                  type="button"
                  data-dpad-row="4"
                  data-dpad-col="2"
                  onClick={() => {
                    setFocusedRow(4)
                    setFocusedCol(2)
                    onChangeSubtitleStyle('boxed')
                  }}
                  onMouseEnter={() => {
                    setFocusedRow(4)
                    setFocusedCol(2)
                  }}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all border ${getOptionBtnClass(
                    4,
                    2,
                    subtitleStyle === 'boxed'
                  )} focus:outline-none`}
                >
                  <span className="font-bold text-yellow-300 bg-black px-2 py-0.5 rounded text-xs border border-yellow-400/40">
                    Aa Fundo Preto
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Dica de controle remoto TV e Botão Sair (Row 5) */}
          <div className="mt-8 pt-4 border-t border-white/10 flex flex-col items-center gap-3">
            <button
              type="button"
              data-dpad-row="5"
              data-dpad-col="0"
              onClick={onClose}
              onMouseEnter={() => {
                setFocusedRow(5)
                setFocusedCol(0)
              }}
              className={`w-full sm:w-60 py-3 rounded-2xl text-base transition-all border shadow-xl focus:outline-none ${
                focusedRow === 5 && focusedCol === 0
                  ? 'bg-yellow-400 text-black border-yellow-300 ring-4 ring-white scale-105 font-black shadow-yellow-500/50'
                  : 'bg-white/10 hover:bg-yellow-400 hover:text-black text-white border-white/20 font-bold'
              }`}
            >
              Sair / Salvar
            </button>
            <p className="text-[11px] text-yellow-300/80 text-center font-medium">
              Controle Remoto TV: Use as setas (▲ ▼ ◄ ►) para navegar e OK para marcar ou alterar legendas
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default PlaybackSettingsModal

