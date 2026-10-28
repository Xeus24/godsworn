import type { Feat } from '../../engine/skills/feats';
import type { BranchDef, SkillTreeDef, TreeNodeDef } from '../../engine/skills/treeTypes';
import type { ModifierSpec } from '../../engine/stats/modifiers';
import { flat, more, pct } from './builder';

/**
 * Secret nodes: four per class, invisible in the tree until a feat reveals them. Each is a single-rank
 * notable on its own "Secrets" branch with no tier gate or parent, so a revealed node can be bought at once.
 */
type Row = [name: string, text: string, feat: Feat, mods: ModifierSpec[]];

const HIDDEN: Record<string, Row[]> = {
  warrior: [
    ['Scar Tissue', 'You walked out of the Goblin Warren. +5% max HP, 3% less damage taken.', { kind: 'kills', enemy: 'goblin-king', count: 1 }, [pct('maxHp', 5), more('damageTaken', -3)]],
    ['Veteran’s Grip', 'A hundred Heavy Strikes taught your hands. +8% physical attack.', { kind: 'mastery', skill: 'heavy-strike', level: 5 }, [pct('physicalAttack', 8)]],
    ['Unyielding', 'You have felled giants. 6% less damage taken, +2 HP per turn.', { kind: 'trophies', count: 3 }, [more('damageTaken', -6), flat('hpRegen', 2)]],
    ['Warlord’s Mark', 'The battlefield knows your name. +8% damage, +20% crit damage.', { kind: 'classLevel', level: 40 }, [flat('damageBonus', 8), flat('critDamage', 20)]],
  ],
  mage: [
    ['Ember Memory', 'The Bone Lord’s crypt taught you what fire forgets. +8% fire damage.', { kind: 'kills', enemy: 'bone-lord', count: 1 }, [flat('fireDamage', 8)]],
    ['Echoing Bolt', 'Firebolt has become instinct. 8% cooldown reduction.', { kind: 'mastery', skill: 'firebolt', level: 5 }, [flat('cooldownReduction', 8)]],
    ['Leyline Reader', 'You have felt three world bosses die. +10% magic attack, +6% max MP.', { kind: 'trophies', count: 3 }, [pct('magicAttack', 10), pct('maxMp', 6)]],
    ['Archmage’s Insight', 'Sixty-odd years of study in forty levels. +8% damage, +5% crit chance.', { kind: 'classLevel', level: 40 }, [flat('damageBonus', 8), flat('critChance', 5)]],
  ],
  rogue: [
    ['Knife in the Dark', 'You outlived the Broodmother’s nest. +4% crit chance, +15% crit damage.', { kind: 'kills', enemy: 'broodmother', count: 1 }, [flat('critChance', 4), flat('critDamage', 15)]],
    ['Muscle Memory', 'Backstab, a hundred times over. +8% physical attack, +4 speed.', { kind: 'mastery', skill: 'backstab', level: 5 }, [pct('physicalAttack', 8), flat('speed', 4)]],
    ['Ghost of the Road', 'Three world bosses never saw you coming. +6% dodge.', { kind: 'trophies', count: 3 }, [flat('dodge', 6)]],
    ['Master of the Shadow Trade', 'Level 40 in the trade. +10% damage, +6% gold find.', { kind: 'classLevel', level: 40 }, [flat('damageBonus', 10), flat('goldFind', 6)]],
  ],
  cleric: [
    ['Hallowed Ground', 'You laid the Bone Lord to rest. +10% healing power.', { kind: 'kills', enemy: 'bone-lord', count: 1 }, [flat('healingPower', 10)]],
    ['Practiced Mercy', 'A hundred Mends. +8% healing received, +5% max MP.', { kind: 'mastery', skill: 'mend', level: 5 }, [flat('healingReceived', 8), pct('maxMp', 5)]],
    ['Witness of Giants', 'Three world bosses fell with holy light on them. +10% divine power.', { kind: 'trophies', count: 3 }, [pct('divinePower', 10)]],
    ['Saint-in-Waiting', 'Forty levels of vows kept. +10% blessing power, +8% damage.', { kind: 'classLevel', level: 40 }, [flat('blessingPower', 10), flat('damageBonus', 8)]],
  ],
  ranger: [
    ['Trophy Hunter', 'The Broodmother’s hide hangs in your hall. +5% crit chance.', { kind: 'kills', enemy: 'broodmother', count: 1 }, [flat('critChance', 5)]],
    ['Steady Hand', 'Aimed Shot, over and over. +6% accuracy, +8% physical attack.', { kind: 'mastery', skill: 'aimed-shot', level: 5 }, [flat('accuracy', 6), pct('physicalAttack', 8)]],
    ['Giant-Tracker', 'Three world bosses, three trails. +10% damage against beasts… and everything else.', { kind: 'trophies', count: 3 }, [flat('damageBonus', 6), flat('speed', 4)]],
    ['Legend of the Wild', 'The wild remembers your tread. +10% damage, +6% dodge.', { kind: 'classLevel', level: 40 }, [flat('damageBonus', 10), flat('dodge', 6)]],
  ],
  necromancer: [
    ['Grave Courtesy', 'The Bone Lord bowed to you, in the end. +5% lifesteal.', { kind: 'kills', enemy: 'bone-lord', count: 1 }, [flat('lifesteal', 5)]],
    ['Familiar Bones', 'Soul Bolt, a hundred times. +8% magic attack, +6% max HP.', { kind: 'mastery', skill: 'soul-bolt', level: 5 }, [pct('magicAttack', 8), pct('maxHp', 6)]],
    ['Collector of Last Breaths', 'Three world bosses, three last breaths. +10% shadow damage.', { kind: 'trophies', count: 3 }, [flat('shadowDamage', 10)]],
    ['Lord of Quiet Rows', 'The dead follow you now. +10% damage, +4% lifesteal.', { kind: 'classLevel', level: 40 }, [flat('damageBonus', 10), flat('lifesteal', 4)]],
  ],
  monk: [
    ['Still Mind', 'You faced the Goblin King without moving your feet. +6% dodge.', { kind: 'kills', enemy: 'goblin-king', count: 1 }, [flat('dodge', 6)]],
    ['Open Palm', 'Palm Strike, a hundred times. +8% physical attack, +4 speed.', { kind: 'mastery', skill: 'palm-strike', level: 5 }, [pct('physicalAttack', 8), flat('speed', 4)]],
    ['Walker Among Giants', 'Three world bosses, no wasted steps. +6% max HP, +6% status resist.', { kind: 'trophies', count: 3 }, [pct('maxHp', 6), flat('statusResist', 6)]],
    ['One With the Road', 'Forty levels of discipline. +10% damage, 6% cooldown reduction.', { kind: 'classLevel', level: 40 }, [flat('damageBonus', 10), flat('cooldownReduction', 6)]],
  ],
  bard: [
    ['Opening Number', 'You played the Goblin King out of his own hall. +8% resource gain.', { kind: 'kills', enemy: 'goblin-king', count: 1 }, [flat('resourceGain', 8)]],
    ['Perfect Pitch', 'Discordant Note, a hundred times. +8% magic attack, +4 CHA.', { kind: 'mastery', skill: 'discordant-note', level: 5 }, [pct('magicAttack', 8), flat('cha', 4)]],
    ['Songs of Three Giants', 'Three world bosses made it into your repertoire. +10% damage.', { kind: 'trophies', count: 3 }, [flat('damageBonus', 10)]],
    ['Headliner', 'The house is full, every night. +10% damage, +10% ultimate gain.', { kind: 'classLevel', level: 40 }, [flat('damageBonus', 10), flat('ultimateGain', 10)]],
  ],
};

export const HIDDEN_BRANCH_ID = 'secrets';

/** Adds the class's secret branch and nodes to a finished tree. */
export function withHidden(tree: SkillTreeDef): SkillTreeDef {
  const rows = HIDDEN[tree.classId];
  if (!rows) return tree;
  const color = '#c8a8ff';
  const branch: BranchDef = { id: `${tree.classId}.${HIDDEN_BRANCH_ID}`, classId: tree.classId, name: 'Secrets', description: 'Nodes that reveal themselves when you do something worth remembering.', color };
  const baseX = Math.max(...tree.nodes.map((n) => n.x)) + 180;
  const nodes: TreeNodeDef[] = rows.map(([name, text, feat, mods], i) => ({
    id: `${tree.classId}.${HIDDEN_BRANCH_ID}.${i + 1}`,
    classId: tree.classId,
    branch: branch.id,
    kind: 'notable',
    name,
    text,
    maxRank: 1,
    tier: 1,
    lane: i,
    parents: [],
    modifiers: mods,
    feat,
    x: baseX + i * 110,
    y: 70,
  }));
  return { ...tree, branches: [...tree.branches, branch], nodes: [...tree.nodes, ...nodes] };
}
