import { setRelation } from '../gods/devotion';
import { content } from '../../data';
import { restoreFull } from '../character/stats';
import type { Battle } from '../combat/battle';
import type { EncounterDef } from '../combat/types';
import { judgeDeedList, type DeedOccurrence } from '../gods/devotion';
import { createItem, generateGear } from '../items/generate';
import { takeHeld, countHeld } from '../items/inventory';
import { favorTiers } from '../gods/devotion';
import { evaluate } from '../quests/conditions';
import {
  activeMarkers,
  derivedNowHolds,
  isAvailable,
  minutesLeft,
  newProgress,
  nextStageId,
  objectiveDone,
  progressOf,
  questGold,
  questLevel,
  questXp,
  required,
  stageOf,
  type QuestMarker,
} from '../quests/quests';
import type { ActionDef, NpcDef, ObjectiveDef, QuestDef, QuestProgress, QuestState } from '../quests/types';
import { Conversation, type ConversationOutcome } from './conversation';
import type { GameSession } from './gameState';

export type QuestResult = { ok: true } | { ok: false; reason: string };
const fail = (reason: string): QuestResult => ({ ok: false, reason });

/** What stepping onto a quest marker does. */
export type MarkerResult = { kind: 'talk'; marker: QuestMarker } | { kind: 'fight'; encounter: EncounterDef; level: number } | { kind: 'moved'; message?: string };

/** Quests that do not count as "helping people" for the gods (their own trials and tests). */
const NOT_HELPING = new Set(['god', 'class', 'hybrid']);

/**
 * Quests on a running game: starting, tracking progress from kills, deeds,
 * fights, markers and carried items, stage turn-ins, rewards, failures and
 * time limits, plus conversations with NPCs and the story's ending.
 */
export class QuestActions {
  private refreshing = false;

  constructor(private readonly s: GameSession) {
    s.bus.on('enemyKilled', ({ enemyId, tier }) => this.onKill(enemyId, tier));
    s.bus.on('stateChanged', () => this.refresh());
    s.bus.on('timeChanged', () => this.refresh());
  }

  private get q(): QuestState {
    return this.s.state.quests;
  }

  def(id: string): QuestDef {
    return content.quests.get(id);
  }

  private toast(kind: 'quest' | 'warning' | 'info', text: string): void {
    this.s.bus.emit('toast', { kind, text });
  }

  // ------------------------------------------------------------ queries

  active(): QuestDef[] {
    return Object.keys(this.q.active).map((id) => this.def(id));
  }

  progress(id: string): QuestProgress | undefined {
    return this.q.active[id];
  }

  /** Quests this NPC offers right now. */
  offersFrom(npc: string): QuestDef[] {
    return content.quests.filter((q) => q.giver === npc && !q.auto && isAvailable(this.s.state, q));
  }

  /** A town's quest board. */
  board(town: string): QuestDef[] {
    return content.quests.filter((q) => q.board === town && isAvailable(this.s.state, q));
  }

  /** Quests waiting to be handed in to this NPC. */
  turnInsFor(npc: string): QuestDef[] {
    return this.active().filter((q) => {
      const prog = this.q.active[q.id] as QuestProgress;
      const st = stageOf(q, prog.stage);
      return st.turnIn === npc && st.objectives.every((o) => objectiveDone(this.s.state, prog, o));
    });
  }

  /** Open objectives anywhere that point at this NPC (talk and deliver). */
  objectivesFor(npc: string): { quest: QuestDef; objective: ObjectiveDef }[] {
    const out: { quest: QuestDef; objective: ObjectiveDef }[] = [];
    for (const q of this.active()) {
      const prog = this.q.active[q.id] as QuestProgress;
      for (const o of stageOf(q, prog.stage).objectives) {
        if (objectiveDone(this.s.state, prog, o)) continue;
        if ((o.kind === 'talk' && o.npc === npc && !o.at) || (o.kind === 'deliver' && o.npc === npc)) out.push({ quest: q, objective: o });
      }
    }
    return out;
  }

