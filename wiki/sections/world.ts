/**
 * World section: zones (the hubs), towns, dungeons, areas, quests, NPCs,
 * companions, factions, lore, weather, shops and treasure maps.
 * Namespaces (`ns`) are shared with other sections; do not rename them.
 */
import { content } from '../../src/data';
import { HIDDEN_LORE } from '../../src/data/world/hidden';
import { MECHANICS } from '../../src/data/world/mechanics';
import type { TreasureDef } from '../../src/data/world/treasures';
import type { AreaDef } from '../../src/data/world/areas';
import type { CompanionDef } from '../../src/engine/party/types';
import type { Cond, NpcDef, ObjectiveDef, QuestDef, QuestKind, RewardDef } from '../../src/engine/quests/types';
import type { ShopDef } from '../../src/engine/economy/types';
import type { DungeonDef, EncounterGroup, FactionDef, LoreDef, TownDef, WeatherDef, ZoneDef } from '../../src/engine/world/types';
import type { FavorDeed } from '../../src/engine/gods/types';
import { simpleSection } from '../core/generic';
import { callout, esc, h2, infobox, joinHtml, mods, navbox, prose, table, tag, ul } from '../core/html';
import type { RenderCtx } from '../core/types';

// ------------------------------------------------------------------ indexes

const zones = [...content.zones.all()].sort((a, b) => a.order - b.order);
const towns = content.towns.all();
const dungeons = content.dungeons.all();
const areas = content.areas.all();
const quests = content.quests.all();
const npcs = content.npcs.all();
const companions = content.companions.all();
const factions = content.factions.all();
const lore = content.lore.all();
const weathers = content.weather.all();
const shops = content.shops.all();
const treasures = content.treasures.all();

const hiddenLoreIds = new Set(HIDDEN_LORE.map((l) => l.id));
const zoneOf = (id: string | undefined): ZoneDef | undefined => (id ? content.zones.find(id) : undefined);
const townOf = (id: string | undefined): TownDef | undefined => (id ? content.towns.find(id) : undefined);
const zoneSpoiler = (id: string | undefined): boolean => zoneOf(id)?.ngPlus !== undefined;

/** The zone a quest belongs to: its own, else its giver's or board's town. */
function questZone(q: QuestDef): string | undefined {
  if (q.zone) return q.zone;
  const giver = q.giver ? content.npcs.find(q.giver) : undefined;
  const town = townOf(q.board ?? giver?.town);
  return town?.zone;
}

const questsByZone = new Map<string, QuestDef[]>();
const questsByGiver = new Map<string, QuestDef[]>();
const questsByNpc = new Map<string, Set<string>>();
const questsByFaction = new Map<string, QuestDef[]>();
const questsByTown = new Map<string, QuestDef[]>();
for (const q of quests) {
  const z = questZone(q);
  if (z) (questsByZone.get(z) ?? questsByZone.set(z, []).get(z)!).push(q);
  if (q.giver) (questsByGiver.get(q.giver) ?? questsByGiver.set(q.giver, []).get(q.giver)!).push(q);
  const bt = q.board ?? (q.giver ? content.npcs.find(q.giver)?.town : undefined);
  if (bt) (questsByTown.get(bt) ?? questsByTown.set(bt, []).get(bt)!).push(q);
  for (const f of Object.keys(q.rewards.rep ?? {})) (questsByFaction.get(f) ?? questsByFaction.set(f, []).get(f)!).push(q);
  for (const st of q.stages) {
    const involved = [st.turnIn, ...st.objectives.flatMap((o) => ('npc' in o ? [o.npc] : []))];
    for (const n of involved) if (n) (questsByNpc.get(n) ?? questsByNpc.set(n, new Set()).get(n)!).add(q.id);
  }
}
const questById = new Map(quests.map((q) => [q.id, q]));

const sortedByLevel = <T extends { level: number }>(list: readonly T[]): T[] => [...list].sort((a, b) => a.level - b.level);

// ------------------------------------------------------------------ helpers

const KIND_LABEL: Record<QuestKind, string> = {
  main: 'Main story', twilight: 'Twilight', side: 'Side quests', god: 'God quests', class: 'Class quests', hybrid: 'Hybrid trials',
  faction: 'Faction', companion: 'Companion', bounty: 'Bounties', racial: 'Racial', background: 'Background', festival: 'Festival',
  trinket: 'Trinket', affliction: 'Affliction', holding: 'Holdings', promotion: 'Promotion',
};
const KIND_ORDER = Object.keys(KIND_LABEL) as QuestKind[];

const details = (summary: string, body: string, open = false): string => `<details${open ? ' open' : ''}><summary>${summary}</summary>${body}</details>`;
const levels = (l: readonly [number, number]): string => `${l[0]}–${l[1]}`;
const name = (ns: string, id: string): string => (ns === 'zone' ? zoneOf(id)?.name : townOf(id)?.name) ?? id;
const zoneLink = (ctx: RenderCtx, id: string | undefined): string => (id ? ctx.linkIf('zone', id, zoneOf(id)?.name) : '');
const townLink = (ctx: RenderCtx, id: string | undefined): string => (id ? ctx.linkIf('town', id, townOf(id)?.name) : '');
const enemyLink = (ctx: RenderCtx, id: string): string => ctx.linkIf('enemy', id, content.enemies.find(id)?.name ?? id);
const itemLink = (ctx: RenderCtx, id: string): string => ctx.linkIf('item', id, content.items.find(id)?.name ?? id);
const deeds = (list: readonly FavorDeed[]): string => ul(list.map((d) => `${esc(d.text)} <span class="muted">(${d.amount > 0 ? '+' : ''}${esc(d.amount)})</span>`));

const THEME = (a: AreaDef): string => `${a.theme}, ${a.biome}`;

