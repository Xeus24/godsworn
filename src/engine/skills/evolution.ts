import { content, type Content } from '../../data';
import type { EvolutionDef } from '../../data/evolutions';
import type { Character } from '../character/types';
import { MAX_MASTERY, masteryLevel } from './mastery';
import { knownSkills } from './tree';

export type EvolutionResult = { ok: true; evolution: EvolutionDef } | { ok: false; reason: string };

export function evolutionOf(from: string, c: Content = content): EvolutionDef | undefined {
  return c.evolutions.all().find((e) => e.from === from);
}

/** Whether a base skill can evolve now: known, Grandmaster, its quest finished, not yet evolved. */
export function canEvolve(char: Character, completedQuests: Record<string, number>, from: string, c: Content = content): EvolutionResult {
  const evo = evolutionOf(from, c);
  if (!evo) return { ok: false, reason: 'That skill has no evolution.' };
  if (char.evolved[from]) return { ok: false, reason: 'Already evolved.' };
  if (!char.classes.some((p) => p.classId === evo.classId)) return { ok: false, reason: `Needs the ${c.classes.get(evo.classId).name} class.` };
  const known = knownSkills(char, c).some((s) => s.id === from);
  if (!known) return { ok: false, reason: 'You do not know that skill.' };
  if (masteryLevel(char.mastery[from] ?? 0) < MAX_MASTERY) return { ok: false, reason: `Needs mastery ${MAX_MASTERY} (Grandmaster) with ${c.skills.get(from).name}.` };
  if (!completedQuests[evo.quest]) return { ok: false, reason: `Finish "${c.quests.get(evo.quest).name}" first.` };
  return { ok: true, evolution: evo };
}

/** Evolves the skill: it takes the base skill's place on every hotbar and keeps its mastery. */
export function evolveSkill(char: Character, completedQuests: Record<string, number>, from: string, c: Content = content): EvolutionResult {
  const check = canEvolve(char, completedQuests, from, c);
  if (!check.ok) return check;
  const to = check.evolution.id;
  char.evolved[from] = to;
  char.mastery[to] = char.mastery[from] ?? 0;
  for (const st of Object.values(char.trees)) for (const build of st.builds) build.hotbar = build.hotbar.map((h) => (h === from ? to : h));
  return check;
}
