import { content } from '../../data';
import { COMPANION_OATHS, LETTERS, LETTER_KINDS, MOMENTS, MOODS, MOOD_POWER, MOOD_RULES, MORALE, MORALE_MODS, OATH_STAGES, WOUNDS, WOUND_RULES, fragmentary, type JournalEvent, type LetterKind } from '../../data/fellowship';
import { FORSWORN } from '../../data/oaths';
import { PANTHEON } from '../../data/pantheon';
import { DIVINE_SEASONS } from '../../data/pilgrimage';
import { favorOf, tierFor, tierIndex } from '../gods/devotion';
import { journalEntry } from '../realm/fellowship';
import { createFellowship, type FellowshipState } from '../realm/marvels';
import { festivalOn } from '../realm/wheel';
import { seasonOf } from '../realm/pilgrimage';
import type { ModifierSpec } from '../stats/modifiers';
import type { GameSession } from './gameState';

export type FResult = { ok: true; text?: string } | { ok: false; reason: string };
const fail = (reason: string): FResult => ({ ok: false, reason });
const BASE_MOOD = [-2, -1, -0.5, 0, 1, 1.5, 2, 2];
const BOSS = new Set(['boss', 'worldBoss', 'miniboss']);
const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x));

/**
 * Divine Moods (68), Divine Letters (69), Companion Oaths (75), Class-Reactive Moments (82), Party Morale (84), Lingering Wounds (85)
 * and the Godsworn Journal (86). State: `realm.marvels.fellowship`.
 */
export class FellowshipActions {
  constructor(private readonly s: GameSession) {
    const bus = s.bus;
    bus.on('combatEnded', (e) => {
      if (e.result === 'victory') this.morale(MORALE.victory + Math.min(3, this.f.streak) * MORALE.streakBonus, true);
      else if (e.result === 'defeat') {
        this.morale(MORALE.defeat, false);
        this.maybeWound();
        this.journal('defeat');
      } else this.morale(MORALE.fled, false);
    });
    bus.on('enemyKilled', (e) => {
      if (BOSS.has(e.tier)) {
        this.journal('boss');
        this.moment('boss');
      }
    });
    bus.on('levelUp', (e) => {
      if (e.characterId === s.player.id && e.level % 5 === 0) this.journal('level', `level ${e.level}`);
    });
    bus.on('devotionTierChanged', (e) => {
      if (tierIndex(e.current as never) > tierIndex(e.previous as never)) this.journal('tier', content.gods.find(e.god)?.name ?? e.god);
    });
    bus.on('questComplete', (e) => {
      if (content.quests.find(e.questId)?.kind === 'main') this.journal('quest');
    });
    bus.on('zoneEntered', (e) => {
      if (!this.f.regions.includes(e.zoneId)) {
        this.f.regions.push(e.zoneId);
        this.journal('region', content.zones.find(e.zoneId)?.name ?? '');
      }
    });
    bus.on('favorChanged', () => this.s.wonders.refresh());
    bus.on('timeChanged', (e) => {
      this.daily(e.day);
      if (e.hour === 0) this.s.wonders.refresh();
      if (e.hour === 6) {
        this.journal('rest');
        this.moment('rest');
      }
    });
  }

  get f(): FellowshipState {
    const m = this.s.state.realm.marvels;
    return (m.fellowship ??= createFellowship());
  }

  private note(text: string, kind: 'level' | 'info' | 'quest' | 'warning' | 'favor' = 'info'): void {
    this.s.bus.emit('toast', { kind, text });
  }

  private changed(reason: string): void {
    this.s.wonders.refresh();
    this.s.bus.emit('stateChanged', { reason });
  }

  // ------------------------------------------------------------------ 68: Divine Moods

  /** A god's mood, 0 (Wrathful) to 4 (Exalted): their regard for you, the season, the Pantheon’s politics and your oaths. */
  moodIndex(god: string): number {
    const p = this.s.player;
    const tier = tierIndex(tierFor(favorOf(p, god)));
    let score = BASE_MOOD[tier] ?? 0;
    if (seasonOf(this.s.state.clock.day).def.god === god) score += MOOD_RULES.ascendant;
    if (this.s.state.flags['forsworn'] === true && FORSWORN.refuse.includes(god)) score += MOOD_RULES.forsworn;
    const mine = p.devotion.apostle?.god;
    const def = PANTHEON.find((x) => x.id === god);
    if (mine && def) {
      if (def.rivals.includes(mine)) score += MOOD_RULES.rivalApostle;
      if (def.allies.includes(mine)) score += MOOD_RULES.allyApostle;
    }
    for (const r of def?.rivals ?? []) if (favorOf(p, r) - favorOf(p, god) >= MOOD_RULES.jealousGap) score += MOOD_RULES.jealous;
    return clamp(Math.round(score) + 2, 0, 4);
  }

