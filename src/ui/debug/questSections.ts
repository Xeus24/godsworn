import { content } from '../../data';
import { objectiveDone, required, stageOf } from '../../engine/quests/quests';
import type { GameSession } from '../../engine/state/gameState';
import { el } from '../screen';
import { debugButton, type DebugPanel } from './debugPanel';

const noGame = (): HTMLElement => el('p', { class: 'dim' }, 'Start a game first.');

/** Quest and companion cheats: start, advance or finish quests; recruit companions; set approval; reach an ending. */
export function registerQuestSections(panel: DebugPanel, getSession: () => GameSession | undefined): void {
  panel.addSection({
    title: 'Quests',
    render: (refresh, log) => {
      const s = getSession();
      if (!s) return noGame();
      const select = el('select', {}, ...content.quests.all().map((q) => el('option', { value: q.id }, `${q.kind}: ${q.name}`)));
      const chosen = (): string => select.value;
      /** Marks every objective of the current stage done (talk and turn-in stages still need their NPC). */
      const advance = (id: string): void => {
        const prog = s.state.quests.active[id];
        if (!prog) return log(`${id} is not active`);
        const q = content.quests.get(id);
        for (const o of stageOf(q, prog.stage).objectives) if (!objectiveDone(s.state, prog, o)) prog.progress[o.id] = required(o);
        const st = stageOf(q, prog.stage);
        if (st.turnIn) s.quests.runActions([{ kind: 'turnIn', quest: id }]);
        else s.quests.refresh();
        log(`${id}: now ${s.state.quests.active[id]?.stage ?? 'complete'}`);
      };
      return el(
        'div',
        {},
        el('pre', {}, `active: ${Object.keys(s.state.quests.active).join(', ') || 'none'}\ndone: ${Object.keys(s.state.quests.completed).length}  ending: ${s.state.quests.ending?.id ?? 'none'}`),
        select,
        el(
          'div',
          { class: 'row' },
          debugButton('Start', () => {
            const id = chosen();
            if (!s.state.quests.active[id]) s.quests.runActions([{ kind: 'startQuest', quest: id }]);
            log(`started ${id}`);
            refresh();
          }),
          debugButton('Advance stage', () => {
            advance(chosen());
            refresh();
          }),
          debugButton('Advance tracked', () => {
            const id = s.state.quests.tracked;
            if (id) advance(id);
            refresh();
          }),
          debugButton('Finish story (ch. 1-7)', () => {
            for (let i = 1; i <= 7; i++) {
              s.state.quests.completed[`main-${i}`] = 1;
              delete s.state.quests.active[`main-${i}`];
            }
            s.quests.refresh();
            log('chapters 1-7 marked done');
            refresh();
          }),
        ),
        el('div', { class: 'row' }, ...content.endings.all().map((e) => debugButton(`Ending: ${e.name}`, () => {
          s.quests.runActions([{ kind: 'ending', ending: e.id }]);
          log(`ending ${e.id}`);
          refresh();
        }))),
      );
    },
  });

  panel.addSection({
    title: 'Party',
    render: (refresh, log) => {
      const s = getSession();
      if (!s) return noGame();
      return el(
        'div',
        {},
        el('pre', {}, content.companions.all().map((c) => {
          const st = s.state.party.companions[c.id];
          return `${c.name.padEnd(18)} ${st ? `lv ${st.character.level} approval ${st.approval}${st.inParty ? ' (party)' : ''}${st.left ? ' (left)' : ''}` : '-'}`;
        }).join('\n')),
        el('div', { class: 'row' }, ...content.companions.all().map((c) => debugButton(`Recruit ${c.name.split(' ')[0]}`, () => {
          s.party.recruit(c.id);
          log(`recruited ${c.id}`);
          refresh();
        }))),
        el('div', { class: 'row' }, debugButton('All approval +25', () => {
          for (const c of s.party.recruited()) s.party.adjust(c.id, 25);
          refresh();
        }), debugButton('All approval -25', () => {
          for (const c of s.party.recruited()) s.party.adjust(c.id, -25);
          refresh();
        })),
      );
    },
  });

  panel.addSection({
    title: 'Codex',
    render: (refresh, log) => {
      const s = getSession();
      if (!s) return noGame();
      return el(
        'div',
        {},
        el('pre', {}, `achievements ${Object.keys(s.state.achievements).length}/${content.achievements.size} · bestiary ${Object.keys(s.player.bestiary).length} · titles ${s.player.devotion.titles.length}`),
        el('div', { class: 'row' }, debugButton('Bestiary: +10 kills of everything', () => {
          for (const e of content.enemies.all()) s.player.bestiary[e.id] = (s.player.bestiary[e.id] ?? 0) + 10;
          s.achievements.check();
          log('bestiary +10');
          refresh();
        }), debugButton('Earn all achievements', () => {
          for (const a of content.achievements.all()) {
            s.state.achievements[a.id] ??= s.state.clock.day;
            if (a.title && !s.player.devotion.titles.includes(a.title)) s.player.devotion.titles.push(a.title);
          }
          log('all achievements');
          refresh();
        })),
      );
    },
  });
}
