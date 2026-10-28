import { content } from '../../data';
import { raceUnlocked, raceUnlockText } from '../../engine/character/races';
import { endgameSeen, highestNgPlus, storyCleared } from '../profile';
import { DEFAULT_DIFFICULTY, DIFFICULTIES, type DifficultyId } from '../../data/difficulty';
import { createCharacter, NAME_MAX_LENGTH, validateName } from '../../engine/character/create';
import type { Character } from '../../engine/character/types';
import { choiceIcon, type ChoiceKind } from '../art/choiceIcons';
import { drawPortrait, PORTRAIT_VARIANTS } from '../art/portraits';
import { el, type Screen } from '../screen';
import { renderPreview } from './preview';

export interface CreationChoice {
  name: string;
  portrait: number;
  raceId: string;
  classId: string;
  birthSignId: string;
  background: string;
  hardcore: boolean;
  challenges: string[];
  difficulty: DifficultyId;
}

const RANDOM_NAMES = ['Aldric', 'Seren', 'Bryn', 'Kestrel', 'Morwen', 'Thane', 'Ilya', 'Corvin', 'Isolde', 'Rook', 'Vela', 'Doran'];

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

export class CreationScreen implements Screen {
  private choice: CreationChoice = {
    name: '',
    portrait: 0,
    raceId: 'human',
    classId: 'warrior',
    birthSignId: 'the-forge',
    background: 'soldier',
    hardcore: false,
    challenges: [],
    difficulty: DEFAULT_DIFFICULTY,
  };
  private portraitCanvas = el('canvas', { class: 'portrait-large pixel', 'aria-label': 'Portrait' });
  private nameInput = el('input', { type: 'text', maxlength: String(NAME_MAX_LENGTH), placeholder: 'Name your hero', 'aria-label': 'Name' });
  private nameError = el('div', { class: 'field-error' });
  private beginButton = el('button', { class: 'primary' }, 'Swear your oath');
  private choices = el('div', { class: 'creation-choices' });
  private preview = el('div', { class: 'creation-preview panel' });

  constructor(
    private readonly onCreate: (character: Character) => void,
    private readonly onBack: () => void,
  ) {}

  mount(root: HTMLElement): void {
    this.nameInput.addEventListener('input', () => {
      this.choice.name = this.nameInput.value;
      this.refresh();
    });
    this.beginButton.addEventListener('click', () => this.begin());

    const prev = el('button', { 'aria-label': 'Previous portrait' }, '◀');
    const next = el('button', { 'aria-label': 'Next portrait' }, '▶');
    prev.addEventListener('click', () => this.cyclePortrait(-1));
    next.addEventListener('click', () => this.cyclePortrait(1));

    const hardcore = el('input', { type: 'checkbox', id: 'hardcore' });
    hardcore.addEventListener('change', () => {
      this.choice.hardcore = hardcore.checked;
      this.refresh();
    });

    const randomize = el('button', {}, 'Randomize');
    randomize.addEventListener('click', () => this.randomize(hardcore));
    const back = el('button', {}, 'Back');
    back.addEventListener('click', this.onBack);

    const hero = el(
      'div',
      { class: 'creation-hero panel' },
      el('h2', {}, 'Your Hero'),
      el('div', { class: 'portrait-picker' }, prev, this.portraitCanvas, next),
      this.nameInput,
      this.nameError,
      el(
        'label',
        { class: 'checkbox', for: 'hardcore' },
        hardcore,
        el('span', {}, 'Hardcore: death is permanent'),
      ),
      ...(!endgameSeen() ? [] : [el(
        'details',
        { class: 'small' },
        el('summary', {}, 'Challenge modes'),
        ...content.challenges.all().map((ch) => {
          const box = el('input', { type: 'checkbox', id: `challenge-${ch.id}` }) as HTMLInputElement;
          box.addEventListener('change', () => {
            this.choice.challenges = box.checked ? [...this.choice.challenges, ch.id] : this.choice.challenges.filter((x) => x !== ch.id);
          });
          return el('label', { class: 'checkbox', for: `challenge-${ch.id}`, title: ch.description }, box, el('span', {}, `${ch.name}: ${ch.description}`));
        }),
      )]),
      el('div', { class: 'creation-actions' }, this.beginButton, randomize, back),
    );

    root.append(el('div', { class: 'creation-screen' }, hero, this.choices, this.preview));
    this.refresh();
    this.nameInput.focus();
  }

  unmount(): void {}

