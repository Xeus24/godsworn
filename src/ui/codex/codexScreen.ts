import { content } from '../../data';
import { ACHIEVEMENT_MILESTONES } from '../../data/achievements';
import { ACHIEVEMENT_CATEGORIES } from '../../data/achievements';
import { BESTIARY } from '../../data/bestiary/bestiary';
import { killsByType, knowledgeLevel, knowledgeName, knowledgeThresholds, slayerRank, slayerTypes, typeName } from '../../engine/bestiary/bestiary';
import { scaleCombatStats } from '../../engine/combat/combatants';
import type { EnemyDef } from '../../engine/combat/types';
import type { GameSession, LifetimeStat } from '../../engine/state/gameState';
import { creatureSprite } from '../combat/creatureSprites';
import { navBar, type Nav } from '../components/navBar';
import { el, type Screen } from '../screen';

type Tab = 'bestiary' | 'achievements' | 'lore' | 'statistics';
const TABS: [Tab, string][] = [
  ['bestiary', 'Bestiary'],
  ['achievements', 'Achievements'],
  ['lore', 'Lore'],
  ['statistics', 'Statistics'],
];

const TIER_NAMES: Record<string, string> = { normal: 'Normal', elite: 'Elite', champion: 'Champion', miniboss: 'Miniboss', boss: 'Boss', worldBoss: 'World Boss', punisher: 'Divine Punisher' };

const STAT_ROWS: [LifetimeStat, string][] = [
  ['battlesWon', 'Battles won'],
  ['battlesLost', 'Battles lost'],
  ['battlesFled', 'Battles fled'],
  ['deaths', 'Deaths'],
  ['kills', 'Enemies slain'],
  ['elitesKilled', 'Elites slain'],
  ['championsKilled', 'Champions slain'],
  ['bossesKilled', 'Minibosses and bosses slain'],
  ['worldBossesKilled', 'World bosses slain'],
  ['punishersKilled', 'Divine punishers defeated'],
  ['enragedKilled', 'Enraged bosses slain'],
  ['interrupts', 'Boss attacks interrupted'],
  ['highestHit', 'Highest hit'],
  ['crits', 'Critical hits'],
  ['interventions', 'Divine interventions'],
  ['consumablesUsed', 'Consumables used in battle'],
  ['itemsLooted', 'Items picked up'],
  ['goldEarned', 'Gold earned'],
  ['goldSpent', 'Gold spent'],
];