function describeCond(c: Cond | undefined, ctx: RenderCtx): string {
  if (!c) return '';
  switch (c.kind) {
    case 'level': return `Level ${c.min}`;
    case 'class': return `Class ${ctx.linkIf('class', c.classId)}`;
    case 'race': return `Race ${ctx.linkIf('race', c.raceId)}`;
    case 'background': return `Background ${ctx.linkIf('background', c.backgroundId)}`;
    case 'quest': return `${c.state === 'complete' ? 'Finished' : c.state === 'active' ? 'Active' : 'Not started'}: ${ctx.linkIf('quest', c.quest)}`;
    case 'favor': return `${ctx.linkIf('god', c.god)} favor ${esc(c.tier)}`;
    case 'rep': return `${ctx.linkIf('faction', c.faction)} reputation ${c.min}`;
    case 'item': return `Carry ${itemLink(ctx, c.itemId)}${c.count ? ` ×${c.count}` : ''}`;
    case 'gold': return `${c.min} gold`;
    case 'dungeonCleared': return `Cleared ${ctx.linkIf('dungeon', c.dungeon)}`;
    case 'companion': return `${ctx.linkIf('companion', c.companion)} ${c.state === 'inParty' ? 'in the party' : 'recruited'}`;
    case 'zoneVisited': return `Visited ${zoneLink(ctx, c.zone)}`;
    case 'ngPlus': return `New Game+ ${c.min}`;
    case 'time': return `At ${c.time}`;
    case 'atLevelCap': return 'At the level cap';
    case 'all': return c.conds.map((x) => describeCond(x, ctx)).join('; ');
    case 'any': return `Any of: ${c.conds.map((x) => describeCond(x, ctx)).join(' / ')}`;
    case 'not': return `Not: ${describeCond(c.cond, ctx)}`;
    default: return esc(c.kind.replace(/([A-Z])/g, ' $1').toLowerCase());
  }
}

function describeObjective(o: ObjectiveDef, ctx: RenderCtx): string {
  let extra = '';
  switch (o.kind) {
    case 'kill': extra = o.enemyId ? enemyLink(ctx, o.enemyId) : o.enemyType ? esc(o.enemyType) : ''; break;
    case 'collect': extra = `${itemLink(ctx, o.itemId)} ×${o.count}`; break;
    case 'deliver': extra = `${itemLink(ctx, o.itemId)} ×${o.count} to ${ctx.linkIf('npc', o.npc)}`; break;
    case 'talk': extra = ctx.linkIf('npc', o.npc); break;
    case 'fight': extra = ctx.linkIf('encounter', o.encounter); break;
    case 'escort': extra = ctx.linkIf('npc', o.npc); break;
    case 'clear': case 'runes': extra = ctx.linkIf('dungeon', o.dungeon); break;
    default: break;
  }
  return `${esc(o.text)}${extra ? ` <span class="muted">(${extra})</span>` : ''}`;
}

function rewardLines(r: RewardDef, ctx: RenderCtx): string[] {
  const out: string[] = [];
  if (r.xp) out.push(`XP: ${Math.round(r.xp * 100)}% of a level`);
  if (r.gold) out.push(`Gold: ${r.gold} per level`);
  for (const i of r.items ?? []) out.push(`${itemLink(ctx, i.itemId)}${i.qty && i.qty > 1 ? ` ×${i.qty}` : ''}`);
  if (r.gear) out.push(`${r.gear.count ?? 1} ${esc(r.gear.rarity)} gear`);
  for (const [g, v] of Object.entries(r.favor ?? {})) out.push(`${ctx.linkIf('god', g)} favor ${v > 0 ? '+' : ''}${v}`);
  for (const [f, v] of Object.entries(r.rep ?? {})) out.push(`${ctx.linkIf('faction', f)} reputation ${v > 0 ? '+' : ''}${v}`);
  if (r.skillPoints) out.push(`${r.skillPoints} skill point${r.skillPoints > 1 ? 's' : ''}`);
  if (r.title) out.push(`Title: ${esc(r.title)}`);
  return out;
}

function groupBy<T>(list: readonly T[], key: (x: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const x of list) (m.get(key(x)) ?? m.set(key(x), []).get(key(x))!).push(x);
  return m;
}

const questTable = (list: readonly QuestDef[], ctx: RenderCtx, filter = false): string =>
  table(
    sortedByLevel(list),
    [
      { label: 'Quest', cell: (q) => ctx.link('quest', q.id), sort: (q) => q.name },
      { label: 'Level', cell: (q) => esc(q.level), sort: (q) => q.level, className: 'num' },
      { label: 'Kind', cell: (q) => esc(KIND_LABEL[q.kind]) },
      { label: 'Giver', cell: (q) => (q.giver ? ctx.linkIf('npc', q.giver) : q.board ? `${townLink(ctx, q.board)} board` : '') },
    ],
    { filter },
  );

const enemyNames = (g: EncounterGroup, ctx: RenderCtx): string => {
  const counts = new Map<string, number>();
  for (const e of g.enemies) counts.set(e.enemyId, (counts.get(e.enemyId) ?? 0) + 1);
  return [...counts].map(([id, n]) => `${enemyLink(ctx, id)}${n > 1 ? ` ×${n}` : ''}`).join(', ');
};

function groupTable(groups: readonly EncounterGroup[], ctx: RenderCtx): string {
  if (!groups.length) return '<p class="muted">None.</p>';
  const total = groups.reduce((s, g) => s + g.weight, 0) || 1;
  return table(groups, [
    { label: 'Enemies', cell: (g) => enemyNames(g, ctx) },
    { label: 'Chance', cell: (g) => `${Math.round((g.weight / total) * 100)}%`, sort: (g) => g.weight, className: 'num' },
    { label: 'When', cell: (g) => esc([g.time, ...(g.weather ?? []).map((w) => content.weather.find(w)?.name ?? w)].filter(Boolean).join(', ') || 'Any') },
  ]);
}

// ------------------------------------------------------------------ zones

function zoneNavbox(ctx: RenderCtx): string {
  return navbox('Zones', [
    { label: 'The road', html: zones.filter((z) => !z.off).map((z) => ctx.link('zone', z.id)) },
    { label: 'Off the road', html: zones.filter((z) => z.off && z.ngPlus === undefined).map((z) => ctx.link('zone', z.id)) },
    { label: 'New Game+', html: zones.filter((z) => z.ngPlus !== undefined).map((z) => ctx.link('zone', z.id)) },
  ]);
}

