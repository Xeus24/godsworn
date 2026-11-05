import { content } from '../../data';
import { ERAS } from '../../data/realm/chronicle';
import { eraName } from '../../engine/realm/chronicle';
import { SOULBOUND } from '../../data/soulbound';
import { movesKnown } from '../../engine/realm/ranch';
import { BUILDINGS, EMBERFALL, VILLAGERS } from '../../data/emberfall';
import { arriving, defense, housing, levelOf, nextCost, population, ranchPens } from '../../engine/realm/village';
import { CLUES, DIALS, OBSERVATORY } from '../../data/realm/observatory';
import { partsFor } from '../../data/trophies';
import { ECHOES } from '../../data/realm/echoes';
import { GRUDGE_SLOTS } from '../../data/realm/grudge';
import { FESTIVALS, SEASONS, SEASON_DAYS, YEAR_DAYS } from '../../data/realm/wheel';
import { dateOf, festivalOn, formatDate, nextFestival, seasonGods } from '../../engine/realm/wheel';
import { fullName, grudgeThreat, hierarchy, rankTitle } from '../../engine/realm/grudge';
import type { GameSession } from '../../engine/state/gameState';
import { el } from '../screen';
import { faithPanel } from './faithPanel';
import { landPanel } from './landPanel';
import { roadPanel } from './roadPanel';
import { trialsPanel } from './trialsPanel';
import { gamesPanel } from './gamesPanel';
import { oathsPanel } from './oathsPanel';
import { fellowshipPanel } from './fellowshipPanel';
import { societyPanel } from './societyPanel';
import { worldlyPanel } from './worldlyPanel';
import { civicPanel } from './civicPanel';
import { pocketsPanel } from './pocketsPanel';
import { foesPanel } from './foesPanel';
import { fatesPanel, omensPanel, seasonsPanel, toolsPanel } from './pilgrimagePanel';
import { cardSpirePanel, painterPanel, sunderedPanel, watersPanel } from './wondersPanel';

export type Section = 'grudge' | 'wheel' | 'fortunes' | 'echoes' | 'chronicle' | 'ranch' | 'trophies' | 'observatory' | 'emberfall' | 'waters' | 'cardspire' | 'sundered' | 'painter' | 'seasons' | 'omens' | 'tools' | 'fates' | 'faith' | 'land' | 'road' | 'trials' | 'games' | 'oaths' | 'fellowship' | 'society' | 'worldly' | 'civic' | 'pockets' | 'foes';
export interface RealmView {
  section: Section;
  echo?: string;
  outcome?: string;
  dials?: Record<string, string>;
  hand?: string[];
  god?: string;
  tilts?: string[];
  cell?: number;
  vowCond?: string;
  rumor?: string;
  civicFaction?: string;
  vowReward?: string;
  sparkA?: string;
  sparkB?: string;
  exam?: { god: string; attempt: number; answers: number[] };
}
const SECTIONS: [Section, string][] = [['grudge', 'Grudgebound'], ['wheel', 'The Wheel'], ['fortunes', 'Fortunes'], ['echoes', 'Echoes'], ['chronicle', 'Chronicle'], ['ranch', 'Ranch'], ['trophies', 'Trophies'], ['observatory', 'Observatory'], ['emberfall', 'Emberfall'], ['waters', 'Waters'], ['cardspire', 'Spire of Cards'], ['sundered', 'Sundered Hours'], ['painter', 'Painter’s Eye'], ['seasons', 'Divine Seasons'], ['omens', 'Omens'], ['tools', 'Chronicler’s Tools'], ['fates', 'Fates'], ['faith', 'Faith'], ['land', 'Relics & Land'], ['road', 'The Road'], ['trials', 'Trials & Wonders'], ['games', 'Games & Testament'], ['oaths', 'Oaths'], ['fellowship', 'Gods & Party'], ['society', 'Society'], ['worldly', 'The Realm at Large'], ['civic', 'Crown & Law'], ['pockets', 'Pockets & Wilds'], ['foes', 'Great Foes']];

