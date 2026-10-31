import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { CONTACTS, type ContactItem } from '../data/contacts';
import { clamp, smooth } from '../lib/math';
import { createScene } from '../lib/scene';
import { narrow, reduce } from '../lib/viewport';
import CopyButton from './CopyButton';
import Footer from './Footer';
import './Contact.css';

gsap.registerPlugin(ScrollToPlugin);

/* ---- intro (SURESH + photo) : tune here ---- */
const NAME = 'SURESH';
const PHOTO = '/img/suresh_casual.webp'; // put the photo in public/img/
const LEN_FRAC = 2.5; // total pinned scroll length (x screen height)
const INTRO_END = 0.4; // first 40% of the scroll = SURESH + photo, the rest = contact panel
const IDLE = 1.1; // seconds without scrolling before it plays by itself
const HOLD = 1.3; // seconds to rest on the finished SURESH screen before the contact panel
const L_GAP = 0.15; // delay between letters (fraction of the intro)
const L_LEN = 0.25; // how long one letter takes to wipe in (fraction)

function ContactRow({ item }: { item: ContactItem }) {
  const link = useRef<HTMLAnchorElement>(null);
  return (
    <div className="crow">
      <span className="k">{item.label}</span>
      <a
        ref={link}
        className="v"
        href={item.href}
        {...(item.external ? { target: '_blank', rel: 'noopener' } : {})}
      >
        {item.text}
      </a>
      {item.copy && <CopyButton value={item.copy} selectRef={link} />}
    </div>
  );
}

