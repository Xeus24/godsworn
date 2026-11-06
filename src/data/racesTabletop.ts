import type { SkillDef } from '../engine/skills/types';
import type { RaceDef } from './races';

/** The eight races of the Tabletop Tradition (Section I-4): four weight-bearing, four quick, each with a passive, an active, voices and a three-quest line. */
// prettier-ignore
export const TABLETOP_RACES: RaceDef[] = [
  { id: 'stonekin', name: 'Stonekin', description: 'Giant-blooded folk of the high passes: broad, slow to anger, and very difficult to move.',
    flavor: { homeland: 'The stepped villages above the Frostspire', lore: 'A giant once married a mountain, or so the story goes, and the children were Stonekin: shorter than their grandfather, harder than their grandmother. They carry things for a living and do not consider this a metaphor.', saying: '“Lift with the knees. Argue with the rest.”' },
    statBonus: { str: 3, vit: 3, dex: -1 },
    passive: { name: 'Mighty Grip', description: '+10% physical attack, +8% max HP and +10% status resist.', modifiers: [{ stat: 'physicalAttack', type: 'percent', value: 10 }, { stat: 'maxHp', type: 'percent', value: 8 }, { stat: 'statusResist', type: 'flat', value: 10 }] },
    activeSkill: 'mountain-grip' },
  { id: 'tuskborn', name: 'Tuskborn', description: 'Orcish folk with a warrior’s patience: they do not stop, and they do not explain why.',
    flavor: { homeland: 'The red tent-camps at the edge of the Ashen Desert', lore: 'Where the Orcs trade debts, the Tuskborn pay them. They are a smaller people by half and a very much more stubborn one; their saying is that a Tuskborn who falls down has merely rearranged where the fight is.', saying: '“I am not losing. I am still arriving.”' },
    statBonus: { str: 3, vit: 2, wis: 1, cha: -1 },
    passive: { name: 'Relentless', description: '+10% max HP, +4 HP regen and +4% lifesteal.', modifiers: [{ stat: 'maxHp', type: 'percent', value: 10 }, { stat: 'hpRegen', type: 'flat', value: 4 }, { stat: 'lifesteal', type: 'flat', value: 4 }] },
    activeSkill: 'relentless-charge' },
  { id: 'dawnblooded', name: 'Dawnblooded', description: 'Celestial-touched folk with a faint glow at the shoulders, and the habit of arriving a little too brightly.',
    flavor: { homeland: 'The sunlit terraces of Brightwater and the high chapels of Aurelane', lore: 'Somewhere, a very long time ago, somebody’s grandmother was kissed by the sun. Her descendants are the Dawnblooded. At moments of great feeling, they unfold a brief pair of light-wings, which they find embarrassing and everyone else finds convenient.', saying: '“I did not mean to glow. It is the stairs.”' },
    statBonus: { fai: 3, cha: 2, dex: 1, vit: -1 },
    passive: { name: 'Daybright', description: '+10% holy damage, +8% healing power and +8% holy resist.', modifiers: [{ stat: 'holyDamage', type: 'flat', value: 10 }, { stat: 'healingPower', type: 'flat', value: 8 }, { stat: 'holyResist', type: 'flat', value: 8 }] },
    activeSkill: 'radiant-burst' },
  { id: 'tinkerfolk', name: 'Tinkerfolk', description: 'Gnome-kin with clockwork in every pocket. Rarely on time, but always with a tool for it.',
    flavor: { homeland: 'The workshop-quarters of Frosthold and Ratchet', lore: 'Every Tinkerfolk child is given a wrench and a warning. They build the things that do not need building and then, afterwards, find the need. Their greatest invention is the excuse.', saying: '“It is not broken. It is in an experimental state.”' },
    statBonus: { int: 3, dex: 2, str: -1, cha: 1 },
    passive: { name: 'Clockwork Hands', description: '+6% cooldown reduction, +10% magic find and +6% lightning damage.', modifiers: [{ stat: 'cooldownReduction', type: 'flat', value: 6 }, { stat: 'magicFind', type: 'flat', value: 10 }, { stat: 'lightningDamage', type: 'flat', value: 6 }] },
    activeSkill: 'clockwork-trick' },
  { id: 'corvani', name: 'Corvani', description: 'Raven-folk with a bright eye and a good ear. They can say anything, in anyone’s voice, and generally do.',
    flavor: { homeland: 'The gable-towns of Thornwick and the ridges above the Whisperwood', lore: 'The Corvani are a tidy, curious, vaguely untrustworthy people who keep their houses full of shiny things and their mouths full of other people’s sentences. They are not liars. They are archivists of a particular kind.', saying: '“I heard that somewhere. I will tell it to you in the right voice.”' },
    statBonus: { dex: 2, int: 2, luk: 2, str: -1 },
    passive: { name: 'Borrowed Voices', description: '+10% magic find, +6% dodge and +8 accuracy.', modifiers: [{ stat: 'magicFind', type: 'flat', value: 10 }, { stat: 'dodge', type: 'flat', value: 6 }, { stat: 'accuracy', type: 'flat', value: 8 }] },
    activeSkill: 'mimic-voice' },
  { id: 'pardeen', name: 'Pardeen', description: 'Cat-folk of the grass-roads: quick, curious, and unapologetic about naps.',
    flavor: { homeland: 'The grass-roads between Brightwater and Sandhaven', lore: 'The Pardeen run when there is a reason, and sometimes when there is not. A Pardeen at rest is a coil; a Pardeen at speed is a rumor that something just went by. They are not cold. They are simply never done being somewhere else.', saying: '“I will be there. Eventually. Probably first.”' },
    statBonus: { dex: 3, luk: 2, str: 1, vit: -1 },
    passive: { name: 'Pounce and Run', description: '+8% dodge, +10% speed and +4% crit chance.', modifiers: [{ stat: 'dodge', type: 'flat', value: 8 }, { stat: 'speed', type: 'percent', value: 10 }, { stat: 'critChance', type: 'flat', value: 4 }] },
    activeSkill: 'sprint-burst' },
  { id: 'mossborn', name: 'Mossborn', description: 'Plant-folk of the deep wood: slow, patient, and entirely on good terms with the trees.',
    flavor: { homeland: 'The mossed groves of the Whisperwood and Briarhold', lore: 'A Mossborn begins as a seed in a very old oak. When it has grown enough opinion to leave, it does. Mossborn do not hurry, and speak slowly, so that the plants have time to agree.', saying: '“We are not slow. We are on a different clock.”' },
    statBonus: { vit: 2, wis: 3, fai: 1, dex: -1 },
    passive: { name: 'Rooted', description: '+4 HP regen, +10% nature damage and +20% nature resist.', modifiers: [{ stat: 'hpRegen', type: 'flat', value: 4 }, { stat: 'natureDamage', type: 'flat', value: 10 }, { stat: 'natureResist', type: 'flat', value: 20 }] },
    activeSkill: 'speak-with-plants' },
  { id: 'duskfae', name: 'Duskfae', description: 'Fey of the Gloaming Court: elegant, formal, and extremely careful about who knows their name.',
    flavor: { homeland: 'The Gloaming Court, at the edge of the Gloamwood', lore: 'The Duskfae are the Fae who chose the evening: a court of long shadows, quiet courtesy and exact contracts. They keep a name for use and a name for keeping. The second one is a weapon, and also a wound.', saying: '“You may have my name. For a price. It will not be the name.”' },
    statBonus: { int: 2, cha: 2, wis: 1, luk: 1, vit: -1 },
    passive: { name: 'True-Named', description: '+10% shadow damage, +8% status chance and +4% dodge.', modifiers: [{ stat: 'shadowDamage', type: 'flat', value: 10 }, { stat: 'statusChance', type: 'flat', value: 8 }, { stat: 'dodge', type: 'flat', value: 4 }] },
    activeSkill: 'true-name' },
];