function renderZone(z: ZoneDef, ctx: RenderCtx): string {
  const town = townOf(z.town);
  const mech = z.mechanic ? MECHANICS.find((m) => m.id === z.mechanic) : undefined;
  const zAreas = areas.filter((a) => a.zone === z.id);
  const zLore = lore.filter((l) => l.zone === z.id);
  const zTreasures = treasures.filter((t) => t.zone === z.id);
  const zQuests = questsByZone.get(z.id) ?? [];
  const box = infobox(z.name, [
    { label: 'Order', html: z.off ? 'Off the road' : `${z.order} of ${zones.filter((x) => !x.off).length}` },
    { label: 'Level range', html: levels(z.levels) },
    { label: 'Biome', html: esc(z.biome) },
    { label: 'Town', html: townLink(ctx, z.town) },
    { label: 'Threat', html: z.threat ? `+${esc(z.threat)}% HP and damage` : '' },
    { label: 'Encounter rate', html: esc(z.encounterRate) },
    { label: 'Weather', html: joinHtml(z.weather.map((w) => ctx.linkIf('weather', w.id))) },
    { label: 'World boss', html: enemyLink(ctx, z.worldBoss) },
    { label: 'Mechanic', html: mech ? esc(mech.name) : '' },
    { label: 'New Game+', html: z.ngPlus !== undefined ? `Opens at tier ${z.ngPlus}` : '' },
  ]);
  const gatherRow = (label: string, ids: string[]): string => (ids.length ? `<tr><th>${label}</th><td>${ids.map((i) => itemLink(ctx, i)).join(', ')}</td></tr>` : '');
  const gather = [gatherRow('Mining', z.gather.mining), gatherRow('Herbalism', z.gather.herbalism), gatherRow('Fishing', z.gather.fishing)].join('');
  return [
    box,
    prose(z.description),
    mech ? `${h2(`Regional mechanic: ${mech.name}`)}<p>${esc(mech.description)}</p>` : '',
    town ? `${h2('Town')}<p>${ctx.link('town', town.id)}: ${esc(town.description)}</p>` : '',
    z.dungeons.length
      ? `${h2('Dungeons')}${table(sortedByLevel(z.dungeons.map((d) => content.dungeons.get(d))), [
          { label: 'Dungeon', cell: (d) => ctx.link('dungeon', d.id), sort: (d) => d.name },
          { label: 'Level', cell: (d) => esc(d.level), sort: (d) => d.level, className: 'num' },
          { label: 'Boss', cell: (d) => enemyLink(ctx, d.boss) },
          { label: 'Rooms', cell: (d) => esc(d.rooms), sort: (d) => d.rooms, className: 'num' },
        ])}`
      : '',
    zAreas.length
      ? h2('Areas') + details(`${zAreas.length} side areas`, table(zAreas, [
          { label: 'Area', cell: (a) => ctx.link('area', a.id), sort: (a) => a.name },
          { label: 'Type', cell: (a) => esc(THEME(a)) },
          { label: 'Access', cell: (a) => (a.access ? `${esc(a.access.by)} (level ${a.access.level})` : a.hidden ? 'Hidden' : 'On foot') },
        ], { filter: zAreas.length > 12 }))
      : '',
    h2('Encounters'),
    details(`${z.encounters.length} random groups`, `<p>Random fights on open ground (encounter rate ${esc(z.encounterRate)} per step).</p>${groupTable(z.encounters, ctx)}`, true),
    z.roaming.length ? details(`${z.roaming.length} roaming elite groups`, groupTable(z.roaming, ctx)) : '',
    z.shrines.length ? `${h2('Shrines')}<p>${z.shrines.map((g) => ctx.link('god', g)).join(', ')}</p>` : '',
    gather ? `${h2('Gathering')}<table class="wikitable"><tbody>${gather}</tbody></table>` : '',
    zTreasures.length ? h2('Treasure maps') + details(`${zTreasures.length} maps`, ul(zTreasures.map((t) => `${ctx.link('treasure', t.id)}: ${esc(t.item.name)}`))) : '',
    zLore.length ? h2('Lore pages') + details(`${zLore.length} pages`, ul(zLore.map((l) => ctx.link('lore', l.id)))) : '',
    zQuests.length ? h2('Quests') + details(`${zQuests.length} quests`, questTable(zQuests, ctx, zQuests.length > 12)) : '',
    zoneNavbox(ctx),
  ].join('');
}

function listZones(entries: readonly ZoneDef[], ctx: RenderCtx): string {
  const rows = [...entries].sort((a, b) => a.order - b.order);
  const t = (list: ZoneDef[]): string =>
    table(list, [
      { label: '#', cell: (z) => esc(z.order), sort: (z) => z.order, className: 'num' },
      { label: 'Zone', cell: (z) => ctx.link('zone', z.id), sort: (z) => z.name },
      { label: 'Levels', cell: (z) => levels(z.levels), sort: (z) => z.levels[0] },
      { label: 'Biome', cell: (z) => esc(z.biome) },
      { label: 'Town', cell: (z) => townLink(ctx, z.town) },
      { label: 'World boss', cell: (z) => enemyLink(ctx, z.worldBoss) },
    ]);
  return (
    `<p>The main road runs west to east through eight regions.</p>${t(rows.filter((z) => !z.off))}` +
    details('Off the road', t(rows.filter((z) => z.off && z.ngPlus === undefined)), true) +
    details('New Game+ realms (spoilers)', t(rows.filter((z) => z.ngPlus !== undefined)))
  );
}

// ------------------------------------------------------------------ towns

