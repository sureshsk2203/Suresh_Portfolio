import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { narrow, view } from '../lib/viewport';

interface Ember {
  x: number;
  y: number;
  r: number;
  v: number;
  s: number;
  a: number;
}

/** Fixed full-screen canvas of drifting embers. */
export default function Embers() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const cx = cv.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const size = () => {
      cv.width = view.W * dpr;
      cv.height = view.H * dpr;
    };
    size();

    const P: Ember[] = [];
    const n = narrow() ? 40 : 90;
    for (let i = 0; i < n; i++) {
      P.push({
        x: Math.random() * view.W,
        y: Math.random() * view.H,
        r: 0.5 + Math.random() * 1.9,
        v: 0.15 + Math.random() * 0.6,
        s: Math.random() * 6.28,
        a: 0.25 + Math.random() * 0.6,
      });
    }

    const draw = () => {
      const { W, H } = view;
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx.clearRect(0, 0, W, H);
      cx.globalCompositeOperation = 'lighter';
      const t = gsap.ticker.time;
      for (let i = 0; i < P.length; i++) {
        const p = P[i];
        p.y -= p.v;
        p.x += Math.sin(t * 0.6 + p.s) * 0.25;
        if (p.y < -10) {
          p.y = H + 10;
          p.x = Math.random() * W;
        }
        const f = 0.6 + 0.4 * Math.sin(t * 2 + p.s);
        const g = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        g.addColorStop(0, 'rgba(255,170,90,' + p.a * f + ')');
        g.addColorStop(1, 'rgba(255,60,20,0)');
        cx.fillStyle = g;
        cx.beginPath();
        cx.arc(p.x, p.y, p.r * 5, 0, 6.283);
        cx.fill();
      }
    };

    gsap.ticker.add(draw);
    window.addEventListener('resize', size);
    return () => {
      gsap.ticker.remove(draw);
      window.removeEventListener('resize', size);
    };
  }, []);

  return <canvas ref={ref} className="embers" aria-hidden="true" />;
}