const racial = (id: string, name: string, description: string, o: Pick<SkillDef, 'element' | 'targeting' | 'tags' | 'cooldown'> & Partial<SkillDef>): SkillDef => ({ id, name, description, source: 'racial', maxRank: 1, cost: {}, ...o, tags: ['Racial', ...o.tags] });
const status = (s: string, d: number, target?: 'self' | 'allEnemies' | 'allAllies') => ({ kind: 'applyStatus' as const, status: s, duration: d, ...(target ? { target } : {}) });
export const TABLETOP_RACIAL_SKILLS: SkillDef[] = [
  racial('mountain-grip', 'Mountain Grip', 'Seize and squeeze: 180% ATK and the foe is Stunned for a turn.', { element: 'physical', targeting: 'enemy', tags: ['Attack', 'Physical', 'Melee'], cooldown: 4, damage: { stat: 'physicalAttack', multiplier: 1.8, perRank: 0 }, effects: [status('stun', 1)] }),
  racial('relentless-charge', 'Relentless Charge', 'Put your head down: 160% ATK and a shield of 12% max HP.', { element: 'physical', targeting: 'enemy', tags: ['Attack', 'Physical', 'Melee'], cooldown: 4, damage: { stat: 'physicalAttack', multiplier: 1.6, perRank: 0 }, effects: [{ kind: 'shield', percentMaxHp: 12, target: 'self' }] }),
  racial('radiant-burst', 'Radiant Burst', 'Unfold the light: 150% MAG holy damage to every enemy; they are Blinded for a turn.', { element: 'holy', targeting: 'allEnemies', tags: ['Spell', 'Holy', 'AoE'], cooldown: 5, damage: { stat: 'magicAttack', multiplier: 1.5, perRank: 0 }, effects: [status('blind', 1)] }),
  racial('clockwork-trick', 'Clockwork Trick', 'A gadget from a sleeve: 140% MAG lightning damage; the target is Slowed.', { element: 'lightning', targeting: 'enemy', tags: ['Spell', 'Lightning', 'Gadget'], cooldown: 4, damage: { stat: 'magicAttack', multiplier: 1.4, perRank: 0 }, effects: [status('slow', 2)] }),
  racial('mimic-voice', 'Mimic Voice', 'Say something in their commander’s voice: every enemy is Confused for 2 turns.', { element: 'physical', targeting: 'allEnemies', tags: ['Debuff', 'AoE'], cooldown: 5, effects: [status('confuse', 2, 'allEnemies')] }),
  racial('sprint-burst', 'Sprint Burst', 'A flat-out dash: 130% ATK, and +25% dodge and +30% speed for 2 turns.', { element: 'physical', targeting: 'enemy', tags: ['Attack', 'Physical', 'Movement'], cooldown: 4, damage: { stat: 'physicalAttack', multiplier: 1.3, perRank: 0 }, effects: [{ kind: 'buff', id: 'sprint', duration: 2, modifiers: [{ stat: 'dodge', type: 'flat', value: 25 }, { stat: 'speed', type: 'percent', value: 30 }] }] }),
  racial('speak-with-plants', 'Speak With Plants', 'The roots listen: every enemy is Entangled for 2 turns and you gain Regen.', { element: 'nature', targeting: 'allEnemies', tags: ['Debuff', 'Nature', 'AoE'], cooldown: 5, effects: [status('entangle', 2, 'allEnemies'), status('regen', 3, 'self')] }),
  racial('true-name', 'True Name', 'Speak the name you were not given: 200% MAG shadow damage; the target is Cursed and Weakened.', { element: 'shadow', targeting: 'enemy', tags: ['Spell', 'Shadow', 'Curse'], cooldown: 5, damage: { stat: 'magicAttack', multiplier: 2.0, perRank: 0 }, effects: [status('curse', 3), status('weaken', 3)] }),
];

