/**
 * Characters: races, birth signs, backgrounds, classes and gods. This is the
 * reference section for how a rich section is written: a TableSpec per
 * content table with a custom `render` (infobox + prose + tables + navbox)
 * and a custom `list` for the landing page.
 */
import { content } from '../../src/data';
import type { ClassDef } from '../../src/data/classes';
import type { GodDef } from '../../src/data/gods';
import type { RaceDef } from '../../src/data/races';
import { simpleSection, type TableSpec } from '../core/generic';
import { ELEMENT_COLORS, callout, esc, h2, infobox, joinHtml, mods, navbox, prose, statLine, table, tag, ul } from '../core/html';
import type { RenderCtx } from '../core/types';

const PRIMARY = ['str', 'dex', 'int', 'vit', 'wis', 'luk', 'fai', 'cha'] as const;
const DIFFICULTY = ['', 'Easy', 'Moderate', 'Hard'];

const classes = content.classes.all();
const races = content.races.all();
const gods = content.gods.all();

function classUnlock(c: ClassDef): string {
  if (c.hidden) return 'Secret questline';
  if (c.ngPlus) return `New Game+ ${c.ngPlus}`;
  if (content.hybrids.find(c.id)) return 'Hybrid trial';
  return 'Start';
}

function raceUnlock(r: RaceDef): string {
  if (!r.unlock) return 'Start';
  return 'ngPlus' in r.unlock ? `New Game+ ${r.unlock.ngPlus}` : 'Finish the story once';
}

const godTag = (ctx: RenderCtx, id: string): string => ctx.link('god', id);
const skillLink = (ctx: RenderCtx, id: string): string => ctx.linkIf('skill', id, content.skills.find(id)?.name ?? id);

function classNavbox(ctx: RenderCtx): string {
  const groups: Record<string, string[]> = { 'Starting classes': [], 'New Game+': [], Secret: [] };
  for (const c of classes) {
    const g = c.hidden ? 'Secret' : c.ngPlus ? 'New Game+' : 'Starting classes';
    groups[g]!.push(ctx.link('class', c.id));
  }
  return navbox('Classes', Object.entries(groups).map(([label, html]) => ({ label, html })));
}

function renderClass(c: ClassDef, ctx: RenderCtx): string {
  const resource = c.resource ? content.resources.find(c.resource) : undefined;
  const tree = content.trees.all().find((t) => (t as { classId?: string }).classId === c.id);
  const specs = content.specializations.filter((s) => s.classId === c.id);
  const set = content.itemSets.all().find((s) => s.classId === c.id);
  const box = infobox(
    c.name,
    [
      { label: 'Role', html: esc(c.role) },
      { label: 'Difficulty', html: esc(DIFFICULTY[c.difficulty]) },
      { label: 'Unlock', html: esc(classUnlock(c)) },
      { label: 'Resource', html: resource ? esc(resource.name) : 'MP only' },
      { label: 'Row', html: esc(c.defaultRow === 'front' ? 'Front' : 'Back') },
      { label: 'Weapons', html: joinHtml(c.weapons.map((w) => ctx.linkIf('weapon-type', w, content.weaponTypes.find(w)?.name ?? w))) },
      { label: 'Armor', html: esc(c.armor.map((a) => content.armorWeights.find(a)?.name ?? a).join(', ')) },
      { label: 'Dual wield', html: c.dualWield ? 'Yes' : '' },
      { label: 'Ultimate', html: skillLink(ctx, c.ultimate) },
      { label: 'Skill tree', html: tree ? ctx.linkIf('tree', tree.id, `${c.name} tree`) : '' },
      { label: 'Class set', html: set ? ctx.linkIf('item-set', set.id, set.name) : '' },
    ],
    { color: c.color, caption: c.tagline },
  );
  type StatRow = { label: string; v: Record<string, number> };
  const statsTable = table<StatRow>(
    [
      { label: 'Level 1', v: c.baseStats },
      { label: 'Per level', v: c.growth },
    ],
    [{ label: '', cell: (r) => `<b>${esc(r.label)}</b>` }, ...PRIMARY.map((s) => ({ label: s.toUpperCase(), cell: (r: StatRow) => esc(r.v[s] ?? 0), className: 'num' }))],
  );
  return [
    box,
    prose(c.description),
    h2('Playstyle'),
    prose(c.playstyle),
    h2(`Class mechanic: ${c.mechanic.name}`),
    prose(c.mechanic.description),
    resource ? `<p>${esc(resource.name)}: max ${esc(resource.max)}, ${resource.decayPerTurn ? `fades ${esc(resource.decayPerTurn)} per turn. ` : ''}${esc(resource.description)}</p>` : '',
    c.trait ? `${h2(`Trait: ${c.trait.name}`)}<p>${esc(c.trait.description)}</p>${callout('note', `<p>${mods(c.trait.modifiers)}</p>`)}` : '',
    h2('Stats'),
    statsTable,
    h2('Starting skills'),
    ul(c.startingSkills.map((s) => `${skillLink(ctx, s)}${content.skills.find(s) ? ` <span class="muted">${esc(content.skills.get(s).description)}</span>` : ''}`)),
    specs.length ? `${h2('Specializations')}${ul(specs.map((s) => `${ctx.linkIf('specialization', s.id, s.name)}: ${esc(s.description)}`))}` : '',
    classNavbox(ctx),
  ].join('');
}

