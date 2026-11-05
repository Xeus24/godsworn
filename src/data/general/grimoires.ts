import type { GeneralSkillDef, GrimoireDef } from '../../engine/skills/generalTypes';

/**
 * Grimoires teach one class's signature skill to anyone, at reduced power.
 * Skills that spend a class resource (Rage, Combo Points...) are avoided,
 * since other classes cannot build that resource.
 */
export const GRIMOIRES: GrimoireDef[] = [
  { id: 'grimoire-shield-slam', skill: 'shield-slam', classId: 'warrior', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-flame-wave', skill: 'flame-wave', classId: 'mage', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-fan-of-knives', skill: 'fan-of-knives', classId: 'rogue', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-prayer-of-healing', skill: 'prayer-of-healing', classId: 'cleric', powerMult: 0.7, rarity: 'legendary', level: 20 },
  { id: 'grimoire-arrow-barrage', skill: 'arrow-barrage', classId: 'ranger', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-death-coil', skill: 'death-coil', classId: 'necromancer', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-meditation', skill: 'meditation', classId: 'monk', powerMult: 0.7, rarity: 'legendary', level: 20 },
  { id: 'grimoire-soothing-melody', skill: 'soothing-melody', classId: 'bard', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-guard-ally', skill: 'guard-ally', classId: 'knight', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-wild-bloom', skill: 'g-wild-bloom', classId: 'druid', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-siphon-soul', skill: 'siphon-soul', classId: 'warlock', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-spirit-lance', skill: 'spirit-lance', classId: 'summoner', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-hurled-flask', skill: 'g-hurled-flask', classId: 'alchemist', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-earthbind', skill: 'earthbind', classId: 'shaman', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-withering-years', skill: 'withering-years', classId: 'chronomancer', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-overcharge-shot', skill: 'overcharge-shot', classId: 'artificer', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-whirling-cut', skill: 'whirling-cut', classId: 'dancer', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-ink-bolt', skill: 'ink-bolt', classId: 'inkweaver', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-silver-lash', skill: 'silver-lash', classId: 'witchhunter', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-shaking-ground', skill: 'shaking-ground', classId: 'geomancer', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-mercys-edge', skill: 'mercys-edge', classId: 'vowknight', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-brow-strike', skill: 'headbutt', classId: 'wrathsworn', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-wind-kick', skill: 'wind-kick', classId: 'stillhand', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-snare', skill: 'snare-trap', classId: 'wayfinder', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-storm-vein', skill: 'storm-vein', classId: 'godblooded', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-rite-of-ember', skill: 'rite-of-ember', classId: 'ichorbound', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-draw-card', skill: 'draw-card', classId: 'fatedealer', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-mind-lash', skill: 'mind-lash', classId: 'mindwright', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-flag-signal', skill: 'flag-signal', classId: 'marshal', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-pistol-shot', skill: 'pistol-shot', classId: 'corsair', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-dirty-jab', skill: 'dirty-jab', classId: 'brawler', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-hushed-blade', skill: 'hushed-blade', classId: 'whisperknight', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-ladle-strike', skill: 'ladle-strike', classId: 'hearthmaster', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-study-foe', skill: 'study-foe', classId: 'truthseeker', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-hedge-bolt', skill: 'hedge-bolt', classId: 'hedgewitch', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-bonded-strike', skill: 'bonded-strike', classId: 'soulblade', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-don-fool', skill: 'don-fool', classId: 'facewright', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-toll-the-bell', skill: 'toll-the-bell', classId: 'bellwarden', powerMult: 0.7, rarity: 'epic', level: 15 },
  { id: 'grimoire-sunder-halo', skill: 'sunder-halo', classId: 'godslayer', powerMult: 0.7, rarity: 'legendary', level: 40 },
  { id: 'grimoire-hollow-shroud', skill: 'hollow-shroud', classId: 'voidwalker', powerMult: 0.7, rarity: 'legendary', level: 40 },
  { id: 'grimoire-radiant-ward', skill: 'radiant-ward', classId: 'celestial', powerMult: 0.7, rarity: 'legendary', level: 40 },
];

/** Each Grimoire becomes a general skill in the 'grimoire' category. */
export function grimoireSkills(skillName: (id: string) => string): GeneralSkillDef[] {
  return GRIMOIRES.map((g) => ({
    id: g.id,
    name: `${skillName(g.skill)} (Grimoire)`,
    category: 'grimoire',
    description: `Use the ${skillName(g.skill)} skill of another class at ${Math.round(g.powerMult * 100)}% power.`,
    rarity: g.rarity,
    maxRank: 5,
    combatSkill: g.skill,
    patch: { description: 'Grimoire: reduced power.', powerMult: g.powerMult },
    requirements: { level: g.level },
  }));
}
