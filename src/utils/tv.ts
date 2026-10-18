export const isTVDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false

  // Se o modo TV foi ativado previamente ou marcado pelo usuario
  if (localStorage.getItem('cinebg_tv_mode') === 'true') return true

  const ua = navigator.userAgent
  const isTvUa = /Android TV|GoogleTV|Google TV|SmartTV|SMART-TV|Tizen|WebOS|BRAVIA|AFT[MNBST]|AppleTV|tvOS|HbbTV|NetCast|Viera|Xbox|PlayStation|MiBOX|SHIELD|TVBOX|OTT|Chromecast|Nexus Player|Philips/i.test(
    ua,
  )
  if (isTvUa) return true

  // Deteccao para Android TV boxes e Smart TVs com UA generico
  const isLandscapeLarge = window.innerWidth >= 800 && window.innerWidth > window.innerHeight
  const noTouchOrTv = typeof navigator !== 'undefined' && (navigator.maxTouchPoints === 0 || navigator.maxTouchPoints === 1)
  if (isLandscapeLarge && noTouchOrTv) return true

  return false
}

/**
 * Ativa e persiste o modo TV no app
 */
export const markTvModeActive = () => {
  if (typeof window !== 'undefined') {
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
  const code = e.keyCode || e.which
  const key = e.key

  // Keycodes do Android TV D-Pad, Enter, Menu e Media:
  // 19: KEYCODE_DPAD_UP, 20: KEYCODE_DPAD_DOWN, 21: KEYCODE_DPAD_LEFT, 22: KEYCODE_DPAD_RIGHT
  // 23: KEYCODE_DPAD_CENTER, 66: KEYCODE_ENTER, 13: ENTER, 160: NUMPAD_ENTER, 96: BUTTON_A
  // 37: ArrowLeft, 38: ArrowUp, 39: ArrowRight, 40: ArrowDown
  // 82: KEYCODE_MENU, 4: KEYCODE_BACK
  if ([19, 20, 21, 22, 23, 66, 160, 96, 109, 13, 37, 38, 39, 40, 82].includes(code)) {
    markTvModeActive()
    return true
  }

  if (
    key === 'ArrowUp' ||
    key === 'ArrowDown' ||
    key === 'ArrowLeft' ||
    key === 'ArrowRight' ||
    key === 'Enter' ||
    key === 'Select' ||
    key === 'OK' ||
    key === 'ContextMenu' ||
    key === 'Menu' ||
    key?.startsWith('Media')
  ) {
    markTvModeActive()
    return true
  }

  return false
}
