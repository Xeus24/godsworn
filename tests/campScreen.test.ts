// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { GameSession } from '../src/engine/state/gameState';
import { PartyScreen } from '../src/ui/party/partyScreen';
import type { Nav } from '../src/ui/components/navBar';
import { makeHero } from './helpers';

vi.mock('../src/ui/art/portraits', () => ({ drawPortrait: () => document.createElement('canvas') }));
vi.mock('../src/ui/art/heroSprite', () => ({ heroSprite: () => document.createElement('canvas') }));
vi.mock('../src/ui/art/itemIcons', () => ({ itemIconUrl: () => '' }));

const nav = new Proxy({}, { get: () => () => undefined }) as Nav;

describe('the camp on the Party screen', () => {
  it('shows the chat, the evening scenes, loyalty and the personal line', () => {
    const session = GameSession.newGame(5, makeHero());
    session.party.recruit('sable');
    session.state.party.companions.sable!.approval = 50;
    const root = document.createElement('div');
    const screen = new PartyScreen(session, nav, () => undefined);
    screen.mount(root);
    const buttons = [...root.querySelectorAll('button')];
    const sableCard = buttons.find((b) => (b.textContent ?? '').includes('Sable'));
    sableCard?.click();
    const text = root.textContent ?? '';
    expect(text).toContain('Camp');
    expect(text).toContain('Sit by the fire');
    expect(text).toContain('Spend the evening');
    expect(text).toContain('Honor Among Thieves');
    expect(text).toContain('Personal line');
    const fire = [...root.querySelectorAll('button')].find((b) => b.textContent === 'Sit by the fire') as HTMLButtonElement;
    fire.click();
    expect(root.textContent).toContain('“');
    screen.unmount();
  });
});
