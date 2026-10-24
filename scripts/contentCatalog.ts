/**
 * Regenerates the generated sections of CONTENT.md from the data files, so
 * the catalogue never drifts from the game. Run with `npm run content:md`.
 * Each section lives between `<!-- name:start -->` and `<!-- name:end -->`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { content } from '../src/data';
import { WEAPON_STAGES } from '../src/data/apostles';
import { APOSTLESHIP, DEVOTION } from '../src/data/devotion';
import { UPGRADE_CHANCE } from '../src/engine/economy/enchanting';
import { MULTICLASS, PROGRESSION } from '../src/data/progression';
import { BOSS, PARTY_SCALING } from '../src/data/combat';
import { ACHIEVEMENT_CATEGORIES } from '../src/data/achievements';
import { HERESY } from '../src/data/heresy';
import { NG_PLUS } from '../src/data/ngPlus';
import { ELITE_AFFIX_RULES } from '../src/data/bestiary/affixes';
import { BESTIARY, KNOWLEDGE_NAMES } from '../src/data/bestiary/bestiary';
import type { SkillTreeDef } from '../src/engine/skills/treeTypes';
import type { ModifierSpec } from '../src/engine/stats/modifiers';

const FILE = new URL('../CONTENT.md', import.meta.url);

function mod(m: ModifierSpec): string {
  const info = content.stats.get(m.stat);
  const v = Math.abs(m.value);
  const sign = m.value >= 0 ? '+' : '-';
  if (m.type === 'flat') return info.format === 'percent' ? `${sign}${v}% ${info.name}` : `${sign}${v} ${info.name}`;
  if (m.type === 'percent') return `${sign}${v}% increased ${info.name}`;
  if (m.type === 'more') return `${v}% ${m.value >= 0 ? 'more' : 'less'} ${info.name}`;
  return `${info.name} = ${m.value}`;
}

const cell = (s: string): string => s.replace(/\|/g, '\\|');

function itemsSection(): string {
  const out: string[] = [];
  const rarityLine = content.rarities
    .all()
    .map((r) => `${r.name} (${r.affixes[0]}-${r.affixes[1]} affixes${r.minNgPlus ? `, NG+${r.minNgPlus}+` : ''}${r.eliteOnly ? ', elites/bosses only' : ''})`)
    .join(' · ');
  out.push(`**Rarities (12):** ${rarityLine}`, '');
  out.push(`**Quality:** ${content.qualities.all().map((q) => `${q.name} x${q.statMult}`).join(' · ')}`, '');

  const weapons = content.items.filter((b) => b.category === 'weapon' && b.tier === 1);
  out.push('### Weapon types (tier 1 shown; 7 tiers each)', '', '| Type | Hands | Damage | Magic | Innate |', '|---|---|---|---|---|');
  for (const b of weapons) {
    if (b.category !== 'weapon') continue;
    out.push(
      `| ${content.weaponTypes.get(b.weaponType).name} | ${b.offhandOnly ? 'off-hand' : b.hands} | ${b.damage?.join('-') ?? (b.armor ? `armor ${b.armor.join('-')}` : '')} | ${b.magic?.join('-') ?? ''} | ${b.implicit.map(mod).join(', ')} |`,
    );
  }
  out.push('', `**Armor:** 8 slots × 4 weights × 7 tiers = ${content.items.filter((b) => b.category === 'armor').length} bases.`);
  out.push(`**Accessories:** ${content.items.filter((b) => b.category === 'accessory').length} bases (rings, amulets, earrings, holy symbols, trinkets with on-use abilities).`, '');

  const uniqueTable = (rarity: string, title: string): void => {
    const list = content.uniques.filter((u) => u.rarity === rarity);
    out.push(`### ${title} (${list.length})`, '', '| Item | Base | Lvl | Effects |', '|---|---|---|---|');
    for (const u of list) {
      const effects = [...u.modifiers.map(mod), ...u.effectText];
      if (u.activeAbility) effects.push(`Use: ${u.activeAbility.name}: ${u.activeAbility.description}`);
      if (u.awakening) effects.push(`Awakens (${u.awakening.description}): ${u.awakening.effectText}`);
      out.push(`| **${u.name}** | ${content.items.get(u.baseId).name} | ${u.level} | ${cell(effects.join('; '))} |`);
    }
    out.push('');
  };
  uniqueTable('legendary', 'Legendaries');
  uniqueTable('mythic', 'Mythics');
  uniqueTable('relic', 'Relics');
  uniqueTable('divine', 'Divine items (favor-gated drops, plus each god-bound weapon stage)');

  out.push(`### Item sets (${content.itemSets.size})`, '');
  for (const set of content.itemSets.all()) {
    out.push(`**${set.name}**${set.classId ? ` (${content.classes.get(set.classId).name})` : ''}: ${set.pieces.map((p) => content.uniques.get(p).name).join(', ')}`);
    for (const b of set.bonuses) out.push(`- (${b.pieces}) ${b.text}`);
    out.push('');
  }

  out.push(`### Runewords (${content.runewords.size})`, '', '| Runeword | Runes | Fits | Effect |', '|---|---|---|---|');
  for (const rw of content.runewords.all()) {
    out.push(`| **${rw.name}** | ${rw.runes.map((r) => content.items.get(r).name.replace(' Rune', '')).join(' + ')} | ${rw.targets.join(', ')} | ${cell([...rw.modifiers.map(mod), rw.text].join('; '))} |`);
  }
  out.push('');

  const runes = content.items.filter((b) => b.category === 'rune');
  out.push(`**Runes (${runes.length}):** ${runes.map((r) => r.name.replace(' Rune', '')).join(', ')}`, '');
  const gemTypes = [...new Set(content.items.filter((b) => b.category === 'gem').map((g) => (g.category === 'gem' ? g.gemType : '')))];
  out.push(`**Gems (${gemTypes.length} types × 5 grades):** ${gemTypes.join(', ')}. Grades: Chipped, Flawed, Clear, Flawless, Perfect.`, '');

  const prefixes = content.affixes.filter((a) => a.kind === 'prefix');
  const suffixes = content.affixes.filter((a) => a.kind === 'suffix');
  out.push(`### Affixes (${content.affixes.size}, 7 tiers each)`, '');
  out.push(`**Prefixes (${prefixes.length}):** ${prefixes.map((a) => `${a.name} (${a.stats.map((s) => content.stats.get(s.stat).name).join('/')})`).join(', ')}`, '');
  out.push(`**Suffixes (${suffixes.length}):** ${suffixes.map((a) => `${a.name} (${a.stats.length > 2 ? 'all resists' : a.stats.map((s) => content.stats.get(s.stat).name).join('/')})`).join(', ')}`, '');
  out.push(`**Corruptions:** boons: ${content.corruptions.filter((x) => x.kind === 'boon').map((x) => `${x.name} (${x.text})`).join(', ')}. Drawbacks: ${content.corruptions.filter((x) => x.kind === 'drawback').map((x) => `${x.name} (${x.text})`).join(', ')}.`, '');

  const consumables = content.items.filter((b) => b.category === 'consumable');
  out.push(`### Consumables (${consumables.length})`, '');
  out.push(consumables.map((b) => `${b.name}${b.description ? `: ${b.description}` : ''}`).map((s) => `- ${s}`).join('\n'), '');
  const materials = content.items.filter((b) => b.category === 'material');
  out.push(`**Materials (${materials.length}):** ${materials.map((m) => m.name).join(', ')}`, '');
  const curios = content.items.filter((b) => b.category === 'curiosity');
  out.push(`**Curiosities (${curios.length}):** ${curios.map((m) => m.name).join(', ')}`, '');
  out.push(`**Mechanic flags (${content.mechanics.size}):** ${content.mechanics.all().map((m) => `\`${m.id}\` (${m.text})`).join(' · ')} · \`immune:<status>\``);
  return out.join('\n');
}

function combatSection(): string {
  const out: string[] = [];
  out.push(`### Status effects (${content.statuses.size})`, '', '| Status | Kind | Effect |', '|---|---|---|');
  for (const st of content.statuses.all()) out.push(`| **${st.name}** | ${st.kind} | ${cell(st.description)} |`);
  out.push('', `### Class ultimates (${content.classes.size})`, '', '| Class | Ultimate | Effect |', '|---|---|---|');
  for (const cls of content.classes.all()) {
    const u = content.skills.get(cls.ultimate);
    out.push(`| ${cls.name} | **${u.name}** | ${cell(u.description)} |`);
  }
  out.push('', `**Songs (${content.songs.size}):** ${content.songs.all().map((s) => `${s.name} (${s.description} Crescendo: ${s.crescendo.description})`).join(' · ')}`);
  out.push('', `**Stances (${content.stances.size}):** ${content.stances.all().map((s) => `${s.name} (${s.description})`).join(' · ')}`, '');
  out.push(`### Enemies (${content.enemies.size})`, '', '| Enemy | Lvl | Tier | Types | Row | AI | Skills | Weak / resists |', '|---|---|---|---|---|---|---|---|');
  for (const e of content.enemies.all()) {
    const res = Object.entries(e.resists ?? {}).map(([el, v]) => `${el} ${v! > 0 ? '+' : ''}${v}%`).join(', ');
    out.push(`| **${e.name}** | ${e.level} | ${e.tier} | ${e.types.join(', ')} | ${e.row} | ${e.ai} | ${e.skills.map((s) => content.skills.get(s.id).name).join(', ')} | ${res} |`);
  }
  out.push('', `**Summons (${content.summons.size}):** ${content.summons.all().map((s) => s.name).join(', ')}`, '');
  out.push(`### Encounters (${content.encounters.size})`, '', '| Encounter | Lvl | Enemies |', '|---|---|---|');
  for (const enc of content.encounters.all()) {
    out.push(`| **${enc.name}** | ${enc.level} | ${enc.enemies.map((e) => content.enemies.get(e.enemyId).name).join(', ')} |`);
  }
  return out.join('\n');
}

/** Class trees only (hybrid trees share the table and are listed under Multiclassing). */
const classTrees = (): SkillTreeDef[] => content.trees.filter((t) => content.classes.has(t.classId));

