import { AFFLICTIONS, WEARINESS, WEARINESS_MAX, WHISPER } from '../../data/afflictions';
import type { GameSession } from '../../engine/state/gameState';
import { foldPanel } from '../components/fold';
import { el } from '../screen';

/** Weariness, the Whisper Meter, the Hard Road and the Afflictions (Section I-7a). Folded to one line. */
export function afflictionsPanel(s: GameSession, render: () => void): HTMLElement[] {
  const a = s.afflictions;
  const note = (text: string): void => {
    s.bus.emit('toast', { kind: 'info', text });
    render();
  };
  const carried = AFFLICTIONS.filter((d) => a.has(d.id));
  const hard = el('label', { class: 'small', title: 'Optional. A camp in the wild gives only a rough half-rest; only a town’s bed gives a Night’s Rest.' }, el('input', { type: 'checkbox' }), ' The Hard Road') as HTMLLabelElement;
  const box = hard.querySelector('input') as HTMLInputElement;
  box.checked = a.hardRoad;
  box.addEventListener('change', () => {
    a.setHardRoad(box.checked);
    render();
  });
  const wearyRow = el('p', { class: 'small', title: WEARINESS.map((w) => `${w.level} ${w.name}`).join(', ') }, `Weariness ${a.weary}/${WEARINESS_MAX} (${a.wearyName}). A Night’s Rest takes one away; forced marches, harsh country and skipped rests add it. At 6 you start a fight on your knees.`);
  const mad = a.madness();
  const whisperRow = el('p', { class: 'small', title: `Short madness from ${WHISPER.short}, long from ${WHISPER.long}.` }, `Whispers ${a.whisper}/${WHISPER.max} (${a.whisperName}). `, mad.length ? el('span', {}, mad.map((m) => m.name).join(', ')) : el('span', { class: 'dim' }, 'No madness now.'));
  const rows = carried.length
    ? carried.map((d) => {
        const act = a.embraced(d.id);
        const learned = a.t.nodes[d.id] ?? [];
        const btns: HTMLElement[] = [];
        if (!act) {
          const b = el('button', { title: d.embraceText }, 'Embrace') as HTMLButtonElement;
          b.addEventListener('click', () => {
            const r = a.embrace(d.id);
            note(r.ok ? r.text : r.reason);
          });
          btns.push(b);
        }
        const tree = act
          ? [el('details', { class: 'small' }, el('summary', {}, `Power tree (${learned.length}/12, ${a.pointsLeft(d.id)} points)`),
              ...d.tree.map((n) => {
                const b = el('button', { title: n.text }, `${n.name}${learned.includes(n.id) ? ' ✓' : ''}`) as HTMLButtonElement;
                b.disabled = learned.includes(n.id);
                b.addEventListener('click', () => {
                  const r = a.learn(d.id, n.id);
                  note(r.ok ? r.text : r.reason);
                });
                return b;
              }))]
          : [];
        return el('div', { class: 'small' }, el('b', {}, d.name), el('span', { class: 'dim' }, ` ${act ? 'embraced' : 'cursed'}: ${d.curseText} ${d.flareText}`), ...btns, ...tree);
      })
    : [el('p', { class: 'dim small' }, 'You carry no affliction. Beasts, the undead, stone things and the void can leave a mark.')];
  const bits = [`Weary ${a.weary}`, `whispers ${a.whisper}`, ...(carried.length ? [carried.map((d) => d.name).join(', ')] : [])];
  return [foldPanel(el('section', { class: 'panel' }, el('h3', {}, 'The Road’s Toll'), wearyRow, whisperRow, hard, ...rows), bits.join(' · '))];
}
