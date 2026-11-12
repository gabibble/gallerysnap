import type { MetadataRoute } from 'next';

// Lets people add GallerySnap to their home screen or dock like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GallerySnap',
    short_name: 'GallerySnap',
    description: 'Get your art photos cropped and straightened in a snap.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6f0e4',
    theme_color: '#f6f0e4',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
