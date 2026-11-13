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

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'solid' | 'outline';
  size?: 'lg' | 'md' | 'sm';
  busy?: boolean;
};

const sizes = {
  lg: 'text-[21px] sm:text-[22px] px-6 py-4 rounded-[14px] min-h-[60px]',
  md: 'text-[19px] px-5 py-3 rounded-[12px] min-h-[52px]',
  sm: 'text-[16px] px-3.5 py-2 rounded-[10px] min-h-[42px]',
};

/** Flat, rounded, no shadow. Burgundy fill, or a burgundy outline. */
export function Button({ variant = 'solid', size = 'lg', busy = false, className = '', children, disabled, ...rest }: ButtonProps) {
  const look =
    variant === 'solid'
      ? 'bg-burgundy text-cream border-burgundy hover:bg-burgundy-dk hover:border-burgundy-dk'
      : 'bg-card-on text-burgundy border-burgundy hover:bg-soft';
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={`inline-flex items-center justify-center gap-3 border-2 font-sans font-bold leading-tight cursor-pointer transition-colors disabled:cursor-default disabled:opacity-60 ${sizes[size]} ${look} ${className}`}
    >
      {/* Children sit in their own span so the spinner appearing doesn't trip up
          React when a browser extension (e.g. page translation) has changed the
          button's text. */}
      {busy ? <span className="gs-spinner" aria-hidden /> : null}
      <span className="inline-flex items-center justify-center gap-3">{children}</span>
    </button>
  );
}

export function BackLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="font-sans font-bold text-[17px] text-burgundy cursor-pointer hover:underline py-2 -my-2 self-start">
      <span aria-hidden>← </span>
      {children}
    </button>
  );
}

