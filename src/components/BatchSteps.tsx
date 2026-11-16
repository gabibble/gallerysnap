'use client';

// Several photos at once: the "gallery wall" to check them, and the saved screen.
import { displayName } from '@/lib/filenames';
import { ALBUM_TITLE } from '@/lib/googlePhotos';
import type { Painting } from '@/lib/types';
import type { SaveStatus } from './SaveStep';
import { SAVE_LABEL, SAVED_ALL_TEXT, useSaveTarget } from '@/lib/saveTarget';
import { Button, CheckIcon, Chip, DownloadIcon, GooglePhotosIcon, IconButton, RotateLeftIcon, RotateRightIcon, Switch, TextButton, WandIcon } from './ui';

type WallProps = {
  paintings: Painting[];
  status: SaveStatus;
  onFix: (id: string) => void;
  onTurn: (id: string, by: number) => void;
  onEnhance: (id: string, on: boolean) => void;
  /** Switch Enhance on or off for every painting at once. */
  onEnhanceAll: (on: boolean) => void;
  redrawing: boolean;
  /** Left out when Google Photos isn't switched on in this browser. */
  onGoogle?: () => void;
  onDownload: () => void;
  onStartOver: () => void;
};

export function WallStep({ paintings, status, onFix, onTurn, onEnhance, onEnhanceAll, redrawing, onGoogle, onDownload, onStartOver }: WallProps) {
  const working = paintings.filter((p) => p.status === 'working').length;
  const good = paintings.filter((p) => p.status === 'good').length;
  const needs = paintings.filter((p) => p.status === 'needs').length;
  const saving = status.kind === 'working';
  const target = useSaveTarget();
  const total = paintings.length;
  const allEnhanced = paintings.every((p) => p.enhance);

  let sub: string;
  if (working > 0) sub = `Working on painting ${total - working + 1} of ${total}…`;
  else if (needs === 0) sub = 'They all look good.';
  else sub = `${good} look${good === 1 ? 's' : ''} good. ${needs} need${needs === 1 ? 's' : ''} you to choose ${needs === 1 ? 'its' : 'their'} corners.`;

  return (
    <main className="flex flex-col items-center gap-5 px-4 sm:px-10 pt-3 pb-10">
      <h1 className="text-[28px] sm:text-[40px] text-center">
        {working > 0 ? `Straightening ${total} paintings` : `${total} paintings straightened`}
      </h1>
      <p className="text-[16px] sm:text-[19px] text-muted text-center flex items-center gap-3 -mt-2.5" role="status">
        {working > 0 ? <span className="gs-spinner" aria-hidden /> : null}
        <span>{sub}</span>
      </p>

      <Switch
        className="w-full max-w-[260px] !bg-card"
        checked={allEnhanced}
        onChange={onEnhanceAll}
        disabled={redrawing || saving || working > 0}
        label={
          <>
            <WandIcon className="w-5 h-5 flex-none" />
            Enhance all
          </>
        }
      />

      <ul className="flex flex-wrap justify-center gap-2.5 sm:gap-4 w-full max-w-[1120px]">
        {paintings.map((p) => {
          const need = p.status === 'needs';
          return (
            <li key={p.id} className={`w-[calc(50%-5px)] sm:w-[268px] flex flex-col items-start gap-2 sm:gap-2.5 p-2 sm:p-3 rounded-[20px] sm:rounded-[24px] border-2 bg-card ${need ? 'border-ink' : 'border-card'}`}>
              <div className="relative w-full h-[104px] sm:h-[180px] rounded-[12px] sm:rounded-[14px] bg-wall flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.status === 'good' && p.resultUrl ? p.resultUrl : p.previewUrl}
                  alt={p.status === 'good' ? `${displayName(p.name)}, straightened` : `${displayName(p.name)}, original photo`}
                  className={`max-w-[90%] max-h-[92px] sm:max-h-[160px] ${p.status === 'working' ? 'opacity-50' : ''}`}
                />
                {p.enhance && p.status !== 'working' && (
                  <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 py-1 pl-1.5 pr-2 rounded-full bg-ink text-white text-[12px] font-bold leading-none">
                    <WandIcon className="w-3.5 h-3.5" />
                    Enhanced
                  </span>
                )}
              </div>
              <p className="text-[15px] text-muted truncate max-w-full max-sm:hidden">{displayName(p.name)}</p>
              {p.status === 'working' && <Chip className="!text-muted">Working…</Chip>}
              {p.status === 'good' && (
                <Chip tone="ok">
                  <CheckIcon className="w-3.5 h-3.5" /> Looks good
                </Chip>
              )}
              {need && <Chip tone="need">Needs a look</Chip>}
              {p.status === 'good' && p.suggestedTurns ? (
                <p className="text-[15px] text-need font-bold">{p.suggestedTurns === 2 ? 'Looks upside down.' : 'Looks like it is on its side.'}</p>
              ) : null}
              {p.status === 'good' && p.suggestedTurns ? (
                <Button size="sm" className="w-full" disabled={redrawing || saving} onClick={() => onTurn(p.id, p.suggestedTurns === 3 ? -1 : p.suggestedTurns!)}>
                  Turn upright
                </Button>
              ) : null}
              {p.status === 'good' && (
                <div className="flex max-sm:justify-between sm:gap-1.5 w-full">
                  <IconButton label={`Turn ${displayName(p.name)} left`} tone="wall" disabled={redrawing || saving} onClick={() => onTurn(p.id, -1)}>
                    <RotateLeftIcon className="w-5 h-5" />
                  </IconButton>
                  <IconButton label={`Turn ${displayName(p.name)} right`} tone="wall" disabled={redrawing || saving} onClick={() => onTurn(p.id, 1)}>
                    <RotateRightIcon className="w-5 h-5" />
                  </IconButton>
                  {/* Phone cards are too narrow for a labelled switch: a wand button that stays pressed. */}
                  <span className="sm:hidden flex">
                    <IconButton label={`Enhance colors of ${displayName(p.name)}`} tone="wall" pressed={p.enhance} disabled={redrawing || saving} onClick={() => onEnhance(p.id, !p.enhance)}>
                      <WandIcon className="w-5 h-5" />
                    </IconButton>
                  </span>
                  <Switch
                    compact
                    className="max-sm:hidden flex-1 min-w-0"
                    aria-label={`Enhance colors of ${displayName(p.name)}`}
                    checked={p.enhance}
                    onChange={(on) => onEnhance(p.id, on)}
                    disabled={redrawing || saving}
                    label={
                      <>
                        <WandIcon className="w-5 h-5 flex-none" />
                        Enhance
                      </>
                    }
                  />
                </div>
              )}
              <Button size="sm" variant={need ? 'solid' : 'outline'} className="w-full mt-auto" disabled={p.status === 'working' || saving} onClick={() => onFix(p.id)}>
                {need ? 'Choose corners' : 'Fix corners'}
              </Button>
            </li>
          );
        })}
      </ul>

      <div className={`grid gap-2.5 sm:gap-3.5 w-full mt-2 ${onGoogle ? 'sm:grid-cols-2 max-w-[820px]' : 'max-w-[400px]'}`}>
        {onGoogle && (
          <Button className="sm:!min-h-[68px] sm:!rounded-[20px]" onClick={onGoogle} busy={saving && status.what === 'google'} disabled={saving || redrawing || working > 0 || good === 0}>
            <GooglePhotosIcon className="w-[30px] h-[30px]" />
            Save all to Google Photos
          </Button>
        )}
        <Button className="sm:!min-h-[68px] sm:!rounded-[20px]" onClick={onDownload} busy={saving && status.what === 'download'} disabled={saving || redrawing || working > 0 || good === 0}>
          <DownloadIcon className="w-6 h-6 flex-none" />
          {SAVE_LABEL[target].all}
        </Button>
      </div>

      <div aria-live="polite" className="text-center text-[15px] min-h-[1.5em]">
        {status.kind === 'idle' && needs > 0 && working === 0 && good > 0 && (
          <p className="text-muted">Paintings that need a look are left out until you choose their corners.</p>
        )}
        {status.kind === 'working' && <p className="text-muted">{status.what === 'google' ? 'Saving to Google Photos…' : 'Getting your pictures ready…'}</p>}
        {status.kind === 'downloaded' && <p className="font-bold text-[17px]">{SAVED_ALL_TEXT[target]}</p>}
        {status.kind === 'error' && (
          <p role="alert" className="text-alert font-bold text-[17px]">
            {status.message}
          </p>
        )}
      </div>

      <TextButton onClick={onStartOver} className="text-[16px]">
        Start over with different photos
      </TextButton>
    </main>
  );
}

