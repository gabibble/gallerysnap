import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible, Source_Serif_4 } from 'next/font/google';
import './globals.css';

const sourceSerif = Source_Serif_4({ subsets: ['latin'], variable: '--font-source-serif', style: ['normal', 'italic'], display: 'swap' });
const atkinson = Atkinson_Hyperlegible({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-atkinson', display: 'swap' });

export const metadata: Metadata = {
  title: 'GallerySnap',
  description: 'Get your art photos cropped and straightened in a snap.',
  applicationName: 'GallerySnap',
  appleWebApp: { capable: true, title: 'GallerySnap', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#f6f0e4',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sourceSerif.variable} ${atkinson.variable}`}>
      <body>{children}</body>
    </html>
  );
}