function treesSection(): string {
  const out: string[] = [];
  const isClassBranch = (tree: SkillTreeDef, id: string): boolean => !tree.branches.find((b) => b.id === id)?.spec;
  const total = classTrees().reduce((n, t) => n + t.nodes.filter((x) => isClassBranch(t, x.branch)).length, 0);
  out.push(`${content.trees.size} class trees, ${total} nodes. Each branch has 2 active skills (each with 2 modifier nodes), 4 minor passives, 2 notables, a choice pair, a keystone and a capstone across 6 tiers. Tier t needs (t - 1) x 5 points in the branch.`, '');
  for (const tree of classTrees()) {
    const classNodes = tree.nodes.filter((x) => isClassBranch(tree, x.branch));
    out.push(`### ${content.classes.get(tree.classId).name} (${classNodes.length} nodes)`, '', '| Branch | Skills (modifiers) | Notables | Choice | Keystone | Capstone |', '|---|---|---|---|---|---|');
    for (const b of tree.branches.filter((x) => !x.spec)) {
      const nodes = tree.nodes.filter((n) => n.branch === b.id);
      const skills = nodes
        .filter((n) => n.kind === 'active')
        .map((n) => `**${n.name}** (${nodes.filter((m) => m.variant?.skill === n.skill).map((m) => m.name).join(', ')})`)
        .join('; ');
      const names = (kind: string): string => nodes.filter((n) => n.kind === kind).map((n) => n.name).join(', ');
      const keystone = nodes.find((n) => n.kind === 'keystone');
      out.push(`| ${b.name} | ${cell(skills)} | ${cell(names('notable'))} | ${cell(names('choice').replace(', ', ' / '))} | ${cell(`${keystone?.name ?? ''}: ${keystone?.text ?? ''}`)} | ${cell(names('capstone'))} |`);
    }
    out.push('');
  }
  out.push('### Tree skills', '', '| Skill | Class | Cost | CD | Description |', '|---|---|---|---|---|');
  for (const tree of classTrees()) {
    for (const n of tree.nodes.filter((x) => x.kind === 'active' && !x.starting && isClassBranch(tree, x.branch))) {
      const sk = content.skills.get(n.skill as string);
      const cost = [sk.cost.mp ? `${sk.cost.mp} MP` : '', sk.cost.resource ? `${sk.cost.resource.amount} ${content.resources.get(sk.cost.resource.id).name}` : ''].filter(Boolean).join(' + ') || 'free';
      out.push(`| **${sk.name}** | ${content.classes.get(tree.classId).name} | ${cost} | ${sk.cooldown} | ${cell(sk.description)} |`);
    }
  }
  return out.join('\n');
}

