import { encodeRgbaPng } from '../../src/core/font/pngCodec.ts';

/**
 * Generates a purely synthetic RGBA pixel buffer of size width x height.
 * Zero Mojang assets.
 */
export function makeSolidRectRgba(
  width: number,
  height: number,
  rects: readonly {
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
    readonly rgba: readonly [number, number, number, number];
  }[],
): Uint8ClampedArray {
  const buf = new Uint8ClampedArray(width * height * 4);
  for (const r of rects) {
    for (let py = r.y; py < r.y + r.h; py++) {
      if (py < 0 || py >= height) continue;
      for (let px = r.x; px < r.x + r.w; px++) {
        if (px < 0 || px >= width) continue;
        const idx = (py * width + px) * 4;
        buf[idx] = r.rgba[0];
        buf[idx + 1] = r.rgba[1];
        buf[idx + 2] = r.rgba[2];
        buf[idx + 3] = r.rgba[3];
      }
    }
  }
  return buf;
}

export async function makeSyntheticRgbaPng(
  width: number,
  height: number,
  rects: readonly {
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
    readonly rgba: readonly [number, number, number, number];
  }[],
): Promise<Uint8Array> {
  return encodeRgbaPng(width, height, makeSolidRectRgba(width, height, rects));
}

const PNG_SIG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]!) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function writeU32BE(out: Uint8Array, offset: number, val: number): void {
  out[offset] = (val >>> 24) & 0xff;
  out[offset + 1] = (val >>> 16) & 0xff;
  out[offset + 2] = (val >>> 8) & 0xff;
  out[offset + 3] = val & 0xff;
}

function makeChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(12 + data.length);
  writeU32BE(chunk, 0, data.length);
  chunk[4] = type.charCodeAt(0);
  chunk[5] = type.charCodeAt(1);
  chunk[6] = type.charCodeAt(2);
  chunk[7] = type.charCodeAt(3);
  chunk.set(data, 8);
  writeU32BE(chunk, 8 + data.length, crc32(chunk.subarray(4, 8 + data.length)));
  return chunk;
}

async function deflateZlib(raw: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream('deflate');
  const w = cs.writable.getWriter();
  const r = cs.readable.getReader();
  const wp = (async () => {
    const copy = new Uint8Array(raw.byteLength);
    copy.set(raw);
    await w.write(copy);
    await w.close();
  })();
  const chunks: Uint8Array[] = [];
  const rp = (async () => {
    while (true) {
      const { value, done } = await r.read();
      if (done) break;
      if (value) chunks.push(value);
    }
  })();
  await Promise.all([wp, rp]);
  const total = chunks.reduce((s, c) => s + c.byteLength, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const c of chunks) {
    out.set(c, pos);
    pos += c.byteLength;
  }
  return out;
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/**
 * Encodes an RGBA image using rotating PNG scanline filters (Sub, Up, Average, Paeth)
 * so tests can verify the PNG decoder handles every filter mode accurately.
 */
export async function encodeFilteredRgbaPng(
  width: number,
  height: number,
  rgba: Uint8ClampedArray,
  filterPerRow: readonly number[],
): Promise<Uint8Array> {
  const ihdr = new Uint8Array(13);
  writeU32BE(ihdr, 0, width);
  writeU32BE(ihdr, 4, height);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const stride = width * 4;
  const bpp = 4;
  const raw = new Uint8Array(height * (1 + stride));

  for (let y = 0; y < height; y++) {
    const filter = filterPerRow[y % filterPerRow.length] ?? 0;
    const rowOutStart = y * (1 + stride);
    raw[rowOutStart] = filter;
    const rowSrcStart = y * stride;
    const prevSrcStart = (y - 1) * stride;

    for (let i = 0; i < stride; i++) {
      const x = rgba[rowSrcStart + i]!;
      const left = i >= bpp ? rgba[rowSrcStart + i - bpp]! : 0;
      const up = y > 0 ? rgba[prevSrcStart + i]! : 0;
      const upLeft = y > 0 && i >= bpp ? rgba[prevSrcStart + i - bpp]! : 0;

      let pred = 0;
      if (filter === 1) pred = left;
      else if (filter === 2) pred = up;
      else if (filter === 3) pred = (left + up) >> 1;
      else if (filter === 4) pred = paeth(left, up, upLeft);

      raw[rowOutStart + 1 + i] = (x - pred) & 0xff;
    }
  }

  const idat = await deflateZlib(raw);
  const parts = [
    PNG_SIG,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', new Uint8Array(0)),
  ];
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) {
    out.set(p, pos);
    pos += p.length;
  }
  return out;
}