/** Enemies the bestiary lists: everything you could fight, mentors, followers and summons aside. */
function listedEnemies(): EnemyDef[] {
  return content.enemies.filter((e) => !e.types.includes('mentor') && !e.types.includes('follower')).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

/** A fresh copy of the creature's cached sprite; unmet creatures are a dark silhouette. */
function spriteIcon(e: EnemyDef, cls: string, known: boolean): HTMLCanvasElement {
  const src = creatureSprite(e.family, e.palette.main, e.palette.accent);
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  c.className = `${cls} pixel${known ? '' : ' silhouette'}`;
  c.getContext('2d')?.drawImage(src, 0, 0);
  return c;
}

/**
 * The Codex (B): the bestiary (what you know of each enemy, Slayer ranks),
 * achievements and titles, the lore pages you found, and lifetime
 * statistics.
 */
export class CodexScreen implements Screen {
  private root: HTMLElement | undefined;
  private offs: (() => void)[] = [];
  private tab: Tab = 'bestiary';
  private selected: string | undefined;
  private filter = '';

  constructor(
    private readonly session: GameSession,
    private readonly nav: Nav,
  ) {}

  mount(root: HTMLElement): void {
    this.root = root;
    this.offs.push(this.session.bus.on('stateChanged', () => this.render()));
    this.render();
  }

  unmount(): void {
    for (const off of this.offs) off();
    this.offs = [];
  }

  private render = (): void => {
    if (!this.root) return;
    const tabs = el('nav', { class: 'tabs codex-tabs' }, ...TABS.map(([id, label]) => {
      const b = el('button', { class: `tab${this.tab === id ? ' active' : ''}` }, label);
      b.addEventListener('click', () => {
        this.tab = id;
        this.render();
      });
      return b;
    }));
    const body = this.tab === 'bestiary' ? this.bestiary() : this.tab === 'achievements' ? this.achievements() : this.tab === 'lore' ? this.lore() : this.statistics();
    this.root.replaceChildren(el('div', { class: 'sheet' }, navBar(this.session, this.nav, 'codex'), tabs, body));
  };

  // ---------------------------------------------------------------- bestiary

  private bestiary(): HTMLElement {
    const p = this.session.player;
    const all = listedEnemies();
    const met = all.filter((e) => p.bestiary[e.id] !== undefined);
    const types = slayerTypes();
    const shown = all.filter((e) => !this.filter || e.types.includes(this.filter));
    const filter = el('select', { 'aria-label': 'Creature type' }) as HTMLSelectElement;
    filter.append(el('option', { value: '' }, 'All creatures'), ...types.map((t) => el('option', { value: t }, typeName(t))));
    filter.value = this.filter;
    filter.addEventListener('change', () => {
      this.filter = filter.value;
      this.render();
    });
    const rows = shown.map((e) => {
      const level = knowledgeLevel(p, e);
      const known = level >= 0;
      const b = el(
        'button',
        { class: `quest-row${this.selected === e.id ? ' active' : ''}${known ? '' : ' dim'}` },
        el('span', { class: 'codex-name' }, spriteIcon(e, 'codex-icon', known), el('span', {}, known ? e.name : '???')),
        el('span', { class: 'dim small' }, known ? `${knowledgeName(level)}${level >= 4 ? ' ★' : ''}` : `Lv ${e.level}`),
      );
      b.addEventListener('click', () => {
        this.selected = e.id;
        this.render();
      });
      return b;
    });
    const selected = this.selected ? content.enemies.find(this.selected) : undefined;
    return el(
      'div',
      { class: 'quest-body' },
      el(
        'section',
        { class: 'panel quest-list' },
        el('h2', {}, 'Bestiary'),
        el('div', { class: 'dim small' }, `${met.length} of ${all.length} met · ${met.filter((e) => knowledgeLevel(p, e) >= 4).length} mastered`),
        filter,
        ...rows,
      ),
      el('div', { class: 'quest-detail' }, selected ? this.entry(selected) : el('section', { class: 'panel dim' }, 'Select a creature.'), this.slayer()),
    );
  }

  private entry(e: EnemyDef): HTMLElement {
    const p = this.session.player;
    const level = knowledgeLevel(p, e);
    if (level < 0) return el('section', { class: 'panel' }, el('div', { class: 'codex-preview' }, spriteIcon(e, 'codex-art', false)), el('h2', {}, '???'), el('p', { class: 'dim' }, `Not yet met. Found around level ${e.level}.`));
    const kills = p.bestiary[e.id] ?? 0;
    const next = knowledgeThresholds(e).find((t) => kills < t);
    const parts: HTMLElement[] = [
      el('div', { class: 'codex-preview' }, spriteIcon(e, 'codex-art', true)),
      el('h2', {}, e.name),
      el('div', { class: 'dim small' }, `${TIER_NAMES[e.tier] ?? e.tier} · level ${e.level} · ${e.types.map(typeName).join(', ')}`),
      el('p', { class: 'small' }, e.description),
      el('div', { class: 'small' }, `Slain: ${kills}${next !== undefined ? ` · learn more at ${next}` : ' · mastered'}`),
    ];
    if (level >= 1) {
      const s = scaleCombatStats(e.stats, e.level, e.tier);
      parts.push(el('h3', {}, 'Stats (at its usual level)'), el('div', { class: 'small codex-stats' }, `HP ${s.hp} · Attack ${s.attack} · Magic ${s.magic} · Defense ${s.defense} · Magic Resist ${s.magicResist} · Speed ${s.speed}`));
    }
    if (level >= 2) {
      const res = Object.entries(e.resists ?? {}).filter(([, v]) => v !== 0);
      const weak = res.filter(([, v]) => (v ?? 0) < 0).map(([k, v]) => `${content.elements.get(k).name} ${v}%`);
      const strong = res.filter(([, v]) => (v ?? 0) > 0).map(([k, v]) => `${content.elements.get(k).name} +${v}%`);
      parts.push(el('h3', {}, 'Resistances'), el('div', { class: 'small' }, `Weak to: ${weak.join(', ') || 'nothing in particular'}`), el('div', { class: 'small' }, `Resists: ${strong.join(', ') || 'nothing in particular'}`));
    }
    if (level >= 3) {
      parts.push(el('h3', {}, 'Skills'), el('ul', { class: 'small' }, el('li', {}, `${e.basicAttack.name} (${content.elements.get(e.basicAttack.element).name})`), ...e.skills.map((k) => el('li', {}, `${content.skills.get(k.id).name}: ${content.skills.get(k.id).description}`))));
      const script = content.bossScripts.find(e.id);
      if (script) {
        parts.push(el('h3', {}, 'Battle plan'), el('ul', { class: 'small' }, ...script.telegraphs.map((t) => el('li', {}, `Winds up ${content.skills.get(t.skillId).name} every ${t.every} turns. Break it to interrupt, or Defend.`)), ...script.phases.map((ph) => el('li', {}, `At ${ph.hpPct}% HP: ${ph.name}${ph.adds?.length ? ` (calls ${ph.adds.map((a) => content.enemies.get(a).name).join(', ')})` : ''}.`))));
      }
    }
    if (level >= 4) parts.push(el('div', { class: 'small codex-mastered' }, '★ Mastered: you know everything there is to know about it.'));
    return el('section', { class: 'panel' }, ...parts);
  }

  private slayer(): HTMLElement {
    const byType = killsByType(this.session.player);
    const rows = slayerTypes().map((t) => {
      const kills = byType[t] ?? 0;
      const rank = slayerRank(kills);
      const next = BESTIARY.slayerRanks[rank];
      return el(
        'div',
        { class: `codex-slayer${rank ? '' : ' dim'}` },
        el('b', {}, typeName(t)),
        el('span', { class: 'small' }, `rank ${rank} (+${rank * BESTIARY.slayerDamagePerRank}% damage)`),
        el('span', { class: 'dim small' }, next !== undefined ? `${kills} / ${next}` : `${kills} · max`),
      );
    });
    return el('section', { class: 'panel' }, el('h3', {}, 'Slayer ranks'), el('div', { class: 'dim small' }, 'Every rank adds damage against that kind of creature.'), ...rows);
  }

  // ---------------------------------------------------------------- achievements

  private achievements(): HTMLElement {
    const s = this.session;
    const all = content.achievements.all();
    const earned = all.filter((a) => s.achievements.earned(a.id));
    const groups = ACHIEVEMENT_CATEGORIES.map((cat) => {
      const list = all.filter((a) => a.category === cat.id);
      return el(
        'section',
        { class: 'panel' },
        el('h3', {}, `${cat.name} (${list.filter((a) => s.achievements.earned(a.id)).length}/${list.length})`),
        ...list.map((a) => {
          const got = s.achievements.earned(a.id);
          const secret = a.hidden && !got;
          return el(
            'div',
            { class: `codex-achievement${got ? ' earned' : ''}` },
            el('span', { class: 'codex-check' }, got ? '★' : '☆'),
            el('div', {}, el('b', {}, secret ? '???' : a.name), el('div', { class: 'small' }, secret ? 'A hidden achievement.' : a.description), ...(a.title && !secret ? [el('div', { class: 'dim small' }, `Title: ${a.title}`)] : []), ...(got ? [el('div', { class: 'dim small' }, `Earned on day ${s.state.achievements[a.id]}`)] : [])),
            el('span', { class: 'dim small' }, `${a.points} pts`),
          );
        }),
      );
    });
    return el(
      'div',
      { class: 'codex-scroll' },
      this.milestones(),
      el('section', { class: 'panel' }, el('h2', {}, 'Achievements'), el('div', {}, `${earned.length} of ${all.length} earned · ${s.achievements.points()} points · ${s.achievements.titles().length} titles (choose one on the Character screen)`)),
      el('div', { class: 'codex-grid' }, ...groups),
    );
  }

  /** What achievement points do: the milestone bonuses, which are reached and which is next. */
  private milestones(): HTMLElement {
    const pts = this.session.player.achievementPoints ?? 0;
    const next = ACHIEVEMENT_MILESTONES.find((m) => pts < m.points);
    return el(
      'section',
      { class: 'panel' },
      el('h3', {}, 'What points do'),
      el('div', { class: 'dim small' }, `Every achievement gives points. Reach a milestone and you keep its bonus for good (they all stack). You have ${pts} points${next ? `; the next milestone is at ${next.points}.` : ', every milestone reached.'}`),
      ...ACHIEVEMENT_MILESTONES.map((m) => {
        const got = pts >= m.points;
        return el('div', { class: `codex-achievement${got ? ' earned' : ''}` }, el('span', { class: 'codex-check' }, got ? '★' : '☆'), el('div', {}, el('b', {}, `${m.points} points`), el('div', { class: 'small' }, m.description)), el('span', { class: 'dim small' }, got ? 'Active' : `${m.points - pts} to go`));
      }),
    );
  }

  // ---------------------------------------------------------------- lore

  private lore(): HTMLElement {
    const found = this.session.state.world.lore;
    return el(
      'div',
      { class: 'codex-scroll' },
      el('section', { class: 'panel' }, el('h2', {}, 'Lore'), el('div', {}, `${found.length} of ${content.lore.size} pages found. Look for them in every zone, some behind cracked walls.`)),
      el(
        'div',
        { class: 'codex-grid' },
        ...content.zones.all().map((z) =>
          el(
            'section',
            { class: 'panel' },
            el('h3', {}, z.name),
            ...content.lore.filter((l) => l.zone === z.id).map((l) => (found.includes(l.id) ? el('div', { class: 'codex-lore' }, el('b', {}, l.title), el('p', { class: 'small' }, l.text)) : el('div', { class: 'codex-lore dim' }, el('b', {}, '???'), el('p', { class: 'small' }, 'Not yet found.')))),
          ),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------- statistics

  private statistics(): HTMLElement {
    const s = this.session;
    const st = s.state.stats;
    const rarities = content.rarities.all().filter((r) => (s.state.rarityFound[r.id] ?? 0) > 0);
    return el(
      'div',
      { class: 'codex-scroll' },
      el(
        'div',
        { class: 'codex-grid' },
        el('section', { class: 'panel' }, el('h3', {}, 'Lifetime'), ...STAT_ROWS.map(([k, label]) => el('div', { class: 'codex-stat' }, el('span', {}, label), el('b', {}, st[k].toLocaleString())))),
        el(
          'section',
          { class: 'panel' },
          el('h3', {}, 'Journey'),
          el('div', { class: 'codex-stat' }, el('span', {}, 'Days on the road'), el('b', {}, String(s.state.clock.day))),
          el('div', { class: 'codex-stat' }, el('span', {}, 'Quests completed'), el('b', {}, String(Object.values(s.state.quests.completed).reduce((a, n) => a + n, 0)))),
          el('div', { class: 'codex-stat' }, el('span', {}, 'Dungeons cleared'), el('b', {}, `${s.state.world.dungeonsCleared.length} / ${content.dungeons.size}`)),
          el('div', { class: 'codex-stat' }, el('span', {}, 'Lore pages'), el('b', {}, `${s.state.world.lore.length} / ${content.lore.size}`)),
          el('div', { class: 'codex-stat' }, el('span', {}, 'Bestiary entries'), el('b', {}, `${Object.keys(s.player.bestiary).length} / ${listedEnemies().length}`)),
          el('div', { class: 'codex-stat' }, el('span', {}, 'Achievements'), el('b', {}, `${Object.keys(s.state.achievements).length} / ${content.achievements.size}`)),
          el('h3', {}, 'Items found by rarity'),
          ...(rarities.length ? rarities.map((r) => el('div', { class: 'codex-stat' }, el('span', { style: `color:${r.color}` }, r.name), el('b', {}, String(s.state.rarityFound[r.id])))) : [el('div', { class: 'dim small' }, 'Nothing yet.')]),
        ),
      ),
    );
  }
}
