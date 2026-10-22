import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.barrasoft.cinebg',
  appName: 'CineBG',
  webDir: 'dist',
  server: {
    // NÃO definir server.url: isso faria o WebView Android tentar conectar
    // a http://localhost dentro do dispositivo (que não existe) causando
    // 'connection refused' e tela branca/preta.
    // Para assets locais (dist/) empacotados no APK, o Capacitor carrega
    // automaticamente de android/app/src/main/assets/public/.
    androidScheme: 'http',
    cleartext: true,
    allowNavigation: ['localhost', 'cinebg://*'],
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
