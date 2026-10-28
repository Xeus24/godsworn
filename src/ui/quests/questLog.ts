import { content } from '../../data';
import { activeMarkers, minutesLeft, objectiveDone, questGold, questLevel, questXp, stageOf } from '../../engine/quests/quests';
import type { ObjectiveDef, QuestDef, QuestKind } from '../../engine/quests/types';
import { objectiveLine } from '../../engine/state/conversation';
import type { GameSession } from '../../engine/state/gameState';
import { mapFor } from '../../engine/world/mapgen';
import { navBar, type Nav } from '../components/navBar';
import { el, type Screen } from '../screen';

const KIND_ORDER: QuestKind[] = ['main', 'twilight', 'companion', 'side', 'faction', 'god', 'class', 'hybrid', 'racial', 'background', 'bounty'];
const KIND_NAMES: Record<QuestKind, string> = { main: 'The Story', twilight: 'Twilight of the Gods', companion: 'Companions', side: 'Side Quests', faction: 'Factions', god: 'The Gods', class: 'Class Trials', hybrid: 'Hybrid Trials', racial: 'Your People', background: 'Your Past', bounty: 'Bounties' };

/** Where an objective points you: a marker's place, an NPC's town, a zone. */
export function objectiveWhere(s: GameSession, q: QuestDef, o: ObjectiveDef): string {
  const marker = activeMarkers(s.state).find((m) => m.quest === q.id && m.objective === o.id);
  if (marker) return `${mapFor(marker.map).name}: ${marker.label}`;
  if (o.kind === 'talk' || o.kind === 'deliver') {
    const npc = content.npcs.get(o.npc);
    if (npc.companion && s.state.party.companions[npc.companion]) return `${npc.name} (Party screen)`;
    if (npc.place === 'arena') return `${npc.name}, at any town’s arena`;
    return npc.town ? `${npc.name}, ${content.towns.get(npc.town).name}` : npc.name;
  }
  if (o.kind === 'kill' && o.zone) return content.zones.get(o.zone).name;
  if (o.kind === 'clear' || o.kind === 'runes') return content.dungeons.get(o.dungeon).name;
  return '';
}

export function rewardText(q: QuestDef, ngPlus = 0): string {
  const r = q.rewards;
  const parts: string[] = [];
  if (questXp(q, ngPlus)) parts.push(`${questXp(q, ngPlus)} XP`);
  if (questGold(q, ngPlus)) parts.push(`${questGold(q, ngPlus)} gold`);
  for (const it of r.items ?? []) parts.push(`${it.qty ?? 1}× ${content.items.get(it.itemId).name}`);
  if (r.gear) parts.push(`${r.gear.count ?? 1}× ${content.rarities.get(r.gear.rarity).name} gear`);
  for (const [g, n] of Object.entries(r.favor ?? {})) parts.push(`+${n} favor with ${content.gods.get(g).name}`);
  for (const [f, n] of Object.entries(r.rep ?? {})) parts.push(`+${n} ${content.factions.get(f).name} reputation`);
  if (r.skillPoints) parts.push(`${r.skillPoints} skill points`);
  if (r.title) parts.push(`title “${r.title}”`);
  return parts.join(', ');
}

function formatMinutes(m: number): string {
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
}

/**
 * The quest log (J): active quests by kind, the selected quest's stage and
 * objectives (with where to go and progress), rewards, tracking and
 * abandoning, and everything already done.
 */
export class QuestLogScreen implements Screen {
  private root: HTMLElement | undefined;
  private offs: (() => void)[] = [];
  private selected: string | undefined;

  constructor(
    private readonly session: GameSession,
    private readonly nav: Nav,
  ) {
    this.selected = session.state.quests.tracked;
  }

  mount(root: HTMLElement): void {
    this.root = root;
    this.offs.push(this.session.bus.on('stateChanged', () => this.render()));
    this.render();
  }

  unmount(): void {
    for (const off of this.offs) off();
    this.offs = [];
  }

