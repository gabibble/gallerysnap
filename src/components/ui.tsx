// Small shared pieces: icons, buttons, the on/off switch, the page header.
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type IconProps = { className?: string };
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const PhotoIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="9" cy="10" r="1.8" />
    <path d="M3 16l5-4.5 4 3.5 3-2.5 6 5" />
  </svg>
);
export const StraightenIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
    <path d="M6 3v4M3 6h4M18 21v-4M21 18h-4" />
    <path d="M7 8l9.5-1.5L17 16l-9.5 1z" />
  </svg>
);
export const DownloadIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </svg>
);
export const WandIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    {/* The stick, with a separate tip so it reads as a wand, and sparkles. */}
    <path d="M3 21L13.2 10.8" fill="none" stroke="currentColor" strokeWidth={3.2} />
    <path d="M14.8 9.2L17.2 6.8" fill="none" stroke="currentColor" strokeWidth={3.2} />
    <path d="M19.50 0.40 L20.51 2.99 L23.10 4.00 L20.51 5.01 L19.50 7.60 L18.49 5.01 L15.90 4.00 L18.49 2.99Z" fill="currentColor" />
    <path d="M10.50 1.60 L11.12 3.18 L12.70 3.80 L11.12 4.42 L10.50 6.00 L9.88 4.42 L8.30 3.80 L9.88 3.18Z" fill="currentColor" />
    <path d="M20.40 10.40 L21.02 11.98 L22.60 12.60 L21.02 13.22 L20.40 14.80 L19.78 13.22 L18.20 12.60 L19.78 11.98Z" fill="currentColor" />
  </svg>
);
export const CornersIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
    <path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" />
    <circle cx="12" cy="12" r="2.2" />
  </svg>
);
export const MagnifierIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke} strokeWidth={2.2}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5L21 21" />
  </svg>
);
export const CameraIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
    <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);
export const CheckIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke} strokeWidth={2.6}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
export const RotateLeftIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke} strokeWidth={2}>
    <path d="M4 5v5h5" />
    <path d="M5.5 15a7.5 7.5 0 1 0 1.2-8.2L4 10" />
  </svg>
);
export const RotateRightIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke} strokeWidth={2}>
    <path d="M20 5v5h-5" />
    <path d="M18.5 15a7.5 7.5 0 1 1-1.2-8.2L20 10" />
  </svg>
);
export const LockIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke} strokeWidth={2}>
    <rect x="5" y="10" width="14" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);
export const ChevronLeftIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke} strokeWidth={2.2}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);
export const FramedPictureIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="10" width="52" height="44" rx="2" />
    <rect x="13" y="17" width="38" height="30" />
    <path d="M13 41l10-9 8 7 6-5 14 11" />
  </svg>
);

export const ArrowLeftIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke} strokeWidth={2.4}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);
export const ArrowRightIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke} strokeWidth={2.4}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const UploadIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke} strokeWidth={2}>
    <path d="M12 16V5M7 10l5-5 5 5M5 20h14" />
  </svg>
);
export const SettingsIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke} strokeWidth={2}>
    <path d="M4 7h9M19 7h1M4 17h1M11 17h9" />
    <circle cx="16" cy="7" r="2.5" />
    <circle cx="8" cy="17" r="2.5" />
  </svg>
);
export const CloseIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke} strokeWidth={2.4}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const FrameIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke} strokeWidth={2}>
    <path d="M3 4h18v16H3zM7 8h10v8H7z" />
  </svg>
);
/** The Google Photos pinwheel, on a white disc so its colours stay true on a dark button. */
export const GooglePhotosIcon = ({ className = '' }: IconProps) => (
  <span className={`flex-none rounded-full bg-white flex items-center justify-center ${className}`} aria-hidden>
    <svg viewBox="0 0 24 24" className="w-[66%] h-[66%]">
      <path d="M12 1A5.5 5.5 0 0 0 12 12Z" fill="#EA4335" />
      <path d="M23 12A5.5 5.5 0 0 0 12 12Z" fill="#4285F4" />
      <path d="M12 23A5.5 5.5 0 0 0 12 12Z" fill="#34A853" />
      <path d="M1 12A5.5 5.5 0 0 0 12 12Z" fill="#FBBC04" />
    </svg>
  </span>
);

