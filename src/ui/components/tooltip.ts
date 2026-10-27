/**
 * One shared floating tooltip. Call `attachTooltip(element, render)`; the
 * render function runs on hover so the tooltip always shows current values.
 */
let tip: HTMLElement | undefined;

function tooltipNode(): HTMLElement {
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'tooltip';
    tip.setAttribute('role', 'tooltip');
    document.body.append(tip);
  }
  return tip;
}

function place(e: MouseEvent): void {
  placeAt(e.clientX + 14, e.clientY + 14, e.clientX, e.clientY);
}

function placeAt(x0: number, y0: number, mx: number, my: number): void {
  const node = tooltipNode();
  const pad = 14;
  const { innerWidth: w, innerHeight: h } = window;
  const rect = node.getBoundingClientRect();
  let x = x0;
  let y = y0;
  if (x + rect.width > w - 4) x = Math.max(4, mx - rect.width - pad);
  if (y + rect.height > h - 4) y = Math.max(4, my - rect.height - pad);
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
}

export function attachTooltip(target: HTMLElement, render: () => HTMLElement | string): void {
  target.addEventListener('mouseenter', (e) => {
    const node = tooltipNode();
    const content = render();
    node.replaceChildren(typeof content === 'string' ? document.createTextNode(content) : content);
    node.classList.add('visible');
    place(e);
  });
  target.addEventListener('mousemove', place);
  target.addEventListener('mouseleave', hideTooltip);
  // Keyboard users get the same tooltip when an element takes focus.
  target.addEventListener('focus', () => {
    if (!target.matches(':focus-visible')) return;
    const node = tooltipNode();
    const content = render();
    node.replaceChildren(typeof content === 'string' ? document.createTextNode(content) : content);
    node.classList.add('visible');
    const r = target.getBoundingClientRect();
    placeAt(r.right + 6, r.top, r.left, r.top);
  });
  target.addEventListener('blur', hideTooltip);
}

/** Shows the shared tooltip at the mouse (for things that are not DOM elements, like icons painted on a canvas). */
export function showTooltip(e: MouseEvent, content: HTMLElement | string): void {
  const node = tooltipNode();
  node.replaceChildren(typeof content === 'string' ? document.createTextNode(content) : content);
  node.classList.add('visible');
  place(e);
}

export function hideTooltip(): void {
  tip?.classList.remove('visible');
}
