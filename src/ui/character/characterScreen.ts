import { content } from '../../data';
import { allocatedTotal, respecCost } from '../../engine/character/attributes';
import { paragonRank } from '../../engine/character/paragon';
import { levelProgress, xpToNext } from '../../engine/character/progression';
import { characterStatsDetailed } from '../../engine/character/stats';
import type { GameSession } from '../../engine/state/gameState';
import { ELEMENTS, PRIMARY_STATS, type StatId } from '../../engine/stats/types';
import { navBar, type Nav } from '../components/navBar';
import { attachTooltip, hideTooltip } from '../components/tooltip';
import { formatStat, skillCard, statBreakdownTooltip } from '../format';
import { el, type Screen } from '../screen';

const GROUPS: [string, StatId[]][] = [
  ['Offense', ['physicalAttack', 'magicAttack', 'divinePower', 'critChance', 'critDamage', 'accuracy', 'speed', 'damageBonus', 'statusChance', 'lifesteal', 'cooldownReduction']],
  ['Defense', ['maxHp', 'maxMp', 'defense', 'magicResist', 'dodge', 'statusResist', 'damageTaken', 'hpRegen', 'mpRegen']],
  ['Fortune & Faith', ['goldFind', 'magicFind', 'favorGain', 'blessingPower', 'xpGain', 'healingPower', 'healingReceived', 'resourceGain']],
];

function bar(fraction: number, cls: string, label: string): HTMLElement {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  return el('div', { class: `bar ${cls}`, role: 'progressbar', 'aria-valuenow': String(Math.round(pct)), 'aria-label': label },
    el('div', { class: 'bar-fill', style: `width:${pct}%` }),
    el('span', { class: 'bar-label' }, label),
  );
}

export class CharacterScreen implements Screen {
  private root: HTMLElement | undefined;
  private offs: (() => void)[] = [];

  constructor(
    private readonly session: GameSession,
    private readonly nav: Nav,
  ) {}

  mount(root: HTMLElement): void {
    this.root = root;
    const bus = this.session.bus;
    this.offs.push(
      bus.on('xpGained', () => this.render()),
      bus.on('goldChanged', () => this.render()),
      bus.on('stateChanged', () => this.render()),
    );
    this.render();
  }

  unmount(): void {
    for (const off of this.offs) off();
    this.offs = [];
  }

