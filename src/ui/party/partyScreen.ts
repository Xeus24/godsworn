import { content } from '../../data';
import { characterBaseStats } from '../../engine/character/stats';
import { canEquip, defaultSlot } from '../../engine/items/equipment';
import { isGear } from '../../engine/items/lookup';
import { itemName } from '../../engine/items/naming';
import { EQUIP_SLOTS } from '../../engine/items/types';
import { APPROVAL, activeBonds, approvalName, companionStats, openBondTiers } from '../../engine/party/party';
import type { CompanionDef, CompanionState } from '../../engine/party/types';
import type { Conversation } from '../../engine/state/conversation';
import type { GameSession } from '../../engine/state/gameState';
import { drawPortrait } from '../art/portraits';
import { navBar, type Nav } from '../components/navBar';
import { attachTooltip } from '../components/tooltip';
import { formatStat } from '../format';
import { slotLabel } from '../items/itemText';
import { itemTooltip } from '../items/itemTooltip';
import { el, type Screen } from '../screen';

const STATS = ['maxHp', 'maxMp', 'physicalAttack', 'magicAttack', 'defense', 'magicResist', 'critChance', 'speed'] as const;

/**
 * The party (O): your companions, who fights beside you (up to three), their
 * approval and what they like, bond perks to choose, their gear (equip from
 * your bags) and a word with them.
 */
export class PartyScreen implements Screen {
  private root: HTMLElement | undefined;
  private offs: (() => void)[] = [];
  private selected: string | undefined;
  private message = '';

  constructor(
    private readonly session: GameSession,
    private readonly nav: Nav,
    private readonly talk: (conv: Conversation) => void,
  ) {}

  mount(root: HTMLElement): void {
    this.root = root;
    this.offs.push(this.session.bus.on('stateChanged', () => this.render()));
    this.render();
  }

  unmount(): void {
    for (const off of this.offs) off();
    this.offs = [];
  }

  private say(r: { ok: boolean; reason?: string }): void {
    this.message = r.ok ? '' : (r.reason ?? '');
    this.render();
  }

  private btn(label: string, run: () => void, disabled = false, cls = 'tab'): HTMLButtonElement {
    const b = el('button', { class: cls }, label);
    b.disabled = disabled;
    b.addEventListener('click', run);
    return b;
  }

  private card(comp: CompanionState, def: CompanionDef): HTMLElement {
    const ch = comp.character;
    const portrait = el('canvas', { class: 'portrait-small pixel' });
    drawPortrait(portrait, def.raceId, def.portrait, `${content.classes.get(def.classId).color}55`);
    const b = el(
      'button',
      { class: `party-card panel${this.selected === comp.id ? ' active' : ''}${comp.left ? ' left' : ''}` },
      portrait,
      el(
        'div',
        {},
        el('b', {}, def.name),
        el('div', { class: 'dim small' }, `Level ${ch.level} ${content.classes.get(def.classId).name}`),
        el('div', { class: 'small' }, comp.left ? `Left you · waits in ${content.towns.get(def.town).name}` : comp.inParty ? 'In the party' : 'In reserve'),
        el('div', { class: 'approval-bar' }, el('div', { class: 'approval-fill', style: `width:${(comp.approval + 100) / 2}%` }), el('span', {}, `${approvalName(comp.approval)} (${Math.round(comp.approval)})`)),
      ),
    );
    b.addEventListener('click', () => {
      this.selected = comp.id;
      this.render();
    });
    return b;
  }

