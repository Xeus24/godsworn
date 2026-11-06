import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { ADVENTURES, GUILD, RANKS, RIVALS, TANKARDS } from '../src/data/guild';
import { characterStats } from '../src/engine/character/stats';
import { GameSession } from '../src/engine/state/gameState';
import { taleTell } from '../src/ui/components/toasts';
import { makeHero } from './helpers';

const session = () => {
  const s = GameSession.newGame(91, makeHero());
  (s.world as any).inTown = () => 'brightwater';
  s.player.level = 30;
  s.addGold(200000, 'test');
  return s;
};

describe("Adventurers' Guild (226)", () => {
  it('has five ranks and five rival parties whose leaders exist', () => {
    expect(RANKS.map((r) => r.name)).toEqual(['Copper', 'Silver', 'Gold', 'Mithril', 'Star']);
    expect(RIVALS).toHaveLength(5);
    for (const r of RIVALS) expect(content.enemies.has(r.leader)).toBe(true);
  });

  it('posts a different board each day, and a held contract starts a fight', () => {
    const s = session();
    const a = s.guild.board('brightwater');
    expect(a.length).toBe(GUILD.slots);
    s.advanceTime(24 * 60);
    expect(s.guild.board('brightwater')[0]?.id).not.toBe(a[0]?.id);
    const c = s.guild.board('brightwater')[0]!;
    expect(s.guild.take(c.id).ok).toBe(true);
    expect(s.guild.take(c.id).ok).toBe(false);
    expect(s.guild.fight().ok).toBe(true);
  });

  it('party contracts wait for Gold rank and a companion', () => {
    const s = session();
    expect(s.guild.board('brightwater').every((c) => c.kind !== 'party')).toBe(true);
    s.guild.t.points = RANKS[2]!.points;
    const party = s.guild.board('brightwater').find((c) => c.kind === 'party')!;
    expect(party).toBeTruthy();
    s.guild.take(party.id);
    expect(s.guild.fight().ok).toBe(false);
  });

  it('rank grants perks, and rivals need Silver', () => {
    const s = session();
    expect(s.guild.challenge(RIVALS[0]!.id).ok).toBe(false);
    const bart = characterStats(s.player).barter;
    s.guild.t.points = RANKS[1]!.points;
    s.wonders.refresh();
    expect(characterStats(s.player).barter).toBeGreaterThan(bart);
    expect(s.guild.challenge(RIVALS[0]!.id).ok).toBe(true);
  });

  it('a won contract pays gold and points', () => {
    const s = session();
    const c = s.guild.board('brightwater')[0]!;
    s.guild.take(c.id);
    const gold = s.state.gold;
    (s.guild as any).fightEnded({ special: { module: 'guild', ref: `c:${c.id}` } }, true);
    expect(s.state.gold).toBe(gold + c.gold);
    expect(s.guild.t.points).toBe(c.points);
    expect(s.guild.board('brightwater').some((x) => x.id === c.id)).toBe(false);
  });
});

describe('Tales & Tankards (227)', () => {
  it('has five adventures of four scenes with three options each', () => {
    expect(ADVENTURES).toHaveLength(5);
    for (const a of ADVENTURES) {
      expect(a.scenes).toHaveLength(4);
      for (const sc of a.scenes) expect(sc.options).toHaveLength(3);
    }
  });

  it('plays through once a day, locks the next tale, and pays out', () => {
    const s = session();
    const second = ADVENTURES[1]!;
    expect(s.guild.sit(second.id, []).ok).toBe(false);
    const gold = s.state.gold;
    expect(s.guild.sit(ADVENTURES[0]!.id, ['dame-hob', 'pip-quill']).ok).toBe(true);
    expect(s.guild.sit(ADVENTURES[0]!.id, []).ok).toBe(false);
    for (let i = 0; i < 4; i++) expect(s.guild.choose(0).ok).toBe(true);
    expect(s.guild.t.tales.run).toBeUndefined();
    const best = s.guild.t.tales.best[ADVENTURES[0]!.id]!;
    expect(best).toBeGreaterThanOrEqual(0);
    if (best >= TANKARDS.passScenes) {
      expect(s.state.gold).toBeGreaterThan(gold);
      expect(s.guild.unlocked(second)).toBe(true);
    } else expect(s.state.gold).toBe(gold - s.guild.stake());
    expect(s.guild.playedToday(ADVENTURES[0]!.id)).toBe(true);
  });

  it('a cleared tale gives its lasting boon', () => {
    const s = session();
    const hp = characterStats(s.player).maxHp;
    s.guild.t.tales.best[ADVENTURES[0]!.id] = 3;
    s.wonders.refresh();
    expect(characterStats(s.player).maxHp).toBeGreaterThan(hp);
  });
});

describe('Tale-Teller narration (228)', () => {
  it('leaves toasts alone unless the setting is on', () => {
    expect(taleTell('info', 'You arrive.')).toBe('You arrive.');
  });
});