function renderRace(r: RaceDef, ctx: RenderCtx): string {
  const box = infobox(r.name, [
    { label: 'Unlock', html: esc(raceUnlock(r)) },
    { label: 'Homeland', html: esc(r.flavor.homeland) },
    { label: 'Stat bonus', html: statLine(r.statBonus) || '—' },
    { label: 'Racial skill', html: skillLink(ctx, r.activeSkill) },
    { label: 'Skill points', html: r.bonusSkillPointEvery ? `+1 every ${esc(r.bonusSkillPointEvery)} levels` : '' },
    { label: 'Crafting', html: r.craftingDiscount ? `${esc(r.craftingDiscount)}% cheaper` : '' },
    { label: 'Shop prices', html: r.shopMarkup ? `+${esc(r.shopMarkup)}%` : '' },
    { label: 'Potions', html: r.noPotions ? 'Cannot drink' : '' },
    { label: 'Swims', html: r.swims ? 'Yes' : '' },
  ]);
  return [
    box,
    prose(r.description),
    h2('Lore'),
    prose(r.flavor.lore),
    `<blockquote>${esc(r.flavor.saying)}</blockquote>`,
    h2(`Passive: ${r.passive.name}`),
    `<p>${esc(r.passive.description)}</p>`,
    callout('note', `<p>${mods(r.passive.modifiers)}</p>`),
    h2('Racial skill'),
    `<p>${skillLink(ctx, r.activeSkill)}${content.skills.find(r.activeSkill) ? `: ${esc(content.skills.get(r.activeSkill).description)}` : ''}</p>`,
    navbox('Races', [
      { label: 'Starting', html: races.filter((x) => !x.unlock).map((x) => ctx.link('race', x.id)) },
      { label: 'Unlockable', html: races.filter((x) => x.unlock).map((x) => ctx.link('race', x.id)) },
    ]),
  ].join('');
}

function renderGod(g: GodDef, ctx: RenderCtx): string {
  const p = content.pantheon.find(g.id);
  const apostle = content.apostles.find(g.id);
  const signs = content.birthSigns.filter((b) => b.god === g.id);
  const blessings = content.blessings.filter((b) => b.god === g.id);
  const box = infobox(
    g.name,
    [
      { label: 'Epithet', html: esc(g.epithet) },
      { label: 'Domain', html: esc(g.domain) },
      { label: 'Element', html: tag(content.elements.find(g.element)?.name ?? g.element, ELEMENT_COLORS[g.element]) },
      { label: 'Favored stats', html: esc(g.favoredStats.map((s) => s.toUpperCase()).join(', ')) },
      { label: 'Alignment', html: p ? esc(p.alignment) : '' },
      { label: 'Shrine', html: p ? esc(p.shrine) : '' },
      { label: 'Temple', html: p ? esc(p.temple) : '' },
      { label: 'Allies', html: p?.allies.length ? joinHtml(p.allies.map((a) => godTag(ctx, a))) : '' },
      { label: 'Rivals', html: p?.rivals.length ? joinHtml(p.rivals.map((a) => godTag(ctx, a))) : '' },
    ],
    { color: g.color, caption: g.symbol },
  );
  const likeList = (list: readonly { text: string }[] | undefined): string => ul((list ?? []).map((l) => esc(l.text)));
  return [
    box,
    p ? `<p><i>${esc(p.personality)}</i></p>` : '',
    p ? `${h2('Favor')}<h3>Likes</h3>${likeList(p.likes)}<h3>Dislikes</h3>${likeList(p.dislikes)}` : '',
    apostle
      ? `${h2('Apostleship')}<p>The god-bound ${esc(content.weaponTypes.find(apostle.weapon.type)?.name ?? apostle.weapon.type)} grows through ${esc(apostle.weapon.names.length)} stages: ${esc(apostle.weapon.names.join(' → '))}.</p><p><i>${esc(apostle.weapon.lore)}</i></p>`
      : '',
    signs.length ? `${h2('Birth signs')}${ul(signs.map((b) => `${ctx.link('birth-sign', b.id)}: ${esc(b.description)}`))}` : '',
    blessings.length
      ? `${h2(`Blessings (${blessings.length})`)}${table(blessings, [
          { label: 'Blessing', cell: (b) => ctx.linkIf('blessing', b.id, b.name), sort: (b) => b.name },
          { label: 'Rarity', cell: (b) => esc(b.rarity) },
          { label: 'Effect', cell: (b) => esc(b.description) },
        ], { filter: blessings.length > 12 })}`
      : '',
    navbox('Pantheon', [{ label: 'Gods', html: gods.filter((x) => !x.hidden).map((x) => ctx.link('god', x.id)) }]),
  ].join('');
}