  private detail(comp: CompanionState, def: CompanionDef): HTMLElement {
    const s = this.session;
    const ch = comp.character;
    const stats = companionStats(def, comp);
    const god = content.gods.get(def.god);
    const actions: HTMLElement[] = [];
    if (comp.left) {
      actions.push(this.btn(`Make amends (${s.party.amendsCost()}g)`, () => this.say(s.party.makeAmends(comp.id)), s.world.inTown() !== def.town, 'primary'));
    } else {
      actions.push(
        comp.inParty ? this.btn('Send to reserve', () => this.say(s.party.setInParty(comp.id, false))) : this.btn('Bring into the party', () => this.say(s.party.setInParty(comp.id, true)), s.party.members().length >= APPROVAL.partySize, 'primary'),
        this.btn('Talk', () => {
          const conv = s.quests.talkTo(def.id);
          if (conv) this.talk(conv);
        }, false, 'primary'),
      );
    }
    const open = openBondTiers(def, comp);
    const chosen = new Set(comp.bonds);
    const bond = def.bond.map((tier, i) => {
      const reached = comp.approval >= tier.approval;
      return el(
        'div',
        { class: `bond-tier${reached ? '' : ' locked'}` },
        el('div', { class: 'dim small' }, `${tier.approval} approval`),
        el(
          'div',
          { class: 'bond-options' },
          ...tier.options.map((n) => {
            const b = el('button', { class: `bond-node${chosen.has(n.id) ? ' chosen' : ''}` }, el('b', {}, n.name), el('div', { class: 'small' }, n.description));
            b.disabled = !open.includes(i) || chosen.has(n.id);
            b.addEventListener('click', () => this.say(s.party.chooseBond(comp.id, n.id)));
            return b;
          }),
        ),
      );
    });
    const oath = el('div', { class: `bond-node oath${comp.oath ? ' chosen' : ''}` }, el('b', {}, `Oath: ${def.oath.name}`), el('div', { class: 'small' }, def.oath.description), el('div', { class: 'dim small' }, comp.oath ? 'Sworn.' : `Earned by finishing ${content.quests.get(def.personalQuest).name}.`));

    const gear = EQUIP_SLOTS.filter((slot) => ch.equipment[slot]).map((slot) => {
      const item = ch.equipment[slot];
      if (!item) return el('span');
      const name = el('span', { style: `color:var(--r-${item.rarity})` }, itemName(item));
      attachTooltip(name, () => itemTooltip(item));
      return el('div', { class: 'party-gear-row' }, el('span', { class: 'dim small' }, slotLabel(slot)), name, this.btn('Unequip', () => this.say(s.party.unequip(comp.id, slot))));
    });
    const base = characterBaseStats(ch);
    const usable = s.state.inventory.slots
      .map((it, i) => ({ it, i }))
      .filter(({ it }) => {
        if (!it || !isGear(it) || !it.identified) return false;
        const slot = defaultSlot(ch, it);
        return slot !== undefined && canEquip(ch, it, slot, base).ok;
      });
    const bag = usable.map(({ it, i }) => {
      if (!it) return el('span');
      const name = el('span', { style: `color:var(--r-${it.rarity})` }, itemName(it));
      attachTooltip(name, () => itemTooltip(it));
      return el('div', { class: 'party-gear-row bag' }, name, this.btn('Equip', () => this.say(s.party.equip(comp.id, i))));
    });
    const quests = [def.recruitQuest, def.personalQuest].map((id) => content.quests.get(id));
    return el(
      'section',
      { class: 'panel party-detail' },
      el('h2', {}, `${def.name}, ${def.title}`),
      el('p', { class: 'small' }, def.bio),
      el('div', { class: 'small' }, `Follows ${god.name}: approves when you earn ${god.name}’s favor${content.pantheon.get(def.god).rivals.length ? `, and frowns on favor with ${content.pantheon.get(def.god).rivals.map((r) => content.gods.get(r).name).join(', ')}` : ''}.`),
      el('div', { class: 'small' }, `Likes: ${def.likes.map((d) => d.text.toLowerCase()).join(', ')}. Dislikes: ${def.dislikes.map((d) => d.text.toLowerCase()).join(', ')}.`),
      el('div', { class: 'dim small' }, `At ${APPROVAL.leave} approval they leave. Personal quest: ${quests[1]?.name ?? ''} (at 30 approval).`),
      ...(this.message ? [el('div', { class: 'field-error' }, this.message)] : []),
      el('div', { class: 'row wrap' }, ...actions),
      el('div', { class: 'party-stats small' }, `HP ${ch.hp}/${stats.maxHp} · MP ${ch.mp}/${stats.maxMp}`, ...STATS.slice(2).map((k) => el('span', {}, `${content.stats.get(k).name} ${formatStat(k, stats[k])}`))),
      el('h3', {}, 'Bond'),
      el('div', { class: 'dim small' }, `Perks active: ${activeBonds(def, comp).map((n) => n.name).join(', ') || 'none yet'}.`),
      ...bond,
      oath,
      el('h3', {}, 'Gear'),
      el('div', { class: 'party-gear' }, ...gear),
      el('h3', {}, 'From your bags'),
      el('div', { class: 'party-gear' }, ...(bag.length ? bag : [el('p', { class: 'dim small' }, 'Nothing in your bags they can use.')])),
    );
  }

  private render = (): void => {
    if (!this.root) return;
    const s = this.session;
    const all = Object.values(s.state.party.companions);
    if (!this.selected || !s.state.party.companions[this.selected]) this.selected = all[0]?.id;
    const sel = this.selected ? s.state.party.companions[this.selected] : undefined;
    const known = content.companions.all().filter((c) => !s.state.party.companions[c.id]);
    this.root.replaceChildren(
      el(
        'div',
        { class: 'sheet' },
        navBar(s, this.nav, 'party'),
        el(
          'div',
          { class: 'party-body' },
          el(
            'section',
            { class: 'party-list' },
            el('h2', {}, `Party (${s.party.members().length}/${APPROVAL.partySize})`),
            ...(all.length ? all.map((c) => this.card(c, s.party.def(c.id))) : [el('p', { class: 'dim small' }, 'No companions yet. People in towns may want to travel with you.')]),
            ...(known.length ? [el('h3', {}, 'Not yet met'), el('ul', { class: 'small dim' }, ...known.map((c) => el('li', {}, `${c.name}, ${c.title} (${content.towns.get(c.town).name})`)))] : []),
          ),
          sel ? this.detail(sel, s.party.def(sel.id)) : el('section', { class: 'panel party-detail dim' }, 'Recruit a companion to see them here.'),
        ),
      ),
    );
  };
}
