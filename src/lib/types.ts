import type { Quad, Turns } from './geometry';

export type Mode = 'auto' | 'manual';

export type Outline = { corners: Quad; score: number };

export type Detection = {
  painting: Outline | null;
  frame: Outline | null;
  confidence: number;
  candidates: Outline[];
};

export type RawImage = { data: Uint8ClampedArray; width: number; height: number };

/** One photo the user added, and everything we know about it. */
export type Painting = {
  id: string;
  /** Original file name, e.g. "IMG_2041.HEIC". */
  name: string;
  /** The photo, decoded and turned upright. Full resolution (capped for memory). */
  bitmap: ImageBitmap;
  width: number;
  height: number;
  /** A screen-sized copy for showing on the page. */
  previewUrl: string;
  detection: Detection | null;
  /** Current corners, as fractions of width/height. */
  corners: Quad;
  /** True when a frame was found and the user wants it kept in the picture. */
  includeFrame: boolean;
  /** "good": we trust the corners. "needs": the user should check them. */
  status: 'working' | 'good' | 'needs';
  /** Optional real-world size the user typed, e.g. "16 x 20". */
  dimensions: string;
  /** Quarter turns clockwise applied to the straightened picture. */
  turns: Turns;
  /** Turns the AI helper thinks would make the painting upright, if it said so. */
  suggestedTurns: Turns | null;
  /** Straightened preview, for showing on the page. */
  resultUrl: string | null;
  /** Size of the full-resolution result in pixels. */
  resultSize: { width: number; height: number } | null;
};
