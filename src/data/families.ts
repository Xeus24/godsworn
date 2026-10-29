import type { EnemyDef } from '../engine/combat/types';

/**
 * Creature families beyond the first sixteen: insects, sea creatures, giants and fey. A family
 * picks the sprite shape and the bestiary grouping, so a foe moves here by id.
 */
export const FAMILY_OVERRIDES: Record<string, string> = {
  'frost-giant': 'giant',
  'siren': 'aquatic',
  'sea-serpent': 'aquatic',
  'leviathan-spawn': 'aquatic',
  'magma-titan': 'giant',
  'abyssal-crab': 'aquatic',
  'reed-hag': 'fey',
  'glimmerfly-swarm': 'insect',
  'lantern-eel': 'aquatic',
  'moth-priest': 'insect',
  'dust-hag': 'fey',
  'cave-troll': 'giant',
  'ember-moth': 'insect',
  'lamp-moth': 'insect',
  'dusk-dryad': 'fey',
  'coral-guard': 'aquatic',
  'pearl-clam': 'aquatic',
  'abyssal-angler': 'aquatic',
  'kelp-strangler': 'aquatic',
  'siren-chorister': 'aquatic',
  'deep-jelly': 'aquatic',
  'great-lamp-moth': 'insect',
  'siren-prima': 'aquatic',
  'rootmoth-queen': 'insect',
  'ember-sprite': 'fey',
  'reef-crab': 'aquatic',
  'siren-scout': 'aquatic',
  'rustjaw-the-crab': 'aquatic',
  'kraken-spawn': 'aquatic',
  'pillar-colossus': 'giant',
  'crown-crab': 'aquatic',
  'siren-consort': 'aquatic',
  'piston-giant': 'giant',
  'spark-sprite': 'fey',
  'slag-colossus': 'giant',
  'siren-of-the-whistle': 'aquatic',

};

export const withFamily = (e: EnemyDef): EnemyDef => (FAMILY_OVERRIDES[e.id] ? { ...e, family: FAMILY_OVERRIDES[e.id] as string } : e);
