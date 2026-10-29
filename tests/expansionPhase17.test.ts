import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { BANTER } from '../src/data/story/banter';
import { LOYALTY_APPROVAL, activeBonds } from '../src/engine/party/party';
import { SCENE_APPROVAL } from '../src/engine/state/partyActions';
import { GameSession } from '../src/engine/state/gameState';
import { migrate } from '../src/engine/state/save';
import { makeHero } from './helpers';

const session = () => GameSession.newGame(4, makeHero());
const all = () => content.companions.all();

describe('fourteen companions', () => {
  it('has 14, each with a god, a town, a loyalty skill, a leave condition and a five-quest line', () => {
    expect(all()).toHaveLength(14);
    for (const c of all()) {
      expect(content.towns.has(c.town), c.id).toBe(true);
      expect(content.gods.has(c.god), c.id).toBe(true);
      expect(c.loyalty.triggers?.length, c.id).toBeGreaterThan(0);
      expect(c.leaves.text.length, c.id).toBeGreaterThan(20);
      expect(c.line, c.id).toHaveLength(5);
      for (const q of c.line) expect(content.quests.has(q), `${c.id}:${q}`).toBe(true);
      expect(c.bond, c.id).toHaveLength(4);
    }
  });

  it('has 30+ banter lines each, opening up with approval', () => {
    for (const c of all()) {
      const lines = BANTER[c.id] ?? [];
      expect(lines.length, c.id).toBeGreaterThanOrEqual(30);
      expect(lines.some((l) => l.min === 0), c.id).toBe(true);
      expect(lines.some((l) => l.min >= 75), c.id).toBe(true);
      expect(new Set(lines.map((l) => l.text)).size, c.id).toBe(lines.length);
    }
  });

  it('each personal line runs recruit, three steps, oath, and the oath grants the oath perk', () => {
    for (const c of all()) {
      expect(c.line[0]).toBe(c.recruitQuest);
      expect(c.line[4]).toBe(c.personalQuest);
      const oath = content.quests.get(c.personalQuest);
      expect(JSON.stringify(oath.stages)).toContain('"oath"');
    }
  });

  it('six companions have friendship or romance scenes, three each', () => {
    const rom = all().filter((c) => c.romance);
    expect(rom).toHaveLength(6);
    for (const c of rom) for (let i = 1; i <= 3; i++) expect(content.dialogues.has(`d-scene-${c.id}-${i}`), `${c.id} ${i}`).toBe(true);
  });
});

