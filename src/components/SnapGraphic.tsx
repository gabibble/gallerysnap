'use client';

// The start page picture: a real painting on a wooden table, photographed by
// hand so it's a few degrees off every way. The app outlines it, then it
// turns flat and square while the table fades. Drawn with code (a 3D tilt),
// so there's no video to download.
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

/** How far the "camera" is from the table, and how far off square the photo starts. */
const DISTANCE = 650;
const POSE = { rx: 11, ry: -14, rz: -3.4, ox: 6, oy: 5 };
/** The painting, on a 1100 x 900 table. */
const ART = 200;
const LEFT = 550 - ART / 2;
const TOP = 450 - ART / 2;
const CORNERS = [
  [LEFT, TOP],
  [LEFT + ART, TOP],
  [LEFT + ART, TOP + ART],
  [LEFT, TOP + ART],
];

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const outCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const outBack = (t: number, c: number) => 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** The loop, in seconds: hold the phone, shutter, trace the outline, snap square, rest. */
const PARTS: [string, number][] = [['live', 1.6], ['shutter', 0.3], ['beat', 0.35], ['trace', 0.9], ['dots', 0.3], ['pause', 0.55], ['snap', 0.85], ['settle', 0.5], ['rest', 2.4], ['out', 0.5]];
const START: Record<string, [number, number]> = {};
let TOTAL = 0;
for (const [name, length] of PARTS) {
  START[name] = [TOTAL, length];
  TOTAL += length;
}
const part = (t: number, name: string) => clamp((t - START[name][0]) / START[name][1]);

type Look = { alpha: number; wobble: number; flash: number; trace: number; outline: number; dots: number; snap: number; table: number };

function lookAt(t: number): Look {
  const shutter = part(t, 'shutter');
  const snapped = part(t, 'snap');
  return {
    alpha: Math.min(clamp(t / 0.4), 1 - part(t, 'out')),
    wobble: 1 - inOut(clamp(part(t, 'live') * 1.15)),
    flash: shutter > 0 && shutter < 1 ? 0.75 * Math.sin(shutter * Math.PI) : 0,
    trace: inOut(part(t, 'trace')),
    outline: 1 - part(t, 'settle'),
    dots: outCubic(part(t, 'dots')) * (1 - part(t, 'settle')),
    snap: snapped >= 1 ? 1 : outBack(inOut(snapped), 0.35),
    table: 1 - inOut(clamp(snapped * 1.1)),
  };
}
const BEFORE: Look = { alpha: 1, wobble: 0, flash: 0, trace: 1, outline: 1, dots: 1, snap: 0, table: 1 };
const AFTER: Look = { alpha: 1, wobble: 0, flash: 0, trace: 1, outline: 0, dots: 0, snap: 1, table: 0 };
/** Which of Photo / Straighten / Save is lit at time t. */
const stepAt = (t: number) => (part(t, 'settle') > 0 ? 2 : part(t, 'trace') > 0 ? 1 : 0);

const noMotionQuery = '(prefers-reduced-motion: reduce)';
function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(noMotionQuery);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(noMotionQuery).matches,
    () => false,
  );
}

/**
 * One picture of the painting on its table. `show` is "loop" for the moving
 * version, or a still: "found" (outlined, still askew), or "after" (square).
 */
