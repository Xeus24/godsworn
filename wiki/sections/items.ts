/**
 * Items: item bases, uniques, sets, runewords, affixes, corruptions,
 * rarities and weapon types. Field names come from src/engine/items/types.ts
 * and src/data/equipmentTypes.ts.
 */
import { content } from '../../src/data';
import { WEAPON_ADDITIONS } from '../../src/data/equipmentTypes';
import type { ItemSetDef, ItemBaseDef, UniqueItemDef, RunewordDef, AffixDef, CorruptionDef, WeaponBaseDef, ArmorBaseDef } from '../../src/engine/items/types';
import type { RarityDef } from '../../src/data/items/rarities';
import { simpleSection, type TableSpec } from '../core/generic';
import { callout, esc, h2, infobox, joinHtml, mod, mods, navbox, prose, statLine, table, tag, ul } from '../core/html';
import type { RenderCtx } from '../core/types';

const rarities = content.rarities.all();
const uniques = content.uniques.all() as UniqueItemDef[];
const bases = content.items.all() as ItemBaseDef[];
const rarityOf = (id: string): RarityDef | undefined => rarities.find((r) => r.id === id);
const rarityTag = (id: string): string => tag(rarityOf(id)?.name ?? id, rarityOf(id)?.color);
const range = (r: readonly [number, number] | undefined): string => (r ? `${r[0]}–${r[1]}` : '');
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const num = 'num';

function fold(summary: string, count: number | string, inner: string, open = false): string {
  return `<details class="fold"${open ? ' open' : ''}><summary><b>${esc(summary)}</b> <span class="muted">${esc(count)}</span></summary>${inner}</details>`;
}

const typeName = (id: string): string => content.weaponTypes.find(id)?.name ?? id;
const godName = (id: string): string => content.gods.find(id)?.name ?? id;

function baseLink(ctx: RenderCtx, id: string): string {
  return ctx.linkIf('item', id, content.items.find(id)?.name ?? id);
}

function uniqueLink(ctx: RenderCtx, u: UniqueItemDef): string {
  return `${ctx.link('unique', u.id)}`;
}

function itemsNavbox(ctx: RenderCtx): string {
  return navbox('Items', [
    {
      label: 'Browse',
      html: [
        ctx.link('item', 'index'),
        ctx.link('unique', 'index'),
        ctx.link('item-set', 'index'),
        ctx.link('runeword', 'index'),
        ctx.link('affix', 'index'),
        ctx.link('corruption', 'index'),
        ctx.link('rarity', 'index'),
        ctx.link('weapon-type', 'index'),
      ],
    },
  ]);
}

// ---------------------------------------------------------------- item bases

function categoryLabel(b: ItemBaseDef): string {
  switch (b.category) {
    case 'weapon': return b.offhandOnly ? 'Off-hand' : 'Weapon';
    case 'armor': return 'Armor';
    case 'accessory': return 'Accessory';
    case 'relic': return 'Relic';
    case 'gem': return 'Gem';
    case 'rune': return 'Rune';
    case 'consumable': return 'Consumable';
    case 'material': return 'Material';
    case 'curiosity': return 'Curiosity';
    case 'book': return 'Book';
    case 'recipe': return 'Recipe scroll';
    case 'quest': return 'Quest item';
  }
}

function subtypeOf(b: ItemBaseDef): string {
  switch (b.category) {
    case 'weapon': return typeName(b.weaponType);
    case 'armor': return `${cap(b.slot)} (${content.armorWeights.find(b.weight)?.name ?? b.weight})`;
    case 'accessory': return cap(b.kind.replace('holySymbol', 'holy symbol'));
    case 'consumable': return cap(b.kind);
    case 'material': return cap(b.kind);
    case 'gem': return cap(b.gemType);
    default: return '';
  }
}

function tierOf(b: ItemBaseDef): number | undefined {
  return 'tier' in b ? (b as { tier: number }).tier : undefined;
}

/** Siblings in the same line (same weapon type, same armor slot and weight, same accessory kind) across tiers. */
function lineOf(b: ItemBaseDef): ItemBaseDef[] {
  if (b.category === 'weapon') return bases.filter((x): x is WeaponBaseDef => x.category === 'weapon' && x.weaponType === b.weaponType);
  if (b.category === 'armor') return bases.filter((x): x is ArmorBaseDef => x.category === 'armor' && x.slot === b.slot && x.weight === b.weight);
  if (b.category === 'accessory') return bases.filter((x) => x.category === 'accessory' && x.kind === b.kind && x.id.replace(/-t?\d+$/, '') === b.id.replace(/-t?\d+$/, ''));
  if (b.category === 'material') return bases.filter((x) => x.category === 'material' && x.kind === b.kind);
  return [];
}

function statsCell(b: ItemBaseDef): string {
  const parts: string[] = [];
  if (b.category === 'weapon') {
    if (b.damage) parts.push(`Dmg ${range(b.damage)}`);
    if (b.magic) parts.push(`Mag ${range(b.magic)}`);
    if (b.armor) parts.push(`Arm ${range(b.armor)}`);
    if (b.resist) parts.push(`Res ${range(b.resist)}`);
  } else if (b.category === 'armor') {
    parts.push(`Arm ${range(b.armor)}`, `Res ${range(b.resist)}`);
  }
  return esc(parts.join(' · '));
}

