import { content } from '../../data';
import { MOUNTED } from '../../data/mounted';
import { BELLS, BOOKS, CANALS, CINDER, CLANS, GALLERY, GODLESS, HOURGLASS, LANTERN, LIBRARY, MASQUE, OSSUARY, PAPER, STEPPE, THROAT, WICK, WILDS, WILDS_HOLLOW } from '../../data/pockets';
import type { GauntletState } from '../endgame/types';
import { Rng } from '../core/rng';
import { characterStats } from '../character/stats';
import { heartOf } from '../heart/heart';
import { createPockets, type PocketsState } from '../realm/marvels';
import { generalRank } from '../skills/general';
import { mapFor } from '../world/mapgen';
import type { MechanicResult } from '../world/mechanics';
import type { ModifierSpec } from '../stats/modifiers';
import type { GameSession } from './gameState';

export type PResult = { ok: true; text?: string } | { ok: false; reason: string };
const fail = (reason: string): PResult => ({ ok: false, reason });
const hash = (s: string): number => {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
};

/**
 * Pocket regions (100-105), the Godless Wilds (99) and the rules of the seven dungeons (106-112). The maps are ordinary generated
 * areas and dungeons (`data/pockets.ts`); this class holds each place's own rule, which the Codex > Realm > Pockets tab works while you
 * stand in the place. State: `realm.marvels.pockets`.
 */
export class PocketActions {
  constructor(private readonly s: GameSession) {
    s.specials['pocket'] = (a, won) => this.fightEnded(a, won);
    s.bus.on('timeChanged', () => this.tick());
  }

  get p(): PocketsState {
    const m = this.s.state.realm.marvels;
    return (m.pockets ??= createPockets());
  }

  /** The map the hero stands on. */
  here(): string {
    return this.s.state.world.position.map;
  }

  private absHour(): number {
    return this.s.state.clock.day * 24 + Math.floor(this.s.state.clock.minute / 60);
  }

  private note(text: string, kind: 'level' | 'loot' | 'info' | 'quest' | 'warning' = 'info'): void {
    this.s.bus.emit('toast', { kind, text });
  }

  private changed(reason: string): void {
    this.s.wonders.refresh();
    this.s.bus.emit('stateChanged', { reason });
  }

  private title(t: string): void {
    if (!this.s.player.devotion.titles.includes(t)) this.s.player.devotion.titles.push(t);
  }

  private roll(seed: string, stat: string): number {
    const stats = characterStats(this.s.player) as unknown as Record<string, number>;
    return new Rng(hash(seed)).int(1, 20) + Math.floor((stats[stat] ?? 10) / 2) - 3;
  }

  private hurt(frac: number): void {
    const max = characterStats(this.s.player).maxHp;
    this.s.player.hp = Math.max(1, this.s.player.hp - Math.max(1, Math.round(max * frac)));
  }

  private reward(perLevel: number, why: string): number {
    const gold = perLevel * this.s.player.level;
    this.s.addGold(gold, why);
    return gold;
  }

  /** What the pockets give the hero: the mounted steppe, the clans’ boons, bone-forged vigor, ash and emberbloom, the library. */
  mods(): ModifierSpec[] {
    const out: ModifierSpec[] = [];
    if (this.here() === 'weeping-steppe') out.push(...(this.s.player.stable?.mount ? STEPPE.mounted : MOUNTED.steppeOnFoot));
    for (const c of CLANS) if ((this.p.hosp[c.id] ?? 0) >= STEPPE.boonAt) out.push(c.boon);
    for (let i = 0; i < this.p.wrights; i++) out.push(OSSUARY.wrightMod);
    if (this.p.ash >= CINDER.target) out.push(CINDER.ashMod);
    if (this.p.bloom >= CINDER.target) out.push(CINDER.bloomMod);
    if (this.p.read.length >= BOOKS.length) out.push(LIBRARY.mod);
    return out;
  }

  // ------------------------------------------------------------------ the world calls these

