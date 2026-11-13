'use client';

// The phone versions of Straighten and Save. Each screen fits the phone's
// visible area without scrolling: a short headline, the photo filling the
// space that's left, and the buttons at the bottom. The photo step's phone
// layout lives in PhotoStep (it's chosen with CSS so it shows from the
// first paint).
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { displayName, outputFilename } from '@/lib/filenames';
import { isConvexQuad, orderQuad, parseDimensions, type Quad, type Turns } from '@/lib/geometry';
import { ALBUM_TITLE } from '@/lib/googlePhotos';
import type { Painting } from '@/lib/types';
import type { SaveStatus } from './SaveStep';
import { PhotoStage, type AdjustProps, type FoundProps, type TurnProps } from './StraightenStep';
import { Button, DownloadIcon, EnhanceToggle, IconButton, PHONE_HEADER, PhotoIcon, RotateLeftIcon, RotateRightIcon, Seg } from './ui';

const big = 'w-full !min-h-0 h-14 !text-[18px] !rounded-[14px] !px-4';

/** A full-height phone screen. */
function Screen({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-col gap-4 px-5 pt-4 pb-5" style={{ height: `calc(100dvh - ${PHONE_HEADER}px)` }}>
      {children}
    </main>
  );
}

/** The space left over for the photo, measured so the photo can fill it exactly. */
function useFill() {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, height };
}

function Fill({ fillRef, height, children }: { fillRef: RefObject<HTMLDivElement | null>; height: number; children: ReactNode }) {
  return (
    <div ref={fillRef} className="flex-1 min-h-0 flex items-center justify-center">
      {height > 0 ? children : null}
    </div>
  );
}

function TurnIcons({ onTurn, turning, disabled }: TurnProps & { disabled?: boolean }) {
  return (
    <div className="flex gap-2">
      <IconButton label="Turn left" onClick={() => onTurn(-1)} disabled={turning || disabled}>
        <RotateLeftIcon className="w-[22px] h-[22px]" />
      </IconButton>
      <IconButton label="Turn right" onClick={() => onTurn(1)} disabled={turning || disabled}>
        <RotateRightIcon className="w-[22px] h-[22px]" />
      </IconButton>
    </div>
  );
}

function TurnHint({ suggestedTurns, onTurn, disabled }: { suggestedTurns: Turns; onTurn: (by: number) => void; disabled: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-card border-2 border-burgundy rounded-[12px] pl-3.5 pr-1.5 py-1.5 text-[16px]">
      <span>{suggestedTurns === 2 ? 'Looks upside down.' : 'Looks like it’s on its side.'}</span>
      <Button size="sm" className="!min-h-[38px] !py-1 whitespace-nowrap" disabled={disabled} onClick={() => onTurn(suggestedTurns === 3 ? -1 : suggestedTurns)}>
        Turn upright
      </Button>
    </div>
  );
}

export function PhoneFound({ src, name, corners, unsure, hasFrame, includeFrame, onIncludeFrame, onAccept, onAdjust, busy, suggestedTurns, onTurn, turning }: FoundProps) {
  const { ref: fillRef, height: fillHeight } = useFill();
  return (
    <Screen>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[24px]">{unsure ? 'Is this right?' : 'Found it.'}</h1>
        <TurnIcons onTurn={onTurn} turning={turning} disabled={busy} />
      </div>
      {suggestedTurns ? <TurnHint suggestedTurns={suggestedTurns} onTurn={onTurn} disabled={turning || busy} /> : null}
      <Fill fillRef={fillRef} height={fillHeight}>
        <PhotoStage src={src} alt={`Your photo: ${name}`} corners={corners} imgMaxHeight={fillHeight} />
      </Fill>
      {hasFrame && (
        <Seg
          label="Frame"
          value={includeFrame ? 'with' : 'without'}
          options={[
            { value: 'with', label: 'Keep frame' },
            { value: 'without', label: 'Painting only' },
          ]}
          onChange={(v) => onIncludeFrame(v === 'with')}
        />
      )}
      <div className="flex flex-col gap-1">
        <Button onClick={onAccept} busy={busy} disabled={turning} className={big}>
          Looks right
        </Button>
        <button type="button" onClick={onAdjust} disabled={busy} className="font-sans font-bold text-[16px] text-burgundy py-2 cursor-pointer">
          Adjust corners
        </button>
      </div>
    </Screen>
  );
}

