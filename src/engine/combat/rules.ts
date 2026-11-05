import type { Battle } from './battle';
import { applyStatus } from './statuses';
import type { Action, BattleEvent, Combatant } from './types';

/**
 * Great foes and enemy families with a trick of their own (Innovation Pack H-4b). A trick is switched on by an enemy flag
 * (`rule:tithe`, `rule:head`, `rule:wyrm`, `rule:understudy`, `rule:conductor`, `rule:ink`, `rule:clocktide`, `rule:moth`, `rule:ghoul`),
 * so adding a foe with one needs no engine change. `observeRules` watches the event stream; `ruleAction` lets a foe follow a fixed pattern.
 */
export interface RuleState {
  /** The Tithe-Collector: gold taken from the purse so far. */
  stolen: number;
  /** Mother Ninefold: head ids severed, in order, and whether her last phase has begun. */
  heads: string[];
  ninefold: boolean;
  /** Own turns taken, per combatant. */
  turns: Record<string, number>;
  /** The Understudy: whether each of the party's last three moves was a skill (true) or a plain Attack or Defend. */
  recent: boolean[];
  /** The Last Conductor's beat, 0 to 3. */
  beat: number;
}
export const newRules = (): RuleState => ({ stolen: 0, heads: [], ninefold: false, turns: {}, recent: [], beat: 0 });

export const TITHE = { share: 0.06, interest: 1.25 } as const;
export const WYRM = { every: 3 } as const;
export const UNDERSTUDY = { damagePerStack: 12, armorPerStack: 8, source: 'rehearsed' } as const;
export const NINEFOLD = { finalHpPct: 30, fury: 40, mercyHeal: 25, silenceDamage: 20 } as const;
export const MOTH = { blindTurns: 2, blindChance: 60, mpShare: 0.08 } as const;
export const GHOUL = { wetWeather: ['rain', 'storm', 'fog'] as readonly string[], wetStatus: 'wet' } as const;

/** Fixed patterns for Clocktide Automatons: `attack`, `defend`, or the id of one of the foe's skills. Learn the tick and exploit it. */
export const CLOCK_PATTERNS: Record<string, string[]> = {
  'clocktide-sentry': ['attack', 'attack', 'defend', 'shield-bash'],
  'clocktide-gunner': ['attack', 'defend', 'attack', 'piercing-volley'],
  'clocktide-warden': ['attack', 'attack', 'attack', 'defend', 'earthshatter'],
};

const flagged = (x: Combatant | undefined, flag: string): x is Combatant => Boolean(x && x.flags.includes(flag));
const mod = (stat: string, type: 'flat' | 'percent', value: number, source: string) => ({ stat, type, value, source }) as never;

export function observeRules(b: Battle, e: BattleEvent): void {
  const r = b.rules;
  if (e.type === 'damage') {
    const src = e.sourceId ? b.get(e.sourceId) : undefined;
    const tgt = b.get(e.targetId);
    if (!src || !tgt || e.dot) {
      checkNinefold(b, tgt);
      return;
    }
    if (src.side === 'enemy' && tgt.side === 'party') {
      if (flagged(src, 'rule:tithe') && b.purse > 0) {
        const take = Math.max(1, Math.min(b.purse, Math.round(b.purse * TITHE.share)));
        b.purse -= take;
        b.tally.spent += take;
        r.stolen += take;
        b.log(`${src.name} takes a tithe: ${take} gold.`);
      }
      if (flagged(src, 'rule:moth')) {
        applyStatus(b, src, tgt, 'blind', { duration: MOTH.blindTurns, chance: MOTH.blindChance } as never);
        const drain = Math.round(tgt.maxMp * MOTH.mpShare);
        if (drain > 0 && tgt.mp > 0) {
          tgt.mp = Math.max(0, tgt.mp - drain);
          b.log(`${src.name} drinks the light from ${tgt.name}: -${drain} MP.`);
        }
      }
    }
    checkNinefold(b, tgt);
  } else if (e.type === 'death') {
    const t = b.get(e.targetId);
    if (flagged(t, 'rule:head') && t.enemyId) {
      r.heads.push(t.enemyId);
      b.log(`A head of Mother Ninefold falls (${r.heads.length} of 9).`);
      if (!b.combatants.some((c) => c.alive && c.side === 'enemy' && c.flags.includes('rule:head'))) ninefoldFinal(b);
    }
  } else if (e.type === 'action') {
    const actor = b.get(e.actorId);
    if (actor?.side === 'party') {
      r.recent = [...r.recent, e.label !== 'Defend' && e.label !== 'Attack'].slice(-3);
      for (const u of b.combatants) if (u.alive && flagged(u, 'rule:understudy')) rehearse(u, r.recent.filter(Boolean).length);
      if (/glyph/i.test(e.label)) {
        for (const u of b.combatants) {
          if (!u.alive || !flagged(u, 'rule:ink')) continue;
          u.hp = Math.min(u.maxHp, u.hp + Math.round(u.maxHp * 0.1));
          b.log(`${u.name} copies the glyph and drinks it.`);
        }
      }
    }
  } else if (e.type === 'turn') {
    const x = b.get(e.actorId);
    if (!x || x.side !== 'enemy') return;
    r.turns[x.id] = (r.turns[x.id] ?? 0) + 1;
    if (flagged(x, 'rule:wyrm') && r.turns[x.id]! % WYRM.every === 0) redraw(b, x);
    if (flagged(x, 'rule:conductor')) beat(b, x);
    if (flagged(x, 'rule:ghoul') && b.weather && GHOUL.wetWeather.includes(b.weather) && !x.statuses.some((s) => s.id === GHOUL.wetStatus)) {
      applyStatus(b, x, x, GHOUL.wetStatus, { duration: 3, unresistable: true } as never);
      b.log(`${x.name} drinks in the wet and swells.`);
    }
  } else if (e.type === 'end' && e.outcome === 'victory' && r.stolen > 0) {
    const back = Math.round(r.stolen * TITHE.interest);
    b.tally.goldFound += back;
    b.log(`The tithe comes back with interest: ${back} gold.`);
  }
}

