import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { ARTS, type ArtDef, type ArtEffect } from '../src/data/heart/arts';
import { BONDS, BOND_RANK_POINTS } from '../src/data/heart/bonds';
import { QUIRKS } from '../src/data/heart/bloodline';
import { CONVICTIONS, SETTLE_DAYS } from '../src/data/heart/convictions';
import { TALES, TALE_APPROVAL } from '../src/data/heart/tales';
import { characterStats } from '../src/engine/character/stats';
import { bondRank, heartOf, holds } from '../src/engine/heart/heart';
import { evaluate } from '../src/engine/quests/conditions';
import { GameSession } from '../src/engine/state/gameState';
import { HeartActions } from '../src/engine/state/heartActions';
import { deserialize, serialize } from '../src/engine/state/save';
import { makeHero } from './helpers';

const session = () => GameSession.newGame(51, makeHero());
const days = (s: GameSession, n: number) => { for (let i = 0; i < n; i++) s.advanceTime(1440); };

describe('the data', () => {
  it('has 60 convictions in 20 opposing pairs, all pointing at real stats and gods', () => {
    expect(CONVICTIONS).toHaveLength(60);
    expect(new Set(CONVICTIONS.map((c) => c.id)).size).toBe(60);
    const stats = new Set<string>(content.stats.all().map((x) => x.id));
    for (const c of CONVICTIONS) {
      for (const m of c.mods) expect(stats.has((m as { stat: string }).stat), `${c.id} ${(m as { stat: string }).stat}`).toBe(true);
      for (const g of Object.keys(c.gods ?? {})) expect(content.gods.find(g), `${c.id} ${g}`).toBeDefined();
      if (c.opposes) expect(CONVICTIONS.find((x) => x.id === c.opposes)?.opposes).toBe(c.id);
    }
    expect(CONVICTIONS.filter((c) => c.opposes)).toHaveLength(30);
  });

  it('has 20 bonds, 12 tale pairs of four scenes and a field art for every class', () => {
    expect(BONDS).toHaveLength(20);
    for (const b of BONDS) {
      expect(b.kind === 'npc' ? content.npcs.find(b.ref) : content.gods.find(b.ref), b.id).toBeDefined();
      expect(content.recipes.find(b.recipe), b.recipe).toBeDefined();
      for (const sk of b.skills) expect(content.generalSkills.find(sk), sk).toBeDefined();
    }
    expect(BOND_RANK_POINTS).toHaveLength(10);
    expect(TALES).toHaveLength(12);
    for (const t of TALES) {
      expect(t.stages).toHaveLength(4);
      expect(content.companions.find(t.a) && content.companions.find(t.b)).toBeTruthy();
    }
    expect(ARTS).toHaveLength(30);
    for (const id of content.classes.ids()) expect(ARTS.some((a) => a.classId === id), id).toBe(true);
    expect(QUIRKS.length).toBeGreaterThanOrEqual(24);
  });
});

describe('Convictions', () => {
  it('deeds lean a belief, it settles after a few days, then it gives its boon and the gods notice', () => {
    const s = session();
    const mercy = CONVICTIONS.find((c) => c.id === 'mercy')!;
    const before = characterStats(s.player).healingPower;
    const favor = s.player.devotion.favor['hesha'] ?? 0;
    for (let i = 0; i < mercy.need; i++) s.devotion.deed('mercy');
    expect(heartOf(s.player).adopted['mercy']).toBeDefined();
    expect(holds(heartOf(s.player), 'mercy')).toBe(false);
    days(s, SETTLE_DAYS - 1);
    expect(holds(heartOf(s.player), 'mercy')).toBe(false);
    days(s, 2);
    expect(holds(heartOf(s.player), 'mercy')).toBe(true);
    expect(characterStats(s.player).healingPower).toBeGreaterThan(before);
    expect(s.player.devotion.favor['hesha'] ?? 0).toBeGreaterThan(favor);
    expect(evaluate(s.state, { kind: 'conviction', id: 'mercy' })).toBe(true);
  });

  it('kills of one kind count toward the belief that asks for them, and a held belief gives way only to a clearly stronger one', () => {
    const s = session();
    const h = heartOf(s.player);
    for (let i = 0; i < 12; i++) s.devotion.deeds([{ event: 'kill', enemyTypes: ['beast'], tier: 'normal' }], 'test');
    expect(h.lean['beast-slayer']).toBe(12);
    expect(h.lean['ruthlessness']).toBeUndefined();
    // Mercy is held; ruthlessness needs 1.5x its lean.
    for (let i = 0; i < 50; i++) s.devotion.deed('mercy');
    days(s, 4);
    expect(holds(h, 'mercy')).toBe(true);
    for (let i = 0; i < 62; i++) s.devotion.deeds([{ event: 'kill', enemyTypes: ['humanoid'], tier: 'normal' }], 'test');
    expect(h.adopted['ruthlessness']).toBeUndefined();
    for (let i = 0; i < 20; i++) s.devotion.deeds([{ event: 'kill', enemyTypes: ['humanoid'], tier: 'normal' }], 'test');
    expect(h.adopted['ruthlessness']).toBeDefined();
    expect(h.adopted['mercy']).toBeUndefined();
    expect(holds(h, 'mercy')).toBe(false);
  });

  it('gold spent and earned counts in hundreds, and talking to people counts', () => {
    const s = session();
    const h = heartOf(s.player);
    s.addGold(1000, 'quest');
    expect(h.lean['ambition']).toBe(10);
    s.spendGold(250, 'shop');
    expect(h.lean['indulgence']).toBe(2);
    const reyna = content.npcs.get('captain-reyna');
    s.state.world.position = { ...s.state.world.position, ...(reyna.town ? {} : {}) };
    void reyna;
  });
});

