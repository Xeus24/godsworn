/**
 * The front page (tiles per section, quick facts) and the All pages index.
 * Takes the other sections as input so the tiles stay in sync with the
 * registry.
 */
import { content } from '../../src/data';
import { esc, h2 } from '../core/html';
import { pathOf } from '../core/site';
import { NAV_GROUPS, type PageSpec, type WikiSection } from '../core/types';

export function homeSection(others: readonly WikiSection[]): WikiSection {
  return {
    id: 'home',
    title: 'Home',
    group: 'Getting Started',
    blurb: 'The front page.',
    landing: { ns: 'home', id: 'index' },
    pages(): PageSpec[] {
      const facts: [string, number][] = [
        ['classes', content.classes.size],
        ['races', content.races.size],
        ['gods', content.gods.size],
        ['skills', content.skills.size],
        ['unique items', content.uniques.size],
        ['enemies', content.enemies.size],
        ['zones', content.zones.size],
        ['quests', content.quests.size],
        ['achievements', content.achievements.size],
      ];
      return [
        {
          ns: 'home',
          id: 'index',
          title: 'Godsworn Wiki',
          summary: 'The complete reference for Godsworn, generated from the game data.',
          render: (ctx) =>
            `<div class="hero"><div class="hero-title">Welcome to the Godsworn Wiki</div><p>Every class, skill, item, monster, zone and quest in Godsworn, generated straight from the game's data so it never goes out of date. Press <code>/</code> to search.</p></div>` +
            `<p class="muted">${facts.map(([k, v]) => `<b>${esc(v.toLocaleString('en-US'))}</b> ${esc(k)}`).join(' · ')}</p>` +
            NAV_GROUPS.map((g) => {
              const secs = others.filter((s) => s.group === g);
              if (!secs.length) return '';
              const tiles = secs
                .flatMap((s) => (s.nav ?? [{ label: s.title, ...s.landing }]).map((n) => ({ n, s })))
                .map(({ n, s }) => {
                  const title = ctx.titleOf(n.ns, n.id) ?? n.label;
                  const count = ctx.pagesIn(n.ns).length - 1;
                  const blurb = ctx.pagesIn(n.ns).find((p) => p.id === n.id)?.summary ?? s.blurb;
                  return `<a class="tile" href="${ctx.href(pathOf(n.ns, n.id))}">${count > 0 ? `<span class="count">${esc(count)}</span>` : ''}<b>${esc(title)}</b><span>${esc(blurb)}</span></a>`;
                })
                .join('');
              return `${h2(g)}<div class="tiles">${tiles}</div>`;
            }).join(''),
        },
        {
          ns: 'home',
          id: 'all-pages',
          title: 'All pages',
          summary: 'Every page on the wiki, by section.',
          render: (ctx) =>
            others
              .map((s) => {
                const nss = [...new Set((s.nav ?? [s.landing]).map((n) => n.ns))];
                return nss
                  .map((ns) => {
                    const list = ctx.pagesIn(ns).filter((p) => p.id !== 'index');
                    if (!list.length) return '';
                    return `<details><summary><b>${esc(ctx.titleOf(ns, 'index') ?? ns)}</b> <span class="muted">${list.length}</span></summary><ul class="columns">${list
                      .map((p) => `<li>${ctx.link(p.ns, p.id)}</li>`)
                      .join('')}</ul></details>`;
                  })
                  .join('');
              })
              .join(''),
        },
      ];
    },
  };
}
