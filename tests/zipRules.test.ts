import { describe, expect, it } from 'vitest';
import { validateResourcePackZip } from '../src/core/report.ts';
import { MAX_SERVER_PACK_BYTES } from '../src/core/versions.ts';
import { extractNestedZipEntry } from '../src/core/zipReader.ts';
import {
  buildMinimalValidPackZip,
  buildSyntheticZip,
} from './helpers/syntheticPack.ts';

const VALID_MCMETA_1_21_1 = {
  pack: {
    description: 'Synthetic Pack',
    pack_format: 34,
  },
};

describe('ZIP structural rules Z01–Z09 (pass & fail)', () => {
  it('Z01 passes when pack.mcmeta is at root and fails when missing everywhere', async () => {
    const validBytes = await buildMinimalValidPackZip(VALID_MCMETA_1_21_1);
    const validReport = await validateResourcePackZip(
      {
        fileName: 'valid.zip',
        fileSizeBytes: validBytes.byteLength,
        data: validBytes,
      },
      '1.21.1',
    );
    expect(validReport.findings.some((f) => f.id === 'Z01')).toBe(false);
    expect(validReport.summary.errors).toBe(0);

    const missingBytes = await buildSyntheticZip([
      { path: 'assets/mypack/textures/item/test.png' },
    ]);
    const missingReport = await validateResourcePackZip(
      {
        fileName: 'missing.zip',
        fileSizeBytes: missingBytes.byteLength,
        data: missingBytes,
      },
      '1.21.1',
    );
    const z01 = missingReport.findings.find((f) => f.id === 'Z01');
    expect(z01).toBeDefined();
    expect(z01?.severity).toBe('ERROR');
  });

  it('Z02 detects wrapper folder with folder name and avoids duplicate Z01', async () => {
    const wrappedBytes = await buildMinimalValidPackZip(VALID_MCMETA_1_21_1, {
      wrapperFolder: 'MyCoolPack',
    });
    const report = await validateResourcePackZip(
      {
        fileName: 'wrapped.zip',
        fileSizeBytes: wrappedBytes.byteLength,
        data: wrappedBytes,
      },
      '1.21.1',
    );
    const z02 = report.findings.find((f) => f.id === 'Z02');
    expect(z02).toBeDefined();
    expect(z02?.severity).toBe('ERROR');
    expect(z02?.message).toContain('MyCoolPack');
    expect(z02?.fixHint).toContain('MyCoolPack');
    expect(report.findings.some((f) => f.id === 'Z01')).toBe(false);
    expect(report.findings.some((f) => f.id === 'Z04')).toBe(false);
  });

  it('Z03 passes on valid zip and emits ERROR on corrupt/non-zip bytes', async () => {
    const junkData = new TextEncoder().encode('not-a-valid-zip-archive');
    const report = await validateResourcePackZip(
      {
        fileName: 'fake.zip',
        fileSizeBytes: junkData.byteLength,
        data: junkData,
      },
      '1.21.10',
    );
    const z03 = report.findings.find((f) => f.id === 'Z03');
    expect(z03).toBeDefined();
    expect(z03?.severity).toBe('ERROR');
  });

  it('Z04 warns when assets/ folder is missing and passes when present', async () => {
    const noAssetsBytes = await buildMinimalValidPackZip(VALID_MCMETA_1_21_1, {
      includeAssets: false,
    });
    const report = await validateResourcePackZip(
      {
        fileName: 'no-assets.zip',
        fileSizeBytes: noAssetsBytes.byteLength,
        data: noAssetsBytes,
      },
      '1.21.1',
    );
    const z04 = report.findings.find((f) => f.id === 'Z04');
    expect(z04?.severity).toBe('WARN');

    const withAssetsBytes = await buildMinimalValidPackZip(VALID_MCMETA_1_21_1, {
      includeAssets: true,
    });
    const passReport = await validateResourcePackZip(
      {
        fileName: 'with-assets.zip',
        fileSizeBytes: withAssetsBytes.byteLength,
        data: withAssetsBytes,
      },
      '1.21.1',
    );
    expect(passReport.findings.some((f) => f.id === 'Z04')).toBe(false);
  });

  it('Z05 flags OS junk files (__MACOSX, .DS_Store, Thumbs.db, desktop.ini)', async () => {
    const dirtyBytes = await buildMinimalValidPackZip(VALID_MCMETA_1_21_1, {
      extraFiles: [
        { path: '__MACOSX/._pack.mcmeta' },
        { path: '.DS_Store' },
        { path: 'assets/mypack/Thumbs.db' },
        { path: 'desktop.ini' },
      ],
    });
    const dirtyReport = await validateResourcePackZip(
      {
        fileName: 'dirty.zip',
        fileSizeBytes: dirtyBytes.byteLength,
        data: dirtyBytes,
      },
      '1.21.1',
    );
    const z05 = dirtyReport.findings.find((f) => f.id === 'Z05');
    expect(z05?.severity).toBe('WARN');
    expect(z05?.paths?.length).toBe(4);

    const cleanBytes = await buildMinimalValidPackZip(VALID_MCMETA_1_21_1);
    const cleanReport = await validateResourcePackZip(
      {
        fileName: 'clean.zip',
        fileSizeBytes: cleanBytes.byteLength,
        data: cleanBytes,
      },
      '1.21.1',
    );
    expect(cleanReport.findings.some((f) => f.id === 'Z05')).toBe(false);
  });

  it('Z06 rejects uppercase or spaces under assets/ and accepts valid ResourceLocation paths', async () => {
    const badPathBytes = await buildMinimalValidPackZip(VALID_MCMETA_1_21_1, {
      extraFiles: [
        { path: 'assets/mypack/textures/My Sprite.png' },
        { path: 'assets/MyNamespace/models/item/sword.json' },
      ],
    });
    const badReport = await validateResourcePackZip(
      {
        fileName: 'bad-path.zip',
        fileSizeBytes: badPathBytes.byteLength,
        data: badPathBytes,
      },
      '1.21.1',
    );
    const z06 = badReport.findings.find((f) => f.id === 'Z06');
    expect(z06?.severity).toBe('WARN');
    expect(z06?.paths).toContain('assets/mypack/textures/My Sprite.png');
    expect(z06?.paths).toContain('assets/MyNamespace/models/item/sword.json');

    const goodBytes = await buildMinimalValidPackZip(VALID_MCMETA_1_21_1, {
      extraFiles: [{ path: 'assets/my_pack-2/textures/item/custom_01.png' }],
    });
    const goodReport = await validateResourcePackZip(
      {
        fileName: 'good-path.zip',
        fileSizeBytes: goodBytes.byteLength,
        data: goodBytes,
      },
      '1.21.1',
    );
    expect(goodReport.findings.some((f) => f.id === 'Z06')).toBe(false);
  });

  it('Z07 detects case-only collisions across paths', async () => {
    const collisionBytes = await buildMinimalValidPackZip(VALID_MCMETA_1_21_1, {
      extraFiles: [
        { path: 'assets/mypack/textures/sword.png', content: 'lower' },
        { path: 'assets/mypack/textures/Sword.png', content: 'upper' },
      ],
    });
    const report = await validateResourcePackZip(
      {
        fileName: 'case-collision.zip',
        fileSizeBytes: collisionBytes.byteLength,
        data: collisionBytes,
      },
      '1.21.1',
    );
    const z07 = report.findings.find((f) => f.id === 'Z07');
    expect(z07?.severity).toBe('WARN');
    expect(z07?.paths?.[0]).toContain('sword.png');
    expect(z07?.paths?.[0]).toContain('Sword.png');

    const noCollisionBytes = await buildMinimalValidPackZip(VALID_MCMETA_1_21_1);
    const passReport = await validateResourcePackZip(
      {
        fileName: 'no-collision.zip',
        fileSizeBytes: noCollisionBytes.byteLength,
        data: noCollisionBytes,
      },
      '1.21.1',
    );
    expect(passReport.findings.some((f) => f.id === 'Z07')).toBe(false);
  });

  it('Z08 warns when zip exceeds 250 MiB and passes at exact boundary', async () => {
    const bytes = await buildMinimalValidPackZip(VALID_MCMETA_1_21_1);
    const atLimit = await validateResourcePackZip(
      {
        fileName: 'exact-limit.zip',
        fileSizeBytes: MAX_SERVER_PACK_BYTES,
        data: bytes,
      },
      '1.21.1',
    );
    expect(atLimit.findings.some((f) => f.id === 'Z08')).toBe(false);

    const overLimit = await validateResourcePackZip(
      {
        fileName: 'too-big.zip',
        fileSizeBytes: MAX_SERVER_PACK_BYTES + 1,
        data: bytes,
      },
      '1.21.1',
    );
    const z08 = overLimit.findings.find((f) => f.id === 'Z08');
    expect(z08?.severity).toBe('WARN');
  });

  it('Z09 emits INFO when pack.png is missing and omits it when present', async () => {
    const withoutIconBytes = await buildMinimalValidPackZip(
      VALID_MCMETA_1_21_1,
      { includePackPng: false },
    );
    const infoReport = await validateResourcePackZip(
      {
        fileName: 'no-icon.zip',
        fileSizeBytes: withoutIconBytes.byteLength,
        data: withoutIconBytes,
      },
      '1.21.1',
    );
    const z09 = infoReport.findings.find((f) => f.id === 'Z09');
    expect(z09?.severity).toBe('INFO');

    const withIconBytes = await buildMinimalValidPackZip(VALID_MCMETA_1_21_1, {
      includePackPng: true,
    });
    const passReport = await validateResourcePackZip(
      {
        fileName: 'with-icon.zip',
        fileSizeBytes: withIconBytes.byteLength,
        data: withIconBytes,
      },
      '1.21.1',
    );
    expect(passReport.findings.some((f) => f.id === 'Z09')).toBe(false);
  });

  it('Z10 detects plugin bundles (ItemsAdder/Oraxen/Nexo/nested ZIP) and ignores plain vanilla packs', async () => {
    const vanillaBytes = await buildMinimalValidPackZip(VALID_MCMETA_1_21_1);
    const vanillaReport = await validateResourcePackZip(
      {
        fileName: 'vanilla.zip',
        fileSizeBytes: vanillaBytes.byteLength,
        data: vanillaBytes,
      },
      '1.21.1',
    );
    expect(vanillaReport.findings.some((f) => f.id === 'Z10')).toBe(false);
    expect(vanillaReport.zipInspection.pluginBundle.ecosystems).toEqual([]);

    const bundleBytes = await buildSyntheticZip([
      {
        path: 'ItemsAdder IMC/data/items_packs/demo/demo.yml',
        content: 'info:\n  namespace: demo\n',
      },
      {
        path: 'Oraxen IMC/glyphs/demo.yml',
        content: 'admin:\n  texture: rank/admin\n',
      },
      {
        path: 'Nexo/pack/external_packs/readme.txt',
        content: 'drop vanilla zip here',
      },
      {
        path: 'nested/vanilla-pack.zip',
        content: vanillaBytes,
      },
    ]);
    const bundleReport = await validateResourcePackZip(
      {
        fileName: 'creator-bundle.zip',
        fileSizeBytes: bundleBytes.byteLength,
        data: bundleBytes,
      },
      '26.3',
    );
    const z10 = bundleReport.findings.find((f) => f.id === 'Z10');
    expect(z10?.severity).toBe('INFO');
    expect(z10?.fixHint).toContain('Nexo');
    expect(z10?.fixHint).toContain('ItemsAdder');
    expect(z10?.fixHint).toContain('Oraxen');
    expect(bundleReport.zipInspection.pluginBundle.ecosystems).toEqual([
      'itemsadder',
      'oraxen',
      'nexo',
    ]);
    expect(bundleReport.zipInspection.pluginBundle.nestedZipPaths).toEqual([
      'nested/vanilla-pack.zip',
    ]);

    const extracted = await extractNestedZipEntry(
      bundleBytes,
      'nested/vanilla-pack.zip',
    );
    expect(extracted).not.toBeNull();
    const innerReport = await validateResourcePackZip(
      {
        fileName: 'vanilla-pack.zip',
        fileSizeBytes: extracted!.byteLength,
        data: extracted!,
      },
      '1.21.1',
    );
    expect(innerReport.summary.errors).toBe(0);
  });

  it('Z11 & Z12 flag missing font textures, negative height artifacts, and non-PUA Yi/CJK chars while passing clean fonts', async () => {
    const cleanFontJson = JSON.stringify({
      providers: [
        {
          type: 'bitmap',
          file: 'mypack:font/rank.png',
          ascent: 8,
          height: 10,
          chars: ['\uE200'],
        },
      ],
    });
    const cleanPack = await buildSyntheticZip([
      { path: 'pack.mcmeta', content: JSON.stringify(VALID_MCMETA_1_21_1) },
      { path: 'pack.png', content: new Uint8Array([1]) },
      { path: 'assets/mypack/font/default.json', content: cleanFontJson },
      { path: 'assets/mypack/textures/font/rank.png', content: new Uint8Array([1]) },
    ]);
    const cleanReport = await validateResourcePackZip(
      {
        fileName: 'clean-font.zip',
        fileSizeBytes: cleanPack.byteLength,
        data: cleanPack,
      },
      '1.21.1',
    );
    expect(cleanReport.findings.some((f) => f.id === 'Z11')).toBe(false);
    expect(cleanReport.findings.some((f) => f.id === 'Z12')).toBe(false);

    const brokenFontJson = JSON.stringify({
      providers: [
        {
          type: 'bitmap',
          file: 'required/null.png',
          ascent: -32768,
          height: -66,
          chars: ['\uA4B8'],
        },
      ],
    });
    const brokenPack = await buildSyntheticZip([
      { path: 'pack.mcmeta', content: JSON.stringify(VALID_MCMETA_1_21_1) },
      { path: 'assets/minecraft/font/default.json', content: brokenFontJson },
    ]);
    const brokenReport = await validateResourcePackZip(
      {
        fileName: 'broken-font.zip',
        fileSizeBytes: brokenPack.byteLength,
        data: brokenPack,
      },
      '1.21.1',
    );
    const z11 = brokenReport.findings.find((f) => f.id === 'Z11');
    const z12 = brokenReport.findings.find((f) => f.id === 'Z12');
    expect(z11?.severity).toBe('ERROR');
    expect(z11?.paths?.[0]).toContain('assets/minecraft/textures/required/null.png');
    expect(z12?.severity).toBe('WARN');
    expect(z12?.message).toContain('height <= 0');
    expect(z12?.message).toContain('Yi/CJK');
  });
});
