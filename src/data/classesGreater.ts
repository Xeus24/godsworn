import type { GreaterClass } from './greaterClass';
import { ALCHEMIST } from './trees/alchemist';
import { DRUID } from './trees/druid';
import { KNIGHT } from './trees/knight';
import { SHAMAN } from './trees/shaman';
import { SUMMONER } from './trees/summoner';
import { WARLOCK } from './trees/warlock';

/** The twelve classes added by the Greater Pantheon update; the first six are built, the rest follow in later phases. */
export const GREATER_CLASSES: GreaterClass[] = [KNIGHT, DRUID, WARLOCK, SUMMONER, ALCHEMIST, SHAMAN];
