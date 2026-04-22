import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test('should load and display main content', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/QSEN/)
    await expect(page.locator('.logo-text')).toBeVisible()
    await expect(page.locator('.tool-card').first()).toBeVisible()
  })

  test('should have working language switcher', async ({ page }) => {
    await page.goto('/ru/')

    const langSwitcher = page.locator('.language-switcher')
    await expect(langSwitcher).toBeVisible()

    await langSwitcher.click()
    await expect(page).toHaveURL(/\/en\//)
  })

  test('should have working theme switcher', async ({ page }) => {
    await page.goto('/ru/')

    const themeSwitcher = page.locator('.theme-switcher')
    await expect(themeSwitcher).toBeVisible()

    await themeSwitcher.click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })

  test('should navigate to tool pages', async ({ page }) => {
    await page.goto('/ru/')

    await page.locator('.tool-card').first().click()
    await expect(page).toHaveURL(/\/(ru|en)\/(number-to-words|vat-calculator|calculator|qr-code-generator|password-generator)/)
  })
})

test.describe('Article pages', () => {
  test('should load articles index', async ({ page }) => {
    await page.goto('/ru/articles')

    const heading = page.locator('.tool-page-hero__title')
    await expect(heading).toBeVisible()
  })

  test('should load article detail', async ({ page }) => {
    await page.goto('/ru/articles')

    const firstArticle = page.locator('.article-card__link').first()
    if (await firstArticle.isVisible()) {
      await firstArticle.click()
      await expect(page.locator('.article-header-card')).toBeVisible()
    }
  })
})

test.describe('QR Code Generator', () => {
  test('should render and generate QR', async ({ page }) => {
    await page.goto('/ru/qr-code-generator')

    await expect(page.locator('.tool-page-hero__title')).toBeVisible()

    const urlInput = page.locator('#qrUrl')
    if (await urlInput.isVisible()) {
      await urlInput.fill('https://qsen.ru')
      await expect(page.locator('.qr-preview-canvas')).toBeVisible()
    }
  })
})