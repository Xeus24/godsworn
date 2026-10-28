import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { DEVOTION } from '../src/data/devotion';
import { characterStats } from '../src/engine/character/stats';
import type { Character } from '../src/engine/character/types';
import { createHero } from '../src/engine/combat/combatants';
import { applyDamage } from '../src/engine/combat/hits';
import { createEncounterBattle } from '../src/engine/combat/setup';
import { perform, startBattle } from '../src/engine/combat/turns';
import type { Combatant } from '../src/engine/combat/types';
import { Rng } from '../src/engine/core/rng';
import { activeMajors, blessingSlotCount, canSlot, chooseOffer, refreshOffers, slotBlessing } from '../src/engine/gods/blessings';
import { applyFavor, goldOfferingFavor, itemOfferingFavor, judgeDeeds, tierFor } from '../src/engine/gods/devotion';
import { canEquip } from '../src/engine/items/equipment';
import { createItem, uniquePool } from '../src/engine/items/generate';
import { canLearnGeneral } from '../src/engine/skills/general';
import { settleBattle } from '../src/engine/state/battleResults';
import { GameSession } from '../src/engine/state/gameState';
import { atShrine, makeHero } from './helpers';

const withFavor = (char: Character, favor: Record<string, number>): Character => {
  Object.assign(char.devotion.favor, favor);
  return char;
};

describe('favor tiers', () => {
  it('maps favor to the eight devotion tiers (Apostle needs the trial)', () => {
    expect(tierFor(-100)).toBe('hated');
    expect(tierFor(-50)).toBe('hated');
    expect(tierFor(-49)).toBe('distrusted');
    expect(tierFor(0)).toBe('neutral');
    expect(tierFor(100)).toBe('acknowledged');
    expect(tierFor(250)).toBe('favored');
    expect(tierFor(500)).toBe('devoted');
    expect(tierFor(1200)).toBe('exalted');
  });

  it('every god (but the hidden one) has rules, 3 minor and 6 major blessings', () => {
    const visible = content.gods.filter((g) => !g.hidden);
    expect(content.pantheon.size).toBe(visible.length);
    expect(content.blessings.filter((b) => b.kind === 'minor')).toHaveLength(visible.length * 3);
    expect(content.blessings.filter((b) => b.kind === 'major' && b.rarity !== 'divine')).toHaveLength(visible.length * 6);
  });
});

describe('favor gain and loss', () => {
  it('gods judge deeds: Solenne likes slaying undead, Morrath dislikes healing', () => {
    const { deltas, discovered } = judgeDeeds([
      { event: 'kill', enemyTypes: ['undead'], tier: 'normal' },
      { event: 'kill', enemyTypes: ['undead'], tier: 'normal' },
      { event: 'heal', count: 4 },
    ]);
    expect(deltas.solenne).toBe(6);
    expect(deltas.morrath).toBe(-1);
    expect(discovered).toContain('solenne:like:0');
  });

  it('caps a like per battle', () => {
    const { deltas } = judgeDeeds([{ event: 'crit', count: 50 }]);
    expect(deltas.kael).toBe(3);
    expect(deltas.vex).toBe(4);
  });

  it('kill deeds can filter by the killing element', () => {
    expect(judgeDeeds([{ event: 'kill', enemyTypes: ['beast'], tier: 'normal', element: 'lightning' }]).deltas.nymira).toBe(2);
    expect(judgeDeeds([{ event: 'kill', enemyTypes: ['beast'], tier: 'normal', element: 'fire' }]).deltas.nymira).toBeUndefined();
  });

  it('gains cost the god’s rivals a tenth, and Favor Gain multiplies gains only', () => {
    const hero = makeHero({ birthSignId: 'the-forge' });
    const changes = applyFavor(hero, { solenne: 40 }, 0);
    expect(hero.devotion.favor.solenne).toBe(40);
    expect(hero.devotion.favor.morrath).toBe(-4);
    expect(changes.map((ch) => ch.god).sort()).toEqual(['morrath', 'solenne']);
    applyFavor(hero, { kael: 100 }, 50);
    expect(hero.devotion.favor.kael).toBe(150);
    applyFavor(hero, { kael: -20 }, 50);
    expect(hero.devotion.favor.kael).toBe(130);
  });

  it('the birth sign adds its favor bonus with its god', () => {
    const hero = makeHero({ birthSignId: 'the-forge' });
    applyFavor(hero, { thalor: 100 }, 0);
    expect(hero.devotion.favor.thalor).toBe(105);
  });

  it('clamps favor between -100 and 1200', () => {
    const hero = makeHero();
    applyFavor(hero, { kael: -500 }, 0);
    applyFavor(hero, { vex: 5000 }, 0, true);
    expect(hero.devotion.favor.kael).toBe(DEVOTION.minFavor);
    expect(hero.devotion.favor.vex).toBe(DEVOTION.maxFavor);
  });

  it('offerings: each god values gold and items differently', () => {
    expect(goldOfferingFavor('grimvald', 150)).toBeGreaterThan(goldOfferingFavor('ysolde', 150));
    const ore = content.items.filter((b) => b.category === 'material' && b.kind === 'ore')[0];
    if (!ore) throw new Error('no ore');
    expect(itemOfferingFavor('thalor', ore.id, 100)).toBeGreaterThan(itemOfferingFavor('aurelis', ore.id, 100));
  });
});

