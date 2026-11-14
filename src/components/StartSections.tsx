// What you see when you scroll down the start page: what the app does, what
// it's for, and an example of where the finished pictures can go.
import type { ReactNode } from 'react';
import { CornersIcon, DownloadIcon, FramedPictureIcon, StraightenIcon } from './ui';

const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const Svg = ({ children, className }: { children: ReactNode; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...line}>
    {children}
  </svg>
);
const CropIcon = ({ className }: { className?: string }) => <Svg className={className}><path d="M7 3v14h14M3 7h14v14" /></Svg>;
const StackIcon = ({ className }: { className?: string }) => <Svg className={className}><rect x="3" y="8" width="13" height="12" rx="1.5" /><path d="M8 8V5.5A1.5 1.5 0 0 1 9.5 4h10A1.5 1.5 0 0 1 21 5.5v9a1.5 1.5 0 0 1-1.5 1.5H16" /></Svg>;
const TagIcon = ({ className }: { className?: string }) => <Svg className={className}><path d="M3 12V4h8l10 10-8 8z" /><circle cx="8" cy="9" r="1.5" /></Svg>;
const GlobeIcon = ({ className }: { className?: string }) => <Svg className={className}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" /></Svg>;
const RibbonIcon = ({ className }: { className?: string }) => <Svg className={className}><circle cx="12" cy="9" r="5.5" /><path d="m8.5 13.5-2 7.5 5.5-3 5.5 3-2-7.5" /></Svg>;
const HeartIcon = ({ className }: { className?: string }) => <Svg className={className}><path d="M12 20s-8-5-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15 12 20 12 20z" /></Svg>;
const BookIcon = ({ className }: { className?: string }) => <Svg className={className}><path d="M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z" /></Svg>;
const GiftIcon = ({ className }: { className?: string }) => <Svg className={className}><rect x="3" y="9" width="18" height="11" rx="1" /><path d="M3 13h18M12 9v11M12 9c-2-5-7-3-4 0M12 9c2-5 7-3 4 0" /></Svg>;
const ArrowIcon = ({ className }: { className?: string }) => <Svg className={className}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;

type IconType = (p: { className?: string }) => ReactNode;

const pairs = [
  { before: 'canvas-before', after: 'canvas-after', beforeAlt: 'A canvas photographed on a wicker table, slightly crooked', afterAlt: 'The same canvas, straight, with the table trimmed away', note: 'A canvas on a table: straightened, table gone.' },
  { before: 'framed-before', after: 'framed-after', beforeAlt: 'A framed painting of a cat photographed at an angle on a shelf', afterAlt: 'The same framed painting, squared up and cropped to the frame', note: 'A framed piece on a shelf: squared up, frame kept.' },
];

const features: { Icon: IconType; title: string; text: string }[] = [
  { Icon: CornersIcon, title: 'Finds the edges', text: 'It spots the four corners of your painting by itself. If it misses, you can drag them into place.' },
  { Icon: StraightenIcon, title: 'Straightens the lean', text: 'Photos taken from a little to one side come out square, as if you had stood right in front.' },
  { Icon: CropIcon, title: 'Trims the background', text: 'The table, the wall and the floor are cut away, so only the artwork is left.' },
  { Icon: FramedPictureIcon, title: 'Frame or no frame', text: 'Keep the frame in the picture or crop to the painting alone. You choose each time.' },
  { Icon: StackIcon, title: 'Several at once', text: 'Add a whole batch of paintings and check them together on one screen.' },
  { Icon: DownloadIcon, title: 'Saved where you want', text: 'Send the finished pictures to Google Photos or download them to your computer.' },
];

