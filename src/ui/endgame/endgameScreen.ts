import { content } from '../../data';
import { RIFTS } from '../../data/rifts';
import { countHeld } from '../../engine/items/inventory';
import { DIVINE_TRIALS, LEAGUE, SPIRE, WEEKLY } from '../../data/endgameModes';
import { BOSS_RUSH, EndgameActions } from '../../engine/state/endgameActions';
import type { GameSession } from '../../engine/state/gameState';
import { navBar, type Nav } from '../components/navBar';
import { el, type Screen } from '../screen';

/**
 * The Rift Gate and the Boss Rush: open a Rift of any tier you have
 * reached (with a Rift Map), start the Boss Rush, and follow the run in
 * progress wave by wave.
 */
export class EndgameScreen implements Screen {
  private root: HTMLElement | undefined;
  private offs: (() => void)[] = [];
  private tier: number;
  private message = '';

  constructor(
    private readonly session: GameSession,
    private readonly nav: Nav,
    private readonly fight: () => void,
    private readonly back: () => void,
  ) {
    this.tier = session.endgame.maxRiftTier();
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

  private btn(label: string, run: () => void, disabled = false, cls = ''): HTMLButtonElement {
    const b = el('button', cls ? { class: cls } : {}, label) as HTMLButtonElement;
    b.disabled = disabled;
    b.addEventListener('click', run);
    return b;
  }

  private say(result: { ok: boolean; reason?: string }): void {
    this.message = result.ok ? '' : (result.reason ?? '');
    this.render();
  }

  private run(): HTMLElement {
    const s = this.session;
    const a = s.endgame.active;
    if (!a) return el('section', { class: 'panel' }, el('h2', {}, 'No run in progress'), el('p', { class: 'dim small' }, 'Open a Rift or start the Boss Rush.'));
    const next = a.fights[a.wave];
    const rows = a.fights.map((f, i) => el('div', { class: `trial-stage${i < a.wave ? ' done' : ''}` }, el('b', {}, f.encounter.name), el('div', { class: 'dim small' }, i < a.wave ? 'Beaten' : i === a.wave ? `Next · level ${f.level}` : `Level ${f.level}`)));
    return el(
      'section',
      { class: 'panel' },
      el('h2', {}, { rift: `Rift tier ${a.tier}`, bossRush: 'The Boss Rush', spire: `The Endless Spire: floor ${a.floor ?? 1}`, divine: `${DIVINE_TRIALS.find((t) => t.god === a.god)?.name ?? 'A Divine Trial'}`, league: 'The Arena Champions league', weekly: `Weekly run ${a.seed ?? ''}` }[a.kind]),
      el('div', { class: 'small' }, `Fight ${a.wave + 1} of ${a.fights.length} · ${a.turns} turns so far${a.gold ? ` · ${a.gold} gold won` : ''}`),
      ...(a.affixes.length ? [el('h3', {}, 'Rift affixes'), ...a.affixes.map((id) => { const d = content.riftAffixes.get(id); return el('div', { class: 'small' }, el('b', {}, d.name), ` ${d.description}`); })] : []),
      el('p', { class: 'dim small' }, a.kind === 'rift' ? `No rest between fights: only ${RIFTS.respitePct}% of HP and MP comes back between waves. Fall or flee and the Rift closes.` : 'No rest between bosses: HP and MP carry over. Fall and the Rush ends; your best is kept.'),
      el('div', { class: 'trial-grid' }, ...rows),
      el('div', { class: 'row wrap' }, this.btn(next ? `Fight: ${next.encounter.name}` : 'Continue', () => this.fight(), !next, 'primary'), a.kind === 'spire' ? this.btn('Leave the Spire', () => this.say(s.endgame.leaveSpire())) : this.btn('Abandon the run', () => this.say(s.endgame.abandon()), false, 'danger')),
    );
  }

  private rifts(): HTMLElement {
    const s = this.session;
    const max = s.endgame.maxRiftTier();
    this.tier = Math.min(this.tier, max);
    const pick = el('select', { 'aria-label': 'Rift tier' }) as HTMLSelectElement;
    for (let t = 1; t <= max; t++) pick.append(el('option', { value: String(t) }, `Tier ${t} · level ${s.endgame.riftLevel(t)} · ${s.endgame.affixCount(t)} affix${s.endgame.affixCount(t) === 1 ? '' : 'es'}`));
    pick.value = String(this.tier);
    pick.addEventListener('change', () => {
      this.tier = Number(pick.value);
      this.render();
    });
    const check = s.endgame.canOpenRift(this.tier);
    const e = s.state.endgame;
    return el(
      'section',
      { class: 'panel' },
      el('h2', {}, 'Rift Gate'),
      el('p', { class: 'small' }, `${RIFTS.waves} waves drawn from every zone, then a Rift Guardian. Each tier adds ${RIFTS.threatPerTier}% enemy HP and damage and better loot (+${RIFTS.magicFindPerTier}% Magic Find per tier); from tier ${RIFTS.affixTiers[0]} the Rift rolls affixes, from tier ${RIFTS.worldBossTier} world bosses guard it, and from tier ${RIFTS.primordialTier} its Guardian can drop Primordial items. Clearing a tier opens the next, up to ${RIFTS.maxTier}.`),
      el('div', { class: 'small' }, `Highest tier cleared: ${e.riftTier} · Rifts cleared: ${e.riftsCleared} · Rift Maps: ${countHeld(s.state, 'rift-map')}`),
      pick,
      this.btn(`Open a tier ${this.tier} Rift`, () => this.say(s.endgame.openRift(this.tier)), !check.ok, 'primary'),
      ...(check.ok ? [] : [el('div', { class: 'dim small' }, check.reason)]),
    );
  }

  private bossRush(): HTMLElement {
    const s = this.session;
    const r = s.state.endgame.bossRush;
    const check = s.endgame.canStartBossRush();
    return el(
      'section',
      { class: 'panel' },
      el('h2', {}, 'The Boss Rush'),
      el('p', { class: 'small' }, `All ${content.dungeons.size} dungeon bosses in road order, at your level, one after another. A full clear pays ${BOSS_RUSH.goldPerLevel} gold per level.`),
      el('div', { class: 'small' }, `Best: ${r.best} of ${content.dungeons.size}${r.bestTurns !== undefined ? ` · fastest clear ${r.bestTurns} turns` : ''} · clears: ${r.clears}`),
      this.btn('Start the Boss Rush', () => this.say(s.endgame.startBossRush()), !check.ok, 'primary'),
      ...(check.ok ? [] : [el('div', { class: 'dim small' }, check.reason)]),
    );
  }

  private spire(): HTMLElement {
    const s = this.session;
    const check = s.endgame.canStartSpire();
    return el('section', { class: 'panel' }, el('h2', {}, 'The Endless Spire'),
      el('p', { class: 'small' }, `Floors without end, one fight each, ${SPIRE.threatPerFloor}% harder every floor. A guardian waits every ${SPIRE.guardianEvery}th floor, and every ${SPIRE.affixEvery}th floor adds a twist (up to ${SPIRE.maxAffixes}). Fall and the run ends; leave standing and you keep what you won.`),
      el('div', { class: 'small' }, `Deepest floor: ${s.state.endgame.spire.best} · runs: ${s.state.endgame.spire.runs}`),
      this.btn('Climb the Spire', () => this.say(s.endgame.startSpire()), !check.ok, 'primary'), ...(check.ok ? [] : [el('div', { class: 'dim small' }, check.reason)]));
  }

  private divine(): HTMLElement {
    const s = this.session;
    const e = s.state.endgame;
    return el('section', { class: 'panel' }, el('h2', {}, 'The Divine Trials'),
      el('p', { class: 'small' }, 'Each god tests you in person: one fight against their Aspect, with a theme of its own. A god must have taken notice of you (Acknowledged favor). Pass all fourteen to be called Trialsworn.'),
      el('div', { class: 'small' }, `Passed: ${DIVINE_TRIALS.filter((t) => (e.divine[t.god]?.clears ?? 0) > 0).length} of ${DIVINE_TRIALS.length}`),
      ...DIVINE_TRIALS.map((t) => {
        const check = s.endgame.canStartDivine(t.god);
        const done = (e.divine[t.god]?.clears ?? 0) > 0;
        return el('div', { class: 'board-row' }, el('b', {}, `${done ? '✓ ' : ''}${t.name}`), el('div', { class: 'dim small' }, check.ok ? t.description : check.reason), this.btn('Face the Aspect', () => this.say(s.endgame.startDivine(t.god)), !check.ok));
      }));
  }

  private league(): HTMLElement {
    const s = this.session;
    const l = s.state.endgame.league;
    const check = s.endgame.canStartLeague();
    return el('section', { class: 'panel' }, el('h2', {}, 'The Arena Champions League'),
      el('p', { class: 'small' }, `A season is ${LEAGUE.fightsPerSeason} champions, the arena's mentors, one after another. Win the season to climb: ${LEAGUE.ranks.slice(1).join(', ')}.`),
      el('div', { class: 'small' }, `Rank: ${LEAGUE.ranks[l.rank]} · seasons won: ${l.seasons} · champions beaten: ${l.fights}`),
      this.btn('Begin a season', () => this.say(s.endgame.startLeague()), !check.ok, 'primary'), ...(check.ok ? [] : [el('div', { class: 'dim small' }, check.reason)]));
  }

  private weekly(): HTMLElement {
    const s = this.session;
    const seed = EndgameActions.weeklySeed(new Date());
    const w = s.state.endgame.weekly;
    const check = s.endgame.canStartWeekly();
    const mine = w.seed === seed ? w : undefined;
    return el('section', { class: 'panel' }, el('h2', {}, `Weekly run ${seed}`),
      el('p', { class: 'small' }, `${WEEKLY.fights} fights and ${WEEKLY.affixes} twists, the same for everyone this week. Clear it for ${WEEKLY.goldPerLevel} gold a level and ${WEEKLY.riftMaps} Rift Maps (once a week).`),
      el('div', { class: 'small' }, mine ? `This week: ${mine.best} of ${WEEKLY.fights} fights${mine.best ? ` in ${mine.bestTurns} turns` : ''}${mine.claimed ? ' · prize claimed' : ''}` : 'Not yet attempted this week.'),
      this.btn('Start the weekly run', () => this.say(s.endgame.startWeekly(seed)), !check.ok, 'primary'), ...(check.ok ? [] : [el('div', { class: 'dim small' }, check.reason)]));
  }

  private render = (): void => {
    if (!this.root) return;
    const s = this.session;
    this.root.replaceChildren(
      el(
        'div',
        { class: 'sheet' },
        navBar(s, this.nav, 'world'),
        el(
          'div',
          { class: 'codex-scroll' },
          ...(this.message ? [el('div', { class: 'field-error' }, this.message)] : []),
          s.endgame.active ? this.run() : el('div', { class: 'codex-grid' }, this.rifts(), this.bossRush(), this.spire(), this.league(), this.weekly(), this.divine()),
          this.btn('Back to town', () => this.back()),
        ),
      ),
    );
  };
}