describe('the camp', () => {
  const recruit = (s: GameSession, id: string, approval = 30) => {
    s.party.recruit(id);
    (s.state.party.companions[id] as { approval: number }).approval = approval;
  };

  it('a chat by the fire gives a line of banter and a little warmth, once a day', () => {
    const s = session();
    recruit(s, 'fenn', 10);
    const r = s.party.campTalk('fenn');
    expect(r.ok).toBe(true);
    expect((r as { line?: string }).line?.length).toBeGreaterThan(10);
    expect(s.state.party.companions.fenn!.approval).toBeGreaterThan(10);
    expect(s.party.campTalk('fenn').ok).toBe(false);
    s.state.clock.day += 1;
    expect(s.party.campTalk('fenn').ok).toBe(true);
  });

  it('banter goes through the lines in order and unlocks more as approval grows', () => {
    const s = session();
    recruit(s, 'sable', 0);
    const first = (s.party.campTalk('sable') as { line?: string }).line;
    s.state.clock.day += 1;
    const second = (s.party.campTalk('sable') as { line?: string }).line;
    expect(first).not.toBe(second);
  });

  it('scenes open at 45, 65 and 85 approval and end by counting', () => {
    expect(SCENE_APPROVAL).toEqual([45, 65, 85]);
    const s = session();
    recruit(s, 'sable', 30);
    expect(s.party.sceneBlocked('sable')).toContain('45');
    s.state.party.companions.sable!.approval = 50;
    expect(s.party.sceneBlocked('sable')).toBeUndefined();
    const conv = s.party.campScene('sable')!;
    expect(conv).toBeDefined();
    conv.choose(1);
    while (!conv.done) conv.choose(0);
    expect(s.state.party.companions.sable!.scenes).toBe(1);
    expect(s.state.flags['romance-sable']).toBe('romance');
    expect(s.party.sceneBlocked('sable')).toContain('65');
    recruit(s, 'aldric', 90);
    expect(s.party.sceneBlocked('aldric')).toContain('no evenings');
  });

  it('loyalty works only while they are devoted', () => {
    const s = session();
    recruit(s, 'korga', 40);
    const comp = s.state.party.companions.korga!;
    const def = content.companions.get('korga');
    expect(activeBonds(def, comp).some((n) => n.id === 'korga-loyalty')).toBe(false);
    comp.approval = LOYALTY_APPROVAL;
    expect(activeBonds(def, comp).some((n) => n.id === 'korga-loyalty')).toBe(true);
  });

  it('a companion walks out when their line is crossed', () => {
    const s = session();
    recruit(s, 'ilyra', 20);
    s.state.flags['shard-destroyed'] = true;
    s.party.checkLeaves();
    expect(s.state.party.companions.ilyra!.left).toBe(true);
    recruit(s, 'sable', 20);
    s.state.flags.summit = 'obey';
    s.party.checkLeaves();
    expect(s.state.party.companions.sable!.left).toBe(true);
    recruit(s, 'aldric', 60);
    s.state.flags.summit = 'sever';
    s.party.checkLeaves();
    expect(s.state.party.companions.aldric!.left).toBe(true);
  });

  it('a devoted companion stays', () => {
    const s = session();
    recruit(s, 'ilyra', 70);
    s.state.flags['shard-destroyed'] = true;
    s.party.checkLeaves();
    expect(s.state.party.companions.ilyra!.left).toBe(false);
  });
});

describe('saves', () => {
  it('migrates older saves: camp fields start at zero', () => {
    const s = session();
    s.party.recruit('fenn');
    const raw = JSON.parse(JSON.stringify(s.state)) as { party: { companions: Record<string, Record<string, unknown>> }; meta: { version: number } };
    for (const k of ['scenes', 'lastTalk', 'banter']) delete raw.party.companions.fenn![k];
    raw.meta.version = 18;
    const out = migrate(raw as never) as unknown as { party: { companions: Record<string, { scenes: number; lastTalk: number; banter: number }> } };
    expect(out.party.companions.fenn).toMatchObject({ scenes: 0, lastTalk: -1, banter: 0 });
  });
});

describe('the new companions fight', () => {
  it('each of the eight joins a benchmark hero in a battle at their level and takes part', async () => {
    const { benchmarkHero } = await import('../src/engine/combat/simulateHelpers');
    const { createEncounterBattle, runAutoBattle } = await import('../src/engine/combat/setup');
    const { companionExtras, createCompanion } = await import('../src/engine/party/party');
    const { Rng } = await import('../src/engine/core/rng');
    const { groupEncounter } = await import('../src/engine/world/world');
    let uid = 0;
    for (const id of ['edrin', 'thistle', 'thorne', 'hrafna', 'bexley', 'zeph', 'kessa', 'tick']) {
      const def = content.companions.get(id);
      const lvl = content.quests.get(def.recruitQuest).level;
      const state = createCompanion(def, lvl, () => `u${++uid}`);
      const enc = groupEncounter({ weight: 1, enemies: [{ enemyId: 'goblin-cutthroat' }, { enemyId: 'goblin-cutthroat' }] }, 'sim', 'sim', lvl);
      const b = createEncounterBattle(benchmarkHero('warrior', lvl), enc, { rng: new Rng(3), level: lvl, companions: [{ char: state.character, extras: companionExtras(def, state) }] });
      runAutoBattle(b);
      expect(b.outcome, id).toBe('victory');
    }
  });
});
