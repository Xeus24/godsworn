import { worldLevel } from '../../engine/ngplus/ngplus';
import { content } from '../../data';
import type { EncounterDef } from '../../engine/combat/types';
import { formatClock, timeOfDay } from '../../engine/state/clock';
import type { GameSession } from '../../engine/state/gameState';
import type { StepResult } from '../../engine/state/worldActions';
import type { MapEntity, TileMap } from '../../engine/world/types';
import { entityActive, explored, isDungeon, lineOfSight, runesDone, SIGHT, tileAt, usedKey } from '../../engine/world/world';
import { portraitCanvas } from '../art/portraits';
import { creatureSprite } from '../combat/creatureSprites';
import { navBar, type Nav } from '../components/navBar';
import { el, type Screen } from '../screen';
import { settings } from '../settings';
import { EDGE_E, EDGE_N, EDGE_S, EDGE_W, entityIcon, minimapColor, tileImage } from './tileArt';
import { drawWeather } from '../art/weatherFx';
import { WorldMapOverlay } from './worldMap';
import type { Conversation } from '../../engine/state/conversation';
import { objectiveLine } from '../../engine/state/conversation';
import type { QuestMarker } from '../../engine/quests/quests';
import { objectiveDone, stageOf } from '../../engine/quests/quests';
import { objectiveWhere } from '../quests/questLog';

const MARKER_STYLE: Record<QuestMarker['kind'], { color: string; glyph: string }> = {
  talk: { color: '#ffd84a', glyph: '!' },
  visit: { color: '#ffd84a', glyph: '★' },
  fight: { color: '#ff5a3a', glyph: '⚔' },
  escort: { color: '#6af0a0', glyph: '⚑' },
  stone: { color: '#9ad8ff', glyph: '◆' },
};

const KEYS: Record<string, [number, number]> = {
  w: [0, -1],
  arrowup: [0, -1],
  s: [0, 1],
  arrowdown: [0, 1],
  a: [-1, 0],
  arrowleft: [-1, 0],
  d: [1, 0],
  arrowright: [1, 0],
};
/** On-screen tile size in CSS pixels. */
const TILE = 36;
/** Minimum milliseconds between steps while a key is held. */
const STEP_MS = 85;

/**
 * The overworld: a tile map (zone or dungeon) drawn around the hero, with
 * fog of war, a minimap, the clock and weather. Walk with WASD or arrows;
 * stepping onto things uses them.
 */
/** Accent color per biome for the world HUD. */
const BIOME_ACCENT: Record<string, string> = {
  meadow: '#8ad45a', forest: '#4fa86a', cave: '#7ad0e0', desert: '#e8b868', snow: '#9ad0f0', coast: '#58b0e8', volcanic: '#ff7a3a', citadel: '#b070ff', dungeon: '#e8a040',
};

export class WorldScreen implements Screen {
  private root: HTMLElement | undefined;
  private offs: (() => void)[] = [];
  private canvas = el('canvas', { class: 'world-canvas pixel', 'aria-label': 'World view' });
  private minimap = el('canvas', { class: 'world-minimap pixel', 'aria-label': 'Minimap' });
  private side = el('section', { class: 'panel world-side' });
  private log: string[] = [];
  private lastStep = 0;
  private overlay: WorldMapOverlay | undefined;
  private observer: ResizeObserver | undefined;
  private animTimer = 0;

  constructor(
    private readonly session: GameSession,
    private readonly nav: Nav,
    private readonly fight: (encounter: EncounterDef, level: number) => void,
    private readonly enterTown: (town: string) => void,
    private readonly talk: (conv: Conversation) => void,
  ) {}

