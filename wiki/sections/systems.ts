/**
 * Systems: crafting, housing, collections, blessings, challenges and the
 * reference glossaries. Split into three sidebar sections (all in the
 * "Systems" group). Each shows ONE sidebar link (its landing page, whose tiles
 * lead to every list), instead of one link per table.
 */
import { content } from '../../src/data';
import { DERIVED_FORMULAS, STAT_CAPS } from '../../src/data/balance';
import { FISH, ZONE_WATERS } from '../../src/data/minigames/fish';
import { GOD_SPHERE, SPHERES, beats, type CardDef } from '../../src/data/minigames/cards';
import { ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_MILESTONES } from '../../src/data/achievements';
import { HOUSE_PRICE } from '../../src/data/world/housing';
import type { AchievementDef } from '../../src/engine/achievements/types';
import type { RecipeDef } from '../../src/engine/economy/types';
import { simpleSection, type TableSpec } from '../core/generic';
import { callout, esc, h2, h3, infobox, joinHtml, mods, navbox, prose, table, tag, ul } from '../core/html';
import type { RenderCtx, WikiSection } from '../core/types';
import { describeCond, humanize } from './systems/cond';

const gp = (n: number): string => `${n.toLocaleString('en-US')} gp`;
const RARITY_COLORS: Record<string, string> = { common: '#a8a29e', uncommon: '#7ccf5a', rare: '#5ea8f2', epic: '#b06bd6', legendary: '#f0a030', divine: '#ffd54a' };
const rarityTag = (r: string): string => tag(humanize(r), RARITY_COLORS[r]);

/** A folded group: heading plus a short summary, body inside. */
function fold(title: string, summary: string, body: string, open = false): string {
  return `<details class="fold"${open ? ' open' : ''}><summary><b>${esc(title)}</b> <span class="muted">${esc(summary)}</span></summary>${body}</details>`;
}

/** Entries grouped into key-ordered folded tables. */
function grouped<T>(rows: readonly T[], key: (r: T) => string, order: string[], label: (k: string) => string, cols: Parameters<typeof table<T>>[1]): string {
  const keys = [...new Set([...order, ...rows.map(key)])];
  return keys
    .map((k) => {
      const g = rows.filter((r) => key(r) === k);
      return g.length ? fold(label(k), `${g.length}`, table(g, cols, { filter: g.length > 14 })) : '';
    })
    .join('');
}

const godName = (ctx: RenderCtx, id: string | undefined): string => (id ? ctx.linkIf('god', id) : '—');
const itemLink = (ctx: RenderCtx, id: string): string => ctx.linkIf('item', id, content.items.find(id)?.name ?? humanize(id));

// ---------------------------------------------------------------- crafting

const professions = content.professions.all();
const recipes = content.recipes.all();

function recipeOutput(r: RecipeDef, ctx: RenderCtx): string {
  return r.output.kind === 'item'
    ? `${itemLink(ctx, r.output.itemId)}${r.output.qty > 1 ? ` ×${r.output.qty}` : ''}`
    : `${humanize(r.output.category)} gear, tier ${r.output.tier}`;
}
const recipeInputs = (r: RecipeDef, ctx: RenderCtx): string =>
  joinHtml([...r.inputs.map((i) => `${itemLink(ctx, i.itemId)} ×${i.qty}`), ...(r.gold ? [gp(r.gold)] : [])], '<br>');

const recipeCols = (ctx: RenderCtx, withProf: boolean): Parameters<typeof table<RecipeDef>>[1] => [
  { label: 'Recipe', cell: (r) => ctx.link('recipe', r.id), sort: (r) => r.name },
  ...(withProf ? [{ label: 'Profession', cell: (r: RecipeDef) => ctx.link('profession', r.profession), sort: (r: RecipeDef) => r.profession }] : []),
  { label: 'Lvl', cell: (r) => String(r.level), sort: (r) => r.level, className: 'num' },
  { label: 'Makes', cell: (r) => recipeOutput(r, ctx), sort: (r) => r.name },
  { label: 'Needs', cell: (r) => recipeInputs(r, ctx) },
  { label: 'XP', cell: (r) => String(r.xp), sort: (r) => r.xp, className: 'num' },
  { label: 'Learned', cell: (r) => (r.starter ? 'Starter' : 'Scroll') },
];

