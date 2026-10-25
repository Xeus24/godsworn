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
import { registerQuestSections } from './ui/debug/questSections';
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
import './ui/quests/quests.css';
import type { Conversation, ConversationOutcome } from './engine/state/conversation';
import { DialogueOverlay, EndingOverlay } from './ui/quests/dialogueOverlay';
import { QuestLogScreen } from './ui/quests/questLog';
import { PartyScreen } from './ui/party/partyScreen';
import { CodexScreen } from './ui/codex/codexScreen';
import { EndgameScreen } from './ui/endgame/endgameScreen';
import type { ModifierSpec } from './engine/stats/modifiers';
import './ui/codex/codex.css';

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
registerQuestSections(debug, () => session);

const nav: Nav = {
  title: showTitle,
  character: showCharacter,
  inventory: showInventory,
  skills: showSkills,
  general: showGeneral,
  pantheon: showPantheon,
  quests: showQuests,
  party: showParty,
  codex: showCodex,
  world: showWorld,
};

/** The conversation on screen, if any (screen hotkeys pause while it is open). */
let dialogue: DialogueOverlay | undefined;

/**
 * Opens a conversation over the current screen. When it closes, a fight it
 * started begins, or the story's ending is shown.
 */
function talk(conv: Conversation): void {
  dialogue?.close();
  dialogue = new DialogueOverlay(conv, (outcome: ConversationOutcome) => {
    dialogue = undefined;
    const s = session;
    if (!s) return;
    if (outcome.fight) {
      const { encounter, level } = s.quests.fightFor(outcome.fight);
      startFight(encounter, level, true);
    } else if (outcome.ending) showEnding();
  });
  document.body.append(dialogue.element);
}

function showEnding(): void {
  const s = session;
  if (!s?.state.quests.ending || s.state.quests.ending.seen) return;
  document.body.append(new EndingOverlay(s, () => showWorld()).element);
}

function showTitle(): void {
  const items = [{ label: 'New Game', onSelect: showCreation }];
  if (session) items.unshift({ label: 'Resume', onSelect: showWorld });
  screens.show(new TitleScreen(items, `Godsworn v${__APP_VERSION__}  ·  Phase 13: bosses, bestiary and achievements`));
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

function showQuests(): void {
  if (session) screens.show(new QuestLogScreen(session, nav));
}

function showParty(): void {
  if (session) screens.show(new PartyScreen(session, nav, talk));
}

function showCodex(): void {
  if (session) screens.show(new CodexScreen(session, nav));
}

function showEndgame(): void {
  if (session) screens.show(new EndgameScreen(session, nav, startGauntletFight, () => showTown(session?.world.inTown() ?? 'brightwater')));
}

/** The next fight of the Rift or Boss Rush in progress. */
function startGauntletFight(): void {
  const f = session?.endgame.nextFight();
  if (f) startFight(f.encounter, f.level, false, { enemyModifiers: f.enemyModifiers, partyModifiers: f.partyModifiers });
}

function showPantheon(): void {
  if (session) screens.show(new PantheonScreen(session, nav, startFight));
}

function showGrounds(): void {
  if (session) screens.show(new ProvingGroundsScreen(session, nav, (enc) => startFight(enc), showWorld, talk));
}

/** The overworld, or the town screen when you are standing in a town you just entered. */
function showWorld(): void {
  if (session) screens.show(new WorldScreen(session, nav, (enc, level) => startFight(enc, level, true), showTown, talk));
}

function showTown(town: string): void {
  if (session) screens.show(new TownScreen(session, nav, { arena: showGrounds, market: () => showMarket(town), workshop: () => showWorkshop(town), endgame: showEndgame, leave: showWorld, talk }, town));
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
/** A fight that is part of a Rift or the Boss Rush: its affixes, and where to go when it ends. */
interface GauntletOptions {
  enemyModifiers: ModifierSpec[];
  partyModifiers: ModifierSpec[];
}

function startFight(encounter: EncounterDef, level?: number, world = false, gauntlet?: GauntletOptions): void {
  const s = session;
  if (!s) return;
  inBattle = true;
  const punisher = s.devotion.punisherForFight();
  const follower = s.devotion.follower();
  const battle = createEncounterBattle(s.player, encounter, {
    rng: s.rng,
    hooks: inventoryHooks(s),
    timeOfDay: timeOfDay(s.state.clock),
    weather: s.world.weatherNow(),
    punisher,
    companions: s.party.battleMembers(),
    guests: [...s.quests.guests(), ...(follower ? [{ id: 'follower', enemyId: follower, ally: true }] : [])],
    // Rifts and the Boss Rush are already set at your level: no NG+ stretching.
    ...(gauntlet ? { enemyModifiers: gauntlet.enemyModifiers, partyModifiers: gauntlet.partyModifiers } : { ngPlus: s.state.ngPlus }),
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
        } else if (gauntlet) {
          showEndgame();
        } else {
          showWorld();
          showEnding();
        }
      },
      ...(world || gauntlet ? {} : { onRematch: () => startFight(encounter, level) }),
    }),
  );
}

window.addEventListener('keydown', (e) => {
  const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement;
  if (typing || e.metaKey || e.ctrlKey || e.altKey || !session || inBattle || dialogue) return;
  const key = e.key.toLowerCase();
  if (key === 'c') showCharacter();
  if (key === 'i') showInventory();
  if (key === 'g') showWorld();
  if (key === 'k') showSkills();
  if (key === 'l') showGeneral();
  if (key === 'j') showQuests();
  if (key === 'o') showParty();
  if (key === 'b') showCodex();
  if (key === 'p') showPantheon();
});

showTitle();

// Exposed for console poking during development.
Object.assign(window, { godsworn: { get session() { return session; }, get battle() { return currentBattle; } } });