describe('the session: shrines, minor blessings, scriptures', () => {
  it('a shrine prayer works once per in-game day', () => {
    const s = GameSession.newGame(1, makeHero());
    expect(s.devotion.prayAtShrine('hesha').ok).toBe(true);
    expect(s.player.devotion.favor.hesha).toBeGreaterThanOrEqual(DEVOTION.shrinePrayerFavor);
    expect(s.devotion.prayAtShrine('hesha').ok).toBe(false);
    s.advanceTime(24 * 60);
    expect(s.devotion.prayAtShrine('hesha').ok).toBe(true);
  });

  it('a minor blessing costs favor and lasts a number of battles', () => {
    const s = GameSession.newGame(2, withFavor(makeHero(), { kael: 50 }));
    expect(s.devotion.receiveMinor('kael-fury').ok).toBe(false);
    atShrine(s, 'kael');
    const before = characterStats(s.player).damageBonus;
    expect(s.devotion.receiveMinor('kael-fury').ok).toBe(true);
    expect(s.player.devotion.favor.kael).toBe(30);
    expect(characterStats(s.player).damageBonus).toBeGreaterThan(before);
    expect(s.player.timedBuffs.find((b) => b.god === 'kael')?.battlesLeft).toBe(10);
  });

  it('Divine skills need the god’s blessing; scriptures cost favor at Favored', () => {
    const s = GameSession.newGame(3, withFavor(makeHero(), { aurelis: 300 }));
    atShrine(s, 'aurelis');
    expect(canLearnGeneral(s.player, 'rite-of-knowing').ok).toBe(false);
    expect(s.devotion.buyScripture('aurelis').ok).toBe(true);
    expect(s.state.inventory.slots.some((i) => i?.baseId === 'book-rite-of-knowing')).toBe(true);
    s.devotion.receiveMinor('aurelis-rune');
    expect(canLearnGeneral(s.player, 'rite-of-knowing').ok).toBe(true);
  });

  it('a patron must at least acknowledge you', () => {
    const s = GameSession.newGame(4, makeHero());
    expect(s.devotion.setPatron('solenne').ok).toBe(false);
    s.player.devotion.favor.solenne = 120;
    expect(s.devotion.setPatron('solenne').ok).toBe(true);
  });
});

describe('major blessings', () => {
  it('slots: 1, +1 at level 25 and 50', () => {
    const hero = makeHero();
    expect(blessingSlotCount(hero)).toBe(1);
    hero.level = 25;
    expect(blessingSlotCount(hero)).toBe(2);
    hero.level = 50;
    expect(blessingSlotCount(hero)).toBe(3);
  });

  it('reaching a tier offers 3 blessings once; choosing one slots it', () => {
    const hero = withFavor(makeHero(), { kael: 120 });
    expect(refreshOffers(hero, new Rng(1))).toEqual(['kael']);
    expect(refreshOffers(hero, new Rng(1))).toEqual([]);
    const offer = hero.devotion.offers.kael ?? [];
    expect(offer).toHaveLength(3);
    for (const id of offer) expect(content.blessings.get(id).minTier).toBe('acknowledged');
    expect(chooseOffer(hero, 'kael', offer[0] as string).ok).toBe(true);
    expect(hero.devotion.slotted).toEqual([offer[0]]);
  });

  it('rival gods’ blessings cannot be slotted together', () => {
    const hero = withFavor(makeHero(), { kael: 120, hesha: 120 });
    hero.level = 30;
    hero.devotion.majors.push('kael-veteran', 'hesha-kindness');
    expect(slotBlessing(hero, 'kael-veteran').ok).toBe(true);
    expect(canSlot(hero, 'hesha-kindness').ok).toBe(false);
  });

  it('a major blessing goes quiet if its god’s favor drops below its tier', () => {
    const hero = withFavor(makeHero(), { kael: 300 });
    hero.devotion.majors.push('kael-first-blood');
    slotBlessing(hero, 'kael-first-blood');
    expect(activeMajors(hero).map((b) => b.id)).toEqual(['kael-first-blood']);
    expect(createHero(hero).flags).toContain('firstStrike');
    hero.devotion.favor.kael = 200;
    expect(activeMajors(hero)).toEqual([]);
  });

  it('Hated gods curse you with more damage taken', () => {
    // A rogue: no class trait scaling damage taken.
    const hero = makeHero({ classId: 'rogue' });
    const before = characterStats(hero).damageTaken;
    hero.devotion.favor.vex = -80;
    expect(characterStats(hero).damageTaken).toBe(before + DEVOTION.hatedCurse);
  });
});

