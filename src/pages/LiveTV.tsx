import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { LIVE_CHANNELS, type LiveChannel } from '@/services/streams'

const LiveTV = () => {
  const [selectedChannel, setSelectedChannel] = useState<LiveChannel | null>(null)

  return (
    <motion.div
      className="min-h-screen bg-bg-primary pt-20 page-enter"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        <div className="py-6">
          <h1 className="font-display font-black text-3xl text-white flex items-center gap-2">
            📡 TV ao Vivo
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Canais de streaming gratuitos 24/7
          </p>
        </div>

        {selectedChannel ? (
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedChannel.logo}</span>
                <div>
                  <h2 className="text-white font-bold">{selectedChannel.name}</h2>
                  <p className="text-white/50 text-xs">{selectedChannel.category}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedChannel(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
              >
                Fechar Player
              </button>
            </div>
            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/10">
              <iframe
                src={selectedChannel.embedUrl}
                className="w-full h-full border-none"
                allowFullScreen
                allow="autoplay; encrypted-media"
                title={selectedChannel.name}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {LIVE_CHANNELS.map((channel, i) => (
              <motion.div
                key={channel.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                onClick={() => setSelectedChannel(channel)}
                className="bg-bg-card border border-white/5 hover:border-accent-red/50 rounded-xl p-5 cursor-pointer group transition-all hover:bg-white/5 tv-focusable"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl filter drop-shadow-md group-hover:scale-110 transition-transform">
                    {channel.logo}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-accent-red/20 text-accent-red flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-4 w-4 fill-current" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-red-400 transition-colors">
                  {channel.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50 bg-white/5 px-2 py-1 rounded">
                    {channel.category}
                  </span>
                  <span className="text-xs text-white/50">
                    {channel.country === 'BR' ? '🇧🇷' : channel.country === 'US' ? '🇺🇸' : '🇯🇵'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default LiveTV
