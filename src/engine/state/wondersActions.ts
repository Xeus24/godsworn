import { content } from '../../data';
import { COMMISSIONS, ERAS, LEGENDS, PAINTER, SPIRE_CARDS, SPIRE_RELICS, SUNDERED, TURNING_POINTS, WATERS, type LegendFish } from '../../data/wonders';
import { Rng } from '../core/rng';
import { bestHand, cardById, giveCard } from '../minigames/cardGame';
import { relicOffer, spireDuel, spireOffer, spireOpponent, type Photo, type SpireRun, type WondersState } from '../realm/wonders';
import { weighCatch } from '../minigames/fishing';
import type { FishDef, Water } from '../../data/minigames/fish';
import type { ModifierSpec } from '../stats/modifiers';
import type { GameSession } from './gameState';

export type WResult = { ok: true; text?: string } | { ok: false; reason: string };
const fail = (reason: string): WResult => ({ ok: false, reason });

/**
 * Nymira's Waters, the Spire of Cards, the Sundered Hours and Painter's Eye (Innovation Pack, items 25-28). Their state lives
 * in `realm.wonders`; whatever they give the hero's stats is gathered in `refresh` into `heart.wonderMods`.
 */
export class WondersActions {
  constructor(private readonly s: GameSession) {}

  get w(): WondersState {
    return this.s.state.realm.wonders;
  }

  private note(text: string, kind: 'level' | 'loot' | 'info' | 'quest' | 'warning' = 'info'): void {
    this.s.bus.emit('toast', { kind, text });
  }

  private changed(reason: string): void {
    this.refresh();
    this.s.bus.emit('stateChanged', { reason });
  }

  /** Everything these systems add to the hero's stats. */
  refresh(): void {
    const w = this.w;
    const mods: ModifierSpec[] = [];
    const room = Math.min(w.waters.room, w.waters.shown.length);
    if (room) mods.push({ stat: 'goldFind', type: 'flat', value: room * WATERS.goldFindPerFish } as ModifierSpec);
    for (const l of LEGENDS) if (w.waters.legends[l.id]) mods.push(...l.perk);
    for (const tp of TURNING_POINTS) {
      const pick = w.sundered.chosen[tp.id];
      if (pick) mods.push(...(tp.choices.find((c) => c.id === pick)?.mods ?? []));
    }
    mods.push(...this.familyMods(), ...this.s.faith.mods(), ...this.s.relics.mods(), ...this.s.road.mods(), ...this.s.trials.mods(), ...this.s.oaths.mods(), ...this.s.fellowship.mods(), ...this.s.society.mods(), ...this.s.worldly.mods(), ...this.s.civic.mods(), ...this.s.pockets.mods(), ...this.s.foes.mods(), ...this.s.tales.mods(), ...this.s.craft.mods(), ...this.s.fun.mods(), ...this.s.twilight.mods(), ...this.s.afflictions.mods(), ...this.s.workshop.mods(), ...this.s.grace.mods(), ...this.s.realms.mods());
    const luck = Math.min(4, Math.floor((w.pet?.pats ?? 0) / 25));
    if (luck) mods.push({ stat: 'luk', type: 'flat', value: luck } as ModifierSpec);
    this.s.heart.h.wonderMods = mods;
  }

  // ------------------------------------------------------------------ 25: Nymira's Waters

  legendsCaught(): number {
    return LEGENDS.filter((l) => this.w.waters.legends[l.id]).length;
  }

  private kinds(): number {
    return Object.keys(this.s.state.minigames.fish).length;
  }

  /** The Grudgebound fish of a water. */
  grudgeFish(water: Water): FishDef[] {
    return Object.keys(this.w.waters.grudge).map((id) => content.fish.find(id)).filter((f): f is FishDef => !!f && f.water === water);
  }

