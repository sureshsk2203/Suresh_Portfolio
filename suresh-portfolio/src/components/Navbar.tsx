import { useEffect, useState, type MouseEvent } from 'react';
import { SCENE_ORDER, getScene, type SceneId } from '../lib/scene';
import { view } from '../lib/viewport';
import './Navbar.css';

const LINKS: { id: SceneId; label: string }[] = [
  { id: 'universe', label: 'Universe' },
  { id: 'journey', label: 'Journey' },
  { id: 'work', label: 'Work' },
  { id: 'contact', label: 'Contact' },
];

export default function Navbar() {
  // index into LINKS of the section currently on screen (-1 = hero)
  const [current, setCurrent] = useState(-1);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + view.H * 0.4;
      let cur = -1;
      SCENE_ORDER.forEach((id, i) => {
        const s = getScene(id);
        if (i > 0 && s && y >= s.st.start) cur = i - 1;
      });
      setCurrent(cur);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (id: SceneId) => (e: MouseEvent) => {
    e.preventDefault();
    const s = getScene(id);
    if (s) {
      window.scrollTo({ top: s.st.start + (id === 'hero' ? 0 : 2), behavior: 'smooth' });
    } else if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // reduced-motion mode: sections aren't pinned, so scroll to the element itself
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="nav gut">
      <a className="logo" href="#top" onClick={go('hero')} aria-label="Back to top">
        SK
      </a>
      <nav aria-label="Sections">
        {LINKS.map((l, i) => (
          <a key={l.id} href={'#' + l.id} onClick={go(l.id)} className={i === current ? 'on' : undefined}>
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
