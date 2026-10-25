import { audio } from '../audio/audio';
import { settings, updateSettings } from '../settings';
import { content } from '../../data';
import { chooseAction } from '../../engine/combat/ai';
import type { Battle } from '../../engine/combat/battle';
import { needsTarget, skillOptions, validTargets, type SkillOption } from '../../engine/combat/skills';
import { advance, perform, startBattle, timeline } from '../../engine/combat/turns';
import type { Action, BattleEvent, Combatant } from '../../engine/combat/types';
import { countOf, takeQuantity } from '../../engine/items/inventory';
import { itemName } from '../../engine/items/naming';
import { settleBattle, type BattleRewards } from '../../engine/state/battleResults';
import type { GameSession } from '../../engine/state/gameState';
import { itemIconUrl } from '../art/itemIcons';
import { attachTooltip, hideTooltip } from '../components/tooltip';
import { skillCostText } from '../format';
import { el, type Screen } from '../screen';
import { CombatScene } from './combatScene';

/** Base delay per event type at 1x speed, in ms. */
const EVENT_DELAY: Partial<Record<BattleEvent['type'], number>> = {
  action: 380,
  damage: 260,
  heal: 220,
  miss: 220,
  death: 300,
  break: 300,
  boss: 650,
  combo: 300,
  summon: 300,
  skip: 400,
  flee: 400,
  revive: 300,
  turn: 60,
};

type Menu = 'main' | 'skills' | 'items' | 'abilities';

interface Pending {
  label: string;
  candidates: Combatant[];
  build: (targetId: string) => Action;
}

export interface CombatScreenOptions {
  session: GameSession;
  battle: Battle;
  /** Called when the player leaves the results screen. */
  onExit: (rewards: BattleRewards) => void;
  onRematch?: () => void;
}

export class CombatScreen implements Screen {
  private readonly session: GameSession;
  private readonly battle: Battle;
  private scene: CombatScene;
  private queue: BattleEvent[] = [];
  private playing = false;
  private timer = 0;
  private speed: number = settings().battleSpeed;
  private auto = settings().autoBattle;
  private menu: Menu = 'main';
  private pending: Pending | undefined;
  private logLines: string[] = [];
  private finished = false;
  private rewards: BattleRewards | undefined;
  private keyHandler = (e: KeyboardEvent): void => this.onKey(e);

  private timelineNode = el('div', { class: 'combat-timeline' });
  private partyNode = el('div', { class: 'combat-party' });
  private commandNode = el('div', { class: 'combat-commands' });
  private logNode = el('div', { class: 'combat-log', 'aria-live': 'polite' });
  private overlay = el('div', { class: 'combat-overlay hidden' });

  constructor(private readonly opts: CombatScreenOptions) {
    this.session = opts.session;
    this.battle = opts.battle;
    this.scene = new CombatScene(this.battle);
    this.scene.onClick = (id) => this.pickTarget(id);
  }

  mount(root: HTMLElement): void {
    const speedBtns = [1, 2, 4].map((n) => {
      const b = el('button', { class: `tab${n === this.speed ? ' active' : ''}` }, `${n}×`);
      b.addEventListener('click', () => {
        this.speed = n;
        updateSettings({ battleSpeed: n as 1 | 2 | 4 });
        speedBtns.forEach((x, i) => x.classList.toggle('active', [1, 2, 4][i] === n));
      });
      return b;
    });
    const autoBtn = el('button', { class: `tab${this.auto ? ' active' : ''}` }, `Auto: ${this.auto ? 'on' : 'off'}`);
    autoBtn.addEventListener('click', () => {
      this.auto = !this.auto;
      updateSettings({ autoBattle: this.auto });
      autoBtn.textContent = `Auto: ${this.auto ? 'on' : 'off'}`;
      autoBtn.classList.toggle('active', this.auto);
      if (this.auto && this.battle.current && !this.playing) this.step();
    });
    const stage = el('div', { class: 'combat-stage' }, this.scene.canvas, this.overlay);
    root.append(
      el(
        'div',
        { class: 'combat-screen' },
        el('div', { class: 'combat-top' }, this.timelineNode, el('div', { class: 'tabs combat-controls' }, ...speedBtns, autoBtn)),
        stage,
        el('div', { class: 'combat-bottom' }, this.partyNode, this.commandNode, this.logNode),
      ),
    );
    window.addEventListener('keydown', this.keyHandler);
    this.scene.start();
    this.enqueue(startBattle(this.battle));
    this.step();
  }

