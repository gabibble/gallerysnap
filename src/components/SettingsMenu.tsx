'use client';

// The small Settings panel: a button in the header that opens a panel under
// it on computers, or a sheet from the bottom of the screen on phones. For
// now it holds one choice; more defaults will join it.
import { useEffect, useId, useRef, useState } from 'react';
import { changeSettings, useSettings } from '@/lib/settings';
import { CloseIcon, IconButton, SettingsIcon, SwitchRow } from './ui';

export default function SettingsMenu({ round = false }: { round?: boolean }) {
  const [open, setOpen] = useState(false);
  const settings = useSettings();
  const box = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const press = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', key);
    document.addEventListener('pointerdown', press);
    return () => {
      document.removeEventListener('keydown', key);
      document.removeEventListener('pointerdown', press);
    };
  }, [open]);

  return (
    <div ref={box} className="sm:relative flex-none">
      <button
        type="button"
        aria-label="Settings"
        title="Settings"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(!open)}
        className={`flex-none flex items-center justify-center cursor-pointer ${round ? 'w-[46px] h-[46px] rounded-full' : 'w-11 h-11 rounded-[14px]'} ${open ? 'bg-ink text-white' : 'bg-card text-ink hover:shadow-[0_0_0_2px_var(--color-ink)]'}`}
      >
        <SettingsIcon className="w-[22px] h-[22px]" />
      </button>
      {open && (
        <>
          <div className="sm:hidden fixed inset-0 z-30 bg-ink/45" aria-hidden onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-labelledby={titleId}
            className="z-40 bg-card flex flex-col gap-3 text-left fixed inset-x-0 bottom-0 rounded-t-[28px] px-5 pt-4 pb-8 sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-[calc(100%+10px)] sm:w-[380px] sm:rounded-[24px] sm:px-[22px] sm:py-5 sm:shadow-[0_24px_60px_-20px_rgba(35,39,47,.45),0_0_0_1px_rgba(35,39,47,.06)]"
          >
            <div className="flex items-center justify-between">
              <h2 id={titleId} className="text-[20px] tracking-[-0.02em]">
                Settings
              </h2>
              <IconButton label="Close settings" tone="wall" size={40} onClick={() => setOpen(false)}>
                <CloseIcon className="w-4 h-4" />
              </IconButton>
            </div>
            <SwitchRow
              className="py-3.5 border-t border-line"
              title="Find the corners for me"
              caption={settings.findCorners ? 'Turn off to place the four corners yourself.' : 'You’ll place the four corners yourself.'}
              checked={settings.findCorners}
              onChange={(on) => changeSettings({ findCorners: on })}
            />
            <p className="pt-3 border-t border-line text-[14px] text-muted">Your settings are remembered on this device.</p>
          </div>
        </>
      )}
    </div>
  );
}
