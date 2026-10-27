import { expect, test, type Page } from '@playwright/test';

/** New hero from the title screen, then open the inventory screen. */
async function openInventory(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: /new game/i }).click();
  await page.getByRole('button', { name: /randomize/i }).click();
  await page.getByPlaceholder('Name your hero').fill('Tester');
  await page.getByRole('button', { name: /swear your oath/i }).click();
  await page.keyboard.press('i');
  await expect(page.locator('.inventory-body')).toBeVisible();
}

const bagItems = (page: Page) => page.locator('[data-loc^="inventory:"].has-item');
const stashItems = (page: Page) => page.locator('[data-loc^="stash:0:"].has-item');

test.describe('inventory in a real browser', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (e) => {
      throw e;
    });
    await openInventory(page);
  });

  test('dragging a bag item onto a stash slot moves it, and Undo puts it back', async ({ page }) => {
    const before = await bagItems(page).count();
    expect(before).toBeGreaterThan(0);
    await bagItems(page).first().dragTo(page.locator('[data-loc="stash:0:5"]'));
    await expect(bagItems(page)).toHaveCount(before - 1);
    await expect(stashItems(page)).toHaveCount(1);
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(bagItems(page)).toHaveCount(before);
    await expect(stashItems(page)).toHaveCount(0);
  });

  test('shift-click sends an item across and keeps working with the keyboard alone', async ({ page }) => {
    const before = await bagItems(page).count();
    await bagItems(page).first().click({ modifiers: ['Shift'] });
    await expect(stashItems(page)).toHaveCount(1);
    await expect(bagItems(page)).toHaveCount(before - 1);
    // Keyboard only: focus a stash item and take it back with Shift+Enter.
    await stashItems(page).first().focus();
    await page.keyboard.press('Shift+Enter');
    await expect(stashItems(page)).toHaveCount(0);
    await expect(bagItems(page)).toHaveCount(before);
  });

  test('keyboard focus survives pressing buttons and toggling the view', async ({ page }) => {
    const sort = page.getByRole('button', { name: 'Sort', exact: true });
    await sort.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Sort', exact: true })).toBeFocused();
    const view = page.getByRole('button', { name: /list view/i });
    await view.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: /grid view/i })).toBeFocused();
    await expect(page.locator('.item-row').first()).toBeVisible();
  });

  test('list view lists the items, and arrow keys walk the rows', async ({ page }) => {
    await page.getByRole('button', { name: /list view/i }).click();
    const rows = page.locator('[data-loc^="inventory:"].item-row');
    const count = await rows.count();
    expect(count).toBeGreaterThan(1);
    await rows.first().focus();
    await page.keyboard.press('ArrowDown');
    await expect(rows.nth(1)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(rows.first()).toBeFocused();
  });

  test('search filters dim what does not match', async ({ page }) => {
    await page.getByPlaceholder('Search items...').fill('type:consumable');
    const lit = page.locator('[data-loc^="inventory:"].has-item:not(.dimmed)');
    await expect(lit.first()).toBeVisible();
    await page.getByPlaceholder('Search items...').fill('rarity:mythic');
    await expect(page.locator('[data-loc^="inventory:"].has-item:not(.dimmed)')).toHaveCount(0);
  });

  test('a stash tab sorting rule can be set from the page', async ({ page }) => {
    await page.getByText('Sorting rule for this tab').click();
    await page.getByLabel('Claim Materials').check();
    await expect(page.getByLabel('Claim Materials')).toBeChecked();
    await expect(page.locator('.tabs .tab', { hasText: 'Tab 1' }).filter({ hasText: '◈' })).toHaveCount(1);
  });
});
