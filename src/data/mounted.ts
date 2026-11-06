import type { SkillDef } from '../engine/skills/types';
import type { ModifierSpec } from '../engine/stats/modifiers';
import { combat, dmg, status } from './general/skills';

/**
 * Mounted Combat (Section I-7c, item 223): a hero with a mount out fights from the saddle. Two mounted skills (charge, trample), and
 * a Dismount reaction: the first blow that would leave the rider under 30% HP throws them instead, and the mount soaks most of it.
 * The Weeping Steppe is a mounted place: on foot the grass slows you down.
 */
export const MOUNTED = {
  dismountPct: 30,
  soakPct: 70,
  /** Mounted heroes in a fight. */
  rider: [{ stat: 'speed', type: 'percent', value: 6 }, { stat: 'accuracy', type: 'flat', value: 3 }] as ModifierSpec[],
  /** On the Weeping Steppe without a mount. */
  steppeOnFoot: [{ stat: 'speed', type: 'percent', value: -20 }, { stat: 'accuracy', type: 'flat', value: -8 }, { stat: 'dodge', type: 'flat', value: -4 }] as ModifierSpec[],
};

export const MOUNTED_SKILLS: SkillDef[] = [
  combat({ id: 'g-mount-charge', name: 'Charge', description: 'A thundering run at one foe: 230% ATK and a chance to Stun. Mounted only.', tags: ['Attack', 'Melee', 'Physical', 'Mounted'], element: 'physical', targeting: 'enemy', cost: {}, cooldown: 3, stagger: 2, damage: dmg('physicalAttack', 2.3, 0.14), effects: [status('stun', 1, 40)] }),
  combat({ id: 'g-mount-trample', name: 'Trample', description: 'Ride through the line: 95% ATK to every enemy and they are Slowed. Mounted only.', tags: ['Attack', 'Melee', 'Physical', 'AoE', 'Mounted'], element: 'physical', targeting: 'allEnemies', cost: {}, cooldown: 4, damage: dmg('physicalAttack', 0.95, 0.07), effects: [status('slow', 2, 70)] }),
];
