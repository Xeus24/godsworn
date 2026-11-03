import { expect, test, type Page } from '@playwright/test';

async function newHero(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: /new game/i }).click();
  await page.getByRole('button', { name: /randomize/i }).click();
  await page.getByPlaceholder('Name your hero').fill('Camper');
  await page.getByRole('button', { name: /swear your oath/i }).click();
  await expect(page.getByText('THE INN').first()).toBeVisible();
}

test.describe('Camp, Endgame, secrets and Completion in a real browser', () => {
  test('a companion at the camp: sit by the fire, then spend an evening', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await newHero(page);
    // Sable joins through the engine; her approval is set past the first evening's 45.
    await page.evaluate(() => {
      const g = (window as unknown as { __game: any }).__game;
      g.party.recruit('sable');
      g.state.party.companions.sable.approval = 60;
    });
    await page.keyboard.press('o');
    await expect(page.getByRole('heading', { name: /^Party \(/ })).toBeVisible();
    await page.locator('.party-card', { hasText: 'Sable' }).click();
    await expect(page.getByRole('heading', { name: /^Camp$/ })).toBeVisible();

    await page.getByRole('button', { name: 'Sit by the fire' }).click();
    await expect(page.locator('.camp .small', { hasText: '“' })).toBeVisible();
    // Once a day: the second sit by the fire is refused with a message.
    await page.getByRole('button', { name: 'Sit by the fire' }).click();
    await expect(page.getByText(/said all they had to say today/)).toBeVisible();

    await page.getByRole('button', { name: 'Spend the evening' }).click();
    await expect(page.getByText(/What is this\?/)).toBeVisible();
    await page.getByRole('button', { name: /We are friends/ }).click();
    await expect(page.getByText(/I have not had one of those in a while/)).toBeVisible();
    expect(errors).toEqual([]);
  });
});

async function atRiftGate(page: Page): Promise<void> {
  await page.keyboard.press('`');
  await page.getByRole('button', { name: 'Max level' }).click();
  await page.keyboard.press('`');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.keyboard.press('g');
  await page.getByRole('button', { name: /enter brightwater/i }).click();
  await page.getByRole('button', { name: /rift gate/i }).click();
  await expect(page.getByRole('heading', { name: 'The Endless Spire' })).toBeVisible();
}

test.describe('Endgame modes', () => {
  test('the Spire, a Divine Trial, a league season and the weekly run start and end', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await newHero(page);
    // Solenne has taken notice of this hero.
    await page.evaluate(() => {
      const g = (window as unknown as { __game: any }).__game;
      g.player.devotion.favor.solenne = 400;
    });
    await atRiftGate(page);

    // The Endless Spire: climb, then leave standing.
    await page.getByRole('button', { name: 'Climb the Spire' }).click();
    await expect(page.getByRole('heading', { name: /Endless Spire: floor 1/ })).toBeVisible();
    await page.getByRole('button', { name: 'Leave the Spire' }).click();
    await expect(page.getByRole('heading', { name: 'The Endless Spire' })).toBeVisible();

    // A Divine Trial: face the Aspect (the first trial that is open), then abandon.
    await page.getByRole('button', { name: 'Face the Aspect' }).and(page.locator(':not([disabled])')).first().click();
    await expect(page.getByRole('button', { name: /^Fight: / })).toBeVisible();
    await page.getByRole('button', { name: 'Abandon the run' }).click();
    await expect(page.getByRole('heading', { name: 'The Divine Trials' })).toBeVisible();

    // A league season.
    await page.getByRole('button', { name: 'Begin a season' }).click();
    await expect(page.getByRole('heading', { name: 'The Arena Champions league' })).toBeVisible();
    await page.getByRole('button', { name: 'Abandon the run' }).click();

    // The weekly run.
    await page.getByRole('button', { name: 'Start the weekly run' }).click();
    await expect(page.getByRole('heading', { name: /^Weekly run/ })).toBeVisible();
    await page.getByRole('button', { name: 'Abandon the run' }).click();
    await expect(page.getByRole('button', { name: 'Start the weekly run' })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('World secrets and the Completion tracker', () => {
  test('walking onto a secret finds it, and the Completion tab counts it', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await newHero(page);
    await page.keyboard.press('g');
    await expect(page.getByText(/Secrets found here: 0\/\d+/)).toBeVisible();
    // Meadowlands hides a night-only secret: make it midnight, stand beside it (found on the real map) and step onto it.
    const dir = await page.evaluate(async () => {
      const g = (window as unknown as { __game: any }).__game;
      const worldModule = '/src/engine/world/world.ts'; // a variable path: the browser resolves it, the type checker does not
      const w = await import(worldModule);
      g.state.clock.minute = 0;
      const map = g.world.map;
      const open = map.entities.filter((e: any) => e.kind === 'secret' && !e.gate && !e.blood && e.secret && !e.requires);
      const dirs: [string, number, number][] = [['ArrowRight', 1, 0], ['ArrowLeft', -1, 0], ['ArrowDown', 0, 1], ['ArrowUp', 0, -1]];
      for (const e of open) for (const [key, dx, dy] of dirs) {
        if (w.passable(g.state.world, map, e.x - dx, e.y - dy) && !w.entityAt(map, e.x - dx, e.y - dy)) {
          g.world.placeAt(map.id, e.x - dx, e.y - dy);
          return key;
        }
      }
      return '';
    });
    expect(dir, 'an ungated secret with an open neighbour exists in the first region').not.toBe('');
    await page.keyboard.press(dir);
    await expect(page.getByText(/Secrets found here: 1\/\d+/)).toBeVisible();

    // The Codex's Completion tab.
    await page.keyboard.press('b');
    await page.getByRole('button', { name: 'Completion', exact: true }).click();
    await expect(page.getByText(/Secrets/).first()).toBeVisible();
    await expect(page.getByText(/%/).first()).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('Controller prompts', () => {
  test('the prompt bar appears when a gamepad connects and goes when it leaves', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __pads: unknown[] }).__pads = [];
      navigator.getGamepads = () => (window as unknown as { __pads: Gamepad[] }).__pads as unknown as Gamepad[];
    });
    await page.goto('/');
    await expect(page.locator('.pad-prompts')).toHaveCount(0);
    await page.evaluate(() => {
      (window as unknown as { __pads: unknown[] }).__pads = [{ connected: true, index: 0, id: 'Test pad', buttons: [], axes: [], mapping: 'standard', timestamp: 0 }];
      window.dispatchEvent(new Event('gamepadconnected'));
    });
    await expect(page.locator('.pad-prompts')).toContainText('A Select');
    await page.evaluate(() => {
      (window as unknown as { __pads: unknown[] }).__pads = [];
      window.dispatchEvent(new Event('gamepaddisconnected'));
    });
    await expect(page.locator('.pad-prompts')).toHaveCount(0);
  });
});
