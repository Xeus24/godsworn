import { content } from '../../data';
import { BOND_OFFERING_POINTS, BOND_PRAYER_POINTS, BOND_QUEST_POINTS, BOND_TALK_POINTS, BONDS, BOND_RANK_NAMES } from '../../data/heart/bonds';
import { ARTS, ART_EFFECTS, type ArtDef } from '../../data/heart/arts';
import { BLOODLINE, QUIRKS } from '../../data/heart/bloodline';
import { CONVICTIONS, type ConvictionDef, type LeanEvent } from '../../data/heart/convictions';
import { TALES, TALE_APPROVAL, TALE_BONUS, TALE_GAIN, type TalePair } from '../../data/heart/tales';
import { GIVEN, SURNAMES } from '../../data/realm/chronicle';
import { createItem } from '../items/generate';
import { learnRecipe } from '../economy/crafting';
import type { DeedOccurrence } from '../gods/devotion';
import { favorOf } from '../gods/devotion';
import { equippedItems } from '../items/equipment';
import { repairItem } from '../items/upkeep';
import { characterStats } from '../character/stats';
import { RELIC_TOOLS } from '../../data/world/puzzles';
import { SIGILS } from '../../data/heart/sigils';
import { evaluate } from '../quests/conditions';
import { learnedSlots, sigilSlots } from '../heart/heart';
import { bondFor, growBond, heartOf, note, settle, type HeartProgress } from '../heart/heart';
import type { Ancestor, Heir } from '../realm/types';
import type { GameSession } from './gameState';

const BOND_PERK_RANKS = { recipe: 3, skillA: 5, gold: 7, skillB: 9 } as const;

/** The heart of the hero (Innovation Pack, section C): convictions, kindred bonds, campfire tales, Wayfarer's Arts and the bloodline. */
export class HeartActions {
  private carry = { spend: 0, earn: 0 };

  constructor(private readonly s: GameSession) {}

  get h(): HeartProgress {
    return heartOf(this.s.player);
  }

  private get day(): number {
    return this.s.state.clock.day;
  }

  // ------------------------------------------------------------ convictions

  private lean(event: LeanEvent, n: number, ctx: { enemyTypes?: readonly string[]; tier?: string } = {}): void {
    const began = note(this.h, event, n, this.day, ctx);
    for (const c of began) this.s.bus.emit('toast', { kind: 'info', text: `You are beginning to believe in ${c.name}. It will take a few days to settle.` });
  }

  /** Deeds the gods judge are also what shapes a person. */
  onDeeds(occurrences: readonly DeedOccurrence[]): void {
    for (const o of occurrences) {
      const n = o.count ?? 1;
      if (o.event === 'skillTag') continue;
      if (o.event === 'kill') this.lean('kill', n, { ...(o.enemyTypes ? { enemyTypes: o.enemyTypes } : {}), ...(o.tier ? { tier: o.tier } : {}) });
      else this.lean(o.event, n);
    }
  }

  onGold(amount: number, reason: string): void {
    if (reason === 'defeat' || Math.abs(amount) < 1) return;
    const key = amount < 0 ? 'spend' : 'earn';
    this.carry[key] += Math.abs(amount);
    const hundreds = Math.floor(this.carry[key] / 100);
    if (hundreds > 0) {
      this.carry[key] -= hundreds * 100;
      this.lean(key, hundreds);
    }
  }

  /** A new day: beliefs that have settled are held, and the gods who care say so. */
  onDay(): void {
    this.findSigils();
    this.findTools();
    for (const c of settle(this.h, this.day)) this.holdAnnounce(c);
  }

  private holdAnnounce(c: ConvictionDef): void {
    this.s.bus.emit('toast', { kind: 'level', text: `You now hold ${c.name}: “${c.thought}”` });
    if (c.gods) this.s.devotion.apply(c.gods, 'conviction', true);
    this.s.bus.emit('stateChanged', { reason: 'conviction' });
  }

  holds(id: string): boolean {
    return this.h.held.includes(id) || this.h.inherited.includes(id);
  }

  // ------------------------------------------------------------ Borrowed Arts

