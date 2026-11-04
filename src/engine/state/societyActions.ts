import { content } from '../../data';
import { APOSTLES, CLASS_RIVAL, CLASS_RIVALS, CONJUNCTION, FORGED, MODULES, ORIGIN, ORIGIN_CULPRIT, ORIGIN_FIGURES, ORIGIN_SCENES, RIVAL_APOSTLES, SAINT } from '../../data/society';
import { DIVINE_SEASONS } from '../../data/pilgrimage';
import { Rng } from '../core/rng';
import type { GauntletState } from '../endgame/types';
import { createSociety, type SocietyState } from '../realm/marvels';
import { dateOf } from '../realm/wheel';
import { seasonOf } from '../realm/pilgrimage';
import type { ModifierSpec } from '../stats/modifiers';
import type { GameSession } from './gameState';

export type SResult = { ok: true; text?: string } | { ok: false; reason: string };
const fail = (reason: string): SResult => ({ ok: false, reason });
const hash = (s: string): number => {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
};
const MORE = new Set(['maxHp', 'physicalAttack', 'magicAttack', 'defense']);

/**
 * Conjunctions (80), Class Rivals (81), Forged Modules (78), Origin Rivals (76), Rival Apostles (70) and the Ninth Saint (71).
 * State: `realm.marvels.society`; stat effects flow into `heart.wonderMods` through `mods()`.
 */
export class SocietyActions {
  constructor(private readonly s: GameSession) {
    s.specials['rival'] = (a, won) => this.rivalEnded(a, won);
    s.specials['apostle'] = (a, won) => this.contestEnded(a, won);
    s.bus.on('timeChanged', (e) => {
      if (e.hour === 0) this.s.wonders.refresh();
      this.newContest();
    });
  }

  get o(): SocietyState {
    const m = this.s.state.realm.marvels;
    return (m.society ??= createSociety());
  }

  private note(text: string, kind: 'level' | 'info' | 'quest' | 'warning' = 'info'): void {
    this.s.bus.emit('toast', { kind, text });
  }

  private changed(reason: string): void {
    this.s.wonders.refresh();
    this.s.bus.emit('stateChanged', { reason });
  }

  mods(): ModifierSpec[] {
    const out: ModifierSpec[] = [];
    // Conjunctions: power on the day, a share of the sign's gifts for each vigil kept.
    if (this.conjunctionToday()) out.push(...CONJUNCTION.power);
    const sign = content.birthSigns.find(this.s.player.birthSignId);
    if (sign) for (let i = 0; i < Math.min(CONJUNCTION.maxVigils, this.o.vigils.length); i++) for (const mm of sign.modifiers) out.push({ ...mm, value: Math.round(mm.value * CONJUNCTION.rewardFraction * 10) / 10 } as ModifierSpec);
    // Forged modules.
    if (this.s.player.raceId === FORGED.race) {
      for (const id of this.o.modules.fitted) {
        const def = MODULES.find((x) => x.id === id);
        const lvl = this.o.modules.owned[id] ?? 1;
        for (const mm of def?.mods ?? []) out.push({ ...mm, value: Math.round(mm.value * (1 + (lvl - 1) * FORGED.upgradeMult) * 10) / 10 } as ModifierSpec);
      }
    }
    // Rival apostles who have become friends lend a little of their god's gifts.
    for (const g of this.o.apostles.allies) for (const mm of DIVINE_SEASONS.find((d) => d.god === g)?.party ?? []) out.push({ ...mm, value: Math.round(mm.value * 5) / 10 } as ModifierSpec);
    // The Ninth Saint: blessings from raised ancestors, while the chapel in Emberfall stands.
    if ((this.s.state.realm.village.buildings[SAINT.needBuilding] ?? 0) > 0) {
      for (const sa of this.o.saints) {
        const [a, b] = SAINT.pairs[hash(sa.name) % SAINT.pairs.length] as readonly [string, string];
        out.push({ stat: a, type: MORE.has(a) ? 'more' : 'flat', value: Math.round(3 + sa.level / 8) } as ModifierSpec, { stat: b, type: MORE.has(b) ? 'more' : 'flat', value: Math.round(2 + sa.level / 12) } as ModifierSpec);
      }
    }
    return out;
  }

  // ------------------------------------------------------------------ 80: Conjunctions

  private signIndex(): number {
    return Math.max(0, content.birthSigns.all().findIndex((b) => b.id === this.s.player.birthSignId));
  }

