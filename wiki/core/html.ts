/**
 * Small HTML builders shared by every section. Everything that takes text
 * escapes it; arguments named `html` are trusted markup (usually from other
 * builders or ctx.link).
 */
import { content } from '../../src/data';
import type { ModifierSpec } from '../../src/engine/stats/modifiers';

export function esc(s: string | number | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'page';
}

/** Readable modifier: `+12% Crit Chance`, `30% more Max HP`. */
export function mod(m: ModifierSpec): string {
  const info = content.stats.find(m.stat);
  const name = info?.name ?? m.stat;
  const v = Math.abs(m.value);
  const sign = m.value >= 0 ? '+' : '-';
  let text: string;
  if (m.type === 'flat') text = info?.format === 'percent' ? `${sign}${v}% ${name}` : `${sign}${v} ${name}`;
  else if (m.type === 'percent') text = `${sign}${v}% increased ${name}`;
  else if (m.type === 'more') text = `${v}% ${m.value >= 0 ? 'more' : 'less'} ${name}`;
  else text = `${name} = ${m.value}`;
  if (m.per) text += ` per ${m.per.every ?? 1} ${content.stats.find(m.per.stat)?.name ?? m.per.stat}`;
  return text;
}

export function mods(list: readonly ModifierSpec[] | undefined): string {
  return (list ?? []).map((m) => esc(mod(m))).join('<br>');
}

/** `Str 9 · Dex 5 ...` from a partial stat block. */
export function statLine(stats: Partial<Record<string, number>> | undefined): string {
  return Object.entries(stats ?? {})
    .filter(([, v]) => v)
    .map(([k, v]) => `${esc(k.toUpperCase())} ${esc(v)}`)
    .join(' · ');
}

/** Paragraphs from plain text (blank lines split paragraphs). */
export function prose(text: string | undefined): string {
  if (!text) return '';
  return text
    .split(/\n\s*\n/)
    .map((p) => `<p>${esc(p.trim())}</p>`)
    .join('');
}

export interface InfoboxRow {
  label: string;
  /** Trusted HTML. Empty values drop the row. */
  html: string | undefined;
}

/** The floating box at the top right of an entity page (MediaWiki style). */
export function infobox(title: string, rows: InfoboxRow[], opts: { color?: string; image?: string; caption?: string } = {}): string {
  const body = rows
    .filter((r) => r.html !== undefined && r.html !== '')
    .map((r) => `<tr><th>${esc(r.label)}</th><td>${r.html}</td></tr>`)
    .join('');
  const style = opts.color ? ` style="--accent:${esc(opts.color)}"` : '';
  const img = opts.image ? `<div class="infobox-img">${opts.image}</div>` : '';
  const cap = opts.caption ? `<div class="infobox-caption">${esc(opts.caption)}</div>` : '';
  return `<aside class="infobox"${style}><div class="infobox-title">${esc(title)}</div>${img}${cap}<table>${body}</table></aside>`;
}

export interface Column<T> {
  label: string;
  /** Trusted HTML for the cell. */
  cell(row: T): string;
  /** Plain value used for sorting (defaults to the cell's text). Numbers sort numerically. */
  sort?(row: T): string | number;
  className?: string;
}

/**
 * A sortable, filterable table. `filter: true` adds a search box above it
 * (wiki.js wires both up). Use for every list longer than a handful of rows.
 */
export function table<T>(rows: readonly T[], cols: Column<T>[], opts: { filter?: boolean; caption?: string } = {}): string {
  const head = cols.map((c) => `<th>${esc(c.label)}</th>`).join('');
  const body = rows
    .map((r) => {
      const tds = cols
        .map((c) => {
          const s = c.sort?.(r);
          const data = s === undefined ? '' : ` data-sort="${esc(s)}"`;
          return `<td${data}${c.className ? ` class="${c.className}"` : ''}>${c.cell(r)}</td>`;
        })
        .join('');
      return `<tr>${tds}</tr>`;
    })
    .join('');
  const filter = opts.filter ? `<input class="table-filter" type="search" placeholder="Filter ${rows.length} rows…">` : '';
  const cap = opts.caption ? `<caption>${esc(opts.caption)}</caption>` : '';
  return `${filter}<div class="table-wrap"><table class="wikitable sortable">${cap}<thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

/** `<h2>` with an anchor id, so the table of contents can link to it. */
export function h2(text: string): string {
  return `<h2 id="${slug(text)}">${esc(text)}</h2>`;
}

export function h3(text: string): string {
  return `<h3 id="${slug(text)}">${esc(text)}</h3>`;
}

/** Bulleted list of trusted HTML items. */
export function ul(items: readonly string[]): string {
  return items.length ? `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>` : '';
}

/** Comma-joined trusted HTML, or an em dash when empty. */
export function joinHtml(items: readonly string[], sep = ', '): string {
  return items.length ? items.join(sep) : '—';
}

/** Callout box: `note`, `tip`, `warn`. */
export function callout(kind: 'note' | 'tip' | 'warn', html: string): string {
  return `<div class="callout callout-${kind}">${html}</div>`;
}

/** A pill/badge, e.g. rarity or element. */
export function tag(text: string, color?: string): string {
  return `<span class="tag"${color ? ` style="--tag:${esc(color)}"` : ''}>${esc(text)}</span>`;
}

/** Bottom-of-page navigation box listing sibling pages (Idleon/Fandom navbox). */
export function navbox(title: string, groups: { label: string; html: string[] }[]): string {
  const rows = groups
    .filter((g) => g.html.length)
    .map((g) => `<tr><th>${esc(g.label)}</th><td>${g.html.join(' · ')}</td></tr>`)
    .join('');
  return `<table class="navbox"><caption>${esc(title)}</caption>${rows}</table>`;
}

/** Name, title or id of a loosely typed content entry. */
export function nameOf(e: { id: string } & Record<string, unknown>): string {
  const n = e.name ?? e.title ?? e.label;
  return typeof n === 'string' && n ? n : e.id;
}

/** Description-like text of a loosely typed content entry. */
export function descOf(e: Record<string, unknown>): string | undefined {
  for (const k of ['description', 'summary', 'blurb', 'text', 'tagline', 'flavor']) {
    const v = e[k];
    if (typeof v === 'string' && v) return v;
  }
  return undefined;
}

/** Element display colors used by tags across sections. */
export const ELEMENT_COLORS: Record<string, string> = {
  physical: '#a8a29e',
  fire: '#ef6c3a',
  ice: '#5ec8f2',
  lightning: '#f5d142',
  earth: '#a0784a',
  holy: '#ffd54a',
  shadow: '#8b6bc4',
  nature: '#7ccf5a',
  void: '#6b5b95',
  arcane: '#c46bd6',
};
