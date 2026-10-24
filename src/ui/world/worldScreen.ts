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
import { entityIcon, minimapColor, tileImage } from './tileArt';
import { WorldMapOverlay } from './worldMap';

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

  constructor(
    private readonly session: GameSession,
    private readonly nav: Nav,
    private readonly fight: (encounter: EncounterDef, level: number) => void,
    private readonly enterTown: (town: string) => void,
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
    this.draw();
  }

  unmount(): void {
    for (const off of this.offs) off();
    this.offs = [];
    this.observer?.disconnect();
    this.overlay?.close();
  }

  private say(text: string | undefined): void {
    if (!text) return;
    this.log = [...this.log, text].slice(-6);
  }

  private onKey(e: KeyboardEvent): void {
    if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
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
    if (r.kind !== 'blocked' || r.message) this.say(r.message);
    this.draw();
  }

  /** Uses what you are standing on again (enter a town, read a shrine...). */
  private useHere(): void {
    const s = this.session;
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
    g.fillStyle = '#05030a';
    g.fillRect(0, 0, cw, ch);
    const p = w.position;
    const ox = Math.round(cw / 2 - (p.x + 0.5) * TILE);
    const oy = Math.round(ch / 2 - (p.y + 0.5) * TILE);
    const x0 = Math.max(0, Math.floor(-ox / TILE));
    const y0 = Math.max(0, Math.floor(-oy / TILE));
    const x1 = Math.min(map.w - 1, Math.ceil((cw - ox) / TILE));
    const y1 = Math.min(map.h - 1, Math.ceil((ch - oy) / TILE));
    const day = s.state.clock.day;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (!explored(w, map, x, y)) continue;
        let t = tileAt(map, x, y);
        if (t === 'D' && runesDone(w, map)) t = '_';
        if (t === 'X' && w.used[usedKey(map.id, `crack-${x}-${y}`)] !== undefined) t = map.biome === 'dungeon' ? '_' : '.';
        g.drawImage(tileImage(map.biome, t, (x * 7 + y * 13) % 4), ox + x * TILE, oy + y * TILE, TILE, TILE);
      }
    }
    for (const e of map.entities) {
      if (!explored(w, map, e.x, e.y) || !entityActive(w, map, e, day)) continue;
      const img = this.entityImage(map, e);
      if (!img) continue;
      const big = e.kind === 'worldBoss' || e.kind === 'boss';
      const size = big ? TILE * 1.3 : TILE;
      g.drawImage(img, ox + e.x * TILE + (TILE - size) / 2, oy + e.y * TILE + (TILE - size), size, size);
      if (big) {
        g.fillStyle = '#ffd84a';
        g.fillRect(ox + e.x * TILE + TILE / 2 - 4, oy + e.y * TILE - TILE * 0.35, 8, 3);
      }
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
    // The hero.
    const cls = s.player.classes[0] ? content.classes.get(s.player.classes[0].classId) : undefined;
    const hero = portraitCanvas(s.player.raceId, s.player.portrait, cls?.color ?? '#888888');
    g.fillStyle = cls?.color ?? '#ffd84a';
    g.fillRect(ox + p.x * TILE + 1, oy + p.y * TILE + 1, TILE - 2, TILE - 2);
    g.drawImage(hero, ox + p.x * TILE + 3, oy + p.y * TILE + 3, TILE - 6, TILE - 6);
    // Night and weather tints (dungeons are lit by torches).
    if (!isDungeon(map.id)) {
      const weather = content.weather.find(s.world.weatherNow());
      if (weather?.tint) {
        g.fillStyle = weather.tint;
        g.fillRect(0, 0, cw, ch);
      }
      if (timeOfDay(s.state.clock) === 'night') {
        g.fillStyle = 'rgba(10,12,50,0.38)';
        g.fillRect(0, 0, cw, ch);
      }
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
    const p = w.position;
    dot(p.x, p.y, '#ffffff');
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
    if (!s.world.inTown() && !dungeon) {
      const minutes = s.general.restMinutes();
      actions.push(btn(`Make camp (${Math.floor(minutes / 60)}h)`, () => {
        s.general.rest();
        this.say('You make camp and rest.');
        this.draw();
      }));
    }
    const levels = dungeon ? `Level ${dungeon.level}` : `Levels ${zone.levels[0]}-${zone.levels[1]}`;
    this.side.replaceChildren(
      el('h2', {}, map.name),
      el('div', { class: 'dim small' }, `${levels}${dungeon && s.state.world.dungeonsCleared.includes(dungeon.id) ? ' · cleared' : ''}`),
      el('div', { class: 'small' }, `${formatClock(s.state.clock)} · ${timeOfDay(s.state.clock) === 'night' ? 'Night' : 'Day'}${dungeon ? '' : ` · ${weather?.name ?? ''}`}`),
      ...(weather && !dungeon && weather.id !== 'clear' ? [el('div', { class: 'dim small' }, weather.description)] : []),
      this.minimap,
      el('div', { class: 'world-actions' }, ...actions),
      el('div', { class: 'world-log small' }, ...this.log.map((line) => el('div', {}, line))),
      el('p', { class: 'dim small' }, 'WASD or arrows to move. Walk into things to use them. E uses what you stand on. Cracked walls hide secrets.'),
    );
  }
}