const craftTables: TableSpec<any>[] = [
  {
    ns: 'profession',
    label: 'Professions',
    category: 'Professions',
    blurb: 'Crafting and gathering skills.',
    entries: professions,
    summary: (p: (typeof professions)[number]) => p.description,
    categories: (p: (typeof professions)[number]) => [p.kind === 'crafting' ? 'Crafting professions' : 'Gathering skills'],
    render: (p: (typeof professions)[number], ctx) => {
      const rs = recipes.filter((r) => r.profession === p.id).sort((a, b) => a.level - b.level);
      const starters = rs.filter((r) => r.starter).length;
      return [
        infobox(p.name, [
          { label: 'Kind', html: esc(humanize(p.kind)) },
          { label: 'Recipes', html: rs.length ? `${rs.length} (${starters} starter)` : '' },
          { label: 'Levels', html: rs.length ? `${rs[0]!.level}–${rs[rs.length - 1]!.level}` : '' },
        ]),
        prose(p.description),
        rs.length
          ? `${h2('Recipes')}${table(rs, recipeCols(ctx, false), { filter: rs.length > 12 })}`
          : callout('note', `<p>${esc(p.name)} is a gathering skill: it levels up as you work nodes in the field, and the materials feed the crafting professions.</p>`),
        navbox('Professions', [
          { label: 'Crafting', html: professions.filter((x) => x.kind === 'crafting').map((x) => ctx.link('profession', x.id)) },
          { label: 'Gathering', html: professions.filter((x) => x.kind === 'gathering').map((x) => ctx.link('profession', x.id)) },
        ]),
      ].join('');
    },
    list: (list: readonly (typeof professions)[number][], ctx) =>
      table(list, [
        { label: 'Profession', cell: (p) => ctx.link('profession', p.id), sort: (p) => p.name },
        { label: 'Kind', cell: (p) => esc(humanize(p.kind)) },
        { label: 'Recipes', cell: (p) => String(recipes.filter((r) => r.profession === p.id).length), sort: (p) => recipes.filter((r) => r.profession === p.id).length, className: 'num' },
        { label: 'About', cell: (p) => esc(p.description) },
      ]),
  },
  {
    ns: 'recipe',
    label: 'Recipes',
    category: 'Recipes',
    blurb: 'Every recipe, grouped by profession.',
    entries: recipes,
    summary: (r: RecipeDef) => `${humanize(r.profession)} level ${r.level}`,
    categories: (r: RecipeDef) => [`${humanize(r.profession)} recipes`],
    render: (r: RecipeDef, ctx) => {
      const out = r.output.kind === 'item' ? content.items.find(r.output.itemId) : undefined;
      const same = recipes.filter((x) => x.profession === r.profession && x.id !== r.id && Math.abs(x.level - r.level) <= 5).slice(0, 12);
      return [
        infobox(r.name, [
          { label: 'Profession', html: ctx.link('profession', r.profession) },
          { label: 'Level', html: String(r.level) },
          { label: 'Makes', html: recipeOutput(r, ctx) },
          { label: 'Gold', html: r.gold ? gp(r.gold) : '' },
          { label: 'XP per craft', html: String(r.xp) },
          { label: 'Learned', html: r.starter ? 'Known from the start' : 'Taught by a recipe scroll' },
        ]),
        `<p>${esc(r.name)} is a ${ctx.link('profession', r.profession)} recipe that needs profession level ${r.level}.${out ? ` ${esc((out as { description?: string }).description ?? '')}` : ''}</p>`,
        h2('Ingredients'),
        ul([...r.inputs.map((i) => `${itemLink(ctx, i.itemId)} ×${i.qty}`), ...(r.gold ? [gp(r.gold)] : [])]),
        same.length ? `${h2('Nearby recipes')}${ul(same.map((x) => `${ctx.link('recipe', x.id)} <span class="muted">level ${x.level}</span>`))}` : '',
      ].join('');
    },
    list: (list: readonly RecipeDef[], ctx) =>
      grouped(list, (r) => r.profession, professions.map((p) => p.id), (k) => content.professions.find(k)?.name ?? k, recipeCols(ctx, false)),
  },
];

// ---------------------------------------------------------------- housing & looks

const rooms = content.houseRooms.all();
const furniture = content.furniture.all();
const investments = content.investments.all();
const dyes = content.dyes.all();
const frames = content.frames.all();
const townName = (ctx: RenderCtx, id: string): string => ctx.linkIf('town', id, ctx.titleOf('town', id) ?? humanize(id));