/** The living world (Codex > Realm): what the realm is doing while you are away. Each section of the Innovation Pack adds a tab here. */
export function realmPanel(session: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  const tabs = el('div', { class: 'row' }, ...SECTIONS.map(([id, label]) => {
    const b = el('button', { class: open.section === id ? 'active' : '', type: 'button' }, label);
    b.addEventListener('click', () => {
      open.section = id;
      rerender();
    });
    return b;
  }));
  const body = open.section === 'grudge' ? grudgePanel(session) : open.section === 'wheel' ? wheelPanel(session) : open.section === 'fortunes' ? fortunesPanel(session) : open.section === 'echoes' ? echoesPanel(session, rerender, open) : open.section === 'ranch' ? ranchPanel(session, rerender) : open.section === 'trophies' ? trophyPanel(session, rerender, open) : open.section === 'observatory' ? observatoryPanel(session, rerender, open) : open.section === 'emberfall' ? emberfallPanel(session, rerender, open) : open.section === 'waters' ? watersPanel(session, rerender, open) : open.section === 'cardspire' ? cardSpirePanel(session, rerender, open) : open.section === 'sundered' ? sunderedPanel(session, rerender, open) : open.section === 'painter' ? painterPanel(session, rerender, open) : open.section === 'seasons' ? seasonsPanel(session) : open.section === 'omens' ? omensPanel(session, rerender, open) : open.section === 'tools' ? toolsPanel(session, rerender, open) : open.section === 'fates' ? fatesPanel(session) : open.section === 'faith' ? faithPanel(session, rerender, open) : open.section === 'land' ? landPanel(session, rerender, open) : open.section === 'road' ? roadPanel(session, rerender, open) : open.section === 'trials' ? trialsPanel(session, rerender, open) : open.section === 'games' ? gamesPanel(session, rerender, open) : open.section === 'oaths' ? oathsPanel(session, rerender, open) : open.section === 'fellowship' ? fellowshipPanel(session, rerender, open) : open.section === 'society' ? societyPanel(session, rerender, open) : open.section === 'worldly' ? worldlyPanel(session, rerender, open) : open.section === 'civic' ? civicPanel(session, rerender, open) : open.section === 'pockets' ? pocketsPanel(session, rerender, open) : open.section === 'foes' ? foesPanel(session, rerender, open) : chroniclePanel(session, rerender);
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

function fortunesPanel(session: GameSession): HTMLElement {
  const rows = content.towns.all().map((t) => {
    const f = session.realm.fortune(t.id);
    const bar = el('div', { class: 'bar thin hp' }, el('div', { class: 'bar-fill', style: `width:${Math.round(f.prosperity)}%` }));
    return el('div', { class: 'small' }, el('strong', {}, t.name), ` · ${f.tier.name} · ${Math.round(f.prosperity)}/100${f.raids ? ` · raided ${f.raids}×` : ''}`, bar);
  });
  const log = session.state.realm.fortunes.log.slice(0, 12).map((l) => el('li', { class: 'small' }, `Day ${l.day}: ${l.text}`));
  return el(
    'div',
    {},
    el('p', { class: 'dim small' }, 'Every town has a prosperity. Quests you finish for it, dungeons cleared nearby, investments and gold you give lift it. The Grudgebound of its region raid it. A town that falls closes its shops and inn until it is rebuilt.'),
    ...rows,
    ...(log.length ? [el('h3', {}, 'News'), el('ul', {}, ...log)] : []),
  );
}

function echoesPanel(session: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  const st = session.state.realm.echoes;
  const found = ECHOES.filter((e) => st.found[e.id] !== undefined);
  const chosen = ECHOES.find((e) => e.id === open.echo && st.found[e.id] !== undefined);
  const list = found.map((e) => {
    const b = el('button', { type: 'button', class: chosen?.id === e.id ? 'active' : '' }, `${e.name} (${content.zones.get(e.zone).name})`);
    b.addEventListener('click', () => {
      open.echo = e.id;
      delete open.outcome;
      rerender();
    });
    return b;
  });
  let scene: HTMLElement | undefined;
  if (chosen) {
    const act = (c: 'a' | 'b' | 'talk'): void => {
      const r = session.realm.replay(chosen.id, c);
      open.outcome = r.text + (r.xp ? ` (+${r.xp} XP for hearing them out)` : '');
      rerender();
    };
    const btn = (label: string, c: 'a' | 'b' | 'talk'): HTMLButtonElement => {
      const b = el('button', { type: 'button' }, label);
      b.addEventListener('click', () => act(c));
      return b;
    };
    scene = el(
      'div',
      {},
      el('h3', {}, `${chosen.name}, ${chosen.role}`),
      ...chosen.beats.map((t) => el('p', { class: 'small' }, t)),
      el('p', { class: 'small' }, el('strong', {}, chosen.kind === 'warning' ? 'A warning: ' : chosen.kind === 'secret' ? 'A secret: ' : 'A hint: '), chosen.hint),
      el('p', {}, chosen.replay.ask),
      el('div', { class: 'row' }, btn(chosen.replay.a[0], 'a'), btn(chosen.replay.b[0], 'b'), ...(chosen.talk ? [btn(chosen.talk[0], 'talk')] : [])),
      ...(open.outcome ? [el('p', { class: 'small' }, open.outcome)] : []),
    );
  }
  const mine = [...(session.state.legacy.echoes ?? []), ...st.deaths];
  return el(
    'div',
    {},
    el('p', { class: 'dim small' }, `Godsworn who did not finish the road leave their last moments where they fell. Find them in the world (${found.length} of ${ECHOES.length}). In the Hollow Barrows the dead can be spoken to. Your own defeats become echoes in New Game+.`),
    ...(list.length ? [el('div', { class: 'row' }, ...list)] : [el('p', { class: 'dim' }, 'None found yet. They look like lore pages on the map, with a name instead of a title.')]),
    ...(scene ? [scene] : []),
    ...(mine.length ? [el('h3', {}, 'Your own'), ...mine.map((d) => el('p', { class: 'small dim' }, `${d.name}, level ${d.level}, fell to ${d.by} in ${content.zones.find(d.zone)?.name ?? d.zone}.`))] : []),
  );
}

function chroniclePanel(session: GameSession, rerender: () => void): HTMLElement {
  const ch = session.realm.chronicle;
  const known = ch.events.filter((e) => ch.known[e.id] !== undefined).length;
  const takeBtn = (id: string): HTMLButtonElement => {
    const b = el('button', { type: 'button' }, 'Take it');
    b.addEventListener('click', () => {
      session.realm.takeCommission(id);
      rerender();
    });
    return b;
  };
  const active = ch.commissions.map((c) => {
    const e = ch.events.find((x) => x.id === c.event);
    return el('div', { class: 'small' }, el('strong', {}, e?.title ?? c.event), ` · ${c.visited ? 'ruin seen' : `find the ruin in ${content.zones.find(e?.zone ?? '')?.name ?? ''}`} · ${c.slain}/${c.need} foes put down in the region`);
  });
  const offers = session.realm.commissionsOffered().map((o) => el('div', { class: 'party-gear-row' }, el('span', { class: 'small' }, `${o.name} (${content.zones.find(o.event.zone)?.name ?? ''}: see the ruin, put down ${o.need})`), takeBtn(o.event.id)));
  const eras = ERAS.map((era, i) => {
    const events = ch.events.filter((e) => e.era === i);
    return el(
      'div',
      {},
      el('h3', {}, `${eraName(ch, i)} · ${era.blurb}`),
      ...events.map((e) => {
        const k = ch.known[e.id];
        return k === 2
          ? el('p', { class: 'small' }, el('strong', {}, `${e.title} (${Math.abs(e.year)} years before the road): `), e.text)
          : k === 1
            ? el('p', { class: 'small' }, el('strong', {}, `${e.title}: `), `a tale told in ${content.zones.get(e.zone).name}. Find its ruin to read the rest.`)
            : el('p', { class: 'dim small' }, `Something happened in ${content.zones.get(e.zone).name}, ${Math.abs(e.year)} years before the road. Nobody has told you yet.`);
      }),
    );
  });
  return el(
    'div',
    {},
    el('p', { class: 'dim small' }, `Three hundred years of history that the gods remember and no one wrote down, different in every game. Hear tales by travelling, read them at ruins in each region (${known} of ${ch.events.length} known). Chroniclers offer commissions for tales you have heard.`),
    ...(active.length ? [el('h3', {}, `Commissions (${ch.commissions.length}/${session.realm.maxCommissions})`), ...active] : []),
    ...(offers.length ? [el('h3', {}, 'On offer'), ...offers] : []),
    ...eras,
  );
}

function ranchPanel(session: GameSession, rerender: () => void): HTMLElement {
  const r = session.realm.ranch;
  const act = (label: string, run: () => { ok: boolean; reason?: string } | void, disabled = false): HTMLButtonElement => {
    const b = el('button', { type: 'button' }, label);
    b.disabled = disabled;
    b.addEventListener('click', () => {
      run();
      rerender();
    });
    return b;
  };
  const rows = r.creatures.map((c) => {
    const def = content.enemies.get(c.enemyId);
    const need = SOULBOUND_XP(c.level);
    return el(
      'div',
      { class: 'party-gear-row' },
      el('span', { class: 'small' }, `${c.id === r.active ? '★ ' : ''}${c.name} · level ${c.level} · stage ${c.stage + 1}/3 · ${c.xp}/${need} XP · knows ${movesKnownText(c.enemyId, c.level)} of ${def.skills.length} moves`),
      act(c.id === r.active ? 'Stand down' : 'Bring along', () => session.realm.setActive(c.id === r.active ? undefined : c.id)),
      act(`Treat (${session.realm.feedCost()}g)`, () => session.realm.feed(c.id), session.state.gold < session.realm.feedCost() || c.level >= session.player.level),
      act('Release', () => session.realm.release(c.id)),
    );
  });
  return el(
    'div',
    {},
    el('p', { class: 'dim small' }, 'Weaken a creature in battle and throw a Soul Seal at it (Items). Bound creatures live here, level as they fight, evolve at levels 16 and 36 and learn a move every 8 levels. One fights beside you in a fourth place in the party. Seals are sold in general stores (Gilded ones in magic shops).'),
    el('p', { class: 'small' }, `Pens: ${r.creatures.length}/${r.capacity}.`),
    act(`Build more pens (${session.realm.expandCost()}g, +4)`, () => session.realm.expand(), session.state.gold < session.realm.expandCost()),
    ...(rows.length ? rows : [el('p', { class: 'dim' }, 'No creatures bound yet.')]),
  );
}

const SOULBOUND_XP = (level: number): number => SOULBOUND.xpToNext * level;
const movesKnownText = (enemyId: string, level: number): number => movesKnown({ id: '', enemyId, name: '', level, xp: 0, stage: 0, zone: '', day: 0 });

function trophyPanel(session: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  const sets = session.realm.trophies();
  const rows = sets.map((t) => {
    const boss = content.enemies.get(t.boss);
    const all = partsFor(boss.types);
    const complete = all.every((p) => t.parts.includes(p));
    const b = el('button', { type: 'button' }, complete ? `Forge (${session.realm.forgeCost(t.boss)}g)` : 'Needs all three');
    b.disabled = !complete;
    b.addEventListener('click', () => {
      const r = session.realm.forgeTrophies(t.boss);
      open.outcome = r.ok ? `Forged ${r.weapon} and ${r.armor}.` : r.reason;
      rerender();
    });
    return el('div', { class: 'party-gear-row' }, el('span', { class: 'small' }, `${boss.name}: ${all.map((p) => (t.parts.includes(p) ? p : `(${p})`)).join(', ')}`), b);
  });
  return el(
    'div',
    {},
    el('p', { class: 'dim small' }, 'Break a boss (stagger it) and a part breaks off: horn, scale, core, banner. Each weakens it. If the boss falls, the part is yours. Three parts of one boss, at a town forge, make a Legendary weapon and an Epic armor piece that carry its name.'),
    ...(rows.length ? rows : [el('p', { class: 'dim' }, 'No trophies yet.')]),
    ...(open.outcome ? [el('p', { class: 'small' }, open.outcome)] : []),
  );
}

function observatoryPanel(session: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  session.realm.findClues();
  const o = session.state.realm.observatory;
  const found = CLUES.filter((c) => o.clues.includes(c.id));
  const dials = (open.dials ??= {});
  const ready = session.realm.observatoryOpen();
  const here = session.world.inTown() === OBSERVATORY.town;
  const sel = (d: (typeof DIALS)[number]): HTMLElement => {
    const s = el('select', { 'aria-label': d.question }) as HTMLSelectElement;
    s.append(el('option', { value: '' }, '…'));
    for (const op of d.options) s.append(el('option', { value: op.id }, op.label));
    s.value = dials[d.id] ?? '';
    s.addEventListener('change', () => (dials[d.id] = s.value));
    return el('label', { class: 'setting-row' }, el('span', {}, d.question), s);
  };
  const go = el('button', { type: 'button' }, 'Set the Orrery');
  go.disabled = !ready || !here || o.solved !== undefined;
  go.addEventListener('click', () => {
    open.outcome = session.realm.observe(dials).text;
    rerender();
  });
  return el(
    'div',
    {},
    el('p', { class: 'dim small' }, `A dome on the Frosthold cliffs that fell out of the sky. It cannot be fought into; it opens to what you know. Live in the world and clues come to you (${found.length} of ${CLUES.length}; ${OBSERVATORY.clues} wake the dome). Then set the Orrery in Frosthold: seven questions, and the answers are all somewhere in the game.`),
    ...(o.solved !== undefined ? [el('p', { class: 'small' }, 'The stars have settled. You are the Starfallen.')] : []),
    el('h3', {}, 'Journal'),
    ...(found.length ? found.map((c) => el('p', { class: 'small' }, c.text)) : [el('p', { class: 'dim small' }, 'No clues yet.')]),
    ...(ready ? [el('h3', {}, 'The Orrery'), ...DIALS.map(sel), go, ...(here ? [] : [el('p', { class: 'dim small' }, 'Go to Frosthold to set it.')]), ...(open.outcome ? [el('p', { class: 'small' }, open.outcome)] : [])] : []),
  );
}

function emberfallPanel(session: GameSession, rerender: () => void, open: RealmView): HTMLElement {
  const v = session.realm.village;
  const here = session.realm.inEmberfall();
  const act = (label: string, run: () => { ok: boolean; reason?: string } | number | void, disabled = false): HTMLButtonElement => {
    const b = el('button', { type: 'button' }, label);
    b.disabled = disabled;
    b.addEventListener('click', () => {
      const r = run();
      open.outcome = typeof r === 'object' && r && !r.ok ? r.reason : typeof r === 'number' ? `${r} gold from the village.` : '';
      rerender();
    });
    return b;
  };
  const cost = (c: { gold: number; timber?: number; stone?: number }): string => `${c.gold}g${c.timber ? `, ${c.timber} timber` : ''}${c.stone ? `, ${c.stone} stone` : ''}`;
  const buildings = BUILDINGS.map((b) => {
    const lvl = levelOf(v, b.id);
    const next = nextCost(v, b.id);
    return el(
      'div',
      { class: 'party-gear-row' },
      el('span', { class: 'small' }, el('strong', {}, `${b.name} (level ${lvl}/3)`), el('div', { class: 'dim' }, b.text), ...(b.perk && lvl ? [el('div', { class: 'dim' }, b.perk.text)] : [])),
      act(next ? `${lvl ? 'Raise' : 'Build'} (${cost(next)})` : 'Done', () => session.realm.build(b.id), !next || !here),
    );
  });
  const coming = arriving(v).map((p) => el('div', { class: 'party-gear-row' }, el('span', { class: 'small' }, `${p.name}, ${p.role}: ${p.line}`), act(`Welcome (${EMBERFALL.settleCost}g)`, () => session.realm.settle(p.id), !here)));
  const home = v.settled.map((id) => VILLAGERS.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p);
  return el(
    'div',
    {},
    el('p', { class: 'dim small' }, 'Ashfold burned in the first chapter. Rebuild it as Emberfall: raise buildings, welcome the people who come to live in them (48 in all), and the village makes timber, stone, grain and coin, pens for your bound creatures, and small gifts for you. A village doing well is raided. You build in Ashfold.'),
    el('p', { class: 'small' }, `Timber ${Math.floor(v.timber)} · Stone ${Math.floor(v.stone)} · Grain ${Math.floor(v.grain)} · Coffers ${Math.floor(v.coffers)}g · People ${population(v)}/${housing(v)} · Defense ${defense(v, session.player.level)} · Raids repelled ${v.raidsRepelled}, lost ${v.raidsLost}${ranchPens(v) ? ` · +${ranchPens(v)} ranch pens` : ''}`),
    el('div', { class: 'row wrap' }, act('Collect the coffers', () => session.realm.collect(), !here || v.coffers < 1), act('Buy 10 timber (140g)', () => session.realm.buyStores('timber'), !here), act('Buy 10 stone (180g)', () => session.realm.buyStores('stone'), !here), act('Buy 10 grain (80g)', () => session.realm.buyStores('grain'), !here)),
    ...(here ? [] : [el('p', { class: 'dim small' }, 'Go to Ashfold to build, welcome people and collect.')]),
    ...(open.outcome ? [el('p', { class: 'field-error' }, open.outcome)] : []),
    el('h3', {}, 'Buildings'),
    ...buildings,
    ...(coming.length ? [el('h3', {}, 'Waiting to come'), ...coming] : []),
    ...(home.length ? [el('h3', {}, `Living here (${home.length})`), ...home.map((p) => el('p', { class: 'small' }, `${p.name}, ${p.role}: ${p.line}`))] : []),
    ...(v.log.length ? [el('h3', {}, 'The village book'), ...v.log.slice(0, 10).map((l) => el('p', { class: 'small dim' }, `Day ${l.day}: ${l.text}`))] : []),
  );
}
