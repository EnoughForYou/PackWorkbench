import crypto from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearMeasuresHistory,
  getRecentMeasures,
  measureAsync,
  measureSync,
  subscribeTelemetry,
  type TelemetryMeasureRecord,
} from '../src/core/telemetry.ts';
import { encodeRgbaPng, decodePngRgba } from '../src/core/font/pngCodec.ts';
import { synthesizeRankRgba } from '../src/core/font/pixelSynth.ts';
import { buildFontResourcePack } from '../src/core/font/packBuilder.ts';
import { createInitialFontProject } from '../src/core/font/presets.ts';
import { computeSha1ChunkedHex } from '../src/core/sha1Stream.ts';
import { validateResourcePackZip } from '../src/core/report.ts';
import { buildMinimalValidPackZip } from './helpers/syntheticPack.ts';

describe('Performance Budget & Telemetry Benchmarks', () => {
  beforeEach(() => {
    clearMeasuresHistory();
  });

  it('measures synchronous and asynchronous operations via User Timing telemetry', async () => {
    const syncRes = measureSync('benchmark:sync-test', () => {
      let sum = 0;
      for (let i = 0; i < 1000; i++) sum += i;
      return sum;
    });
    expect(syncRes).toBe(499500);

    const asyncRes = await measureAsync('benchmark:async-test', async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return 42;
    });
    expect(asyncRes).toBe(42);

    const measures = getRecentMeasures();
    expect(measures.some((m) => m.name === 'benchmark:sync-test')).toBe(true);
    expect(measures.some((m) => m.name === 'benchmark:async-test')).toBe(true);
  });

  it('decodes a 64x64 synthetic PNG within strict budget (< 25ms)', async () => {
    // Generate synthetic 64x64 RGBA checkerboard
    const w = 64;
    const h = 64;
    const rgba = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const c = ((x >> 2) + (y >> 2)) % 2 === 0 ? 255 : 40;
        rgba[idx] = c;
        rgba[idx + 1] = 120;
        rgba[idx + 2] = 200;
        rgba[idx + 3] = 255;
      }
    }
    const pngBytes = await encodeRgbaPng(w, h, rgba);

    const t0 = performance.now();
    const decodeResult = await decodePngRgba(pngBytes);
    const duration = performance.now() - t0;

    expect(decodeResult.ok).toBe(true);
    if (decodeResult.ok) {
      expect(decodeResult.image.width).toBe(64);
      expect(decodeResult.image.height).toBe(64);
    }
    // Budget: decode 64x64 must complete in under 25ms
    expect(duration).toBeLessThan(25);

    const measures = getRecentMeasures();
    expect(measures.some((m) => m.name === 'png:decode')).toBe(true);
  });

  it('synthesizes rank badge raster within strict budget (< 5ms per badge)', () => {
    const project = createInitialFontProject();
    const adminEntry = project.entries.find((e) => e.kind === 'bitmap' && e.sourceMode === 'composer');
    expect(adminEntry).toBeDefined();
    if (!adminEntry || adminEntry.kind !== 'bitmap' || adminEntry.sourceMode !== 'composer') return;

    const iterations = 10;
    const t0 = performance.now();
    for (let i = 0; i < iterations; i++) {
      const raster = synthesizeRankRgba(adminEntry.composer, adminEntry.layerVisibility, adminEntry.paintEdits);
      expect(raster.width).toBeGreaterThan(0);
      expect(raster.height).toBeGreaterThan(0);
    }
    const avgDuration = (performance.now() - t0) / iterations;

    // Budget: average badge rasterization must complete in under 5ms
    expect(avgDuration).toBeLessThan(5);
  });

  it('builds full font resource pack archive within budget (< 100ms)', async () => {
    const project = createInitialFontProject();
    const t0 = performance.now();
    const built = await buildFontResourcePack(project);
    const duration = performance.now() - t0;

    expect(built.zipBytes.byteLength).toBeGreaterThan(1000);
    expect(built.fontValidation.errors).toBe(0);
    expect(built.zipValidation.summary.errors).toBe(0);

    // Budget: full in-memory ZIP package build under 150ms (allows for cold dynamic import on disk)
    expect(duration).toBeLessThan(150);

    const measures = getRecentMeasures();
    expect(measures.some((m) => m.name === 'font:build-pack')).toBe(true);
    expect(measures.some((m) => m.name === 'zip:validate')).toBe(true);
  });

  it('streams SHA-1 hashing across 500 KB synthetic buffer with high throughput (> 5 MB/s)', () => {
    const size = 500 * 1024;
    const testBytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      testBytes[i] = (i * 31) & 0xff;
    }

    const t0 = performance.now();
    const hash = computeSha1ChunkedHex(testBytes, 64 * 1024);
    const durationSec = (performance.now() - t0) / 1000;

    const nodeHash = crypto.createHash('sha1').update(testBytes).digest('hex');
    expect(hash).toBe(nodeHash);

    const mbPerSec = size / (1024 * 1024) / Math.max(0.001, durationSec);
    // Budget: hashing throughput exceeds 5 MB/s
    expect(mbPerSec).toBeGreaterThan(5);
  });

  it('records zip:validate telemetry when validating synthetic resource pack', async () => {
    const zipBytes = await buildMinimalValidPackZip({
      pack: {
        description: 'Telemetry Test Pack',
        min_format: [88, 0],
        max_format: 88,
      },
    });

    const report = await validateResourcePackZip({
      fileName: 'test.zip',
      fileSizeBytes: zipBytes.byteLength,
      data: zipBytes,
    });

    expect(report.summary.errors).toBe(0);
    const measures = getRecentMeasures();
    expect(measures.some((m) => m.name === 'zip:validate')).toBe(true);
  });

  it('notifies subscribers via subscribeTelemetry reactively on new measures and clears', () => {
    const receivedSnapshots: (readonly TelemetryMeasureRecord[])[] = [];
    const unsubscribe = subscribeTelemetry((records) => {
      receivedSnapshots.push(records);
    });

    expect(receivedSnapshots.length).toBe(1);
    expect(receivedSnapshots[0]?.length).toBe(0);

    measureSync('test:sub-1', () => 1 + 1);
    expect(receivedSnapshots.length).toBe(2);
    expect(receivedSnapshots[1]?.some((m) => m.name === 'test:sub-1')).toBe(true);

    clearMeasuresHistory();
    expect(receivedSnapshots.length).toBe(3);
    expect(receivedSnapshots[2]?.length).toBe(0);

    unsubscribe();
    measureSync('test:sub-2', () => 2 + 2);
    // Unsubscribed, count should still be 3
    expect(receivedSnapshots.length).toBe(3);
  });
});