const homeTables: TableSpec<any>[] = [
  {
    ns: 'house-room',
    label: 'House rooms',
    category: 'House rooms',
    blurb: `Rooms for your house (${gp(HOUSE_PRICE)} to buy one).`,
    entries: rooms,
    render: (r: (typeof rooms)[number], ctx) => {
      const pieces = furniture.filter((f) => f.room === r.id);
      return [
        infobox(r.name, [
          { label: 'Levels', html: String(r.costs.length) },
          { label: 'Furniture', html: pieces.length ? String(pieces.length) : '' },
        ]),
        prose(r.description),
        h2('Upgrades'),
        table(
          r.costs.map((c, i) => ({ level: i + 1, cost: c, m: r.modifiers?.[i] })),
          [
            { label: 'Level', cell: (x) => String(x.level), className: 'num' },
            { label: 'Cost', cell: (x) => gp(x.cost), sort: (x) => x.cost, className: 'num' },
            { label: 'Bonus', cell: (x) => (x.m?.length ? mods(x.m) : '—') },
          ],
        ),
        pieces.length
          ? `${h2(`Furniture (${pieces.length})`)}${table(pieces, [
              { label: 'Piece', cell: (f) => ctx.link('furniture', f.id), sort: (f) => f.name },
              { label: 'Price', cell: (f) => gp(f.price), sort: (f) => f.price, className: 'num' },
              { label: 'Bonus', cell: (f) => mods(f.modifiers) },
            ], { filter: pieces.length > 12 })}`
          : '',
        navbox('Housing', [
          { label: 'Rooms', html: rooms.map((x) => ctx.link('house-room', x.id)) },
          { label: 'More', html: [ctx.link('furniture', 'index', 'All furniture'), ctx.link('investment', 'index', 'Investments')] },
        ]),
      ].join('');
    },
    list: (list: readonly (typeof rooms)[number][], ctx) =>
      table(list, [
        { label: 'Room', cell: (r) => ctx.link('house-room', r.id), sort: (r) => r.name },
        { label: 'Cost', cell: (r) => esc(r.costs.map(gp).join(' → ')), sort: (r) => r.costs[0]!, className: 'num' },
        { label: 'Furniture', cell: (r) => String(furniture.filter((f) => f.room === r.id).length), className: 'num' },
        { label: 'About', cell: (r) => esc(r.description) },
      ]),
  },
  {
    ns: 'furniture',
    label: 'Furniture',
    category: 'Furniture',
    blurb: 'Pieces for each room, each with a small bonus.',
    entries: furniture,
    summary: (f: (typeof furniture)[number]) => f.description,
    categories: (f: (typeof furniture)[number]) => [`${content.houseRooms.find(f.room)?.name ?? humanize(f.room)} furniture`],
    render: (f: (typeof furniture)[number], ctx) => {
      const siblings = furniture.filter((x) => x.room === f.room && x.id !== f.id);
      return [
        infobox(f.name, [
          { label: 'Room', html: ctx.linkIf('house-room', f.room, content.houseRooms.find(f.room)?.name ?? humanize(f.room)) },
          { label: 'Price', html: gp(f.price) },
          { label: 'Bonus', html: mods(f.modifiers) },
        ]),
        prose(f.description),
        siblings.length ? `${h2('Same room')}${ul(siblings.map((x) => ctx.link('furniture', x.id)))}` : '',
      ].join('');
    },
    list: (list: readonly (typeof furniture)[number][], ctx) =>
      grouped(list, (f) => f.room, rooms.map((r) => r.id), (k) => content.houseRooms.find(k)?.name ?? humanize(k), [
        { label: 'Piece', cell: (f) => ctx.link('furniture', f.id), sort: (f) => f.name },
        { label: 'Price', cell: (f) => gp(f.price), sort: (f) => f.price, className: 'num' },
        { label: 'Bonus', cell: (f) => mods(f.modifiers) },
      ]),
  },
  {
    ns: 'investment',
    label: 'Investments',
    category: 'Investments',
    blurb: 'Businesses that pay gold each day you are away.',
    entries: investments,
    summary: (i: (typeof investments)[number]) => i.description,
    render: (i: (typeof investments)[number], ctx) => {
      const others = investments.filter((x) => x.town === i.town && x.id !== i.id);
      return [
        infobox(i.name, [
          { label: 'Town', html: townName(ctx, i.town) },
          { label: 'Full income', html: `${gp(i.income[2])} per day` },
          { label: 'Total cost', html: gp(i.costs.reduce((a, b) => a + b, 0)) },
        ]),
        prose(i.description),
        h2('Levels'),
        table(i.costs.map((c, k) => ({ level: k + 1, cost: c, income: i.income[k]! })), [
          { label: 'Level', cell: (x) => String(x.level), className: 'num' },
          { label: 'Cost', cell: (x) => gp(x.cost), sort: (x) => x.cost, className: 'num' },
          { label: 'Income / day', cell: (x) => gp(x.income), sort: (x) => x.income, className: 'num' },
          { label: 'Pays back in', cell: (x) => `${Math.ceil(x.cost / x.income)} days`, sort: (x) => x.cost / x.income, className: 'num' },
        ]),
        others.length ? `${h2(`Also in ${ctx.titleOf('town', i.town) ?? humanize(i.town)}`)}${ul(others.map((x) => ctx.link('investment', x.id)))}` : '',
      ].join('');
    },
    list: (list: readonly (typeof investments)[number][], ctx) =>
      grouped(list, (i) => i.town, [], (k) => ctx.titleOf('town', k) ?? humanize(k), [
        { label: 'Investment', cell: (i) => ctx.link('investment', i.id), sort: (i) => i.name },
        { label: 'Town', cell: (i) => townName(ctx, i.town) },
        { label: 'Cost (3 levels)', cell: (i) => esc(i.costs.map(gp).join(' / ')), sort: (i) => i.costs[0], className: 'num' },
        { label: 'Income / day', cell: (i) => esc(i.income.map((v) => v.toLocaleString('en-US')).join(' / ')), sort: (i) => i.income[2], className: 'num' },
      ]),
  },
  {
    ns: 'dye',
    label: 'Dyes',
    category: 'Dyes',
    blurb: 'Colours for your hero at the Wardrobe.',
    entries: dyes,
    summary: (d: (typeof dyes)[number]) => (d.cost ? `Costs ${gp(d.cost)}` : 'Known from the start'),
    render: (d: (typeof dyes)[number], ctx) =>
      infobox(d.name, [
        { label: 'Colour', html: `<span class="swatch" style="display:inline-block;width:1.2em;height:1.2em;vertical-align:middle;border:1px solid #888;background:${esc(d.color)}"></span> ${esc(d.color)}` },
        { label: 'Cost', html: d.cost ? gp(d.cost) : 'Free: known from the start' },
      ], { color: d.color }) +
      `<p>${esc(d.name)} is a dye ${d.cost ? `learned at the Wardrobe for ${gp(d.cost)}` : 'every hero starts with'}.</p>` +
      navbox('Appearance', [{ label: 'See also', html: [ctx.link('dye', 'index', 'All dyes'), ctx.link('frame', 'index', 'Portrait frames')] }]),
    list: (list: readonly (typeof dyes)[number][]) =>
      table(list, [
        { label: 'Dye', cell: (d) => `<span style="display:inline-block;width:1em;height:1em;vertical-align:middle;margin-right:.4em;border:1px solid #888;background:${esc(d.color)}"></span>${esc(d.name)}`, sort: (d) => d.name },
        { label: 'Colour', cell: (d) => esc(d.color) },
        { label: 'Cost', cell: (d) => (d.cost ? gp(d.cost) : 'Free'), sort: (d) => d.cost, className: 'num' },
      ]).replace(/<a /g, '<a '),
  },
  {
    ns: 'frame',
    label: 'Portrait frames',
    category: 'Portrait frames',
    blurb: 'Borders for your portrait, mostly earned by achievements.',
    entries: frames,
    summary: (f: (typeof frames)[number]) => f.description,
    render: (f: (typeof frames)[number], ctx) =>
      infobox(f.name, [
        { label: 'Colours', html: `${esc(f.colors[0])} / ${esc(f.colors[1])}` },
        { label: 'Earned by', html: f.achievement ? ctx.linkIf('achievement', f.achievement) : 'Free from the start' },
      ], { color: f.colors[0] }) + prose(f.description),
    list: (list: readonly (typeof frames)[number][], ctx) =>
      table(list, [
        { label: 'Frame', cell: (f) => ctx.link('frame', f.id), sort: (f) => f.name },
        { label: 'Earned by', cell: (f) => (f.achievement ? ctx.linkIf('achievement', f.achievement) : 'Free') },
        { label: 'About', cell: (f) => esc(f.description) },
      ]),
  },
];

// ---------------------------------------------------------------- collections

const achievements = content.achievements.all();
const pets = content.pets.all();
const mounts = content.mounts.all();
const cards = content.cards.all();
const endings = content.endings.all();
const catName = (id: string): string => ACHIEVEMENT_CATEGORIES.find((c) => c.id === id)?.name ?? humanize(id);
const totalPoints = achievements.reduce((a, x) => a + x.points, 0);