function renderTown(t: TownDef, ctx: RenderCtx): string {
  const faction = t.faction ? content.factions.find(t.faction) : undefined;
  const townNpcs = npcs.filter((n) => n.town === t.id);
  const tQuests = questsByTown.get(t.id) ?? [];
  const roamers = shops.filter((s) => s.roams?.route.includes(t.id));
  const box = infobox(t.name, [
    { label: 'Zone', html: zoneLink(ctx, t.zone) },
    { label: 'Temple', html: joinHtml(t.temple.map((g) => ctx.link('god', g))) },
    { label: 'Faction', html: faction ? ctx.link('faction', faction.id) : '' },
    { label: 'Housing', html: t.housing ? 'House for sale' : '' },
    { label: 'Inn', html: `${esc(t.innCostPerLevel)} gold per level` },
    { label: 'Minigame', html: t.minigame ? esc(t.minigame) : '' },
  ]);
  const standard = ['blacksmith', 'armorer', 'alchemist', 'general', 'magic', 'library', 'temple'];
  const shopIds = [...standard, ...(faction ? ['faction'] : []), ...(t.extraShops ?? []).filter((s) => !s.startsWith('merchant-') && s !== 'collector')];
  const people = townNpcs.filter((n) => n.place === 'people');
  const temple = townNpcs.filter((n) => n.place === 'temple');
  const arena = townNpcs.filter((n) => n.place === 'arena');
  const field = townNpcs.filter((n) => n.place === 'field');
  const npcList = (l: NpcDef[]): string => ul(l.map((n) => `${ctx.link('npc', n.id)} <span class="muted">${esc(n.title)}</span>`));
  return [
    box,
    prose(t.description),
    h2('Services'),
    `<p>Inn: ${esc(t.innCostPerLevel)} gold per character level. Temple honors ${joinHtml(t.temple.map((g) => ctx.link('god', g)))}.${t.housing ? ' A house can be bought here.' : ''}</p>`,
    h2('Shops'),
    ul(shopIds.map((s) => ctx.linkIf('shop', s))),
    roamers.length ? `<p class="muted">Roaming merchants who stop here: ${roamers.map((s) => ctx.link('shop', s.id)).join(', ')}.</p>` : '',
    faction ? `${h2('Faction hall')}<p>${ctx.link('faction', faction.id)}: ${esc(faction.description)}</p>` : '',
    townNpcs.length ? h2('People') : '',
    people.length ? details(`${people.length} townsfolk`, npcList(people), true) : '',
    temple.length ? details(`${temple.length} at the temple`, npcList(temple)) : '',
    arena.length ? details(`${arena.length} at the arena`, npcList(arena)) : '',
    field.length ? details(`${field.length} in the field`, npcList(field)) : '',
    tQuests.length ? h2('Quests') + details(`${tQuests.length} quests start here`, questTable(tQuests, ctx, tQuests.length > 12)) : '',
    navbox('Towns', [{ label: 'Towns', html: sortTowns().map((x) => ctx.link('town', x.id)) }]),
  ].join('');
}

function sortTowns(): TownDef[] {
  return [...towns].sort((a, b) => (zoneOf(a.zone)?.order ?? 99) - (zoneOf(b.zone)?.order ?? 99));
}

function listTowns(_entries: readonly TownDef[], ctx: RenderCtx): string {
  return table(
    sortTowns(),
    [
      { label: 'Town', cell: (t) => ctx.link('town', t.id), sort: (t) => t.name },
      { label: 'Zone', cell: (t) => zoneLink(ctx, t.zone), sort: (t) => zoneOf(t.zone)?.order ?? 99 },
      { label: 'Temple', cell: (t) => joinHtml(t.temple.map((g) => ctx.link('god', g))) },
      { label: 'Faction', cell: (t) => (t.faction ? ctx.link('faction', t.faction) : '') },
      { label: 'Inn / level', cell: (t) => esc(t.innCostPerLevel), sort: (t) => t.innCostPerLevel, className: 'num' },
      { label: 'Housing', cell: (t) => (t.housing ? 'Yes' : '') },
    ],
  );
}

// ------------------------------------------------------------------ dungeons

function renderDungeon(d: DungeonDef, ctx: RenderCtx): string {
  const box = infobox(d.name, [
    { label: 'Zone', html: zoneLink(ctx, d.zone) },
    { label: 'Level', html: esc(d.level) },
    { label: 'Biome', html: esc(d.biome) },
    { label: 'Rooms', html: esc(d.rooms) },
    { label: 'Boss', html: enemyLink(ctx, d.boss) },
    { label: 'Puzzle', html: d.puzzle ? 'Rune-stone puzzle bars the boss room' : '' },
    { label: 'Gimmick', html: d.gimmick ? esc({ dark: 'Darkness closes in', flood: 'Rising and falling water', cycle: 'Gates that open and shut' }[d.gimmick]) : '' },
    { label: 'Hard path', html: d.hard ? 'Optional champion path' : '' },
  ]);
  const dq = quests.filter((q) => q.stages.some((s) => s.objectives.some((o) => (o.kind === 'clear' || o.kind === 'runes') && o.dungeon === d.id)));
  const sibs = dungeons.filter((x) => x.zone === d.zone);
  return [
    box,
    prose(d.description),
    h2('Boss'),
    `<p>${enemyLink(ctx, d.boss)} waits in the last of ${esc(d.rooms)} rooms.</p>`,
    d.puzzle ? `${h2('Puzzle')}<p>Light the rune stones in the right order to open the boss room.</p>${d.hint ? callout('tip', `<p>${esc(d.hint)}</p>`) : ''}` : '',
    h2('Encounters'),
    groupTable(d.encounters, ctx),
    dq.length ? h2('Related quests') + ul(dq.map((q) => ctx.link('quest', q.id))) : '',
    navbox(`Dungeons of ${name('zone', d.zone)}`, [{ label: 'Dungeons', html: sibs.map((x) => ctx.link('dungeon', x.id)) }]),
  ].join('');
}