  unmount(): void {
    this.scene.stop();
    clearTimeout(this.timer);
    window.removeEventListener('keydown', this.keyHandler);
  }

  // ---------------------------------------------------------- flow

  private enqueue(events: BattleEvent[]): void {
    this.queue.push(...events);
  }

  /** Plays queued events, then asks the next actor (player, AI or auto) for an action. */
  private step(): void {
    if (this.playing) return;
    if (this.queue.length > 0) {
      this.playNext();
      return;
    }
    this.scene.syncAll();
    if (this.battle.outcome !== 'ongoing') {
      this.finish();
      return;
    }
    if (!this.battle.current) {
      this.enqueue(advance(this.battle));
      this.render();
      this.step();
      return;
    }
    const x = this.battle.current;
    this.scene.actorId = x.id;
    if (this.battle.isPlayerControlled(x) && !this.auto) {
      this.menu = 'main';
      this.render();
      return;
    }
    this.render();
    this.timer = window.setTimeout(() => this.act(chooseAction(this.battle, x)), 250 / this.speed);
  }

  private playNext(): void {
    const e = this.queue.shift();
    if (!e) return;
    this.playing = true;
    this.scene.applyEvent(e);
    this.sound(e);
    const line = this.describe(e);
    if (line) this.addLog(line, e.type === 'boss');
    if (e.type === 'turn') this.scene.actorId = e.actorId;
    const delay = (EVENT_DELAY[e.type] ?? 90) / this.speed;
    this.timer = window.setTimeout(() => {
      this.playing = false;
      if (e.type === 'action' || e.type === 'death' || e.type === 'summon' || e.type === 'turn' || e.type === 'boss') this.renderPanels();
      this.step();
    }, delay);
  }

  private act(action: Action): void {
    const result = perform(this.battle, action);
    if (!result.ok) {
      if (this.battle.current && this.battle.isPlayerControlled(this.battle.current) && !this.auto) {
        this.addLog(result.reason);
        this.render();
        return;
      }
      // AI picked something invalid: defend instead so the fight continues.
      const fallback = perform(this.battle, { kind: 'defend', actorId: action.actorId });
      if (fallback.ok) this.enqueue(fallback.events);
    } else {
      this.enqueue(result.events);
    }
    this.pending = undefined;
    this.scene.targets.clear();
    this.menu = 'main';
    this.render();
    this.step();
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.scene.actorId = undefined;
    this.rewards = settleBattle(this.session, this.battle);
    this.render();
    this.showResults(this.rewards);
  }

  // ---------------------------------------------------------- input

  private onKey(e: KeyboardEvent): void {
    if (this.finished || !this.battle.current || !this.battle.isPlayerControlled(this.battle.current) || this.playing) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      this.pending = undefined;
      this.scene.targets.clear();
      this.menu = 'main';
      this.render();
      return;
    }
    const x = this.battle.current;
    const n = Number(e.key);
    if (this.pending || this.menu !== 'main') {
      // Inside a submenu or target list, numbers pick entries.
      if (Number.isInteger(n) && n >= 1 && n <= 9) {
        const buttons = [...this.commandNode.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
        buttons[n - 1]?.click();
      }
      return;
    }
    if (Number.isInteger(n) && n >= 1 && n <= 8) {
      const id = x.hotbar?.[n - 1];
      const o = id ? skillOptions(this.battle, x).find((opt) => opt.skill.id === id) : undefined;
      if (o?.check.ok) this.useSkillOption(x, o);
      return;
    }
    const key = e.key.toLowerCase();
    if (key === 'a') this.useSkillOption(x, skillOptions(this.battle, x)[0] as SkillOption);
    else if (key === 'd') this.act({ kind: 'defend', actorId: x.id });
    else if (key === 'f' && this.battle.canFlee && !this.battle.isBoss) this.act({ kind: 'flee', actorId: x.id });
    else if (key === 'p' && x.prayer && x.prayer.uses > 0 && !(x.cooldowns.pray ?? 0)) this.act({ kind: 'pray', actorId: x.id });
    else if (key === 'i') {
      this.menu = 'items';
      this.renderCommands();
    }
  }

  private requestTarget(label: string, candidates: Combatant[], build: (targetId: string) => Action): void {
    if (candidates.length === 0) {
      this.addLog('No valid targets.');
      return;
    }
    if (candidates.length === 1) {
      this.act(build((candidates[0] as Combatant).id));
      return;
    }
    this.pending = { label, candidates, build };
    this.scene.targets = new Set(candidates.map((c) => c.id));
    this.render();
  }

