import type { AiProfile, EnemyDef } from '../engine/combat/types';
import { GODS } from './gods';

/** What each god sends to walk beside its Apostle. */
const FOLLOWER_NAMES: Record<string, { name: string; ai: AiProfile; row: 'front' | 'back'; description: string }> = {
  solenne: { name: 'Sunguard of Solenne', ai: 'defensive', row: 'front', description: 'A knight of the Open Eye who has sworn to stand where you stand.' },
  morrath: { name: 'Raven of Morrath', ai: 'aggressive', row: 'back', description: 'It waits on your shoulder, and it is very patient.' },
  kael: { name: 'Einherjar of Kael', ai: 'aggressive', row: 'front', description: 'A warrior who died laughing, and came back to keep laughing beside you.' },
  ysolde: { name: 'Wolf of Ysolde', ai: 'aggressive', row: 'front', description: 'The Huntress lends you one of her own.' },
  vex: { name: 'Shade of Vex', ai: 'aggressive', row: 'back', description: 'Nobody sees it come. Nobody sees it leave. Your purse feels lighter afterward.' },
  thalor: { name: 'Forge-Thrall of Thalor', ai: 'defensive', row: 'front', description: 'Bronze and fire, built to take the blows meant for you.' },
  nymira: { name: 'Tide-Singer of Nymira', ai: 'caster', row: 'back', description: 'It sings the storm down on your enemies.' },
  aurelis: { name: 'Scribe of Aurelis', ai: 'caster', row: 'back', description: 'It takes notes on everything. Including the enemy, at length, in fire.' },
  hesha: { name: 'Hearth-Keeper of Hesha', ai: 'healer', row: 'back', description: 'It keeps you warm, fed and, above all, alive.' },
  grimvald: { name: 'Coin-Golem of Grimvald', ai: 'defensive', row: 'front', description: 'It is worth a fortune. It knows it.' },
};

/**
 * Apostle followers: each god's companion for its Apostle, fighting on
 * your side (AI-controlled) when you call it from the Pantheon. They are
 * built like enemies (elite tier, at your level) and count as a companion
 * for how much tougher enemies become.
 */
export const FOLLOWERS: EnemyDef[] = GODS.filter((g) => !g.hidden).map((g) => {
  const f = FOLLOWER_NAMES[g.id] ?? { name: `Follower of ${g.name}`, ai: 'aggressive' as AiProfile, row: 'front' as const, description: '' };
  const caster = f.ai === 'caster' || f.ai === 'healer';
  return {
    id: `follower-${g.id}`,
    name: f.name,
    family: 'spirit',
    types: ['spirit', 'divine', 'follower'],
    level: 1,
    tier: 'elite',
    row: f.row,
    // Back-row strikers hit harder to make up for the front line's toughness; the healer hits softly.
    stats: { hp: f.row === 'front' ? 50 : 40, attack: f.row === 'back' && !caster ? 20 : caster ? 6 : 12, magic: f.ai === 'healer' ? 5 : caster ? 19 : 6, defense: f.row === 'front' ? 9 : 6, magicResist: 8, speed: 11 },
    resists: { [g.element]: 40 },
    skills: f.ai === 'healer' ? [{ id: 'mend-ally' }, { id: `wrath-of-${g.id}` }] : [{ id: `wrath-of-${g.id}`, weight: 2 }],
    basicAttack: { element: g.element, ranged: f.row === 'back', magic: caster, name: 'Divine Strike' },
    ai: f.ai,
    xp: 0,
    lootTable: 'normal-enemy',
    description: f.description,
    palette: { main: g.color, accent: '#ffffff' },
  };
});