function actionText(b: ItemBaseDef): string {
  if (b.category !== 'consumable') return '';
  const a = b.action;
  switch (a.kind) {
    case 'effects': return 'Applies its effects';
    case 'timedBuff': return `${a.name} for ${a.battles} battles: ${a.modifiers.map(mod).join(', ')}`;
    case 'identify': return 'Identifies an item';
    case 'skillPoint': return 'Grants a skill point';
    case 'expandInventory': return `+${a.slots} inventory slots`;
    case 'escape': return 'Escapes a battle';
    case 'revive': return `Revives at ${a.hpPct}% HP`;
    case 'meter': return `Eases ${a.meter} by ${a.amount}`;
    case 'key': return a.text;
  }
}

function itemInfobox(b: ItemBaseDef, ctx: RenderCtx): string {
  const rows: { label: string; html: string | undefined }[] = [
    { label: 'Category', html: esc(categoryLabel(b)) },
  ];
  const tier = tierOf(b);
  if (b.category === 'weapon') {
    rows.push(
      { label: 'Type', html: ctx.linkIf('weapon-type', b.weaponType, typeName(b.weaponType)) },
      { label: 'Hands', html: b.offhandOnly ? 'Off hand' : esc(b.hands) },
      { label: 'Damage', html: esc(range(b.damage)) },
      { label: 'Magic', html: esc(range(b.magic)) },
      { label: 'Armor', html: esc(range(b.armor)) },
      { label: 'Resist', html: esc(range(b.resist)) },
    );
  } else if (b.category === 'armor') {
    rows.push(
      { label: 'Slot', html: esc(cap(b.slot)) },
      { label: 'Weight', html: esc(content.armorWeights.find(b.weight)?.name ?? b.weight) },
      { label: 'Armor', html: esc(range(b.armor)) },
      { label: 'Resist', html: esc(range(b.resist)) },
    );
  } else if (b.category === 'accessory') {
    rows.push({ label: 'Kind', html: esc(subtypeOf(b)) });
  } else if (b.category === 'gem') {
    rows.push({ label: 'Gem', html: esc(cap(b.gemType)) }, { label: 'Grade', html: esc(b.grade) });
  } else if (b.category === 'rune') {
    rows.push({ label: 'Rank', html: esc(b.rank) });
  } else if (b.category === 'consumable') {
    rows.push({ label: 'Kind', html: esc(cap(b.kind)) }, { label: 'Usable', html: esc(b.usableIn === 'both' ? 'Field and combat' : b.usableIn === 'field' ? 'Field only' : 'Combat only') }, { label: 'Effect', html: esc(actionText(b)) });
  } else if (b.category === 'material') {
    rows.push({ label: 'Kind', html: esc(cap(b.kind)) });
  } else if (b.category === 'curiosity') {
    rows.push({ label: 'Loved by', html: b.lovedBy?.length ? joinHtml(b.lovedBy.map((g) => ctx.linkIf('god', g, godName(g)))) : '' });
  } else if (b.category === 'book') {
    rows.push({ label: 'Teaches', html: ctx.linkIf('general-skill', b.teaches, content.generalSkills?.find?.(b.teaches)?.name ?? b.teaches) }, { label: 'Rarity', html: rarityTag(b.rarity) }, { label: 'Grimoire', html: b.grimoire ? 'Yes' : '' });
  } else if (b.category === 'recipe') {
    rows.push({ label: 'Teaches', html: ctx.linkIf('recipe', b.teaches, content.recipes.find(b.teaches)?.name ?? b.teaches) }, { label: 'Rarity', html: rarityTag(b.rarity) });
  }
  if (tier) rows.push({ label: 'Tier', html: esc(tier) });
  rows.push({ label: 'Level', html: esc(b.level) }, { label: 'Value', html: `${esc(b.value)} gold` });
  if ('implicit' in b && b.implicit.length) rows.push({ label: 'Innate', html: mods(b.implicit) });
  if ('maxSockets' in b) rows.push({ label: 'Sockets', html: `up to ${esc(b.maxSockets)}` }, { label: 'Durability', html: esc(b.durability) });
  if (b.category === 'accessory' && b.onUse) rows.push({ label: 'On use', html: `${esc(b.onUse.name)} (${esc(b.onUse.cooldown)} turn cooldown)` });
  if (b.stack && b.stack > 1) rows.push({ label: 'Stack', html: esc(b.stack) });
  if (b.forbidden !== undefined) rows.push({ label: 'Sold by', html: 'Black Market (heresy tier ' + esc(b.forbidden) + ')' });
  return infobox(b.name, rows, { caption: categoryLabel(b) + (subtypeOf(b) ? ` · ${subtypeOf(b)}` : '') });
}