  private pickTarget(id: string): void {
    if (!this.pending || !this.scene.targets.has(id)) return;
    this.act(this.pending.build(id));
  }

  private useSkillOption(x: Combatant, o: SkillOption): void {
    const build = (targetId?: string): Action =>
      o.skill.id === 'basic-attack'
        ? { kind: 'attack', actorId: x.id, targetId: targetId ?? '' }
        : { kind: 'skill', actorId: x.id, skillId: o.skill.id, ...(targetId ? { targetId } : {}) };
    if (needsTarget(o.skill)) this.requestTarget(o.skill.name, validTargets(this.battle, x, o.skill), (t) => build(t));
    else this.act(build());
  }

  // ---------------------------------------------------------- rendering

  private render(): void {
    this.renderTimeline();
    this.renderPanels();
    this.renderCommands();
  }

  private renderTimeline(): void {
    const upcoming = this.battle.outcome === 'ongoing' ? timeline(this.battle, 10) : [];
    const current = this.battle.current;
    const order = current ? [current, ...upcoming.filter((u, i) => !(i === 0 && u === current))] : upcoming;
    this.timelineNode.replaceChildren(
      el('span', { class: 'dim small' }, 'Turn order:'),
      ...order.slice(0, 10).map((x, i) =>
        el('span', { class: `tl-chip ${x.side}${i === 0 ? ' now' : ''}`, title: x.name }, x.name.split(' ').map((w) => w[0]).join('').slice(0, 3)),
      ),
    );
  }

  private renderPanels(): void {
    const members = this.battle.combatants.filter((x) => x.side === 'party' && (x.kind === 'hero' || x.kind === 'companion'));
    this.partyNode.replaceChildren(
      ...members.map((x) => {
        const res = x.resourceId ? content.resources.get(x.resourceId) : undefined;
        const bar = (cls: string, value: number, max: number, label: string, color?: string): HTMLElement =>
          el(
            'div',
            { class: `bar ${cls}` },
            el('div', { class: 'bar-fill', style: `width:${Math.max(0, Math.min(1, value / Math.max(1, max))) * 100}%${color ? `;background:${color}` : ''}` }),
            el('span', { class: 'bar-label' }, label),
          );
        return el(
          'div',
          { class: `party-member${this.battle.current === x ? ' active' : ''}${x.alive ? '' : ' fallen'}` },
          el('div', { class: 'pm-name' }, x.name, x.stance ? el('span', { class: 'dim small' }, ` · ${content.stances.get(x.stance).name}`) : '', x.songs.length ? el('span', { class: 'dim small' }, ` · ♪ ${x.songs.map((s) => content.songs.get(s).name).join(', ')}`) : ''),
          bar('hp', x.hp, x.maxHp, `HP ${x.hp}/${x.maxHp}${x.shield ? ` (+${x.shield})` : ''}`),
          bar('mp', x.mp, x.maxMp, `MP ${x.mp}/${x.maxMp}`),
          ...(res ? [bar('thin', x.resources[res.id] ?? 0, res.max, `${res.name} ${Math.floor(x.resources[res.id] ?? 0)}/${res.max}`, res.color)] : []),
          bar('thin', x.ultimate, 100, x.ultimate >= 100 ? 'ULTIMATE READY' : `Ultimate ${Math.floor(x.ultimate)}%`, x.ultimate >= 100 ? '#ffd84a' : '#8a6bb0'),
        );
      }),
    );
  }

