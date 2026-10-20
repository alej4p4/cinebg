export const DEFAULT_TV_APK_URL =
  'https://github.com/alej4p4/cinebg/releases/download/v1.0.18/CineBG-Tv-release.apk'
export const DEFAULT_MOBILE_APK_URL =
  'https://github.com/alej4p4/cinebg/releases/download/v1.0.18/CineBG-Mobile-release.apk'

export interface CineBGNativeBridge {
  getDeviceType?: () => string
  isTv?: () => boolean
  isMobile?: () => boolean
  getAppVersion?: () => string
  getAppVersionCode?: () => number
  getFirstInstallTime?: () => number
  syncFirstInstallTime?: (jsTimestamp: number) => number
  getHardwareDeviceId?: () => string
  getSavedLicense?: () => string
  saveLicense?: (licenseJson: string) => void
  setPlayerLandscape?: (landscape: boolean) => void
}

export const getCineBGNativeBridge = (): CineBGNativeBridge | null => {
  if (typeof window === 'undefined') return null
  try {
    return (window as unknown as { CineBGNative?: CineBGNativeBridge }).CineBGNative || null
  } catch {
    return null
  }
}

export const getNativeAppVersion = (fallback = '1.2.65'): string => {
  try {
    const bridge = getCineBGNativeBridge()
    if (bridge && typeof bridge.getAppVersion === 'function') {
      const v = bridge.getAppVersion()
      if (v && typeof v === 'string' && v.trim().length > 0) {
        return v.trim()
      }
    }
  } catch {}
  return fallback
}

/**
 * Compara versões semânticas (ex: "1.2.63" vs "1.2.62").
 * Retorna true ESTRITAMENTE se remoteVersion for MAIOR que currentVersion,
 * impedindo que cache de CDN com versão anterior ofereça downgrade ou entre em loop de atualização.
 */
export const isVersionNewer = (remoteVersion: string, currentVersion: string): boolean => {
  if (!remoteVersion || !currentVersion) return false
  const cleanRemote = remoteVersion.trim().replace(/^v/i, '')
  const cleanCurrent = currentVersion.trim().replace(/^v/i, '')
  if (cleanRemote === cleanCurrent) return false

  const rParts = cleanRemote.split('.').map((n) => parseInt(n, 10) || 0)
  const cParts = cleanCurrent.split('.').map((n) => parseInt(n, 10) || 0)
  const maxLen = Math.max(rParts.length, cParts.length)

  for (let i = 0; i < maxLen; i++) {
    const r = rParts[i] ?? 0
    const c = cParts[i] ?? 0
    if (r > c) return true
    if (r < c) return false
  }
  return false
}

export const setNativePlayerLandscape = (landscape: boolean) => {
  try {
    const bridge = getCineBGNativeBridge()
    if (bridge && typeof bridge.setPlayerLandscape === 'function') {
      bridge.setPlayerLandscape(landscape)
    }
  } catch {}
}

const getNativeDeviceType = (): 'mobile' | 'tv' | null => {
  try {
    const bridge = getCineBGNativeBridge()
    if (bridge && typeof bridge.getDeviceType === 'function') {
      const type = bridge.getDeviceType()
      if (type === 'mobile' || type === 'tv') return type
    }
    if (bridge && typeof bridge.isMobile === 'function') {
      return bridge.isMobile() ? 'mobile' : 'tv'
    }
  } catch {}
  return null
}

const DEDICATED_TV_UA_REGEX =
  /Android TV|GoogleTV|Google TV|SmartTV|SMART-TV|Tizen|WebOS|BRAVIA|AFT[MNBST]|AppleTV|tvOS|HbbTV|NetCast|Viera|Xbox|PlayStation|MiBOX|SHIELD|TVBOX|OTT|Chromecast|Nexus Player|Philips|TX9|MX9|TX3|TX6|Tanix|H96|X96|Sunvell|Allwinner|Rockchip|Amlogic|Leelbox|Bqeel|FireTV|Fire TV/i

const PHONE_MOBILE_UA_REGEX =
  /iPhone|iPod|iPad|Android.*Mobile|Mobile.*Android|BlackBerry|IEMobile|Opera Mini/i

