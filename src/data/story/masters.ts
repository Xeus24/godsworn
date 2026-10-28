import type { EncounterDef, EnemyDef } from '../../engine/combat/types';
import type { DialogueDef, NpcDef, QuestDef } from '../../engine/quests/types';
import { choice, dialogue, fight, foe, level, near, say, stage, startFight, talk } from './helpers';

/**
 * Fifteen hidden Masters, two per zone (one in the last). Each waits near a waypoint once you are
 * strong enough, will not teach until you have beaten them, and teaches one Master skill.
 */
interface Master {
  id: string;
  name: string;
  title: string;
  zone: string;
  level: number;
  skill: string;
  race: string;
  color: string;
  magic?: boolean;
  line: string;
  teach: string;
}

const MASTERS: Master[] = [
  { id: 'pell', name: 'Pell the Wheelwright', title: 'Retired Champion', zone: 'meadowlands', level: 6, skill: 'masters-grip', race: 'human', color: '#8a6a3a', line: '“I turned wheels for thirty years. Before that I turned heads. Show me your grip.”', teach: '“Hold the thing like it owes you money. There. That is the whole art.”' },
  { id: 'orn', name: 'Gaffer Orn', title: 'Old Archer', zone: 'meadowlands', level: 7, skill: 'hushed-arrow', race: 'dwarf', color: '#5a7a3a', line: '“Nobody hears the arrow that hits them. Shall we find out whether you can loose one?”', teach: '“Between two heartbeats. That is where the quiet lives. Go and live there.”' },
  { id: 'ilsa', name: 'Hedge-Witch Ilsa', title: 'Keeper of the Hollow Oak', zone: 'whisperwood', level: 12, skill: 'masters-spark', race: 'elf', color: '#5a8a5a', magic: true, line: '“Another one who wants spells. Prove the spells want you back.”', teach: '“A spark is a question the world answers. You have learned to ask it nicely.”' },
  { id: 'tuck', name: 'Brother Tuck', title: 'Hermit of the Rain', zone: 'whisperwood', level: 14, skill: 'saints-patience', race: 'human', color: '#d8d0a8', magic: true, line: '“Patience is a prayer you say with your whole life. Mine has been ten years. Let us test yours.”', teach: '“You waited. That is a rare thing. Here is what it buys.”' },
  { id: 'maul', name: 'Maul Stonebeard', title: 'Exiled Oathsmith', zone: 'sunken-caves', level: 20, skill: 'dwarven-reckoning', race: 'dwarf', color: '#7a6a5a', line: '“A debt is a debt, lad, even to the rock. Come and settle yours.”', teach: '“Paid in full. Now take the rest of it, because I will not be needing it.”' },
  { id: 'naia', name: 'Tidewife Naia', title: 'Fisher of Drowned Things', zone: 'sunken-caves', level: 22, skill: 'tide-turned', race: 'tidekin', color: '#3a7a9a', magic: true, line: '“The sea gives back what it can’t keep. Can you keep what I give?”', teach: '“Turn the tide, and the drowned breathe. It is the nearest thing to a miracle I know.”' },
  { id: 'oduya', name: 'Windspeaker Thessaly', title: 'Last of the Dune-Runners', zone: 'ashen-desert', level: 28, skill: 'masters-stride', race: 'human', color: '#c8a050', line: '“You walk as if the ground owes you. It does not. Catch me, and I will show you how it is done.”', teach: '“Never ask the sand for permission. Take the next step before it knows.”' },
  { id: 'zhao', name: 'Sister Zhao', title: 'Bearer of the Iron Lotus', zone: 'ashen-desert', level: 30, skill: 'iron-lotus', race: 'human', color: '#c86a2a', line: '“Four blows, one breath. Most can manage one. Let me count yours.”', teach: '“Four. The lotus is open. Close it gently.”' },
  { id: 'aldous', name: 'Hermit Aldous', title: 'Who Counts the Snow', zone: 'frostspire', level: 36, skill: 'masters-calm', race: 'gnome', color: '#8ab8d8', line: '“Cold teaches stillness faster than any monk. Stand still while I try to move you.”', teach: '“Calm is not an absence. It is a place you build. Here are the plans.”' },
  { id: 'candle', name: 'The Pale Candle', title: 'A Flame Without a Wick', zone: 'frostspire', level: 38, skill: 'pale-flame', race: 'revenant', color: '#e8e8f0', magic: true, line: '“I give no heat. I give no light. I am still the brightest thing in this valley. Prove otherwise.”', teach: '“Fire is only a manner of speaking. Speak it softly, and it will burn through anything.”' },
  { id: 'mags', name: 'Skipper Mags', title: 'Rang the Drowned Bell', zone: 'stormcoast', level: 44, skill: 'drowned-bell', race: 'tidekin', color: '#2a5a7a', magic: true, line: '“Hear that? Under the waves? That is my bell. You will have to earn the right to ring it.”', teach: '“Ring it once, and the whole coast listens. Twice, and it answers.”' },
  { id: 'tolle', name: 'Lanternkeeper Tolle', title: 'Watcher on the Last Light', zone: 'stormcoast', level: 46, skill: 'masters-eye', race: 'human', color: '#e8c858', line: '“I have watched ships for forty years and missed none. Let us see what you miss.”', teach: '“Look where nothing is. That is where it hides. You have the eye now.”' },
  { id: 'kesh', name: 'Warden Kesh', title: 'Wolf-Brother of the Rift', zone: 'volcanic-rift', level: 52, skill: 'wolf-pact', race: 'beastkin', color: '#8a3a2a', line: '“The pack does not take strangers. It takes the ones who beat me.”', teach: '“A wolf for the long dark. Feed him, and he will not leave.”' },
  { id: 'cinder', name: 'The Cinder Sage', title: 'Gambler of the Ash', zone: 'volcanic-rift', level: 53, skill: 'masters-luck', race: 'ashborn', color: '#d84a2a', line: '“Luck is a muscle. Care to see if yours is any good? Best of one. Winner keeps the lesson.”', teach: '“You win. Fine. It was always going to be you, or it was never going to be anyone.”' },
  { id: 'veteran', name: 'The Last Veteran', title: 'Survivor of the Siege', zone: 'dark-citadel', level: 58, skill: 'masters-faith', race: 'human', color: '#f0e0a0', magic: true, line: '“I prayed through a siege that no one else survived. Tell me you can do the same.”', teach: '“Faith is not what you believe. It is what you do when it is the only thing left.”' },
];

