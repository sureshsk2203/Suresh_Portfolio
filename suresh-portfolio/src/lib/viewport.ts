/**
 * Shared, mutable viewport + mouse state.
 * Read inside animation loops (so no React re-renders on every frame).
 * Listeners are registered at import time, so they always run before
 * any component-level resize/mousemove handler.
 */
export const view = {
  W: window.innerWidth,
  H: window.innerHeight,
  /** mouse x / y, -0.5 … 0.5 */
  MX: 0,
  MY: 0,
};

window.addEventListener('resize', () => {
  view.W = window.innerWidth;
  view.H = window.innerHeight;
});
window.addEventListener('mousemove', (e) => {
  view.MX = e.clientX / view.W - 0.5;
  view.MY = e.clientY / view.H - 0.5;
});

export const narrow = () => window.innerWidth <= 760;

export const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
