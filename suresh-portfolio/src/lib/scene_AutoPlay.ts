import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** order the scenes appear on the page (used by the navbar) */
export const SCENE_ORDER = ['hero', 'universe', 'journey', 'work', 'contact'] as const;
export type SceneId = (typeof SCENE_ORDER)[number];

export interface Scene {
  id: SceneId;
  el: HTMLElement;
  /** smoothed progress 0..1 (what render() receives) */
  p: number;
  /** target progress straight from ScrollTrigger */
  t: number;
  on: boolean;
  force: boolean;
  last?: number;
  st: ScrollTrigger;
  render: (p: number) => void;
}

const registry = new Map<SceneId, Scene>();

export const getScene = (id: SceneId) => registry.get(id);

interface SceneOptions {
  id: SceneId;
  el: HTMLElement;
  /** scroll distance the scene is pinned for, e.g. '240%' */
  len: string;
  render: (p: number) => void;
  pin?: boolean;
  /** Automatically advance scene progress after it enters the viewport. */
  autoPlay?: boolean;
  /** Auto-play duration in milliseconds. */
  autoDuration?: number;
}

/**
 * Pins a section and feeds its eased scroll progress to render() every frame.
 * Returns a cleanup function (kills the trigger, un-pins, stops the ticker).
 */
export function createScene({ id, el, len, render, pin = true, autoPlay = false, autoDuration = 6500 }: SceneOptions): () => void {
  const s = { id, el, p: 0, t: 0, on: true, force: true, render } as Scene;
  let autoStart: number | null = null;

  s.st = ScrollTrigger.create({
    trigger: el,
    start: 'top top',
    end: '+=' + len,
    pin,
    anticipatePin: 1,
    onUpdate: (self) => {
      if (!autoPlay) s.t = self.progress;
    },
    onToggle: (self) => {
      s.on = self.isActive;
      if (autoPlay) {
        if (self.isActive && autoStart === null) autoStart = gsap.ticker.time;
        if (!self.isActive && self.direction < 0) {
          autoStart = null;
          s.t = 0;
          s.p = 0;
          s.force = true;
        }
      } else if (!s.on) s.t = self.progress;
    },
  });

  const tick = () => {
    if (autoPlay && s.on && autoStart !== null) {
      s.t = Math.min(1, Math.max(0, (gsap.ticker.time - autoStart) * 1000 / autoDuration));
    }
    const d = s.t - s.p;
    if (Math.abs(d) > 0.0002) s.p += d * 0.1;
    else s.p = s.t;
    if (s.on || s.force || s.p !== s.last) {
      s.render(s.p);
      s.last = s.p;
      s.force = false;
    }
  };

  gsap.ticker.add(tick);
  registry.set(id, s);

  return () => {
    gsap.ticker.remove(tick);
    s.st.kill(true);
    if (registry.get(id) === s) registry.delete(id);
  };
}