function specsSection(): string {
  const out: string[] = [];
  out.push(`${content.specializations.size} specializations, 3 per class, chosen at class level 20. Each adds a 12-node branch (signature skill with 2 modifiers, 3 minors, Signature Mastery, 2 notables, a choice pair, a capstone; tiers need (t - 1) x 4 points) and replaces the class ultimate.`, '');
  out.push('| Class | Specialization | Signature skill (modifiers) | Ultimate | Capstone |', '|---|---|---|---|---|');
  for (const spec of content.specializations.all()) {
    const tree = content.trees.get(spec.classId);
    const nodes = tree.nodes.filter((n) => n.branch === spec.branch);
    const active = nodes.find((n) => n.kind === 'active');
    const mods = nodes.filter((n) => n.kind === 'modifier').map((n) => n.name).join(', ');
    const ult = content.skills.get(spec.ultimate);
    const cap = nodes.find((n) => n.kind === 'capstone');
    out.push(`| ${content.classes.get(spec.classId).name} | **${spec.name}**: ${cell(spec.description)} | ${active?.name ?? ''} (${mods}) | **${ult.name}**: ${cell(ult.description)} | ${cell(`${cap?.name ?? ''}${cap?.text ? `: ${cap.text}` : ''}`)} |`);
  }
  return out.join('\n');
}

function generalSection(): string {
  const out: string[] = [];
  const all = content.generalSkills.all();
  out.push(`${all.length} general skills (ranks 1-10; Grimoires and Divine skills 1-5). Learn or rank up by reading a skillbook (consumed) or studying it at the Library (gold + days, kept). Slotted skills train: battle skills by use, passives by 1 per victory (6 x rank to the next rank). Slots: 2, +1 at levels 10/20/30/40/50.`, '');
  out.push('| Skill | Category | Book rarity | Battle skill | Effect |', '|---|---|---|---|---|');
  for (const g of all) {
    const battle = g.combatSkill ? content.skills.get(g.combatSkill).name : '';
    const req = g.requirements?.level ? ` (level ${g.requirements.level})` : '';
    out.push(`| **${g.name}**${req} | ${g.category} | ${content.rarities.get(g.rarity).name} | ${battle} | ${cell(g.description)} |`);
  }
  return out.join('\n');
}