  mount(root: HTMLElement): void {
    this.root = root;
    const s = this.session;
    s.world.look();
    const stage = el('div', { class: 'world-stage' }, this.canvas, this.dpad());
    root.replaceChildren(el('div', { class: 'sheet' }, navBar(s, this.nav, 'world'), el('div', { class: 'world-body' }, stage, this.side)));
    const onKey = (e: KeyboardEvent): void => this.onKey(e);
    window.addEventListener('keydown', onKey);
    this.offs.push(() => window.removeEventListener('keydown', onKey));
    this.offs.push(s.bus.on('stateChanged', () => this.draw()), s.bus.on('timeChanged', () => this.draw()));
    this.observer = new ResizeObserver(() => this.draw());
    this.observer.observe(stage);
    // Redraw the view a few times a second: water ripples and the hero's halo are animated.
    this.animTimer = window.setInterval(() => {
      if (this.root && !this.overlay && !document.hidden) this.drawView(this.session.world.map);
    }, 110);
    this.draw();
  }

  unmount(): void {
    for (const off of this.offs) off();
    this.offs = [];
    this.observer?.disconnect();
    window.clearInterval(this.animTimer);
    this.overlay?.close();
  }

  private say(text: string | undefined): void {
    if (!text) return;
    this.log = [...this.log, text].slice(-6);
  }

  private onKey(e: KeyboardEvent): void {
    const typing = e.target instanceof HTMLInputElement && !['checkbox', 'radio', 'button', 'range'].includes(e.target.type);
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    const key = e.key.toLowerCase();
    if (this.overlay) {
      if (key === 'escape' || key === 'm') this.closeMap();
      return;
    }
    if (key === 'm') {
      e.preventDefault();
      this.openMap();
      return;
    }
    if (key === 'e' || key === 'enter' || key === ' ') {
      e.preventDefault();
      this.useHere();
      return;
    }
    const dir = KEYS[key];
    if (!dir) return;
    e.preventDefault();
    const now = performance.now();
    if (now - this.lastStep < STEP_MS) return;
    this.lastStep = now;
    this.step(dir[0], dir[1]);
  }

  private step(dx: number, dy: number): void {
    this.handle(this.session.world.step(dx, dy));
  }

  private handle(r: StepResult): void {
    if (r.kind === 'fight') {
      this.fight(r.encounter, r.level);
      return;
    }
    if (r.kind === 'town') {
      this.enterTown(r.town);
      return;
    }
    if (r.kind === 'talk') {
      const conv = this.session.quests.talkAtMarker(r.marker);
      if (conv) this.talk(conv);
      this.draw();
      return;
    }
    if (r.kind !== 'blocked' || r.message) this.say(r.message);
    this.draw();
  }

  /** Uses what you are standing on again (enter a town, read a shrine...). */
  private useHere(): void {
    const s = this.session;
    const marker = s.world.markerHere();
    if (marker) {
      this.handle(s.world.useMarker(marker));
      return;
    }
    const e = s.world.here();
    if (!e) return;
    if (e.kind === 'town' && e.ref) this.enterTown(e.ref);
    else if (e.kind === 'shrine') this.nav.pantheon();
    else this.handle(s.world.interact(e));
  }

  private dpad(): HTMLElement {
    const b = (label: string, dx: number, dy: number, cls: string): HTMLButtonElement => {
      const btn = el('button', { class: `dpad-${cls}`, 'aria-label': `Move ${cls}` }, label);
      btn.addEventListener('click', () => this.step(dx, dy));
      return btn;
    };
    return el('div', { class: 'world-dpad' }, b('▲', 0, -1, 'up'), b('◀', -1, 0, 'left'), b('▶', 1, 0, 'right'), b('▼', 0, 1, 'down'));
  }

  private openMap(): void {
    this.overlay = new WorldMapOverlay(this.session, () => this.closeMap());
    this.root?.append(this.overlay.element);
  }

  private closeMap(): void {
    this.overlay?.close();
    this.overlay = undefined;
    this.draw();
  }

  // ------------------------------------------------------------ drawing

  private draw = (): void => {
    if (!this.root) return;
    const s = this.session;
    const map = s.world.map;
    this.drawView(map);
    this.drawMinimap(map);
    this.drawSide(map);
  };

