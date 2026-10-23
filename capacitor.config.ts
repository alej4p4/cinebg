import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.barrasoft.cinebg',
  appName: 'CineBG',
  webDir: 'dist',
  server: {
    // NÃO definir server.url nem androidScheme: 'http'.
    // androidScheme: 'http' fazia o WebView Android tentar conectar a
    // http://localhost dentro do dispositivo (porta 80 inexistente),
    // causando 'connection refused' e tela preta.
    // Para assets locais (dist/) empacotados no APK, o Capacitor carrega
    // automaticamente via capacitor://localhost/ de
    // android/app/src/main/assets/public/.
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
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#08070d',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
}

export default config