/** A foe on a fixed beat: attack, attack, defend, strike. Returns the action it takes this turn, if it has a pattern. */
export function ruleAction(b: Battle, x: Combatant, pickFoe: () => Combatant | undefined): Action | undefined {
  if (!x.flags.includes('rule:clocktide') || !x.enemyId) return undefined;
  const pattern = CLOCK_PATTERNS[x.enemyId];
  if (!pattern) return undefined;
  const step = pattern[(b.rules.turns[x.id] ?? 0) % pattern.length] as string;
  if (step === 'defend') return { kind: 'defend', actorId: x.id };
  const foe = pickFoe();
  if (!foe) return undefined;
  if (step === 'attack') return { kind: 'attack', actorId: x.id, targetId: foe.id };
  if (!x.skills.some((s) => s.id === step)) return { kind: 'attack', actorId: x.id, targetId: foe.id };
  return { kind: 'skill', actorId: x.id, skillId: step, targetId: foe.id };
}

/** The tick the party can read: what the automaton will do next. */
export function clockNext(b: Battle, x: Combatant): string | undefined {
  const pattern = x.enemyId ? CLOCK_PATTERNS[x.enemyId] : undefined;
  return pattern && x.flags.includes('rule:clocktide') ? (pattern[(b.rules.turns[x.id] ?? 0) % pattern.length] as string) : undefined;
}

function rehearse(u: Combatant, stacks: number): void {
  const src = UNDERSTUDY.source;
  const keep = u.statInput.modifiers.filter((m) => m.source !== src);
  const add = stacks > 0 ? [mod('damageBonus', 'flat', UNDERSTUDY.damagePerStack * stacks, src), mod('defense', 'percent', UNDERSTUDY.armorPerStack * stacks, src)] : [];
  u.statInput = { ...u.statInput, modifiers: [...keep, ...add] };
}

function redraw(b: Battle, wyrm: Combatant): void {
  b.log(`${wyrm.name} redraws the field. The lines of the map slide under your feet.`);
  for (const c of b.combatants) if (c.alive && c.side === 'party' && b.rng.chance(0.5)) c.row = c.row === 'front' ? 'back' : 'front';
}

function beat(b: Battle, x: Combatant): void {
  const r = b.rules;
  r.beat = (r.beat + 1) % 4;
  if (r.beat !== 0) {
    b.log(`♪ beat ${r.beat}`);
    return;
  }
  b.log('♪ THE DOWNBEAT!');
  if (x.stagger) {
    const keepers = b.combatants.filter((c) => c.alive && c.side === 'party' && ((c.resources.rhythm ?? 0) >= 10 || (c.resources.verse ?? 0) >= 10)).length;
    if (keepers > 0) {
      x.stagger.value = Math.min(x.stagger.max, x.stagger.value + x.stagger.max * 0.2 * keepers);
      b.log(`${keepers > 1 ? 'Your dancers and bards keep' : 'Someone keeps'} time against the Conductor, and the baton slips.`);
    }
  }
}

function checkNinefold(b: Battle, t: Combatant | undefined): void {
  if (!t || b.rules.ninefold || !flagged(t, 'rule:mother') || !t.alive) return;
  if (t.hp / Math.max(1, t.maxHp) * 100 <= NINEFOLD.finalHpPct) ninefoldFinal(b);
}

/** Her last phase depends on the order the heads came off: the first three severed set the temper. */
function ninefoldFinal(b: Battle): void {
  const r = b.rules;
  const mother = b.combatants.find((c) => c.alive && c.flags.includes('rule:mother'));
  if (r.ninefold || !mother) return;
  r.ninefold = true;
  const sum = r.heads.slice(0, 3).reduce((n, id, i) => n + (id.length + i) * (i + 1), 0);
  const kind = sum % 3;
  const src = 'ninefold';
  if (kind === 0) {
    mother.statInput = { ...mother.statInput, modifiers: [...mother.statInput.modifiers, mod('damageBonus', 'flat', NINEFOLD.fury, src)] };
    b.log('The heads were taken in the order of wrath. Mother Ninefold’s last head screams, and the rest of her follows it.');
  } else if (kind === 1) {
    mother.hp = Math.min(mother.maxHp, mother.hp + Math.round(mother.maxHp * NINEFOLD.mercyHeal / 100));
    b.log('The heads were taken in the order of mercy. Every neck seals; she is whole, and sorry, and very strong.');
  } else {
    mother.statInput = { ...mother.statInput, modifiers: [...mother.statInput.modifiers, mod('damageBonus', 'flat', NINEFOLD.silenceDamage, src)] };
    for (const c of b.combatants) if (c.alive && c.side === 'party') applyStatus(b, mother, c, 'silence', { duration: 3, unresistable: true } as never);
    b.log('The heads were taken in the order of silence. A hush falls on the party, and Mother Ninefold speaks for the first time.');
  }
}