function renderItem(b: ItemBaseDef, ctx: RenderCtx): string {
  const out: string[] = [itemInfobox(b, ctx), prose(b.description)];
  if (b.category === 'accessory' && b.onUse) out.push(h2(`On use: ${b.onUse.name}`), prose(b.onUse.description));
  if (b.category === 'gem') {
    out.push(h2('Socket bonuses'), table([['Weapon', b.weapon], ['Armor', b.armor], ['Jewelry', b.jewelry]] as const, [
      { label: 'Gear', cell: (r) => `<b>${r[0]}</b>` },
      { label: 'Bonus', cell: (r) => mods(r[1]) || '—' },
    ]));
    const sibs = bases.filter((x) => x.category === 'gem' && x.gemType === b.gemType);
    out.push(h2(`${cap(b.gemType)} gems`), ul(sibs.map((s) => `${s.id === b.id ? `<b>${esc(s.name)}</b>` : ctx.link('item', s.id)} <span class="muted">grade ${(s as { grade: number }).grade}</span>`)));
  }
  if (b.category === 'rune') {
    out.push(h2('Socket bonuses'), table([['Weapon', b.weapon], ['Armor', b.armor]] as const, [
      { label: 'Gear', cell: (r) => `<b>${r[0]}</b>` },
      { label: 'Bonus', cell: (r) => mods(r[1]) || '—' },
    ]));
    const rws = content.runewords.all().filter((r) => r.runes.includes(b.id));
    if (rws.length) out.push(h2('Used in runewords'), ul(rws.map((r) => `${ctx.link('runeword', r.id)} <span class="muted">${r.runes.map((x) => esc(content.items.find(x)?.name ?? x)).join(' · ')}</span>`)));
  }
  if (b.category === 'consumable' && b.action.kind === 'effects') {
    out.push(h2('Effects'), `<p class="muted">${esc(b.description ?? '')}</p>`);
  }
  const line = lineOf(b);
  if (line.length > 1 && (b.category === 'weapon' || b.category === 'armor' || b.category === 'accessory')) {
    const heading = b.category === 'weapon' ? `${typeName(b.weaponType)} tiers` : b.category === 'armor' ? `${cap(b.slot)} (${content.armorWeights.find(b.weight)?.name}) tiers` : `${subtypeOf(b)} line`;
    out.push(h2(heading), table(line, [
      { label: 'Tier', cell: (x) => esc(tierOf(x)), sort: (x) => tierOf(x) ?? 0, className: num },
      { label: 'Item', cell: (x) => (x.id === b.id ? `<b>${esc(x.name)}</b>` : ctx.link('item', x.id)), sort: (x) => x.name },
      { label: 'Level', cell: (x) => esc(x.level), className: num },
      { label: 'Stats', cell: statsCell },
      { label: 'Innate', cell: (x) => ('implicit' in x ? mods(x.implicit) : '') },
      { label: 'Sockets', cell: (x) => esc('maxSockets' in x ? x.maxSockets : ''), className: num },
      { label: 'Value', cell: (x) => esc(x.value), className: num },
    ]));
  } else if (line.length > 1 && b.category === 'material') {
    out.push(h2(`${cap(b.kind)} materials`), ul(line.map((x) => `${x.id === b.id ? `<b>${esc(x.name)}</b>` : ctx.link('item', x.id)} <span class="muted">tier ${(x as { tier: number }).tier}</span>`)));
  }
  const uses = uniques.filter((u) => u.baseId === b.id);
  if (uses.length) out.push(h2(`Unique items on this base (${uses.length})`), ul(uses.map((u) => `${uniqueLink(ctx, u)} ${rarityTag(u.rarity)}`)));
  out.push(itemsNavbox(ctx));
  return out.join('');
}

function listItems(list: readonly ItemBaseDef[], ctx: RenderCtx): string {
  const byCat = new Map<string, ItemBaseDef[]>();
  for (const b of list) {
    const k = categoryLabel(b);
    if (!byCat.has(k)) byCat.set(k, []);
    byCat.get(k)!.push(b);
  }
  const ORDER = ['Weapon', 'Off-hand', 'Armor', 'Accessory', 'Relic', 'Gem', 'Rune', 'Consumable', 'Material', 'Curiosity', 'Book', 'Recipe scroll', 'Quest item'];
  const cols = (withStats: boolean) => [
    { label: 'Item', cell: (b: ItemBaseDef) => ctx.link('item', b.id), sort: (b: ItemBaseDef) => b.name },
    { label: 'Tier', cell: (b: ItemBaseDef) => esc(tierOf(b) ?? ''), sort: (b: ItemBaseDef) => tierOf(b) ?? 0, className: num },
    { label: 'Level', cell: (b: ItemBaseDef) => esc(b.level), className: num },
    ...(withStats ? [{ label: 'Stats', cell: statsCell }] : [{ label: 'Detail', cell: (b: ItemBaseDef) => esc(b.description ?? '') }]),
    { label: 'Value', cell: (b: ItemBaseDef) => esc(b.value), className: num },
  ];
  const html: string[] = [];
  for (const cat of ORDER) {
    const group = byCat.get(cat);
    if (!group) continue;
    const gear = cat === 'Weapon' || cat === 'Off-hand' || cat === 'Armor';
    if (gear || cat === 'Accessory' || cat === 'Consumable' || cat === 'Material' || cat === 'Gem') {
      const sub = new Map<string, ItemBaseDef[]>();
      for (const b of group) {
        const k = subtypeOf(b) || cat;
        if (!sub.has(k)) sub.set(k, []);
        sub.get(k)!.push(b);
      }
      const inner = [...sub].map(([k, rows]) => fold(k, rows.length, table(rows, cols(gear)))).join('');
      html.push(fold(cat, `${group.length} · ${sub.size} types`, inner));
    } else {
      const inner = group.length > 12 ? table(group, cols(false), { filter: true }) : table(group, cols(false));
      html.push(fold(cat, group.length, inner));
    }
  }
  return `<p>${list.length} item bases. Weapons and armor come in seven tiers; use the search box above for a quick lookup.</p>${html.join('')}`;
}

