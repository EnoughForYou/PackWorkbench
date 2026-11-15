import type { PngDecodeResult } from './types.ts';

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]!) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function readU32BE(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset]! << 24) |
      (bytes[offset + 1]! << 16) |
      (bytes[offset + 2]! << 8) |
      bytes[offset + 3]!) >>>
    0
  );
}

function writeU32BE(target: Uint8Array, offset: number, value: number): void {
  target[offset] = (value >>> 24) & 0xff;
  target[offset + 1] = (value >>> 16) & 0xff;
  target[offset + 2] = (value >>> 8) & 0xff;
  target[offset + 3] = value & 0xff;
}

function concatUint8Arrays(chunks: readonly Uint8Array[]): Uint8Array {
  let total = 0;
  for (const chunk of chunks) {
    total += chunk.byteLength;
  }
  const out = new Uint8Array(total);
  let pos = 0;
  for (const chunk of chunks) {
    out.set(chunk, pos);
    pos += chunk.byteLength;
  }
  return out;
}

async function runStreamTransform(
  input: Uint8Array,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();

  const writePromise = (async () => {
    const copy = new Uint8Array(input.byteLength);
    copy.set(input);
    await writer.write(copy);
    await writer.close();
  })();

  const chunks: Uint8Array[] = [];
  const readPromise = (async () => {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
  })();

  await Promise.all([writePromise, readPromise]);
  return concatUint8Arrays(chunks);
}

async function inflateZlib(compressed: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('DecompressionStream tidak tersedia pada runtime ini.');
  }
  return runStreamTransform(compressed, new DecompressionStream('deflate'));
}

async function deflateZlib(raw: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream === 'undefined') {
    throw new Error('CompressionStream tidak tersedia pada runtime ini.');
  }
  return runStreamTransform(raw, new CompressionStream('deflate'));
}

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function unfilterScanline(
  filterType: number,
  rowBytes: Uint8Array,
  prevRow: Uint8Array,
  bpp: number,
  out: Uint8Array,
): boolean {
  const len = rowBytes.length;
  switch (filterType) {
    case 0: // None
      out.set(rowBytes);
      return true;
    case 1: // Sub
      for (let i = 0; i < len; i++) {
        const left = i >= bpp ? out[i - bpp]! : 0;
        out[i] = (rowBytes[i]! + left) & 0xff;
      }
      return true;
    case 2: // Up
      for (let i = 0; i < len; i++) {
        out[i] = (rowBytes[i]! + prevRow[i]!) & 0xff;
      }
      return true;
    case 3: // Average
      for (let i = 0; i < len; i++) {
        const left = i >= bpp ? out[i - bpp]! : 0;
        const up = prevRow[i]!;
        out[i] = (rowBytes[i]! + ((left + up) >> 1)) & 0xff;
      }
      return true;
    case 4: // Paeth
      for (let i = 0; i < len; i++) {
        const left = i >= bpp ? out[i - bpp]! : 0;
        const up = prevRow[i]!;
        const upLeft = i >= bpp ? prevRow[i - bpp]! : 0;
        out[i] = (rowBytes[i]! + paethPredictor(left, up, upLeft)) & 0xff;
      }
      return true;
    default:
      return false;
  }
}

function getChannelsForColorType(colorType: number): number {
  switch (colorType) {
    case 0:
      return 1; // Grayscale
    case 2:
      return 3; // RGB
    case 3:
      return 1; // Indexed palette
    case 4:
      return 2; // Grayscale + Alpha
    case 6:
      return 4; // RGBA
    default:
      return 0;
  }
}

function readPixelSample(
  scanline: Uint8Array,
  pxIndex: number,
  channels: number,
  bitDepth: number,
): number[] {
  if (bitDepth === 8) {
    const base = pxIndex * channels;
    const out: number[] = [];
    for (let c = 0; c < channels; c++) {
      out.push(scanline[base + c]!);
    }
    return out;
  }

  if (bitDepth === 16) {
    const base = pxIndex * channels * 2;
    const out: number[] = [];
    for (let c = 0; c < channels; c++) {
      // Preserve exact 16-bit value so 16-bit tRNS comparison stays lossless before scaling to 8-bit
      out.push((scanline[base + c * 2]! << 8) | scanline[base + c * 2 + 1]!);
    }
    return out;
  }

  // Sub-byte bit depths (1, 2, 4) only apply to colorType 0 or 3 (1 channel)
  const samplesPerByte = 8 / bitDepth;
  const byteIndex = Math.floor(pxIndex / samplesPerByte);
  const posInByte = pxIndex % samplesPerByte;
  const shift = 8 - bitDepth * (posInByte + 1);
  const mask = (1 << bitDepth) - 1;
  return [(scanline[byteIndex]! >>> shift) & mask];
}