function multiclassSection(): string {
  const out: string[] = [];
  out.push(`Second class at level ${MULTICLASS.secondaryLevel} (third at ${MULTICLASS.tertiaryLevel} in NG+${MULTICLASS.tertiaryNgPlus}+), after beating that class's mentor in a trial. ${content.hybrids.size} hybrid prestige classes unlock when both classes reach ${MULTICLASS.hybridLevel} and the hybrid trial is won. Each hybrid tree is one 16-node branch (2 skills with 2 modifiers each, 4 minors, 2 notables, a choice pair, a keystone and a capstone) gated at ${MULTICLASS.hybridTierGate} points per tier.`, '');
  out.push('### Class mentors and trials', '', '| Class | Mentor | Trial | Mentor skills |', '|---|---|---|---|');
  for (const t of content.classTrials.all()) {
    const mentor = content.enemies.get(`mentor-${t.classId}`);
    const enc = content.encounters.get(t.encounter);
    out.push(`| ${content.classes.get(t.classId).name} | **${mentor.name}**: ${cell(mentor.description)} | Lv ${enc.level}: ${enc.enemies.map((e) => content.enemies.get(e.enemyId).name).join(', ')} | ${mentor.skills.map((sk) => content.skills.get(sk.id).name).join(', ')} |`);
  }
  out.push('', '### Hybrid prestige classes', '', '| Hybrid | Classes | Skills (modifiers) | Notables | Keystone | Capstone |', '|---|---|---|---|---|---|');
  for (const h of content.hybrids.all()) {
    const nodes = content.trees.get(h.id).nodes;
    const skills = nodes
      .filter((n) => n.kind === 'active')
      .map((n) => `**${n.name}** (${nodes.filter((m) => m.variant?.skill === n.skill).map((m) => m.name).join(', ')})`)
      .join('; ');
    const names = (kind: string): string => nodes.filter((n) => n.kind === kind).map((n) => n.name).join(', ');
    const keystone = nodes.find((n) => n.kind === 'keystone');
    const capstone = nodes.find((n) => n.kind === 'capstone');
    out.push(`| **${h.name}**: ${cell(h.description)} | ${h.classes.map((id) => content.classes.get(id).name).join(' + ')} | ${cell(skills)} | ${cell(names('notable'))} | ${cell(keystone?.text ?? keystone?.name ?? '')} | ${cell(`${capstone?.name ?? ''}${capstone?.text ? `: ${capstone.text}` : ''}`)} |`);
  }
  out.push('', '### Hybrid skills', '', '| Skill | Hybrid | Cost | CD | Description |', '|---|---|---|---|---|');
  for (const h of content.hybrids.all()) {
    for (const n of content.trees.get(h.id).nodes.filter((x) => x.kind === 'active')) {
      const sk = content.skills.get(n.skill as string);
      out.push(`| **${sk.name}** | ${h.name} | ${sk.cost.mp ? `${sk.cost.mp} MP` : 'free'} | ${sk.cooldown} | ${cell(sk.description)} |`);
    }
  }
  return out.join('\n');
}

function godsSection(): string {
  const out: string[] = [];
  const t = DEVOTION.tierFloors;
  out.push(`Favor runs from ${DEVOTION.minFavor} to ${DEVOTION.maxFavor}. Tiers: Hated (${t.distrusted - 1} or less), Distrusted, Neutral (${t.neutral}), Acknowledged (${t.acknowledged}), Favored (${t.favored}), Devoted (${t.devoted}), Exalted (${t.exalted}); Apostle needs a trial (Phase 9). Gaining favor costs the god's rivals ${DEVOTION.rivalShare * 100}% of it. Shrine prayer: +${DEVOTION.shrinePrayerFavor} once per day.`, '');
  out.push('| God | Rivals / allies | Likes | Dislikes | Offerings | Prayer (battle) | Intervention |', '|---|---|---|---|---|---|---|');
  for (const p of content.pantheon.all()) {
    const g = content.gods.get(p.id);
    const deeds = (list: typeof p.likes): string => list.map((d) => `${d.text} (${d.amount > 0 ? '+' : ''}${d.amount})`).join('; ');
    const names = (ids: string[]): string => ids.map((id) => content.gods.get(id).name).join(', ');
    out.push(`| **${g.name}**, ${g.domain} | ${names(p.rivals)} / ${names(p.allies)} | ${cell(deeds(p.likes))} | ${cell(deeds(p.dislikes))} | ${cell(p.offerings.text)} | **${p.prayer.name}**: ${cell(p.prayer.description)} (${p.prayer.cost} favor) | **${p.intervention.name}**: ${cell(p.intervention.text)} |`);
  }
  out.push('', `### Blessings (${content.blessings.size})`, '', 'Minor blessings last 10 battles and cost favor. Major blessings are offered 3 at a time when a tier is first reached, stay active while the tier holds, and fill 1-3 slots (more at levels 25 and 50). Rival gods\' blessings cannot be slotted together.', '', '| God | Minor | Major (tier) |', '|---|---|---|');
  for (const p of content.pantheon.all()) {
    const minors = content.blessings.filter((b) => b.god === p.id && b.kind === 'minor').map((b) => `**${b.name}**: ${b.description}`).join('<br>');
    const majors = content.blessings.filter((b) => b.god === p.id && b.kind === 'major').map((b) => `**${b.name}** (${b.minTier}): ${b.description}`).join('<br>');
    out.push(`| ${content.gods.get(p.id).name} | ${cell(minors)} | ${cell(majors)} |`);
  }
  out.push('', '### Divine general skills', '', '| Skill | God | Battle skill | Effect |', '|---|---|---|---|');
  for (const g of content.generalSkills.filter((x) => x.category === 'divine')) {
    out.push(`| **${g.name}** | ${content.gods.get(g.god ?? '').name} | ${g.combatSkill ? content.skills.get(g.combatSkill).name : ''} | ${cell(g.description)} |`);
  }
  return out.join('\n');
}

