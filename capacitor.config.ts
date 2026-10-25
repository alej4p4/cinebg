import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.barrasoft.cinebg',
  appName: 'CineBG',
  webDir: 'dist',
  server: {
    // NÃO definir server.url: o WebView Android deve carregar os assets
    // locais de dist/ empacotados em android/app/src/main/assets/public/.
    // O scheme padrão 'https' do Capacitor com cleartext: true garante
    // carregamento dos arquivos locais via https://localhost e streams HTTP.
    cleartext: true,
    allowNavigation: ['*'],
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0a0f',
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#08070d',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
}

export default config
