export const isTVDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isTvUa = /Android TV|GoogleTV|Google TV|SmartTV|SMART-TV|Tizen|WebOS|BRAVIA|AFT[MNBST]|AppleTV|tvOS|HbbTV|NetCast|Viera|Xbox|PlayStation|MiBOX|SHIELD|TVBOX|OTT|Chromecast|Nexus Player/i.test(
    ua,
  )
  if (isTvUa) return true

  // Deteccao adicional para Android TV boxes em WebViews com UA generico
  if (typeof window !== 'undefined') {
    const isLargeScreen = window.innerWidth >= 960 && window.innerHeight >= 540
    const noTouch = typeof navigator !== 'undefined' && navigator.maxTouchPoints === 0
    if (isLargeScreen && noTouch) return true
  }

  return false
}

/**
 * Verifica se o evento de teclado veio de um controle remoto ou D-Pad
 */
export const isTvRemoteKey = (e: KeyboardEvent): boolean => {
  const code = e.keyCode || e.which
  const key = e.key

  // Keycodes do Android TV D-Pad, Enter e Media:
  // 19: KEYCODE_DPAD_UP, 20: KEYCODE_DPAD_DOWN, 21: KEYCODE_DPAD_LEFT, 22: KEYCODE_DPAD_RIGHT
  // 23: KEYCODE_DPAD_CENTER, 66: KEYCODE_ENTER, 13: ENTER
  // 37: ArrowLeft, 38: ArrowUp, 39: ArrowRight, 40: ArrowDown
  if ([19, 20, 21, 22, 23, 66, 13, 37, 38, 39, 40].includes(code)) return true

  if (
    key === 'ArrowUp' ||
    key === 'ArrowDown' ||
    key === 'ArrowLeft' ||
    key === 'ArrowRight' ||
    key === 'Enter' ||
    key === 'Select' ||
    key === 'OK'
  ) {
    return true
  }

  return false
}
