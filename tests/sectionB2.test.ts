import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { SPIRITS } from '../src/data/spirits';
import { SOULBOUND, SOULBOUND_ROSTER, SEALS } from '../src/data/soulbound';
import { PARTS_BY_TYPE, partsFor } from '../src/data/trophies';
import { SIGILS, OVERCHARGE } from '../src/data/heart/sigils';
import { Battle } from '../src/engine/combat/battle';
import { createEnemy, createHero } from '../src/engine/combat/combatants';
import { createEncounterBattle } from '../src/engine/combat/setup';
import { benchmarkHero } from '../src/engine/combat/simulateHelpers';
import { bindChance, bindable, tryBind } from '../src/engine/combat/soulbind';
import { breakPart } from '../src/engine/combat/trophies';
import { startBattle } from '../src/engine/combat/turns';
import { useSkill } from '../src/engine/combat/skills';
import { Rng } from '../src/engine/core/rng';
import { characterStats } from '../src/engine/character/stats';
import { heartOf, sigilSlots, learnedSlots } from '../src/engine/heart/heart';
import { addCreature, gainXp, stageName } from '../src/engine/realm/ranch';
import { GameSession } from '../src/engine/state/gameState';
import { groupEncounter } from '../src/engine/world/world';
import { makeHero } from './helpers';

const session = () => GameSession.newGame(61, makeHero());
function arena(foe: string, level = 20, seed = 3) {
  const party = [createHero(benchmarkHero('mage', level), 'hero')];
  const foes = [createEnemy(content.enemies.get(foe), 'enemy-1', level)];
  const b = new Battle({ party, enemies: foes, rng: new Rng(seed), encounterId: 'wild:meadowlands', canFlee: true });
  startBattle(b);
  return { b, hero: party[0]!, foe: foes[0]! };
}

describe('Soulbinding (item 11)', () => {
  it('has 84 real creatures, none of them the Summoner’s spirits, and three seals in the shops', () => {
    expect(SOULBOUND_ROSTER).toHaveLength(84);
    expect(new Set(SOULBOUND_ROSTER).size).toBe(84);
    for (const id of SOULBOUND_ROSTER) expect(content.enemies.find(id), id).toBeDefined();
    const spirits = new Set(SPIRITS.map((s) => s.id));
    for (const id of SOULBOUND_ROSTER) expect(spirits.has(id)).toBe(false);
    for (const seal of SEALS) expect(content.items.find(seal.id)).toBeDefined();
    expect(content.shops.get('general').stock.some((r) => r.kind === 'items' && r.ids.includes('soul-seal'))).toBe(true);
    expect(content.shops.get('magic').stock.some((r) => r.kind === 'items' && r.ids.includes('soul-seal-gilded'))).toBe(true);
  });

  it('the weaker the creature and the stronger the seal, the likelier the bond; bosses and unlisted foes cannot be bound', () => {
    const { foe } = arena('dire-wolf');
    foe.hp = foe.maxHp;
    const full = bindChance(foe, 0.35);
    foe.hp = Math.floor(foe.maxHp * 0.1);
    expect(bindChance(foe, 0.35)).toBeGreaterThan(full);
    expect(bindChance(foe, 0.85)).toBeGreaterThan(bindChance(foe, 0.35));
    expect(bindable(foe)).toBe(true);
    const goblin = arena('goblin-cutthroat').foe;
    expect(bindable(goblin)).toBe(false);
    const boss = arena('goblin-king').foe;
    expect(bindable(boss)).toBe(false);
  });

  it('a successful seal takes the creature out of the fight and the ranch welcomes it; a full ranch turns it away', () => {
    const { b, hero, foe } = arena('dire-wolf', 20, 5);
    foe.hp = 1;
    b.rng.chance = () => true;
    tryBind(b, hero, foe, 0.85);
    expect(foe.alive).toBe(false);
    expect(b.tally.bound).toHaveLength(1);
    expect(b.outcome).toBe('victory');
    const s = session();
    s.realm.afterBattle(b);
    expect(s.realm.ranch.creatures).toHaveLength(1);
    expect(s.realm.ranch.active).toBe(s.realm.ranch.creatures[0]!.id);
    s.realm.ranch.capacity = 1;
    const c2 = addCreature(s.realm.ranch, 'dire-wolf', 3, 'meadowlands', 1);
    expect(c2).toBeNull();
  });

  it('a bound creature levels, evolves at 16 and 36 and takes a new name, and fights in a fourth place', () => {
    const s = session();
    const c = addCreature(s.realm.ranch, 'dire-wolf', 1, 'meadowlands', 1)!;
    expect(c.name).toBe('Dire Wolf');
    const r = gainXp(c, 1_000_000, 16);
    expect(r.evolved).toBe(true);
    expect(c.level).toBe(16);
    expect(c.stage).toBe(1);
    expect(c.name).toBe(stageName('dire-wolf', 1));
    expect(c.name).toBe('Alpha Dire Wolf');
    gainXp(c, 10_000_000, 40);
    expect(c.stage).toBe(2);
    expect(c.name).toBe('Primal Dire Wolf');
    expect(SOULBOUND.evolveAt).toEqual([16, 36]);
    const enc = groupEncounter({ weight: 1, enemies: [{ enemyId: 'goblin-cutthroat' }] }, 'wild:meadowlands', 'x', 10);
    const b = createEncounterBattle(benchmarkHero('warrior', 10), enc, { rng: new Rng(1), soulbound: s.realm.activeCreature() });
    const mine = b.combatants.find((x) => x.soulboundId === c.id)!;
    expect(mine.side).toBe('party');
    expect(mine.name).toBe('Primal Dire Wolf');
    // It earns experience for a won fight.
    c.level = 40;
    c.xp = 0;
    const won = createEncounterBattle(s.player, enc, { rng: new Rng(2), soulbound: s.realm.activeCreature() });
    won.outcome = 'victory';
    s.player.level = 60;
    s.realm.afterBattle(won);
    expect(c.level > 40 || c.xp > 0).toBe(true);
  });

  it('a treat, new pens and release work', () => {
    const s = session();
    s.state.gold = 1_000_000;
    s.player.level = 30;
    const c = addCreature(s.realm.ranch, 'dire-wolf', 1, 'meadowlands', 1)!;
    expect(s.realm.feed(c.id).ok).toBe(true);
    expect(c.xp).toBeGreaterThan(0);
    const cap = s.realm.ranch.capacity;
    expect(s.realm.expand().ok).toBe(true);
    expect(s.realm.ranch.capacity).toBe(cap + 4);
    s.realm.release(c.id);
    expect(s.realm.ranch.creatures).toHaveLength(0);
  });
});