export function PhoneAdjust({ src, name, corners, onChange, onDone, notice, busy, onTurn, turning, magnifier }: AdjustProps & { magnifier: boolean }) {
  const { ref: fillRef, height: fillHeight } = useFill();
  const [active, setActive] = useState(0);
  const [crossed, setCrossed] = useState(false);

  function done() {
    const ordered = orderQuad(corners);
    if (!isConvexQuad(ordered)) {
      setCrossed(true);
      return;
    }
    onDone(ordered);
  }

  return (
    <Screen>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[22px] leading-tight">Drag each corner into place.</h1>
        <TurnIcons onTurn={onTurn} turning={turning} disabled={busy} />
      </div>
      {notice && (
        <p role="status" className="text-[16px] leading-snug bg-need-bg text-need rounded-[12px] px-3.5 py-2 font-sans">
          {notice}
        </p>
      )}
      <Fill fillRef={fillRef} height={fillHeight}>
        <PhotoStage
          src={src}
          alt={`Your photo: ${name}`}
          corners={corners}
          active={active}
          onActive={(i) => setActive(i)}
          floatingLoupe={magnifier}
          imgMaxHeight={fillHeight}
          onMove={(i, p) => {
            setCrossed(false);
            onChange(corners.map((c, k) => (k === i ? p : c)) as Quad);
          }}
        />
      </Fill>
      {crossed && (
        <p role="alert" className="text-[16px] text-center text-burgundy font-semibold leading-snug">
          The circles are crossed over. Put one on each corner.
        </p>
      )}
      <Button onClick={done} busy={busy} disabled={turning} className={big}>
        Done
      </Button>
    </Screen>
  );
}

export function PhoneFinding({ src, name }: { src: string; name: string }) {
  const { ref: fillRef, height: fillHeight } = useFill();
  return (
    <Screen>
      <h1 className="flex items-center gap-3 text-[24px]" role="status">
        <span className="gs-spinner text-burgundy" aria-hidden /> Finding the corners…
      </h1>
      <Fill fillRef={fillRef} height={fillHeight}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={`Your photo: ${name}`} className="max-w-full rounded-[3px] opacity-80" style={{ maxHeight: fillHeight }} />
      </Fill>
    </Screen>
  );
}

type SaveProps = {
  painting: Painting;
  status: SaveStatus;
  onGoogle: () => void;
  onDownload: () => void;
  onDimensions: (text: string) => void;
  onEnhance: (on: boolean) => void;
  redrawing: boolean;
  onAnother: () => void;
};

export function PhoneSave({ painting, status, onGoogle, onDownload, onDimensions, onEnhance, redrawing, onAnother }: SaveProps) {
  const { ref: fillRef, height: fillHeight } = useFill();
  const [sizeOpen, setSizeOpen] = useState(false);
  const [sizeText, setSizeText] = useState(painting.dimensions);
  const sizeBad = sizeText.trim() !== '' && parseDimensions(sizeText) === null;
  const working = status.kind === 'working';

  return (
    <Screen>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[24px]">All done.</h1>
        <EnhanceToggle on={painting.enhance} onChange={onEnhance} disabled={working || redrawing} busy={redrawing} />
      </div>
      <Fill fillRef={fillRef} height={fillHeight}>
        {painting.resultUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={painting.resultUrl}
            alt={`${displayName(painting.name)}, cropped and straightened`}
            className="max-w-full rounded-[2px] shadow-[0_8px_18px_-10px_rgba(60,40,20,.55)]"
            style={{ maxHeight: fillHeight }}
          />
        )}
      </Fill>
      <div aria-live="polite" className="text-center text-[16px] leading-snug empty:hidden">
        {status.kind === 'working' && <p className="text-muted">{status.what === 'google' ? 'Saving to Google Photos…' : 'Getting your download ready…'}</p>}
        {status.kind === 'saved' && (
          <p className="font-semibold">
            Saved to your &ldquo;{ALBUM_TITLE}&rdquo; album.{' '}
            <a href={status.url ?? 'https://photos.google.com/'} target="_blank" rel="noopener noreferrer" className="text-burgundy underline font-sans font-bold">
              Open it
            </a>
          </p>
        )}
        {status.kind === 'downloaded' && <p className="font-semibold">Saved as {outputFilename(painting.name)}.</p>}
        {status.kind === 'error' && (
          <p role="alert" className="text-burgundy font-semibold">
            {status.message}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2.5">
        <Button onClick={onGoogle} busy={working && status.what === 'google'} disabled={working || redrawing} className={big}>
          <PhotoIcon className="w-[22px] h-[22px] flex-none" />
          Save to Google Photos
        </Button>
        <Button onClick={onDownload} busy={working && status.what === 'download'} disabled={working || redrawing} className={big}>
          <DownloadIcon className="w-[22px] h-[22px] flex-none" />
          Download
        </Button>
      </div>
      {sizeOpen ? (
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!sizeBad) {
              onDimensions(sizeText.trim());
              setSizeOpen(false);
            }
          }}
        >
          <label htmlFor="real-size-phone" className="sr-only">
            Real size of the painting, width × height
          </label>
          <input
            id="real-size-phone"
            value={sizeText}
            onChange={(e) => setSizeText(e.target.value)}
            placeholder="Real size, e.g. 16 x 20"
            autoComplete="off"
            className="flex-1 min-w-0 font-sans text-[16px] px-3 py-2 rounded-[10px] border-2 border-line bg-card-on"
          />
          <Button size="sm" variant="outline" type="submit" disabled={sizeBad || working}>
            Use
          </Button>
        </form>
      ) : (
        <div className="flex justify-between font-sans font-bold text-[16px] text-burgundy -mt-1">
          <button type="button" onClick={() => setSizeOpen(true)} className="py-1.5 cursor-pointer">
            Shape looks off?
          </button>
          <button type="button" onClick={onAnother} className="py-1.5 cursor-pointer">
            Start another
          </button>
        </div>
      )}
    </Screen>
  );
}