/**
 * Encodes a synthetic indexed-color (colorType=3) PNG with PLTE + tRNS chunks.
 */
export async function encodeIndexedPng(
  width: number,
  height: number,
  indices: Uint8Array,
  paletteRgb: Uint8Array,
  trnsAlpha?: Uint8Array,
): Promise<Uint8Array> {
  const ihdr = new Uint8Array(13);
  writeU32BE(ihdr, 0, width);
  writeU32BE(ihdr, 4, height);
  ihdr[8] = 8;
  ihdr[9] = 3;

  const raw = new Uint8Array(height * (1 + width));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width)] = 0;
    raw.set(indices.subarray(y * width, (y + 1) * width), y * (1 + width) + 1);
  }
  const idat = await deflateZlib(raw);

  const parts = [
    PNG_SIG,
    makeChunk('IHDR', ihdr),
    makeChunk('PLTE', paletteRgb),
    ...(trnsAlpha ? [makeChunk('tRNS', trnsAlpha)] : []),
    makeChunk('IDAT', idat),
    makeChunk('IEND', new Uint8Array(0)),
  ];
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) {
    out.set(p, pos);
    pos += p.length;
  }
  return out;
}

/**
 * Encodes an Adam7 interlaced RGBA (colorType=6) PNG to verify pass extraction.
 */
export async function encodeInterlacedRgbaPng(
  width: number,
  height: number,
  rgba: Uint8ClampedArray,
): Promise<Uint8Array> {
  const ihdr = new Uint8Array(13);
  writeU32BE(ihdr, 0, width);
  writeU32BE(ihdr, 4, height);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[12] = 1; // Adam7 interlace

  const xStart = [0, 4, 0, 2, 0, 1, 0];
  const xStep = [8, 8, 4, 4, 2, 2, 1];
  const yStart = [0, 0, 4, 0, 2, 0, 1];
  const yStep = [8, 8, 8, 4, 4, 2, 2];

  const passChunks: Uint8Array[] = [];
  for (let pass = 0; pass < 7; pass++) {
    const pw = width <= xStart[pass]! ? 0 : Math.ceil((width - xStart[pass]!) / xStep[pass]!);
    const ph = height <= yStart[pass]! ? 0 : Math.ceil((height - yStart[pass]!) / yStep[pass]!);
    if (pw === 0 || ph === 0) continue;
    const stride = pw * 4;
    const passBuf = new Uint8Array(ph * (1 + stride));
    for (let py = 0; py < ph; py++) {
      const iy = yStart[pass]! + py * yStep[pass]!;
      const rowOffset = py * (1 + stride);
      passBuf[rowOffset] = 0; // filter None
      for (let px = 0; px < pw; px++) {
        const ix = xStart[pass]! + px * xStep[pass]!;
        const src = (iy * width + ix) * 4;
        const dst = rowOffset + 1 + px * 4;
        passBuf[dst] = rgba[src]!;
        passBuf[dst + 1] = rgba[src + 1]!;
        passBuf[dst + 2] = rgba[src + 2]!;
        passBuf[dst + 3] = rgba[src + 3]!;
      }
    }
    passChunks.push(passBuf);
  }

  const totalRaw = passChunks.reduce((s, c) => s + c.byteLength, 0);
  const raw = new Uint8Array(totalRaw);
  let rawPos = 0;
  for (const c of passChunks) {
    raw.set(c, rawPos);
    rawPos += c.byteLength;
  }

  const idat = await deflateZlib(raw);
  const parts = [
    PNG_SIG,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', new Uint8Array(0)),
  ];
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) {
    out.set(p, pos);
    pos += p.length;
  }
  return out;
}
