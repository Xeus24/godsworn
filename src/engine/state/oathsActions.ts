import { content } from '../../data';
import { CAERITH, CIPHER, FORSWORN, KING_LINES, LINEAGE_PAGES, LINEAGE_ZONES, OATHCRAFT, SCARS, VOW_CONDITIONS, VOW_REWARDS, type Fragment } from '../../data/oaths';
import { createOaths, type OathsState, type Vow } from '../realm/marvels';
import { progressOf } from '../achievements/progress';
import type { ModifierSpec } from '../stats/modifiers';
import type { GameSession } from './gameState';

export type OathResult = { ok: true; text?: string } | { ok: false; reason: string };
const fail = (reason: string): OathResult => ({ ok: false, reason });
const STATS = ['kills', 'battlesFled', 'battlesLost', 'goldSpent', 'consumablesUsed', 'itemsLooted', 'elitesKilled', 'bossesKilled', 'worldBossesKilled', 'crits', 'interventions'] as const;

/**
 * Caerith, the Unsworn Lineage, the Cipher, Oathcraft, the Forsworn Path and Battle Oaths (Innovation Pack, items 61-65 and 67).
 * Vows, Scars and Scar Rites share one oath system (R25). State: `realm.marvels.oaths`.
 */
export class OathsActions {
  private auditing = false;

  constructor(private readonly s: GameSession) {
    const bus = s.bus;
    bus.on('combatEnded', (e) => {
      this.audit(e.result === 'victory' || e.result === 'fled' ? s.timeOfDay : undefined);
      if (this.o.ready) {
        this.o.ready = undefined;
        this.changed('rite');
      }
    });
    bus.on('goldChanged', () => this.audit());
    bus.on('zoneEntered', () => this.audit());
    bus.on('timeChanged', () => this.audit());
    bus.on('favorChanged', (e) => {
      if (e.current < e.previous) this.breakWhere((v) => v.cond === 'no-anger', 'You angered a god.');
    });
    bus.on('apostasy', () => this.breakExternal('You turned from your god.'));
    bus.on('questComplete', () => this.countMain());
  }

  get o(): OathsState {
    const m = this.s.state.realm.marvels;
    return (m.oaths ??= createOaths());
  }

  private note(text: string, kind: 'level' | 'info' | 'quest' | 'warning' = 'info'): void {
    this.s.bus.emit('toast', { kind, text });
  }

  private changed(reason: string): void {
    this.s.wonders.refresh();
    this.s.bus.emit('stateChanged', { reason });
  }

  /** What the standing vows give, and the Scars take. */
  mods(): ModifierSpec[] {
    const out: ModifierSpec[] = [];
    for (const v of this.o.vows) if (v.status === 'standing') out.push(...(VOW_REWARDS.find((r) => r.id === v.reward)?.mods ?? []));
    for (const id of this.o.scars) out.push(...(SCARS.find((x) => x.id === id)?.debuff ?? []));
    return out;
  }

  /** The readied Scar Rite’s effect for the next fight. */
  riteMods(): ModifierSpec[] {
    return SCARS.find((x) => x.id === this.o.ready)?.rite.mods ?? [];
  }

  // ------------------------------------------------------------------ 62: the Unsworn Lineage

  /** Page of the Unsworn King’s oath found in a region (called when its second puzzle chest is solved). */
  foundPage(zone: string): void {
    const i = LINEAGE_ZONES.indexOf(zone as (typeof LINEAGE_ZONES)[number]);
    if (i < 0 || this.o.pages.includes(zone)) return;
    this.o.pages.push(zone);
    this.note(`A page of the Unsworn King’s oath: “${LINEAGE_PAGES[i]}”`, 'quest');
    if (this.o.pages.length === LINEAGE_PAGES.length) {
      this.s.setFlag('lineage-complete', true);
      this.note('All sixteen pages. You know how he fell.', 'level');
    }
    this.s.bus.emit('stateChanged', { reason: 'lineage' });
  }

  pagesFound(): { zone: string; text: string }[] {
    return LINEAGE_ZONES.filter((z) => this.o.pages.includes(z)).map((z) => ({ zone: z, text: LINEAGE_PAGES[LINEAGE_ZONES.indexOf(z)] as string }));
  }

