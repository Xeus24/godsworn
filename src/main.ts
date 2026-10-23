import './style.css';
import { validateContent } from './data';
import type { Character } from './engine/character/types';
import { GameSession } from './engine/state/gameState';
import { CharacterScreen } from './ui/character/characterScreen';
import { Toasts } from './ui/components/toasts';
import { CreationScreen } from './ui/creation/creationScreen';
import { registerCoreSections } from './ui/debug/coreSections';
import { DebugPanel } from './ui/debug/debugPanel';
import { ScreenManager } from './ui/screen';
import { TitleScreen } from './ui/title/titleScreen';

validateContent();

const root = document.getElementById('app');
if (!root) throw new Error('#app element missing');

let session: GameSession | undefined;
const screens = new ScreenManager(root);
const toasts = new Toasts();
const debug = new DebugPanel();
registerCoreSections(debug, () => session);

function showTitle(): void {
  const items = [{ label: 'New Game', onSelect: showCreation }];
  if (session) items.unshift({ label: 'Resume', onSelect: showCharacter });
  screens.show(new TitleScreen(items, `Godsworn v${__APP_VERSION__}  ·  Phase 2: characters`));
}

function showCreation(): void {
  screens.show(new CreationScreen(startGame, showTitle));
}

function startGame(hero: Character): void {
  session = GameSession.newGame(Math.floor(Math.random() * 2 ** 32), hero);
  session.bus.on('toast', ({ kind, text }) => toasts.show(kind, text));
  session.bus.on('timeChanged', ({ day, hour }) => debug.log(`time -> day ${day}, ${hour}:00`));
  toasts.show('info', `${hero.name} swears the oath.`);
  showCharacter();
}

function showCharacter(): void {
  if (session) screens.show(new CharacterScreen(session, showTitle));
}

window.addEventListener('keydown', (e) => {
  const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
  if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key.toLowerCase() === 'c' && session) showCharacter();
});

showTitle();

// Exposed for console poking during development.
Object.assign(window, { godsworn: { get session() { return session; } } });
