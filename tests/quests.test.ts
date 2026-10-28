import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { PARTY_SCALING } from '../src/data/combat';
import { characterStats } from '../src/engine/character/stats';
import type { Character } from '../src/engine/character/types';
import { applyDamage } from '../src/engine/combat/hits';
import { createEncounterBattle } from '../src/engine/combat/setup';
import { applyStatus, tickStatusesAtTurnStart } from '../src/engine/combat/statuses';
import { startBattle } from '../src/engine/combat/turns';
import type { Combatant } from '../src/engine/combat/types';
import { createItem } from '../src/engine/items/generate';
import { addItem, countHeld, countOf } from '../src/engine/items/inventory';
import { evaluate } from '../src/engine/quests/conditions';
import { activeMarkers, isAvailable, questGold, questXp } from '../src/engine/quests/quests';
import { resolveSpot } from '../src/engine/quests/spots';
import type { QuestMarker } from '../src/engine/quests/quests';
import type { Spot } from '../src/engine/quests/types';
import { settleBattle } from '../src/engine/state/battleResults';
import type { Conversation } from '../src/engine/state/conversation';
import { GameSession, SAVE_VERSION } from '../src/engine/state/gameState';
import { mapFor } from '../src/engine/world/mapgen';
import { tileAt, townSpot } from '../src/engine/world/world';
import { makeHero } from './helpers';

const newSession = (seed = 7) => GameSession.newGame(seed, makeHero());

function inTown(s: GameSession, town: string): void {
  s.state.world.position = townSpot(town);
}

/** Picks the first enabled choice whose label contains `text` (or the only/first one). */
function pick(conv: Conversation, text?: string): void {
  const choices = conv.view().choices;
  const i = text === undefined ? choices.findIndex((c) => c.enabled) : choices.findIndex((c) => c.enabled && c.label.includes(text));
  if (i < 0) throw new Error(`No choice "${text}" in: ${choices.map((c) => c.label).join(' | ')}`);
  conv.choose(i);
}

/** Clicks through to the end, taking the first enabled choice each time. */
function finish(conv: Conversation, guard = 30): void {
  for (let n = 0; n < guard && !conv.done; n++) {
    const labels = conv.view().choices.map((c) => c.label);
    // Back at the topic list: leave.
    if (labels.includes('Farewell.') && labels.length >= 1 && conv.view().text === 'Anything else?') return pick(conv, 'Farewell');
    pick(conv);
  }
}

function markerOf(s: GameSession, quest: string): QuestMarker {
  const m = activeMarkers(s.state).find((x) => x.quest === quest);
  if (!m) throw new Error(`No marker for ${quest}`);
  return m;
}

/** A battle against an encounter, won (or lost) at once. */
function battleOf(s: GameSession, encounter: string, win = true, companions = s.party.battleMembers(), guests = s.quests.guests()) {
  const b = createEncounterBattle(s.player, content.encounters.get(encounter), { rng: s.rng, companions, guests });
  startBattle(b);
  const hero = b.combatants.find((x) => x.kind === 'hero') as Combatant;
  for (const x of b.alive(win ? 'enemy' : 'party')) applyDamage(b, hero, x, 9999999, { element: 'physical', crit: false });
  b.checkOutcome();
  return b;
}

