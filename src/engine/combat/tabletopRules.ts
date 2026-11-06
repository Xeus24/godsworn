import type { Element } from '../stats/types';
import { check, statMod, rollD20 } from '../tabletop/dice';
import type { SkillDef } from '../skills/types';
import type { Battle } from './battle';
import { dealDamage } from './hits';
import type { Combatant } from './types';

/**
 * Tabletop Rules in battle (Section I-6b): Riposte (196), Focus (197), Throne Actions and Unyielding (205), Domain Turns (206) and Muse Dice (207).
 * Every function is a no-op unless `b.tabletop` is set, so the default game is untouched.
 */
const isHeroSide = (x: Combatant): boolean => x.side === 'party' && (x.kind === 'hero' || x.kind === 'companion');
const isBoss = (x: Combatant): boolean => x.tier === 'boss' || x.tier === 'worldBoss';

/** Battle start: Muse Dice for the party (when a Bard stands with it) and Unyielding for bosses. */
export function startTabletop(b: Battle): void {
  if (!b.tabletop) return;
  const bard = b.combatants.some((x) => x.side === 'party' && x.alive && x.classId === 'bard');
  for (const x of b.combatants) {
    if (isHeroSide(x) && bard) x.muse = MUSE_DICE;
    if (x.side === 'enemy' && isBoss(x)) x.unyielding = UNYIELDING;
  }
  if (bard) b.log('The Bard’s Muse Dice are handed round: each ally holds two bonus d6.');
}
export const MUSE_DICE = 2;
export const UNYIELDING = 3;

/** A Muse Die rescues a roll that missed by up to 6: returns the extra amount (0 if none was used). */
export function muse(b: Battle, x: Combatant, shortBy: number): number {
  if (!b.tabletop || !x.muse || x.muse <= 0 || shortBy > 6 || shortBy <= 0) return 0;
  const d = rollD20(b.rng).die % 6 || 6;
  if (d < shortBy) return 0;
  x.muse--;
  b.log(`${x.name} adds a Muse Die (+${d}).`);
  return d;
}

/** Start of a hero's own turn: its reaction comes back. */
export function turnStart(b: Battle, x: Combatant): void {
  if (!b.tabletop) return;
  x.reaction = false;
  if (x.side === 'party' && x.kind === 'hero') roundTick(b);
}

/** A hit that did not drop its target: Riposte, then the Focus save. */
export function onHit(b: Battle, source: Combatant, target: Combatant, dealt: number, element: Element, dot: boolean): void {
  if (!b.tabletop || dot || dealt <= 0 || b.inTabletopHit || !target.alive) return;
  b.inTabletopHit = true;
  try {
    if (target.focus) focusSave(b, target, dealt);
    if (isHeroSide(target) && !target.reaction && source.side === 'enemy' && source.alive && target.hp > 0) {
      target.reaction = true;
      const stats = b.stats(target);
      const magical = element !== 'physical';
      const power = (magical ? stats.magicAttack : stats.physicalAttack) * 0.5;
      b.log(`${target.name} ${magical ? 'counterspells' : 'ripostes'}!`);
      dealDamage(b, target, source, { element: magical ? element : 'physical', power, canMiss: false, fromEffect: true, label: magical ? 'Counterspell' : 'Riposte' });
    }
  } finally {
    b.inTabletopHit = false;
  }
}

/** Focus: one sustained spell at a time. Casting a second ends the first; a hit forces a VIT save or the spell drops. */
export function focusAfterSkill(b: Battle, x: Combatant, skill: SkillDef): void {
  if (!b.tabletop || !isHeroSide(x)) return;
  if (!skill.tags.includes('Spell') || !skill.tags.includes('Buff')) return;
  const buffs = (skill.effects ?? []).flatMap((e) => (e.kind === 'buff' && e.duration >= 2 ? [e.id] : []));
  if (buffs.length === 0) return;
  if (x.focus) dropFocus(b, x, `${x.name} lets ${x.focus.name} go to hold ${skill.name}.`);
  x.focus = { name: skill.name, buffs };
}

