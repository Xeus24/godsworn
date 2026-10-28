import { content } from '../../data';
import { DIFFICULTIES, getDifficulty, type DifficultyId } from '../../data/difficulty';
import { difficultyChoices } from '../../engine/character/difficultyChange';
import { dyeCost, learnDye, setDye, setFrame, setTransmog, SKIN_SLOTS, skinLabel, skinsFor, syncAppearance } from '../../engine/items/appearance';
import type { GameSession } from '../../engine/state/gameState';
import { el } from '../screen';

/** CSS for a portrait frame, drawn as a double border. */
export function frameStyle(frameId: string | undefined): string {
  const f = content.frames.find(frameId ?? 'plain') ?? content.frames.get('plain');
  return `box-shadow: 0 0 0 2px ${f.colors[1]}, 0 0 0 4px ${f.colors[0]};`;
}

export function difficultyPanel(session: GameSession, rerender: () => void): HTMLElement {
  const p = session.player;
  const choices = difficultyChoices(p);
  const current = getDifficulty(p.difficulty);
  const note = el('div', { class: 'dim small' }, p.hardcore ? 'Hardcore heroes keep the difficulty they swore to.' : p.difficulty === 'impossible' ? 'Impossible cannot be left once chosen.' : current.blurb);
  const select = el('select', { 'aria-label': 'Difficulty' }) as HTMLSelectElement;
  for (const d of DIFFICULTIES) {
    if (d.id === 'impossible' && p.difficulty !== 'impossible') continue;
    select.append(el('option', { value: d.id }, d.name));
  }
  select.value = p.difficulty;
  select.disabled = choices.length === 0;
  select.addEventListener('change', () => {
    const r = session.setDifficulty(select.value as DifficultyId);
    if (!r.ok) note.textContent = r.reason;
    rerender();
  });
  return el('section', { class: 'panel' }, el('h3', {}, 'Difficulty'), select, note, el('div', { class: 'dim small' }, 'Bonuses of difficulty-locked paragon nodes pause while you play below their tier.'));
}

export function wardrobePanel(session: GameSession, rerender: () => void): HTMLElement {
  const s = session;
  const p = s.player;
  const app = p.appearance;
  const held = [...s.state.inventory.slots, ...s.state.stash.tabs.flatMap((t) => t.slots)];
  syncAppearance(app, p, held, s.state.achievements);

  const frame = el('select', { 'aria-label': 'Portrait frame' }) as HTMLSelectElement;
  for (const f of content.frames.all()) {
    const o = el('option', { value: f.id }, app.unlockedFrames.includes(f.id) ? f.name : `${f.name} (locked)`);
    o.disabled = !app.unlockedFrames.includes(f.id);
    frame.append(o);
  }
  frame.value = app.frame;
  frame.addEventListener('change', () => {
    setFrame(app, frame.value);
    rerender();
  });

  const rows = SKIN_SLOTS.map((slot) => {
    const skin = el('select', { 'aria-label': `${slot} look` }) as HTMLSelectElement;
    skin.append(el('option', { value: '' }, 'Worn look'));
    for (const k of skinsFor(app, slot)) skin.append(el('option', { value: k.id }, skinLabel(k.weight, k.tier)));
    skin.value = app.transmog[slot] ?? '';
    skin.addEventListener('change', () => {
      setTransmog(app, slot, skin.value || null);
      rerender();
    });
    const dye = el('select', { 'aria-label': `${slot} dye` }) as HTMLSelectElement;
    dye.append(el('option', { value: '' }, 'No dye'));
    for (const d of content.dyes.all()) if (app.unlockedDyes.includes(d.id)) dye.append(el('option', { value: d.id }, d.name));
    dye.value = app.dyes[slot] ?? '';
    dye.addEventListener('change', () => {
      setDye(app, slot, dye.value || null);
      rerender();
    });
    return el('div', { class: 'class-row' }, el('b', {}, slot[0]?.toUpperCase() + slot.slice(1)), skin, dye);
  });

  const learnable = content.dyes.all().filter((d) => !app.unlockedDyes.includes(d.id));
  const learn = el('select', { 'aria-label': 'Learn a dye' }) as HTMLSelectElement;
  learn.append(el('option', { value: '' }, learnable.length ? 'Learn a dye…' : 'All dyes known'));
  for (const d of learnable) learn.append(el('option', { value: d.id }, `${d.name} (${dyeCost(d.id)} gold)`));
  learn.disabled = learnable.length === 0;
  const msg = el('div', { class: 'dim small' }, 'Looks come from armor you have worn or carried. Dyes tint the worn piece on your hero.');
  learn.addEventListener('change', () => {
    if (!learn.value) return;
    const id = learn.value;
    if (!s.spendGold(dyeCost(id), 'dye')) {
      msg.textContent = `You need ${dyeCost(id)} gold.`;
      learn.value = '';
      return;
    }
    learnDye(app, id);
    rerender();
  });

  return el('section', { class: 'panel' }, el('h3', {}, 'Wardrobe'), el('label', { class: 'small' }, 'Portrait frame ', frame), ...rows, learn, msg);
}
