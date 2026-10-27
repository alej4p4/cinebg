import { reportAdInterception } from '@/services/observability'
// ============================================================
// ESCUDO ANTI-REDIRECIONAMENTO E ANTI-POPUP DO CINEBG
// Impede que iframes de terceiros façam redirecionamentos
// da página principal ou abram abas de anúncios/apostas.
// ============================================================

let shieldInitialized = false
let shieldActive = false

const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  // Apenas cancela o evento se aplicável sem atribuir e.returnValue
  // para evitar o modal nativo "Confirmar navegação / Sair desta página"
  if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
    console.warn('[CineBG Anti-Ad] Redirecionamento de iframe detectado e suprimido!')
    try {
      reportAdInterception({
        blockedUrl: window.location.href,
        interceptionSource: 'iframe_top_navigation',
      })
    } catch {}
  }
}

// Instala o escudo uma única vez (idempotente), evitando
// empilhar listeners e re-embrulhar window.open a cada montagem do player.
export const initAntiRedirectShield = () => {
  if (typeof window === 'undefined' || shieldInitialized) return
  shieldInitialized = true

  // Bloqueia tentativas de window.open no escopo global retornando objeto seguro
  const dummyWindow = {
    closed: true,
    focus: () => {},
    blur: () => {},
    close: () => {},
    postMessage: () => {},
    location: { href: '', replace: () => {} },
  } as unknown as Window

  window.open = function (url?: string | URL, _target?: string, _features?: string) {
    console.warn('[CineBG Anti-Ad] Tentativa de pop-up bloqueada:', url)
    try {
      reportAdInterception({
        blockedUrl: String(url || 'unknown_popup'),
        interceptionSource: 'window.open',
      })
    } catch {}
    return dummyWindow
  }

  // Intercepta e bloqueia disparos de cliques em links externos/pop-up de propagandas
  window.addEventListener(
    'click',
    (e) => {
      const target = e.target as HTMLElement | null
      const link = target?.closest('a')
      if (link) {
        const href = link.getAttribute('href') || ''
        const targetAttr = link.getAttribute('target')
        const isExternal =
          href.startsWith('http://') ||
          href.startsWith('https://') ||
          targetAttr === '_blank'

        if (
          isExternal &&
          !href.startsWith(window.location.origin) &&
          !href.includes('github.com/alej4p4/cinebg')
        ) {
          e.preventDefault()
          e.stopPropagation()
          console.warn('[CineBG Anti-Ad] Clique de anúncio interceptado e bloqueado:', href)
          try {
            reportAdInterception({
              blockedUrl: href,
              interceptionSource: 'external_click',
            })
          } catch {}
        }
      }
    },
    { capture: true }
  )
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
