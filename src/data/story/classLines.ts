import type { EncounterDef } from '../../engine/combat/types';
import type { DialogueDef, QuestDef } from '../../engine/quests/types';
import { check, choice, clear, dialogue, encounter, fight, gold, level, near, all, questDone, say, setFlag, stage, stat, talk, visit } from './helpers';

/**
 * Class questlines: five quests per class from its mentor (found in every town's arena), after the
 * trial. Quests 3, 4 and 5 teach the class's skill evolutions (data/evolutions.ts).
 * Row: [shrine god, dungeon, boss 4 enemies, boss 5 enemies, titles x5, offers x5, finale line, class reply, CHA reply, plain reply, title earned].
 */
type Row = [shrine: string, dungeon: string, boss4: string[], boss5: string[], titles: string[], offers: string[], finale: string, own: string, cha: string, plain: string, earned: string];

const ROWS: Record<string, Row> = {
  warrior: ['kael', 'old-crypt', ['broodmother', '^forest-spider'], ['bone-lord', 'skeleton-soldier', 'skeleton-soldier'], ['A Soldier’s Oath', 'The Shield Wall', 'Hold the Crypt', 'The Broken Line', 'Standard-Bearer'], ['“A warrior’s oath is made at a war-god’s altar. Go to Kael’s shrine and make yours properly.”', '“Four raiders stand between the road and the village. Be the wall.”', '“A crypt in the Whisperwood has gone quiet in the wrong way. Clear it.”', '“A beast has broken a line of better soldiers than you. Show me you are different.”', '“The standard of the Third Line lies in the barrow. Carry it out.”'], '“Every soldier carries a flag, whether they know it or not. What is yours?”', '“I carry the line. I do not break it.”', '“You talk like a captain. Talk like one to my recruits, then.”', '“I’ll carry it.”', 'Standard-Bearer of the Third Line'],
  mage: ['aurelis', 'spider-hollow', ['broodmother', '^forest-spider'], ['bone-lord', 'restless-ghost', 'restless-ghost'], ['The First Footnote', 'Ink and Static', 'The Webbed Library', 'The Ember Thesis', 'The Last Lecture'], ['“Study begins in reverence. Visit Aurelis’s shrine and read the inscription twice.”', '“Wild magic is breaking the road. Quiet it, without making a mess.”', '“A hollow of spiders keeps my oldest notes. Retrieve them.”', '“A thing of fire and spite has taken a lecture hall. Argue it out.”', '“I give one lecture at the end of every career. Come, and hear mine.”'], '“Magic is the art of being precisely, deliberately wrong about the world. Are you ready to be wrong?”', '“I know the limits of the theory. I am going past them.”', '“A persuasive voice. If you can talk the weave into agreeing, you are an archmage.”', '“I’ll take notes.”', 'Archmage’s Footnote'],
  rogue: ['morrath', 'goblin-warren', ['goblin-king', 'goblin-cutthroat', 'goblin-cutthroat'], ['broodmother', '^forest-spider', 'forest-spider'], ['Light Fingers', 'The Back Door', 'A Warren of Locks', 'The Crown Job', 'Honor Among Ghosts'], ['“A thief tithes to the dead, who keep the best secrets. Leave a coin at Morrath’s shrine, and make it a stolen one.”', '“A rival crew is working our road. Make them understand.”', '“The goblins have a vault under the warren. Get in, get out, say nothing.”', '“The Goblin King’s crown, while he’s wearing it. Please.”', '“The last job is the one you do for free. Come, and I’ll tell you whose.”'], '“Everyone steals something. The good ones know what they’re stealing, and why.”', '“I never take what I can’t carry out.”', '“A silver tongue. You could talk the lock open, and the guard after it.”', '“I’ll do it for free.”', 'Ghost of the Warren'],
  cleric: ['solenne', 'old-crypt', ['bone-lord', 'restless-ghost'], ['tide-hag', '^restless-ghost', 'restless-ghost'], ['The Healer’s Vow', 'Mercy in the Field', 'The Crypt Beneath', 'The Unquiet Bishop', 'A Candle in the Dark'], ['“The healer’s vow is a small one: to do no harm unnecessarily. Make it at Solenne’s shrine.”', '“Wolves have wounded a caravan. Reach them, and bring them through.”', '“The crypt’s dead are not at rest. Go down, and light the candles properly.”', '“A bishop who would not die is rising in the east. Lay him down.”', '“Every healer has one soul they could not save. Come, and I will tell you mine.”'], '“Mercy is the hardest vow. What do you give when it is not enough?”', '“What I can. Then a little more.”', '“You speak to grief as if it were a person. That is the secret.”', '“I’ll keep trying.”', 'Candle-Bearer of the Dead'],
  ranger: ['ysolde', 'spider-hollow', ['broodmother', '^forest-spider'], ['dire-wolf', 'dire-wolf', 'alpha-wolf'], ['First Blood, Fair Game', 'The Wounded Elk', 'The Silk Forest', 'The Great Alpha', 'Last Arrow'], ['“Ysolde asks for a thank-you with every kill. Say yours at her shrine.”', '“Something has wounded the elk and not eaten it. Find what.”', '“The hollow is thick with silk, and the silk is thick with spiders. Cut a way through.”', '“The alpha is the best hunter in the wood. Do not kill it cheaply.”', '“One last arrow, for a bow I was given. Come, and I’ll tell you where it goes.”'], '“A hunter’s last shot isn’t at a thing. It’s at the idea of one. What do you aim at?”', '“I aim to feed what’s hungry, and spare what isn’t.”', '“You speak the way a good shot lands: once, and exactly.”', '“I’ll know it when I see it.”', 'Holder of the Last Arrow'],
  necromancer: ['morrath', 'drowned-grotto', ['tide-hag', '^drowned-sailor'], ['bone-lord', 'skeleton-soldier', 'restless-ghost'], ['The Honest Dead', 'A Funeral for the Forgotten', 'The Drowned Ledger', 'The Hag’s Debt', 'A Quiet Appointment'], ['“A necromancer’s first lesson is manners. Pay your respects at Morrath’s shrine.”', '“A burial party was ambushed. Finish the funeral for them.”', '“The grotto holds the names of drowned men. Bring the ledger up.”', '“The tide-hag collects debts from the dead. Collect hers.”', '“Everyone has an appointment with me. I’d like to make yours early, and kind.”'], '“The dead ask only to be remembered correctly. Do you remember them correctly?”', '“I remember them as they asked.”', '“You make a eulogy sound like a bargain. They’ll listen.”', '“I’ll keep the appointment.”', 'Registrar of the Dead'],
  monk: ['hesha', 'goblin-warren', ['goblin-king', 'goblin-cutthroat', 'goblin-shaman'], ['broodmother', '^forest-spider', 'forest-spider'], ['The Empty Bowl', 'The Road of a Thousand Steps', 'The Warren Within', 'The Broken Bell', 'One Breath'], ['“Hesha’s shrine asks for an empty bowl. Fill it with nothing, and bring it back.”', '“Travelers are stranded on a long road. Walk it with them.”', '“A warren of goblins has made a shrine of their own. Teach them its rules.”', '“A bell was broken in anger. Mend it with patience.”', '“The last lesson is one breath. Come and learn it.”'], '“A master and an apprentice walk into a mountain. Only one walks out. Which?”', '“The one who stopped needing to.”', '“A calm voice. They said that about the bell, too.”', '“I’ll learn the breath.”', 'Keeper of One Breath'],
  bard: ['hesha', 'drowned-grotto', ['tide-hag', '^drowned-sailor'], ['bone-lord', 'restless-ghost', 'restless-ghost'], ['Tuning Up', 'The Rival Troupe', 'The Echoing Grotto', 'The Silent Hall', 'Encore'], ['“Every act starts with a tuning. Visit Hesha’s shrine, who loves a warm hall, and play your first note.”', '“A rival troupe is sabotaging us. Win the crowd back.”', '“The grotto has a perfect echo. Use it.”', '“A hall has gone silent, and something is drinking the sound. Make it sing.”', '“Every bard gets one encore. Come and see how I spent mine.”'], '“The audience doesn’t remember the songs. They remember how they felt. How will you make them feel?”', '“Like the song was always theirs.”', '“A voice made for a hall of eight hundred. Use it.”', '“I’ll take the stage.”', 'Voice of the Last Encore'],
};