// ------------------------------------------------------------------- uniques

function requirementsHtml(u: UniqueItemDef, ctx: RenderCtx): string {
  const r = u.requirements;
  if (!r) return '';
  const parts: string[] = [];
  if (r.level) parts.push(`Level ${esc(r.level)}`);
  if (r.stats) parts.push(esc(statLine(r.stats)));
  if (r.classes?.length) parts.push(joinHtml(r.classes.map((c) => ctx.linkIf('class', c, content.classes.find(c)?.name ?? c))));
  if (r.favor) parts.push(`${esc(cap(r.favor.tier))} favor with ${ctx.linkIf('god', r.favor.god, godName(r.favor.god))}`);
  if (r.apostleOf) parts.push(`Apostle of ${ctx.linkIf('god', r.apostleOf, godName(r.apostleOf))}`);
  return parts.join('<br>');
}

function renderUnique(u: UniqueItemDef, ctx: RenderCtx): string {
  const base = content.items.find(u.baseId);
  const set = u.setId ? content.itemSets.find(u.setId) : undefined;
  const color = rarityOf(u.rarity)?.color;
  const box = infobox(
    u.name,
    [
      { label: 'Rarity', html: rarityTag(u.rarity) },
      { label: 'Base', html: base ? `${baseLink(ctx, base.id)}${base.category === 'weapon' ? ` <span class="muted">(${esc(typeName(base.weaponType))})</span>` : ''}` : '' },
      { label: 'Item level', html: esc(u.level) },
      { label: 'Requires', html: requirementsHtml(u, ctx) },
      { label: 'Set', html: set ? ctx.link('item-set', set.id) : '' },
      { label: 'Modifiers', html: mods(u.modifiers) },
      { label: 'Random affixes', html: u.randomAffixes ? `+${esc(u.randomAffixes)}` : '' },
      { label: 'Drops', html: u.noDrop ? 'Not a random drop' : '' },
    ],
    { color },
  );
  const out: string[] = [box];
  if (u.effectText.length) out.push(h2('Effects'), ul(u.effectText.map(esc)));
  if (u.activeAbility) out.push(h2(`Active: ${u.activeAbility.name}`), `<p>${esc(u.activeAbility.description)} <span class="muted">Cooldown ${esc(u.activeAbility.cooldown)} turns.</span></p>`);
  if (u.awakening) {
    const a = u.awakening;
    out.push(h2('Awakening'), `<p>${esc(a.description)}</p>`, callout('note', `<p>After ${esc(a.count)} ${esc(a.event)} events${a.enemyType ? ` against ${esc(a.enemyType)}` : ''}: ${mods(a.modifiers)}</p><p>${esc(a.effectText)}</p>`));
  }
  if (u.living) {
    out.push(h2('Growth'), table(u.living.stages, [
      { label: 'XP', cell: (s) => esc(s.xp), className: num, sort: (s) => s.xp },
      { label: 'Bonus', cell: (s) => mods(s.modifiers) },
      { label: 'Effect', cell: (s) => esc(s.text) },
    ]));
  }
  if (set) {
    out.push(h2(`Part of ${set.name}`), ul(set.pieces.map((p) => (p === u.id ? `<b>${esc(u.name)}</b>` : ctx.linkIf('unique', p)))), `<p>See ${ctx.link('item-set', set.id)} for the set bonuses.</p>`);
  }
  if (u.lore) out.push(h2('Lore'), `<blockquote>${esc(u.lore)}</blockquote>`);
  out.push(itemsNavbox(ctx));
  return out.join('');
}

function listUniques(list: readonly UniqueItemDef[], ctx: RenderCtx): string {
  const groups = new Map<string, UniqueItemDef[]>();
  for (const u of list) {
    if (!groups.has(u.rarity)) groups.set(u.rarity, []);
    groups.get(u.rarity)!.push(u);
  }
  const ordered = [...groups].sort((a, b) => (rarityOf(b[0])?.order ?? 0) - (rarityOf(a[0])?.order ?? 0));
  return (
    `<p>${list.length} hand-designed items. Open a rarity to see its items.</p>` +
    ordered
      .map(([rid, rows]) =>
        fold(rarityOf(rid)?.name ?? rid, rows.length, table(rows, [
          { label: 'Item', cell: (u) => ctx.link('unique', u.id), sort: (u) => u.name },
          { label: 'Base', cell: (u) => baseLink(ctx, u.baseId), sort: (u) => content.items.find(u.baseId)?.name ?? u.baseId },
          { label: 'Level', cell: (u) => esc(u.level), className: num, sort: (u) => u.level },
          { label: 'Set', cell: (u) => (u.setId ? ctx.linkIf('item-set', u.setId) : '') },
          { label: 'Effect', cell: (u) => esc(u.effectText[0] ?? '') },
        ], { filter: rows.length > 12 })),
      )
      .join('')
  );
}

