import { totalXpForLevel } from '../../engine/character/progression';
import { formatClock, timeOfDay } from '../../engine/state/clock';
import type { GameSession } from '../../engine/state/gameState';
import { calculateStats } from '../../engine/stats/calculate';
import type { Modifier } from '../../engine/stats/modifiers';
import { el } from '../screen';
import { debugButton, type DebugPanel } from './debugPanel';

const noGame = (): HTMLElement => el('p', { class: 'dim' }, 'Start a game first.');

/** Sections for the engine core and character progression. */
export function registerCoreSections(panel: DebugPanel, getSession: () => GameSession | undefined): void {
  panel.addSection({
    title: 'Session',
    render: (refresh, log) => {
      const s = getSession();
      if (!s) return noGame();
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

  panel.addSection({
    title: 'Character',
    render: (refresh, log) => {
      const s = getSession();
      if (!s) return noGame();
      const p = s.player;
      const levelInput = el('input', { type: 'number', min: '1', max: String(s.state.levelCap), value: String(p.level), class: 'num' });
      const xp = (amount: number) => () => {
        const r = s.grantXp(amount, true);
        log(`+${amount} XP${r.levels.length ? ` -> level ${p.level}` : ''}${r.paragonLevels.length ? ` -> paragon ${p.paragonLevel}` : ''}`);
        refresh();
      };
      return el(
        'div',
        {},
        el('pre', {}, `level ${p.level}  xp ${p.xp}  attr pts ${p.attributePoints}  paragon ${p.paragonLevel} (${p.paragonPoints} pts)  gold ${s.state.gold}`),
        el('div', { class: 'row' }, debugButton('+100 XP', xp(100)), debugButton('+1k XP', xp(1_000)), debugButton('+100k XP', xp(100_000))),
        el(
          'div',
          { class: 'row' },
          levelInput,
          debugButton('Set level', () => {
            const target = Math.min(s.state.levelCap, Math.max(1, Math.floor(Number(levelInput.value))));
            const needed = totalXpForLevel(target) - (totalXpForLevel(p.level) + p.xp);
            if (needed > 0) s.grantXp(needed, true);
            log(`level -> ${p.level}`);
            refresh();
          }),
          debugButton('Max level', () => {
            s.grantXp(totalXpForLevel(s.state.levelCap), true);
            log(`level -> ${p.level}`);
            refresh();
          }),
        ),
        el(
          'div',
          { class: 'row' },
          debugButton('+1,000 gold', () => {
            s.addGold(1000, 'debug');
            refresh();
          }),
          debugButton('+10 attr pts', () => {
            p.attributePoints += 10;
            s.bus.emit('stateChanged', { reason: 'debug' });
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