  private renderCommands(): void {
    const x = this.battle.current;
    const node = this.commandNode;
    if (this.finished || !x || !this.battle.isPlayerControlled(x) || this.auto) {
      node.replaceChildren(el('p', { class: 'dim small' }, this.auto && !this.finished ? 'Auto-battle is on.' : this.finished ? '' : 'Waiting…'));
      return;
    }
    if (this.pending) {
      const cancel = el('button', {}, 'Cancel (Esc)');
      cancel.addEventListener('click', () => {
        this.pending = undefined;
        this.scene.targets.clear();
        this.render();
      });
      const list = this.pending.candidates.map((c) => {
        const b = el('button', {}, `${c.name} (${c.hp}/${c.maxHp})`);
        b.addEventListener('click', () => this.pickTarget(c.id));
        return b;
      });
      node.replaceChildren(el('div', { class: 'cmd-title' }, `${this.pending.label}: choose a target`), el('div', { class: 'cmd-grid' }, ...list, cancel));
      return;
    }
    const btn = (label: string, run: () => void, disabled = false, tip?: () => HTMLElement | string): HTMLButtonElement => {
      const b = el('button', {}, label);
      b.disabled = disabled;
      b.addEventListener('click', () => {
        hideTooltip();
        run();
      });
      if (tip) attachTooltip(b, tip);
      return b;
    };
    const back = (): HTMLButtonElement => btn('← Back', () => ((this.menu = 'main'), this.renderCommands()));
    const options = skillOptions(this.battle, x);
    const title = el('div', { class: 'cmd-title' }, `${x.name}'s turn`);

    if (this.menu === 'skills') {
      const items = options
        .filter((o) => o.skill.id !== 'basic-attack')
        .map((o) =>
          btn(
            `${o.skill.ultimate ? '★ ' : x.skills.find((k) => k.id === o.skill.id)?.general ? '◇ ' : ''}${o.skill.name}${o.check.ok ? '' : ` (${o.check.reason})`}`,
            () => this.useSkillOption(x, o),
            !o.check.ok,
            () => el('div', {}, el('div', { class: 'tip-title' }, o.skill.name), el('div', {}, o.skill.description), el('div', { class: 'tip-desc' }, `${skillCostText(o.skill)}${o.skill.cooldown ? ` · ${o.skill.cooldown}-turn cooldown` : ''}`)),
          ),
        );
      node.replaceChildren(title, el('div', { class: 'cmd-grid' }, ...items, back()));
      return;
    }
    if (this.menu === 'items') {
      const inv = this.session.state.inventory;
      const ids = [...new Set(inv.slots.filter((s) => s && content.items.get(s.baseId).category === 'consumable').map((s) => s?.baseId as string))];
      const usable = ids.filter((id) => {
        const b = content.items.get(id);
        return b.category === 'consumable' && b.usableIn !== 'field';
      });
      const items = usable.map((id) => {
        const base = content.items.get(id);
        const count = countOf(inv, id);
        const b = btn(`${base.name} ×${count}`, () => this.chooseItem(x, id), count === 0, () => base.description ?? base.name);
        const any = inv.slots.find((s) => s?.baseId === id);
        if (any) b.prepend(el('img', { class: 'pixel cmd-icon', src: itemIconUrl(any), alt: '' }));
        return b;
      });
      node.replaceChildren(title, el('div', { class: 'cmd-grid' }, ...(items.length ? items : [el('p', { class: 'dim small' }, 'No usable items.')]), back()));
      return;
    }
    if (this.menu === 'abilities') {
      const items = x.abilities.map((a) => {
        const cd = x.cooldowns[`ability:${a.slot}`] ?? 0;
        return btn(`${a.name}${cd ? ` (${cd})` : ''}`, () => this.chooseAbility(x, a.slot), cd > 0, () => a.description);
      });
      node.replaceChildren(title, el('div', { class: 'cmd-grid' }, ...items, back()));
      return;
    }
    const attack = options[0] as SkillOption;
    const ultReady = x.ultimateSkill && x.ultimate >= 100;
    const hotbarButtons = (x.hotbar ?? []).map((id, i) => {
      const o = options.find((opt) => opt.skill.id === id);
      if (!o) return el('span', {});
      const b = btn(`${i + 1}. ${o.skill.name}${o.check.ok ? '' : ` (${o.check.reason})`}`, () => this.useSkillOption(x, o), !o.check.ok, () => el('div', {}, el('div', { class: 'tip-title' }, o.skill.name), el('div', {}, o.skill.description), el('div', { class: 'tip-desc' }, `${skillCostText(o.skill)}${o.skill.cooldown ? ` \u00b7 ${o.skill.cooldown}-turn cooldown` : ''}`)));
      b.classList.add('hotbar-btn');
      return b;
    });
    const ultimates = options.filter((o) => o.skill.ultimate && o.check.ok);
    node.replaceChildren(
      title,
      el('div', { class: 'cmd-hotbar' }, ...hotbarButtons, ...(ultReady ? ultimates.map((u) => btn(`\u2605 ${u.skill.name}`, () => this.useSkillOption(x, u))) : [])),
      el(
        'div',
        { class: 'cmd-grid' },
        btn(`Attack (${attack.skill.name})`, () => this.useSkillOption(x, attack)),
        btn(ultReady ? 'Skills ★' : 'Skills', () => ((this.menu = 'skills'), this.renderCommands())),
        btn('Items', () => ((this.menu = 'items'), this.renderCommands())),
        ...(x.abilities.length ? [btn('Abilities', () => ((this.menu = 'abilities'), this.renderCommands()))] : []),
        ...(x.prayer ? [this.prayButton(x, btn)] : []),
        btn('Defend (D)', () => this.act({ kind: 'defend', actorId: x.id }), false, () => 'Take half damage until your next turn and recover 5% MP.'),
        btn(`Swap to ${x.row === 'front' ? 'back' : 'front'} row`, () => this.act({ kind: 'swap', actorId: x.id }), false, () => 'Back row: take 25% less physical damage, but melee attacks need the front row.'),
        btn('Flee (F)', () => this.act({ kind: 'flee', actorId: x.id }), !this.battle.canFlee || this.battle.isBoss),
      ),
    );
  }