  /** Every arrival: the Wilds silence the gods, the Lanternmarch lights your lamp, the chapel lights its candle. */
  onMap(map: string): void {
    const p = this.p;
    const godless = WILDS.includes(map) || map === WILDS_HOLLOW;
    const was = Boolean(this.s.player.world.godless);
    if (godless) {
      this.s.player.world.godless = true;
      if (WILDS.includes(map) && !p.wilds.includes(map)) {
        p.wilds.push(map);
        if (p.wilds.length === WILDS.length) this.title(GODLESS.title);
      }
    } else delete this.s.player.world.godless;
    if (map === 'lanternmarch' && p.burnHour === 0) {
      p.oil = LANTERN.startOil;
      p.burnHour = this.absHour();
    } else if (map !== 'lanternmarch') p.burnHour = p.burnHour ? this.absHour() : 0;
    if (map === 'old-wicks-chapel' && this.absHour() - p.wick.hour >= 24) {
      p.wick.wax = WICK.hours;
      p.wick.hour = this.absHour();
    }
    if (godless !== was || map === 'weeping-steppe') this.changed('pocket');
  }

  /** Cinderhollow shows its burning face by day and its green one by night. */
  redirect(ref: string): string {
    if (ref !== 'cinderhollow-day' && ref !== 'cinderhollow-night') return ref;
    return this.layout() === 'burning' ? 'cinderhollow-day' : 'cinderhollow-night';
  }

  /** The rule of the place under the hero’s feet, once per step. */
  step(map: string): MechanicResult {
    const w = this.s.state.world;
    const p = this.p;
    if (WILDS.includes(map) || map === WILDS_HOLLOW) {
      const harm = Math.max(0, GODLESS.harm - this.protection() * GODLESS.perProtection);
      return harm > 0 ? { harm, message: 'The Wilds take no notice of you, and the cold takes plenty.' } : {};
    }
    if (map === 'paper-labyrinth' && (w.dsteps ?? 0) % PAPER.decayEvery === 0 && p.paper.prog > 0) p.paper.prog--;
    if (map === 'old-wicks-chapel' && p.wick.wax <= 0) return { harm: WICK.harm, message: 'The candle is out, and the dark bites.' };
    return {};
  }

  /** What shields you where no god will: Wayfarer’s Arts you carry, Relic Tools you own and a proper kit. */
  protection(): number {
    const h = heartOf(this.s.player);
    const gear = Object.keys(this.s.player.equipment).length >= GODLESS.gearPieces ? 2 : 0;
    return Object.keys(h.adopted).length + h.tools.length + gear;
  }

  private tick(): void {
    const p = this.p;
    const now = this.absHour();
    const here = this.here();
    if (here === 'lanternmarch' && p.burnHour) {
      const left = Math.max(0, p.oil - Math.max(0, now - p.burnHour) * LANTERN.burnPerHour);
      p.burnHour = now;
      if (left < p.oil) p.oil = left;
      if (p.oil <= 0 && !p.hunted && new Rng(hash(`wick:${now}`)).chance(LANTERN.wickChance)) {
        p.hunted = true;
        this.note('Your lamp gutters out. In the dark, something thin and patient begins to feed on the shadows.', 'warning');
      }
    }
    if (here === 'old-wicks-chapel') {
      p.wick.wax = Math.max(0, p.wick.wax - Math.max(0, now - p.wick.hour));
      p.wick.hour = now;
    }
    const tide = Math.floor(this.s.state.clock.day / CANALS.tideDays);
    if (p.raised.length && p.tide !== tide) this.setTide(tide);
    if (here === 'cinderhollow-day' || here === 'cinderhollow-night') {
      const want = this.layout() === 'burning' ? 'cinderhollow-day' : 'cinderhollow-night';
      if (want !== here) {
        const e = mapFor(want).spawns.entrance;
        this.s.state.world.position = { map: want, x: e[0] + 1, y: e[1] };
        this.note(want === 'cinderhollow-day' ? 'Dawn: the forest catches, tree by tree.' : 'Dusk: the fires go out, and the trees stand whole again.', 'info');
        this.changed('pocket');
      }
    }
  }

  // ------------------------------------------------------------------ 99: the Godless Wilds

  inWilds(): boolean {
    return WILDS.includes(this.here()) || this.here() === WILDS_HOLLOW;
  }

  // ------------------------------------------------------------------ 100: Lanternmarch

  oilPrice(): number {
    return LANTERN.oilPrice * Math.ceil(this.s.player.level / 5);
  }

  buyOil(n: number): PResult {
    if (this.here() !== 'lanternmarch') return fail('Lamp-oil is sold in Lanternmarch.');
    const q = Math.min(n, LANTERN.maxOil - Math.floor(this.p.oil));
    if (q < 1) return fail('Your lamp is full.');
    if (!this.s.spendGold(q * this.oilPrice(), 'oil')) return fail(`That costs ${q * this.oilPrice()} gold.`);
    this.p.oil += q;
    this.p.hunted = false;
    this.changed('pocket');
    return { ok: true, text: `Lamp filled by ${q}. The dark steps back.` };
  }

