import './style.css';
import './ui/inventory/inventory.css';
import './ui/combat/combat.css';
import './ui/tree/tree.css';
import './ui/general/general.css';
import './ui/pantheon/pantheon.css';
import { content, validateContent } from './data';
import { endgameUnlocked } from './engine/endgame/unlocked';
import { endgameSeen, highestNgPlus, recordEndgame, recordNgPlus } from './ui/profile';
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
import { AUTOSAVE_SLOT, SaveSlots, serialize, type SaveStore } from './engine/state/save';
import { HelpOverlay, PauseMenu, SaveLoadScreen, SettingsOverlay, UnlockOverlay } from './ui/menu/menus';
import { applySettings, settings, updateSettings } from './ui/settings';
import './ui/menu/menu.css';
import { audio } from './ui/audio/audio';
import { syncAreaAudio } from './ui/audio/areaAudio';
import { moodForTown } from './ui/audio/musicFiles';
import { CodexScreen } from './ui/codex/codexScreen';
import { EndgameScreen } from './ui/endgame/endgameScreen';
import type { ModifierSpec } from './engine/stats/modifiers';
import './ui/codex/codex.css';

validateContent();

const root = document.getElementById('app');
if (!root) throw new Error('#app element missing');

let session: GameSession | undefined;

/** Saves live in localStorage (if the browser allows it; otherwise only for this page). */
const memory = new Map<string, string>();
const browserStore: SaveStore = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return memory.get(k) ?? null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      memory.set(k, v);
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      memory.delete(k);
    }
  },
  keys: () => {
    try {
      return Object.keys(localStorage);
    } catch {
      return [...memory.keys()];
    }
  },
};
const saves = new SaveSlots(browserStore);
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
  title: openMenu,
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
  const latest = saves.latest();
  if (saves.list().length) items.unshift({ label: 'Load Game', onSelect: () => showSaves('load') });
  if (latest && !session) items.unshift({ label: `Continue (${latest.name}, level ${latest.level})`, onSelect: () => loadSlot(latest.slot) });
  if (session) items.unshift({ label: 'Resume', onSelect: showWorld });
  items.push({ label: 'Settings', onSelect: () => new SettingsOverlay().open() });
  audio().setTrack('title');
  screens.show(new TitleScreen(items, `Godsworn v${__APP_VERSION__}`));
}

/** The save slots screen; loading a slot replaces the running game. */
function showSaves(mode: 'save' | 'load'): void {
  screens.show(new SaveLoadScreen(saves, mode, session, loadSlot, () => (session ? showWorld() : showTitle())));
}

/** Loads a slot and enters the game where it was saved. Returns an error, if any. */
function loadSlot(slot: string): string | undefined {
  const result = saves.load(slot);
  if (!result.ok) return result.reason;
  attach(result.session);
  toasts.show('info', `Welcome back, ${result.session.player.name}.`);
  const town = result.session.world.inTown();
  if (town) showTown(town);
  else showWorld();
  return undefined;
}

/** Makes a session the running game: toasts, debug log, autosave and play time. */
function attach(s: GameSession): void {
  session = s;
  lastAutosave = Date.now();
  recordNgPlus(s.state.ngPlus);
  checkEndgame(s, false);
  s.bus.on('toast', ({ kind, text }) => {
    toasts.show(kind, text);
    if (kind === 'level') audio().play('levelUp');
    else if (kind === 'loot') audio().play('loot');
    else if (kind === 'achievement') audio().play('achievement');
    else if (kind === 'warning') audio().play('warning');
  });
  s.bus.on('timeChanged', ({ day, hour }) => debug.log(`time -> day ${day}, ${hour}:00`));
  s.bus.on('levelUp', () => checkEndgame(s, true));
  s.bus.on('stateChanged', ({ reason }) => {
    checkEndgame(s, true);
    if (reason === 'ngPlus') {
      const before = highestNgPlus();
      recordNgPlus(s.state.ngPlus);
      for (const race of content.races.all()) {
        if (race.unlock && race.unlock.ngPlus > before && race.unlock.ngPlus <= s.state.ngPlus) {
          toasts.show('level', `New race unlocked for new heroes: ${race.name}!`);
          new UnlockOverlay(`New race unlocked: ${race.name}`, [race.flavor.lore, `${race.passive.name}: ${race.passive.description}`, 'Choose it when you create a new hero.']).open();
        }
      }
    }
    if (reason === 'battle' || reason === 'ngPlus' || reason === 'quest') autosave(reason === 'battle' ? 0 : AUTOSAVE_EVERY_MS);
  });
}

