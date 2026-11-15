import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', style: ['normal', 'italic'], display: 'swap' });

export const metadata: Metadata = {
  title: 'GallerySnap',
  description: 'Photos of your artwork, cropped and straightened in a snap.',
  applicationName: 'GallerySnap',
  appleWebApp: { capable: true, title: 'GallerySnap', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#f3f3f3',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
