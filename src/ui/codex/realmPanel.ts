import { content } from '../../data';
import { GRUDGE_SLOTS } from '../../data/realm/grudge';
import { FESTIVALS, SEASONS, SEASON_DAYS, YEAR_DAYS } from '../../data/realm/wheel';
import { dateOf, festivalOn, formatDate, nextFestival, seasonGods } from '../../engine/realm/wheel';
import { fullName, grudgeThreat, hierarchy, rankTitle } from '../../engine/realm/grudge';
import type { GameSession } from '../../engine/state/gameState';
import { el } from '../screen';

export type Section = 'grudge' | 'wheel';
const SECTIONS: [Section, string][] = [['grudge', 'Grudgebound'], ['wheel', 'The Wheel']];

/** The living world (Codex > Realm): what the realm is doing while you are away. Each section of the Innovation Pack adds a tab here. */
export function realmPanel(session: GameSession, rerender: () => void, open: { section: Section }): HTMLElement {
  const tabs = el('div', { class: 'row' }, ...SECTIONS.map(([id, label]) => {
    const b = el('button', { class: open.section === id ? 'active' : '', type: 'button' }, label);
    b.addEventListener('click', () => {
      open.section = id;
      rerender();
    });
    return b;
  }));
  const body = open.section === 'grudge' ? grudgePanel(session) : wheelPanel(session);
  return el('section', { class: 'panel' }, el('h2', {}, 'The Realm'), tabs, body);
}

function grudgePanel(session: GameSession): HTMLElement {
  const st = session.state.realm.grudge;
  const zones = [...new Set(Object.values(st.entries).map((g) => g.zone))].sort((a, b) => (content.zones.find(a)?.order ?? 0) - (content.zones.find(b)?.order ?? 0));
  const blocks = zones.map((zone) => {
    const live = hierarchy(st, zone);
    const dead = Object.values(st.entries).filter((g) => g.zone === zone && g.slain !== undefined);
    const rows = Array.from({ length: GRUDGE_SLOTS }, (_, i) => {
      const g = live.find((x) => x.rank === i + 1);
      if (!g) return el('div', { class: 'dim small' }, `${i + 1}. ${rankTitle(i + 1)}: empty`);
      const def = content.enemies.find(g.enemyId);
      return el(
        'div',
        { class: 'small' },
        `${i + 1}. ${rankTitle(i + 1)}: `,
        el('strong', {}, fullName(g)),
        ` (${def?.name ?? g.enemyId}, ${'✦'.repeat(Math.min(g.scars, 8)) || 'unscarred'}, +${grudgeThreat(g)}% HP and damage)`,
        g.cause === 'upstart' ? ' · rose on its own' : g.cause === 'beat' ? ' · beat you' : ' · you ran',
      );
    });
    const graves = dead.map((g) => el('div', { class: 'dim small' }, `† ${fullName(g)}: ${g.slainBy === 'hero' ? 'put down by you' : 'killed by ' + (st.entries[g.slainBy ?? '']?.name ?? 'a rival')}`));
    return el('div', {}, el('h3', {}, content.zones.get(zone).name), ...rows, ...graves);
  });
  const log = st.log.slice(0, 12).map((l) => el('li', { class: 'small' }, `Day ${l.day}, ${content.zones.find(l.zone)?.name ?? l.zone}: ${l.text}`));
  return el(
    'div',
    {},
    el('p', { class: 'dim small' }, 'Foes that beat you, or that you ran from, are given names by the Nameless One. They climb a pecking order of ten in their region, scheme while you are away, and come back for you. Killing one pays a bounty.'),
    el('p', { class: 'small' }, `Put down so far: ${st.slain}.`),
    ...(blocks.length ? blocks : [el('p', { class: 'dim' }, 'None yet. Lose a fight on the road, or run from one, and the whisper will find someone.')]),
    ...(log.length ? [el('h3', {}, 'Word on the road'), el('ul', {}, ...log)] : []),
  );
}

const effectText = (e: { xp?: number; encounters?: number; discount?: number; chaos?: boolean; game?: { id: string; mult: number } }): string =>
  [
    e.xp ? `+${e.xp}% XP` : '',
    e.encounters === 0 ? 'no random fights' : e.encounters && e.encounters > 1 ? 'more fights on the road' : '',
    e.discount ? `${e.discount}% off every shop` : '',
    e.chaos ? 'prices run wild' : '',
    e.game ? `${e.game.id} pays x${e.game.mult}` : '',
  ].filter(Boolean).join(' · ') || 'a quiet feast';

function wheelPanel(session: GameSession): HTMLElement {
  const day = session.state.clock.day;
  const d = dateOf(day);
  const today = festivalOn(day);
  const next = nextFestival(day);
  const gods = (season: number): string => seasonGods(season).map((g) => content.gods.get(g).name).join(', ');
  const rows = FESTIVALS.map((f) => {
    const ofYear = f.season * SEASON_DAYS + (f.day - 1);
    const away = (ofYear - d.dayOfYear + YEAR_DAYS) % YEAR_DAYS;
    return el(
      'div',
      { class: 'small' },
      el('strong', {}, `${f.day} ${SEASONS[f.season]?.name}: ${f.name}`),
      ` (${content.gods.get(f.god).name}${f.between ? ', Between-Days' : ''}, ${content.towns.get(f.town).name}) · ${away === 0 ? 'today' : `in ${away} day${away === 1 ? '' : 's'}`}`,
      el('div', { class: 'dim' }, `${f.blurb} Today it brings: ${effectText(f.effect)}.`),
    );
  });
  return el(
    'div',
    {},
    el('p', {}, el('strong', {}, formatDate(day)), ` · ${SEASONS[d.season]?.blurb ?? ''}`),
    el('p', { class: 'small' }, `The season belongs to ${gods(d.season)}. Mirrin and Vex stand outside the Wheel and keep the Between-Days.`),
    today
      ? el('p', {}, el('strong', {}, `Today: ${today.name}`), ` in ${content.towns.get(today.town).name}. ${effectText(today.effect)}. Its host offers a quest and a stall opens.`)
      : el('p', {}, `Next: ${next.festival.name} in ${content.towns.get(next.festival.town).name}, in ${next.inDays} day${next.inDays === 1 ? '' : 's'}.`),
    el('h3', {}, 'The fourteen festivals'),
    ...rows,
  );
}