export function SavedStep({ paintings, albumUrl, onNew }: { paintings: Painting[]; albumUrl: string | null; onNew: () => void }) {
  const n = paintings.length;
  return (
    <main className="flex flex-col items-center gap-6 px-4 py-10 sm:py-14">
      <span className="w-[72px] h-[72px] rounded-full bg-ok-bg text-ok flex items-center justify-center">
        <CheckIcon className="w-10 h-10" />
      </span>
      <h1 className="text-[28px] sm:text-[40px] text-center">
        Saved {n} painting{n === 1 ? '' : 's'} to Google Photos
      </h1>
      <p className="text-[17px] sm:text-[19px] text-muted text-center -mt-2">
        They&rsquo;re in your album called <b className="text-ink">{ALBUM_TITLE}</b>.
      </p>
      <ul className="flex flex-wrap justify-center items-end gap-4 max-w-[900px]">
        {paintings.slice(0, 12).map((p) => (
          <li key={p.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.resultUrl ?? p.previewUrl} alt={displayName(p.name)} className="h-[110px] w-auto rounded-[4px] shadow-[0_16px_30px_-14px_rgba(35,39,47,.4)]" />
          </li>
        ))}
      </ul>
      <div className="grid sm:grid-cols-2 gap-2.5 sm:gap-3.5 w-full max-w-[820px]">
        <a
          href={albumUrl ?? 'https://photos.google.com/'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2.5 bg-ink text-white hover:bg-ink-dk font-bold text-[19px] px-7 rounded-[18px] min-h-[64px] transition-colors"
        >
          <GooglePhotosIcon className="w-[30px] h-[30px]" />
          Open Google Photos
        </a>
        <Button variant="outline" onClick={onNew}>
          Start a new batch
        </Button>
      </div>
    </main>
  );
}
