'use client';

// Step 1, the start page: add a photo (or several).
import { useState, type RefObject } from 'react';
import { ACCEPTED_TYPES, isAcceptedFile } from '@/lib/images';
import { SnapGraphic } from './SnapGraphic';
import StartSections from './StartSections';
import { Button, CameraIcon, LockIcon, PHONE_HEADER, PhotoIcon, UploadIcon } from './ui';

type Props = {
  onFiles: (files: File[]) => void;
  busy: boolean;
  error: string | null;
  /** The hidden file picker. The header's button opens it too. */
  browseRef: RefObject<HTMLInputElement | null>;
  cameraRef: RefObject<HTMLInputElement | null>;
};

export default function PhotoStep({ onFiles, busy, error, browseRef, cameraRef }: Props) {
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState(false);

  function take(list: FileList | null) {
    const all = Array.from(list ?? []);
    const files = all.filter(isAcceptedFile);
    setRejected(all.length > 0 && files.length === 0);
    if (files.length) onFiles(files);
  }

  const errorText = (error || rejected) && (error ?? 'That file is not a photo this app can open. Please choose a JPG, PNG or HEIC photo.');
  const inputs = (
    <>
      <input ref={browseRef} type="file" accept={ACCEPTED_TYPES} multiple hidden onChange={(e) => { take(e.target.files); e.target.value = ''; }} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { take(e.target.files); e.target.value = ''; }} />
    </>
  );
  const opening = (
    <p className="flex items-center gap-3 text-[22px] font-bold" role="status">
      <span className="gs-spinner" aria-hidden /> Opening your photos…
    </p>
  );

  return (
    <>
      {inputs}
      {/* Phones: the headline, two buttons and the moving picture, all on one
          screen. Chosen with CSS (not JavaScript) so the right layout shows
          from the start. */}
      <main className="sm:hidden flex flex-col gap-[18px] px-4 pt-3 pb-5" style={{ minHeight: `calc(100dvh - ${PHONE_HEADER}px)` }}>
        <h1 className="text-[32px]">Photos of your artwork, cropped and straightened in a snap.</h1>
        {busy ? (
          <div className="py-6">{opening}</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <Button size="md" className="w-full" onClick={() => cameraRef.current?.click()}>
              <CameraIcon className="w-[22px] h-[22px] flex-none" />
              Take a photo
            </Button>
            <Button size="md" variant="outline" className="w-full" onClick={() => browseRef.current?.click()}>
              <PhotoIcon className="w-[22px] h-[22px] flex-none" />
              Choose photos
            </Button>
            <p className="text-[15px] text-muted text-center">Pick one painting or several.</p>
          </div>
        )}
        {errorText && (
          <p role="alert" className="text-[17px] text-alert font-bold leading-snug">
            {errorText}
          </p>
        )}
        <SnapGraphic compact />
        <p className="mt-auto flex items-center justify-center gap-2 text-[14px] text-muted">
          <LockIcon className="w-4 h-4 flex-none" />
          Your photos stay private.
        </p>
      </main>

      {/* Computers: the words and the drag box on the left, the moving picture on the right. */}
      <main className="max-sm:hidden w-full max-w-[1280px] mx-auto grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)] gap-12 items-center px-10 pt-6 pb-[72px]">
        <div className="flex flex-col gap-5 max-lg:items-center max-lg:text-center">
          <h1 className="text-[44px] lg:text-[54px] leading-[1.05] tracking-[-0.035em]">Photos of your artwork, cropped and straightened in a snap.</h1>
          <p className="text-[20px] text-muted max-w-[34ch]">Take a quick photo of your painting. GallerySnap squares it up and trims away everything that isn&rsquo;t the art.</p>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (!busy) take(e.dataTransfer.files);
            }}
            className={`w-full max-w-[560px] min-h-[236px] flex flex-col items-center justify-center gap-2 px-6 py-7 text-center bg-card border-[2.5px] rounded-[28px] transition-colors ${dragging ? 'border-solid border-ink' : 'border-dashed border-ink/35'}`}
          >
            {busy ? (
              opening
            ) : (
              <>
                <span className="w-14 h-14 rounded-[18px] bg-tile flex items-center justify-center">
                  <UploadIcon className="w-7 h-7" />
                </span>
                <p className="text-[24px] font-extrabold tracking-[-0.02em] leading-tight">Drag your photos here</p>
                <p className="text-[16px] text-muted">one painting or a whole batch, or</p>
                <Button size="md" className="mt-1.5" onClick={() => browseRef.current?.click()}>
                  <PhotoIcon className="w-[22px] h-[22px] flex-none" />
                  Choose photos
                </Button>
              </>
            )}
          </div>

          {errorText && (
            <p role="alert" className="max-w-[560px] text-[18px] text-alert font-bold">
              {errorText}
            </p>
          )}

          <p className="flex gap-2 text-[14px] text-muted max-w-[560px] leading-normal max-lg:text-center">
            <LockIcon className="w-4 h-4 flex-none mt-0.5" />
            <span>Your photos stay on this device. If the app can&rsquo;t find the edges by itself, a small copy goes to an AI helper to find them. Nothing else is sent anywhere unless you save to Google Photos.</span>
          </p>
        </div>

        <SnapGraphic className="max-lg:hidden w-full max-w-[526px] mx-auto" />
      </main>

      <StartSections>
        <Button size="md" className="sm:hidden w-full" onClick={() => cameraRef.current?.click()} disabled={busy}>
          <CameraIcon className="w-[22px] h-[22px] flex-none" />
          Take a photo
        </Button>
        <Button
          size="md"
          className="max-sm:hidden"
          onClick={() => {
            window.scrollTo({ top: 0 });
            browseRef.current?.click();
          }}
          disabled={busy}
        >
          <PhotoIcon className="w-[22px] h-[22px] flex-none" />
          Choose photos
        </Button>
        <Button size="md" variant="outline" className="sm:hidden w-full" onClick={() => browseRef.current?.click()} disabled={busy}>
          <PhotoIcon className="w-[22px] h-[22px] flex-none" />
          Choose photos
        </Button>
      </StartSections>
    </>
  );
}
