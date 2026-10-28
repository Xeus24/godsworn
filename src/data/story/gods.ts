import type { EncounterDef } from '../../engine/combat/types';
import type { QuestDef } from '../../engine/quests/types';
import { GODS } from '../gods';
import { GREATER_OFFERING_NAMES, GREATER_OFFERINGS, GREATER_PRIESTS, GREATER_WILL } from '../godsGreater';
import { PANTHEON } from '../pantheon';
import { ZONES } from '../world/zones';
import type { ObjectiveDef } from '../../engine/quests/types';
import { any, deed, deliver, encounter, fight, kill, near, questDone, stage, state } from './helpers';

/**
 * Every god's questline, generated from the pantheon: four quests that lead
 * from first acknowledgement to the Trial of Apostleship. Each is given (and
 * handed in) at the god's temple, by its priest.
 *
 * 1. Pilgrim: visit the god's shrines (from Acknowledged).
 * 2. The Will: do what the god likes, and bring an offering it values (Favored).
 * 3. The Herald's Test: the god sends its herald to test you (Devoted).
 * 4. Trial of Apostleship: starts by itself at Exalted and wraps the three trial fights.
 */

/** Each god's priest (an NPC at its temple). */
export const GOD_PRIESTS: Record<string, string> = {
  ...GREATER_PRIESTS,
  solenne: 'lector-amara',
  hesha: 'sister-wenna',
  ysolde: 'mother-thessa',
  vex: 'grinning-jack',
  kael: 'warpriest-tavus',
  thalor: 'forgemaster-brunhild',
  aurelis: 'loremaster-ivo',
  morrath: 'pale-warden',
  nymira: 'tidecaller-maren',
  grimvald: 'factor-goldmere',
};

/** What each god wants brought to its temple: things you can buy, gather or salvage. */
const OFFERINGS: Record<string, [itemId: string, count: number]> = {
  ...GREATER_OFFERINGS,
  solenne: ['holy-water', 2],
  hesha: ['health-potion-lesser', 3],
  ysolde: ['healroot', 6],
  vex: ['skeleton-key', 1],
  kael: ['beast-fang', 6],
  thalor: ['iron-ore', 8],
  aurelis: ['faint-essence', 6],
  morrath: ['bone-dust', 6],
  nymira: ['silverfin', 3],
  grimvald: ['mithril-ore', 3],
};

/** What each god asks you to do for it in The Will: one of its likes, made into an errand anyone can run. */
const WILL: Record<string, ObjectiveDef> = {
  ...GREATER_WILL,
  solenne: kill('d', 'Smite the undead', 6, { enemyType: 'undead' }),
  morrath: kill('d', 'Bring an end to the mighty (elites and bosses)', 3, { tiers: ['elite', 'champion', 'miniboss', 'boss', 'worldBoss'] }),
  kael: deed('d', 'Win battles', 6, { event: 'battleWon' }),
  ysolde: kill('d', 'Hunt beasts', 8, { enemyType: 'beast' }),
  vex: deed('d', 'Land lucky strikes (critical hits)', 10, { event: 'crit' }),
  thalor: deed('d', 'Craft something at the Workshop', 3, { event: 'craft' }),
  nymira: kill('d', 'Clear the flooded Sunken Caves of their creatures', 8, { zone: 'sunken-caves' }),
  aurelis: deed('d', 'Uncover the unknown (identify items)', 3, { event: 'identify' }),
  hesha: deed('d', 'Rest and care for yourself (camp, inn or home)', 3, { event: 'rest' }),
  grimvald: state('d', 'Show your prosperity: have 1,500 gold to your name', { kind: 'gold', min: 1500 }),
};

const OFFERING_NAMES: Record<string, string> = {
  ...GREATER_OFFERING_NAMES, 'holy-water': 'Holy Water', 'health-potion-lesser': 'Lesser Health Potion', healroot: 'Healroot', 'skeleton-key': 'Skeleton Key', 'beast-fang': 'Beast Fang', 'iron-ore': 'Iron Ore', 'faint-essence': 'Faint Essence', 'bone-dust': 'Bone Dust', silverfin: 'Silverfin', 'mithril-ore': 'Mithril Ore' };

