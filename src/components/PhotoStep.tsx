'use client';

// Step 1: add a photo (or several) and choose how to straighten it.
import { useState, type RefObject } from 'react';
import { ACCEPTED_TYPES, isAcceptedFile } from '@/lib/images';
import type { Mode } from '@/lib/types';
import { SnapGraphic, SnapGraphicSmall } from './SnapGraphic';
import StartSections from './StartSections';
import { Button, CameraIcon, CornersIcon, FramedPictureIcon, LockIcon, PHONE_HEADER, PhotoIcon, SwitchRow, WandIcon } from './ui';

type Props = {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  onFiles: (files: File[]) => void;
  busy: boolean;
  error: string | null;
  /** The hidden file picker. The header's upload button opens it too. */
  browseRef: RefObject<HTMLInputElement | null>;
  cameraRef: RefObject<HTMLInputElement | null>;
};

export default function PhotoStep({ mode, onModeChange, onFiles, busy, error, browseRef, cameraRef }: Props) {
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState(false);

  function take(list: FileList | null) {
    const all = Array.from(list ?? []);
    const files = all.filter(isAcceptedFile);
    setRejected(all.length > 0 && files.length === 0);
    if (files.length) onFiles(files);
  }

  const modes: { key: Mode; title: string; text: string; Icon: typeof WandIcon }[] = [
    { key: 'auto', title: 'Find the corners for me', text: 'The app spots the edges and straightens it in one go.', Icon: WandIcon },
    { key: 'manual', title: "I'll choose the corners", text: 'You place four markers on the corners yourself.', Icon: CornersIcon },
  ];

  const errorText = (error || rejected) && (error ?? 'That file is not a photo this app can open. Please choose a JPG, PNG or HEIC photo.');
  const inputs = (
    <>
      <input ref={browseRef} type="file" accept={ACCEPTED_TYPES} multiple hidden onChange={(e) => { take(e.target.files); e.target.value = ''; }} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { take(e.target.files); e.target.value = ''; }} />
    </>
  );

  return (
    <>
    {inputs}
    {/* Phones: two buttons and one small switch, all on one screen. Chosen
        with CSS (not JavaScript) so the right layout shows from the start. */}
    <main className="sm:hidden flex flex-col gap-6 px-5 pt-6 pb-5" style={{ minHeight: `calc(100dvh - ${PHONE_HEADER}px)` }}>
      <h1 className="text-[28px] leading-[1.15]">Art photos, cropped and straightened in a snap.</h1>
      <SnapGraphicSmall className="max-w-[300px] mx-auto -my-2" />
      {busy ? (
        <p className="flex items-center gap-3 text-[22px] font-semibold py-6" role="status">
          <span className="gs-spinner text-burgundy" aria-hidden /> Opening your photos…
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          <Button className="w-full !min-h-0 h-14 !text-[18px] !rounded-[14px]" onClick={() => cameraRef.current?.click()}>
            <CameraIcon className="w-[22px] h-[22px] flex-none" />
            Take a photo
          </Button>
          <Button variant="outline" className="w-full !min-h-0 h-14 !text-[18px] !rounded-[14px]" onClick={() => browseRef.current?.click()}>
            <PhotoIcon className="w-[22px] h-[22px] flex-none" />
            Choose photos
          </Button>
          <p className="text-[15px] text-muted text-center">Pick one painting or several.</p>
        </div>
      )}
      {errorText && (
        <p role="alert" className="text-[17px] text-burgundy font-semibold leading-snug">
          {errorText}
        </p>
      )}
      <SwitchRow
        className="bg-card-on border-[1.5px] border-line rounded-[14px] p-3.5"
        icon={<WandIcon className="w-[22px] h-[22px]" />}
        title="Find the corners for me"
        caption={mode === 'auto' ? 'Turn off to tap them yourself' : 'You’ll tap the four corners yourself'}
        checked={mode === 'auto'}
        onChange={(on) => onModeChange(on ? 'auto' : 'manual')}
      />
      <p className="mt-auto flex items-center justify-center gap-2 text-[14px] text-muted">
        <LockIcon className="w-4 h-4 flex-none" />
        Your photos stay private.
      </p>
    </main>

    {/* Desktop: the words and the drag box on the left, the moving picture on the right. */}
    <main className="max-sm:hidden w-full max-w-[1120px] mx-auto grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] gap-10 lg:gap-12 items-center px-10 pt-8 pb-16">
      <div className="flex flex-col gap-5 max-lg:items-center max-lg:text-center">
        <h1 className="text-[40px] lg:text-[50px] leading-[1.12]">Art photos, cropped and straightened in a snap.</h1>
        <p className="text-[21px] text-muted max-w-[34ch]">Take a quick photo of your painting. GallerySnap squares it up and trims away everything that isn&rsquo;t the art.</p>

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
          className={`w-full max-w-[500px] min-h-[196px] flex flex-col items-center justify-center gap-2 px-6 py-5 text-center border-[2.5px] rounded-[20px] transition-colors ${
            dragging ? 'border-solid border-burgundy bg-soft' : 'border-dashed border-burgundy bg-card'
          }`}
        >
          {busy ? (
            <p className="flex items-center gap-3 text-[24px] font-semibold" role="status">
              <span className="gs-spinner text-burgundy" aria-hidden /> Opening your photos…
            </p>
          ) : (
            <>
              <FramedPictureIcon className="w-[42px] h-[42px] text-burgundy" />
              <p className="text-[24px] font-semibold leading-tight">Drag your photos here</p>
              <p className="font-sans text-[15px] text-muted">one painting or a whole batch, or</p>
              <Button size="md" className="mt-1" onClick={() => browseRef.current?.click()}>
                <PhotoIcon className="w-[22px] h-[22px] flex-none" />
                Choose photos
              </Button>
            </>
          )}
        </div>

        {errorText && (
          <p role="alert" className="max-w-[500px] text-[19px] text-burgundy font-semibold">
            {errorText}
          </p>
        )}

        <section className="w-full max-w-[500px] flex flex-col gap-2 text-left" aria-labelledby="mode-heading">
          <h2 id="mode-heading" className="!font-sans font-bold text-[13px] tracking-[.09em] uppercase text-muted">
            Corners
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {modes.map(({ key, title, text, Icon }) => {
              const on = mode === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onModeChange(key)}
                  className={`flex items-start gap-3 text-left px-3.5 py-3 rounded-[14px] border-2 cursor-pointer transition-colors ${on ? 'border-burgundy bg-card-on' : 'border-line bg-card hover:border-muted'}`}
                >
                  <span className={`flex-none w-10 h-10 rounded-[10px] flex items-center justify-center ${on ? 'bg-burgundy text-cream' : 'bg-soft text-burgundy'}`}>
                    <Icon className="w-[22px] h-[22px]" />
                  </span>
                  <span>
                    <b className="block font-sans text-[16.5px] leading-tight mb-0.5">{title}</b>
                    <span className="block text-[14.5px] text-muted leading-snug">{text}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <p className="text-[14px] text-muted max-w-[500px] leading-snug max-lg:text-center">Your photos stay on this device. If the app can&rsquo;t find the edges by itself, a small copy goes to an AI helper to find them. Nothing else is sent anywhere unless you save to Google Photos.</p>
      </div>

      <SnapGraphic className="max-lg:hidden w-full max-w-[440px] mx-auto" />
    </main>

    <StartSections>
      <Button className="sm:hidden" onClick={() => cameraRef.current?.click()} disabled={busy}>
        <CameraIcon className="w-[22px] h-[22px] flex-none" />
        Take a photo
      </Button>
      <Button
        onClick={() => {
          window.scrollTo({ top: 0 });
          browseRef.current?.click();
        }}
        disabled={busy}
      >
        <PhotoIcon className="w-[22px] h-[22px] flex-none" />
        Choose photos
      </Button>
    </StartSections>
    </>
  );
}