  private entityImage(map: TileMap, e: MapEntity): HTMLCanvasElement | undefined {
    const w = this.session.state.world;
    switch (e.kind) {
      case 'enemies': {
        const def = content.enemies.get(e.group?.enemies[0]?.enemyId ?? 'green-slime');
        return creatureSprite(def.family, def.palette.main, def.palette.accent);
      }
      case 'worldBoss':
      case 'boss': {
        const def = content.enemies.get(e.ref as string);
        return creatureSprite(def.family, def.palette.main, def.palette.accent);
      }
      case 'shrine':
        return entityIcon('shrine', content.gods.get(e.ref as string).color);
      case 'waypoint':
        return entityIcon('waypoint', '', w.waypoints.includes(map.id) ? 'on' : '');
      case 'chest':
        return entityIcon('chest', '', e.locked ? 'locked' : '');
      case 'node':
        return entityIcon('node', '', e.gather);
      case 'rune':
        return entityIcon('rune', '', w.used[usedKey(map.id, e.id)] !== undefined ? 'lit' : '');
      default:
        return entityIcon(e.kind);
    }
  }

  private drawView(map: TileMap): void {
    const s = this.session;
    const w = s.state.world;
    const parent = this.canvas.parentElement;
    const cw = Math.max(200, parent?.clientWidth ?? 640);
    const ch = Math.max(200, parent?.clientHeight ?? 480);
    const dpr = window.devicePixelRatio || 1;
    if (this.canvas.width !== Math.round(cw * dpr) || this.canvas.height !== Math.round(ch * dpr)) {
      this.canvas.width = Math.round(cw * dpr);
      this.canvas.height = Math.round(ch * dpr);
      this.canvas.style.width = `${cw}px`;
      this.canvas.style.height = `${ch}px`;
    }
    const g = this.canvas.getContext('2d');
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.imageSmoothingEnabled = false;
    const void_ = g.createRadialGradient(cw / 2, ch / 2, ch * 0.2, cw / 2, ch / 2, Math.max(cw, ch) * 0.7);
    void_.addColorStop(0, '#171028');
    void_.addColorStop(1, '#05030a');
    g.fillStyle = void_;
    g.fillRect(0, 0, cw, ch);
    const p = w.position;
    const ox = Math.round(cw / 2 - (p.x + 0.5) * TILE);
    const oy = Math.round(ch / 2 - (p.y + 0.5) * TILE);
    const x0 = Math.max(0, Math.floor(-ox / TILE));
    const y0 = Math.max(0, Math.floor(-oy / TILE));
    const x1 = Math.min(map.w - 1, Math.ceil((cw - ox) / TILE));
    const y1 = Math.min(map.h - 1, Math.ceil((ch - oy) / TILE));
    const day = s.state.clock.day;
    const now = performance.now();
    const frame = settings().reduceMotion ? 0 : Math.floor(now / 450);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (!explored(w, map, x, y)) continue;
        let t = tileAt(map, x, y);
        if (t === 'D' && runesDone(w, map)) t = '_';
        if (t === 'X' && w.used[usedKey(map.id, `crack-${x}-${y}`)] !== undefined) t = map.biome === 'dungeon' ? '_' : '.';
        // Soft ground patches from low-frequency noise; shores and road edges from the neighbours.
        const n = Math.sin(x * 0.37 + 1.3) + Math.sin(y * 0.46) + Math.sin((x + y) * 0.21);
        const tone = n > 1.15 ? 1 : n < -1.15 ? 2 : 0;
        const like = t === '~' ? (c: string) => c !== '~' : (c: string) => c !== '=' && c !== 'D';
        const mask = t === '~' || t === '=' ? (like(tileAt(map, x, y - 1)) ? EDGE_N : 0) | (like(tileAt(map, x + 1, y)) ? EDGE_E : 0) | (like(tileAt(map, x, y + 1)) ? EDGE_S : 0) | (like(tileAt(map, x - 1, y)) ? EDGE_W : 0) : 0;
        g.drawImage(tileImage(map.biome, t, (x * 7 + y * 13) % 4, frame, (x * 31 + y * 17 + x * y) % 11, tone, mask), ox + x * TILE, oy + y * TILE, TILE, TILE);
      }
    }
    for (const e of map.entities) {
      if (!explored(w, map, e.x, e.y) || !entityActive(w, map, e, day)) continue;
      const img = this.entityImage(map, e);
      if (!img) continue;
      const big = e.kind === 'worldBoss' || e.kind === 'boss';
      const size = big ? TILE * 1.3 : TILE;
      const living = e.kind === 'enemies' || big;
      // Monsters breathe (out of step with each other); loot and shrines pulse a soft glow.
      const bob = living ? Math.round(Math.sin(now / 340 + e.x * 1.7 + e.y * 2.3) * 1.5) : 0;
      const ex = ox + e.x * TILE;
      const ey = oy + e.y * TILE;
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.beginPath();
      g.ellipse(ex + TILE / 2, ey + TILE - 3, size * 0.32, 4, 0, 0, Math.PI * 2);
      g.fill();
      if (!living && e.kind !== 'town') {
        const glow = 0.18 + 0.12 * Math.sin(now / 420 + e.x + e.y);
        g.fillStyle = `rgba(255,226,140,${glow})`;
        g.beginPath();
        g.arc(ex + TILE / 2, ey + TILE / 2, TILE * 0.55, 0, Math.PI * 2);
        g.fill();
      }
      g.drawImage(img, ex + (TILE - size) / 2, ey + (TILE - size) + bob, size, size);
      if (big) {
        g.fillStyle = '#ffd84a';
        g.fillRect(ox + e.x * TILE + TILE / 2 - 4, oy + e.y * TILE - TILE * 0.35, 8, 3);
      }
    }
    // Quest markers (shown even through the fog, so you know where to go).
    const tracked = s.state.quests.tracked;
    for (const m of s.quests.markers(map.id)) {
      const st = MARKER_STYLE[m.kind];
      const cx = ox + m.x * TILE + TILE / 2;
      const cy = oy + m.y * TILE + TILE / 2;
      g.globalAlpha = m.quest === tracked ? 1 : 0.75;
      g.fillStyle = '#1a1226';
      g.beginPath();
      g.arc(cx, cy, TILE * 0.38, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = st.color;
      g.lineWidth = 2;
      g.stroke();
      g.fillStyle = st.color;
      g.font = `bold ${Math.round(TILE * 0.45)}px ui-monospace, monospace`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(st.glyph, cx, cy + 1);
      g.globalAlpha = 1;
    }
    // Out-of-sight areas are remembered, but dim.
    g.fillStyle = 'rgba(5,3,10,0.5)';
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (!explored(w, map, x, y)) continue;
        const d2 = (x - p.x) ** 2 + (y - p.y) ** 2;
        if (d2 > SIGHT * SIGHT || !lineOfSight(w, map, p.x, p.y, x, y)) g.fillRect(ox + x * TILE, oy + y * TILE, TILE, TILE);
      }
    }
    // Feather the edge of the explored area: a short fade to the void wherever a neighbour is unexplored.
    const feather = TILE * 0.45;
    const fade = (x: number, y: number, dx: number, dy: number): void => {
      const px = ox + x * TILE;
      const py = oy + y * TILE;
      const sx = dx > 0 ? px + TILE : px;
      const sy = dy > 0 ? py + TILE : py;
      const grad = g.createLinearGradient(sx, sy, sx - dx * feather, sy - dy * feather);
      grad.addColorStop(0, 'rgba(8,5,16,0.85)');
      grad.addColorStop(1, 'rgba(8,5,16,0)');
      g.fillStyle = grad;
      if (dx !== 0) g.fillRect(dx > 0 ? px + TILE - feather : px, py, feather, TILE);
      else g.fillRect(px, dy > 0 ? py + TILE - feather : py, TILE, feather);
    };
    const seen = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < map.w && y < map.h && explored(w, map, x, y);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (!seen(x, y)) continue;
        if (!seen(x + 1, y)) fade(x, y, 1, 0);
        if (!seen(x - 1, y)) fade(x, y, -1, 0);
        if (!seen(x, y + 1)) fade(x, y, 0, 1);
        if (!seen(x, y - 1)) fade(x, y, 0, -1);
      }
    }
    // The hero.
    const cls = s.player.classes[0] ? content.classes.get(s.player.classes[0].classId) : undefined;
    const hero = portraitCanvas(s.player.raceId, s.player.portrait, cls?.color ?? '#888888');
    const hx = ox + p.x * TILE;
    const hy = oy + p.y * TILE;
    // A pulsing halo and a bobbing arrow keep the hero easy to find on busy terrain.
    const pulse = 0.5 + 0.5 * Math.sin(now / 280);
    const glow = g.createRadialGradient(hx + TILE / 2, hy + TILE / 2, TILE * 0.3, hx + TILE / 2, hy + TILE / 2, TILE * (0.85 + 0.15 * pulse));
    glow.addColorStop(0, 'rgba(255,224,120,0.55)');
    glow.addColorStop(1, 'rgba(255,224,120,0)');
    g.fillStyle = glow;
    g.fillRect(hx - TILE, hy - TILE, TILE * 3, TILE * 3);
    g.fillStyle = cls?.color ?? '#ffd84a';
    g.fillRect(hx + 1, hy + 1, TILE - 2, TILE - 2);
    g.drawImage(hero, hx + 3, hy + 3, TILE - 6, TILE - 6);
    g.strokeStyle = `rgba(255,248,214,${0.75 + 0.25 * pulse})`;
    g.lineWidth = 2;
    g.strokeRect(hx + 1, hy + 1, TILE - 2, TILE - 2);
    const bob = Math.round(Math.sin(now / 220) * 2);
    g.fillStyle = '#05030a';
    g.fillRect(hx + TILE / 2 - 6, hy - 11 + bob, 12, 3);
    g.fillStyle = '#ffd84a';
    g.beginPath();
    g.moveTo(hx + TILE / 2 - 5, hy - 9 + bob);
    g.lineTo(hx + TILE / 2 + 5, hy - 9 + bob);
    g.lineTo(hx + TILE / 2, hy - 2 + bob);
    g.fill();
    if (!settings().reduceMotion) this.drawAmbient(g, map.biome, cw, ch, now);
    // Night and weather tints (dungeons are lit by torches).
    if (!isDungeon(map.id)) {
      const weather = content.weather.find(s.world.weatherNow());
      if (weather?.tint) {
        g.fillStyle = weather.tint;
        g.fillRect(0, 0, cw, ch);
      }
      if (weather && !settings().reduceMotion) drawWeather(g, weather.id, cw, ch, now);
      if (timeOfDay(s.state.clock) === 'night') {
        g.fillStyle = 'rgba(10,12,50,0.38)';
        g.fillRect(0, 0, cw, ch);
      }
    }
  }

  /** Slow drifting life over the view: birds, snow, embers, dust. Purely cosmetic and screen-space. */
  private drawAmbient(g: CanvasRenderingContext2D, biome: string, cw: number, ch: number, now: number): void {
    const t = now / 1000;
    const wrap = (v: number, m: number): number => ((v % m) + m) % m;
    switch (biome) {
      case 'meadow':
      case 'forest':
      case 'coast': {
        // A few birds crossing, wings flapping.
        g.fillStyle = 'rgba(20,16,28,0.8)';
        for (let i = 0; i < 3; i++) {
          const x = wrap(t * (22 + i * 7) + i * 260, cw + 80) - 40;
          const y = 40 + i * 70 + Math.sin(t * 1.3 + i) * 10;
          const up = Math.floor(t * 6 + i) % 2 === 0;
          g.fillRect(x, y + (up ? 0 : 2), 3, 2);
          g.fillRect(x + 3, y + (up ? 2 : 0), 3, 2);
          g.fillRect(x + 6, y + (up ? 0 : 2), 3, 2);
        }
        break;
      }
      case 'snow':
        g.fillStyle = 'rgba(255,255,255,0.85)';
        for (let i = 0; i < 40; i++) g.fillRect(wrap(i * 97 + Math.sin(t + i) * 14, cw), wrap(i * 53 + t * (20 + (i % 5) * 6), ch), 2, 2);
        break;
      case 'volcanic':
        for (let i = 0; i < 24; i++) {
          g.fillStyle = i % 3 ? 'rgba(255,140,50,0.8)' : 'rgba(255,220,120,0.9)';
          g.fillRect(wrap(i * 83 + Math.sin(t * 1.4 + i) * 10, cw), wrap(ch - ((t * (25 + (i % 4) * 8) + i * 41) % ch), ch), 2, 2);
        }
        break;
      case 'desert':
        g.fillStyle = 'rgba(230,200,140,0.35)';
        for (let i = 0; i < 18; i++) g.fillRect(wrap(i * 71 + t * (60 + (i % 3) * 20), cw), wrap(i * 43 + Math.sin(t + i) * 8, ch), 6, 1);
        break;
      default:
        g.fillStyle = biome === 'citadel' ? 'rgba(190,130,255,0.45)' : 'rgba(210,220,255,0.28)';
        for (let i = 0; i < 20; i++) g.fillRect(wrap(i * 89 + Math.sin(t * 0.6 + i) * 18, cw), wrap(i * 47 - t * (6 + (i % 3) * 3), ch), 2, 2);
    }
  }

  private drawMinimap(map: TileMap): void {
    const w = this.session.state.world;
    const scale = 3;
    this.minimap.width = map.w * scale;
    this.minimap.height = map.h * scale;
    const g = this.minimap.getContext('2d');
    if (!g) return;
    g.fillStyle = '#05030a';
    g.fillRect(0, 0, this.minimap.width, this.minimap.height);
    for (let y = 0; y < map.h; y++) {
      for (let x = 0; x < map.w; x++) {
        if (!explored(w, map, x, y)) continue;
        g.fillStyle = minimapColor(map.biome, tileAt(map, x, y));
        g.fillRect(x * scale, y * scale, scale, scale);
      }
    }
    const dot = (x: number, y: number, color: string): void => {
      g.fillStyle = color;
      g.fillRect(x * scale - 1, y * scale - 1, scale + 2, scale + 2);
    };
    const day = this.session.state.clock.day;
    for (const e of map.entities) {
      if (!explored(w, map, e.x, e.y) || !entityActive(w, map, e, day)) continue;
      const color = { town: '#ffd84a', dungeon: '#b070ff', shrine: content.gods.find(e.ref ?? '')?.color ?? '#fff', waypoint: '#6af0ff', worldBoss: '#ff3a3a', boss: '#ff3a3a', exit: '#ffffff', chest: '#c8a040', enemies: '#e06030' }[e.kind as string];
      if (color) dot(e.x, e.y, color);
    }
    for (const m of this.session.quests.markers(map.id)) dot(m.x, m.y, m.quest === this.session.state.quests.tracked ? '#ffd84a' : '#c08a3a');
    const p = w.position;
    dot(p.x, p.y, '#ffffff');
  }

  /** The tracked quest: its current objectives and where they are. */
  private trackedPanel(): HTMLElement[] {
    const s = this.session;
    const id = s.state.quests.tracked;
    const prog = id ? s.state.quests.active[id] : undefined;
    if (!id || !prog) return [];
    const q = s.quests.def(id);
    const st = stageOf(q, prog.stage);
    const lines = st.objectives.map((o) => {
      const done = objectiveDone(s.state, prog, o);
      const line = objectiveLine(s, q.id, o.id);
      const where = done ? '' : objectiveWhere(s, q, o);
      return el('div', { class: done ? 'obj done small' : 'obj small' }, `${done ? '✓' : '○'} ${o.text}${line && line !== 'done' ? ` ${line}` : ''}`, ...(where ? [el('div', { class: 'dim small' }, where)] : []));
    });
    const turnIn = st.turnIn && st.objectives.every((o) => objectiveDone(s.state, prog, o)) ? content.npcs.get(st.turnIn) : undefined;
    const log = el('button', { class: 'tab' }, 'Quest log (J)');
    log.addEventListener('click', () => this.nav.quests());
    const guests = s.quests.guests();
    return [
      el(
        'div',
        { class: 'tracked-quest' },
        el('b', {}, q.name),
        el('div', { class: 'small' }, st.text),
        ...lines,
        ...(turnIn ? [el('div', { class: 'small quest-turnin' }, `Return to ${turnIn.name}.`)] : []),
        ...(guests.length ? [el('div', { class: 'small' }, `Escorting: ${guests.map((g) => content.enemies.get(g.enemyId).name).join(', ')}`)] : []),
        log,
      ),
    ];
  }

  private drawSide(map: TileMap): void {
    const s = this.session;
    const zone = s.world.zone;
    const dungeon = isDungeon(map.id) ? content.dungeons.get(map.id) : undefined;
    const weather = content.weather.find(s.world.weatherNow());
    const here = s.world.here();
    const btn = (label: string, run: () => void, cls = ''): HTMLButtonElement => {
      const b = el('button', { class: cls }, label);
      b.addEventListener('click', run);
      return b;
    };
    const actions: HTMLElement[] = [btn('World map (M)', () => this.openMap())];
    if (here?.kind === 'town' && here.ref) actions.unshift(btn(`Enter ${content.towns.get(here.ref).name} (E)`, () => this.enterTown(here.ref as string), 'primary'));
    if (here?.kind === 'shrine') actions.unshift(btn('Pray at the shrine (E)', () => this.nav.pantheon(), 'primary'));
    const marker = s.world.markerHere();
    if (marker) actions.unshift(btn(`${marker.label} (E)`, () => this.useHere(), 'primary'));
    if (!s.world.inTown() && !dungeon) {
      const minutes = s.general.restMinutes();
      actions.push(btn(`Make camp (${Math.floor(minutes / 60)}h)`, () => {
        s.general.rest();
        this.say('You make camp and rest.');
        this.draw();
      }));
    }
    const ng = s.state.ngPlus;
    const levels = dungeon ? `Level ${worldLevel(dungeon.level, ng)}` : `Levels ${worldLevel(zone.levels[0], ng)}-${worldLevel(zone.levels[1], ng)}${ng ? ` · NG+${ng}` : ''}`;
    // Each biome tints the stage border and the side panel header so zones feel different at a glance.
    const accent = BIOME_ACCENT[map.biome] ?? '#c8a040';
    this.side.style.setProperty('--zone-accent', accent);
    this.canvas.parentElement?.style.setProperty('--zone-accent', accent);
    this.side.replaceChildren(
      el('h2', {}, map.name),
      el('div', { class: 'dim small' }, `${levels}${dungeon && s.state.world.dungeonsCleared.includes(dungeon.id) ? ' · cleared' : ''}`),
      el('div', { class: 'small' }, `${formatClock(s.state.clock)} · ${timeOfDay(s.state.clock) === 'night' ? 'Night' : 'Day'}${dungeon ? '' : ` · ${weather?.name ?? ''}`}`),
      ...(weather && !dungeon && weather.id !== 'clear' ? [el('div', { class: 'dim small' }, weather.description)] : []),
      this.minimap,
      ...this.trackedPanel(),
      el('div', { class: 'world-actions' }, ...actions),
      el('div', { class: 'world-log small' }, ...this.log.map((line) => el('div', {}, line))),
      el('p', { class: 'dim small' }, 'WASD or arrows to move. Walk into things to use them. E uses what you stand on. Cracked walls hide secrets.'),
    );
  }
}