const tables: TableSpec<any>[] = [
  {
    ns: 'class',
    label: 'Classes',
    category: 'Classes',
    entries: classes,
    summary: (c: ClassDef) => c.tagline,
    categories: (c: ClassDef) => [classUnlock(c) === 'Start' ? 'Starting classes' : `${classUnlock(c).replace(/ \d+$/, '')} classes`],
    render: renderClass,
    list: (list: readonly ClassDef[], ctx) =>
      table(list, [
        { label: 'Class', cell: (c) => ctx.link('class', c.id), sort: (c) => c.name },
        { label: 'Role', cell: (c) => esc(c.role) },
        { label: 'Difficulty', cell: (c) => esc(DIFFICULTY[c.difficulty]), sort: (c) => c.difficulty },
        { label: 'Resource', cell: (c) => esc(c.resource ? content.resources.find(c.resource)?.name : 'MP') },
        { label: 'Unlock', cell: (c) => esc(classUnlock(c)) },
      ], { filter: true }),
  },
  {
    ns: 'race',
    label: 'Races',
    category: 'Races',
    entries: races,
    spoiler: (r: RaceDef) => !!r.unlock,
    render: renderRace,
    list: (list: readonly RaceDef[], ctx) =>
      table(list, [
        { label: 'Race', cell: (r) => ctx.link('race', r.id), sort: (r) => r.name },
        { label: 'Stat bonus', cell: (r) => statLine(r.statBonus) },
        { label: 'Passive', cell: (r) => esc(r.passive.name) },
        { label: 'Unlock', cell: (r) => esc(raceUnlock(r)) },
      ], { filter: true }),
  },
  {
    ns: 'birth-sign',
    label: 'Birth signs',
    category: 'Birth signs',
    entries: content.birthSigns.all(),
    render: (b, ctx) =>
      infobox(b.name, [
        { label: 'God', html: godTag(ctx, b.god) },
        { label: 'Favor bonus', html: b.favorBonus ? `+${esc(b.favorBonus)}%` : '' },
        { label: 'Bonus', html: mods(b.modifiers) },
      ]) + prose(b.description),
    list: (list, ctx) =>
      table(list, [
        { label: 'Sign', cell: (b) => ctx.link('birth-sign', b.id), sort: (b) => b.name },
        { label: 'God', cell: (b) => godTag(ctx, b.god) },
        { label: 'Effect', cell: (b) => esc(b.description) },
      ]),
  },
  {
    ns: 'background',
    label: 'Backgrounds',
    category: 'Backgrounds',
    entries: content.backgrounds.all(),
    render: (b, ctx) =>
      infobox(b.name, [
        { label: 'Stats', html: statLine(b.statBonus) },
        { label: 'Skill', html: b.skill ? skillLink(ctx, b.skill) : '' },
        { label: 'Item', html: b.item ? `${ctx.linkIf('item', b.item.itemId, content.items.find(b.item.itemId)?.name ?? b.item.itemId)} ×${esc(b.item.qty)}` : '' },
      ]) +
      prose(b.description) +
      (b.voice?.length ? `${h2('Voice lines')}${b.voice.map((v: string) => `<blockquote>${esc(v)}</blockquote>`).join('')}` : ''),
  },
  {
    ns: 'god',
    label: 'Gods',
    category: 'Gods',
    entries: gods,
    summary: (g: GodDef) => `${g.epithet}, god of ${g.domain}`,
    title: (g: GodDef) => g.name,
    render: renderGod,
    list: (list: readonly GodDef[], ctx) =>
      table(list, [
        { label: 'God', cell: (g) => ctx.link('god', g.id), sort: (g) => g.name },
        { label: 'Epithet', cell: (g) => esc(g.epithet) },
        { label: 'Domain', cell: (g) => esc(g.domain) },
        { label: 'Element', cell: (g) => tag(content.elements.find(g.element)?.name ?? g.element, ELEMENT_COLORS[g.element]), sort: (g) => g.element },
      ]),
  },
];

export const charactersSection = simpleSection({
  id: 'characters',
  title: 'Characters',
  group: 'Characters',
  blurb: 'Races, classes, birth signs, backgrounds and the gods you can swear to.',
  intro: `<p>A hero is a race, a class, a birth sign and a background, sworn to one of the gods. Pick them at character creation; more races and classes unlock through New Game+ and secret questlines.</p>`,
  tables,
});