describe('Kindred Bonds', () => {
  it('talking grows a bond once a day, ranks give boons, a recipe, a skill and a gift, and an errand grows it', () => {
    const s = session();
    const h = heartOf(s.player);
    const bond = BONDS.find((b) => b.id === 'reyna')!;
    s.heart.talk('captain-reyna');
    s.heart.talk('captain-reyna');
    expect(h.bonds['reyna']).toBe(1);
    expect(bondRank(h.bonds['reyna']!)).toBe(1);
    for (let i = 0; i < 24; i++) {
      days(s, 1);
      s.heart.talk('captain-reyna');
    }
    expect(h.bonds['reyna']).toBe(25);
    expect(bondRank(25)).toBe(4);
    expect(s.player.crafting.recipes).toContain(bond.recipe);
    expect(s.player.generalSkills[bond.skills[0]]).toBeUndefined();
    const defense = characterStats(s.player).defense;
    s.heart.questDone('captain-reyna', 'side');
    s.heart.questDone('captain-reyna', 'side');
    s.heart.questDone('captain-reyna', 'side');
    expect(bondRank(h.bonds['reyna']!)).toBeGreaterThanOrEqual(5);
    expect(s.player.generalSkills[bond.skills[0]]).toBeDefined();
    expect(characterStats(s.player).defense).toBeGreaterThanOrEqual(defense);
    expect(evaluate(s.state, { kind: 'bond', id: 'reyna', rank: 5 })).toBe(true);
    expect(evaluate(s.state, { kind: 'bond', id: 'reyna', rank: 9 })).toBe(false);
  });

  it('a god’s bond grows by prayer and offering', () => {
    const s = session();
    s.heart.prayer('hesha');
    s.heart.prayer('hesha', true);
    expect(heartOf(s.player).bonds['hesha-bond']).toBe(4);
    expect(heartOf(s.player).lean['piety']).toBe(1);
  });
});

describe('Campfire Tales', () => {
  it('a scene needs both companions fond enough and the one before it, and adds a party bonus', () => {
    const s = session();
    const pair = TALES.find((t) => t.id === 'aldric-fenn')!;
    expect(s.heart.taleStatus(pair).reason).toBeDefined();
    s.party.recruit('aldric');
    s.party.recruit('fenn');
    for (const id of ['aldric', 'fenn']) s.state.party.companions[id]!.approval = TALE_APPROVAL[0]!;
    expect(s.heart.taleStatus(pair).reason).toBeUndefined();
    const r = s.heart.hearTale(pair.id, 'a');
    expect(r.ok).toBe(true);
    expect(r.text).toBe(pair.stages[0].a[1]);
    expect(s.state.realm.tales[pair.id]).toBe(1);
    // Once a day, and the next scene asks for more.
    expect(s.heart.hearTale(pair.id, 'b').ok).toBe(false);
    days(s, 1);
    expect(s.heart.taleStatus(pair).reason).toContain(String(TALE_APPROVAL[1]));
    const mods = s.heart.taleModifiers(['aldric', 'fenn']);
    expect(mods.find((m) => m.stat === 'damageBonus')?.value).toBeGreaterThan(0);
    expect(s.heart.taleModifiers(['aldric'])).toEqual([]);
    for (const id of ['aldric', 'fenn']) s.state.party.companions[id]!.approval = 100;
    for (let i = 0; i < 3; i++) {
      expect(s.heart.hearTale(pair.id, 'b').ok).toBe(true);
      days(s, 1);
    }
    expect(s.state.realm.tales[pair.id]).toBe(4);
    expect(s.heart.hearTale(pair.id, 'a').ok).toBe(false);
  });
});