function writeRgbaPixel(
  rgba: Uint8ClampedArray,
  pixelOffset: number,
  sample: readonly number[],
  colorType: number,
  bitDepth: number,
  palette: Uint8Array | null,
  trns: Uint8Array | null,
): void {
  const maxSample = (1 << Math.min(bitDepth, 8)) - 1;
  const scaleTo8 = (val: number) =>
    bitDepth === 16
      ? val >>> 8
      : bitDepth === 8
        ? val
        : Math.round((val * 255) / maxSample);

  const dst = pixelOffset * 4;
  if (colorType === 6) {
    rgba[dst] = scaleTo8(sample[0]!);
    rgba[dst + 1] = scaleTo8(sample[1]!);
    rgba[dst + 2] = scaleTo8(sample[2]!);
    rgba[dst + 3] = scaleTo8(sample[3]!);
    return;
  }
  if (colorType === 2) {
    const rawR = sample[0]!;
    const rawG = sample[1]!;
    const rawB = sample[2]!;
    let a = 255;
    if (trns && trns.length >= 6) {
      const tr = (trns[0]! << 8) | trns[1]!;
      const tg = (trns[2]! << 8) | trns[3]!;
      const tb = (trns[4]! << 8) | trns[5]!;
      if (rawR === tr && rawG === tg && rawB === tb) a = 0;
    }
    rgba[dst] = scaleTo8(rawR);
    rgba[dst + 1] = scaleTo8(rawG);
    rgba[dst + 2] = scaleTo8(rawB);
    rgba[dst + 3] = a;
    return;
  }
  if (colorType === 0) {
    const raw = sample[0]!;
    const g = scaleTo8(raw);
    let a = 255;
    if (trns && trns.length >= 2) {
      const tVal = (trns[0]! << 8) | trns[1]!;
      if (raw === tVal) a = 0;
    }
    rgba[dst] = g;
    rgba[dst + 1] = g;
    rgba[dst + 2] = g;
    rgba[dst + 3] = a;
    return;
  }
  if (colorType === 4) {
    const g = scaleTo8(sample[0]!);
    rgba[dst] = g;
    rgba[dst + 1] = g;
    rgba[dst + 2] = g;
    rgba[dst + 3] = scaleTo8(sample[1]!);
    return;
  }
  if (colorType === 3) {
    const idx = sample[0]!;
    if (palette && idx * 3 + 2 < palette.length) {
      rgba[dst] = palette[idx * 3]!;
      rgba[dst + 1] = palette[idx * 3 + 1]!;
      rgba[dst + 2] = palette[idx * 3 + 2]!;
      rgba[dst + 3] = trns && idx < trns.length ? trns[idx]! : 255;
    }
  }
}

const ADAM7_X_START = [0, 4, 0, 2, 0, 1, 0];
const ADAM7_X_STEP = [8, 8, 4, 4, 2, 2, 1];
const ADAM7_Y_START = [0, 0, 4, 0, 2, 0, 1];
const ADAM7_Y_STEP = [8, 8, 8, 4, 4, 2, 2];

/**
 * Pure PNG RGBA decoder for Node 18+ and modern browsers (no external dependencies).
 * Supports color types 0, 2, 3 (PLTE+tRNS), 4, 6; bit depths 1/2/4/8/16;
 * all 5 PNG scanline filters (None/Sub/Up/Average/Paeth); and Adam7 interlacing.
 */