describe('quest content', () => {
  it('every quest marker lands on open, reachable ground on its map', () => {
    const spots: [Spot, string][] = [];
    for (const q of content.quests.all()) {
      for (const st of q.stages) {
        for (const o of st.objectives) {
          if ((o.kind === 'talk' || o.kind === 'visit' || o.kind === 'fight') && o.at) spots.push([o.at, `${q.id}/${o.id}`]);
          if (o.kind === 'escort') spots.push([o.to, `${q.id}/${o.id}`]);
          if (o.kind === 'sequence') o.stones.forEach((st2, i) => spots.push([st2, `${q.id}/${o.id}/${i}`]));
        }
      }
    }
    expect(spots.length).toBeGreaterThan(80);
    for (const [spot, salt] of spots) {
      const pos = resolveSpot(spot, spot.key ?? salt);
      const map = mapFor(pos.map);
      expect(['.', '=', '_'], `${salt} on ${tileAt(map, pos.x, pos.y)}`).toContain(tileAt(map, pos.x, pos.y));
      // Reachable from where you arrive (sealed doors count as open: rune puzzles are solvable).
      const start = map.spawns.west ?? map.spawns.entrance;
      const seen = new Set([start[1] * map.w + start[0]]);
      const q = [start];
      while (q.length) {
        const [x, y] = q.pop() as [number, number];
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const k = (y + dy) * map.w + x + dx;
          if (seen.has(k) || !['.', '=', '_', 'X', 'D'].includes(tileAt(map, x + dx, y + dy))) continue;
          seen.add(k);
          q.push([x + dx, y + dy]);
        }
      }
      expect(seen.has(pos.y * map.w + pos.x), `${salt} unreachable`).toBe(true);
    }
  });

  it('has the quest counts the spec asks for', () => {
    const kinds = (k: string) => content.quests.filter((q) => q.kind === k).length;
    expect(kinds('main')).toBe(8);
    expect(kinds('side')).toBeGreaterThanOrEqual(30);
    expect(kinds('god')).toBe(40);
    expect(kinds('class')).toBe(48);
    expect(kinds('hybrid')).toBe(content.hybrids.all().length);
    expect(kinds('faction')).toBe(15);
    expect(kinds('companion')).toBe(11);
    expect(content.endings.all().length).toBeGreaterThanOrEqual(3);
    // Every objective type appears somewhere.
    const used = new Set(content.quests.all().flatMap((q) => q.stages.flatMap((st) => st.objectives.map((o) => o.kind))));
    for (const k of ['kill', 'collect', 'deliver', 'talk', 'visit', 'fight', 'escort', 'clear', 'runes', 'sequence', 'deed', 'state']) expect(used, k).toContain(k);
    expect(content.quests.all().some((q) => q.stages.some((st) => st.hours))).toBe(true);
  });
});

