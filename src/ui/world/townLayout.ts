/**
 * The player's arrangement of the cards on the town screen. Pure helpers
 * for ordering, plus storage in the browser (the same layout is used in
 * every town; cards a town does not have are simply skipped).
 */
const KEY = 'godsworn:townLayout';

export function loadLayout(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function saveLayout(order: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(order));
  } catch {
    // Storage may be unavailable: the layout lasts this visit.
  }
}

export function resetLayout(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing stored anyway.
  }
}

/** Cards in the saved order; any card the saved layout does not know keeps its default place at the end. */
export function orderCards(defaults: string[], saved: string[]): string[] {
  const known = saved.filter((id, i) => defaults.includes(id) && saved.indexOf(id) === i);
  return [...known, ...defaults.filter((id) => !known.includes(id))];
}

/** Moves a card so it sits at `index` (clamped); returns a new order. */
export function moveCard(order: string[], id: string, index: number): string[] {
  const from = order.indexOf(id);
  if (from < 0) return order;
  const rest = order.filter((x) => x !== id);
  rest.splice(Math.max(0, Math.min(rest.length, index)), 0, id);
  return rest;
}
