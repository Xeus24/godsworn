import { EPILOGUE_SLIDES } from '../../data/story/epilogue';
import type { GameState } from '../state/gameState';
import { evaluate } from './conditions';
import type { EpilogueSlide } from './types';

/** The slides of this playthrough's epilogue: every slide whose condition holds, in order. */
export function epilogueSlides(state: GameState): EpilogueSlide[] {
  return EPILOGUE_SLIDES.filter((s) => !s.cond || evaluate(state, s.cond));
}
