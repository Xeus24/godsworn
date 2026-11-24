import { test as base, expect as baseExpect, type Locator } from '@playwright/test';

export type { Page } from '@playwright/test';

const auditing = (): boolean => !!process.env.FOLD_AUDIT;

/** Audit mode: notes a visible element that sits inside a fold the test did not open with `reveal`. */
async function auditVisible(locator: Locator): Promise<void> {
  const found = await locator.first().evaluate((el) => {
    const d = el.closest('details');
    if (!d || el.closest('summary') || d.closest('[data-revealed]')) return null;
    const where = d.querySelector(':scope > summary')?.textContent?.trim().slice(0, 40) ?? '?';
    const name = (el as HTMLInputElement).labels?.[0]?.textContent || el.getAttribute('aria-label') || el.textContent || el.tagName;
    return `sees "${name.trim().slice(0, 40)}" inside "${where}"`;
  }).catch(() => null);
  if (found) await locator.page().evaluate((line) => { const w = window as unknown as { __folds?: string[] }; (w.__folds ??= []).push(line); }, found);
}

/**
 * The usual `expect`, with `toBeVisible` passed through unchanged. In audit mode a passing visibility check
 * also reports an element seen inside a fold the test did not open, as clicks are reported.
 */
export const expect = baseExpect.extend({
  async toBeVisible(locator: Locator, options?: { timeout?: number; visible?: boolean }) {
    const isNot = this.isNot;
    try {
      if (isNot) await baseExpect(locator).not.toBeVisible(options);
      else await baseExpect(locator).toBeVisible(options);
    } catch (e) {
      return { pass: isNot, name: 'toBeVisible', message: () => (e as Error).message };
    }
    if (!isNot && auditing()) await auditVisible(locator);
    return { pass: !isNot, name: 'toBeVisible', message: () => '' };
  },
});

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
 * `reveal`, and every passing `toBeVisible` check that saw something inside one (see `expect` above): those
 * steps rely on a fold happening to be open. A clean run prints nothing. Off by default;
 * it never changes what a test does.
 */
export const test = base.extend<{ foldAudit: void }>({
  foldAudit: [
    async ({ page }, use, info) => {
      const on = auditing();
      if (on) {
        await page.addInitScript(() => {
          document.addEventListener('click', (e) => {
            const t = e.target as Element | null;
            const d = t?.closest?.('details');
            if (!t || !d || t.closest('summary') || d.closest('[data-revealed]')) return;
            const where = d.querySelector(':scope > summary')?.textContent?.trim().slice(0, 40) ?? '?';
            const what = (t.textContent ?? t.tagName).trim().slice(0, 40);
            const w = window as unknown as { __folds?: string[] };
            (w.__folds ??= []).push(`clicks "${what}" inside "${where}"`);
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
