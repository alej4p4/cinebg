import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: ['es2020', 'chrome80', 'safari13'],
    // hls.js (~520 kB) é isolado em chunk próprio e carregado só no player
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          store: ['zustand'],
          hls: ['hls.js'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api/mgeb': {
        target: 'https://mgeb.site',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mgeb/, ''),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Referer': 'https://mgeb.site/',
        },
      },
    },
  },
})