function achievementRewards(a: AchievementDef, ctx: RenderCtx): string[] {
  return [
    a.title ? `Title: “${esc(a.title)}”` : '',
    a.gold ? gp(a.gold) : '',
    a.pet ? `Pet: ${ctx.linkIf('pet', a.pet)}` : '',
    a.mount ? `Mount: ${ctx.linkIf('mount', a.mount)}` : '',
    ...frames.filter((f) => f.achievement === a.id).map((f) => `Frame: ${ctx.linkIf('frame', f.id)}`),
  ].filter(Boolean);
}

/** The achievement an `Achievement: Name` source line points at. */
function sourceHtml(source: string, ctx: RenderCtx): string {
  const m = /^Achievement: (.+)$/.exec(source);
  const a = m ? achievements.find((x) => x.name === m[1]) : undefined;
  return a ? `Achievement: ${ctx.link('achievement', a.id)}` : esc(source);
}

const collectionTables: TableSpec<any>[] = [
  {
    ns: 'achievement',
    label: 'Achievements',
    category: 'Achievements',
    blurb: `${achievements.length} achievements worth ${totalPoints.toLocaleString('en-US')} points.`,
    intro: `<p>Earn achievements to build up points. Each milestone passed gives your hero a permanent bonus, and they all stack.</p>${fold('Point milestones', `${ACHIEVEMENT_MILESTONES.length} bonuses`, table(ACHIEVEMENT_MILESTONES, [
      { label: 'Points', cell: (m) => String(m.points), sort: (m) => m.points, className: 'num' },
      { label: 'Bonus', cell: (m) => esc(m.description) },
    ]))}`,
    entries: achievements,
    summary: (a: AchievementDef) => (a.hidden ? 'A hidden achievement.' : a.description),
    spoiler: (a: AchievementDef) => !!a.hidden,
    categories: (a: AchievementDef) => [`${catName(a.category)} achievements`],
    render: (a: AchievementDef, ctx) => {
      const rewards = achievementRewards(a, ctx);
      const mates = achievements.filter((x) => x.category === a.category && x.id !== a.id && !x.hidden).slice(0, 14);
      return [
        infobox(a.name, [
          { label: 'Category', html: esc(catName(a.category)) },
          { label: 'Points', html: String(a.points) },
          { label: 'Hidden', html: a.hidden ? 'Yes, until earned' : '' },
          { label: 'Rewards', html: rewards.join('<br>') },
        ]),
        prose(a.description),
        h2('How to earn it'),
        `<p>${describeCond(a.check, ctx)}.</p>`,
        mates.length ? `${h2(`More ${catName(a.category)} achievements`)}${ul(mates.map((x) => `${ctx.link('achievement', x.id)} <span class="muted">${x.points} pts</span>`))}` : '',
      ].join('');
    },
    list: (list: readonly AchievementDef[], ctx) =>
      grouped(list, (a) => a.category, ACHIEVEMENT_CATEGORIES.map((c) => c.id), (k) => {
        const g = list.filter((a) => a.category === k);
        return `${catName(k)} · ${g.reduce((s, a) => s + a.points, 0)} pts`;
      }, [
        { label: 'Achievement', cell: (a) => (a.hidden ? `${ctx.link('achievement', a.id)} ${tag('Hidden')}` : ctx.link('achievement', a.id)), sort: (a) => a.name },
        { label: 'Pts', cell: (a) => String(a.points), sort: (a) => a.points, className: 'num' },
        { label: 'Requirement', cell: (a) => describeCond(a.check, ctx) },
        { label: 'Rewards', cell: (a) => achievementRewards(a, ctx).join('<br>') },
      ]),
  },
  {
    ns: 'pet',
    label: 'Pets',
    category: 'Pets',
    blurb: 'One companion creature at a time, with a small bonus.',
    entries: pets,
    summary: (p: (typeof pets)[number]) => p.description,
    render: (p: (typeof pets)[number], ctx) =>
      [
        infobox(p.name, [
          { label: 'Source', html: sourceHtml(p.source, ctx) },
          { label: 'Price', html: p.price ? gp(p.price) : '' },
          { label: 'Rift reward', html: p.rift ? 'Yes' : '' },
          { label: 'Bonus', html: mods(p.modifiers) },
        ]),
        prose(p.description),
        navbox('Companions', [{ label: 'See also', html: [ctx.link('pet', 'index', 'All pets'), ctx.link('mount', 'index', 'Mounts')] }]),
      ].join(''),
    list: (list: readonly (typeof pets)[number][], ctx) =>
      table(list, [
        { label: 'Pet', cell: (p) => ctx.link('pet', p.id), sort: (p) => p.name },
        { label: 'Bonus', cell: (p) => mods(p.modifiers) },
        { label: 'Source', cell: (p) => sourceHtml(p.source, ctx) },
        { label: 'Price', cell: (p) => (p.price ? gp(p.price) : '—'), sort: (p) => p.price ?? 0, className: 'num' },
      ], { filter: true }),
  },
  {
    ns: 'mount',
    label: 'Mounts',
    category: 'Mounts',
    blurb: 'Faster travel and fewer ambushes.',
    entries: mounts,
    summary: (m: (typeof mounts)[number]) => m.description,
    render: (m: (typeof mounts)[number], ctx) =>
      [
        infobox(m.name, [
          { label: 'Source', html: sourceHtml(m.source, ctx) },
          { label: 'Price', html: m.price ? gp(m.price) : '' },
          { label: 'Minutes per step', html: `${m.stepMinutes} (on foot: 2)` },
          { label: 'Ambush chance', html: `×${m.encounterMult}` },
          { label: 'Grants', html: m.grants ? `${esc(humanize(m.grants.skill))} rank ${m.grants.rank}` : '' },
          { label: 'Flies', html: m.flies ? 'Yes' : '' },
        ]),
        prose(m.description),
        navbox('Companions', [{ label: 'See also', html: [ctx.link('pet', 'index', 'Pets'), ctx.link('mount', 'index', 'All mounts')] }]),
      ].join(''),
    list: (list: readonly (typeof mounts)[number][], ctx) =>
      table(list, [
        { label: 'Mount', cell: (m) => ctx.link('mount', m.id), sort: (m) => m.name },
        { label: 'Min / step', cell: (m) => String(m.stepMinutes), sort: (m) => m.stepMinutes, className: 'num' },
        { label: 'Ambushes', cell: (m) => `×${m.encounterMult}`, sort: (m) => m.encounterMult, className: 'num' },
        { label: 'Special', cell: (m) => esc([m.flies ? 'Flies' : '', m.grants ? `${humanize(m.grants.skill)} ${m.grants.rank}` : ''].filter(Boolean).join(', ')) },
        { label: 'Source', cell: (m) => sourceHtml(m.source, ctx) },
        { label: 'Price', cell: (m) => (m.price ? gp(m.price) : '—'), sort: (m) => m.price ?? 0, className: 'num' },
      ], { filter: true }),
  },
  {
    ns: 'fish',
    label: 'Fish',
    category: 'Fish',
    blurb: `${FISH.length} fish for the fishing minigame.`,
    entries: content.fish.all(),
    summary: (f: (typeof FISH)[number]) => `${humanize(f.water)} water, rarity ${f.rarity}`,
    categories: (f: (typeof FISH)[number]) => [`${humanize(f.water)} fish`],
    render: (f: (typeof FISH)[number], ctx) => {
      const zones = Object.entries(ZONE_WATERS).filter(([, w]) => w.includes(f.water)).map(([z]) => ctx.linkIf('zone', z));
      const same = FISH.filter((x) => x.water === f.water && x.id !== f.id);
      return [
        infobox(f.name, [
          { label: 'Water', html: esc(humanize(f.water)) },
          { label: 'Rarity', html: '★'.repeat(f.rarity) + '☆'.repeat(5 - f.rarity) },
          { label: 'Bites', html: f.time === 'any' ? 'Any hour' : `By ${f.time}` },
          { label: 'Sells for', html: gp(f.price) },
          { label: 'Record weight', html: `${f.max} lb` },
        ]),
        `<p>${esc(f.name)} lives in ${esc(humanize(f.water).toLowerCase())} water and bites ${f.time === 'any' ? 'at any hour' : `by ${f.time}`}. Rarer fish bite less often and fight harder.</p>`,
        zones.length ? `${h2('Where to find it')}<p>${joinHtml(zones)}</p>` : '',
        same.length ? `${h2(`Other ${humanize(f.water).toLowerCase()} fish`)}${ul(same.map((x) => `${ctx.link('fish', x.id)} <span class="muted">${'★'.repeat(x.rarity)}</span>`))}` : '',
      ].join('');
    },
    list: (list: readonly (typeof FISH)[number][], ctx) =>
      grouped(list, (f) => f.water, [...new Set(FISH.map((f) => f.water))], (k) => `${humanize(k)} water`, [
        { label: 'Fish', cell: (f) => ctx.link('fish', f.id), sort: (f) => f.name },
        { label: 'Rarity', cell: (f) => '★'.repeat(f.rarity), sort: (f) => f.rarity },
        { label: 'Time', cell: (f) => (f.time === 'any' ? 'Any' : humanize(f.time)) },
        { label: 'Price', cell: (f) => gp(f.price), sort: (f) => f.price, className: 'num' },
        { label: 'Record', cell: (f) => `${f.max} lb`, sort: (f) => f.max, className: 'num' },
      ]),
  },
  {
    ns: 'card',
    label: 'Cards',
    category: 'Cards',
    blurb: 'Pantheon Cards, the tavern card game.',
    intro: `<p>Each card belongs to a god and a sphere, and has a power from 2 to 9. A card gets +3 when its sphere beats the other card's; the higher total wins the round. A sphere beats the next two around the ring: ${SPHERES.map(humanize).join(' → ')} → ${humanize(SPHERES[0]!)}.</p>`,
    entries: cards,
    summary: (c: CardDef) => `${c.god ? humanize(c.god) : 'Neutral'}, power ${c.power}`,
    categories: (c: CardDef) => [c.sphere ? `${humanize(c.sphere)} sphere` : 'Neutral cards'],
    render: (c: CardDef, ctx) => {
      const beating = c.sphere ? SPHERES.filter((s) => beats(c.sphere, s)) : [];
      const beatenBy = c.sphere ? SPHERES.filter((s) => beats(s, c.sphere)) : [];
      const sibs = cards.filter((x) => x.god === c.god && x.id !== c.id).sort((a, b) => a.power - b.power);
      return [
        infobox(c.name, [
          { label: 'God', html: c.god ? godName(ctx, c.god) : 'Neutral' },
          { label: 'Sphere', html: c.sphere ? esc(humanize(c.sphere)) : 'None' },
          { label: 'Power', html: String(c.power) },
        ]),
        `<p>A power ${c.power} card${c.god ? ` of ${godName(ctx, c.god)}` : ' with no god'}.</p>`,
        c.sphere ? `<p>Its ${esc(humanize(c.sphere))} sphere beats ${esc(beating.map(humanize).join(' and '))}, and loses to ${esc(beatenBy.map(humanize).join(' and '))}.</p>` : '<p>Neutral cards never get the sphere bonus, and nothing gets it against them.</p>',
        sibs.length ? `${h2(`The rest of ${c.god ? humanize(c.god) : 'the neutral'} cards`)}${ul(sibs.map((x) => `${ctx.link('card', x.id)} <span class="muted">power ${x.power}</span>`))}` : '',
      ].join('');
    },
    list: (list: readonly CardDef[], ctx) =>
      grouped(list, (c) => c.god ?? '', [...Object.keys(GOD_SPHERE), ''], (k) => (k ? `${humanize(k)} · ${humanize(GOD_SPHERE[k] ?? '')}` : 'Neutral'), [
        { label: 'Card', cell: (c) => ctx.link('card', c.id), sort: (c) => c.name },
        { label: 'God', cell: (c) => godName(ctx, c.god) },
        { label: 'Sphere', cell: (c) => esc(c.sphere ? humanize(c.sphere) : '—') },
        { label: 'Power', cell: (c) => String(c.power), sort: (c) => c.power, className: 'num' },
      ]),
  },
  {
    ns: 'ending',
    label: 'Endings',
    category: 'Endings',
    blurb: 'How the story can end. Spoilers.',
    entries: endings,
    spoiler: () => true,
    summary: (e: (typeof endings)[number]) => (e.title ? `Ending that earns the title ${e.title}` : 'An ending'),
    render: (e: (typeof endings)[number], ctx) =>
      [
        infobox(e.name, [{ label: 'Title', html: e.title ? esc(e.title) : '' }]),
        prose(e.text),
        e.godText && Object.keys(e.godText).length
          ? `${h2('For an Apostle')}${Object.entries(e.godText).map(([g, t]) => `${h3(content.gods.find(g)?.name ?? humanize(g))}${prose(t)}`).join('')}`
          : '',
        achievements.filter((a) => JSON.stringify(a.check).includes(`"ending":"${e.id}"`)).length
          ? `${h2('Achievements')}${ul(achievements.filter((a) => JSON.stringify(a.check).includes(`"ending":"${e.id}"`)).map((a) => ctx.link('achievement', a.id)))}`
          : '',
        navbox('Endings', [{ label: 'All', html: endings.map((x) => ctx.link('ending', x.id)) }]),
      ].join(''),
    list: (list: readonly (typeof endings)[number][], ctx) =>
      table(list, [
        { label: 'Ending', cell: (e) => ctx.link('ending', e.id), sort: (e) => e.name },
        { label: 'Title', cell: (e) => esc(e.title ?? '—') },
      ]),
  },
];

