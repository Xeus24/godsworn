import { content } from '../../data';
import type { Battle } from '../../engine/combat/battle';
import type { BattleEvent, Combatant } from '../../engine/combat/types';
import { heroDoll } from '../art/heroDoll';
import { heroSprite } from '../art/heroSprite';
import { drawWeather } from '../art/weatherFx';
import { settings } from '../settings';
import type { Biome } from '../../engine/world/types';
import { monsterTile } from '../art/tileSprites';
import { creatureSprite } from './creatureSprites';
import { paintBattlefield } from './battlefield';
import { drawStatusPicture } from './statusIcons';
import { effectsOf, type EffectView } from './effectText';

export const SCENE_W = 960;
export const SCENE_H = 540;

/** Playback speed of battle animation and event pacing (the developer panel sets it below 1 to study effects). */
export const battleFx = { timeScale: 1 };

interface UnitView {
  hp: number;
  shield: number;
  flash: number;
  shake: number;
  alpha: number;
  appear: number;
  /** Trailing HP bar: drains slowly after a hit so the size of the blow is visible. */
  ghost: number;
  /** Attack lunge progress 1 -> 0, and the screen-space direction it travels. */
  lunge: number;
  lungeDx: number;
  lungeDy: number;
  flashColor: string;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  color: string;
}

interface FloatText {
  x: number;
  y: number;
  text: string;
  color: string;
  age: number;
  big: boolean;
  /** Size multiplier: bigger blows (relative to the target's max HP) draw bigger numbers. */
  scale: number;
}

const ELEMENT_COLORS: Record<string, string> = {
  physical: '#f4f0e8',
  fire: '#ff8a3a',
  ice: '#8fe3ff',
  lightning: '#ffe14a',
  nature: '#8fdc4a',
  holy: '#fff0a0',
  shadow: '#c08aff',
  arcane: '#ff8af0',
  void: '#b04aff',
};

/**
 * Canvas renderer for a battle. It draws from the battle state, except HP,
 * which follows the event stream so bars drop in time with the hits.
 */
const MAX_ICONS = 10;
const ICON = 20;
const ICON_STEP = 22;
const ICONS_PER_ROW = 5;

/** Where status icon `i` sits, relative to the unit's centre x and its HP bar row. */
function iconSpot(cx: number, by: number, bw: number, i: number): { x: number; y: number } {
  return { x: cx - bw / 2 + (i % ICONS_PER_ROW) * ICON_STEP, y: by + 30 + Math.floor(i / ICONS_PER_ROW) * ICON_STEP };
}

export class CombatScene {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly views = new Map<string, UnitView>();
  private floats: FloatText[] = [];
  private sparks: Spark[] = [];
  /** Whole-scene shake, set by critical hits and deaths. */
  private sceneShake = 0;
  private frame = 0;
  private last = 0;
  private background: HTMLCanvasElement;
  /** Combatants that can currently be clicked as targets. */
  targets = new Set<string>();
  actorId: string | undefined;
  onClick: ((id: string) => void) | undefined;
  /** Called while the mouse is over a buff or status icon (and with undefined when it leaves). */
  onEffectHover: ((e: MouseEvent, unit: Combatant, effect: EffectView) => void) | undefined;
  onEffectLeave: (() => void) | undefined;

  constructor(private readonly battle: Battle, private readonly biome: Biome = 'meadow') {
    this.canvas = document.createElement('canvas');
    this.canvas.width = SCENE_W;
    this.canvas.height = SCENE_H;
    this.canvas.className = 'combat-canvas';
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable');
    this.ctx = ctx;
    this.background = this.paintBackground();
    this.canvas.addEventListener('click', (e) => {
      const id = this.hitTest(e);
      if (id && this.onClick) this.onClick(id);
    });
    this.canvas.addEventListener('mousemove', (e) => {
      this.canvas.style.cursor = this.hitTest(e) && this.targets.size ? 'pointer' : 'default';
      const hit = this.effectAt(e);
      if (hit) this.onEffectHover?.(e, hit.unit, hit.effect);
      else this.onEffectLeave?.();
    });
    this.canvas.addEventListener('mouseleave', () => this.onEffectLeave?.());
    this.syncAll();
  }

