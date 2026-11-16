/**
 * Builds the whole wiki in memory: registers every page from every section,
 * adds category pages, renders each page inside the layout, and collects
 * broken links. `wiki/build.ts` writes the result to disk; the test suite
 * builds it in memory and asserts there are no broken links.
 */
import { esc, slug } from './html';
import { navScript, renderLayout, renderNav } from './layout';
import type { PageSpec, RenderCtx, WikiSection } from './types';

export interface BuiltPage {
  path: string;
  html: string;
}

export interface SearchEntry {
  t: string;
  p: string;
  s?: string;
  c?: string;
  k?: string;
  x?: 1;
}

export interface BuildResult {
  pages: BuiltPage[];
  /** Generated assets such as `assets/nav.js`. */
  assets: BuiltPage[];
  search: SearchEntry[];
  broken: string[];
}

const key = (ns: string, id: string): string => `${ns}:${id}`;

/** Site path of a page. The home page is `index.html`; everything else is `<ns>/<slug>.html`. */
export function pathOf(ns: string, id: string): string {
  return ns === 'home' && id === 'index' ? 'index.html' : `${slug(ns)}/${slug(id)}.html`;
}

/** Relative href from one site path to another (both relative to the site root). */
export function relHref(from: string, to: string): string {
  const depth = from.split('/').length - 1;
  return '../'.repeat(depth) + to;
}

export function buildSite(sections: readonly WikiSection[]): BuildResult {
  const pages = new Map<string, PageSpec>();
  const byNs = new Map<string, PageSpec[]>();
  const sectionOf = new Map<string, WikiSection>();
  const problems: string[] = [];

  const add = (p: PageSpec, section?: WikiSection): void => {
    const k = key(p.ns, p.id);
    if (pages.has(k)) {
      problems.push(`duplicate page ${k} (${p.title})`);
      return;
    }
    pages.set(k, p);
    if (!byNs.has(p.ns)) byNs.set(p.ns, []);
    byNs.get(p.ns)!.push(p);
    if (section) sectionOf.set(k, section);
  };

  for (const section of sections) for (const p of section.pages()) add(p, section);

  // Slug collisions would overwrite files silently.
  const paths = new Map<string, string>();
  for (const [k, p] of pages) {
    const path = pathOf(p.ns, p.id);
    const other = paths.get(path);
    if (other) problems.push(`pages ${other} and ${k} both write ${path}`);
    paths.set(path, k);
  }

  // Category pages, gathered from every page's `categories`.
  const cats = new Map<string, PageSpec[]>();
  for (const p of pages.values()) for (const c of p.categories ?? []) {
    if (!cats.has(c)) cats.set(c, []);
    cats.get(c)!.push(p);
  }
  for (const [name, members] of cats) {
    add({
      ns: 'category',
      id: name,
      title: `Category: ${name}`,
      summary: `${members.length} pages`,
      render: (ctx) =>
        `<p>${members.length} pages are in this category.</p><ul class="columns">${members
          .slice()
          .sort((a, b) => a.title.localeCompare(b.title))
          .map((m) => `<li>${ctx.link(m.ns, m.id)}</li>`)
          .join('')}</ul>`,
    });
  }

  const broken: string[] = [...problems];
  const built: BuiltPage[] = [];

  const makeCtx = (k: string, path: string): RenderCtx => {
    const ctx: RenderCtx = {
      has: (ns, id) => pages.has(key(ns, id)),
      titleOf: (ns, id) => pages.get(key(ns, id))?.title,
      href: (to) => relHref(path, to),
      pagesIn: (ns) => byNs.get(ns) ?? [],
      link(ns, id, label) {
        const target = pages.get(key(ns, id));
        if (!target) {
          broken.push(`${k} links to missing ${key(ns, id)}`);
          return `<span class="broken-link">${esc(label ?? id)}</span>`;
        }
        return `<a href="${relHref(path, pathOf(ns, id))}">${esc(label ?? target.title)}</a>`;
      },
      linkIf(ns, id, label) {
        return pages.has(key(ns, id)) ? ctx.link(ns, id, label) : esc(label ?? id);
      },
    };
    return ctx;
  };

  // Rendered from the site root; nav.js prefixes each link with the page's root.
  const assets: BuiltPage[] = [{ path: 'assets/nav.js', html: navScript(renderNav(sections, makeCtx('sidebar', 'index.html'))) }];

  for (const [k, p] of pages) {
    const path = pathOf(p.ns, p.id);
    const ctx = makeCtx(k, path);
    let body: string;
    try {
      body = p.render(ctx);
    } catch (e) {
      broken.push(`${k} failed to render: ${(e as Error).message}`);
      body = `<p class="broken-link">This page failed to render.</p>`;
    }
    const catLinks = (p.categories ?? []).map((c) => ctx.link('category', c, c));
    built.push({ path, html: renderLayout({ page: p, body, ctx, section: sectionOf.get(k), catLinks }) });
  }

  const search: SearchEntry[] = [...pages.values()]
    .filter((p) => p.ns !== 'category')
    .map((p) => {
      const e: SearchEntry = { t: p.title, p: pathOf(p.ns, p.id) };
      if (p.summary) e.s = p.summary.slice(0, 140);
      if (p.categories?.[0]) e.c = p.categories[0];
      if (p.keywords?.length) e.k = p.keywords.join(' ');
      if (p.spoiler) e.x = 1;
      return e;
    });

  return { pages: built, assets, search, broken };
}
