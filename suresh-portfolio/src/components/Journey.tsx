import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './Journey.css';

const journey = [
  {
    year: '2021',
    label: 'EDUCATION',
    title: 'Higher Secondary',
    description:
      'Started my academic journey at P.L.W.A Higher Secondary School, V.K. Puram. Completed Higher Secondary education with 77%.',
  },
  {
    year: '2022',
    label: 'BEGINNING',
    title: 'B.Sc. Computer Science',
    description:
      'Joined St. Joseph College of Arts & Science, Tenkasi, to begin my journey in Computer Science and technology.',
  },
  {
    year: '2024',
    label: 'DESIGN JOURNEY',
    title: 'UI/UX Design Certification',
    description:
      'Completed UI/UX Design Certification at DesignSchool. Developed skills in Figma, wireframing, prototyping and user interface design.',
  },
  {
    year: '2025',
    label: 'MILESTONE',
    title: 'Graduated',
    description:
      'Successfully completed B.Sc. Computer Science with 78%. Strengthened my foundation in programming, web development and database technologies.',
  },
  {
    year: '2026',
    label: 'PRESENT',
    title: 'Growth Nest Tech Solution',
    description:
      'Working across frontend development, UI/UX design and full-stack projects. Building practical digital experiences using modern technologies.',
  },
];

const N = journey.length;
const COPIES = 8; // endless shelf: milestones repeat so wrapping happens off-screen
const M = N * COPIES;
const AUTO_DELAY = 2.2; // seconds between automatic moves

const smooth = (x: number) => x * x * (3 - 2 * x);
const wrap = (i: number) => ((i % N) + N) % N;