/**
 * Detecta se o dispositivo atual é comprovadamente um celular ou tablet móvel
 * (independente se está em retrato ou paisagem/landscape, e imune a flags antigas no localStorage).
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false

  // 1. Prioridade absoluta para a ponte nativa Android (Hardware real verificado no Java)
  const nativeType = getNativeDeviceType()
  if (nativeType === 'mobile') return true
  if (nativeType === 'tv') return false

  const ua = navigator.userAgent || ''

  // 2. Identificação oficial injetada no User-Agent pelo WebView nativo
  if (ua.includes('DeviceType/Mobile') || ua.includes('CineBG-Mobile')) return true
  if (ua.includes('DeviceType/TV') || ua.includes('CineBG-TV')) return false

  const isDedicatedTvUa = DEDICATED_TV_UA_REGEX.test(ua)
  if (isDedicatedTvUa) return false

  // 3. Indicador explícito de smartphone / celular no User-Agent (vale em Retrato E Paisagem)
  if (PHONE_MOBILE_UA_REGEX.test(ua)) {
    return true
  }

  // 4. Verificação de tela sensível ao toque + menor dimensão da tela (independe da rotação retrato/paisagem)
  const shortSide = Math.min(window.innerWidth || 0, window.innerHeight || 0)
  const hasTouchScreen =
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
    'ontouchstart' in window ||
    (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches)

  if (hasTouchScreen && shortSide > 0 && shortSide <= 960) {
    return true
  }

  // 5. Dispositivo em orientação retrato ou largura estreita
  if ((window.innerHeight > window.innerWidth || window.innerWidth < 600) && !isDedicatedTvUa) {
    return true
  }

  return false
}

export const isTVDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false

  // 1. Prioridade absoluta para a ponte nativa Android
  const nativeType = getNativeDeviceType()
  if (nativeType === 'tv') return true
  if (nativeType === 'mobile') {
    try {
      localStorage.removeItem('cinebg_tv_mode')
      localStorage.removeItem('cinebg_virtual_cursor')
      document.body.classList.remove('tv-mode', 'tv-remote-active')
    } catch {}
    return false
  }

  // 2. Se o dispositivo é comprovadamente um celular/tablet, NUNCA é TV
  if (isMobileDevice()) {
    try {
      localStorage.removeItem('cinebg_tv_mode')
      localStorage.removeItem('cinebg_virtual_cursor')
      document.body.classList.remove('tv-mode', 'tv-remote-active')
    } catch {}
    return false
  }

  const ua = navigator.userAgent || ''
  // 3. Identificação oficial dos sabores CineBG TV e Mobile
  if (ua.includes('DeviceType/TV') || ua.includes('CineBG-TV')) return true
  if (ua.includes('DeviceType/Mobile') || ua.includes('CineBG-Mobile')) return false

  // 4. Se o modo TV foi ativado previamente em dispositivo que NÃO é celular
  try {
    if (
      localStorage.getItem('cinebg_tv_mode') === 'true' ||
      localStorage.getItem('cinebg_virtual_cursor') === 'true'
    ) {
      return true
    }
  } catch {}

  if (DEDICATED_TV_UA_REGEX.test(ua)) return true

  // 5. Detecção para Android TV boxes e Smart TVs com UA genérico em landscape (sem tela de toque de celular)
  const hasTouchScreen =
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || 'ontouchstart' in window
  const isLandscapeLarge = window.innerWidth >= 960 && window.innerWidth > window.innerHeight
  const isNotPhone = !PHONE_MOBILE_UA_REGEX.test(ua) && !hasTouchScreen
  if (isLandscapeLarge && isNotPhone) return true

  return false
}

/**
 * Retorna estritamente o sistema alvo do aparelho atual ('mobile' para Celular/Tablet ou 'tv' para Smart TV/TV Box)
 */
export const getDeviceFlavor = (): 'mobile' | 'tv' => {
  if (isMobileDevice()) return 'mobile'
  if (isTVDevice()) return 'tv'
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    const hasTouch =
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || 'ontouchstart' in window
    if (hasTouch) return 'mobile'
  }
  return 'tv'
}

export interface UpdateUrlPayload {
  version?: string
  downloadUrl?: string
  downloadUrlTv?: string
  downloadUrlMobile?: string
  tvUrl?: string
  mobileUrl?: string
}

/**
 * Resolve estritamente a URL do APK de atualização separando Celular (CineBG-Mobile-release.apk)
 * e Smart TV / TV Box (CineBG-Tv-release.apk), impedindo que um baixe a versão do outro.
 */
export const getDeviceUpdateUrl = (data?: UpdateUrlPayload | string | null): string => {
  const flavor = getDeviceFlavor()

  if (typeof data === 'string' && data.trim().length > 0) {
    const raw = data.trim()
    if (flavor === 'mobile') {
      return raw
        .replace('CineBG-Tv-release.apk', 'CineBG-Mobile-release.apk')
        .replace('-Tv-release.apk', '-Mobile-release.apk')
        .replace('/CineBG-release.apk', '/CineBG-Mobile-release.apk')
    }
    return raw
      .replace('CineBG-Mobile-release.apk', 'CineBG-Tv-release.apk')
      .replace('-Mobile-release.apk', '-Tv-release.apk')
      .replace('/CineBG-release.apk', '/CineBG-Tv-release.apk')
  }

  if (data && typeof data === 'object') {
    if (flavor === 'mobile') {
      const candidate =
        data.downloadUrlMobile || data.mobileUrl || data.downloadUrl || DEFAULT_MOBILE_APK_URL
      return candidate
        .replace('CineBG-Tv-release.apk', 'CineBG-Mobile-release.apk')
        .replace('-Tv-release.apk', '-Mobile-release.apk')
        .replace('/CineBG-release.apk', '/CineBG-Mobile-release.apk')
    }
    const candidate =
      data.downloadUrlTv || data.tvUrl || data.downloadUrl || DEFAULT_TV_APK_URL
    return candidate
      .replace('CineBG-Mobile-release.apk', 'CineBG-Tv-release.apk')
      .replace('-Mobile-release.apk', '-Tv-release.apk')
      .replace('/CineBG-release.apk', '/CineBG-Tv-release.apk')
  }

  return flavor === 'mobile' ? DEFAULT_MOBILE_APK_URL : DEFAULT_TV_APK_URL
}

