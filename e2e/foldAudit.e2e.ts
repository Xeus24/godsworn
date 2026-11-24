import { expect, reveal, test, type Page } from './fixtures';

/**
 * Guards the fold audit (e2e/fixtures.ts). The first two tests break the rule on purpose and are marked as
 * expected to fail: if the audit ever stops catching them, they pass, and Playwright reports that as a failure.
 * The last test does the same steps the right way and must pass.
 */
async function openInventory(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: /new game/i }).click();
  await page.getByRole('button', { name: /randomize/i }).click();
  await page.getByPlaceholder('Name your hero').fill('Auditor');
  await page.getByRole('button', { name: /swear your oath/i }).click();
  await page.keyboard.press('i');
  await expect(page.locator('.inventory-body')).toBeVisible();
}

test.describe('the fold audit', () => {
  test.beforeEach(async ({ page }) => openInventory(page));

  test('fails a test that clicks inside a fold it opened by its title', async ({ page }) => {
    test.fail();
    await page.getByText('Sorting rule for this tab').click();
    await page.getByLabel('Claim Materials').check();
  });

  test('fails a test whose visibility check sees inside a fold it opened by its title', async ({ page }) => {
    test.fail();
    await page.getByText('Sorting rule for this tab').click();
    await expect(page.getByLabel('Claim Materials')).toBeVisible();
  });

  test('passes the same steps when reveal() opens the fold', async ({ page }) => {
    await (await reveal(page.getByLabel('Claim Materials'))).check();
    await expect(page.getByLabel('Claim Materials')).toBeVisible();
  });
});