export default function Journey() {
  const shelfRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const tapeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // mutable animation state (kept out of React state so the rAF loop is cheap)
  const st = useRef({
    s: 3 * N,
    T: 3 * N,
    hover: -1,
    mx: -9999,
    my: -9999,
    tiltX: 0,
    tiltY: 0,
    dragging: false,
    dragMoved: false,
    x0: 0,
    T0: 0,
    wheelTimer: 0,
    rel: new Array(M).fill(99) as number[],
    lift: new Array(M).fill(0) as number[],
    H: 400,
    ws: 68,
    d: 312,
    gap: 12,
    active: 0,
    dir: 1,
    idle: 0,
    paused: false,
    auto: true,
    open: false,
  });

  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  const reducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- caption slide (mask) whenever the active milestone changes ---------- */
  const firstCaption = useRef(true);
  useLayoutEffect(() => {
    if (firstCaption.current) {
      firstCaption.current = false;
      return;
    }
    if (reducedMotion() || !captionRef.current) return;
    const dir = st.current.dir;
    captionRef.current
      .querySelectorAll<HTMLElement>('[data-line]')
      .forEach((el, i) => {
        el.animate(
          [
            { transform: `translateY(${dir * 105}%)` },
            { transform: 'translateY(0)' },
          ],
          {
            duration: 650,
            delay: i * 60,
            easing: 'cubic-bezier(.2,.8,.2,1)',
            fill: 'both',
          }
        );
      });
  }, [active]);

  /* ---------- tab indicator ---------- */
  useLayoutEffect(() => {
    const tab = tabRefs.current[active];
    const ind = indicatorRef.current;
    if (!tab || !ind) return;
    ind.style.width = tab.offsetWidth + 'px';
    ind.style.transform = `translateX(${tab.offsetLeft}px)`;
  }, [active]);

  /* ---------- lock page scroll while the detail is open ---------- */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* ---------- detail: open / close ---------- */
  const coverRect = () => {
    const S = st.current;
    let best = 0;
    let min = Infinity;
    for (let v = 0; v < M; v++) {
      const a = Math.abs(S.rel[v]);
      if (a < min) {
        min = a;
        best = v;
      }
    }
    const el = tapeRefs.current[best]?.querySelector('.cv');
    return el ? el.getBoundingClientRect() : null;
  };

  const insetFor = (r: DOMRect | null) =>
    r
      ? `inset(${r.top}px ${window.innerWidth - r.right}px ${
          window.innerHeight - r.bottom
        }px ${r.left}px round 3px)`
      : 'inset(50% 50% 50% 50% round 3px)';

  const openDetail = () => {
    const S = st.current;
    const det = detailRef.current;
    if (!det || S.open) return;
    S.open = true;
    S.T = Math.round(S.T);
    const reduce = reducedMotion();
    const r = coverRect();

    det.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    det.style.visibility = 'visible';
    det.style.transformOrigin = r
      ? `${r.left + r.width / 2}px ${r.top + r.height / 2}px`
      : '50% 50%';
    setOpen(true);

    // a sheet of paper grows out of the cover, straightening as it expands
    det.animate(
      [
        { clipPath: insetFor(r), transform: 'rotate(-4.5deg)' },
        { clipPath: 'inset(0px 0px 0px 0px round 0px)', transform: 'rotate(0deg)' },
      ],
      {
        duration: reduce ? 1 : 1050,
        easing: 'cubic-bezier(.76,0,.18,1)',
        fill: 'both',
      }
    );

    // every line rises out of its own mask
    det.querySelectorAll<HTMLElement>('[data-rise]').forEach((el, i) => {
      el.animate(
        [{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }],
        {
          duration: reduce ? 1 : 900,
          delay: reduce ? 0 : 620 + i * 60,
          easing: 'cubic-bezier(.2,.8,.2,1)',
          fill: 'both',
        }
      );
    });

    window.setTimeout(() => closeBtnRef.current?.focus({ preventScroll: true }), 700);
  };

  const closeDetail = () => {
    const S = st.current;
    const det = detailRef.current;
    if (!det || !S.open) return;
    const reduce = reducedMotion();
    const r = coverRect();
    det.style.transformOrigin = r
      ? `${r.left + r.width / 2}px ${r.top + r.height / 2}px`
      : '50% 50%';

    const anim = det.animate(
      [
        { clipPath: 'inset(0px 0px 0px 0px round 0px)', transform: 'rotate(0deg)' },
        { clipPath: insetFor(r), transform: 'rotate(-4.5deg)' },
      ],
      {
        duration: reduce ? 1 : 850,
        easing: 'cubic-bezier(.76,0,.18,1)',
        fill: 'both',
      }
    );
    anim.onfinish = () => {
      det.style.visibility = 'hidden';
      det.getAnimations({ subtree: true }).forEach((a) => a.cancel());
      S.open = false;
      S.idle = 0;
      setOpen(false);
      shelfRef.current?.focus({ preventScroll: true });
    };
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && st.current.open) closeDetail();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- main engine ---------- */
  useEffect(() => {
    const shelf = shelfRef.current;
    const stage = stageRef.current;
    if (!shelf || !stage) return;

    const S = st.current;
    const reduce = reducedMotion();

    const measure = () => {
      const W = shelf.clientWidth;
      const mobile = window.innerWidth < 768;
      const H = mobile
        ? Math.max(250, Math.min(W * 0.78, window.innerHeight * 0.5, 420))
        : Math.max(300, Math.min(window.innerHeight * 0.52, W * 0.3, 470));
      S.H = H;
      S.ws = (H * 142) / 840;
      S.d = H * 0.78;
      S.gap = H * 0.03;
      stage.style.setProperty('--H', H + 'px');
      stage.style.setProperty('--ws', S.ws + 'px');
      stage.style.setProperty('--d', S.d + 'px');
      shelf.style.height = H + 90 + 'px';
      const tab = tabRefs.current[S.active];
      const ind = indicatorRef.current;
      if (tab && ind) {
        ind.style.width = tab.offsetWidth + 'px';
        ind.style.transform = `translateX(${tab.offsetLeft}px)`;
      }
    };
    measure();
    window.addEventListener('resize', measure);

    const onMove = (e: PointerEvent) => {
      S.mx = e.clientX;
      S.my = e.clientY;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    const B = (r: number) =>
      Math.abs(r) < 1 ? (r + Math.sin(Math.PI * r) / Math.PI) / 2 : Math.sign(r) * 0.5;

    let raf = 0;
    let last = performance.now();
    let visible = true;

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
      },
      { rootMargin: '200px 0px' }
    );
    io.observe(shelf);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visible) return;

      const { H, ws, d, gap } = S;
      const W = shelf.clientWidth;

      // spring towards the target
      const k = reduce ? 1 : S.dragging ? 18 : 7;
      S.s += (S.T - S.s) * (1 - Math.exp(-k * dt));
      if (Math.abs(S.T - S.s) < 1e-4) S.s = S.T;

      // normalise by whole loops
      if (Math.abs(S.s) > M) {
        const shift = Math.sign(S.s) * M;
        S.s -= shift;
        S.T -= shift;
      }

      // auto scroll: glides to the next milestone while nobody is interacting
      const resting = Math.abs(S.T - S.s) < 0.01;
      if (reduce || !S.auto || S.paused || S.open || S.dragging || !resting) {
        S.idle = 0;
      } else {
        S.idle += dt;
        if (S.idle > AUTO_DELAY) {
          S.idle = 0;
          S.T = Math.round(S.T) + 1;
        }
      }

      // active milestone
      const a = wrap(Math.round(S.s));
      if (a !== S.active) {
        S.active = a;
        S.dir = Math.sign(S.T - S.s) || 1;
        setActive(a);
      }

      // tilt towards the cursor
      const rect = shelf.getBoundingClientRect();
      const cxs = rect.left + W / 2;
      const cys = rect.top + rect.height / 2;
      const settled = Math.abs(S.T - S.s) < 0.3;
      const onCover =
        settled &&
        !S.open &&
        Math.abs(S.mx - cxs) < 0.55 * d &&
        Math.abs(S.my - cys) < 0.55 * H;
      const tyT = onCover
        ? ((S.mx - cxs) / (0.55 * d)) * 9
        : ((S.mx - cxs) / Math.max(W, 1)) * 5;
      const txT = onCover ? (-(S.my - cys) / (H / 2)) * 6 : 0;
      const kt = reduce ? 1 : 1 - Math.exp(-7 * dt);
      S.tiltY += (Math.max(-12, Math.min(12, tyT)) - S.tiltY) * kt;
      S.tiltX += (txT - S.tiltX) * kt;

      // place every tape
      for (let v = 0; v < M; v++) {
        const el = tapeRefs.current[v];
        if (!el) continue;

        let r = (((v - S.s) % M) + M) % M;
        if (r > M / 2) r -= M;
        S.rel[v] = r;

        const x = r * (ws + gap) + (d - ws + 1.6 * gap) * B(r);
        if (Math.abs(x) > W / 2 + 1.5 * d) {
          if (el.style.visibility !== 'hidden') el.style.visibility = 'hidden';
          continue;
        }
        if (el.style.visibility !== 'visible') el.style.visibility = 'visible';

        const target = S.hover === v && Math.abs(r) > 0.5 ? 1 : 0;
        S.lift[v] += (target - S.lift[v]) * (reduce ? 1 : 1 - Math.exp(-12 * dt));
        const lift = S.lift[v];

        const o = smooth(Math.max(0, 1 - Math.abs(r)));
        const ry = -90 * o + S.tiltY * o;
        const rx = S.tiltX * o;
        const rz = -4.5 * o;
        const tz = o * 0.2 * H;
        const ty = -o * 0.025 * H - lift * 0.045 * H;

        el.style.transform = `translate3d(${x}px, ${ty}px, ${tz}px) rotateZ(${rz}deg) rotateX(${rx}deg) rotateY(${ry}deg)`;
        el.style.zIndex = String(Math.round(100 - Math.abs(r) * 4));
        el.style.setProperty('--o', String(o));
      }
    };
    raf = requestAnimationFrame(frame);

    /* ----- inputs ----- */
    const onWheel = (e: WheelEvent) => {
      // only hijack clearly horizontal gestures so the page still scrolls normally
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      S.T += (e.deltaX / (S.ws + S.gap)) * 0.5;
      window.clearTimeout(S.wheelTimer);
      S.wheelTimer = window.setTimeout(() => {
        S.T = Math.round(S.T);
      }, 160);
    };
    shelf.addEventListener('wheel', onWheel, { passive: false });

    const onDown = (e: PointerEvent) => {
      S.dragging = true;
      S.dragMoved = false;
      S.x0 = e.clientX;
      S.T0 = S.T;
    };
    const onDragMove = (e: PointerEvent) => {
      if (!S.dragging) return;
      const dx = e.clientX - S.x0;
      if (!S.dragMoved && Math.abs(dx) > 5) S.dragMoved = true;
      if (S.dragMoved) S.T = S.T0 - dx / (S.ws + S.gap);
    };
    const onUp = () => {
      if (!S.dragging) return;
      S.dragging = false;
      if (S.dragMoved) {
        S.T = Math.round(S.T);
        window.setTimeout(() => (S.dragMoved = false), 0);
      }
    };
    shelf.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    // pause auto scroll while the pointer is on the shelf
    const onEnter = () => (S.paused = true);
    const onLeave = () => {
      S.paused = false;
      S.idle = 0;
    };
    shelf.addEventListener('pointerenter', onEnter);
    shelf.addEventListener('pointerleave', onLeave);
    shelf.addEventListener('focusin', onEnter);
    shelf.addEventListener('focusout', onLeave);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        S.T = Math.round(S.T) + 1;
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        S.T = Math.round(S.T) - 1;
      } else if (e.key === 'Enter' && e.target === shelf) {
        e.preventDefault();
        openDetail();
      }
    };
    shelf.addEventListener('keydown', onKey);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointermove', onDragMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      shelf.removeEventListener('wheel', onWheel);
      shelf.removeEventListener('pointerdown', onDown);
      shelf.removeEventListener('pointerenter', onEnter);
      shelf.removeEventListener('pointerleave', onLeave);
      shelf.removeEventListener('focusin', onEnter);
      shelf.removeEventListener('focusout', onLeave);
      shelf.removeEventListener('keydown', onKey);
      window.clearTimeout(S.wheelTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- actions ---------- */
  const go = (delta: number) => {
    st.current.T = Math.round(st.current.T) + delta;
  };

  const goToIndex = (i: number) => {
    const S = st.current;
    let delta = (((i - Math.round(S.T)) % N) + N) % N;
    if (delta > N / 2) delta -= N;
    S.T = Math.round(S.T) + delta;
  };

  const onTapeClick = (v: number) => {
    const S = st.current;
    if (S.dragMoved) return;
    const r = S.rel[v];
    if (Math.abs(r) < 0.5) {
      openDetail(); // clicking the open cover shows the full detail
      return;
    }
    S.T = Math.round(S.T + r);
  };

  const current = journey[active];

  const detail = (
    <div
      className="journey-detail"
      ref={detailRef}
      role="dialog"
      aria-modal="true"
      aria-label={current.title}
      aria-hidden={!open}
    >
      <button className="jd-close" ref={closeBtnRef} onClick={closeDetail}>
        <span className="jd-box">CLOSE ✕</span>
      </button>

      <div className="jd-grid">
        <div className="jd-left">
          <div className="rise-mask">
            <span className="jd-label" data-rise>
              {current.label}
            </span>
          </div>
          <div className="rise-mask">
            <div className="jd-year" data-rise>
              {current.year}
            </div>
          </div>
          <div className="rise-mask">
            <h3 className="jd-title" data-rise>
              {current.title}
            </h3>
          </div>
          <div className="rise-mask">
            <div className="jd-meta" data-rise>
              MILESTONE 0{active + 1} / 0{N}
            </div>
          </div>
          <div className="rise-mask">
            <p className="jd-desc" data-rise>
              {current.description}
            </p>
          </div>
          <div className="rise-mask">
            <div className="jd-actions" data-rise>
              <button className="jd-box jd-btn" onClick={() => go(-1)}>
                ← PREVIOUS
              </button>
              <button className="jd-box jd-btn solid" onClick={() => go(1)}>
                NEXT →
              </button>
            </div>
          </div>
        </div>

        <ol className="jd-right">
          {journey.map((item, i) => (
            <li key={item.year} className="rise-mask">
              <button
                data-rise
                className={`jd-item ${i === active ? 'on' : ''}`}
                onClick={() => goToIndex(i)}
              >
                <span className="jd-item-year">{item.year}</span>
                <span className="jd-item-text">
                  <span className="jd-item-label">{item.label}</span>
                  <span className="jd-item-title">{item.title}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );

  return (
    <section className="journey-section" id="journey">
      <div className="journey-glow journey-glow-one" />
      <div className="journey-glow journey-glow-two" />

      {/* Heading */}
      <div className="journey-heading">
        <span className="journey-eyebrow">2021 → NOW</span>

        <h2>
          JOURNEY
          <br />
          THROUGH TIME
        </h2>

        <p>
          Every milestone shaped my journey. Every experience brought me closer
          to my vision.
        </p>
      </div>

      {/* Year tabs + auto scroll toggle */}
      <div className="journey-bar">
        <nav className="journey-tabs" aria-label="Milestones">
          <span className="tab-indicator" ref={indicatorRef} />
          {journey.map((item, i) => (
            <button
              key={item.year}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              className={`tab ${i === active ? 'active' : ''}`}
              onClick={() => goToIndex(i)}
            >
              {item.year}
            </button>
          ))}
        </nav>
      </div>

      {/* Shelf */}
      <div
        className="journey-shelf"
        ref={shelfRef}
        tabIndex={0}
        aria-label="Journey shelf. Use left and right arrow keys, Enter to open."
      >
        <div className="journey-stage" ref={stageRef}>
          {Array.from({ length: M }, (_, v) => {
            const i = v % N;
            const item = journey[i];
            return (
              <div
                className="tape"
                data-tone={i % 3}
                key={v}
                ref={(el) => {
                  tapeRefs.current[v] = el;
                }}
                onPointerEnter={() => (st.current.hover = v)}
                onPointerLeave={() => {
                  if (st.current.hover === v) st.current.hover = -1;
                }}
                onClick={() => onTapeClick(v)}
              >
                {/* spine: front of the cuboid */}
                <div className="face sp">
                  <span className="sp-dot" />
                  <span className="sp-title">{item.title}</span>
                  <span className="sp-bottom">
                    <span className="sp-brand">0{i + 1}</span>
                    <span className="sp-badge">{item.year}</span>
                  </span>
                </div>

                {/* cover: right-hand side of the cuboid */}
                <div className="face cv">
                  <span className="cv-label">{item.label}</span>
                  <span className="cv-year">{item.year}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span className="cv-foot">
                    <span>MILESTONE / 0{i + 1}</span>
                    <span className="sp-badge">VHS</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          className="journey-arrow prev"
          aria-label="Previous milestone"
          onClick={() => go(-1)}
        >
          <svg width="18" height="10" viewBox="0 0 18 10" fill="none">
            <path d="M5 1 L1 5 L5 9 M1 5 H17" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
        <button
          className="journey-arrow next"
          aria-label="Next milestone"
          onClick={() => go(1)}
        >
          <svg width="18" height="10" viewBox="0 0 18 10" fill="none">
            <path d="M13 1 L17 5 L13 9 M17 5 H1" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>

      {/* Caption */}
      <div className="journey-caption" ref={captionRef} aria-live="polite">
        <div className="cap-mask">
          <div className="cap-title" data-line key={'t' + active}>
            {current.title}
          </div>
        </div>
        <div className="cap-mask">
          <div className="cap-sub" data-line key={'s' + active}>
            {current.label}
          </div>
        </div>
        <div className="cap-mask">
          <div className="cap-year" data-line key={'y' + active}>
            {current.year}
          </div>
        </div>
      </div>

      <div className="journey-viewrow">
        <button className="journey-view" onClick={openDetail}>
          VIEW FULL DETAIL ↗
        </button>
      </div>

      {/* Footer */}
      <div className="journey-footer">
        <span>THE JOURNEY CONTINUES</span>
        <span>BUILT WITH PASSION.</span>
      </div>

      {typeof document !== 'undefined' && createPortal(detail, document.body)}
    </section>
  );
}