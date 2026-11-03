import { MARROW, MARROW_DEEDS, MARROW_FACTS, MARROW_SLOTS, MARROW_VILLAGERS, slotLabel, type MarrowDeed, type MarrowPlace, type MarrowVillager } from '../../data/realm/marrow';
import type { MarrowState } from './types';

export type MarrowResult = { ok: true; text: string; ended?: 'mended' | 'emptied' | 'flood' } | { ok: false; reason: string };
const fail = (reason: string): MarrowResult => ({ ok: false, reason });

/** Who is at a place in a slot. */
export const presentAt = (slot: number, place: MarrowPlace): MarrowVillager[] => MARROW_VILLAGERS.filter((v) => v.where[slot] === place);

/** The deeds that can be done at a place now (their hour has come and the run so far allows them), whether or not you know enough. */
export const deedsAt = (st: MarrowState, place: MarrowPlace): { deed: MarrowDeed; ready: boolean; missing: string }[] =>
  MARROW_DEEDS.filter((d) => d.place === place && d.slots.includes(st.slot) && !st.deeds.includes(d.id)).map((deed) => {
    const lacksFact = deed.needsFacts.find((f) => !st.facts.includes(f));
    const lacksDeed = deed.needsDeeds.find((d) => !st.deeds.includes(d));
    const missing = lacksFact ? 'You do not know enough yet.' : lacksDeed ? 'Something has to be done first, in this run.' : '';
    return { deed, ready: missing === '', missing };
  });

function pushLog(st: MarrowState, text: string): void {
  st.log.push(text);
  if (st.log.length > 40) st.log.shift();
}

/** One slot passes. At the end of the twelfth the weir gives way and everyone wakes on the first morning (unless the loop has been broken). */
function pass(st: MarrowState): MarrowResult | undefined {
  st.slot++;
  if (st.slot < MARROW_SLOTS) return undefined;
  st.loops++;
  const text = 'At the twelfth hour the weir gives way. The water comes down through the lower town in a long green wall, and the bell does not ring. The last thing you hear is a clock, ticking somewhere in the tower. Then it is morning, and you are standing where you started, and you remember.';
  st.slot = 0;
  st.deeds = [];
  st.log = [text];
  return { ok: true, text, ended: 'flood' };
}

/** Talk to someone in this place: you learn the first thing they will tell you that you do not know yet. */
export function talk(st: MarrowState, villagerId: string, place: MarrowPlace): MarrowResult {
  if (st.saved) return fail('Marrow is quiet now.');
  const v = presentAt(st.slot, place).find((x) => x.id === villagerId);
  if (!v) return fail('They are not here.');
  const open = v.topics.find((t) => !st.facts.includes(t.fact) && (!t.needs || st.facts.includes(t.needs)) && (!t.loops || st.loops >= t.loops));
  let text: string;
  if (open) {
    st.facts.push(open.fact);
    text = `${v.name}: ${open.say}`;
  } else {
    const known = v.topics.find((t) => st.facts.includes(t.fact));
    text = `${v.name}: ${known ? known.again : v.idle}`;
  }
  pushLog(st, text);
  return pass(st) ?? { ok: true, text };
}

/** Do one of the five deeds. */
export function doDeed(st: MarrowState, deedId: string, place: MarrowPlace): MarrowResult {
  if (st.saved) return fail('Marrow is quiet now.');
  const d = MARROW_DEEDS.find((x) => x.id === deedId);
  if (!d || d.place !== place || !d.slots.includes(st.slot)) return fail('This is not the place or the hour for it.');
  const at = deedsAt(st, d.place).find((x) => x.deed.id === d.id);
  if (!at) return fail('It is already done.');
  if (!at.ready) return fail(at.missing);
  st.deeds.push(d.id);
  const text = d.text;
  pushLog(st, text);
  if (d.id === 'release') {
    st.saved = st.deeds.includes('sluice') ? 'mended' : 'emptied';
    pushLog(st, st.saved === 'mended' ? 'The clock strikes the first true hour in forty years. The weir holds. Marrow wakes to a morning that is, at last, only a morning.' : 'The clock strikes. The weir breaks, but the lower town is empty, and everyone watches the water from the hill. Marrow wakes to a morning, and a long walk toward somewhere else.');
    return { ok: true, text, ended: st.saved };
  }
  return pass(st) ?? { ok: true, text };
}

/** Let the hour pass. */
export function wait(st: MarrowState): MarrowResult {
  if (st.saved) return fail('Marrow is quiet now.');
  pushLog(st, `The ${slotLabel(st.slot)} passes. The clock does not tick.`);
  return pass(st) ?? { ok: true, text: 'Time passes.' };
}

export const knownFacts = (st: MarrowState): [string, string][] => st.facts.map((f) => [f, MARROW_FACTS[f] ?? f]);
export const marrowRewards = (kind: 'mended' | 'emptied') => MARROW[kind];
