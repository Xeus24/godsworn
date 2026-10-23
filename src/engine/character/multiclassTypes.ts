/**
 * A hybrid prestige class: a hidden 16-node tree unlocked by a pair of
 * classes, both at HYBRID_LEVEL, once its trial has been won.
 */
export interface HybridDef {
  id: string;
  name: string;
  description: string;
  classes: [string, string];
  /** Encounter that must be won to unlock it (the two class mentors). */
  trial: string;
}

/** The trial a character must win before taking a class as a secondary (or tertiary) class. */
export interface ClassTrialDef {
  classId: string;
  encounter: string;
  /** One line from the mentor, shown on the trainer card. */
  quote: string;
}

/** How class XP is shared when a character has more than one class. */
export type XpMode = 'split' | 'focus';
