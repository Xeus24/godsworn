import { content } from '../../data';
import { ARCANA, BOONS, BOON_EVERY, BREATHER, DOWNTIME, DOWNTIME_MAX_DAYS, NOD_EVENTS, NOD_MAX, RITES, STAT_POINTS_INSTEAD, arcanaOf, circleOf, type Arcanum, type Downtime, type NodEvent } from '../../data/tabletop';
import { MURMURS } from '../../data/general/murmurs';
import { createItem } from '../items/generate';
import { ensureGeneralSlots } from '../skills/general';
import { bondedUids, BONDABLE, MAX_BONDS, equippedItems } from '../items/equipment';
import { xpToNext } from '../character/progression';
import { characterStats } from '../character/stats';
import { attitudeIndex } from '../world/prejudice';
import { createTabletop, type TabletopState } from '../realm/marvels';
import { check, combine, dcForMin, describeRoll, statMod, type Roll, type RollMode } from '../tabletop/dice';
import type { GameSession } from './gameState';

export type TResult = { ok: true; text: string } | { ok: false; reason: string };
const fail = (reason: string): TResult => ({ ok: false, reason });

/**
 * The Tabletop Rules (Section I-6, R26): an optional per-save mode (items 190-199 and 210). Everything here is inert unless the hero chose it at creation.
 * State: `realm.marvels.tabletop`; the Boons and the toggle live on the character.
 */
export class TabletopActions {
  constructor(private readonly s: GameSession) {
    const bus = s.bus;
    bus.on('questComplete', () => this.earn('quest'));
    bus.on('enemyKilled', (e) => e.tier === 'boss' || e.tier === 'worldBoss' ? this.earn('boss') : undefined);
    bus.on('combatEnded', (e) => (e.result === 'victory' ? this.earn('victory') : undefined));
    bus.on('levelUp', (e) => (e.characterId === s.player.id && e.classId === undefined ? this.earn('level') : undefined));
    bus.on('favorChanged', (e) => (e.current > e.previous ? this.earn('favor') : undefined));
    bus.on('goldChanged', (e) => (e.amount >= 100 ? this.earn('gold') : undefined));
    bus.on('stateChanged', (e) => (e.reason === 'rest' ? this.earn('rest') : undefined));
    bus.on('levelUp', (e) => (e.characterId === s.player.id && e.classId === undefined ? this.syncMurmurs() : undefined));
  }

  /** Is the Tabletop Rules mode on for this save? */
  get on(): boolean {
    return this.s.player.tabletop === true;
  }

  get t(): TabletopState {
    const m = this.s.state.realm.marvels;
    return (m.tabletop ??= createTabletop());
  }

  private get day(): number {
    return this.s.state.clock.day;
  }

  // ------------------------------------------------------------------ 191, 192: the Fate Die and Favored / Forsaken

  /** Why a roll on this stat is Favored or Forsaken right now: Divine Moods, wounds and Blood Prejudice (flanking is added by the battle). */
  advantage(stat: string): { mode: RollMode; reasons: string[] } {
    const sources: RollMode[] = [];
    const reasons: string[] = [];
    const p = this.s.player;
    const god = p.devotion.patron;
    if (god) {
      const mood = this.s.fellowship.moodIndex(god);
      if (mood >= 3) { sources.push('favored'); reasons.push(`${content.gods.get(god).name} is ${mood === 4 ? 'exalted' : 'pleased'}`); }
      else if (mood <= 0) { sources.push('forsaken'); reasons.push(`${content.gods.get(god).name} is wrathful`); }
    }
    const wounds = this.s.state.realm.marvels.fellowship?.wounds ?? [];
    if (['str', 'dex', 'vit'].includes(stat) && wounds.some((w) => w.until > this.day)) { sources.push('forsaken'); reasons.push('a wound hampers you'); }
    const town = this.s.world.inTown();
    if (stat === 'cha' && town) {
      const a = attitudeIndex(p, town);
      if (a >= 4) { sources.push('favored'); reasons.push('the town welcomes your people'); }
      else if (a <= 0) { sources.push('forsaken'); reasons.push('the town distrusts your people'); }
    }
    return { mode: combine(sources), reasons };
  }