  private hitTest(e: MouseEvent): string | undefined {
    // The canvas is letterboxed by object-fit: contain; map through the drawn area.
    const r = this.canvas.getBoundingClientRect();
    const scale = Math.min(r.width / SCENE_W, r.height / SCENE_H);
    const left = r.left + (r.width - SCENE_W * scale) / 2;
    const top = r.top + (r.height - SCENE_H * scale) / 2;
    const x = (e.clientX - left) / scale;
    const y = (e.clientY - top) / scale;
    // Computed fresh rather than from the last frame: frames pause in background tabs.
    for (const [id, p] of this.positions()) {
      const unit = this.battle.get(id);
      if (!unit || !this.targets.has(id)) continue;
      const rect = this.rectFor(unit, p.x, p.y);
      if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) return id;
    }
    return undefined;
  }

  /** The buff or status icon under the mouse, if any. */
  private effectAt(e: MouseEvent): { unit: Combatant; effect: EffectView } | undefined {
    const r = this.canvas.getBoundingClientRect();
    const scale = Math.min(r.width / SCENE_W, r.height / SCENE_H);
    const left = r.left + (r.width - SCENE_W * scale) / 2;
    const top = r.top + (r.height - SCENE_H * scale) / 2;
    const x = (e.clientX - left) / scale;
    const y = (e.clientY - top) / scale;
    for (const [id, p] of this.positions()) {
      const unit = this.battle.get(id);
      if (!unit || !unit.alive) continue;
      const bw = Math.max(70, this.unitSize(unit));
      const icons = effectsOf(unit).slice(0, MAX_ICONS);
      for (let i = 0; i < icons.length; i++) {
        const spot = iconSpot(p.x, p.y + 10, bw, i);
        if (x >= spot.x && x <= spot.x + ICON && y >= spot.y && y <= spot.y + ICON) return { unit, effect: icons[i] as EffectView };
      }
    }
    return undefined;
  }

  private view(x: Combatant): UnitView {
    let v = this.views.get(x.id);
    if (!v) {
      v = { hp: x.hp, shield: x.shield, flash: 0, shake: 0, alpha: x.alive ? 1 : 0.3, appear: 0, ghost: x.hp, lunge: 0, lungeDx: 0, lungeDy: 0, flashColor: '255,255,255' };
      this.views.set(x.id, v);
    }
    return v;
  }

  /** Snap displayed values to the real state (after a batch of events). */
  syncAll(): void {
    for (const x of this.battle.combatants) {
      const v = this.view(x);
      v.hp = x.hp;
      v.shield = x.shield;
      v.ghost = Math.max(v.ghost, x.hp);
      v.alpha = x.alive ? 1 : x.corpse ? 0.3 : 0;
    }
  }

  /** Reflects one event visually: HP, flashes, floating text. */
  applyEvent(e: BattleEvent): void {
    const positions = this.positions();
    const pos = (id: string): { x: number; y: number } => {
      const p = positions.get(id);
      const unit = this.battle.get(id);
      return p && unit ? { x: p.x, y: p.y - this.unitSize(unit) - 14 } : { x: SCENE_W / 2, y: SCENE_H / 2 };
    };
    const float = (id: string, text: string, color: string, big = false, scale = 1): void => {
      const p = pos(id);
      this.floats.push({ x: p.x + (Math.random() * 16 - 8), y: p.y, text, color, age: 0, big, scale });
    };
    switch (e.type) {
      case 'action': {
        // The actor steps toward its first target and back.
        if (settings().reduceMotion) return;
        const from = positions.get(e.actorId);
        const to = e.targets.map((id) => positions.get(id)).find((p) => p && p !== from);
        const actor = this.battle.get(e.actorId);
        if (!from || !to || !actor) return;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.hypot(dx, dy) || 1;
        const v = this.view(actor);
        v.lunge = 1;
        v.lungeDx = dx / len;
        v.lungeDy = dy / len;
        return;
      }
      case 'damage': {
        const x = this.battle.get(e.targetId);
        if (!x) return;
        const v = this.view(x);
        v.shield = Math.max(0, v.shield - e.absorbed);
        v.hp = Math.max(0, v.hp - (e.amount - e.absorbed));
        const color = ELEMENT_COLORS[e.element] ?? '#fff';
        v.flash = 1;
        v.flashColor = e.crit ? '255,230,120' : this.rgb(color);
        v.shake = e.crit ? 1 : 0.5;
        // DoT ticks are quiet; real hits get sparks, and crits shake the whole scene.
        const share = e.amount / Math.max(1, x.maxHp);
        if (!e.dot && !settings().reduceMotion) {
          const p = positions.get(e.targetId);
          if (p) this.burst(p.x, p.y - this.unitSize(x) / 2, e.crit ? '#ffd84a' : color, e.crit ? 16 : 8 + Math.min(8, Math.round(share * 40)));
          if (e.crit) this.sceneShake = Math.max(this.sceneShake, 1);
        }
        float(e.targetId, `${e.crit ? 'CRIT ' : ''}${e.amount}`, e.crit ? '#ffd84a' : color, e.crit, e.dot ? 0.8 : 1 + Math.min(0.6, share * 3));
        return;
      }
      case 'heal': {
        const x = this.battle.get(e.targetId);
        if (!x) return;
        const v = this.view(x);
        v.hp = Math.min(x.maxHp, v.hp + e.amount);
        float(e.targetId, `+${e.amount}`, '#6fdc8a');
        return;
      }
      case 'shield': {
        const x = this.battle.get(e.targetId);
        if (x) this.view(x).shield += e.amount;
        float(e.targetId, `+${e.amount} shield`, '#9fd8ff');
        return;
      }
      case 'miss':
        float(e.targetId, 'MISS', '#c8c0d8');
        return;
      case 'status':
        if (e.on && !e.statusId.startsWith('buff:')) float(e.targetId, content.statuses.find(e.statusId)?.name ?? e.statusId, content.statuses.find(e.statusId)?.color ?? '#fff');
        return;
      case 'resisted':
        float(e.targetId, 'Resisted', '#c8c0d8');
        return;
      case 'death': {
        const x = this.battle.get(e.targetId);
        if (!x) return;
        this.view(x).alpha = 0.99;
        const p = positions.get(e.targetId);
        if (p) this.burst(p.x, p.y - this.unitSize(x) / 2, '#c8c0d8', 18);
        this.sceneShake = Math.max(this.sceneShake, 0.6);
        return;
      }
      case 'revive': {
        const x = this.battle.get(e.targetId);
        if (!x) return;
        const v = this.view(x);
        v.alpha = 1;
        v.hp = x.hp;
        float(e.targetId, 'Revived!', '#ffe8a0', true);
        return;
      }
      case 'summon': {
        const x = this.battle.get(e.combatantId);
        if (!x) return;
        const v = this.view(x);
        v.appear = 1;
        return;
      }
      case 'break':
        float(e.targetId, 'BREAK!', '#ffd84a', true);
        return;
      case 'boss':
        float(e.actorId, e.moment === 'windUp' ? `Winding up: ${e.title}` : e.title, e.moment === 'interrupt' ? '#ffd84a' : '#ff6a3a', true);
        return;
      case 'combo':
        float(e.targetId, `${e.name.toUpperCase()}!`, e.name === 'Shatter' ? '#8fe3ff' : '#ffe14a', true);
        return;
      default:
        return;
    }
  }

  private rgb(hex: string): string {
    const n = parseInt(hex.slice(1), 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  }

  private burst(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 140;
      this.sparks.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 50, age: 0, life: 0.35 + Math.random() * 0.25, size: 2 + Math.floor(Math.random() * 3), color });
    }
  }

  start(): void {
    this.last = performance.now();
    const tick = (now: number): void => {
      const dt = Math.min(0.05, (now - this.last) / 1000) * battleFx.timeScale;
      this.last = now;
      this.draw(dt, now / 1000);
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  stop(): void {
    cancelAnimationFrame(this.frame);
  }

  // ---------------------------------------------------------- layout

  private positions(): Map<string, { x: number; y: number }> {
    const out = new Map<string, { x: number; y: number }>();
    const place = (side: 'party' | 'enemy', row: 'front' | 'back', x: number): void => {
      const units = this.battle.combatants.filter((c) => c.side === side && c.row === row && (c.alive || c.corpse || (this.views.get(c.id)?.alpha ?? 0) > 0.05));
      units.forEach((u, i) => {
        const n = units.length;
        const spacing = Math.min(140, 420 / Math.max(1, n));
        // Back-row units sit slightly higher so their labels clear the front row.
        out.set(u.id, { x, y: 330 + (i - (n - 1) / 2) * spacing - (row === 'back' ? 20 : 0) });
      });
    };
    place('party', 'back', 140);
    place('party', 'front', 300);
    place('enemy', 'front', 640);
    place('enemy', 'back', 820);
    return out;
  }

  // ---------------------------------------------------------- drawing

  private paintBackground(): HTMLCanvasElement {
    const bg = document.createElement('canvas');
    bg.width = SCENE_W;
    bg.height = SCENE_H;
    const g = bg.getContext('2d');
    if (g) paintBattlefield(g, SCENE_W, SCENE_H, this.biome, this.battle.timeOfDay === 'night');
    return bg;
  }

  private draw(dt: number, t: number): void {
    const g = this.ctx;
    g.imageSmoothingEnabled = false;
    this.sceneShake = Math.max(0, this.sceneShake - dt * 3.5);
    g.save();
    if (this.sceneShake > 0) g.translate(Math.round(Math.sin(t * 90) * this.sceneShake * 5), Math.round(Math.cos(t * 70) * this.sceneShake * 4));
    g.drawImage(this.background, 0, 0);
    const pos = this.positions();

    const units = [...this.battle.combatants].sort((a, b) => (pos.get(a.id)?.y ?? 0) - (pos.get(b.id)?.y ?? 0));
    for (const x of units) {
      const p = pos.get(x.id);
      if (!p) continue;
      const v = this.view(x);
      v.flash = Math.max(0, v.flash - dt * 4);
      v.shake = Math.max(0, v.shake - dt * 3);
      v.appear = Math.max(0, v.appear - dt * 2);
      v.lunge = Math.max(0, v.lunge - dt * 2.6);
      v.ghost = v.ghost > v.hp ? Math.max(v.hp, v.ghost - dt * Math.max(20, x.maxHp * 0.5)) : v.hp;
      if (!x.alive && v.alpha > (x.corpse ? 0.3 : 0)) v.alpha = Math.max(x.corpse ? 0.3 : 0, v.alpha - dt * 1.5);
      if (v.alpha <= 0.01) continue;
      // Lunge: out and back along a sine, peaking mid-swing.
      const reach = Math.sin((1 - v.lunge) * Math.PI) * (v.lunge > 0 ? 34 : 0);
      this.drawUnit(x, v, p.x + Math.sin(t * 60) * v.shake * 4 + v.lungeDx * reach, p.y + v.lungeDy * reach * 0.5, t);
    }

    // Sparks.
    this.sparks = this.sparks.filter((s) => s.age < s.life);
    for (const s of this.sparks) {
      s.age += dt;
      s.vy += 380 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      g.globalAlpha = Math.max(0, 1 - s.age / s.life);
      g.fillStyle = s.color;
      g.fillRect(Math.round(s.x), Math.round(s.y), s.size, s.size);
    }
    g.globalAlpha = 1;

    // Weather falls in front of the fighters, behind the floating numbers.
    if (this.battle.weather && !settings().reduceMotion) drawWeather(g, this.battle.weather, SCENE_W, SCENE_H, t * 1000);
    // Floating text.
    g.textAlign = 'center';
    this.floats = this.floats.filter((f) => f.age < 1.1);
    for (const f of this.floats) {
      f.age += dt;
      const a = Math.max(0, 1 - f.age / 1.1);
      g.font = `bold ${f.big ? 22 : 16}px ui-monospace, Menlo, monospace`;
      g.lineWidth = 4;
      g.strokeStyle = `rgba(0,0,0,${a})`;
      g.globalAlpha = a;
      const y = f.y - f.age * 40;
      // Pop: starts oversized and settles within a tenth of a second.
      const pop = f.scale * (1 + Math.max(0, 0.12 - f.age) * 6);
      g.save();
      g.translate(f.x, y);
      g.scale(pop, pop);
      g.strokeText(f.text, 0, 0);
      g.fillStyle = f.color;
      g.fillText(f.text, 0, 0);
      g.restore();
      g.globalAlpha = 1;
    }
    g.restore();
  }

  private unitSize(x: Combatant): number {
    if (x.portrait) return 96;
    if (x.tier === 'boss' || x.tier === 'worldBoss' || x.tier === 'punisher') return 144;
    return x.tier === 'elite' || x.tier === 'champion' || x.tier === 'miniboss' ? 120 : 96;
  }

  /** Clickable area of a unit: sprite, name and bars. */
  private rectFor(x: Combatant, cx: number, cy: number): { x: number; y: number; w: number; h: number } {
    const size = this.unitSize(x);
    return { x: cx - size / 2 - 6, y: cy - size - 18, w: size + 12, h: size + 44 };
  }

  private drawUnit(x: Combatant, v: UnitView, cx: number, cy: number, t: number): void {
    const g = this.ctx;
    const size = this.unitSize(x);
    // Idle breathing: a slow, per-unit-phase bob. Creatures also stretch a little, slimes more.
    let phase = 0;
    for (const ch of x.id) phase = (phase * 31 + ch.charCodeAt(0)) % 628;
    const breath = x.alive && !settings().reduceMotion ? Math.sin(t * 2.4 + phase / 100) : 0;
    const bob = Math.round(breath * (x.sprite ? 2 : 1));
    const stretch = x.sprite ? 1 + breath * (x.sprite.family === 'slime' ? 0.05 : 0.025) : 1 + breath * 0.018;
    const top = cy - size - bob;
    g.globalAlpha = v.alpha * (1 - v.appear * 0.8);

    // Shadow.
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.beginPath();
    g.ellipse(cx, cy + 2, size * 0.38, 7, 0, 0, Math.PI * 2);
    g.fill();

    // The unit whose turn it is stands in a pulsing ring.
    if (this.actorId === x.id && x.alive) {
      const ring = 0.55 + 0.45 * Math.sin(t * 5);
      g.strokeStyle = `rgba(255,216,74,${ring})`;
      g.lineWidth = 3;
      g.beginPath();
      g.ellipse(cx, cy + 2, size * 0.5, 10, 0, 0, Math.PI * 2);
      g.stroke();
    }

    // Divine Avatar: a pulsing halo in the god's color behind the hero.
    const avatar = x.buffs.find((bf) => bf.id.startsWith('avatar:'));
    if (avatar && x.alive) {
      const god = content.gods.find(avatar.id.slice('avatar:'.length));
      const pulse = 0.55 + 0.25 * Math.sin(performance.now() / 180);
      const glow = g.createRadialGradient(cx, top + size / 2, size * 0.2, cx, top + size / 2, size * 0.95);
      glow.addColorStop(0, `${god?.color ?? '#ffd54a'}cc`);
      glow.addColorStop(1, `${god?.color ?? '#ffd54a'}00`);
      g.globalAlpha = pulse;
      g.fillStyle = glow;
      g.fillRect(cx - size, top - size / 2, size * 2, size * 2);
      g.globalAlpha = 1;
      g.strokeStyle = god?.color ?? '#ffd54a';
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(cx, top - 8, size * 0.32, 6, 0, 0, Math.PI * 2);
      g.stroke();
    }
    // The figure: a full-body hero, or the creature's sprite. `body` is where it is drawn.
    let img: HTMLCanvasElement | undefined;
    let bw = size;
    if (x.portrait) {
      img = heroDoll(x.portrait.raceId, x.portrait.variant, x.weaponTypes, x.portrait.look) ?? heroSprite(x.portrait.raceId, x.portrait.variant, x.portrait.color, x.weaponTypes, x.portrait.look);
      bw = Math.round(size * (img.width / img.height));
    } else if (x.sprite) {
      img = monsterTile(x.enemyId, x.sprite.family) ?? creatureSprite(x.sprite.family, x.sprite.main, x.sprite.accent);
    }
    if (img) {
      g.save();
      // Stretch from the feet so the figure breathes without leaving the ground.
      const feet = top + size;
      g.translate(0, feet);
      g.scale(1, stretch);
      g.translate(0, -feet);
      // Allied creatures face the enemy, and so do hostile humanoids; heroes face right.
      const flip = x.portrait ? x.side === 'enemy' : x.side === 'party';
      const blit = (im: HTMLCanvasElement): void => {
        g.save();
        if (flip) {
          g.translate(cx, 0);
          g.scale(-1, 1);
          g.drawImage(im, -bw / 2, top, bw, size);
        } else {
          g.drawImage(im, cx - bw / 2, top, bw, size);
        }
        g.restore();
      };
      blit(img);
      // Hit flash and fallen tint follow the figure's outline, not its bounding box.
      if (v.flash > 0 || !x.alive) {
        const tint = document.createElement('canvas');
        tint.width = img.width;
        tint.height = img.height;
        const tg = tint.getContext('2d');
        if (tg) {
          tg.drawImage(img, 0, 0);
          tg.globalCompositeOperation = 'source-in';
          tg.fillStyle = !x.alive ? 'rgb(40,30,50)' : `rgb(${v.flashColor})`;
          tg.fillRect(0, 0, tint.width, tint.height);
          const prev = g.globalAlpha;
          g.globalAlpha = prev * (!x.alive ? 0.5 : v.flash * 0.7);
          blit(tint);
          g.globalAlpha = prev;
        }
      }
      g.restore();
      // A weapon swing: a bright crescent sweeps in front of a lunging hero.
      if (x.portrait && v.lunge > 0.15 && x.alive) {
        const sweep = 1 - v.lunge;
        const dir = v.lungeDx >= 0 ? 1 : -1;
        g.save();
        g.translate(cx + dir * (bw * 0.45), top + size * 0.45);
        g.scale(dir, 1);
        g.strokeStyle = `rgba(255,248,214,${Math.sin(sweep * Math.PI) * 0.9})`;
        g.lineWidth = 5;
        g.lineCap = 'round';
        g.beginPath();
        g.arc(0, 0, size * 0.55, -1.1 + sweep * 2.2 - 0.8, -1.1 + sweep * 2.2, false);
        g.stroke();
        g.restore();
      }
    }

    const rect = this.rectFor(x, cx, cy);

    // Target highlight and current actor marker.
    if (this.targets.has(x.id)) {
      g.strokeStyle = `rgba(255,216,74,${0.55 + 0.45 * Math.sin(t * 6)})`;
      g.lineWidth = 3;
      g.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
    if (this.actorId === x.id && x.alive) {
      const bob = Math.sin(t * 5) * 3;
      g.fillStyle = '#ffd84a';
      g.beginPath();
      g.moveTo(cx - 8, top - 30 + bob);
      g.lineTo(cx + 8, top - 30 + bob);
      g.lineTo(cx, top - 20 + bob);
      g.fill();
    }

    // Name.
    g.font = 'bold 12px ui-monospace, Menlo, monospace';
    g.textAlign = 'center';
    g.lineWidth = 3;
    g.strokeStyle = '#000';
    const label = x.tier !== 'party' && x.tier !== 'normal' ? `★ ${x.name}` : x.name;
    g.strokeText(label, cx, top - 6);
    g.fillStyle = x.side === 'party' ? '#e8f0ff' : x.tier === 'elite' ? '#ffb84a' : '#ffe0d8';
    g.fillText(label, cx, top - 6);

    // HP, shield and stagger bars.
    if (x.alive) {
      const bw = Math.max(70, size);
      const by = cy + 10;
      g.fillStyle = '#0a0710';
      g.fillRect(cx - bw / 2 - 1, by - 1, bw + 2, 9);
      const hpShare = Math.max(0, Math.min(1, v.hp / Math.max(1, x.maxHp)));
      const ghostShare = Math.max(hpShare, Math.min(1, v.ghost / Math.max(1, x.maxHp)));
      if (ghostShare > hpShare) {
        g.fillStyle = '#f4f0e8';
        g.fillRect(cx - bw / 2, by, bw * ghostShare, 7);
      }
      g.fillStyle = hpShare > 0.5 ? '#5fcf6a' : hpShare > 0.25 ? '#e8c84a' : '#e0503a';
      g.fillRect(cx - bw / 2, by, bw * hpShare, 7);
      if (v.shield > 0) {
        g.fillStyle = 'rgba(159,216,255,0.85)';
        g.fillRect(cx - bw / 2, by, Math.min(bw, (bw * v.shield) / Math.max(1, x.maxHp)), 3);
      }
      g.font = '10px ui-monospace, Menlo, monospace';
      g.fillStyle = '#fff';
      g.fillText(`${Math.max(0, Math.round(v.hp))}`, cx, by + 19);
      if (x.stagger) {
        const share = x.stagger.brokenTurns > 0 ? 1 : x.stagger.value / x.stagger.max;
        g.fillStyle = '#0a0710';
        g.fillRect(cx - bw / 2 - 1, by + 22, bw + 2, 5);
        g.fillStyle = x.stagger.brokenTurns > 0 ? '#ff5a3a' : '#ffd84a';
        g.fillRect(cx - bw / 2, by + 23, bw * Math.min(1, share), 3);
      }
      // Status icons.
      const icons = effectsOf(x).map((fx) => ({ pic: fx.kind === 'buff' ? 'buff' : fx.id, glyph: fx.glyph, color: fx.color, n: fx.stacks, turns: fx.turns }));
      icons.slice(0, MAX_ICONS).forEach((icon, i) => {
        const { x: ix, y: iy } = iconSpot(cx, by, bw, i);
        g.fillStyle = '#120c18';
        g.fillRect(ix, iy, ICON, ICON);
        g.fillStyle = icon.color;
        g.fillRect(ix + 1, iy + 1, ICON - 2, ICON - 2);
        // A lighter top edge gives the square a little relief.
        g.fillStyle = 'rgba(255,255,255,0.3)';
        g.fillRect(ix + 1, iy + 1, ICON - 2, 3);
        if (!drawStatusPicture(g, icon.pic, ix, iy, ICON, icon.color)) {
          g.fillStyle = '#120c18';
          g.font = 'bold 11px ui-monospace, Menlo, monospace';
          g.fillText(icon.glyph, ix + ICON / 2, iy + 14);
        }
        if (icon.n > 1) {
          g.font = 'bold 10px ui-monospace, Menlo, monospace';
          g.lineWidth = 3;
          g.strokeStyle = '#000';
          g.strokeText(String(icon.n), ix + ICON - 3, iy + ICON + 2);
          g.fillStyle = '#fff';
          g.fillText(String(icon.n), ix + ICON - 3, iy + ICON + 2);
        }
      });
    }
    g.globalAlpha = 1;
  }
}
