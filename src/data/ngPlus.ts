/**
 * New Game+. After an ending you may start the story again with your hero,
 * gear and achievements; the world rises to meet you.
 */
export const NG_PLUS = {
  /** Highest NG+ tier. */
  maxTier: 10,
  /**
   * In NG+ the world's levels 1..levelFrom are stretched over
   * levelFrom..levelTo (the Meadowlands are 60-62, the Dark Citadel
   * 77-80). Levels already at or above levelFrom stay as they are.
   */
  levelFrom: 60,
  levelTo: 80,
  /** Every NG+ tier past the first gives enemies this much more HP and damage (percent). */
  threatPerTier: 25,
  /** Flags that survive into the next playthrough start with this. */
  legacyFlagPrefix: 'legacy:',
};