  private chooseItem(x: Combatant, itemId: string): void {
    const base = content.items.get(itemId);
    if (base.category !== 'consumable') return;
    const a = base.action;
    if (a.kind === 'revive') {
      const fallen = this.battle.combatants.filter((c) => c.side === x.side && !c.alive && c.kind !== 'summon');
      this.requestTarget(base.name, fallen, (t) => ({ kind: 'item', actorId: x.id, itemId, targetId: t }));
      return;
    }
    const targetsFoe = a.kind === 'effects' && a.effects.some((e) => 'target' in e && e.target === 'target');
    if (targetsFoe) {
      this.requestTarget(base.name, this.battle.opponents(x), (t) => ({ kind: 'item', actorId: x.id, itemId, targetId: t }));
      return;
    }
    this.act({ kind: 'item', actorId: x.id, itemId });
  }

  private chooseAbility(x: Combatant, slot: 'trinket' | 'relic'): void {
    const ability = x.abilities.find((a) => a.slot === slot);
    if (!ability) return;
    const single = ability.effects.some((e) => 'target' in e && e.target === 'target');
    if (single) this.requestTarget(ability.name, this.battle.opponents(x), (t) => ({ kind: 'ability', actorId: x.id, slot, targetId: t }));
    else this.act({ kind: 'ability', actorId: x.id, slot });
  }

  // ---------------------------------------------------------- log & results

  /** The sound of a battle event. */
  private sound(e: BattleEvent): void {
    const a = audio();
    if (e.type === 'damage' && !e.dot) a.play(e.crit ? 'crit' : 'hit');
    else if (e.type === 'heal') a.play('heal');
    else if (e.type === 'miss') a.play('miss');
    else if (e.type === 'death') a.play('death');
    else if (e.type === 'break') a.play('break');
    else if (e.type === 'boss') a.play('boss');
    else if (e.type === 'end') a.play(e.outcome === 'victory' ? 'victory' : 'defeat');
  }

  private name(id: string | undefined): string {
    return (id && this.battle.get(id)?.name) || '?';
  }

  private describe(e: BattleEvent): string | undefined {
    switch (e.type) {
      case 'action':
        return `${this.name(e.actorId)} uses ${e.label}.`;
      case 'damage':
        return `${this.name(e.targetId)} takes ${e.amount}${e.crit ? ' (critical!)' : ''}${e.dot ? ' over time' : ''}.`;
      case 'heal':
        return `${this.name(e.targetId)} recovers ${e.amount} HP.`;
      case 'miss':
        return `${this.name(e.sourceId)} misses ${this.name(e.targetId)}.`;
      case 'status':
        return e.statusId.startsWith('buff:') ? undefined : `${this.name(e.targetId)} ${e.on ? 'is afflicted with' : 'is no longer affected by'} ${content.statuses.find(e.statusId)?.name ?? e.statusId}.`;
      case 'resisted':
        return `${this.name(e.targetId)} resists ${content.statuses.find(e.statusId)?.name ?? e.statusId}.`;
      case 'death':
        return `${this.name(e.targetId)} falls!`;
      case 'summon':
        return `${this.name(e.combatantId)} joins the fight!`;
      case 'skip':
        return `${this.name(e.actorId)} loses the turn (${e.reason}).`;
      case 'combo':
        return `${e.name}!`;
      case 'chain':
        return `Chain x${e.count}!`;
      case 'flee':
        return e.success ? 'You escape!' : 'You fail to escape!';
      case 'log':
        return e.text;
      case 'boss':
        return e.moment === 'phase' ? `— ${this.name(e.actorId)}: ${e.title} — ${e.text}` : e.text;
      case 'end':
        return e.outcome === 'victory' ? 'Victory!' : e.outcome === 'defeat' ? 'Defeat…' : 'The battle is over.';
      default:
        return undefined;
    }
  }

