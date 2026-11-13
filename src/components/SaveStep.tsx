'use client';

// Step 3 (one photo): before and after, then Save to Google Photos or Download.
import { useState } from 'react';
import { displayName, outputFilename } from '@/lib/filenames';
import { parseDimensions } from '@/lib/geometry';
import { ALBUM_TITLE } from '@/lib/googlePhotos';
import type { Painting } from '@/lib/types';
import { BackLink, Button, EnhanceToggle, DownloadIcon, PhotoIcon } from './ui';

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
  onEnhance: (on: boolean) => void;
  /** True while the picture is being redrawn. */
  redrawing: boolean;
  onBack: () => void;
  onAnother: () => void;
};

function Hung({ src, alt, label, title, size }: { src: string; alt: string; label: string; title: string; size: { width: number; height: number } }) {
  return (
    <figure className="flex flex-col items-center min-w-0">
      <figcaption className="font-serif font-semibold text-[15px] uppercase tracking-[0.16em] text-muted mb-2.5">{label}</figcaption>
      {/* Both pictures get the same box, so they hang level and at equal size. */}
      <div className="h-[150px] w-[150px] min-[480px]:h-[200px] min-[480px]:w-[200px] md:h-[250px] md:w-[320px] flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="max-w-full max-h-full rounded-[2px] shadow-[0_6px_16px_-8px_rgba(60,40,20,.45)]" />
      </div>
      <p className="mt-3 max-w-full bg-card border border-line rounded-[4px] px-3.5 py-1.5 text-[14px] text-muted text-center leading-snug">
        <b className="block text-ink font-semibold truncate max-w-[280px]">{title}</b>
        {size.width} × {size.height} pixels
      </p>
    </figure>
  );
}

export default function SaveStep({ painting, status, onGoogle, onDownload, onDimensions, onEnhance, redrawing, onBack, onAnother }: Props) {
  const [sizeOpen, setSizeOpen] = useState(painting.dimensions !== '');
  const [sizeText, setSizeText] = useState(painting.dimensions);
  const sizeBad = sizeText.trim() !== '' && parseDimensions(sizeText) === null;
  const working = status.kind === 'working';

  return (
    <main className="flex flex-col gap-4 px-4 sm:px-10 py-5 max-w-[1100px] mx-auto w-full">
      <BackLink onClick={onBack}>Back to straighten</BackLink>
      <div className="flex flex-col items-center gap-5">
        <h1 className="text-[28px] sm:text-[38px] text-center">All done. Here&rsquo;s your painting.</h1>

        <div className="flex items-start justify-center gap-3 sm:gap-8 max-w-full">
          <Hung src={painting.displayUrl} alt="Your photo before" label="Before" title="Your photo" size={painting.turns % 2 ? { width: painting.height, height: painting.width } : { width: painting.width, height: painting.height }} />
          <span aria-hidden className="text-[32px] sm:text-[40px] text-muted self-center pb-10">
            →
          </span>
          {painting.resultUrl && painting.resultSize && (
            <Hung src={painting.resultUrl} alt="Your painting, cropped and straightened" label="After" title={displayName(painting.name)} size={painting.resultSize} />
          )}
        </div>

        <EnhanceToggle on={painting.enhance} onChange={onEnhance} disabled={working || redrawing} busy={redrawing} />

        <div className="grid sm:grid-cols-2 gap-3 sm:gap-5 w-full max-w-[820px]">
          <Button onClick={onGoogle} busy={working && status.what === 'google'} disabled={working || redrawing}>
            <PhotoIcon className="w-[26px] h-[26px] flex-none" />
            Save to Google Photos
          </Button>
          <Button onClick={onDownload} busy={working && status.what === 'download'} disabled={working || redrawing}>
            <DownloadIcon className="w-[26px] h-[26px] flex-none" />
            Download
          </Button>
        </div>

        <div aria-live="polite" className="text-center text-[19px] min-h-[1.5em]">
          {status.kind === 'idle' && <p className="italic text-muted text-[18px]">Google Photos saves go into an album called &ldquo;{ALBUM_TITLE}&rdquo;.</p>}
          {status.kind === 'working' && <p className="text-muted">{status.what === 'google' ? 'Saving to Google Photos…' : 'Getting your download ready…'}</p>}
          {status.kind === 'saved' && (
            <p className="font-semibold">
              Saved to your &ldquo;{ALBUM_TITLE}&rdquo; album.{' '}
              <a href={status.url ?? 'https://photos.google.com/'} target="_blank" rel="noopener noreferrer" className="text-burgundy underline font-sans font-bold">
                See it in Google Photos
              </a>
            </p>
          )}
          {status.kind === 'downloaded' && (
            <p className="font-semibold">
              Downloaded as <span className="font-sans">{outputFilename(painting.name)}</span>. Look in your Downloads folder.
            </p>
          )}
          {status.kind === 'error' && (
            <p role="alert" className="text-burgundy font-semibold">
              {status.message}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center gap-3 text-[17px]">
          {sizeOpen ? (
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
                className="w-[130px] font-sans text-[18px] px-3 py-2 rounded-[10px] border-2 border-line bg-card-on"
              />
              <Button size="sm" variant="outline" type="submit" disabled={sizeBad || working}>
                Use this shape
              </Button>
              {sizeBad && (
                <p role="alert" className="basis-full text-center text-burgundy">
                  Type two numbers, like 16 x 20.
                </p>
              )}
            </form>
          ) : (
            <button type="button" onClick={() => setSizeOpen(true)} className="font-sans font-bold text-burgundy cursor-pointer hover:underline">
              Shape looks a little off? Enter the painting&rsquo;s real size
            </button>
          )}
          <button type="button" onClick={onAnother} className="font-sans font-bold text-burgundy cursor-pointer hover:underline">
            Straighten another photo
          </button>
        </div>
      </div>
    </main>
  );
}

