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
  const node = tooltipNode();
  const pad = 14;
  const { innerWidth: w, innerHeight: h } = window;
  const rect = node.getBoundingClientRect();
  let x = e.clientX + pad;
  let y = e.clientY + pad;
  if (x + rect.width > w - 4) x = Math.max(4, e.clientX - rect.width - pad);
  if (y + rect.height > h - 4) y = Math.max(4, e.clientY - rect.height - pad);
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