/** The logo: a dark tile with crop corners, bold "Gallery" and a light italic "Snap". */
export function Logo({ onClick, small = false }: { onClick: () => void; small?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-label="GallerySnap, start over" className={`flex items-center gap-2.5 tracking-[-0.02em] cursor-pointer ${small ? 'text-[21px]' : 'text-[22px]'}`}>
      <span className={`flex-none bg-ink text-white flex items-center justify-center ${small ? 'w-9 h-9 rounded-[11px]' : 'w-[38px] h-[38px] rounded-[12px]'}`}>
        <svg viewBox="0 0 24 24" className="w-[58%] h-[58%]" aria-hidden {...stroke} strokeWidth={2.4}>
          <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
        </svg>
      </span>
      <span>
        <span className="font-extrabold">Gallery</span>
        <span className="font-normal italic text-rasp">Snap</span>
      </span>
    </button>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'solid' | 'outline';
  size?: 'lg' | 'md' | 'sm';
  busy?: boolean;
};

const sizes = {
  lg: 'text-[19px] px-7 rounded-[18px] min-h-[64px]',
  md: 'text-[18px] px-7 rounded-[18px] min-h-[58px]',
  sm: 'text-[16px] px-4 rounded-[14px] min-h-[48px]',
};

/** Flat and rounded. Inky grey fill, or white with a quiet outline. */
export function Button({ variant = 'solid', size = 'lg', busy = false, className = '', children, disabled, ...rest }: ButtonProps) {
  const look = variant === 'solid' ? 'bg-ink text-white border-ink hover:bg-ink-dk hover:border-ink-dk' : 'bg-card text-ink border-line hover:border-ink';
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={`inline-flex items-center justify-center gap-2.5 border-2 font-bold leading-tight cursor-pointer transition-colors disabled:cursor-default disabled:opacity-60 ${sizes[size]} ${look} ${className}`}
    >
      {/* Children sit in their own span so the spinner appearing doesn't trip up
          React when a browser extension (e.g. page translation) has changed the
          button's text. */}
      {busy ? <span className="gs-spinner" aria-hidden /> : null}
      <span className="inline-flex items-center justify-center gap-2.5">{children}</span>
    </button>
  );
}

/** A white pill, for the quiet buttons in the header. */
export function PillButton({ className = '', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...rest} className={`h-[46px] px-5 rounded-full bg-card text-ink font-bold text-[16px] inline-flex items-center gap-2 cursor-pointer hover:bg-white hover:shadow-[0_0_0_2px_var(--color-ink)] disabled:opacity-60 disabled:cursor-default ${className}`}>
      {children}
    </button>
  );
}

/** A plain bold text button, used where a link would sit. */
export function TextButton({ className = '', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...rest} className={`font-bold text-ink cursor-pointer hover:text-rasp disabled:opacity-60 disabled:cursor-default ${className}`}>
      {children}
    </button>
  );
}

export function BackLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <TextButton onClick={onClick} className="text-[15px] inline-flex items-center gap-1.5 min-h-[28px] self-start">
      <ArrowLeftIcon className="w-4 h-4" />
      {children}
    </TextButton>
  );
}

/** The on/off track every switch uses. */
function Track({ on, small = false, tiny = false }: { on: boolean; small?: boolean; tiny?: boolean }) {
  const size = tiny ? 'w-10 h-6' : small ? 'w-[46px] h-7' : 'w-[50px] h-[30px]';
  const knob = tiny ? 'w-[18px] h-[18px]' : small ? 'w-[22px] h-[22px]' : 'w-6 h-6';
  return (
    <span aria-hidden className={`flex-none rounded-full flex items-center p-[3px] transition-colors ${size} ${on ? 'bg-ink justify-end' : 'bg-track justify-start'}`}>
      <span className={`rounded-full bg-white ${knob}`} />
    </span>
  );
}