/** A second offering for The Tithe: something different from the first. */
const TITHE: Record<string, [itemId: string, count: number, name: string]> = {
  solenne: ['health-potion-lesser', 4, 'Lesser Health Potion'], morrath: ['faint-essence', 5, 'Faint Essence'], kael: ['iron-ore', 6, 'Iron Ore'], ysolde: ['silverfin', 3, 'Silverfin'],
  vex: ['bone-dust', 5, 'Bone Dust'], thalor: ['mithril-ore', 2, 'Mithril Ore'], nymira: ['healroot', 5, 'Healroot'], aurelis: ['holy-water', 2, 'Holy Water'],
  hesha: ['healroot', 6, 'Healroot'], grimvald: ['iron-ore', 10, 'Iron Ore'], lyssara: ['healroot', 4, 'Healroot'], ordrun: ['mithril-ore', 2, 'Mithril Ore'],
  seraphel: ['silverfin', 4, 'Silverfin'], mirrin: ['holy-water', 2, 'Holy Water'],
};

/** What The Vigil asks: a second errand in the god's character. */
const VIGIL: Record<string, ObjectiveDef> = {
  solenne: kill('d', 'Put the restless dead to rest', 12, { enemyType: 'undead' }),
  morrath: kill('d', 'Fell elites and champions', 5, { tiers: ['elite', 'champion', 'miniboss'] }),
  kael: kill('d', 'Defeat bosses and their lieutenants', 3, { tiers: ['miniboss', 'boss', 'worldBoss'] }),
  ysolde: kill('d', 'Cull the beasts of the Whisperwood', 10, { zone: 'whisperwood' }),
  vex: deed('d', 'Gamble and win (or lose gloriously) three times', 3, { event: 'gamble' }),
  thalor: deed('d', 'Craft six things at the Workshop', 6, { event: 'craft' }),
  nymira: kill('d', 'Clear the Stormcoast of what the tide brought', 10, { zone: 'stormcoast' }),
  aurelis: deed('d', 'Read skillbooks and Grimoires', 3, { event: 'bookRead' }),
  hesha: deed('d', 'Rest and recover six times', 6, { event: 'rest' }),
  grimvald: state('d', 'Grow your fortune to 5,000 gold', { kind: 'gold', min: 5000 }),
  lyssara: deed('d', 'Rest and dream six times', 6, { event: 'rest' }),
  ordrun: kill('d', 'Outlast elites and champions', 4, { tiers: ['elite', 'champion', 'miniboss'] }),
  seraphel: deed('d', 'Land twenty critical hits', 20, { event: 'crit' }),
  mirrin: deed('d', 'Identify six items', 6, { event: 'identify' }),
};

export const GOD_ENCOUNTERS: EncounterDef[] = GODS.filter((g) => !g.hidden).map((g) => ({ ...encounter(`q-herald-${g.id}`, `${g.name}’s Herald`, 25, [`punisher-${g.id}`, `punisher-${g.id}`], true), scalesToHero: true }));

