import { content } from '../../data';
import type { GameSession } from '../state/gameState';
import { availablePoints } from '../skills/tree';

/** One plain sentence on what a hero should probably do next. Order: spend points, hand in or continue quests, take a job, go where the level fits. */
export function nextStep(s: GameSession): string {
  const p = s.player;
  if (p.attributePoints > 0) return `You have ${p.attributePoints} attribute point${p.attributePoints === 1 ? '' : 's'} to spend: open the Character screen (C).`;
  const skills = p.classes.reduce((n, c) => n + Math.max(0, availablePoints(p, c.classId)), 0);
  if (skills > 0) return `You have ${skills} skill point${skills === 1 ? '' : 's'} to spend: open Skills (K).`;
  const active = s.quests.active();
  const town = s.world.inTown();
  for (const q of active) {
    const prog = s.quests.progress(q.id);
    if (prog) return `Continue "${q.name}": see Quests (J) for the next step.`;
  }
  if (town && s.quests.board(town).length > 0) return 'Take a job from the Quest Board in this town.';
  const level = p.level;
  const fits = content.zones.all().filter((z) => level >= z.levels[0] && level <= z.levels[1]).sort((a, b) => a.order - b.order);
  const z = fits[0] ?? content.zones.all().filter((x) => x.levels[0] > level).sort((a, b) => a.levels[0] - b.levels[0])[0];
  if (z) return `Head for ${z.name} (levels ${z.levels[0]}-${z.levels[1]}) on the World map (G).`;
  return 'Explore the World map (G), clear a dungeon, or push into the endgame.';
}