describe('quest flow', () => {
  it('the story starts on its own and is tracked', () => {
    const s = newSession();
    expect(s.state.quests.active['main-1']).toBeDefined();
    expect(s.state.quests.tracked).toBe('main-1');
    expect(SAVE_VERSION).toBe(18);
  });

  it('talking, markers, a branch on mercy and a recruit carry chapter one through', () => {
    const s = newSession();
    inTown(s, 'brightwater');
    const conv = s.quests.talkTo('aldric') as Conversation;
    expect(conv.view().choices.some((c) => c.label === 'The Silent Shrine' && c.mark === '?')).toBe(true);
    pick(conv, 'The Silent Shrine');
    finish(conv);
    expect(s.state.quests.active['main-1']?.stage).toBe('shrine');

    // The shrine: a field marker that hands over the sigil.
    const shrine = markerOf(s, 'main-1');
    const talk = s.quests.useMarker(shrine);
    expect(talk.kind).toBe('talk');
    finish(s.quests.talkAtMarker(shrine) as Conversation);
    expect(countOf(s.state.inventory, 'unsworn-sigil')).toBe(1);
    expect(s.state.quests.active['main-1']?.stage).toBe('zealots');

    // The zealot camp: a marker fight.
    const camp = markerOf(s, 'main-1');
    const r = s.quests.useMarker(camp);
    expect(r.kind).toBe('fight');
    settleBattle(s, battleOf(s, 'q-zealots'));
    expect(s.state.quests.active['main-1']?.stage).toBe('mott');

    // Mott: a wise hero talks him down, skipping the fight.
    s.player.allocated.wis = 20;
    const mott = s.quests.talkAtMarker(markerOf(s, 'main-1')) as Conversation;
    pick(mott);
    pick(mott, 'WIS 12');
    finish(mott);
    expect(s.state.flags['mott-surrendered']).toBe(true);
    expect(s.state.flags.mercy).toBe(1);
    expect(s.state.quests.active['main-1']?.stage).toBe('report');

    // Report: Aldric joins.
    const report = s.quests.talkTo('aldric') as Conversation;
    pick(report, 'The Silent Shrine');
    pick(report, 'gave himself up');
    finish(report);
    expect(s.state.quests.completed['main-1']).toBe(1);
    expect(s.state.party.companions.aldric?.inParty).toBe(true);
    // Chapter two begins by itself.
    expect(s.state.quests.active['main-2']).toBeDefined();
  });

  it('a dialogue fight that is lost leaves a marker to try again', () => {
    const s = newSession();
    s.state.quests.active['main-1'] = { stage: 'mott', progress: {}, stageStarted: 0 };
    const mott = s.quests.talkAtMarker(markerOf(s, 'main-1')) as Conversation;
    pick(mott);
    pick(mott, 'Enough talk');
    pick(mott);
    expect(mott.done).toBe(true);
    expect(mott.outcome.fight).toBe('q-mott');
    expect(s.state.quests.active['main-1']?.stage).toBe('mottfight');
    settleBattle(s, battleOf(s, 'q-mott', false));
    expect(markerOf(s, 'main-1').kind).toBe('fight');
    settleBattle(s, battleOf(s, 'q-mott', true));
    expect(s.state.quests.active['main-1']?.stage).toBe('report');
  });

  it('kill objectives count matching kills; collect counts carried items and takes them at hand-in', () => {
    const s = newSession();
    inTown(s, 'brightwater');
    expect(s.quests.start('side-rats').ok).toBe(true);
    for (let i = 0; i < 6; i++) s.bus.emit('enemyKilled', { enemyId: i < 5 ? 'giant-rat' : 'green-slime', tier: 'normal' });
    expect(s.state.quests.active['side-rats']?.progress.k).toBe(5);
    s.bus.emit('enemyKilled', { enemyId: 'giant-rat', tier: 'normal' });
    expect(s.quests.npcMark('marta')).toBe('?');
    const gold = s.state.gold;
    const conv = s.quests.talkTo('marta') as Conversation;
    pick(conv, 'Report');
    finish(conv);
    expect(s.state.quests.completed['side-rats']).toBe(1);
    expect(s.state.gold).toBe(gold + questGold(content.quests.get('side-rats')));

    expect(s.quests.start('side-healroot').ok).toBe(true);
    addItem(s.state.inventory, createItem('healroot', 7, () => s.newUid()));
    const wenna = s.quests.talkTo('sister-wenna') as Conversation;
    pick(wenna, 'Report');
    finish(wenna);
    expect(countOf(s.state.inventory, 'healroot')).toBe(2);
    expect(s.player.devotion.favor.hesha).toBeGreaterThan(0);
  });

  it('collect objectives count the stash, and turning in spends from it', () => {
    const s = newSession();
    expect(s.quests.start('side-healroot').ok).toBe(true);
    s.state.stash.tabs[0]!.slots[0] = createItem('healroot', 7, () => s.newUid());
    const wenna = s.quests.talkTo('sister-wenna') as Conversation;
    pick(wenna, 'Report');
    finish(wenna);
    expect(s.state.quests.completed['side-healroot']).toBe(1);
    expect(countHeld(s.state, 'healroot')).toBe(2);
  });

  it('deliveries hand over items to the NPC; quest items cannot be sold or destroyed', () => {
    const s = newSession();
    inTown(s, 'brightwater');
    s.quests.start('side-letter');
    expect(countOf(s.state.inventory, 'letter-thornwick')).toBe(1);
    const idx = s.state.inventory.slots.findIndex((x) => x?.baseId === 'letter-thornwick');
    expect(s.economy.sell(idx).ok).toBe(false);
    expect(s.items.destroy({ where: 'inventory', index: idx }).ok).toBe(false);
    inTown(s, 'thornwick');
    const pell = s.quests.talkTo('old-pell') as Conversation;
    pick(pell, 'Hand over');
    finish(pell);
    expect(countOf(s.state.inventory, 'letter-thornwick')).toBe(0);
    expect(s.state.quests.completed['side-letter']).toBe(1);
  });

  it('timed stages fail when the clock runs out, and the quest can be taken again', () => {
    const s = newSession();
    s.quests.start('side-goat');
    s.state.quests.completed['side-goat'] = 1;
    delete s.state.quests.active['side-goat'];
    s.quests.start('side-scarecrows');
    s.advanceTime(49 * 60);
    expect(s.state.quests.active['side-scarecrows']).toBeUndefined();
    expect(s.state.quests.failed).toContain('side-scarecrows');
    expect(isAvailable(s.state, content.quests.get('side-scarecrows'))).toBe(true);
  });

  it('an escort fights beside you; if they fall, the quest fails', () => {
    const s = newSession();
    s.player.level = 10;
    s.quests.start('side-herbalist');
    expect(s.quests.guests()).toHaveLength(1);
    const b = createEncounterBattle(s.player, content.encounters.get('slime-puddle'), { rng: s.rng, guests: s.quests.guests() });
    startBattle(b);
    const guest = b.combatants.find((x) => x.id.startsWith('guest:')) as Combatant;
    expect(guest.side).toBe('party');
    const hero = b.combatants.find((x) => x.kind === 'hero') as Combatant;
    applyDamage(b, hero, guest, 9999999, { element: 'physical', crit: false });
    for (const x of b.alive('enemy')) applyDamage(b, hero, x, 9999999, { element: 'physical', crit: false });
    b.checkOutcome();
    settleBattle(s, b);
    expect(s.state.quests.active['side-herbalist']).toBeUndefined();
    expect(s.state.quests.failed).toContain('side-herbalist');

    // Taken again and walked safely: reaching the grove completes it.
    s.quests.start('side-herbalist');
    const r = s.quests.useMarker(markerOf(s, 'side-herbalist'));
    expect(r.kind).toBe('moved');
    expect(s.state.quests.completed['side-herbalist']).toBe(1);
  });

  it('the standing stones must be touched in order; a wrong stone starts over', () => {
    const s = newSession();
    s.quests.start('side-stones');
    const stones = activeMarkers(s.state).filter((m) => m.quest === 'side-stones').sort((a, b) => (a.stone ?? 0) - (b.stone ?? 0));
    expect(stones).toHaveLength(3);
    s.quests.useMarker(stones[2] as QuestMarker);
    s.quests.useMarker(stones[0] as QuestMarker);
    expect(s.state.quests.active['side-stones']?.progress.s).toBe(0);
    for (const i of [2, 1, 0]) s.quests.useMarker(stones[i] as QuestMarker);
    expect(s.quests.npcMark('bran-carver')).toBe('?');
  });

  it('defend waves need several victories inside the time limit', () => {
    const s = newSession();
    s.quests.start('side-siege');
    settleBattle(s, battleOf(s, 'q-wolves-gate'));
    expect(s.state.quests.active['side-siege']?.progress.f).toBe(1);
    settleBattle(s, battleOf(s, 'q-wolves-gate'));
    settleBattle(s, battleOf(s, 'q-wolves-gate'));
    expect(s.state.quests.completed['side-siege']).toBe(1);
  });

  it('bounties return the next day', () => {
    const s = newSession();
    const id = content.quests.filter((q) => q.kind === 'bounty' && q.board === 'brightwater')[0]?.id as string;
    expect(s.quests.board('brightwater').some((q) => q.id === id)).toBe(true);
    s.quests.start(id);
    const o = content.quests.get(id).stages[0]?.objectives[0];
    if (o?.kind !== 'kill') throw new Error('bounty is not a kill');
    s.state.world.position = townSpot('brightwater');
    for (let i = 0; i < o.count; i++) s.bus.emit('enemyKilled', { enemyId: o.enemyId as string, tier: 'normal' });
    expect(s.state.quests.completed[id]).toBe(1);
    expect(isAvailable(s.state, content.quests.get(id))).toBe(false);
    s.advanceTime(24 * 60);
    expect(isAvailable(s.state, content.quests.get(id))).toBe(true);
  });

  it('rewards scale with the quest level', () => {
    const q = content.quests.get('main-8');
    expect(questXp(q)).toBeGreaterThan(questXp(content.quests.get('main-1')));
    expect(questGold(q)).toBe(40 * 58);
  });
});

