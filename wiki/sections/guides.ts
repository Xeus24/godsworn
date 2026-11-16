/**
 * Guides: hand-written articles (beginner's guide, progression, combat,
 * favor...). Each guide is a PageSpec in `extra`, ns `guide`. Numbers come
 * from `content` and the data constants at build time so the guides stay
 * current; link to data pages with ctx.link so broken links fail the build.
 */
import { content } from '../../src/data';
import { COMBAT, BOSS } from '../../src/data/combat';
import { DEVOTION, APOSTLESHIP } from '../../src/data/devotion';
import { HERESY } from '../../src/data/heresy';
import { NG_PLUS } from '../../src/data/ngPlus';
import { RIFTS } from '../../src/data/rifts';
import { MULTICLASS, PROGRESSION } from '../../src/data/progression';
import { simpleSection } from '../core/generic';
import { callout, esc, h2, h3, table, ul } from '../core/html';
import type { PageSpec, RenderCtx } from '../core/types';

const n = (x: { all(): readonly unknown[] }): number => x.all().length;
const p = (html: string): string => `<p>${html}</p>`;
const dif = (id: string, fallback: string): string => content.stats.find(id)?.name ?? fallback;

interface GuideDef {
  id: string;
  title: string;
  summary: string;
  spoiler?: boolean;
  keywords?: string[];
  body(ctx: RenderCtx): string;
}

const roadZones = () => content.zones.all().filter((z) => (z as { order?: number }).order !== undefined && (z as { order: number }).order <= 8);