  /** Does this NPC have something for you (a new quest, a hand-in, an errand)? */
  npcMark(npc: string): '!' | '?' | '' {
    if (this.turnInsFor(npc).length > 0 || this.objectivesFor(npc).length > 0) return '?';
    if (this.offersFrom(npc).length > 0) return '!';
    return '';
  }

  markers(map?: string): QuestMarker[] {
    const all = activeMarkers(this.s.state);
    return map === undefined ? all : all.filter((m) => m.map === map);
  }

  markerAt(map: string, x: number, y: number): QuestMarker | undefined {
    return this.markers(map).find((m) => m.x === x && m.y === y);
  }

  /** NPCs fighting beside you while you escort them. */
  guests(): { id: string; enemyId: string }[] {
    const out: { id: string; enemyId: string }[] = [];
    for (const q of this.active()) {
      const prog = this.q.active[q.id] as QuestProgress;
      for (const o of stageOf(q, prog.stage).objectives) {
        if (o.kind === 'escort' && !objectiveDone(this.s.state, prog, o)) out.push({ id: `guest:${q.id}/${o.id}`, enemyId: o.guest });
      }
    }
    return out;
  }

  /** May this encounter (a class or hybrid trial) be fought now? Won trials can always be refought. */
  trialOpen(encounter: string): boolean {
    if (this.s.player.trialsWon.includes(encounter)) return true;
    return this.active().some((q) => {
      const prog = this.q.active[q.id] as QuestProgress;
      return stageOf(q, prog.stage).objectives.some((o) => (o.kind === 'fight' && o.encounter === encounter) || (o.kind === 'state' && o.cond.kind === 'trialWon' && o.cond.encounter === encounter));
    });
  }

  /** The class or hybrid quest that wraps a trial encounter, if any. */
  trialQuest(encounter: string): QuestDef | undefined {
    return content.quests.all().find((q) => (q.kind === 'class' || q.kind === 'hybrid') && q.stages.some((st) => st.objectives.some((o) => o.kind === 'state' && o.cond.kind === 'trialWon' && o.cond.encounter === encounter)));
  }

  /** Enemy level for a quest fight: near the hero, within a few levels of the encounter's own (or exactly the hero's). */
  fightLevel(enc: EncounterDef): number {
    if (enc.scalesToHero) return this.s.player.level;
    return Math.max(enc.level - 2, Math.min(enc.level + 3, this.s.player.level));
  }

  fightFor(encounterId: string): { encounter: EncounterDef; level: number } {
    const encounter = content.encounters.get(encounterId);
    return { encounter, level: this.fightLevel(encounter) };
  }

  // ------------------------------------------------------------ lifecycle

  start(id: string): QuestResult {
    const q = this.def(id);
    if (this.q.active[id]) return fail('You are already on that quest.');
    if (!isAvailable(this.s.state, q)) return fail('That quest is not open to you.');
    this.begin(q);
    this.s.bus.emit('stateChanged', { reason: 'quest' });
    return { ok: true };
  }

  private begin(q: QuestDef): void {
    const first = q.stages[0];
    if (!first) return;
    this.q.active[q.id] = newProgress(this.s.state, first.id);
    this.q.failed = this.q.failed.filter((f) => f !== q.id);
    if (!this.q.tracked) this.q.tracked = q.id;
    this.s.bus.emit('questStarted', { questId: q.id });
    this.toast('quest', `${q.kind === 'main' || q.kind === 'twilight' ? 'Story' : 'New quest'}: ${q.name}`);
    this.runActions(first.onStart ?? []);
  }

  /** Gives up a quest (not the main story); it can be taken again later. */
  abandon(id: string): QuestResult {
    const q = this.def(id);
    if (!this.q.active[id]) return fail('You are not on that quest.');
    if (q.kind === 'main' || q.kind === 'twilight') return fail('The story cannot be abandoned.');
    delete this.q.active[id];
    if (this.q.tracked === id) this.q.tracked = Object.keys(this.q.active)[0];
    this.s.bus.emit('stateChanged', { reason: 'quest' });
    return { ok: true };
  }

  track(id: string | undefined): void {
    if (id === undefined) delete this.q.tracked;
    else this.q.tracked = id;
    this.s.bus.emit('stateChanged', { reason: 'track' });
  }