export async function decodePngRgba(bytes: Uint8Array): Promise<PngDecodeResult> {
  if (bytes.byteLength < 8 + 12 + 13) {
    return {
      ok: false,
      error: 'Ukuran berkas terlalu kecil untuk header PNG yang valid.',
    };
  }

  for (let i = 0; i < PNG_SIGNATURE.length; i++) {
    if (bytes[i] !== PNG_SIGNATURE[i]) {
      return {
        ok: false,
        error: 'Signature berkas bukan PNG standar (harus diawali 89 50 4E 47).',
      };
    }
  }

  let offset = 8;
  let ihdrParsed = false;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let compression = 0;
  let filterMethod = 0;
  let interlace = 0;
  let palette: Uint8Array | null = null;
  let trns: Uint8Array | null = null;
  const idatChunks: Uint8Array[] = [];
  let sawIend = false;

  while (offset + 12 <= bytes.byteLength) {
    const length = readU32BE(bytes, offset);
    const type = String.fromCharCode(
      bytes[offset + 4]!,
      bytes[offset + 5]!,
      bytes[offset + 6]!,
      bytes[offset + 7]!,
    );
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > bytes.byteLength) {
      return {
        ok: false,
        error: `Chunk PNG "${type}" terpotong sebelum akhir berkas.`,
      };
    }

    const chunkData = bytes.subarray(dataStart, dataEnd);
    const expectedCrc = readU32BE(bytes, dataEnd);
    const actualCrc = crc32(bytes.subarray(offset + 4, dataEnd));
    if (expectedCrc !== actualCrc) {
      return {
        ok: false,
        error: `CRC chunk "${type}" tidak cocok (berkas korup).`,
      };
    }

    if (type === 'IHDR') {
      if (length !== 13) {
        return { ok: false, error: 'Chunk IHDR PNG tidak berukuran 13 byte.' };
      }
      width = readU32BE(chunkData, 0);
      height = readU32BE(chunkData, 4);
      bitDepth = chunkData[8]!;
      colorType = chunkData[9]!;
      compression = chunkData[10]!;
      filterMethod = chunkData[11]!;
      interlace = chunkData[12]!;
      ihdrParsed = true;
    } else if (type === 'PLTE') {
      palette = new Uint8Array(chunkData);
    } else if (type === 'tRNS') {
      trns = new Uint8Array(chunkData);
    } else if (type === 'IDAT') {
      idatChunks.push(chunkData);
    } else if (type === 'IEND') {
      sawIend = true;
      break;
    }

    offset = dataEnd + 4;
  }

  if (!ihdrParsed || !sawIend) {
    return {
      ok: false,
      error: !ihdrParsed
        ? 'Chunk header IHDR tidak ditemukan.'
        : 'Chunk penutup IEND tidak ditemukan.',
    };
  }

  if (width === 0 || height === 0 || width > 16384 || height > 16384) {
    return {
      ok: false,
      error: `Dimensi PNG tidak valid (${width}×${height}).`,
    };
  }

  const channels = getChannelsForColorType(colorType);
  if (channels === 0) {
    return {
      ok: false,
      error: `Tipe warna PNG (${colorType}) tidak dikenali.`,
    };
  }

  const validBitDepths =
    colorType === 0
      ? [1, 2, 4, 8, 16]
      : colorType === 3
        ? [1, 2, 4, 8]
        : [8, 16];
  if (!validBitDepths.includes(bitDepth)) {
    return {
      ok: false,
      error: `Kombinasi colorType=${colorType} dan bitDepth=${bitDepth} tidak valid pada spesifikasi PNG.`,
    };
  }

  if (compression !== 0 || filterMethod !== 0 || (interlace !== 0 && interlace !== 1)) {
    return {
      ok: false,
      error: 'Metode kompresi, filter, atau interlace PNG tidak didukung.',
    };
  }

  if (colorType === 3 && !palette) {
    return {
      ok: false,
      error: 'PNG indexed-color tidak memiliki chunk palet PLTE.',
    };
  }

  if (idatChunks.length === 0) {
    return { ok: false, error: 'PNG tidak memiliki data piksel IDAT.' };
  }

  let decompressed: Uint8Array;
  try {
    decompressed = await inflateZlib(concatUint8Arrays(idatChunks));
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      error: `Gagal mendekompresi aliran zlib IDAT PNG: ${detail}`,
    };
  }

  const bpp = Math.max(1, Math.ceil((channels * bitDepth) / 8));
  const rgba = new Uint8ClampedArray(width * height * 4);
  let cursor = 0;

  if (interlace === 0) {
    const stride = Math.ceil((width * channels * bitDepth) / 8);
    const expectedLength = height * (1 + stride);
    if (decompressed.byteLength < expectedLength) {
      return {
        ok: false,
        error: `Data IDAT PNG terpotong (${decompressed.byteLength} < ${expectedLength} byte).`,
      };
    }

    let prevRow = new Uint8Array(stride);
    let currRow = new Uint8Array(stride);
    for (let y = 0; y < height; y++) {
      const filterType = decompressed[cursor++]!;
      const rawScanline = decompressed.subarray(cursor, cursor + stride);
      cursor += stride;
      if (!unfilterScanline(filterType, rawScanline, prevRow, bpp, currRow)) {
        return {
          ok: false,
          error: `Tipe filter scanline PNG tidak valid (${filterType}) di baris ${y}.`,
        };
      }
      for (let x = 0; x < width; x++) {
        const sample = readPixelSample(currRow, x, channels, bitDepth);
        writeRgbaPixel(
          rgba,
          y * width + x,
          sample,
          colorType,
          bitDepth,
          palette,
          trns,
        );
      }
      const tmp = prevRow;
      prevRow = currRow;
      currRow = tmp;
    }
  } else {
    for (let pass = 0; pass < 7; pass++) {
      const xStart = ADAM7_X_START[pass]!;
      const xStep = ADAM7_X_STEP[pass]!;
      const yStart = ADAM7_Y_START[pass]!;
      const yStep = ADAM7_Y_STEP[pass]!;

      const passWidth =
        width <= xStart ? 0 : Math.ceil((width - xStart) / xStep);
      const passHeight =
        height <= yStart ? 0 : Math.ceil((height - yStart) / yStep);

      if (passWidth === 0 || passHeight === 0) {
        continue;
      }

      const stride = Math.ceil((passWidth * channels * bitDepth) / 8);
      if (cursor + passHeight * (1 + stride) > decompressed.byteLength) {
        return {
          ok: false,
          error: `Data IDAT interlaced pass ${pass + 1} tidak lengkap.`,
        };
      }

      let prevRow = new Uint8Array(stride);
      let currRow = new Uint8Array(stride);
      for (let py = 0; py < passHeight; py++) {
        const filterType = decompressed[cursor++]!;
        const rawScanline = decompressed.subarray(cursor, cursor + stride);
        cursor += stride;
        if (!unfilterScanline(filterType, rawScanline, prevRow, bpp, currRow)) {
          return {
            ok: false,
            error: `Tipe filter scanline PNG interlaced tidak valid (${filterType}).`,
          };
        }
        const imgY = yStart + py * yStep;
        for (let px = 0; px < passWidth; px++) {
          const imgX = xStart + px * xStep;
          const sample = readPixelSample(currRow, px, channels, bitDepth);
          writeRgbaPixel(
            rgba,
            imgY * width + imgX,
            sample,
            colorType,
            bitDepth,
            palette,
            trns,
          );
        }
        const tmp = prevRow;
        prevRow = currRow;
        currRow = tmp;
      }
    }
  }

  return {
    ok: true,
    image: {
      width,
      height,
      rgba,
      hasAlphaChannel: colorType === 4 || colorType === 6 || trns !== null,
      colorType,
      bitDepth,
      interlace,
    },
  };
}

function buildPngChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(12 + data.byteLength);
  writeU32BE(chunk, 0, data.byteLength);
  chunk[4] = type.charCodeAt(0);
  chunk[5] = type.charCodeAt(1);
  chunk[6] = type.charCodeAt(2);
  chunk[7] = type.charCodeAt(3);
  chunk.set(data, 8);
  const crc = crc32(chunk.subarray(4, 8 + data.byteLength));
  writeU32BE(chunk, 8 + data.byteLength, crc);
  return chunk;
}

/**
 * Pure RGBA PNG encoder (colorType=6, bitDepth=8) using built-in CompressionStream('deflate').
 * Works identically in Node 18+ and browsers without external libraries.
 */
export async function encodeRgbaPng(
  width: number,
  height: number,
  rgba: Uint8Array | Uint8ClampedArray,
): Promise<Uint8Array> {
  if (width <= 0 || height <= 0) {
    throw new Error(`Dimensi PNG harus positif (${width}×${height}).`);
  }
  const expectedBytes = width * height * 4;
  if (rgba.byteLength !== expectedBytes) {
    throw new Error(
      `Panjang buffer RGBA (${rgba.byteLength}) tidak cocok dengan ${width}×${height}×4 (${expectedBytes}).`,
    );
  }

  const ihdr = new Uint8Array(13);
  writeU32BE(ihdr, 0, width);
  writeU32BE(ihdr, 4, height);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression deflate
  ihdr[11] = 0; // adaptive filter
  ihdr[12] = 0; // no interlace

  const stride = width * 4;
  const rawScanlines = new Uint8Array(height * (1 + stride));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + stride);
    rawScanlines[rowStart] = 0; // filter None
    const srcStart = y * stride;
    rawScanlines.set(rgba.subarray(srcStart, srcStart + stride), rowStart + 1);
  }

  const compressedIdat = await deflateZlib(rawScanlines);

  return concatUint8Arrays([
    PNG_SIGNATURE,
    buildPngChunk('IHDR', ihdr),
    buildPngChunk('IDAT', compressedIdat),
    buildPngChunk('IEND', new Uint8Array(0)),
  ]);
}
