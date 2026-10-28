import { content } from '../../data';
import { generalRank, generalSlotCount, GENERAL_SLOT_LEVELS, trainingNeeded } from '../../engine/skills/general';
import type { GeneralCategory, GeneralSkillDef } from '../../engine/skills/generalTypes';
import type { GameSession } from '../../engine/state/gameState';
import { navBar, type Nav } from '../components/navBar';
import { attachTooltip, hideTooltip } from '../components/tooltip';
import { skillCard } from '../format';
import { el, type Screen } from '../screen';

const CATEGORY_LABEL: Record<GeneralCategory, string> = {
  combat: 'Combat',
  elemental: 'Elemental',
  utility: 'Utility',
  survival: 'Survival',
  grimoire: 'Grimoires',
  divine: 'Divine',
  forbidden: 'Forbidden',
  defensive: 'Defensive',
  social: 'Social',
  exploration: 'Exploration',
  lost: 'Lost Arts',
  legendary: 'Legendary',
  master: 'Masters',
};

/**
 * General skills: anyone can learn them from skillbooks, whatever their
 * class. Slotted skills give their passives and battle skills, and train
 * with use. The catalogue lists every skill, learned or not.
 */
export class GeneralScreen implements Screen {
  private root: HTMLElement | undefined;
  private offs: (() => void)[] = [];
  private selected: string | undefined;
  private filter: GeneralCategory | 'known' | 'all' = 'known';
  private message = '';

  constructor(
    private readonly session: GameSession,
    private readonly nav: Nav,
  ) {}

  mount(root: HTMLElement): void {
    this.root = root;
    this.offs.push(this.session.bus.on('stateChanged', () => this.render()));
    if (Object.keys(this.session.player.generalSkills).length === 0) this.filter = 'all';
    this.render();
  }

  unmount(): void {
    for (const off of this.offs) off();
    this.offs = [];
  }

  private say(result: { ok: boolean; reason?: string }): void {
    this.message = result.ok ? '' : (result.reason ?? '');
    this.render();
  }

