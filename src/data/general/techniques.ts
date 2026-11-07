import type { GeneralSkillDef } from '../../engine/skills/generalTypes';
import type { SkillDef } from '../../engine/skills/types';
import { combat, dmg, status } from './skills';

/**
 * Battle Techniques (Section I-7b, item 212): Tactic Dice for the martial classes. Each fight a Warrior, Knight, Brawler or Marshal holds
 * Tactic Dice (`TECHNIQUE_RULES`); a technique costs one or two and is a general combat skill (cost.tactic), so it sits in the
 * hero's General slots like any other. Twenty-four techniques: the first few arrive with the class, the rest every few levels.
 */
export const TECHNIQUE_CLASSES = ['warrior', 'knight', 'brawler', 'marshal'] as const;
/** The Warrior's optional Tactics mode: Rage is counted in Tactic Dice, one die per this much Rage. */
export const RAGE_TACTICS = { perDie: 30 };
export const TECHNIQUE_RULES = { base: 3, perLevels: 12, max: 7, onKill: 1, knownAt1: 4, everyLevels: 3 };

type T = Omit<SkillDef, 'source' | 'maxRank' | 'cost' | 'tags' | 'cooldown'> & { dice: 1 | 2; cd?: number; tags?: string[] };
const tech = (t: T): SkillDef => {
  const { dice, cd, tags, ...rest } = t;
  return combat({ ...rest, tags: ['Technique', 'Physical', ...(tags ?? [])] as SkillDef['tags'], cost: { tactic: dice }, cooldown: cd ?? 1 });
};

