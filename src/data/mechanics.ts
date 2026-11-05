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
  { id: 'rule:tithe', text: 'Each hit on the party takes a share of its gold; a win returns it with 25% interest.' },
  { id: 'rule:mother', text: 'Mother Ninefold: her last phase follows the order her heads were severed.' },
  { id: 'rule:head', text: 'One of Mother Ninefold’s nine heads.' },
  { id: 'rule:wyrm', text: 'Redraws the battlefield every third turn (party rows shift).' },
  { id: 'rule:understudy', text: 'Copies the party’s last three moves: skills make it stronger, plain attacks and defending do not.' },
  { id: 'rule:conductor', text: 'Fights on a four-beat rhythm; dancers and bards can keep time against it.' },
  { id: 'rule:emperor', text: 'Built from the three strongest surviving Grudgebound.' },
  { id: 'rule:oathless', text: 'Sworn to nothing: holy damage passes through it.' },
  { id: 'rule:ink', text: 'Copies Glyphs the party places.' },
  { id: 'rule:clocktide', text: 'Acts on a fixed turn pattern the party can learn.' },
  { id: 'rule:ghoul', text: 'Grows stronger when Wet, and soaks itself in rain and fog.' },
  { id: 'rule:moth', text: 'Hits blind the target and drink its mana.' },
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
  { id: 'bloodMagic', text: 'Skills cost HP instead of MP.' },
  { id: 'armorTraining', text: 'No speed penalty for wearing armor only a secondary class allows.' },
];

export const IMMUNITY_PREFIX = 'immune:';
