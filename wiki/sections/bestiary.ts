/**
 * Bestiary: enemies, encounters, status effects, elite affixes and summons.
 * Cross-reference indexes (where an enemy appears, which skills inflict a
 * status) are built once at load by scanning the content tables.
 */
import { content } from '../../src/data';
import { BOSS_LINES } from '../../src/data/bestiary/bossDialogue';
import { BOSS } from '../../src/data/combat';
import { BESTIARY, CREATURE_TYPE_NAMES, KNOWLEDGE_NAMES } from '../../src/data/bestiary/bestiary';
import { SECRET_BOSS_LINES } from '../../src/data/story/secretLines';
import type { StatusDef } from '../../src/data/statuses';
import { scaleCombatStats } from '../../src/engine/combat/combatants';
import type { BossScriptDef, CombatStatsDef, EliteAffixDef, EncounterDef, EnemyDef, SummonDef } from '../../src/engine/combat/types';
import type { EffectSpec, TriggeredEffect } from '../../src/engine/effects/types';
import { simpleSection, type TableSpec } from '../core/generic';
import { ELEMENT_COLORS, callout, esc, h2, infobox, joinHtml, mods, navbox, prose, table, tag, ul } from '../core/html';
import type { RenderCtx } from '../core/types';

const enemies = content.enemies.all();
const encounters = content.encounters.all();
const statuses = content.statuses.all();
const affixes = content.eliteAffixes.all();
const summons = content.summons.all();
const zones = content.zones.all();
const dungeons = content.dungeons.all();

const BOSS_TIERS = ['miniboss', 'boss', 'worldBoss', 'punisher'];
const TIER_NAMES: Record<string, string> = { normal: 'Normal', elite: 'Elite', champion: 'Champion', miniboss: 'Miniboss', boss: 'Boss', worldBoss: 'World boss', punisher: 'Punisher' };
const isBoss = (e: EnemyDef): boolean => BOSS_TIERS.includes(e.tier);
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const typeName = (t: string): string => CREATURE_TYPE_NAMES[t] ?? cap(t);

// ---------------------------------------------------------------- indexes

const push = <K, V>(m: Map<K, V[]>, k: K, v: V): void => {
  const a = m.get(k);
  if (!a) m.set(k, [v]);
  else if (!a.includes(v)) a.push(v);
};

const encountersOf = new Map<string, EncounterDef[]>();
for (const enc of encounters) for (const x of enc.enemies) push(encountersOf, x.enemyId, enc);

const zonesOf = new Map<string, string[]>();
const dungeonsOf = new Map<string, string[]>();
for (const z of zones) {
  for (const g of [...z.encounters, ...z.roaming]) for (const x of g.enemies) push(zonesOf, x.enemyId, z.id);
  push(zonesOf, z.worldBoss, z.id);
}
for (const d of dungeons) {
  for (const g of d.encounters) for (const x of g.enemies) push(dungeonsOf, x.enemyId, d.id);
  push(dungeonsOf, d.boss, d.id);
}
const zoneById = new Map(zones.map((z) => [z.id, z]));
const dungeonZone = new Map(dungeons.map((d) => [d.id, d.zone]));

/** Enemies found only in New Game+ regions. */
function ngOnly(id: string): boolean {
  const zs = [...(zonesOf.get(id) ?? []), ...(dungeonsOf.get(id) ?? []).map((d) => dungeonZone.get(d)!)];
  return zs.length > 0 && zs.every((z) => zoneById.get(z)?.ngPlus !== undefined);
}
const spoilerEnemy = (e: EnemyDef): boolean => !!e.teaches || e.id in SECRET_BOSS_LINES || ngOnly(e.id);
const spoilerIds = new Set(enemies.filter(spoilerEnemy).map((e) => e.id));

/** Effects of a skill, including those inside triggers. */
function effectsOf(list: readonly EffectSpec[] | undefined, trig?: readonly TriggeredEffect[]): EffectSpec[] {
  return [...(list ?? []), ...(trig ?? []).flatMap((t) => t.effects)];
}

const skillsApplying = new Map<string, string[]>();
const skillsSummoning = new Map<string, string[]>();
for (const sk of content.skills.all()) {
  for (const ef of effectsOf(sk.effects)) {
    if (ef.kind === 'applyStatus') push(skillsApplying, ef.status, sk.id);
    if (ef.kind === 'summon') push(skillsSummoning, ef.summonId, sk.id);
  }
}
const usersOfSkill = new Map<string, string[]>();
for (const e of enemies) for (const s of e.skills) push(usersOfSkill, s.id, e.id);
const scripts = new Map(content.bossScripts.all().map((s) => [s.id, s]));

