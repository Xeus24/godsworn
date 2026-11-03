import { expect, test } from '@playwright/test';

test('a battle shows Foresight, the Covenant, Shove / Pull and Talk with mercy', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/');
  await page.getByRole('button', { name: /new game/i }).click();
  await page.getByRole('button', { name: /randomize/i }).click();
  await page.getByPlaceholder('Name your hero').fill('Fielder');
  await page.getByRole('button', { name: /swear your oath/i }).click();
  await expect(page.getByText('THE INN').first()).toBeVisible();
  await page.getByRole('button', { name: /go to the arena/i }).click();
  await page.getByRole('button', { name: 'Fight', exact: true }).first().click();
  // The field strip: the Covenant gauge and the enemies' plans.
  await expect(page.locator('.field-strip')).toContainText('Covenant');
  await expect(page.locator('.field-strip')).toContainText('Foresight');
  // Shove / Pull has its own menu (let the opening animation settle first).
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Shove / Pull' }).click();
  await expect(page.getByRole('button', { name: /^Shove / }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /^Pull / }).first()).toBeVisible();
  await page.getByRole('button', { name: '← Back' }).click();
  await page.getByRole('button', { name: 'Talk', exact: true }).click();
  await expect(page.getByRole('button', { name: '← Back' })).toBeVisible();
  expect(errors).toEqual([]);
});
