import type { EncounterDef } from '../../engine/combat/types';
import type { QuestDef } from '../../engine/quests/types';
import { GODS } from '../gods';
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

const OFFERING_NAMES: Record<string, string> = { 'holy-water': 'Holy Water', 'health-potion-lesser': 'Lesser Health Potion', healroot: 'Healroot', 'skeleton-key': 'Skeleton Key', 'beast-fang': 'Beast Fang', 'iron-ore': 'Iron Ore', 'faint-essence': 'Faint Essence', 'bone-dust': 'Bone Dust', silverfin: 'Silverfin', 'mithril-ore': 'Mithril Ore' };

export const GOD_ENCOUNTERS: EncounterDef[] = GODS.filter((g) => !g.hidden).map((g) => ({ ...encounter(`q-herald-${g.id}`, `${g.name}’s Herald`, 25, [`punisher-${g.id}`, `punisher-${g.id}`], true), scalesToHero: true }));

export const GOD_QUESTS: QuestDef[] = PANTHEON.flatMap((p): QuestDef[] => {
  const god = GODS.find((g) => g.id === p.id);
  const name = god?.name ?? p.id;
  const priest = GOD_PRIESTS[p.id] as string;
  const zones = ZONES.filter((z) => z.shrines.includes(p.id)).slice(0, 2);
  const [offering, offeringCount] = OFFERINGS[p.id] ?? ['healroot', 3];
  const id = (n: string): string => `god-${p.id}-${n}`;
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
  ];
});
