'use client';

// Step 1: add a photo (or several) and choose how to straighten it.
import { useRef, useState } from 'react';
import { ACCEPTED_TYPES, isAcceptedFile } from '@/lib/images';
import type { Mode } from '@/lib/types';
import { Button, CameraIcon, CornersIcon, FramedPictureIcon, WandIcon } from './ui';

type Props = {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  onFiles: (files: File[]) => void;
  busy: boolean;
  error: string | null;
};

export default function PhotoStep({ mode, onModeChange, onFiles, busy, error }: Props) {
  const browseRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
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

  return (
    <main className="flex flex-col items-center gap-6 sm:gap-7 px-4 py-7 sm:py-10">
      <h1 className="text-[28px] sm:text-[38px] text-center max-w-[900px]">Get your art photos cropped and straightened in a snap.</h1>

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
        className={`w-full max-w-[820px] min-h-[240px] sm:min-h-[270px] flex flex-col items-center justify-center gap-4 sm:gap-5 px-4 py-7 border-[3px] border-dashed rounded-[20px] transition-colors ${
          dragging ? 'border-burgundy bg-card-on' : 'border-line bg-card'
        }`}
      >
        {busy ? (
          <p className="flex items-center gap-3 text-[24px] sm:text-[28px] font-semibold" role="status">
            <span className="gs-spinner text-burgundy" aria-hidden /> Opening your photos…
          </p>
        ) : (
          <>
            <p className="flex items-center gap-4 text-[23px] sm:text-[32px] font-serif">
              <FramedPictureIcon className="w-[44px] h-[44px] sm:w-[52px] sm:h-[52px] text-burgundy flex-none" />
              Drag your photos here
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <span className="italic text-muted text-[19px]">or</span>
              <Button onClick={() => browseRef.current?.click()}>Choose photos</Button>
              <Button variant="outline" className="touch-only" onClick={() => cameraRef.current?.click()}>
                <CameraIcon className="w-[26px] h-[26px]" />
                Take photo
              </Button>
            </div>
            <p className="italic text-muted text-[17px] sm:text-[18px] text-center">You can drag in one photo or a whole batch.</p>
          </>
        )}
        <input ref={browseRef} type="file" accept={ACCEPTED_TYPES} multiple hidden onChange={(e) => { take(e.target.files); e.target.value = ''; }} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { take(e.target.files); e.target.value = ''; }} />
      </div>

      {(error || rejected) && (
        <p role="alert" className="max-w-[820px] text-center text-[19px] text-burgundy font-semibold">
          {error ?? 'That file is not a photo this app can open. Please choose a JPG, PNG or HEIC photo.'}
        </p>
      )}

      <section className="w-full max-w-[880px] flex flex-col gap-4" aria-labelledby="mode-heading">
        <h2 id="mode-heading" className="text-[21px] sm:text-[22px] text-center">
          How would you like to straighten it?
        </h2>
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-5">
          {modes.map(({ key, title, text, Icon }) => {
            const on = mode === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                onClick={() => onModeChange(key)}
                className={`flex items-center gap-4 text-left px-4 sm:px-5 py-4 sm:py-[18px] rounded-[16px] border-2 cursor-pointer transition-colors ${
                  on ? 'border-burgundy bg-card-on shadow-[inset_0_0_0_1px_var(--color-burgundy)]' : 'border-line bg-card hover:border-muted'
                }`}
              >
                <span className={`flex-none w-[52px] h-[52px] sm:w-14 sm:h-14 rounded-[14px] flex items-center justify-center ${on ? 'bg-burgundy text-cream' : 'bg-soft text-burgundy'}`}>
                  <Icon className="w-[30px] h-[30px]" />
                </span>
                <span>
                  <b className="block font-serif font-semibold text-[20px] sm:text-[22px] leading-tight mb-0.5">{title}</b>
                  <span className="block text-[16px] sm:text-[17px] text-muted leading-snug">{text}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <p className="text-[15px] text-muted text-center max-w-[640px]">Your photos stay on this device. If the app can&rsquo;t find the edges by itself, a small copy goes to an AI helper to find them. Nothing else is sent anywhere unless you save to Google Photos.</p>
    </main>
  );
}
