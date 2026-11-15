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
import { SAVE_LABEL, SAVED_TEXT, useSaveTarget } from '@/lib/saveTarget';
import type { Painting } from '@/lib/types';
import type { SaveStatus } from './SaveStep';
import { PhotoStage, type AdjustProps, type FoundProps } from './StraightenStep';
import { Button, Chip, DownloadIcon, FrameIcon, GooglePhotosIcon, IconButton, PHONE_HEADER, RotateLeftIcon, RotateRightIcon, SwitchRow, TextButton, WandIcon } from './ui';

const big = 'w-full !min-h-[62px]';
const CARD_PAD = 12;

/** A full-height phone screen. */
function Screen({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-col gap-3.5 px-4 pt-1 pb-5" style={{ height: `calc(100dvh - ${PHONE_HEADER}px)` }}>
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
    const ro = new ResizeObserver(() => setHeight(Math.max(0, el.clientHeight - 2 * CARD_PAD)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, height };
}

/** The white card the photo sits on. It takes whatever height is left. */
function Fill({ fillRef, height, children }: { fillRef: RefObject<HTMLDivElement | null>; height: number; children: ReactNode }) {
  return (
    <div ref={fillRef} className="flex-1 min-h-0 bg-card rounded-[24px] flex items-center justify-center" style={{ padding: CARD_PAD }}>
      {height > 0 ? children : null}
    </div>
  );
}

/** The headline with the two turn buttons beside it. */
function Heading({ children, onTurn, turning, disabled }: { children: ReactNode; onTurn: (by: number) => void; turning: boolean; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h1 className="text-[25px] leading-[1.12]">{children}</h1>
      <div className="flex gap-2 flex-none">
        <IconButton label="Turn left" size={48} onClick={() => onTurn(-1)} disabled={turning || disabled}>
          <RotateLeftIcon className="w-[22px] h-[22px]" />
        </IconButton>
        <IconButton label="Turn right" size={48} onClick={() => onTurn(1)} disabled={turning || disabled}>
          <RotateRightIcon className="w-[22px] h-[22px]" />
        </IconButton>
      </div>
    </div>
  );
}

/** The white card of on/off switches under the photo. */
function Switches({ enhance, onEnhance, disabled, frame }: { enhance: boolean; onEnhance: (v: boolean) => void; disabled?: boolean; frame?: { on: boolean; onChange: (v: boolean) => void } }) {
  return (
    <div className="bg-card rounded-[20px] px-4 flex flex-col">
      {frame && (
        <>
          <SwitchRow className="py-3" icon={<FrameIcon className="w-[22px] h-[22px]" />} title="Include the frame" checked={frame.on} onChange={frame.onChange} disabled={disabled} />
          <div className="h-px bg-line" />
        </>
      )}
      <SwitchRow className="py-3" icon={<WandIcon className="w-[22px] h-[22px]" />} title="Enhance colors" checked={enhance} onChange={onEnhance} disabled={disabled} />
    </div>
  );
}

function TurnHint({ suggestedTurns, onTurn, disabled }: { suggestedTurns: Turns; onTurn: (by: number) => void; disabled: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-need-bg text-need rounded-[16px] pl-4 pr-1.5 py-1.5 text-[16px] font-bold">
      <span>{suggestedTurns === 2 ? 'Looks upside down.' : 'Looks like it’s on its side.'}</span>
      <Button size="sm" className="!min-h-[40px] whitespace-nowrap" disabled={disabled} onClick={() => onTurn(suggestedTurns === 3 ? -1 : suggestedTurns)}>
        Turn upright
      </Button>
    </div>
  );
}

export function PhoneFound({ src, name, corners, unsure, hasFrame, includeFrame, onIncludeFrame, onAccept, onAdjust, busy, suggestedTurns, onTurn, turning, enhance, onEnhance }: FoundProps) {
  const { ref: fillRef, height: fillHeight } = useFill();
  return (
    <Screen>
      <Heading onTurn={onTurn} turning={turning} disabled={busy}>
        {unsure ? 'Is this right?' : 'Found it.'}
      </Heading>
      {suggestedTurns ? <TurnHint suggestedTurns={suggestedTurns} onTurn={onTurn} disabled={turning || busy} /> : null}
      <Fill fillRef={fillRef} height={fillHeight}>
        <PhotoStage src={src} alt={`Your photo: ${name}`} corners={corners} imgMaxHeight={fillHeight} shade />
      </Fill>
      <Switches enhance={enhance} onEnhance={onEnhance} disabled={busy || turning} frame={hasFrame ? { on: includeFrame, onChange: onIncludeFrame } : undefined} />
      <div className="flex flex-col gap-1">
        <Button size="md" onClick={onAccept} busy={busy} disabled={turning} className={big}>
          Looks right
        </Button>
        <TextButton onClick={onAdjust} disabled={busy} className="text-[16px] py-2">
          Move the corners myself
        </TextButton>
      </div>
    </Screen>
  );
}

export function PhoneAdjust({ src, name, corners, onChange, onDone, notice, busy, onTurn, turning, enhance, onEnhance, magnifier }: AdjustProps & { magnifier: boolean }) {
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
      <Heading onTurn={onTurn} turning={turning} disabled={busy}>
        Drag each corner into place.
      </Heading>
      {notice && (
        <p role="status" className="text-[16px] leading-snug bg-need-bg text-need font-bold rounded-[16px] px-4 py-2.5">
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
      {crossed ? (
        <p role="alert" className="text-[16px] text-center text-alert font-bold leading-snug">
          The corners are crossed over. Put one on each corner.
        </p>
      ) : (
        <p className="text-[15px] text-center text-muted">Put the red cross right on the corner.</p>
      )}
      <Switches enhance={enhance} onEnhance={onEnhance} disabled={busy || turning} />
      <Button size="md" onClick={done} busy={busy} disabled={turning} className={big}>
        Done
      </Button>
    </Screen>
  );
}

export function PhoneFinding({ src, name }: { src: string; name: string }) {
  const { ref: fillRef, height: fillHeight } = useFill();
  return (
    <Screen>
      <h1 className="flex items-center gap-3 text-[25px] min-h-[48px]" role="status">
        <span className="gs-spinner" aria-hidden /> Finding the corners…
      </h1>
      <Fill fillRef={fillRef} height={fillHeight}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={`Your photo: ${name}`} className="max-w-full rounded-[12px] opacity-80" style={{ maxHeight: fillHeight }} />
      </Fill>
    </Screen>
  );
}

type SaveProps = {
  painting: Painting;
  status: SaveStatus;
  /** Left out when Google Photos isn't switched on in this browser. */
  onGoogle?: () => void;
  onDownload: () => void;
  onDimensions: (text: string) => void;
  onAnother: () => void;
};

export function PhoneSave({ painting, status, onGoogle, onDownload, onDimensions, onAnother }: SaveProps) {
  const { ref: fillRef, height: fillHeight } = useFill();
  const [sizeOpen, setSizeOpen] = useState(false);
  const [sizeText, setSizeText] = useState(painting.dimensions);
  const sizeBad = sizeText.trim() !== '' && parseDimensions(sizeText) === null;
  const working = status.kind === 'working';
  const target = useSaveTarget();

  const tall = 'flex-1 !min-h-[92px] !px-3 !text-[16px] [&>span]:flex-col [&>span]:gap-2';

  return (
    <Screen>
      <div className="flex-1 min-h-0 bg-card rounded-[24px] p-4 flex flex-col items-center gap-2.5 text-center">
        <Chip tone="ok">Straightened and cropped</Chip>
        <div ref={fillRef} className="flex-1 min-h-0 w-full flex items-center justify-center" style={{ padding: CARD_PAD }}>
          {painting.resultUrl && fillHeight > 0 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={painting.resultUrl} alt={`${displayName(painting.name)}, cropped and straightened`} className="max-w-full rounded-[8px] shadow-[0_14px_26px_-14px_rgba(35,39,47,.45)]" style={{ maxHeight: fillHeight }} />
          )}
        </div>
        <h1 className="text-[25px]">All done.</h1>
        <div aria-live="polite" className="text-[16px] leading-snug">
          {status.kind === 'idle' && <p className="text-muted">Where should it go?</p>}
          {status.kind === 'working' && <p className="text-muted">{status.what === 'google' ? 'Saving to Google Photos…' : 'Getting your picture ready…'}</p>}
          {status.kind === 'saved' && (
            <p className="font-bold">
              Saved to your &ldquo;{ALBUM_TITLE}&rdquo; album.{' '}
              <a href={status.url ?? 'https://photos.google.com/'} target="_blank" rel="noopener noreferrer" className="underline">
                Open it
              </a>
            </p>
          )}
          {status.kind === 'downloaded' && <p className="font-bold">{SAVED_TEXT[target](outputFilename(painting.name))}</p>}
          {status.kind === 'error' && (
            <p role="alert" className="text-alert font-bold">
              {status.message}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2.5">
        {onGoogle && (
          <Button size="md" onClick={onGoogle} busy={working && status.what === 'google'} disabled={working} className={tall}>
            <GooglePhotosIcon className="w-8 h-8 flex-none" />
            Google Photos
          </Button>
        )}
        <Button size="md" onClick={onDownload} busy={working && status.what === 'download'} disabled={working} className={tall}>
          <DownloadIcon className="w-7 h-7 flex-none" />
          {SAVE_LABEL[target].one}
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
            className="flex-1 min-w-0 text-[16px] px-3.5 h-12 rounded-[14px] border-2 border-line bg-card"
          />
          <Button size="sm" variant="outline" type="submit" disabled={sizeBad || working}>
            Use
          </Button>
        </form>
      ) : (
        <div className="flex justify-between text-[16px] px-1">
          <TextButton onClick={() => setSizeOpen(true)} className="py-1.5">
            Shape looks off?
          </TextButton>
          <TextButton onClick={onAnother} className="py-1.5">
            Start another
          </TextButton>
        </div>
      )}
    </Screen>
  );
}
