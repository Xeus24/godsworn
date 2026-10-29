import type { EffectSpec } from '../engine/effects/types';
import type { SkillDef } from '../engine/skills/types';
import type { Element } from '../engine/stats/types';

type Target = 'enemy' | 'allEnemies' | 'frontRow' | 'self';
/** [id, name, flavor, mult, hits, element, target, status, duration, chance] */
type Art = [id: string, name: string, flavor: string, mult: number, hits: number, element: Element, target: Target, status?: string, duration?: number, chance?: number];
type Row = [type: string, stat: 'physicalAttack' | 'magicAttack', a: Art, b: Art];

const ROWS: Row[] = [
  ['sword', 'physicalAttack', ['wa-crossing-cut', 'Crossing Cut', 'Two cuts in an X.', 0.75, 2, 'physical', 'enemy', 'bleed', 3, 40], ['wa-guard-break', 'Guard Break', 'A clean strike at the shield arm.', 1.0, 1, 'physical', 'enemy', 'weaken', 2, 70]],
  ['greatsword', 'physicalAttack', ['wa-sweeping-arc', 'Sweeping Arc', 'A wide cut across the front rank.', 1.1, 1, 'physical', 'frontRow'], ['wa-executioners-fall', 'Executioner’s Fall', 'A two-handed overhead chop.', 2.0, 1, 'physical', 'enemy', 'vulnerable', 2, 60]],
  ['axe', 'physicalAttack', ['wa-hew', 'Hew', 'A hard, splitting blow.', 1.5, 1, 'physical', 'enemy', 'bleed', 3, 50], ['wa-cleaving-throw', 'Cleaving Throw', 'Hurl it and call it back.', 1.0, 1, 'physical', 'allEnemies']],
  ['greataxe', 'physicalAttack', ['wa-whirlwind', 'Whirlwind', 'Spin with the head out.', 0.9, 1, 'physical', 'allEnemies'], ['wa-skullsplitter', 'Skullsplitter', 'Straight down.', 2.2, 1, 'physical', 'enemy', 'stun', 1, 35]],
  ['mace', 'physicalAttack', ['wa-crushing-blow', 'Crushing Blow', 'Dents what it hits.', 1.4, 1, 'physical', 'enemy', 'weaken', 2, 50], ['wa-shield-rattle', 'Shield Rattle', 'The sound alone is a weapon.', 0.8, 1, 'physical', 'enemy', 'stun', 1, 40]],
  ['warhammer', 'physicalAttack', ['wa-earth-shaker', 'Earth-Shaker', 'The ground answers.', 1.2, 1, 'earth', 'frontRow', 'stun', 1, 30], ['wa-pulverize', 'Pulverize', 'Nothing left to hit.', 2.1, 1, 'physical', 'enemy']],
  ['dagger', 'physicalAttack', ['wa-vein-seeker', 'Vein-Seeker', 'Three quick stabs.', 0.5, 3, 'physical', 'enemy', 'bleed', 3, 45], ['wa-shadow-step', 'Shadow Step', 'Step out of sight.', 0, 0, 'shadow', 'self', 'stealth', 2, 100]],
  ['rapier', 'physicalAttack', ['wa-lunge', 'Lunge', 'One long, perfect line.', 1.7, 1, 'physical', 'enemy'], ['wa-riposte-stance', 'Riposte Stance', 'Wait, and answer.', 0, 0, 'physical', 'self', 'inspired', 3, 100]],
  ['spear', 'physicalAttack', ['wa-pinning-thrust', 'Pinning Thrust', 'Fix them in place.', 1.4, 1, 'physical', 'enemy', 'entangle', 2, 60], ['wa-line-breaker', 'Line-Breaker', 'Through the front and the back.', 1.0, 1, 'physical', 'allEnemies']],
  ['scythe', 'physicalAttack', ['wa-reap', 'Reap', 'A harvest swing.', 1.1, 1, 'shadow', 'allEnemies'], ['wa-last-furrow', 'Last Furrow', 'One neat cut.', 1.9, 1, 'shadow', 'enemy', 'doom', 3, 30]],
  ['fist', 'physicalAttack', ['wa-flurry', 'Flurry', 'Five strikes in a breath.', 0.4, 5, 'physical', 'enemy'], ['wa-palm-break', 'Palm Break', 'A strike that rings.', 1.2, 1, 'physical', 'enemy', 'stun', 1, 40]],
  ['bow', 'physicalAttack', ['wa-triple-shot', 'Triple Shot', 'Three arrows, one draw.', 0.6, 3, 'physical', 'enemy'], ['wa-pinning-arrow', 'Pinning Arrow', 'Through the foot.', 1.0, 1, 'physical', 'enemy', 'mired', 3, 80]],
  ['crossbow', 'physicalAttack', ['wa-heavy-bolt', 'Heavy Bolt', 'Winched and released.', 2.0, 1, 'physical', 'enemy', 'weaken', 2, 40], ['wa-volley', 'Volley', 'Everyone gets one.', 0.8, 1, 'physical', 'allEnemies']],
  ['throwing', 'physicalAttack', ['wa-knife-fan', 'Knife Fan', 'A spray of blades.', 0.7, 1, 'physical', 'allEnemies', 'bleed', 2, 30], ['wa-marked-throw', 'Marked Throw', 'One throw, one target.', 1.2, 1, 'physical', 'enemy', 'marked', 3, 80]],
  ['staff', 'magicAttack', ['wa-staff-sweep', 'Staff Sweep', 'Channel through the wood.', 1.1, 1, 'arcane', 'frontRow', 'slow', 2, 40], ['wa-arc-lash', 'Arc Lash', 'Lightning along the grain.', 1.6, 1, 'lightning', 'enemy', 'stun', 1, 25]],
  ['wand', 'magicAttack', ['wa-quick-cast', 'Quick Cast', 'Two small, sharp spells.', 0.7, 2, 'arcane', 'enemy'], ['wa-hex-flick', 'Hex Flick', 'A flick and a bad day.', 0.9, 1, 'shadow', 'enemy', 'confuse', 2, 55]],
  ['tome', 'magicAttack', ['wa-page-turn', 'Page Turn', 'Read it out loud.', 1.3, 1, 'arcane', 'enemy', 'silence', 2, 50], ['wa-bookmark', 'Bookmark', 'Mark the place; mark the foe.', 0.5, 1, 'arcane', 'enemy', 'marked', 3, 100]],
  ['orb', 'magicAttack', ['wa-orb-burst', 'Orb Burst', 'The glass goes bright.', 1.0, 1, 'arcane', 'allEnemies', 'blind', 2, 45], ['wa-scry', 'Scry', 'See what is coming.', 0, 0, 'arcane', 'self', 'inspired', 3, 100]],
  ['instrument', 'magicAttack', ['wa-discordant-chord', 'Discordant Chord', 'A chord with an edge.', 1.0, 1, 'arcane', 'allEnemies', 'confuse', 2, 40], ['wa-rally-riff', 'Rally Riff', 'A tune for the whole party.', 0, 0, 'arcane', 'self', 'inspired', 3, 100]],
  ['shield', 'physicalAttack', ['wa-bash', 'Shield Bash', 'Edge first.', 1.1, 1, 'physical', 'enemy', 'stun', 1, 45], ['wa-bulwark-stance', 'Bulwark Stance', 'Plant and brace.', 0, 0, 'physical', 'self', 'earthbound', 3, 100]],
  ['katana', 'physicalAttack', ['wa-iai-draw', 'Iai Draw', 'Drawn and sheathed before the blink.', 1.8, 1, 'physical', 'enemy', 'bleed', 3, 55], ['wa-moon-cut', 'Moon Cut', 'A long curved line.', 1.0, 1, 'physical', 'allEnemies']],
  ['whip', 'physicalAttack', ['wa-lash', 'Lash', 'A crack that carries.', 1.1, 1, 'physical', 'enemy', 'entangle', 2, 55], ['wa-disarming-snap', 'Disarming Snap', 'Take it from their hand.', 0.8, 1, 'physical', 'enemy', 'weaken', 3, 80]],
  ['longbow', 'physicalAttack', ['wa-farshot', 'Farshot', 'Further than they expected.', 1.9, 1, 'physical', 'enemy', 'marked', 3, 60], ['wa-arrow-rain', 'Arrow Rain', 'From above.', 0.8, 1, 'physical', 'allEnemies']],
  ['pistol', 'physicalAttack', ['wa-double-tap', 'Double Tap', 'Twice, quickly.', 0.8, 2, 'physical', 'enemy'], ['wa-smoke-shot', 'Smoke Shot', 'The room fills with powder.', 0.5, 1, 'fire', 'allEnemies', 'blind', 2, 50]],
  ['rifle', 'physicalAttack', ['wa-dead-eye', 'Dead Eye', 'Hold. Breathe. Fire.', 2.3, 1, 'physical', 'enemy', 'doom', 3, 20], ['wa-suppressing-fire', 'Suppressing Fire', 'Keep their heads down.', 0.7, 1, 'physical', 'allEnemies', 'mired', 2, 50]],
  ['chakram', 'physicalAttack', ['wa-boomerang-ring', 'Orbiting Ring', 'It goes out. It comes back.', 0.9, 2, 'physical', 'enemy', 'bleed', 2, 30], ['wa-ring-storm', 'Ring Storm', 'Many, in the air at once.', 0.8, 1, 'physical', 'allEnemies']],
];

