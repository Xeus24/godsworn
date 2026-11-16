/**
 * Every wiki section, in sidebar order within its group. Add a section by
 * writing `sections/<name>.ts` and listing it here.
 */
import type { WikiSection } from '../core/types';
import { bestiarySection } from './bestiary';
import { charactersSection } from './characters';
import { guidesSection } from './guides';
import { homeSection } from './home';
import { itemsSection } from './items';
import { skillsSection } from './skills';
import { systemsSections } from './systems';
import { worldSection } from './world';

const CONTENT_SECTIONS: WikiSection[] = [guidesSection, charactersSection, skillsSection, itemsSection, bestiarySection, worldSection, ...systemsSections];

export const SECTIONS: WikiSection[] = [homeSection(CONTENT_SECTIONS), ...CONTENT_SECTIONS];
