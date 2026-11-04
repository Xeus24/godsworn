import { JOURNAL_BASE, JOURNAL_HEART, JOURNAL_VOICE, type JournalEvent } from '../../data/fellowship';

const hash = (s: string): number => {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
};

/** One journal entry in the hero’s own voice: how the event is told, coloured by the hero’s past and what they hold dear. A pure function of its inputs. */
export function journalEntry(event: JournalEvent, background: string, day: number, detail = ''): string {
  const voice = JOURNAL_VOICE[background] ?? JOURNAL_VOICE['soldier']!;
  const h = hash(`${event}:${background}:${day}`);
  const base = JOURNAL_BASE[event];
  const lead = voice.lead[h % voice.lead.length] as string;
  const tail = voice.tail[(h >>> 4) % voice.tail.length] as string;
  const core = base[(h >>> 8) % base.length] as string;
  const heart = (h >>> 12) % 4 === 0 ? ` ${JOURNAL_HEART[(h >>> 16) % JOURNAL_HEART.length]}` : '';
  return `${lead} ${core}${detail ? ` (${detail})` : ''} ${tail}${heart}`;
}

/** How many distinct entries the writer can produce for an event and a past. */
export function journalVariants(): number {
  const bgs = Object.keys(JOURNAL_VOICE).length;
  const events = Object.keys(JOURNAL_BASE).length;
  const perEvent = 3 * 3 * 3 * (1 + JOURNAL_HEART.length);
  return bgs * events * perEvent;
}