  mood(god: string): string {
    return MOODS[this.moodIndex(god)] as string;
  }

  /** Blessing strength shifts with the mood of the gods who bless you (those at Acknowledged or better): ±20%. */
  moodPower(): number {
    const blessing = content.gods.all().filter((g) => g.id !== 'nameless' && tierIndex(tierFor(favorOf(this.s.player, g.id))) >= 3);
    if (!blessing.length) return 0;
    return Math.round(blessing.reduce((sum, g) => sum + (MOOD_POWER[this.moodIndex(g.id)] ?? 0), 0) / blessing.length);
  }

  // ------------------------------------------------------------------ 84: Party Morale

  morale(delta: number, win: boolean): void {
    const f = this.f;
    f.streak = win ? f.streak + 1 : 0;
    const was = this.moraleBand();
    f.morale = clamp(f.morale + delta, 0, 100);
    if (this.moraleBand() !== was) this.changed('morale');
  }

  moraleBand(): 'high' | 'good' | 'ok' | 'low' | 'broken' {
    const v = this.f.morale;
    return v >= MORALE.high ? 'high' : v >= MORALE.good ? 'good' : v <= MORALE.broken ? 'broken' : v <= MORALE.low ? 'low' : 'ok';
  }

  /** Hearth Meals, festivals and the like restore morale. */
  lift(amount: number, why: string): void {
    this.morale(amount, false);
    this.note(`Morale: ${why}`, 'info');
  }

  // ------------------------------------------------------------------ 85: Lingering Wounds

  private maybeWound(): void {
    if (this.f.wounds.length >= WOUND_RULES.max || !this.s.rng.chance(WOUND_RULES.chance)) return;
    const have = new Set(this.f.wounds.map((w) => w.id));
    const w = this.s.rng.pick(WOUNDS.filter((x) => !have.has(x.id)));
    this.f.wounds.push({ id: w.id, until: this.s.state.clock.day + WOUND_RULES.healDays });
    this.note(`A lingering wound: ${w.name}. ${w.text}`, 'warning');
    this.journal('wound', w.name);
    this.changed('wound');
  }

  /** Temples and herbalists heal a wound at once, for gold. */
  heal(id: string, how: 'temple' | 'herbalist'): FResult {
    if (!this.f.wounds.some((w) => w.id === id)) return fail('You do not have that.');
    if (!this.s.world.inTown()) return fail('Healers work in towns.');
    const cost = (how === 'temple' ? WOUND_RULES.templeGoldPerLevel : WOUND_RULES.herbalistGoldPerLevel) * this.s.player.level;
    if (this.s.state.gold < cost) return fail(`It costs ${cost} gold.`);
    this.s.spendGold(cost, 'wound');
    this.f.wounds = this.f.wounds.filter((w) => w.id !== id);
    this.changed('wound');
    return { ok: true, text: `Healed for ${cost} gold.` };
  }

  // ------------------------------------------------------------------ the day's work

  private daily(day: number): void {
    const f = this.f;
    if (f.moraleDay !== day) {
      f.moraleDay = day;
      f.morale += Math.sign(MORALE.rest - f.morale);
      if (festivalOn(day)) this.morale(MORALE.festival, false);
      const healed = f.wounds.filter((w) => w.until <= day);
      if (healed.length) {
        f.wounds = f.wounds.filter((w) => w.until > day);
        this.note('A lingering wound has healed with rest.', 'info');
        this.changed('wound');
      }
      this.letters(day);
      if (f.oathDay === 0 || day - f.oathDay >= COMPANION_OATHS.checkDays) {
        f.oathDay = day;
        this.companionOaths(day);
      }
      if (f.morale < MORALE.banterBelow && day % 3 === 0) {
        const names = this.s.party.battleMembers().length ? Object.values(this.s.state.party.companions).filter((c) => c.inParty).map((c) => content.companions.find(c.id)?.name ?? c.id) : [];
        if (names.length >= 2) this.note(`${names[0]} and ${names[1]} snap at each other over nothing. Morale is low.`, 'warning');
      }
    }
  }

  // ------------------------------------------------------------------ 69: Divine Letters

