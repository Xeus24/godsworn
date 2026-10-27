import { endgameUnlocked } from '../../engine/endgame/unlocked';
import { HERESY } from '../../data/heresy';
import { atoneCost, heresyTierDef } from '../../engine/gods/heresy';
import { content } from '../../data';
import { uiGlyph } from '../art/uiGlyphs';
import { APOSTLESHIP, DEVOTION } from '../../data/devotion';
import type { PantheonDef } from '../../data/pantheon';
import { activeMinors, blessingSlotCount, isActive } from '../../engine/gods/blessings';
import { interventionChance, interveningGod } from '../../engine/gods/combat';
import { atLeast, favorOf, goldOfferingFavor, itemOfferingFavor, tierName, tierOf, tierProgress } from '../../engine/gods/devotion';
import type { BlessingDef } from '../../engine/gods/types';
import { characterBaseStats } from '../../engine/character/stats';
import { itemValue } from '../../engine/items/itemStats';
import { itemName } from '../../engine/items/naming';
import type { GameSession } from '../../engine/state/gameState';
import { WEAPON_STAGES } from '../../data/apostles';
import type { EncounterDef } from '../../engine/combat/types';
import { apostleTreeId, canAscend, canAttemptTrial, canDefend, currentEdict, trialEncounterId, trialLevel, weaponStage } from '../../engine/gods/apostle';
import { availablePoints } from '../../engine/skills/tree';
import { navBar, type Nav } from '../components/navBar';
import { attachTooltip, hideTooltip } from '../components/tooltip';
import { el, type Screen } from '../screen';

