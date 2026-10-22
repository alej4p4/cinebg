import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.barrasoft.cinebg',
  appName: 'CineBG',
  webDir: 'dist',
  server: {
    // Em redes móveis (3G/4G), o WebView Android pode falhar ao carregar
    // assets locais via scheme http sem uma URL base definida.
    // Definir url como localhost força o carregamento nativo dos assets
    // empacotados no APK (dist/), evitando tela preta em conexões instáveis.
    url: 'http://localhost',
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
