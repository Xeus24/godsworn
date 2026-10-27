import { content } from '../../data';
import { RIFTS } from '../../data/rifts';
import { countHeld } from '../../engine/items/inventory';
import { BOSS_RUSH } from '../../engine/state/endgameActions';
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
      el('h2', {}, a.kind === 'rift' ? `Rift tier ${a.tier}` : 'The Boss Rush'),
      el('div', { class: 'small' }, `Fight ${a.wave + 1} of ${a.fights.length} · ${a.turns} turns so far${a.gold ? ` · ${a.gold} gold won` : ''}`),
      ...(a.affixes.length ? [el('h3', {}, 'Rift affixes'), ...a.affixes.map((id) => { const d = content.riftAffixes.get(id); return el('div', { class: 'small' }, el('b', {}, d.name), ` ${d.description}`); })] : []),
      el('p', { class: 'dim small' }, a.kind === 'rift' ? `No rest between fights: only ${RIFTS.respitePct}% of HP and MP comes back between waves. Fall or flee and the Rift closes.` : 'No rest between bosses: HP and MP carry over. Fall and the Rush ends; your best is kept.'),
      el('div', { class: 'trial-grid' }, ...rows),
      el('div', { class: 'row wrap' }, this.btn(next ? `Fight: ${next.encounter.name}` : 'Continue', () => this.fight(), !next, 'primary'), this.btn('Abandon the run', () => this.say(s.endgame.abandon()), false, 'danger')),
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
          s.endgame.active ? this.run() : el('div', { class: 'codex-grid' }, this.rifts(), this.bossRush()),
          this.btn('Back to town', () => this.back()),
        ),
      ),
    );
  };
}