const dist = (i: number): number => 5 + ((i * 3) % 7);

export const MASTER_NPCS: NpcDef[] = MASTERS.map((m) => ({ id: `master-${m.id}`, name: m.name, title: m.title, place: 'field', race: m.race, portrait: 0, color: m.color, greeting: '' }));

export const MASTER_ENEMIES: EnemyDef[] = MASTERS.map((m) =>
  foe({
    id: `master-fight-${m.id}`, name: m.name, family: 'humanoid', types: ['humanoid', 'master'], level: m.level, tier: 'miniboss', row: m.magic ? 'back' : 'front', ai: m.magic ? 'caster' : 'aggressive',
    stats: m.magic ? { hp: 58 + m.level, attack: 6, magic: 16 + m.level / 4, defense: 6 + m.level / 5, magicResist: 10 + m.level / 4, speed: 11 } : { hp: 66 + m.level, attack: 15 + m.level / 4, magic: 0, defense: 8 + m.level / 4, magicResist: 6 + m.level / 5, speed: 12, critChance: 8 },
    skills: m.magic ? [{ id: 'mentor-meteor', weight: 2 }, { id: 'mend-ally' }] : [{ id: 'mentor-riposte', weight: 2 }, { id: 'shield-bash' }],
    basicAttack: m.magic ? { element: 'arcane', ranged: true, magic: true, name: 'Spark' } : { element: 'physical', ranged: false, name: 'Master’s Strike' },
    description: m.title, palette: { main: m.color, accent: '#f0e8d0' },
  }),
);

export const MASTER_ENCOUNTERS: EncounterDef[] = MASTERS.map((m) => ({
  id: `master-${m.id}`, name: `Master: ${m.name}`, description: `${m.name} tests you before teaching.`, level: m.level, canFlee: true, threat: 60, enemies: [{ enemyId: `master-fight-${m.id}`, level: m.level }],
}));

export const MASTER_QUESTS: QuestDef[] = MASTERS.map((m, i): QuestDef => {
  const at = (label: string) => near(m.zone, 'waypoint', undefined, label, { distance: dist(i) });
  return {
    id: `master-${m.id}`, name: `A Master: ${m.name}`, kind: 'side', level: m.level, zone: m.zone, auto: true, requires: level(Math.max(1, m.level - 2)),
    summary: `Rumor says ${m.name}, ${m.title.toLowerCase()}, still teaches near the ${m.zone.replace('-', ' ')} waypoint, to anyone who can best them.`,
    stages: [
      stage('meet', `Find ${m.name}.`, [talk('t', `Speak with ${m.name}`, `master-${m.id}`, `master-${m.id}-meet`, at(`Where ${m.name} waits`))]),
      stage('test', `Pass ${m.name}’s test.`, [fight('f', `Best ${m.name}`, `master-${m.id}`, at(`${m.name}’s ground`))]),
    ],
    rewards: { xp: 0.5, gold: 20, items: [{ itemId: `book-${m.skill}` }] },
    epilogue: m.teach,
  };
});

export const MASTER_DIALOGUES: DialogueDef[] = MASTERS.map((m) =>
  dialogue(`master-${m.id}-meet`, {
    start: say(`master-${m.id}`, m.line, { choices: [choice('“Test me, then.”', 'go', [startFight(`master-${m.id}`)]), choice('“Not today.”', 'later')] }),
    go: say(`master-${m.id}`, '“Good. No holding back; I will not.”'),
    later: say(`master-${m.id}`, '“Then come back when you can. I am not going anywhere.”'),
  }),
);

export const MASTER_SKILLS: Record<string, string> = Object.fromEntries(MASTERS.map((m) => [m.id, m.skill]));
