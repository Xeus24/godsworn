K: promotions are generated from `ROWS` in `data/promotions.ts` (title pair, element, attack stat per class); trees gain two `BranchDef.promotion` branches in `withPromotions` (`trees/index.ts`), shut by `canAllocate` until `ClassProgress.promotion` reaches the tier.
J: evolutions are rows in `ROWS` of `data/evolutions.ts` (class, base skill, quest number 1-5, id, name, text, power, extra effects); the `evolved` condition counts `Character.evolved` entries.
I-8c: the 15 new hybrids reuse the Greater-hybrid generator (`HybridSpec` in `hybridsGreater.ts`); register a new one with a `HybridSpec` row, a `pair()` row in `multiclass.ts` and a `HYBRID_TRIAL_THREAT` value.
I-8b: `GuildActions` (`s.guild`) runs the Guild (contracts are `startSpecial` fights, module `guild`, ref `c:<id>` or `r:<rival>`) and the Tales & Tankards game (state in `guild.tales.run`). Narration is a pure UI transform on toasts.
I-8a: `RealmsActions` (`s.realms`) owns the Gloaming Court's bargains and the Four Thresholds; areas and dungeons are `late` content in `data/realms.ts` (appended after the pocket and Twilight ones so older layouts do not move). `WorldActions` asks `realms.shut(ref)` before entering an area; `PocketActions.step/onMap` delegate to `realms.step/onMap`.


I-7c2: `GraceActions` (`s.grace`) owns Holdings and the weekly call; the Last Prayer lives on `Combatant.lastPrayer` (set in `applyDivineCombat`, resolved in `hits.ts`). Mounted Combat is `Combatant.mounted` set in `createHero` when `stable.mount` is out; the dismount reaction is in `applyDamage`.
