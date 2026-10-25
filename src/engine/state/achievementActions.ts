import { grantMount, grantPet } from '../character/stable';
import { content } from '../../data';
import { ACHIEVEMENT_MILESTONES } from '../../data/achievements';
import type { AchievementDef } from '../achievements/types';
import { evaluate } from '../quests/conditions';
import type { GameSession } from './gameState';

export type TitleResult = { ok: true } | { ok: false; reason: string };

/**
 * Achievements and titles. Every achievement is a condition over the game
 * state, checked whenever something meaningful happens; earning one can
 * grant a title (and gold). The hero may show one title beside their name.
 */
export class AchievementActions {
  private checking = false;

  constructor(private readonly s: GameSession) {
    const check = (): void => {
      this.check();
    };
    s.bus.on('stateChanged', check);
    s.bus.on('levelUp', check);
    s.bus.on('questComplete', check);
    s.bus.on('devotionTierChanged', check);
    s.bus.on('apostleAscension', check);
    s.bus.on('itemLooted', check);
  }

  earned(id: string): boolean {
    return this.s.state.achievements[id] !== undefined;
  }

  points(): number {
    return Object.keys(this.s.state.achievements).reduce((sum, id) => sum + (content.achievements.find(id)?.points ?? 0), 0);
  }

  /** Earns every achievement whose condition now holds. Returns the ones earned. */
  check(): AchievementDef[] {
    if (this.checking) return [];
    this.checking = true;
    const earned: AchievementDef[] = [];
    try {
      // Earning some can complete others ("earn 25 achievements"), so repeat until nothing changes.
      for (let more = true; more; ) {
        more = false;
        for (const def of content.achievements.all()) {
          if (this.earned(def.id) || !evaluate(this.s.state, def.check)) continue;
          this.unlock(def);
          earned.push(def);
          more = true;
        }
      }
    } finally {
      this.checking = false;
    }
    return earned;
  }

  private unlock(def: AchievementDef): void {
    const s = this.s;
    s.state.achievements[def.id] = s.state.clock.day;
    const p = s.player;
    const before = p.achievementPoints ?? 0;
    p.achievementPoints = before + def.points;
    for (const m of ACHIEVEMENT_MILESTONES) {
      if (before < m.points && p.achievementPoints >= m.points) s.bus.emit('toast', { kind: 'level', text: `Achievement milestone, ${m.points} points: ${m.description}` });
    }
    if (def.title && !p.devotion.titles.includes(def.title)) p.devotion.titles.push(def.title);
    if (def.gold) s.addGold(def.gold, 'achievement');
    if (def.pet && grantPet(p, def.pet)) s.bus.emit('toast', { kind: 'loot', text: `A new pet: ${content.pets.get(def.pet).name}!` });
    if (def.mount && grantMount(p, def.mount)) s.bus.emit('toast', { kind: 'loot', text: `A new mount: ${content.mounts.get(def.mount).name}!` });
    s.bus.emit('achievementUnlocked', { achievementId: def.id });
    s.bus.emit('toast', { kind: 'achievement', text: `Achievement: ${def.name}${def.title ? ` (title: ${def.title})` : ''}` });
  }

  /** Titles you have earned (achievements, quests, Apostleship). */
  titles(): string[] {
    return this.s.player.devotion.titles;
  }

  /** Shows an earned title beside your name, or none. */
  setTitle(title: string | undefined): TitleResult {
    if (title !== undefined && !this.titles().includes(title)) return { ok: false, reason: 'You have not earned that title.' };
    if (title === undefined) delete this.s.player.title;
    else this.s.player.title = title;
    this.s.bus.emit('stateChanged', { reason: 'title' });
    return { ok: true };
  }
}