// ---------------------------------------------------------------- blessings & rules

const blessings = content.blessings.all();
const edicts = content.edicts.all();
const challenges = content.challenges.all();
const stats = content.stats.all();
const resources = content.resources.all();
const mechanics = content.mechanics.all();
const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'divine'];
const rarityRank = (r: string): number => RARITY_ORDER.indexOf(r);
const blessingKind = (b: (typeof blessings)[number]): string => (b.saint ? 'Saint blessing' : b.kind === 'minor' ? 'Minor (timed)' : 'Major');

const RULE_TEXT: Record<string, string> = {
  noShopping: 'Merchants will not sell to you (selling, crafting and quest rewards still work).',
  noFastTravel: 'Waypoints will not carry you.',
  noCompanions: 'Companions and followers will not fight beside you.',
  noFavor: 'You gain no favor from the gods (you can still lose it).',
  pacifist: 'Foes that would fall yield instead: no kills, corpses or loot.',
  humbled: 'You stay at level 1 for the whole story.',
};

/** Content that switches a mechanic on with `flags`. */
function flagUsers(flag: string): { ns: string; id: string }[] {
  const out: { ns: string; id: string }[] = [];
  for (const b of blessings) if (b.flags?.includes(flag)) out.push({ ns: 'blessing', id: b.id });
  for (const i of content.items.all() as unknown as { id: string; flags?: string[] }[]) if (i.flags?.includes(flag)) out.push({ ns: 'item', id: i.id });
  for (const u of content.uniques.all() as unknown as { id: string; flags?: string[] }[]) if (u.flags?.includes(flag)) out.push({ ns: 'unique', id: u.id });
  return out;
}

