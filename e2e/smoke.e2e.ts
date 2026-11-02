import { expect, test, type Page } from '@playwright/test';

async function newHero(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /new game/i })).toBeVisible();
  await page.getByRole('button', { name: /new game/i }).click();
  await page.getByRole('button', { name: /randomize/i }).click();
  await page.getByPlaceholder('Name your hero').fill('Smoke');
  await page.getByRole('button', { name: /swear your oath/i }).click();
}

test.describe('screens added after phase 14 in a real browser', () => {
  test('title, hero, town, Pastimes, Party and Endgame open without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await newHero(page);
    // Brightwater's town screen.
    await expect(page.getByText('Brightwater', { exact: true }).first()).toBeVisible();

    // Pastimes: opens, lists the games, and returns to town.
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.getByText(/Pastimes in Brightwater/)).toBeVisible();
    await page.getByRole('button', { name: /back to town/i }).click();
    await expect(page.getByText('THE INN', { exact: false }).first()).toBeVisible();

    // Party (Camp): by the hotkey and the tab.
    await page.keyboard.press('o');
    await expect(page.getByRole('heading', { name: /^Party \(/ })).toBeVisible();
    await page.keyboard.press('g');
    await page.getByRole('button', { name: /enter brightwater/i }).click();
    await expect(page.getByText('THE INN').first()).toBeVisible();

    // Codex tabs: families, backgrounds, companions, cards, ship, completion.
    await page.keyboard.press('b');
    for (const tab of ['By family', 'Backgrounds', 'Companions', 'Cards', 'Ship', 'Completion']) {
      await page.getByRole('button', { name: tab, exact: true }).click();
      await expect(page.locator('.sheet section.panel, .sheet .panel').first()).toBeVisible();
    }
    await page.keyboard.press('g');
    await page.getByRole('button', { name: /enter brightwater/i }).click();

    // Endgame: raise the hero to the level cap with the debug panel, then open the Rift Gate.
    await page.keyboard.press('`');
    await page.getByRole('button', { name: 'Max level' }).click();
    await page.keyboard.press('`');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.keyboard.press('g');
    await page.getByRole('button', { name: /enter brightwater/i }).click();
    await page.getByRole('button', { name: /rift gate/i }).click();
    await expect(page.getByRole('heading', { name: /spire|rift|endgame/i }).first()).toBeVisible();
    expect(errors).toEqual([]);
  });
});