// ---------------------------------------------------------------------- sets

function renderSet(s: ItemSetDef, ctx: RenderCtx): string {
  const cls = s.classId ? content.classes.find(s.classId) : undefined;
  const pieces = s.pieces.map((p) => content.uniques.find(p)).filter((x): x is UniqueItemDef => !!x);
  const box = infobox(s.name, [
    { label: 'Class', html: cls ? ctx.link('class', cls.id) : '' },
    { label: 'Pieces', html: esc(s.pieces.length) },
    { label: 'Bonuses', html: esc(s.bonuses.map((b) => `${b.pieces}pc`).join(' · ')) },
  ], { color: rarityOf('set')?.color });
  return [
    box,
    `<p>${esc(s.name)} is a ${s.pieces.length}-piece set${cls ? ` for the ${esc(cls.name)}` : ''}. Wearing more pieces unlocks stronger bonuses.</p>`,
    h2('Pieces'),
    table(pieces, [
      { label: 'Piece', cell: (u) => ctx.link('unique', u.id), sort: (u) => u.name },
      { label: 'Base', cell: (u) => baseLink(ctx, u.baseId) },
      { label: 'Level', cell: (u) => esc(u.level), className: num },
      { label: 'Modifiers', cell: (u) => mods(u.modifiers) },
    ]),
    h2('Set bonuses'),
    table([...s.bonuses], [
      { label: 'Pieces', cell: (b) => esc(b.pieces), className: num, sort: (b) => b.pieces },
      { label: 'Modifiers', cell: (b) => mods(b.modifiers) },
      { label: 'Effect', cell: (b) => esc(b.text) },
    ]),
    itemsNavbox(ctx),
  ].join('');
}

function listSets(list: readonly ItemSetDef[], ctx: RenderCtx): string {
  return table(list, [
    { label: 'Set', cell: (s) => ctx.link('item-set', s.id), sort: (s) => s.name },
    { label: 'Class', cell: (s) => (s.classId ? ctx.linkIf('class', s.classId) : 'Any'), sort: (s) => s.classId ?? '' },
    { label: 'Pieces', cell: (s) => esc(s.pieces.length), className: num, sort: (s) => s.pieces.length },
    { label: 'Top bonus', cell: (s) => esc(s.bonuses[s.bonuses.length - 1]?.text ?? '') },
  ], { filter: list.length > 12 });
}

// ------------------------------------------------------------------ runewords

function runeLinks(r: RunewordDef, ctx: RenderCtx): string {
  return r.runes.map((x) => baseLink(ctx, x)).join(' + ');
}

function renderRuneword(r: RunewordDef, ctx: RenderCtx): string {
  const box = infobox(r.name, [
    { label: 'Runes', html: runeLinks(r, ctx) },
    { label: 'Sockets', html: esc(r.runes.length) },
    { label: 'Works on', html: esc(r.targets.map(cap).join(', ')) },
    { label: 'Modifiers', html: mods(r.modifiers) },
  ]);
  return [
    box,
    prose(r.text),
    h2('How to make it'),
    `<p>Socket the runes in this exact order into ${r.targets.map((t) => esc(t)).join(' or ')} gear that has exactly ${esc(r.runes.length)} sockets.</p>`,
    table(r.runes.map((x, i) => ({ x, i })), [
      { label: '#', cell: (o) => esc(o.i + 1), className: num },
      { label: 'Rune', cell: (o) => baseLink(ctx, o.x) },
      { label: 'Rank', cell: (o) => esc((content.items.find(o.x) as { rank?: number } | undefined)?.rank ?? '') , className: num },
    ]),
    itemsNavbox(ctx),
  ].join('');
}

function listRunewords(list: readonly RunewordDef[], ctx: RenderCtx): string {
  return table(list, [
    { label: 'Runeword', cell: (r) => ctx.link('runeword', r.id), sort: (r) => r.name },
    { label: 'Runes', cell: (r) => runeLinks(r, ctx) },
    { label: 'Sockets', cell: (r) => esc(r.runes.length), className: num, sort: (r) => r.runes.length },
    { label: 'Works on', cell: (r) => esc(r.targets.join(', ')) },
    { label: 'Effect', cell: (r) => esc(r.text) },
  ], { filter: list.length > 12 });
}

// -------------------------------------------------------------------- affixes

function affixStatNames(a: AffixDef): string {
  return a.stats.map((s) => `${content.stats.find(s.stat)?.name ?? s.stat}${s.type === 'percent' ? ' (%)' : ''}`).join(' + ');
}