describe('divine items', () => {
  it('drop and can be equipped only with the devotion they ask for', () => {
    const ctx = { rng: new Rng(1), itemLevel: 40, newUid: () => 'x' };
    expect(uniquePool('divine', ctx)).toEqual([]);
    expect(uniquePool('divine', { ...ctx, favorTiers: { kael: 5 } }).map((u) => u.id).sort()).toEqual(['red-banner-blade', 'warhelm-of-kael']);
    const hero = makeHero({ classId: 'warrior' });
    hero.level = 30;
    const blade = createItem('greatsword-t3', 1, () => 'b');
    blade.rarity = 'divine';
    blade.uniqueId = 'red-banner-blade';
    blade.identified = true;
    expect(canEquip(hero, blade, 'mainHand', characterStats(hero) as never).ok).toBe(false);
    hero.devotion.favor.kael = 260;
    expect(canEquip(hero, blade, 'mainHand', { str: 999, dex: 999, int: 999, vit: 999, wis: 999, luk: 999, fai: 999, cha: 0 }).ok).toBe(true);
  });
});

describe('gods in battle', () => {
  function battle(seed: number, char: Character, encounter = 'old-battlefield') {
    const s = GameSession.newGame(seed, char);
    const b = createEncounterBattle(s.player, content.encounters.get(encounter), { rng: s.rng });
    startBattle(b);
    const hero = b.combatants.find((x) => x.kind === 'hero') as Combatant;
    return { s, b, hero };
  }
  const killAll = (b: ReturnType<typeof battle>['b'], hero: Combatant): void => {
    for (const x of b.alive('enemy')) applyDamage(b, hero, x, 999999, { element: 'holy', crit: false });
    b.checkOutcome();
  };

  it('victories change favor: Solenne approves of slain undead', () => {
    const { s, b, hero } = battle(5, makeHero());
    killAll(b, hero);
    const r = settleBattle(s, b);
    expect(r.favor.some((ch) => ch.god === 'solenne' && ch.after > ch.before)).toBe(true);
    expect(s.player.devotion.discovered).toContain('solenne:like:0');
  });

  it('Pray spends the patron’s favor for its effect', () => {
    const hero0 = withFavor(makeHero(), { hesha: 200 });
    hero0.devotion.patron = 'hesha';
    const { s, b, hero } = battle(6, hero0);
    expect(hero.prayer?.uses).toBe(3);
    hero.hp = 1;
    b.current = hero;
    expect(perform(b, { kind: 'pray', actorId: hero.id }).ok).toBe(true);
    expect(hero.hp).toBeGreaterThan(1);
    expect(perform(b, { kind: 'pray', actorId: hero.id }).ok).toBe(false);
    killAll(b, hero);
    settleBattle(s, b);
    expect(s.player.devotion.favor.hesha).toBeLessThan(200);
  });

  it('a Devoted god may intervene to save you once, until you rest', () => {
    const hero0 = withFavor(makeHero(), { hesha: 1200 });
    hero0.devotion.patron = 'hesha';
    let saved = false;
    for (let seed = 1; seed < 30 && !saved; seed++) {
      const { s, b, hero } = battle(seed, structuredClone(hero0));
      const foe = b.alive('enemy')[0] as Combatant;
      applyDamage(b, foe, hero, 999999, { element: 'physical', crit: false });
      if (hero.alive && hero.intervention?.used) {
        saved = true;
        expect(hero.hp).toBeGreaterThan(0);
        killAll(b, hero);
        settleBattle(s, b);
        expect(s.player.devotion.interventionReady).toBe(false);
        s.general.rest();
        expect(s.player.devotion.interventionReady).toBe(true);
      }
    }
    expect(saved).toBe(true);
  });

  it('a hated god’s herald joins fights; beating it earns penance', () => {
    const hero0 = withFavor(makeHero(), { vex: -90 });
    const s = GameSession.newGame(7, hero0);
    const b = createEncounterBattle(s.player, content.encounters.get('slime-puddle'), { rng: s.rng, punisher: 'vex' });
    startBattle(b);
    expect(b.combatants.some((x) => x.enemyId === 'punisher-vex')).toBe(true);
    const hero = b.combatants.find((x) => x.kind === 'hero') as Combatant;
    killAll(b, hero);
    settleBattle(s, b);
    expect(tierFor(s.player.devotion.favor.vex ?? 0)).not.toBe('hated');
  });
});
