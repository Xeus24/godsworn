import { content } from '../../data';
import { ARTS } from '../../data/heart/arts';
import { BONDS, BOND_RANK_NAMES, BOND_RANK_POINTS } from '../../data/heart/bonds';
import { CONVICTIONS, SETTLE_DAYS } from '../../data/heart/convictions';
import { TALES, TALE_APPROVAL } from '../../data/heart/tales';
import { SIGILS, OVERCHARGE } from '../../data/heart/sigils';
import { learnedSlots, sigilSlots } from '../../engine/heart/heart';
import { describe as describeCond } from '../../engine/quests/conditions';
import { QUIRKS } from '../../data/heart/bloodline';
import { bondRank, holds, nextBondPoints } from '../../engine/heart/heart';
import type { GameSession } from '../../engine/state/gameState';
import { el } from '../screen';

export type HeartSection = 'convictions' | 'bonds' | 'tales' | 'art' | 'sigils' | 'learned' | 'bloodline';
export interface HeartView {
  section: HeartSection;
  tale?: string;
  scene?: { title: string; text: string };
  artText?: string;
  note?: string;
}
const SECTIONS: [HeartSection, string][] = [['convictions', 'Convictions'], ['bonds', 'Kindred Bonds'], ['tales', 'Campfire Tales'], ['art', 'Wayfarer’s Art'], ['sigils', 'Sigils'], ['learned', 'Learned Arts'], ['bloodline', 'Bloodline']];

/** Codex > Heart: what the hero believes, who they are close to, and what their companions say to each other. */
export function heartPanel(session: GameSession, rerender: () => void, view: HeartView): HTMLElement {
  const tabs = SECTIONS.map(([id, label]) => {
    const b = el('button', { type: 'button', class: view.section === id ? 'active' : '' }, label);
    b.addEventListener('click', () => {
      view.section = id;
      rerender();
    });
    return b;
  });
  const body = view.section === 'convictions' ? convictions(session) : view.section === 'bonds' ? bonds(session) : view.section === 'tales' ? tales(session, rerender, view) : view.section === 'art' ? art(session, rerender, view) : view.section === 'sigils' ? sigils(session, rerender, view) : view.section === 'learned' ? learned(session, rerender, view) : bloodline(session);
  return el('section', { class: 'panel' }, el('h2', {}, 'The Heart'), el('div', { class: 'row wrap' }, ...tabs), body);
}

function convictions(session: GameSession): HTMLElement {
  const h = session.heart.h;
  const held = CONVICTIONS.filter((c) => holds(h, c.id));
  const settling = CONVICTIONS.filter((c) => h.adopted[c.id] !== undefined && !holds(h, c.id));
  const leaning = CONVICTIONS.filter((c) => !holds(h, c.id) && h.adopted[c.id] === undefined && (h.lean[c.id] ?? 0) > 0);
  const row = (c: (typeof CONVICTIONS)[number], tag: string): HTMLElement =>
    el('div', { class: 'small' }, el('strong', {}, c.name), ` · ${tag}`, el('div', { class: 'dim' }, c.thought), ...(holds(h, c.id) ? [el('div', { class: 'dim' }, `${c.mods.map((m) => `${(m as { stat: string }).stat} ${(m as { value: number }).value >= 0 ? '+' : ''}${(m as { value: number }).value}`).join(', ')}${c.opposes ? ` · you do not hold ${CONVICTIONS.find((x) => x.id === c.opposes)?.name}` : ''}`)] : []));
  return el(
    'div',
    {},
    el('p', { class: 'dim small' }, `Sixty beliefs. What you do leans you toward them; when the lean is strong enough a belief starts to settle, and ${SETTLE_DAYS} days later it is yours (a boon, new things people say to you, and the gods who care take notice). Twenty pairs oppose each other: you hold one or the other.`),
    el('h3', {}, `Held (${held.length})`),
    ...(held.length ? held.map((c) => row(c, h.inherited.includes(c.id) ? 'inherited' : 'held')) : [el('p', { class: 'dim small' }, 'None yet.')]),
    ...(settling.length ? [el('h3', {}, 'Settling'), ...settling.map((c) => row(c, `since day ${h.adopted[c.id]}`))] : []),
    ...(leaning.length ? [el('h3', {}, 'Leaning toward'), ...leaning.map((c) => row(c, `${h.lean[c.id]}/${c.need}`))] : []),
  );
}