function renderAffix(a: AffixDef, ctx: RenderCtx): string {
  const box = infobox(a.name, [
    { label: 'Kind', html: esc(cap(a.kind)) },
    { label: 'Stats', html: esc(affixStatNames(a)) },
    { label: 'Works on', html: esc(a.targets.map(cap).join(', ')) },
    { label: 'Group', html: esc(a.group) },
    { label: 'Weight', html: esc(a.weight) },
    { label: 'Tiers', html: esc(a.tiers.length) },
  ]);
  const same = content.affixes.filter((x) => x.group === a.group && x.id !== a.id);
  return [
    box,
    `<p>${esc(a.name)} is a ${esc(a.kind)} that adds ${esc(affixStatNames(a))} to ${esc(a.targets.join(', '))} gear. Only one affix per group (<code>${esc(a.group)}</code>) can roll on an item.</p>`,
    h2('Tiers'),
    table(a.tiers.map((t, i) => ({ t, i })), [
      { label: 'Tier', cell: (o) => esc(o.i + 1), className: num, sort: (o) => o.i },
      { label: 'Item level', cell: (o) => esc(o.t.minLevel), className: num, sort: (o) => o.t.minLevel },
      ...a.stats.map((s, k) => ({
        label: content.stats.find(s.stat)?.name ?? s.stat,
        cell: (o: { t: AffixDef['tiers'][number]; i: number }) => esc(range(o.t.ranges[k])),
        className: num,
      })),
    ]),
    same.length ? `${h2('Same group')}${ul(same.map((x) => ctx.link('affix', x.id)))}` : '',
    itemsNavbox(ctx),
  ].join('');
}

function listAffixes(list: readonly AffixDef[], ctx: RenderCtx): string {
  const mk = (rows: AffixDef[]): string =>
    table(rows, [
      { label: 'Affix', cell: (a) => ctx.link('affix', a.id), sort: (a) => a.name },
      { label: 'Stats', cell: (a) => esc(affixStatNames(a)) },
      { label: 'Works on', cell: (a) => esc(a.targets.join(', ')) },
      { label: 'Tiers', cell: (a) => esc(a.tiers.length), className: num },
      { label: 'Top roll', cell: (a) => esc(a.tiers[a.tiers.length - 1]!.ranges.map(range).join(' / ')) },
    ], { filter: rows.length > 12 });
  const pre = list.filter((a) => a.kind === 'prefix');
  const suf = list.filter((a) => a.kind === 'suffix');
  return `<p>${list.length} affixes, each with several tiers unlocked by item level.</p>${fold('Prefixes', pre.length, mk(pre))}${fold('Suffixes', suf.length, mk(suf))}`;
}

// ---------------------------------------------------------------- corruptions

function renderCorruption(c: CorruptionDef, ctx: RenderCtx): string {
  const others = content.corruptions.filter((x) => x.kind === c.kind && x.id !== c.id);
  return [
    infobox(c.name, [
      { label: 'Kind', html: tag(c.kind === 'boon' ? 'Boon' : 'Drawback', c.kind === 'boon' ? '#4fd36b' : '#ff3b3b') },
      { label: 'Works on', html: esc(c.targets.map(cap).join(', ')) },
      { label: 'Modifiers', html: mods(c.modifiers) },
    ]),
    prose(c.text),
    callout('warn', '<p>Corruption is permanent: a corrupted item cannot be modified any further.</p>'),
    others.length ? `${h2(c.kind === 'boon' ? 'Other boons' : 'Other drawbacks')}${fold(`${others.length} more`, '', ul(others.map((x) => ctx.link('corruption', x.id))))}` : '',
    itemsNavbox(ctx),
  ].join('');
}

function listCorruptions(list: readonly CorruptionDef[], ctx: RenderCtx): string {
  const mk = (rows: CorruptionDef[]): string =>
    table(rows, [
      { label: 'Corruption', cell: (c) => ctx.link('corruption', c.id), sort: (c) => c.name },
      { label: 'Works on', cell: (c) => esc(c.targets.join(', ')) },
      { label: 'Effect', cell: (c) => esc(c.text) },
    ]);
  return (['boon', 'drawback'] as const)
    .map((k) => {
      const rows = list.filter((c) => c.kind === k);
      return fold(k === 'boon' ? 'Boons' : 'Drawbacks', rows.length, mk(rows), true);
    })
    .join('');
}

// ------------------------------------------------------------------- rarities

const SOURCE_TEXT: Record<RarityDef['source'], string> = {
  random: 'Rolled gear with random affixes',
  unique: 'A hand-designed unique item',
  ascended: 'Upgrades a Legendary or Mythic item (New Game+)',
};