  private progressed(q: QuestDef, o: ObjectiveDef, prog: QuestProgress, quiet = false): void {
    const have = progressOf(this.s.state, prog, o);
    const need = required(o);
    this.s.bus.emit('questProgress', { questId: q.id, objectiveId: o.id, progress: have, required: need });
    if (!quiet) this.toast('quest', `${o.text}${need > 1 ? `: ${have}/${need}` : have >= need ? ': done' : ''}`);
  }

  private bump(q: QuestDef, o: ObjectiveDef, prog: QuestProgress, by = 1): void {
    const before = prog.progress[o.id] ?? 0;
    const after = Math.min(required(o), before + by);
    if (after === before) return;
    prog.progress[o.id] = after;
    this.progressed(q, o, prog);
  }

  private eachOpen(fn: (q: QuestDef, o: ObjectiveDef, prog: QuestProgress) => void): void {
    for (const q of this.active()) {
      const prog = this.q.active[q.id];
      if (!prog) continue;
      for (const o of stageOf(q, prog.stage).objectives) if (!objectiveDone(this.s.state, prog, o)) fn(q, o, prog);
    }
  }

  private onKill(enemyId: string, tier: string): void {
    const def = content.enemies.find(enemyId);
    const zone = this.s.world.zone.id;
    this.eachOpen((q, o, prog) => {
      if (o.kind === 'kill') {
        if (o.enemyId && o.enemyId !== enemyId) return;
        if (o.enemyType && !def?.types.includes(o.enemyType)) return;
        if (o.tiers && !o.tiers.includes(tier as never)) return;
        if (o.zone && o.zone !== zone) return;
        this.bump(q, o, prog);
      } else if (o.kind === 'clear' && content.dungeons.get(o.dungeon).boss === enemyId) this.bump(q, o, prog);
    });
    this.refresh();
  }

  /** Deeds (battle tallies and actions) count toward deed objectives. */
  onDeeds(occurrences: readonly DeedOccurrence[]): void {
    this.eachOpen((q, o, prog) => {
      if (o.kind !== 'deed') return;
      const n = judgeDeedList([{ ...o.deed, amount: 1, text: '' }], occurrences);
      if (n > 0) this.bump(q, o, prog, n);
    });
    this.refresh();
  }

  /** After a battle: quest fights won count; an escorted NPC who fell (or a lost fight) fails the escort. */
  afterBattle(b: Battle): void {
    const won = b.outcome === 'victory';
    const failed: { q: QuestDef; why: string }[] = [];
    this.eachOpen((q, o, prog) => {
      if (o.kind === 'fight' && won && o.encounter === b.encounterId) {
        this.bump(q, o, prog);
        if (o.waves && progressOf(this.s.state, prog, o) < o.waves) this.toast('quest', `Wave ${progressOf(this.s.state, prog, o)} of ${o.waves} beaten.`);
      }
      if (o.kind === 'escort') {
        const guest = b.combatants.find((x) => x.id === `guest:${q.id}/${o.id}`);
        if (b.outcome === 'defeat' || (guest && !guest.alive)) failed.push({ q, why: `${o.npc} has fallen.` });
      }
    });
    for (const f of failed) this.fail(f.q, f.why);
  }

  /** Steps onto a marker. */
  useMarker(m: QuestMarker): MarkerResult {
    const q = this.def(m.quest);
    const prog = this.q.active[q.id];
    if (!prog) return { kind: 'moved' };
    const o = stageOf(q, prog.stage).objectives.find((x) => x.id === m.objective);
    if (!o || objectiveDone(this.s.state, prog, o)) return { kind: 'moved' };
    switch (o.kind) {
      case 'talk':
        return { kind: 'talk', marker: m };
      case 'fight':
        return { kind: 'fight', ...this.fightFor(o.encounter) };
      case 'visit':
        this.bump(q, o, prog);
        this.refresh();
        return { kind: 'moved', message: `${m.label}.` };
      case 'escort':
        this.bump(q, o, prog);
        this.refresh();
        return { kind: 'moved', message: `${o.npc} is safe at ${m.label}.` };
      case 'sequence': {
        const at = prog.progress[o.id] ?? 0;
        if (o.order[at] === m.stone) {
          this.bump(q, o, prog);
          this.refresh();
          return { kind: 'moved', message: at + 1 >= o.order.length ? 'The stones sing together!' : `${m.label} hums under your hand.` };
        }
        prog.progress[o.id] = 0;
        this.s.bus.emit('stateChanged', { reason: 'quest' });
        return { kind: 'moved', message: `${m.label} stays cold, and the others fall silent. Begin again.` };
      }
      default:
        return { kind: 'moved' };
    }
  }

