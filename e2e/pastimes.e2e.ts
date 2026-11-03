import { expect, test, type Page } from '@playwright/test';

type Game = {
  state: { gold: number; minigames: Record<string, any>; party: { companions: Record<string, any> } };
  party: { recruit(id: string): void };
};

async function newHero(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: /new game/i }).click();
  await page.getByRole('button', { name: /randomize/i }).click();
  await page.getByPlaceholder('Name your hero').fill('Pastime');
  await page.getByRole('button', { name: /swear your oath/i }).click();
  await expect(page.getByText('THE INN').first()).toBeVisible();
}

const game = <T>(page: Page, fn: (g: Game) => T) => page.evaluate(`(${fn.toString()})(window.__game)`) as Promise<T>;

async function openPastimes(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByText(/Pastimes in/)).toBeVisible();
}

test.describe('Pastimes in a real browser', () => {
  test('fishing, cards, dice, racing, the forge, digging and the arena all play', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await newHero(page);
    await game(page, (g) => { g.state.gold += 5000; });
    // Five cards to duel with (a new hero owns fewer).
    await page.evaluate(async () => {
      const dataModule = '/src/data/index.ts'; // a variable path: the browser resolves it, the type checker does not
      const { content } = await import(dataModule);
      const g = (window as unknown as { __game: Game }).__game;
      for (const id of content.cards.ids().slice(0, 8)) g.state.minigames.cards[id] = 1;
    });
    await openPastimes(page);
    const tab = (name: string) => page.getByRole('button', { name, exact: true }).first().click();

    // Fishing: cast, strike. Whatever the timing, a message is printed and the bar goes away.
    await tab('Fishing');
    await page.getByRole('button', { name: 'Cast a line' }).click();
    await expect(page.locator('.timing-bar')).toBeVisible();
    await page.getByRole('button', { name: 'Strike!' }).click();
    await expect(page.locator('.timing-bar')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Cast a line' })).toBeVisible();

    // Pantheon Cards: a hand of five, a duel, five rounds to the end.
    await tab('Pantheon Cards');
    await expect(page.getByText(/You own \d+ of/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your hand' })).toBeVisible();
    await page.getByRole('button', { name: 'Duel' }).first().click();
    for (let i = 0; i < 5; i++) {
      await expect(page.getByText(/Round \d of 5/)).toBeVisible();
      await page.locator('.panel ul.small ~ .row.wrap button').first().click();
    }
    await expect(page.getByText(/You win!|A draw\.|You lose this one\./)).toBeVisible();
    await page.getByRole('button', { name: 'Play again' }).click();

    // Tavern dice.
    await tab('Tavern Dice');
    await page.getByRole('button', { name: 'Roll', exact: true }).click();
    await page.getByRole('button', { name: 'Show your hand' }).click();
    await expect(page.getByText(/The house has \d+ cargo/)).toBeVisible();

    // Racing.
    await tab('Mount Racing');
    await page.getByRole('button', { name: 'Run the race' }).click();
    await expect(page.getByText(/1\. .*Your pick (wins|lost)/)).toBeVisible();

    // The forge: five strikes.
    await tab('The Forge');
    for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Strike!' }).click();
    await expect(page.getByText(/work \(\d+\/100\)/)).toBeVisible();

    // Treasure digging: probe squares until the pit is done.
    await tab('Treasure Digging');
    for (let i = 0; i < 40; i++) {
      const open = page.locator('.panel div[style*="grid"] button:not([disabled])');
      if ((await open.count()) === 0) break;
      await open.first().click();
      if (await page.getByText(/You dig it up|The pit is empty/).count()) break;
    }
    await expect(page.getByText(/You dig it up|The pit is empty/)).toBeVisible();

    // The arena ladder: one rung.
    await tab('Arena Ladder');
    await page.getByRole('button', { name: /Fight rung 1/ }).click();
    await expect(page.getByText(/Rung \d+ (falls|holds)/)).toBeVisible();

    await page.getByRole('button', { name: /back to town/i }).click();
    await expect(page.getByText('THE INN').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
});