const LEVELS = [12, 16, 20, 25, 30];
const CLASS_PACK: Record<string, string[]> = {
  warrior: ['desert-raider', 'desert-raider', '^goblin-shaman'],
  mage: ['will-o-wisp', 'will-o-wisp', '^dark-cultist'],
  rogue: ['bandit-thug', 'bandit-archer', 'bandit-thug'],
  cleric: ['skeleton-soldier', 'skeleton-soldier', '^restless-ghost'],
  ranger: ['dire-wolf', 'dire-wolf', 'wyld-boar'],
  necromancer: ['dark-cultist', 'dark-cultist', '^restless-ghost'],
  monk: ['wyld-boar', 'dire-wolf', 'forest-spider'],
  bard: ['bandit-archer', 'bandit-thug', '^dark-cultist'],
};

export const CLASS_LINE_ENCOUNTERS: EncounterDef[] = Object.entries(ROWS).flatMap(([cls, r]) => [
  encounter(`cl-${cls}-pack`, 'Trouble on the Road', LEVELS[1] ?? 16, CLASS_PACK[cls] ?? ['dire-wolf']),
  encounter(`cl-${cls}-boss4`, 'A Test of Nerve', LEVELS[3] ?? 25, r[2], true),
  encounter(`cl-${cls}-boss5`, 'The Final Lesson', LEVELS[4] ?? 30, r[3], true),
]);