  /** Roll a stat check against a DC. Stores the roll for the display. */
  roll(stat: 'str' | 'dex' | 'int' | 'vit' | 'wis' | 'luk' | 'fai' | 'cha', dc: number, label = 'Fate Die', bonus = 0): Roll {
    const p = this.s.player;
    const mod = statMod(characterStats(p)[stat], p.level) + bonus;
    const { mode, reasons } = this.advantage(stat);
    let r = check(this.s.rng, mod, dc, mode);
    if (!r.success && r.crit !== 'nat1' && this.bardInParty() && this.museLeft > 0 && dc - r.total <= 6) {
      const d = this.s.rng.int(1, 6);
      if (d >= dc - r.total) {
        this.useMuse();
        r = { ...r, total: r.total + d, success: true };
        this.s.bus.emit('toast', { kind: 'info', text: `A Muse Die (+${d}) turns the roll.` });
      }
    }
    this.t.lastRoll = { ...r, label: `${label} (${stat.toUpperCase()})` };
    this.s.bus.emit('toast', { kind: r.success ? 'info' : 'warning', text: `${describeRoll(r, this.t.lastRoll.label)}${reasons.length ? ` · ${reasons.join(', ')}` : ''}` });
    return r;
  }

  /** The DC a stat requirement of `min` becomes. */
  dc(min: number): number {
    return dcForMin(min);
  }

  // ------------------------------------------------------------------ 193: the God's Nod

  get nods(): number {
    return this.t.nods;
  }

  /** Acting in line with an Ideal, Bond or Flaw earns a Nod, once a day for each. */
  earn(event: NodEvent): void {
    if (!this.on) return;
    const pers = this.s.player.personality;
    if (!pers) return;
    for (const id of [pers.ideal, pers.bond, pers.flaw]) {
      if (!id || NOD_EVENTS[id] !== event || this.t.nodDays[id] === this.day || this.t.nods >= NOD_MAX) continue;
      this.t.nodDays[id] = this.day;
      this.t.nods++;
      this.s.bus.emit('toast', { kind: 'favor', text: `The gods nod: you acted as ${id.replace(/-/g, ' ')}. God’s Nod ${this.t.nods}/${NOD_MAX}.` });
    }
  }

  /** Spend a Nod: true if one was held. */
  spendNod(): boolean {
    if (this.t.nods <= 0) return false;
    this.t.nods--;
    this.s.bus.emit('stateChanged', { reason: 'nod' });
    return true;
  }

  // ------------------------------------------------------------------ 194: Boons

  get boonsPending(): number {
    if (!this.on) return 0;
    const p = this.s.player;
    return Math.max(0, Math.floor(p.level / BOON_EVERY) - (p.boons?.length ?? 0) - (p.boonStatPicks ?? 0));
  }

  takeBoon(id: string): TResult {
    const boon = BOONS.find((b) => b.id === id);
    if (!boon) return fail('No such Boon.');
    if (this.boonsPending <= 0) return fail('You have no Boon to take.');
    const p = this.s.player;
    if (p.boons?.includes(id)) return fail('You already have that Boon.');
    p.boons = [...(p.boons ?? []), id];
    this.s.bus.emit('stateChanged', { reason: 'boon' });
    return { ok: true, text: `Boon: ${boon.name}.` };
  }

  takeStatPoints(): TResult {
    if (this.boonsPending <= 0) return fail('You have no Boon to trade.');
    const p = this.s.player;
    p.boonStatPicks = (p.boonStatPicks ?? 0) + 1;
    p.attributePoints += STAT_POINTS_INSTEAD;
    this.s.bus.emit('stateChanged', { reason: 'boon' });
    return { ok: true, text: `+${STAT_POINTS_INSTEAD} stat points.` };
  }

  // ------------------------------------------------------------------ 199: Breather and Night's Rest

  get breathersLeft(): number {
    const b = this.t.breathers;
    return b.day === this.day ? Math.max(0, BREATHER.perDay - b.n) : BREATHER.perDay;
  }

  /** A short rest: some HP and MP back, an hour gone, twice a day. The full rest is the Night's Rest (camp or inn). */
  breather(): TResult {
    if (!this.on) return fail('The Breather belongs to the Tabletop Rules.');
    if (this.breathersLeft <= 0) return fail('You have taken two Breathers today. A Night’s Rest is needed.');
    const p = this.s.player;
    const st = characterStats(p);
    p.hp = Math.min(st.maxHp, p.hp + Math.round((st.maxHp * BREATHER.hpPct) / 100));
    p.mp = Math.min(st.maxMp, p.mp + Math.round((st.maxMp * BREATHER.mpPct) / 100));
    const b = this.t.breathers;
    this.t.breathers = { day: this.day, n: (b.day === this.day ? b.n : 0) + 1 };
    this.s.advanceTime(BREATHER.minutes);
    this.s.bus.emit('stateChanged', { reason: 'breather' });
    return { ok: true, text: `You take a Breather: ${BREATHER.hpPct}% of your health and mana return.` };
  }

  /** The full rest resets the day's Breathers. (Camp, inn and home rests all call this.) */
  nightsRest(): void {
    if (this.on) this.t.breathers = { day: this.day, n: 0 };
  }

  // ------------------------------------------------------------------ 210: Passive Perception

