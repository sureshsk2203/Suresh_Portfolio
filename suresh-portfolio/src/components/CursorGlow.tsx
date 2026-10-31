import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { reduce } from '../lib/viewport';

/** Soft orange light that follows the mouse (fine pointers only). */
export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;
    if (reduce || !window.matchMedia('(pointer:fine)').matches) {
      el.style.display = 'none';
      return;
    }
    const gx = gsap.quickTo(el, 'x', { duration: 0.6 });
    const gy = gsap.quickTo(el, 'y', { duration: 0.6 });
    const onMove = (e: MouseEvent) => {
      gx(e.clientX);
      gy(e.clientY);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return <div ref={ref} className="cursor-glow" aria-hidden="true" />;
}
