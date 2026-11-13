'use client';

// Step 2: check the outline the app found, or drag the four corners by hand.
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { isConvexQuad, orderQuad, type Point, type Quad, type Turns } from '@/lib/geometry';
import { BackLink, Button, MagnifierIcon, RotateLeftIcon, RotateRightIcon, Switch, WandIcon } from './ui';

const ZOOM = 3;

/**
 * A fixed square the photo sits in (computers and tablets), so the buttons
 * beside it stay put whatever the shape of the photo. Hands the photo the
 * height it may use, once measured.
 */
function Square({ children }: { children: (fit: number | undefined) => ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const PAD = 16;
  return (
    <div
      ref={ref}
      className="w-[min(100%,60dvh,600px)] lg:w-[min(100%,72dvh,660px)] aspect-square flex-none flex items-center justify-center bg-soft rounded-[16px]"
      style={{ padding: PAD }}
    >
      {children(size > 0 ? size - 2 * PAD : undefined)}
    </div>
  );
}

/** The photo with the gold outline on top, and optional draggable handles. */
export function PhotoStage({
  src,
  alt,
  corners,
  onMove,
  active,
  onActive,
  floatingLoupe,
  imgMaxHeight,
  children,
}: {
  src: string;
  alt: string;
  corners: Quad;
  onMove?: (index: number, p: Point) => void;
  active?: number;
  onActive?: (index: number, dragging: boolean) => void;
  /** Show a magnifier above the finger while dragging (phones and tablets). */
  floatingLoupe?: boolean;
  /** Fit the photo into this many pixels of height (phones). */
  imgMaxHeight?: number;
  children?: ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const grab = useRef<{ index: number; dx: number; dy: number } | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ width: el.clientWidth, height: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function down(e: PointerEvent<HTMLButtonElement>, index: number) {
    if (!onMove || !boxRef.current) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus();
    const r = boxRef.current.getBoundingClientRect();
    // Remember where inside the circle it was grabbed, so it doesn't jump.
    grab.current = { index, dx: e.clientX - (r.left + corners[index].x * r.width), dy: e.clientY - (r.top + corners[index].y * r.height) };
    setDragging(index);
    onActive?.(index, true);
  }
  function move(e: PointerEvent<HTMLButtonElement>) {
    const g = grab.current;
    if (!g || !onMove || !boxRef.current) return;
    const r = boxRef.current.getBoundingClientRect();
    onMove(g.index, {
      x: Math.max(0, Math.min(1, (e.clientX - g.dx - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (e.clientY - g.dy - r.top) / r.height)),
    });
  }
  function up() {
    if (!grab.current) return;
    onActive?.(grab.current.index, false);
    grab.current = null;
    setDragging(null);
  }
  function key(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!onMove) return;
    const step = e.shiftKey ? 0.01 : 0.002;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    const p = corners[index];
    onMove(index, { x: Math.max(0, Math.min(1, p.x + d[0])), y: Math.max(0, Math.min(1, p.y + d[1])) });
  }

  const points = corners.map((p) => `${p.x * 100},${p.y * 100}`).join(' ');
  const names = ['top left', 'top right', 'bottom right', 'bottom left'];
  const dragPoint = dragging !== null ? corners[dragging] : null;

  return (
    <div ref={boxRef} className="relative inline-block max-w-full select-none leading-[0]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} draggable={false} className={`block max-w-full w-auto h-auto rounded-[3px] ${imgMaxHeight ? '' : 'max-h-[52dvh] lg:max-h-[68dvh]'}`}
        style={imgMaxHeight ? { maxHeight: imgMaxHeight } : undefined}
      />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" aria-hidden>
        <polygon points={points} fill="none" stroke="rgba(0,0,0,.4)" strokeWidth={5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        <polygon points={points} fill="none" stroke="var(--color-gilt)" strokeWidth={3} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
      {corners.map((p, i) =>
        onMove ? (
          <button
            key={i}
            type="button"
            aria-label={`Corner ${i + 1}, ${names[i]}. Drag, or use the arrow keys.`}
            onPointerDown={(e) => down(e, i)}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            onKeyDown={(e) => key(e, i)}
            onFocus={() => onActive?.(i, false)}
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, touchAction: 'none' }}
            className={`absolute w-11 h-11 -ml-[22px] -mt-[22px] rounded-full border-4 border-cream font-sans font-bold text-[18px] leading-none flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,.5)] ${
              dragging === i ? 'cursor-grabbing' : 'cursor-grab'
            } ${active === i ? 'bg-gilt text-ink z-10' : 'bg-burgundy/90 text-cream'}`}
          >
            {i + 1}
          </button>
        ) : (
          <span
            key={i}
            aria-hidden
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
            className="absolute w-[22px] h-[22px] -ml-[11px] -mt-[11px] rounded-full bg-gilt border-[3px] border-white shadow-[0_0_0_6px_rgba(201,161,74,.3)]"
          />
        ),
      )}
      {floatingLoupe && dragPoint && box.width > 0 && (
        <div
          className="absolute z-20 pointer-events-none lg:hidden"
          style={{
            left: Math.max(64, Math.min(box.width - 64, dragPoint.x * box.width)),
            // Above the finger; below it when there's no room above.
            top: dragPoint.y * box.height > 170 ? dragPoint.y * box.height - 105 : dragPoint.y * box.height + 105,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Loupe src={src} point={dragPoint} box={box} size={124} />
        </div>
      )}
      {children}
    </div>
  );
}

/** A round magnified view of the photo around `point`, with a red cross. */
export function Loupe({ src, point, box, size }: { src: string; point: Point; box: { width: number; height: number }; size: number }) {
  const style: CSSProperties = {
    width: size,
    height: size,
    backgroundImage: `url("${src}")`,
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#2e2f31',
    backgroundSize: `${box.width * ZOOM}px ${box.height * ZOOM}px`,
    backgroundPosition: `${size / 2 - point.x * box.width * ZOOM}px ${size / 2 - point.y * box.height * ZOOM}px`,
  };
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div className="rounded-full border-[5px] border-white shadow-[0_6px_18px_rgba(0,0,0,.35)] overflow-hidden relative" style={style}>
        <span className="absolute left-1/2 top-[22%] bottom-[22%] w-[2px] -ml-px bg-[#e5342a]" />
        <span className="absolute top-1/2 left-[22%] right-[22%] h-[2px] -mt-px bg-[#e5342a]" />
      </div>
      <span className="absolute -right-1 -bottom-1 rounded-full bg-burgundy text-cream border-[3px] border-white flex items-center justify-center" style={{ width: size * 0.22, height: size * 0.22 }}>
        <MagnifierIcon className="w-1/2 h-1/2" />
      </span>
    </div>
  );
}

export type TurnProps = {
  /** Turn the photo by quarter turns: -1 left, 1 right. */
  onTurn: (by: number) => void;
  /** True while a turn (or Enhance) is being drawn. */
  turning: boolean;
  enhance: boolean;
  onEnhance: (on: boolean) => void;
};

/** Turn left / Turn right, and the AI's "looks sideways" hint when there is one. */
function TurnBar({ onTurn, turning, enhance, onEnhance, suggestedTurns, disabled }: TurnProps & { suggestedTurns?: Turns | null; disabled?: boolean }) {
  const off = turning || disabled;
  return (
    <div className="flex flex-col gap-2.5">
      {suggestedTurns ? (
        <div className="flex flex-col gap-2 bg-card border-2 border-burgundy rounded-[12px] px-3.5 py-2.5">
          <p className="text-[17px]">{suggestedTurns === 2 ? 'This painting looks upside down.' : 'This painting looks like it is on its side.'}</p>
          <Button size="sm" disabled={off} onClick={() => onTurn(suggestedTurns === 3 ? -1 : suggestedTurns)}>
            Turn it the right way up
          </Button>
        </div>
      ) : null}
      <div className="flex justify-center items-center gap-3">
        {([
          [-1, 'Turn left', RotateLeftIcon],
          [1, 'Turn right', RotateRightIcon],
        ] as const).map(([by, label, Icon]) => (
          <button
            key={by}
            type="button"
            aria-label={label}
            title={label}
            disabled={off}
            onClick={() => onTurn(by)}
            className="w-12 h-12 rounded-[12px] border-2 border-burgundy bg-card-on text-burgundy flex items-center justify-center cursor-pointer hover:bg-soft disabled:opacity-60 disabled:cursor-default"
          >
            <Icon className="w-6 h-6" />
          </button>
        ))}
      </div>
      <Switch
        label={
          <span className="flex items-center gap-2.5">
            <WandIcon className="w-[22px] h-[22px] text-burgundy flex-none" />
            Enhance colors
          </span>
        }
        checked={enhance}
        onChange={onEnhance}
        disabled={off}
      />
    </div>
  );
}

export type FoundProps = TurnProps & {
  suggestedTurns: Turns | null;
  src: string;
  name: string;
  corners: Quad;
  /** True when the app is unsure about this outline. */
  unsure: boolean;
  hasFrame: boolean;
  includeFrame: boolean;
  onIncludeFrame: (v: boolean) => void;
  onAccept: () => void;
  onAdjust: () => void;
  onBack: () => void;
  backLabel: string;
  busy: boolean;
};

/** "Found it": the gold outline, to approve or adjust. */
export function FoundView({ src, name, corners, unsure, hasFrame, includeFrame, onIncludeFrame, onAccept, onAdjust, onBack, backLabel, busy, suggestedTurns, onTurn, turning, enhance, onEnhance }: FoundProps) {
  return (
    <main className="flex flex-col gap-4 px-4 sm:px-10 py-5 max-w-[1240px] mx-auto w-full">
      <BackLink onClick={onBack}>{backLabel}</BackLink>
      <div className="flex flex-col lg:flex-row gap-5 lg:gap-10 items-center lg:items-start justify-center">
        <Square>{(fit) => <PhotoStage src={src} alt={`Your photo: ${name}`} corners={corners} imgMaxHeight={fit} />}</Square>
        <div className="flex flex-col gap-4 w-full max-w-[360px] lg:w-[340px] flex-none lg:pt-6">
          <h1 className="text-[30px] sm:text-[38px]">{unsure ? 'Is this right?' : 'Found it.'}</h1>
          <p className="text-[19px] sm:text-[22px]">
            {unsure
              ? 'This photo was a tricky one. The gold line is my best guess at the edges of your painting.'
              : 'The gold line shows the edges of your painting. Everything outside it will be trimmed away.'}
          </p>
          <TurnBar onTurn={onTurn} turning={turning} enhance={enhance} onEnhance={onEnhance} suggestedTurns={suggestedTurns} disabled={busy} />
          {hasFrame && <Switch label="Include the frame" checked={includeFrame} onChange={onIncludeFrame} />}
          <Button onClick={onAccept} busy={busy} disabled={turning}>
            Looks right
          </Button>
          <Button variant="outline" onClick={onAdjust} disabled={busy}>
            Move the corners myself
          </Button>
        </div>
      </div>
    </main>
  );
}

export type AdjustProps = TurnProps & {
  src: string;
  name: string;
  corners: Quad;
  onChange: (corners: Quad) => void;
  onDone: (corners: Quad) => void;
  onBack: () => void;
  backLabel: string;
  /** Shown when the app could not find the edges by itself. */
  notice?: string | null;
  busy: boolean;
};

/** Four numbered circles to drag onto the corners, with a magnifier. */
export function AdjustView({ src, name, corners, onChange, onDone, onBack, backLabel, notice, busy, onTurn, turning, enhance, onEnhance }: AdjustProps) {
  const [active, setActive] = useState(0);
  const [magnifier, setMagnifier] = useState(true);
  const [crossed, setCrossed] = useState(false);
  // The side magnifier needs the size of the photo on screen.
  const measureRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = measureRef.current?.querySelector('img');
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ width: el.clientWidth, height: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function done() {
    const ordered = orderQuad(corners);
    if (!isConvexQuad(ordered)) {
      setCrossed(true);
      return;
    }
    onDone(ordered);
  }

  return (
    <main className="flex flex-col gap-4 px-4 sm:px-10 py-5 max-w-[1240px] mx-auto w-full">
      <BackLink onClick={onBack}>{backLabel}</BackLink>
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-10 items-center justify-center">
        <h1 className="text-[22px] sm:text-[26px] text-center lg:hidden">Drag each numbered circle onto a corner of the painting.</h1>
        <Square>
          {(fit) => (
        <div ref={measureRef} className="max-w-full">
          <PhotoStage
            imgMaxHeight={fit}
            src={src}
            alt={`Your photo: ${name}`}
            corners={corners}
            active={active}
            onActive={(i) => setActive(i)}
            floatingLoupe={magnifier}
            onMove={(i, p) => {
              setCrossed(false);
              const next = corners.map((c, k) => (k === i ? p : c)) as Quad;
              onChange(next);
            }}
          />
        </div>
          )}
        </Square>
        <div className="flex flex-col items-center gap-3.5 w-full max-w-[360px] lg:w-[340px] flex-none">
          <h1 className="text-[26px] text-center hidden lg:block">Drag each numbered circle onto a corner of the painting.</h1>
          {notice && (
            <p role="status" className="text-[18px] text-center bg-need-bg text-need rounded-[12px] px-4 py-2.5 font-sans">
              {notice}
            </p>
          )}
          {magnifier && box.width > 0 && (
            <div className="hidden lg:flex flex-col items-center gap-2.5">
              <Loupe src={src} point={corners[active]} box={box} size={200} />
              <p className="italic text-muted text-[18px]">Put the red cross right on the corner.</p>
            </div>
          )}
          <Switch label="Magnifier" checked={magnifier} onChange={setMagnifier} className="self-stretch" />
          <div className="self-stretch">
            <TurnBar onTurn={onTurn} turning={turning} enhance={enhance} onEnhance={onEnhance} disabled={busy} />
          </div>
          {crossed && (
            <p role="alert" className="text-[18px] text-center text-burgundy font-semibold">
              The circles are crossed over. Put one circle on each corner of the painting.
            </p>
          )}
          <Button onClick={done} busy={busy} disabled={turning} className="self-stretch">
            Done
          </Button>
        </div>
      </div>
    </main>
  );
}

/** Shown while the app looks for the corners. */
export function FindingView({ src, name }: { src: string; name: string }) {
  return (
    <main className="flex flex-col items-center gap-5 px-4 py-8">
      <h1 className="flex items-center gap-3 text-[28px] sm:text-[34px]" role="status">
        <span className="gs-spinner text-burgundy" aria-hidden /> Finding the corners…
      </h1>
      <Square>
        {(fit) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={`Your photo: ${name}`} className="max-w-full max-h-full rounded-[3px] opacity-80" style={fit ? { maxHeight: fit } : undefined} />
        )}
      </Square>
    </main>
  );
}
