// The start page pictures. Both are drawn in shades of burgundy only.

/** Desktop: a crooked painting on a table is outlined, then snaps straight. */
export function SnapGraphic({ className = '' }: { className?: string }) {
  const corners = [
    [80, 85],
    [320, 85],
    [320, 255],
    [80, 255],
  ];
  return (
    <div className={`gs-snap flex flex-col gap-3.5 ${className}`}>
      <svg viewBox="0 0 400 340" className="block w-full h-auto" role="img" aria-label="A crooked painting on a table is outlined, then snaps straight and the table disappears">
        <defs>
          <clipPath id="gs-snap-clip">
            <rect x="80" y="85" width="240" height="170" />
          </clipPath>
        </defs>
        <rect x="10" y="10" width="380" height="320" rx="26" fill="var(--color-soft)" />
        <g className="gs-snap-table">
          <rect x="10" y="10" width="380" height="320" rx="26" fill="var(--snap-table)" />
          <path d="M10 118h380M10 226h380" stroke="var(--snap-plank)" strokeWidth={3} />
        </g>
        <g className="gs-snap-painting">
          <rect x="86" y="92" width="240" height="170" fill="var(--color-burgundy-dk)" opacity={0.16} />
          <g clipPath="url(#gs-snap-clip)">
            <rect x="80" y="85" width="240" height="170" fill="var(--snap-sky)" />
            <circle cx="262" cy="134" r="22" fill="var(--snap-sun)" />
            <path d="M80 206c40-44 78-50 116-18 30-32 76-38 124 2v66H80z" fill="var(--snap-hill)" />
            <path d="M80 230c52-28 96-24 140 0 34-16 66-16 100-2v28H80z" fill="var(--color-burgundy)" />
          </g>
          <rect className="gs-snap-outline" x="80" y="85" width="240" height="170" fill="none" stroke="var(--color-burgundy-dk)" strokeWidth={4} strokeLinejoin="round" />
          {corners.map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} className="gs-snap-dot" cx={cx} cy={cy} r={9} fill="var(--color-card)" stroke="var(--color-burgundy-dk)" strokeWidth={4} />
          ))}
        </g>
        <path className="gs-snap-spark" d="M342 62l14-14M348 84h20M322 56V36" fill="none" stroke="var(--color-burgundy)" strokeWidth={4} strokeLinecap="round" />
      </svg>
      <div className="grid grid-cols-3 gap-2 font-sans font-bold text-[15px] text-center text-muted" aria-hidden>
        {['Photo', 'Straighten', 'Save'].map((label) => (
          <span key={label} className="gs-snap-step py-2 px-1 rounded-[10px]">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Phones: a small still picture. A crooked photo on the left, a straight one on the right. */
export function SnapGraphicSmall({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 104" className={`gs-snap block w-full h-auto ${className}`} role="img" aria-label="A crooked picture becomes a straight one">
      <g transform="rotate(-11 72 52)">
        <rect x="28" y="20" width="88" height="64" fill="var(--snap-sky)" stroke="var(--color-burgundy)" strokeWidth={3} strokeDasharray="7 6" />
        <path d="M30 70c14-16 28-18 42-6 12-12 26-14 42 0v18H30z" fill="var(--snap-sun)" />
      </g>
      <path d="M140 52h36M166 42l10 10-10 10" fill="none" stroke="var(--color-burgundy)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="204" y="20" width="88" height="64" fill="var(--snap-sky)" stroke="var(--color-burgundy)" strokeWidth={3} />
      <path d="M205.5 70c14-16 28-18 42-6 12-12 26-14 43 0v18.5h-85z" fill="var(--color-burgundy)" />
      <g fill="var(--color-card)" stroke="var(--color-burgundy)" strokeWidth={3}>
        <circle cx="204" cy="20" r="5.5" />
        <circle cx="292" cy="20" r="5.5" />
        <circle cx="292" cy="84" r="5.5" />
        <circle cx="204" cy="84" r="5.5" />
      </g>
    </svg>
  );
}
