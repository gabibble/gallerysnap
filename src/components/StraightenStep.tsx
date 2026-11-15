'use client';

// Step 2: check the outline the app found, or drag the four corners by hand.
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { isConvexQuad, orderQuad, type Point, type Quad, type Turns } from '@/lib/geometry';
import { BackLink, Button, CheckIcon, Chip, EnhanceSwitch, FrameIcon, IconButton, MagnifierIcon, RotateLeftIcon, RotateRightIcon, Switch } from './ui';

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
  const PAD = 24;
  return (
    <div
      ref={ref}
      className="w-[min(100%,60dvh,600px)] lg:w-[min(100%,74dvh,680px)] aspect-square flex-none flex items-center justify-center bg-card rounded-[28px]"
      style={{ padding: PAD }}
    >
      {children(size > 0 ? size - 2 * PAD : undefined)}
    </div>
  );
}

/** The photo with the raspberry outline on top, and optional draggable handles. */
export function PhotoStage({
  src,
  alt,
  corners,
  onMove,
  active,
  onActive,
  floatingLoupe,
  imgMaxHeight,
  shade,
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
  /** Darken everything outside the outline: the part that will be trimmed away. */
  shade?: boolean;
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
      <img src={src} alt={alt} draggable={false} className={`block max-w-full w-auto h-auto rounded-[12px] ${imgMaxHeight ? '' : 'max-h-[52dvh] lg:max-h-[68dvh]'}`}
        style={imgMaxHeight ? { maxHeight: imgMaxHeight } : undefined}
      />
      {shade && (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full rounded-[12px] overflow-hidden pointer-events-none" aria-hidden>
          <path d={`M0 0H100V100H0Z M${[corners[0], corners[3], corners[2], corners[1]].map((p) => `${p.x * 100} ${p.y * 100}`).join('L')}Z`} fill="rgba(35,39,47,.45)" fillRule="evenodd" />
        </svg>
      )}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" aria-hidden>
        <polygon points={points} fill="none" stroke="#fff" strokeWidth={7} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        <polygon points={points} fill="none" stroke="var(--color-rasp)" strokeWidth={3.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeDasharray={onMove ? '9 8' : undefined} />
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
            className={`absolute w-11 h-11 -ml-[22px] -mt-[22px] rounded-full border-4 font-extrabold text-[18px] leading-none flex items-center justify-center shadow-[0_2px_8px_rgba(35,39,47,.45)] ${
              dragging === i ? 'cursor-grabbing' : 'cursor-grab'
            } ${active === i ? 'bg-white border-rasp text-rasp z-10' : 'bg-rasp border-white text-white'}`}
          >
            {i + 1}
          </button>
        ) : (
          <span
            key={i}
            aria-hidden
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
            className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full bg-rasp border-4 border-white shadow-[0_1px_4px_rgba(35,39,47,.4)]"
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
export function Loupe({ src, point, box, size, ring = 'white' }: { src: string; point: Point; box: { width: number; height: number }; size: number; ring?: 'white' | 'ink' }) {
  const style: CSSProperties = {
    width: size,
    height: size,
    backgroundImage: `url("${src}")`,
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#23272f',
    backgroundSize: `${box.width * ZOOM}px ${box.height * ZOOM}px`,
    backgroundPosition: `${size / 2 - point.x * box.width * ZOOM}px ${size / 2 - point.y * box.height * ZOOM}px`,
  };
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div className={`rounded-full border-[5px] overflow-hidden relative ${ring === 'ink' ? 'border-ink' : 'border-white shadow-[0_10px_24px_rgba(35,39,47,.35)]'}`} style={style}>
        <span className="absolute left-1/2 top-[22%] bottom-[22%] w-[2px] -ml-px bg-[#e5484d]" />
        <span className="absolute top-1/2 left-[22%] right-[22%] h-[2px] -mt-px bg-[#e5484d]" />
      </div>
      <span className="absolute right-0 bottom-0 rounded-full bg-ink text-white border-[3px] border-white flex items-center justify-center" style={{ width: size * 0.23, height: size * 0.23 }}>
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

/** Turn left / Turn right and Enhance colors, and the AI's "looks sideways" hint when there is one. */
function TurnBar({ onTurn, turning, enhance, onEnhance, suggestedTurns, disabled }: TurnProps & { suggestedTurns?: Turns | null; disabled?: boolean }) {
  const off = turning || disabled;
  return (
    <div className="flex flex-col gap-2.5">
      {suggestedTurns ? (
        <div className="flex flex-col gap-2 bg-need-bg text-need rounded-[16px] p-3.5">
          <p className="text-[16px] font-bold">{suggestedTurns === 2 ? 'This painting looks upside down.' : 'This painting looks like it is on its side.'}</p>
          <Button size="sm" disabled={off} onClick={() => onTurn(suggestedTurns === 3 ? -1 : suggestedTurns)}>
            Turn it the right way up
          </Button>
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <IconButton label="Turn left" tone="wall" size={54} disabled={off} onClick={() => onTurn(-1)}>
          <RotateLeftIcon className="w-[22px] h-[22px]" />
        </IconButton>
        <IconButton label="Turn right" tone="wall" size={54} disabled={off} onClick={() => onTurn(1)}>
          <RotateRightIcon className="w-[22px] h-[22px]" />
        </IconButton>
        <EnhanceSwitch className="flex-1 !px-3.5" on={enhance} onChange={onEnhance} disabled={off} />
      </div>
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

const page = 'flex flex-col lg:flex-row gap-5 items-center lg:items-stretch justify-center px-4 sm:px-10 pb-10 max-w-[1280px] mx-auto w-full';
const side = 'w-full max-w-[600px] lg:max-w-none lg:flex-1 lg:min-w-[340px] lg:basis-0 bg-card rounded-[28px] p-6 sm:p-8 flex flex-col gap-4';

/** "Found it": the outline the app found, to approve or adjust. */
export function FoundView({ src, name, corners, unsure, hasFrame, includeFrame, onIncludeFrame, onAccept, onAdjust, onBack, backLabel, busy, suggestedTurns, onTurn, turning, enhance, onEnhance }: FoundProps) {
  return (
    <main className={page}>
      <Square>{(fit) => <PhotoStage src={src} alt={`Your photo: ${name}`} corners={corners} imgMaxHeight={fit} shade />}</Square>
      <div className={side}>
        <BackLink onClick={onBack}>{backLabel}</BackLink>
        {unsure ? (
          <Chip tone="need" className="self-start">Please check this one</Chip>
        ) : (
          <Chip tone="ok" className="self-start">
            <CheckIcon className="w-3.5 h-3.5" /> Painting found
          </Chip>
        )}
        <h1 className="text-[34px] sm:text-[44px] leading-[1.05]">{unsure ? 'Is this right?' : 'Found it.'}</h1>
        <p className="text-[18px] text-muted">
          {unsure
            ? 'This photo was a tricky one. The line is my best guess at the edges of your painting.'
            : 'The line shows the edges of your painting. Everything in the shaded part will be trimmed away.'}
        </p>
        <div className="flex-1 min-h-2" />
        <TurnBar onTurn={onTurn} turning={turning} enhance={enhance} onEnhance={onEnhance} suggestedTurns={suggestedTurns} disabled={busy} />
        {hasFrame && (
          <Switch
            label={
              <>
                <FrameIcon className="w-5 h-5 flex-none" />
                Include the frame
              </>
            }
            checked={includeFrame}
            onChange={onIncludeFrame}
          />
        )}
        <Button onClick={onAccept} busy={busy} disabled={turning}>
          Looks right
        </Button>
        <Button variant="outline" onClick={onAdjust} disabled={busy}>
          Move the corners myself
        </Button>
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
    <main className={page}>
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
      <div className={side}>
        <BackLink onClick={onBack}>{backLabel}</BackLink>
        <h1 className="text-[26px] sm:text-[30px] leading-[1.15]">Drag each numbered circle onto a corner of the painting.</h1>
        {notice && (
          <p role="status" className="text-[16px] font-bold bg-need-bg text-need rounded-[16px] px-4 py-3">
            {notice}
          </p>
        )}
        {magnifier && box.width > 0 && (
          <div className="hidden lg:flex flex-col items-center gap-3">
            <Loupe src={src} point={corners[active]} box={box} size={190} ring="ink" />
            <p className="text-muted text-[16px]">Put the red cross right on the corner.</p>
          </div>
        )}
        <Switch label="Magnifier" checked={magnifier} onChange={setMagnifier} />
        <TurnBar onTurn={onTurn} turning={turning} enhance={enhance} onEnhance={onEnhance} disabled={busy} />
        <div className="flex-1 min-h-2" />
        {crossed && (
          <p role="alert" className="text-[16px] text-alert font-bold">
            The circles are crossed over. Put one circle on each corner of the painting.
          </p>
        )}
        <Button onClick={done} busy={busy} disabled={turning}>
          Done
        </Button>
      </div>
    </main>
  );
}

/** Shown while the app looks for the corners. */
export function FindingView({ src, name }: { src: string; name: string }) {
  return (
    <main className="flex flex-col items-center gap-5 px-4 pb-10">
      <h1 className="flex items-center gap-3 text-[28px] sm:text-[34px]" role="status">
        <span className="gs-spinner" aria-hidden /> Finding the corners…
      </h1>
      <Square>
        {(fit) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={`Your photo: ${name}`} className="max-w-full max-h-full rounded-[12px] opacity-80" style={fit ? { maxHeight: fit } : undefined} />
        )}
      </Square>
    </main>
  );
}
