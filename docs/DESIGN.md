

I-7a: `AfflictionActions` (`s.afflictions`) owns Afflictions, Weariness, the Hard Road and the Whisper Meter; its `mods()` feed `WondersActions.refresh()`. Cure quests are ordinary `QuestDef`s gated on the flag `affliction:<id>`. Flanking lives in `dealDamage` (a `flankers` list on the target, cleared at its turn); weariness 6 is read at `startBattle` through `battle.weary`.