export const getDeviceApkFilename = (): string => {
  return getDeviceFlavor() === 'mobile' ? 'CineBG-Mobile-release.apk' : 'CineBG-Tv-release.apk'
}

/**
 * Ativa e persiste o modo TV no app (apenas para dispositivos de TV legítimos)
 */
export const markTvModeActive = () => {
  if (typeof window !== 'undefined') {
    if (isMobileDevice()) {
      try {
        localStorage.removeItem('cinebg_tv_mode')
        localStorage.removeItem('cinebg_virtual_cursor')
        document.body.classList.remove('tv-mode', 'tv-remote-active')
      } catch {}
      return
    }

    try {
      localStorage.setItem('cinebg_tv_mode', 'true')
    } catch {}
    document.body.classList.add('tv-mode', 'tv-remote-active')
  }
}

/**
 * Verifica se o evento de teclado veio de um controle remoto ou D-Pad
 */
export const isTvRemoteKey = (e: KeyboardEvent): boolean => {
  // Dispositivos móveis nunca tratam teclas como controle remoto de TV
  if (isMobileDevice()) {
    return false
  }

  const activeEl = typeof document !== 'undefined' ? document.activeElement : null
  const isInputActive =
    activeEl &&
    (activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      (activeEl as HTMLElement).isContentEditable)

  // Quando o usuário está digitando em um campo de texto, não trata letras como controle remoto
  if (isInputActive) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape'].includes(e.key)) {
      return true
    }
    return false
  }

  const code = e.keyCode || e.which
  const key = e.key || ''

  // Keycodes do Android TV D-Pad e teclas de navegação específicas (sem colidir com letras A-Z: 65 a 90):
  // 19: DPAD_UP, 20: DPAD_DOWN, 21: DPAD_LEFT, 22: DPAD_RIGHT, 23: DPAD_CENTER
  // 13: ENTER, 4: KEYCODE_BACK, 165: INFO, 172: GUIDE
  if ([19, 20, 21, 22, 23, 13, 37, 38, 39, 40, 4, 165, 172].includes(code)) {
    markTvModeActive()
    return true
  }

  const k = key.toLowerCase()
  if (
    k === 'arrowup' ||
    k === 'arrowdown' ||
    k === 'arrowleft' ||
    k === 'arrowright' ||
    k === 'up' ||
    k === 'down' ||
    k === 'left' ||
    k === 'right' ||
    k === 'enter' ||
    k === 'select' ||
    k === 'ok' ||
    k === 'contextmenu' ||
    k === 'menu' ||
    k === 'info' ||
    k === 'guide' ||
    key.startsWith('Media')
  ) {
    markTvModeActive()
    return true
  }

  return false
}

/**
 * Rola um elemento para visualização de forma ágil e fluida para Smart TVs.
 * Se o elemento já estiver visível na tela, NÃO causa rolagem desnecessária.
 * Se precisar rolar, usa 'nearest' e rolagem direta para não sobrecarregar a CPU da TV.
 */
export const scrollTvElementIntoView = (
  el: HTMLElement | null,
  inlineOption: ScrollLogicalPosition = 'center'
) => {
  if (!el || typeof el.getBoundingClientRect !== 'function') return

  const rect = el.getBoundingClientRect()
  const marginX = 64
  const marginY = 64

  // Se já está visível dentro do viewport, evita qualquer reflow ou rolagem desnecessária
  const isVisibleHorizontally =
    rect.left >= marginX && rect.right <= window.innerWidth - marginX
  const isVisibleVertically =
    rect.top >= marginY && rect.bottom <= window.innerHeight - marginY

  if (isVisibleHorizontally && isVisibleVertically) {
    return
  }

  try {
    el.scrollIntoView({
      behavior: 'auto',
      block: 'nearest',
      inline: inlineOption,
    })
  } catch {
    try {
      el.scrollIntoView(false)
    } catch {}
  }
}

// Controle global de debounce do botão Voltar do controle remoto (evita disparo duplo entre keydown e Capacitor backButton)
let lastBackHandledTimestamp = 0

export const markBackHandled = () => {
  lastBackHandledTimestamp = Date.now()
}

export const wasBackRecentlyHandled = (windowMs = 600): boolean => {
  return Date.now() - lastBackHandledTimestamp < windowMs
}
