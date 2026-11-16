// What you see when you scroll down the start page: what the app does, then
// an invitation to try it.
import type { ReactNode } from 'react';
import { ArrowRightIcon, Chip, CornersIcon, DownloadIcon, FrameIcon, LockIcon, StraightenIcon } from './ui';

const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const Svg = ({ children, className }: { children: ReactNode; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...line}>
    {children}
  </svg>
);
const CropIcon = ({ className }: { className?: string }) => <Svg className={className}><path d="M7 3v14h14M3 7h14v14" /></Svg>;
const StackIcon = ({ className }: { className?: string }) => <Svg className={className}><rect x="3" y="8" width="13" height="12" rx="1.5" /><path d="M8 8V5.5A1.5 1.5 0 0 1 9.5 4h10A1.5 1.5 0 0 1 21 5.5v9a1.5 1.5 0 0 1-1.5 1.5H16" /></Svg>;

type IconType = (p: { className?: string }) => ReactNode;

const pairs = [
  { before: 'canvas-before', after: 'canvas-after', beforeAlt: 'A canvas photographed on a wicker table, slightly crooked', afterAlt: 'The same canvas, straight, with the table trimmed away', note: 'A canvas on a table: straightened, table gone.' },
  { before: 'framed-before', after: 'framed-after', beforeAlt: 'A framed painting of a cat photographed at an angle on a shelf', afterAlt: 'The same framed painting, squared up and cropped to the frame', note: 'A framed piece on a shelf: squared up, frame kept.' },
];

const features: { Icon: IconType; title: string; text: string }[] = [
  { Icon: CornersIcon, title: 'Finds the edges', text: 'It spots the four corners of your painting by itself. If it misses, you can drag them into place.' },
  { Icon: StraightenIcon, title: 'Straightens the lean', text: 'Photos taken from a little to one side come out square, as if you had stood right in front.' },
  { Icon: CropIcon, title: 'Trims the background', text: 'The table, the wall and the floor are cut away, so only the artwork is left.' },
  { Icon: FrameIcon, title: 'Frame or no frame', text: 'Keep the frame in the picture or crop to the painting alone. You choose each time.' },
  { Icon: StackIcon, title: 'Several at once', text: 'Add a whole batch of paintings and check them together on one screen.' },
  { Icon: DownloadIcon, title: 'Saved where you want', text: 'Send the finished pictures to Google Photos or download them to your computer.' },
];

/** Three finished paintings, fanned out like prints on a table. */
const fan = [
  { src: 'print-river', alt: 'A finished painting of a river between pine trees', turn: '-rotate-[7deg] translate-y-2.5', tall: false },
  { src: 'canvas-after', alt: 'A finished abstract painting of a bright flower', turn: 'rotate-[1.5deg] -translate-y-1 z-[3]', tall: true },
  { src: 'framed-after', alt: 'A finished framed painting of a cat in a Santa hat', turn: 'rotate-[7deg] translate-y-3 z-[2]', tall: false },
];

const img = (name: string) => `/start/${name}.webp`;

