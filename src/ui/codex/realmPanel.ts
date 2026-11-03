import { content } from '../../data';
import { GRUDGE_SLOTS } from '../../data/realm/grudge';
import { fullName, grudgeThreat, hierarchy, rankTitle } from '../../engine/realm/grudge';
import type { GameSession } from '../../engine/state/gameState';
import { el } from '../screen';

export type Section = 'grudge';
const SECTIONS: [Section, string][] = [['grudge', 'Grudgebound']];

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
  const body = open.section === 'grudge' ? grudgePanel(session) : el('p', {}, '');
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