  /** Re-renders from current state; called after anything changes. */
  render = (): void => {
    if (!this.root) return;
    // The hovered element is about to be replaced and will never fire mouseleave.
    hideTooltip();
    const s = this.session;
    const p = s.player;
    const { stats, breakdown } = characterStatsDetailed(p);
    const race = content.races.get(p.raceId);

    const atCap = p.level >= s.state.levelCap;
    const xpLabel = atCap
      ? `Paragon ${p.paragonLevel} \u00b7 ${Math.floor(levelProgress(p, s.state.levelCap) * 100)}%`
      : `XP ${p.xp} / ${xpToNext(p.level)}`;
    const header = navBar(s, this.nav, 'character', bar(levelProgress(p, s.state.levelCap), 'xp', xpLabel));

    const statRow = (id: StatId): HTMLElement => {
      const row = el('div', { class: 'stat-row' }, el('span', {}, content.stats.get(id).name), el('b', {}, formatStat(id, stats[id])));
      attachTooltip(row, () => statBreakdownTooltip(id, breakdown[id], stats[id]));
      return row;
    };

    // Attributes with allocation buttons.
    const attrRows = PRIMARY_STATS.map((id) => {
      const plus = el('button', { class: 'tiny', 'aria-label': `Add a point to ${content.stats.get(id).name}` }, '+');
      plus.disabled = p.attributePoints <= 0;
      plus.addEventListener('click', (e) => {
        s.allocate(id, e.shiftKey ? Math.min(5, p.attributePoints) : 1);
        this.render();
      });
      const row = el(
        'div',
        { class: 'stat-row attr' },
        el('span', {}, content.stats.get(id).name),
        el('b', {}, String(stats[id])),
        el('span', { class: 'dim small' }, p.allocated[id] > 0 ? `(+${p.allocated[id]})` : ''),
        plus,
      );
      attachTooltip(row, () => statBreakdownTooltip(id, breakdown[id], stats[id]));
      return row;
    });
    const respec = el('button', {}, `Respec (${respecCost(p)}g)`);
    respec.disabled = allocatedTotal(p) === 0 || s.state.gold < respecCost(p);
    respec.addEventListener('click', () => {
      s.respec();
      this.render();
    });

    const attributes = el(
      'section',
      { class: 'panel' },
      el('h3', {}, 'Attributes'),
      el('div', { class: p.attributePoints > 0 ? 'points-available' : 'dim' }, `${p.attributePoints} points to spend`, p.attributePoints > 0 ? el('span', { class: 'dim small' }, ' (shift-click: +5)') : ''),
      ...attrRows,
      respec,
    );

    const derived = GROUPS.map(([title, ids]) => el('section', { class: 'panel' }, el('h3', {}, title), ...ids.map(statRow)));

    const elemental = el(
      'section',
      { class: 'panel' },
      el('h3', {}, 'Elements'),
      el('div', { class: 'element-table' },
        el('span', { class: 'dim' }, ''), el('span', { class: 'dim' }, 'Damage'), el('span', { class: 'dim' }, 'Resist'),
        ...ELEMENTS.flatMap((e) => [
          el('span', {}, content.elements.get(e).name),
          el('b', {}, formatStat(`${e}Damage`, stats[`${e}Damage`])),
          el('b', {}, formatStat(`${e}Resist`, stats[`${e}Resist`])),
        ]),
      ),
    );

    const classes = el(
      'section',
      { class: 'panel' },
      el('h3', {}, 'Classes'),
      ...p.classes.map((cp) => {
        const cls = content.classes.get(cp.classId);
        return el(
          'div',
          { class: 'class-row' },
          el('div', {}, el('b', { style: `color:${cls.color}` }, cls.name), ` · ${cp.slot} · level ${cp.level}`),
          bar(cp.level >= s.state.levelCap ? 1 : cp.xp / xpToNext(cp.level), 'xp thin', `${cp.skillPoints} skill points`),
          el('div', { class: 'dim small' }, cls.mechanic.name + ': ' + cls.mechanic.description),
        );
      }),
    );

    const skills = el(
      'section',
      { class: 'panel' },
      el('h3', {}, 'Skills'),
      ...Object.entries(p.skills).map(([id, rank]) => skillCard(content.skills.get(id), rank)),
      el('h3', {}, `Racial: ${race.passive.name}`),
      el('p', { class: 'small' }, race.passive.description),
    );

    const paragon = el('section', { class: 'panel' }, el('h3', {}, 'Paragon Board'));
    if (!atCap) {
      paragon.append(el('p', { class: 'dim small' }, `Unlocks at level ${s.state.levelCap}. Every level beyond the cap grants a paragon point.`));
    } else {
      paragon.append(el('div', { class: p.paragonPoints > 0 ? 'points-available' : 'dim' }, `${p.paragonPoints} paragon points`));
      for (const node of content.paragon.all()) {
        const rank = paragonRank(p, node.id);
        const plus = el('button', { class: 'tiny', 'aria-label': `Spend a point on ${node.name}` }, '+');
        plus.disabled = p.paragonPoints <= 0 || rank >= node.maxRank;
        plus.addEventListener('click', () => {
          s.spendParagon(node.id);
          this.render();
        });
        const row = el('div', { class: 'stat-row attr' }, el('span', {}, node.name), el('b', {}, `${rank}/${node.maxRank}`), el('span', {}, ''), plus);
        attachTooltip(row, () => node.description);
        paragon.append(row);
      }
    }

    this.root.replaceChildren(
      el(
        'div',
        { class: 'sheet' },
        header,
        el(
          'div',
          { class: 'sheet-body' },
          el('div', { class: 'sheet-col' }, attributes, elemental),
          el('div', { class: 'sheet-col' }, ...derived),
          el('div', { class: 'sheet-col' }, classes, skills, paragon),
        ),
      ),
    );
  };
}
