import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.barrasoft.cinebg',
  appName: 'CineBG',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    // Restringe a navegação de topo do WebView à própria origem do app.
    // Assim, tentativas de redirect de iframes de anúncio NÃO sequestram o app
    // (são abertas externamente/ignoradas em vez de substituir a aplicação).
    allowNavigation: ['localhost'],
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0a0f',
    },
  },
}

export default config