export const CLASS_LINE_QUESTS: QuestDef[] = [];
export const CLASS_LINE_DIALOGUES: DialogueDef[] = [];

for (const [cls, r] of Object.entries(ROWS)) {
  const [shrine, dungeon, , , titles, offers, finale, own, cha, plain, earned] = r;
  const mentor = `mentor-${cls}`;
  const zone = dungeon === 'goblin-warren' ? 'meadowlands' : dungeon === 'drowned-grotto' ? 'sunken-caves' : 'whisperwood';
  const common = { kind: 'class', giver: mentor, zone } as const;
  const classCond = { kind: 'class' as const, classId: cls };
  const id = (n: number): string => `cl-${cls}-${n}`;
  const shrineZone = ['solenne', 'hesha'].includes(shrine) ? 'meadowlands' : ['ysolde', 'morrath'].includes(shrine) ? 'whisperwood' : ['kael'].includes(shrine) ? 'ashen-desert' : ['aurelis'].includes(shrine) ? 'frostspire' : 'whisperwood';
  CLASS_LINE_QUESTS.push(
    { ...common, id: id(1), name: titles[0] as string, level: LEVELS[0] as number, summary: offers[0] as string, requires: all(classCond, level(10)), stages: [stage('a', 'Visit the shrine.', [visit('v', `Reach the shrine of ${shrine[0]?.toUpperCase()}${shrine.slice(1)}`, near(shrineZone, 'shrine', shrine, 'The shrine'))], { turnIn: mentor, turnInText: '“Good. A beginning, honestly made.”' })], rewards: { xp: 0.4, gold: 8 } },
    { ...common, id: id(2), name: titles[1] as string, level: LEVELS[1] as number, summary: offers[1] as string, requires: all(questDone(id(1)), level(14)), stages: [stage('a', 'Win the fight on the road.', [fight('f', 'Defeat the trouble on the road', `cl-${cls}-pack`, near(zone, 'waypoint', undefined, 'Trouble on the road'))], { turnIn: mentor, turnInText: '“Clean work. Rest, then come back.”' })], rewards: { xp: 0.5, gold: 10 } },
    { ...common, id: id(3), name: titles[2] as string, level: LEVELS[2] as number, summary: offers[2] as string, requires: all(questDone(id(2)), level(18)), stages: [stage('a', 'Clear the dungeon.', [clear('c', `Clear ${dungeon.replace(/-/g, ' ')}`, dungeon)], { turnIn: mentor, turnInText: '“It is done. You learned something down there; I can see it. Your first skill may now be taught its next form once it is mastered.”' })], rewards: { xp: 0.6, gold: 12, skillPoints: 1 } },
    { ...common, id: id(4), name: titles[3] as string, level: LEVELS[3] as number, summary: offers[3] as string, requires: all(questDone(id(3)), level(22)), stages: [stage('a', 'Win the hard fight.', [fight('f', 'Face the test of nerve', `cl-${cls}-boss4`, near(zone, 'waypoint', undefined, 'The test'))], { turnIn: mentor, turnInText: '“You did not flinch. That was the lesson.”' })], rewards: { xp: 0.7, gold: 14, skillPoints: 1 } },
    {
      ...common, id: id(5), name: titles[4] as string, level: LEVELS[4] as number, summary: offers[4] as string, requires: all(questDone(id(4)), level(26)),
      stages: [
        stage('a', 'Win the final lesson.', [fight('f', 'Face the final lesson', `cl-${cls}-boss5`, near(zone, 'waypoint', undefined, 'The final lesson'))]),
        stage('b', 'Settle things with your mentor.', [talk('t', 'Speak to your mentor', mentor, `cl-${cls}-finale`)]),
      ],
      rewards: { xp: 1, gold: 20, skillPoints: 2, title: earned as string },
      epilogue: `Your mentor bows, for the first and last time. “${earned}.”`,
    },
  );
  CLASS_LINE_DIALOGUES.push(
    dialogue(`cl-${cls}-finale`, {
      start: say(mentor, finale as string, { choices: [check(classCond, own as string, 'own', [gold(80), setFlag(`cl-${cls}:own`)]), check(stat('cha', 24), '[CHA 24] “Let me answer properly.”', 'cha', [gold(120), setFlag(`cl-${cls}:cha`)]), choice(plain as string, 'plain', [setFlag(`cl-${cls}:plain`)])] }),
      own: say(mentor, '“That is exactly the answer I had hoped you would find yourself. Take what I have.”'),
      cha: say(mentor, cha as string),
      plain: say(mentor, '“It will do. It will do beautifully, given time.”'),
    }),
  );
}
