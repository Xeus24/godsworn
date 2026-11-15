/**
 * The page shell: top bar with search, sidebar grouped by NAV_GROUPS,
 * breadcrumb, title, spoiler banner, body, category chips and footer.
 * The table of contents is built client-side by wiki.js from the `<h2>`s.
 */
import { readFileSync } from 'node:fs';
import { esc } from './html';
import { NAV_GROUPS, type PageSpec, type RenderCtx, type WikiSection } from './types';

const VERSION = (JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { version: string }).version;

export interface LayoutArgs {
  page: PageSpec;
  body: string;
  ctx: RenderCtx;
  sections: readonly WikiSection[];
  section?: WikiSection;
  catLinks: string[];
}

export function renderLayout({ page, body, ctx, sections, section, catLinks }: LayoutArgs): string {
  const nav = NAV_GROUPS.map((g) => {
    const items = sections.filter((s) => s.group === g);
    if (!items.length) return '';
    const links = items
      .flatMap((s) => s.nav ?? [{ label: s.title, ...s.landing }])
      .map((n) => {
        const current = page.ns === n.ns ? ' class="current"' : '';
        return `<li${current}>${ctx.link(n.ns, n.id, n.label)}</li>`;
      })
      .join('');
    return `<div class="nav-group"><div class="nav-head">${esc(g)}</div><ul>${links}</ul></div>`;
  }).join('');

  const isLanding = section && section.landing.ns === page.ns && section.landing.id === page.id;
  const crumbs = [ctx.link('home', 'index', 'Home')];
  if (section) {
    if (section.group !== section.title) crumbs.push(esc(section.group));
    if (!isLanding) crumbs.push(ctx.link(section.landing.ns, section.landing.id, section.title));
    const navHit = section.nav?.find((n) => n.ns === page.ns && n.ns !== section.landing.ns);
    if (navHit && !(navHit.id === page.id)) crumbs.push(ctx.link(navHit.ns, navHit.id, navHit.label));
  }
  const spoiler = page.spoiler
    ? `<div class="spoiler-banner"><strong>Spoiler.</strong> This page covers hidden or secret content. <button type="button" class="spoiler-reveal">Show it</button></div>`
    : '';
  const cats = catLinks.length ? `<footer class="page-cats"><span>Categories:</span> ${catLinks.join(' ')}</footer>` : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)} | Godsworn Wiki</title>
${page.summary ? `<meta name="description" content="${esc(page.summary)}">` : ''}
<link rel="icon" href="${ctx.href('favicon.svg')}">
<link rel="stylesheet" href="${ctx.href('assets/wiki.css')}">
<script>try{var t=localStorage.getItem('wiki-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
</head>
<body data-root="${ctx.href('')}">
<header class="topbar">
  <button type="button" class="nav-toggle" aria-label="Menu">☰</button>
  <a class="brand" href="${ctx.href('index.html')}"><img src="${ctx.href('favicon.svg')}" alt="">Godsworn Wiki</a>
  <div class="search"><input id="search" type="search" placeholder="Search the wiki…  ( / )" autocomplete="off"><ol id="search-results" hidden></ol></div>
  <button type="button" class="theme-toggle" aria-label="Toggle theme">◐</button>
</header>
<div class="shell">
<nav class="sidebar">${nav}<div class="nav-group"><div class="nav-head">Tools</div><ul><li>${ctx.link('home', 'all-pages', 'All pages')}</li><li><a href="#" class="random-page">Random page</a></li></ul></div></nav>
<main class="content${page.spoiler ? ' is-spoiler' : ''}">
<div class="crumbs">${crumbs.join(' › ')}</div>
<h1>${esc(page.title)}</h1>
${spoiler}
<div class="page-body">${body}</div>
${cats}
<footer class="page-foot">Generated from the game's data files (v${esc(VERSION)}). Edit the data or <code>wiki/sections/</code>, then run <code>npm run wiki</code>.</footer>
</main>
</div>
<script src="${ctx.href('assets/wiki.js')}" defer></script>
</body>
</html>`;
}
