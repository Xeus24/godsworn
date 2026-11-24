import { test as base, expect as baseExpect, type Locator } from '@playwright/test';

export type { Page } from '@playwright/test';

/** The fold audit is always on; `FOLD_AUDIT=0` switches it off for one run (to see what a test does without it). */
const auditing = (): boolean => process.env.FOLD_AUDIT !== '0';

/** Audit mode: notes a visible element that sits inside a fold the test did not open with `reveal`. */
async function auditVisible(locator: Locator): Promise<void> {
  const found = await locator.first().evaluate((el) => {
    const d = el.closest('details');
    const revealed = (window as unknown as { __revealedFolds?: string[] }).__revealedFolds ?? [];
    const opened = (x: Element): boolean => !!x.closest('[data-revealed]') || revealed.some((t) => (x.querySelector(':scope > summary')?.textContent?.trim() ?? '').startsWith(t));
    if (!d || el.closest('summary') || opened(d)) return null;
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
        // Screens redraw their folds as new elements: remember the fold by its title too (the start of it,
        // since a summary can gain a count or a mark after a change).
        const title = d.querySelector(':scope > summary')?.textContent?.trim().slice(0, 24);
        const w = window as unknown as { __revealedFolds?: string[] };
        if (title) (w.__revealedFolds ??= []).push(title);
      }
    }
  });
  return target;
}

/**
 * The fold audit: a test fails if one of its steps clicks something inside a fold it did not open with
 * `reveal`, or a passing `toBeVisible` check saw something inside one (see `expect` above). Such a step
 * only works while that fold happens to be open. The failure lists the steps; give each one `reveal`.
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
            const revealed = (window as unknown as { __revealedFolds?: string[] }).__revealedFolds ?? [];
            const opened = !!d?.closest('[data-revealed]') || revealed.some((x) => (d?.querySelector(':scope > summary')?.textContent?.trim() ?? '').startsWith(x));
            if (!t || !d || t.closest('summary') || opened) return;
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
        if (found.length) {
          const lines = [...new Set(found)];
          console.log(`[fold-audit] ${info.title}: ${lines.join(' | ')}`);
          throw new Error(`Fold audit: this test reached into a fold it did not open with reveal():\n  ${lines.join('\n  ')}`);
        }
      }
    },
    { auto: true },
  ],
});
