import { content } from '../../data';
import { AFFLICTIONS, CATCH_PERCENT, HARD_ROAD_CAMP_PERCENT, HARSH_ZONES, LONG_MADNESS, MARCH_STEPS, SHORT_MADNESS, SKIPPED_REST_DAYS, WEARINESS, WEARINESS_MAX, WHISPER, WHISPER_NAMES, WHISPER_SOURCES, type AfflictionDef, type Madness } from '../../data/afflictions';
import { createAfflictions, type AfflictionsState } from '../realm/marvels';
import { characterStats } from '../character/stats';
import type { ModifierSpec } from '../stats/modifiers';
import type { GameSession } from './gameState';

export type AResult = { ok: true; text: string } | { ok: false; reason: string };
const fail = (reason: string): AResult => ({ ok: false, reason });
const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

/**
 * Section I-7a: Afflictions (211), Weariness (214), the Hard Road (216) and the Whisper Meter (213).
 * State: `realm.marvels.afflictions`. Stat effects go out through `mods()` into `WondersActions.refresh()`.
 * Flanking (215) is a combat rule in `combat/hits.ts`.
 */
export class AfflictionActions {
  constructor(private readonly s: GameSession) {
    const bus = s.bus;
    bus.on('enemyKilled', (e) => this.onKill(e.enemyId, e.tier));
    bus.on('zoneEntered', (e) => this.onZone(e.zoneId));
    bus.on('timeChanged', (e) => this.onDay(e.day));
    bus.on('questComplete', (e) => this.onQuest(e.questId));
    bus.on('levelUp', (e) => (e.characterId === s.player.id && e.classId === undefined ? this.onLevel() : undefined));
    bus.on('combatStarted', () => this.onBattleStart());
    bus.on('combatEnded', () => this.onBattleEnd());
  }

  get t(): AfflictionsState {
    const m = this.s.state.realm.marvels;
    if (!m.afflictions) {
      m.afflictions = createAfflictions();
      m.afflictions.lastDay = m.afflictions.weary.lastRest = this.day;
    }
    return m.afflictions;
  }

  private get day(): number {
    return this.s.state.clock.day;
  }

  private changed(reason: string): void {
    this.s.player.weary = this.t.weary.level;
    this.s.wonders.refresh();
    this.s.bus.emit('stateChanged', { reason });
  }

  private toast(kind: 'info' | 'warning', text: string): void {
    this.s.bus.emit('toast', { kind, text });
  }

  // ------------------------------------------------------------------ 211: Afflictions

  def(id: string): AfflictionDef {
    const d = AFFLICTIONS.find((a) => a.id === id);
    if (!d) throw new Error(`Unknown affliction: ${id}`);
    return d;
  }

  has(id: string): boolean {
    return this.t.active[id] !== undefined;
  }

  embraced(id: string): boolean {
    return this.t.active[id]?.embraced === true;
  }

  /** Catch an affliction (a carrier's bite, a touch, a chill). Returns false when you already carry it. */
  catchIt(id: string): boolean {
    const d = this.def(id);
    if (this.has(id)) return false;
    this.t.active[id] = { embraced: false, points: 0, since: this.day };
    this.s.setFlag(`affliction:${id}`, true);
    this.toast('warning', `${d.name}: ${d.catchText}`);
    this.changed('affliction');
    return true;
  }

  private onKill(enemyId: string, tier: string): void {
    const e = content.enemies.has(enemyId) ? content.enemies.get(enemyId) : undefined;
    if (!e) return;
    const types = e.types ?? [];
    // Carriers: beast, undead (vampires first), construct, void or undead (Hollowing).
    const hits = AFFLICTIONS.filter((a) => (a.carrier.ids ? a.carrier.ids.test(enemyId) : a.carrier.types.some((t) => types.includes(t))) && !this.has(a.id));
    if (hits.length && this.s.rng.percent(CATCH_PERCENT)) {
      const pick = this.s.rng.pick(hits);
      this.catchIt(pick.id);
    }
    // Points for the power tree: one per boss.
    if (tier === 'boss' || tier === 'worldBoss') for (const id of Object.keys(this.t.active)) if (this.embraced(id)) (this.t.active[id] as { points: number }).points++;
    // The Whisper Meter.
    if (WHISPER_SOURCES.mothPattern.test(enemyId)) this.addWhisper(WHISPER_SOURCES.moth, 'Lantern moths drink the light and leave a hum behind.');
    else if ((tier === 'boss' || tier === 'worldBoss') && types.includes('void')) this.addWhisper(WHISPER_SOURCES.voidBoss, 'The dead void keeps talking after it is gone.');
  }

  private onQuest(questId: string): void {
    for (const a of AFFLICTIONS) {
      if (questId === a.cureQuest && this.has(a.id)) this.cure(a.id);
    }
  }

