import type { EnemyDef } from '../engine/combat/types';
import { foes, type FoeRow } from './regions/foes';

/** Chests that bite. Which one answers depends on the level of the ground it sits on. */
const MIMIC_ROWS: FoeRow[] = [
  ['chest-mimic', 'Chest Mimic', 'mimic', ['mimic', 'construct'], 10, 'brute', 'physical', ['savage-bite'], 'Lid Snap', 'It was a perfectly good chest until it opened its mouth.', '#7a5a30', '#d8b060'],
  ['gilded-mimic', 'Gilded Mimic', 'mimic', ['mimic', 'construct'], 30, 'brute', 'physical', ['savage-bite', 'war-cry'], 'Gilt Jaws', 'Gold leaf over teeth. It has eaten a locksmith or two.', '#b8902a', '#fff0a0'],
  ['vault-mimic', 'Vault Mimic', 'mimic', ['mimic', 'construct'], 55, 'tank', 'physical', ['shield-bash', 'war-cry'], 'Door Slam', 'It is shaped like a strongbox and behaves like a siege tower.', '#5a5a68', '#e0e0f0'],
  ['void-mimic', 'Void Mimic', 'mimic', ['mimic', 'void'], 80, 'skirm', 'shadow', ['savage-bite', 'wail'], 'Hollow Maw', 'The inside of this chest is bigger than the outside, and hungrier.', '#2a1a40', '#b080ff'],
];

/** The Mimic Emperor sometimes answers when a deep chest is opened. */
const EMPEROR_ROW: FoeRow[] = [
  ['mimic-emperor', 'The Mimic Emperor', 'mimic', ['mimic', 'construct'], 70, 'brute', 'physical', ['savage-bite', 'shield-bash', 'war-cry'], 'Imperial Bite', 'Every treasure ever stolen from a monster was bait. He kept the receipts.', '#c8a030', '#ffe890'],
];

export const MIMICS: EnemyDef[] = [...foes(MIMIC_ROWS), ...foes(EMPEROR_ROW, 'boss', 'boss')];