  /**
   * Called on every cast before the ordinary bite: a Grudgebound fish, or a legend of this water, may take the line instead.
   * Returns undefined when nothing special bites.
   */
  cast(water: Water, night: boolean, accuracy: number): { fish: FishDef | LegendFish; caught: boolean; weight?: number; message: string } | undefined {
    const rng = this.s.rng;
    const w = this.w.waters;
    const grudge = this.grudgeFish(water);
    if (grudge.length && rng.chance(WATERS.grudgeBite)) {
      const fish = rng.pick(grudge);
      const scars = w.grudge[fish.id] ?? 1;
      const need = 0.25 + fish.rarity * 0.1 + scars * WATERS.needPerScar;
      if (accuracy + rng.float(-0.05, 0.05) >= need) {
        delete w.grudge[fish.id];
        const gold = Math.round(fish.price * (1 + scars * WATERS.pricePerScar));
        this.s.addGold(gold, 'fishing');
        this.s.advanceTime(25);
        this.changed('waters');
        return { fish, caught: true, weight: weighCatch(rng, fish) * (1 + scars * 0.1), message: `The ${fish.name} that got away is yours at last: +${gold} gold.` };
      }
      w.grudge[fish.id] = scars + 1;
      this.changed('waters');
      return { fish, caught: false, message: `The ${fish.name} takes the line again, and wins. It is larger every time. (scar ${scars + 1})` };
    }
    const chance = WATERS.legendChance + Math.min(w.shown.length, w.room) * 0.002;
    const legend = LEGENDS.find((l) => l.water === water && (l.time === 'any' || (l.time === 'night') === night) && this.kinds() >= l.kinds);
    if (legend && rng.chance(chance)) {
      const need = 0.7;
      if (accuracy + rng.float(-0.05, 0.05) < need) return { fish: legend, caught: false, message: `${legend.name}: it rose, looked, and was gone.` };
      const weight = weighCatch(rng, { max: legend.max } as FishDef);
      const first = !w.legends[legend.id];
      w.legends[legend.id] = Math.max(w.legends[legend.id] ?? 0, weight);
      this.s.advanceTime(40);
      if (first) {
        this.note(`${legend.name}! ${legend.text} It will live in the aquarium.`, 'level');
        if (this.legendsCaught() === LEGENDS.length && !this.s.player.devotion.titles.includes(WATERS.title)) {
          this.s.player.devotion.titles.push(WATERS.title);
          this.note(`Every legend of the waters is yours. Title earned: ${WATERS.title}.`, 'level');
        }
      } else this.s.addGold(Math.round(legend.price / 2), 'fishing');
      this.changed('waters');
      return { fish: legend, caught: true, weight, message: first ? `${legend.name}, ${weight} lb. A legend.` : `${legend.name} again (${weight} lb). It sells half to a collector.` };
    }
    return undefined;
  }

  /** A hooked fish of high rarity that slips the line may become Grudgebound. */
  escaped(fish: FishDef): void {
    const w = this.w.waters;
    if (fish.rarity < WATERS.grudgeRarity || w.grudge[fish.id] !== undefined) return;
    if (Object.keys(w.grudge).length >= WATERS.grudgeMax) return;
    w.grudge[fish.id] = 1;
    this.note(`The ${fish.name} remembers you.`, 'warning');
    this.changed('waters');
  }

  show(id: string): WResult {
    const w = this.w.waters;
    if (w.shown.includes(id)) return fail('It is already on show.');
    if (!this.s.state.minigames.fish[id]) return fail('You have not caught one.');
    if (w.shown.length >= w.room) return fail('The aquarium is full.');
    w.shown.push(id);
    this.changed('waters');
    return { ok: true };
  }

  unshow(id: string): WResult {
    const w = this.w.waters;
    w.shown = w.shown.filter((x) => x !== id);
    this.changed('waters');
    return { ok: true };
  }

  enlarge(): WResult {
    const w = this.w.waters;
    if (w.room >= WATERS.tankMax) return fail('The aquarium is as large as it will be.');
    if (this.s.state.gold < WATERS.tankCost) return fail(`It costs ${WATERS.tankCost} gold.`);
    this.s.spendGold(WATERS.tankCost, 'aquarium');
    w.room += WATERS.tankStep;
    this.changed('waters');
    return { ok: true };
  }

  // ------------------------------------------------------------------ 26: the Spire of Cards

