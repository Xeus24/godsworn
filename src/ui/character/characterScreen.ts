import { canStartNgPlus, startNgPlus } from '../../engine/ngplus/ngplus';
import { content } from '../../data';
import { endgameUnlocked } from '../../engine/endgame/unlocked';
import { difficultyIndex } from '../../data/difficulty';
import { allocatedTotal, respecCost } from '../../engine/character/attributes';
import { paragonRank } from '../../engine/character/paragon';
import { levelProgress, xpToNext } from '../../engine/character/progression';
import { characterStatsDetailed } from '../../engine/character/stats';
import { MULTICLASS } from '../../data/progression';
import { rankOf, repOf } from '../../engine/world/factions';
import { masteryPointsEarned } from '../../engine/skills/treeOwners';
import { availablePoints, earnedPoints, knownSkills, masteryPointsLeft } from '../../engine/skills/tree';
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

/** Preset splits for two classes (primary share), or an even split for three. */
function splitPresets(count: number): number[][] {
  return count === 2 ? MULTICLASS.splitPresets.map((pr) => [pr, 100 - pr]) : [[34, 33, 33], [50, 25, 25], [25, 50, 25], [25, 25, 50]];
}

export class CharacterScreen implements Screen {
  private root: HTMLElement | undefined;
  private offs: (() => void)[] = [];
  private confirmNgPlus = false;

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
          bar(cp.level >= s.state.levelCap ? 1 : cp.xp / xpToNext(cp.level), 'xp thin', `${availablePoints(p, cp.classId)} of ${cp.skillPoints} skill points unspent`),
          el('div', { class: 'dim small' }, cls.mechanic.name + ': ' + cls.mechanic.description),
          ...(cp.slot === 'primary' && cls.trait ? [el('div', { class: 'dim small' }, `Trait, ${cls.trait.name}: ${cls.trait.description}`)] : []),
          ...(cp.slot !== 'primary' ? [el('div', { class: 'small' }, `${masteryPointsLeft(p, cp.classId)} of ${masteryPointsEarned(p, cp.classId)} Mastery Points free (for keystones and capstones)`)] : []),
        );
      }),
      ...p.hybrids.map((id) => {
        const h = content.hybrids.get(id);
        return el('div', { class: 'class-row' }, el('div', {}, el('b', {}, h.name), ' · hybrid'), el('div', { class: 'dim small' }, `${availablePoints(p, id)} of ${earnedPoints(p, id)} hybrid points unspent`));
      }),
      ...(p.classes.length > 1 ? [this.xpSplitPanel()] : []),
    );

    const late = endgameUnlocked(s.state);
    const own = s.player.stable.pets.length + s.player.stable.mounts.length > 0;
    const skills = el(
      'section',
      { class: 'panel' },
      el('h3', {}, 'Skills'),
      ...knownSkills(p).map((k) => skillCard(content.skills.get(k.id), k.rank)),
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
        const locked = node.minDifficulty !== undefined && difficultyIndex(p.difficulty) < difficultyIndex(node.minDifficulty);
        plus.disabled = locked || p.paragonPoints <= 0 || rank >= node.maxRank;
        plus.addEventListener('click', () => {
          s.spendParagon(node.id);
          this.render();
        });
        const row = el('div', { class: locked ? 'stat-row attr dim' : 'stat-row attr' }, el('span', {}, locked ? `${node.name} 🔒` : node.name), el('b', {}, `${rank}/${node.maxRank}`), el('span', {}, ''), plus);
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
          el('div', { class: 'sheet-col' }, this.titles(), ...(late || own ? [this.stable()] : []), ...(late ? [this.legacy()] : []), classes, this.reputation(), skills, ...(late ? [paragon] : [])),
        ),
      ),
    );
  };

  /** XP split presets and the focus toggle (shown with two or more classes). */
  private xpSplitPanel(): HTMLElement {
    const s = this.session;
    const p = s.player;
    const names = p.classes.map((cp) => content.classes.get(cp.classId).name);
    const focus = p.xpMode === 'focus';
    const buttons = splitPresets(p.classes.length).map((w) => {
      const active = !focus && w.every((v, i) => v === p.xpSplit[i]);
      const b = el('button', { class: `tab${active ? ' active' : ''}` }, w.join(' / '));
      b.addEventListener('click', () => s.multiclass.setSplit(w));
      return b;
    });
    const focusBtn = el('button', { class: `tab${focus ? ' active' : ''}` }, 'Focus');
    focusBtn.addEventListener('click', () => s.multiclass.setMode(focus ? 'split' : 'focus'));
    attachTooltip(focusBtn, () => 'All class XP goes to your lowest-level class until it catches up.');
    return el(
      'div',
      { class: 'xp-split' },
      el('h3', {}, 'Class XP split'),
      el('div', { class: 'dim small' }, `${names.join(' / ')}. Character level always gets all XP.`),
      el('div', { class: 'tabs' }, ...buttons, focusBtn),
    );
  }

  /** Faction standing (and house, if any). */
  /** New Game+: your tier, endings reached, and starting the next playthrough (two clicks). */
  private legacy(): HTMLElement {
    const s = this.session;
    const check = canStartNgPlus(s);
    const label = check.ok ? `Begin New Game+${check.tier}` : 'Begin New Game+';
    const begin = el('button', { class: 'primary' }, label);
    begin.disabled = !check.ok;
    begin.title = check.ok ? 'The story starts over. You keep your hero, gear, companions and achievements; the world rises to levels 60-80.' : check.reason;
    begin.addEventListener('click', () => {
      if (!this.confirmNgPlus) {
        this.confirmNgPlus = true;
        begin.textContent = `Really begin NG+${check.ok ? check.tier : ''}? Click again`;
        return;
      }
      this.confirmNgPlus = false;
      startNgPlus(s);
      this.render();
    });
    const endings = s.state.legacy.endings.map((e) => content.endings.find(e.split(':')[0] ?? '')?.name ?? e);
    return el(
      'section',
      { class: 'panel' },
      el('h3', {}, 'Legacy'),
      el('div', { class: 'small' }, s.state.ngPlus > 0 ? `New Game+${s.state.ngPlus} · level cap ${s.state.levelCap}` : 'First playthrough'),
      ...(endings.length ? [el('div', { class: 'dim small' }, `Endings reached before: ${endings.join(', ')}`)] : []),
      begin,
      ...(check.ok ? [] : [el('div', { class: 'dim small' }, check.reason)]),
    );
  }

  /** The pet out with you and the mount you ride. */
  private stable(): HTMLElement {
    const s = this.session;
    const st = s.player.stable;
    const pick = (label: string, owned: string[], current: string | undefined, name: (id: string) => string, set: (id: string | undefined) => void): HTMLSelectElement => {
      const sel = el('select', { 'aria-label': label }) as HTMLSelectElement;
      sel.append(el('option', { value: '' }, `(no ${label.toLowerCase()})`), ...owned.map((id) => el('option', { value: id }, name(id))));
      sel.value = current ?? '';
      sel.disabled = owned.length === 0;
      sel.addEventListener('change', () => {
        set(sel.value || undefined);
        this.render();
      });
      return sel;
    };
    const pet = st.pet ? content.pets.get(st.pet) : undefined;
    const mount = st.mount ? content.mounts.get(st.mount) : undefined;
    return el(
      'section',
      { class: 'panel' },
      el('h3', {}, 'Pet & Mount'),
      pick('Pet', st.pets, st.pet, (id) => content.pets.get(id).name, (id) => s.world.setPet(id)),
      el('div', { class: 'dim small' }, pet ? pet.description : 'Pets come from achievements and, rarely, from Rift Guardians.'),
      pick('Mount', st.mounts, st.mount, (id) => content.mounts.get(id).name, (id) => s.world.setMount(id)),
      el('div', { class: 'dim small' }, mount ? `${mount.description} ${mount.stepMinutes} min per step, ${Math.round((1 - mount.encounterMult) * 100)}% fewer ambushes.` : 'Buy a mount at a town’s stables, or earn one.'),
    );
  }

  /** Pick the earned title shown beside your name. */
  private titles(): HTMLElement {
    const s = this.session;
    const owned = s.achievements.titles();
    const pick = el('select', { 'aria-label': 'Title' }) as HTMLSelectElement;
    pick.append(el('option', { value: '' }, '(no title)'), ...owned.map((t) => el('option', { value: t }, t)));
    pick.value = s.player.title ?? '';
    pick.disabled = owned.length === 0;
    pick.addEventListener('change', () => {
      s.achievements.setTitle(pick.value || undefined);
      this.render();
    });
    return el(
      'section',
      { class: 'panel' },
      el('h3', {}, 'Title'),
      pick,
      el('div', { class: 'dim small' }, owned.length ? `${owned.length} title${owned.length === 1 ? '' : 's'} earned. Earn more from achievements, quests and Apostleship (Codex, B).` : 'Earn titles from achievements, quests and Apostleship (Codex, B).'),
    );
  }

  private reputation(): HTMLElement {
    const p = this.session.player;
    const rows = content.factions.all().map((f) => {
      const rep = repOf(p, f.id);
      const rank = rep < 0 ? 'Hostile' : (rankOf(f, rep)?.name ?? 'Stranger');
      return el('div', { class: 'class-row small' }, el('b', {}, f.name), ` · ${rank} (${Math.floor(rep)})`);
    });
    const house = p.world.house;
    return el(
      'section',
      { class: 'panel' },
      el('h3', {}, 'Reputation'),
      ...rows,
      el('div', { class: 'dim small' }, house ? `House in ${content.towns.get(house.town).name}` : 'No house yet.'),
    );
  }
}
