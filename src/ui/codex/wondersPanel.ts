import { content } from '../../data';
import { COMMISSIONS, ERAS, LEGENDS, PAINTER, SPIRE_CARDS, SPIRE_RELICS, SUNDERED, TURNING_POINTS, WATERS } from '../../data/wonders';
import { cardById } from '../../engine/minigames/cardGame';
import type { GameSession } from '../../engine/state/gameState';
import { el } from '../screen';
import type { RealmView } from './realmPanel';

type R = { ok: boolean; reason?: string; text?: string };

function button(label: string, run: () => R | void, open: RealmView, rerender: () => void, disabled = false): HTMLButtonElement {
  const b = el('button', { type: 'button' }, label) as HTMLButtonElement;
  b.disabled = disabled;
  b.addEventListener('click', () => {
    const r = run();
    open.outcome = r ? (r.ok ? (r.text ?? '') : (r.reason ?? '')) : '';
    rerender();
  });
  return b;
}

const say = (open: RealmView): HTMLElement[] => (open.outcome ? [el('p', { class: 'small' }, open.outcome)] : []);

/** Item 25: the aquarium, the twelve legends and the fish that remember you. */
export function watersPanel(s: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  const w = s.wonders.w.waters;
  const caught = Object.keys(s.state.minigames.fish).map((id) => content.fish.find(id)).filter((f) => !!f);
  return el('div', {},
    el('p', { class: 'dim small' }, 'Nymira’s Waters: the aquarium at the Brightwater docks. Fish on show give a little gold find. Twelve legends rise only to those who have caught many kinds, and a great fish that slips the line will remember you.'),
    el('h3', {}, `Aquarium (${w.shown.length} of ${w.room})`),
    ...(w.shown.length ? w.shown.map((id) => el('div', { class: 'row wrap small' }, content.fish.find(id)?.name ?? id, button('Take out', () => s.wonders.unshow(id), open, rerender))) : [el('p', { class: 'dim small' }, 'Empty.')]),
    button(`Enlarge (+${WATERS.tankStep} places, ${WATERS.tankCost} gold)`, () => s.wonders.enlarge(), open, rerender, w.room >= WATERS.tankMax),
    el('h3', {}, 'Fish you could put on show'),
    el('div', { class: 'row wrap' }, ...caught.filter((f) => f && !w.shown.includes(f.id)).slice(0, 24).map((f) => button(f!.name, () => s.wonders.show(f!.id), open, rerender))),
    el('h3', {}, `Legends (${s.wonders.legendsCaught()} of ${LEGENDS.length})`),
    ...LEGENDS.map((l) => el('div', { class: 'small' }, w.legends[l.id] ? el('span', {}, el('b', {}, l.name), ` (${w.legends[l.id]} lb): ${l.text}`) : el('span', { class: 'dim' }, `??? (${l.water}, ${l.time === 'any' ? 'any hour' : l.time}, ${l.kinds} kinds caught)`))),
    el('h3', {}, 'The ones that got away'),
    ...(Object.keys(w.grudge).length ? Object.entries(w.grudge).map(([id, scars]) => el('div', { class: 'small' }, `${content.fish.find(id)?.name ?? id}: ${scars} scar${scars > 1 ? 's' : ''}`)) : [el('p', { class: 'dim small' }, 'No fish holds a grudge.')]),
    ...say(open),
  );
}