  faceWicks(): PResult {
    if (!this.p.hunted) return fail('Nothing is hunting you.');
    const rng = new Rng(hash(`wicks:${this.s.state.clock.day}`));
    const pool = ['lantern-moth', 'moth-swarm', 'lantern-moth-queen', 'lantern-moth'].filter((id) => content.enemies.find(id));
    const wave = (n: number): string[] => Array.from({ length: n }, () => rng.pick(pool));
    return this.fight('wicks', 'The Wick-Eaters', this.s.player.level + LANTERN.wickLevelOffset, [wave(2), wave(3)], 6);
  }

  // ------------------------------------------------------------------ 101: the Ossuary Coast

  mineMarrow(): PResult {
    if (this.here() !== 'ossuary-coast') return fail('Whale marrow is mined on the Ossuary Coast.');
    this.s.advanceTime(30);
    const rank = generalRank(this.s.player, 'mining');
    if (this.roll(`marrow:${this.s.state.clock.day}:${this.p.marrow}`, 'str') + rank * 2 < OSSUARY.dc) return { ok: true, text: 'The bone rings and gives nothing.' };
    const n = 1 + Math.floor(rank / 3) * OSSUARY.perThreeRanks;
    this.p.marrow += n;
    return { ok: true, text: `You crack a rib and draw out ${n} marrow.` };
  }

  sellMarrow(): PResult {
    if (this.p.marrow < 1) return fail('You carry no marrow.');
    const gold = this.p.marrow * OSSUARY.sellPerLevel * this.s.player.level;
    this.s.addGold(gold, 'marrow');
    const n = this.p.marrow;
    this.p.marrow = 0;
    return { ok: true, text: `${n} marrow sold for ${gold} gold.` };
  }

  /** The bone-wrights work marrow into something that lasts. */
  wright(): PResult {
    if (this.p.wrights >= OSSUARY.wrightMax) return fail('The bone-wrights have given you all they can.');
    if (this.p.marrow < OSSUARY.wrightCost) return fail(`They need ${OSSUARY.wrightCost} marrow.`);
    this.p.marrow -= OSSUARY.wrightCost;
    this.p.wrights++;
    if (this.p.wrights >= OSSUARY.wrightMax) this.title(OSSUARY.title);
    this.changed('pocket');
    return { ok: true, text: 'Marrow becomes a charm of white bone, warm against the skin.' };
  }

  // ------------------------------------------------------------------ 102: the Weeping Steppe

  cycle(): number {
    return Math.floor(this.s.state.clock.day / STEPPE.moveDays);
  }

  camp(clanIndex: number): string {
    return STEPPE.camps[(this.cycle() + clanIndex) % STEPPE.camps.length] as string;
  }

  giftCost(): number {
    return STEPPE.giftPerLevel * this.s.player.level;
  }

  /** Sit at a clan’s fire. One guest-gift per camp; three give you their boon. */
  host(clanId: string): PResult {
    const clan = CLANS.find((c) => c.id === clanId);
    if (!clan) return fail('No such clan.');
    if (this.here() !== 'weeping-steppe') return fail('The clans are met on the steppe.');
    if (this.p.hospCycle[clanId] === this.cycle()) return fail('You have sat at their fire; they have moved on, or are about to.');
    if (!this.s.spendGold(this.giftCost(), 'steppe')) return fail(`A guest-gift is ${this.giftCost()} gold.`);
    this.p.hospCycle[clanId] = this.cycle();
    this.p.hosp[clanId] = Math.min(STEPPE.hospitalityMax, (this.p.hosp[clanId] ?? 0) + 1);
    if (CLANS.every((c) => (this.p.hosp[c.id] ?? 0) >= STEPPE.hospitalityMax)) this.title(STEPPE.title);
    this.changed('pocket');
    return { ok: true, text: `${clan.name} makes room at the fire.${this.p.hosp[clanId] === STEPPE.boonAt ? ' They teach you their road-craft.' : ''}` };
  }

  // ------------------------------------------------------------------ 103: Verdigris Canals

  edge(n: number): [number, number] {
    const a = n % CANALS.islands;
    return [a, (a + 1 + ((n * 5 + (n >> 3) * 3) % (CANALS.islands - 1))) % CANALS.islands];
  }

