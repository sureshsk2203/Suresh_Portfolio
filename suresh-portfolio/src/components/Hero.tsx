import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { smooth } from '../lib/math';
import { createScene } from '../lib/scene';
import { reduce, view } from '../lib/viewport';
import './Hero.css';

/* Transparent walking video (put the file in  public/video/suresh_walk.webm) */
const VIDEO_SRC = '/video/suresh_walk.webm';
const VIDEO_H = '68vh'; // size of the walking figure (smaller = more zoomed out)

/* ---- fallback walk tuning (only used when the video can't play) ---- */
const STEPS = 9; // how many footsteps before he stops
const BOB = 0.007; // up/down movement per step (fraction of viewport height)
const SWAY = 0.004; // left/right weight shift (fraction of viewport width)
const ROLL = 1.0; // body roll in degrees

/* VP9 alpha WebM works in Chrome, Edge, Firefox and Android.
   Safari / every iOS browser can't show its transparency, so they get the still photo. */
const canPlayAlphaVideo = () => {
  if (typeof navigator === 'undefined' || typeof document === 'undefined') return false;
  const ua = navigator.userAgent;
  const webkitOnly =
    /iPad|iPhone|iPod/.test(ua) || /^((?!chrome|android).)*safari/i.test(ua);
  if (webkitOnly) return false;
  return !!document.createElement('video').canPlayType('video/webm; codecs="vp9"');
};