// ---------------------------------------------------------------- shared bits

const elementTag = (el: string): string => tag(cap(el), ELEMENT_COLORS[el]);
const skillLink = (ctx: RenderCtx, id: string): string => ctx.linkIf('skill', id, content.skills.find(id)?.name ?? id);
const statusLink = (ctx: RenderCtx, id: string): string => ctx.linkIf('status', id, content.statuses.find(id)?.name ?? id);
const enemyLink = (ctx: RenderCtx, id: string): string => ctx.linkIf('enemy', id, content.enemies.find(id)?.name ?? id);
const spoilerTag = (id: string): string => (spoilerIds.has(id) ? ' ' + tag('spoiler', '#c0392b') : '');

const AI_TEXT: Record<string, string> = {
  aggressive: 'Aggressive: goes for damage and the weakest target.',
  defensive: 'Defensive: guards and protects itself before attacking.',
  healer: 'Healer: patches up wounded allies first.',
  caster: 'Caster: prefers skills over the basic attack.',
  summoner: 'Summoner: calls reinforcements.',
  assassin: 'Assassin: picks off fragile targets.',
  support: 'Support: buffs allies and hinders the party.',
};

function statusesIn(ctx: RenderCtx, list: readonly EffectSpec[]): string[] {
  return [...new Set(list.filter((e): e is Extract<EffectSpec, { kind: 'applyStatus' }> => e.kind === 'applyStatus').map((e) => e.status))].map((s) => statusLink(ctx, s));
}

function statsTable(def: CombatStatsDef, tier: EnemyDef['tier'], levels: number[]): string {
  type R = { level: number; s: ReturnType<typeof scaleCombatStats> };
  return table<R>(
    levels.map((level) => ({ level, s: scaleCombatStats(def, level, tier) })),
    [
      { label: 'Level', cell: (r) => esc(r.level), sort: (r) => r.level },
      { label: 'HP', cell: (r) => esc(r.s.hp), sort: (r) => r.s.hp, className: 'num' },
      { label: 'Attack', cell: (r) => esc(r.s.attack), sort: (r) => r.s.attack, className: 'num' },
      { label: 'Magic', cell: (r) => esc(r.s.magic), sort: (r) => r.s.magic, className: 'num' },
      { label: 'Defense', cell: (r) => esc(r.s.defense), sort: (r) => r.s.defense, className: 'num' },
      { label: 'M.Resist', cell: (r) => esc(r.s.magicResist), sort: (r) => r.s.magicResist, className: 'num' },
      { label: 'Speed', cell: (r) => esc(r.s.speed), sort: (r) => r.s.speed, className: 'num' },
    ],
  );
}

function lootSummary(tableId: string, depth = 0): string[] {
  const t = content.lootTables.find(tableId);
  if (!t || depth > 2) return [];
  const total = t.entries.reduce((a, e) => a + e.weight, 0) || 1;
  const out: string[] = [];
  for (const e of t.entries) {
    const pct = `${Math.round((e.weight / total) * 100)}%`;
    if (e.kind === 'item') out.push(`__item:${e.itemId}:${pct}`);
    else if (e.kind === 'gear') out.push(`__txt:${pct} ${e.minRarity ? cap(e.minRarity) + '+ ' : ''}${e.categories ? e.categories.join('/') : 'gear'}`);
    else if (e.kind === 'pool') out.push(`__txt:${pct} ${e.pool}${e.qty ? ` ×${e.qty[0] === e.qty[1] ? e.qty[0] : e.qty.join('–')}` : ''}`);
    else if (e.kind === 'table') out.push(...lootSummary(e.tableId, depth + 1));
  }
  return out;
}

function lootHtml(ctx: RenderCtx, e: EnemyDef): string {
  const t = content.lootTables.find(e.lootTable);
  if (!t) return '<p class="muted">No loot table.</p>';
  const rows = lootSummary(e.lootTable).map((r) => {
    if (r.startsWith('__item:')) {
      const [, id, pct] = r.split(':');
      return `${esc(pct)} ${ctx.linkIf('item', id!)}`;
    }
    return esc(r.slice(6));
  });
  const head = `<p>${esc(t.rolls[0] === t.rolls[1] ? t.rolls[0] : t.rolls.join('–'))} roll(s)${t.goldChance ? `, ${Math.round(t.goldChance * 100)}% chance of gold (×${esc(t.goldMult)})` : ''}.${e.teaches ? ` Guards the technique ${skillLink(ctx, e.teaches)}.` : ''}</p>`;
  return head + ul(rows);
}

