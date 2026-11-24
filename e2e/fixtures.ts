import { test as base, expect, type Locator } from '@playwright/test';

export { expect };
export type { Page } from '@playwright/test';

/**
 * Many panels fold to one line by default (CLAUDE.md, "Fold by default"), and the game remembers which
 * folds the player opened, so a test that reaches into a fold may pass or fail depending on what an
 * earlier step happened to open. `reveal` opens every fold around the target first, so the step does not
 * depend on that. It returns the locator, so `await (await reveal(x)).click()` reads as one step.
 */
export async function reveal(target: Locator): Promise<Locator> {
  await target.first().waitFor({ state: 'attached' });
  await target.evaluateAll((els) => {
    for (const el of els) {
      for (let d = el.closest('details'); d; d = d.parentElement?.closest('details') ?? null) {
        (d as HTMLDetailsElement).open = true;
        (d as HTMLElement).dataset.revealed = '1';
      }
    }
  });
  return target;
}

/**
 * `FOLD_AUDIT=1 npm run test:e2e` prints every click that landed inside a fold the test did not open with
 * `reveal`: those steps rely on a fold happening to be open. A clean run prints nothing. Off by default;
 * it never changes what a test does.
 */
export const test = base.extend<{ foldAudit: void }>({
  foldAudit: [
    async ({ page }, use, info) => {
      const on = !!process.env.FOLD_AUDIT;
      if (on) {
        await page.addInitScript(() => {
          document.addEventListener('click', (e) => {
            const t = e.target as Element | null;
            const d = t?.closest?.('details');
            if (!t || !d || t.closest('summary') || d.closest('[data-revealed]')) return;
            const where = d.querySelector(':scope > summary')?.textContent?.trim().slice(0, 40) ?? '?';
            const what = (t.textContent ?? t.tagName).trim().slice(0, 40);
            const w = window as unknown as { __folds?: string[] };
            (w.__folds ??= []).push(`"${what}" inside "${where}"`);
          }, true);
        });
      }
      await use();
      if (on) {
        const found = await page.evaluate(() => (window as unknown as { __folds?: string[] }).__folds ?? []).catch(() => [] as string[]);
        if (found.length) console.log(`[fold-audit] ${info.title}: ${[...new Set(found)].join(' | ')}`);
      }
    },
    { auto: true },
  ],
});
