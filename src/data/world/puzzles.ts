import type { Cond } from '../../engine/quests/types';

/**
 * The Living Elements and Relic Tools (Innovation Pack, items 20 and 21). Old regions have new things in them: a thicket that
 * wants burning, a river that wants freezing, a rope to cut, a boulder to push, a ledge to reach. Every core region has a two-step
 * puzzle: an element one, and a tool one that opens only after it. The elements come from the skills you know; the tools are found
 * by doing what they ask.
 */
export type PuzzleNeed = 'burn' | 'freeze' | 'conduct' | 'cut' | 'push' | 'grapple' | 'glide' | 'dowse' | 'lantern' | 'phase';

export interface NeedInfo {
  id: PuzzleNeed;
  /** What the thing looks like, and what you do. */
  label: string;
  verb: string;
  /** Success line. */
  done: string;
  kind: 'element' | 'tool';
}

export const NEEDS: Record<PuzzleNeed, NeedInfo> = {
  burn: { id: 'burn', kind: 'element', label: 'Dry thicket', verb: 'Burn it away', done: 'The thicket goes up in a sheet of orange. Behind it, something that was waiting for fire.' },
  freeze: { id: 'freeze', kind: 'element', label: 'Rushing ford', verb: 'Freeze the water', done: 'The water stops mid-run, glassy and white. You walk across to what it was guarding.' },
  conduct: { id: 'conduct', kind: 'element', label: 'Rune-plates in a pool', verb: 'Send lightning through the water', done: 'The current finds every plate. They light one after another, and the stone beneath them opens.' },
  cut: { id: 'cut', kind: 'element', label: 'Taut rope', verb: 'Cut the rope', done: 'The rope parts with a note like a plucked string. Something heavy comes down, and opens.' },
  push: { id: 'push', kind: 'element', label: 'Boulder on a lip', verb: 'Push the boulder', done: 'It rocks, hesitates, and goes. The hollow it was sitting on is full.' },
  grapple: { id: 'grapple', kind: 'tool', label: 'High ledge', verb: 'Use the Grappling Hook', done: 'The hook bites. You haul yourself up to a ledge nobody has stood on in a hundred years.' },
  glide: { id: 'glide', kind: 'tool', label: 'Chasm with a far side', verb: 'Glide across', done: 'The cloak catches the updraft and holds. You land lightly, on the wrong side of an old wall.' },
  dowse: { id: 'dowse', kind: 'tool', label: 'Bare, suspicious ground', verb: 'Use the Dowsing Rod', done: 'The rod twists in your hands and points straight down. A spade, an hour, and a buried box.' },
  lantern: { id: 'lantern', kind: 'tool', label: 'A wall that is not quite a wall', verb: 'Raise the Lantern of Aurelis', done: 'The lantern’s light finds the seam, and the illusion thins to nothing: a doorway, and a cache.' },
  phase: { id: 'phase', kind: 'tool', label: 'Sealed stone', verb: 'Walk through in the Phase Boots', done: 'The wall is, for a few steps, a rumor. You step through it, and out again, carrying something.' },
};

/** The element puzzles, and the tool puzzles that follow them, in the order regions get them. */
export const ELEMENT_ROTATION: PuzzleNeed[] = ['burn', 'freeze', 'conduct', 'cut', 'push'];
export const TOOL_ROTATION: PuzzleNeed[] = ['grapple', 'glide', 'dowse', 'lantern', 'phase'];

export interface RelicToolDef {
  id: PuzzleNeed;
  name: string;
  text: string;
  /** What finds it. */
  found: Cond;
  hint: string;
}

// prettier-ignore
export const RELIC_TOOLS: RelicToolDef[] = [
  { id: 'grapple', name: 'Grappling Hook', text: 'Three iron prongs, a coil of cord that has never frayed, and a maker’s mark you cannot place. It always finds something to bite.', found: { kind: 'dungeons', min: 8 }, hint: 'Clear eight dungeons.' },
  { id: 'glide', name: 'Sylph’s Glide Cloak', text: 'A cloak so light it moves in no wind. When you leap from a height it spreads, and the air under it feels, briefly, like a hand.', found: { kind: 'zones', min: 10 }, hint: 'Set foot in ten regions.' },
  { id: 'dowse', name: 'Dowsing Rod', text: 'A forked twig of no known tree. It is always very slightly damp, and it is never wrong about what is under you.', found: { kind: 'progress', stat: 'secrets', min: 12 }, hint: 'Find twelve secrets.' },
  { id: 'lantern', name: 'Lantern of Aurelis', text: 'A small brass lantern with a lens of old glass. The light is steady and the wrong colour, and it does not so much illuminate as disagree with illusions.', found: { kind: 'lore', count: 20 }, hint: 'Read twenty lore pages.' },
  { id: 'phase', name: 'Phase Boots', text: 'Boots made for a very careful thief. Wear them and the world is a little less solid than it was. Do not stop mid-wall.', found: { kind: 'lifetime', stat: 'bossesKilled', min: 10 }, hint: 'Defeat ten bosses.' },
];
