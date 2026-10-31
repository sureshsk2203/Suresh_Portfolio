import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { smooth } from '../lib/math';
import { createScene } from '../lib/scene';
import { createToolsScene } from '../lib/toolsScene';
import { reduce } from '../lib/viewport';
import './Universe.css';

export default function Universe() {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const person = useRef<HTMLImageElement>(null);
  const copy = useRef<HTMLParagraphElement>(null);
  /** true when WebGL isn't available -> show the static photo instead */
  const [noGL, setNoGL] = useState(false);

  useEffect(() => {
    const sec = section.current!;
    const titleEl = title.current!;
    const personEl = person.current!;
    const copyEl = copy.current!;

    const gl = createToolsScene(sec, canvas.current!);
    setNoGL(!gl);

    const render = (p: number) => {
      const intro = smooth(p, 0, 0.2);
      const t = gsap.ticker.time;
      titleEl.style.opacity = String(intro);
      titleEl.style.transform = `translateY(${(1 - intro) * 30}px)`;
      personEl.style.opacity = String(intro);
      if (gl) gl.render(p, t);
      const c = smooth(p, 0.3, 0.5);
      copyEl.style.opacity = String(c);
      copyEl.style.transform = `translateY(${(1 - c) * 20}px)`;
    };

    const onResize = () => gl?.size();
    window.addEventListener('resize', onResize);

    let disposeScene = () => {};
    if (reduce) render(0.5);
    else disposeScene = createScene({ id: 'universe', el: sec, len: '240%', render });

    return () => {
      window.removeEventListener('resize', onResize);
      disposeScene();
      gl?.dispose();
    };
  }, []);

  return (
    <section ref={section} className={'scene uni' + (noGL ? ' nogl' : '')} id="universe" aria-label="Tools and skills">
      <canvas ref={canvas} className="tools-gl" aria-hidden="true" style={noGL ? { display: 'none' } : undefined} />
      <div ref={title} className="uni-title">
        <small className="mono">Welcome to</small>
        <h2>The creative universe</h2>
      </div>
      <img ref={person} className="uni-person" src="/img/back.webp" alt="" width={520} height={1421} />
      <ul className="uni-side l mono" aria-hidden="true">{['Design','Motion','Brand','Create','Repeat'].map((x) => <li key={x}>{x}</li>)}</ul>
      <ul className="uni-side r mono" aria-hidden="true">{['Imagine','Generate','Visualize','Innovate'].map((x) => <li key={x}>{x}</li>)}</ul>
      <p ref={copy} className="uni-copy">
        B.Sc. Computer Science graduate. I <em>design in Figma</em> and ship in React, with Python, Flask, PHP and MySQL
        behind it.
      </p>
    </section>
  );
}