export const TABLETOP_RACE_VOICES: Record<string, [string, string]> = {
  stonekin: ['“Hold this. No, hold it properly. It is a mountain.”', '“The pass was here before the road. I will go through the pass.”'],
  tuskborn: ['“Knock me down. I will still be next to you in a moment.”', '“I do not stop. I merely change the subject.”'],
  dawnblooded: ['“Is it bright in here? I will turn it down.”', '“I was told the halo would be more dignified.”'],
  tinkerfolk: ['“It is a prototype. The explosion is a feature.”', '“I can fix that. In fairness, I can also break it more.”'],
  corvani: ['“That is not what you said earlier. I will say it back to you.”', '“I collect sentences. That one is rather good.”'],
  pardeen: ['“I will be there. I might have been there already.”', '“Do not look at the sunny spot. It is mine.”'],
  mossborn: ['“Give it a season.”', '“The oak says hello. It is, in fairness, quite slow to say it.”'],
  duskfae: ['“I will tell you my name. It will not be the one you want.”', '“A contract, between friends. Therefore, in very small print.”'],
};

type R = [town: string, id: string, name: string, title: string, titles: [string, string, string], offers: [string, string, string], finale: string, own: string, cha: string, plain: string, earned: string];
// prettier-ignore
export const TABLETOP_RACE_ROWS: Record<string, R> = {
  stonekin: ['frosthold', 'elder-brokk', 'Brokk Stoneshoulder', 'Carrier of the High Pass', ['Load and Carry', 'The Fallen Cairn', 'A Seat at the Mountain'], ['“We carry what others cannot. Visit the shrines and take up a stone.”', '“A cairn on the pass has fallen. Someone has to put it back. It will be you.”', '“A mountain has asked for a seat at the table. We are giving it one.”'], '“What is the heaviest thing you have lifted?”', '“A promise.”', '“A grudge, for far too long.”', '“Whatever was on top.”', 'Holder of the High Pass'],
  tuskborn: ['sandhaven', 'elder-gorza', 'Gorza Longtusk', 'Standing Chief of the Red Camps', ['The Long Way Round', 'A Fall Rearranged', 'The Last One Standing'], ['“We never stop. Visit the shrines and ask them why we are still walking.”', '“A rival has bested a Tuskborn at the camp-ring. We do not accept it. Help him back up.”', '“A war-band is waiting. You are the last one standing. Go and make that true.”'], '“Why do you keep going?”', '“Because it has not finished yet.”', '“Because somebody has to be last.”', '“Out of spite.”', 'Last One Standing'],
  dawnblooded: ['brightwater', 'elder-ilune', 'Ilune Firstlight', 'Keeper of the Dawn-Stair', ['Do Not Mind the Glow', 'The Dim Chapel', 'Wings in a Small Room'], ['“Everyone looks at the glow. Visit the shrines and learn to be looked at.”', '“A chapel has gone dim. Not from sin. From neglect. Go and light it.”', '“The wings have unfolded, indoors. Help me explain.”'], '“What are you shining for?”', '“Whoever is in the dark.”', '“A very good reason, I hope.”', '“I was told to.”', 'Keeper of the Dawn-Stair'],
  tinkerfolk: ['frosthold', 'elder-brasslever', 'Wick Brasslever', 'Chief Tinkerer of the Frosthold Lanes', ['It Was Working Yesterday', 'The Spring That Sang', 'A Gear for Every Gap'], ['“I built a thing. It does not do what I thought. Visit the shrines and see if it did something else.”', '“A spring in my workshop has begun to hum. It is, as far as I can tell, rude.”', '“There is a gap in the machine. Fill it. With something that fits.”'], '“What is it for?”', '“Whatever it ends up doing.”', '“Something very helpful, with a delay.”', '“I do not know yet.”', 'Master of the Gap'],
  corvani: ['thornwick', 'elder-quorra', 'Quorra Nightfeather', 'Archivist of Overheard Things', ['A Voice Not Your Own', 'The Stolen Sentence', 'The Murder’s Archive'], ['“Visit the shrines and listen. Remember the best sentence. Then say it back.”', '“Somebody has been saying my sentences. They have the voice wrong. Find them.”', '“A murder of crows has opened its archive. We have one question for it.”'], '“Whose voice is that?”', '“Mine. Now.”', '“A friend’s. I will return it.”', '“I do not remember.”', 'Archivist of Overheard Things'],
  pardeen: ['brightwater', 'elder-sahara', 'Sahara Longstride', 'Runner of the Grass-Roads', ['A Reason to Run', 'The Race Nobody Won', 'The Warm Spot'], ['“I will tell you where to run. Visit the shrines in the order I give you, quickly.”', '“A race was run in the meadows last spring and nobody won. Somebody lied. Find out who.”', '“There is a warm spot on a very old stone. I need you to guard it.”'], '“Where are you running to?”', '“Wherever you have not been.”', '“Something I will catch.”', '“Nowhere. It is the running.”', 'Runner of the Grass-Roads'],
  mossborn: ['thornwick', 'elder-fenwick', 'Fenwick Old-Oak', 'Elder of the Slow Grove', ['Give It a Season', 'The Blighted Root', 'What the Oak Says'], ['“Visit the shrines and wait. Plants are in no hurry. You should not be either.”', '“A root has blighted in the Whisperwood. The oak says it is not blight. The oak is wrong.”', '“The oak has something to say. It will take a few days. Stay.”'], '“How long will you wait?”', '“As long as the oak does.”', '“Long enough for you to understand.”', '“A season.”', 'Elder of the Slow Grove'],
  duskfae: ['saltmere', 'elder-vesperra', 'Vesperra Longshadow', 'Warden of the Gloaming Court’s Door', ['A Name for Use', 'The Contract in Small Print', 'The Name for Keeping'], ['“You will need a name for use. Visit the shrines and borrow one, politely.”', '“A contract has gone sour. Read the small print. All of it. The print is very small.”', '“There is a name for keeping, and someone has said it aloud. Find out who.”'], '“What is your name?”', '“Mine.”', '“A very good one. You may use it.”', '“I am still deciding.”', 'Warden of the Gloaming Door'],
};
