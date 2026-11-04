/** NPC emote bubbles (item 35): a small mood glyph above the townsfolk, changing through the day. Deterministic, so it never flickers. */
const DAY: [string, string][] = [['♪', 'humming'], ['…', 'thinking'], ['!', 'has noticed something'], ['♥', 'in a good mood'], ['?', 'curious'], ['☕', 'on a break']];
const NIGHT: [string, string][] = [['z', 'sleepy'], ['…', 'thinking'], ['♪', 'humming quietly'], ['☾', 'watching the moon']];

export function emoteFor(id: string, day: number, night: boolean): { glyph: string; label: string } | undefined {
  let h = 2166136261;
  for (const ch of `${id}:${day}:${night ? 'n' : 'd'}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  h >>>= 0;
  if (h % 5 < 2) return undefined;
  const table = night ? NIGHT : DAY;
  const [glyph, label] = table[(h >>> 8) % table.length] as [string, string];
  return { glyph, label };
}