  /** The day of each season when your sign aligns (a different day for each sign). */
  conjunctionDayOfSeason(): number {
    return ((this.signIndex() * 5) % 28) + 1;
  }

  conjunctionToday(day = this.s.state.clock.day): boolean {
    return dateOf(day).dayOfSeason === this.conjunctionDayOfSeason();
  }

  private vigilKey(day = this.s.state.clock.day): string {
    const d = dateOf(day);
    return `${d.year}:${d.season}`;
  }

  keepVigil(): SResult {
    if (!this.conjunctionToday()) return fail(`Your sign aligns on day ${this.conjunctionDayOfSeason()} of each season.`);
    const key = this.vigilKey();
    if (this.o.vigils.includes(key)) return fail('You have kept this season’s vigil.');
    this.o.vigils.push(key);
    this.s.advanceTime(CONJUNCTION.vigilMinutes);
    const gold = CONJUNCTION.goldPerLevel * this.s.player.level;
    this.s.addGold(gold, 'conjunction');
    this.changed('conjunction');
    const sign = content.birthSigns.get(this.s.player.birthSignId);
    return { ok: true, text: `${sign.name}: the stars line up for you, and stay a while. +${gold} gold and a share of the sign’s gifts for good.` };
  }

  // ------------------------------------------------------------------ 81: Class Rivals

  rivalFor(): (typeof CLASS_RIVALS)[number] | undefined {
    const cls = this.s.player.classes[0]?.classId;
    return CLASS_RIVALS.find((r) => r.cls === cls);
  }

  rivalOpen(): number[] {
    return CLASS_RIVAL.milestones.filter((m) => this.s.player.level >= m && this.o.rivals[String(m)] !== 'won');
  }

  duelRival(milestone: number): SResult {
    const r = this.rivalFor();
    if (!r) return fail('Your class has no rival.');
    if (!this.rivalOpen().includes(milestone)) return fail('Not available.');
    if (!this.s.world.inTown()) return fail('Rivals meet you in towns.');
    const lvl = this.s.player.level;
    const pool = content.enemies.filter((e) => e.types.includes('humanoid') && ['elite', 'champion'].includes(e.tier) && Math.abs(e.level - lvl) <= 12);
    const boss = pool.length ? new Rng(hash(`${r.cls}:${milestone}`)).pick(pool).id : undefined;
    if (!boss) return fail('No rival could be found.');
    const res = this.s.endgame.startSpecial({ module: 'rival', ref: String(milestone), label: `${r.name}, ${r.title}`, level: lvl + 1, waves: [], boss, threat: 8 });
    return res.ok ? { ok: true, text: r.line } : res;
  }

  private rivalEnded(a: GauntletState, won: boolean): void {
    const m = a.special?.ref ?? '';
    if (!won) {
      this.o.rivals[m] = 'lost';
      this.note(`${this.rivalFor()?.name ?? 'Your rival'} gets the better of you this time.`, 'warning');
      return;
    }
    this.o.rivals[m] = 'won';
    const gold = CLASS_RIVAL.goldPerLevel * this.s.player.level;
    this.s.addGold(gold, 'class-rival');
    this.note(`You beat ${this.rivalFor()?.name ?? 'your rival'}: +${gold} gold.`, 'level');
    if (CLASS_RIVAL.milestones.every((x) => this.o.rivals[String(x)] === 'won') && !this.s.player.devotion.titles.includes(CLASS_RIVAL.title)) this.s.player.devotion.titles.push(CLASS_RIVAL.title);
    this.changed('rival');
  }

  // ------------------------------------------------------------------ 78: Forged Modules

  forged(): boolean {
    return this.s.player.raceId === FORGED.race;
  }

  moduleCost(id: string): number {
    const def = MODULES.find((x) => x.id === id);
    return def ? def.cost * ((this.o.modules.owned[id] ?? 0) + 1) : 0;
  }

  buildModule(id: string): SResult {
    const def = MODULES.find((x) => x.id === id);
    if (!def) return fail('No such module.');
    if (!this.forged()) return fail('Only the Forged carry modules.');
    if (!this.s.world.inTown()) return fail('A tinker’s bench is in town.');
    const lvl = this.o.modules.owned[id] ?? 0;
    if (lvl >= FORGED.maxLevel) return fail('It cannot be improved further.');
    const cost = this.moduleCost(id);
    if (this.s.state.gold < cost) return fail(`It costs ${cost} gold.`);
    this.s.spendGold(cost, 'forged-module');
    this.o.modules.owned[id] = lvl + 1;
    this.changed('module');
    return { ok: true, text: lvl ? `${def.name} is upgraded to level ${lvl + 1}.` : `${def.name} is built.` };
  }

