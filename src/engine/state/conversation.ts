import { content } from '../../data';
import { describe } from '../quests/conditions';
import { objectiveDone, progressOf, stageOf } from '../quests/quests';
import type { ActionDef, ChoiceDef, DialogueDef, DialogueNode, NpcDef } from '../quests/types';
import type { GameSession } from './gameState';

export interface ChoiceView {
  label: string;
  enabled: boolean;
  /** Why a locked choice is locked, e.g. "WIS 20". */
  requirement?: string;
  /** Marks quest offers ('!') and hand-ins ('?') in the topic list. */
  mark?: '!' | '?';
}

export interface ConversationView {
  /** Display name of whoever speaks. */
  speaker: string;
  title?: string;
  portrait?: { race: string; portrait: number; color: string };
  narrator: boolean;
  text: string;
  choices: ChoiceView[];
}

/** What a conversation leaves behind: a fight to start, or the story's ending. */
export interface ConversationOutcome {
  fight?: string;
  ending?: string;
}

interface Choice extends ChoiceView {
  run: () => void;
}

/** A thread being played: a dialogue and where in it we are. */
interface Frame {
  def: DialogueDef;
  node: string;
  /** Called when the thread ends normally (not by a "leave" choice). */
  onFinish?: () => void;
}

/** A one-node dialogue. */
function line(text: string, actions: ActionDef[] = [], speaker?: string): DialogueDef {
  return { id: 'line', start: 'a', nodes: { a: { text, actions, ...(speaker ? { speaker } : {}) } } };
}

/**
 * A conversation with an NPC. It opens on their topic list (the hub): quest
 * hand-ins, deliveries, errands, new quests and story topics, or straight
 * into an objective's dialogue at a field marker. Choices run data actions;
 * a fight or the ending closes the conversation and is left in `outcome`.
 */
export class Conversation {
  private frame: Frame | undefined;
  private readonly hub: boolean;
  private returned = false;
  /** Set when an action asks the conversation to close (a fight, the ending). */
  private closing = false;
  done = false;
  readonly outcome: ConversationOutcome = {};

  constructor(
    private readonly s: GameSession,
    readonly npc: NpcDef,
    marker?: { quest: string; objective: string },
    scene?: string,
  ) {
    this.hub = marker === undefined && scene === undefined;
    if (marker) this.openObjective(marker.quest, marker.objective);
    if (scene) this.play(content.dialogues.get(scene));
  }

  // ------------------------------------------------------------ text

  private fill(text: string): string {
    const p = this.s.player;
    const patron = p.devotion.patron ? content.gods.get(p.devotion.patron).name : 'the gods';
    const apostle = p.devotion.apostle ? content.gods.get(p.devotion.apostle.god).name : 'your god';
    const cls = p.classes[0] ? content.classes.get(p.classes[0].classId).name : '';
    return text.replaceAll('{hero}', p.name).replaceAll('{patron}', patron).replaceAll('{apostle}', apostle).replaceAll('{class}', cls);
  }

  private speakerOf(node: DialogueNode | undefined): Pick<ConversationView, 'speaker' | 'title' | 'portrait' | 'narrator'> {
    const id = node?.speaker ?? this.npc.id;
    if (id === 'narrator') return { speaker: '', narrator: true };
    if (id === 'hero') {
      const p = this.s.player;
      const cls = p.classes[0] ? content.classes.get(p.classes[0].classId) : undefined;
      return { speaker: p.name, narrator: false, portrait: { race: p.raceId, portrait: p.portrait, color: cls?.color ?? '#888888' } };
    }
    const npc = content.npcs.get(id);
    return { speaker: npc.name, title: npc.title, narrator: false, portrait: { race: npc.race, portrait: npc.portrait, color: npc.color } };
  }

  // ------------------------------------------------------------ threads

  private play(def: DialogueDef, onFinish?: () => void): void {
    this.frame = { def, node: def.start, ...(onFinish ? { onFinish } : {}) };
    this.enter(def.start);
  }

  private node(): DialogueNode | undefined {
    return this.frame ? this.frame.def.nodes[this.frame.node] : undefined;
  }

  private act(actions: readonly ActionDef[] | undefined): void {
    if (!actions?.length) return;
    const out = this.s.quests.runActions(actions);
    if (out.fight) this.outcome.fight = out.fight;
    if (out.ending) this.outcome.ending = out.ending;
    if (out.fight || out.ending) this.closing = true;
  }

  private enter(nodeId: string): void {
    if (!this.frame) return;
    const node = this.frame.def.nodes[nodeId];
    if (!node) throw new Error(`Dialogue ${this.frame.def.id} has no node ${nodeId}`);
    this.frame.node = nodeId;
    this.act(node.actions);
  }

  /** The thread ends: finish it (unless left), then back to the topic list or close. */
  private endThread(leave: boolean): void {
    const f = this.frame;
    this.frame = undefined;
    if (f?.onFinish && !leave) f.onFinish();
    if (this.closing || !this.hub) this.done = true;
    else this.returned = true;
  }

  private openObjective(questId: string, objectiveId: string): void {
    const q = this.s.quests.def(questId);
    const prog = this.s.quests.progress(questId);
    const o = prog ? stageOf(q, prog.stage).objectives.find((x) => x.id === objectiveId) : undefined;
    if (!o || o.kind !== 'talk') return;
    const def = o.dialogue ? content.dialogues.get(o.dialogue) : line(`${this.npc.name} hears you out.`);
    this.play(def, () => this.s.quests.completeObjective(questId, objectiveId));
  }

