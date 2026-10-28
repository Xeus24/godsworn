import type { GreaterClass } from './greaterClass';
import { ALCHEMIST } from './trees/alchemist';
import { ARTIFICER } from './trees/artificer';
import { CHRONOMANCER } from './trees/chronomancer';
import { DANCER } from './trees/dancer';
import { DRUID } from './trees/druid';
import { GEOMANCER } from './trees/geomancer';
import { DRAGONSOUL } from './trees/dragonsoul';
import { DREAMWALKER } from './trees/dreamwalker';
import { HEMOMANCER } from './trees/hemomancer';
import { HOLLOWHAND } from './trees/hollowhand';
import { HOLLOWKING } from './trees/hollowking';
import { INKWEAVER } from './trees/inkweaver';
import { KNIGHT } from './trees/knight';
import { PUPPETEER } from './trees/puppeteer';
import { SHAMAN } from './trees/shaman';
import { SUMMONER } from './trees/summoner';
import { WARLOCK } from './trees/warlock';
import { WITCHHUNTER } from './trees/witchhunter';

/** The twelve classes added by the Greater Pantheon update; the first six are built, the rest follow in later phases. */
export const GREATER_CLASSES: GreaterClass[] = [KNIGHT, DRUID, WARLOCK, SUMMONER, ALCHEMIST, SHAMAN, CHRONOMANCER, ARTIFICER, DANCER, INKWEAVER, WITCHHUNTER, GEOMANCER, HEMOMANCER, HOLLOWHAND, DREAMWALKER, DRAGONSOUL, PUPPETEER, HOLLOWKING];