  fit(id: string, on: boolean): SResult {
    if (!this.forged()) return fail('Only the Forged carry modules.');
    const f = this.o.modules.fitted;
    if (on) {
      if (!(this.o.modules.owned[id] ?? 0)) return fail('You have not built it.');
      if (f.includes(id)) return fail('It is fitted.');
      if (f.length >= FORGED.slots) return fail(`Only ${FORGED.slots} modules fit.`);
      f.push(id);
    } else this.o.modules.fitted = f.filter((x) => x !== id);
    this.changed('module');
    return { ok: true };
  }

  // ------------------------------------------------------------------ 76: Origin Rivals

  figure(): (typeof ORIGIN_FIGURES)[number] | undefined {
    return ORIGIN_FIGURES.find((f) => f.bg === this.s.player.backgroundId);
  }

  culprit(): boolean {
    const f = this.figure();
    return !!f && hash(`${this.s.player.name}:${f.id}`) % 2 === 0;
  }

  stretch(): number {
    return Math.min(ORIGIN_SCENES.length - 1, Math.floor(this.s.oaths.o.mainDone / 9));
  }

  /** The scene waiting for you this stretch of the story, if you have not met them yet. */
  originScene(): { text: string; culprit: boolean } | undefined {
    const f = this.figure();
    if (!f || this.o.origin.handled[String(this.stretch())]) return undefined;
    const st = this.stretch();
    const isCulprit = st === ORIGIN.culpritStretch && this.culprit();
    const t = (isCulprit ? ORIGIN_CULPRIT : ORIGIN_SCENES[st]!).replace('{name}', f.name).replace('{title}', f.title);
    return { text: t, culprit: isCulprit };
  }

  respondOrigin(choice: 'confront' | 'forgive' | 'ignore'): SResult {
    const scene = this.originScene();
    if (!scene) return fail('No one is waiting for you.');
    this.o.origin.handled[String(this.stretch())] = choice;
    if (scene.culprit) {
      this.o.origin.culprit = this.figure()!.id;
      this.s.setFlag('origin-culprit', true);
    }
    let text = '';
    if (choice === 'confront') {
      const gold = ORIGIN.confrontGoldPerLevel * this.s.player.level * (scene.culprit ? 2 : 1);
      this.s.addGold(gold, 'origin-rival');
      this.s.fellowship.morale(5, true);
      text = `You say what you came to say. It costs them: +${gold} gold.`;
    } else if (choice === 'forgive') {
      this.s.devotion.apply({ [ORIGIN.forgiveGod]: ORIGIN.forgiveFavor }, 'origin-rival', true, true);
      this.s.fellowship.morale(3, true);
      text = 'You let it go. It is lighter than you expected.';
    } else text = 'You walk on. They watch you go.';
    this.s.fellowship.journal('oath', this.figure()!.name);
    if (Object.keys(this.o.origin.handled).length >= ORIGIN_SCENES.length && !this.s.player.devotion.titles.includes(ORIGIN.title)) this.s.player.devotion.titles.push(ORIGIN.title);
    this.s.bus.emit('stateChanged', { reason: 'origin' });
    return { ok: true, text };
  }

  // ------------------------------------------------------------------ 70: Rival Apostles

  private newContest(): void {
    const sn = seasonOf(this.s.state.clock.day);
    const key = sn.key;
    const a = this.o.apostles;
    if (a.lastKey === key) return;
    a.lastKey = key;
    a.contest = { god: sn.def.god, key };
    const r = RIVAL_APOSTLES[sn.def.god];
    if (r) this.note(`${r.name}, rival Apostle of ${content.gods.get(sn.def.god).name}, is racing you for ${r.relic}.`, 'quest');
  }

  standing(god: string): number {
    return this.o.apostles.standing[god] ?? 0;
  }

  private setStanding(god: string, delta: number): void {
    const a = this.o.apostles;
    const v = Math.max(-3, Math.min(3, this.standing(god) + delta));
    a.standing[god] = v;
    const name = RIVAL_APOSTLES[god]?.name ?? god;
    if (v >= APOSTLES.allyAt && !a.allies.includes(god)) {
      a.allies.push(god);
      a.enemies = a.enemies.filter((x) => x !== god);
      this.note(`${name} has come round: a rival no longer, an ally.`, 'level');
    } else if (v <= APOSTLES.enemyAt && !a.enemies.includes(god)) {
      a.enemies.push(god);
      a.allies = a.allies.filter((x) => x !== god);
      const foe = content.enemies.filter((e) => e.types.includes('humanoid') && e.tier === 'normal' && Math.abs(e.level - this.s.player.level) <= 12)[0];
      if (foe) this.s.realm.forge(this.s.world.zone.id, foe.id, 'beat');
      this.note(`${name} will not forgive this. They have become Grudgebound.`, 'warning');
    }
    if (a.allies.length >= 5 && !this.s.player.devotion.titles.includes(APOSTLES.title)) this.s.player.devotion.titles.push(APOSTLES.title);
  }