function apostlesSection(): string {
  const out: string[] = [];
  out.push(`Exalted favor plus the god's three-stage Trial of Apostleship (two rounds of heralds, then the god's Aspect, fought at max(${APOSTLESHIP.trialMinLevel}, your level) + 0/1/3) make you its Apostle. One god at a time. Apostles get a 20-node tree (${APOSTLESHIP.basePoints} points + 1 per level after ascension), a Divine Avatar (an ultimate, once per battle), a god-bound weapon that evolves at levels ${WEAPON_STAGES.slice(1).map((s) => s.level).join('/')}, a Divine blessing in an extra slot, a title and Divine Edicts. Apostasy makes the god Hated and its heralds hunt you for ${APOSTLESHIP.huntBattles} battles.`, '');
  out.push('| God | Divine Avatar | Divine weapon (stages) | Divine blessing | Tree skills | Keystone / capstone |', '|---|---|---|---|---|---|');
  for (const a of content.apostles.all()) {
    const god = content.gods.get(a.god);
    const avatar = content.skills.get(a.avatar);
    const blessing = content.blessings.get(`${a.god}-divine`);
    const nodes = content.trees.get(`apostle-${a.god}`).nodes;
    const skills = nodes.filter((n) => n.kind === 'active').map((n) => `**${n.name}**: ${content.skills.get(n.skill as string).description}`).join('<br>');
    const k = nodes.find((n) => n.kind === 'keystone');
    const cap = nodes.find((n) => n.kind === 'capstone');
    out.push(`| **${god.name}** | **${avatar.name}**: ${cell(avatar.description)} | ${a.weapon.names.join(' → ')} (${content.weaponTypes.get(a.weapon.type).name}) | **${blessing.name}**: ${cell(blessing.description)} | ${cell(skills)} | ${cell(`${k?.text ?? k?.name ?? ''} / ${cap?.name ?? ''}${cap?.text ? `: ${cap.text}` : ''}`)} |`);
  }
  out.push('', `### Divine Edicts (${content.edicts.size})`, '', 'Each like of your god becomes an edict: do it a number of times within 20 battles. Fulfilled: +' + APOSTLESHIP.edictFavor + ' favor and gold. Ignored: -' + APOSTLESHIP.edictPenalty + ' favor and apostle passives at ' + APOSTLESHIP.neglectMultiplier * 100 + '% until the next edict is fulfilled.', '');
  for (const g of content.pantheon.all()) out.push(`- **${content.gods.get(g.id).name}:** ${content.edicts.filter((e) => e.god === g.id).map((e) => e.text).join('; ')}`);
  return out.join('\n');
}

