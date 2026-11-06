

I-7c1: `WorkshopActions` (`s.workshop`) owns the Spellforge, Kits and Hirelings; state `realm.marvels.workshop` plus `character.forged`. Forged spells are not content files: `engine/skills/forge.ts` builds a `SkillDef` from its recipe id and registers it on demand, so a save only stores ids.