  // ------------------------------------------------------------ the hub

  private hubChoices(): Choice[] {
    const s = this.s;
    const quests = s.quests;
    const npc = this.npc;
    const out: Choice[] = [];
    for (const q of quests.turnInsFor(npc.id)) {
      const prog = quests.progress(q.id);
      const st = prog ? stageOf(q, prog.stage) : undefined;
      out.push({ label: `Report: ${q.name}`, enabled: true, mark: '?', run: () => this.play(line(st?.turnInText ?? 'Well done. Truly.', [{ kind: 'turnIn', quest: q.id }])) });
    }
    for (const { quest: q, objective: o } of quests.objectivesFor(npc.id)) {
      if (o.kind === 'deliver') {
        const prog = quests.progress(q.id);
        const have = Math.min(o.count, s.state.inventory.slots.reduce((n, it) => n + (it?.baseId === o.itemId ? it.quantity : 0), 0));
        const name = content.items.get(o.itemId).name;
        const ready = have >= o.count && prog !== undefined;
        out.push({ label: `Hand over ${o.count > 1 ? `${o.count}× ` : ''}${name}`, enabled: ready, mark: '?', ...(ready ? {} : { requirement: `${have}/${o.count}` }), run: () => this.play(line('“Thank you. I will not forget it.”', [{ kind: 'deliver', quest: q.id, objective: o.id }])) });
      } else if (o.kind === 'talk') {
        out.push({ label: q.name, enabled: true, mark: '?', run: () => this.openObjective(q.id, o.id) });
      }
    }
    for (const q of quests.offersFrom(npc.id)) {
      const offer: DialogueDef = {
        id: `offer-${q.id}`,
        start: 'offer',
        nodes: {
          offer: {
            text: q.summary,
            choices: [
              { text: `Accept: ${q.name} (level ${q.level})`, actions: [{ kind: 'startQuest', quest: q.id }] },
              { text: 'Not now.', leave: true },
            ],
          },
        },
      };
      out.push({ label: q.name, enabled: true, mark: '!', run: () => this.play(offer) });
    }
    for (const t of npc.topics ?? []) {
      if (!quests.holds(t.cond)) continue;
      if (t.once && s.state.quests.topicsSeen.includes(`${npc.id}:${t.id}`)) continue;
      out.push({
        label: t.text,
        enabled: true,
        run: () =>
          this.play(content.dialogues.get(t.dialogue), () => {
            if (t.once) s.state.quests.topicsSeen.push(`${npc.id}:${t.id}`);
          }),
      });
    }
    out.push({ label: 'Farewell.', enabled: true, run: () => (this.done = true) });
    return out;
  }

  // ------------------------------------------------------------ view and input

  private choices(): Choice[] {
    if (this.closing && this.frame) return [{ label: this.outcome.fight ? 'To arms!' : 'Continue', enabled: true, run: () => this.endThread(false) }];
    const node = this.node();
    if (!node) return this.hubChoices();
    const data = node.choices ?? [];
    if (data.length === 0) {
      return [{ label: node.next ? 'Continue' : this.hub ? 'Back' : 'Farewell.', enabled: true, run: () => (node.next ? this.enter(node.next) : this.endThread(false)) }];
    }
    return data
      // Locked choices show their requirement; ones that hinge on story state (no requirement to show) stay hidden.
      .filter((ch) => this.s.quests.holds(ch.cond) || !(ch.hideLocked || !ch.cond || describe(ch.cond) === ''))
      .map((ch: ChoiceDef): Choice => {
        const ok = this.s.quests.holds(ch.cond);
        const tag = ch.cond ? describe(ch.cond) : '';
        return {
          label: `${tag ? `[${tag}] ` : ''}${this.fill(ch.text)}`,
          enabled: ok,
          ...(ok || !tag ? {} : { requirement: tag }),
          run: () => {
            this.act(ch.actions);
            if (this.closing) return this.endThread(ch.leave ?? false);
            if (ch.next) this.enter(ch.next);
            else this.endThread(ch.leave ?? false);
          },
        };
      });
  }

  view(): ConversationView {
    const node = this.node();
    if (!node) {
      const npc = this.npc;
      return {
        ...this.speakerOf(undefined),
        text: this.returned ? 'Anything else?' : this.fill(npc.greeting),
        choices: this.hubChoices().map(({ run: _run, ...v }) => v),
      };
    }
    return { ...this.speakerOf(node), text: this.fill(node.text), choices: this.choices().map(({ run: _run, ...v }) => v) };
  }

  choose(index: number): void {
    if (this.done) return;
    const choice = this.choices()[index];
    if (!choice?.enabled) return;
    choice.run();
  }
}

/** Progress text for an objective, e.g. "3/6". */
export function objectiveLine(s: GameSession, questId: string, objectiveId: string): string {
  const prog = s.quests.progress(questId);
  if (!prog) return '';
  const q = s.quests.def(questId);
  const o = stageOf(q, prog.stage).objectives.find((x) => x.id === objectiveId);
  if (!o) return '';
  if (objectiveDone(s.state, prog, o)) return 'done';
  const need = o.kind === 'kill' || o.kind === 'collect' || o.kind === 'deliver' || o.kind === 'deed' ? o.count : o.kind === 'fight' ? (o.waves ?? 1) : o.kind === 'sequence' ? o.order.length : 1;
  return need > 1 ? `${progressOf(s.state, prog, o)}/${need}` : '';
}
