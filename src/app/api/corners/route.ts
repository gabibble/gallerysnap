// AI helper for hard photos.
//
// The browser calls this only when its own corner detection isn't confident.
// It sends a small copy of the photo (about 1000px) and gets back four corner
// points. The API key stays here on the server (ANTHROPIC_API_KEY).
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { readGuardedImage } from '@/lib/aiGuard';

export const maxDuration = 60;

const MODEL = process.env.GALLERYSNAP_AI_MODEL || 'claude-opus-5-5';

const Point = z.object({ x: z.number(), y: z.number() });
const Corners = z.object({
  found: z.boolean().describe('false if there is no clear rectangular artwork in the photo'),
  top_left: Point,
  top_right: Point,
  bottom_right: Point,
  bottom_left: Point,
});

const PROMPT = `This is a photo of a painting or other flat rectangular artwork, taken by the artist. They want it cropped to the artwork and straightened.

Find the four corners of the artwork itself: the painted surface (canvas, panel or paper). If it is in a frame or behind a mat, give the corners of the artwork inside, not of the frame or mat.

Give each corner as fractions of the image: x from 0 (left edge) to 1 (right edge), y from 0 (top edge) to 1 (bottom edge). Be as precise as you can. If the artwork fills the whole photo, use the photo's corners. If you can't see a rectangular artwork, set found to false.`;

const clamp = (v: number) => Math.max(0, Math.min(1, v));

export async function POST(request: Request) {
  const image = await readGuardedImage(request, { corners: null });
  if (image instanceof Response) return image;

  const client = new Anthropic();
  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: 'low', format: zodOutputFormat(Corners) },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    });
    const out = response.parsed_output;
    if (response.stop_reason === 'refusal' || !out || !out.found) {
      return Response.json({ corners: null, reason: 'not-found' });
    }
    const corners = [out.top_left, out.top_right, out.bottom_right, out.bottom_left].map((p) => ({ x: clamp(p.x), y: clamp(p.y) }));
    return Response.json({ corners });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return Response.json({ corners: null, reason: 'busy' }, { status: 429 });
    }
    if (err instanceof Anthropic.APIError) {
      console.error('AI corner helper failed:', err.status, err.message);
      return Response.json({ corners: null, reason: 'ai-error' }, { status: 502 });
    }
    console.error('AI corner helper failed:', err);
    return Response.json({ corners: null, reason: 'error' }, { status: 500 });
  }
}
