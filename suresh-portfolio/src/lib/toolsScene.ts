import * as THREE from 'three';
import { ICONS } from '../data/icons';
import { TOOL_TILES } from '../data/tools';
import { clamp, smooth } from './math';
import { view } from './viewport';

export interface ToolsScene {
  render: (p: number, t: number) => void;
  size: () => void;
  dispose: () => void;
}

const lum = (h: string) => {
  const r = parseInt(h.substr(0, 2), 16);
  const g = parseInt(h.substr(2, 2), 16);
  const b = parseInt(h.substr(4, 2), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

function roundedRect(w: number, h: number, rad: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + rad, y);
  s.lineTo(x + w - rad, y);
  s.quadraticCurveTo(x + w, y, x + w, y + rad);
  s.lineTo(x + w, y + h - rad);
  s.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  s.lineTo(x + rad, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - rad);
  s.lineTo(x, y + rad);
  s.quadraticCurveTo(x, y, x + rad, y);
  return s;
}

/** Builds the floating-tools WebGL scene. Returns null when WebGL is unavailable. */
export function createToolsScene(host: HTMLElement, canvas: HTMLCanvasElement): ToolsScene | null {
  const T = THREE;
  let r: THREE.WebGLRenderer;
  try {
    r = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  r.setClearColor(0x000000, 0);
  r.outputEncoding = T.sRGBEncoding;
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));

  const scene = new T.Scene();
  const cam = new T.PerspectiveCamera(38, 1, 0.1, 60);
  cam.position.set(0, 0.5, 11);

  /* lights */
  scene.add(new T.AmbientLight(0x2a1710, 0.7));
  const l1 = new T.PointLight(0xff6a2a, 1.5, 40);
  l1.position.set(5, 3, 7);
  scene.add(l1);
  const l2 = new T.PointLight(0xff2a10, 1.1, 40);
  l2.position.set(-6, 1, 5);
  scene.add(l2);
  const l3 = new T.DirectionalLight(0xffa060, 0.8);
  l3.position.set(0, 4, -8);
  scene.add(l3);

  /* person (back view) + halo */
  const PH = 4.6;
  const PW = (PH * 520) / 1421;
  const loader = new T.TextureLoader();
  const pt = loader.load('/img/back.webp');
  pt.encoding = T.sRGBEncoding;
  const personMat = new T.MeshBasicMaterial({ map: pt, alphaTest: 0.5, color: 0xb8aaa4 });
  personMat.alphaToCoverage = true;
  const person = new T.Mesh(new T.PlaneGeometry(PW, PH), personMat);
  person.position.set(0, -0.62, 0);
  scene.add(person);

  const ht = loader.load('/img/back_halo.png');
  ht.encoding = T.sRGBEncoding;
  const halo = new T.Mesh(
    new T.PlaneGeometry(PW, PH),
    new T.MeshBasicMaterial({ map: ht, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.95 }),
  );
  halo.position.set(0, -0.62, -0.03);
  scene.add(halo);

  /* floor glow */
  const fc = document.createElement('canvas');
  fc.width = fc.height = 256;
  const fg = fc.getContext('2d')!;
  const gr = fg.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,100,40,.8)');
  gr.addColorStop(0.5, 'rgba(255,60,20,.25)');
  gr.addColorStop(1, 'rgba(255,40,10,0)');
  fg.fillStyle = gr;
  fg.fillRect(0, 0, 256, 256);
  const floor = new T.Mesh(
    new T.PlaneGeometry(9, 9),
    new T.MeshBasicMaterial({ map: new T.CanvasTexture(fc), transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.55 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -2.92, 0);
  scene.add(floor);

  /* tiles */
  const geo = new T.ExtrudeGeometry(roundedRect(1, 1, 0.2), {
    depth: 0.26,
    bevelEnabled: true,
    bevelThickness: 0.045,
    bevelSize: 0.04,
    bevelSegments: 3,
    curveSegments: 10,
  });
  geo.translate(0, 0, -0.13);
  const sideMat = new T.MeshStandardMaterial({ color: 0x0d0605, roughness: 0.28, metalness: 0.9 });

  const texFor = (ic: { p: string; t: string }, col: string): THREE.CanvasTexture => {
    const S = 384;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d')!;
    const b = g.createLinearGradient(0, 0, S, S);
    b.addColorStop(0, '#3d241a');
    b.addColorStop(1, '#120806');
    g.fillStyle = b;
    g.fillRect(0, 0, S, S);
    const sh = g.createRadialGradient(S * 0.3, S * 0.2, 0, S * 0.3, S * 0.2, S * 0.9);
    sh.addColorStop(0, 'rgba(255,170,110,.22)');
    sh.addColorStop(1, 'rgba(255,170,110,0)');
    g.fillStyle = sh;
    g.fillRect(0, 0, S, S);
    g.strokeStyle = 'rgba(255,170,110,.55)';
    g.lineWidth = 5;
    g.strokeRect(14, 14, S - 28, S - 28);
    /* big, fully coloured logo + name underneath */
    const sc = (S * 0.5) / 24;
    g.save();
    g.translate(S * 0.25, S * 0.13);
    g.scale(sc, sc);
    g.shadowColor = col;
    g.shadowBlur = 18;
    g.fillStyle = col;
    g.fill(new Path2D(ic.p));
    g.restore();
    g.fillStyle = '#fff';
    g.font = '700 40px Manrope, system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillText(ic.t, S / 2, S * 0.88);
    const m = new T.CanvasTexture(c);
    m.encoding = T.sRGBEncoding;
    m.offset.set(0.5, 0.5);
    m.anisotropy = 8;
    return m;
  };

  const grp = new T.Group();
  scene.add(grp);
  const tiles: THREE.Mesh[] = [];
  TOOL_TILES.forEach((d, i) => {
    const ic = ICONS[d[0]];
    if (!ic) return;
    let col = '#' + ic.h;
    if (lum(ic.h) < 0.3) col = '#f4ece4';
    const tx = texFor(ic, col);
    const cap = new T.MeshBasicMaterial({ map: tx });
    const m = new T.Mesh(geo, [cap, sideMat]);
    m.position.set(d[1], d[2], d[3]);
    m.userData = { b: new T.Vector3(d[1], d[2], d[3]), s: d[4], ry: d[5], i };
    m.scale.setScalar(0.001);
    grp.add(m);
    tiles.push(m);
  });

  /* particles */
  const N = 220;
  const pa = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pa[i * 3] = (Math.random() - 0.5) * 13;
    pa[i * 3 + 1] = (Math.random() - 0.5) * 8;
    pa[i * 3 + 2] = (Math.random() - 0.5) * 8;
  }
  const pg = new T.BufferGeometry();
  pg.setAttribute('position', new T.BufferAttribute(pa, 3));
  const pts = new T.Points(
    pg,
    new T.PointsMaterial({ color: 0xff9a50, size: 0.055, transparent: true, opacity: 0.75, blending: T.AdditiveBlending, depthWrite: false }),
  );
  scene.add(pts);

  let xs = 1;
  const size = () => {
    const w = host.clientWidth || view.W;
    const h = host.clientHeight || view.H;
    r.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
    xs = clamp(cam.aspect / 1.75, 0.42, 1);
    cam.position.z = cam.aspect < 0.8 ? 13.5 : 11;
  };
  size();

  const render = (p: number, t: number) => {
    const intro = smooth(p, 0, 0.2);
    cam.position.x += (view.MX * 1.4 - cam.position.x) * 0.05;
    cam.position.y += (0.5 - view.MY * 0.7 - cam.position.y) * 0.05;
    cam.lookAt(0, 0, 0);
    grp.rotation.y = (p - 0.2) * 0.35 + Math.sin(t * 0.25) * 0.1;
    for (let i = 0; i < tiles.length; i++) {
      const m = tiles[i];
      const u = m.userData;
      const k = clamp(intro * 1.4 - u.i * 0.04, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      m.position.set(u.b.x * xs * (0.4 + 0.6 * e), u.b.y + Math.sin(t * 0.9 + u.i * 1.7) * 0.12, u.b.z);
      m.scale.setScalar(Math.max(0.001, u.s * e * (xs < 0.7 ? 0.82 : 1)));
      m.rotation.set(Math.sin(t * 0.5 + u.i) * 0.12, u.ry + Math.sin(t * 0.4 + u.i * 2) * 0.14, Math.sin(t * 0.35 + u.i) * 0.05);
    }
    pts.rotation.y = t * 0.02;
    pts.position.y = Math.sin(t * 0.2) * 0.15;
    (floor.material as THREE.MeshBasicMaterial).opacity = 0.3 + 0.4 * intro;
    r.render(scene, cam);
  };

  const dispose = () => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else if (mat) mat.dispose();
    });
    r.dispose();
  };

  return { render, size, dispose };
}