export default function Hero() {
  const section = useRef<HTMLElement>(null);
  const nPar = useRef<HTMLDivElement>(null);
  const nScr = useRef<HTMLDivElement>(null);
  const name = useRef<HTMLHeadingElement>(null);
  const pPar = useRef<HTMLDivElement>(null);
  const pWalk = useRef<HTMLDivElement>(null);
  const pScr = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const [useVideo, setUseVideo] = useState(() => !reduce && canPlayAlphaVideo());

  useEffect(() => {
    const sec = section.current!;
    const nParEl = nPar.current!;
    const nScrEl = nScr.current!;
    const nameEl = name.current!;
    const pParEl = pPar.current!;
    const walk = pWalk.current!;
    const pScrEl = pScr.current!;
    const shadeEl = shade.current!;
    const fades = sec.querySelectorAll<HTMLElement>('.fadeable');
    let walkDone = reduce;

    /* scroll-driven: name drifts up + fades, photo scales in */
    const render = (p: number) => {
      nScrEl.style.transform = `translateY(${-p * 18}vh) scale(${1 + p * 0.12})`;
      nScrEl.style.opacity = String(1 - smooth(p, 0.5, 0.95));
      pScrEl.style.transformOrigin = '50% 22%';
      pScrEl.style.transform = `translateY(${p * 5}vh) scale(${1 + p * 0.36})`;
      pScrEl.style.opacity = String(1 - smooth(p, 0.8, 1));
      if (walkDone) {
        const f = String(1 - smooth(p, 0, 0.28));
        fades.forEach((el) => (el.style.opacity = f));
      }
    };

    if (reduce) {
      nameEl.style.clipPath = 'none';
      render(0);
      return;
    }

    const disposeScene = createScene({ id: 'hero', el: sec, len: '120%', render });

    /* ------------------------------------------------------------------
       A) REAL WALK: play the transparent video, name reveal follows it
       ------------------------------------------------------------------ */
    let raf = 0;
    let startTimer = 0;
    let vid: HTMLVideoElement | null = null;
    let onEnded: (() => void) | null = null;
    const extra: gsap.core.Tween[] = []; // tweens created after the walk ends

    const startVideoWalk = () => {
      vid = video.current!;
      vid.muted = true;
      vid.playbackRate = 0.8; // slightly calmer walk
      walk.style.opacity = '0';
      nameEl.style.clipPath = 'inset(0 100% 0 0)';
      gsap.set(fades, { opacity: 0 }); // hidden until the name has appeared

      /* letters appear one by one, left to right, as he walks:
         letter i starts at  L_START + i * L_GAP  of the walk and wipes in over L_LEN */
      const letters = letterRefs.current.filter(Boolean) as HTMLSpanElement[];
      const L_START = 0.08;
      const L_GAP = 0.14;
      const L_LEN = 0.12;
      const revealLetters = (k: number) => {
        if (!letters.length) return;
        const first = letters[0].offsetLeft;
        const total = letters[letters.length - 1].offsetLeft + letters[letters.length - 1].offsetWidth - first;
        let shown = 0;
        letters.forEach((el, i) => {
          const p = smooth(k, L_START + i * L_GAP, L_START + i * L_GAP + L_LEN);
          shown += p * el.offsetWidth;
        });
        // the whole h1 is wider than the text, so map the text span back to h1 width
        const w = nameEl.offsetWidth || 1;
        const rightEdge = first + Math.min(shown, total);
        const inset = Math.max(0, 100 - (rightEdge / w) * 100);
        nameEl.style.clipPath = `inset(0 ${inset}% 0 0)`;
      };

      const apply = (k: number) => {
        revealLetters(k);
        walk.style.opacity = String(smooth(k, 0, 0.06));
        walk.style.filter = `brightness(${0.6 + 0.4 * smooth(k, 0, 0.5)})`;
        // ground shadow grows as he comes closer
        shadeEl.style.transform = `translateX(-50%) scaleX(${0.45 + 0.55 * k})`;
      };

      const tick = () => {
        if (!vid) return;
        const dur = vid.duration || 1;
        apply(Math.min(1, vid.currentTime / dur));
        if (!vid.ended) raf = requestAnimationFrame(tick);
      };

      /* walk finished: freeze on the final pose, name is complete, labels fade in */
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        cancelAnimationFrame(raf);
        walk.style.opacity = '1';
        walk.style.filter = 'none';
        walk.style.transform = 'none';
        shadeEl.style.transform = 'translateX(-50%)';
        nameEl.style.clipPath = 'none';
        walkDone = true;
        extra.push(gsap.to(fades, { opacity: 1, duration: 1, delay: 0.3, stagger: 0.12 }));
      };

      onEnded = finish;
      vid.addEventListener('ended', finish);

      startTimer = window.setTimeout(() => {
        vid!
          .play()
          .then(() => {
            raf = requestAnimationFrame(tick);
          })
          .catch(() => {
            // autoplay blocked: just show the final pose
            if (vid) vid.currentTime = vid.duration || 0;
            finish();
          });
      }, 400);
    };

    /* ------------------------------------------------------------------
       B) FALLBACK WALK: still photo with a gentle synthetic walk
       ------------------------------------------------------------------ */
    const startImageWalk = () => {
      const o = { k: 0 };
      walk.style.opacity = '0';
      nameEl.style.clipPath = 'inset(0 50% 0 50%)';
      gsap.to(o, {
        k: 1,
        duration: 5.6,
        ease: 'sine.inOut',
        delay: 0.4,
        onUpdate: () => {
          const k = o.k;
          const reveal = smooth(k, 0.04, 0.96);
          const sideInset = 50 * (1 - reveal);
          nameEl.style.clipPath = `inset(0 ${sideInset}% 0 ${sideInset}%)`;

          const ph = k * STEPS * Math.PI;
          const calm = 1 - smooth(k, 0.86, 1);
          const s = 0.3 + 0.7 * k;

          const bob = Math.sin(ph) ** 2 * view.H * BOB * s * calm;
          const sway = Math.sin(ph) * view.W * SWAY * s * calm;
          const rot = Math.sin(ph) * ROLL * calm;

          const ty = -(1 - k) * view.H * 0.07;
          walk.style.transform = `translate(${sway}px, ${ty - bob}px) rotate(${rot}deg) scale(${s})`;
          walk.style.opacity = String(smooth(k, 0, 0.1));
          walk.style.filter = `brightness(${0.45 + 0.55 * smooth(k, 0, 0.9)})`;
        },
        onComplete: () => {
          walkDone = true;
          walk.style.filter = 'none';
          walk.style.transform = 'none';
          nameEl.style.clipPath = 'none';
        },
      });
      gsap.from('.hero-eyebrow,.hero-meta,.hint', { opacity: 0, duration: 1, delay: 3.4, stagger: 0.12 });
    };

    /* intro + mouse parallax */
    let onMove: ((e: MouseEvent) => void) | null = null;
    const ctx = gsap.context(() => {
      gsap.from(nScrEl, { yPercent: 10, opacity: 0, duration: 2.2, ease: 'power3.out', delay: 0.2 });
      if (useVideo) startVideoWalk();
      else startImageWalk();
      if (window.matchMedia('(pointer:fine)').matches) {
        const nx = gsap.quickTo(nParEl, 'x', { duration: 1, ease: 'power3' });
        const ny = gsap.quickTo(nParEl, 'y', { duration: 1, ease: 'power3' });
        const px = gsap.quickTo(pParEl, 'x', { duration: 1, ease: 'power3' });
        const py = gsap.quickTo(pParEl, 'y', { duration: 1, ease: 'power3' });
        onMove = (e: MouseEvent) => {
          const dx = e.clientX / view.W - 0.5;
          const dy = e.clientY / view.H - 0.5;
          nx(-dx * 34);
          ny(-dy * 16);
          px(dx * 16);
          py(dy * 8);
        };
        window.addEventListener('mousemove', onMove);
      }
    }, sec);

    return () => {
      if (onMove) window.removeEventListener('mousemove', onMove);
      window.clearTimeout(startTimer);
      cancelAnimationFrame(raf);
      extra.forEach((t) => t.kill());
      if (vid) {
        if (onEnded) vid.removeEventListener('ended', onEnded);
        vid.pause();
      }
      ctx.revert();
      disposeScene();
    };
  }, [useVideo]);

  return (
    <section ref={section} className="scene hero" id="hero" aria-label="Introduction">
      <div className="hero-floor" />
      <div className="hero-eyebrow fadeable">
        <i />
        <i />
        <i />
        <span className="mono">Welcome to my world</span>
        <i />
        <i />
        <i />
      </div>

      <div ref={nPar} className="n-par">
        <div ref={nScr} className="n-scr">
          <h1 ref={name} className="hero-name" aria-label="Suresh Kumar A">
            {'SURESH'.split('').map((ch, i) => (
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
          </h1>
        </div>
      </div>

      <div ref={pPar} className="p-par">
        <div ref={pWalk} className="p-walk">
          <div ref={shade} className="hero-shade" />
          <div ref={pScr} className="p-scr">
            {useVideo ? (
              <video
                ref={video}
                className="hero-person"
                src={VIDEO_SRC}
                muted
                playsInline
                preload="auto"
                disablePictureInPicture
                tabIndex={-1}
                style={{ height: VIDEO_H }}
                role="img"
                aria-label="Suresh Kumar A in a black suit, walking towards the camera"
                onError={() => setUseVideo(false)}
              />
            ) : (
              <img
                className="hero-person"
                src="/img/suresh_full.png"
                alt="Suresh Kumar A in a black suit"
                width={470}
                height={1440}
              />
            )}
          </div>
        </div>
      </div>

      <div className="hero-meta l fadeable">
        <span className="mono">Frontend</span>
        <b>Developer</b>
      </div>
      <div className="hero-meta r fadeable">
        <span className="mono">UI / UX</span>
        <b>Designer</b>
      </div>
      <div className="hint fadeable mono">
        <span>Scroll</span>
        <i />
      </div>
    </section>
  );
}