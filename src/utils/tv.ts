export const isTVDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false

  // Se o modo TV foi ativado previamente ou marcado pelo usuario
  if (
    localStorage.getItem('cinebg_tv_mode') === 'true' ||
    localStorage.getItem('cinebg_virtual_cursor') === 'true'
  ) {
    return true
  }

  const ua = navigator.userAgent
  const isTvUa =
    /Android TV|GoogleTV|Google TV|SmartTV|SMART-TV|Tizen|WebOS|BRAVIA|AFT[MNBST]|AppleTV|tvOS|HbbTV|NetCast|Viera|Xbox|PlayStation|MiBOX|SHIELD|TVBOX|OTT|Chromecast|Nexus Player|Philips|TX9|MX9|TX3|TX6|Tanix|H96|X96|Sunvell|Allwinner|Rockchip|Amlogic|Leelbox|Bqeel|FireTV|Fire TV/i.test(
      ua,
    )
  if (isTvUa) return true

  // Deteccao para Android TV boxes e Smart TVs com UA generico
  const isLandscapeLarge = window.innerWidth >= 800 && window.innerWidth > window.innerHeight
  const noTouchOrTv =
    typeof navigator !== 'undefined' &&
    (navigator.maxTouchPoints === 0 || navigator.maxTouchPoints === 1)
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
  const key = e.key || ''

  // Keycodes do Android TV D-Pad, Enter, Menu, Media e Teclas Comuns:
  // 19: KEYCODE_DPAD_UP, 20: KEYCODE_DPAD_DOWN, 21: KEYCODE_DPAD_LEFT, 22: KEYCODE_DPAD_RIGHT
  // 23: KEYCODE_DPAD_CENTER, 66: KEYCODE_ENTER, 13: ENTER, 160: NUMPAD_ENTER, 96: BUTTON_A
  // 37: ArrowLeft, 38: ArrowUp, 39: ArrowRight, 40: ArrowDown
  // 82: KEYCODE_MENU, 4: KEYCODE_BACK, 109: SELECT, 165: INFO, 172: GUIDE
  if (
    [
      19, 20, 21, 22, 23, 66, 160, 96, 109, 13, 37, 38, 39, 40, 82, 4, 165,
      172,
    ].includes(code)
  ) {
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
export const scrollTvElementIntoView = (el: HTMLElement | null) => {
  if (!el || typeof el.getBoundingClientRect !== 'function') return

  const rect = el.getBoundingClientRect()
  const marginX = 48
  const marginY = 54

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
      inline: 'nearest',
    })
  } catch {
    try {
      el.scrollIntoView(false)
    } catch {}
  }
}