  canSpire(): WResult {
    if (!this.s.world.inTown()) return fail('The Spire of Cards is entered from a town’s card table.');
    if (this.w.spire.run) return fail('A run is already in progress.');
    if (Object.values(this.s.state.minigames.cards).filter((n) => n > 0).length < 8) return fail('You need eight different cards.');
    return { ok: true };
  }

  spireStart(): WResult {
    const check = this.canSpire();
    if (!check.ok) return check;
    const pool = Object.keys(this.s.state.minigames.cards).filter((id) => (this.s.state.minigames.cards[id] ?? 0) > 0);
    const best = bestHand({ ...this.s.state.minigames, cards: Object.fromEntries(pool.map((id) => [id, 1])) });
    const sorted = [...pool].sort((a, b) => (best.includes(b) ? 1 : 0) - (best.includes(a) ? 1 : 0));
    this.w.spire.run = { seed: this.s.rng.int(1, 1e9), floor: 1, hearts: SPIRE_CARDS.hearts, pool: sorted.slice(0, SPIRE_CARDS.pool), relics: [], phase: 'hand', offer: [], gold: 0 };
    this.w.spire.runs++;
    this.changed('spire');
    return { ok: true };
  }

  get run(): SpireRun | undefined {
    return this.w.spire.run;
  }

  /** The five cards in the order you play them. */
  spireFight(hand: string[]): WResult & { rounds?: ReturnType<typeof spireDuel>['rounds']; outcome?: 'win' | 'lose' | 'draw' } {
    const run = this.run;
    if (!run || run.phase !== 'hand') return fail('Nothing to fight.');
    if (hand.length !== 5 || new Set(hand).size !== 5 || hand.some((id) => !run.pool.includes(id))) return fail('Choose five different cards from your pool.');
    const { rounds, outcome: raw } = spireDuel(new Rng(run.seed + run.floor * 31 + this.w.spire.runs), run, hand);
    const outcome = raw === 'draw' && run.relics.some((id) => SPIRE_RELICS.find((x) => x.id === id)?.draws) ? 'win' : raw;
    if (outcome === 'lose') {
      run.hearts--;
      if (run.hearts <= 0) {
        this.spireEnd(false);
        return { ok: true, rounds, outcome };
      }
    } else if (outcome === 'win') {
      run.gold += SPIRE_CARDS.goldPerFloor * run.floor;
      if (run.floor >= SPIRE_CARDS.topFloor) {
        run.floor++;
        this.spireEnd(true);
        return { ok: true, rounds, outcome };
      }
      run.floor++;
      const rng = new Rng(run.seed + run.floor * 17);
      run.phase = 'draft';
      run.offer = spireOffer(rng, run.floor);
    }
    this.changed('spire');
    return { ok: true, rounds, outcome };
  }

  spireDraft(id: string | undefined): WResult {
    const run = this.run;
    if (!run || run.phase !== 'draft') return fail('Nothing to draft.');
    if (id !== undefined) {
      if (!run.offer.includes(id)) return fail('That card is not on offer.');
      if (!run.pool.includes(id)) run.pool.push(id);
    }
    run.offer = [];
    if ((run.floor - 1) % SPIRE_CARDS.relicEvery === 0) {
      run.phase = 'relic';
      run.offer = relicOffer(new Rng(run.seed + run.floor * 13), run.relics).map((r) => r.id);
    } else run.phase = 'hand';
    this.changed('spire');
    return { ok: true };
  }

  spireRelic(id: string): WResult {
    const run = this.run;
    if (!run || run.phase !== 'relic') return fail('No relic is on offer.');
    if (!run.offer.includes(id)) return fail('That relic is not on offer.');
    run.relics.push(id);
    const r = SPIRE_RELICS.find((x) => x.id === id);
    if (r?.hearts) run.hearts += r.hearts;
    run.offer = [];
    run.phase = 'hand';
    this.changed('spire');
    return { ok: true };
  }