export const TECHNIQUE_COMBAT: SkillDef[] = [
  tech({ id: 'g-tech-trip', name: 'Trip', description: 'A low sweep: 70% ATK and a chance to Slow.', element: 'physical', targeting: 'enemy', dice: 1, damage: dmg('physicalAttack', 0.7, 0.05), effects: [status('slow', 2, 70)] }),
  tech({ id: 'g-tech-feint', name: 'Feint', description: 'A false opening: 60% ATK and the target is Vulnerable.', element: 'physical', targeting: 'enemy', dice: 1, damage: dmg('physicalAttack', 0.6, 0.05), effects: [status('vulnerable', 2, 80)] }),
  tech({ id: 'g-tech-disarm', name: 'Disarm', description: 'Knock the weapon aside: 65% ATK and Weaken.', element: 'physical', targeting: 'enemy', dice: 1, damage: dmg('physicalAttack', 0.65, 0.05), effects: [status('weaken', 3, 75)] }),
  tech({ id: 'g-tech-rally', name: 'Rally', description: 'A shout that steadies the line: heal every ally for 8% max HP.', element: 'holy', targeting: 'allAllies', dice: 1, cd: 3, tags: ['Heal'], effects: [{ kind: 'heal', percentMaxHp: 8, target: 'target' }] }),
  tech({ id: 'g-tech-shieldbash', name: 'Shield Bash', description: 'Slam the guard in: 80% ATK and a chance to Stun.', element: 'physical', targeting: 'enemy', dice: 1, damage: dmg('physicalAttack', 0.8, 0.06), effects: [status('stun', 1, 45)] }),
  tech({ id: 'g-tech-riposte', name: 'Counterstroke', description: 'Brace and answer: shield 10% max HP and Taunt for a turn.', element: 'physical', targeting: 'self', dice: 1, cd: 3, tags: ['Buff'], effects: [{ kind: 'shield', percentMaxHp: 10, target: 'self' }, status('taunt', 2, undefined, 'self')] }),
  tech({ id: 'g-tech-sunder', name: 'Sunder', description: 'Break their armour: 75% ATK and Vulnerable for 3 turns.', element: 'physical', targeting: 'enemy', dice: 1, damage: dmg('physicalAttack', 0.75, 0.05), effects: [status('vulnerable', 3, 100)] }),
  tech({ id: 'g-tech-hamstring', name: 'Hamstring', description: 'Cut the leg: 60% ATK, Bleed and Slow.', element: 'physical', targeting: 'enemy', dice: 1, damage: dmg('physicalAttack', 0.6, 0.05), effects: [status('bleed', 3, 80), status('slow', 2, 60)] }),
  tech({ id: 'g-tech-cleave', name: 'Cleave', description: 'Strike every foe: 55% ATK to all enemies.', element: 'physical', targeting: 'allEnemies', dice: 2, cd: 2, damage: dmg('physicalAttack', 0.55, 0.05) }),
  tech({ id: 'g-tech-guard', name: 'Guarded Stance', description: 'Take half the blows meant for an ally for 2 turns.', element: 'physical', targeting: 'ally', dice: 1, cd: 3, tags: ['Buff'], effects: [{ kind: 'guard', share: 50, duration: 2 }] }),
  tech({ id: 'g-tech-taunt', name: 'Mock', description: 'Insult them into looking only at you for 2 turns.', element: 'physical', targeting: 'self', dice: 1, cd: 3, tags: ['Buff'], effects: [status('taunt', 3, undefined, 'self')] }),
  tech({ id: 'g-tech-push', name: 'Shove', description: 'Put them off balance: 50% ATK and their next turn comes later.', element: 'physical', targeting: 'enemy', dice: 1, damage: dmg('physicalAttack', 0.5, 0.05), effects: [{ kind: 'timeShift', turns: 1, target: 'target' }] }),
  tech({ id: 'g-tech-lunge', name: 'Lunge', description: 'A long reach: 110% ATK, always hits.', element: 'physical', targeting: 'enemy', dice: 1, cd: 2, damage: dmg('physicalAttack', 1.1, 0.08) }),
  tech({ id: 'g-tech-whirl', name: 'Whirlwind', description: 'Spin through the room: 70% ATK to all enemies.', element: 'physical', targeting: 'allEnemies', dice: 2, cd: 3, damage: dmg('physicalAttack', 0.7, 0.06) }),
  tech({ id: 'g-tech-pin', name: 'Pin Down', description: 'Hold them still: 60% ATK and Entangle.', element: 'physical', targeting: 'enemy', dice: 1, damage: dmg('physicalAttack', 0.6, 0.05), effects: [status('entangle', 2, 70)] }),
  tech({ id: 'g-tech-headbutt', name: 'Headbutt', description: 'Rattle their skull: 75% ATK and Blind.', element: 'physical', targeting: 'enemy', dice: 1, damage: dmg('physicalAttack', 0.75, 0.06), effects: [status('blind', 2, 60)] }),
  tech({ id: 'g-tech-inspire', name: 'Inspiring Word', description: 'Everyone fights harder for 3 turns.', element: 'holy', targeting: 'allAllies', dice: 2, cd: 4, tags: ['Buff'], effects: [status('inspired', 3, undefined, 'target')] }),
  tech({ id: 'g-tech-dirty', name: 'Dirty Trick', description: 'A handful of dust: 40% ATK, Blind and Confuse.', element: 'physical', targeting: 'enemy', dice: 1, damage: dmg('physicalAttack', 0.4, 0.04), effects: [status('blind', 2, 80), status('confuse', 1, 40)] }),
  tech({ id: 'g-tech-brace', name: 'Brace for Impact', description: 'Plant your feet: shield 14% max HP.', element: 'physical', targeting: 'self', dice: 1, cd: 3, tags: ['Buff'], effects: [{ kind: 'shield', percentMaxHp: 14, target: 'self' }] }),
  tech({ id: 'g-tech-hook', name: 'Hooking Strike', description: 'Pull them out of position: 70% ATK and bring your next turn forward.', element: 'physical', targeting: 'enemy', dice: 2, cd: 3, damage: dmg('physicalAttack', 0.7, 0.06), effects: [{ kind: 'timeShift', turns: -1, target: 'self' }] }),
  tech({ id: 'g-tech-quickdraw', name: 'Second Wind', description: 'Draw breath mid-fight: heal 15% max HP.', element: 'physical', targeting: 'self', dice: 1, cd: 4, tags: ['Heal'], effects: [{ kind: 'heal', percentMaxHp: 15, target: 'self' }] }),
  tech({ id: 'g-tech-finisher', name: 'Opening Gambit', description: 'Hit a wounded foe hard: 140% ATK.', element: 'physical', targeting: 'enemy', dice: 2, cd: 2, damage: dmg('physicalAttack', 1.4, 0.1) }),
  tech({ id: 'g-tech-warcry', name: 'Rallying Cry', description: 'Cool the party’s skills by 1 turn.', element: 'holy', targeting: 'allAllies', dice: 2, cd: 5, tags: ['Buff'], effects: [{ kind: 'reduceCooldowns', turns: 1 }] }),
  tech({ id: 'g-tech-masterstroke', name: 'Master Stroke', description: 'The perfect blow: 180% ATK.', element: 'physical', targeting: 'enemy', dice: 2, cd: 3, damage: dmg('physicalAttack', 1.8, 0.12) }),
];

/** The order a hero learns them in (twenty-four of them). */
export const TECHNIQUE_ORDER = TECHNIQUE_COMBAT.map((t) => t.id.replace('g-', ''));

const G = (id: string, name: string, description: string, combatSkill: string): GeneralSkillDef => ({ id, name, category: 'combat', description, rarity: 'common', maxRank: 10, combatSkill });
export const TECHNIQUE_GENERAL: GeneralSkillDef[] = TECHNIQUE_COMBAT.map((t) => G(t.id.replace('g-', ''), t.name, `A Battle Technique (costs ${t.cost.tactic} Tactic Dice). ${t.description}`, t.id));
