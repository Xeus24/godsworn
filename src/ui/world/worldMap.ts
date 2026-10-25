import { worldLevel } from '../../engine/ngplus/ngplus';
import { content } from '../../data';
import { FAST_TRAVEL_GOLD_PER_LEVEL, exploredShare } from '../../engine/world/world';
import { mapFor } from '../../engine/world/mapgen';
import type { GameSession } from '../../engine/state/gameState';
import { el } from '../screen';

/**
 * The world map (M): every zone along the road with its level range, how
 * much you have explored, its waypoint (fast travel), dungeons and boss;
 * plus your lore journal and trophies.
 */
export class WorldMapOverlay {
  readonly element: HTMLElement;
  private message = '';

  constructor(
    private readonly session: GameSession,
    private readonly onClose: () => void,
  ) {
    this.element = el('div', { class: 'world-map-overlay', role: 'dialog', 'aria-label': 'World map' });
    this.render();
  }

  close(): void {
    this.element.remove();
  }

  private render(): void {
    const s = this.session;
    const w = s.state.world;
    const here = s.world.zone.id;
    const cost = FAST_TRAVEL_GOLD_PER_LEVEL * s.player.level;
    // Quest markers by zone (a dungeon's markers count for its zone).
    const markers = s.quests.markers();
    const zoneOfMap = (map: string): string => content.dungeons.find(map)?.zone ?? map;
    const zones = content.zones.all().sort((a, b) => a.order - b.order).map((z) => {
      const map = mapFor(z.id);
      const share = exploredShare(w, map);
      const known = share > 0 || w.waypoints.includes(z.id);
      const travel = el('button', {}, z.id === here ? 'You are here' : `Travel (${cost}g)`);
      travel.disabled = z.id === here || !w.waypoints.includes(z.id);
      travel.addEventListener('click', () => {
        const r = s.world.fastTravel(z.id);
        if (r.ok) this.onClose();
        else {
          this.message = r.reason;
          this.render();
        }
      });
      const boss = content.enemies.get(z.worldBoss);
      return el(
        'div',
        { class: `map-zone${z.id === here ? ' here' : ''}${known ? '' : ' unknown'}` },
        el('b', {}, known ? z.name : '???'),
        el('div', { class: 'dim small' }, `Levels ${worldLevel(z.levels[0], s.state.ngPlus)}-${worldLevel(z.levels[1], s.state.ngPlus)} · ${Math.round(share * 100)}% explored`),
        ...(known
          ? [
              el('div', { class: 'small' }, z.town ? `Town: ${content.towns.get(z.town).name}` : 'No town'),
              el('div', { class: 'small' }, `Dungeons: ${z.dungeons.map((d) => `${content.dungeons.get(d).name}${w.dungeonsCleared.includes(d) ? ' ✓' : ''}`).join(', ')}`),
              el('div', { class: 'small' }, `World boss: ${boss.name}${s.player.world.trophies[boss.id] ? ' ✓' : ''}`),
              el('div', { class: 'small' }, `Shrines: ${z.shrines.map((g) => content.gods.get(g).name).join(', ')}`),
            ]
          : [el('div', { class: 'dim small' }, z.description)]),
        el('div', { class: 'small' }, w.waypoints.includes(z.id) ? 'Waypoint attuned' : 'Waypoint not found'),
        ...[...new Set(markers.filter((m) => zoneOfMap(m.map) === z.id).map((m) => m.quest))].map((q) => el('div', { class: `small map-quest${q === s.state.quests.tracked ? ' tracked' : ''}` }, `${q === s.state.quests.tracked ? '◆' : '!'} ${content.quests.get(q).name}`)),
        travel,
      );
    });
    const lore = content.lore.filter((l) => w.lore.includes(l.id));
    const close = el('button', {}, 'Close (M)');
    close.addEventListener('click', () => this.onClose());
    this.element.replaceChildren(
      el(
        'div',
        { class: 'panel world-map' },
        el('div', { class: 'world-map-head' }, el('h2', {}, 'The Road'), close),
        ...(this.message ? [el('div', { class: 'field-error' }, this.message)] : []),
        el('div', { class: 'map-road' }, ...zones),
        el('h3', {}, `Lore (${lore.length}/${content.lore.size})`),
        el('div', { class: 'map-lore' }, ...(lore.length ? lore.map((l) => el('details', {}, el('summary', {}, l.title), el('p', { class: 'small' }, l.text))) : [el('p', { class: 'dim small' }, 'Lore pages lie around the world, some behind cracked walls.')])),
        el('h3', {}, 'Trophies'),
        el('p', { class: 'small' }, Object.keys(s.player.world.trophies).map((id) => `${content.enemies.get(id).name} ×${s.player.world.trophies[id]}`).join(', ') || 'No world bosses slain yet.'),
      ),
    );
  }
}