function worldSection(): string {
  const out: string[] = [];
  out.push('Eight zones along one road, each a generated tile map with a town or not, dungeons, a world boss, god shrines, a waypoint, chests, lore and a hidden alcove behind a cracked wall. Enemy levels follow yours within the zone\'s range; `threat` adds HP and damage to a zone\'s rank and file.', '');
  out.push('| Zone | Levels | Town | Dungeons (boss) | World boss | Shrines | Weather | Threat |', '|---|---|---|---|---|---|---|---|');
  for (const z of content.zones.all().sort((a, b) => a.order - b.order)) {
    const dungeons = z.dungeons.map((d) => `${content.dungeons.get(d).name} (${content.enemies.get(content.dungeons.get(d).boss).name}, lv ${content.dungeons.get(d).level})`).join('; ');
    out.push(`| **${z.name}** | ${z.levels[0]}-${z.levels[1]} | ${z.town ? content.towns.get(z.town).name : '-'} | ${cell(dungeons)} | ${content.enemies.get(z.worldBoss).name} | ${z.shrines.map((g) => content.gods.get(g).name).join(', ')} | ${z.weather.map((w) => content.weather.get(w.id).name).join(', ')} | ${z.threat ?? 0}% |`);
  }
  out.push('', '### Zone enemies', '');
  for (const z of content.zones.all().sort((a, b) => a.order - b.order)) {
    const ids = [...new Set(z.encounters.flatMap((g) => g.enemies.map((e) => e.enemyId)))];
    out.push(`- **${z.name}:** ${ids.map((id) => content.enemies.get(id).name).join(', ')}`);
  }
  out.push('', '### Towns', '', '| Town | Zone | Temple | Faction hall | Housing |', '|---|---|---|---|---|');
  for (const t of content.towns.all()) out.push(`| **${t.name}** | ${content.zones.get(t.zone).name} | ${t.temple.map((g) => content.gods.get(g).name).join(', ')} | ${t.faction ? content.factions.get(t.faction).name : '-'} | ${t.housing ? 'yes' : '-'} |`);
  out.push('', '### Weather', '', '| Weather | Encounters | Effect |', '|---|---|---|');
  for (const w of content.weather.all()) out.push(`| **${w.name}** | x${w.encounterMult} | ${cell(w.description)} |`);
  out.push('', '### Factions', '', '| Faction | Hall | God | Likes | Rank bonuses (Member / Veteran / Champion / Legend) |', '|---|---|---|---|---|');
  for (const f of content.factions.all()) {
    const bonus = f.ranks.filter((r) => r.modifiers.length).map((r) => r.modifiers.map((m) => `${m.value > 0 ? '+' : ''}${m.value}${m.type === 'percent' ? '%' : ''} ${content.stats.find(m.stat)?.name ?? m.stat}`).join(', ')).join(' / ');
    out.push(`| **${f.name}** | ${content.towns.get(f.hall).name} | ${content.gods.get(f.god).name} | ${cell(f.likes.map((d) => d.text).join('; '))} | ${cell(bonus)} |`);
  }
  out.push('', '### House rooms', '', '| Room | Cost per level | Effect |', '|---|---|---|');
  for (const r of content.houseRooms.all()) out.push(`| **${r.name}** | ${r.costs.join(' / ')} | ${cell(r.description)} |`);
  out.push('', `### Lore pages (${content.lore.size})`, '', content.lore.all().map((l) => `**${l.title}** (${content.zones.get(l.zone).name})`).join(', '));
  return out.join('\n');
}

function economySection(): string {
  const out: string[] = [];
  out.push('Every town has the core shops; stock rolls daily at your level. Shops pay 25% of value. Prices: value x markup, less Haggle (1%/rank), temple favor (5-20%) and faction rank (5% per rank above Member).', '');
  out.push('| Shop | Markup | Sells | Where |', '|---|---|---|---|');
  for (const s of content.shops.all()) {
    const where = content.towns.filter((t) => (t.extraShops ?? []).includes(s.id)).map((t) => t.name).join(', ') || (s.kind === 'faction' ? 'Towns with a faction hall (members only)' : 'Every town');
    out.push(`| **${s.name}**${s.night ? ' (night)' : ''} | x${s.markup} | ${cell(s.description)} | ${where} |`);
  }
  out.push('', '### Professions', '', 'Pick 2 of the 5 crafting professions (levels 1-50, 10 x level XP per level); gathering is open to everyone.', '');
  for (const p of content.professions.all()) out.push(`- **${p.name}** (${p.kind}): ${p.description}`);
  out.push('', `### Recipes (${content.recipes.size})`, '', '| Recipe | Profession (level) | Inputs | Makes | Starter |', '|---|---|---|---|---|');
  for (const r of content.recipes.all()) {
    const inputs = r.inputs.map((i) => `${i.qty} ${content.items.get(i.itemId).name}`).join(', ') + (r.gold ? `, ${r.gold}g` : '');
    const makes = r.output.kind === 'item' ? `${r.output.qty}x ${content.items.get(r.output.itemId).name}` : `tier ${r.output.tier} ${r.output.category} (uncommon-epic)`;
    out.push(`| ${r.name} | ${content.professions.get(r.profession).name} (${r.level}) | ${cell(inputs)} | ${makes} | ${r.starter ? 'yes' : 'scroll'} |`);
  }
  out.push('', '### Gear services', '', `- **Upgrade** +1 to +15: success ${UPGRADE_CHANCE.map((c) => `${Math.round(c * 100)}%`).join(' / ')}; past +10 a failure drops a level. Enchanting adds 0.5% per level.`, '- **Reroll** one affix, **add a socket** (up to the base maximum), **raise quality** (Damaged > Normal > Superior > Masterwork), **ascend** (NG+: Legendary or Mythic becomes Ascended). Corrupted items cannot be modified.');
  return out.join('\n');
}

