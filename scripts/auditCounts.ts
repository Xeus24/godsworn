/** Prints content counts for docs/EXPANSION_AUDIT.md. Run with `npx tsx scripts/auditCounts.ts`. */
import { content } from '../src/data';

const out: Record<string, number | string> = {};
for (const [k, v] of Object.entries(content)) {
  const t = v as { all?: () => readonly unknown[] };
  if (typeof t.all === 'function') out[k] = t.all().length;
  else if (Array.isArray(v)) out[k] = v.length;
}
console.log(JSON.stringify(out, null, 1));
const u = content.uniques.all();
const by: Record<string, number> = {};
for (const x of u) by[x.rarity] = (by[x.rarity] ?? 0) + 1;
console.log('uniques by rarity', by);
const bases = content.items.all();
const cat: Record<string, number> = {};
for (const b of bases) cat[b.category] = (cat[b.category] ?? 0) + 1;
console.log('item categories', cat);
console.log('weapon types', content.weaponTypes.all().map((w) => w.id).join(','));
console.log('races', content.races.all().map((r) => r.id).join(','));
console.log('classes', content.classes.all().map((r) => r.id).join(','));
console.log('gods', content.gods.all().map((r) => r.id).join(','));
console.log('zones', content.zones.all().map((r) => `${r.id}`).join(','));
console.log('towns', content.towns.all().map((r) => r.id).join(','));
console.log('dungeons', content.dungeons.all().map((r) => r.id).join(','));
console.log('professions', content.professions.all().map((r) => r.id).join(','));
console.log('companions', content.companions.all().map((r) => r.id).join(','));
console.log('statuses', content.statuses.all().map((r) => r.id).join(','));
console.log('factions', content.factions.all().map((r) => r.id).join(','));
console.log('endings', content.endings.all().map((r) => r.id).join(','));
console.log('birthSigns', content.birthSigns.all().map((r) => r.id).join(','));
console.log('hybrids', content.hybrids.all().map((r) => r.id).join(','));
console.log('mounts', content.mounts.all().length, 'pets', content.pets.all().length);
console.log('paragon', content.paragon.all().length);
const nodes = content.trees.all().map((t) => `${t.id}:${Object.keys((t as {nodes?: object}).nodes ?? {}).length || ((t as {nodes?: unknown[]}).nodes?.length ?? '?')}`);
console.log('trees', nodes.join(' '));
const q = content.quests.all() as { id: string; kind?: string; category?: string; type?: string }[];
const qk: Record<string, number> = {};
for (const x of q) { const k = x.category ?? x.kind ?? x.type ?? '?'; qk[k] = (qk[k] ?? 0) + 1; }
console.log('quests by kind', qk);
const eg: Record<string, number> = {};
for (const e of content.enemies.all() as { family?: string; type?: string }[]) { const k = e.family ?? e.type ?? '?'; eg[k] = (eg[k] ?? 0) + 1; }
console.log('enemies by family/type', eg);