const uses: { Icon: IconType; title: string; text: string }[] = [
  { Icon: TagIcon, title: 'Selling prints', text: 'Print shops need a straight image with nothing but the painting in it. Start with one and your prints, cards and canvases come out right.' },
  { Icon: GlobeIcon, title: 'Your website or shop', text: 'Every painting gets the same tidy edges, so your online gallery looks cared for from the first picture to the last.' },
  { Icon: RibbonIcon, title: 'Shows and competitions', text: 'Entry forms usually ask for a photo of the artwork alone. Have one ready without booking a photographer.' },
  { Icon: HeartIcon, title: 'Sharing with people', text: 'Send family and friends a picture that looks like the painting does on the wall, not like a snapshot of your kitchen table.' },
  { Icon: BookIcon, title: 'Keeping a record', text: 'Build a catalogue of everything you’ve made, including the pieces you’ve sold or given away.' },
  { Icon: GiftIcon, title: 'Cards and gifts', text: 'Turn a favourite painting into greeting cards, a calendar or a photo book.' },
];

const prints = [
  { src: 'print-river', alt: 'Painting of a river running between pine trees and mountains', title: 'Morning on the River', size: 'Print, 10 × 10 in', price: '$42' },
  { src: 'print-terrace', alt: 'Painting of a terracotta building with arches and flowers', title: 'Terrace in Bloom', size: 'Print, 8 × 12 in', price: '$38' },
  { src: 'print-cat', alt: 'Painting of a cat wearing a Santa hat beside Christmas ornaments', title: 'Christmas Cat', size: 'Print, 8 × 10 in', price: '$38' },
  { src: 'canvas-after', alt: 'Abstract painting of a bright orange flower in blue and purple strokes', title: 'Wildflower in the Wind', size: 'Print, 12 × 12 in', price: '$48' },
];

const wrap = 'w-full max-w-[1120px] mx-auto px-5 sm:px-10';
const eyebrow = 'font-sans font-bold text-[14px] tracking-[.09em] uppercase text-burgundy mb-3';
const heading = 'text-[28px] sm:text-[38px] max-w-[22ch]';
const img = (name: string) => `/start/${name}.webp`;