  private letters(day: number): void {
    const p = this.s.player;
    const stats = this.s.state.stats;
    for (const [i, d] of DIVINE_SEASONS.entries()) {
      const tier = tierIndex(tierFor(favorOf(p, d.god)));
      const def = PANTHEON.find((x) => x.id === d.god);
      const rival = def?.rivals[0];
      const want: Record<LetterKind, boolean> = {
        welcome: tier >= 3,
        favored: tier >= 4,
        devoted: tier >= 5,
        jealous: !!rival && favorOf(p, rival) - favorOf(p, d.god) >= MOOD_RULES.jealousGap && tierIndex(tierFor(favorOf(p, rival))) >= 3,
        warning: tier <= 1 && this.f.letters.some((l) => l.id === `${d.god}:welcome`),
        praise: tier >= 3 && stats.bossesKilled >= (i + 1) * 3,
      };
      for (const kind of LETTER_KINDS) {
        const id = `${d.god}:${kind}`;
        if (want[kind] && !this.f.letters.some((l) => l.id === id)) {
          this.f.letters.push({ id, god: d.god, kind, day, read: false });
          this.note(`A letter from ${content.gods.get(d.god).name} waits in the camp mailbox.`, 'favor');
          this.journal('letter', content.gods.get(d.god).name);
        }
      }
    }
  }

  /** The text of a letter: in the Twilight arc they fray. */
  letterText(god: string, kind: string): string {
    const t = LETTERS[god]?.[kind as LetterKind] ?? '';
    return this.s.state.ngPlus >= 1 ? fragmentary(t) : t;
  }

  read(id: string): void {
    const l = this.f.letters.find((x) => x.id === id);
    if (l && !l.read) {
      l.read = true;
      this.s.bus.emit('stateChanged', { reason: 'letter' });
    }
  }

  // ------------------------------------------------------------------ 75: Companion Oaths

  private companionOaths(day: number): void {
    const comps = this.s.state.party.companions;
    for (const comp of Object.values(comps)) {
      const def = content.companions.find(comp.id);
      if (!def) continue;
      const st = (this.f.oaths[comp.id] ??= { stage: 0, last: 0 });
      if (st.returns !== undefined) {
        if (day >= st.returns && this.s.party.battleMembers().length < 3) {
          comp.inParty = true;
          st.returns = undefined;
          st.stage = 0;
          this.note(`${def.name} comes back. Things are said, then not said.`, 'info');
        }
        continue;
      }
      if (comp.left) continue;
      const god = content.gods.get(def.god).name;
      const clash = this.moodIndex(def.god) <= COMPANION_OATHS.clashMood;
      if (clash && st.stage < OATH_STAGES.length) {
        const step = OATH_STAGES[st.stage]!;
        st.stage = step.stage;
        st.last = day;
        this.s.party.adjust(comp.id, step.approval);
        this.note(`${step.label}: ${step.text(def.name, god)}`, 'warning');
        if (step.stage === 3) {
          comp.inParty = false;
          st.returns = day + COMPANION_OATHS.returnDays;
        }
        this.changed('companion-oath');
      } else if (!clash && st.stage > 0) {
        st.stage = 0;
        this.note(`${def.name} is easier about ${god} again.`, 'info');
      }
    }
  }

  // ------------------------------------------------------------------ 86: the Godsworn Journal

  journal(event: JournalEvent, detail = ''): void {
    const f = this.f;
    const day = this.s.state.clock.day;
    if (f.journalLast[event] === day) return;
    f.journalLast[event] = day;
    f.journal.unshift({ day, event, text: journalEntry(event, this.s.player.backgroundId ?? 'soldier', day, detail) });
    if (f.journal.length > 200) f.journal.length = 200;
  }

  // ------------------------------------------------------------------ 82: Class-Reactive Moments

  private moment(when: 'boss' | 'rest'): void {
    const day = this.s.state.clock.day;
    if (this.f.momentDay === day) return;
    const mine = new Set(this.s.player.classes.map((c) => c.classId));
    const opts = MOMENTS.filter((m) => mine.has(m.cls) && m.when === when);
    if (!opts.length) return;
    this.f.momentDay = day;
    this.note(opts[(day + this.s.state.stats.kills) % opts.length]!.text, 'info');
  }

  // ------------------------------------------------------------------ what it gives the hero

  mods(): ModifierSpec[] {
    const out: ModifierSpec[] = [];
    const mp = this.moodPower();
    if (mp) out.push({ stat: 'blessingPower', type: 'flat', value: mp } as ModifierSpec);
    const band = this.moraleBand();
    if (band === 'high') out.push(...MORALE_MODS.high);
    else if (band === 'good') out.push(...MORALE_MODS.good);
    else if (band === 'low') out.push(...MORALE_MODS.low);
    else if (band === 'broken') out.push(...MORALE_MODS.broken);
    for (const w of this.f.wounds) out.push(...(WOUNDS.find((x) => x.id === w.id)?.mods ?? []));
    return out;
  }
}