function listDungeons(entries: readonly DungeonDef[], ctx: RenderCtx): string {
  return table(
    sortedByLevel(entries),
    [
      { label: 'Dungeon', cell: (d) => ctx.link('dungeon', d.id), sort: (d) => d.name },
      { label: 'Zone', cell: (d) => zoneLink(ctx, d.zone), sort: (d) => zoneOf(d.zone)?.order ?? 99 },
      { label: 'Level', cell: (d) => esc(d.level), sort: (d) => d.level, className: 'num' },
      { label: 'Rooms', cell: (d) => esc(d.rooms), sort: (d) => d.rooms, className: 'num' },
      { label: 'Boss', cell: (d) => enemyLink(ctx, d.boss) },
      { label: 'Puzzle', cell: (d) => (d.puzzle ? 'Yes' : '') },
    ],
    { filter: true },
  );
}

// ------------------------------------------------------------------ areas

function renderArea(a: AreaDef, ctx: RenderCtx): string {
  const sibs = areas.filter((x) => x.zone === a.zone);
  return [
    infobox(a.name, [
      { label: 'Zone', html: zoneLink(ctx, a.zone) },
      { label: 'Type', html: esc(a.theme) },
      { label: 'Biome', html: esc(a.biome) },
      { label: 'Access', html: a.access ? `${esc(a.access.by)} (level ${a.access.level})` : a.hidden ? 'Hidden: opens by a rule' : 'On foot' },
    ]),
    prose(a.description),
    h2('Lore'),
    `<blockquote>${esc(a.lore)}</blockquote>`,
    details(`${sibs.length} areas in ${esc(name('zone', a.zone))}`, ul(sibs.map((x) => ctx.link('area', x.id)))),
  ].join('');
}

function listAreas(entries: readonly AreaDef[], ctx: RenderCtx): string {
  const by = groupBy(entries, (a) => a.zone);
  return zones
    .filter((z) => by.has(z.id))
    .map((z) => {
      const rows = by.get(z.id)!;
      return details(`${zoneLink(ctx, z.id)} <span class="muted">${rows.length} areas</span>`, table(rows, [
        { label: 'Area', cell: (a) => ctx.link('area', a.id), sort: (a) => a.name },
        { label: 'Type', cell: (a) => esc(a.theme) },
        { label: 'Description', cell: (a) => esc(a.description) },
      ]));
    })
    .join('');
}

// ------------------------------------------------------------------ quests

function renderQuest(q: QuestDef, ctx: RenderCtx): string {
  const zid = questZone(q);
  const giver = q.giver ? content.npcs.find(q.giver) : undefined;
  const rewards = rewardLines(q.rewards, ctx);
  const same = q.giver ? (questsByGiver.get(q.giver) ?? []).filter((x) => x.id !== q.id).slice(0, 12) : [];
  const box = infobox(q.name, [
    { label: 'Kind', html: esc(KIND_LABEL[q.kind]) },
    { label: 'Act', html: q.act ? esc(q.act) : '' },
    { label: 'Level', html: esc(q.level) },
    { label: 'Zone', html: zoneLink(ctx, zid) },
    { label: 'Given by', html: giver ? ctx.link('npc', giver.id) : q.board ? `${townLink(ctx, q.board)} quest board` : q.auto ? 'Starts by itself' : '' },
    { label: 'Requires', html: q.requires ? describeCond(q.requires, ctx) : '' },
    { label: 'Repeatable', html: q.repeatable ? 'Daily' : '' },
    { label: 'Stages', html: esc(q.stages.length) },
  ]);
  const stages = q.stages
    .map((s) => {
      const objs = s.objectives.map((o) => describeObjective(o, ctx));
      return `<li><b>${esc(s.text)}</b>${objs.length ? ul(objs) : ''}${s.turnIn ? `<p class="muted">Turn in to ${ctx.linkIf('npc', s.turnIn)}.${s.hours ? ` Time limit: ${esc(s.hours)} hours.` : ''}</p>` : s.hours ? `<p class="muted">Time limit: ${esc(s.hours)} hours.</p>` : ''}</li>`;
    })
    .join('');
  return [
    box,
    prose(q.summary),
    h2('Stages'),
    `<ol>${stages}</ol>`,
    h2('Rewards'),
    rewards.length ? ul(rewards) : '<p class="muted">None.</p>',
    q.epilogue ? `${h2('Epilogue')}<blockquote>${esc(q.epilogue)}</blockquote>` : '',
    same.length ? h2('More from this giver') + details(`${same.length} quests`, ul(same.map((x) => ctx.link('quest', x.id)))) : '',
  ].join('');
}

function listQuests(entries: readonly QuestDef[], ctx: RenderCtx): string {
  const by = groupBy(entries, (q) => q.kind);
  return (
    `<p>${entries.length} quests. Open a kind to browse it by zone.</p>` +
    KIND_ORDER.filter((k) => by.has(k))
      .map((k) => {
        const rows = by.get(k)!;
        const head = `${esc(KIND_LABEL[k])} <span class="muted">${rows.length}</span>`;
        if (rows.length <= 60) return details(head, questTable(rows, ctx, rows.length > 12));
        const byZone = groupBy(rows, (q) => questZone(q) ?? '');
        const inner = [...zones.map((z) => z.id), '']
          .filter((id) => byZone.has(id))
          .map((id) => details(`${id ? zoneLink(ctx, id) : 'Elsewhere'} <span class="muted">${byZone.get(id)!.length}</span>`, questTable(byZone.get(id)!, ctx, byZone.get(id)!.length > 12)))
          .join('');
        return details(head, inner);
      })
      .join('')
  );
}

const questSpoiler = (q: QuestDef): boolean => q.act === 'act4' || q.act === 'act5' || q.act === 'epilogue' || q.kind === 'twilight' || zoneSpoiler(q.zone);

// ------------------------------------------------------------------ NPCs

