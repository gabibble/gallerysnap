// Visiting /photos-off hides the "Save to Google Photos" button again.
import { NextResponse } from 'next/server';
import { PHOTOS_COOKIE } from '@/lib/googlePhotos';

export function GET(request: Request) {
  const res = NextResponse.redirect(new URL('/', request.url));
  res.cookies.delete(PHOTOS_COOKIE);
  res.headers.set('cache-control', 'no-store');
  return res;
}
