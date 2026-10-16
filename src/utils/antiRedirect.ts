// ============================================================
// ESCUDO ANTI-REDIRECIONAMENTO E ANTI-POPUP DO CINEBG
// Impede que iframes de terceiros façam redirecionamentos
// da página principal ou abram abas de anúncios/apostas.
// ============================================================

let shieldInitialized = false
let shieldActive = false

const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  // Se um iframe tentar redirecionar a página principal para fora da aplicação
  if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
    console.warn('[CineBG Anti-Ad] Redirecionamento de iframe bloqueado!')
    e.preventDefault()
    e.returnValue = ''
    return ''
  }
}

// Instala o escudo uma única vez (idempotente), evitando
// empilhar listeners e re-embrulhar window.open a cada montagem do player.
export const initAntiRedirectShield = () => {
  if (typeof window === 'undefined' || shieldInitialized) return
  shieldInitialized = true

  // Bloqueia tentativas de window.open no escopo global
  window.open = function (url?: string | URL, _target?: string, _features?: string) {
    console.warn('[CineBG Anti-Ad] Tentativa de pop-up bloqueada:', url)
    return null
  }
}

// Ativa/desativa o escudo de beforeunload conforme necessário
export const setAntiRedirectShieldActive = (active: boolean) => {
  if (typeof window === 'undefined' || !shieldInitialized) return
  if (active && !shieldActive) {
    shieldActive = true
    window.addEventListener('beforeunload', handleBeforeUnload)
  } else if (!active && shieldActive) {
    shieldActive = false
    window.removeEventListener('beforeunload', handleBeforeUnload)
  }
}

export const destroyAntiRedirectShield = () => {
  if (typeof window === 'undefined' || !shieldInitialized) return
  if (shieldActive) {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    shieldActive = false
  }
  shieldInitialized = false
}