/** A labelled on/off switch on a soft grey bar (desktop side panels). */
export function Switch({
  label,
  checked,
  onChange,
  disabled,
  compact = false,
  className = '',
  'aria-label': ariaLabel,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  /** A tighter bar with a smaller track, for the cards on the gallery wall. */
  compact?: boolean;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between bg-wall font-bold text-ink text-left cursor-pointer disabled:opacity-60 disabled:cursor-default ${
        compact ? 'gap-1.5 min-h-[44px] px-2 rounded-[14px] text-[14px]' : 'gap-3 min-h-[54px] px-4 rounded-[16px] text-[16px]'
      } ${className}`}
    >
      <span className={`flex items-center ${compact ? 'gap-1.5' : 'gap-2'}`}>{label}</span>
      <Track on={checked} small tiny={compact} />
    </button>
  );
}

export type StepName = 'photo' | 'straighten' | 'save';
const STEPS: { key: StepName; label: string }[] = [
  { key: 'photo', label: 'Photo' },
  { key: 'straighten', label: 'Straighten' },
  { key: 'save', label: 'Save' },
];

/** Photo, Straighten, Save as three pills: done ones get a tick, the current one is dark. */
function StepPills({ step }: { step: StepName }) {
  const at = STEPS.findIndex((s) => s.key === step);
  return (
    <ol className="flex items-center gap-2.5 text-[15px] font-bold" aria-label="Steps">
      {STEPS.map(({ key, label }, i) => (
        <li key={key} className="flex items-center gap-2.5" aria-current={i === at ? 'step' : undefined}>
          {i > 0 && <span className="w-5 h-0.5 bg-track/70 max-md:hidden" aria-hidden />}
          <span className={`flex items-center gap-2 py-2 pl-2 pr-3.5 rounded-full ${i === at ? 'bg-ink text-white' : 'bg-card text-muted'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[13px] ${i === at ? 'bg-white/20' : i < at ? 'bg-tile text-ink' : 'bg-wall'}`}>
              {i < at ? <CheckIcon className="w-3.5 h-3.5" /> : i + 1}
            </span>
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** The desktop header: logo, the steps (or a count of paintings), and whatever goes on the right. */
export function Header({ step, count, onHome, showSteps = true, right, className = '' }: { step: StepName; count?: number; onHome: () => void; showSteps?: boolean; right?: ReactNode; className?: string }) {
  return (
    <header className={`w-full ${className}`}>
      <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-4 px-10 py-5">
        <Logo onClick={onHome} />
        {!showSteps ? null : count && count > 1 ? (
          <p className="py-2.5 px-[18px] rounded-full bg-card text-[15px] font-bold text-muted">{count} paintings</p>
        ) : (
          <StepPills step={step} />
        )}
        {right}
      </div>
    </header>
  );
}

/** Height of PhoneHeader, for sizing phone screens to fit without scrolling. */
export const PHONE_HEADER = 64;

/**
 * The phone header. On the start screen: the logo and whatever goes on the
 * right. After that: a back button, a three-part progress bar (or a count of
 * paintings), and an optional tool on the right.
 */
export function PhoneHeader({ step, count, onHome, onBack, right, className = '' }: { step: StepName; count?: number; onHome: () => void; onBack?: () => void; right?: ReactNode; className?: string }) {
  const at = { photo: 1, straighten: 2, save: 3 }[step];
  return (
    <header className={`flex-none px-4 flex items-center justify-between gap-2 ${className}`} style={{ height: PHONE_HEADER }}>
      {step === 'photo' ? (
        <>
          <Logo onClick={onHome} small />
          {right}
        </>
      ) : (
        <>
          <IconButton label={onBack ? 'Back' : 'Start over'} onClick={onBack ?? onHome}>
            <ChevronLeftIcon className="w-5 h-5" />
          </IconButton>
          {count && count > 1 ? (
            <p className="py-2 px-4 rounded-full bg-card text-[14px] font-bold text-muted">{count} paintings</p>
          ) : (
            <div className="flex gap-1.5" role="img" aria-label={`Step ${at} of 3`}>
              {[1, 2, 3].map((i) => (
                <i key={i} className={`w-[26px] h-1.5 rounded-full ${i <= at ? 'bg-ink' : 'bg-track/70'}`} />
              ))}
            </div>
          )}
          {right ?? <span className="w-11 flex-none" />}
        </>
      )}
    </header>
  );
}

/** Enhance colors: a wand, the words (where there's room) and an on/off switch. */
export function EnhanceSwitch({ on, onChange, disabled, className = '' }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean; className?: string }) {
  return (
    <Switch
      className={className}
      checked={on}
      onChange={onChange}
      disabled={disabled}
      label={
        <>
          <WandIcon className="w-5 h-5 flex-none" />
          Enhance colors
        </>
      }
    />
  );
}

/** An on/off row: optional icon, a title, an optional caption and a switch. */
export function SwitchRow({ title, caption, icon, checked, onChange, disabled, className = '' }: { title: string; caption?: string; icon?: ReactNode; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; className?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center gap-3 text-left cursor-pointer disabled:opacity-60 disabled:cursor-default text-ink ${className}`}
    >
      {icon && <span className="flex-none text-ink flex items-center justify-center">{icon}</span>}
      <span className="flex-1 min-w-0">
        <b className="block text-[16px] font-bold leading-tight">{title}</b>
        {caption && <span className="block text-[14.5px] text-muted mt-0.5 leading-snug">{caption}</span>}
      </span>
      <Track on={checked} />
    </button>
  );
}

/** A square white icon button. Dark when pressed. */
export function IconButton({ label, onClick, disabled, pressed, size = 44, tone = 'card', children }: { label: string; onClick: () => void; disabled?: boolean; pressed?: boolean; size?: number; tone?: 'card' | 'wall'; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
      disabled={disabled}
      style={{ width: size, height: size }}
      className={`flex-none rounded-[14px] flex items-center justify-center cursor-pointer disabled:opacity-60 disabled:cursor-default ${pressed ? 'bg-ink text-white' : `${tone === 'card' ? 'bg-card' : 'bg-wall'} text-ink hover:shadow-[0_0_0_2px_var(--color-ink)]`}`}
    >
      {children}
    </button>
  );
}

/** A small rounded label: green for good news, amber for "needs a look", grey otherwise. */
export function Chip({ tone = 'plain', className = '', children }: { tone?: 'ok' | 'need' | 'plain'; className?: string; children: ReactNode }) {
  const look = { ok: 'bg-ok-bg text-ok', need: 'bg-need-bg text-need', plain: 'bg-tile text-ink' }[tone];
  return <span className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-[14px] font-bold ${look} ${className}`}>{children}</span>;
}