  respondContest(choice: 'race' | 'help' | 'yield'): SResult {
    const c = this.o.apostles.contest;
    if (!c) return fail('No contest is under way.');
    const r = RIVAL_APOSTLES[c.god]!;
    if (choice === 'yield') {
      this.o.apostles.contest = undefined;
      this.setStanding(c.god, 0);
      this.s.bus.emit('stateChanged', { reason: 'apostle' });
      return { ok: true, text: `You let ${r.name} have ${r.relic}. They are not sure what to make of that.` };
    }
    if (choice === 'help') {
      const cost = APOSTLES.helpGoldPerLevel * this.s.player.level;
      if (this.s.state.gold < cost) return fail(`Helping costs ${cost} gold.`);
      this.s.spendGold(cost, 'apostle');
      this.o.apostles.contest = undefined;
      this.setStanding(c.god, 1);
      this.changed('apostle');
      return { ok: true, text: `You fund ${r.name}’s search. They remember it.` };
    }
    if (!this.s.world.inTown()) return fail('Race them from a town.');
    const lvl = this.s.player.level;
    const pool = content.enemies.filter((e) => e.types.includes('humanoid') && ['elite', 'champion'].includes(e.tier) && Math.abs(e.level - lvl) <= 12);
    if (!pool.length) return fail('No champion could be found.');
    const boss = new Rng(hash(`apostle:${c.god}:${c.key}`)).pick(pool).id;
    const res = this.s.endgame.startSpecial({ module: 'apostle', ref: c.god, label: `${r.name} (for ${r.relic})`, level: lvl + 1, waves: [], boss, threat: 10 });
    return res.ok ? { ok: true } : res;
  }

  private contestEnded(a: GauntletState, won: boolean): void {
    const god = a.special?.ref ?? '';
    const r = RIVAL_APOSTLES[god];
    if (!r) return;
    this.o.apostles.contest = undefined;
    if (won) {
      this.o.apostles.raced++;
      const gold = APOSTLES.relicGoldPerLevel * this.s.player.level;
      this.s.addGold(gold, 'apostle');
      this.setStanding(god, -1);
      this.note(`${r.relic} is yours: +${gold} gold. ${r.name} will not forget it.`, 'level');
    } else {
      const loss = Math.min(this.s.state.gold, APOSTLES.loseGoldPerLevel * this.s.player.level);
      if (loss) this.s.spendGold(loss, 'apostle');
      this.note(`${r.name} gets ${r.relic}, and a little of your gold besides.`, 'warning');
    }
    this.changed('apostle');
  }

  // ------------------------------------------------------------------ 71: The Ninth Saint

  candidates(): { index: number; name: string; classId: string; level: number; generation: number }[] {
    return this.s.state.realm.bloodline.ancestors
      .map((a, index) => ({ index, name: a.name, classId: a.classId, level: a.level, generation: a.generation }))
      .filter((a) => !this.o.saints.some((s) => s.name === a.name && s.generation === a.generation));
  }

  raise(index: number): SResult {
    const a = this.s.state.realm.bloodline.ancestors[index];
    if (!a) return fail('No such ancestor.');
    if (this.o.saints.length >= SAINT.max) return fail(`Only ${SAINT.max} saints can be raised.`);
    if (this.o.saints.some((x) => x.name === a.name && x.generation === a.generation)) return fail('Already a saint.');
    const cost = SAINT.goldPerLevel * a.level;
    if (this.s.state.gold < cost) return fail(`The rites cost ${cost} gold.`);
    this.s.spendGold(cost, 'saint');
    this.o.saints.push({ name: a.name, generation: a.generation, classId: a.classId, level: a.level });
    if (this.o.saints.length >= SAINT.max && !this.s.player.devotion.titles.includes(SAINT.title)) this.s.player.devotion.titles.push(SAINT.title);
    this.changed('saint');
    return { ok: true, text: `${a.name} is raised to sainthood. Their shrine will stand in Emberfall's chapel.` };
  }
}
