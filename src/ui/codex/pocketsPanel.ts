import { BELLS, BOOKS, CANALS, CINDER, CLANS, GALLERY, GODLESS, HOURGLASS, LANTERN, LIBRARY, MASQUE, OSSUARY, PAPER, STEPPE, THROAT, WICK, WILDS } from '../../data/pockets';
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
const section = (title: string, ...body: (HTMLElement | string)[]): HTMLElement => el('details', { open: '' }, el('summary', {}, title), ...body);
const dim = (t: string): HTMLElement => el('p', { class: 'dim small' }, t);

/** Items 99 to 112: the Godless Wilds, the pocket regions and the seven dungeons’ rules. Each is worked while you stand in the place. */
export function pocketsPanel(s: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  const k = s.pockets;
  const p = k.p;
  const at = k.here();
  const go = (label: string, run: () => R | void, where: string, disabled = false) => act(label, run, open, rerender, at !== where || disabled);

  const lantern = section(`Lanternmarch (lamp ${Math.floor(p.oil)}/${LANTERN.maxOil}${p.hunted ? ', Wick-Eaters hunting you' : ''})`,
    dim('Always dusk; lamp-oil is the coin. The lamp burns an hour at a time. When it runs dry, the Wick-Eaters come.'),
    el('div', { class: 'row wrap' }, go(`Buy 4 oil (${k.oilPrice() * 4})`, () => k.buyOil(4), 'lanternmarch'), act('Face the Wick-Eaters', () => k.faceWicks(), open, rerender, !p.hunted)));
  const ossuary = section(`The Ossuary Coast (${p.marrow} marrow, ${p.wrights}/${OSSUARY.wrightMax} bone charms)`,
    dim('Whale marrow is a minable material; the bone-wrights turn it into charms of vigor.'),
    el('div', { class: 'row wrap' }, go('Mine marrow', () => k.mineMarrow(), 'ossuary-coast'), go('Sell it all', () => k.sellMarrow(), 'ossuary-coast', !p.marrow), go(`Commission a charm (${OSSUARY.wrightCost})`, () => k.wright(), 'ossuary-coast')));
  const steppe = section('The Weeping Steppe (mounted combat only)',
    dim(`The clans move every ${STEPPE.moveDays} days. Sit at a fire with a guest-gift (${k.giftCost()} gold); three visits earn the clan’s boon.`),
    ...CLANS.map((c, i) => el('div', { class: 'row wrap small' }, el('b', {}, c.name), ` camped at ${k.camp(i)}. ${c.text} Welcome ${p.hosp[c.id] ?? 0}/${STEPPE.hospitalityMax} `, go('Sit at the fire', () => k.host(c.id), 'weeping-steppe'))));
  const up = k.bridges();
  const canals = section(`The Verdigris Canals (${up.filter((x) => !x).length} of ${CANALS.bridges} bridges lowered; the Exchange ${k.connected() ? 'is reachable' : 'is cut off'})`,
    dim('Raise and lower bridges to join the Gate to the Copper Exchange. Each tide the keepers raise three at random.'),
    el('div', { class: 'row wrap small' }, ...up.map((u, i) => act(`${i + 1}${u ? '↑' : '↓'}`, () => k.toggleBridge(i), open, rerender, at !== 'verdigris-canals'))),
    go('Cross to the Exchange', () => k.crossToExchange(), 'verdigris-canals'));
  const cinder = section(`Cinderhollow (${k.layout() === 'burning' ? 'burning' : 'regrown'}; ash ${p.ash}/${CINDER.target}, emberbloom ${p.bloom}/${CINDER.target})`,
    dim('By day the forest burns; by night it regrows. Gather ash in the fire and emberbloom in the green.'),
    el('div', { class: 'row wrap' }, go('Rake ash', () => k.gatherAsh(), 'cinderhollow-day'), go('Pick emberbloom', () => k.gatherBloom(), 'cinderhollow-night')));
  const library = section(`The Inverted Library (${p.read.length}/${BOOKS.length} read; the floor is ${p.flipped ? 'overhead' : 'below'})`,
    dim('Flip gravity to reach the other shelves. Each book is lore, and a margin note toward the cipher.'),
    el('div', { class: 'row wrap' }, go('Flip gravity', () => k.flipGravity(), 'inverted-library')),
    ...BOOKS.map((b) => el('div', { class: 'row wrap small' }, `${b.title} (${b.side}) `, p.read.includes(b.id) ? '✓' : act('Read', () => k.readBook(b.id), open, rerender, !k.canRead(b.id)))));
  const wilds = section(`The Godless Wilds (${p.wilds.length}/${WILDS.length} maps; protection ${k.protection()})`,
    dim(`Outside the Wheel. Blessings, Sigils and Covenant Chains are silent. The cold costs HP with each step unless Wayfarer’s Arts, Relic Tools and a full kit (${GODLESS.gearPieces}+ pieces) hold it off.`),
    el('p', { class: 'small' }, k.inWilds() ? 'You stand in the Wilds. No god is listening.' : 'You are not in the Wilds.'));
  const dungeons = section('Dungeon rules (106-112)',
    el('div', { class: 'small' }, el('b', {}, `The Bellhouse: noise ${p.bells.noise}/${BELLS.wakeAt}, ${p.bells.paths}/${BELLS.paths} paths `), go('Ring a bell', () => k.ring(), 'bellhouse'), go('Hush the bells', () => k.hush(), 'bellhouse')),
    el('div', { class: 'small' }, el('b', {}, `Saltmother’s Throat: the breath is ${k.breath()}, ${p.throat.wades}/${THROAT.wades} deep `), go('Wade', () => k.wade(), 'saltmothers-throat')),
    el('div', { class: 'small' }, el('b', {}, `The Paper Labyrinth: ${p.paper.prog} burned, ${p.paper.shortcuts} drawn (${PAPER.need} opens it) `), go('Burn a wall', () => k.burnWall(), 'paper-labyrinth'), go('Draw a shortcut', () => k.drawShortcut(), 'paper-labyrinth')),
    el('div', { class: 'small' }, el('b', {}, `The Hourglass Vault: rooms ${k.hourglass().map((b) => (b ? '▲' : '▽')).join(' ')} `), ...Array.from({ length: HOURGLASS.rooms }, (_, i) => go(`Turn ${i + 1}`, () => k.flipRoom(i), 'hourglass-vault'))),
    el('div', { class: 'small' }, el('b', {}, `The Masque Catacombs: room ${p.masque.room + 1}/${MASQUE.rooms}, ${MASQUE.ghosts[k.ghostKind(p.masque.room)] ?? 'none'} sees through every face but ${MASQUE.masks[k.hidingMask(p.masque.room)] ?? ''}; wearing ${MASQUE.masks[p.masque.mask]} `), ...MASQUE.masks.map((m, i) => go(m, () => k.wearMask(i), 'masque-catacombs')), go('Pass the ghost', () => k.passGhost(), 'masque-catacombs')),
    el('div', { class: 'small' }, el('b', {}, `The Gallery: room ${p.gallery.room + 1}/${GALLERY.rooms} `), go('Look closely', () => { const d = k.inspect(); return { ok: true, text: `Still in doubt: frames ${d.map((n) => n + 1).join(', ')}.` }; }, 'gallery-of-stolen-faces'), ...Array.from({ length: GALLERY.frames }, (_, i) => go(`Frame ${i + 1}`, () => k.chooseFrame(i), 'gallery-of-stolen-faces'))),
    el('div', { class: 'small' }, el('b', {}, `Old Wick’s Chapel: ${p.wick.wax}/${WICK.hours} hours of wax `), go('Light a new candle', () => k.relight(), 'old-wicks-chapel'), go('Snuff the Candle', () => k.faceCandle(), 'old-wicks-chapel')));
  void LIBRARY;
  return el('div', {}, lantern, ossuary, steppe, canals, cinder, library, wilds, dungeons, ...(open.outcome ? [el('p', { class: 'small' }, open.outcome)] : []));
}
