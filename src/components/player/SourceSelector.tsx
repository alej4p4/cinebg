import { STREAM_SOURCES } from '@/services/streams'
import { useAppStore } from '@/store/useAppStore'
import { Zap } from 'lucide-react'

const SourceSelector = () => {
  const { selectedSource, setSelectedSource } = useAppStore()

  return (
    <div className="space-y-2">
      <span className="text-xs text-white/50 flex items-center gap-1">
        <Zap className="h-3 w-3 text-accent-gold" />
        Escolha a Fonte de Streaming:
      </span>
      <div className="flex flex-wrap gap-2">
        {STREAM_SOURCES.map((source) => (
          <button
            key={source.id}
            onClick={() => setSelectedSource(source.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              selectedSource === source.id
                ? 'bg-accent-red border-accent-red text-white shadow-lg shadow-red-500/20'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/20'
            }`}
          >
            <span className="text-sm">{source.flagEmoji}</span>
            {source.name}
            {source.quality && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  selectedSource === source.id
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-white/50'
                }`}
              >
                {source.quality}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default SourceSelector
