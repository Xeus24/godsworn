import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { EPILOGUE_SLIDES } from '../src/data/story/epilogue';
import { epilogueSlides } from '../src/engine/quests/epilogue';
import { evaluate } from '../src/engine/quests/conditions';
import { GameSession } from '../src/engine/state/gameState';
import { DARKENED_GROUPS, randomEncounter } from '../src/engine/world/world';
import { makeHero } from './helpers';

const session = () => GameSession.newGame(4, makeHero());

describe('the story in acts', () => {
  const main = content.quests.filter((q) => q.kind === 'main');

  it('has a Prologue, five Acts and an Epilogue, with 45+ main quests', () => {
    expect(main.length).toBeGreaterThanOrEqual(45);
    for (const act of ['prologue', 'act1', 'act2', 'act3', 'act4', 'act5', 'epilogue'] as const) expect(main.some((q) => q.act === act), act).toBe(true);
    expect(main.filter((q) => q.act === 'prologue')).toHaveLength(3);
  });

  it('chains the road: each beat starts when the one before it is done, ending in the original finale', () => {
    const road = main.filter((q) => q.auto && q.requires?.kind === 'quest' && !q.id.startsWith('apostle-'));
    expect(road.length).toBeGreaterThanOrEqual(36);
    expect(content.quests.get('main-1').requires).toBeUndefined();
    expect(content.quests.get('main-8').requires).toEqual({ kind: 'quest', quest: 'a5-4', state: 'complete' });
    expect(content.quests.get('epi-1').requires).toEqual({ kind: 'quest', quest: 'main-8', state: 'complete' });
    for (const q of road) expect(content.quests.has((q.requires as { quest: string }).quest), q.id).toBe(true);
  });

  it('gives each of the fourteen gods an apostle chapter', () => {
    const gods = content.gods.all().filter((g) => !g.hidden);
    expect(gods).toHaveLength(14);
    for (const g of gods) {
      const q = content.quests.get(`apostle-${g.id}`);
      expect(q.requires).toMatchObject({ kind: 'all' });
      expect(q.stages.length).toBeGreaterThanOrEqual(4);
      expect(content.encounters.has(`q-charge-${g.id}`) || content.encounters.has(`q-herald-${g.id}`), g.id).toBe(true);
    }
  });

  it('has the new beats: a framing, a midpoint, an underworld, a flashback, a temptation and a Summit', () => {
    expect(content.quests.get('a2-3').name).toBe('The Chancellor’s Knife');
    expect(content.quests.get('a3-1').name).toBe('The Sundering Bell');
    expect(content.quests.get('a3-3').zone).toBe('hollow-barrows');
    expect(content.dialogues.get('d-a3-5-a').nodes.start?.speaker).toBe('narrator');
    expect(content.dialogues.get('d-a4-2-b').nodes.n1?.choices?.length).toBeGreaterThan(4);
    expect(content.dialogues.get('d-a4-5-b').nodes.n2?.choices?.map((c) => c.text).join()).toContain('Release');
  });
});

describe('endings and the epilogue', () => {
  it('has ten endings: the six that existed and four driven by flags', () => {
    const base = content.endings.all().filter((e) => !e.id.startsWith('twilight') && !['dawn', 'unwritten'].includes(e.id));
    expect(content.endings.all()).toHaveLength(10);
    for (const id of ['concord', 'quiet-sky', 'ferrykeeper', 'long-table']) expect(content.endings.has(id), id).toBe(true);
    expect(base.length).toBeGreaterThanOrEqual(8);
  });

  it('offers each new ending only when its flags are set', () => {
    const end = content.dialogues.get('d-main8-end').nodes.start!;
    const offered = (s: GameSession) => (end.choices ?? []).filter((c) => !c.cond || evaluate(s.state, c.cond)).flatMap((c) => c.actions ?? []).filter((a) => a.kind === 'ending').map((a) => (a as { ending: string }).ending);
    const s = session();
    expect(offered(s)).not.toContain('concord');
    s.state.flags.summit = 'reconcile';
    s.state.flags.path = 'redeemed';
    expect(offered(s)).toContain('concord');
    const t = session();
    t.state.flags.summit = 'sever';
    expect(offered(t)).toContain('quiet-sky');
    const u = session();
    u.state.flags['ferry-oar'] = 'taken';
    expect(offered(u)).toContain('ferrykeeper');
    const v = session();
    v.state.flags['temptation-faced'] = true;
    expect(offered(v)).not.toContain('long-table');
  });

  it('has 25+ flag-driven epilogue slides, and shows the ones that hold', () => {
    expect(EPILOGUE_SLIDES.length).toBeGreaterThanOrEqual(25);
    expect(EPILOGUE_SLIDES.filter((s) => s.cond).length).toBeGreaterThanOrEqual(25);
    expect(new Set(EPILOGUE_SLIDES.map((s) => s.id)).size).toBe(EPILOGUE_SLIDES.length);
    const s = session();
    const plain = epilogueSlides(s.state).map((x) => x.id);
    expect(plain).toContain('brightwater');
    expect(plain).not.toContain('seryth-redeemed');
    s.state.flags.path = 'redeemed';
    s.state.flags['mott-surrendered'] = true;
    s.state.flags.summit = 'sever';
    const more = epilogueSlides(s.state).map((x) => x.id);
    expect(more).toEqual(expect.arrayContaining(['seryth-redeemed', 'mott-spared', 'summit-sever']));
    expect(more).not.toContain('mott-fallen');
  });
});

describe('the world after the bell', () => {
  it('adds the Unsworn to every zone’s wandering packs', () => {
    const zone = content.zones.get('meadowlands');
    const s = session();
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++) for (const e of randomEncounter(zone, 'clear', false, 5, s.rng, true).enemies) seen.add(e.enemyId);
    for (const g of DARKENED_GROUPS) for (const e of g.enemies) expect(seen.has(e.enemyId), e.enemyId).toBe(true);
    const calm = new Set<string>();
    for (let i = 0; i < 300; i++) for (const e of randomEncounter(zone, 'clear', false, 5, s.rng, false).enemies) calm.add(e.enemyId);
    expect(calm.has('void-wraith')).toBe(false);
  });

  it('resolves NPC fates: some are gone and others take their place', () => {
    const s = session();
    s.state.clock.minute = 12 * 60;
    const before = s.quests.townNpcs('aurelane').map((n) => n.id);
    expect(before).toContain('lord-maximilian');
    expect(before).not.toContain('cassia-veyne');
    s.state.flags['world-darkened'] = true;
    const after = s.quests.townNpcs('aurelane').map((n) => n.id);
    expect(after).not.toContain('lord-maximilian');
    expect(after).toContain('cassia-veyne');
    expect(after).toContain('regent-pell');
  });
});
