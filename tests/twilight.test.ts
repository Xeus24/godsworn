import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { applyDamage } from '../src/engine/combat/hits';
import { createEncounterBattle } from '../src/engine/combat/setup';
import { startBattle } from '../src/engine/combat/turns';
import type { Combatant } from '../src/engine/combat/types';
import { rivalsOf } from '../src/engine/gods/devotion';
import { startNgPlus } from '../src/engine/ngplus/ngplus';
import { activeMarkers } from '../src/engine/quests/quests';
import { settleBattle } from '../src/engine/state/battleResults';
import type { Conversation } from '../src/engine/state/conversation';
import { GameSession } from '../src/engine/state/gameState';
import { townSpot } from '../src/engine/world/world';
import { makeHero } from './helpers';

function pick(conv: Conversation, text?: string): void {
  const choices = conv.view().choices;
  const i = text === undefined ? choices.findIndex((c) => c.enabled) : choices.findIndex((c) => c.enabled && c.label.includes(text));
  if (i < 0) throw new Error(`No choice "${text}" in: ${choices.map((c) => c.label).join(' | ')}`);
  conv.choose(i);
}
function finish(conv: Conversation): void {
  for (let n = 0; n < 30 && !conv.done; n++) {
    const v = conv.view();
    if (v.text === 'Anything else?') return pick(conv, 'Farewell');
    pick(conv);
  }
}
const marker = (s: GameSession, quest: string) => {
  const m = activeMarkers(s.state).find((x) => x.quest === quest);
  if (!m) throw new Error(`No marker for ${quest}`);
  return m;
};
function win(s: GameSession, encounter: string): void {
  const b = createEncounterBattle(s.player, content.encounters.get(encounter), { rng: s.rng });
  startBattle(b);
  const hero = b.combatants.find((x) => x.kind === 'hero') as Combatant;
  for (const x of b.alive('enemy')) applyDamage(b, hero, x, 9e9, { element: 'physical', crit: false });
  b.checkOutcome();
  settleBattle(s, b);
}
/** Uses a quest's marker: a fight is won, a talk is clicked through (taking `choose` where offered), a visit just happens. */
function step(s: GameSession, quest: string, choose?: string): void {
  const m = marker(s, quest);
  const r = s.quests.useMarker(m);
  if (r.kind === 'fight') return win(s, r.encounter.id);
  if (r.kind === 'talk') {
    const conv = s.quests.talkAtMarker(m) as Conversation;
    if (choose) {
      for (let n = 0; n < 10 && !conv.view().choices.some((c) => c.label.includes(choose)); n++) pick(conv);
      pick(conv, choose);
    }
    finish(conv);
  }
}
function talkTo(s: GameSession, npc: string, town: string, topic: string): void {
  s.state.world.position = townSpot(town);
  const conv = s.quests.talkTo(npc) as Conversation;
  pick(conv, topic);
  finish(conv);
}
const done = (s: GameSession, ...quests: string[]): void => {
  for (const q of quests) {
    s.state.quests.completed[q] = 1;
    delete s.state.quests.active[q];
  }
  s.quests.refresh();
};

function ngSession(): GameSession {
  const s = GameSession.newGame(21, makeHero());
  s.grantXp(5_000_000, true);
  s.quests.reachEnding('freeblade');
  startNgPlus(s);
  return s;
}

describe('Twilight of the Gods', () => {
  it('only begins in New Game+', () => {
    const s = GameSession.newGame(21, makeHero());
    expect(s.state.quests.active['twilight-1']).toBeUndefined();
    expect(ngSession().state.quests.active['twilight-1']).toBeDefined();
  });

  it('plays through: politics, the offer refused, the Nameless One, and the Twilight ending', () => {
    const s = ngSession();
    talkTo(s, 'lector-amara', 'brightwater', 'The Gods Fall Silent');
    step(s, 'twilight-1');
    step(s, 'twilight-1');
    talkTo(s, 'lector-amara', 'brightwater', 'The Gods Fall Silent');
    expect(s.state.quests.completed['twilight-1']).toBe(1);

    done(s, 'main-1', 'main-2', 'main-3');
    talkTo(s, 'loremaster-ivo', 'frosthold', 'Names in the Margins');
    step(s, 'twilight-2');
    talkTo(s, 'loremaster-ivo', 'frosthold', 'Names in the Margins');
    expect(s.state.quests.completed['twilight-2']).toBe(1);

    done(s, 'main-4', 'main-5');
    expect(rivalsOf(s.player, 'solenne')).toContain('morrath');
    step(s, 'twilight-3', 'Court of Dawn');
    expect(s.state.flags['twilight-court']).toBe('dawn');
    expect(rivalsOf(s.player, 'vex')).toContain('solenne');
    expect(s.state.quests.active['twilight-3']?.stage).toBe('dusk');
    step(s, 'twilight-3');
    step(s, 'twilight-3');
    expect(s.state.quests.completed['twilight-3']).toBe(1);

    done(s, 'main-6', 'main-7');
    step(s, 'twilight-4');
    step(s, 'twilight-4', 'No.');
    expect(s.state.flags['twilight-faithful']).toBe(true);
    expect(s.player.devotion.heresy).toBe(0);

    done(s, 'main-8', 'twilight-5a', 'twilight-5c');
    step(s, 'twilight-5');
    expect(s.state.quests.active['twilight-5']?.stage).toBe('nameless');
    step(s, 'twilight-5');
    step(s, 'twilight-5');
    expect(s.state.quests.ending?.id).toBe('twilight-dawn');
    expect(s.player.devotion.titles).toContain('Twilight-Bringer');
    expect(s.state.legacy.endings).toEqual(['freeblade', 'twilight-dawn']);
  });

  it('the heretic’s road: the offer accepted, the Last Light, the Unwritten Crown', () => {
    const s = ngSession();
    done(s, 'twilight-1', 'twilight-2', 'twilight-3', 'main-1', 'main-2', 'main-3', 'main-4', 'main-5', 'main-6', 'main-7');
    step(s, 'twilight-4');
    step(s, 'twilight-4', 'Write my name');
    expect(s.player.devotion.heresy).toBeGreaterThanOrEqual(40);
    expect(s.player.devotion.titles).toContain('Heretic');
    done(s, 'main-8', 'twilight-5a', 'twilight-5c');
    step(s, 'twilight-5');
    expect(s.state.quests.active['twilight-5']?.stage).toBe('light');
    step(s, 'twilight-5');
    step(s, 'twilight-5');
    expect(s.state.quests.ending?.id).toBe('twilight-unwritten');
  });

  it('peace ends every old feud', () => {
    const s = ngSession();
    s.player.allocated.wis = 40;
    done(s, 'twilight-1', 'twilight-2', 'main-1', 'main-2', 'main-3', 'main-4', 'main-5');
    step(s, 'twilight-3', 'End them');
    expect(s.state.flags['twilight-court']).toBe('peace');
    for (const g of content.gods.ids()) if (g !== 'nameless') expect(rivalsOf(s.player, g)).toEqual([]);
  });
});
