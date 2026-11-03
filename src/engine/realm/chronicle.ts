import { content, type Content } from '../../data';
import { ARTIFACT_ADJ, ARTIFACT_NOUN, CHRONICLE_YEARS, ERAS, FOES, GIVEN, HOUSES, PLACE_HEAD, PLACE_TAIL, RESERVED_WORDS, SURNAMES, TEMPLATES, WAR_ADJ, type EventKind } from '../../data/realm/chronicle';
import { Rng } from '../core/rng';
import type { ChronicleEvent, ChronicleState, Commission } from './types';

const KIND_COUNTS: [EventKind, number][] = [['war', 10], ['hero', 10], ['artifact', 10], ['disaster', 5], ['founding', 5]];
const fill = (t: string, v: Record<string, string>): string => t.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '');

/** Names the generator must not reuse: gods, companions and every named person already in the story. */
export function canonNames(c: Content = content): Set<string> {
  const out = new Set<string>();
  const add = (n: string): void => n.split(/\s+/).forEach((w) => w.length > 2 && out.add(w.toLowerCase().replace(/[^a-z]/g, '')));
  for (const g of c.gods.all()) add(g.name);
  for (const n of c.npcs.all()) add(n.name);
  for (const comp of c.companions.all()) add(comp.name);
  return out;
}

export const isCoreZone = (zoneId: string, c: Content = content): boolean => {
  const z = c.zones.find(zoneId);
  return !!z && z.ngPlus === undefined;
};

/** The fixed canon that the generated history must never contradict. Returns the problems found in a text (R18). */
export function canonProblems(text: string, c: Content = content): string[] {
  const problems: string[] = [];
  for (const w of RESERVED_WORDS) if (text.toLowerCase().includes(w.toLowerCase())) problems.push(`names ${w}`);
  for (const g of c.gods.all()) {
    const n = g.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`(slew|slain|killed|murdered|destroyed|unmade|banished)[^.]{0,40}${n}|${n}[^.]{0,30}(died|was slain|was killed|perished|fell silent forever)`, 'i').test(text)) problems.push(`harms ${g.name}`);
  }
  if (/the gods (fell|died|were slain|abandoned)/i.test(text)) problems.push('ends the gods');
  return problems;
}

/** Three hundred years of history, made from the save's seed. The same seed always makes the same history. */
export function generateChronicle(seed: number, c: Content = content): ChronicleState {
  const rng = new Rng((seed ^ 0x9e3779b1) >>> 0);
  const reserved = canonNames(c);
  const pick = <T>(list: readonly T[]): T => list[rng.int(0, list.length - 1)] as T;
  const used = new Set<string>();
  const unique = (make: () => string): string => {
    for (let i = 0; i < 100; i++) {
      const v = make();
      if (!used.has(v) && !v.split(/\s+/).some((w) => reserved.has(w.toLowerCase()))) {
        used.add(v);
        return v;
      }
    }
    return make();
  };
  const person = (): string => unique(() => `${pick(GIVEN)} ${pick(SURNAMES)}`);
  const place = (): string => unique(() => `${pick(PLACE_HEAD)} ${pick(PLACE_TAIL)}`);
  const gods = c.gods.all().filter((g) => g.id !== 'nameless').map((g) => g.id);
  const zones = c.zones.all().filter((z) => z.ngPlus === undefined).map((z) => z.id);
  const kinds: EventKind[] = KIND_COUNTS.flatMap(([k, n]) => Array.from({ length: n }, () => k));
  // Shuffle the kinds and zones so every region has two events and no two neighbours look alike.
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [kinds[i], kinds[j]] = [kinds[j] as EventKind, kinds[i] as EventKind];
  }
  const zoneOrder = [...zones];
  for (let i = zoneOrder.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [zoneOrder[i], zoneOrder[j]] = [zoneOrder[j] as string, zoneOrder[i] as string];
  }
  const eras = ERAS.map((e) => pick(e.names));
  void eras;
  const events: ChronicleEvent[] = kinds.map((kind, i) => {
    const year = -CHRONICLE_YEARS + Math.round(((i + 0.5) * CHRONICLE_YEARS) / kinds.length) + rng.int(-2, 2);
    const era = Math.min(ERAS.length - 1, Math.floor((year + CHRONICLE_YEARS) / (CHRONICLE_YEARS / ERAS.length)));
    const zone = zoneOrder[i % zoneOrder.length] as string;
    const god = pick(gods);
    const hero = person();
    const rival = person();
    const house = pick(HOUSES);
    let house2 = pick(HOUSES);
    while (house2 === house) house2 = pick(HOUSES);
    const where = place();
    const artifact = unique(() => `${pick(ARTIFACT_ADJ)} ${pick(ARTIFACT_NOUN)}`);
    const t = TEMPLATES[kind];
    const vars = { hero, rival, house, house2, place: where, zone: c.zones.get(zone).name, god: c.gods.get(god).name, artifact, foe: pick(FOES), year: `the year ${Math.abs(year)} before the road`, warAdj: pick(WAR_ADJ) };
    return { id: `ch-${i + 1}`, year, era, kind, title: fill(pick(t.title), vars), text: fill(pick(t.text), vars), zone, place: where, god, figures: [hero, rival] };
  });
  events.sort((a, b) => a.year - b.year);
  return { seed, events, known: {}, commissions: [], completed: [] };
}

export const eraName = (st: ChronicleState, era: number): string => {
  const names = ERAS[era]?.names ?? [];
  return names[(st.seed >>> 0) % Math.max(1, names.length)] ?? '';
};

/** The events at a region's ruins, oldest first. */
export const eventsIn = (st: ChronicleState, zone: string): ChronicleEvent[] => st.events.filter((e) => e.zone === zone);

export const commissionKind = (e: ChronicleEvent): { name: string; need: number } | undefined => {
  if (e.kind === 'artifact') return { name: `Recover the ${e.title.replace(/^The (Loss|Forging) of the /, '').replace(/^The /, '')}`, need: 5 };
  if (e.kind === 'hero') return { name: `Keep a vigil for ${e.figures[0]}`, need: 4 };
  if (e.kind === 'war') return { name: `Survey the field of ${e.title}`, need: 6 };
  return undefined;
};

export function offered(st: ChronicleState): { event: ChronicleEvent; name: string; need: number }[] {
  return st.events.flatMap((event) => {
    const k = commissionKind(event);
    if (!k || st.known[event.id] === undefined || st.completed.includes(event.id) || st.commissions.some((x) => x.event === event.id)) return [];
    return [{ event, name: k.name, need: k.need }];
  });
}

export const MAX_COMMISSIONS = 4;

export function take(st: ChronicleState, eventId: string): { ok: true; commission: Commission } | { ok: false; reason: string } {
  const o = offered(st).find((x) => x.event.id === eventId);
  if (!o) return { ok: false, reason: 'That commission is not on offer.' };
  if (st.commissions.length >= MAX_COMMISSIONS) return { ok: false, reason: `You may hold ${MAX_COMMISSIONS} commissions at once.` };
  const commission: Commission = { id: `commission-${eventId}`, event: eventId, visited: st.known[eventId] === 2, slain: 0, need: o.need };
  st.commissions.push(commission);
  return { ok: true, commission };
}

export const isDone = (c: Commission): boolean => c.visited && c.slain >= c.need;
