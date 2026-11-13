// AI helper: is the straightened painting the right way up?
//
// The on-device code can't tell which way up a painting goes; that takes
// understanding what is painted. The browser sends a small copy of the
// straightened picture and gets back how many quarter turns clockwise would
// make it upright. The app only offers the turn; it never turns on its own.
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { readGuardedImage } from '@/lib/aiGuard';

export const maxDuration = 60;

const MODEL = process.env.GALLERYSNAP_AI_MODEL || 'claude-opus-5-5';

const Answer = z.object({
  turn_clockwise: z.enum(['none', '90', '180', '270']),
  confident: z.boolean().describe('true only if the right way up is clear from what is painted'),
});

const PROMPT = `This is a photo of a painting, already cropped and straightened. It may have been photographed sideways or upside down.

How many degrees should it be turned clockwise so that it is the right way up, as the artist meant it to hang? Answer none if it already is.

Judge from what is painted: the horizon, sky above ground, buildings and trees standing up, people and animals upright, any signature or text reading normally. If it is abstract or you can't really tell, answer none and set confident to false.`;

export async function POST(request: Request) {
  const image = await readGuardedImage(request, { turns: null });
  if (image instanceof Response) return image;

  const client = new Anthropic();
  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 2000,
      output_config: { effort: 'low', format: zodOutputFormat(Answer) },
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
    if (response.stop_reason === 'refusal' || !out || !out.confident) {
      return Response.json({ turns: null, reason: 'unsure' });
    }
    const turns = out.turn_clockwise === 'none' ? 0 : Number(out.turn_clockwise) / 90;
    return Response.json({ turns });
  } catch (err) {
    console.error('AI orientation helper failed:', err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : err);
    return Response.json({ turns: null, reason: 'error' }, { status: 502 });
  }
}