const defs: GuideDef[] = [
  {
    id: 'beginners-guide',
    title: "Beginner's guide",
    summary: 'Create your first hero: race, class, birth sign, background, god and difficulty.',
    keywords: ['start', 'new game', 'first hero', 'creation'],
    body: (ctx) =>
      p(`Godsworn starts at a title screen: <b>New Game</b>, name your hero, pick a portrait, then choose a race, class, birth sign and background. The right-hand panel previews your stats, playstyle, your class mechanic and starting skills. Choose <b>Swear your oath</b> to begin in Brightwater, a town in the Meadowlands.`) +
      h2('Race') +
      p(`There are ${n(content.races)} races (see ${ctx.link('race', 'index', 'all races')}). Each gives stat bonuses and a three-quest questline from its own NPC. Some races are locked at first: they open by finishing the story once or by reaching higher New Game+ tiers.`) +
      h2('Class') +
      p(`${n(content.classes)} classes exist (${ctx.link('class', 'index', 'all classes')}). Most are open from the start; hidden classes come from secret questlines and the strongest from New Game+. Each class has a role, a difficulty rating, a resource (rage, focus, faith...) and a trait that is always on.`) +
      callout('tip', `Not sure? ${ctx.linkIf('class', 'warrior', 'Warrior')} and ${ctx.linkIf('class', 'cleric', 'Cleric')} are easy to read. You can add a second class at level ${MULTICLASS.secondaryLevel}, so your first pick is not final.`) +
      h2('Birth sign and background') +
      p(`${n(content.birthSigns)} birth signs each tie to a god and give a small bonus (for example a percent of defense plus extra favor with that god). ${n(content.backgrounds)} backgrounds give stat points, starting items and a free skill, plus their own three-quest line. See ${ctx.link('birth-sign', 'index', 'birth signs')} and ${ctx.link('background', 'index', 'backgrounds')}.`) +
      h2('God') +
      p(`${n(content.gods)} gods judge what you do. You do not have to choose one at creation: favor builds from your deeds. See ${ctx.link('guide', 'gods-and-favor', 'Gods and favor')}.`) +
      h2('Difficulty and challenge modes') +
      table(content.challenges.all() as { id: string; name: string; description?: string }[], [
        { label: 'Challenge', cell: (c) => ctx.linkIf('challenge', c.id, c.name), sort: (c) => c.name },
        { label: 'Effect', cell: (c) => esc(c.description) },
      ]) +
      p(`Difficulty is chosen at creation: Noob, Easy, Medium (the baseline), Hard, Legendary and Impossible. Each step up multiplies enemy HP and damage and pays back with bigger XP and gold. <b>Hardcore</b> makes death permanent.`) +
      h2('Your first hour') +
      ul([
        `Talk to Brother Aldric at the Brightwater temple: the main story begins at once.`,
        `Spend attribute points on the character sheet (C): ${PROGRESSION.attributePointsPerLevel} per level.`,
        `Spend skill points in your class tree (K). Fill the hotbar.`,
        `Read ${ctx.link('guide', 'combat-basics', 'Combat basics')} before your first dungeon.`,
        `Keep an eye on ${ctx.link('guide', 'leveling-and-progression', 'zone level ranges')} so you are not walking into fights far above you.`,
      ]) +
      callout('note', `Game keys: C character, I inventory, K skills, L general skills, J quests, O party, B Codex, P pantheon, G world, M world map, Esc menu.`),
  },
  {
    id: 'combat-basics',
    title: 'Combat basics',
    summary: 'Turn order, rows, resources, stagger and Break, ultimates, statuses and elements.',
    keywords: ['battle', 'fight', 'stagger', 'break', 'ultimate', 'elements'],
    body: (ctx) => {
      const statuses = content.statuses.all() as { kind: string }[];
      const buffs = statuses.filter((s) => s.kind === 'buff').length;
      return (
        p(`Fights are turn-based. The turn order runs across the top: faster combatants act more often. On your turn choose <b>Attack, Skills, Items, Abilities, Defend, Swap</b> rows, Talk or <b>Flee</b>. Number keys pick menu entries; the 8 hotbar skills sit on keys 1-8.`) +
        h2('Rows') +
        p(`Melee attacks only reach the enemy front row while it stands. Your back row takes ${Math.round((1 - COMBAT.backRowPhysical) * 100)}% less physical damage. Use <b>Swap</b> to move units between rows.`) +
        h2('Defend, flee and defeat') +
        ul([
          `<b>Defend</b>: take ${Math.round(COMBAT.defendMult * 100)}% damage until your next turn and restore ${COMBAT.defendMpPct}% of max MP.`,
          `<b>Flee</b>: base ${Math.round(COMBAT.flee.base * 100)}% chance, shifted by party speed against enemy speed (${Math.round(COMBAT.flee.min * 100)}-${Math.round(COMBAT.flee.max * 100)}%). Some gods dislike fleeing.`,
          `<b>Defeat</b> costs ${Math.round(COMBAT.defeatGoldLoss * 100)}% of your gold and ${Math.round(COMBAT.defeatWearShare * 100)}% durability, and sends you to the last town you visited. In Hardcore it is permanent.`,
        ]) +
        h2('Stagger, Break and chains') +
        p(`Hits fill an enemy's stagger bar (${COMBAT.staggerBarHpShare * 100}% of its max HP; physical hits fill it fully, other damage ${Math.round(COMBAT.staggerOther * 100)}%). A full bar <b>Breaks</b> the enemy: it loses ${COMBAT.brokenTurns} turns and takes ${Math.round((COMBAT.brokenDamageMult - 1) * 100)}% more damage. Consecutive party hits on one target also build a <b>chain</b> bonus (+${Math.round(COMBAT.chainStep * 100)}% a hit, up to ${Math.round(COMBAT.chainMax * 100)}%).`) +
        callout('tip', `Bosses telegraph big attacks: when one is Winding Up, Break its stagger bar to interrupt it or Defend to halve the hit. Drag a boss fight out and it enrages after about ${BOSS.enrageTurns.boss ?? 50} of its turns.`) +
        h2('Resources and the ultimate') +
        p(`Every class has MP plus a class resource: ${(content.resources.all() as { id: string; name: string }[])
          .slice(0, 8)
          .map((r) => ctx.linkIf('resource', r.id, r.name))
          .join(', ')} and more (${n(content.resources)} in all, see ${ctx.linkIf('resource', 'index', 'resources')}). The ultimate gauge fills as you deal and take damage; at 100% your class ultimate unlocks in the Skills menu. Choosing a specialization at class level 20 replaces it.`) +
        h2('Elements') +
        p(`${n(content.elements)} damage elements: ${(content.elements.all() as { id: string; name: string }[]).map((e) => esc(e.name)).join(', ')}. Enemies resist some and are weak to others; weather also matters (rain dampens fire, storms boost lightning). Non-mage classes trigger elemental combos such as Shatter (ice on a Burning target) ${Math.round(COMBAT.comboChance * 100)}% of the time; Mages always do.`) +
        h2('Statuses') +
        p(`${statuses.length} statuses (${buffs} buffs, ${statuses.length - buffs} debuffs). Hover any buff or debuff in battle for its effect. Full list: ${ctx.link('status', 'index', 'Statuses')}. Burn, for example, can be followed by ice to Shatter.`) +
        h2('Other combat tools') +
        ul([
          `<b>Pray</b> spends your patron's favor for a miracle (cooldown ${COMBAT.prayCooldown} turns). See ${ctx.link('guide', 'gods-and-favor', 'Gods and favor')}.`,
          `<b>Talk</b>: persuade, bribe, recruit or spare some enemies.`,
          `<b>Auto</b> lets the AI fight; 1x/2x/4x set the speed.`,
          `Elites carry one affix and champion packs two (${ctx.link('elite-affix', 'index', 'elite affixes')}).`,
        ])
      );
    },
  },
  {
    id: 'gods-and-favor',
    title: 'Gods and favor',
    summary: 'Favor tiers, likes and dislikes, blessings, patrons, apostleship and what happens when a god hates you.',
    keywords: ['favor', 'devotion', 'patron', 'apostle', 'blessing', 'pantheon', 'shrine'],
    body: (ctx) => {
      const tiers = Object.entries(DEVOTION.tierFloors).filter(([k]) => k !== 'apostle');
      const gods = content.gods.all() as { id: string; name: string; epithet?: string; domain?: string }[];
      return (
        p(`${gods.length} gods watch the world (${ctx.link('god', 'index', 'all gods')}). Each likes and dislikes certain deeds: slaying undead, fleeing, reading books, healing and so on. You discover what a god cares about as its reactions trigger.`) +
        h2('Favor tiers') +
        table(tiers, [
          { label: 'Tier', cell: ([k]) => esc(k[0]!.toUpperCase() + k.slice(1)) },
          { label: 'Favor from', cell: ([, v]) => esc(v), sort: ([, v]) => v },
        ]) +
        p(`Favor ranges from ${DEVOTION.minFavor} to ${DEVOTION.maxFavor}. Gaining favor with one god costs ${Math.round(DEVOTION.rivalShare * 100)}% of it with each of that god's rivals. Birth signs add a small favor bonus with their god.`) +
        h2('Shrines, prayer and offerings') +
        p(`At a god's shrine you can pray once a day (+${DEVOTION.shrinePrayerFavor} favor), make offerings of gold or items, buy minor blessings with favor and pick a <b>patron</b>. In battle, <b>Pray</b> needs the ${DEVOTION.prayerTier} tier or better.`) +
        h2('Blessings') +
        p(`When a god first acknowledges, favors, devotes itself to or exalts you, it offers a choice of ${DEVOTION.offerSize} major blessings. You start with 1 major blessing slot and gain more at levels ${DEVOTION.blessingSlotLevels.join(' and ')}. There are ${n(content.blessings)} blessings in the game (${ctx.linkIf('blessing', 'index', 'blessings')}).`) +
        h2('Divine Intervention') +
        p(`A Devoted god may step in to save you from death: base chance ${DEVOTION.intervention.base}%, rising with favor and Faith, capped at ${DEVOTION.intervention.cap}%.`) +
        h2('Apostleship') +
        p(`Reach Exalted with a god and its shrine offers the <b>Trial of Apostleship</b>: three fights, the last against the god's Aspect (minimum level ${APOSTLESHIP.trialMinLevel}). Win and Ascend to become its Apostle. You gain an apostle tree, a Divine Avatar (a second ultimate, once per battle), a divine weapon that grows with you, an extra blessing slot and a title. See ${ctx.linkIf('edict', 'index', 'Divine Edicts')}: ignore them and your powers fade.`) +
        h2('When a god hates you') +
        ul([
          `At or below -50 favor a god is Hated: each hated god's curse adds ${DEVOTION.hatedCurse}% damage taken.`,
          `A Hated god sends a divine punisher into ${Math.round(DEVOTION.punisherChance * 100)}% of your fights; beating it earns ${DEVOTION.penanceFavor} favor in penance.`,
          `You can renounce a god, but it will never forget.`,
        ]) +
        callout('tip', `Gods you ally with tend to like the same deeds. Check the rivals and allies on each god's page before you commit to a patron.`) +
        h3('The pantheon') +
        ul(gods.filter((g) => g.id !== 'nameless').map((g) => `${ctx.link('god', g.id, g.name)}${g.domain ? ` - ${esc(g.domain)}` : ''}`))
      );
    },
  },
  {
    id: 'leveling-and-progression',
    title: 'Leveling and progression',
    summary: 'Zone order and level ranges, locks, the under-level warning, XP and attribute points.',
    keywords: ['zones', 'levels', 'xp', 'locks', 'rites', 'level cap'],
    body: (ctx) => {
      const zones = roadZones() as { id: string; name: string; levels: [number, number] }[];
      return (
        p(`The level cap is ${PROGRESSION.levelCap}. Each level gives ${PROGRESSION.attributePointsPerLevel} attribute points and a skill point for your class; every ${PROGRESSION.bonusSkillPointEvery} class levels you earn a bonus skill point. Past the cap, extra XP earns paragon points for the paragon board.`) +
        h2('The road, in order') +
        p(`Eight zones run along one road. Enemies match your level within each zone's range.`) +
        table(zones, [
          { label: 'Zone', cell: (z) => ctx.link('zone', z.id, z.name), sort: (z) => z.name },
          { label: 'Levels', cell: (z) => `${z.levels[0]}-${z.levels[1]}`, sort: (z) => z.levels[0] },
        ]) +
        p(`There are also ${n(content.zones) - 8} further regions off the road (the capital Aurelane, Moonfen, Thornreach, Khazrum, shattered isles and more; see ${ctx.link('zone', 'index', 'all zones')}).`) +
        h2('Locks') +
        p(`Progression is gated by a thin lock layer (${n(content.locks)} locks). Zone entry rites are main-story quests: the tale always leads you to the next zone, and if you have already set foot in a zone it stays open. A shut way tells you what is missing.`) +
        table(
          [
            ['Second class', `Level ${MULTICLASS.secondaryLevel}, then a trial at the arena`],
            ['Hybrid classes', `Both parent classes at level ${MULTICLASS.hybridLevel}, then the pair trial`],
            ['Third class', `Level ${MULTICLASS.thirdSlotLevel} after Amara's errand, or level ${MULTICLASS.tertiaryLevel} in New Game+${MULTICLASS.tertiaryNgPlus}`],
            ['Specialization', 'Class level 20'],
            ['Rifts', `Level ${RIFTS.minLevel} and the endgame switch`],
            ['Crafting upgrades', 'Past +5 needs a crafting profession at 10, past +10 at 25'],
          ],
          [
            { label: 'System', cell: ([a]) => esc(a) },
            { label: 'Gate', cell: ([, b]) => esc(b) },
          ],
        ) +
        callout('warn', `Under-level warning: entering a zone more than 3 levels below its range shows a warning. It never blocks you, but fights there will hurt.`) +
        h2('Experience') +
        p(`Kill XP scales with the level gap: it rises ${Math.round(PROGRESSION.killXp.perLevelDiff * 100)}% per enemy level above yours (up to ${Math.round(PROGRESSION.killXp.max * 100)}%) and falls toward ${Math.round(PROGRESSION.killXp.min * 100)}% for enemies far below you. Quests and achievements are the other big sources.`) +
        callout('tip', `Dungeons restock every day, and capstone dungeons open once the ordinary dungeons of their zone are cleared. Respec costs ${PROGRESSION.respecCostPerLevel} gold x level.`) +
        p(`Next: ${ctx.link('guide', 'endgame-and-new-game-plus', 'Endgame and New Game+')}.`)
      );
    },
  },
  {
    id: 'skills-and-trees',
    title: 'Skills and skill trees',
    summary: 'Branches, modifiers, keystones, mastery, specializations, multiclassing, hybrids and evolutions.',
    keywords: ['tree', 'skill', 'specialization', 'multiclass', 'hybrid', 'evolution', 'mastery'],
    body: (ctx) =>
      p(`Every class level gives skill points to spend in that class's tree (${ctx.link('tree', 'index', 'trees')}). Learn a node by double-clicking it, refund with right-click. Deeper tiers unlock after 5 points per tier in a branch.`) +
      h2('Tree features') +
      ul([
        `<b>Active skills</b>: each has two modifier nodes; pick one.`,
        `<b>Keystones</b>: big power with a real downside.`,
        `<b>Builds</b>: five, switched for free; each remembers its own tree, hotbar and optionally gear.`,
        `<b>Mastery</b>: skills level with use, 10 ranks; Mastered at 5, Grandmaster at 10, which turns on your class perk and lets the skill evolve.`,
      ]) +
      h2('Specializations') +
      p(`At class level 20 pick one of the class's specializations (${n(content.specializations)} in the game; ${ctx.link('specialization', 'index', 'all')}). It adds a fifth branch and replaces your ultimate. The first choice is free; switching costs 100 gold x level.`) +
      h2('Multiclassing') +
      p(`At level ${MULTICLASS.secondaryLevel} you can take a second class: beat its mentor in a trial at an arena. It starts at level 1 with its own skills, tree and resource. A third slot opens at level ${MULTICLASS.thirdSlotLevel} (or ${MULTICLASS.tertiaryLevel} in New Game+${MULTICLASS.tertiaryNgPlus}). Secondary classes earn a Mastery Point every ${MULTICLASS.masteryPointEvery} class levels, needed for their keystones and capstones, and contribute ${Math.round(PROGRESSION.secondaryGrowthShare * 100)}% of their stat growth. Class XP can be split by preset (${MULTICLASS.splitPresets.join('/')}) or Focus.`) +
      callout('note', `Armor only a secondary class can wear slows you ${MULTICLASS.offClassArmorSpeedPenalty}% per piece unless you learn Armor Training.`) +
      h2('Hybrid classes') +
      p(`${n(content.hybrids)} hybrid prestige classes (${ctx.link('hybrid', 'index', 'list')}) unlock when both parent classes reach level ${MULTICLASS.hybridLevel} and you win the pair's trial. Examples: ${ctx.linkIf('hybrid', 'spellblade', 'Spellblade')} (Warrior + Mage). Hybrid trees appear as extra tabs on the Skills screen.`) +
      h2('Evolutions') +
      p(`${n(content.evolutions)} skill evolutions (${ctx.link('evolution', 'index', 'list')}) upgrade a Grandmaster skill once your class questline reaches the right quest.`) +
      h2('General skills') +
      p(`${n(content.generalSkills)} general skills (${ctx.link('general-skill', 'index', 'list')}) can be learned by any class from skillbooks. You have 2 slots, plus one every 10 levels up to 50. Only slotted skills work, and slotted skills train as you use them. Study a book at the Library to keep it.`) +
      p(`See also ${ctx.link('paragon', 'index', 'the paragon board')} for post-cap progression.`),
  },
  {
    id: 'loot-and-items',
    title: 'Loot and items',
    summary: 'Rarities, quality, affixes, sockets, sets, runewords, corruption and enchanting.',
    keywords: ['rarity', 'quality', 'socket', 'set', 'runeword', 'affix', 'drops'],
    body: (ctx) => {
      const rarities = content.rarities.all() as { id: string; name: string; color: string; weight: number; affixes: [number, number]; socketChance: number; minNgPlus: number }[];
      const qualities = content.qualities.all() as { id: string; name: string; statMult: number; weight: number }[];
      return (
        p(`There are ${n(content.items)} items (bases, books, scrolls and quest items), ${n(content.uniques)} unique items, ${n(content.itemSets)} sets, ${n(content.runewords)} runewords and ${n(content.affixes)} affixes.`) +
        h2('Rarities') +
        table(rarities, [
          { label: 'Rarity', cell: (r) => ctx.linkIf('rarity', r.id, r.name), sort: (r) => r.name },
          { label: 'Drop weight', cell: (r) => esc(r.weight), sort: (r) => r.weight },
          { label: 'Affixes', cell: (r) => (r.affixes[1] ? `${r.affixes[0]}-${r.affixes[1]}` : '-') },
          { label: 'Socket chance', cell: (r) => (r.socketChance ? `${Math.round(r.socketChance * 100)}%` : '-'), sort: (r) => r.socketChance },
          { label: 'Needs NG+', cell: (r) => (r.minNgPlus ? `NG+${r.minNgPlus}` : '-'), sort: (r) => r.minNgPlus },
        ]) +
        p(`Weights show relative frequency in a plain random drop. Unique, set and boss-only rarities usually come from specific sources, see the rarity pages.`) +
        h2('Quality') +
        table(qualities, [
          { label: 'Quality', cell: (q) => esc(q.name), sort: (q) => q.statMult },
          { label: 'Stat multiplier', cell: (q) => `x${q.statMult}`, sort: (q) => q.statMult },
          { label: 'Weight', cell: (q) => esc(q.weight), sort: (q) => q.weight },
        ]) +
        h2('Affixes') +
        p(`Prefixes and suffixes roll within tiers that rise with item level (${ctx.link('affix', 'index', 'all affixes')}). Higher rarities roll more of them. The Workshop can reroll affixes.`) +
        h2('Sockets, runes and runewords') +
        p(`Drop a gem or rune onto gear to socket it. The right runes in the right order form a runeword (${ctx.link('runeword', 'index', 'runewords')}), for example ${ctx.linkIf('runeword', 'kindle', 'Kindle')}. Unsocketing costs gold.`) +
        h2('Sets and uniques') +
        p(`${ctx.link('item-set', 'index', 'Item sets')} grant bonuses as you wear more pieces (2, 4 and so on). Uniques are named items with fixed powers (${ctx.link('unique', 'index', 'all uniques')}).`) +
        h2('Weapon types') +
        p(`${n(content.weaponTypes)} weapon types (${ctx.link('weapon-type', 'index', 'list')}); each class can use certain ones, and each type has two Weapon Arts.`) +
        h2('Corruption') +
        p(`${n(content.corruptions)} corruptions twist an item for a boon or a price (${ctx.link('corruption', 'index', 'list')}).`) +
        h2('Upgrading and enchanting') +
        p(`The Workshop upgrades gear up to +15. Odds fall after +5, and past +10 a failure costs a level. It also adds sockets and raises quality.`) +
        callout('tip', `Use the loot filter to hide or auto-salvage low rarities, lock items you never want sold, and save three gear sets. Magic Find shifts drops toward higher rarities.`)
      );
    },
  },
  {
    id: 'crafting-and-professions',
    title: 'Crafting and professions',
    summary: 'Pick two professions, gather materials, craft recipes and upgrade gear.',
    keywords: ['workshop', 'recipes', 'blacksmithing', 'alchemy', 'gathering'],
    body: (ctx) => {
      const profs = content.professions.all() as { id: string; name: string; kind: string; description: string }[];
      const recipeCount = (id: string): number => content.recipes.all().filter((r) => (r as { profession: string }).profession === id).length;
      return (
        p(`In the Workshop pick two crafting professions and craft from your recipes. Recipe scrolls teach more. Anyone can gather at ore veins, herb patches and fishing spots in the wild.`) +
        h2('Professions') +
        table(profs, [
          { label: 'Profession', cell: (x) => ctx.linkIf('profession', x.id, x.name), sort: (x) => x.name },
          { label: 'Kind', cell: (x) => esc(x.kind) },
          { label: 'Recipes', cell: (x) => esc(recipeCount(x.id)), sort: (x) => recipeCount(x.id) },
          { label: 'What it does', cell: (x) => esc(x.description) },
        ]) +
        p(`${n(content.recipes)} recipes in all (${ctx.link('recipe', 'index', 'recipe list')}).`) +
        h2('Bench locks') +
        p(`Blacksmithing, alchemy and cooking are open from the start. Tailoring, jewelcrafting and enchanting need a bench in a particular land plus a level (Whisperwood 5, Sunken Caves 8, Ashen Desert 10). Practising a profession keeps it open. Upgrades past +5 need any crafting profession at level 10, and past +10 at level 25.`) +
        h2('Other uses of the Workshop') +
        ul(['Upgrade gear to +15', 'Reroll affixes', 'Add sockets', 'Raise quality']) +
        callout('tip', `Quests and crafting use what is in your stash too, so stash your materials. Foraging and Scavenging general skills find materials after battles.`)
      );
    },
  },
  {
    id: 'companions-and-party',
    title: 'Companions and party',
    summary: 'Recruiting, approval, bond perks, personal quests and leaving.',
    keywords: ['party', 'approval', 'bond', 'camp', 'recruit'],
    body: (ctx) => {
      const comps = content.companions.all() as { id: string; name: string; title?: string }[];
      return (
        p(`${comps.length} people can join you (${ctx.link('companion', 'index', 'companions')}). Up to three fight beside you; the rest wait in reserve. They level with you and you spend their skill points on the Party screen (O), or switch on Auto-allocate. You choose their gear.`) +
        h2('Approval') +
        p(`Each companion follows a god and has likes and dislikes. <b>Approval</b> rises and falls with your deeds, the gods you please and your choices in conversation.`) +
        ul([
          `At 20, 40, 60 and 80 approval you pick one of two <b>bond perks</b>.`,
          `At 30 they share a <b>personal quest</b>, which earns an oath perk.`,
          `At -50 they leave you and wait in their town until you make amends.`,
        ]) +
        h2('Camp') +
        p(`The Camp on the Party screen lets you sit by the fire with any companion and share evenings with some of them.`) +
        callout('note', `Enemies grow tougher with every companion in the fight. Each class is tuned as a companion so no slot is wasted: healers and pets fight weaker than you, lone strikers and casters stronger.`) +
        h2('Roster') +
        ul(comps.map((c) => `${ctx.link('companion', c.id, c.name)}${c.title ? ` - ${esc(c.title)}` : ''}`)) +
        callout('tip', `The Lone Wolf challenge removes companions and followers entirely; see ${ctx.link('guide', 'beginners-guide', "Beginner's guide")}.`)
      );
    },
  },
  {
    id: 'endgame-and-new-game-plus',
    title: 'Endgame and New Game+',
    summary: 'Rifts, the Boss Rush, other gauntlets, New Game+ tiers and the Twilight of the Gods.',
    spoiler: true,
    keywords: ['rift', 'boss rush', 'ng+', 'heresy', 'twilight', 'spire', 'paragon'],
    body: (ctx) =>
      callout('warn', `This page describes endgame systems and the New Game+ storyline.`) +
      p(`Endgame content stays out of sight until your hero reaches the level cap or finishes the story.`) +
      h2('Rifts') +
      p(`From level ${RIFTS.minLevel}, take a Rift Map (sold in the Black Market) to any town's Rift Gate: ${RIFTS.waves} waves and a Rift Guardian back to back. Tiers go to ${RIFTS.maxTier}; each adds ${RIFTS.threatPerTier}% enemy HP and damage and more Magic Find. Between waves you recover ${RIFTS.respitePct}% of HP and MP. From tier ${RIFTS.primordialTier} the Guardian can drop Primordial items. Clearing a tier opens the next.`) +
      h2('Other gauntlets') +
      ul([
        'The <b>Boss Rush</b> pits you against every dungeon boss in a row.',
        'The <b>Endless Spire</b>, Divine Trials, the Arena Champions league and a weekly seeded run.',
        `Challenge modes: ${(content.challenges.all() as { id: string; name: string }[]).map((c) => ctx.linkIf('challenge', c.id, c.name)).join(', ')}.`,
      ]) +
      h2('Paragon, pets and mounts') +
      p(`Past the cap, XP earns paragon points for the paragon board (${ctx.link('paragon', 'index', 'paragon nodes')}). Collect ${n(content.pets)} pets and ${n(content.mounts)} mounts (${ctx.linkIf('pet', 'index', 'pets')}, ${ctx.linkIf('mount', 'index', 'mounts')}).`) +
      h2('New Game+') +
      p(`After any ending, begin New Game+ from the Legacy panel on the Character screen. Your hero, gear, gold, companions and achievements carry over. The world rises to levels ${NG_PLUS.levelFrom}-${NG_PLUS.levelTo} and each later tier raises the top of that range until NG+${NG_PLUS.maxTier} reaches ${NG_PLUS.levelToMax}. Each tier past the first gives enemies ${NG_PLUS.threatPerTier}% more HP and damage and adds ${NG_PLUS.affixesPerTier} world affixes. Higher tiers also unlock more races and classes.`) +
      h2('Twilight of the Gods and heresy') +
      p(`In New Game+ the Twilight of the Gods unfolds beside the main story: the gods fall silent, their feuds turn to war, and the Nameless One offers you a deal. Accept and you walk the road of <b>heresy</b>: every point costs ${HERESY.favorCostPerPoint} favor with every god and grants void power at tiers (${HERESY.tiers.map((t) => `${esc(t.name)} ${t.min}`).join(', ')}). Maximum heresy is ${HERESY.max}. A temple will hear your atonement for gold.`) +
      p(`The story has ${n(content.endings)} endings across both playthroughs (${ctx.linkIf('ending', 'index', 'endings')}).`),
  },
  {
    id: 'world-and-exploration',
    title: 'World and exploration',
    summary: 'Roads, encounters, dungeons, chests, waypoints, towns and weather.',
    keywords: ['world', 'dungeon', 'town', 'camp', 'waypoint', 'weather'],
    body: (ctx) =>
      p(`Leave town to walk the world with WASD or arrows; E uses things, M opens the world map. Random encounters strike as you walk: more often at night, in fog and storms, and off the road. Roaming elites, champion packs and each zone's world boss stand on the map.`) +
      h2('Places') +
      ul([
        `${n(content.dungeons)} dungeons hold packs, treasure, often a rune-stone puzzle and a boss; they restock each day (${ctx.link('dungeon', 'index', 'dungeons')}).`,
        `${n(content.towns)} towns have an inn, temple, arena, Library, stash and a market (${ctx.link('town', 'index', 'towns')}).`,
        `${n(content.areas)} side areas and ${n(content.zones)} zones in all (${ctx.link('area', 'index', 'areas')}, ${ctx.link('zone', 'index', 'zones')}).`,
        `${n(content.factions)} factions grant lasting bonuses as you rise through their ranks (${ctx.link('faction', 'index', 'factions')}).`,
      ]) +
      h2('Chests and secrets') +
      p(`Some chests are locked (Skeleton Key or Lockpicking) and some trapped (Detect Traps). Lore pages and cracked walls hide secret alcoves. Treasure maps show a dig spot on their zone.`) +
      h2('Travel and rest') +
      p(`Waypoints let you fast travel for a little gold. Make camp in the wild to rest. Shrines let you worship away from town.`) +
      h2('Weather') +
      p(`Weather changes every few hours and affects battles (${ctx.link('weather', 'index', 'weather types')}).`) +
      callout('tip', `Walk the road in level order; see ${ctx.link('guide', 'leveling-and-progression', 'Leveling and progression')} for ranges.`),
  },
  {
    id: 'glossary',
    title: 'Glossary',
    summary: 'Short definitions of the terms used across the wiki.',
    keywords: ['terms', 'definitions', 'what is'],
    body: (ctx) => {
      const terms: [string, string][] = [
        ['Apostle', `A hero who passed a god's Trial of Apostleship (needs ${DEVOTION.tierFloors.exalted} favor).`],
        ['Approval', 'How much a companion likes you; drives bond perks and whether they stay.'],
        ['Birth sign', 'A creation choice tied to a god, with a small bonus.'],
        ['Blessing', 'A boon from a god, minor (bought with favor) or major (chosen when a tier is reached).'],
        ['Break', 'A full stagger bar: the enemy loses turns and takes extra damage.'],
        ['Chain', 'A damage bonus for consecutive party hits on one target.'],
        ['Edict', 'An order from your god once you are its Apostle.'],
        ['Favor', 'A god\'s opinion of you, from -100 to 1200.'],
        ['Grandmaster', 'Skill mastery rank 10.'],
        ['Heresy', 'Devotion to the Nameless One, opened in New Game+.'],
        ['Hybrid', 'A prestige class combining two classes, unlocked at class level 25 each.'],
        ['Keystone', 'A skill-tree node with big power and a real downside.'],
        ['Mastery Point', 'Earned by non-primary classes to spend on keystones and capstones.'],
        ['NG+', 'New Game+: replay with your hero, at higher levels and tougher enemies.'],
        ['Patron', 'The god you pick at a shrine; Pray spends its favor.'],
        ['Rift', 'A tiered endgame gauntlet entered from a Rift Gate.'],
        ['Runeword', 'A specific order of runes socketed in gear.'],
        ['Slayer rank', 'Kills of a creature type give bonus damage against it.'],
        ['Stagger', 'The yellow bar that fills as you hit an enemy.'],
        ['Ultimate', 'A class skill unlocked when the ultimate gauge hits 100%.'],
      ];
      return (
        table(terms, [
          { label: 'Term', cell: ([t]) => esc(t), sort: ([t]) => t },
          { label: 'Meaning', cell: ([, d]) => esc(d) },
        ], { filter: true }) +
        p(`Stats are defined on ${ctx.linkIf('stat', 'index', 'the stat list')} (for example ${esc(dif('str', 'Strength'))}) and mechanics on ${ctx.linkIf('mechanic', 'index', 'mechanics')}. Back to ${ctx.link('guides', 'index', 'all guides')}.`)
      );
    },
  },
];

const guides: PageSpec[] = defs.map((d) => ({
  ns: 'guide',
  id: d.id,
  title: d.title,
  summary: d.summary,
  categories: ['Guides'],
  spoiler: d.spoiler,
  keywords: d.keywords,
  render: d.body,
}));

export const guidesSection = simpleSection({
  id: 'guides',
  title: 'Guides',
  group: 'Getting Started',
  blurb: 'How the game works, from your first fight to New Game+.',
  tables: [],
  extra: guides,
});
