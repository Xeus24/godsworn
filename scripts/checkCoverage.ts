/** Counts which quests have a dialogue with a gated choice ([STR 25], race, background, class, god). `npx tsx scripts/checkCoverage.ts [kind]` */
import { content } from '../src/data';

const dlg = new Map(content.dialogues.all().map((d) => [d.id, d]));
const gatedKinds = new Set(['stat', 'race', 'background', 'class', 'favor', 'apostle', 'companion', 'rep']);
const hasCheck = (id: string): boolean => {
  const d = dlg.get(id);
  return !!d && Object.values(d.nodes).some((n) => (n.choices ?? []).some((c) => c.cond && gatedKinds.has(c.cond.kind)));
};
const dialoguesOf = (q: (typeof content.quests extends { all(): (infer T)[] } ? T : never)): string[] => {
  const ids: string[] = [];
  for (const st of q.stages) for (const o of st.objectives) if ('dialogue' in o && o.dialogue) ids.push(o.dialogue);
  // Topics on the giver that open while the quest is active also count.
  for (const npc of content.npcs.all()) for (const t of npc.topics ?? []) if (t.cond?.kind === 'quest' && t.cond.quest === q.id) ids.push(t.dialogue);
  return ids;
};
const kinds = process.argv[2] ? [process.argv[2]] : ['main', 'side'];
for (const k of kinds) {
  const qs = content.quests.filter((q) => q.kind === k);
  const gated = qs.filter((q) => dialoguesOf(q).some(hasCheck));
  const noDlg = qs.filter((q) => dialoguesOf(q).length === 0);
  console.log(`${k}: ${gated.length}/${qs.length} gated (${((gated.length / qs.length) * 100).toFixed(0)}%), ${noDlg.length} with no dialogue objective`);
  if (process.argv[3]) console.log('  ungated:', qs.filter((q) => !gated.includes(q)).map((q) => q.id).join(' '));
}
