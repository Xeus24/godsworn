/**
 * Regenerates the generated sections of CONTENT.md from the data files, so
 * the catalogue never drifts from the game. Run with `npm run content:md`.
 * Each section lives between `<!-- name:start -->` and `<!-- name:end -->`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { content } from '../src/data';
import type { ModifierSpec } from '../src/engine/stats/modifiers';

const FILE = new URL('../CONTENT.md', import.meta.url);

function mod(m: ModifierSpec): string {
  const info = content.stats.get(m.stat);
  const v = Math.abs(m.value);
  const sign = m.value >= 0 ? '+' : '-';
  if (m.type === 'flat') return info.format === 'percent' ? `${sign}${v}% ${info.name}` : `${sign}${v} ${info.name}`;
  if (m.type === 'percent') return `${sign}${v}% increased ${info.name}`;
  if (m.type === 'more') return `${v}% ${m.value >= 0 ? 'more' : 'less'} ${info.name}`;
  return `${info.name} = ${m.value}`;
}

const cell = (s: string): string => s.replace(/\|/g, '\\|');

function itemsSection(): string {
  const out: string[] = [];
  const rarityLine = content.rarities
    .all()
    .map((r) => `${r.name} (${r.affixes[0]}-${r.affixes[1]} affixes${r.minNgPlus ? `, NG+${r.minNgPlus}+` : ''}${r.eliteOnly ? ', elites/bosses only' : ''})`)
    .join(' · ');
  out.push(`**Rarities (12):** ${rarityLine}`, '');
  out.push(`**Quality:** ${content.qualities.all().map((q) => `${q.name} x${q.statMult}`).join(' · ')}`, '');

  const weapons = content.items.filter((b) => b.category === 'weapon' && b.tier === 1);
  out.push('### Weapon types (tier 1 shown; 7 tiers each)', '', '| Type | Hands | Damage | Magic | Innate |', '|---|---|---|---|---|');
  for (const b of weapons) {
    if (b.category !== 'weapon') continue;
    out.push(
      `| ${content.weaponTypes.get(b.weaponType).name} | ${b.offhandOnly ? 'off-hand' : b.hands} | ${b.damage?.join('-') ?? (b.armor ? `armor ${b.armor.join('-')}` : '')} | ${b.magic?.join('-') ?? ''} | ${b.implicit.map(mod).join(', ')} |`,
    );
  }
  out.push('', `**Armor:** 8 slots × 4 weights × 7 tiers = ${content.items.filter((b) => b.category === 'armor').length} bases.`);
  out.push(`**Accessories:** ${content.items.filter((b) => b.category === 'accessory').length} bases (rings, amulets, earrings, holy symbols, trinkets with on-use abilities).`, '');

  const uniqueTable = (rarity: string, title: string): void => {
    const list = content.uniques.filter((u) => u.rarity === rarity);
    out.push(`### ${title} (${list.length})`, '', '| Item | Base | Lvl | Effects |', '|---|---|---|---|');
    for (const u of list) {
      const effects = [...u.modifiers.map(mod), ...u.effectText];
      if (u.activeAbility) effects.push(`Use: ${u.activeAbility.name}: ${u.activeAbility.description}`);
      if (u.awakening) effects.push(`Awakens (${u.awakening.description}): ${u.awakening.effectText}`);
      out.push(`| **${u.name}** | ${content.items.get(u.baseId).name} | ${u.level} | ${cell(effects.join('; '))} |`);
    }
    out.push('');
  };
  uniqueTable('legendary', 'Legendaries');
  uniqueTable('mythic', 'Mythics');
  uniqueTable('relic', 'Relics');

  out.push(`### Item sets (${content.itemSets.size})`, '');
  for (const set of content.itemSets.all()) {
    out.push(`**${set.name}**${set.classId ? ` (${content.classes.get(set.classId).name})` : ''}: ${set.pieces.map((p) => content.uniques.get(p).name).join(', ')}`);
    for (const b of set.bonuses) out.push(`- (${b.pieces}) ${b.text}`);
    out.push('');
  }

  out.push(`### Runewords (${content.runewords.size})`, '', '| Runeword | Runes | Fits | Effect |', '|---|---|---|---|');
  for (const rw of content.runewords.all()) {
    out.push(`| **${rw.name}** | ${rw.runes.map((r) => content.items.get(r).name.replace(' Rune', '')).join(' + ')} | ${rw.targets.join(', ')} | ${cell([...rw.modifiers.map(mod), rw.text].join('; '))} |`);
  }
  out.push('');

  const runes = content.items.filter((b) => b.category === 'rune');
  out.push(`**Runes (${runes.length}):** ${runes.map((r) => r.name.replace(' Rune', '')).join(', ')}`, '');
  const gemTypes = [...new Set(content.items.filter((b) => b.category === 'gem').map((g) => (g.category === 'gem' ? g.gemType : '')))];
  out.push(`**Gems (${gemTypes.length} types × 5 grades):** ${gemTypes.join(', ')}. Grades: Chipped, Flawed, Clear, Flawless, Perfect.`, '');

  const prefixes = content.affixes.filter((a) => a.kind === 'prefix');
  const suffixes = content.affixes.filter((a) => a.kind === 'suffix');
  out.push(`### Affixes (${content.affixes.size}, 7 tiers each)`, '');
  out.push(`**Prefixes (${prefixes.length}):** ${prefixes.map((a) => `${a.name} (${a.stats.map((s) => content.stats.get(s.stat).name).join('/')})`).join(', ')}`, '');
  out.push(`**Suffixes (${suffixes.length}):** ${suffixes.map((a) => `${a.name} (${a.stats.length > 2 ? 'all resists' : a.stats.map((s) => content.stats.get(s.stat).name).join('/')})`).join(', ')}`, '');
  out.push(`**Corruptions:** boons: ${content.corruptions.filter((x) => x.kind === 'boon').map((x) => `${x.name} (${x.text})`).join(', ')}. Drawbacks: ${content.corruptions.filter((x) => x.kind === 'drawback').map((x) => `${x.name} (${x.text})`).join(', ')}.`, '');

  const consumables = content.items.filter((b) => b.category === 'consumable');
  out.push(`### Consumables (${consumables.length})`, '');
  out.push(consumables.map((b) => `${b.name}${b.description ? `: ${b.description}` : ''}`).map((s) => `- ${s}`).join('\n'), '');
  const materials = content.items.filter((b) => b.category === 'material');
  out.push(`**Materials (${materials.length}):** ${materials.map((m) => m.name).join(', ')}`, '');
  const curios = content.items.filter((b) => b.category === 'curiosity');
  out.push(`**Curiosities (${curios.length}):** ${curios.map((m) => m.name).join(', ')}`, '');
  out.push(`**Mechanic flags (${content.mechanics.size}):** ${content.mechanics.all().map((m) => `\`${m.id}\` (${m.text})`).join(' · ')} · \`immune:<status>\``);
  return out.join('\n');
}

const SECTIONS: Record<string, () => string> = { items: itemsSection };

let md = readFileSync(FILE, 'utf8');
for (const [name, build] of Object.entries(SECTIONS)) {
  const start = `<!-- ${name}:start -->`;
  const end = `<!-- ${name}:end -->`;
  const block = `${start}\n${build()}\n${end}`;
  const re = new RegExp(`${start}[\\s\\S]*?${end}`);
  md = re.test(md) ? md.replace(re, block) : `${md.trimEnd()}\n\n## ${name[0]?.toUpperCase()}${name.slice(1)}\n\n${block}\n`;
}
writeFileSync(FILE, md);
console.log('CONTENT.md updated.');
