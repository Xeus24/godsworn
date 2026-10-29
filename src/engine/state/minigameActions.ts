import { content } from '../../data';
import { CARD_OPPONENTS } from '../../data/minigames/cards';
import type { FishDef, Water } from '../../data/minigames/fish';
import type { Combatant, EncounterDef } from '../combat/types';
import { createEncounterBattle, runAutoBattle } from '../combat/setup';
import { Rng } from '../core/rng';
import { bite, caughtKinds, logCatch, reel, weighCatch } from '../minigames/fishing';
import { cardById, duelOutcome, giveCard, opponentById, startDuel, type Duel } from '../minigames/cardGame';
import { cargo, diceVerdict, forgePay, forgeScore, forgeTier, houseHand, digPay, raceOdds, rollHand, runRace, type DiceHand, type DigGame, type Racer } from '../minigames/pastimes';
import { groupEncounter } from '../world/world';
import type { GameSession } from './gameState';

type Result<T = object> = ({ ok: true } & T) | { ok: false; reason: string };
const fail = (reason: string): { ok: false; reason: string } => ({ ok: false, reason });

/** How many rungs the arena ladder has. */
export const ARENA_RUNGS = 12;

/**
 * The pastimes of the towns: fishing, Pantheon Cards, Ship-Captain-Crew at the tavern, mount racing, the forge
 * timing game, probing for buried treasure, and the arena ladder. The rules are pure functions in engine/minigames;
 * this applies them to the hero's gold, items and records.
 */
export class MinigameActions {
  constructor(private readonly s: GameSession) {}

  private get m() {
    return this.s.state.minigames;
  }

  // ------------------------------------------------------------ fishing

  /** A cast: something bites (or not). `accuracy` is how true the strike was, from the timing bar. */
  fish(water: Water, night: boolean, accuracy: number): { fish?: FishDef; caught: boolean; weight?: number; record?: boolean; message: string } {
    const rng = this.s.rng;
    const fish = bite(rng, water, night);
    if (!fish) return { caught: false, message: 'Nothing bites.' };
    const skill = Math.floor(Object.values(this.m.fish).reduce((a, f) => a + f.count, 0) / 12);
    if (!reel(rng, fish, accuracy, skill)) return { fish, caught: false, message: `A ${fish.name} on the line, and then not.` };
    const weight = weighCatch(rng, fish);
    const record = logCatch(this.m, fish, weight);
    this.s.advanceTime(25);
    this.s.bus.emit('stateChanged', { reason: 'fishing' });
    return { fish, caught: true, weight, record, message: `${fish.name}, ${weight} lb${record ? ' (a new record!)' : ''}. ${caughtKinds(this.m)} kinds caught.` };
  }

  /** Sells every fish you have caught and not kept: only what you catch counts; the first of each kind is kept for the log. */
  sellFish(): number {
    let gold = 0;
    for (const [id, e] of Object.entries(this.m.fish)) {
      const f = content.fish.find(id);
      if (f && e.count > 1) {
        gold += f.price * (e.count - 1);
        e.count = 1;
      }
    }
    if (gold) this.s.addGold(gold, 'fishing');
    this.s.bus.emit('stateChanged', { reason: 'fishing' });
    return gold;
  }

  // ------------------------------------------------------------ cards

  duel(opponentId: string, hand: string[]): Result<{ duel: Duel }> {
    if (hand.length !== 5) return fail('Choose five cards.');
    if (hand.some((id) => (this.m.cards[id] ?? 0) <= 0)) return fail('You do not own that card.');
    if (new Set(hand).size !== 5) return fail('Five different cards.');
    return { ok: true, duel: startDuel(opponentById(opponentId), hand) };
  }

  /** Settles a finished duel: a win takes the opponent’s staked card and some gold. */
  finishDuel(duel: Duel): { outcome: 'win' | 'lose' | 'draw'; prize?: string; firstTime?: boolean; gold?: number } {
    const outcome = duelOutcome(duel);
    if (!outcome) return { outcome: 'draw' };
    if (outcome !== 'win') return { outcome };
    const first = giveCard(this.m, duel.opponent.prize);
    const gold = 15 * (CARD_OPPONENTS.findIndex((o) => o.id === duel.opponent.id) + 1);
    this.m.cardWins++;
    this.s.addGold(gold, 'cards');
    this.s.bus.emit('stateChanged', { reason: 'cards' });
    return { outcome, prize: cardById(duel.opponent.prize).name, firstTime: first, gold };
  }

  // ------------------------------------------------------------ tavern dice

  playDice(wager: number, mine: DiceHand): Result<{ verdict: 'win' | 'lose' | 'draw'; house: DiceHand; cargo: number; houseCargo: number }> {
    if (wager < 1) return fail('Place a wager.');
    if (!this.s.spendGold(wager, 'dice')) return fail('You do not have the gold.');
    const house = houseHand(this.s.rng);
    const verdict = diceVerdict(mine, house);
    if (verdict === 'win') {
      this.s.addGold(wager * 2, 'dice');
      this.m.dice.wins++;
    } else if (verdict === 'draw') this.s.addGold(wager, 'dice');
    else this.m.dice.losses++;
    this.s.devotion.deeds([{ event: 'gamble', count: 1 }], 'quest');
    return { ok: true, verdict, house, cargo: cargo(mine), houseCargo: cargo(house) };
  }