function bonds(session: GameSession): HTMLElement {
  const h = session.heart.h;
  const rows = BONDS.map((b) => {
    const points = h.bonds[b.id] ?? 0;
    const rank = bondRank(points);
    const next = nextBondPoints(points);
    const name = b.kind === 'npc' ? content.npcs.get(b.ref).name : content.gods.get(b.ref).name;
    const known = points > 0;
    return el(
      'div',
      { class: 'small' },
      el('strong', {}, known ? name : '???'),
      ` · ${known ? `${BOND_RANK_NAMES[rank - 1]} (rank ${rank}/10, ${points}${next ? `/${next}` : ''})` : 'not met'}`,
      el('div', { class: 'dim' }, known ? b.blurb : b.kind === 'god' ? 'Pray, or give at their shrines.' : `Somewhere in ${content.towns.get(content.npcs.get(b.ref).town ?? 'brightwater').name}.`),
    );
  });
  return el('div', {}, el('p', { class: 'dim small' }, `Twenty people and gods you can grow close to through ten ranks (${BOND_RANK_POINTS[9]} points). Talk to them daily and finish their errands; pray and give at the gods’ shrines. Even ranks give boons; rank 3 a recipe, 5 and 9 a skill, 7 a gift.`), ...rows);
}

function tales(session: GameSession, rerender: () => void, view: HeartView): HTMLElement {
  const rows = TALES.map((p) => {
    const st = session.heart.taleStatus(p);
    const a = content.companions.get(p.a).name;
    const b = content.companions.get(p.b).name;
    const line = el('div', { class: 'party-gear-row' }, el('span', { class: 'small' }, `${a} and ${b}: ${st.heard}/4 · ${p.theme}`));
    if (st.heard < 4) {
      const btn = el('button', { type: 'button' }, st.reason ? st.reason : `Listen: ${p.stages[st.heard]?.title}`);
      btn.disabled = Boolean(st.reason);
      btn.addEventListener('click', () => {
        view.tale = p.id;
        delete view.scene;
        rerender();
      });
      line.append(btn);
    }
    return line;
  });
  let scene: HTMLElement | undefined;
  const pair = TALES.find((p) => p.id === view.tale);
  if (pair) {
    const st = session.heart.taleStatus(pair);
    const stage = pair.stages[st.heard];
    if (view.scene) scene = el('div', {}, el('h3', {}, view.scene.title), el('p', { class: 'small' }, view.scene.text));
    else if (stage && !st.reason) {
      const pick = (c: 'a' | 'b'): HTMLButtonElement => {
        const bt = el('button', { type: 'button' }, stage[c][0]);
        bt.addEventListener('click', () => {
          const r = session.heart.hearTale(pair.id, c);
          view.scene = { title: r.title ?? stage.title, text: `${stage.text}\n\n${stage.ask}\n\n${r.text}` };
          rerender();
        });
        return bt;
      };
      scene = el('div', {}, el('h3', {}, stage.title), el('p', { class: 'small' }, stage.text), el('p', { class: 'small' }, stage.ask), el('div', { class: 'row' }, pick('a'), pick('b')));
    }
  }
  return el('div', {}, el('p', { class: 'dim small' }, `Twelve pairs of companions, four scenes each. A scene needs both of them with you and at least ${TALE_APPROVAL.join(', ')} approval for scenes one to four. Each scene brings them closer: they fight better side by side.`), ...rows, ...(scene ? [scene] : []));
}

function art(session: GameSession, rerender: () => void, view: HeartView): HTMLElement {
  const mine = session.heart.art();
  const btn = el('button', { type: 'button' }, session.heart.artReady() ? `Use ${mine?.name ?? 'your art'}` : 'Used today');
  btn.disabled = !mine || !session.heart.artReady();
  btn.addEventListener('click', () => {
    view.artText = session.heart.useArt().text;
    rerender();
  });
  return el(
    'div',
    {},
    el('p', { class: 'dim small' }, 'Each class has one thing it does out of combat, once a day: how a Godsworn reads a place, a person, a price or a wound.'),
    ...(mine ? [el('h3', {}, mine.name), el('p', { class: 'small' }, `${mine.text} (${session.heart.artEffects[mine.effect]})`), btn] : []),
    ...(view.artText ? [el('p', { class: 'small' }, view.artText)] : []),
    el('h3', {}, 'All the arts'),
    ...ARTS.map((a) => el('div', { class: 'small dim' }, `${content.classes.get(a.classId).name}: ${a.name}`)),
  );
}