function renderNpc(n: NpcDef, ctx: RenderCtx): string {
  const given = questsByGiver.get(n.id) ?? [];
  const involved = [...(questsByNpc.get(n.id) ?? [])].map((id) => questById.get(id)!).filter((q) => q.giver !== n.id);
  const comp = n.companion ? content.companions.find(n.companion) : undefined;
  const box = infobox(n.name, [
    { label: 'Title', html: esc(n.title) },
    { label: 'Town', html: n.town ? townLink(ctx, n.town) : n.place === 'arena' ? 'Every town’s arena' : '' },
    { label: 'Found at', html: esc({ people: 'Town square', temple: 'Temple', arena: 'Arena', field: 'In the field' }[n.place]) },
    { label: 'Race', html: ctx.linkIf('race', n.race) },
    { label: 'Hours', html: n.schedule ? `${esc(n.schedule[0])}:00 to ${esc(n.schedule[1])}:00` : '' },
    { label: 'Festival', html: n.festival ? esc(n.festival) : '' },
    { label: 'Companion', html: comp ? ctx.link('companion', comp.id) : '' },
  ], { color: n.color });
  return [
    box,
    `<blockquote>${esc(n.greeting)}</blockquote>`,
    n.topics?.length ? h2('Conversation topics') + ul(n.topics.map((t) => `${esc(t.text)}${t.cond ? ` <span class="muted">(${describeCond(t.cond, ctx)})</span>` : ''}`)) : '',
    given.length ? h2('Quests offered') + details(`${given.length} quests`, questTable(given, ctx, given.length > 12), given.length <= 6) : '',
    involved.length ? h2('Appears in') + details(`${involved.length} quests`, ul(involved.slice(0, 40).map((q) => ctx.link('quest', q.id)))) : '',
  ].join('');
}

function listNpcs(entries: readonly NpcDef[], ctx: RenderCtx): string {
  const by = groupBy(entries, (n) => n.town ?? '');
  const t = (rows: NpcDef[]): string =>
    table(rows, [
      { label: 'Name', cell: (n) => ctx.link('npc', n.id), sort: (n) => n.name },
      { label: 'Title', cell: (n) => esc(n.title) },
      { label: 'Found at', cell: (n) => esc(n.place) },
    ]);
  return (
    `<p>${entries.length} people. Open a town to see who lives there.</p>` +
    sortTowns()
      .filter((x) => by.has(x.id))
      .map((x) => details(`${townLink(ctx, x.id)} <span class="muted">${by.get(x.id)!.length}</span>`, t(by.get(x.id)!)))
      .join('') +
    (by.has('') ? details(`Arena mentors and field figures <span class="muted">${by.get('')!.length}</span>`, t(by.get('')!)) : '')
  );
}

const npcSpoiler = (n: NpcDef): boolean => Boolean(n.until || n.after) || zoneSpoiler(townOf(n.town)?.zone);

// ------------------------------------------------------------------ companions

function renderCompanion(c: CompanionDef, ctx: RenderCtx): string {
  const box = infobox(c.name, [
    { label: 'Title', html: esc(c.title) },
    { label: 'Race', html: ctx.linkIf('race', c.raceId) },
    { label: 'Class', html: ctx.linkIf('class', c.classId) },
    { label: 'Specialization', html: ctx.linkIf('specialization', c.specialization) },
    { label: 'Birth sign', html: ctx.linkIf('birth-sign', c.birthSignId) },
    { label: 'God', html: ctx.linkIf('god', c.god) },
    { label: 'Found in', html: townLink(ctx, c.town) },
    { label: 'Starting approval', html: esc(c.startApproval) },
  ]);
  const node = (n: { name: string; description: string }): string => `<b>${esc(n.name)}</b>: ${esc(n.description)}`;
  return [
    box,
    prose(c.bio),
    h2('Likes and dislikes'),
    `<h3>Likes</h3>${deeds(c.likes)}<h3>Dislikes</h3>${deeds(c.dislikes)}`,
    h2('Recruitment and personal quests'),
    `<ol>${c.line.map((id) => `<li>${ctx.linkIf('quest', id)}</li>`).join('')}</ol>`,
    h2('Bond perks'),
    table(c.bond, [
      { label: 'Approval', cell: (b) => esc(b.approval), sort: (b) => b.approval, className: 'num' },
      { label: 'Choose one', cell: (b) => b.options.map(node).join('<br>') },
    ]),
    `<p>Oath perk (their personal quest): ${node(c.oath)}</p>`,
    `<p>Loyalty perk (75 approval): ${node(c.loyalty)}</p>`,
    h2('Leaving'),
    `<p>${esc(c.leaves.text)}</p><p class="muted">They also walk out if approval sinks too low.</p>`,
    navbox('Companions', [{ label: 'Companions', html: companions.map((x) => ctx.link('companion', x.id)) }]),
  ].join('');
}

function listCompanions(entries: readonly CompanionDef[], ctx: RenderCtx): string {
  return table(
    entries,
    [
      { label: 'Companion', cell: (c) => ctx.link('companion', c.id), sort: (c) => c.name },
      { label: 'Class', cell: (c) => ctx.linkIf('class', c.classId) },
      { label: 'Race', cell: (c) => ctx.linkIf('race', c.raceId) },
      { label: 'God', cell: (c) => ctx.linkIf('god', c.god) },
      { label: 'Found in', cell: (c) => townLink(ctx, c.town) },
    ],
    { filter: entries.length > 12 },
  );
}

// ------------------------------------------------------------------ factions

function renderFaction(f: FactionDef, ctx: RenderCtx): string {
  const fq = questsByFaction.get(f.id) ?? [];
  const box = infobox(f.name, [
    { label: 'Hall', html: townLink(ctx, f.hall) },
    { label: 'Zone', html: zoneLink(ctx, townOf(f.hall)?.zone) },
    { label: 'God', html: ctx.linkIf('god', f.god) },
    { label: 'Rivals', html: f.rivals.length ? f.rivals.map((r) => ctx.link('faction', r)).join(', ') : 'None' },
  ]);
  return [
    box,
    prose(f.description),
    h2('Ranks'),
    table(f.ranks, [
      { label: 'Rank', cell: (r) => `<b>${esc(r.name)}</b>` },
      { label: 'Reputation', cell: (r) => esc(r.rep), sort: (r) => r.rep, className: 'num' },
      { label: 'Perks', cell: (r) => mods(r.modifiers) || '—' },
    ]),
    h2('Reputation'),
    `<h3>Likes</h3>${deeds(f.likes)}<h3>Dislikes</h3>${deeds(f.dislikes)}`,
    `<p class="muted">Rivals lose half of any reputation you earn here.</p>`,
    fq.length ? h2('Quests that raise reputation') + details(`${fq.length} quests`, questTable(fq, ctx, fq.length > 12)) : '',
    navbox('Factions', [{ label: 'Factions', html: factions.map((x) => ctx.link('faction', x.id)) }]),
  ].join('');
}