  /**
   * Re-checks every active quest: time limits, state-based objectives,
   * finished stages (those without a turn-in advance on their own), and
   * quests that start by themselves.
   */
  refresh(): void {
    if (this.refreshing) return;
    this.refreshing = true;
    try {
      let changed = false;
      for (let guard = 0; guard < 30; guard++) {
        let step = false;
        for (const q of content.quests.all()) {
          if (q.auto && isAvailable(this.s.state, q)) {
            this.begin(q);
            step = true;
          }
        }
        for (const q of this.active()) {
          const prog = this.q.active[q.id];
          if (!prog) continue;
          const left = minutesLeft(this.s.state, q);
          if (left !== undefined && left <= 0) {
            this.fail(q, 'Time ran out.');
            step = true;
            continue;
          }
          const st = stageOf(q, prog.stage);
          for (const o of st.objectives) {
            if (!objectiveDone(this.s.state, prog, o) && derivedNowHolds(this.s.state, o)) {
              prog.progress[o.id] = 1;
              this.progressed(q, o, prog);
              step = true;
            }
          }
          if (!st.turnIn && st.objectives.every((o) => objectiveDone(this.s.state, prog, o))) {
            this.completeStage(q);
            step = true;
          }
        }
        if (!step) break;
        changed = true;
      }
      if (changed) this.s.bus.emit('stateChanged', { reason: 'quest' });
    } finally {
      this.refreshing = false;
    }
  }

  private completeStage(q: QuestDef): void {
    const prog = this.q.active[q.id];
    if (!prog) return;
    const st = stageOf(q, prog.stage);
    for (const o of st.objectives) if (o.kind === 'collect' && !o.keep) takeHeld(this.s.state, o.itemId, o.count);
    this.runActions(st.onComplete ?? []);
    if (!this.q.active[q.id]) return;
    const next = nextStageId(this.s.state, q, st);
    if (next) {
      this.q.active[q.id] = newProgress(this.s.state, next);
      const nst = stageOf(q, next);
      this.toast('quest', `${q.name}: ${nst.text}`);
      this.runActions(nst.onStart ?? []);
    } else this.finish(q);
  }

  /** Completes a quest: rewards, the gods' approval, and the record. */
  private finish(q: QuestDef): void {
    const s = this.s;
    delete this.q.active[q.id];
    this.q.completed[q.id] = (this.q.completed[q.id] ?? 0) + 1;
    this.q.completedDay[q.id] = s.state.clock.day;
    if (this.q.tracked === q.id) this.q.tracked = Object.keys(this.q.active)[0];
    const r = q.rewards;
    const parts: string[] = [];
    const xp = questXp(q, s.state.ngPlus);
    if (xp > 0) {
      s.grantXp(xp);
      parts.push(`${xp} XP`);
    }
    const gold = questGold(q, s.state.ngPlus);
    if (gold > 0) {
      s.addGold(gold, 'quest');
      parts.push(`${gold} gold`);
    }
    for (const it of r.items ?? []) {
      s.items.give(createItem(it.itemId, it.qty ?? 1, () => s.newUid()));
      parts.push(`${it.qty ?? 1}× ${content.items.get(it.itemId).name}`);
    }
    for (let i = 0; i < (r.gear?.count ?? (r.gear ? 1 : 0)); i++) {
      const p = s.player;
      const item = generateGear({ rng: s.rng, itemLevel: questLevel(q, s.state.ngPlus), newUid: () => s.newUid(), ngPlus: s.state.ngPlus, favorClassId: p.classes[0]?.classId, favorTiers: favorTiers(p) }, { rarity: r.gear?.rarity ?? 'rare', categories: ['weapon', 'armor', 'accessory'] });
      s.items.give(item);
      parts.push(`${content.rarities.get(item.rarity).name} gear`);
    }
    if (r.skillPoints) {
      const primary = s.player.classes[0];
      if (primary) primary.skillPoints += r.skillPoints;
      parts.push(`${r.skillPoints} skill point${r.skillPoints > 1 ? 's' : ''}`);
    }
    if (r.title && !s.player.devotion.titles.includes(r.title)) {
      s.player.devotion.titles.push(r.title);
      parts.push(`title “${r.title}”`);
    }
    s.bus.emit('questComplete', { questId: q.id });
    this.toast('quest', `Quest complete: ${q.name}${parts.length ? ` (${parts.join(', ')})` : ''}`);
    if (q.epilogue) this.toast('info', q.epilogue);
    if (r.favor) s.devotion.apply(r.favor, 'quest');
    if (r.rep) s.world.addRep(r.rep);
    if (!NOT_HELPING.has(q.kind)) s.devotion.deeds([{ event: 'questDone' }], 'quest');
  }

