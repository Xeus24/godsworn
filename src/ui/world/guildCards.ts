import { ADVENTURES, GUILD, RANKS, RIVALS, TABLE_PLAYERS, TANKARDS } from '../../data/guild';
import type { GameSession } from '../../engine/state/gameState';
import { el } from '../screen';

type R = { ok: boolean; reason?: string; text?: string };
type Say = (r: R) => void;

const btn = (label: string, run: () => void, disabled = false): HTMLButtonElement => {
  const b = el('button', { type: 'button' }, label) as HTMLButtonElement;
  b.disabled = disabled;
  b.addEventListener('click', run);
  return b;
};

/** The Adventurers' Guild board of a town: ranks, contracts and rival parties (item 226). */
export function guildBody(s: GameSession, town: string, say: Say): HTMLElement[] {
  const g = s.guild;
  const t = g.t;
  const rank = g.rank();
  const next = RANKS[g.rankIndex() + 1];
  const out: HTMLElement[] = [el('p', { class: 'small' }, `${rank.name} rank, ${t.points} points${next ? ` (${next.name} at ${next.points})` : ''}. ${rank.perk}`)];
  if (t.active) {
    out.push(el('div', { class: 'row wrap small' }, el('b', {}, t.active.name), ` ${t.active.waves.length} fights, ${t.active.gold} gold, ${t.active.points} points `, btn('Begin', () => say(g.fight())), btn('Return it', () => say(g.abandon()))));
  } else {
    for (const c of g.board(town)) out.push(el('div', { class: 'row wrap small' }, el('b', {}, c.name), ` ${c.waves.length} fights, ${c.gold} gold, ${c.points} points `, btn('Take it', () => say(g.take(c.id)))));
    if (!g.board(town).length) out.push(el('p', { class: 'dim small' }, 'The board is bare today.'));
  }
  out.push(el('details', {}, el('summary', {}, `Rival parties (${t.rivals.length}/${RIVALS.length} beaten)`),
    ...RIVALS.map((r) => el('div', { class: 'row wrap small' }, el('b', {}, r.name), ` ${r.text} `, t.rivals.includes(r.id) ? 'Beaten' : btn('Challenge', () => say(g.challenge(r.id)), g.rankIndex() < GUILD.rivalRank))),
    el('p', { class: 'dim small' }, 'Standings: ' + g.standings().map((x) => `${x.you ? '★ ' : ''}${x.name} ${x.points}`).join(' · '))));
  return out;
}

/** Tales & Tankards, the tavern game (item 227). */
export function talesBody(s: GameSession, say: Say, rerender: () => void): HTMLElement[] {
  const g = s.guild;
  const run = g.t.tales.run;
  if (run) {
    const scene = g.scene();
    return [
      ...run.log.map((l) => el('p', { class: 'small dim' }, l)),
      ...(scene ? [el('p', { class: 'small' }, scene.text), el('div', { class: 'row wrap' }, ...scene.options.map((o, i) => btn(`${o.label} (${o.stat}, DC ${o.dc})`, () => { say(g.choose(i)); rerender(); })))] : []),
      btn('Leave the table', () => say(g.leave())),
    ];
  }
  const picked = new Set<string>();
  const rows = ADVENTURES.map((a) => {
    const best = g.t.tales.best[a.id];
    return el('div', { class: 'row wrap small' }, el('b', {}, a.name), ` ${a.blurb} `, best === undefined ? '' : `Best ${best}/${a.scenes.length}. `,
      btn(`Play (${g.stake()}g)`, () => say(g.sit(a.id, [...picked])), !g.unlocked(a) || g.playedToday(a.id)));
  });
  const seats = el('div', { class: 'row wrap small' }, 'Seat up to two: ', ...TABLE_PLAYERS.map((p) => {
    const l = el('label', { title: p.text }, el('input', { type: 'checkbox' }), ` ${p.name} (+${p.bonus} ${p.stat}) `);
    l.querySelector('input')?.addEventListener('change', (e) => ((e.target as HTMLInputElement).checked ? picked.add(p.id) : picked.delete(p.id)));
    return l;
  }));
  return [seats, ...rows, el('p', { class: 'dim small' }, `A tale pays on ${TANKARDS.passScenes}+ scenes won; each runs once a day.`)];
}