  /** Classes you have trained in other than your own: any you have taken, and any whose trial you have won. */
  trainedClasses(): string[] {
    const p = this.s.player;
    const own = p.classes[0]?.classId;
    const ids = new Set<string>(p.classes.map((c) => c.classId));
    for (const t of content.classTrials.all()) if (p.trialsWon.includes(t.encounter)) ids.add(t.classId);
    if (own) ids.delete(own);
    return [...ids];
  }

  /** The active skills of a class's tree that can be borrowed. */
  borrowable(classId: string): { skill: string; name: string }[] {
    const tree = content.trees.find(classId);
    if (!tree) return [];
    const seen = new Set<string>();
    return tree.nodes.flatMap((n) => {
      if (n.kind !== 'active' || !n.skill || n.feat || seen.has(n.skill)) return [];
      seen.add(n.skill);
      const def = content.skills.find(n.skill);
      return def && !def.ultimate && !def.team && !def.weaponArt ? [{ skill: n.skill, name: def.name }] : [];
    });
  }

  studyCost(): number {
    return 120 * Math.max(5, this.s.player.level);
  }

  /** Spends a day and gold to learn a skill of a class you have trained in. */
  borrow(skillId: string): { ok: boolean; reason?: string } {
    const h = this.h;
    if (h.borrowed.includes(skillId)) return { ok: false, reason: 'You already know it.' };
    if (h.borrowed.length >= learnedSlots(this.s.player)) return { ok: false, reason: 'All your Learned Arts slots are full. Forget one first.' };
    const ok = this.trainedClasses().some((cid) => this.borrowable(cid).some((b) => b.skill === skillId));
    if (!ok) return { ok: false, reason: 'You have not trained in that class.' };
    if (this.s.player.classes.some((c) => content.trees.find(c.classId)?.nodes.some((n) => n.skill === skillId))) return { ok: false, reason: 'That is already one of your own.' };
    if (!this.s.spendGold(this.studyCost(), 'study')) return { ok: false, reason: `Study costs ${this.studyCost()} gold.` };
    this.s.advanceTime(480);
    h.borrowed.push(skillId);
    this.s.bus.emit('toast', { kind: 'level', text: `You have learned ${content.skills.get(skillId).name}. It sits in your Learned Arts.` });
    this.s.bus.emit('stateChanged', { reason: 'borrow' });
    return { ok: true };
  }

  forgetArt(skillId: string): void {
    this.h.borrowed = this.h.borrowed.filter((x) => x !== skillId);
    this.s.bus.emit('stateChanged', { reason: 'borrow' });
  }

  // ------------------------------------------------------------ Sigils of the Old Faith

  /** Relic Tools come to you when you have done what they ask. */
  findTools(): void {
    const h = this.h;
    for (const t of RELIC_TOOLS) {
      if (h.tools.includes(t.id) || !evaluate(this.s.state, t.found)) continue;
      h.tools.push(t.id);
      this.s.bus.emit('toast', { kind: 'level', text: `A Relic Tool is yours: ${t.name}. ${t.text}` });
    }
  }

  /** Finds any sigil whose deed has been done. */
  findSigils(): void {
    const h = this.h;
    for (const sg of SIGILS) {
      if (h.sigilsFound.includes(sg.id) || !evaluate(this.s.state, sg.found)) continue;
      h.sigilsFound.push(sg.id);
      this.s.bus.emit('toast', { kind: 'quest', text: `A sigil of the Old Faith comes to you: ${sg.name}.` });
    }
  }

  /** Puts a found sigil in a slot (or takes it out). */
  slotSigil(id: string, over = false): { ok: boolean; reason?: string } {
    const h = this.h;
    if (!h.sigilsFound.includes(id)) return { ok: false, reason: 'You have not found that sigil.' };
    const at = h.sigils.findIndex((x) => x.id === id);
    if (at >= 0) {
      h.sigils.splice(at, 1);
      this.s.bus.emit('stateChanged', { reason: 'sigil' });
      return { ok: true };
    }
    if (h.sigils.length >= sigilSlots(this.s.player)) return { ok: false, reason: 'All your Sigil Slots are full.' };
    h.sigils.push({ id, over });
    this.s.bus.emit('stateChanged', { reason: 'sigil' });
    return { ok: true };
  }

  /** Overcharges or calms a slotted sigil. */
  overcharge(id: string): void {
    const sg = this.h.sigils.find((x) => x.id === id);
    if (sg) sg.over = !sg.over;
    this.s.bus.emit('stateChanged', { reason: 'sigil' });
  }

