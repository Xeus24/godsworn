import './style.css';
import './ui/inventory/inventory.css';
import './ui/combat/combat.css';
import './ui/tree/tree.css';
import './ui/general/general.css';
import './ui/pantheon/pantheon.css';
import { content, validateContent } from './data';
import type { Character } from './engine/character/types';
import { GameSession } from './engine/state/gameState';
import type { EncounterDef } from './engine/combat/types';
import type { Battle } from './engine/combat/battle';
import { createEncounterBattle } from './engine/combat/setup';
import { timeOfDay } from './engine/state/clock';
import { CharacterScreen } from './ui/character/characterScreen';
import { CombatScreen, inventoryHooks } from './ui/combat/combatScreen';
import { ProvingGroundsScreen } from './ui/combat/provingGrounds';
import type { Nav } from './ui/components/navBar';
import { Toasts } from './ui/components/toasts';
import { CreationScreen } from './ui/creation/creationScreen';
import { registerCoreSections } from './ui/debug/coreSections';
import { DebugPanel } from './ui/debug/debugPanel';
import { GeneralScreen } from './ui/general/generalScreen';
import { registerItemSections } from './ui/debug/itemSections';
import { InventoryScreen } from './ui/inventory/inventoryScreen';
import { PantheonScreen } from './ui/pantheon/pantheonScreen';
import { ScreenManager } from './ui/screen';
import { TitleScreen } from './ui/title/titleScreen';
import { TreeScreen } from './ui/tree/treeScreen';
import { MarketScreen } from './ui/world/marketScreen';
import { TownScreen } from './ui/world/townScreen';
import { WorkshopScreen } from './ui/world/workshopScreen';
import { WorldScreen } from './ui/world/worldScreen';
import './ui/world/world.css';

validateContent();

const root = document.getElementById('app');
if (!root) throw new Error('#app element missing');

let session: GameSession | undefined;
/** Screen hotkeys are disabled mid-battle. */
let inBattle = false;
/** The fight in progress (for console poking). */
let currentBattle: Battle | undefined;
const screens = new ScreenManager(root);
const toasts = new Toasts();
const debug = new DebugPanel();
registerCoreSections(debug, () => session);
registerItemSections(debug, () => session);

const nav: Nav = {
  title: showTitle,
  character: showCharacter,
  inventory: showInventory,
  skills: showSkills,
  general: showGeneral,
  pantheon: showPantheon,
  world: showWorld,
};

function showTitle(): void {
  const items = [{ label: 'New Game', onSelect: showCreation }];
  if (session) items.unshift({ label: 'Resume', onSelect: showWorld });
  screens.show(new TitleScreen(items, `Godsworn v${__APP_VERSION__}  ·  Phase 11: the economy`));
}

function showCreation(): void {
  screens.show(new CreationScreen(startGame, showTitle));
}

function startGame(hero: Character): void {
  session = GameSession.newGame(Math.floor(Math.random() * 2 ** 32), hero);
  session.bus.on('toast', ({ kind, text }) => toasts.show(kind, text));
  session.bus.on('timeChanged', ({ day, hour }) => debug.log(`time -> day ${day}, ${hour}:00`));
  toasts.show('info', `${hero.name} swears the oath.`);
  showTown(session.world.inTown() ?? 'brightwater');
}

function showCharacter(): void {
  if (session) screens.show(new CharacterScreen(session, nav));
}

function showInventory(): void {
  if (session) screens.show(new InventoryScreen(session, nav));
}

function showSkills(): void {
  if (session) screens.show(new TreeScreen(session, nav));
}

function showGeneral(): void {
  if (session) screens.show(new GeneralScreen(session, nav));
}

function showPantheon(): void {
  if (session) screens.show(new PantheonScreen(session, nav, startFight));
}

function showGrounds(): void {
  if (session) screens.show(new ProvingGroundsScreen(session, nav, (enc) => startFight(enc), showWorld));
}

/** The overworld, or the town screen when you are standing in a town you just entered. */
function showWorld(): void {
  if (session) screens.show(new WorldScreen(session, nav, (enc, level) => startFight(enc, level, true), showTown));
}

function showTown(town: string): void {
  if (session) screens.show(new TownScreen(session, nav, { arena: showGrounds, market: () => showMarket(town), workshop: () => showWorkshop(town), leave: showWorld }, town));
}

function showMarket(town: string): void {
  if (session) screens.show(new MarketScreen(session, nav, town, () => showTown(town)));
}

function showWorkshop(town: string): void {
  if (session) screens.show(new WorkshopScreen(session, nav, () => showTown(town)));
}

/**
 * Starts a fight; `level` overrides enemy levels (world fights and apostle
 * trials scale to the hero). World fights use the zone's weather and cannot
 * be replayed.
 */
function startFight(encounter: EncounterDef, level?: number, world = false): void {
  const s = session;
  if (!s) return;
  inBattle = true;
  const punisher = s.devotion.punisherForFight();
  const battle = createEncounterBattle(s.player, encounter, {
    rng: s.rng,
    hooks: inventoryHooks(s),
    timeOfDay: timeOfDay(s.state.clock),
    weather: s.world.weatherNow(),
    punisher,
    ...(level !== undefined ? { level } : {}),
  });
  currentBattle = battle;
  if (punisher) toasts.show('warning', `${content.gods.get(punisher).name} sends a herald to punish you!`);
  screens.show(
    new CombatScreen({
      session: s,
      battle,
      onExit: () => {
        inBattle = false;
        if (s.state.gameOver) {
          session = undefined;
          showTitle();
        } else showWorld();
      },
      ...(world ? {} : { onRematch: () => startFight(encounter, level) }),
    }),
  );
}

window.addEventListener('keydown', (e) => {
  const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement;
  if (typing || e.metaKey || e.ctrlKey || e.altKey || !session || inBattle) return;
  const key = e.key.toLowerCase();
  if (key === 'c') showCharacter();
  if (key === 'i') showInventory();
  if (key === 'g') showWorld();
  if (key === 'k') showSkills();
  if (key === 'j') showGeneral();
  if (key === 'p') showPantheon();
});

showTitle();

// Exposed for console poking during development.
Object.assign(window, { godsworn: { get session() { return session; }, get battle() { return currentBattle; } } });