function whereHtml(ctx: RenderCtx, id: string): string {
  const zs = zonesOf.get(id) ?? [];
  const ds = dungeonsOf.get(id) ?? [];
  const es = encountersOf.get(id) ?? [];
  const parts: string[] = [];
  if (zs.length) parts.push(`<p><b>Zones:</b> ${joinHtml(zs.map((z) => ctx.linkIf('zone', z, zoneById.get(z)?.name)))}</p>`);
  if (ds.length) parts.push(`<p><b>Dungeons:</b> ${joinHtml(ds.map((d) => ctx.linkIf('dungeon', d, content.dungeons.find(d)?.name)))}</p>`);
  const eids = [...new Set(es.map((x) => x.id))];
  if (eids.length) parts.push(`<p><b>Encounters (${eids.length}):</b> ${eids.slice(0, 12).map((x) => ctx.link('encounter', x)).join(', ')}${eids.length > 12 ? ` and ${eids.length - 12} more` : ''}</p>`);
  const phases = [...scripts.values()].filter((s) => s.phases.some((p) => p.adds?.includes(id))).map((s) => enemyLink(ctx, s.id));
  if (phases.length) parts.push(`<p><b>Summoned as an add by:</b> ${phases.join(', ')}</p>`);
  return parts.join('') || '<p class="muted">Not placed in any zone, dungeon or encounter (appears through quests, systems or special events).</p>';
}

function bossSection(ctx: RenderCtx, e: EnemyDef): string {
  const sc: BossScriptDef | undefined = scripts.get(e.id);
  const lines = BOSS_LINES[e.id] ?? SECRET_BOSS_LINES[e.id];
  const out: string[] = [];
  if (sc) {
    out.push(h2('Boss script'));
    out.push(`<p>Enrages after ${esc(sc.enrageTurns ?? BOSS.enrageTurns[e.tier] ?? 50)} of its own turns${sc.enrageText ? `: <i>${esc(sc.enrageText)}</i>` : ''}.</p>`);
    out.push(
      table(
        sc.phases,
        [
          { label: 'At HP', cell: (p) => `${esc(p.hpPct)}%`, sort: (p) => p.hpPct },
          { label: 'Phase', cell: (p) => `<b>${esc(p.name)}</b><br><span class="muted">${esc(p.text)}</span>` },
          {
            label: 'Changes',
            cell: (p) =>
              [
                p.modifiers?.length ? mods(p.modifiers) : '',
                p.skills?.length ? `New skills: ${p.skills.map((s) => skillLink(ctx, s.id)).join(', ')}` : '',
                p.adds?.length ? `Adds: ${p.adds.map((a) => enemyLink(ctx, a)).join(', ')}` : '',
                p.effects?.length ? statusesIn(ctx, p.effects).map((s) => `Inflicts ${s}`).join(', ') : '',
              ]
                .filter(Boolean)
                .join('<br>'),
          },
        ],
      ),
    );
    if (sc.telegraphs.length) {
      out.push(h2('Telegraphed attacks'));
      out.push('<p class="muted">The boss winds up for a turn; break its stagger bar to interrupt, or Defend to halve the hit.</p>');
      out.push(
        table(sc.telegraphs, [
          { label: 'Skill', cell: (t) => skillLink(ctx, t.skillId) },
          { label: 'Every', cell: (t) => `${esc(t.every)} turns`, sort: (t) => t.every },
          { label: 'From phase', cell: (t) => esc((t.fromPhase ?? 0) + 1), sort: (t) => t.fromPhase ?? 0 },
          { label: 'Warning', cell: (t) => `<i>${esc(t.warning)}</i>` },
        ]),
      );
    }
  }
  if (lines) {
    out.push(h2('Dialogue'));
    out.push(ul([`<b>Before:</b> ${esc(lines[0])}`, `<b>At half health:</b> ${esc(lines[1])}`, `<b>When defeated:</b> ${esc(lines[2])}`]));
  }
  return out.join('');
}

function enemyNavbox(ctx: RenderCtx, e: EnemyDef): string {
  const sameFamily = enemies.filter((x) => x.family === e.family && x.id !== e.id && !spoilerIds.has(x.id)).slice(0, 14);
  return navbox('Bestiary', [
    { label: `More ${cap(e.family)}`, html: sameFamily.map((x) => ctx.link('enemy', x.id)) },
    { label: 'Lists', html: [ctx.link('enemy', 'index', 'All enemies'), ctx.link('encounter', 'index'), ctx.link('status', 'index'), ctx.link('elite-affix', 'index'), ctx.link('summon', 'index')] },
  ]);
}

