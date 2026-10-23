import { content } from '../../data';
import { DEVOTION } from '../../data/devotion';
import type { PantheonDef } from '../../data/pantheon';
import { activeMinors, blessingSlotCount, isActive } from '../../engine/gods/blessings';
import { interventionChance, interveningGod } from '../../engine/gods/combat';
import { atLeast, favorOf, goldOfferingFavor, itemOfferingFavor, tierFor, tierName, tierProgress } from '../../engine/gods/devotion';
import type { BlessingDef } from '../../engine/gods/types';
import { characterBaseStats } from '../../engine/character/stats';
import { itemValue } from '../../engine/items/itemStats';
import { itemName } from '../../engine/items/naming';
import type { GameSession } from '../../engine/state/gameState';
import { navBar, type Nav } from '../components/navBar';
import { attachTooltip, hideTooltip } from '../components/tooltip';
import { el, type Screen } from '../screen';

const TIER_CLASS: Record<string, string> = { hated: 'danger', distrusted: 'warn', neutral: 'dim', acknowledged: 'ok', favored: 'ok', devoted: 'gold', exalted: 'gold', apostle: 'gold' };

/**
 * The Pantheon: every god's favor and tier, what they like and dislike
 * (revealed as you discover it), and the shrine: prayer, offerings,
 * blessings, scriptures and your patron.
 */
export class PantheonScreen implements Screen {
  private root: HTMLElement | undefined;
  private offs: (() => void)[] = [];
  private selected: string;
  private message = '';
  private goldAmount = 100;

  constructor(
    private readonly session: GameSession,
    private readonly nav: Nav,
  ) {
    this.selected = session.player.devotion.patron ?? content.pantheon.all()[0]?.id ?? 'solenne';
  }