function renderRarity(r: RarityDef, ctx: RenderCtx): string {
  const totalWeight = rarities.reduce((s, x) => s + x.weight, 0);
  const pct = ((r.weight / totalWeight) * 100).toFixed(2);
  const inRarity = uniques.filter((u) => u.rarity === r.id);
  return [
    infobox(r.name, [
      { label: 'Color', html: `<span style="color:${esc(r.color)}">■</span> ${esc(r.color)}` },
      { label: 'Source', html: esc(SOURCE_TEXT[r.source]) },
      { label: 'Affixes', html: r.affixes[1] ? `${esc(r.affixes[0])}–${esc(r.affixes[1])}` : 'None' },
      { label: 'Socket chance', html: `${Math.round(r.socketChance * 100)}%` },
      { label: 'Base drop weight', html: `${esc(r.weight)} (${pct}% of gear)` },
      { label: 'Stat multiplier', html: `×${esc(r.statMult)}` },
      { label: 'Value multiplier', html: `×${esc(r.valueMult)}` },
      { label: 'Magic Find', html: `exponent ${esc(r.mfExponent)}` },
      { label: 'Drops unidentified', html: r.unidentified ? 'Yes' : 'No' },
      { label: 'Min New Game+', html: r.minNgPlus ? esc(r.minNgPlus) : '' },
      { label: 'Elites only', html: r.eliteOnly ? 'Yes' : '' },
    ], { color: r.color }),
    `<p>${rarityTag(r.id)} sits at position ${esc(r.order + 1)} of ${rarities.length} in the rarity ladder.</p>`,
    h2('Drop rules'),
    ul([
      esc(SOURCE_TEXT[r.source]),
      r.unidentified ? 'Drops unidentified: it needs an identify scroll or the Appraise skill to reveal.' : 'Drops already identified.',
      r.minNgPlus ? `Only drops from New Game+ ${r.minNgPlus} onward.` : '',
      r.eliteOnly ? 'Only drops from elites, champions and bosses.' : '',
      r.mfExponent < 0 ? 'Magic Find makes this rarer.' : r.mfExponent > 0 ? `Magic Find raises its weight by (1 + MF/100)^${r.mfExponent}.` : 'Magic Find does not change its weight.',
    ].filter(Boolean)),
    inRarity.length ? h2(`Items (${inRarity.length})`) + fold('Show items', inRarity.length, ul(inRarity.map((u) => uniqueLink(ctx, u)))) : '',
    navbox('Rarities', [{ label: 'Ladder', html: [...rarities].sort((a, b) => a.order - b.order).map((x) => (x.id === r.id ? `<b>${esc(x.name)}</b>` : ctx.link('rarity', x.id))) }]),
  ].join('');
}

function listRarities(list: readonly RarityDef[], ctx: RenderCtx): string {
  return table([...list].sort((a, b) => a.order - b.order), [
    { label: 'Rarity', cell: (r) => ctx.link('rarity', r.id), sort: (r) => r.order },
    { label: 'Color', cell: (r) => `<span style="color:${esc(r.color)}">■</span>` },
    { label: 'Affixes', cell: (r) => (r.affixes[1] ? `${r.affixes[0]}–${r.affixes[1]}` : '—'), sort: (r) => r.affixes[1] },
    { label: 'Sockets', cell: (r) => `${Math.round(r.socketChance * 100)}%`, sort: (r) => r.socketChance, className: num },
    { label: 'Weight', cell: (r) => esc(r.weight), className: num, sort: (r) => r.weight },
    { label: 'Stat ×', cell: (r) => esc(r.statMult), className: num, sort: (r) => r.statMult },
    { label: 'Value ×', cell: (r) => esc(r.valueMult), className: num, sort: (r) => r.valueMult },
    { label: 'Notes', cell: (r) => esc([r.minNgPlus ? `NG+${r.minNgPlus}+` : '', r.eliteOnly ? 'elites only' : '', r.unidentified ? 'unidentified' : ''].filter(Boolean).join(', ')) },
  ]);
}

// --------------------------------------------------------------- weapon types

function renderWeaponType(w: { id: string; name: string; hands: number; category: string }, ctx: RenderCtx): string {
  const line = bases.filter((b): b is WeaponBaseDef => b.category === 'weapon' && b.weaponType === w.id).sort((a, b) => a.tier - b.tier);
  const users = content.classes.all().filter((c) => c.weapons.includes(w.id) || (WEAPON_ADDITIONS[c.id] ?? []).includes(w.id));
  const uniq = uniques.filter((u) => line.some((b) => b.id === u.baseId));
  const has = (k: 'damage' | 'magic' | 'armor' | 'resist'): boolean => line.some((b) => b[k]);
  const statCols = (['damage', 'magic', 'armor', 'resist'] as const).filter(has).map((k) => ({
    label: cap(k),
    cell: (b: WeaponBaseDef) => esc(range(b[k])),
    className: num,
  }));
  return [
    infobox(w.name, [
      { label: 'Category', html: esc(cap(w.category)) },
      { label: 'Hands', html: w.category === 'offhand' ? 'Off hand' : esc(w.hands) },
      { label: 'Tiers', html: esc(line.length) },
      { label: 'Classes', html: users.length ? joinHtml(users.map((c) => ctx.link('class', c.id))) : '' },
    ]),
    `<p>${esc(w.name)} is a ${esc(w.category)} weapon type${w.category === 'offhand' ? '' : `, held in ${w.hands === 2 ? 'both hands' : 'one hand'}`}.</p>`,
    h2('Tiers'),
    table(line, [
      { label: 'Tier', cell: (b) => esc(b.tier), className: num, sort: (b) => b.tier },
      { label: 'Item', cell: (b) => ctx.link('item', b.id), sort: (b) => b.name },
      { label: 'Level', cell: (b) => esc(b.level), className: num },
      ...statCols,
      { label: 'Innate', cell: (b) => mods(b.implicit) },
      { label: 'Sockets', cell: (b) => esc(b.maxSockets), className: num },
      { label: 'Durability', cell: (b) => esc(b.durability), className: num },
      { label: 'Value', cell: (b) => esc(b.value), className: num },
    ]),
    uniq.length ? h2(`Unique ${w.name.toLowerCase()}s (${uniq.length})`) + fold('Show uniques', uniq.length, table(uniq, [
      { label: 'Item', cell: (u) => ctx.link('unique', u.id), sort: (u) => u.name },
      { label: 'Rarity', cell: (u) => rarityTag(u.rarity), sort: (u) => rarityOf(u.rarity)?.order ?? 0 },
      { label: 'Level', cell: (u) => esc(u.level), className: num },
    ])) : '',
    navbox('Weapon types', (['melee', 'ranged', 'magic', 'offhand'] as const).map((cat) => ({
      label: cap(cat),
      html: content.weaponTypes.filter((x) => x.category === cat).map((x) => (x.id === w.id ? `<b>${esc(x.name)}</b>` : ctx.link('weapon-type', x.id))),
    }))),
  ].join('');
}

