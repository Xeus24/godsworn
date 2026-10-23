import { content } from '../../data';
import type { Battle } from '../../engine/combat/battle';
import type { BattleEvent, Combatant } from '../../engine/combat/types';
import { drawPortrait } from '../art/portraits';
import { creatureSprite } from './creatureSprites';

export const SCENE_W = 960;
export const SCENE_H = 540;

interface UnitView {
  hp: number;
  shield: number;
  flash: number;
  shake: number;
  alpha: number;
  appear: number;
}

interface FloatText {
  x: number;
  y: number;
  text: string;
  color: string;
  age: number;
  big: boolean;
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

const portraitCache = new Map<string, HTMLCanvasElement>();
function portraitCanvas(raceId: string, variant: number, color: string): HTMLCanvasElement {
  const key = `${raceId}|${variant}|${color}`;
  let c = portraitCache.get(key);
  if (!c) {
    c = document.createElement('canvas');
    drawPortrait(c, raceId, variant, `${color}55`);
    portraitCache.set(key, c);
  }
  return c;
}

/**
 * Canvas renderer for a battle. It draws from the battle state, except HP,
 * which follows the event stream so bars drop in time with the hits.
 */
export class CombatScene {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly views = new Map<string, UnitView>();
  private floats: FloatText[] = [];
  private frame = 0;
  private last = 0;
  private background: HTMLCanvasElement;
  /** Combatants that can currently be clicked as targets. */
  targets = new Set<string>();
  actorId: string | undefined;
  onClick: ((id: string) => void) | undefined;

  constructor(private readonly battle: Battle) {
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
    });
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