  // ------------------------------------------------------------ bonds

  private grow(bondId: string, points: number): void {
    const r = growBond(this.h, bondId, points);
    if (!r) return;
    const def = BONDS.find((b) => b.id === bondId);
    const who = def ? (def.kind === 'npc' ? content.npcs.get(def.ref).name : content.gods.get(def.ref).name) : bondId;
    this.s.bus.emit('toast', { kind: 'favor', text: `${who}: ${BOND_RANK_NAMES[r.to - 1]} (bond rank ${r.to}).` });
    this.grantPerks(bondId, r.to);
  }

  private grantPerks(bondId: string, rank: number): void {
    const def = BONDS.find((b) => b.id === bondId);
    if (!def) return;
    const claim = (kind: string): boolean => {
      const key = `${bondId}:${kind}`;
      if (this.h.claimed.includes(key)) return false;
      this.h.claimed.push(key);
      return true;
    };
    const skill = (id: string): void => {
      if (this.s.player.generalSkills[id]) this.s.addGold(this.s.player.level * 10, 'bond');
      else {
        // Taught by someone who knows you: no requirements, though it still has to be slotted to be used.
        this.s.player.generalSkills[id] = { rank: 1, xp: 0 };
        this.s.bus.emit('toast', { kind: 'info', text: `They teach you ${content.generalSkills.get(id).name}.` });
      }
    };
    if (rank >= BOND_PERK_RANKS.recipe && claim('recipe') && learnRecipe(this.s.player, def.recipe).ok) this.s.bus.emit('toast', { kind: 'info', text: `A recipe, across the table: ${content.recipes.get(def.recipe).name}.` });
    if (rank >= BOND_PERK_RANKS.skillA && claim('skillA')) skill(def.skills[0]);
    if (rank >= BOND_PERK_RANKS.gold && claim('gold')) {
      this.s.addGold(this.s.player.level * 60, 'bond');
      this.s.bus.emit('toast', { kind: 'info', text: 'A gift, pressed into your hand, with a look that means: do not mention it.' });
    }
    if (rank >= BOND_PERK_RANKS.skillB && claim('skillB')) skill(def.skills[1]);
  }

  /** Speaking to someone: a belief leans, and a bond grows a little (once a day). */
  talk(npcId: string): void {
    this.lean('talk', 1);
    const b = bondFor('npc', npcId);
    if (!b || this.h.bondDay[b.id] === this.day) return;
    this.h.bondDay[b.id] = this.day;
    this.grow(b.id, BOND_TALK_POINTS);
  }

  /** A quest finished for someone, or a festival kept. */
  questDone(giver: string | undefined, kind: string): void {
    const b = giver ? bondFor('npc', giver) : undefined;
    if (b) this.grow(b.id, BOND_QUEST_POINTS);
    if (kind === 'festival') this.lean('festival', 1);
  }

  /** Prayer or an offering at a shrine. */
  prayer(god: string, offering = false): void {
    if (!offering) this.lean('pray', 1);
    const b = bondFor('god', god);
    if (b) this.grow(b.id, offering ? BOND_OFFERING_POINTS : BOND_PRAYER_POINTS);
  }

  dungeon(): void {
    this.lean('dungeon', 1);
  }

  tale(): void {
    this.lean('tale', 1);
  }

  // ------------------------------------------------------------ Wayfarer's Arts

  art(): ArtDef | undefined {
    return ARTS.find((a) => a.classId === this.s.player.classes[0]?.classId);
  }

  artReady(): boolean {
    return this.h.artDay !== this.day;
  }

  useArt(): { ok: boolean; text: string } {
    const art = this.art();
    if (!art) return { ok: false, text: 'Your class has no field art.' };
    if (!this.artReady()) return { ok: false, text: 'You have already used it today. It comes back with the dawn.' };
    if (this.s.state.gameOver) return { ok: false, text: '' };
    const out = this.perform(art);
    if (!out.ok) return out;
    this.h.artDay = this.day;
    this.s.bus.emit('stateChanged', { reason: 'art' });
    return { ok: true, text: `${art.name}: ${art.text} ${out.text}`.trim() };
  }

