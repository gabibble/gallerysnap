import { describe, expect, it } from 'vitest';
import { enhance } from './enhance';

function image(pixels: [number, number, number][]) {
  const data = new Uint8ClampedArray(pixels.length * 4);
  pixels.forEach(([r, g, b], i) => data.set([r, g, b, 255], i * 4));
  return { data, width: pixels.length, height: 1 };
}

describe('enhance', () => {
  it('brightens a dull photo towards full range', () => {
    const px: [number, number, number][] = [];
    for (let v = 60; v <= 190; v++) px.push([v, v, v]);
    const out = enhance(image(px));
    expect(out.data[0]).toBeLessThan(45);
    expect(out.data[out.data.length - 4]).toBeGreaterThan(205);
  });

  it('reduces a yellow cast', () => {
    const px: [number, number, number][] = [];
    for (let v = 0; v <= 200; v++) px.push([Math.min(255, v + 55), Math.min(255, v + 40), v]);
    const out = enhance(image(px));
    const i = 100 * 4;
    const before = px[100][0] - px[100][2];
    expect(out.data[i] - out.data[i + 2]).toBeLessThan(before);
  });

  it('leaves a full-range picture almost alone', () => {
    const px: [number, number, number][] = [];
    for (let v = 0; v <= 255; v++) px.push([v, v, v]);
    const out = enhance(image(px));
    for (let v = 0; v <= 255; v += 15) expect(Math.abs(out.data[v * 4] - v)).toBeLessThanOrEqual(3);
  });

  it('never stretches a near-flat picture wildly', () => {
    const px: [number, number, number][] = [];
    for (let i = 0; i < 100; i++) px.push([120 + (i % 5), 120 + (i % 5), 120 + (i % 5)]);
    const out = enhance(image(px));
    expect(Math.abs(out.data[0] - 120)).toBeLessThan(10);
  });
});
