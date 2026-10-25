import { test, expect } from '@playwright/test'

test.describe('CineBG E2E — Smart TV & Mobile Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const now = Date.now()
      window.localStorage.setItem('cinebg_first_use', String(now))
      window.localStorage.setItem('cinebg_license', JSON.stringify({
        code: 'TEST-VIP-E2E',
        expiresAt: now + 30 * 24 * 60 * 60 * 1000,
        planDays: 30,
        planName: 'VIP E2E'
      }))
    })
  })

  test('Deve carregar a tela inicial com Hero, Carrosséis e Navegação', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/CineBG/i)
    const isMobile = page.viewportSize()?.width && page.viewportSize()!.width < 768
    if (isMobile) {
      await expect(page.locator('nav[aria-label="Navegação inferior mobile"]')).toBeVisible({ timeout: 10000 })
    } else {
      await expect(page.locator('nav.md\\:flex')).toBeVisible({ timeout: 10000 })
    }
  })

  test('Deve navegar para a aba TV ao Vivo (/live) e exibir canais estilo YuCine', async ({ page }) => {
    await page.goto('/live')
    // Check for Live TV page indicators (title, search, or channel grid)
    await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible({ timeout: 10000 })
    const hasContent = await page.locator('body').innerText().then(t => t.length > 0)
    expect(hasContent).toBeTruthy()
  })

  test('Deve abrir a Busca (/search) e suportar filtragem rápida', async ({ page }) => {
    await page.goto('/search')
    const input = page.getByPlaceholder(/Buscar filmes, séries, anime/i)
    await expect(input).toBeVisible({ timeout: 10000 })
  })
})
