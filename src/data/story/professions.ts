import type { NpcDef, ObjectiveDef, QuestDef } from '../../engine/quests/types';
import { deed, deliver, kill, level, questDone, stage } from './helpers';

/**
 * Six crafting professions, six masters, five quests each. The fifth hands over the scroll of the
 * profession's Grandmaster recipe. Quests are given and handed in by the master in their town.
 */
interface Master {
  profession: string;
  npc: NpcDef;
  rare: ObjectiveDef;
  raretext: string;
  delivery: [itemId: string, qty: number, name: string];
  finale: [itemId: string, qty: number, name: string];
  names: [string, string, string, string, string];
  voice: string[];
}

const person = (id: string, name: string, title: string, town: string, race: string, portrait: number, color: string, greeting: string): NpcDef => ({ id, name, title, town, place: 'people', race, portrait, color, greeting });

const MASTERS: Master[] = [
  { profession: 'cooking', npc: person('cook-mabry', 'Mabry Ladle', 'Master Cook', 'brightwater', 'dwarf', 2, '#c8884a', '“Hungry people forgive almost anything. I make sure there is nothing to forgive.”'),
    rare: kill('d', 'Hunt game for the pot (beasts)', 8, { enemyType: 'beast' }), raretext: 'Bring the pot something that was recently running.',
    delivery: ['honeycomb', 2, 'Honeycomb'], finale: ['harvest-feast', 1, 'Harvest Feast'],
    names: ['A Pinch of Salt', 'Stock and Stew', 'The Honey Question', 'Game for the Pot', 'The Grandmaster’s Table'],
    voice: ['“Everybody can follow a recipe. A cook is who you are after the recipe stops.”', '“Salt first. Then patience. Then salt again, if you are honest.”', '“Honey is just bees being generous under duress.”', '“The best meal is the one somebody ran after.”', '“A table, laid properly, is a small act of faith. Lay mine.”'] },
  { profession: 'alchemy', npc: person('apothecary-quillon', 'Quillon Marsh', 'Master Apothecary', 'thornwick', 'elf', 6, '#6ac84a', '“The difference between a cure and a poison is a decimal point and a mood.”'),
    rare: kill('d', 'Collect from the undead (bone and ichor)', 8, { enemyType: 'undead' }), raretext: 'The finest reagents come from the dead. The dead are not generous.',
    delivery: ['nightshade', 2, 'Nightshade'], finale: ['elixir-of-the-sunlit', 1, 'Elixir of the Sunlit Path'],
    names: ['Mortar and Pestle', 'The Mild Poison', 'Nightshade for Medicine', 'What the Dead Leave', 'The Grandmaster’s Draught'],
    voice: ['“Measure twice, taste never.”', '“Everything is toxic. The art is in how little.”', '“Nightshade is lovely and lethal. Like most things I love.”', '“Reagents are sometimes reluctant. Be firm.”', '“Make me something that tastes like morning.”'] },
  { profession: 'blacksmithing', npc: person('smith-hadrik', 'Hadrik Cinderhand', 'Master Smith', 'sandhaven', 'orc', 4, '#d87a3a', '“Metal remembers every hit. Be careful what you teach it.”'),
    rare: kill('d', 'Break a few constructs for scrap', 6, { enemyType: 'construct' }), raretext: 'Good steel is often someone else’s bad day. Collect it.',
    delivery: ['steel-ingot', 3, 'Steel Ingot'], finale: ['adamant-ingot', 2, 'Adamant Ingot'],
    names: ['Hammer and Tongs', 'Steel and Sweat', 'Three Fine Ingots', 'Scrap with a Past', 'The Grandmaster’s Anvil'],
    voice: ['“Hit it again. Then again. That is smithing.”', '“Steel is iron that was taught patience.”', '“Bring me three ingots and I will tell you whether you can smelt.”', '“Machines break. Their pieces are honest.”', '“I forged my last sword when I was sure it would never be sold. Do likewise.”'] },
  { profession: 'enchanting', npc: person('runewright-ysenne', 'Ysenne Vael', 'Runewright', 'frosthold', 'elf', 1, '#9a8aff', '“A rune is a sentence that agrees with the world. A good one does not need to be loud.”'),
    rare: deed('d', 'Break down gear for essence (salvage)', 6, { event: 'salvage' }), raretext: 'Essence comes from endings. Make some.',
    delivery: ['lesser-essence', 3, 'Lesser Essence'], finale: ['oil-of-the-world-eater', 1, 'Oil of the World-Eater'],
    names: ['First Sigils', 'The Quiet Rune', 'Three Pure Essences', 'The Salvager’s Art', 'The Grandmaster’s Sigil'],
    voice: ['“Draw it slowly. The line is the spell.”', '“Silence is the best ink.”', '“Essence is just stored attention. Bring me some.”', '“Tearing a thing down is also a kind of reading.”', '“Make me an oil that eats the sky. Politely.”'] },
  { profession: 'jewelcrafting', npc: person('gemcutter-pao', 'Pao Lantern', 'Master Gemcutter', 'saltmere', 'gnome', 3, '#58c8e8', '“A flawed stone only wants one more cut, and a great deal of nerve.”'),
    rare: deed('d', 'Socket gems into gear', 4, { event: 'socket' }), raretext: 'A gem unset is a rumor. Set a few.',
    delivery: ['silver-ore', 3, 'Silver Ore'], finale: ['diamond-4', 1, 'Flawless Diamond'],
    names: ['A Bright Chip', 'Silver and Setting', 'The Silver Question', 'Gems Set Well', 'The Grandmaster’s Jewel'],
    voice: ['“Hold it to the light. It will tell you what it wants to be.”', '“Silver forgives a mistake. Gold remembers it.”', '“Bring me silver and a good reason.”', '“A setting should disappear. That is the whole trick.”', '“One stone, perfect. I will wait.”'] },
  { profession: 'tailoring', npc: person('seamstress-delphine', 'Delphine Aster', 'Master Tailor', 'thornwick', 'human', 0, '#e86aa8', '“Anyone can stitch two things together. A tailor decides what they become.”'),
    rare: kill('d', 'Skin the beasts of the wild', 8, { enemyType: 'beast' }), raretext: 'Cloth is easy. Leather has opinions.',
    delivery: ['spider-silk', 3, 'Spider Silk'], finale: ['thread-of-dawn', 2, 'Thread of Dawn'],
    names: ['Needle and Thread', 'Wool and Silk', 'Three Skeins of Silk', 'Pelts and Patience', 'The Grandmaster’s Vestment'],
    voice: ['“A good seam disappears. A great one is a promise.”', '“Wool for warmth, silk for vanity, leather for honesty.”', '“Silk is a spider’s patience, borrowed.”', '“The animal gave you this. Respect it with clean cuts.”', '“A coat that fits the wearer’s whole life. That is what I ask.”'] },
];