export default function Contact() {
  const section = useRef<HTMLElement>(null);
  const outA = useRef<HTMLDivElement>(null);
  const outB = useRef<HTMLDivElement>(null);
  const outCopy = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const meRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const sec = section.current!;
    const a = outA.current!;
    const b = outB.current!;
    const copy = outCopy.current!;
    const nameEl = nameRef.current!;
    const meEl = meRef.current!;
    const glowEl = glowRef.current!;
    const tagEl = tagRef.current!;
    const letters = letterRefs.current.filter(Boolean) as HTMLSpanElement[];

    if (reduce) {
      b.style.clipPath = 'none';
      a.style.display = 'none';
      return;
    }

    /* ---------------- SURESH + photo intro ---------------- */
    let letterLeft = 0;
    let letterW: number[] = [];
    let nameW = 1;
    const measure = () => {
      if (!letters.length) return;
      letterLeft = letters[0].offsetLeft;
      letterW = letters.map((el) => el.offsetWidth);
      nameW = nameEl.offsetWidth || 1;
    };
    measure();
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure); // widths change once the display font has loaded

    /* letters wipe in one by one, left to right (k = 0..1) */
    const revealLetters = (k: number) => {
      if (k >= 1) {
        nameEl.style.clipPath = 'none';
        return;
      }
      let shown = 0;
      for (let i = 0; i < letterW.length; i++) {
        shown += smooth(k, i * L_GAP, i * L_GAP + L_LEN) * letterW[i];
      }
      const inset = Math.max(0, 100 - ((letterLeft + shown) / nameW) * 100);
      nameEl.style.clipPath = `inset(0 ${inset}% 0 0)`;
    };

    const applyIntro = (k: number) => {
      revealLetters(clamp((k - 0.08) / 0.62, 0, 1));
      const kp = smooth(k, 0.26, 0.74);
      meEl.style.opacity = String(kp);
      meEl.style.transform = `translateY(${(1 - kp) * 14}%)`;
      const kg = smooth(k, 0.12, 0.6);
      glowEl.style.opacity = String(kg);
      glowEl.style.transform = `translateX(-50%) scale(${0.8 + 0.2 * kg})`;
      tagEl.style.transform = `translateY(${(1 - smooth(k, 0.68, 0.95)) * 115}%)`;
    };

    /* ---------------- plays by itself when the visitor pauses ---------------- */
    let currentP = 0;
    let lastP = -1;
    let idleT = 0;
    let assist: gsap.core.Tween | null = null;
    let autoDone = false; // runs once; later visits are manual

    const onScreen = () => {
      const r = sec.getBoundingClientRect();
      return r.bottom > window.innerHeight * 0.5 && r.top < window.innerHeight * 0.5;
    };

    // scroll position for a given progress p (works with or without ScrollTrigger's pin-spacer)
    const geometry = () => {
      const sp = sec.parentElement;
      const L =
        sp && sp.classList.contains('pin-spacer')
          ? sp.offsetHeight - sec.offsetHeight
          : LEN_FRAC * sec.offsetHeight;
      return { L, y0: window.scrollY - currentP * L };
    };

    const assistRun = () => {
      if (autoDone || narrow() || !onScreen()) return;
      const { L, y0 } = geometry();
      if (currentP < INTRO_END - 0.012) {
        // stage 1: play SURESH + photo
        assist = gsap.to(window, {
          scrollTo: { y: y0 + INTRO_END * L, autoKill: true }, // the visitor scrolling takes over at once
          duration: Math.max(1.4, ((INTRO_END - currentP) / INTRO_END) * 3.6),
          ease: 'none',
        });
      } else if (currentP < 0.995) {
        // stage 2 (after the HOLD): the contact panel wipes in
        autoDone = true;
        assist = gsap.to(window, {
          scrollTo: { y: y0 + L, autoKill: true },
          duration: Math.max(1.4, (1 - currentP) * 3),
          ease: 'power1.inOut',
        });
      }
    };

    const schedule = (p: number) => {
      window.clearTimeout(idleT);
      if (autoDone || narrow() || p >= 0.995) return;
      const resting = Math.abs(p - INTRO_END) < 0.012; // finished SURESH screen: rest a little longer
      idleT = window.setTimeout(assistRun, (resting ? HOLD : IDLE) * 1000);
    };

    /* the cream panel wipes in diagonally over the SURESH screen */
    const render = (p: number) => {
      currentP = p;
      if (narrow()) {
        b.style.clipPath = 'none';
        return;
      }
      applyIntro(clamp(p / INTRO_END, 0, 1));

      const p2 = clamp((p - INTRO_END) / (1 - INTRO_END), 0, 1);
      const q = smooth(p2, 0.12, 0.72);
      const top = 130 - q * 155;
      const bot = top - 25 + 5;
      b.style.clipPath = `polygon(${top}% 0,100% 0,100% 100%,${bot}% 100%)`;
      a.style.opacity = String(1 - smooth(p2, 0.4, 0.75));
      a.style.transform = `scale(${1 + p2 * 0.18})`;
      const c = smooth(p2, 0.6, 0.95);
      copy.style.opacity = String(c);
      copy.style.transform = `translateX(${(1 - c) * -40}px)`;

      if (Math.abs(p - lastP) > 1e-4) {
        lastP = p;
        schedule(p);
      }
    };

    // also start the idle timer when the section first arrives on screen
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && e.intersectionRatio >= 0.9) schedule(currentP);
      },
      { threshold: [0.9] }
    );
    io.observe(sec);

    const disposeScene = createScene({
      id: 'contact',
      el: sec,
      len: narrow() ? '1%' : `${LEN_FRAC * 100}%`,
      render,
      pin: !narrow(),
    });

    return () => {
      window.removeEventListener('resize', measure);
      window.clearTimeout(idleT);
      assist?.kill();
      io.disconnect();
      disposeScene();
    };
  }, []);

  return (
    <section ref={section} className="scene out" id="contact" aria-label="Contact">
      <div ref={outA} className="out-a">
        <div ref={glowRef} className="out-glow" />
        <h2 ref={nameRef} className="out-name" aria-label="Suresh">
          {NAME.split('').map((ch, i) => (
            <span
              key={i}
              aria-hidden="true"
              ref={(el) => {
                letterRefs.current[i] = el;
              }}
            >
              {ch}
            </span>
          ))}
        </h2>
        <div ref={meRef} className="out-me">
          <img src={PHOTO} alt="Suresh Kumar A" width={480} height={792} />
        </div>
        <div className="out-scrim" />
        <p className="out-tag">
          <span ref={tagRef}>Let&rsquo;s make something people remember.</span>
        </p>
      </div>
      <div ref={outB} className="out-b">
        <div className="out-photo">
          <img src="/img/car_lean.jpg" alt="Suresh leaning on a classic red sports car" width={1024} height={1536} />
        </div>
        <div ref={outCopy} className="out-copy">
          <span className="mono">Open to work &amp; projects</span>
          <h2>
            Let&rsquo;s build <em>together</em>
          </h2>
          <div className="contacts">
            {CONTACTS.map((c) => (
              <ContactRow key={c.label} item={c} />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    </section>
  );
}