describe('dialogue', () => {
  it('locked choices show their requirement and cannot be picked', () => {
    const s = newSession();
    s.state.quests.active['main-1'] = { stage: 'mott', progress: {}, stageStarted: 0 };
    const conv = s.quests.talkAtMarker(markerOf(s, 'main-1')) as Conversation;
    pick(conv);
    const wis = conv.view().choices.find((c) => c.label.includes('WIS 12'));
    expect(wis?.enabled).toBe(false);
    expect(wis?.requirement).toBe('WIS 12');
    const before = conv.view().text;
    conv.choose(conv.view().choices.indexOf(wis as never));
    expect(conv.view().text).toBe(before);
  });

  it('quest offers are accepted from the topic list', () => {
    const s = newSession();
    inTown(s, 'brightwater');
    expect(s.quests.npcMark('captain-reyna')).toBe('!');
    const conv = s.quests.talkTo('captain-reyna') as Conversation;
    pick(conv, 'The Goblin Tax');
    pick(conv, 'Accept');
    expect(s.state.quests.active['side-goblin-tax']).toBeDefined();
    expect(conv.view().text).toBe('Anything else?');
  });

  it('you can only speak to people where they are', () => {
    const s = newSession();
    s.state.world.position = { map: 'meadowlands', x: 2, y: 2 };
    expect(s.quests.talkTo('marta')).toBeUndefined();
    inTown(s, 'thornwick');
    expect(s.quests.talkTo('marta')).toBeUndefined();
    expect(s.quests.talkTo('mentor-warrior')).toBeDefined();
  });

  it('conditions read the whole state', () => {
    const s = newSession();
    expect(evaluate(s.state, { kind: 'all', conds: [{ kind: 'level', min: 1 }, { kind: 'not', cond: { kind: 'apostle' } }] })).toBe(true);
    s.setFlag('mercy', 2);
    expect(evaluate(s.state, { kind: 'counter', flag: 'mercy', min: 2 })).toBe(true);
    expect(evaluate(s.state, { kind: 'quest', quest: 'main-1', state: 'active', stage: 'aldric' })).toBe(true);
  });
});

