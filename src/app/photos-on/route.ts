// Visiting /photos-on switches the "Save to Google Photos" button on in this
// browser, then opens the app. Share this link only with people listed as test
// users in the Google project (Google blocks everyone else at sign-in anyway).
//
// The cookie is set by the server, not by page code, because Safari wipes
// page-made storage after 7 days without a visit; server cookies last.
import { NextResponse } from 'next/server';
import { PHOTOS_COOKIE } from '@/lib/googlePhotos';

export function GET(request: Request) {
  const res = NextResponse.redirect(new URL('/', request.url));
  res.cookies.set(PHOTOS_COOKIE, 'on', { path: '/', maxAge: 400 * 24 * 60 * 60, sameSite: 'lax', secure: true });
  res.headers.set('cache-control', 'no-store');
  return res;
}