function dropFocus(b: Battle, x: Combatant, why: string): void {
  const f = x.focus;
  if (!f) return;
  x.buffs = x.buffs.filter((bf) => !f.buffs.includes(bf.id) || bf.sourceId !== x.id);
  x.focus = undefined;
  b.log(why);
}

function focusSave(b: Battle, x: Combatant, dealt: number): void {
  const stats = b.stats(x);
  const dc = Math.max(10, Math.floor(dealt / 2));
  const mod = statMod(stats.vit, x.level);
  const r = check(b.rng, mod, dc);
  const extra = r.success ? 0 : muse(b, x, dc - r.total);
  const ok = r.success || extra > 0;
  b.log(`${x.name} holds focus: d20 ${r.die} ${mod >= 0 ? '+' : '-'} ${Math.abs(mod)}${extra ? ` +${extra}` : ''} vs DC ${dc}: ${ok ? 'held' : 'broken'}.`);
  if (!ok && x.focus) dropFocus(b, x, `${x.name}'s focus breaks: ${x.focus.name} fades.`);
}

/** The Fate Die's cousin in battle: a roll the Muse Dice may rescue. */
export function boostedTotal(b: Battle, x: Combatant, total: number, dc: number): number {
  return total + (total < dc ? muse(b, x, dc - total) : 0);
}

/** Unyielding: a boss shrugs off its first three failed saves. True if this status is shrugged off. */
export function unyieldingBlocks(b: Battle, target: Combatant, statusName: string): boolean {
  if (!b.tabletop || !target.unyielding || target.unyielding <= 0) return false;
  target.unyielding--;
  b.log(`${target.name} is Unyielding and shrugs off ${statusName} (${target.unyielding} left).`);
  return true;
}

// ------------------------------------------------------------------ 205, 206: Throne Actions and Domain Turns

/** Domain Turn per element: what the boss's arena does at the top of every round. */
const DOMAINS: Partial<Record<Element, { name: string; text: string }>> = {
  fire: { name: 'Scorched Ground', text: 'the ground blisters' },
  ice: { name: 'Killing Frost', text: 'the air turns to needles' },
  lightning: { name: 'Storm Overhead', text: 'the sky cracks' },
  shadow: { name: 'Creeping Dark', text: 'the dark leans closer' },
  holy: { name: 'Harsh Light', text: 'the light does not forgive' },
  nature: { name: 'Choking Growth', text: 'roots crawl out of the walls' },
  earth: { name: 'Shifting Floor', text: 'the floor lurches' },
  arcane: { name: 'Wild Magic', text: 'the room hums wrongly' },
  void: { name: 'Hollow Pull', text: 'the edges of the room come loose' },
  physical: { name: 'Crowded Hall', text: 'the arena closes in' },
};

/** Once a round, at the top of the hero's turn: the arena acts, then the boss takes a light Throne Action between your turns. */
export function roundTick(b: Battle): void {
  if (!b.tabletop || b.inTabletopHit) return;
  b.round++;
  if (b.round < 2) return;
  for (const boss of b.alive('enemy').filter(isBoss)) {
    const targets = b.alive('party');
    if (targets.length === 0) return;
    const domain = DOMAINS[boss.basicAttack.element] ?? DOMAINS.physical!;
    b.inTabletopHit = true;
    try {
      b.log(`Domain Turn: ${domain.name}; ${domain.text}.`);
      for (const t of targets) dealDamage(b, boss, t, { element: boss.basicAttack.element, power: Math.max(1, t.maxHp * 0.015), canMiss: false, isDot: true, fromEffect: true, label: domain.name });
      const stats = b.stats(boss);
      const foe = b.rng.pick(b.alive('party'));
      b.log(`Throne Action: ${boss.name} strikes ${foe.name}.`);
      dealDamage(b, boss, foe, { element: boss.basicAttack.element, power: Math.max(stats.physicalAttack, stats.magicAttack) * 0.3, canMiss: true, fromEffect: true, label: 'Throne Action' });
    } finally {
      b.inTabletopHit = false;
    }
    if (b.checkOutcome() !== 'ongoing') return;
  }
}
