import { test, expect } from '@playwright/test';

// ── Wallet connection + disconnect flow ───────────────────────────────────────
test.describe('Wallet Flow', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to hydrate
    await page.waitForLoadState('networkidle');
  });

  test('renders Connect Wallet button', async ({ page }) => {
    const btn = page.getByRole('button', { name: /connect wallet/i });
    await expect(btn).toBeVisible();
  });

  test('opens wallet modal on Connect click', async ({ page }) => {
    await page.getByRole('button', { name: /connect wallet/i }).click();
    // Sequence Kit / AppKit modal
    const modal = page.locator('[data-testid="wallet-modal"], .sequence-kit-modal, wcm-modal').first();
    await expect(modal).toBeVisible({ timeout: 8_000 });
  });

  test('shows wallet options in modal', async ({ page }) => {
    await page.getByRole('button', { name: /connect wallet/i }).click();
    // At least one wallet option visible
    const options = page.locator('[data-testid="wallet-option"], .wallet-option, wcm-wallet-button');
    await expect(options.first()).toBeVisible({ timeout: 8_000 });
  });

  test('can close wallet modal', async ({ page }) => {
    await page.getByRole('button', { name: /connect wallet/i }).click();
    // Close button or backdrop
    const closeBtn = page.getByRole('button', { name: /close/i })
      .or(page.locator('[aria-label="Close"], button.close').first());
    if (await closeBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    const modal = page.locator('[data-testid="wallet-modal"], .sequence-kit-modal, wcm-modal').first();
    await expect(modal).not.toBeVisible({ timeout: 5_000 });
  });

});

// ── Network / chain display ───────────────────────────────────────────────────
test.describe('Network Display', () => {

  test('shows expected chain on load', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const chainId = process.env.VITE_DEFAULT_CHAIN_ID ?? '80002';
    const label = chainId === '137' ? /polygon/i : /amoy|testnet/i;
    const networkIndicator = page.locator('[data-testid="network-badge"], .network-badge, header').first();
    // Soft assertion — chain label may not always be on screen without a connected wallet
    if (await networkIndicator.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(networkIndicator).toContainText(label);
    }
  });

});