  /** The 40 bridges, true when raised. Created on first look: most are up, a few down, and each tide the keepers raise three more. */
  bridges(): boolean[] {
    const p = this.p;
    if (p.raised.length === 0) {
      const rng = new Rng(hash('verdigris'));
      p.raised = Array.from({ length: CANALS.bridges }, () => true);
      for (let i = 0; i < CANALS.startLowered; i++) p.raised[rng.int(0, CANALS.bridges - 1)] = false;
      p.tide = Math.floor(this.s.state.clock.day / CANALS.tideDays);
    }
    return p.raised;
  }

  private setTide(tide: number): void {
    const rng = new Rng(hash(`tide:${tide}`));
    for (let i = 0; i < CANALS.autoRaise; i++) this.p.raised[rng.int(0, CANALS.bridges - 1)] = true;
    this.p.tide = tide;
  }

  /** Whether the lowered bridges join the Gate (island 0) to the Copper Exchange. */
  connected(): boolean {
    const up = this.bridges();
    const seen = new Set<number>([0]);
    const queue = [0];
    while (queue.length) {
      const at = queue.shift() as number;
      for (let n = 0; n < CANALS.bridges; n++) {
        if (up[n]) continue;
        const [a, b] = this.edge(n);
        const next = a === at ? b : b === at ? a : -1;
        if (next >= 0 && !seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    return seen.has(CANALS.goal);
  }

  toggleBridge(n: number): PResult {
    if (this.here() !== 'verdigris-canals') return fail('The bridges are worked in the Verdigris Canals.');
    if (n < 0 || n >= CANALS.bridges) return fail('No such bridge.');
    const up = this.bridges();
    up[n] = !up[n];
    this.s.advanceTime(15);
    this.changed('pocket');
    return { ok: true, text: `Bridge ${n + 1} is ${up[n] ? 'raised' : 'lowered'}.` };
  }

  /** Walk the lowered bridges to the Copper Exchange; it pays once a tide. */
  crossToExchange(): PResult {
    if (this.here() !== 'verdigris-canals') return fail('Go to the Verdigris Canals.');
    if (!this.connected()) return fail('The lowered bridges do not reach the Copper Exchange.');
    if (this.s.state.clock.day - this.p.paidDay < CANALS.tideDays) return fail('The Exchange has paid you this tide.');
    this.p.paidDay = this.s.state.clock.day;
    const gold = this.reward(CANALS.rewardPerLevel, 'canals');
    this.title(CANALS.title);
    this.s.advanceTime(60);
    return { ok: true, text: `The Exchange’s clerks count out ${gold} gold and ask, again, not to be thanked.` };
  }

  // ------------------------------------------------------------------ 104: Cinderhollow

  layout(): 'burning' | 'grown' {
    const h = Math.floor(this.s.state.clock.minute / 60);
    return h >= CINDER.burnFrom && h < CINDER.burnTo ? 'burning' : 'grown';
  }

  gatherAsh(): PResult {
    if (this.here() !== 'cinderhollow-day') return fail('Ash is gathered while the forest burns.');
    this.hurt(CINDER.harm);
    this.p.ash += CINDER.perGather;
    this.checkCinder();
    this.changed('pocket');
    return { ok: true, text: `You rake ${CINDER.perGather} measures of warm ash from the fire, and the fire takes a little of you in exchange.` };
  }

  gatherBloom(): PResult {
    if (this.here() !== 'cinderhollow-night') return fail('Emberbloom opens when the forest regrows.');
    this.p.bloom += CINDER.perGather;
    this.checkCinder();
    this.changed('pocket');
    return { ok: true, text: `You pick ${CINDER.perGather} emberblooms from the roots.` };
  }

  private checkCinder(): void {
    if (this.p.ash >= CINDER.target && this.p.bloom >= CINDER.target) this.title(CINDER.title);
  }

  // ------------------------------------------------------------------ 105: the Inverted Library

  flipGravity(): PResult {
    if (this.here() !== 'inverted-library') return fail('Gravity is flipped in the Inverted Library.');
    this.p.flipped = !this.p.flipped;
    this.s.advanceTime(LIBRARY.flipMinutes);
    return { ok: true, text: this.p.flipped ? 'The floor becomes the ceiling. The ceiling’s books are within reach.' : 'You fall the right way up, which is the wrong way for the high shelves.' };
  }

  canRead(id: string): boolean {
    const b = BOOKS.find((x) => x.id === id);
    return Boolean(b) && this.here() === 'inverted-library' && !this.p.read.includes(id) && b!.side === (this.p.flipped ? 'ceiling' : 'floor');
  }

  readBook(id: string): PResult {
    const b = BOOKS.find((x) => x.id === id);
    if (!b) return fail('No such book.');
    if (this.here() !== 'inverted-library') return fail('The books are in the Inverted Library.');
    if (this.p.read.includes(id)) return fail('You have read it.');
    if (b.side !== (this.p.flipped ? 'ceiling' : 'floor')) return fail(`It is on the ${b.side}, and you are standing the wrong way.`);
    this.p.read.push(id);
    this.s.grantXp(LIBRARY.perBookXpLevel * this.s.player.level, true);
    if (this.p.read.length === BOOKS.length) this.title(LIBRARY.title);
    this.changed('pocket');
    return { ok: true, text: `${b.title}: ${b.text}` };
  }

  // ------------------------------------------------------------------ 106: the Bellhouse

  ring(): PResult {
    const b = this.p.bells;
    if (this.here() !== 'bellhouse') return fail('The bells are in the Bellhouse.');
    b.noise = Math.min(BELLS.wakeAt, b.noise + BELLS.ring);
    b.paths = Math.min(BELLS.paths, b.paths + 1);
    let text = `A bell tolls and a hidden path shows itself (${b.paths} of ${BELLS.paths}).`;
    if (b.paths >= BELLS.paths && !b.done) {
      b.done = true;
      text += ` Every stair is found: +${this.reward(BELLS.goldPerLevel, 'bellhouse')} gold from a bell-founder’s strongbox.`;
    }
    if (b.noise >= BELLS.wakeAt) {
      const rng = new Rng(hash(`wardens:${this.s.state.clock.day}`));
      const pool = BELLS.wardens.filter((id) => content.enemies.find(id));
      const wave = (n: number): string[] => Array.from({ length: n }, () => rng.pick(pool));
      const r = this.fight('wardens', 'The Hollow Wardens', this.s.player.level, [wave(2), wave(3)], 4);
      return r.ok ? { ok: true, text: `${text} Too much noise: the Wardens wake.` } : { ok: true, text: `${text} The Wardens stir, but you are in the middle of something else.` };
    }
    return { ok: true, text };
  }

  hush(): PResult {
    if (this.here() !== 'bellhouse') return fail('The bells are in the Bellhouse.');
    this.p.bells.noise = Math.max(0, this.p.bells.noise - BELLS.hush);
    this.s.advanceTime(BELLS.hushMinutes);
    return { ok: true, text: 'You muffle the clappers one by one.' };
  }

  // ------------------------------------------------------------------ 107: Saltmother’s Throat

  breath(): 'ebb' | 'flow' {
    return Math.floor((this.s.state.world.dsteps ?? 0) / THROAT.period) % 2 === 0 ? 'ebb' : 'flow';
  }

  wade(): PResult {
    const t = this.p.throat;
    if (this.here() !== 'saltmothers-throat') return fail('Wading is done in Saltmother’s Throat.');
    if (this.breath() !== 'ebb') {
      this.hurt(THROAT.harm);
      return { ok: true, text: 'The breath comes in, and the tide knocks you flat. Take a few steps and try again.' };
    }
    t.wades++;
    let text = `You wade deeper on the ebb (${t.wades} of ${THROAT.wades}).`;
    if (t.wades >= THROAT.wades && !t.done) {
      t.done = true;
      text += ` The heart-chamber: +${this.reward(THROAT.goldPerLevel, 'throat')} gold in pearls.`;
    }
    return { ok: true, text };
  }

  // ------------------------------------------------------------------ 108: the Paper Labyrinth

  paperOpen(): boolean {
    const q = this.p.paper;
    return q.prog + q.shortcuts * PAPER.shortcutValue >= PAPER.need;
  }

  private paperCheck(): string {
    const q = this.p.paper;
    if (!q.done && this.paperOpen()) {
      q.done = true;
      return ` The way through is open: +${this.reward(PAPER.goldPerLevel, 'paper')} gold from a hidden folio.`;
    }
    return '';
  }

  burnWall(): PResult {
    if (this.here() !== 'paper-labyrinth') return fail('Walls are burned in the Paper Labyrinth.');
    this.p.paper.prog = Math.min(PAPER.need, this.p.paper.prog + 1);
    return { ok: true, text: `A wall curls to ash (${this.p.paper.prog} burned). It will redraw itself as you walk.${this.paperCheck()}` };
  }

  drawShortcut(): PResult {
    if (this.here() !== 'paper-labyrinth') return fail('Shortcuts are drawn in the Paper Labyrinth.');
    if (!this.s.player.classes.some((c) => c.classId === PAPER.class)) return fail('Only an Inkweaver can draw a way that stays.');
    if (this.p.paper.shortcuts >= PAPER.maxShortcuts) return fail('The maze will not take another line.');
    this.p.paper.shortcuts++;
    return { ok: true, text: `You ink a door that stays (${this.p.paper.shortcuts}).${this.paperCheck()}` };
  }

  // ------------------------------------------------------------------ 109: the Hourglass Vault

  hourglass(): boolean[] {
    const h = this.p.hourglass;
    if (h.bits.length === 0) {
      h.bits = Array.from({ length: HOURGLASS.rooms }, () => true);
      const rng = new Rng(hash('hourglass'));
      for (let i = 0; i < HOURGLASS.scramble; i++) this.toggleRoom(rng.int(0, HOURGLASS.rooms - 1));
      if (h.bits.every(Boolean)) this.toggleRoom(0);
    }
    return h.bits;
  }

  private toggleRoom(i: number): void {
    const b = this.p.hourglass.bits;
    b[i] = !b[i];
    if (i + 1 < b.length) b[i + 1] = !b[i + 1];
  }

  flipRoom(i: number): PResult {
    if (this.here() !== 'hourglass-vault') return fail('Rooms are turned in the Hourglass Vault.');
    const bits = this.hourglass();
    if (i < 0 || i >= bits.length) return fail('No such room.');
    this.toggleRoom(i);
    this.s.advanceTime(10);
    if (bits.every(Boolean) && !this.p.hourglass.done) {
      this.p.hourglass.done = true;
      return { ok: true, text: `Every glass runs the same way and every door stands open: +${this.reward(HOURGLASS.goldPerLevel, 'hourglass')} gold.` };
    }
    return { ok: true, text: `Room ${i + 1} turns, and the sand runs the other way${i + 1 < bits.length ? ' in the next as well' : ''}.` };
  }

  // ------------------------------------------------------------------ 110: the Masque Catacombs

  ghostKind(room: number): number {
    return hash(`masque:${room}`) % MASQUE.masks.length;
  }

  /** The one mask a ghost cannot see through. */
  hidingMask(room: number): number {
    return (this.ghostKind(room) + 1) % MASQUE.masks.length;
  }

  wearMask(n: number): PResult {
    if (this.here() !== 'masque-catacombs') return fail('Masks are worn in the Masque Catacombs.');
    if (n < 0 || n >= MASQUE.masks.length) return fail('No such mask.');
    this.p.masque.mask = n;
    return { ok: true, text: `You put on the ${MASQUE.masks[n]} mask.` };
  }

  passGhost(): PResult {
    const q = this.p.masque;
    if (this.here() !== 'masque-catacombs') return fail('The ghosts are in the Masque Catacombs.');
    if (q.room >= MASQUE.rooms) return fail('You have passed every ghost.');
    const ghost = MASQUE.ghosts[this.ghostKind(q.room)];
    if (q.mask !== this.hidingMask(q.room)) {
      this.hurt(MASQUE.harm);
      return { ok: true, text: `${ghost} sees your face and screams the whole dead house awake. You are driven back, bruised.` };
    }
    q.room++;
    let text = `${ghost} looks straight through you.`;
    if (q.room >= MASQUE.rooms && !q.done) {
      q.done = true;
      text += ` The last door: +${this.reward(MASQUE.goldPerLevel, 'masque')} gold from the Masquer’s trunk.`;
    }
    return { ok: true, text };
  }

  // ------------------------------------------------------------------ 111: the Gallery of Stolen Faces

  realFrame(room: number): number {
    return hash(`gallery:${room}`) % GALLERY.frames;
  }

  /** A sharp eye rules out frames that blink. Returns the frames still in doubt. */
  inspect(): number[] {
    const room = this.p.gallery.room;
    const real = this.realFrame(room);
    const all = Array.from({ length: GALLERY.frames }, (_, i) => i);
    const win = this.roll(`inspect:${room}:${this.s.state.clock.day}`, 'wis') >= GALLERY.dc;
    const doubt = win ? all.filter((i) => i === real || hash(`doubt:${room}:${i}`) % 2 === 0) : all;
    this.p.gallery.seen = doubt;
    return doubt;
  }

  chooseFrame(i: number): PResult {
    const q = this.p.gallery;
    if (this.here() !== 'gallery-of-stolen-faces') return fail('The paintings are in the Gallery of Stolen Faces.');
    if (q.room >= GALLERY.rooms) return fail('You have found every real face.');
    if (i < 0 || i >= GALLERY.frames) return fail('No such frame.');
    if (i === this.realFrame(q.room)) {
      q.room++;
      q.seen = [];
      let text = 'The real painting does not blink. The room lets you through.';
      if (q.room >= GALLERY.rooms && !q.done) {
        q.done = true;
        text += ` The curator’s office: +${this.reward(GALLERY.goldPerLevel, 'gallery')} gold.`;
      }
      return { ok: true, text };
    }
    this.hurt(GALLERY.harm);
    const pool = GALLERY.foes.filter((id) => content.enemies.find(id));
    const r = this.fight('gallery', 'A Painting Steps Out', this.s.player.level, [pool.length ? [pool[0] as string, pool[pool.length - 1] as string] : []], 2);
    return { ok: true, text: r.ok ? 'The frame is empty. The thing that swapped places with the painting steps out of the dark.' : 'The frame is empty.' };
  }

  // ------------------------------------------------------------------ 112: Old Wick’s Chapel

  relight(): PResult {
    if (this.here() !== 'old-wicks-chapel') return fail('The candle is in Old Wick’s Chapel.');
    const cost = WICK.relightPerLevel * this.s.player.level;
    if (!this.s.spendGold(cost, 'wick')) return fail(`A fresh candle costs ${cost} gold.`);
    this.p.wick.wax = WICK.hours;
    this.p.wick.hour = this.absHour();
    return { ok: true, text: 'A new flame. The dark withdraws a little.' };
  }

  /** The boss is the candle: it is mightier the more wax is left, so a hero who hurries meets a guttering flame. */
  faceCandle(): PResult {
    if (this.here() !== 'old-wicks-chapel') return fail('The candle is in Old Wick’s Chapel.');
    return this.fight('candle', 'The Candle Itself', this.s.player.level + 1, [['peat-wraith', 'drowned-pilgrim']], Math.round(this.p.wick.wax * WICK.bossThreatPerHour), 'witchlight-matron');
  }

  // ------------------------------------------------------------------ fights

  private fight(ref: string, label: string, level: number, waves: string[][], threat: number, boss?: string): PResult {
    const ok = waves.map((w) => w.filter((id) => content.enemies.find(id)));
    const r = this.s.endgame.startSpecial({ module: 'pocket', ref, label, level, waves: ok, threat, ...(boss ? { boss } : {}) });
    return r.ok ? { ok: true } : { ok: false, reason: r.reason };
  }

  private fightEnded(a: GauntletState, won: boolean): void {
    const ref = a.special?.ref ?? '';
    const p = this.p;
    const lvl = this.s.player.level;
    if (ref === 'wicks') {
      p.hunted = false;
      if (won) {
        const gold = this.reward(LANTERN.wickGoldPerLevel, 'wicks');
        if (!p.lanternDone) {
          p.lanternDone = true;
          this.title(LANTERN.title);
        }
        this.note(`The Wick-Eaters scatter. Their stolen shadows are yours: +${gold} gold.`, 'level');
      } else {
        const loss = Math.round(this.s.state.gold * LANTERN.wickLoss);
        if (loss > 0) this.s.spendGold(loss, 'wicks');
        this.note('The Wick-Eaters take your light and some of your coin.', 'warning');
      }
    } else if (ref === 'wardens') {
      p.bells.noise = won ? 0 : BELLS.afterWake;
      this.note(won ? 'The Wardens go still. The bells are quiet.' : 'The Wardens drive you back, ringing.', won ? 'info' : 'warning');
    } else if (ref === 'candle' && won && !p.wick.done) {
      p.wick.done = true;
      this.note(`The candle is out, and the chapel is only a chapel: +${this.reward(WICK.goldPerLevel, 'wick')} gold.`, 'level');
    }
    void lvl;
    this.changed('pocket');
  }
}
