/** Class promotion marks (Section K): a copy of the hero's figure with gold corner studs at Tier 2, and a halo over the head at Tier 3. */
const GOLD = '#d8a838';
const PALE = '#fff4c0';

const cache = new WeakMap<HTMLCanvasElement, Map<number, HTMLCanvasElement>>();

export function markPromotion(src: HTMLCanvasElement, tier: number): HTMLCanvasElement {
  if (tier < 2) return src;
  const byTier = cache.get(src) ?? new Map<number, HTMLCanvasElement>();
  cache.set(src, byTier);
  const hit = byTier.get(tier);
  if (hit && hit.width === src.width && hit.height === src.height) return hit;
  const out = document.createElement('canvas');
  out.width = src.width;
  out.height = src.height;
  const g = out.getContext('2d');
  if (!g) return src;
  g.drawImage(src, 0, 0);
  const u = Math.max(1, Math.round(src.width / 48));
  const px = (c: string, x: number, y: number, w = 1, h = 1): void => {
    g.fillStyle = c;
    g.fillRect(x * u, y * u, w * u, h * u);
  };
  const W = Math.round(src.width / u);
  const H = Math.round(src.height / u);
  // Tier 2: gold studs at the lower corners and a gold hem.
  px(GOLD, 2, H - 4, 3, 1);
  px(PALE, 3, H - 5, 1, 1);
  px(GOLD, W - 5, H - 4, 3, 1);
  px(PALE, W - 4, H - 5, 1, 1);
  px(GOLD, 4, H - 2, W - 8, 1);
  if (tier >= 3) {
    // Tier 3: a halo over the head.
    const cx = Math.round(W / 2);
    px(PALE, cx - 7, 0, 14, 1);
    px(GOLD, cx - 9, 1, 2, 1);
    px(GOLD, cx + 7, 1, 2, 1);
    px(GOLD, cx - 10, 2, 1, 2);
    px(GOLD, cx + 9, 2, 1, 2);
    px(GOLD, cx - 9, 4, 2, 1);
    px(GOLD, cx + 7, 4, 2, 1);
    px(PALE, cx - 7, 5, 14, 1);
  }
  byTier.set(tier, out);
  return out;
}
