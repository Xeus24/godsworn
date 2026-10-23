import './style.css';
import { validateContent } from './data';
import { GameSession } from './engine/state/gameState';
import { registerCoreSections } from './ui/debug/coreSections';
import { DebugPanel } from './ui/debug/debugPanel';
import { ScreenManager } from './ui/screen';
import { TitleScreen } from './ui/title/titleScreen';

validateContent();

const root = document.getElementById('app');
if (!root) throw new Error('#app element missing');

let session = GameSession.newGame(Math.floor(Math.random() * 2 ** 32));

const debug = new DebugPanel();
registerCoreSections(debug, () => session);
session.bus.on('timeChanged', ({ day, hour }) => debug.log(`time -> day ${day}, ${hour}:00`));

const screens = new ScreenManager(root);
screens.show(new TitleScreen([], `Godsworn v${__APP_VERSION__}  ·  Phase 1: engine core`));

// Exposed for console poking during development.
Object.assign(window, { godsworn: { get session() { return session; }, set session(s: GameSession) { session = s; } } });