export function Switch({ label, checked, onChange, disabled, className = '' }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; className?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between gap-4 cursor-pointer disabled:opacity-60 disabled:cursor-default font-sans font-bold text-[18px] text-ink px-4 py-2.5 border-2 border-line rounded-[12px] bg-card ${className}`}
    >
      <span>{label}</span>
      <span className={`relative w-[52px] h-[30px] rounded-full flex-none transition-colors ${checked ? 'bg-burgundy' : 'bg-[#bdb3a3]'}`}>
        <span className={`absolute top-[3px] w-6 h-6 rounded-full bg-white transition-[left] ${checked ? 'left-[25px]' : 'left-[3px]'}`} />
      </span>
    </button>
  );
}

export type StepName = 'photo' | 'straighten' | 'save';

export function Header({ step, count, onHome, className = '' }: { step: StepName; count?: number; onHome: () => void; className?: string }) {
  const steps: { key: StepName; label: string; Icon: (p: IconProps) => ReactNode }[] = [
    { key: 'photo', label: 'Photo', Icon: PhotoIcon },
    { key: 'straighten', label: 'Straighten', Icon: StraightenIcon },
    { key: 'save', label: 'Save', Icon: DownloadIcon },
  ];
  return (
    <header className={`flex items-center justify-between gap-4 px-4 sm:px-10 h-[60px] sm:h-[68px] border-b border-line ${className}`}>
      <button type="button" onClick={onHome} className="font-serif font-semibold text-[23px] sm:text-[26px] tracking-[-0.01em] cursor-pointer" aria-label="GallerySnap, start over">
        Gallery<em className="italic text-burgundy">Snap</em>
      </button>
      {count && count > 1 ? (
        <p className="text-[18px] text-muted">{count} paintings</p>
      ) : (
        <ol className="flex gap-3 sm:gap-6 text-[15px] sm:text-[18px] text-muted" aria-label="Steps">
          {steps.map(({ key, label, Icon }) => (
            <li
              key={key}
              aria-current={key === step ? 'step' : undefined}
              className={`inline-flex items-center gap-1.5 pb-1 border-b-[3px] ${key === step ? 'text-ink font-bold border-burgundy' : 'border-transparent'}`}
            >
              <Icon className={`w-[20px] h-[20px] hidden min-[420px]:block ${key === step ? 'text-burgundy' : ''}`} />
              {label}
            </li>
          ))}
        </ol>
      )}
    </header>
  );
}

/** Height of PhoneHeader, for sizing phone screens to fit without scrolling. */
export const PHONE_HEADER = 68;

/**
 * The phone header: a back arrow, the logo, an optional tool on the right,
 * and a thin three-part progress bar instead of the step names.
 */
export function PhoneHeader({
  step,
  onHome,
  onBack,
  right,
  className = '',
}: {
  step: StepName;
  onHome: () => void;
  onBack?: () => void;
  right?: ReactNode;
  className?: string;
}) {
  const at = { photo: 1, straighten: 2, save: 3 }[step];
  const side = 'w-10 h-10 flex-none';
  return (
    <header className={`flex-none px-4 pt-2.5 ${className}`} style={{ height: PHONE_HEADER }}>
      <div className="h-[54px] flex items-center justify-between gap-2">
        {onBack ? (
          <button type="button" onClick={onBack} aria-label="Back" className={`${side} rounded-[12px] flex items-center justify-center text-burgundy cursor-pointer`}>
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
        ) : null}
        <button type="button" onClick={onHome} className="font-serif font-semibold text-[22px] tracking-[-0.01em] cursor-pointer" aria-label="GallerySnap, start over">
          Gallery<em className="italic text-burgundy">Snap</em>
        </button>
        {right ?? (onBack ? <span className={side} /> : <span className="flex-1" />)}
      </div>
      <div className="grid grid-cols-3 gap-1.5" role="img" aria-label={`Step ${at} of 3`}>
        {[1, 2, 3].map((i) => (
          <i key={i} className={`h-1 rounded-sm ${i <= at ? 'bg-burgundy' : 'bg-line'}`} />
        ))}
      </div>
    </header>
  );
}

/** The on/off track used by the phone switch rows. */
function Track({ on }: { on: boolean }) {
  return (
    <span aria-hidden className={`relative w-[52px] h-[32px] rounded-full flex-none transition-colors ${on ? 'bg-burgundy' : 'bg-line'}`}>
      <span className={`absolute top-[3px] w-[26px] h-[26px] rounded-full bg-card-on shadow-[0_1px_3px_rgba(46,47,49,.25)] transition-[left] ${on ? 'left-[23px]' : 'left-[3px]'}`} />
    </span>
  );
}

/** Enhance: a wand and an on/off switch, sized to sit in line with the turn buttons. */
export function EnhanceSwitch({ on, onChange, disabled, className = '' }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean; className?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Enhance colors"
      title="Enhance colors"
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`inline-flex items-center gap-2 pl-2.5 pr-1.5 rounded-[12px] border-2 border-line bg-card-on text-burgundy cursor-pointer disabled:opacity-60 disabled:cursor-default ${className}`}
    >
      <WandIcon className="w-[22px] h-[22px] flex-none" />
      <Track on={on} />
    </button>
  );
}

/** A phone on/off row: optional icon tile, a title, an optional caption and a switch. */
export function SwitchRow({ title, caption, icon, checked, onChange, disabled, className = '' }: { title: string; caption?: string; icon?: ReactNode; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; className?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center gap-3.5 text-left cursor-pointer disabled:opacity-60 disabled:cursor-default font-sans text-ink ${className}`}
    >
      {icon && <span className="flex-none w-10 h-10 rounded-[12px] bg-soft text-burgundy flex items-center justify-center">{icon}</span>}
      <span className="flex-1 min-w-0">
        <b className="block text-[17px] leading-tight">{title}</b>
        {caption && <span className="block text-[14px] text-muted mt-0.5 leading-snug">{caption}</span>}
      </span>
      <Track on={checked} />
    </button>
  );
}

/** A small square icon button for the phone screens. */
export function IconButton({ label, onClick, disabled, pressed, children }: { label: string; onClick: () => void; disabled?: boolean; pressed?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      disabled={disabled}
      className={`w-[42px] h-[42px] flex-none rounded-[12px] border-2 flex items-center justify-center cursor-pointer disabled:opacity-60 disabled:cursor-default ${
        pressed ? 'bg-burgundy border-burgundy text-cream' : 'border-line text-burgundy bg-card-on'
      }`}
    >
      {children}
    </button>
  );
}