function listWeaponTypes(list: readonly { id: string; name: string; hands: number; category: string }[], ctx: RenderCtx): string {
  return table(list, [
    { label: 'Type', cell: (w) => ctx.link('weapon-type', w.id), sort: (w) => w.name },
    { label: 'Category', cell: (w) => esc(cap(w.category)) },
    { label: 'Hands', cell: (w) => (w.category === 'offhand' ? 'Off hand' : esc(w.hands)), className: num },
    { label: 'Classes', cell: (w) => esc(content.classes.all().filter((c) => c.weapons.includes(w.id) || (WEAPON_ADDITIONS[c.id] ?? []).includes(w.id)).length), className: num },
  ], { filter: true });
}

// ------------------------------------------------------------------ section

const tables: TableSpec<any>[] = [
  {
    ns: 'item',
    label: 'Item bases',
    category: 'Item bases',
    blurb: 'Weapons, armor, accessories, gems, runes, consumables and materials.',
    entries: bases,
    summary: (b: ItemBaseDef) => `${categoryLabel(b)}${subtypeOf(b) ? ` (${subtypeOf(b)})` : ''}${tierOf(b) ? `, tier ${tierOf(b)}` : ''}`,
    categories: (b: ItemBaseDef) => [`${categoryLabel(b)}s`],
    render: renderItem,
    list: listItems,
  },
  {
    ns: 'unique',
    label: 'Unique items',
    category: 'Unique items',
    blurb: 'Legendary, set, mythic, divine, relic and primordial items.',
    entries: uniques,
    summary: (u: UniqueItemDef) => `${cap(u.rarity)} ${content.items.find(u.baseId)?.name ?? ''}. ${u.effectText[0] ?? ''}`.trim(),
    categories: (u: UniqueItemDef) => [`${cap(u.rarity)} items`],
    spoiler: (u: UniqueItemDef) => u.rarity === 'primordial',
    render: renderUnique,
    list: listUniques,
  },
  {
    ns: 'item-set',
    label: 'Item sets',
    category: 'Item sets',
    blurb: 'Matched pieces with bonuses for wearing more of them.',
    entries: content.itemSets.all(),
    summary: (s: ItemSetDef) => `${s.pieces.length}-piece set`,
    render: renderSet,
    list: listSets,
  },
  {
    ns: 'runeword',
    label: 'Runewords',
    category: 'Runewords',
    blurb: 'Rune sequences that turn a socketed item into something special.',
    entries: content.runewords.all(),
    summary: (r: RunewordDef) => r.text,
    render: renderRuneword,
    list: listRunewords,
  },
  {
    ns: 'affix',
    label: 'Affixes',
    category: 'Affixes',
    blurb: 'Random prefixes and suffixes, with their tiers.',
    entries: content.affixes.all(),
    summary: (a: AffixDef) => `${cap(a.kind)}: ${affixStatNames(a)}`,
    categories: (a: AffixDef) => [a.kind === 'prefix' ? 'Prefixes' : 'Suffixes'],
    render: renderAffix,
    list: listAffixes,
  },
  {
    ns: 'corruption',
    label: 'Corruptions',
    category: 'Corruptions',
    blurb: 'Permanent boons and drawbacks.',
    entries: content.corruptions.all(),
    summary: (c: CorruptionDef) => c.text,
    render: renderCorruption,
    list: listCorruptions,
  },
  {
    ns: 'rarity',
    label: 'Rarities',
    category: 'Rarities',
    blurb: 'The rarity ladder: affix counts, colors and drop rules.',
    entries: rarities,
    summary: (r: RarityDef) => `${r.affixes[1] ? `${r.affixes[0]}–${r.affixes[1]} affixes` : 'No random affixes'}, ×${r.statMult} stats`,
    render: renderRarity,
    list: listRarities,
  },
  {
    ns: 'weapon-type',
    label: 'Weapon types',
    category: 'Weapon types',
    blurb: 'Every weapon type with its seven tiers.',
    entries: content.weaponTypes.all(),
    summary: (w: { name: string; category: string }) => `${cap(w.category)} weapon type`,
    render: renderWeaponType,
    list: listWeaponTypes,
  },
];

export const itemsSection = simpleSection({
  id: 'items',
  title: 'Items',
  group: 'Items',
  blurb: 'Weapons, armor, uniques, sets, runewords, affixes and consumables.',
  intro: `<p>Gear drops in a ladder of rarities. Common to Epic items are rolled from item bases plus random affixes; Legendary and above are hand-designed uniques. Sockets take gems and runes, runewords reward exact rune orders, and corruption trades safety for power.</p>`,
  tables,
});