  /** Ends a run: the gold, and a card to keep for every few floors, come home. */
  spireEnd(won: boolean): WResult {
    const run = this.run;
    if (!run) return fail('No run in progress.');
    const cleared = run.floor - 1;
    const sp = this.w.spire;
    sp.best = Math.max(sp.best, cleared);
    if (won) sp.wins++;
    delete sp.run;
    const gold = run.gold;
    if (gold) this.s.addGold(gold, 'spire-of-cards');
    const keeps = Math.floor(cleared / SPIRE_CARDS.keepEvery);
    const strongest = [...run.pool].sort((a, b) => cardById(b).power - cardById(a).power);
    const got: string[] = [];
    for (const id of strongest.slice(0, keeps)) {
      giveCard(this.s.state.minigames, id);
      got.push(id);
    }
    if (won && !this.s.player.devotion.titles.includes(SPIRE_CARDS.title)) this.s.player.devotion.titles.push(SPIRE_CARDS.title);
    this.note(`The Spire of Cards ${won ? 'is climbed' : 'lets you go'}: ${cleared} floor${cleared === 1 ? '' : 's'}, +${gold} gold${got.length ? `, ${got.length} card${got.length > 1 ? 's' : ''} to keep` : ''}.`, won ? 'level' : 'info');
    this.changed('spire');
    return { ok: true, text: `${cleared} floors, ${gold} gold, ${got.length} cards.` };
  }

  spireOpponentNow() {
    return this.run ? spireOpponent(this.run) : undefined;
  }

  // ------------------------------------------------------------------ 27: the Sundered Hours

  eraOpen(id: string): boolean {
    const e = ERAS.find((x) => x.id === id);
    return !!e && this.s.player.level >= e.minLevel;
  }

  /** Walk the choice you made at a turning point (or choose it the first time). */
  turn(tpId: string, choiceId: string): WResult {
    const tp = TURNING_POINTS.find((t) => t.id === tpId);
    const choice = tp?.choices.find((c) => c.id === choiceId);
    if (!tp || !choice) return fail('No such moment.');
    if (!this.s.world.inTown()) return fail('Mirrin opens the rifts only in a town, at a clock.');
    if (!this.eraOpen(tp.era)) return fail(`You are not ready for ${ERAS.find((e) => e.id === tp.era)?.name}.`);
    const cur = this.w.sundered.chosen[tp.id];
    if (cur === choiceId) return fail('The past already runs that way.');
    if (cur) {
      if (this.s.state.gold < SUNDERED.paradoxCost) return fail(`Changing it again costs ${SUNDERED.paradoxCost} gold, a paradox fee.`);
      this.s.spendGold(SUNDERED.paradoxCost, 'sundered');
    }
    this.w.sundered.chosen[tp.id] = choiceId;
    this.w.sundered.trips++;
    this.s.advanceTime(SUNDERED.tripMinutes);
    if (choice.gold) this.s.addGold(choice.gold, 'sundered');
    this.note(choice.present, 'quest');
    if (TURNING_POINTS.every((t) => this.w.sundered.chosen[t.id]) && !this.s.player.devotion.titles.includes(SUNDERED.title)) {
      this.s.player.devotion.titles.push(SUNDERED.title);
      this.note(`Every hour is set. Title earned: ${SUNDERED.title}.`, 'level');
    }
    this.changed('sundered');
    return { ok: true, text: choice.present };
  }

  /** The present as it now is. */
  presentNotes(): string[] {
    return TURNING_POINTS.flatMap((t) => {
      const c = t.choices.find((x) => x.id === this.w.sundered.chosen[t.id]);
      return c ? [c.present] : [];
    });
  }

  // ------------------------------------------------------------------ item 35: pet the pet

  /** Pat the pet that walks with you: once a day it counts, and every 25 pats it brings you a little luck (up to 4). */
  petThePet(): WResult {
    const id = this.s.player.stable.pet;
    if (!id) return fail('You have no pet along.');
    const pet = content.pets.get(id);
    const p = (this.w.pet ??= { pats: 0, lastDay: 0 });
    const day = this.s.state.clock.day;
    const lines = [`${pet.name} leans into your hand.`, `${pet.name} makes a small, pleased noise.`, `${pet.name} rolls over and shows you its good side.`, `${pet.name} pretends not to enjoy it, and fails.`, `${pet.name} follows your hand when you stop.`, `${pet.name} will not stop looking at you, happily.`];
    const line = lines[p.pats % lines.length] as string;
    if (p.lastDay === day) return { ok: true, text: `${line} (It has had its pats for today.)` };
    p.lastDay = day;
    p.pats++;
    this.changed('pet');
    return { ok: true, text: `${line}${p.pats % 25 === 0 && p.pats <= 100 ? ' You feel luckier.' : ''}` };
  }