function renderEnemy(e: EnemyDef, ctx: RenderCtx): string {
  const resists = Object.entries(e.resists ?? {}).filter(([, v]) => v);
  const levels = [...new Set([e.level, e.level + 10, e.level + 25])];
  const sc = scaleCombatStats(e.stats, e.level, e.tier);
  const box = infobox(
    e.name,
    [
      { label: 'Family', html: esc(cap(e.family)) },
      { label: 'Types', html: esc(e.types.map(typeName).join(', ')) },
      { label: 'Level', html: esc(e.level) },
      { label: 'Tier', html: esc(TIER_NAMES[e.tier] ?? e.tier) },
      { label: 'Row', html: esc(cap(e.row)) },
      { label: 'AI', html: esc(cap(e.ai)) },
      { label: 'HP', html: esc(sc.hp) },
      { label: 'Attack / Magic', html: `${esc(sc.attack)} / ${esc(sc.magic)}` },
      { label: 'Defense / Resist', html: `${esc(sc.defense)} / ${esc(sc.magicResist)}` },
      { label: 'Speed', html: esc(sc.speed) },
      { label: 'XP', html: esc(e.xp) },
      { label: 'Basic attack', html: `${esc(e.basicAttack.name)} ${elementTag(e.basicAttack.element)}` },
      { label: 'Resists', html: resists.map(([el, v]) => `${elementTag(el)} ${v > 0 ? '+' : ''}${esc(v)}%`).join(' ') },
      { label: 'Teaches', html: e.teaches ? skillLink(ctx, e.teaches) : '' },
    ],
    { color: e.palette.main },
  );
  const weak = resists.filter(([, v]) => v < 0).map(([el]) => cap(el));
  const strong = resists.filter(([, v]) => v >= 50).map(([el]) => cap(el));
  const bits = [
    weak.length ? `Weak to ${weak.join(', ')}.` : '',
    strong.length ? `Strongly resists ${strong.join(', ')}.` : '',
  ].filter(Boolean);
  const body = [
    box,
    spoilerIds.has(e.id) ? callout('warn', '<p>Secret, New Game+ or story-locked foe.</p>') : '',
    prose(e.description),
    bits.length ? `<p>${esc(bits.join(' '))}</p>` : '',
    h2('Combat'),
    `<p>${esc(AI_TEXT[e.ai] ?? e.ai)} Basic attack: <b>${esc(e.basicAttack.name)}</b> (${esc(e.basicAttack.element)}, ${e.basicAttack.ranged ? 'ranged' : 'melee'}${e.basicAttack.magic ? ', magic' : ''}).</p>`,
    e.flags?.length ? `<p class="muted">Rules: ${esc(e.flags.join(', '))}</p>` : '',
    e.skills.length
      ? table(
          e.skills,
          [
            { label: 'Skill', cell: (s) => skillLink(ctx, s.id), sort: (s) => content.skills.find(s.id)?.name ?? s.id },
            { label: 'Element', cell: (s) => elementTag(content.skills.find(s.id)?.element ?? 'physical') },
            { label: 'Cooldown', cell: (s) => esc(content.skills.find(s.id)?.cooldown ?? 0), className: 'num' },
            { label: 'Weight', cell: (s) => esc(s.weight ?? 1), className: 'num' },
            { label: 'Inflicts', cell: (s) => joinHtml(statusesIn(ctx, effectsOf(content.skills.find(s.id)?.effects))) },
            { label: 'Effect', cell: (s) => esc(content.skills.find(s.id)?.description ?? '') },
          ],
        )
      : '<p class="muted">Uses only its basic attack.</p>',
    e.triggers?.length ? ul(e.triggers.map((t) => esc(t.description ?? t.id))) : '',
    e.modifiers?.length ? `<p>Passive: ${mods(e.modifiers)}</p>` : '',
    h2('Stats by level'),
    `<p class="muted">Level-1 base numbers grown by the game's enemy scaling; zone threat adds more.</p>`,
    statsTable(e.stats, e.tier, levels),
    h2('Loot'),
    lootHtml(ctx, e),
    h2('Where to find'),
    whereHtml(ctx, e.id),
    isBoss(e) ? bossSection(ctx, e) : '',
    h2('Bestiary knowledge'),
    `<p class="muted">Kills needed to learn each part of the entry (${esc(KNOWLEDGE_NAMES.slice(1).join(' / '))}): ${(isBoss(e) ? BESTIARY.bossKnowledge : BESTIARY.knowledge).join(' / ')}.</p>`,
    enemyNavbox(ctx, e),
  ];
  return body.join('');
}