  private view(x: Combatant): UnitView {
    let v = this.views.get(x.id);
    if (!v) {
      v = { hp: x.hp, shield: x.shield, flash: 0, shake: 0, alpha: x.alive ? 1 : 0.3, appear: 0 };
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
    const float = (id: string, text: string, color: string, big = false): void => {
      const p = pos(id);
      this.floats.push({ x: p.x + (Math.random() * 16 - 8), y: p.y, text, color, age: 0, big });
    };
    switch (e.type) {
      case 'damage': {
        const x = this.battle.get(e.targetId);
        if (!x) return;
        const v = this.view(x);
        v.shield = Math.max(0, v.shield - e.absorbed);
        v.hp = Math.max(0, v.hp - (e.amount - e.absorbed));
        v.flash = 1;
        v.shake = e.crit ? 1 : 0.5;
        float(e.targetId, `${e.crit ? 'CRIT ' : ''}${e.amount}`, e.crit ? '#ffd84a' : (ELEMENT_COLORS[e.element] ?? '#fff'), e.crit);
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
        if (x) this.view(x).alpha = 0.99;
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
      case 'combo':
        float(e.targetId, `${e.name.toUpperCase()}!`, e.name === 'Shatter' ? '#8fe3ff' : '#ffe14a', true);
        return;
      default:
        return;
    }
  }

  start(): void {
    this.last = performance.now();
    const tick = (now: number): void => {
      const dt = Math.min(0.05, (now - this.last) / 1000);
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
        const spacing = Math.min(125, 360 / Math.max(1, n));
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
    if (!g) return bg;
    const night = this.battle.timeOfDay === 'night';
    const sky = g.createLinearGradient(0, 0, 0, 260);
    sky.addColorStop(0, night ? '#0b0a1e' : '#4a6fa8');
    sky.addColorStop(1, night ? '#2a1f3a' : '#e8b88a');
    g.fillStyle = sky;
    g.fillRect(0, 0, SCENE_W, 260);
    // Hills.
    g.fillStyle = night ? '#1a1a2a' : '#5a7a5a';
    for (let x = 0; x < SCENE_W; x += 4) {
      const h = 40 + 20 * Math.sin(x * 0.01) + 12 * Math.sin(x * 0.037 + 2);
      g.fillRect(x, 260 - h, 4, h);
    }
    const ground = g.createLinearGradient(0, 250, 0, SCENE_H);
    ground.addColorStop(0, night ? '#1f2a1f' : '#5f8a3a');
    ground.addColorStop(1, night ? '#101810' : '#3a5a22');
    g.fillStyle = ground;
    g.fillRect(0, 250, SCENE_W, SCENE_H - 250);
    // Grass tufts from a tiny fixed-seed generator (cosmetic only).
    let seed = 1337;
    const rand = (): number => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    g.fillStyle = night ? '#2a3a2a' : '#7aa84a';
    for (let i = 0; i < 220; i++) {
      const x = Math.floor(rand() * SCENE_W);
      const y = 262 + Math.floor(rand() * (SCENE_H - 270));
      g.fillRect(x, y, 3, 3);
      g.fillRect(x + 3, y - 3, 3, 3);
      g.fillRect(x - 3, y - 2, 3, 3);
    }
    if (night) {
      g.fillStyle = '#f4f0d8';
      for (let i = 0; i < 70; i++) g.fillRect((i * 131) % SCENE_W, (i * 37) % 200, 2, 2);
    }
    return bg;
  }

  private draw(dt: number, t: number): void {
    const g = this.ctx;
    g.imageSmoothingEnabled = false;
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
      if (!x.alive && v.alpha > (x.corpse ? 0.3 : 0)) v.alpha = Math.max(x.corpse ? 0.3 : 0, v.alpha - dt * 1.5);
      if (v.alpha <= 0.01) continue;
      this.drawUnit(x, v, p.x + Math.sin(t * 60) * v.shake * 4, p.y, t);
    }

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
      g.strokeText(f.text, f.x, y);
      g.fillStyle = f.color;
      g.fillText(f.text, f.x, y);
      g.globalAlpha = 1;
    }
  }

  private unitSize(x: Combatant): number {
    return x.kind === 'hero' || x.kind === 'companion' ? 64 : x.tier === 'elite' ? 84 : 72;
  }

  /** Clickable area of a unit: sprite, name and bars. */
  private rectFor(x: Combatant, cx: number, cy: number): { x: number; y: number; w: number; h: number } {
    const size = this.unitSize(x);
    return { x: cx - size / 2 - 6, y: cy - size - 18, w: size + 12, h: size + 44 };
  }

  private drawUnit(x: Combatant, v: UnitView, cx: number, cy: number, t: number): void {
    const g = this.ctx;
    const size = this.unitSize(x);
    const top = cy - size;
    g.globalAlpha = v.alpha * (1 - v.appear * 0.8);

    // Shadow.
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.beginPath();
    g.ellipse(cx, cy + 2, size * 0.38, 7, 0, 0, Math.PI * 2);
    g.fill();

    if (x.portrait) {
      const img = portraitCanvas(x.portrait.raceId, x.portrait.variant, x.portrait.color);
      g.fillStyle = x.portrait.color;
      g.fillRect(cx - size / 2 - 3, top - 3, size + 6, size + 6);
      g.drawImage(img, cx - size / 2, top, size, size);
    } else if (x.sprite) {
      const img = creatureSprite(x.sprite.family, x.sprite.main, x.sprite.accent);
      g.save();
      if (x.side === 'party') {
        // Allied creatures face the enemy.
        g.translate(cx, 0);
        g.scale(-1, 1);
        g.drawImage(img, -size / 2, top, size, size);
      } else {
        g.drawImage(img, cx - size / 2, top, size, size);
      }
      g.restore();
    }
    if (v.flash > 0) {
      g.fillStyle = `rgba(255,255,255,${v.flash * 0.6})`;
      g.fillRect(cx - size / 2, top, size, size);
    }
    if (!x.alive) {
      g.fillStyle = 'rgba(40,30,50,0.5)';
      g.fillRect(cx - size / 2, top, size, size);
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
      const icons = [...x.statuses.map((s) => ({ glyph: content.statuses.get(s.id).glyph, color: content.statuses.get(s.id).color, n: s.stacks, turns: s.turns })), ...x.buffs.map(() => ({ glyph: '+', color: '#6fdc8a', n: 1, turns: 0 }))];
      icons.slice(0, 7).forEach((icon, i) => {
        const ix = cx - bw / 2 + i * 15;
        const iy = by + 30;
        g.fillStyle = '#120c18';
        g.fillRect(ix, iy, 14, 14);
        g.fillStyle = icon.color;
        g.fillRect(ix + 1, iy + 1, 12, 12);
        g.fillStyle = '#120c18';
        g.font = 'bold 8px ui-monospace, Menlo, monospace';
        g.fillText(icon.glyph, ix + 7, iy + 10);
        if (icon.n > 1) {
          g.fillStyle = '#fff';
          g.fillText(String(icon.n), ix + 12, iy + 16);
        }
      });
    }
    g.globalAlpha = 1;
  }
}