function formulaText(stat: string): string {
  const f = (DERIVED_FORMULAS as Record<string, { base: number; perLevel?: number; coefficients?: Record<string, number> }>)[stat];
  if (!f) return '';
  const parts: string[] = [];
  if (f.base) parts.push(String(f.base));
  if (f.perLevel) parts.push(`${f.perLevel} × level`);
  for (const [k, v] of Object.entries(f.coefficients ?? {})) parts.push(`${v === 1 ? '' : `${v} × `}${content.stats.find(k)?.name ?? k}`);
  return parts.join(' + ') || '0';
}

const rulesTables: TableSpec<any>[] = [
  {
    ns: 'blessing',
    label: 'Blessings',
    category: 'Blessings',
    blurb: 'Gifts from the gods: timed minor ones and slotted major ones.',
    entries: blessings,
    summary: (b: (typeof blessings)[number]) => b.description,
    spoiler: (b: (typeof blessings)[number]) => !!b.saint,
    categories: (b: (typeof blessings)[number]) => [`${humanize(b.rarity)} blessings`],
    render: (b: (typeof blessings)[number], ctx) => {
      const sibs = blessings.filter((x) => x.god === b.god && x.id !== b.id && !x.saint === !b.saint);
      return [
        infobox(b.name, [
          { label: 'God', html: godName(ctx, b.god) },
          { label: 'Kind', html: blessingKind(b) },
          { label: 'Rarity', html: rarityTag(b.rarity) },
          { label: 'Needs', html: b.minTier ? `${humanize(b.minTier)} favor` : '' },
          { label: 'Lasts', html: b.battles ? `${b.battles} battles` : b.kind === 'major' ? 'While the tier holds' : '' },
          { label: 'Favor cost', html: b.favorCost ? String(b.favorCost) : '' },
          { label: 'Saint', html: b.saint ? ctx.linkIf('saint', b.saint, humanize(b.saint)) : '' },
          { label: 'Bonus', html: mods(b.modifiers) },
        ]),
        prose(b.description),
        b.flags?.length ? `${h2('Mechanics')}${ul(b.flags.map((f) => ctx.linkIf('mechanic', f, humanize(f))))}` : '',
        sibs.length ? `${h2(`More from ${content.gods.find(b.god)?.name ?? humanize(b.god)}`)}${ul(sibs.sort((x, y) => rarityRank(x.rarity) - rarityRank(y.rarity)).map((x) => `${ctx.link('blessing', x.id)} ${rarityTag(x.rarity)}`))}` : '',
      ].join('');
    },
    list: (list: readonly (typeof blessings)[number][], ctx) => {
      const godIds = [...new Set(list.map((b) => b.god))];
      const cols: Parameters<typeof table<(typeof blessings)[number]>>[1] = [
        { label: 'Blessing', cell: (b) => ctx.link('blessing', b.id), sort: (b) => b.name },
        { label: 'Rarity', cell: (b) => rarityTag(b.rarity), sort: (b) => rarityRank(b.rarity) },
        { label: 'Kind', cell: (b) => blessingKind(b) },
        { label: 'Effect', cell: (b) => esc(b.description) },
      ];
      return `<p class="muted">Grouped by god, then by rarity. Saint blessings come from hidden saint shrines.</p>${godIds
        .map((g) => {
          const gb = list.filter((b) => b.god === g).sort((a, b) => rarityRank(a.rarity) - rarityRank(b.rarity));
          return fold(content.gods.find(g)?.name ?? humanize(g), `${gb.length}`, table(gb, cols));
        })
        .join('')}`;
    },
  },
  {
    ns: 'edict',
    label: 'Edicts',
    category: 'Edicts',
    blurb: 'Divine edicts: a god’s likes turned into timed errands.',
    entries: edicts,
    title: (e: (typeof edicts)[number]) => `${e.text}`,
    summary: (e: (typeof edicts)[number]) => `Edict of ${humanize(e.god)}`,
    render: (e: (typeof edicts)[number], ctx) => {
      const sibs = edicts.filter((x) => x.god === e.god && x.id !== e.id);
      return [
        infobox(e.text, [
          { label: 'God', html: godName(ctx, e.god) },
          { label: 'Deed', html: esc(e.deed.text) },
          { label: 'Times', html: String(e.count) },
          { label: 'Within', html: `${e.battles} battles` },
          { label: 'Favor', html: `+${e.deed.amount} per deed` },
        ]),
        `<p>${godName(ctx, e.god)} sets this edict: do the deed ${e.count} time${e.count === 1 ? '' : 's'} within ${e.battles} battles to please them.</p>`,
        sibs.length ? `${h2(`Other edicts of ${content.gods.find(e.god)?.name ?? humanize(e.god)}`)}${ul(sibs.map((x) => ctx.link('edict', x.id)))}` : '',
      ].join('');
    },
    list: (list: readonly (typeof edicts)[number][], ctx) =>
      [...new Set(list.map((e) => e.god))]
        .map((g) => {
          const ge = list.filter((e) => e.god === g);
          return fold(content.gods.find(g)?.name ?? humanize(g), `${ge.length}`, table(ge, [
            { label: 'Edict', cell: (e) => ctx.link('edict', e.id), sort: (e) => e.text },
            { label: 'Times', cell: (e) => String(e.count), sort: (e) => e.count, className: 'num' },
            { label: 'Battles', cell: (e) => String(e.battles), className: 'num' },
          ]));
        })
        .join(''),
  },
  {
    ns: 'challenge',
    label: 'Challenges',
    category: 'Challenges',
    blurb: 'Optional challenge modes, chosen at character creation.',
    entries: challenges,
    summary: (c: (typeof challenges)[number]) => c.description,
    render: (c: (typeof challenges)[number], ctx) => {
      const related = achievements.filter((a) => JSON.stringify(a.check).includes(`"challenge":"${c.id}"`));
      return [
        infobox(c.name, [
          { label: 'Rules', html: c.rules?.length ? ul(c.rules.map((r) => esc(humanize(r)))) : '' },
          { label: 'Your bonuses', html: mods(c.heroModifiers) },
          { label: 'Enemy changes', html: mods(c.enemyModifiers) },
        ]),
        prose(c.description),
        c.rules?.length ? `${h2('Rules')}${ul(c.rules.map((r) => esc(RULE_TEXT[r] ?? humanize(r))))}` : '',
        c.heroModifiers?.length ? `${h2('Your modifiers')}<p>${mods(c.heroModifiers)}</p>` : '',
        c.enemyModifiers?.length ? `${h2('Enemy modifiers')}<p>${mods(c.enemyModifiers)}</p>` : '',
        related.length ? `${h2('Achievements')}${ul(related.map((a) => `${ctx.link('achievement', a.id)} <span class="muted">${a.points} pts</span>`))}` : '',
        navbox('Challenges', [{ label: 'All', html: challenges.map((x) => ctx.link('challenge', x.id)) }]),
      ].join('');
    },
    list: (list: readonly (typeof challenges)[number][], ctx) =>
      table(list, [
        { label: 'Challenge', cell: (c) => ctx.link('challenge', c.id), sort: (c) => c.name },
        { label: 'Rules', cell: (c) => esc((c.rules ?? []).map(humanize).join(', ') || '—') },
        { label: 'Summary', cell: (c) => esc(c.description) },
      ]),
  },
  {
    ns: 'stat',
    label: 'Stats',
    category: 'Stats',
    blurb: 'Glossary of every stat, with formulas.',
    entries: stats,
    summary: (s: (typeof stats)[number]) => s.description,
    render: (s: (typeof stats)[number]) => {
      const f = formulaText(s.id);
      const cap = (STAT_CAPS as Record<string, { min?: number; max?: number }>)[s.id];
      const feeds = Object.entries(DERIVED_FORMULAS as Record<string, { coefficients?: Record<string, number> }>).filter(([, d]) => d.coefficients && s.id in d.coefficients).map(([k]) => k);
      return [
        infobox(s.name, [
          { label: 'Short', html: esc(s.short) },
          { label: 'Id', html: `<code>${esc(s.id)}</code>` },
          { label: 'Format', html: s.format === 'percent' ? 'Percentage' : 'Whole number' },
          { label: 'Formula', html: f ? esc(f) : '' },
          { label: 'Minimum', html: cap?.min !== undefined ? String(cap.min) : '' },
          { label: 'Maximum', html: cap?.max !== undefined ? String(cap.max) : '' },
        ]),
        prose(s.description),
        f ? `${h2('Formula')}<p>${esc(s.name)} = ${esc(f)}.</p>` : '',
        feeds.length ? `${h2('Feeds into')}<p>${feeds.map((k) => esc(content.stats.find(k)?.name ?? k)).join(', ')}</p>` : '',
      ].join('');
    },
    list: (list: readonly (typeof stats)[number][], ctx) =>
      table(list, [
        { label: 'Stat', cell: (s) => ctx.link('stat', s.id), sort: (s) => s.name },
        { label: 'Short', cell: (s) => esc(s.short) },
        { label: 'Format', cell: (s) => (s.format === 'percent' ? '%' : 'int') },
        { label: 'Formula', cell: (s) => esc(formulaText(s.id)) },
        { label: 'What it does', cell: (s) => esc(s.description) },
      ], { filter: true }),
  },
  {
    ns: 'resource',
    label: 'Class resources',
    category: 'Class resources',
    blurb: 'The secondary bars classes build in combat, beside MP.',
    entries: resources,
    summary: (r: (typeof resources)[number]) => r.description,
    render: (r: (typeof resources)[number], ctx) => {
      const g = r.gains;
      const gains = g
        ? [
            g.onHitDealt ? `+${g.onHitDealt} per damaging hit dealt` : '',
            g.onDamageTakenPct ? `+${g.onDamageTakenPct} per 1% of max HP lost${g.onDamageTakenMax ? ` (up to ${g.onDamageTakenMax} per hit)` : ''}` : '',
            g.onBasicAttack ? `+${g.onBasicAttack} per basic attack` : '',
            g.perTurnWhileSinging ? `+${g.perTurnWhileSinging} per turn while a song plays` : '',
            g.onEnemyDeath ? `+${g.onEnemyDeath} whenever an enemy dies` : '',
            g.loseAllOnHitPct ? `All lost when one hit takes ${g.loseAllOnHitPct}% of max HP` : '',
          ].filter(Boolean)
        : [];
      const users = content.classes.all().filter((c) => c.resource === r.id);
      return [
        infobox(r.name, [
          { label: 'Maximum', html: String(r.max) },
          { label: 'Starts at', html: String(r.start) },
          { label: 'Fades', html: r.decayPerTurn ? `${r.decayPerTurn} per turn` : 'Does not fade' },
          { label: 'Used by', html: users.length ? joinHtml(users.map((c) => ctx.link('class', c.id))) : '' },
        ], { color: r.color }),
        prose(r.description),
        gains.length ? `${h2('How it fills')}${ul(gains.map(esc))}` : '',
        r.overflow ? `${h2('Overflow')}<p>${esc(r.overflow.text)}</p>` : '',
      ].join('');
    },
    list: (list: readonly (typeof resources)[number][], ctx) =>
      table(list, [
        { label: 'Resource', cell: (r) => ctx.link('resource', r.id), sort: (r) => r.name },
        { label: 'Max', cell: (r) => String(r.max), sort: (r) => r.max, className: 'num' },
        { label: 'Start', cell: (r) => String(r.start), className: 'num' },
        { label: 'Fades', cell: (r) => (r.decayPerTurn ? String(r.decayPerTurn) : '—'), className: 'num' },
        { label: 'Class', cell: (r) => joinHtml(content.classes.all().filter((c) => c.resource === r.id).map((c) => ctx.link('class', c.id))) },
        { label: 'About', cell: (r) => esc(r.description) },
      ], { filter: true }),
  },
  {
    ns: 'mechanic',
    label: 'Mechanics',
    category: 'Mechanics',
    blurb: 'Named combat rules that gear and blessings switch on.',
    entries: mechanics,
    title: (m: (typeof mechanics)[number]) => humanize(m.id.replace(/^(rule|immune):/, '$1 ')),
    summary: (m: (typeof mechanics)[number]) => m.text,
    render: (m: (typeof mechanics)[number], ctx) => {
      const users = flagUsers(m.id);
      return [
        infobox(humanize(m.id), [{ label: 'Flag', html: `<code>${esc(m.id)}</code>` }]),
        prose(m.text),
        users.length ? `${h2('Granted by')}${ul(users.slice(0, 30).map((u) => ctx.linkIf(u.ns, u.id)))}${users.length > 30 ? `<p class="muted">…and ${users.length - 30} more.</p>` : ''}` : '',
      ].join('');
    },
    list: (list: readonly (typeof mechanics)[number][], ctx) =>
      table(list, [
        { label: 'Mechanic', cell: (m) => ctx.link('mechanic', m.id), sort: (m) => m.id },
        { label: 'Rule', cell: (m) => esc(m.text) },
      ], { filter: true }),
  },
];