// ---------------------------------------------------------------- enemy list

function enemyRow(ctx: RenderCtx) {
  return [
    { label: 'Name', cell: (e: EnemyDef) => ctx.link('enemy', e.id) + spoilerTag(e.id), sort: (e: EnemyDef) => e.name },
    { label: 'Lv', cell: (e: EnemyDef) => esc(e.level), sort: (e: EnemyDef) => e.level, className: 'num' },
    { label: 'Tier', cell: (e: EnemyDef) => esc(TIER_NAMES[e.tier]), sort: (e: EnemyDef) => BOSS_TIERS.concat(['normal']).indexOf(e.tier) },
    { label: 'Types', cell: (e: EnemyDef) => esc(e.types.map(typeName).join(', ')) },
    { label: 'Weak to', cell: (e: EnemyDef) => Object.entries(e.resists ?? {}).filter(([, v]) => v < 0).map(([el]) => elementTag(el)).join(' ') },
  ];
}

function listEnemies(all: readonly EnemyDef[], ctx: RenderCtx): string {
  const bosses = all.filter(isBoss).sort((a, b) => a.level - b.level);
  const byFamily = new Map<string, EnemyDef[]>();
  for (const e of all) if (!isBoss(e)) push(byFamily, e.family, e);
  const groups = [...byFamily.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  return [
    `<details><summary><b>Bosses</b> <span class="muted">${bosses.length} minibosses, bosses, world bosses and punishers</span></summary>${table(bosses, enemyRow(ctx), { filter: true })}</details>`,
    `<p>${all.length - bosses.length} other enemies by family:</p>`,
    ...groups.map(
      ([fam, list]) =>
        `<details><summary><b>${esc(cap(fam))}</b> <span class="muted">${list.length}</span></summary>${table(list.sort((a, b) => a.level - b.level), enemyRow(ctx), { filter: list.length > 12 })}</details>`,
    ),
  ].join('');
}

// ---------------------------------------------------------------- encounters

function renderEncounter(enc: EncounterDef, ctx: RenderCtx): string {
  const ids = [...new Set(enc.enemies.map((x) => x.enemyId))];
  const zs = [...new Set(ids.flatMap((i) => zonesOf.get(i) ?? []))];
  const ds = dungeons.filter((d) => ids.includes(d.boss) || d.encounters.some((g) => g.enemies.some((x) => ids.includes(x.enemyId)))).map((d) => d.id);
  const box = infobox(enc.name, [
    { label: 'Level', html: enc.scalesToHero ? 'Matches the hero' : esc(enc.level) },
    { label: 'Enemies', html: esc(enc.enemies.length) },
    { label: 'Flee', html: enc.canFlee ? 'Allowed' : 'Cannot flee' },
    { label: 'Boss fight', html: enc.isBoss ? 'Yes' : '' },
    { label: 'Threat', html: enc.threat ? `+${esc(enc.threat)}%` : '' },
  ]);
  return [
    box,
    ids.some((i) => spoilerIds.has(i)) ? callout('warn', '<p>Includes a secret, New Game+ or story-locked foe.</p>') : '',
    prose(enc.description),
    h2('Enemies'),
    table(
      enc.enemies,
      [
        { label: 'Enemy', cell: (x) => enemyLink(ctx, x.enemyId) + spoilerTag(x.enemyId), sort: (x) => content.enemies.find(x.enemyId)?.name ?? x.enemyId },
        { label: 'Level', cell: (x) => esc(x.level ?? enc.level), className: 'num' },
        { label: 'Tier', cell: (x) => esc(TIER_NAMES[x.tier ?? content.enemies.find(x.enemyId)?.tier ?? 'normal']) },
        { label: 'Row', cell: (x) => esc(cap(x.row ?? content.enemies.find(x.enemyId)?.row ?? 'front')) },
      ],
    ),
    h2('Rules'),
    ul([
      enc.canFlee ? 'You may flee this fight.' : 'You cannot flee this fight.',
      enc.scalesToHero ? 'The enemies match your level.' : '',
      enc.threat ? `Every enemy has ${esc(enc.threat)}% extra HP and damage.` : '',
    ].filter(Boolean)),
    zs.length || ds.length ? h2('Where it occurs') : '',
    zs.length ? `<p><b>Zones with these enemies:</b> ${zs.map((z) => ctx.linkIf('zone', z, zoneById.get(z)?.name)).join(', ')}</p>` : '',
    ds.length ? `<p><b>Dungeons:</b> ${ds.map((d) => ctx.linkIf('dungeon', d, content.dungeons.find(d)?.name)).join(', ')}</p>` : '',
    navbox('Bestiary', [{ label: 'Lists', html: [ctx.link('enemy', 'index', 'All enemies'), ctx.link('encounter', 'index'), ctx.link('status', 'index')] }]),
  ].join('');
}

function listEncounters(all: readonly EncounterDef[], ctx: RenderCtx): string {
  const bands: [string, number, number][] = [['Levels 1–10', 1, 10], ['Levels 11–20', 11, 20], ['Levels 21–35', 21, 35], ['Levels 36–50', 36, 50], ['Levels 51+', 51, 999]];
  const cols = [
    { label: 'Name', cell: (e: EncounterDef) => ctx.link('encounter', e.id), sort: (e: EncounterDef) => e.name },
    { label: 'Lv', cell: (e: EncounterDef) => esc(e.level), sort: (e: EncounterDef) => e.level, className: 'num' },
    { label: 'Enemies', cell: (e: EncounterDef) => joinHtml([...new Set(e.enemies.map((x) => x.enemyId))].slice(0, 6).map((i) => enemyLink(ctx, i))) },
    { label: 'Flee', cell: (e: EncounterDef) => (e.canFlee ? 'Yes' : 'No') },
  ];
  return bands
    .map(([label, lo, hi]) => {
      const list = all.filter((e) => e.level >= lo && e.level <= hi).sort((a, b) => a.level - b.level);
      return list.length ? `<details><summary><b>${label}</b> <span class="muted">${list.length}</span></summary>${table(list, cols, { filter: true })}</details>` : '';
    })
    .join('');
}

// ---------------------------------------------------------------- statuses

function renderStatus(s: StatusDef, ctx: RenderCtx): string {
  const appliers = skillsApplying.get(s.id) ?? [];
  const bearers = enemies.filter((e) => e.skills.some((k) => appliers.includes(k.id)));
  const rules = [
    s.skipTurn ? 'Loses the turn entirely.' : '',
    s.skipChance ? `${Math.round(s.skipChance * 100)}% chance to lose the turn.` : '',
    s.noSkills ? 'Cannot use skills.' : '',
    s.charmed ? 'Attacks its own allies.' : '',
    s.stealth ? 'Next damaging action crits; single-target enemy attacks avoid the bearer.' : '',
    s.taunt ? 'Single-target enemy attacks must pick this unit if reachable.' : '',
    s.breakOnDamage ? 'Ends when the bearer takes damage.' : '',
  ].filter(Boolean);
  const box = infobox(
    s.name,
    [
      { label: 'Kind', html: esc(cap(s.kind)) },
      { label: 'Stacking', html: s.stacking === 'stack' ? `Stacks up to ${esc(s.maxStacks)}` : 'Refreshes duration' },
      { label: 'Damage over time', html: s.dot ? `${elementTag(s.dot.element)} ${esc(Math.round(s.dot.powerRatio * 100))}% power per stack${s.dot.percentMaxHp ? ` + ${esc(s.dot.percentMaxHp)}% max HP` : ''}` : '' },
      { label: 'Healing', html: s.hot ? `${esc(s.hot.percentMaxHp)}% max HP per turn` : '' },
      { label: 'Applied by', html: appliers.length ? `${esc(appliers.length)} skills` : '' },
    ],
    { color: s.color },
    // glyph shown as caption
  );
  return [
    box,
    prose(s.description),
    h2('Effects'),
    ul([...rules, s.modifiers?.length ? `${mods(s.modifiers)}${s.perStack ? ' (per stack)' : ''}` : ''].filter(Boolean)) || '<p class="muted">Pure marker; see the description.</p>',
    s.dot ? '<p class="muted">Damage and healing happen at the start of the bearer\'s turn; durations tick down at the end of it.</p>' : '',
    h2('Skills that apply it'),
    appliers.length
      ? table(
          appliers.map((id) => content.skills.get(id)),
          [
            { label: 'Skill', cell: (k) => ctx.linkIf('skill', k.id, k.name), sort: (k) => k.name },
            { label: 'Source', cell: (k) => esc(k.source) },
            { label: 'Element', cell: (k) => elementTag(k.element) },
          ],
          { filter: appliers.length > 12 },
        )
      : '<p class="muted">No skill applies it directly (it comes from items, triggers or story events).</p>',
    bearers.length ? `${h2('Enemies that inflict it')}<p>${esc(bearers.length)} enemies, for example ${bearers.slice(0, 12).map((e) => ctx.link('enemy', e.id)).join(', ')}.</p>` : '',
    navbox('Status effects', [
      { label: 'Debuffs', html: statuses.filter((x) => x.kind === 'debuff').map((x) => ctx.link('status', x.id)) },
      { label: 'Buffs', html: statuses.filter((x) => x.kind === 'buff').map((x) => ctx.link('status', x.id)) },
    ]),
  ].join('');
}

function listStatuses(all: readonly StatusDef[], ctx: RenderCtx): string {
  const row = (list: readonly StatusDef[]): string =>
    table(
      list,
      [
        { label: 'Status', cell: (s) => ctx.link('status', s.id), sort: (s) => s.name },
        { label: 'Stacking', cell: (s) => (s.stacking === 'stack' ? `Stack ×${esc(s.maxStacks)}` : 'Refresh') },
        { label: 'Damage', cell: (s) => (s.dot ? elementTag(s.dot.element) : '') },
        { label: 'Skills', cell: (s) => esc((skillsApplying.get(s.id) ?? []).length), sort: (s) => (skillsApplying.get(s.id) ?? []).length, className: 'num' },
        { label: 'Summary', cell: (s) => esc(s.description) },
      ],
      { filter: true },
    );
  return [
    `<h2 id="debuffs">Debuffs</h2>${row(all.filter((s) => s.kind === 'debuff'))}`,
    `<details><summary><b>Buffs</b> <span class="muted">${all.filter((s) => s.kind === 'buff').length}</span></summary>${row(all.filter((s) => s.kind === 'buff'))}</details>`,
  ].join('');
}

// ---------------------------------------------------------------- affixes

function renderAffix(a: EliteAffixDef, ctx: RenderCtx): string {
  const box = infobox(a.name, [
    { label: 'Effect', html: esc(a.description) },
    { label: 'Never on', html: a.notFor?.length ? esc(a.notFor.map(typeName).join(', ')) : '' },
    { label: 'Rules', html: a.flags?.length ? esc(a.flags.join(', ')) : '' },
  ]);
  return [
    box,
    `<p>Elite and champion enemies can roll the <b>${esc(a.name)}</b> affix, shown as a prefix on the name (e.g. "${esc(a.name)} ${esc(enemies.find((e) => e.tier === 'elite' && !a.notFor?.some((t) => e.types.includes(t)))?.name ?? 'Wolf')}").</p>`,
    prose(a.description),
    h2('Modifiers'),
    a.modifiers?.length ? `<p>${mods(a.modifiers)}</p>` : '<p class="muted">No stat changes.</p>',
    a.triggers?.length ? `${h2('Triggers')}${ul(a.triggers.map((t) => esc(t.description ?? `${t.id} (${t.trigger}${t.chance ? `, ${t.chance}%` : ''})`) + (statusesIn(ctx, t.effects).length ? `: ${statusesIn(ctx, t.effects).join(', ')}` : '')))}` : '',
    navbox('Elite affixes', [{ label: 'All', html: affixes.map((x) => ctx.link('elite-affix', x.id)) }]),
  ].join('');
}

function listAffixes(all: readonly EliteAffixDef[], ctx: RenderCtx): string {
  return table(
    all,
    [
      { label: 'Affix', cell: (a) => ctx.link('elite-affix', a.id), sort: (a) => a.name },
      { label: 'Effect', cell: (a) => esc(a.description) },
      { label: 'Stat changes', cell: (a) => mods(a.modifiers) },
      { label: 'Never on', cell: (a) => esc((a.notFor ?? []).map(typeName).join(', ')) },
    ],
    { filter: all.length > 12 },
  );
}

// ---------------------------------------------------------------- summons

function renderSummon(s: SummonDef, ctx: RenderCtx): string {
  const by = (skillsSummoning.get(s.id) ?? []).map((id) => skillLink(ctx, id));
  const classes = content.classes.all().filter((c) => c.startingSummon === s.id).map((c) => ctx.link('class', c.id));
  const box = infobox(
    s.name,
    [
      { label: 'Family', html: esc(cap(s.family)) },
      { label: 'Types', html: esc(s.types.map(typeName).join(', ')) },
      { label: 'Base HP', html: esc(s.stats.hp) },
      { label: 'Attack / Magic', html: `${esc(s.stats.attack)} / ${esc(s.stats.magic)}` },
      { label: 'Defense / Resist', html: `${esc(s.stats.defense)} / ${esc(s.stats.magicResist)}` },
      { label: 'Speed', html: esc(s.stats.speed) },
      { label: 'Owner power', html: `+${esc(Math.round(s.ownerPowerShare * 100))}% of owner's attack and magic` },
      { label: 'Duration', html: s.duration ? `${esc(s.duration)} turns` : 'Whole battle' },
      { label: 'AI', html: esc(cap(s.ai)) },
      { label: 'Basic attack', html: `${esc(s.basicAttack.name)} ${elementTag(s.basicAttack.element)}` },
    ],
    { color: s.palette.main },
  );
  return [
    box,
    `<p>${esc(s.name)} is an ally called into battle. It scales with whoever summons it.</p>`,
    h2('Skills'),
    s.skills.length ? ul(s.skills.map((k) => `${skillLink(ctx, k.id)} <span class="muted">${esc(content.skills.find(k.id)?.description ?? '')}</span>`)) : '<p class="muted">Basic attack only.</p>',
    h2('Summoned by'),
    by.length || classes.length ? `<p>${[...by, ...classes.map((c) => `${c} (starts with it)`)].join(', ')}</p>` : '<p class="muted">Not summoned by any skill directly.</p>',
    navbox('Summons', [{ label: 'All', html: summons.map((x) => ctx.link('summon', x.id)) }]),
  ].join('');
}

function listSummons(all: readonly SummonDef[], ctx: RenderCtx): string {
  return table(
    all,
    [
      { label: 'Summon', cell: (s) => ctx.link('summon', s.id), sort: (s) => s.name },
      { label: 'Family', cell: (s) => esc(cap(s.family)) },
      { label: 'HP', cell: (s) => esc(s.stats.hp), sort: (s) => s.stats.hp, className: 'num' },
      { label: 'Duration', cell: (s) => (s.duration ? `${esc(s.duration)} turns` : 'Battle'), sort: (s) => s.duration ?? 999 },
      { label: 'Skills', cell: (s) => joinHtml(s.skills.map((k) => skillLink(ctx, k.id))) },
      { label: 'Summoned by', cell: (s) => joinHtml((skillsSummoning.get(s.id) ?? []).slice(0, 4).map((id) => skillLink(ctx, id))) },
    ],
    { filter: all.length > 12 },
  );
}

// ---------------------------------------------------------------- section

const enemyTable: TableSpec<EnemyDef> = {
  ns: 'enemy',
  label: 'Enemies',
  blurb: 'Every creature, elite and boss, grouped by family.',
  category: 'Enemies',
  entries: enemies,
  render: renderEnemy,
  summary: (e) => `Level ${e.level} ${TIER_NAMES[e.tier]?.toLowerCase()} ${e.family}. ${e.description}`,
  categories: (e) => [cap(e.family), ...(isBoss(e) ? ['Bosses'] : [])],
  spoiler: spoilerEnemy,
  list: listEnemies,
};

export const bestiarySection = simpleSection({
  id: 'bestiary',
  title: 'Bestiary',
  group: 'Bestiary',
  blurb: 'Every enemy and boss, the encounters they appear in, and the status effects they inflict.',
  tables: [
    enemyTable,
    {
      ns: 'encounter',
      label: 'Encounters',
      blurb: 'Fixed fights: quests, trials, dungeon packs and bosses.',
      category: 'Encounters',
      entries: encounters,
      render: renderEncounter,
      summary: (e) => `Level ${e.level}, ${e.enemies.length} enemies. ${e.description}`,
      spoiler: (e) => e.enemies.some((x) => spoilerIds.has(x.enemyId)),
      list: listEncounters,
    } satisfies TableSpec<EncounterDef>,
    {
      ns: 'status',
      label: 'Status effects',
      blurb: 'Buffs and debuffs: what they do and which skills apply them.',
      category: 'Status effects',
      entries: statuses,
      render: renderStatus,
      summary: (s) => `${cap(s.kind)}. ${s.description}`,
      list: listStatuses,
    } satisfies TableSpec<StatusDef>,
    {
      ns: 'elite-affix',
      label: 'Elite affixes',
      blurb: 'Prefixes rolled onto elites and champions.',
      category: 'Elite affixes',
      entries: affixes,
      render: renderAffix,
      list: listAffixes,
    } satisfies TableSpec<EliteAffixDef>,
    {
      ns: 'summon',
      label: 'Summons',
      blurb: 'Allies called into battle.',
      category: 'Summons',
      entries: summons,
      render: renderSummon,
      summary: (s) => `${cap(s.family)} summon, ${s.duration ? `${s.duration} turns` : 'lasts the battle'}.`,
      list: listSummons,
    } satisfies TableSpec<SummonDef>,
  ],
});