/** Notices when the hero reaches endgame: remembers it for the player and (once per legend) announces what opened up. */
function checkEndgame(s: GameSession, announce: boolean): void {
  if (!endgameUnlocked(s.state)) return;
  const first0 = !endgameSeen();
  recordEndgame();
  const key = 'legacy:endgameAnnounced';
  if (s.state.flags[key]) return;
  s.state.flags[key] = true;
  if (!announce) return;
  toasts.show('level', 'Endgame reached!');
  new UnlockOverlay('Endgame unlocked', [
    'You have reached the endgame. New things have opened up:',
    'Rift Gate & Boss Rush: visit any town to open Rifts, or fight every dungeon boss in a row.',
    'Stables, the Paragon board, item Ascension and the Defender path are now open.',
    s.state.quests.ending ? 'New Game+ is ready: begin it from the Legacy panel on your Character sheet.' : 'Finish the story to unlock New Game+ (the Legacy panel on your Character sheet).',
    ...(first0 ? ['New heroes can now take Challenge modes at creation, and the New Game+ races will show as you earn them.'] : []),
  ]).open();
}

const AUTOSAVE_EVERY_MS = 5 * 60 * 1000;
let lastAutosave = 0;

/** Autosaves (when enabled) if at least `minGap` ms passed since the last one; never mid-battle or for a fallen hero. */
function autosave(minGap = AUTOSAVE_EVERY_MS): void {
  const s = session;
  if (!s || !settings().autosave || s.state.gameOver || inBattle) return;
  if (Date.now() - lastAutosave < minGap) return;
  lastAutosave = Date.now();
  try {
    saves.save(AUTOSAVE_SLOT, s);
    mirrorToFolder(AUTOSAVE_SLOT, s);
  } catch {
    toasts.show('warning', 'Autosave failed: browser storage is full or unavailable.');
  }
}

/** Also writes the save into the project's `saves/` folder when the dev or preview server is running (silently skipped otherwise). */
function mirrorToFolder(slot: string, s: GameSession): void {
  void fetch(`/__godsworn/save?name=${encodeURIComponent(slot)}`, { method: 'POST', body: serialize(s) }).catch(() => undefined);
}

function openMenu(): void {
  new PauseMenu({
    save: () => showSaves('save'),
    load: () => showSaves('load'),
    quit: () => {
      autosave(0);
      showTitle();
    },
  }).open();
}

function showCreation(): void {
  screens.show(new CreationScreen(startGame, showTitle));
}

function startGame(hero: Character): void {
  const s = GameSession.newGame(Math.floor(Math.random() * 2 ** 32), hero);
  attach(s);
  toasts.show('info', `${hero.name} swears the oath.`);
  autosave(0);
  showTown(s.world.inTown() ?? 'brightwater');
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
  if (session) syncAreaAudio(session);
  if (session) screens.show(new WorldScreen(session, nav, (enc, level) => startFight(enc, level, true), showTown, talk));
}

function showTown(town: string): void {
  audio().setTrack(moodForTown(town));
  audio().setWeather(undefined);
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
  audio().setTrack(encounter.isBoss ? 'boss' : 'battle');
  if (punisher) toasts.show('warning', `${content.gods.get(punisher).name} sends a herald to punish you!`);
  screens.show(
    new CombatScreen({
      session: s,
      battle,
      biome: s.world.map.biome,
      onExit: () => {
        inBattle = false;
        if (s.state.gameOver) {
          // Hardcore: the legend is over, and so are its saves.
          saves.removeCharacter(s.player.id);
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
  if (document.querySelector('.menu-overlay, .dialogue-overlay')) return;
  if (e.key === 'Escape') {
    // Screens that use Esc themselves (leave town, back) mark it handled; otherwise it opens the menu.
    window.setTimeout(() => {
      if (!e.defaultPrevented && session && !inBattle && !document.querySelector('.menu-overlay, .dialogue-overlay')) openMenu();
    });
    return;
  }
  if (e.key === '?') return new HelpOverlay().open();
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
  if (key === 'n') audio().skip();
  if (key === 'u') {
    updateSettings({ muted: !settings().muted });
    toasts.show('info', settings().muted ? 'Sound muted (U to unmute).' : 'Sound on.');
  }
});

// Name the recorded track when it changes, so a tune you like can be looked up.
audio().onNowPlaying((track) => {
  if (track && session && !inBattle) toasts.show('info', `\u266a ${track.title} \u2014 ${track.artist}`);
});

// Play time counts while a game is running (paused while the tab is hidden).
window.setInterval(() => {
  if (session && !document.hidden) session.state.meta.playTimeMs += 1000;
}, 1000);
// Autosave every few minutes, and when the tab is hidden or closed.
window.setInterval(() => autosave(), 30_000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) autosave(0);
});
window.addEventListener('pagehide', () => autosave(0));

applySettings();
// A soft click for every button.
document.addEventListener('click', (e) => {
  if (e.target instanceof HTMLButtonElement && !e.target.disabled) audio().play('click');
});
showTitle();

// Exposed for console poking during development.
Object.assign(window, { godsworn: { get session() { return session; }, get battle() { return currentBattle; } } });
