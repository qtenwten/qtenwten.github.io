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
    await expect(page).toHaveURL(/\/(ru|en)\/(random-number|number-to-words|vat-calculator|calculator|qr-code-generator|password-generator)\//)
  })
})

test.describe('Article pages', () => {
  test('should load articles index', async ({ page }) => {
    await page.goto('/ru/articles/')

    const heading = page.locator('.tool-page-hero__title')
    await expect(heading).toBeVisible()
  })

  test('should load article detail', async ({ page }) => {
    await page.goto('/ru/articles/generator-sluchaynyh-chisel/')
    await expect(page.locator('.article-header-card')).toBeVisible()
  })
})

test.describe('QR Code Generator', () => {
  test('should render and generate QR', async ({ page }) => {
    await page.goto('/ru/qr-code-generator/')

    await expect(page.locator('.tool-page-hero__title')).toBeVisible()

    const urlInput = page.locator('#qrUrl')
    if (await urlInput.isVisible()) {
      await urlInput.fill('https://qsen.ru')
      await expect(page.locator('.qr-preview-canvas')).toBeVisible()
    }
  })
})

test.describe('Random Number Generator', () => {
  async function fillWheelItems(page, first = 'Арам', second = 'Сен') {
    await page.locator('.item-input').nth(0).fill(first)
    await page.locator('.item-input').nth(1).fill(second)
    await page.locator('.duration-custom-input').fill('1')
  }

  async function spinAndWaitForResult(page) {
    await page.locator('.spin-btn').click()
    await expect(page.locator('.picker-result')).toBeVisible({ timeout: 6000 })
  }

  test('should not let sequence history filter regular wheel mode', async ({ page }) => {
    await page.goto('/ru/random-number/')
    await page.locator('.mode-tab').nth(2).click()
    await fillWheelItems(page)

    await spinAndWaitForResult(page)
    await page.locator('.mode-tab').nth(1).click()

    await expect(page.locator('.item-input').nth(0)).toHaveValue('Арам')
    await expect(page.locator('.item-input').nth(1)).toHaveValue('Сен')
    await expect(page.locator('.spin-btn')).toBeEnabled()
  })

  test('should finish the last remaining sequence item', async ({ page }) => {
    await page.goto('/ru/random-number/')
    await page.locator('.mode-tab').nth(2).click()
    await fillWheelItems(page)

    await spinAndWaitForResult(page)
    await expect(page.locator('.remaining-counter')).toContainText('1')

    await page.locator('.re-spin-btn').click()
    await expect(page.locator('.all-chosen-message')).toBeVisible({ timeout: 6000 })
    await expect(page.locator('.re-spin-btn')).toHaveCount(0)
  })

  test('should keep mode tabs locked while the wheel is spinning', async ({ page }) => {
    await page.goto('/ru/random-number/')
    await page.locator('.mode-tab').nth(1).click()
    await fillWheelItems(page)

    await page.locator('.spin-btn').click()
    await expect(page.locator('.mode-tab').nth(0)).toBeDisabled()
    await expect(page.locator('.mode-tab').nth(2)).toBeDisabled()
    await expect(page.locator('.picker-result')).toBeVisible({ timeout: 6000 })
    await expect(page.locator('.mode-tab').nth(0)).toBeEnabled()
  })

  test('should keep wheel geometry stable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 })
    await page.goto('/ru/random-number/')
    await page.locator('.mode-tab').nth(1).click()
    await fillWheelItems(page, 'Alpha', 'Beta')

    const box = await page.locator('.wheel-wrapper').boundingBox()
    expect(Math.round(box.width)).toBe(260)
    expect(Math.round(box.height)).toBe(260)

    await spinAndWaitForResult(page)
  })
})