  kingLines(): string[] {
    return KING_LINES.filter((l) => this.o.pages.length >= l.pages).map((l) => l.text);
  }

  // ------------------------------------------------------------------ 63: the Unsworn Cipher

  cipherSymbols(): number {
    return Math.min(CIPHER.symbols, progressOf(this.s.state, 'secrets'));
  }

  /** Whether the cipher is whole (it points to Caerith’s resting place, and is needed for the Unsworn Ending). */
  cipherDone(): boolean {
    return this.cipherSymbols() >= CIPHER.symbols;
  }

  private checkCipher(): void {
    if (this.o.cipher || !this.cipherDone()) return;
    this.o.cipher = true;
    this.s.setFlag('cipher-complete', true);
    if (!this.s.player.devotion.titles.includes(CIPHER.title)) this.s.player.devotion.titles.push(CIPHER.title);
    this.note('The cipher is whole. It points at a door in the Hollow Barrows. A hidden birth sign will answer to it in new games.', 'level');
  }

  // ------------------------------------------------------------------ 61: Caerith the Unremembered

  private sourceCount(f: Fragment): number {
    const s = this.s;
    switch (f.source) {
      case 'pages': return this.o.pages.length;
      case 'cipher': return this.cipherSymbols();
      case 'observatory': return s.state.realm.observatory.solved !== undefined ? 1 : 0;
      case 'sundered': return Object.keys(s.state.realm.wonders.sundered.chosen).length;
      case 'echoes': return Object.keys(s.state.realm.echoes.found).length;
      case 'chronicle': return Object.keys(s.state.realm.chronicle.known).length;
    }
  }

  fragments(): { frag: Fragment; open: boolean; have: number }[] {
    this.checkCipher();
    return CAERITH.map((frag) => ({ frag, open: this.sourceCount(frag) >= frag.need, have: Math.min(frag.need, this.sourceCount(frag)) }));
  }

  // ------------------------------------------------------------------ 64: Oathcraft

  private stretch(): number {
    return Math.floor(this.o.mainDone / OATHCRAFT.mainPerStretch);
  }

  private countMain(): void {
    const s = this.s;
    this.o.mainDone = content.quests.filter((q) => q.kind === 'main').filter((q) => (s.state.quests.completed[q.id] ?? 0) > 0).length;
    const now = this.stretch();
    for (const v of this.o.vows) {
      if (v.status !== 'standing' || v.stretch >= now) continue;
      v.status = 'kept';
      this.o.kept++;
      const cond = VOW_CONDITIONS.find((c) => c.id === v.cond)!;
      this.s.devotion.apply(Object.fromEntries(content.gods.all().filter((g) => g.id !== 'nameless').map((g) => [g.id, OATHCRAFT.keptFavor])), 'oath-kept', true, true);
      if (!this.o.titled.includes(v.cond)) {
        this.o.titled.push(v.cond);
        const title = `Oathkeeper, ${cond.title}`;
        if (!s.player.devotion.titles.includes(title)) s.player.devotion.titles.push(title);
        this.note(`A vow kept through the stretch: “${cond.text}” Title earned: ${title}.`, 'level');
      }
    }
    this.changed('oath');
  }

  swear(cond: string, reward: string): OathResult {
    const c = VOW_CONDITIONS.find((x) => x.id === cond);
    if (!c || !VOW_REWARDS.some((r) => r.id === reward)) return fail('No such vow.');
    if (this.o.vows.filter((v) => v.status === 'standing').length >= OATHCRAFT.max) return fail(`You can hold only ${OATHCRAFT.max} vows at once.`);
    if (this.o.vows.some((v) => v.status === 'standing' && v.cond === cond)) return fail('You have sworn that already.');
    const base: Record<string, number> = {};
    for (const k of STATS) base[k] = (this.s.state.stats as unknown as Record<string, number>)[k] ?? 0;
    const vow: Vow = { id: `${cond}-${this.s.state.clock.day}-${this.o.vows.length}`, cond, reward, stretch: this.stretch(), base, zone: this.s.world.zone.id, level: this.s.player.level, status: 'standing' };
    this.o.vows.push(vow);
    this.changed('oath');
    return { ok: true, text: `Sworn: ${c.text}` };
  }