function bloodline(session: GameSession): HTMLElement {
  const bl = session.state.realm.bloodline;
  const h = session.heart.h;
  const hc = session.player.hardcore;
  return el(
    'div',
    {},
    el('p', { class: 'dim small' }, 'In a Hardcore game, a hero who falls does not end the family. An heir takes up the oath, carrying 40% of the gold, up to two beliefs that were held, a quirk, a few skill points and the favor of the god the parent served.'),
    el('p', { class: 'small' }, hc ? `You are generation ${bl.generation} of your line.` : 'This hero is not Hardcore, so there is no heir. (Choose Hardcore at creation to play a bloodline.)'),
    ...(h.quirks.length ? [el('h3', {}, 'Your quirks'), ...h.quirks.map((q) => el('div', { class: 'small' }, `${QUIRKS.find((x) => x.id === q)?.name}: ${QUIRKS.find((x) => x.id === q)?.text}`))] : []),
    ...(bl.ancestors.length ? [el('h3', {}, 'Those who went before'), ...bl.ancestors.map((a) => el('div', { class: 'small dim' }, `Generation ${a.generation}: ${a.name}, level ${a.level} ${content.classes.find(a.classId)?.name ?? a.classId}, fell to ${a.by}.`))] : []),
  );
}

function sigils(session: GameSession, rerender: () => void, view: HeartView): HTMLElement {
  session.heart.findSigils();
  const h = session.heart.h;
  const slots = sigilSlots(session.player);
  const btn = (label: string, run: () => void): HTMLButtonElement => {
    const b = el('button', { type: 'button' }, label);
    b.addEventListener('click', () => {
      run();
      rerender();
    });
    return b;
  };
  const list = (stats: unknown[]): string => stats.map((m) => `${(m as { stat: string }).stat} ${(m as { value: number }).value >= 0 ? '+' : ''}${(m as { value: number }).value}${(m as { type: string }).type === 'more' ? '%' : ''}`).join(', ');
  const rows = SIGILS.map((sg) => {
    const found = h.sigilsFound.includes(sg.id);
    const slotted = h.sigils.find((x) => x.id === sg.id);
    if (!found) return el('div', { class: 'small dim' }, `??? Found when: ${describeCond(sg.found)}`);
    return el(
      'div',
      { class: 'party-gear-row' },
      el('span', { class: 'small' }, el('strong', {}, sg.name), ` · ${slotted?.over ? `overcharged: ${list(sg.over)}` : list(sg.mods)}`, el('div', { class: 'dim' }, `${sg.text} Overcharged (x${OVERCHARGE}): ${sg.cost}`)),
      btn(slotted ? 'Take out' : 'Slot', () => {
        const r = session.heart.slotSigil(sg.id);
        view.note = r.ok ? '' : r.reason;
      }),
      ...(slotted ? [btn(slotted.over ? 'Calm' : 'Overcharge', () => session.heart.overcharge(sg.id))] : []),
    );
  });
  return el(
    'div',
    {},
    el('p', { class: 'dim small' }, `Forty marks from before the gods had names. Each is found by doing what it commemorates. Slots: ${h.sigils.length}/${slots} (one more at levels 30 and 60). Overcharged, a sigil gives ${OVERCHARGE} times as much and asks something back.`),
    ...(view.note ? [el('p', { class: 'field-error' }, view.note)] : []),
    el('p', { class: 'small' }, `Found: ${h.sigilsFound.length} of ${SIGILS.length}.`),
    ...rows,
  );
}


function learned(session: GameSession, rerender: () => void, view: HeartView): HTMLElement {
  const h = session.heart.h;
  const slots = learnedSlots(session.player);
  const btn = (label: string, run: () => void, disabled = false): HTMLButtonElement => {
    const b = el('button', { type: 'button' }, label);
    b.disabled = disabled;
    b.addEventListener('click', () => {
      run();
      rerender();
    });
    return b;
  };
  const trained = session.heart.trainedClasses();
  return el(
    'div',
    {},
    el('p', { class: 'dim small' }, `Learn single abilities from any class you have trained in (taken, or won the trial of). Studying costs ${session.heart.studyCost()} gold and a day. Learned Arts slots: ${h.borrowed.length}/${slots} (one more at levels 40 and 70). They sit beside your hotbar in battle.`),
    ...(view.note ? [el('p', { class: 'field-error' }, view.note)] : []),
    ...(h.borrowed.length ? [el('h3', {}, 'Learned'), ...h.borrowed.map((id) => el('div', { class: 'party-gear-row' }, el('span', { class: 'small' }, content.skills.get(id).name), btn('Forget', () => session.heart.forgetArt(id))))] : []),
    ...(trained.length
      ? trained.flatMap((cid) => [el('h3', {}, content.classes.get(cid).name), ...session.heart.borrowable(cid).map((b) => el('div', { class: 'party-gear-row' }, el('span', { class: 'small' }, `${b.name}: ${content.skills.get(b.skill).description}`), btn(h.borrowed.includes(b.skill) ? 'Known' : 'Study', () => {
          const r = session.heart.borrow(b.skill);
          view.note = r.ok ? '' : r.reason;
        }, h.borrowed.includes(b.skill))))])
      : [el('p', { class: 'dim' }, 'You have not trained in any other class yet. Take a second class, or win a class trial at the Proving Grounds.')]),
  );
}