  private slots(): HTMLElement {
    const p = this.session.player;
    const count = generalSlotCount(p);
    const cells = Array.from({ length: count }, (_, i) => {
      const id = p.generalSlots[i] ?? null;
      const def = id ? content.generalSkills.find(id) : undefined;
      const b = el('button', { class: `general-slot${def ? ' filled' : ''}` }, el('span', { class: 'hk' }, String(i + 1)), def ? `${def.name} ${generalRank(p, def.id)}` : '(empty)');
      b.addEventListener('click', () => {
        if (this.selected && content.generalSkills.find(this.selected) && p.generalSkills[this.selected]) this.say(this.session.general.setSlot(i, this.selected));
        else if (def) {
          this.selected = def.id;
          this.render();
        }
      });
      if (def) {
        b.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          this.say(this.session.general.setSlot(i, null));
        });
      }
      return b;
    });
    const next = GENERAL_SLOT_LEVELS.find((l) => l > p.level);
    return el(
      'section',
      { class: 'panel' },
      el('h3', {}, `Slots (${count})`),
      el('div', { class: 'general-slots' }, ...cells),
      el('p', { class: 'dim small' }, `Select a known skill, then click a slot to put it there. Right-click a slot to empty it.${next ? ` Next slot at level ${next}.` : ''}`),
    );
  }

  private list(): HTMLElement {
    const p = this.session.player;
    const filters: (typeof this.filter)[] = ['known', 'all', 'combat', 'elemental', 'utility', 'survival', 'defensive', 'social', 'exploration', 'lost', 'legendary', 'master', 'grimoire'];
    const tabs = filters.map((f) => {
      const b = el('button', { class: `tab${this.filter === f ? ' active' : ''}` }, f === 'known' ? 'Known' : f === 'all' ? 'All' : CATEGORY_LABEL[f]);
      b.addEventListener('click', () => {
        this.filter = f;
        this.render();
      });
      return b;
    });
    const skills = content.generalSkills.filter((d) => (this.filter === 'known' ? p.generalSkills[d.id] !== undefined : this.filter === 'all' || d.category === this.filter));
    const rows = skills.map((d) => {
      const rank = generalRank(p, d.id);
      const rarity = content.rarities.get(d.rarity);
      const row = el(
        'button',
        { class: `general-row${this.selected === d.id ? ' selected' : ''}${rank === 0 ? ' unknown' : ''}` },
        el('span', { style: `color:${rarity.color}` }, d.name),
        el('span', { class: 'dim small' }, CATEGORY_LABEL[d.category]),
        el('span', { class: 'small' }, rank > 0 ? `${rank}/${d.maxRank}${p.generalSlots.includes(d.id) ? ' · slotted' : ''}` : 'unlearned'),
      );
      row.addEventListener('click', () => {
        this.selected = d.id;
        this.message = '';
        this.render();
      });
      return row;
    });
    return el(
      'section',
      { class: 'panel general-list' },
      el('div', { class: 'tabs' }, ...tabs),
      ...(rows.length ? rows : [el('p', { class: 'dim small' }, 'You know no general skills yet. Skillbooks drop from enemies and chests; read one to learn its skill.')]),
    );
  }

  private details(): HTMLElement {
    const p = this.session.player;
    const panel = el('section', { class: 'panel general-details' });
    if (this.message) panel.append(el('div', { class: 'field-error' }, this.message));
    const def: GeneralSkillDef | undefined = this.selected ? content.generalSkills.find(this.selected) : undefined;
    if (!def) {
      panel.append(el('p', { class: 'dim small' }, 'Select a skill to see its details.'));
      return panel;
    }
    const progress = p.generalSkills[def.id];
    const rarity = content.rarities.get(def.rarity);
    panel.append(
      el('div', { class: 'tip-title', style: `color:${rarity.color}` }, def.name),
      el('div', { class: 'tip-desc' }, `${rarity.name} ${CATEGORY_LABEL[def.category]} skill · max rank ${def.maxRank}`),
      el('p', {}, def.description),
    );
    if (def.requirements?.level) panel.append(el('div', { class: 'small dim' }, `Requires level ${def.requirements.level}`));
    if (def.combatSkill) {
      const skill = content.skills.get(def.combatSkill);
      const card = el('div', { class: 'general-skillcard' }, el('b', {}, `Battle skill: ${skill.name}`));
      attachTooltip(card, () => skillCard(skill, Math.max(1, Math.min(progress?.rank ?? 1, skill.maxRank))));
      panel.append(card);
    }
    if (progress) {
      const need = trainingNeeded(progress.rank);
      const maxed = progress.rank >= def.maxRank;
      panel.append(
        el('div', {}, `Rank ${progress.rank}/${def.maxRank}`),
        el('div', { class: 'train-bar' }, el('div', { style: `width:${maxed ? 100 : (progress.xp / need) * 100}%` })),
        el('div', { class: 'dim small' }, maxed ? 'Fully trained.' : `Training ${progress.xp}/${need}: ${def.combatSkill ? 'use its battle skill' : 'win battles with it slotted'}, or read another copy of its book.`),
      );
      const free = p.generalSlots.indexOf(null);
      const slotted = p.generalSlots.includes(def.id);
      const b = el('button', { class: 'primary' }, slotted ? 'Unslot' : free >= 0 ? 'Slot it' : 'Slots full: click a slot to replace');
      b.disabled = !slotted && free < 0;
      b.addEventListener('click', () => this.say(this.session.general.setSlot(slotted ? p.generalSlots.indexOf(def.id) : free, slotted ? null : def.id)));
      panel.append(b);
    } else {
      panel.append(el('p', { class: 'dim small' }, `Learn it by reading “${def.category === 'grimoire' ? 'Grimoire' : 'Skillbook'}: ${def.name.replace(' (Grimoire)', '')}”, or study a copy at the Library.`));
    }
    return panel;
  }

  render = (): void => {
    if (!this.root) return;
    hideTooltip();
    this.root.replaceChildren(
      el('div', { class: 'sheet' }, navBar(this.session, this.nav, 'general'), el('div', { class: 'general-body' }, el('div', { class: 'general-left' }, this.slots(), this.list()), this.details())),
    );
  };
}
