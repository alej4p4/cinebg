// ============================================================
// ESCUDO ANTI-REDIRECIONAMENTO E ANTI-POPUP DO CINEBG
// Impede que iframes de terceiros façam redirecionamentos
// da página principal ou abram abas de anúncios/apostas.
// ============================================================

export const initAntiRedirectShield = () => {
  if (typeof window === 'undefined') return

  // 1. Bloqueia tentativas de window.open no escopo global
  const originalOpen = window.open
  window.open = function (url?: string | URL, target?: string, features?: string) {
    console.warn('[CineBG Anti-Ad] Tentativa de pop-up bloqueada:', url)
    return null
  }

  // 2. Trava a navegação de topo não autorizada
  let currentHost = window.location.host

  window.addEventListener('beforeunload', (e) => {
    // Se um iframe tentar redirecionar a página principal para fora da nossa aplicação
    if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
      console.warn('[CineBG Anti-Ad] Redirecionamento de iframe bloqueado!')
      e.preventDefault()
      e.returnValue = ''
      return ''
    }
  })
}
