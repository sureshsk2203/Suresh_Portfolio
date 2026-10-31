import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { PROJECTS } from '../data/projects';
import { clamp, smooth } from '../lib/math';
import { createScene, getScene } from '../lib/scene';
import { narrow, reduce, view } from '../lib/viewport';
import './Work.css';

const pad2 = (n: number) => ('0' + n).slice(-2);

export default function Work() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const info = useRef<HTMLDivElement>(null);
  const cardEls = useRef<(HTMLButtonElement | null)[]>([]);
  const shadeEls = useRef<(HTMLDivElement | null)[]>([]);

  const [active, setActive] = useState(0);
  const [detailVisible, setDetailVisible] = useState(false);
  const hoverRef = useRef(false);
  const activeRef = useRef(0);
  const project = PROJECTS[active];

  /* mobile: tapping a project opens its own details page */
  const [detail, setDetail] = useState<number | null>(null);
  const pushed = useRef(false);

  const openDetail = (i: number) => {
    window.history.pushState({ wkDetail: i }, '');
    pushed.current = true;
    setDetail(i);
  };
  const closeDetail = () => {
    if (pushed.current) window.history.back(); // popstate below closes it
    else setDetail(null);
  };

  useEffect(() => {
    const onPop = () => {
      pushed.current = false;
      setDetail(null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (detail === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDetail();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail]);

  /* fade the info panel in whenever the front project changes */
  useLayoutEffect(() => {
    const el = info.current;
    if (!el) return;
    const tw = gsap.fromTo(el, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', overwrite: true });
    return () => {
      tw.kill();
    };
  }, [active]);

  useEffect(() => {
    const sec = section.current!;
    const stageEl = stage.current!;
    const ringEl = ring.current!;
    const cards = cardEls.current as HTMLButtonElement[];
    const shades = shadeEls.current as HTMLDivElement[];
    const n = PROJECTS.length;
    const STEP = 360 / n;
    let R = 600;
    let currentP = 0;
    let autoOffset = 0;
    let autoTicker: ((time: number, deltaTime: number) => void) | null = null;

    /* card size + 3D ring radius depend on the viewport */
    const layoutWork = () => {
      const wcw = narrow() ? clamp(view.W * 0.74, 240, 330) : clamp(view.W * 0.36, 300, 560);
      const wch = wcw * 0.58;
      R = wcw * 1.55;
      sec.style.setProperty('--wcw', wcw + 'px');
      sec.style.setProperty('--wch', wch + 'px');
      stageEl.style.perspective = R * 1.8 + 'px';
      stageEl.style.perspectiveOrigin = '50% 40%';
      ringEl.style.top = narrow() ? '49%' : '55%'; // phone: a little lower, clear of the counter
      ringEl.style.transform = `translateZ(${R * 0.3}px)`;
    };
    layoutWork();
    window.addEventListener('resize', layoutWork);

    const render = (p: number) => {
      currentP = p;
      const rawRot = p * (n - 1) * STEP + autoOffset;
      const rot = ((rawRot % 360) + 360) % 360;
      const near = ((Math.round(rot / STEP) % n) + n) % n;
      const introK = smooth(p, 0, 0.06);
      for (let i = 0; i < n; i++) {
        let ang = i * STEP - rot;
        ang = ((ang + 540) % 360) - 180;
        const a = Math.abs(ang);
        const op = clamp((150 - a) / 45, 0, 1) * (0.4 + 0.6 * introK);
        const c = cards[i];
        c.style.transform = `rotateY(${-ang}deg) translateZ(${-R}px)`;
        c.style.opacity = String(op);
        c.style.visibility = op < 0.02 ? 'hidden' : 'visible';
        c.style.pointerEvents = a > 110 ? 'none' : 'auto';
        shades[i].style.opacity = String(clamp(a / 70, 0, 1) * 0.7);
      }
      if (near !== activeRef.current) {
        activeRef.current = near;
        setActive(near);
      }
    };

    let disposeScene = () => {};
    if (reduce) {
      render(0);
    } else {
      disposeScene = createScene({ id: 'work', el: sec, len: '260%', render });
      autoTicker = (_time, deltaTime) => {
        const scene = getScene('work');
        if (!scene?.on || hoverRef.current) return;
        // One card reaches the centre roughly every seven seconds.
        autoOffset = (autoOffset + deltaTime * 0.007) % 360;
        render(currentP);
      };
      gsap.ticker.add(autoTicker);
    }

    return () => {
      window.removeEventListener('resize', layoutWork);
      if (autoTicker) gsap.ticker.remove(autoTicker);
      disposeScene();
    };
  }, []);

  const onCard = (i: number) => {
    if (narrow()) {
      openDetail(i); // phone: details page
      return;
    }
    const url = PROJECTS[i].url; // desktop: straight to the live site
    if (url) window.open(url, '_blank', 'noopener');
  };

  return (
    <section ref={section} className="scene wk" id="work" aria-label="Selected work">
      <div className="wk-title">
        <small className="mono">Selected work</small>
        <h2>Build without limits</h2>
      </div>

      <div ref={stage} className="wk-stage">
        <div ref={ring} className="wk-ring">
          {PROJECTS.map((p, i) => (
            <button
              key={p.n}
              ref={(el) => {
                cardEls.current[i] = el;
              }}
              className={'wk-card' + (p.contain ? ' contain' : '') + (i === active ? ' on' : '')}
              type="button"
              aria-label={p.n}
              onPointerEnter={() => {
                hoverRef.current = true;
                activeRef.current = i;
                setActive(i);
                setDetailVisible(true);
              }}
              onPointerLeave={() => {
                hoverRef.current = false;
                setDetailVisible(false);
              }}
              onFocus={() => {
                hoverRef.current = true;
                activeRef.current = i;
                setActive(i);
                setDetailVisible(true);
              }}
              onBlur={() => {
                hoverRef.current = false;
                setDetailVisible(false);
              }}
              onClick={() => onCard(i)}
            >
              <img src={p.img} alt={'Screenshot of ' + p.n} loading="lazy" />
              <div className="lab">{p.n}<span className="go">Explore &rarr;</span></div>
              <div
                className="shade"
                ref={(el) => {
                  shadeEls.current[i] = el;
                }}
              />
            </button>
          ))}
        </div>
      </div>

      <img className="wk-person" src="/img/back.webp" alt="" width={520} height={1421} />

      <div ref={info} className={"wk-info" + (detailVisible ? " visible" : "")} aria-live="polite">
        <span className="mono">{project.tag}</span>
        <h3>{project.n}</h3>
        <p>{project.d}</p>
        <div className="chips">
          {project.chips.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        {project.url ? (
          <a className="visit" href={project.url} target="_blank" rel="noopener">
            Visit live site <span aria-hidden="true">&#8599;</span>
          </a>
        ) : (
          <span className="visit off">No public link</span>
        )}
      </div>

      <div className="wk-count">
        <span>{pad2(active + 1)}</span>
        <small className="mono">of {pad2(PROJECTS.length)} projects</small>
      </div>

      {detail !== null &&
        createPortal(
          <div className="wk-dp" role="dialog" aria-modal="true" aria-label={PROJECTS[detail].n}>
            <div className="wk-dp-bar">
              <button type="button" className="wk-dp-back" onClick={closeDetail}>
                <span aria-hidden="true">&larr;</span> Back
              </button>
              <span className="wk-dp-count">
                {pad2(detail + 1)} / {pad2(PROJECTS.length)}
              </span>
            </div>

            <div className={'wk-dp-shot' + (PROJECTS[detail].contain ? ' contain' : '')}>
              <img src={PROJECTS[detail].img} alt={'Screenshot of ' + PROJECTS[detail].n} />
            </div>

            <div className="wk-dp-body">
              <span className="mono">{PROJECTS[detail].tag}</span>
              <h1>{PROJECTS[detail].n}</h1>
              <p>{PROJECTS[detail].d}</p>
              <div className="chips">
                {PROJECTS[detail].chips.map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
              {PROJECTS[detail].url ? (
                <a className="visit" href={PROJECTS[detail].url} target="_blank" rel="noopener">
                  Visit live site <span aria-hidden="true">&#8599;</span>
                </a>
              ) : (
                <span className="visit off">No public link</span>
              )}
            </div>
          </div>,
          document.body
        )}
    </section>
  );
}