  // ------------------------------------------------------------------ 28: Painter's Eye

  scene(): Omit<Photo, 'caption' | 'commission'> {
    const s = this.s;
    const town = s.world.inTown();
    return { day: s.state.clock.day, zone: s.world.zone.id, night: s.timeOfDay === 'night', weather: s.world.weatherNow(), ...(town ? { town } : {}), ...(s.player.stable.pet ? { pet: s.player.stable.pet } : {}) };
  }

  /** The commissions this scene fulfils. */
  matches(scene: ReturnType<WondersActions['scene']>): string[] {
    const done = this.w.painter.done;
    return COMMISSIONS.filter((c) => !done.includes(c.id) && (!c.zone || c.zone === scene.zone) && (c.night === undefined || c.night === scene.night) && (!c.weather || c.weather === scene.weather) && (!c.town || !!scene.town) && (!c.pet || !!scene.pet)).map((c) => c.id);
  }

  photo(caption = ''): WResult {
    const scene = this.scene();
    const p = this.w.painter;
    const hit = this.matches(scene)[0];
    const label = caption.trim() || `${content.zones.get(scene.zone).name}, ${scene.night ? 'night' : 'day'}, ${scene.weather}`;
    p.photos.unshift({ ...scene, caption: label, ...(hit ? { commission: hit } : {}) });
    if (p.photos.length > PAINTER.maxPhotos) p.photos.length = PAINTER.maxPhotos;
    this.s.advanceTime(10);
    let text = 'A photograph, kept.';
    if (hit) {
      const c = COMMISSIONS.find((x) => x.id === hit)!;
      p.done.push(hit);
      this.s.addGold(c.gold, 'painter');
      text = `“${c.name}” is delivered: +${c.gold} gold.`;
      this.note(text, 'level');
    }
    this.changed('painter');
    return { ok: true, text };
  }

  canSketch(enemyId: string): WResult {
    if (this.s.player.bestiary[enemyId] === undefined) return fail('You have not met one.');
    if (this.w.painter.sketched.includes(enemyId)) return fail('You have already drawn it.');
    return { ok: true };
  }

  sketch(enemyId: string): WResult {
    const check = this.canSketch(enemyId);
    if (!check.ok) return check;
    const p = this.w.painter;
    p.sketched.push(enemyId);
    this.s.advanceTime(PAINTER.sketchMinutes);
    const e = content.enemies.get(enemyId);
    this.note(`A sketch of the ${e.name}, added to the bestiary.`, 'info');
    if (p.sketched.length >= PAINTER.titleAt && !this.s.player.devotion.titles.includes(PAINTER.title)) {
      this.s.player.devotion.titles.push(PAINTER.title);
      this.note(`A hundred sketches. Title earned: ${PAINTER.title}.`, 'level');
    }
    this.changed('painter');
    return { ok: true };
  }

  /** Families whose every creature (up to the cap) is sketched. */
  familiesDone(): string[] {
    const sketched = new Set(this.w.painter.sketched);
    const by = new Map<string, string[]>();
    for (const e of content.enemies.filter((x) => !x.types.includes('mentor') && !x.types.includes('follower'))) by.set(e.family, [...(by.get(e.family) ?? []), e.id]);
    return [...by.entries()].filter(([, ids]) => ids.slice(0, PAINTER.familyCap).every((id) => sketched.has(id))).map(([f]) => f);
  }

  private familyMods(): ModifierSpec[] {
    const n = this.familiesDone().length;
    return n ? [{ stat: 'damageBonus', type: 'flat', value: n * PAINTER.familyBonus } as ModifierSpec] : [];
  }
}