export default function StartSections({ children }: { children?: ReactNode }) {
  return (
    <>
      <section id="what-it-does" className="bg-soft py-[52px] sm:py-[76px]">
        <div className={wrap}>
          <p className={eyebrow}>What it does</p>
          <h2 className={heading}>From a quick photo to a picture you can use</h2>
          <p className="text-muted max-w-[58ch] mt-3.5">You don&rsquo;t need a tripod or perfect lighting. Lay the painting down or lean it on a shelf, take the photo, and GallerySnap does the fiddly part.</p>

          <div className="grid lg:grid-cols-2 gap-7 mt-10">
            {pairs.map((p) => (
              <div key={p.before} className="bg-card border border-line rounded-[20px] p-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-3.5 items-center">
                <figure className="flex flex-col items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img(p.before)} alt={p.beforeAlt} loading="lazy" className="max-h-[210px] w-auto max-w-full shadow-[0_8px_18px_-10px_rgba(60,40,20,.5)]" />
                  <figcaption className="font-sans font-bold text-[14px] text-muted">Your photo</figcaption>
                </figure>
                <span className="w-[38px] h-[38px] rounded-full bg-burgundy text-cream flex items-center justify-center" aria-hidden>
                  <ArrowIcon className="w-5 h-5" />
                </span>
                <figure className="flex flex-col items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img(p.after)} alt={p.afterAlt} loading="lazy" className="max-h-[210px] w-auto max-w-full shadow-[0_8px_18px_-10px_rgba(60,40,20,.5)]" />
                  <figcaption className="font-sans font-bold text-[14px] text-muted">After GallerySnap</figcaption>
                </figure>
                <p className="col-span-3 text-[16px] text-muted text-center">{p.note}</p>
              </div>
            ))}
          </div>

          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-9 gap-y-7 mt-12">
            {features.map(({ Icon, title, text }) => (
              <li key={title} className="grid grid-cols-[48px_minmax(0,1fr)] gap-3.5 items-start">
                <span className="w-12 h-12 rounded-[12px] bg-wall text-burgundy flex items-center justify-center">
                  <Icon className="w-[26px] h-[26px]" />
                </span>
                <div>
                  <h3 className="text-[20px]">{title}</h3>
                  <p className="text-[16.5px] text-muted mt-1 leading-snug">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="what-its-for" className="py-[52px] sm:py-[76px]">
        <div className={wrap}>
          <p className={eyebrow}>What it&rsquo;s for</p>
          <h2 className={heading}>A clean picture of your art opens a lot of doors</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-11 mt-9">
            {uses.map(({ Icon, title, text }) => (
              <div key={title} className="py-6 border-t-2 border-line">
                <h3 className="text-[22px] flex items-center gap-2.5">
                  <Icon className="w-6 h-6 text-burgundy flex-none" />
                  {title}
                </h3>
                <p className="text-[17px] text-muted mt-2 leading-normal">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-soft py-[52px] sm:py-[76px]">
        <div className={wrap}>
          <p className={eyebrow}>Where it can take you</p>
          <h2 className={heading}>Ready for a print shop of your own</h2>
          <p className="text-muted max-w-[58ch] mt-3.5">Here is how four paintings look as prints once the photos are straight and cropped.</p>

          <div className="mt-10 rounded-[16px] overflow-hidden border border-line bg-white shadow-[0_30px_60px_-40px_rgba(40,30,20,.55)]" role="img" aria-label="Example of an online print shop showing four paintings as framed prints">
            <div className="flex items-center gap-2 px-4 py-3 bg-soft border-b border-line">
              {[0, 1, 2].map((i) => (
                <i key={i} className="w-[11px] h-[11px] rounded-full bg-line flex-none" />
              ))}
              <span className="flex-1 min-w-0 ml-2.5 bg-card rounded-[8px] px-3 py-1 font-sans text-[13.5px] text-muted truncate">chris-paints.example/prints</span>
            </div>
            <div className="px-[18px] sm:px-11 pt-7 pb-10">
              <div className="flex flex-wrap justify-between items-baseline gap-x-4 gap-y-1 pb-[18px] border-b border-line">
                <p className="text-[24px] font-semibold italic">Chris Paints</p>
                <p className="flex gap-5 font-sans text-[14.5px] text-muted">
                  <b className="text-ink">Prints</b>
                  <span>Originals</span>
                  <span>About</span>
                  <span className="max-sm:hidden">Basket (0)</span>
                </p>
              </div>
              <p className="font-serif font-semibold text-[28px] mt-7 leading-tight">Fine art prints</p>
              <p className="font-sans text-[15px] text-muted mt-1.5">Printed to order on cotton paper. Framed or unframed.</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-7 mt-6 items-end">
                {prints.map((p) => (
                  <div key={p.src} className="flex flex-col gap-3">
                    <div className="bg-white border-[7px] border-[#2a2725] p-[11%] shadow-[0_14px_22px_-14px_rgba(0,0,0,.55)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img(p.src)} alt={p.alt} loading="lazy" className="block w-full" />
                    </div>
                    <div>
                      <p className="text-[17.5px] font-semibold leading-tight">{p.title}</p>
                      <p className="font-sans text-[14px] text-muted">{p.size}</p>
                    </div>
                    <p className="font-sans font-bold text-[15px]">{p.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-5 text-[16.5px] text-muted max-w-[62ch]">This shop is an example. GallerySnap gets your pictures ready, and you decide where they go next.</p>
        </div>
      </section>

      <section className="py-[52px] sm:py-[76px]">
        <div className={`${wrap} flex flex-col items-center gap-7 text-center`}>
          <h2 className="text-[28px] sm:text-[38px] max-w-[20ch]">Try it with one of your paintings</h2>
          <div className="flex flex-wrap justify-center gap-3">{children}</div>
        </div>
      </section>
    </>
  );
}