function storySection(): string {
  const out: string[] = [];
  const kinds: [string, string][] = [['main', 'Main story'], ['twilight', 'Twilight of the Gods (New Game+)'], ['side', 'Side quests'], ['faction', 'Faction questlines'], ['companion', 'Companion quests'], ['god', 'God questlines'], ['class', 'Class trials'], ['hybrid', 'Hybrid trials'], ['bounty', 'Bounties (repeatable daily)']];
  out.push(`${content.quests.size} quests, ${content.npcs.size} NPCs, ${content.dialogues.size} dialogues, ${content.companions.size} companions, ${content.endings.size} endings.`, '');
  for (const [kind, title] of kinds) {
    const list = content.quests.filter((q) => q.kind === kind);
    out.push(`### ${title} (${list.length})`, '', '| Quest | Lvl | From | Objectives |', '|---|---|---|---|');
    for (const q of list) {
      const from = q.giver ? content.npcs.get(q.giver).name : q.board ? `${content.towns.get(q.board).name} board` : 'starts by itself';
      const objs = q.stages.flatMap((st) => st.objectives.map((o) => `${o.text} (${o.kind})`)).join('; ');
      out.push(`| **${q.name}** | ${q.level} | ${cell(from)} | ${cell(objs)}${q.stages.some((st) => st.hours) ? ' · timed' : ''} |`);
    }
    out.push('');
  }
  out.push('### Endings', '');
  for (const e of content.endings.all()) out.push(`- **${e.name}** (title “${e.title ?? ''}”)${e.godText ? ', with a paragraph for each god’s Apostle' : ''}: ${e.text}`);
  out.push('', '### Companions', '');
  out.push(`Each companion in a fight gives every enemy ${PARTY_SCALING.enemyHpPerCompanion}% more HP (regeneration still heals as if alone) and +${PARTY_SCALING.enemyDamagePerCompanion}% damage. Companions' attack, magic and divine power, and extra stats, by class (tuned with \`npm run sim:party\` so every class is worth about the same):`, '');
  out.push('| Class | Power | Extra |', '|---|---|---|');
  for (const cls of content.classes.all()) {
    const power = PARTY_SCALING.companionPower[cls.id] ?? PARTY_SCALING.companionPowerDefault;
    out.push(`| ${cls.name} | ${power >= 0 ? '+' : ''}${power}% | ${(PARTY_SCALING.companionStats[cls.id] ?? []).map(mod).join(', ') || '-'} |`);
  }
  out.push('');
  for (const c of content.companions.all()) {
    out.push(`- **${c.name}**, ${c.title}: ${content.races.get(c.raceId).name} ${content.classes.get(c.classId).name} (${content.specializations.get(c.specialization).name}), follows ${content.gods.get(c.god).name}, met in ${content.towns.get(c.town).name}. Likes ${c.likes.map((d) => d.text.toLowerCase()).join(', ')}; dislikes ${c.dislikes.map((d) => d.text.toLowerCase()).join(', ')}.`);
    out.push(`  - Bond: ${c.bond.map((t) => `${t.approval}: ${t.options.map((o) => `${o.name} (${o.description})`).join(' or ')}`).join(' · ')} · Oath: ${c.oath.name} (${c.oath.description})`);
  }
  out.push('', '### People', '');
  for (const t of content.towns.all()) out.push(`- **${t.name}:** ${content.npcs.filter((n) => n.town === t.id).map((n) => `${n.name} (${n.title})`).join(', ')}`);
  out.push(`- **Every arena:** ${content.npcs.filter((n) => n.place === 'arena').map((n) => n.name).join(', ')}`);
  return out.join('\n');
}

function codexSection(): string {
  const out: string[] = [];
  const pct = (n: number): string => `${Math.round(n * 100)}%`;
  out.push('### Bosses', '');
  out.push(`Every miniboss, boss and world boss enrages after ${Object.entries(BOSS.enrageTurns).map(([t, n]) => `${n} of its own turns (${t})`).join(', ')}, and grows angrier every ${BOSS.enrageStackEvery} turns after (Enraged: +40% damage and 10% more speed per stack). Telegraphed attacks take a wind-up turn first: Break the boss to interrupt it, or Defend.`, '');
  out.push(`${content.bossScripts.size} scripted bosses:`, '', '| Boss | Phases | Telegraphs |', '|---|---|---|');
  for (const sc of content.bossScripts.all()) {
    const phases = sc.phases.map((ph) => `${ph.hpPct}%: **${ph.name}**${ph.adds?.length ? ` (adds ${ph.adds.map((a) => content.enemies.get(a).name).join(', ')})` : ''}${ph.modifiers?.length ? ` (${ph.modifiers.map(mod).join(', ')})` : ''}${ph.effects?.length ? ' (heals or shields)' : ''}`).join('; ');
    const tels = sc.telegraphs.map((t) => `${content.skills.get(t.skillId).name} every ${t.every} turns${t.fromPhase ? ` from phase ${t.fromPhase + 1}` : ''}`).join('; ');
    out.push(`| ${content.enemies.get(sc.id).name}${sc.enrageTurns ? ` (enrages at ${sc.enrageTurns})` : ''} | ${cell(phases) || '-'} | ${cell(tels) || '-'} |`);
  }
  out.push('', 'Telegraphed attacks:', '');
  for (const id of new Set(content.bossScripts.all().flatMap((sc) => sc.telegraphs.map((t) => t.skillId)))) {
    const sk = content.skills.get(id);
    out.push(`- **${sk.name}** (${sk.targeting === 'enemy' ? 'one target' : 'whole party'}, ${pct(sk.damage?.multiplier ?? 0)} ${sk.damage?.stat === 'magicAttack' ? 'MAG' : 'ATK'} ${content.elements.get(sk.element).name}): ${sk.description}`);
  }
  out.push('', '### Elite affixes', '');
  out.push(`Elites roll ${ELITE_AFFIX_RULES.perTier.elite} affix, champion packs ${ELITE_AFFIX_RULES.perTier.champion} (shared by the pack). Each affix adds ${ELITE_AFFIX_RULES.xpPerAffix}% XP and prefixes the name.`, '', '| Affix | Effect | Never on |', '|---|---|---|');
  for (const a of content.eliteAffixes.all()) out.push(`| ${a.name} | ${a.description} | ${a.notFor?.join(', ') ?? '-'} |`);
  out.push('', '### Bestiary', '');
  out.push(`- Knowledge per enemy at ${BESTIARY.knowledge.join(' / ')} kills (bosses ${BESTIARY.bossKnowledge.join(' / ')}): ${KNOWLEDGE_NAMES.slice(1).join(', ')}.`);
  out.push(`- Slayer ranks per creature type at ${BESTIARY.slayerRanks.join(' / ')} kills: +${BESTIARY.slayerDamagePerRank}% damage against that type per rank.`, '');
  out.push(`### Achievements (${content.achievements.size}, ${content.achievements.all().filter((a) => a.title).length} titles)`, '');
  for (const cat of ACHIEVEMENT_CATEGORIES) {
    const list = content.achievements.filter((a) => a.category === cat.id);
    out.push(`**${cat.name}** (${list.length}): ${list.map((a) => `${a.name}${a.hidden ? ' (hidden)' : ''} (${a.description.replace(/\.$/, '')}; ${a.points} pts${a.title ? `; title “${a.title}”` : ''}${a.gold ? `; ${a.gold} gold` : ''})`).join(' · ')}`, '');
  }
  return out.join('\n').trimEnd();
}