export const GOD_QUESTS: QuestDef[] = PANTHEON.flatMap((p): QuestDef[] => {
  const god = GODS.find((g) => g.id === p.id);
  const name = god?.name ?? p.id;
  const priest = GOD_PRIESTS[p.id] as string;
  const zones = ZONES.filter((z) => z.shrines.includes(p.id)).slice(0, 2);
  const [offering, offeringCount] = OFFERINGS[p.id] ?? ['healroot', 3];
  const id = (n: string): string => `god-${p.id}-${n}`;
  const tithe = TITHE[p.id] ?? ['healroot', 4, 'Healroot'];
  const rivalId = p.rivals[0] ?? p.allies[0] ?? 'solenne';
  const rivalName = GODS.find((g) => g.id === rivalId)?.name ?? rivalId;
  const rivalPantheon = PANTHEON.find((x) => x.id === rivalId);
  const rivalShrine = rivalPantheon?.shrine ?? 'shrine';
  const rivalZone = ZONES.find((z) => z.shrines.includes(rivalId))?.id ?? 'meadowlands';
  return [
    {
      id: id('pilgrim'), name: `Pilgrim of ${name}`, kind: 'god', level: 8, giver: priest, requires: { kind: 'favor', god: p.id, tier: 'acknowledged' },
      summary: `“${name} has noticed you. Now let ${name} see you walk. Visit ${zones.length > 1 ? 'the shrines' : 'the shrine'} of ${name} in ${zones.map((z) => z.name).join(' and ')}, and pray there.”`,
      stages: [stage('walk', `Visit ${name}’s ${zones.length > 1 ? 'shrines' : 'shrine'}.`, zones.map((z, i) => ({ id: `v${i}`, text: `Pray at the ${p.shrine} in ${z.name}`, kind: 'visit' as const, at: near(z.id, 'shrine', p.id, p.shrine, { distance: 1 }) })), { turnIn: priest, turnInText: `“${name} saw you kneel. That is how it begins.”` })],
      rewards: { xp: 0.25, gold: 6, favor: { [p.id]: 40 } },
    },
    {
      id: id('will'), name: `The Will of ${name}`, kind: 'god', level: 16, giver: priest, requires: { kind: 'all', conds: [{ kind: 'favor', god: p.id, tier: 'favored' }, questDone(id('pilgrim'))] },
      summary: `“Faith is a verb. ${name} asks this of you: ${(WILL[p.id]?.text ?? 'serve').toLowerCase()}. Then bring an offering to the temple: ${offeringCount} × ${OFFERING_NAMES[offering] ?? offering}.”`,
      stages: [
        stage('deeds', `Do as ${name} wills, and bring an offering.`, [
          ...(WILL[p.id] ? [WILL[p.id] as ObjectiveDef] : []),
          deliver('o', `Bring an offering to the temple`, offering, offeringCount, priest),
        ], { turnIn: priest, turnInText: `“${name} is pleased. Truly pleased. That does not happen often.”` }),
      ],
      rewards: { xp: 0.3, gold: 8, favor: { [p.id]: 80 }, gear: { rarity: 'rare' } },
    },
    {
      id: id('herald'), name: `${name}’s Herald`, kind: 'god', level: 26, giver: priest, requires: { kind: 'all', conds: [{ kind: 'favor', god: p.id, tier: 'devoted' }, questDone(id('will'))] },
      summary: `“${name} wishes to test you before the trial. The herald will meet you at ${p.shrine} in ${zones[0]?.name ?? 'the wild'}. Do not hold back. It will not.”`,
      stages: [
        stage('test', `Meet ${name}’s herald at the shrine and pass its test.`, [fight('f', `Pass the herald’s test`, `q-herald-${p.id}`, near(zones[0]?.id ?? 'meadowlands', 'shrine', p.id, `${name}’s herald`, { distance: 4 }))], { turnIn: priest, turnInText: `“You stand. Good. When ${name} calls you to the trial, you will be ready.”` }),
      ],
      rewards: { xp: 0.4, gold: 10, favor: { [p.id]: 100 }, items: [{ itemId: 'divine-shard', qty: 1 }] },
    },
    {
      id: id('trial'), name: `Trial of Apostleship: ${name}`, kind: 'god', level: 35, auto: true, requires: any({ kind: 'favor', god: p.id, tier: 'exalted' }, { kind: 'trialStage', god: p.id, min: 1 }),
      summary: `${name} calls you to the Trial of Apostleship: the Ordeal, the Gauntlet and ${name}’s own Aspect, faced at the temple.`,
      stages: [
        stage('trial', `Face the three stages of ${name}’s trial at the temple (Pantheon screen).`, [state('t', `Win the Ordeal, the Gauntlet and the Aspect`, { kind: 'trialStage', god: p.id, min: 3 })], { turnIn: priest, turnInText: `“It is done. Go to the altar, and if you still wish it, rise as ${name}’s Apostle.”` }),
      ],
      rewards: { xp: 0.5, gold: 15, title: `Chosen of ${name}` },
    },
    {
      id: id('tithe'), name: `The Tithe of ${name}`, kind: 'god', level: 12, giver: priest, requires: { kind: 'all', conds: [{ kind: 'favor', god: p.id, tier: 'acknowledged' }, questDone(id('pilgrim'))] },
      summary: `“A tithe is not a price. It is a habit. ${name} asks for ${tithe[1]} × ${tithe[2]} this time, and for you to keep asking what else ${name} might want.”`,
      stages: [stage('give', `Bring ${tithe[1]} × ${tithe[2]} to the temple of ${name}.`, [deliver('o', 'Bring the tithe', tithe[0], tithe[1], priest)], { turnIn: priest, turnInText: `“Received, and noted. ${name} remembers small kindnesses better than large ones.”` })],
      rewards: { xp: 0.2, gold: 6, favor: { [p.id]: 50 } },
    },
    {
      id: id('vigil'), name: `The Vigil of ${name}`, kind: 'god', level: 20, giver: priest, requires: { kind: 'all', conds: [{ kind: 'favor', god: p.id, tier: 'favored' }, questDone(id('tithe'))] },
      summary: `“There is a kind of faith that is only work. ${name} asks you to do this, and to do it without being thanked: ${(VIGIL[p.id]?.text ?? 'serve').toLowerCase()}.”`,
      stages: [stage('deeds', `Keep ${name}’s vigil.`, VIGIL[p.id] ? [VIGIL[p.id] as ObjectiveDef] : [], { turnIn: priest, turnInText: `“It is done, and nobody will write it down. ${name} will.”` })],
      rewards: { xp: 0.3, gold: 8, favor: { [p.id]: 80 }, items: [{ itemId: 'divine-shard', qty: 1 }] },
    },
    {
      id: id('rival'), name: `Against ${rivalName}`, kind: 'god', level: 30, giver: priest, requires: { kind: 'all', conds: [{ kind: 'favor', god: p.id, tier: 'devoted' }, questDone(id('herald'))] },
      summary: `“${name} and ${rivalName} have disagreed for longer than there have been mortals to watch. ${name} would like you to answer ${rivalName}’s herald at ${rivalShrine}, and to do it politely.”`,
      stages: [stage('duel', `Meet ${rivalName}’s herald at the ${rivalShrine} and defeat it.`, [fight('f', `Defeat the herald of ${rivalName}`, `q-herald-${rivalId}`, near(rivalZone, 'shrine', rivalId, `${rivalName}’s herald`, { distance: 4 }))], { turnIn: priest, turnInText: `“A fair fight, and a fair loss for them. They will be gracious about it. Eventually.”` })],
      rewards: { xp: 0.4, gold: 12, favor: { [p.id]: 100 }, gear: { rarity: 'epic' } },
    },
    {
      id: id('covenant'), name: `The Covenant of ${name}`, kind: 'god', level: 40, giver: priest, requires: { kind: 'all', conds: [{ kind: 'favor', god: p.id, tier: 'exalted' }, questDone(id('trial'))] },
      summary: `“The trial is behind you. What is ahead of you is a covenant: three shards of divinity, offered back, so that ${name} knows you are not simply taking.”`,
      stages: [stage('give', `Bring three Divine Shards to the temple of ${name}.`, [deliver('o', 'Offer the shards', 'divine-shard', 3, priest)], { turnIn: priest, turnInText: `“It is sealed. You are ${name}’s, and ${name} is yours, for as long as either of you remembers.”` })],
      rewards: { xp: 0.6, gold: 18, favor: { [p.id]: 150 }, gear: { rarity: 'legendary' }, title: `Covenant of ${name}` },
    },
  ];
});
