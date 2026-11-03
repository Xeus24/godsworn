import { expect, test } from '@playwright/test';

test('a companion\'s skill tree is an editable graph', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/');
  await page.getByRole('button', { name: /new game/i }).click();
  await page.getByRole('button', { name: /randomize/i }).click();
  await page.getByPlaceholder('Name your hero').fill('Grafter');
  await page.getByRole('button', { name: /swear your oath/i }).click();
  await expect(page.getByText('Brightwater', { exact: true }).first()).toBeVisible();

  // Recruit a companion and give them points with the debug panel.
  await page.keyboard.press('`');
  await page.getByRole('button', { name: /^Recruit /i }).first().click();
  await page.getByRole('button', { name: 'Max level' }).click();
  await page.keyboard.press('`');
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.keyboard.press('o');
  await expect(page.getByRole('heading', { name: /^Party \(/ })).toBeVisible();
  // Turn auto-allocate off so the graph is editable.
  const auto = page.getByLabel(/auto-allocate/i);
  if (await auto.isChecked()) await auto.uncheck();
  await page.getByRole('button', { name: 'Reset tree' }).click();
  const nodes = page.locator('.party-tree-stage .tree-node');
  await expect(nodes.first()).toBeVisible();
  expect(await nodes.count()).toBeGreaterThan(20);
  const before = await page.getByText(/points unspent/).first().innerText();
  await page.locator('.party-tree-stage .tree-node.available').first().click();
  await expect(page.getByText(/points unspent/).first()).not.toHaveText(before);
  // The list view is still there.
  await page.getByRole('button', { name: 'Show as list' }).click();
  await expect(page.locator('details summary').first()).toBeVisible();
  expect(errors).toEqual([]);
});
