import { settings } from '../settings';

export type PadLayout = 'xbox' | 'playstation';
export type PadContext = 'world' | 'battle' | 'dialogue' | 'menu' | 'screen';
export interface Prompt {
  button: string;
  label: string;
}

const GLYPHS: Record<PadLayout, Record<'A' | 'B' | 'X' | 'Y' | 'LB' | 'RB' | 'Start', string>> = {
  xbox: { A: 'A', B: 'B', X: 'X', Y: 'Y', LB: 'LB', RB: 'RB', Start: '≡' },
  playstation: { A: '✕', B: '○', X: '□', Y: '△', LB: 'L1', RB: 'R1', Start: 'Options' },
};

/** DualShock, DualSense and anything that says so in its id (Chrome lists "054c" for Sony) gets the Sony symbols. */
export function layoutOf(id: string): PadLayout {
  return /054c|playstation|dualshock|dualsense|sony|wireless controller/i.test(id) ? 'playstation' : 'xbox';
}

/** What each button does right now, as the controller scheme in `globalPad.ts` maps it. */
export function promptsFor(context: PadContext, layout: PadLayout = 'xbox'): Prompt[] {
  const g = GLYPHS[layout];
  const p = (b: keyof typeof g, label: string): Prompt => ({ button: g[b], label });
  switch (context) {
    case 'battle':
      return [p('A', 'Choose'), p('B', 'Back'), p('X', 'Wait'), p('Start', 'Menu')];
    case 'dialogue':
      return [p('A', 'Continue'), p('B', 'Leave')];
    case 'menu':
      return [p('A', 'Select'), p('B', 'Close')];
    case 'screen':
      return [p('A', 'Select'), p('B', 'Back'), p('X', 'Act'), p('Y', 'Inventory'), p('LB', 'Prev tab'), p('RB', 'Next tab')];
    default:
      return [p('A', 'Interact'), p('B', 'Menu'), p('X', 'Act'), p('Y', 'Inventory'), p('LB', 'Prev screen'), p('RB', 'Next screen')];
  }
}

function contextNow(): PadContext {
  if (document.querySelector('.combat-overlay:not(.hidden)')) return 'battle';
  if (document.querySelector('.dialogue-overlay')) return 'dialogue';
  if (document.querySelector('.menu-overlay')) return 'menu';
  const active = document.querySelector('nav.tabs .tab.active')?.textContent?.trim().toLowerCase();
  return !active || active === 'world' || active === 'map' ? 'world' : 'screen';
}

/** A strip along the bottom of the page that names the controller buttons while a pad is connected. */
export function startPadPrompts(): void {
  if (typeof document === 'undefined' || document.getElementById('pad-prompts')) return;
  const bar = document.createElement('div');
  bar.id = 'pad-prompts';
  bar.setAttribute('aria-hidden', 'true');
  bar.hidden = true;
  document.body.append(bar);
  let last = '';
  const refresh = (): void => {
    const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter((x): x is Gamepad => !!x) : [];
    const first = pads[0];
    bar.hidden = !first || !settings().padPrompts;
    if (!first || bar.hidden) return;
    const list = promptsFor(contextNow(), layoutOf(first.id));
    const html = list.map((x) => `<span><b>${x.button}</b>${x.label}</span>`).join('');
    if (html !== last) {
      bar.innerHTML = html;
      last = html;
    }
  };
  window.addEventListener('gamepadconnected', refresh);
  window.addEventListener('gamepaddisconnected', refresh);
  setInterval(refresh, 400);
  refresh();
}
