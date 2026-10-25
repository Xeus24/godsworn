import { AUTOSAVE_SLOT, MANUAL_SLOTS, type SaveSlots, type SaveSummary } from '../../engine/state/save';
import type { GameSession } from '../../engine/state/gameState';
import { el, type Screen } from '../screen';
import { settings, updateSettings, type Settings } from '../settings';

const playTime = (ms: number): string => {
  const m = Math.floor(ms / 60000);
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
};

function button(label: string, run: () => void, disabled = false, cls = ''): HTMLButtonElement {
  const b = el('button', cls ? { class: cls } : {}, label) as HTMLButtonElement;
  b.disabled = disabled;
  b.addEventListener('click', run);
  return b;
}

/** A modal panel over the current screen; Esc or the close button dismisses it. */
abstract class Overlay {
  readonly element: HTMLElement;
  protected readonly panel: HTMLElement;
  private readonly onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      this.close();
    }
  };

  constructor(label: string, private readonly onClose: () => void = () => undefined) {
    this.panel = el('div', { class: 'panel menu-panel', role: 'dialog', 'aria-label': label });
    this.element = el('div', { class: 'dialogue-overlay menu-overlay' }, this.panel);
    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) this.close();
    });
    window.addEventListener('keydown', this.onKey, true);
  }

  open(): void {
    this.render();
    document.body.append(this.element);
  }

  close(): void {
    window.removeEventListener('keydown', this.onKey, true);
    this.element.remove();
    this.onClose();
  }

  protected abstract render(): void;
}

// ---------------------------------------------------------------- settings

/** Volume, battle defaults, autosave, motion and text size. */
export class SettingsOverlay extends Overlay {
  constructor(onClose?: () => void) {
    super('Settings', onClose);
  }

  protected render(): void {
    const s = settings();
    const slider = (label: string, key: 'masterVolume' | 'musicVolume' | 'sfxVolume'): HTMLElement => {
      const input = el('input', { type: 'range', min: '0', max: '100', value: String(Math.round(s[key] * 100)), 'aria-label': label }) as HTMLInputElement;
      input.addEventListener('input', () => updateSettings({ [key]: Number(input.value) / 100 } as Partial<Settings>));
      return el('label', { class: 'setting-row' }, el('span', {}, label), input);
    };
    const check = (label: string, key: 'muted' | 'autoBattle' | 'autosave' | 'reduceMotion'): HTMLElement => {
      const input = el('input', { type: 'checkbox' }) as HTMLInputElement;
      input.checked = s[key];
      input.addEventListener('change', () => updateSettings({ [key]: input.checked } as Partial<Settings>));
      return el('label', { class: 'checkbox setting-row' }, input, el('span', {}, label));
    };
    const select = <T extends string | number>(label: string, options: [T, string][], value: T, set: (v: T) => void): HTMLElement => {
      const sel = el('select', { 'aria-label': label }) as HTMLSelectElement;
      for (const [v, text] of options) sel.append(el('option', { value: String(v) }, text));
      sel.value = String(value);
      sel.addEventListener('change', () => set(options.find(([v]) => String(v) === sel.value)?.[0] ?? value));
      return el('label', { class: 'setting-row' }, el('span', {}, label), sel);
    };
    this.panel.replaceChildren(
      el('h2', {}, 'Settings'),
      el('h3', {}, 'Sound'),
      slider('Master volume', 'masterVolume'),
      slider('Music', 'musicVolume'),
      slider('Sound effects', 'sfxVolume'),
      check('Mute everything', 'muted'),
      el('h3', {}, 'Battle'),
      select<number>('Battle speed', [[1, '1×'], [2, '2×'], [4, '4×']], s.battleSpeed, (v) => updateSettings({ battleSpeed: v as 1 | 2 | 4 })),
      check('Start battles on auto-battle', 'autoBattle'),
      el('h3', {}, 'Game'),
      check('Autosave (after battles, in towns and every few minutes)', 'autosave'),
      check('Reduce motion (no animations)', 'reduceMotion'),
      select<number>('Text size', [[0.9, 'Small'], [1, 'Normal'], [1.15, 'Large'], [1.3, 'Larger']], s.textScale, (v) => updateSettings({ textScale: v })),
      el('div', { class: 'dim small' }, 'Settings are kept in this browser.'),
      button('Close', () => this.close(), false, 'primary'),
    );
  }
}

// ---------------------------------------------------------------- keyboard help

export const KEYS: [string, string][] = [
  ['C', 'Character sheet'],
  ['I', 'Inventory and stash'],
  ['K', 'Skill trees'],
  ['L', 'General skills'],
  ['J', 'Quest log'],
  ['O', 'Party'],
  ['P', 'Pantheon (in battle: Pray)'],
  ['B', 'Codex'],
  ['G', 'World'],
  ['WASD / arrows', 'Walk; E to use; M for the world map'],
  ['1–9', 'Battle: skills; dialogue: choices'],
  ['Esc', 'Menu (save, load, settings)'],
  ['?', 'This list'],
  ['`', 'Developer panel'],
];

export class HelpOverlay extends Overlay {
  constructor(onClose?: () => void) {
    super('Keyboard', onClose);
  }

