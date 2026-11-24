import { test as base, expect as baseExpect, type Locator } from '@playwright/test';

export type { Page } from '@playwright/test';

/** The fold audit is always on; `FOLD_AUDIT=0` switches it off for one run (to see what a test does without it). */
const auditing = (): boolean => process.env.FOLD_AUDIT !== '0';

/**
 * Notes a checked element that sits inside a fold the test did not open with `reveal`. `verb` says what the
 * check did ("sees", "reads"). If a fold around it is closed, the player could not see what the check read.
 */
async function auditInside(locator: Locator, verb: string): Promise<void> {
  const found = await locator.first().evaluate((el, verb) => {
    const d = el.closest('details');
    const revealed = (window as unknown as { __revealedFolds?: string[] }).__revealedFolds ?? [];
    const opened = (x: Element): boolean => !!x.closest('[data-revealed]') || revealed.some((t) => (x.querySelector(':scope > summary')?.textContent?.trim() ?? '').startsWith(t));
    if (!d || el.closest('summary') || opened(d)) return null;
    const where = d.querySelector(':scope > summary')?.textContent?.trim().slice(0, 40) ?? '?';
    const name = (el as HTMLInputElement).labels?.[0]?.textContent || el.getAttribute('aria-label') || el.textContent || el.tagName;
    let shut = false;
    for (let x: Element | null = d; x; x = x.parentElement?.closest('details') ?? null) if (!(x as HTMLDetailsElement).open) shut = true;
    return `${verb} "${name.trim().slice(0, 40)}" inside "${where}"${shut ? ' (the fold is closed: the player cannot see this text)' : ''}`;
  }, verb).catch(() => null);
  if (found) await locator.page().evaluate((line) => { const w = window as unknown as { __folds?: string[] }; (w.__folds ??= []).push(line); }, found);
}

type TextExpected = string | RegExp | readonly (string | RegExp)[];
type TextOptions = { timeout?: number; ignoreCase?: boolean; useInnerText?: boolean };

/**
 * The usual `expect`, with `toBeVisible`, `toHaveText` and `toContainText` passed through unchanged. When one
 * of them passes, the fold audit also notes an element it checked inside a fold the test did not open. Text
 * checks are audited in both forms (`not.toHaveText` reads the text too): they pass even on text a closed fold
 * hides from the player.
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
    if (!isNot && auditing()) await auditInside(locator, 'sees');
    return { pass: !isNot, name: 'toBeVisible', message: () => '' };
  },
  async toHaveText(locator: Locator, expected: TextExpected, options?: TextOptions) {
    const isNot = this.isNot;
    try {
      if (isNot) await baseExpect(locator).not.toHaveText(expected as string, options);
      else await baseExpect(locator).toHaveText(expected as string, options);
    } catch (e) {
      return { pass: isNot, name: 'toHaveText', message: () => (e as Error).message };
    }
    if (auditing()) await auditInside(locator, 'reads');
    return { pass: !isNot, name: 'toHaveText', message: () => '' };
  },
  async toContainText(locator: Locator, expected: TextExpected, options?: TextOptions) {
    const isNot = this.isNot;
    try {
      if (isNot) await baseExpect(locator).not.toContainText(expected as string, options);
      else await baseExpect(locator).toContainText(expected as string, options);
    } catch (e) {
      return { pass: isNot, name: 'toContainText', message: () => (e as Error).message };
    }
    if (auditing()) await auditInside(locator, 'reads');
    return { pass: !isNot, name: 'toContainText', message: () => '' };
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
 * `reveal`, or a passing `toBeVisible`, `toHaveText` or `toContainText` check met something inside one
 * (see `expect` above). Such a step
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