  private perform(art: ArtDef): { ok: boolean; text: string } {
    const s = this.s;
    switch (art.effect) {
      case 'scout':
        s.state.world.grace = Math.max(s.state.world.grace, 80);
        return { ok: true, text: '(No random fights for the next eighty steps.)' };
      case 'reveal':
        s.world.revealAround(16);
        return { ok: true, text: '(The map is clearer.)' };
      case 'forage': {
        const z = s.world.zone;
        const pool = [...z.gather.herbalism, ...z.gather.mining];
        if (!pool.length) return { ok: true, text: '(There is nothing here worth gathering.)' };
        const id = pool[s.rng.int(0, pool.length - 1)] as string;
        const qty = 2 + s.rng.int(0, 2);
        s.items.give(createItem(id, qty, () => s.newUid()));
        return { ok: true, text: `(${qty} × ${content.items.get(id).name}.)` };
      }
      case 'haggle':
        this.h.haggleDay = this.day;
        return { ok: true, text: '(Shops are 10% cheaper until tomorrow.)' };
      case 'inquire': {
        const ch = s.realm.chronicle;
        const unknown = ch.events.filter((e) => ch.known[e.id] === undefined);
        const e = unknown[s.rng.int(0, Math.max(0, unknown.length - 1))];
        if (!e) return { ok: true, text: '(You already know every tale there is to hear.)' };
        ch.known[e.id] = 1;
        this.tale();
        return { ok: true, text: `(You hear of ${e.title}, in ${content.zones.get(e.zone).name}.)` };
      }
      case 'mend': {
        const members = [s.player, ...Object.values(s.state.party.companions).filter((c) => c.inParty).map((c) => c.character)];
        for (const ch of members) {
          const st = characterStats(ch);
          ch.hp = Math.min(st.maxHp, ch.hp + Math.round(st.maxHp / 3));
          ch.mp = Math.min(st.maxMp, ch.mp + Math.round(st.maxMp / 3));
        }
        return { ok: true, text: '(A third of everyone’s health and mana.)' };
      }
      case 'repair': {
        const worn = equippedItems(s.player).filter(([, i]) => i.durability && i.durability.current < i.durability.max).sort((a, b) => (a[1].durability!.current / a[1].durability!.max) - (b[1].durability!.current / b[1].durability!.max));
        for (const [, item] of worn.slice(0, 2)) repairItem(item);
        return { ok: true, text: worn.length ? '(Your two most worn pieces are good again.)' : '(Your gear is already in good order.)' };
      }
      case 'bless': {
        const god = s.player.devotion.patron ?? s.world.shrineGods()[0] ?? 'hesha';
        s.devotion.apply({ [god]: 12 }, 'art');
        return { ok: true, text: `(${content.gods.get(god).name} is pleased.)` };
      }
    }
  }

  artEffects = ART_EFFECTS;

  // ------------------------------------------------------------ Campfire Tales

  /** Which scene of a pair is next, and whether it can be heard now. */
  taleStatus(pair: TalePair): { heard: number; next?: number; reason?: string } {
    const heard = this.s.state.realm.tales[pair.id] ?? 0;
    if (heard >= 4) return { heard };
    const comp = this.s.state.party.companions;
    const a = comp[pair.a];
    const b = comp[pair.b];
    if (!a || !b || a.left || b.left) return { heard, next: heard, reason: 'Both must be travelling with you.' };
    const need = TALE_APPROVAL[heard] as number;
    if (a.approval < need || b.approval < need) return { heard, next: heard, reason: `Both must like you at least ${need}.` };
    if (this.s.state.realm.tales[`${pair.id}:day`] === this.day) return { heard, next: heard, reason: 'They have told their tale for today.' };
    return { heard, next: heard };
  }

  /** Hears the next scene. `choice` picks how you sit with it (a or b); both give each companion a little approval. */
  hearTale(pairId: string, choice: 'a' | 'b'): { ok: boolean; text: string; title?: string } {
    const pair = TALES.find((t) => t.id === pairId);
    if (!pair) return { ok: false, text: 'No such tale.' };
    const st = this.taleStatus(pair);
    if (st.reason || st.next === undefined) return { ok: false, text: st.reason ?? 'They have told all there is.' };
    const stage = pair.stages[st.next] as TalePair['stages'][number];
    this.s.state.realm.tales[pair.id] = st.next + 1;
    this.s.state.realm.tales[`${pair.id}:day`] = this.day;
    for (const id of [pair.a, pair.b]) this.s.party.adjust(id, TALE_GAIN, true);
    this.lean('talk', 3);
    if (st.next === 3) this.s.bus.emit('toast', { kind: 'favor', text: `${content.companions.get(pair.a).name} and ${content.companions.get(pair.b).name} have told their last tale. They will fight as one.` });
    this.s.bus.emit('stateChanged', { reason: 'tale' });
    return { ok: true, text: stage[choice][1], title: stage.title };
  }