  cure(id: string): AResult {
    const d = this.def(id);
    if (!this.has(id)) return fail(`You do not carry ${d.name}.`);
    delete this.t.active[id];
    this.t.cured.push(id);
    this.s.setFlag(`affliction:${id}`, false);
    this.toast('info', `${d.name} lets go of you.`);
    this.changed('affliction');
    return { ok: true, text: `${d.name} is cured. Whatever you learned of it, you keep.` };
  }

  embrace(id: string): AResult {
    const d = this.def(id);
    const a = this.t.active[id];
    if (!a) return fail(`You do not carry ${d.name}.`);
    if (a.embraced) return fail('You have already given in.');
    a.embraced = true;
    a.points = Math.max(a.points, 1);
    this.changed('affliction');
    return { ok: true, text: `You embrace ${d.name}. ${d.embraceText}` };
  }

  /** Spend a point on a power-tree node (a node needs the one before it in its lane). */
  learn(id: string, nodeId: string): AResult {
    const d = this.def(id);
    const a = this.t.active[id];
    if (!a || !a.embraced) return fail(`Embrace ${d.name} first.`);
    const idx = d.tree.findIndex((n) => n.id === nodeId);
    if (idx < 0) return fail('No such node.');
    const known = (this.t.nodes[id] ??= []);
    if (known.includes(nodeId)) return fail('Already learned.');
    if (idx % 4 !== 0 && !known.includes((d.tree[idx - 1] as { id: string }).id)) return fail('Learn the node before it in this lane first.');
    if (this.pointsLeft(id) <= 0) return fail('No points to spend: level up or fell a boss.');
    known.push(nodeId);
    this.changed('affliction');
    return { ok: true, text: `${(d.tree[idx] as { name: string }).name}: ${(d.tree[idx] as { text: string }).text}` };
  }

  pointsLeft(id: string): number {
    const a = this.t.active[id];
    return a ? a.points - (this.t.nodes[id]?.length ?? 0) : 0;
  }

  private onLevel(): void {
    for (const id of Object.keys(this.t.active)) if (this.embraced(id)) (this.t.active[id] as { points: number }).points++;
    this.onDay(this.day);
  }

  /** The moon (every eighth night) and the dark (any night). */
  private flareOn(a: AfflictionDef): boolean {
    const night = this.s.timeOfDay === 'night';
    if (a.flare === 'always') return true;
    if (a.flare === 'night') return night;
    if (a.flare === 'moon') return night && this.day % 8 === 0;
    return !night;
  }

  // ------------------------------------------------------------------ 214: Weariness 1-6

  get weary(): number {
    return this.t.weary.level;
  }

  get wearyName(): string {
    return this.weary === 0 ? 'Rested' : (WEARINESS[this.weary - 1] as { name: string }).name;
  }

  addWeary(n: number, why: string): void {
    const before = this.t.weary.level;
    this.t.weary.level = clamp(before + n, 0, WEARINESS_MAX);
    if (this.t.weary.level === before) return;
    this.toast('warning', `${why} Weariness ${this.t.weary.level}/${WEARINESS_MAX}: ${this.wearyName}.`);
    this.changed('weariness');
  }

  private onZone(zoneId: string): void {
    const t = this.t.weary;
    t.steps++;
    if (t.steps >= MARCH_STEPS) {
      t.steps = 0;
      this.addWeary(1, 'A forced march wears you down.');
    }
    const harsh = HARSH_ZONES[zoneId];
    if (harsh) this.addWeary(1, harsh);
    const w = WHISPER_SOURCES.zones[zoneId];
    if (w) this.addWhisper(w, 'The place murmurs as you enter.');
  }

  private onDay(day: number): void {
    const t = this.t;
    const last = t.lastDay ?? day;
    t.lastDay = day;
    if (day <= last) return;
    // A skipped rest: every SKIPPED_REST_DAYS without a Night’s Rest costs a level.
    if (day - t.weary.lastRest >= SKIPPED_REST_DAYS && (day - t.weary.lastRest) % SKIPPED_REST_DAYS === 0) this.addWeary(1, 'You have gone without a proper rest.');
    // The whispers fade a little with the dawn.
    if (t.whisper.meter > 0) {
      t.whisper.meter = Math.max(0, t.whisper.meter - WHISPER.dayCut * (day - last));
      this.changed('whisper');
    }
  }

  /** A Night’s Rest (camp with Well Rested, inn, home): weariness drops by one, whispers by a lot, long madness ends. */
  onRest(): void {
    const t = this.t;
    t.weary.lastRest = this.day;
    t.weary.steps = 0;
    t.weary.level = Math.max(0, t.weary.level - 1);
    t.whisper.meter = Math.max(0, t.whisper.meter - WHISPER.restCut);
    t.whisper.long = undefined;
    t.whisper.short = undefined;
    this.changed('rest');
  }

