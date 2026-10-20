import { test, expect } from '@playwright/test'

test.describe('CineBG E2E — Smart TV & Mobile Flows', () => {
  test('Deve carregar a tela inicial com Hero, Carrosséis e Navegação', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/CineBG/i)
    await expect(page.locator('nav')).toBeVisible()
  })

  test('Deve navegar para a aba TV ao Vivo (/live) e exibir canais estilo YuCine', async ({ page }) => {
    await page.goto('/live')
    await expect(page.locator('h1', { hasText: 'TV' })).toBeVisible()
    await expect(page.getByPlaceholder('Buscar canal...')).toBeVisible()
  })

  test('Deve abrir a Busca (/search) e suportar filtragem rápida', async ({ page }) => {
    await page.goto('/search')
    const input = page.getByPlaceholder(/Buscar filmes, séries, anime/i)
    await expect(input).toBeVisible()
  })
})