  fail(q: QuestDef, why: string): void {
    if (!this.q.active[q.id]) return;
    delete this.q.active[q.id];
    if (!this.q.failed.includes(q.id)) this.q.failed.push(q.id);
    if (this.q.tracked === q.id) this.q.tracked = Object.keys(this.q.active)[0];
    this.toast('warning', `Quest failed: ${q.name}. ${why}${q.giver || q.board ? ' You may take it up again.' : ''}`);
    this.s.bus.emit('stateChanged', { reason: 'quest' });
  }

  completeObjective(questId: string, objectiveId: string): void {
    const prog = this.q.active[questId];
    if (!prog) return;
    const q = this.def(questId);
    const o = stageOf(q, prog.stage).objectives.find((x) => x.id === objectiveId);
    if (!o || objectiveDone(this.s.state, prog, o)) return;
    prog.progress[o.id] = required(o);
    this.progressed(q, o, prog);
    this.refresh();
  }

  // ------------------------------------------------------------ actions

  /** Applies data actions; returns a fight to start or an ending reached. */
  runActions(actions: readonly ActionDef[]): ConversationOutcome {
    const s = this.s;
    const out: ConversationOutcome = {};
    for (const a of actions) {
      switch (a.kind) {
        case 'startQuest': {
          const q = this.def(a.quest);
          if (!this.q.active[q.id] && (!this.q.completed[q.id] || q.repeatable)) this.begin(q);
          break;
        }
        case 'setFlag':
          s.setFlag(a.flag, a.value ?? true);
          break;
        case 'addCounter': {
          const v = s.state.flags[a.flag];
          s.setFlag(a.flag, (typeof v === 'number' ? v : 0) + (a.amount ?? 1));
          break;
        }
        case 'giveItem':
          s.items.give(createItem(a.itemId, a.qty ?? 1, () => s.newUid()));
          this.toast('info', `Received: ${a.qty && a.qty > 1 ? `${a.qty}× ` : ''}${content.items.get(a.itemId).name}`);
          break;
        case 'takeItem':
          takeHeld(s.state, a.itemId, Math.min(a.qty ?? 1, countHeld(s.state, a.itemId)));
          break;
        case 'gold':
          s.addGold(a.amount, 'quest');
          break;
        case 'favor':
          s.devotion.apply({ [a.god]: a.amount }, 'quest');
          break;
        case 'rep':
          s.world.addRep({ [a.faction]: a.amount });
          break;
        case 'approval':
          s.party.adjust(a.companion, a.amount);
          break;
        case 'recruit':
          s.party.recruit(a.companion);
          break;
        case 'oath':
          s.party.grantOath(a.companion);
          break;
        case 'deed':
          s.devotion.deeds([{ event: a.event, count: a.count ?? 1 }], 'quest');
          break;
        case 'fight':
          out.fight = a.encounter;
          break;
        case 'completeObjective':
          this.completeObjective(a.quest, a.objective);
          break;
        case 'failQuest':
          this.fail(this.def(a.quest), '');
          break;
        case 'ending':
          this.reachEnding(a.ending);
          out.ending = a.ending;
          break;
        case 'title':
          if (!s.player.devotion.titles.includes(a.title)) s.player.devotion.titles.push(a.title);
          break;
        case 'heresy':
          s.devotion.addHeresy(a.amount, 'quest');
          break;
        case 'politics': {
          setRelation(s.player, a.a, a.b, a.relation);
          const [x, y] = [content.gods.get(a.a).name, content.gods.get(a.b).name];
          this.toast('info', a.relation === 'rival' ? `${x} and ${y} are now rivals.` : a.relation === 'ally' ? `${x} and ${y} now stand together.` : `${x} and ${y} set their feud aside.`);
          break;
        }
        case 'restore':
          restoreFull(s.player);
          s.party.restoreAll();
          break;
        case 'toast':
          this.toast('info', a.text);
          break;
        case 'turnIn': {
          const prog = this.q.active[a.quest];
          const q = this.def(a.quest);
          if (prog && stageOf(q, prog.stage).objectives.every((o) => objectiveDone(s.state, prog, o))) this.completeStage(q);
          break;
        }
        case 'deliver': {
          const prog = this.q.active[a.quest];
          const q = this.def(a.quest);
          const o = prog ? stageOf(q, prog.stage).objectives.find((x) => x.id === a.objective) : undefined;
          if (prog && o?.kind === 'deliver' && countHeld(s.state, o.itemId) >= o.count) {
            takeHeld(s.state, o.itemId, o.count);
            this.bump(q, o, prog, o.count);
          }
          break;
        }
      }
    }
    this.refresh();
    s.bus.emit('stateChanged', { reason: 'quest' });
    return out;
  }

