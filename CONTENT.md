# Godsworn: Content Catalogue

A review list of all game content. It is updated each phase as content lands.

## Stats

**Primary (7):** STR, DEX, INT, VIT, WIS, LUK, FAI

**Gear inputs (5):** Weapon Damage, Weapon Magic, Relic Power, Armor, Armor Resist

**Derived (28):**

| Stat | Formula / base | Cap |
|---|---|---|
| Max HP | 50 + VIT×10 + level×5 | min 1 |
| Max MP | 20 + INT×4 + WIS×3 + level×2 | |
| Physical Attack | STR×2 + weapon damage | |
| Magic Attack | INT×2 + weapon magic | |
| Divine Power | FAI×2 + relic power | |
| Defense | VIT + armor | |
| Magic Resist | WIS + armor resist | |
| Crit Chance | 5% + LUK×0.5% | 60% |
| Crit Damage | 150% | min 100% |
| Dodge | DEX×0.4% | 35% |
| Accuracy | 90% + DEX×0.2% | 100% |
| Speed | 10 + DEX×0.5 | min 1 |
| Lifesteal | 0% | 30% |
| Cooldown Reduction | 0% | 40% |
| Status Chance | LUK×0.2% | |
| Status Resist | WIS×0.3% + VIT×0.1% | 75% |
| Gold Find | LUK×1% | |
| Magic Find | LUK×0.5% | |
| Favor Gain | FAI×1% | |
| Blessing Power | FAI×1% | |
| XP Gain | 0% | |
| Healing Power | WIS×1% + FAI×1% | |
| Healing Received | 0% | |
| Damage Bonus | 0% | |
| Damage Taken | 100% | min 10% |
| Resource Gain | 0% | |
| HP Regen | 0 / turn | |
| MP Regen | WIS×0.1 / turn | |

**Elemental (9 elements × damage + resist):** Physical, Fire, Ice, Lightning, Nature, Holy, Shadow, Arcane, Void. Resist range is -100% to 200%, and anything above 100% absorbs.

## Trigger hooks (14)
onHit, onCrit, onKill, onDamageTaken, onDodge, onTurnStart, onTurnEnd, onLowHp, onSkillCast, onHeal, onStatusApplied, onCombatStart, onCombatEnd, onDeath

## Effect kinds (12)
damage, heal, restoreMp, gainResource, applyStatus, removeStatus, shield, buff, favor, reduceCooldowns, castSkill, gold

## Condition kinds (20)
always, hpBelow, hpAbove, inCombat, timeOfDay, weather, weaponType, skillTag, element, hasStatus, targetHasStatus, targetType, targetHpBelow, patron, stance, resourceAtLeast, flag, all, any, not

## Races, classes, skills, gods, items, enemies, zones, quests
Not yet added (Phases 2+).