/** `children` are the buttons for the closing invitation. */
export default function StartSections({ children }: { children?: ReactNode }) {
  return (
    <>
      <section id="what-it-does" className="bg-card rounded-t-[32px] sm:rounded-t-[48px]">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-10 py-12 sm:py-[76px]">
          <Chip>What it does</Chip>
          <h2 className="text-[28px] sm:text-[40px] max-w-[22ch] mt-3.5 sm:mt-4">From a quick photo to an image you can use</h2>
          <p className="text-[17px] sm:text-[19px] text-muted max-w-[58ch] mt-3 sm:mt-3.5">You don&rsquo;t need a tripod, perfect lighting, or expensive scanner. Lay the painting down or lean it on a shelf, take the photo, and GallerySnap does the fiddly part.</p>

          <div className="grid lg:grid-cols-2 gap-3.5 sm:gap-6 mt-7 sm:mt-10">
            {pairs.map((p) => (
              <div key={p.before} className="bg-wall rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 sm:gap-3.5 items-center">
                <figure className="flex flex-col items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img(p.before)} alt={p.beforeAlt} loading="lazy" className="max-h-[118px] sm:max-h-[190px] w-auto max-w-full rounded-[6px]" />
                  <figcaption className="font-bold text-[13px] sm:text-[14px] text-muted">Your photo</figcaption>
                </figure>
                <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-ink text-white flex items-center justify-center" aria-hidden>
                  <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
                <figure className="flex flex-col items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img(p.after)} alt={p.afterAlt} loading="lazy" className="max-h-[118px] sm:max-h-[190px] w-auto max-w-full rounded-[6px]" />
                  <figcaption className="font-bold text-[13px] sm:text-[14px] text-muted">After GallerySnap</figcaption>
                </figure>
                <p className="col-span-3 text-[15px] sm:text-[16px] text-muted text-center mt-1">{p.note}</p>
              </div>
            ))}
          </div>

          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-9 gap-y-[22px] sm:gap-y-7 mt-9 sm:mt-12">
            {features.map(({ Icon, title, text }) => (
              <li key={title} className="flex gap-3.5 items-start">
                <span className="flex-none w-[50px] h-[50px] rounded-[16px] bg-tile flex items-center justify-center">
                  <Icon className="w-[26px] h-[26px]" />
                </span>
                <div>
                  <h3 className="text-[18px] sm:text-[19px]">{title}</h3>
                  <p className="text-[16px] text-muted mt-1 leading-[1.45]">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-card px-4 sm:px-10 pb-10 sm:pb-[72px]">
        <div className="w-full max-w-[1200px] mx-auto bg-wall rounded-[28px] sm:rounded-[40px] px-5 pt-7 pb-6 sm:px-16 sm:py-14 flex flex-col sm:flex-row-reverse sm:flex-wrap items-center gap-x-14 gap-y-5 sm:gap-y-10 max-sm:text-center">
          <div className="sm:flex-[1_1_420px] min-w-0 flex items-center justify-center py-2 sm:py-4" aria-hidden={false}>
            {fan.map((f, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={f.src}
                src={img(f.src)}
                alt={f.alt}
                loading="lazy"
                className={`relative w-auto rounded-[4px] shadow-[0_18px_30px_-14px_rgba(35,39,47,.45),0_0_0_1px_rgba(35,39,47,.06)] ${f.turn} ${f.tall ? 'h-[116px] sm:h-[188px]' : 'h-[104px] sm:h-[168px]'} ${i > 0 ? '-ml-5 sm:-ml-11' : ''}`}
              />
            ))}
          </div>
          <div className="sm:flex-[1_1_400px] min-w-0 flex flex-col max-sm:items-stretch items-start gap-3 sm:gap-4">
            <h2 className="text-[28px] sm:text-[44px] sm:leading-[1.06] sm:tracking-[-0.035em] sm:max-w-[14ch]">Got a painting nearby? Give it a go.</h2>
            <p className="text-[17px] sm:text-[19px] text-muted sm:max-w-[30ch]">Take one quick photo and see it squared up and ready to share.</p>
            <div className="flex flex-col sm:flex-row gap-2.5 mt-1.5 sm:mt-2">{children}</div>
            <p className="flex items-center max-sm:justify-center gap-2 text-[14px] sm:text-[15px] text-muted">
              <LockIcon className="w-4 h-4 flex-none" />
              <span className="sm:hidden">No account needed. Your photos stay private.</span>
              <span className="max-sm:hidden">No account needed. Your photos stay on this device.</span>
            </p>
          </div>
        </div>
        <footer className="w-full max-w-[1200px] mx-auto pt-8 sm:pt-12 text-center text-[14px] sm:text-[15px] text-muted">
          Designed &amp; built by{' '}
          <a href="https://juliagiebultowicz.com" target="_blank" rel="noopener noreferrer" className="font-bold text-ink underline underline-offset-4 hover:text-rasp">
            Julia Giebultowicz
          </a>
        </footer>
      </section>
    </>
  );
}
