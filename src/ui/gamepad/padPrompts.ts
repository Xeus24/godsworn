import { settings } from '../settings';
import { padBinding, type PadBindings } from './globalPad';

export type PadLayout = 'xbox' | 'playstation';
export type PadContext = 'world' | 'battle' | 'dialogue' | 'menu' | 'screen';
export interface Prompt {
  button: string;
  label: string;
}

/** Button names by index of the standard mapping. */
const NAMES: Record<PadLayout, string[]> = {
  xbox: ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'View', '≡', 'LS', 'RS', '↑', '↓', '←', '→'],
  playstation: ['✕', '○', '□', '△', 'L1', 'R1', 'L2', 'R2', 'Create', 'Options', 'L3', 'R3', '↑', '↓', '←', '→'],
};
export const buttonName = (layout: PadLayout, index: number): string => NAMES[layout][index] ?? `Button ${index}`;

/** DualShock, DualSense and anything that says so in its id (Chrome lists "054c" for Sony) gets the Sony symbols. */
export function layoutOf(id: string): PadLayout {
  return /054c|playstation|dualshock|dualsense|sony|wireless controller/i.test(id) ? 'playstation' : 'xbox';
}

/** What each button does right now, as the controller scheme in `globalPad.ts` maps it. */
export function promptsFor(context: PadContext, layout: PadLayout = 'xbox', bindings: PadBindings = {}): Prompt[] {
  const g = { A: padBinding(bindings, 'confirm'), B: padBinding(bindings, 'back'), X: padBinding(bindings, 'wait'), Y: padBinding(bindings, 'inventory'), LB: padBinding(bindings, 'prev'), RB: padBinding(bindings, 'next'), Start: padBinding(bindings, 'menu') };
  const p = (b: keyof typeof g, label: string): Prompt => ({ button: buttonName(layout, g[b]), label });
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
    const list = promptsFor(contextNow(), layoutOf(first.id), settings().padBindings);
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