  /** 10 + half WIS + proficiency. */
  get passivePerception(): number {
    const p = this.s.player;
    return 10 + statMod(characterStats(p).wis, p.level);
  }

  // ------------------------------------------------------------------ 207: Muse Dice (out of battle)

  private bardInParty(): boolean {
    const isBard = (cls: { classId: string }[]): boolean => cls.some((c) => c.classId === 'bard');
    return isBard(this.s.player.classes) || Object.values(this.s.state.party.companions).some((c) => c.inParty && !c.left && isBard(c.character.classes));
  }

  get museLeft(): number {
    if (!this.bardInParty()) return 0;
    const m = this.t.muse;
    return m && m.day === this.day ? Math.max(0, 3 - m.n) : 3;
  }

  private useMuse(): void {
    const m = this.t.muse;
    this.t.muse = { day: this.day, n: (m && m.day === this.day ? m.n : 0) + 1 };
  }

  // ------------------------------------------------------------------ 200: Murmurs

  /** Casters learn two Murmurs, a third at level 5 and a fourth at level 11; their rank grows with level. */
  syncMurmurs(): void {
    if (!this.on) return;
    const p = this.s.player;
    const cls = content.classes.get(p.classes[0]?.classId ?? 'warrior');
    if (!(/magic|caster/i.test(cls.role) || cls.growth.int + cls.growth.wis + cls.growth.fai >= 1.8)) return;
    ensureGeneralSlots(p);
    const rank = Math.max(1, Math.min(10, 1 + Math.floor(p.level / 6)));
    for (const m of MURMURS) {
      if (p.level < m.from) continue;
      const have = p.generalSkills[m.id];
      if (have) have.rank = rank;
      else {
        p.generalSkills[m.id] = { rank, xp: 0 };
        const slots = p.generalSlots;
        const free = slots.indexOf(null);
        if (free >= 0) slots[free] = m.id;
      }
    }
  }

  // ------------------------------------------------------------------ 201: Circles and Arcana

  /** Every spell the hero knows, with its Circle and Arcanum. */
  spellbook(): { id: string; name: string; circle: number; arcanum: Arcanum }[] {
    const out: { id: string; name: string; circle: number; arcanum: Arcanum }[] = [];
    const ids = new Set<string>();
    for (const id of Object.keys(this.s.player.skills)) ids.add(id);
    for (const [gid] of Object.entries(this.s.player.generalSkills)) {
      const cs = content.generalSkills.find(gid)?.combatSkill;
      if (cs) ids.add(cs);
    }
    for (const id of ids) {
      const sk = content.skills.find(id);
      if (!sk || !sk.tags.includes('Spell')) continue;
      out.push({ id, name: sk.name, circle: circleOf(sk), arcanum: arcanaOf(sk) });
    }
    return out.sort((a, b) => a.circle - b.circle || a.name.localeCompare(b.name));
  }
  readonly arcana = ARCANA;

  // ------------------------------------------------------------------ 202, 208: Rites

  rite(id: string): TResult {
    if (!this.on) return fail('Rites belong to the Tabletop Rules.');
    const def = RITES.find((r) => r.id === id);
    if (!def) return fail('No such Rite.');
    const p = this.s.player;
    const done = (this.t.ritesDay ??= {});
    if (id === 'commune' && done[id] === this.day) return fail('You have already communed today.');
    if (id === 'commune' && !p.devotion.patron) return fail('You need a patron to commune with.');
    const st = characterStats(p);
    let text = `${def.name}.`;
    switch (id) {
      case 'detect':
        p.timedBuffs = [...p.timedBuffs.filter((b) => b.id !== 'rite-detect'), { id: 'rite-detect', name: 'Detect Magic', modifiers: [{ stat: 'magicFind', type: 'flat', value: 10 }], battlesLeft: 3 }];
        text = 'Your senses open: +10% magic find for three battles.';
        break;
      case 'commune': {
        const god = p.devotion.patron as string;
        this.s.devotion.apply({ [god]: 12 }, 'commune');
        text = `${content.gods.get(god).name} answers, briefly: +12 favor.`;
        break;
      }
      case 'identify': {
        let n = 0;
        for (const it of this.s.state.inventory.slots) if (it && !it.identified) { it.identified = true; n++; }
        for (const [, it] of equippedItems(p)) if (!it.identified) { it.identified = true; n++; }
        text = n > 0 ? `You study what you carry: ${n} item${n > 1 ? 's' : ''} identified.` : 'You study what you carry: nothing is left to learn.';
        break;
      }
      case 'safe-camp':
        p.hp = Math.min(st.maxHp, p.hp + Math.round(st.maxHp * 0.15));
        p.mp = Math.min(st.maxMp, p.mp + Math.round(st.maxMp * 0.15));
        p.timedBuffs = [...p.timedBuffs.filter((b) => b.id !== 'well-rested'), { id: 'well-rested', name: 'Well Rested', modifiers: [{ stat: 'damageBonus', type: 'flat', value: 3 }], battlesLeft: 3 }];
        text = 'The wards hold: a little health and mana, and Well Rested.';
        break;
      case 'find-familiar':
        p.timedBuffs = [...p.timedBuffs.filter((b) => b.id !== 'familiar'), { id: 'familiar', name: 'Owl Familiar', modifiers: [], battlesLeft: 5 }];
        text = 'An owl lands on your shoulder, blinks, and decides to stay.';
        break;
    }
    done[id] = this.day;
    this.s.advanceTime(def.minutes);
    this.s.bus.emit('stateChanged', { reason: 'rite' });
    return { ok: true, text };
  }