// ------------------------------------------------------------------ lore

const loreSpoiler = (l: LoreDef): boolean => hiddenLoreIds.has(l.id) || l.id.startsWith('crimson-page') || zoneSpoiler(l.zone);

function renderLore(l: LoreDef, ctx: RenderCtx): string {
  const sibs = lore.filter((x) => x.zone === l.zone && x.id !== l.id);
  return [
    infobox(l.title, [{ label: 'Zone', html: zoneLink(ctx, l.zone) }]),
    prose(l.text),
    sibs.length ? h2('More from this zone') + details(`${sibs.length} pages`, ul(sibs.map((x) => ctx.link('lore', x.id)))) : '',
  ].join('');
}

function listLore(entries: readonly LoreDef[], ctx: RenderCtx): string {
  const by = groupBy(entries, (l) => l.zone);
  return (
    `<p>${entries.length} lore pages, found in chests and ruins. Pages marked as spoilers come from hidden or late content.</p>` +
    zones
      .filter((z) => by.has(z.id))
      .map((z) => details(`${zoneLink(ctx, z.id)} <span class="muted">${by.get(z.id)!.length} pages</span>`, ul(by.get(z.id)!.map((l) => `${ctx.link('lore', l.id)}${loreSpoiler(l) ? ` ${tag('spoiler')}` : ''}`))))
      .join('')
  );
}

// ------------------------------------------------------------------ weather

function renderWeather(w: WeatherDef, ctx: RenderCtx): string {
  const where = zones.filter((z) => z.weather.some((x) => x.id === w.id));
  return [
    infobox(w.name, [
      { label: 'Encounter rate', html: `×${esc(w.encounterMult)}` },
      { label: 'Effects in battle', html: mods(w.modifiers) || 'None' },
      { label: 'Zones', html: esc(where.length) },
    ]),
    prose(w.description),
    h2('Where it falls'),
    where.length ? ul(where.map((z) => `${ctx.link('zone', z.id)} <span class="muted">weight ${esc(z.weather.find((x) => x.id === w.id)!.weight)}</span>`)) : '<p class="muted">Not rolled by any zone.</p>',
    navbox('Weather', [{ label: 'Weather', html: weathers.map((x) => ctx.link('weather', x.id)) }]),
  ].join('');
}

// ------------------------------------------------------------------ shops

function renderShop(s: ShopDef, ctx: RenderCtx): string {
  const hosts = towns.filter((t) => t.extraShops?.includes(s.id));
  return [
    infobox(s.name, [
      { label: 'Kind', html: esc(s.kind) },
      { label: 'Price markup', html: `×${esc(s.markup)}` },
      { label: 'Opens', html: s.night ? 'At night only' : s.festival ? 'On its festival day' : '' },
      { label: 'Buys', html: s.buys ? esc(s.buys.join(', ')) : 'Everything' },
      { label: 'Roams', html: s.roams ? `Every ${esc(s.roams.stay)} days` : '' },
      { label: 'Curiosities', html: s.curiosityMult ? `Pays ×${esc(s.curiosityMult)}` : '' },
    ]),
    prose(s.description),
    s.roams ? `${h2('Route')}<p>${s.roams.route.map((t) => townLink(ctx, t)).join(' → ')}</p>` : '',
    hosts.length && !s.roams ? `${h2('Found in')}<p>${hosts.map((t) => townLink(ctx, t.id)).join(', ')}</p>` : '',
    s.stock.length ? h2('Stock') + ul(s.stock.map((r) => esc(stockText(r)))) : '',
    navbox('Shops', [
      { label: 'Town shops', html: shops.filter((x) => !x.festival && !x.roams && x.id !== 'collector').map((x) => ctx.link('shop', x.id)) },
      { label: 'Roaming', html: shops.filter((x) => x.roams || x.id === 'collector').map((x) => ctx.link('shop', x.id)) },
      { label: 'Festival stalls', html: shops.filter((x) => x.festival).map((x) => ctx.link('shop', x.id)) },
    ]),
  ].join('');
}

function stockText(r: ShopDef['stock'][number]): string {
  switch (r.kind) {
    case 'items': return `Always: ${r.ids.map((i) => content.items.find(i)?.name ?? i).join(', ')}`;
    case 'pool': return `${r.count} random ${r.pool} items`;
    case 'gear': return `${r.count} ${r.rarities.join('/')} ${r.categories.join('/')}`;
    case 'recipes': return `${r.count} ${r.professions.join('/')} recipes`;
    case 'divine': return 'Divine items of each god (by devotion)';
    case 'forbidden': return `${r.count} forbidden goods (heretics)`;
    case 'uniques': return `${r.count} ${r.rarities.join('/')} unique items`;
    default: return '';
  }
}

// ------------------------------------------------------------------ treasure maps

function renderTreasure(t: TreasureDef, ctx: RenderCtx): string {
  return [
    infobox(t.name, [
      { label: 'Zone', html: zoneLink(ctx, t.zone) },
      { label: 'Treasure', html: esc(t.item.name) },
      { label: 'Also holds', html: esc(t.bonus) },
      { label: 'Loved by', html: t.item.lovedBy?.length ? t.item.lovedBy.map((g) => ctx.linkIf('god', g)).join(', ') : '' },
    ]),
    h2('Clue'),
    `<blockquote>${esc(t.clue)}</blockquote>`,
    h2('Treasure'),
    `<p>${ctx.linkIf('item', t.id, t.item.name)}: ${esc(t.item.description)}</p>`,
    `<p class="muted">Maps drop from chests in ${zoneLink(ctx, t.zone)} and from its world boss; the dig spot is placed on the zone map.</p>`,
  ].join('');
}

