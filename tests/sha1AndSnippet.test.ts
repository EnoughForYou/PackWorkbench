import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  generateServerPropertiesSnippet,
  validateResourcePackZip,
} from '../src/core/report.ts';
import { computeSha1ChunkedHex } from '../src/core/sha1Stream.ts';
import { buildMinimalValidPackZip } from './helpers/syntheticPack.ts';

describe('PRD Case 8: Streaming SHA-1 & server.properties snippet', () => {
  it('computes exact lowercase 40-char SHA-1 matching Node crypto and Windows Get-FileHash across multiple chunks', async () => {
    const zipBytes = await buildMinimalValidPackZip({
      pack: {
        description: 'SHA-1 Verification Fixture',
        min_format: [69, 0],
        max_format: 97,
      },
    });

    // Force multi-chunk streaming with a tiny chunk size (e.g. 64 bytes)
    const progressEvents: number[] = [];
    const streamedHex = computeSha1ChunkedHex(zipBytes, 64, (ratio) => {
      progressEvents.push(ratio);
    });

    expect(streamedHex).toMatch(/^[a-f0-9]{40}$/);
    expect(progressEvents.length).toBeGreaterThan(1);
    expect(progressEvents[progressEvents.length - 1]).toBe(1);

    const nodeCryptoHex = crypto
      .createHash('sha1')
      .update(zipBytes)
      .digest('hex');
    expect(streamedHex).toBe(nodeCryptoHex);

    // Compare against external OS utility (PowerShell Get-FileHash on Windows)
    if (process.platform === 'win32') {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-rp-sha1-'));
      const tmpZip = path.join(tmpDir, 'fixture.zip');
      try {
        fs.writeFileSync(tmpZip, zipBytes);
        const systemHex = execFileSync(
          'powershell.exe',
          [
            '-NoProfile',
            '-NonInteractive',
            '-Command',
            `(Get-FileHash -LiteralPath '${tmpZip.replace(/'/g, "''")}' -Algorithm SHA1).Hash.ToLowerInvariant()`,
          ],
          { encoding: 'utf8' },
        ).trim();
        expect(streamedHex).toBe(systemHex);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    }
  });

  it('handles empty zero-byte input safely', () => {
    const emptyHash = computeSha1ChunkedHex(new Uint8Array(0));
    expect(emptyHash).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709');
  });

  it('auto-detects target version when validateResourcePackZip is called without explicit targetVersion', async () => {
    const pack26_2 = await buildMinimalValidPackZip({
      pack: {
        description: 'Pack for 26.2',
        min_format: [88, 0],
        max_format: 88,
      },
    });
    const report = await validateResourcePackZip({
      fileName: 'pack-26.2.zip',
      fileSizeBytes: pack26_2.byteLength,
      data: pack26_2,
    });
    expect(report.targetVersion).toBe('26.2');
    expect(report.summary.errors).toBe(0);
  });

  it('generates server.properties default 3 lines and optional resource-pack-id / prompt', () => {
    const sha1Hex = 'a'.repeat(40);
    const defaultSnippet = generateServerPropertiesSnippet({
      downloadUrl: '  https://cdn.example.com/pack.zip  ',
      sha1Hex: sha1Hex.toUpperCase(),
    });
    expect(defaultSnippet).toBe(
      [
        'resource-pack=https://cdn.example.com/pack.zip',
        `resource-pack-sha1=${sha1Hex}`,
        'require-resource-pack=true',
      ].join('\n'),
    );

    const fullSnippet = generateServerPropertiesSnippet({
      downloadUrl: '',
      sha1Hex,
      requireResourcePack: false,
      includeResourcePackId: true,
      resourcePackId: '12345678-1234-4234-8234-1234567890ab',
      includeResourcePackPrompt: true,
      resourcePackPrompt: '{"text":"Pasang pack"}',
    });
    expect(fullSnippet).toBe(
      [
        'resource-pack=https://example.com/resourcepack.zip',
        `resource-pack-sha1=${sha1Hex}`,
        'require-resource-pack=false',
        'resource-pack-id=12345678-1234-4234-8234-1234567890ab',
        'resource-pack-prompt={"text":"Pasang pack"}',
      ].join('\n'),
    );
  });
});
