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

test.describe('SEO Audit Pro', () => {
  const auditPayload = {
    finalUrl: 'https://example.com/',
    status: 200,
    ok: true,
    contentType: 'text/html; charset=utf-8',
    title: 'Example landing page for product research',
    description: 'A concise page description that is long enough for a search snippet and short enough to avoid unnecessary truncation in search results.',
    robots: 'index,follow',
    canonical: 'https://example.com/',
    h1Text: 'Hi',
    h1Count: 1,
    h2Count: 2,
    h3Count: 1,
    imagesTotal: 4,
    imagesWithoutAlt: 2,
    hasStructuredData: true,
    openGraph: {
      title: 'Example landing page for product research',
      description: 'A concise Open Graph description.',
      image: 'https://example.com/og.png',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Example landing page for product research',
      description: 'A concise Twitter card description.',
      image: 'https://example.com/twitter.png',
    },
    lang: 'ru',
    viewport: 'width=device-width, initial-scale=1',
    internalLinks: 12,
    externalLinks: 3,
    wordCount: 320,
  }

  async function mockSeoAudit(page) {
    await page.route('https://seo-audit-api.qten.workers.dev/**', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(auditPayload),
      })
    })
  }

  async function runAudit(page) {
    await mockSeoAudit(page)
    await page.goto('/ru/seo-audit-pro/')
    await page.locator('#url').fill('https://example.com/')
    await page.locator('.seo-audit-pro-analyze-btn').click()
    await expect(page.locator('.seo-audit-pro-hero')).toBeVisible({ timeout: 10000 })
  }

  async function getCategoryCardLayout(page) {
    return page.evaluate(() => {
      const roundRect = (element) => {
        const rect = element.getBoundingClientRect()

        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          right: Math.round(rect.right),
        }
      }

      return [...document.querySelectorAll('.seo-audit-pro-category-card')].map((card) => ({
        card: roundRect(card),
        header: roundRect(card.querySelector('.seo-audit-pro-category-card__header')),
        score: roundRect(card.querySelector('.seo-audit-pro-category-card__score')),
        bar: roundRect(card.querySelector('.seo-audit-pro-category-card__bar')),
        footer: roundRect(card.querySelector('.seo-audit-pro-category-card__footer')),
        barFill: roundRect(card.querySelector('.seo-audit-pro-category-card__bar-fill')),
      }))
    })
  }

  async function getHeroSummaryLayout(page) {
    return page.evaluate(() => {
      const roundRect = (element) => {
        const rect = element.getBoundingClientRect()

        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          right: Math.round(rect.right),
          bottom: Math.round(rect.bottom),
        }
      }

      return {
        description: roundRect(document.querySelector('.seo-audit-pro-score-description')),
        badges: roundRect(document.querySelector('.seo-audit-pro-badges')),
      }
    })
  }

  function rectsOverlap(first, second) {
    return first.x < second.right
      && first.right > second.x
      && first.y < second.bottom
      && first.bottom > second.y
  }

  test('should render the issue-first SEO dashboard', async ({ page }) => {
    await runAudit(page)

    const ringBox = await page.locator('.seo-audit-pro-score-ring-svg').boundingBox()
    expect(Math.round(ringBox.width)).toBeGreaterThanOrEqual(140)
    expect(Math.round(ringBox.width)).toBeLessThanOrEqual(170)

    await expect.poll(() => page.locator('.seo-audit-pro-score-ring-track').evaluate((el) => getComputedStyle(el).fill)).toBe('none')

    const firstBar = await page.locator('.seo-audit-pro-category-card__bar-fill').first().boundingBox()
    expect(Math.round(firstBar.height)).toBeGreaterThan(0)

    const heroLayout = await getHeroSummaryLayout(page)
    expect(rectsOverlap(heroLayout.description, heroLayout.badges)).toBe(false)

    await expect(page.locator('.seo-audit-pro-check')).toHaveCount(2)

    await page.locator('.seo-audit-pro-filter').nth(4).click()
    await expect(page.locator('.seo-audit-pro-check--pass').first()).toBeVisible()
    await expect(page.locator('.seo-audit-pro-check__details')).toHaveCount(0)

    await page.locator('.seo-audit-pro-check__toggle').first().click()
    await expect(page.locator('.seo-audit-pro-check__details').first()).toBeVisible()
  })

  test('should keep category dashboard cards aligned and interactive', async ({ page }) => {
    await runAudit(page)

    const layout = await getCategoryCardLayout(page)
    expect(layout).toHaveLength(5)
    expect(layout.every((item) => item.barFill.height > 0)).toBe(true)

    for (const item of layout) {
      expect(item.header.x).toBeGreaterThanOrEqual(item.card.x)
      expect(item.header.right).toBeLessThanOrEqual(item.card.right)
      expect(item.score.x).toBeGreaterThanOrEqual(item.card.x)
      expect(item.score.right).toBeLessThanOrEqual(item.card.right)
      expect(item.bar.x).toBeGreaterThanOrEqual(item.card.x)
      expect(item.bar.right).toBeLessThanOrEqual(item.card.right)
      expect(item.footer.x).toBeGreaterThanOrEqual(item.card.x)
      expect(item.footer.right).toBeLessThanOrEqual(item.card.right)
    }

    for (const row of [layout.slice(0, 3), layout.slice(3)]) {
      const headerY = row[0].header.y
      const scoreY = row[0].score.y
      const barY = row[0].bar.y
      const footerY = row[0].footer.y

      expect(row.every((item) => item.header.y === headerY)).toBe(true)
      expect(row.every((item) => item.score.y === scoreY)).toBe(true)
      expect(row.every((item) => item.bar.y === barY)).toBe(true)
      expect(row.every((item) => item.footer.y === footerY)).toBe(true)
    }

    await page.locator('.seo-audit-pro-category-card').filter({ hasText: 'Контент' }).click()
    await expect(page.locator('.seo-audit-pro-check')).toHaveCount(1)
    await expect(page.locator('.seo-audit-pro-check')).toContainText('Длина H1')
  })

  test('should keep the SEO dashboard stable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 })
    await runAudit(page)

    const ringBox = await page.locator('.seo-audit-pro-score-ring-svg').boundingBox()
    expect(Math.round(ringBox.width)).toBeGreaterThanOrEqual(104)
    expect(Math.round(ringBox.width)).toBeLessThanOrEqual(120)

    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(hasHorizontalOverflow).toBe(false)

    const layout = await getCategoryCardLayout(page)
    expect(layout).toHaveLength(5)
    expect(layout.every((item) => item.card.x >= 0 && item.card.right <= 390)).toBe(true)
    expect(layout.every((item) => item.barFill.height > 0)).toBe(true)
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

  test('should restore a suspended wheel audio context', async ({ page }) => {
    await page.addInitScript(() => {
      window.__wheelAudioEvents = []
      window.__wheelAudioContexts = []

      class MockAudioContext {
        constructor() {
          this.state = 'running'
          this.currentTime = 1
          this.destination = {}
          window.__wheelAudioContexts.push(this)
          window.__wheelAudioEvents.push({ type: 'create-context' })
        }

        createOscillator() {
          const context = this
          window.__wheelAudioEvents.push({ type: 'create-oscillator', state: context.state })

          return {
            frequency: { value: 0 },
            type: 'sine',
            connect() {},
            start() {
              window.__wheelAudioEvents.push({ type: 'oscillator-start', state: context.state })
            },
            stop() {},
          }
        }

        createGain() {
          return {
            connect() {},
            gain: {
              setValueAtTime() {},
              exponentialRampToValueAtTime() {},
            },
          }
        }

        async suspend() {
          this.state = 'suspended'
          window.__wheelAudioEvents.push({ type: 'suspend-called' })
        }

        async resume() {
          window.__wheelAudioEvents.push({ type: 'resume-called' })
          this.state = 'running'
        }

        async close() {
          this.state = 'closed'
          window.__wheelAudioEvents.push({ type: 'close-called' })
        }
      }

      Object.defineProperty(window, 'AudioContext', {
        configurable: true,
        writable: true,
        value: MockAudioContext,
      })
      Object.defineProperty(window, 'webkitAudioContext', {
        configurable: true,
        writable: true,
        value: MockAudioContext,
      })
    })

    await page.goto('/ru/random-number/')
    await page.locator('.mode-tab').nth(1).click()
    await fillWheelItems(page, 'Alpha', 'Beta')

    await spinAndWaitForResult(page)
    await expect.poll(() => page.evaluate(() => window.__wheelAudioEvents.some(event => event.type === 'create-context'))).toBe(true)

    await page.evaluate(async () => {
      window.__wheelAudioEvents = []
      await window.__wheelAudioContexts.at(-1).suspend()
      window.__wheelAudioEvents = []
    })

    await page.locator('.re-spin-btn').click()
    await expect.poll(() => page.evaluate(() => window.__wheelAudioEvents.some(event => event.type === 'resume-called'))).toBe(true)
    await expect(page.locator('.picker-result')).toBeVisible({ timeout: 6000 })

    await page.evaluate(async () => {
      window.__wheelAudioEvents = []
      await window.__wheelAudioContexts.at(-1).suspend()
      window.__wheelAudioEvents = []
    })

    const soundToggle = page.locator('.sound-toggle')
    await soundToggle.click()
    await expect(soundToggle).toHaveClass(/is-muted/)
    await soundToggle.click()
    await expect.poll(() => page.evaluate(() => window.__wheelAudioEvents.some(event => event.type === 'resume-called'))).toBe(true)
  })
})
