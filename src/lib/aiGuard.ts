// Shared checks for the AI helper routes: only our own pages, a small
// per-visitor limit, and a sane image. Server-side only.

const MAX_BASE64_LENGTH = 1_500_000; // ~1.1 MB image

// The limit lives in memory, so it is per server instance: a speed bump, not a wall.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 60;
const hits = new Map<string, number[]>();
function allowed(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return true;
}

/** Returns the base64 image from the request, or a Response to send back instead. */
export async function readGuardedImage(request: Request, refusal: Record<string, unknown>): Promise<string | Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    // The app works without the AI helper.
    return Response.json({ ...refusal, reason: 'not-configured' });
  }
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin && host && new URL(origin).host !== host) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }
  const visitor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!allowed(visitor)) {
    return Response.json({ ...refusal, reason: 'rate-limited' }, { status: 429 });
  }
  let image: unknown;
  try {
    ({ image } = (await request.json()) as { image?: unknown });
  } catch {
    return Response.json({ error: 'bad-request' }, { status: 400 });
  }
  if (typeof image !== 'string' || image.length === 0 || image.length > MAX_BASE64_LENGTH || !/^[A-Za-z0-9+/=]+$/.test(image)) {
    return Response.json({ error: 'bad-image' }, { status: 400 });
  }
  return image;
}