  /** The party bonus for pairs who travel together: for every scene heard, a little more damage and health, for everyone. */
  taleModifiers(inParty: readonly string[]): { stat: string; type: 'flat' | 'more'; value: number }[] {
    let scenes = 0;
    for (const p of TALES) if (inParty.includes(p.a) && inParty.includes(p.b)) scenes += this.s.state.realm.tales[p.id] ?? 0;
    if (!scenes) return [];
    return [
      { stat: 'damageBonus', type: 'flat', value: scenes * TALE_BONUS.damageBonus },
      { stat: 'maxHp', type: 'more', value: scenes * TALE_BONUS.maxHp },
    ];
  }

  // ------------------------------------------------------------ the Sworn Bloodline

  /** A Hardcore hero has fallen: their family goes on. Returns the heir. */
  fall(by: string): Heir {
    const p = this.s.player;
    const bl = this.s.state.realm.bloodline;
    const patron = p.devotion.patron ?? p.devotion.apostle?.god ?? Object.keys(p.devotion.favor).sort((a, b) => (p.devotion.favor[b] ?? 0) - (p.devotion.favor[a] ?? 0))[0];
    const ancestor: Ancestor = { name: p.name, classId: p.classes[0]?.classId ?? 'warrior', level: p.level, by, day: this.day, generation: bl.generation, ...(patron ? { patron } : {}) };
    bl.ancestors.push(ancestor);
    const held = CONVICTIONS.filter((c) => this.holds(c.id)).sort((a, b) => b.need - a.need);
    const quirks = [...this.h.quirks];
    const rng = this.s.rng;
    const pool = QUIRKS.filter((q) => !quirks.includes(q.id));
    const extra = 1 + (bl.generation % BLOODLINE.quirkEvery === 0 ? 1 : 0);
    for (let i = 0; i < extra && pool.length; i++) quirks.push(pool.splice(rng.int(0, pool.length - 1), 1)[0]!.id);
    const surname = p.name.split(' ').slice(1).join(' ') || SURNAMES[rng.int(0, SURNAMES.length - 1)];
    const heir: Heir = {
      name: `${GIVEN[rng.int(0, GIVEN.length - 1)]} ${surname}`.trim(),
      raceId: p.raceId,
      classId: ancestor.classId,
      birthSignId: p.birthSignId,
      ...(p.backgroundId ? { backgroundId: p.backgroundId } : {}),
      difficulty: p.difficulty,
      gold: Math.floor(this.s.state.gold * BLOODLINE.goldShare),
      convictions: held.slice(0, BLOODLINE.inheritedConvictions).map((c) => c.id),
      quirks,
      ...(patron ? { patron } : {}),
      favor: patron ? Math.min(BLOODLINE.favorCap, Math.round(favorOf(p, patron) * BLOODLINE.favorShare)) : 0,
      skillPoints: Math.min(BLOODLINE.skillPointCap, bl.generation * BLOODLINE.skillPointsPerGeneration),
      generation: bl.generation + 1,
    };
    bl.heir = heir;
    return heir;
  }

  /** The heir takes up the oath: their inheritance is laid on a new game. */
  static inherit(session: GameSession, heir: Heir, ancestors: Ancestor[]): void {
    const h = heartOf(session.player);
    h.inherited = [...heir.convictions];
    h.quirks = [...heir.quirks];
    session.state.gold += heir.gold;
    session.state.realm.bloodline = { generation: heir.generation, ancestors };
    if (heir.patron && heir.favor > 0) session.devotion.apply({ [heir.patron]: heir.favor }, 'bloodline', true);
    const cls = session.player.classes[0];
    if (cls) cls.skillPoints += heir.skillPoints;
  }
}
