import { content } from '../src/data';
import { activeMarkers, stageOf } from '../src/engine/quests/quests';
import type { QuestDef } from '../src/engine/quests/types';
import type { Conversation } from '../src/engine/state/conversation';
import type { GameSession } from '../src/engine/state/gameState';
import { mapFor } from '../src/engine/world/mapgen';
import { townSpot } from '../src/engine/world/world';

/**
 * Plays the main story from wherever it stands to an ending, the way a
 * player would: talking to people in their towns, walking to markers,
 * lighting rune stones, hunting and fighting. Fights are handed to `fight`
 * (instant wins in the tests, real auto-battles in `npm run playtest`),
 * which returns whether the fight was won. `between` runs after every
 * step (the tests save and reload there).
 */
export interface PlayOptions {
  fight: (s: GameSession, encounter: string) => boolean;
  /** Called after every step; may hand back a new session (a reload). */
  between?: (s: GameSession, quest: string) => GameSession;
  /**
   * Picks dialogue choices: the label to take. `attempt` counts how often
   * this stage has been tried without progress, so a wrong answer can be
   * changed. By default: the first choice that is not a [Leave], moving on
   * by one with each attempt.
   */
  choose?: (labels: string[], attempt: number) => string | undefined;
  /** Fights lost before giving up on one. */
  retries?: number;
  log?: (line: string) => void;
}

export interface PlayResult {
  session: GameSession;
  ending?: string;
  steps: number;
  fights: number;
  losses: number;
  /** Set if the story got stuck. */
  stuck?: string;
}

function pickIn(conv: Conversation, label?: string): void {
  const choices = conv.view().choices;
  const i = label === undefined ? choices.findIndex((c) => c.enabled) : choices.findIndex((c) => c.enabled && c.label.includes(label));
  if (i < 0) throw new Error(`No choice "${label}" in: ${choices.map((c) => c.label).join(' | ')}`);
  conv.choose(i);
}

/** Talks a conversation through; returns a fight it asked for. */
function talkThrough(conv: Conversation, opts: PlayOptions, attempt: number, topic?: string): string | undefined {
  if (topic) pickIn(conv, topic);
  for (let n = 0; n < 60 && !conv.done; n++) {
    const v = conv.view();
    const labels = v.choices.filter((c) => c.enabled).map((c) => c.label);
    if (v.text === 'Anything else?') {
      pickIn(conv, 'Farewell');
      break;
    }
    const real = labels.filter((l) => !l.startsWith('[Leave]'));
    pickIn(conv, opts.choose ? opts.choose(real, attempt) : real[attempt % Math.max(1, real.length)]);
  }
  return conv.outcome.fight;
}

const mainQuest = (s: GameSession): QuestDef | undefined =>
  content.quests.all().find((q) => q.kind === 'main' && s.state.quests.active[q.id]);

/** One step of the current main-quest stage. Returns a fight to win, or nothing. */
function step(s: GameSession, q: QuestDef, opts: PlayOptions, attempt: number): string | undefined {
  const prog = s.state.quests.active[q.id];
  if (!prog) return undefined;
  const stage = stageOf(q, prog.stage);
  const open = stage.objectives.filter((o) => (prog.progress[o.id] ?? 0) < ('count' in o ? o.count : 'waves' in o ? (o.waves ?? 1) : 1));
  const marker = activeMarkers(s.state).find((m) => m.quest === q.id);
  if (marker) {
    s.state.world.position = { map: marker.map, x: marker.x, y: marker.y };
    const r = s.quests.useMarker(marker);
    if (r.kind === 'fight') return r.encounter.id;
    if (r.kind === 'talk') return talkThrough(s.quests.talkAtMarker(marker) as Conversation, opts, attempt);
    return undefined;
  }
  for (const o of open) {
    switch (o.kind) {
      case 'talk':
      case 'deliver': {
        const npc = content.npcs.get(o.npc);
        if (npc.town) s.state.world.position = townSpot(npc.town);
        const conv = s.quests.talkTo(o.npc);
        if (!conv) throw new Error(`Cannot talk to ${o.npc}`);
        const topic = conv.view().choices.find((c) => c.enabled && (c.label.includes(q.name) || c.label.startsWith('Hand over')))?.label;
        return talkThrough(conv, opts, attempt, topic);
      }
      case 'kill': {
        const enemy = content.enemies.all().find((e) => (!o.enemyId || e.id === o.enemyId) && (!o.enemyType || e.types.includes(o.enemyType)));
        if (!enemy) throw new Error(`No enemy for ${q.id}/${o.id}`);
        if (o.zone) s.state.world.position = { map: o.zone, x: 1, y: 1 };
        s.bus.emit('enemyKilled', { enemyId: enemy.id, tier: o.tiers?.[0] ?? 'normal' });
        return undefined;
      }
      case 'runes': {
        const map = mapFor(o.dungeon);
        for (const e of map.entities.filter((x) => x.kind === 'rune')) {
          s.state.world.position = { map: map.id, x: e.x, y: e.y };
          s.world.interact(e);
        }
        s.quests.refresh();
        return undefined;
      }
      case 'clear':
        return content.dungeons.get(o.dungeon).boss;
      default:
        throw new Error(`The playthrough cannot do a ${o.kind} objective (${q.id}/${o.id})`);
    }
  }
  return undefined;
}

export function playStory(start: GameSession, opts: PlayOptions): PlayResult {
  let s = start;
  const res: PlayResult = { session: s, steps: 0, fights: 0, losses: 0 };
  let lastKey = '';
  let same = 0;
  while (!s.state.quests.ending && res.steps < 400) {
    const q = mainQuest(s);
    if (!q) {
      res.stuck = 'no main quest is active';
      break;
    }
    const prog = s.state.quests.active[q.id];
    const key = `${q.id}:${prog?.stage}:${JSON.stringify(prog?.progress)}`;
    same = key === lastKey ? same + 1 : 0;
    lastKey = key;
    if (same > 3) {
      res.stuck = `stuck at ${key}`;
      break;
    }
    res.steps++;
    const fight = step(s, q, opts, same);
    if (fight) {
      let won = false;
      for (let tries = 0; tries <= (opts.retries ?? 0) && !won; tries++) {
        res.fights++;
        won = opts.fight(s, fight);
        if (!won) res.losses++;
        opts.log?.(`${q.id} ${prog?.stage}: ${content.encounters.find(fight)?.name ?? content.enemies.find(fight)?.name ?? fight} ${won ? 'won' : 'LOST'}`);
      }
      if (!won) {
        res.stuck = `lost ${fight} in ${q.id}`;
        break;
      }
    }
    if (opts.between) s = opts.between(s, q.id);
  }
  res.session = s;
  if (s.state.quests.ending) res.ending = s.state.quests.ending.id;
  return res;
}