  protected render(): void {
    this.panel.replaceChildren(el('h2', {}, 'Keyboard'), el('div', { class: 'key-list' }, ...KEYS.flatMap(([k, what]) => [el('kbd', {}, k), el('span', {}, what)])), button('Close', () => this.close(), false, 'primary'));
  }
}

// ---------------------------------------------------------------- pause menu

export interface PauseActions {
  save: () => void;
  load: () => void;
  quit: () => void;
}

/** The in-game menu (Esc). */
export class PauseMenu extends Overlay {
  constructor(private readonly actions: PauseActions, onClose?: () => void) {
    super('Menu', onClose);
  }

  protected render(): void {
    const go = (f: () => void) => () => {
      this.close();
      f();
    };
    this.panel.replaceChildren(
      el('h2', {}, 'Menu'),
      el('nav', { class: 'title-menu' },
        button('Resume', () => this.close(), false, 'primary'),
        button('Save game', go(this.actions.save)),
        button('Load game', go(this.actions.load)),
        button('Settings', go(() => new SettingsOverlay().open())),
        button('Keyboard', go(() => new HelpOverlay().open())),
        button('Quit to title', go(this.actions.quit)),
      ),
    );
  }
}

// ---------------------------------------------------------------- save and load

/**
 * Save slots: the autosave and three manual slots. In 'save' mode you can
 * write to the manual slots; in both modes you can load, delete (two
 * clicks), export to a file and import from one.
 */
export class SaveLoadScreen implements Screen {
  private root: HTMLElement | undefined;
  private message = '';
  private confirmDelete: string | undefined;

  constructor(
    private readonly slots: SaveSlots,
    private readonly mode: 'save' | 'load',
    private readonly session: GameSession | undefined,
    private readonly onLoad: (slot: string) => string | undefined,
    private readonly onBack: () => void,
  ) {}

  mount(root: HTMLElement): void {
    this.root = root;
    this.render();
  }

  unmount(): void {}

  private say(text: string): void {
    this.message = text;
    this.render();
  }

  private download(slot: string, summary: SaveSummary): void {
    const text = this.slots.exportSlot(slot);
    if (!text) return;
    const a = el('a', { href: URL.createObjectURL(new Blob([text], { type: 'application/json' })), download: `godsworn-${summary.name}-lv${summary.level}.json` });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  private upload(slot: string): void {
    const input = el('input', { type: 'file', accept: '.json,application/json' }) as HTMLInputElement;
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return;
      void file.text().then((text) => {
        const r = this.slots.importInto(slot, text);
        this.say(r.ok ? `Imported into slot ${slot}.` : r.reason);
      });
    });
    input.click();
  }

  private row(slot: string, summary: SaveSummary | undefined): HTMLElement {
    const label = slot === AUTOSAVE_SLOT ? 'Autosave' : `Slot ${slot}`;
    const info = summary
      ? el('div', {}, el('b', {}, `${summary.name}`), el('div', { class: 'small' }, `Level ${summary.level} ${summary.classes}${summary.ngPlus ? ` · NG+${summary.ngPlus}` : ''}${summary.hardcore ? ' · Hardcore' : ''}${summary.gameOver ? ' · fallen' : ''}`), el('div', { class: 'dim small' }, `Day ${summary.day} · played ${playTime(summary.playTimeMs)} · saved ${new Date(summary.savedAt).toLocaleString()}`))
      : el('div', { class: 'dim' }, 'Empty');
    const actions: HTMLElement[] = [];
    if (this.mode === 'save' && slot !== AUTOSAVE_SLOT && this.session) {
      actions.push(button(summary ? 'Overwrite' : 'Save here', () => {
        if (this.session) this.slots.save(slot, this.session);
        this.say(`Saved to slot ${slot}.`);
      }, false, 'primary'));
    }
    if (summary) {
      actions.push(button('Load', () => {
        const err = this.onLoad(slot);
        if (err) this.say(err);
      }, summary.gameOver, this.mode === 'load' ? 'primary' : ''));
      actions.push(button('Export', () => this.download(slot, summary)));
      actions.push(button(this.confirmDelete === slot ? 'Really delete?' : 'Delete', () => {
        if (this.confirmDelete !== slot) {
          this.confirmDelete = slot;
          this.render();
          return;
        }
        this.confirmDelete = undefined;
        this.slots.remove(slot);
        this.say(`${label} deleted.`);
      }, false, 'danger'));
    }
    if (slot !== AUTOSAVE_SLOT) actions.push(button('Import', () => this.upload(slot)));
    return el('div', { class: 'panel save-slot' }, el('h3', {}, label), info, el('div', { class: 'row wrap' }, ...actions));
  }

  private render(): void {
    if (!this.root) return;
    const all = this.slots.list();
    const bySlot = new Map(all.map((s) => [s.slot, s]));
    this.root.replaceChildren(
      el(
        'div',
        { class: 'sheet save-screen' },
        el('h2', {}, this.mode === 'save' ? 'Save Game' : 'Load Game'),
        ...(this.message ? [el('div', { class: 'small' }, this.message)] : []),
        el('div', { class: 'codex-grid' }, ...[AUTOSAVE_SLOT, ...MANUAL_SLOTS].map((slot) => this.row(slot, bySlot.get(slot)))),
        el('p', { class: 'dim small' }, 'Saves are kept in this browser. Export a save to keep it safe or move it to another browser.'),
        button('Back', () => this.onBack()),
      ),
    );
  }
}
