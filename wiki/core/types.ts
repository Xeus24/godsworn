/**
 * The wiki's page model. A section (one file in `wiki/sections/`) returns a
 * list of PageSpecs; the Site registers them all first, then renders them,
 * so any page can link to any other page by its key (`ns:id`) and broken
 * links are caught at build time instead of shipping as dead hrefs.
 */

/** Sidebar groups, in display order. A section joins one of these. */
export const NAV_GROUPS = ['Getting Started', 'Characters', 'Skills', 'Items', 'Bestiary', 'World', 'Systems'] as const;
export type NavGroup = (typeof NAV_GROUPS)[number];

export interface RenderCtx {
  /** `<a>` to another page. Records a broken link (build error) if the key is unknown. */
  link(ns: string, id: string, label?: string): string;
  /** Like `link`, but falls back to plain (escaped) text when the page does not exist. */
  linkIf(ns: string, id: string, label?: string): string;
  /** True when a page with this key exists. */
  has(ns: string, id: string): boolean;
  /** Title of another page, or undefined. */
  titleOf(ns: string, id: string): string | undefined;
  /** Relative href to a site path such as `assets/wiki.css` (from the page being rendered). */
  href(path: string): string;
  /** Every page in a namespace (registration order), e.g. for "see also" lists. */
  pagesIn(ns: string): readonly PageSpec[];
}

export interface PageSpec {
  /** Namespace: usually the content kind, e.g. `class`, `item`, `enemy`. Becomes the folder. */
  ns: string;
  id: string;
  title: string;
  /** One line shown in search results and list tables. Plain text. */
  summary?: string;
  /** Category names, shown as chips at the page foot and gathered on `category:<slug>` pages. */
  categories?: string[];
  /** Hidden or secret content: the page carries a spoiler banner and search marks it. */
  spoiler?: boolean;
  /** Extra search words (aliases, old names). */
  keywords?: string[];
  /** The page body (HTML). Called after every page is registered. */
  render(ctx: RenderCtx): string;
}

export interface WikiSection {
  id: string;
  /** Sidebar label. */
  title: string;
  group: NavGroup;
  /** One line on the home page tile. */
  blurb: string;
  /** Key of the section's landing page (`ns:id`), linked from the sidebar and home page. */
  landing: { ns: string; id: string };
  /** Sidebar links under the group heading (defaults to the landing page). */
  nav?: { label: string; ns: string; id: string }[];
  pages(): PageSpec[];
}