  // ------------------------------------------------------------------ 203: Bonding

  /** Magic items worn, and whether each is bonded. */
  bonds(): { uid: string; name: string; bonded: boolean }[] {
    const live = bondedUids(this.s.player);
    return equippedItems(this.s.player).filter(([, it]) => BONDABLE.has(it.rarity)).map(([, it]) => ({ uid: it.uid, name: content.items.get(it.baseId).name, bonded: live.has(it.uid) }));
  }

  toggleBond(uid: string): TResult {
    const p = this.s.player;
    const live = [...bondedUids(p)];
    if (live.includes(uid)) p.bonded = live.filter((u) => u !== uid);
    else {
      if (live.length >= MAX_BONDS) return fail(`You can bond with at most ${MAX_BONDS} magic items: release one first.`);
      p.bonded = [...live, uid];
    }
    this.s.bus.emit('stateChanged', { reason: 'bond' });
    return { ok: true, text: 'Bonds changed.' };
  }

  // ------------------------------------------------------------------ 209: Between-Acts Downtime

  downtime(activity: Downtime, days: number): TResult {
    if (!this.on) return fail('Downtime belongs to the Tabletop Rules.');
    if (!this.s.world.inTown()) return fail('Downtime is spent in a town.');
    const def = DOWNTIME.find((d) => d.id === activity);
    if (!def) return fail('No such activity.');
    days = Math.max(1, Math.min(DOWNTIME_MAX_DAYS, Math.floor(days)));
    const p = this.s.player;
    const cost = def.perDayGold * days + (activity === 'craft' && days >= 3 ? 500 : 0);
    if (cost > 0 && !this.s.spendGold(cost, `downtime: ${def.name}`)) return fail(`That costs ${cost} gold.`);
    const notes: string[] = [];
    const level = Math.max(1, p.level);
    for (let d = 0; d < days; d++) {
      switch (activity) {
        case 'train':
          this.s.grantXp(Math.round(xpToNext(level) * 0.1), true);
          break;
        case 'craft': {
          const tier = Math.max(1, Math.min(5, Math.ceil(level / 12)));
          const pool = content.items.filter((b) => b.category === 'material' && 'tier' in b && (b as { tier: number }).tier <= tier && (b as { kind: string }).kind !== 'divine' && (b as { kind: string }).kind !== 'void' && (b as { kind: string }).kind !== 'essence');
          const pick = this.s.rng.pick(pool);
          this.s.items.give(createItem(pick.id, 2 + this.s.rng.int(0, 2), () => this.s.newUid()), false);
          notes.push(pick.name);
          break;
        }
        case 'carouse':
          if (this.roll('cha', 12, 'Carousing').success) this.s.items.give(createItem('hearty-stew', 1, () => this.s.newUid()), false);
          break;
        case 'research':
          if (this.roll('int', 12, 'Research').success) this.s.grantXp(Math.round(xpToNext(level) * 0.5), true);
          break;
        case 'business': {
          const r = this.roll('cha', 12, 'Business');
          this.s.addGold(Math.round(level * (r.success ? 25 : 10)), 'downtime: business');
          break;
        }
        case 'rumors':
          if (this.roll('wis', 12, 'Rumors').success) {
            this.s.items.give(createItem('scroll-of-identify', 1, () => this.s.newUid()), false);
            if (p.devotion.patron) this.s.devotion.apply({ [p.devotion.patron]: 3 }, 'rumors');
          }
          break;
      }
    }
    if (activity === 'craft' && days >= 3) {
      this.s.items.give(createItem('sun-pearl', 1, () => this.s.newUid()), false);
      notes.push('a Sun Pearl');
    }
    this.s.advanceTime(days * 24 * 60);
    this.s.bus.emit('stateChanged', { reason: 'downtime' });
    return { ok: true, text: `${def.name}, ${days} day${days > 1 ? 's' : ''}${notes.length ? `: ${[...new Set(notes)].join(', ')}` : ''}.` };
  }
}