describe('trials and the ending', () => {
  it('class trials open in the arena only once their quest reaches the trial', () => {
    const s = newSession();
    s.player.level = 15;
    expect(s.quests.trialOpen('trial-mage')).toBe(false);
    s.quests.start('class-mage');
    expect(s.quests.trialOpen('trial-mage')).toBe(false);
    s.devotion.deed('bookRead');
    inTown(s, 'brightwater');
    const conv = s.quests.talkTo('mentor-mage') as Conversation;
    pick(conv, 'Report');
    finish(conv);
    expect(s.quests.trialOpen('trial-mage')).toBe(true);
    s.player.trialsWon.push('trial-mage');
    s.quests.refresh();
    expect(s.state.quests.completed['class-mage']).toBe(1);
  });

  it('the apostle trial quest starts by itself at Exalted', () => {
    const s = newSession();
    s.devotion.apply({ kael: 900 }, 'test', true);
    expect(s.state.quests.active['god-kael-trial']).toBeDefined();
  });

  it('the ending is recorded with its title', () => {
    const s = newSession();
    s.quests.runActions([{ kind: 'ending', ending: 'freeblade' }]);
    expect(s.state.quests.ending?.id).toBe('freeblade');
    expect(s.state.flags.storyComplete).toBe(true);
    expect(s.player.devotion.titles).toContain('Free Blade');
  });
});