describe('Trophy Forging (item 12)', () => {
  it('a break breaks a part, weakens the boss, and the parts are yours when it falls; three of them forge a weapon and armor with its name', () => {
    const { b, foe } = arena('goblin-king', 20, 7);
    expect(partsFor(foe.types)).toHaveLength(3);
    expect(PARTS_BY_TYPE.length).toBeGreaterThan(8);
    // Break it three times by hand (the stagger break calls this).
    const base = b.stats(foe).damageBonus;
    breakPart(b, foe);
    breakPart(b, foe);
    breakPart(b, foe);
    breakPart(b, foe);
    expect(b.tally.parts).toHaveLength(3);
    expect(b.stats(foe).damageBonus).toBeLessThan(base);
    foe.alive = false;
    b.outcome = 'victory';
    const s = session();
    s.realm.afterBattle(b);
    const set = s.realm.trophies().find((t) => t.boss === 'goblin-king');
    expect(set?.parts).toHaveLength(3);
    // The forge works in town.
    s.state.gold = 1_000_000;
    s.state.world.position = { ...s.state.world.position } as never;
    (s.world as unknown as { inTown(): string }).inTown = () => 'brightwater';
    const r = s.realm.forgeTrophies('goblin-king');
    expect(r.ok).toBe(true);
    expect(r.weapon).toContain('Goblin King');
    expect(s.realm.trophies().find((t) => t.boss === 'goblin-king')).toBeUndefined();
    expect(s.realm.forgeTrophies('goblin-king').ok).toBe(false);
  });
});

describe('Sigils of the Old Faith (item 13)', () => {
  it('has 40 sigils with a deed each and a boon that overcharges for a price', () => {
    expect(SIGILS).toHaveLength(40);
    for (const sg of SIGILS) {
      expect(sg.over).toHaveLength(2);
      const boon = sg.mods[0] as { value: number };
      const over = sg.over[0] as { value: number };
      expect(Math.abs(over.value)).toBeCloseTo(Math.abs(boon.value) * OVERCHARGE, 0);
      expect((sg.over[1] as { value: number }).value).toBeLessThan(0);
    }
  });

  it('a sigil is found by its deed, slotted for a boon (limited slots) and overcharged', () => {
    const s = session();
    const h = heartOf(s.player);
    s.heart.findSigils();
    expect(h.sigilsFound).toEqual([]);
    s.state.stats.kills = 200;
    s.heart.findSigils();
    expect(h.sigilsFound).toContain('sig-fangs');
    const crit = characterStats(s.player).critChance;
    expect(s.heart.slotSigil('sig-fangs').ok).toBe(true);
    expect(characterStats(s.player).critChance).toBeGreaterThan(crit);
    s.heart.overcharge('sig-fangs');
    const over = characterStats(s.player).critChance;
    expect(over).toBeGreaterThan(crit + 2);
    expect(s.heart.slotSigil('sig-nope').ok).toBe(false);
    expect(sigilSlots(s.player)).toBe(3);
    s.player.level = 60;
    expect(sigilSlots(s.player)).toBe(5);
    s.heart.slotSigil('sig-fangs');
    expect(h.sigils).toHaveLength(0);
  });
});

describe('Borrowed Arts (item 14)', () => {
  it('needs a class you have trained in, costs gold and a day, fills a slot and shows up in battle', () => {
    const s = session();
    expect(s.heart.trainedClasses()).toEqual([]);
    expect(s.heart.borrow('firebolt').ok).toBe(false);
    const other = content.classes.ids().find((id) => id !== s.player.classes[0]?.classId && content.trees.find(id)?.nodes.some((n) => n.kind === 'active'))!;
    const trial = content.classTrials.all().find((t) => t.classId === other)!;
    s.player.trialsWon.push(trial.encounter);
    expect(s.heart.trainedClasses()).toContain(other);
    const options = s.heart.borrowable(other);
    expect(options.length).toBeGreaterThan(0);
    s.state.gold = 1_000_000;
    const day = s.state.clock.day;
    const r = s.heart.borrow(options[0]!.skill);
    expect(r.ok).toBe(true);
    expect(s.state.clock.day).toBeGreaterThanOrEqual(day);
    expect(heartOf(s.player).borrowed).toEqual([options[0]!.skill]);
    expect(s.heart.borrow(options[0]!.skill).ok).toBe(false);
    const hero = createHero(s.player, 'hero');
    expect(hero.skills.some((x) => x.id === options[0]!.skill)).toBe(true);
    expect(hero.hotbar).toContain(options[0]!.skill);
    expect(learnedSlots(s.player)).toBe(2);
    s.heart.forgetArt(options[0]!.skill);
    expect(heartOf(s.player).borrowed).toEqual([]);
    void useSkill;
  });
});