const RANGED = new Set(['bow', 'crossbow', 'throwing', 'longbow', 'pistol', 'rifle', 'chakram', 'staff', 'wand', 'tome', 'orb', 'instrument']);

function art(type: string, stat: 'physicalAttack' | 'magicAttack', [id, name, flavor, mult, hits, element, target, status, duration, chance]: Art): SkillDef {
  const effects: EffectSpec[] = status ? [{ kind: 'applyStatus', status, duration: duration ?? 2, ...(chance !== undefined && chance < 100 ? { chance } : {}), ...(target === 'self' ? { target: 'self' as const } : {}) }] : [];
  const pct = Math.round(mult * hits * 100);
  const sourceDesc = mult > 0 ? `${hits > 1 ? `${hits} hits of ${Math.round(mult * 100)}%` : `${pct}%`} ${stat === 'magicAttack' ? 'MAG' : 'ATK'} ${element} damage${target === 'allEnemies' ? ' to every enemy' : target === 'frontRow' ? ' to the front row' : ''}` : '';
  const statusDesc = status ? `${mult > 0 ? '; ' : ''}${status[0]!.toUpperCase()}${status.slice(1)}${chance !== undefined && chance < 100 ? ` (${chance}%)` : ''}${target === 'self' ? ' on you' : ''}` : '';
  return {
    id, name, source: 'weaponArt', maxRank: 1, weaponArt: type,
    description: `${flavor} ${sourceDesc}${statusDesc}.`,
    tags: ['Attack', 'WeaponArt', target === 'allEnemies' || target === 'frontRow' ? 'AoE' : RANGED.has(type) ? 'Ranged' : 'Melee'] as never,
    element, targeting: target, cost: { mp: 8 }, cooldown: 3,
    ...(mult > 0 ? { damage: { stat, multiplier: mult, perRank: 0, ...(hits > 1 ? { hits } : {}) } } : {}),
    ...(effects.length ? { effects } : {}),
  };
}

/** Two Weapon Arts for every weapon type, usable by anyone wielding one. */
export const WEAPON_ARTS: SkillDef[] = ROWS.flatMap(([type, stat, a, b]) => [art(type, stat, a), art(type, stat, b)]);
