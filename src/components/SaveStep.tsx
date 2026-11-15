'use client';

// Step 3 (one photo): before and after, then Save to Google Photos or Download.
import { useState } from 'react';
import { displayName, outputFilename } from '@/lib/filenames';
import { parseDimensions } from '@/lib/geometry';
import { ALBUM_TITLE } from '@/lib/googlePhotos';
import type { Painting } from '@/lib/types';
import { SAVE_LABEL, SAVED_TEXT, useSaveTarget } from '@/lib/saveTarget';
import { ArrowRightIcon, BackLink, Button, DownloadIcon, GooglePhotosIcon, TextButton } from './ui';

export type SaveStatus =
  | { kind: 'idle' }
  | { kind: 'working'; what: 'google' | 'download' }
  | { kind: 'saved'; url: string | null }
  | { kind: 'downloaded' }
  | { kind: 'error'; message: string };

type Props = {
  painting: Painting;
  status: SaveStatus;
  onGoogle: () => void;
  onDownload: () => void;
  onDimensions: (text: string) => void;
  onBack: () => void;
  onAnother: () => void;
};

function Hung({ src, alt, label, after = false, size }: { src: string; alt: string; label: string; after?: boolean; size: { width: number; height: number } }) {
  return (
    <figure className="flex flex-col items-center gap-3 min-w-0">
      {/* Both pictures get the same box, so they sit level and at equal size. */}
      <div className="h-[150px] w-[150px] min-[480px]:h-[200px] min-[480px]:w-[200px] md:h-[250px] md:w-[320px] flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={`max-w-full max-h-full ${after ? 'rounded-[4px] shadow-[0_16px_36px_rgba(35,39,47,.22)]' : 'rounded-[8px] opacity-90'}`} />
      </div>
      <figcaption className={`py-1.5 px-3.5 rounded-full text-[14px] text-center ${after ? 'bg-ok-bg text-ok' : 'bg-wall text-muted'}`}>
        <b className={after ? '' : 'text-ink'}>{label}</b> · {size.width} × {size.height} pixels
      </figcaption>
    </figure>
  );
}

export default function SaveStep({ painting, status, onGoogle, onDownload, onDimensions, onBack, onAnother }: Props) {
  const [sizeOpen, setSizeOpen] = useState(painting.dimensions !== '');
  const [sizeText, setSizeText] = useState(painting.dimensions);
  const sizeBad = sizeText.trim() !== '' && parseDimensions(sizeText) === null;
  const working = status.kind === 'working';
  const target = useSaveTarget();

  return (
    <div className="px-4 sm:px-10 pb-10 max-w-[1280px] mx-auto w-full flex-1 flex flex-col">
      <main className="flex-1 bg-card rounded-[28px] px-5 sm:px-8 pt-7 pb-8 flex flex-col items-center gap-5">
        <BackLink onClick={onBack}>Back to straighten</BackLink>
        <h1 className="text-[30px] sm:text-[40px] text-center">All done. Here&rsquo;s your painting.</h1>

        <div className="flex items-start justify-center gap-3 sm:gap-6 max-w-full">
          <Hung src={painting.displayUrl} alt="Your photo before" label="Before" size={painting.turns % 2 ? { width: painting.height, height: painting.width } : { width: painting.width, height: painting.height }} />
          <span aria-hidden className="flex-none w-11 h-11 rounded-full bg-tile flex items-center justify-center self-center mb-11">
            <ArrowRightIcon className="w-5 h-5" />
          </span>
          {painting.resultUrl && painting.resultSize && <Hung src={painting.resultUrl} alt={`${displayName(painting.name)}, cropped and straightened`} label="After" after size={painting.resultSize} />}
        </div>

        <div className="grid sm:grid-cols-2 gap-3.5 w-full max-w-[820px]">
          <Button className="!min-h-[68px] !rounded-[20px]" onClick={onGoogle} busy={working && status.what === 'google'} disabled={working}>
            <GooglePhotosIcon className="w-[30px] h-[30px]" />
            Save to Google Photos
          </Button>
          <Button className="!min-h-[68px] !rounded-[20px]" onClick={onDownload} busy={working && status.what === 'download'} disabled={working}>
            <DownloadIcon className="w-6 h-6 flex-none" />
            {SAVE_LABEL[target].one}
          </Button>
        </div>

        <div aria-live="polite" className="text-center text-[17px] min-h-[1.5em]">
          {status.kind === 'idle' && <p className="text-muted text-[15px]">Google Photos saves go into an album called &ldquo;{ALBUM_TITLE}&rdquo;.</p>}
          {status.kind === 'working' && <p className="text-muted">{status.what === 'google' ? 'Saving to Google Photos…' : 'Getting your picture ready…'}</p>}
          {status.kind === 'saved' && (
            <p className="font-bold">
              Saved to your &ldquo;{ALBUM_TITLE}&rdquo; album.{' '}
              <a href={status.url ?? 'https://photos.google.com/'} target="_blank" rel="noopener noreferrer" className="underline hover:text-rasp">
                See it in Google Photos
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

        <div className="flex flex-col items-center gap-3 text-[16px]">
          {sizeOpen && (
            <form
              className="flex flex-wrap items-center justify-center gap-2.5"
              onSubmit={(e) => {
                e.preventDefault();
                if (!sizeBad) onDimensions(sizeText.trim());
              }}
            >
              <label htmlFor="real-size" className="text-muted">
                Real size of the painting, width × height:
              </label>
              <input
                id="real-size"
                value={sizeText}
                onChange={(e) => setSizeText(e.target.value)}
                placeholder="16 x 20"
                inputMode="text"
                autoComplete="off"
                className="w-[130px] h-12 text-[17px] px-3.5 rounded-[14px] border-2 border-line bg-card"
              />
              <Button size="sm" variant="outline" type="submit" disabled={sizeBad || working}>
                Use this shape
              </Button>
              {sizeBad && (
                <p role="alert" className="basis-full text-center text-alert font-bold">
                  Type two numbers, like 16 x 20.
                </p>
              )}
            </form>
          )}
          <div className="flex flex-wrap justify-center gap-x-7 gap-y-2">
            {!sizeOpen && <TextButton onClick={() => setSizeOpen(true)}>Shape looks a little off? Enter the real size</TextButton>}
            <TextButton onClick={onAnother}>Straighten another photo</TextButton>
          </div>
        </div>
      </main>
    </div>
  );
}
