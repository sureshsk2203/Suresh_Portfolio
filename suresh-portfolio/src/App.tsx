import { useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AmbientBackground from './components/AmbientBackground';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Universe from './components/Universe';
import Journey from './components/Journey';
import Work from './components/Work';
import Contact from './components/Contact';
import ScrollRail from './components/ScrollRail';
import { reduce } from './lib/viewport';

function App() {
  useEffect(() => {
    // reduced motion: no pinned scenes, sections simply stack
    if (reduce) {
      document.body.classList.add('reduce');
      return () => document.body.classList.remove('reduce');
    }

    // recalculate pin positions once images / fonts have changed the layout
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    document.fonts?.ready.then(refresh);
    if (document.readyState === 'complete') refresh();
    return () => window.removeEventListener('load', refresh);
  }, []);

  return (
    <>
      <div id="top" />
      <AmbientBackground />
      <Navbar />
      {/* NOTE: scene sections must stay in page order — ScrollTrigger pins are created in this order */}
      <main>
        <Hero />
        <Universe />
        <Journey />
        <Work />
        <Contact />
      </main>
      <ScrollRail />
    </>
  );
}

export default App;