  /** Release a vow without penalty only while nothing has been broken: it simply lapses. */
  forget(id: string): OathResult {
    const v = this.o.vows.find((x) => x.id === id && x.status === 'standing');
    if (!v) return fail('No such vow.');
    return this.breakVow(v, 'You put your vow down before its time.') ? { ok: true, text: 'The vow is broken, and it leaves a mark.' } : fail('Nothing happened.');
  }

  /** Looks at every standing vow: counters that rose, places left, gold held. */
  private audit(timeOfBattle?: string): void {
    if (this.auditing) return;
    this.auditing = true;
    try {
      const s = this.s;
      const stats = s.state.stats as unknown as Record<string, number>;
      for (const v of this.o.vows) {
        if (v.status !== 'standing') continue;
        const c = VOW_CONDITIONS.find((x) => x.id === v.cond)!;
        let why: string | undefined;
        if (c.stat && (stats[c.stat] ?? 0) > (v.base[c.stat] ?? 0)) why = c.text;
        else if (c.check === 'zone' && s.world.zone.id !== v.zone) why = 'You left the region.';
        else if (c.check === 'poor' && s.state.gold > 300) why = 'Your purse is heavy.';
        else if (c.check === 'alone' && s.party.battleMembers().length > 0) why = 'You took a companion.';
        else if (c.check === 'level' && s.player.level > v.level + 2) why = 'You have grown.';
        else if (c.check === 'pet' && s.player.stable.pet) why = 'A pet walks with you.';
        else if (c.check === 'mount' && s.player.stable.mount) why = 'You are mounted.';
        else if (c.check === 'night' && timeOfBattle === 'day') why = 'You fought by day.';
        else if (c.check === 'day' && timeOfBattle === 'night') why = 'You fought by night.';
        if (why) this.breakVow(v, why);
      }
    } finally {
      this.auditing = false;
    }
  }

  private breakWhere(pred: (v: Vow) => boolean, why: string): void {
    for (const v of this.o.vows) if (v.status === 'standing' && pred(v)) this.breakVow(v, why);
  }

  // ------------------------------------------------------------------ 65: the Forsworn Path

  private breakVow(v: Vow, why: string): boolean {
    if (v.status !== 'standing') return false;
    v.status = 'broken';
    this.scar(`Vow broken: ${why}`);
    return true;
  }

  /** A god’s quest vow or a companion’s promise broken: one Scar too. */
  breakExternal(why: string): void {
    this.scar(why);
  }

  private scar(why: string): void {
    this.o.broken++;
    const next = SCARS.find((x) => !this.o.scars.includes(x.id));
    if (next) {
      this.o.scars.push(next.id);
      this.note(`${why} A Scar: ${next.name}.`, 'warning');
    }
    if (this.o.scars.length >= FORSWORN.scars && !this.forsworn()) this.becomeForsworn();
    this.changed('scar');
  }

  forsworn(): boolean {
    return this.s.state.flags['forsworn'] === true;
  }

  private becomeForsworn(): void {
    this.s.setFlag('forsworn', true);
    if (!this.s.player.devotion.titles.includes(FORSWORN.title)) this.s.player.devotion.titles.push(FORSWORN.title);
    this.note('Five Scars. You are Forsworn: the gods of light will not hear you, and something pale has begun to take notice.', 'warning');
  }

  /** Ready one of your Scar Rites for the next fight (a battle’s worth of power, spent). */
  ready(id: string | undefined): OathResult {
    if (id !== undefined && !this.o.scars.includes(id)) return fail('You do not carry that Scar.');
    this.o.ready = id;
    this.s.bus.emit('stateChanged', { reason: 'rite' });
    return { ok: true, text: id ? `${SCARS.find((x) => x.id === id)!.rite.name}: ${SCARS.find((x) => x.id === id)!.rite.text}` : 'No rite readied.' };
  }
}