// ---------------------------------------------------------------- sections

/** Each section shows one sidebar link (its landing page) instead of one per table. */
function oneLink(s: WikiSection): WikiSection {
  return { ...s, nav: [{ label: s.title, ...s.landing }] };
}

/** Crafting, professions, housing, dyes and frames. */
export const systemsSection = oneLink(
  simpleSection({
    id: 'systems',
    title: 'Crafting & Home',
    group: 'Systems',
    blurb: 'Professions, recipes, your house, investments, dyes and frames.',
    intro: '<p>Craft gear and potions, furnish a house, invest in town businesses and dress your hero. Pick a page below.</p>',
    tables: [...craftTables, ...homeTables],
  }),
);

/** Achievements, pets, mounts, fish, cards and endings. */
export const collectionsSection = oneLink(
  simpleSection({
    id: 'collections',
    title: 'Collections',
    group: 'Systems',
    blurb: 'Achievements, pets, mounts, fish, cards and endings.',
    intro: '<p>Things to find, catch and earn across the world. Endings contain story spoilers.</p>',
    tables: collectionTables,
  }),
);

/** Blessings, edicts, challenges and the stat / resource / mechanic glossaries. */
export const rulesSection = oneLink(
  simpleSection({
    id: 'rules',
    title: 'Blessings & Rules',
    group: 'Systems',
    blurb: 'Blessings, edicts, challenge modes, stats, resources and mechanics.',
    intro: '<p>The gods’ gifts, optional challenge modes and the rules glossary.</p>',
    tables: rulesTables,
  }),
);

export const systemsSections: WikiSection[] = [systemsSection, collectionsSection, rulesSection];