function listTreasures(entries: readonly TreasureDef[], ctx: RenderCtx): string {
  const by = groupBy(entries, (t) => t.zone);
  return zones
    .filter((z) => by.has(z.id))
    .map((z) => details(`${zoneLink(ctx, z.id)} <span class="muted">${by.get(z.id)!.length} maps</span>`, table(by.get(z.id)!, [
      { label: 'Map', cell: (t) => ctx.link('treasure', t.id), sort: (t) => t.name },
      { label: 'Treasure', cell: (t) => esc(t.item.name) },
      { label: 'Also', cell: (t) => esc(t.bonus) },
    ])))
    .join('');
}

function listShops(entries: readonly ShopDef[], ctx: RenderCtx): string {
  const t = (rows: ShopDef[]): string =>
    table(rows, [
      { label: 'Shop', cell: (s) => ctx.link('shop', s.id), sort: (s) => s.name },
      { label: 'Kind', cell: (s) => esc(s.kind) },
      { label: 'Markup', cell: (s) => `×${esc(s.markup)}`, sort: (s) => s.markup, className: 'num' },
      { label: 'About', cell: (s) => esc(s.description) },
    ]);
  return t(entries.filter((s) => !s.festival)) + details(`Festival stalls ${entries.filter((s) => s.festival).length}`, t(entries.filter((s) => s.festival)));
}

function listWeather(entries: readonly WeatherDef[], ctx: RenderCtx): string {
  return table(entries, [
    { label: 'Weather', cell: (w) => ctx.link('weather', w.id), sort: (w) => w.name },
    { label: 'Encounters', cell: (w) => `×${esc(w.encounterMult)}`, sort: (w) => w.encounterMult, className: 'num' },
    { label: 'Effects', cell: (w) => mods(w.modifiers) || '—' },
  ]);
}

function listFactions(entries: readonly FactionDef[], ctx: RenderCtx): string {
  return table(entries, [
    { label: 'Faction', cell: (f) => ctx.link('faction', f.id), sort: (f) => f.name },
    { label: 'Hall', cell: (f) => townLink(ctx, f.hall) },
    { label: 'God', cell: (f) => ctx.linkIf('god', f.god) },
    { label: 'Rivals', cell: (f) => f.rivals.map((r) => ctx.link('faction', r)).join(', ') || '—' },
  ]);
}

// ------------------------------------------------------------------ section

export const worldSection = simpleSection({
  id: 'world',
  title: 'World',
  group: 'World',
  blurb: 'Zones, towns, dungeons, quests, people and lore.',
  tables: [
    { ns: 'zone', label: 'Zones', blurb: 'The road from the Meadowlands to the Dark Citadel, and the realms beyond.', category: 'Zones', entries: zones, render: renderZone, list: listZones, summary: (z: ZoneDef) => `Levels ${levels(z.levels)}. ${z.description}`, spoiler: (z: ZoneDef) => z.ngPlus !== undefined },
    { ns: 'town', label: 'Towns', blurb: 'Where to rest, shop, pray and join a faction.', category: 'Towns', entries: towns, render: renderTown, list: listTowns, spoiler: (t: TownDef) => zoneSpoiler(t.zone) },
    { ns: 'dungeon', label: 'Dungeons', blurb: 'Room-by-room delves, each with a boss.', category: 'Dungeons', entries: dungeons, render: renderDungeon, list: listDungeons, summary: (d: DungeonDef) => `Level ${d.level}, ${d.rooms} rooms. ${d.description}`, spoiler: (d: DungeonDef) => zoneSpoiler(d.zone) },
    { ns: 'area', label: 'Areas', blurb: 'Side maps off each zone: clearings, ruins, caves and camps.', category: 'Areas', entries: areas, render: renderArea, list: listAreas, spoiler: (a: AreaDef) => zoneSpoiler(a.zone) || a.hidden === true },
    { ns: 'quest', label: 'Quests', blurb: 'Every quest, by kind and zone.', category: 'Quests', entries: quests, render: renderQuest, list: listQuests, summary: (q: QuestDef) => q.summary, spoiler: questSpoiler, categories: (q: QuestDef) => [KIND_LABEL[q.kind]] },
    { ns: 'npc', label: 'NPCs', blurb: 'The people of the road, by town.', category: 'NPCs', entries: npcs, render: renderNpc, list: listNpcs, summary: (n: NpcDef) => `${n.title}. ${n.greeting}`, spoiler: npcSpoiler },
    { ns: 'companion', label: 'Companions', blurb: 'Allies who join your party.', category: 'Companions', entries: companions, render: renderCompanion, list: listCompanions, summary: (c: CompanionDef) => `${c.title}. ${c.bio}` },
    { ns: 'faction', label: 'Factions', blurb: 'Reputation, ranks and rivals.', category: 'Factions', entries: factions, render: renderFaction, list: listFactions },
    { ns: 'lore', label: 'Lore', blurb: 'Pages of history, grouped by zone.', category: 'Lore', entries: lore, render: renderLore, list: listLore, summary: (l: LoreDef) => l.text, title: (l: LoreDef) => l.title, spoiler: loreSpoiler },
    { ns: 'weather', label: 'Weather', blurb: 'Skies that change fights and encounter rates.', category: 'Weather', entries: weathers, render: renderWeather, list: listWeather },
    { ns: 'shop', label: 'Shops', blurb: 'Town shops, roaming merchants and festival stalls.', category: 'Shops', entries: shops, render: renderShop, list: listShops },
    { ns: 'treasure', label: 'Treasure maps', blurb: 'One unique treasure per map, grouped by zone.', category: 'Treasure maps', entries: treasures, render: renderTreasure, list: listTreasures, summary: (t: TreasureDef) => `${t.item.name}. ${t.clue}` },
  ],
});
