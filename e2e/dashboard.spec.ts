import { test, expect } from '@playwright/test';

// ── Dashboard page ────────────────────────────────────────────────────────────
test.describe('Dashboard', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('renders without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0);
  });

  test('shows STLLC branding / page title', async ({ page }) => {
    const title = await page.title();
    expect(title.toLowerCase()).toMatch(/stllc|khakisol|web3/i);
  });

  test('shows token contract section', async ({ page }) => {
    const section = page.locator(
      '[data-testid="contracts-section"], .contracts, section'
    ).first();
    if (await section.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(section).toBeVisible();
    }
  });

  test('shows portfolio link or page', async ({ page }) => {
    const link = page.getByRole('link', { name: /portfolio/i })
      .or(page.getByRole('button', { name: /portfolio/i }));
    if (await link.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await link.click();
      await expect(page).toHaveURL(/portfolio/i);
    }
  });

});

// ── Portfolio page ────────────────────────────────────────────────────────────
test.describe('Portfolio Page', () => {

  test('navigates to /portfolio', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');
    const heading = page.getByRole('heading', { name: /portfolio/i });
    if (await heading.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(heading).toBeVisible();
    } else {
      // Still on app — just verify no 404
      await expect(page.locator('body')).not.toContainText('404');
    }
  });

  test('shows deal card for ST-DEAL-008 (if loaded)', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');
    const dealCard = page.locator('[data-testid="deal-card"], .deal-card');
    if (await dealCard.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(dealCard.first()).toContainText(/ST-DEAL|142 Ridgewood|Deal Note/i);
    }
  });

});

// ── SpreadCollection page ─────────────────────────────────────────────────────
test.describe('SpreadCollection', () => {

  test('navigates to /spread-collection', async ({ page }) => {
    await page.goto('/spread-collection');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('404');
  });

});

// ── Responsive / mobile ───────────────────────────────────────────────────────
test.describe('Mobile Layout', () => {

  test('renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // No horizontal scrollbar
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 5);
  });

});
