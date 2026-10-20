/**
 * Detecta se o dispositivo atual é comprovadamente um celular ou tablet móvel
 * (orientação retrato, tela sensível ao toque, largura estreita ou sabor CineBG-Mobile).
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false

  const ua = navigator.userAgent
  // Identificação oficial de TV ou modo TV explícito: NUNCA é mobile
  if (ua.includes('DeviceType/TV') || ua.includes('CineBG-TV')) return false
  try {
    if (localStorage.getItem('cinebg_tv_mode') === 'true') return false
  } catch {}

  // Identificação oficial de celular/tablet CineBG
  if (ua.includes('DeviceType/Mobile') || ua.includes('CineBG-Mobile')) return true

  // Indicador explícito de smartphone / celular no User Agent
  const isPhoneUa = /iPhone|iPod|Android.*Mobile|Mobile.*Android|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  const isDedicatedTvUa = /Android TV|GoogleTV|Google TV|SmartTV|SMART-TV|Tizen|WebOS|BRAVIA|AFT[MNBST]|AppleTV|tvOS|HbbTV|NetCast|Viera|Xbox|PlayStation|MiBOX|SHIELD|TVBOX|OTT|Chromecast|Nexus Player|Philips|TX9|MX9|TX3|TX6|Tanix|H96|X96|Sunvell|Allwinner|Rockchip|Amlogic|Leelbox|Bqeel|FireTV|Fire TV/i.test(
    ua
  )

  // Se o User Agent indica celular e não é uma Smart TV de tela grande
  if (isPhoneUa && !isDedicatedTvUa) {
    return true
  }

  // Dispositivo em orientação retrato estrito (típico de celulares e tablets em pé; Smart TVs são estritamente 16:9 horizontais)
  if (window.innerHeight > window.innerWidth && !isDedicatedTvUa) {
    return true
  }

  // Telas menores que 600px de largura
  if (window.innerWidth < 600 && !isDedicatedTvUa) {
    return true
  }

  // Dispositivo móvel com tela de toque e proporção vertical/estreita
  const hasTouchScreen = (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || 'ontouchstart' in window
  if (hasTouchScreen && !isDedicatedTvUa && window.innerWidth < 850 && window.innerHeight >= window.innerWidth) {
    return true
  }

  return false
}

export const isTVDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false

  // Se o dispositivo é comprovadamente um celular/tablet, NUNCA é TV
  // (mesmo que o usuário tenha instalado temporariamente o APK de TV no celular)
  if (isMobileDevice()) {
    try {
      localStorage.removeItem('cinebg_tv_mode')
      localStorage.removeItem('cinebg_virtual_cursor')
      document.body.classList.remove('tv-mode', 'tv-remote-active')
    } catch {}
    return false
  }

  const ua = navigator.userAgent
  // Identificação oficial dos sabores CineBG TV e Mobile
  if (ua.includes('DeviceType/TV') || ua.includes('CineBG-TV')) return true
  if (ua.includes('DeviceType/Mobile') || ua.includes('CineBG-Mobile')) return false

  // Se o modo TV foi ativado previamente ou marcado pelo usuário em dispositivo compatível
  if (
    localStorage.getItem('cinebg_tv_mode') === 'true' ||
    localStorage.getItem('cinebg_virtual_cursor') === 'true'
  ) {
    return true
  }

  const isTvUa =
    /Android TV|GoogleTV|Google TV|SmartTV|SMART-TV|Tizen|WebOS|BRAVIA|AFT[MNBST]|AppleTV|tvOS|HbbTV|NetCast|Viera|Xbox|PlayStation|MiBOX|SHIELD|TVBOX|OTT|Chromecast|Nexus Player|Philips|TX9|MX9|TX3|TX6|Tanix|H96|X96|Sunvell|Allwinner|Rockchip|Amlogic|Leelbox|Bqeel|FireTV|Fire TV/i.test(
      ua,
    )
  if (isTvUa) return true

  // Detecção para Android TV boxes e Smart TVs com UA genérico em landscape
  const isLandscapeLarge = window.innerWidth >= 800 && window.innerWidth > window.innerHeight
  const isNotPhone = !/iPhone|iPod|Android.*Mobile|Mobile.*Android|BlackBerry|IEMobile/i.test(ua)
  if (isLandscapeLarge && isNotPhone) return true

  return false
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
