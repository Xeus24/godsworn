/**
 * Named combat mechanics that items, blessings and passives can switch on
 * with `flags: [...]`. They cover rules that are not simple stat changes or
 * triggers. The combat engine (Phase 4) implements each one. A flag of the
 * form "immune:<status>" grants immunity to that status.
 */
export interface MechanicDef {
  id: string;
  text: string;
}

export const MECHANICS: MechanicDef[] = [
  { id: 'firstStrike', text: 'Always act first in the opening round.' },
  { id: 'reviveOnce', text: 'Once per battle, survive a killing blow with 1 HP.' },
  { id: 'burnSpreadsOnDeath', text: 'Burning enemies spread Burn to their allies when they die.' },
  { id: 'bonusVsBosses', text: 'Deal 25% more damage to bosses.' },
  { id: 'strongerAtNight', text: 'Deal 20% more damage at night.' },
  { id: 'strongerByDay', text: 'Deal 20% more damage during the day.' },
  { id: 'dotsCanCrit', text: 'Damage over time can critically strike.' },
  { id: 'critsIgnoreDefense', text: 'Critical hits ignore half of the target’s defense and resistance.' },
  { id: 'reach', text: 'Melee attacks can strike the back row.' },
  { id: 'overhealShield', text: 'Half of all overhealing becomes a shield.' },
  { id: 'stealthOnCombatStart', text: 'Begin every battle in stealth.' },
  { id: 'shatterAlways', text: 'Ice damage against Burning enemies always Shatters.' },
  { id: 'twinSongs', text: 'Two songs can play at once.' },
  { id: 'extraSummon', text: 'Summoning skills raise one extra minion.' },
  { id: 'executioner', text: 'Attacks against enemies below 20% HP always crit.' },
  { id: 'spellEcho', text: '20% chance for spells to cast a second time for free.' },
];

export const IMMUNITY_PREFIX = 'immune:';
