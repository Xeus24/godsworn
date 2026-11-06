I-8a: `RealmsActions` (`s.realms`) owns the Gloaming Court's bargains and the Four Thresholds; areas and dungeons are `late` content in `data/realms.ts` (appended after the pocket and Twilight ones so older layouts do not move). `WorldActions` asks `realms.shut(ref)` before entering an area; `PocketActions.step/onMap` delegate to `realms.step/onMap`.


I-7c2: `GraceActions` (`s.grace`) owns Holdings and the weekly call; the Last Prayer lives on `Combatant.lastPrayer` (set in `applyDivineCombat`, resolved in `hits.ts`). Mounted Combat is `Combatant.mounted` set in `createHero` when `stable.mount` is out; the dismount reaction is in `applyDamage`.