  mount(root: HTMLElement): void {
    this.root = root;
    this.offs.push(this.session.bus.on('stateChanged', () => this.render()));
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

  private btn(label: string, run: () => void, disabled = false, cls = ''): HTMLButtonElement {
    const b = el('button', { class: cls }, label);
    b.disabled = disabled;
    b.addEventListener('click', run);
    return b;
  }

  private favorBar(god: string): HTMLElement {
    const favor = favorOf(this.session.player, god);
    const tier = tierFor(favor);
    return el(
      'div',
      { class: `bar favor-bar tier-${tier}` },
      el('div', { class: 'bar-fill', style: `width:${tierProgress(favor) * 100}%;background:${content.gods.get(god).color}` }),
      el('span', { class: 'bar-label' }, `${tierName(tier)} · ${Math.floor(favor)}`),
    );
  }

  private godList(): HTMLElement {
    const p = this.session.player;
    const cards = content.pantheon.all().map((g) => {
      const god = content.gods.get(g.id);
      const tier = tierFor(favorOf(p, g.id));
      const offer = p.devotion.offers[g.id] ? el('span', { class: 'badge gold' }, 'Blessing!') : '';
      const card = el(
        'button',
        { class: `god-card${this.selected === g.id ? ' selected' : ''}`, style: `--god:${god.color}` },
        el('div', { class: 'god-head' }, el('b', { style: `color:${god.color}` }, god.name), p.devotion.patron === g.id ? el('span', { class: 'badge' }, 'Patron') : '', offer),
        el('div', { class: 'dim small' }, god.domain),
        this.favorBar(g.id),
        el('span', { class: `small enc-tag ${TIER_CLASS[tier] ?? ''}` }, tierName(tier)),
      );
      card.addEventListener('click', () => {
        this.selected = g.id;
        this.message = '';
        this.render();
      });
      return card;
    });
    return el('section', { class: 'panel god-list' }, ...cards);
  }

  private summary(): HTMLElement {
    const p = this.session.player;
    const slots = blessingSlotCount(p);
    const slotted = p.devotion.slotted.map((id) => {
      const b = content.blessings.get(id);
      const active = isActive(p, b);
      const chip = el('span', { class: `blessing-chip${active ? '' : ' inactive'}`, style: `border-color:${content.gods.get(b.god).color}` }, b.name);
      attachTooltip(chip, () => `${b.description}${active ? '' : ` (inactive: needs ${tierName(b.minTier ?? 'acknowledged')} with ${content.gods.get(b.god).name})`}`);
      return chip;
    });
    const empty = Array.from({ length: Math.max(0, slots - slotted.length) }, () => el('span', { class: 'blessing-chip empty' }, 'Empty slot'));
    const minors = activeMinors(p).map((m) => el('span', { class: 'blessing-chip minor' }, `${m.name} · ${m.battlesLeft}`));
    const ivGod = interveningGod(p);
    const iv = ivGod
      ? `${content.gods.get(ivGod).name} may intervene (${interventionChance(p, ivGod, characterBaseStats(p).fai)}%)${p.devotion.interventionReady ? '' : ' — spent until you rest'}`
      : 'No god is devoted enough to intervene (Devoted+).';
    return el(
      'section',
      { class: 'panel pantheon-summary' },
      el('h3', {}, `Major blessings (${p.devotion.slotted.length}/${slots})`),
      el('div', { class: 'blessing-row' }, ...slotted, ...empty),
      ...(minors.length ? [el('h3', {}, 'Minor blessings'), el('div', { class: 'blessing-row' }, ...minors)] : []),
      el('p', { class: 'small' }, `Patron: ${p.devotion.patron ? content.gods.get(p.devotion.patron).name : 'none'} · ${iv}`),
      el('p', { class: 'dim small' }, `More slots at levels ${DEVOTION.blessingSlotLevels.join(' and ')}. Rival gods will not share you.`),
    );
  }

  private deeds(g: PantheonDef): HTMLElement {
    const known = this.session.player.devotion.discovered;
    const row = (kind: 'like' | 'dislike', i: number, text: string, amount: number): HTMLElement =>
      known.includes(`${g.id}:${kind}:${i}`)
        ? el('li', { class: amount > 0 ? 'tip-good' : 'tip-bad' }, `${text} (${amount > 0 ? '+' : ''}${amount})`)
        : el('li', { class: 'dim' }, '??? (not yet discovered)');
    return el(
      'div',
      { class: 'god-deeds' },
      el('div', {}, el('b', {}, 'Likes'), el('ul', {}, ...g.likes.map((d, i) => row('like', i, d.text, d.amount)))),
      el('div', {}, el('b', {}, 'Dislikes'), el('ul', {}, ...g.dislikes.map((d, i) => row('dislike', i, d.text, d.amount)))),
    );
  }

  private blessingButton(b: BlessingDef, action: HTMLButtonElement): HTMLElement {
    const rarity = content.rarities.get(b.rarity);
    return el('div', { class: 'blessing-card' }, el('b', { style: `color:${rarity.color}` }, b.name), el('div', { class: 'small' }, b.description), el('div', { class: 'dim small' }, b.kind === 'minor' ? `${b.battles} battles · ${b.favorCost} favor` : `${rarity.name} · needs ${tierName(b.minTier ?? 'acknowledged')}`), action);
  }

  private details(): HTMLElement {
    const s = this.session;
    const p = s.player;
    const g = content.pantheon.get(this.selected);
    const god = content.gods.get(g.id);
    const favor = favorOf(p, g.id);
    const panel = el('section', { class: 'panel god-details' });
    if (this.message) panel.append(el('div', { class: 'field-error' }, this.message));
    const relation = (ids: string[]): string => ids.map((id) => content.gods.get(id).name).join(', ') || 'none';
    panel.append(
      el('h2', { style: `color:${god.color}` }, `${god.name}, ${god.epithet}`),
      el('div', { class: 'dim' }, `${god.domain} · ${g.alignment} · ${content.elements.get(god.element).name} · favors ${god.favoredStats.map((st) => st.toUpperCase()).join('/')}`),
      el('p', { class: 'small' }, `${g.personality} Symbol: ${god.symbol}.`),
      this.favorBar(g.id),
      el('div', { class: 'small' }, `Rivals: ${relation(g.rivals)} · Allies: ${relation(g.allies)}`),
      this.deeds(g),
    );

    // Shrine actions.
    const prayed = p.devotion.lastPrayer[g.id] === s.state.clock.day;
    const patron = p.devotion.patron === g.id;
    panel.append(
      el('h3', {}, g.shrine),
      el(
        'div',
        { class: 'row wrap' },
        this.btn(prayed ? 'Prayed today' : `Pray (+${DEVOTION.shrinePrayerFavor})`, () => this.say(s.devotion.prayAtShrine(g.id)), prayed, 'primary'),
        this.btn(patron ? 'Your patron' : 'Make patron', () => this.say(s.devotion.setPatron(patron ? undefined : g.id)), !patron && !atLeast(p, g.id, DEVOTION.prayerTier)),
      ),
      el('p', { class: 'dim small' }, `Patron: in battle, Pray (P) for ${g.prayer.name}: ${g.prayer.description} (${g.prayer.cost} favor). Intervention: ${g.intervention.name}.`),
    );

    // Offerings.
    const goldInput = el('input', { type: 'number', min: '1', value: String(this.goldAmount), 'aria-label': 'Gold to offer', class: 'gold-input' });
    goldInput.addEventListener('input', () => {
      this.goldAmount = Math.max(1, Math.floor(Number(goldInput.value) || 0));
      offerGold.textContent = `Offer ${this.goldAmount} gold (+${goldOfferingFavor(g.id, this.goldAmount)})`;
    });
    const offerGold = this.btn(`Offer ${this.goldAmount} gold (+${goldOfferingFavor(g.id, this.goldAmount)})`, () => this.say(s.devotion.offerGold(g.id, this.goldAmount)));
    const items = s.state.inventory.slots
      .map((it, i) => ({ it, i }))
      .filter((x): x is { it: NonNullable<typeof x.it>; i: number } => x.it !== null && !x.it.junk)
      .map(({ it, i }) => ({ it, i, favor: itemOfferingFavor(g.id, it.baseId, itemValue(it)) }))
      .filter((x) => x.favor >= 1)
      .sort((a, b) => b.favor - a.favor)
      .slice(0, 8)
      .map(({ it, i, favor }) => this.btn(`${itemName(it)} (+${favor})`, () => this.say(s.devotion.offerItem(g.id, i)), false, 'tab'));
    panel.append(
      el('h3', {}, 'Offerings'),
      el('p', { class: 'dim small' }, g.offerings.text),
      el('div', { class: 'row wrap' }, goldInput, offerGold),
      ...(items.length ? [el('div', { class: 'tabs wrap' }, ...items)] : [el('p', { class: 'dim small' }, 'Nothing in your bags interests this god right now.')]),
    );

    // Blessings.
    const offer = p.devotion.offers[g.id];
    if (offer) {
      panel.append(
        el('h3', {}, 'Choose a blessing'),
        el('div', { class: 'blessing-grid' }, ...offer.map((id) => this.blessingButton(content.blessings.get(id), this.btn('Accept', () => this.say(s.devotion.chooseOffer(g.id, id)), false, 'primary')))),
      );
    }
    const minors = content.blessings.filter((b) => b.god === g.id && b.kind === 'minor');
    panel.append(
      el('h3', {}, 'Minor blessings'),
      el('div', { class: 'blessing-grid' }, ...minors.map((b) => this.blessingButton(b, this.btn('Receive', () => this.say(s.devotion.receiveMinor(b.id)), favor < (b.favorCost ?? 0) || !atLeast(p, g.id, DEVOTION.minorBlessingTier))))),
    );
    const owned = p.devotion.majors.map((id) => content.blessings.get(id)).filter((b) => b.god === g.id);
    if (owned.length) {
      panel.append(
        el('h3', {}, 'Major blessings received'),
        el(
          'div',
          { class: 'blessing-grid' },
          ...owned.map((b) => {
            const slotted = p.devotion.slotted.includes(b.id);
            return this.blessingButton(b, this.btn(slotted ? 'Unslot' : 'Slot', () => this.say(slotted ? s.devotion.unslot(b.id) : s.devotion.slot(b.id))));
          }),
        ),
      );
    }
    const scripture = content.generalSkills.all().find((x) => x.god === g.id);
    if (scripture) {
      panel.append(
        el('h3', {}, 'Scripture'),
        el('p', { class: 'small' }, `${scripture.name}: ${scripture.description} Learnable only while ${god.name} blesses you.`),
        this.btn(`Buy scripture (${DEVOTION.scriptureCost} favor)`, () => this.say(s.devotion.buyScripture(g.id)), !atLeast(p, g.id, DEVOTION.scriptureTier) || favor < DEVOTION.scriptureCost),
      );
    }
    return panel;
  }

  render = (): void => {
    if (!this.root) return;
    hideTooltip();
    this.root.replaceChildren(
      el('div', { class: 'sheet' }, navBar(this.session, this.nav, 'pantheon'), el('div', { class: 'pantheon-body' }, el('div', { class: 'pantheon-left' }, this.summary(), this.godList()), this.details())),
    );
  };
}