  private addLog(line: string, important = false): void {
    this.logLines.push(line);
    if (this.logLines.length > 200) this.logLines.shift();
    const row = el('div', important ? { class: 'log-boss' } : {}, line);
    this.logNode.append(row);
    while (this.logNode.children.length > 200) this.logNode.firstElementChild?.remove();
    this.logNode.scrollTop = this.logNode.scrollHeight;
  }

  /** Pray to the patron: spends favor for the god's divine effect. */
  private prayButton(x: Combatant, btn: (label: string, run: () => void, disabled?: boolean, tip?: () => HTMLElement | string) => HTMLButtonElement): HTMLButtonElement {
    const p = x.prayer as NonNullable<Combatant['prayer']>;
    const cd = x.cooldowns.pray ?? 0;
    const god = content.gods.get(p.god);
    const label = `Pray (P): ${p.name}${cd ? ` (${cd})` : ''}`;
    return btn(label, () => this.act({ kind: 'pray', actorId: x.id }), cd > 0 || p.uses <= 0, () => `${god.name}: ${p.description} Costs ${p.cost} favor (${p.uses} prayer${p.uses === 1 ? '' : 's'} left).`);
  }

  private showResults(r: BattleRewards): void {
    const lines: HTMLElement[] = [];
    const title = r.outcome === 'victory' ? 'Victory!' : r.outcome === 'defeat' ? (r.permadeath ? 'Your Legend Ends' : 'Defeat') : 'Escaped';
    lines.push(el('h2', { class: `result-${r.outcome}` }, title));
    if (r.outcome === 'victory') {
      lines.push(el('p', {}, `+${r.xp} XP · +${r.gold} gold`));
      if (r.levelsGained.length) lines.push(el('p', { class: 'points-available' }, `Level up! You are now level ${this.session.player.level}.`));
      if (r.items.length) {
        lines.push(
          el(
            'div',
            { class: 'result-loot' },
            ...r.items.map((it) => {
              const row = el('div', { class: 'loot-row', style: `color:${content.rarities.get(it.rarity).color === '#1a1a1a' ? '#c8b8ff' : content.rarities.get(it.rarity).color}` }, el('img', { class: 'pixel cmd-icon', src: itemIconUrl(it), alt: '' }), `${itemName(it)}${it.quantity > 1 ? ` ×${it.quantity}` : ''}`);
              return row;
            }),
          ),
        );
      } else lines.push(el('p', { class: 'dim' }, 'No items dropped.'));
      if (r.salvaged) lines.push(el('p', { class: 'dim small' }, `${r.salvaged} item(s) auto-salvaged by your loot filter.`));
    } else if (r.outcome === 'defeat') {
      lines.push(
        el(
          'p',
          {},
          r.permadeath
            ? `${this.session.player.name} has fallen for good. Hardcore heroes do not return.`
            : `You wake up bruised but alive. Lost ${r.goldLost} gold, and your gear is battered.`,
        ),
      );
    }
    if (r.favor.length) {
      const favor = r.favor.map((ch) => {
        const god = content.gods.get(ch.god);
        const d = Math.round((ch.after - ch.before) * 10) / 10;
        return el('span', { style: `color:${god.color}` }, `${god.name} ${d > 0 ? '+' : ''}${d}`);
      });
      lines.push(el('p', { class: 'small result-favor' }, 'Favor: ', ...favor.flatMap((f, i) => (i ? [' · ', f] : [f]))));
    }
    const buttons: HTMLElement[] = [];
    const go = el('button', { class: 'primary' }, r.permadeath ? 'Return to title' : 'Continue');
    go.addEventListener('click', () => this.opts.onExit(r));
    buttons.push(go);
    if (!r.permadeath && this.opts.onRematch) {
      const again = el('button', {}, 'Fight again');
      again.addEventListener('click', () => this.opts.onRematch?.());
      buttons.push(again);
    }
    lines.push(el('div', { class: 'row' }, ...buttons));
    this.overlay.replaceChildren(el('div', { class: 'panel result-panel' }, ...lines));
    this.overlay.classList.remove('hidden');
    go.focus();
  }
}

/** Battle hooks that draw consumables from the session inventory. */
export function inventoryHooks(session: GameSession): { consumeItem: (id: string) => boolean; itemCount: (id: string) => number } {
  return {
    consumeItem: (id) => takeQuantity(session.state.inventory, id, 1),
    itemCount: (id) => countOf(session.state.inventory, id),
  };
}