  /** The story ends: recorded for New Game+ (and in the legacy of every playthrough), with its title. */
  reachEnding(id: string): void {
    const def = content.endings.get(id);
    const god = this.s.player.devotion.apostle?.god;
    this.q.ending = { id, day: this.s.state.clock.day, seen: false, ...(god ? { god } : {}) };
    this.s.state.legacy.endings.push(god ? `${id}:${god}` : id);
    this.s.setFlag('storyComplete', true);
    if (def.title && !this.s.player.devotion.titles.includes(def.title)) this.s.player.devotion.titles.push(def.title);
    this.toast('quest', `The story ends: ${def.name}`);
  }

  markEndingSeen(): void {
    if (this.q.ending) this.q.ending.seen = true;
  }

  // ------------------------------------------------------------ conversations

  /** Can you speak with this NPC here? */
  canTalk(npc: NpcDef): boolean {
    if (npc.companion) {
      const comp = this.s.state.party.companions[npc.companion];
      if (comp && !comp.left) return true;
    }
    const town = this.s.world.inTown();
    if (npc.place === 'field') return false;
    if (npc.place === 'arena') return town !== undefined;
    return town !== undefined && npc.town === town;
  }

  /** NPCs you can find in a town (people and temple; mentors are in the arena). */
  townNpcs(town: string): NpcDef[] {
    return content.npcs.filter((n) => n.town === town && (n.place === 'people' || n.place === 'temple') && !(n.companion && this.s.state.party.companions[n.companion] && !this.s.state.party.companions[n.companion]?.left));
  }

  talkTo(npcId: string): Conversation | undefined {
    const npc = content.npcs.get(npcId);
    if (!this.canTalk(npc)) return undefined;
    return new Conversation(this.s, npc);
  }

  /** A conversation with someone waiting at a field marker. */
  talkAtMarker(m: QuestMarker): Conversation | undefined {
    if (!m.npc) return undefined;
    const q = this.def(m.quest);
    const prog = this.q.active[q.id];
    const o = prog ? stageOf(q, prog.stage).objectives.find((x) => x.id === m.objective) : undefined;
    if (o?.kind !== 'talk') return undefined;
    return new Conversation(this.s, content.npcs.get(o.npc), { quest: q.id, objective: o.id });
  }

  /** Conditions in dialogue are evaluated against the live state. */
  holds(cond: Parameters<typeof evaluate>[1] | undefined): boolean {
    return cond === undefined || evaluate(this.s.state, cond);
  }
}
