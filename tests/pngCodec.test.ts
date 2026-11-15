import zlib from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { decodePngRgba, encodeRgbaPng } from '../src/core/font/pngCodec.ts';
import {
  encodeFilteredRgbaPng,
  encodeIndexedPng,
  encodeInterlacedRgbaPng,
  makeSolidRectRgba,
} from './helpers/syntheticPng.ts';

describe('Pure Node/Browser PNG Codec (pngCodec.ts)', () => {
  it('round-trips RGBA PNG identically pixel-for-pixel', async () => {
    const rgba = makeSolidRectRgba(8, 6, [
      { x: 0, y: 0, w: 3, h: 4, rgba: [16, 185, 129, 255] },
      { x: 5, y: 2, w: 2, h: 3, rgba: [248, 113, 113, 180] },
    ]);
    const png = await encodeRgbaPng(8, 6, rgba);
    const decoded = await decodePngRgba(png);

    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    expect(decoded.image.width).toBe(8);
    expect(decoded.image.height).toBe(6);
    expect(Array.from(decoded.image.rgba)).toEqual(Array.from(rgba));
  });

  it('decodes PNG scanline filters None(0), Sub(1), Up(2), Average(3), and Paeth(4) identically', async () => {
    const rgba = makeSolidRectRgba(10, 10, [
      { x: 1, y: 1, w: 6, h: 5, rgba: [52, 211, 153, 255] },
      { x: 4, y: 4, w: 5, h: 5, rgba: [251, 191, 36, 200] },
    ]);
    const png = await encodeFilteredRgbaPng(10, 10, rgba, [0, 1, 2, 3, 4]);
    const decoded = await decodePngRgba(png);

    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    expect(Array.from(decoded.image.rgba)).toEqual(Array.from(rgba));
  });

  it('decodes indexed-color (colorType=3) PNG with PLTE and tRNS alpha', async () => {
    const indices = new Uint8Array([
      0, 1, 2, 0,
      1, 2, 1, 0,
    ]);
    const palette = new Uint8Array([
      0, 0, 0, // 0: transparent
      16, 185, 129, // 1: emerald
      255, 255, 255, // 2: white
    ]);
    const trns = new Uint8Array([0, 255, 128]);
    const png = await encodeIndexedPng(4, 2, indices, palette, trns);
    const decoded = await decodePngRgba(png);

    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    expect(decoded.image.colorType).toBe(3);
    expect(decoded.image.hasAlphaChannel).toBe(true);
    // Pixel (0,0) index 0 -> alpha 0
    expect(decoded.image.rgba[3]).toBe(0);
    // Pixel (1,0) index 1 -> emerald 255 alpha
    expect(Array.from(decoded.image.rgba.subarray(4, 8))).toEqual([16, 185, 129, 255]);
    // Pixel (2,0) index 2 -> white 128 alpha
    expect(Array.from(decoded.image.rgba.subarray(8, 12))).toEqual([255, 255, 255, 128]);
  });

  it('rejects non-PNG signatures, CRC corruption, and malformed IDAT payloads cleanly', async () => {
    const nonPng = new TextEncoder().encode('not-a-png-file-at-all-123456');
    const badSig = await decodePngRgba(nonPng);
    expect(badSig.ok).toBe(false);

    const valid = await encodeRgbaPng(4, 4, new Uint8ClampedArray(4 * 4 * 4));
    const corruptCrc = new Uint8Array(valid);
    corruptCrc[corruptCrc.length - 1] = (corruptCrc[corruptCrc.length - 1] ?? 0) ^ 0xff;
    const badCrc = await decodePngRgba(corruptCrc);
    expect(badCrc.ok).toBe(false);
    if (!badCrc.ok) {
      expect(badCrc.error).toContain('CRC');
    }

    // Truncated bytes
    const truncated = valid.subarray(0, 20);
    const badTrunc = await decodePngRgba(truncated);
    expect(badTrunc.ok).toBe(false);
  });

  it('decodes Adam7 interlaced RGBA PNG (interlace=1) accurately', async () => {
    const rgba = makeSolidRectRgba(11, 9, [
      { x: 0, y: 0, w: 5, h: 4, rgba: [16, 185, 129, 255] },
      { x: 6, y: 5, w: 4, h: 3, rgba: [245, 158, 11, 255] },
    ]);
    const interlaced = await encodeInterlacedRgbaPng(11, 9, rgba);
    const decoded = await decodePngRgba(interlaced);
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    expect(decoded.image.interlace).toBe(1);
    expect(Array.from(decoded.image.rgba)).toEqual(Array.from(rgba));
  });

  it('decodes 16-bit grayscale with tRNS LSB precision, 1-bit grayscale, RGB+tRNS, and Gray+Alpha', async () => {
    const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
    const crc32 = (b: Uint8Array) => {
      let c = 0xffffffff;
      for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]!) & 0xff]! ^ (c >>> 8);
      return (c ^ 0xffffffff) >>> 0;
    };
    const chunk = (type: string, data: Uint8Array) => {
      const out = new Uint8Array(12 + data.length);
      out[0] = (data.length >>> 24) & 0xff;
      out[1] = (data.length >>> 16) & 0xff;
      out[2] = (data.length >>> 8) & 0xff;
      out[3] = data.length & 0xff;
      for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
      out.set(data, 8);
      const crc = crc32(out.subarray(4, 8 + data.length));
      out[8 + data.length] = (crc >>> 24) & 0xff;
      out[9 + data.length] = (crc >>> 16) & 0xff;
      out[10 + data.length] = (crc >>> 8) & 0xff;
      out[11 + data.length] = crc & 0xff;
      return out;
    };
    const build = (chunks: Uint8Array[]) => {
      const all = [sig, ...chunks];
      const out = new Uint8Array(all.reduce((s, a) => s + a.length, 0));
      let pos = 0;
      for (const a of all) { out.set(a, pos); pos += a.length; }
      return out;
    };

    // 16-bit grayscale (colorType=0, bitDepth=16): pixel0=0x0000, pixel1=0x0005, tRNS=0x0005
    const ihdr16 = new Uint8Array([0, 0, 0, 2, 0, 0, 0, 1, 16, 0, 0, 0, 0]);
    const raw16 = new Uint8Array([0, 0x00, 0x00, 0x00, 0x05]);
    const png16 = build([
      chunk('IHDR', ihdr16),
      chunk('tRNS', new Uint8Array([0x00, 0x05])),
      chunk('IDAT', zlib.deflateSync(raw16)),
      chunk('IEND', new Uint8Array(0)),
    ]);
    const dec16 = await decodePngRgba(png16);
    expect(dec16.ok).toBe(true);
    if (dec16.ok) {
      expect(dec16.image.rgba[3]).toBe(255); // 0x0000 != 0x0005 -> opaque
      expect(dec16.image.rgba[7]).toBe(0); // 0x0005 == 0x0005 -> transparent
    }

    // 1-bit grayscale (colorType=0, bitDepth=1)
    const ihdr1 = new Uint8Array([0, 0, 0, 4, 0, 0, 0, 1, 1, 0, 0, 0, 0]);
    const png1 = build([
      chunk('IHDR', ihdr1),
      chunk('IDAT', zlib.deflateSync(new Uint8Array([0, 0xa0]))),
      chunk('IEND', new Uint8Array(0)),
    ]);
    const dec1 = await decodePngRgba(png1);
    expect(dec1.ok).toBe(true);
    if (dec1.ok) {
      expect([dec1.image.rgba[0], dec1.image.rgba[4], dec1.image.rgba[8], dec1.image.rgba[12]]).toEqual([255, 0, 255, 0]);
    }

    // 8-bit RGB + tRNS (colorType=2)
    const ihdrRgb = new Uint8Array([0, 0, 0, 2, 0, 0, 0, 1, 8, 2, 0, 0, 0]);
    const pngRgb = build([
      chunk('IHDR', ihdrRgb),
      chunk('tRNS', new Uint8Array([0, 1, 0, 2, 0, 3])),
      chunk('IDAT', zlib.deflateSync(new Uint8Array([0, 1, 2, 3, 10, 20, 30]))),
      chunk('IEND', new Uint8Array(0)),
    ]);
    const decRgb = await decodePngRgba(pngRgb);
    expect(decRgb.ok).toBe(true);
    if (decRgb.ok) {
      expect(decRgb.image.rgba[3]).toBe(0);
      expect(decRgb.image.rgba[7]).toBe(255);
    }

    // 8-bit Grayscale + Alpha (colorType=4)
    const ihdrGa = new Uint8Array([0, 0, 0, 2, 0, 0, 0, 1, 8, 4, 0, 0, 0]);
    const pngGa = build([
      chunk('IHDR', ihdrGa),
      chunk('IDAT', zlib.deflateSync(new Uint8Array([0, 128, 64, 255, 0]))),
      chunk('IEND', new Uint8Array(0)),
    ]);
    const decGa = await decodePngRgba(pngGa);
    expect(decGa.ok).toBe(true);
    if (decGa.ok) {
      expect(Array.from(decGa.image.rgba)).toEqual([128, 128, 128, 64, 255, 255, 255, 0]);
    }
  });
});