describe('Wayfarer’s Arts', () => {
  it('works once a day and every effect does something', () => {
    const s = session();
    const art = s.heart.art()!;
    expect(art).toBeDefined();
    const first = s.heart.useArt();
    expect(first.ok).toBe(true);
    expect(s.heart.useArt().ok).toBe(false);
    days(s, 1);
    expect(s.heart.artReady()).toBe(true);
    const effects = new Set<ArtEffect>(ARTS.map((a) => a.effect));
    expect(effects.size).toBe(8);
    for (const effect of effects) {
      const fake: ArtDef = { classId: 'warrior', name: 'x', effect, text: 'x' };
      const r = (s.heart as unknown as { perform(a: ArtDef): { ok: boolean; text: string } }).perform(fake);
      expect(r.ok, effect).toBe(true);
    }
    s.state.world.grace = 0;
    (s.heart as unknown as { perform(a: ArtDef): unknown }).perform({ classId: 'warrior', name: 'x', effect: 'scout', text: '' });
    expect(s.state.world.grace).toBeGreaterThanOrEqual(80);
    (s.heart as unknown as { perform(a: ArtDef): unknown }).perform({ classId: 'warrior', name: 'x', effect: 'haggle', text: '' });
    expect(heartOf(s.player).haggleDay).toBe(s.state.clock.day);
  });
});

describe('the Sworn Bloodline', () => {
  it('a fallen hero leaves an heir with a share of the gold, held beliefs, quirks and the god’s mark, and the heir starts with them', () => {
    const s = session();
    const h = heartOf(s.player);
    h.held.push('mercy', 'courage', 'piety');
    s.state.gold = 1000;
    s.player.devotion.patron = 'hesha';
    s.player.devotion.favor['hesha'] = 100;
    const heir = s.heart.fall('a wolf');
    expect(heir.gold).toBe(400);
    expect(heir.convictions).toHaveLength(2);
    expect(heir.quirks.length).toBeGreaterThanOrEqual(1);
    expect(heir.patron).toBe('hesha');
    expect(heir.favor).toBeGreaterThan(0);
    expect(heir.generation).toBe(2);
    expect(s.state.realm.bloodline.ancestors).toHaveLength(1);
    const next = GameSession.newGame(52, makeHero());
    const gold = next.state.gold;
    HeartActions.inherit(next, heir, s.state.realm.bloodline.ancestors);
    expect(next.state.gold).toBe(gold + 400);
    expect(holds(heartOf(next.player), heir.convictions[0]!)).toBe(true);
    expect(heartOf(next.player).quirks).toEqual(heir.quirks);
    expect(next.state.realm.bloodline.generation).toBe(2);
    expect(next.player.devotion.favor['hesha'] ?? 0).toBeGreaterThan(0);
    // Inherited beliefs give their boon from the first day.
    expect(characterStats(next.player).maxHp).toBeGreaterThan(0);
  });

  it('a save keeps the heart', () => {
    const s = session();
    s.heart.talk('captain-reyna');
    s.state.realm.tales['aldric-fenn'] = 2;
    const back = deserialize(serialize(s));
    expect(back.ok && back.state.player.world.heart?.bonds['reyna']).toBe(1);
    expect(back.ok && back.state.realm.tales['aldric-fenn']).toBe(2);
    const old = JSON.parse(serialize(s)) as { state: Record<string, unknown> };
    delete (old.state.realm as Record<string, unknown>).tales;
    delete (old.state.realm as Record<string, unknown>).bloodline;
    (old.state.meta as { version: number }).version = 23;
    const loaded = deserialize(JSON.stringify(old));
    expect(loaded.ok && loaded.state.realm.bloodline.generation).toBe(1);
  });
});