function Stage({ show, height = 340, lines = 1, label, onStep, className = '' }: { show: 'loop' | 'found' | 'after'; height?: number; lines?: number; label: string; onStep?: (step: number) => void; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const stepRef = useRef(onStep);
  useEffect(() => {
    stepRef.current = onStep;
  }, [onStep]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const q = <T extends Element>(sel: string) => el.querySelector(sel) as unknown as T;
    const plane = q<HTMLElement>('[data-plane]');
    const surface = q<HTMLElement>('[data-surface]');
    const overlay = q<SVGElement>('[data-overlay]');
    const grid = q<SVGElement>('[data-grid]');
    const halo = q<SVGPolygonElement>('[data-halo]');
    const line = q<SVGPolygonElement>('[data-line]');
    const flash = q<HTMLElement>('[data-flash]');
    const dots = Array.from(el.querySelectorAll<SVGCircleElement>('[data-dot]'));
    const flat = Math.min(310 / ART, (height - 78) / ART);
    let scale = el.clientWidth / 400;

    function draw(s: Look, time: number) {
      const a = 1 - s.snap;
      const w = s.wobble;
      const rx = POSE.rx * a + w * 0.9 * Math.sin(time * 2.1);
      const ry = POSE.ry * a + w * 1.1 * Math.sin(time * 1.6 + 1);
      const rz = POSE.rz * a + w * 0.6 * Math.sin(time * 2.6 + 2);
      const ox = POSE.ox * a + w * 3 * Math.sin(time * 1.9 + 0.5);
      const oy = POSE.oy * a + w * 2.4 * Math.sin(time * 2.4 + 3);
      const size = lerp(flat * 0.8, flat, s.snap);
      const tilt = `translate(200px,${height / 2}px) perspective(${DISTANCE}px) translate(${ox}px,${oy}px) rotateZ(${rz}deg) rotateX(${rx}deg) rotateY(${ry}deg) scale(${size}) translate(-550px,-450px)`;
      plane.style.transform = `scale(${scale}) ${tilt}`;
      plane.style.opacity = String(s.alpha);
      overlay.style.opacity = String(s.alpha);
      surface.style.opacity = String(s.table);
      grid.style.opacity = String(s.table);
      // Where the painting's corners land on screen, so the outline follows them.
      const m = new DOMMatrix(tilt);
      const at = CORNERS.map(([x, y]) => {
        const r = m.transformPoint(new DOMPoint(x, y, 0, 1));
        return [r.x / r.w, r.y / r.w];
      });
      const points = at.map((v) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`).join(' ');
      for (const poly of [halo, line]) {
        poly.setAttribute('points', points);
        poly.style.strokeDasharray = `${s.trace} 2`;
        poly.style.opacity = String(s.outline);
      }
      dots.forEach((d, i) => {
        d.setAttribute('cx', String(at[i][0]));
        d.setAttribute('cy', String(at[i][1]));
        d.setAttribute('r', String(5 * s.dots * lines));
        d.style.opacity = s.dots > 0.01 ? '1' : '0';
      });
      flash.style.opacity = String(s.flash);
    }

    let t = 0;
    let clock = 0;
    let last = performance.now();
    let frame = 0;
    let step = -1;
    const still = show === 'found' ? BEFORE : show === 'after' ? AFTER : null;
    const paint = () => (still ? draw(still, 0) : draw(lookAt(t), clock));
    function tick(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      clock += dt;
      if (t >= TOTAL) t = 0;
      paint();
      const next = stepAt(t);
      if (next !== step) {
        step = next;
        stepRef.current?.(next);
      }
      frame = requestAnimationFrame(tick);
    }
    const ro = new ResizeObserver(() => {
      scale = el.clientWidth / 400;
      if (still) paint();
    });
    ro.observe(el);
    if (still) paint();
    else frame = requestAnimationFrame(tick);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [show, height, lines]);

  return (
    <div ref={host} role="img" aria-label={label} className={`relative w-full overflow-hidden isolate bg-tile ${className}`} style={{ aspectRatio: `400 / ${height}` }}>
      <div data-plane className="absolute left-0 top-0 w-[1100px] h-[900px] origin-top-left will-change-transform" style={{ opacity: 0 }}>
        <div data-surface className="gs-table absolute inset-0" />
        <div className="absolute bg-black blur-[7px] opacity-25" style={{ left: LEFT + 5, top: TOP + 8, width: ART, height: ART }} />
        <div className="absolute overflow-hidden shadow-[0_0_0_1px_rgba(60,40,20,.25)]" style={{ left: LEFT, top: TOP, width: ART, height: ART }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/start/painting.jpg" alt="" className="block w-full h-full" />
        </div>
      </div>
      <svg data-overlay viewBox={`0 0 400 ${height}`} className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" style={{ opacity: 0 }} aria-hidden>
        {/* A faint camera grid, so the small lean is easy to see. */}
        <path data-grid d={`M133.3 0V${height}M266.7 0V${height}M0 ${height / 3}H400M0 ${(height * 2) / 3}H400`} fill="none" stroke="rgba(255,255,255,.55)" strokeWidth={lines} />
        <polygon data-halo pathLength={1} fill="none" stroke="rgba(255,255,255,.95)" strokeWidth={5 * lines} strokeLinejoin="round" />
        <polygon data-line pathLength={1} fill="none" stroke="var(--color-rasp)" strokeWidth={2.4 * lines} strokeLinejoin="round" />
        {CORNERS.map((_, i) => (
          <circle key={i} data-dot fill="#fff" stroke="var(--color-rasp)" strokeWidth={2.2 * lines} />
        ))}
      </svg>
      <div data-flash className="absolute inset-0 bg-white opacity-0 pointer-events-none" />
    </div>
  );
}

function Pills({ step, small = false }: { step: number; small?: boolean }) {
  return (
    <div className={`grid grid-cols-3 gap-2 font-bold text-center ${small ? 'text-[13.5px]' : 'text-[15px]'}`} aria-hidden>
      {['Photo', 'Straighten', 'Save'].map((label, i) => (
        <span key={label} className={`px-1 rounded-full transition-colors duration-200 ${small ? 'py-[7px]' : 'py-2.5'} ${i === step ? 'bg-ink text-white' : 'bg-wall text-muted'}`}>
          {label}
        </span>
      ))}
    </div>
  );
}

/**
 * The start page picture in its white card. `compact` is the shorter, wider
 * version for phones. With "reduce motion" switched on, the computer shows
 * one still picture and phones show a still before and after.
 */
export function SnapGraphic({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  const still = useReducedMotion();
  const [step, setStep] = useState(0);

  if (compact && still) {
    return (
      <div className={`bg-card rounded-[24px] p-3 flex items-center gap-2 ${className}`}>
        <figure className="flex-1 min-w-0 flex flex-col gap-1.5 text-center text-[13px] font-bold text-muted">
          <Stage show="found" lines={2.2} label="A painting photographed slightly off square, with its corners found" className="rounded-[12px]" />
          Your photo
        </figure>
        <svg viewBox="0 0 30 24" className="flex-none w-[26px] h-[22px] mb-[22px] text-rasp" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 12h22M17 4l8 8-8 8" />
        </svg>
        <figure className="flex-1 min-w-0 flex flex-col gap-1.5 text-center text-[13px] font-bold text-muted">
          <Stage show="after" lines={2.2} label="The same painting, square and cropped" className="rounded-[12px]" />
          After GallerySnap
        </figure>
      </div>
    );
  }

  return (
    <div className={`bg-card flex flex-col ${compact ? 'rounded-[24px] p-3 gap-2.5' : 'rounded-[32px] p-6 gap-4'} ${className}`}>
      <Stage
        show={still ? 'found' : 'loop'}
        height={compact ? 230 : 340}
        lines={compact ? 1.15 : 1}
        onStep={setStep}
        label="A painting on a wooden table, photographed slightly off square, is outlined and snaps square"
        className="rounded-[18px]"
      />
      <Pills step={still ? 1 : step} small={compact} />
    </div>
  );
}