  // ------------------------------------------------------------------ 216: the Hard Road

  get hardRoad(): boolean {
    return this.t.hardRoad === true;
  }

  setHardRoad(on: boolean): void {
    this.t.hardRoad = on;
    this.changed('hardroad');
  }

  /** Under the Hard Road a camp in the wild is only a rough camp: half back, no Night’s Rest. Towns and inns still rest fully. */
  roughCamp(): AResult {
    const p = this.s.player;
    const st = characterStats(p);
    p.hp = Math.min(st.maxHp, p.hp + Math.round((st.maxHp * HARD_ROAD_CAMP_PERCENT) / 100));
    p.mp = Math.min(st.maxMp, p.mp + Math.round((st.maxMp * HARD_ROAD_CAMP_PERCENT) / 100));
    this.s.advanceTime(6 * 60);
    this.s.bus.emit('stateChanged', { reason: 'camp' });
    return { ok: true, text: `You make a rough camp: ${HARD_ROAD_CAMP_PERCENT}% of your health and mana return. Only a town’s bed gives a Night’s Rest on the Hard Road.` };
  }

  // ------------------------------------------------------------------ 213: Whisper Meter

  get whisper(): number {
    return this.t.whisper.meter;
  }

  get whisperName(): string {
    return WHISPER_NAMES[Math.min(WHISPER_NAMES.length - 1, Math.floor(this.whisper / 25))] as string;
  }

  addWhisper(n: number, why: string): void {
    const w = this.t.whisper;
    const before = w.meter;
    w.meter = clamp(w.meter + n, 0, WHISPER.max);
    if (w.meter === before) return;
    if (Math.floor(before / 25) !== Math.floor(w.meter / 25)) this.toast('warning', `${why} The whispers grow ${this.whisperName.toLowerCase()}.`);
    this.changed('whisper');
  }

  /** Before each fight: past the Short line the whispers may bring a madness; past the Long line one that lasts. */
  private onBattleStart(): void {
    const w = this.t.whisper;
    if (w.meter >= WHISPER.long && !w.long && this.s.rng.percent(w.meter)) {
      const m = this.s.rng.pick(LONG_MADNESS);
      w.long = { id: m.id, until: this.day + WHISPER.longDays };
      this.toast('warning', `${m.name}: ${m.text}`);
      this.changed('madness');
    } else if (w.meter >= WHISPER.short && !w.short && this.s.rng.percent(w.meter)) {
      const m = this.s.rng.pick(SHORT_MADNESS);
      w.short = { id: m.id, battles: WHISPER.shortBattles };
      this.toast('warning', `${m.name}: ${m.text}`);
      this.changed('madness');
    }
  }

  private onBattleEnd(): void {
    const w = this.t.whisper;
    if (w.short && --w.short.battles <= 0) {
      w.short = undefined;
      this.changed('madness');
    }
    if (w.long && w.long.until < this.day) {
      w.long = undefined;
      this.changed('madness');
    }
  }

  /** The madness that is working on the hero now. */
  madness(): Madness[] {
    const w = this.t.whisper;
    const out: Madness[] = [];
    if (w.short) out.push(SHORT_MADNESS.find((m) => m.id === w.short?.id) as Madness);
    if (w.long) out.push(LONG_MADNESS.find((m) => m.id === w.long?.id) as Madness);
    return out.filter(Boolean);
  }

  /** "Unreliable UI": a displayed number that lies while the meter is high. The true value is never changed. */
  shown(real: number): number {
    if (!this.madness().some((m) => m.ui === 'jitter')) return real;
    const wobble = 1 + (((this.day * 31 + Math.round(real) * 17) % 21) - 10) / 100;
    return Math.max(0, Math.round(real * wobble));
  }

  /** The line a false enemy or a hush shows in the log or HUD while the madness lasts (undefined when sane). */
  hallucination(): string | undefined {
    const m = this.madness().find((x) => x.ui === 'phantom' || x.ui === 'hush');
    return m ? (m.ui === 'phantom' ? 'Something is there at the edge of sight. It is not.' : 'The world has gone quiet.') : undefined;
  }

  // ------------------------------------------------------------------ the sum

  mods(): ModifierSpec[] {
    const out: ModifierSpec[] = [];
    for (const [id, a] of Object.entries(this.t.active)) {
      const d = this.def(id);
      out.push(...d.curse);
      if (this.flareOn(d)) out.push(...d.flareMods);
      if (a.embraced) for (const n of d.tree) if (this.t.nodes[id]?.includes(n.id)) out.push(...n.mods);
    }
    const w = this.t.weary.level;
    if (w > 0) out.push(...(WEARINESS[w - 1] as { mods: ModifierSpec[] }).mods);
    for (const m of this.madness()) out.push(...m.mods);
    return out;
  }
}
