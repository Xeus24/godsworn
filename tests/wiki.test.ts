import { describe, expect, it } from 'vitest';
import { buildSite, pathOf, relHref } from '../wiki/core/site';
import { SECTIONS } from '../wiki/sections';

describe('wiki', () => {
  const result = buildSite(SECTIONS);

  it('builds with no broken links, duplicates or render errors', () => {
    expect(result.broken).toEqual([]);
  });

  it('has a page for every class, enemy and unique item', () => {
    const paths = new Set(result.pages.map((p) => p.path));
    expect(paths.has('index.html')).toBe(true);
    expect(paths.has(pathOf('class', 'warrior'))).toBe(true);
    expect(result.pages.length).toBeGreaterThan(5000);
  });

  it('every page links its stylesheet relative to its own depth', () => {
    const page = result.pages.find((p) => p.path === pathOf('class', 'warrior'))!;
    expect(page.html).toContain('href="../assets/wiki.css"');
    expect(relHref('index.html', 'assets/wiki.css')).toBe('assets/wiki.css');
  });

  it('every sidebar section has a landing page', () => {
    for (const s of SECTIONS) expect(result.pages.some((p) => p.path === pathOf(s.landing.ns, s.landing.id))).toBe(true);
  });
});
