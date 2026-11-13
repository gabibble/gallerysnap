import { describe, expect, it } from 'vitest';
import { addTurns, displayQuad, estimateAspect, fromDisplay, orderQuad, outputSize, parseDimensions, rotateQuad, type Quad } from './geometry';
import { outputFilename, uniqueNames } from './filenames';

// Projects a flat rectangle (width x height, centred at the origin, tilted
// around the y axis by `tilt` radians, `distance` in front of the camera)
// into a photo of size imgW x imgH with focal length f.
function photographRect(width: number, height: number, tilt: number, f: number, imgW: number, imgH: number): Quad {
  const corners = [
    [-width / 2, -height / 2],
    [width / 2, -height / 2],
    [width / 2, height / 2],
    [-width / 2, height / 2],
  ];
  const distance = 3 * Math.max(width, height);
  return corners.map(([x, y]) => {
    const X = x * Math.cos(tilt);
    const Z = distance + x * Math.sin(tilt);
    return { x: imgW / 2 + (f * X) / Z, y: imgH / 2 + (f * y) / Z };
  }) as Quad;
}

describe('estimateAspect', () => {
  it('recovers a 16x20 portrait canvas photographed at an angle', () => {
    // f = 3000 is a typical phone lens for a 4000x3000 photo
    const q = photographRect(16, 20, 0.5, 3000, 4000, 3000);
    expect(estimateAspect(q, 4000, 3000)).toBeCloseTo(16 / 20, 2);
    // the simple side-length average would be badly off
    expect(Math.abs(estimateAspect(q, 4000, 3000) - 0.7)).toBeGreaterThan(0.05);
  });

  it('recovers a wide 3:2 painting tilted in two directions', () => {
    // Turned left/right and up/down, so both vanishing points are finite and
    // the focal length (here 2500, not the assumed default) is recovered.
    const f = 2500, W = 4000, H = 3000, ay = 0.5, ax = 0.35;
    const q = [
      [-15, -10],
      [15, -10],
      [15, 10],
      [-15, 10],
    ].map(([x, y]) => {
      const x1 = x * Math.cos(ay), z1 = x * Math.sin(ay);
      const y2 = y * Math.cos(ax) - z1 * Math.sin(ax), z2 = y * Math.sin(ax) + z1 * Math.cos(ax);
      const Z = 90 + z2;
      return { x: W / 2 + (f * x1) / Z, y: H / 2 + (f * y2) / Z };
    }) as Quad;
    expect(estimateAspect(q, W, H)).toBeCloseTo(1.5, 2);
  });

  it('handles a straight-on photo', () => {
    const q: Quad = [
      { x: 100, y: 100 },
      { x: 900, y: 100 },
      { x: 900, y: 700 },
      { x: 100, y: 700 },
    ];
    expect(estimateAspect(q, 1000, 800)).toBeCloseTo(800 / 600, 5);
  });
});

describe('outputSize', () => {
  it('keeps the full resolution of the longest side', () => {
    const q: Quad = [
      { x: 0, y: 0 },
      { x: 1000, y: 0 },
      { x: 1000, y: 500 },
      { x: 0, y: 500 },
    ];
    expect(outputSize(q, 1000, 500)).toEqual({ width: 1000, height: 500 });
  });

  it('uses a given aspect ratio', () => {
    const q: Quad = [
      { x: 0, y: 0 },
      { x: 1000, y: 0 },
      { x: 1000, y: 900 },
      { x: 0, y: 900 },
    ];
    expect(outputSize(q, 1000, 900, 16 / 20)).toEqual({ width: 849, height: 1061 });
  });

  it('caps huge outputs', () => {
    const q: Quad = [
      { x: 0, y: 0 },
      { x: 20000, y: 0 },
      { x: 20000, y: 10000 },
      { x: 0, y: 10000 },
    ];
    expect(outputSize(q, 20000, 10000, undefined, 8000)).toEqual({ width: 8000, height: 4000 });
  });
});

describe('orderQuad', () => {
  it('orders shuffled corners as TL, TR, BR, BL', () => {
    const q = orderQuad([
      { x: 10, y: 90 },
      { x: 90, y: 10 },
      { x: 10, y: 10 },
      { x: 90, y: 90 },
    ]);
    expect(q).toEqual([
      { x: 10, y: 10 },
      { x: 90, y: 10 },
      { x: 90, y: 90 },
      { x: 10, y: 90 },
    ]);
  });
});

describe('parseDimensions', () => {
  it.each([
    ['16 x 20', 0.8],
    ['16x20 in', 0.8],
    ['40 × 50 cm', 0.8],
    ['24" x 36"', 24 / 36],
    ['11 by 14', 11 / 14],
    ['12,5 x 10', 1.25],
  ])('parses %s', (text, ratio) => {
    expect(parseDimensions(text)).toBeCloseTo(ratio, 5);
  });

  it('ignores text without two numbers', () => {
    expect(parseDimensions('large')).toBeNull();
    expect(parseDimensions('16')).toBeNull();
  });
});

describe('filenames', () => {
  it('adds the gallerysnap suffix', () => {
    expect(outputFilename('IMG_2041.HEIC')).toBe('IMG_2041_gallerysnap.jpg');
    expect(outputFilename('Christmas cat.jpg')).toBe('Christmas cat_gallerysnap.jpg');
  });

  it('makes zip names unique', () => {
    expect(uniqueNames(['a.jpg', 'a.jpg', 'b.jpg', 'a.jpg'])).toEqual(['a.jpg', 'a (2).jpg', 'b.jpg', 'a (3).jpg']);
  });
});

describe('rotateQuad', () => {
  const q: Quad = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];
  it('puts the old bottom-left first for one turn right', () => {
    expect(rotateQuad(q, 1)[0]).toEqual({ x: 0, y: 1 });
    expect(rotateQuad(q, 1)[1]).toEqual({ x: 0, y: 0 });
  });
  it('comes back after four turns', () => {
    expect(rotateQuad(rotateQuad(q, 2), 2)).toEqual(q);
    expect(rotateQuad(q, 0)).toEqual(q);
  });
  it('wraps turn counts', () => {
    expect(addTurns(3, 1)).toBe(0);
    expect(addTurns(0, -1)).toBe(3);
  });
});

describe('displayQuad', () => {
  const q: Quad = [{ x: 0.1, y: 0.2 }, { x: 0.8, y: 0.25 }, { x: 0.75, y: 0.9 }, { x: 0.15, y: 0.85 }];
  it('shows the old bottom-left as the top-left after one turn right', () => {
    const d = displayQuad(q, 1);
    expect(d[0].x).toBeCloseTo(1 - 0.85);
    expect(d[0].y).toBeCloseTo(0.15);
    // Still a top-left / top-right / bottom-right / bottom-left outline.
    expect(d[0].x).toBeLessThan(d[1].x);
    expect(d[0].y).toBeLessThan(d[3].y);
  });
  it('round-trips for every turn', () => {
    for (const t of [0, 1, 2, 3] as const) {
      const back = fromDisplay(displayQuad(q, t), t);
      back.forEach((p, i) => {
        expect(p.x).toBeCloseTo(q[i].x);
        expect(p.y).toBeCloseTo(q[i].y);
      });
    }
  });
});
