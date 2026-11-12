'use client';

// Several photos at once: the "gallery wall" to check them, and the saved screen.
import { displayName } from '@/lib/filenames';
import { ALBUM_TITLE } from '@/lib/googlePhotos';
import type { Painting } from '@/lib/types';
import type { SaveStatus } from './SaveStep';
import { Button, CheckIcon, DownloadIcon, PhotoIcon } from './ui';

type WallProps = {
  paintings: Painting[];
  status: SaveStatus;
  onFix: (id: string) => void;
  onGoogle: () => void;
  onDownload: () => void;
  onStartOver: () => void;
};

export function WallStep({ paintings, status, onFix, onGoogle, onDownload, onStartOver }: WallProps) {
  const working = paintings.filter((p) => p.status === 'working').length;
  const good = paintings.filter((p) => p.status === 'good').length;
  const needs = paintings.filter((p) => p.status === 'needs').length;
  const saving = status.kind === 'working';
  const total = paintings.length;

  let sub: string;
  if (working > 0) sub = `Working on painting ${total - working + 1} of ${total}…`;
  else if (needs === 0) sub = 'They all look good.';
  else sub = `${good} look${good === 1 ? 's' : ''} good. ${needs} need${needs === 1 ? 's' : ''} you to choose ${needs === 1 ? 'its' : 'their'} corners.`;

  return (
    <main className="flex flex-col items-center gap-5 px-4 sm:px-10 py-7">
      <h1 className="text-[28px] sm:text-[38px] text-center">
        {working > 0 ? `Straightening ${total} paintings` : `${total} paintings straightened`}
      </h1>
      <p className="text-[19px] sm:text-[22px] text-muted text-center flex items-center gap-3" role="status">
        {working > 0 && <span className="gs-spinner text-burgundy" aria-hidden />}
        {sub}
      </p>

      <ul className="grid grid-cols-1 min-[520px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 w-full max-w-[1040px]">
        {paintings.map((p) => {
          const need = p.status === 'needs';
          return (
            <li key={p.id} className={`flex flex-col items-start gap-2 p-3 rounded-[16px] border-2 bg-card ${need ? 'border-burgundy' : 'border-line'}`}>
              <div className="w-full h-[160px] rounded-[8px] bg-soft flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.status === 'good' && p.resultUrl ? p.resultUrl : p.previewUrl}
                  alt={p.status === 'good' ? `${displayName(p.name)}, straightened` : `${displayName(p.name)}, original photo`}
                  className={`max-w-full max-h-[160px] shadow-[0_4px_10px_-6px_rgba(60,40,20,.5)] ${p.status === 'working' ? 'opacity-50' : ''}`}
                />
              </div>
              <p className="text-[15px] text-muted truncate max-w-full">{displayName(p.name)}</p>
              {p.status === 'working' && <span className="font-sans font-bold text-[14px] px-2.5 py-1 rounded-full bg-soft text-muted">Working…</span>}
              {p.status === 'good' && (
                <span className="font-sans font-bold text-[14px] px-2.5 py-1 rounded-full bg-ok-bg text-ok inline-flex items-center gap-1">
                  <CheckIcon className="w-3.5 h-3.5" /> Looks good
                </span>
              )}
              {need && <span className="font-sans font-bold text-[14px] px-2.5 py-1 rounded-full bg-need-bg text-need">Needs a look</span>}
              <Button size="sm" variant={need ? 'solid' : 'outline'} className="w-full" disabled={p.status === 'working' || saving} onClick={() => onFix(p.id)}>
                {need ? 'Choose corners' : 'Fix corners'}
              </Button>
            </li>
          );
        })}
      </ul>

      <div className="grid sm:grid-cols-2 gap-3 sm:gap-5 w-full max-w-[820px]">
        <Button onClick={onGoogle} busy={saving && status.what === 'google'} disabled={saving || working > 0 || good === 0}>
          <PhotoIcon className="w-[26px] h-[26px] flex-none" />
          Save all to Google Photos
        </Button>
        <Button onClick={onDownload} busy={saving && status.what === 'download'} disabled={saving || working > 0 || good === 0}>
          <DownloadIcon className="w-[26px] h-[26px] flex-none" />
          Download all
        </Button>
      </div>

      <div aria-live="polite" className="text-center text-[18px] min-h-[1.5em]">
        {status.kind === 'idle' && needs > 0 && working === 0 && good > 0 && (
          <p className="italic text-muted">Paintings that need a look are left out until you choose their corners.</p>
        )}
        {status.kind === 'working' && <p className="text-muted">{status.what === 'google' ? 'Saving to Google Photos…' : 'Getting your download ready…'}</p>}
        {status.kind === 'downloaded' && <p className="font-semibold">Downloaded as gallerysnap-paintings.zip. Look in your Downloads folder.</p>}
        {status.kind === 'error' && (
          <p role="alert" className="text-burgundy font-semibold">
            {status.message}
          </p>
        )}
      </div>

      <button type="button" onClick={onStartOver} className="font-sans font-bold text-[17px] text-burgundy cursor-pointer hover:underline">
        Start over with different photos
      </button>
    </main>
  );
}

export function SavedStep({ paintings, albumUrl, onNew }: { paintings: Painting[]; albumUrl: string | null; onNew: () => void }) {
  const n = paintings.length;
  return (
    <main className="flex flex-col items-center gap-6 px-4 py-10 sm:py-14">
      <span className="w-[72px] h-[72px] rounded-full bg-burgundy text-cream flex items-center justify-center">
        <CheckIcon className="w-10 h-10" />
      </span>
      <h1 className="text-[28px] sm:text-[38px] text-center">
        Saved {n} painting{n === 1 ? '' : 's'} to Google Photos
      </h1>
      <p className="text-[20px] sm:text-[22px] text-muted text-center">
        They&rsquo;re in your album called <b className="text-ink">{ALBUM_TITLE}</b>.
      </p>
      <ul className="flex flex-wrap justify-center items-end gap-4 max-w-[900px]">
        {paintings.slice(0, 12).map((p) => (
          <li key={p.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.resultUrl ?? p.previewUrl} alt={displayName(p.name)} className="h-[110px] w-auto shadow-[0_6px_14px_-8px_rgba(60,40,20,.5)]" />
          </li>
        ))}
      </ul>
      <div className="grid sm:grid-cols-2 gap-3 sm:gap-5 w-full max-w-[820px]">
        <a
          href={albumUrl ?? 'https://photos.google.com/'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center border-2 border-burgundy bg-burgundy text-cream hover:bg-burgundy-dk hover:border-burgundy-dk font-sans font-bold text-[21px] sm:text-[22px] px-6 py-4 rounded-[14px] min-h-[60px] transition-colors"
        >
          Open Google Photos
        </a>
        <Button variant="outline" onClick={onNew}>
          Start a new batch
        </Button>
      </div>
    </main>
  );
}
