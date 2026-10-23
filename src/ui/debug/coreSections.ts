import { formatClock, timeOfDay } from '../../engine/state/clock';
import type { GameSession } from '../../engine/state/gameState';
import { calculateStats } from '../../engine/stats/calculate';
import type { Modifier } from '../../engine/stats/modifiers';
import { el } from '../screen';
import { debugButton, type DebugPanel } from './debugPanel';

/** Sections for the engine core: session state, clock, RNG and a stat lab. */
export function registerCoreSections(panel: DebugPanel, getSession: () => GameSession): void {
  panel.addSection({
    title: 'Session',
    render: (refresh, log) => {
      const s = getSession();
      return el(
        'div',
        {},
        el(
          'pre',
          {},
          [
            `seed:     ${s.state.seed}`,
            `rng:      ${s.rng.state}`,
            `clock:    ${formatClock(s.state.clock)} (${timeOfDay(s.state.clock)})`,
            `flags:    ${JSON.stringify(s.state.flags)}`,
          ].join('\n'),
        ),
        el(
          'div',
          { class: 'row' },
          debugButton('+1 hour', () => {
            s.advanceTime(60);
            refresh();
          }),
          debugButton('+1 day', () => {
            s.advanceTime(24 * 60);
            refresh();
          }),
          debugButton('Roll d100', () => {
            log(`d100 -> ${s.rng.int(1, 100)}`);
            refresh();
          }),
        ),
      );
    },
  });

  // Toggleable sample modifiers that show flat -> percent -> more ordering.
  const sample: { label: string; mod: Modifier; on: boolean }[] = [
    { label: '+10 STR (flat)', mod: { stat: 'str', type: 'flat', value: 10, source: 'debug' }, on: false },
    { label: '+20% ATK', mod: { stat: 'physicalAttack', type: 'percent', value: 20, source: 'debug' }, on: false },
    { label: '+50% more ATK', mod: { stat: 'physicalAttack', type: 'more', value: 50, source: 'debug' }, on: false },
    { label: '+100 LUK', mod: { stat: 'luk', type: 'flat', value: 100, source: 'debug' }, on: false },
  ];

  panel.addSection({
    title: 'Stat Lab (level 10, all primaries 10)',
    render: (refresh) => {
      const stats = calculateStats({
        level: 10,
        base: { str: 10, dex: 10, int: 10, vit: 10, wis: 10, luk: 10, fai: 10 },
        modifiers: sample.filter((m) => m.on).map((m) => m.mod),
      });
      const toggles = sample.map((m) =>
        debugButton(`${m.on ? '[x]' : '[ ]'} ${m.label}`, () => {
          m.on = !m.on;
          refresh();
        }),
      );
      return el(
        'div',
        {},
        el('div', { class: 'row' }, ...toggles),
        el(
          'pre',
          {},
          [
            `STR ${stats.str}  LUK ${stats.luk}`,
            `HP ${stats.maxHp}  MP ${stats.maxMp}`,
            `ATK ${stats.physicalAttack}  MAG ${stats.magicAttack}  DIV ${stats.divinePower}`,
            `Crit ${stats.critChance}% (cap 60)  Dodge ${stats.dodge}%  Speed ${stats.speed}`,
          ].join('\n'),
        ),
      );
    },
  });
}