  rollDice(hand: DiceHand, keep: boolean[]): DiceHand {
    return rollHand(this.s.rng, hand, keep);
  }

  // ------------------------------------------------------------ racing

  /** The field: your mount (or on foot) and four others of the stable. */
  field(): Racer[] {
    const mount = this.s.player.stable.mounts.map((id) => content.mounts.get(id)).sort((a, b) => a.stepMinutes - b.stepMinutes)[0];
    const you: Racer = { id: 'you', name: mount ? `You, on ${mount.name}` : 'You, on foot', speed: mount ? Math.min(10, 12 - mount.stepMinutes * 2) : 3 };
    return [you, { id: 'r1', name: 'Dusty Biscuit', speed: 4 }, { id: 'r2', name: 'Lady Gallop', speed: 6 }, { id: 'r3', name: 'Thunder Hen', speed: 5 }, { id: 'r4', name: 'The Pale Mare', speed: 7 }];
  }

  race(pick: string, wager: number): Result<{ order: string[]; won: boolean; payout: number }> {
    const field = this.field();
    const racer = field.find((r) => r.id === pick);
    if (!racer) return fail('Pick a racer.');
    if (wager < 1) return fail('Place a bet.');
    if (!this.s.spendGold(wager, 'racing')) return fail('You do not have the gold.');
    const order = runRace(this.s.rng, field);
    const won = order[0] === pick;
    const payout = won ? Math.round(wager * raceOdds(racer, field)) : 0;
    if (payout) this.s.addGold(payout, 'racing');
    this.m.racing.races++;
    if (order[0] === 'you') this.m.racing.wins++;
    return { ok: true, order, won, payout };
  }

  // ------------------------------------------------------------ forging

  finishForge(offsets: number[]): { score: number; tier: string; gold: number; record: boolean } {
    const score = forgeScore(offsets);
    const gold = forgePay(score, this.s.player.level);
    const record = score > this.m.forging.best;
    if (record) this.m.forging.best = score;
    this.m.forging.strikes += offsets.length;
    this.s.addGold(gold, 'forging');
    this.s.bus.emit('stateChanged', { reason: 'forging' });
    return { score, tier: forgeTier(score), gold, record };
  }

  // ------------------------------------------------------------ digging

  finishDig(game: DigGame): { gold: number } {
    this.m.digging.digs++;
    if (!game.found) return { gold: 0 };
    this.m.digging.found++;
    const gold = digPay(this.s.player.level);
    this.s.addGold(gold + game.left * 10, 'digging');
    this.s.bus.emit('stateChanged', { reason: 'digging' });
    return { gold: gold + game.left * 10 };
  }

  // ------------------------------------------------------------ the arena ladder

  /** The fight for a rung: packs from the zones in order, growing with the rung and never behind the hero. */
  rungEncounter(rung: number): EncounterDef {
    const zones = content.zones.filter((z) => !z.off);
    const zone = zones[Math.min(zones.length - 1, Math.floor(((rung - 1) / ARENA_RUNGS) * zones.length))] as (typeof zones)[number];
    const group = zone.encounters[(rung - 1) % zone.encounters.length] as NonNullable<(typeof zone)['encounters']>[number];
    const level = Math.max(zone.levels[0], Math.min(zone.levels[1], this.s.player.level));
    return groupEncounter(group, `arena:${rung}`, `Arena rung ${rung}`, level, { canFlee: false, isBoss: rung === ARENA_RUNGS });
  }

  /** Fights the next rung, settled at once by your party’s own judgement (it does not cost health). */
  fightRung(): Result<{ won: boolean; rung: number; gold: number }> {
    const a = this.m.arena;
    const rung = a.rung + 1;
    if (rung > ARENA_RUNGS) return fail('You are the champion of the ladder.');
    const hero = structuredClone(this.s.player);
    const b = createEncounterBattle(hero, this.rungEncounter(rung), { rng: new Rng(this.s.rng.int(1, 2 ** 30)), companions: this.s.party.battleMembers() });
    runAutoBattle(b);
    a.fights++;
    const won = b.outcome === 'victory';
    let gold = 0;
    if (won) {
      a.rung = rung;
      a.best = Math.max(a.best, rung);
      gold = rung * this.s.player.level * 6;
      this.s.addGold(gold, 'arena');
      if (rung === ARENA_RUNGS && !this.s.player.devotion.titles.includes('Arena Champion')) this.s.player.devotion.titles.push('Arena Champion');
    } else a.rung = Math.max(0, a.rung - 1);
    this.s.bus.emit('stateChanged', { reason: 'arena' });
    return { ok: true, won, rung, gold };
  }
}

export type { Combatant };