export const PROFESSION_NPCS: NpcDef[] = MASTERS.map((m) => m.npc);

export const PROFESSION_QUESTS: QuestDef[] = MASTERS.flatMap((m): QuestDef[] => {
  const id = (n: number): string => `prof-${m.profession}-${n}`;
  const giver = m.npc.id;
  const common = { kind: 'side' as const, giver };
  const turn = (text: string) => ({ turnIn: giver, turnInText: text });
  return [
    { ...common, id: id(1), name: m.names[0], level: 4, requires: level(3), summary: m.voice[0] as string,
      stages: [stage('craft', `Craft three ${m.profession} items.`, [deed('d', `Craft three items`, 3, { event: 'craft' })], turn('“Not bad. You were not born knowing that, and you can still tell.”'))], rewards: { xp: 0.2, gold: 8 } },
    { ...common, id: id(2), name: m.names[1], level: 10, requires: questDone(id(1)), summary: m.voice[1] as string,
      stages: [stage('craft', 'Craft six more items.', [deed('d', 'Craft six items', 6, { event: 'craft' })], turn('“Six. Good. Your hands are starting to know things.”'))], rewards: { xp: 0.3, gold: 12 } },
    { ...common, id: id(3), name: m.names[2], level: 18, requires: questDone(id(2)), summary: m.voice[2] as string,
      stages: [stage('bring', `Bring ${m.delivery[1]} × ${m.delivery[2]}.`, [deliver('o', `Bring ${m.delivery[1]} × ${m.delivery[2]}`, m.delivery[0], m.delivery[1], giver)], turn('“That is the real thing. Thank you.”'))], rewards: { xp: 0.35, gold: 16, items: [{ itemId: 'faint-essence', qty: 4 }] } },
    { ...common, id: id(4), name: m.names[3], level: 28, requires: questDone(id(3)), summary: `${m.voice[3]} ${m.raretext}`,
      stages: [stage('hunt', m.rare.text, [m.rare], turn('“Exactly what I needed. And the rest of it is yours.”'))], rewards: { xp: 0.45, gold: 22, gear: { rarity: 'rare' } } },
    { ...common, id: id(5), name: m.names[4], level: 40, requires: questDone(id(4)), summary: m.voice[4] as string,
      stages: [stage('finale', `Bring ${m.finale[1]} × ${m.finale[2]}, made or found.`, [deliver('o', `Bring ${m.finale[1]} × ${m.finale[2]}`, m.finale[0], m.finale[1], giver)], turn(`“There. You have the touch. Take the Grandmaster’s recipe and do not let it go to waste.”`))],
      rewards: { xp: 0.8, gold: 40, items: [{ itemId: `recipe-grandmaster-${m.profession}` }], title: `Grandmaster ${m.profession[0]!.toUpperCase()}${m.profession.slice(1)}` } },
  ];
});