/** Item 26: the card roguelite. */
export function cardSpirePanel(s: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  const sp = s.wonders.w.spire;
  const run = sp.run;
  const head = el('p', { class: 'dim small' }, `A climb of ${SPIRE_CARDS.topFloor} floors of card duels with a drafted pool, ${SPIRE_CARDS.hearts} hearts and relics. Gold comes home, and a card to keep for every ${SPIRE_CARDS.keepEvery} floors. Best: ${sp.best}. Runs: ${sp.runs}.`);
  if (!run) return el('div', {}, head, button('Climb the Spire of Cards', () => s.wonders.spireStart(), open, rerender, !s.wonders.canSpire().ok), ...(s.wonders.canSpire().ok ? [] : [el('p', { class: 'dim small' }, (s.wonders.canSpire() as { reason: string }).reason)]), ...say(open));
  const opp = s.wonders.spireOpponentNow()!;
  const relics = run.relics.map((id) => SPIRE_RELICS.find((r) => r.id === id)?.name).join(', ') || 'none';
  const info = el('div', { class: 'small' }, `Floor ${run.floor} of ${SPIRE_CARDS.topFloor} · ${'♥'.repeat(run.hearts)} · ${run.gold} gold held · relics: ${relics}`);
  const out: HTMLElement[] = [head, info];
  if (run.phase === 'draft') out.push(el('h3', {}, 'Draft a card'), el('div', { class: 'row wrap' }, ...run.offer.map((id) => button(`${cardById(id).name} (${cardById(id).power})`, () => s.wonders.spireDraft(id), open, rerender)), button('Skip', () => s.wonders.spireDraft(undefined), open, rerender)));
  else if (run.phase === 'relic') out.push(el('h3', {}, 'Take a relic'), ...run.offer.map((id) => { const r = SPIRE_RELICS.find((x) => x.id === id)!; return el('div', { class: 'row wrap small' }, button(r.name, () => s.wonders.spireRelic(id), open, rerender), r.text); }));
  else {
    const hand = (open.hand ??= []);
    out.push(el('h3', {}, `${opp.name}, ${opp.title}`), el('p', { class: 'small' }, `They hold: ${opp.deck.map((id) => cardById(id).name).join(', ')}`), el('p', { class: 'small' }, `Your hand, in play order (${hand.length} of 5): ${hand.map((id) => cardById(id).name).join(' → ') || 'none yet'}`));
    out.push(el('div', { class: 'row wrap' }, ...run.pool.filter((id) => !hand.includes(id)).map((id) => { const c = cardById(id); const b = el('button', { type: 'button' }, `${c.name} (${c.power}${c.sphere ? ' ' + c.sphere : ''})`) as HTMLButtonElement; b.disabled = hand.length >= 5; b.addEventListener('click', () => { hand.push(id); rerender(); }); return b; })));
    out.push(el('div', { class: 'row wrap' }, button('Clear hand', () => { open.hand = []; }, open, rerender), button('Fight', () => {
      const r = s.wonders.spireFight(hand);
      if (r.ok) {
        open.hand = [];
        return { ok: true, text: `${r.rounds?.map((x, i) => `${i + 1}: ${cardById(x.mine).name} vs ${cardById(x.theirs).name} (${x.result})`).join('; ')}. You ${r.outcome === 'win' ? 'win the floor' : r.outcome === 'lose' ? 'lose a heart' : 'draw; try again'}.` };
      }
      return r;
    }, open, rerender, hand.length !== 5)));
  }
  out.push(button('Leave the Spire (keep the spoils)', () => s.wonders.spireEnd(false), open, rerender), ...say(open));
  return el('div', {}, ...out);
}

/** Item 27: three eras and twelve turning points. */
export function sunderedPanel(s: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  const chosen = s.wonders.w.sundered.chosen;
  const blocks = ERAS.map((era) => el('div', {},
    el('h3', {}, `${era.name} (level ${era.minLevel})`),
    el('p', { class: 'dim small' }, era.text),
    ...TURNING_POINTS.filter((t) => t.era === era.id).map((t) => el('div', { class: 'small' },
      el('b', {}, t.title), ` ${t.text} `,
      ...t.choices.map((c) => button(`${chosen[t.id] === c.id ? '✓ ' : ''}${c.label}`, () => s.wonders.turn(t.id, c.id), open, rerender, !s.wonders.eraOpen(era.id) || chosen[t.id] === c.id))))));
  const notes = s.wonders.presentNotes();
  return el('div', {},
    el('p', { class: 'dim small' }, `Mirrin opens rifts to three eras from any town. Each trip takes ${SUNDERED.tripMinutes} minutes. What you do changes this branch of the present; changing your mind costs ${SUNDERED.paradoxCost} gold.`),
    ...blocks,
    el('h3', {}, 'The present as it is'),
    ...(notes.length ? notes.map((n) => el('p', { class: 'small' }, n)) : [el('p', { class: 'dim small' }, 'Unchanged.')]),
    ...say(open));
}

/** Item 28: the photograph album, commissions and the sketchbook. */
export function painterPanel(s: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  const p = s.wonders.w.painter;
  const met = content.enemies.filter((e) => !e.types.includes('mentor') && !e.types.includes('follower') && s.player.bestiary[e.id] !== undefined);
  const fam = s.wonders.familiesDone();
  return el('div', {},
    el('p', { class: 'dim small' }, 'Painter’s Eye. Take photographs wherever you are; commissions pay when the scene fits. Sketch any creature you have met: finish every creature (up to ' + PAINTER.familyCap + ') of a family for +' + PAINTER.familyBonus + '% damage.'),
    button('Take a photograph', () => s.wonders.photo(), open, rerender),
    el('h3', {}, 'Commissions'),
    ...COMMISSIONS.map((c) => el('div', { class: 'small' }, p.done.includes(c.id) ? el('span', { class: 'dim' }, `✓ ${c.name}`) : el('span', {}, el('b', {}, c.name), ` ${c.text} (${c.gold} gold)`))),
    el('h3', {}, `Sketchbook (${p.sketched.length} sketched; ${fam.length} families finished)`),
    el('div', { class: 'row wrap' }, ...met.filter((e) => !p.sketched.includes(e.id)).slice(0, 30).map((e) => button(`Sketch: ${e.name}`, () => s.wonders.sketch(e.id), open, rerender))),
    el('h3', {}, `Album (${p.photos.length})`),
    ...p.photos.slice(0, 12).map((ph) => el('div', { class: 'small' }, `Day ${ph.day}: ${ph.caption}${ph.commission ? ' ★' : ''}`)),
    ...say(open));
}
