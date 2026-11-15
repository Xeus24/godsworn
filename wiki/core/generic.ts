/**
 * A plain section built from content tables: one landing page with a
 * filterable list per table, and one page per entry showing its name,
 * description and an infobox of its simple fields. Sections start here and
 * replace `render` with something richer per table as they grow; the page
 * keys (`ns:id`) stay the same, so links from other sections keep working.
 */
import { descOf, esc, h2, infobox, nameOf, prose, table, type InfoboxRow } from './html';
import { icon } from './icons';
import { pathOf } from './site';
import type { NavGroup, PageSpec, RenderCtx, WikiSection } from './types';

type Entry = { id: string } & Record<string, unknown>;

export interface TableSpec<T extends { id: string }> {
  /** Page namespace for this table's entries (the link key used everywhere). */
  ns: string;
  /** Plural heading on the landing page, e.g. "Zones". */
  label: string;
  /** One line for the section tile and list page. */
  blurb?: string;
  /** Intro HTML above the list on the list page. */
  intro?: string;
  /** Category every entry page gets. */
  category: string;
  entries: readonly T[];
  /** Entry page body. Defaults to description + simple-field infobox. */
  render?: (e: T, ctx: RenderCtx) => string;
  /** One-line summary (search and list). Defaults to the entry's description. */
  summary?: (e: T) => string | undefined;
  title?: (e: T) => string;
  spoiler?: (e: T) => boolean;
  /** Extra categories per entry. */
  categories?: (e: T) => string[];
  /** Landing-page list for this table. Defaults to a filterable Name/Summary table. */
  list?: (entries: readonly T[], ctx: RenderCtx) => string;
}

/** Infobox of an entry's scalar fields (strings, numbers, booleans, short string arrays). */
export function rawInfobox(e: Entry, title = nameOf(e)): string {
  const rows: InfoboxRow[] = [];
  for (const [k, v] of Object.entries(e)) {
    if (['id', 'name', 'title', 'description', 'text', 'summary', 'color', 'palette', 'portrait'].includes(k)) continue;
    if (typeof v === 'string' && v.length < 80) rows.push({ label: k, html: esc(v) });
    else if (typeof v === 'number' || typeof v === 'boolean') rows.push({ label: k, html: esc(String(v)) });
    else if (Array.isArray(v) && v.length && v.length <= 8 && v.every((x) => typeof x === 'string' || typeof x === 'number'))
      rows.push({ label: k, html: esc(v.join(', ')) });
  }
  const color = typeof e.color === 'string' ? e.color : undefined;
  return infobox(title, rows, { color });
}

function defaultRender(e: Entry): string {
  const d = descOf(e);
  return rawInfobox(e) + (d ? prose(d) : '<p class="muted">No description in the game data.</p>');
}

export function tablePages<T extends { id: string }>(spec: TableSpec<T>): PageSpec[] {
  return spec.entries.map((e) => {
    const loose = e as unknown as Entry;
    return {
      ns: spec.ns,
      id: e.id,
      title: spec.title?.(e) ?? nameOf(loose),
      summary: spec.summary ? spec.summary(e) : descOf(loose),
      categories: [spec.category, ...(spec.categories?.(e) ?? [])],
      spoiler: spec.spoiler?.(e) ?? (loose.hidden === true),
      render: (ctx) => (spec.render ? spec.render(e, ctx) : defaultRender(loose)),
    };
  });
}

export function defaultList<T extends { id: string }>(spec: TableSpec<T>, ctx: RenderCtx): string {
  return table(
    spec.entries,
    [
      { label: 'Name', cell: (e) => ctx.link(spec.ns, e.id), sort: (e) => spec.title?.(e) ?? nameOf(e as unknown as Entry) },
      { label: 'Summary', cell: (e) => esc((spec.summary ? spec.summary(e) : descOf(e as unknown as Entry)) ?? '') },
    ],
    { filter: spec.entries.length > 12 },
  );
}

export interface SimpleSectionSpec {
  id: string;
  title: string;
  group: NavGroup;
  blurb: string;
  /** Intro HTML at the top of the landing page. */
  intro?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tables: TableSpec<any>[];
  /** Extra hand-written pages (guides, overview pages). */
  extra?: PageSpec[];
}

/**
 * A section with a landing page `<id>:index` (intro + a tile per table),
 * and per table a list page `<ns>:index` plus one page per entry. Each list
 * page is a sidebar link. Entry ids must not be `index`.
 */
export function simpleSection(spec: SimpleSectionSpec): WikiSection {
  return {
    id: spec.id,
    title: spec.title,
    group: spec.group,
    blurb: spec.blurb,
    landing: { ns: spec.id, id: 'index' },
    nav: spec.tables.length ? spec.tables.map((t) => ({ label: t.label, ns: t.ns, id: 'index' })) : undefined,
    pages() {
      const landing: PageSpec = {
        ns: spec.id,
        id: 'index',
        title: spec.title,
        summary: spec.blurb,
        render: (ctx) =>
          (spec.intro ?? `<p>${esc(spec.blurb)}</p>`) +
          `<div class="tiles">${spec.tables
            .map((t) => `<a class="tile" href="${ctx.href(pathOf(t.ns, 'index'))}">${icon(ctx, t.ns, 'ico-tile')}<span class="count">${t.entries.length}</span><b>${esc(t.label)}</b><span>${esc(t.blurb ?? '')}</span></a>`)
            .join('')}</div>` +
          (spec.extra?.length ? `${h2('Articles')}<ul>${spec.extra.map((p) => `<li>${ctx.link(p.ns, p.id)}</li>`).join('')}</ul>` : ''),
      };
      const lists: PageSpec[] = spec.tables.map((t) => ({
        ns: t.ns,
        id: 'index',
        title: t.label,
        summary: t.blurb ?? `All ${t.entries.length} ${t.label.toLowerCase()}.`,
        render: (ctx) => (t.intro ?? (t.blurb ? `<p>${esc(t.blurb)}</p>` : '')) + (t.list ? t.list(t.entries, ctx) : defaultList(t, ctx)),
      }));
      return [landing, ...lists, ...spec.tables.flatMap((t) => tablePages(t)), ...(spec.extra ?? [])];
    },
  };
}