/** Emblem drawn beside each god (reuses the shared pixel glyphs). */
const GOD_GLYPH: Record<string, string> = { solenne: 'sun', morrath: 'skull', kael: 'swords', ysolde: 'leaf', vex: 'note', thalor: 'flame', nymira: 'bolt', aurelis: 'star', hesha: 'temple', grimvald: 'coin' };
const godGlyph = (id: string): HTMLCanvasElement => uiGlyph(GOD_GLYPH[id] ?? 'star');

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
  private confirmRenounce = false;

  constructor(
    private readonly session: GameSession,
    private readonly nav: Nav,
    private readonly fight: (encounter: EncounterDef, level?: number) => void,
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
    const tier = tierOf(this.session.player, god);
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
      const tier = tierOf(p, g.id);
      const offer = p.devotion.offers[g.id] ? el('span', { class: 'badge gold' }, 'Blessing!') : '';
      const card = el(
        'button',
        { class: `god-card${this.selected === g.id ? ' selected' : ''}`, style: `--god:${god.color}` },
        el('div', { class: 'god-head' }, godGlyph(g.id), el('b', { style: `color:${god.color}` }, god.name), p.devotion.patron === g.id ? el('span', { class: 'badge' }, 'Patron') : '', offer),
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
      el('h2', { style: `color:${god.color}` }, godGlyph(g.id), ` ${god.name}, ${god.epithet}`),
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
      el('p', { class: s.world.canWorship(g.id) ? 'tip-good small' : 'dim small' }, s.world.canWorship(g.id) ? `You can worship ${god.name} here.` : `To pray, make offerings or receive blessings, visit ${god.name}'s shrines (${content.zones.filter((z) => z.shrines.includes(g.id)).map((z) => z.name).join(', ')}) or a temple (${content.towns.filter((t) => t.temple.includes(g.id)).map((t) => t.name).join(', ') || 'none'}).`),
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
    panel.append(...this.apostleSection(g.id));
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

  /** Trial of Apostleship (from Exalted), ascension, and the Apostle's duties and apostasy. */
  private apostleSection(god: string): HTMLElement[] {
    const s = this.session;
    const p = s.player;
    const name = content.gods.get(god).name;
    const apostle = p.devotion.apostle;
    if (apostle?.god === god) {
      const def = content.apostles.get(god);
      const avatar = content.skills.get(def.avatar);
      const edict = currentEdict(p);
      const e = apostle.edict;
      const weapon = def.weapon.names[weaponStage(p.level) - 1];
      const follower = content.enemies.get(`follower-${god}`);
      const renounce = this.btn(this.confirmRenounce ? 'Click again: renounce forever?' : 'Renounce (apostasy)', () => {
        if (!this.confirmRenounce) {
          this.confirmRenounce = true;
          this.render();
          return;
        }
        this.confirmRenounce = false;
        this.say(s.devotion.renounce());
      }, false, 'danger');
      return [
        el('h3', {}, `Apostle of ${name}`),
        el('p', { class: 'small' }, `Divine Avatar: ${avatar.name}. ${avatar.description} (once per battle, uses the Ultimate gauge)`),
        el('p', { class: 'small' }, `Divine weapon: ${weapon}. It evolves at levels ${WEAPON_STAGES.slice(1).map((st) => st.level).join(', ')}.`),
        el('p', { class: 'small' }, `Apostle tree: ${availablePoints(p, apostleTreeId(god))} point(s) to spend in the Skills screen.`),
        el('h3', {}, 'Divine Edict'),
        edict && e
          ? el('div', { class: `edict${apostle.neglected ? ' neglected' : ''}` }, el('b', {}, edict.text), el('div', { class: 'small' }, `Progress ${e.progress}/${edict.count} · ${e.battlesLeft} battle${e.battlesLeft === 1 ? '' : 's'} left · ${apostle.edictsDone} fulfilled`), ...(apostle.neglected ? [el('div', { class: 'tip-bad small' }, 'Neglected: apostle passives at 75% until you fulfil an edict.')] : []))
          : el('p', { class: 'dim small' }, 'No edict right now.'),
        el('h3', {}, 'Follower'),
        el('p', { class: 'small' }, `${follower.name}: ${follower.description} It fights beside you when called; enemies grow a little tougher for it.`),
        this.btn(p.devotion.followerCalled ? `Dismiss ${follower.name}` : `Call ${follower.name}`, () => this.say(s.devotion.callFollower(!p.devotion.followerCalled))),
        el('p', { class: 'dim small' }, `Fulfilling an edict earns favor and gold; ignoring one costs favor and weakens your apostle powers. Renouncing ${name} makes them Hated, stores your weapon and apostle tree, and their heralds will hunt you.`),
        renounce,
      ];
    }
    if (p.devotion.defender === god) {
      return [el('h3', {}, `Defender of ${name}`), el('p', { class: 'small' }, `You serve ${name} beside ${content.gods.get(apostle?.god ?? god).name}: their Divine blessing is yours (in its own slot), and they count you as their Apostle. The Defender path ends if you renounce your Apostleship.`)];
    }
    if (!atLeast(p, god, 'exalted') && (p.devotion.trialStage[god] ?? 0) === 0) {
      return [el('h3', {}, 'Trial of Apostleship'), el('p', { class: 'dim small' }, `Reach Exalted favor (${DEVOTION.tierFloors.exalted}) to face ${name}'s trial and become their Apostle.`)];
    }
    const done = p.devotion.trialStage[god] ?? 0;
    const stages = [1, 2, 3].map((stage) => {
      const enc = content.encounters.get(trialEncounterId(god, stage));
      const check = canAttemptTrial(p, god, stage);
      const level = trialLevel(p, stage);
      return el(
        'div',
        { class: `trial-stage${stage <= done ? ' done' : ''}` },
        el('b', {}, enc.name),
        el('div', { class: 'dim small' }, `${enc.description} (level ${level})`),
        stage <= done ? el('span', { class: 'enc-tag ok' }, 'Complete') : this.btn('Fight', () => this.fight(enc, level), !check.ok, 'primary'),
      );
    });
    const ascend = canAscend(p, god);
    return [
      el('h3', {}, 'Trial of Apostleship'),
      el('p', { class: 'dim small' }, `Three stages, fought at your level. Apostles gain a 20-node apostle tree, a Divine Avatar, a god-bound weapon, a Divine blessing (with its own slot) and a title. You may serve only one god as Apostle.`),
      el('div', { class: 'trial-grid' }, ...stages),
      ...(done >= 3 ? [this.btn(`Ascend as Apostle of ${name}`, () => this.say(s.devotion.ascend(god)), !ascend.ok, 'primary'), ...(!ascend.ok ? [el('div', { class: 'dim small' }, ascend.reason)] : [])] : []),
      ...(done >= 3 && apostle && endgameUnlocked(s.state) ? this.defenderSection(god) : []),
    ];
  }

  /** The Defender path (NG+3+): serve a second god beside your own. */
  private defenderSection(god: string): HTMLElement[] {
    const s = this.session;
    const check = canDefend(s.player, god, s.state.ngPlus);
    return [
      el('h3', {}, 'The Defender path'),
      el('p', { class: 'dim small' }, `From New Game+${APOSTLESHIP.defenderNgPlus}, an Apostle may also defend a second god who is not their own god's rival: its Divine blessing (in one more slot), the Apostle tier with it, and a title.`),
      this.btn(`Defend ${content.gods.get(god).name}`, () => this.say(s.devotion.defend(god)), !check.ok, 'primary'),
      ...(check.ok ? [] : [el('div', { class: 'dim small' }, check.reason)]),
    ];
  }

  /** Heresy toward the Nameless One, atonement, and how pantheon politics have shifted. */
  private heresy(): HTMLElement | undefined {
    const s = this.session;
    const p = s.player;
    const shifts = Object.entries(p.devotion.politics);
    if (p.devotion.heresy <= 0 && shifts.length === 0) return undefined;
    const tier = heresyTierDef(p);
    const next = HERESY.tiers.find((t) => t.min > p.devotion.heresy);
    const parts: HTMLElement[] = [];
    if (p.devotion.heresy > 0) {
      const cost = atoneCost(p);
      parts.push(
        el('h3', {}, `Heresy: ${tier?.name ?? 'Stirring'} (${Math.floor(p.devotion.heresy)})`),
        el('p', { class: 'small' }, tier ? tier.description : 'The Nameless One has noticed you, no more.'),
        el('p', { class: 'dim small' }, `${next ? `Next: ${next.name} at ${next.min}. ` : ''}Each point costs ${HERESY.favorCostPerPoint} favor with every god. Slaying the gods’ heralds and wielding the void feed it. Heretics may learn Forbidden skills and buy from the Black Market’s back room.`),
        this.btn(`Atone at the temple (${cost} gold)`, () => this.say(s.devotion.atone()), !s.world.inTown() || s.state.gold < cost),
      );
    }
    if (shifts.length) {
      const label = { rival: 'are now rivals', ally: 'stand together', peace: 'set their feud aside' } as const;
      parts.push(el('h3', {}, 'Pantheon politics'), ...shifts.map(([pair, rel]) => el('div', { class: 'small' }, `${pair.split('|').map((g) => content.gods.get(g).name).join(' and ')} ${label[rel]}.`)));
    }
    return el('section', { class: 'panel' }, ...parts);
  }

  render = (): void => {
    if (!this.root) return;
    hideTooltip();
    this.root.replaceChildren(
      el('div', { class: 'sheet' }, navBar(this.session, this.nav, 'pantheon'), el('div', { class: 'pantheon-body' }, el('div', { class: 'pantheon-left' }, this.summary(), ...[this.heresy()].filter((x): x is HTMLElement => x !== undefined), this.godList()), this.details())),
    );
  };
}