  private detail(q: QuestDef): HTMLElement {
    const s = this.session;
    const prog = s.state.quests.active[q.id];
    const st = prog ? stageOf(q, prog.stage) : undefined;
    const left = minutesLeft(s.state, q);
    const tracked = s.state.quests.tracked === q.id;
    const track = el('button', { class: tracked ? 'tab active' : 'tab' }, tracked ? 'Tracked' : 'Track');
    track.addEventListener('click', () => s.quests.track(tracked ? undefined : q.id));
    const abandon = el('button', { class: 'tab' }, 'Abandon');
    abandon.addEventListener('click', () => {
      if (s.quests.abandon(q.id).ok) this.selected = undefined;
    });
    const objectives = (st?.objectives ?? []).map((o) => {
      const done = prog ? objectiveDone(s.state, prog, o) : false;
      const where = done ? '' : objectiveWhere(s, q, o);
      const line = objectiveLine(s, q.id, o.id);
      return el('li', { class: done ? 'obj done' : 'obj' }, el('span', {}, `${done ? '✓' : '○'} ${o.text}${line && line !== 'done' ? ` (${line})` : ''}`), ...(where ? [el('div', { class: 'dim small' }, where)] : []));
    });
    const turnIn = st?.turnIn && prog && st.objectives.every((o) => objectiveDone(s.state, prog, o)) ? content.npcs.get(st.turnIn) : undefined;
    const giver = q.giver ? content.npcs.get(q.giver) : undefined;
    return el(
      'section',
      { class: 'panel quest-detail' },
      el('div', { class: 'dim small' }, `${KIND_NAMES[q.kind]} · level ${questLevel(q, s.state.ngPlus)}${q.zone ? ` · ${content.zones.get(q.zone).name}` : ''}${giver ? ` · from ${giver.name}` : q.board ? ` · ${content.towns.get(q.board).name} quest board` : ''}`),
      el('h2', {}, q.name),
      el('p', { class: 'small' }, q.summary),
      ...(st
        ? [
            el('h3', {}, 'Now'),
            el('p', {}, st.text),
            ...(left !== undefined ? [el('div', { class: left < 120 ? 'field-error' : 'small' }, `Time left: ${formatMinutes(Math.max(0, left))}`)] : []),
            el('ul', { class: 'quest-objectives' }, ...objectives),
            ...(turnIn ? [el('div', { class: 'quest-turnin' }, `Return to ${turnIn.name}${turnIn.place === 'arena' ? ' at any arena' : turnIn.town ? ` in ${content.towns.get(turnIn.town).name}` : ''}.`)] : []),
          ]
        : []),
      el('h3', {}, 'Rewards'),
      el('p', { class: 'small' }, rewardText(q, s.state.ngPlus) || 'The satisfaction of a job well done.'),
      ...(prog ? [el('div', { class: 'row wrap' }, track, ...(q.kind === 'main' || q.kind === 'twilight' ? [] : [abandon]))] : []),
    );
  }

  private render = (): void => {
    if (!this.root) return;
    const s = this.session;
    const active = s.quests.active();
    if (this.selected && !s.state.quests.active[this.selected] && !s.state.quests.completed[this.selected]) this.selected = undefined;
    const selected = this.selected ? content.quests.find(this.selected) : active[0];
    const groups = KIND_ORDER.map((kind) => {
      const list = active.filter((q) => q.kind === kind);
      if (!list.length) return undefined;
      return el(
        'div',
        { class: 'quest-group' },
        el('h3', {}, `${KIND_NAMES[kind]} (${list.length})`),
        ...list.map((q) => {
          const b = el('button', { class: `quest-row${selected?.id === q.id ? ' active' : ''}` }, el('span', {}, `${s.state.quests.tracked === q.id ? '◆ ' : ''}${q.name}`), el('span', { class: 'dim small' }, `Lv ${questLevel(q, s.state.ngPlus)}`));
          b.addEventListener('click', () => {
            this.selected = q.id;
            this.render();
          });
          return b;
        }),
      );
    }).filter((x): x is HTMLDivElement => x !== undefined);
    const done = content.quests.filter((q) => (s.state.quests.completed[q.id] ?? 0) > 0 && !s.state.quests.active[q.id]);
    const ending = s.state.quests.ending;
    this.root.replaceChildren(
      el(
        'div',
        { class: 'sheet' },
        navBar(s, this.nav, 'quests'),
        el(
          'div',
          { class: 'quest-body' },
          el(
            'section',
            { class: 'panel quest-list' },
            el('h2', {}, 'Quest Log'),
            ...(groups.length ? groups : [el('p', { class: 'dim small' }, 'No active quests. Talk to people in towns (marked ! ) and read the quest boards.')]),
            el('details', {}, el('summary', {}, `Completed (${done.length})`), el('ul', { class: 'small done-list' }, ...done.map((q) => el('li', {}, `${q.name}${(s.state.quests.completed[q.id] ?? 0) > 1 ? ` ×${s.state.quests.completed[q.id]}` : ''}`)))),
            ...(s.state.quests.failed.length ? [el('details', {}, el('summary', {}, `Failed (${s.state.quests.failed.length})`), el('ul', { class: 'small done-list' }, ...s.state.quests.failed.map((id) => el('li', {}, content.quests.get(id).name))))] : []),
            ...(ending ? [el('p', { class: 'small' }, `Story ending: ${content.endings.get(ending.id).name}`)] : []),
          ),
          selected ? this.detail(selected) : el('section', { class: 'panel quest-detail dim' }, 'Select a quest.'),
        ),
      ),
    );
  };
}