describe('companions', () => {
  it('join at your level with gear and spent points, and fight beside you', () => {
    const s = newSession();
    s.grantXp(20000, true);
    s.party.recruit('korga');
    const korga = s.state.party.companions.korga;
    expect(korga?.character.level).toBe(s.player.level);
    expect(korga?.character.attributePoints).toBe(0);
    expect(korga?.character.equipment.mainHand).toBeDefined();
    const b = createEncounterBattle(s.player, content.encounters.get('slime-puddle'), { rng: s.rng, companions: s.party.battleMembers() });
    const x = b.combatants.find((c) => c.id === 'companion:korga');
    expect(x?.kind).toBe('companion');
    expect(b.isPlayerControlled(x as Combatant)).toBe(true);
  });

  it('fight at their class’s companion power, with its extra stats', () => {
    const s = newSession();
    s.grantXp(20000, true);
    s.party.recruit('korga');
    const b = createEncounterBattle(s.player, content.encounters.get('slime-puddle'), { rng: s.rng, companions: s.party.battleMembers() });
    const x = b.combatants.find((c) => c.id === 'companion:korga') as Combatant;
    const mods = x.statInput.modifiers.filter((m) => m.source === 'companion');
    expect(mods).toContainEqual({ stat: 'physicalAttack', type: 'more', value: PARTY_SCALING.companionPower.warrior, source: 'companion' });
    for (const m of PARTY_SCALING.companionStats.warrior ?? []) expect(mods).toContainEqual({ ...m, source: 'companion' });
  });

  it('carry HP in and out of battle as a share of their maximum', () => {
    const s = newSession();
    s.party.recruit('korga');
    const korga = s.state.party.companions.korga?.character as Character;
    const own = characterStats(korga).maxHp;
    const battle = () => createEncounterBattle(s.player, content.encounters.get('slime-puddle'), { rng: s.rng, companions: s.party.battleMembers() });
    let b = battle();
    let x = b.combatants.find((c) => c.id === 'companion:korga') as Combatant;
    expect(x.maxHp).toBeGreaterThan(own);
    expect(x.hp).toBe(x.maxHp);
    x.hp = Math.round(x.maxHp / 2);
    s.party.afterBattle(b);
    expect(Math.abs(korga.hp - own / 2)).toBeLessThanOrEqual(1);
    b = battle();
    x = b.combatants.find((c) => c.id === 'companion:korga') as Combatant;
    expect(Math.abs(x.hp - x.maxHp / 2)).toBeLessThanOrEqual(1);
  });

  it('make enemies tougher, but not faster to regenerate', () => {
    const s = newSession();
    s.party.recruit('korga');
    const regenOf = (companions: ReturnType<typeof s.party.battleMembers>): { heal: number; maxHp: number } => {
      const b = createEncounterBattle(s.player, content.encounters.get('slime-puddle'), { rng: s.rng, companions });
      const enemy = b.combatants.find((c) => c.side === 'enemy') as Combatant;
      enemy.hp = 1;
      applyStatus(b, enemy, enemy, 'regen', { duration: 3 });
      tickStatusesAtTurnStart(b, enemy);
      return { heal: enemy.hp - 1, maxHp: enemy.maxHp };
    };
    const solo = regenOf([]);
    const party = regenOf(s.party.battleMembers());
    expect(party.maxHp).toBeGreaterThan(solo.maxHp * 2);
    expect(Math.abs(party.heal - solo.heal)).toBeLessThanOrEqual(1);
  });

  it('level up alongside you', () => {
    const s = newSession();
    s.party.recruit('aldric');
    const before = s.state.party.companions.aldric?.character.level ?? 0;
    s.grantXp(5000, true);
    expect(s.state.party.companions.aldric?.character.level).toBeGreaterThan(before);
  });

  it('approval moves with deeds and favor; bond perks open with it; too low and they leave', () => {
    const s = newSession();
    s.party.recruit('aldric');
    const a = () => s.state.party.companions.aldric?.approval ?? 0;
    const start = a();
    s.devotion.deeds([{ event: 'mercy' }], 'test');
    expect(a()).toBeGreaterThan(start);
    const mid = a();
    s.devotion.apply({ morrath: 100 }, 'test', true);
    expect(a()).toBeLessThan(mid);
    // Bond tiers open at their approval.
    expect(s.party.chooseBond('aldric', 'aldric-ward').ok).toBe(false);
    expect(s.party.chooseBond('aldric', 'aldric-steady').ok).toBe(true);
    expect(s.party.chooseBond('aldric', 'aldric-sunlit').ok).toBe(false);
    s.party.adjust('aldric', 200);
    expect(s.party.chooseBond('aldric', 'aldric-ward').ok).toBe(true);
    const b = createEncounterBattle(s.player, content.encounters.get('slime-puddle'), { rng: s.rng, companions: s.party.battleMembers() });
    const x = b.combatants.find((c) => c.id === 'companion:aldric') as Combatant;
    expect(x.triggers.some((t) => t.source === 'bond:aldric-ward')).toBe(true);
    s.party.adjust('aldric', -200);
    expect(s.state.party.companions.aldric?.left).toBe(true);
    expect(s.party.members()).toHaveLength(0);
    // Won back in their town.
    inTown(s, 'brightwater');
    s.state.gold = 10000;
    expect(s.party.makeAmends('aldric').ok).toBe(true);
    expect(s.party.members()).toHaveLength(1);
  });

  it('only three fight beside you; HP carries over and the fallen get up after a win', () => {
    const s = newSession();
    for (const id of ['aldric', 'fenn', 'korga', 'ilyra']) s.party.recruit(id);
    expect(s.party.members()).toHaveLength(3);
    expect(s.party.setInParty('ilyra', true).ok).toBe(false);
    const b = createEncounterBattle(s.player, content.encounters.get('slime-puddle'), { rng: s.rng, companions: s.party.battleMembers() });
    startBattle(b);
    const hero = b.combatants.find((x) => x.kind === 'hero') as Combatant;
    const fenn = b.combatants.find((x) => x.id === 'companion:fenn') as Combatant;
    applyDamage(b, hero, fenn, 9999999, { element: 'physical', crit: false });
    for (const x of b.alive('enemy')) applyDamage(b, hero, x, 9999999, { element: 'physical', crit: false });
    b.checkOutcome();
    settleBattle(s, b);
    expect(s.state.party.companions.fenn?.character.hp).toBe(1);
  });

  it('their personal quest needs trust, and earns their oath', () => {
    const s = newSession();
    s.party.recruit('aldric');
    s.player.level = 15;
    expect(isAvailable(s.state, content.quests.get('aldric-lantern'))).toBe(false);
    s.party.adjust('aldric', 20);
    expect(isAvailable(s.state, content.quests.get('aldric-lantern'))).toBe(true);
    s.quests.start('aldric-lantern');
    settleBattle(s, battleOf(s, 'q-bone-priest', true, []));
    const conv = s.quests.talkTo('aldric') as Conversation;
    pick(conv, 'The Lantern of Saint Ilse');
    pick(conv);
    pick(conv, 'Keep it');
    finish(conv);
    expect(s.state.party.companions.aldric?.oath).toBe(true);
    expect(s.state.quests.completed['aldric-lantern']).toBe(1);
  });

  it('quest and party state survive a save round trip', () => {
    const s = newSession();
    s.party.recruit('sable');
    s.quests.start('side-rats');
    const copy = new GameSession(JSON.parse(JSON.stringify(s.snapshot())));
    expect(copy.party.members()[0]?.id).toBe('sable');
    expect(copy.state.quests.active['side-rats']).toBeDefined();
  });
});