function ngPlusSection(): string {
  const out: string[] = [];
  out.push(`- **New Game+** (up to NG+${NG_PLUS.maxTier}) after any ending: the hero, gear, bags, stash, gold, companions, achievements, statistics and lore pages carry over; the story, quests, map, calendar and shops start again. The level cap rises to ${PROGRESSION.ngPlusLevelCap}, world levels 1–${NG_PLUS.levelFrom} stretch over ${NG_PLUS.levelFrom}–${NG_PLUS.levelTo}, and each tier past the first adds +${NG_PLUS.threatPerTier}% enemy HP and damage.`);
  out.push(`- **Heresy** (0–${HERESY.max}): each point costs ${HERESY.favorCostPerPoint} favor with every god; atonement at a temple costs ${HERESY.atoneGoldPerPointPerLevel} gold × level per point. The Nameless One rewards: ${HERESY.deeds.map((d) => `${d.text.toLowerCase()} (+${d.amount})`).join(', ')}.`, '');
  out.push('| Heresy tier | From | Effect |', '|---|---|---|');
  for (const t of HERESY.tiers) out.push(`| ${t.name} | ${t.min} | ${t.description} |`);
  out.push('', `**Forbidden skills** (${content.generalSkills.filter((g) => g.category === 'forbidden').length}, tomes sold only by the Black Market to heretics of the tier):`, '');
  for (const g of content.generalSkills.filter((x) => x.category === 'forbidden')) out.push(`- **${g.name}** (${HERESY.tiers[g.heresy ?? 0]?.name}): ${g.description}${g.combatSkill ? ` ${content.skills.get(g.combatSkill).description}` : ''}`);
  out.push('', '**Forbidden goods:**', '');
  for (const b of content.items.filter((x) => x.forbidden !== undefined && x.category !== 'book')) out.push(`- **${b.name}** (${HERESY.tiers[b.forbidden ?? 0]?.name}): ${b.description ?? ''}`);
  out.push('', `**Apostle followers** (an Apostle calls one from the Pantheon; it counts as ${PARTY_SCALING.followerShare} of a companion for enemy scaling): ${content.enemies.filter((e) => e.types.includes('follower')).map((e) => e.name).join(', ')}.`, '');
  out.push(`**The Defender path** (NG+${APOSTLESHIP.defenderNgPlus}+): an Apostle who has passed a second, non-rival god's trial may defend that god too: its Divine blessing in one more slot, the Apostle tier with it, and the title "Defender of X".`);
  return out.join('\n');
}

const SECTIONS: Record<string, () => string> = { items: itemsSection, combat: combatSection, trees: treesSection, specializations: specsSection, general: generalSection, multiclass: multiclassSection, gods: godsSection, apostles: apostlesSection, world: worldSection, economy: economySection, story: storySection, codex: codexSection, ngplus: ngPlusSection };

let md = readFileSync(FILE, 'utf8');
for (const [name, build] of Object.entries(SECTIONS)) {
  const start = `<!-- ${name}:start -->`;
  const end = `<!-- ${name}:end -->`;
  const block = `${start}\n${build()}\n${end}`;
  const re = new RegExp(`${start}[\\s\\S]*?${end}`);
  md = re.test(md) ? md.replace(re, block) : `${md.trimEnd()}\n\n## ${name[0]?.toUpperCase()}${name.slice(1)}\n\n${block}\n`;
}
writeFileSync(FILE, md);
console.log('CONTENT.md updated.');
