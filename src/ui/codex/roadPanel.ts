import { content } from '../../data';
import { BALLS, CARAVAN, INNS, OUTFITS, SONGS, WANTED, WEATHER_MAGIC } from '../../data/road';
import type { GameSession } from '../../engine/state/gameState';
import { el } from '../screen';
import type { RealmView } from './realmPanel';

type R = { ok: boolean; reason?: string; text?: string };

function act(label: string, run: () => R | void, open: RealmView, rerender: () => void, disabled = false): HTMLButtonElement {
  const b = el('button', { type: 'button' }, label) as HTMLButtonElement;
  b.disabled = disabled;
  b.addEventListener('click', () => {
    const r = run();
    open.outcome = r ? (r.ok ? (r.text ?? '') : (r.reason ?? '')) : '';
    rerender();
  });
  return b;
}
const section = (title: string, ...body: (HTMLElement | string)[]): HTMLElement => el('details', {}, el('summary', {}, title), ...body);

/** Items 40, 44, 45, 47, 49 and 50: the road, the inns, the bards, the sky, the watch and the ball. */
export function roadPanel(s: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  const o = s.road.o;
  const town = s.world.inTown();
  const lvl = s.road.wantedLevel();
  const wanted = section(`Wanted ${'★'.repeat(lvl) || '(clean)'}`,
    el('p', { class: 'dim small' }, 'Crimes raise your heat; heat cools with quiet days. Hunters find Wanted heroes on the road: face them in a town or pay the fine. Town suspicion: ' + s.road.townSuspicion() + '/100.'),
    ...(o.hunter ? [el('p', { class: 'small' }, `A level ${o.hunter.level} bounty hunter is on your trail.`), act('Face the hunter', () => s.road.faceHunter(), open, rerender, !town)] : []),
    act(`Pay the fine (${s.road.fine()} gold)`, () => s.road.payFine(), open, rerender, lvl < 1 || !town),
    el('span', { class: 'dim small' }, ` Heat ${o.heat}; ${WANTED.maxLevel} stars is Notorious.`));
  const ball = section('Disguises and Masquerade Balls',
    el('p', { class: 'dim small' }, 'The same outfit lowers town suspicion and helps at balls that want it. A ball is four stages; each failure raises suspicion, and too much unmasks you.'),
    el('div', { class: 'row wrap' }, ...OUTFITS.map((x) => act(`${o.outfit === x.id ? '✓ ' : ''}${x.name} (${x.cost})`, () => s.road.buyOutfit(x.id), open, rerender, !town))),
    ...BALLS.map((b) => el('div', { class: 'row wrap small' }, el('b', {}, b.name), ` ${content.towns.get(b.town).name}, wants ${OUTFITS.find((x) => x.id === b.dress)?.name}. `, act('Attend', () => s.road.attendBall(b.id), open, rerender, town !== b.town || !s.road.ballsOpen(b.town).some((x) => x.id === b.id)))));
  const c = o.caravan;
  const caravan = section(`Pilgrim Caravans (${o.caravans} delivered)`,
    el('p', { class: 'dim small' }, `Escort a caravan between towns (level ${CARAVAN.minLevel}+). Each day on the road brings an event; keep it intact to be paid in full.`),
    ...(c ? [el('p', { class: 'small' }, `To ${content.towns.get(c.to).name}: leg ${c.done}/${c.legs}, ${c.hp}% intact.`), ...c.log.slice(-4).map((x) => el('p', { class: 'dim small' }, x)), act('March a day', () => s.road.march(), open, rerender)] : [el('div', { class: 'row wrap' }, ...s.road.caravanTowns().filter((t) => t.id !== town).map((t) => act(t.name, () => s.road.startCaravan(t.id), open, rerender, !town)))]));
  const weather = section('Weather Magic',
    el('p', { class: 'dim small' }, `Once a day, change the sky over this region for ${WEATHER_MAGIC.hours} hours (${s.road.weatherCost()} gold; level ${WEATHER_MAGIC.minLevel}+). Now: ${content.weather.find(s.world.weatherNow())?.name ?? s.world.weatherNow()}.`),
    el('div', { class: 'row wrap' }, ...WEATHER_MAGIC.ids.map((id) => act(content.weather.find(id)?.name ?? id, () => s.road.castWeather(id), open, rerender))));
  const ghost = town ? s.road.ghostOf(town) : undefined;
  const inn = town ? s.road.inn(town) : undefined;
  const inns = section(`Haunted Inns (${content.towns.all().filter((t) => o.inns[t.id]?.rest).length} of ${content.towns.all().length} at rest)`,
    el('p', { class: 'dim small' }, `Every town’s inn has a ghost. Listen one evening at a time for three clues, then answer. Rest pays gold and Morrath’s favor (${INNS.favor}).`),
    !town || !ghost || !inn ? el('p', { class: 'dim small' }, 'Go to a town.') : inn.rest ? el('p', { class: 'small' }, `${ghost.name} is at rest.`) : el('div', {},
      el('p', { class: 'small' }, `${ghost.name} walks this inn. Clues heard: ${inn.clues.length}/3.`),
      act('Listen this evening', () => s.road.listen(), open, rerender),
      ...(inn.clues.length >= 3 ? [el('div', { class: 'row wrap' }, ...ghost.grievance.options.map((t, i) => act(t, () => s.road.resolve(i), open, rerender)))] : [])));
  const songs = section(`Bardic Legends (${o.songs.length} of ${SONGS.length})`,
    el('p', { class: 'dim small' }, 'Bards sing of what you have done. Songs lift your Charisma and bargaining, and change what people say to you.'),
    ...s.road.songs().map((x) => el('p', { class: 'small' }, el('b', {}, x.name), ` ${x.verse}`)),
    town && s.road.reaction(town) ? el('p', { class: 'small' }, `In ${content.towns.get(town).name}, someone says: ${s.road.reaction(town)}`) : '');
  return el('div', {}, wanted, ball, caravan, weather, inns, songs, ...(open.outcome ? [el('p', { class: 'small' }, open.outcome)] : []));
}
