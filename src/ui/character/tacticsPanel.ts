import { RAGE_TACTICS } from '../../data/general/techniques';
import type { GameSession } from '../../engine/state/gameState';
import { foldPanel } from '../components/fold';
import { el } from '../screen';

/** The Warrior's optional Tactics mode: play Rage as Tactic Dice. Only shown to a hero who holds the Warrior class. */
export function tacticsPanel(s: GameSession, render: () => void): HTMLElement[] {
  if (!s.player.classes.some((c) => c.classId === 'warrior')) return [];
  const on = Boolean(s.player.rageAsTactics);
  const box = el('input', { type: 'checkbox' }) as HTMLInputElement;
  box.checked = on;
  box.addEventListener('change', () => {
    s.player.rageAsTactics = box.checked;
    render();
  });
  const label = el('label', { class: 'small', title: `Rage you build is counted in Tactic Dice (one per ${RAGE_TACTICS.perDie} Rage) and Rage skills are paid in dice. The dice are shared with your Battle Techniques. Takes effect next battle.` }, box, ' Play Rage as Tactic Dice');
  return [foldPanel(el('section', { class: 'panel' }, el('h3', {}, 'Warrior’s Tactics'), label, el('p', { class: 'dim small' }, 'Optional. Off keeps the classic Rage bar.')), on ? 'Tactic Dice' : 'Rage')];
}
