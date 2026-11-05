import { content } from '../../data';
import { ALIGNED, DISHES, GODFORGE, HAMMER_STEPS, PET_TALENT, RELIC_RULES, TALENTS, TALKING_RELICS, TRAIT_TEXT } from '../../data/craft';
import { FUN_GAMES } from '../../data/fun';
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
const dim = (t: string): HTMLElement => el('p', { class: 'dim small' }, t);

/** Items 142-148: Talking Relics, awakening, rumors, pet talents, meals, the named legendaries and the Godforge. */
export function craftPanel(s: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  const k = s.craft;
  const c = k.k;
  const relics = section(`Talking Relics (${c.relics.carried.length}/${RELIC_RULES.carry} carried)`,
    dim('Ten relics with opinions. They bicker, and one that disapproves of how you fight goes silent and stops helping.'),
    ...TALKING_RELICS.map((r) => {
      const owned = c.relics.owned.includes(r.id);
      const carried = c.relics.carried.includes(r.id);
      return el('div', { class: 'row wrap small' }, el('b', {}, r.name), ` likes ${TRAIT_TEXT[r.likes]}, dislikes ${TRAIT_TEXT[r.dislikes]}. `, owned ? `${k.sulking(r.id) ? 'Sulking. ' : ''}mood ${c.relics.mood[r.id] ?? 0} ` : `Lies in ${content.zones.get(r.zone).name}. `,
        owned ? act(carried ? 'Put down' : 'Carry', () => k.carry(r.id, !carried), open, rerender) : act('Take it up', () => k.take(r.id), open, rerender));
    }));
  const alive = Object.values(s.player.equipment).filter((i) => i?.uniqueId && ALIGNED[i.uniqueId]);
  const awaken = section('Relic Awakening', dim('God-aligned living items grow when you fight in their god’s style.'),
    ...(alive.length ? alive.map((i) => el('p', { class: 'small' }, `${content.uniques.get(i!.uniqueId!).name}: ${ALIGNED[i!.uniqueId!]!.god}, ${ALIGNED[i!.uniqueId!]!.style}; ${i!.livingXp ?? 0} experience`)) : [dim('Wear a god-aligned living item (Hearth Ring, Hesha’s Last Kindness, the Hammer…).')]));
  const rumors = section('Tavern Rumors (Legend Rumors)', ...(k.rumors().length ? k.rumors().map((r) => el('p', { class: 'small' }, r.text)) : [dim('Rumors are heard in towns.')]));
  const talent = k.petTalent();
  const pets = section('Pet Talent', talent ? el('div', { class: 'row wrap small' }, `${k.petName()}: ${TALENTS[talent].name}. ${TALENTS[talent].text} `, act('Ask it', () => k.usePet(), open, rerender)) : dim(`Pets have talents (${Object.keys(PET_TALENT).length} of them). Bring one along.`));
  const meals = section(`Hearth Meals (${c.meals.count} cooked)`, dim('One meal a day, in a town. Companions have a favorite dish and a hated one; the party’s morale rises.'),
    ...s.party.recruited().map((m) => { const t = k.taste(m.id); return el('p', { class: 'small' }, `${content.companions.get(m.id).name}: loves ${DISHES.find((d) => d.id === t.favorite)!.name}, hates ${DISHES.find((d) => d.id === t.hated)!.name}`); }),
    el('div', { class: 'row wrap' }, ...DISHES.map((d) => act(`${d.name} (${d.costPerLevel * s.player.level})`, () => k.cook(d.id), open, rerender, !s.world.inTown()))));
  const legends = section('Named Legendaries',
    el('div', { class: 'row wrap small' }, `Thalor’s Unfinished Hammer: step ${c.hammer} of ${HAMMER_STEPS.length}. ${HAMMER_STEPS[c.hammer]?.text ?? 'Finished.'} `, act('Work the forge', () => k.forgeHammer(), open, rerender, c.hammer >= HAMMER_STEPS.length)),
    el('div', { class: 'row wrap small' }, `Mapless Compass: `, act('Read the needle', () => k.compass(), open, rerender)),
    el('p', { class: 'small' }, `Lantern of a Thousand Wicks: ${c.wicks.length} wicks.`));
  const forge = section('Godforge Relics', dim('Gear forged from slain gods. Each carries the god’s last words.'),
    ...GODFORGE.map((g) => el('div', { class: 'row wrap small' }, el('b', {}, g.name), ' ', c.forged.includes(g.god) ? '✓' : act('Forge', () => k.forge(g.god), open, rerender, !k.forgeable(g.god)))));
  const fun = s.fun.f;
  const a = fun.active;
  const games = section('Games & Festivals (152-156)',
    dim(`Festival days change the rules: the Longest Quiet lets nobody die, Upside Day makes foes apologize. Old Billy has ${fun.billy} scars.`),
    ...(a
      ? [el('p', { class: 'small' }, `${s.fun.game(a.id)!.name}, round ${a.at + 1} of ${a.rounds.length} (${a.score} points): ${a.rounds[a.at]!.text}`),
        el('div', { class: 'row wrap' }, ...a.rounds[a.at]!.opts.map((o, i) => act(o.l, () => s.fun.pick(i), open, rerender)), act('Give up', () => { s.fun.abandon(); }, open, rerender))]
      : FUN_GAMES.map((g) => el('div', { class: 'row wrap small' }, el('b', {}, `${g.name} (${g.no})`), ` ${g.blurb} Best ${fun.best[g.id] ?? 0}. `, act('Play', () => s.fun.start(g.id), open, rerender)))));
  return el('div', {}, relics, awaken, rumors, pets, meals, legends, forge, games, ...(open.outcome ? [el('p', { class: 'small' }, open.outcome)] : []));
}
