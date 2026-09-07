import { test, expect } from '@playwright/test'

test('home page visual baseline', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveScreenshot('home-page.png', { fullPage: true })
})
