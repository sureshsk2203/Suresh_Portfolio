import { useEffect, useRef } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reduce } from '../lib/viewport';
import './ScrollRail.css';

/** Thin progress bar on the left edge showing page scroll progress. */
export default function ScrollRail() {
  const bar = useRef<HTMLElement>(null);

  useEffect(() => {
    if (reduce) return;
    const st = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      // measure after the pinned scenes have added their spacing
      refreshPriority: -1,
      onUpdate: (self) => {
        bar.current!.style.transform = 'scaleY(' + self.progress + ')';
      },
    });
    return () => st.kill();
  }, []);

  return (
    <div className="rail" aria-hidden="true">
      <i ref={bar} />
    </div>
  );
}