  private cyclePortrait(delta: number): void {
    this.choice.portrait = (this.choice.portrait + delta + PORTRAIT_VARIANTS) % PORTRAIT_VARIANTS;
    this.refresh();
  }

  private randomize(hardcore: HTMLInputElement): void {
    this.choice = {
      name: pickRandom(RANDOM_NAMES),
      portrait: Math.floor(Math.random() * PORTRAIT_VARIANTS),
      raceId: pickRandom(content.races.all().filter((r) => raceUnlocked(r, highestNgPlus(), storyCleared())).map((r) => r.id)),
      classId: pickRandom(content.classes.ids()),
      birthSignId: pickRandom(content.birthSigns.ids()),
      background: pickRandom(content.backgrounds.ids()),
      hardcore: this.choice.hardcore,
      challenges: this.choice.challenges,
      difficulty: this.choice.difficulty,
    };
    hardcore.checked = this.choice.hardcore;
    this.nameInput.value = this.choice.name;
    this.refresh();
  }

  private begin(): void {
    if (validateName(this.choice.name)) {
      this.refresh(true);
      return;
    }
    this.onCreate(createCharacter({ ...this.choice }));
  }

  private refresh(showErrors = false): void {
    drawPortrait(this.portraitCanvas, this.choice.raceId, this.choice.portrait, content.classes.get(this.choice.classId).color + '55');
    const error = validateName(this.choice.name);
    this.nameError.textContent = error && (showErrors || this.choice.name.length > 0) ? error : '';
    this.beginButton.disabled = error !== undefined;

    this.choices.replaceChildren(
      this.group(
        'Difficulty',
        [...DIFFICULTIES],
        this.choice.difficulty,
        (d) => [d.name, `Enemies x${d.enemy.hp} HP, x${d.enemy.damage} damage`],
        (id) => (this.choice.difficulty = id as DifficultyId),
        undefined,
        'difficulty',
      ),
      this.group(
        'Race',
        content.races.all().filter((r) => !r.unlock || endgameSeen() || ('clear' in r.unlock && storyCleared())),
        this.choice.raceId,
        (r) => [r.name, raceUnlocked(r, highestNgPlus(), storyCleared()) ? r.passive.name : `Locked: ${raceUnlockText(r)}`],
        (id) => (this.choice.raceId = id),
        (r) => !raceUnlocked(r, highestNgPlus(), storyCleared()),
        'race',
      ),
      this.group(
        'Class',
        content.classes.all(),
        this.choice.classId,
        (c) => [c.name, `${c.role} · ${'★'.repeat(c.difficulty)}${'☆'.repeat(3 - c.difficulty)}`],
        (id) => (this.choice.classId = id),
        undefined,
        'class',
      ),
      this.group(
        'Background',
        content.backgrounds.all(),
        this.choice.background,
        (b) => [b.name, Object.entries(b.statBonus).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(' ')],
        (id) => (this.choice.background = id),
      ),
      this.group(
        'Birth Sign',
        content.birthSigns.all(),
        this.choice.birthSignId,
        (s) => [s.name, content.gods.get(s.god).name],
        (id) => (this.choice.birthSignId = id),
        undefined,
        'birth',
      ),
    );

    // Preview uses a placeholder name until a valid one is typed.
    const preview = createCharacter({ ...this.choice, name: error ? 'Hero' : this.choice.name });
    this.preview.replaceChildren(renderPreview(preview, this.choice.hardcore));
  }

  private group<T extends { id: string }>(
    title: string,
    items: T[],
    selected: string,
    label: (item: T) => [string, string],
    select: (id: string) => void,
    locked?: (item: T) => boolean,
    icon?: ChoiceKind,
  ): HTMLElement {
    const cards = items.map((item, i) => {
      const [name, sub] = label(item);
      const card = el(
        'button',
        { class: `choice-card${item.id === selected ? ' selected' : ''}`, 'aria-pressed': String(item.id === selected) },
        ...(icon ? [choiceIcon(icon, item.id, i, items.length)] : []),
        el('span', { class: 'choice-text' }, el('span', { class: 'choice-name' }, name), el('span', { class: 'choice-sub' }, sub)),
      );
      if (locked?.(item)) {
        card.disabled = true;
        card.classList.add('locked');
      }
      card.addEventListener('click', () => {
        select(item.id);
        this.refresh();
      });
      return card;
    });
    return el('section', { class: 'choice-group' }, el('h3', {}, title), el('div', { class: 'choice-grid' }, ...cards));
  }
}
