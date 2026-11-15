import { describe, expect, it } from 'vitest';
import { decodePngRgba } from '../src/core/font/pngCodec.ts';
import {
  createInitialFontProject,
  createRankBitmapEntry,
  createSpaceEntry,
  createUploadedPngEntry,
} from '../src/core/font/presets.ts';
import { parseCodepointInput } from '../src/core/font/puaAllocator.ts';
import {
  evaluateBedrockGlyphGridRule,
  evaluateFontProject,
} from '../src/core/font/rules/fontRules.ts';
import type { FontProject } from '../src/core/font/types.ts';
import { makeSyntheticRgbaPng } from './helpers/syntheticPng.ts';

function withEntries(
  base: FontProject,
  entries: FontProject['entries'],
  overrides?: Partial<FontProject>,
): FontProject {
  return {
    ...base,
    entries,
    prefixSequenceIds: entries[0] ? [entries[0].id] : [],
    ...overrides,
  };
}

describe('Font & Prefix Rules F01–F10 + Object Component (pass & fail)', () => {
  it('passes cleanly with 0 ERROR on default initial project', async () => {
    const project = createInitialFontProject();
    const res = await evaluateFontProject(project);
    expect(res.errors).toBe(0);
  });

  it('F01 fails when ascent > height and passes when ascent <= height', async () => {
    const base = createInitialFontProject();
    const badEntry = createRankBitmapEntry([], {
      id: 'bad-f01',
      label: 'BAD_ASCENT',
      namespace: 'mypack',
      slug: 'bad',
      height: 8,
      ascent: 10,
    });
    const failRes = await evaluateFontProject(withEntries(base, [badEntry]));
    expect(failRes.findings.find((f) => f.id === 'F01')?.severity).toBe('ERROR');

    const okEntry = { ...badEntry, ascent: 8 };
    const passRes = await evaluateFontProject(withEntries(base, [okEntry]));
    expect(passRes.findings.some((f) => f.id === 'F01')).toBe(false);
  });

  it('F02 catches empty/non-uniform chars using Unicode codepoint counts (non-BMP safe)', async () => {
    const base = createInitialFontProject();
    const png = await makeSyntheticRgbaPng(16, 16, [
      { x: 0, y: 0, w: 6, h: 6, rgba: [255, 255, 255, 255] },
    ]);

    // Non-BMP emoji '\u{1F525}' has UTF-16 .length === 2, but 1 Unicode codepoint!
    // Together with '\uE200' on row 1 (2 codepoints) and '\uE201\uE202' on row 2 (2 codepoints),
    // F02 MUST pass cleanly!
    const nonBmpValid = createUploadedPngEntry([], {
      id: 'u-nonbmp',
      label: 'NonBMP',
      namespace: 'mypack',
      fileName: 'grid.png',
      bytes: png,
      chars: ['\u{1F525}\uE200', '\uE201\uE202'],
    });
    const passNonBmp = await evaluateFontProject(withEntries(base, [nonBmpValid]));
    expect(passNonBmp.findings.some((f) => f.id === 'F02')).toBe(false);

    // Mismatched row codepoints -> F02 ERROR
    const uneven = { ...nonBmpValid, chars: ['\uE200\uE201', '\uE202'] };
    const failUneven = await evaluateFontProject(withEntries(base, [uneven]));
    expect(failUneven.findings.find((f) => f.id === 'F02')?.severity).toBe('ERROR');

    // Empty chars -> F02 ERROR
    const emptyChars = { ...nonBmpValid, chars: [] };
    const failEmpty = await evaluateFontProject(withEntries(base, [emptyChars]));
    expect(failEmpty.findings.find((f) => f.id === 'F02')?.severity).toBe('ERROR');
  });

  it('F03 fails on invalid PNG bytes or non-divisible dimensions and passes when divisible', async () => {
    const base = createInitialFontProject();
    const corrupt = createUploadedPngEntry([], {
      id: 'u-corrupt',
      label: 'Corrupt',
      namespace: 'mypack',
      fileName: 'broken.png',
      bytes: new TextEncoder().encode('not-a-png'),
      chars: ['\uE200'],
    });
    const failCorrupt = await evaluateFontProject(withEntries(base, [corrupt]));
    expect(failCorrupt.findings.find((f) => f.id === 'F03')?.severity).toBe('ERROR');

    const png15x16 = await makeSyntheticRgbaPng(15, 16, []);
    const nonDivisible = createUploadedPngEntry([], {
      id: 'u-div',
      label: 'BadGrid',
      namespace: 'mypack',
      fileName: 'badgrid.png',
      bytes: png15x16,
      chars: ['\uE200\uE201'], // 15 % 2 !== 0
    });
    const failDiv = await evaluateFontProject(withEntries(base, [nonDivisible]));
    expect(failDiv.findings.find((f) => f.id === 'F03')?.severity).toBe('ERROR');

    const png16x16 = await makeSyntheticRgbaPng(16, 16, []);
    const validGrid = { ...nonDivisible, uploadedPngBytes: png16x16 };
    const passDiv = await evaluateFontProject(withEntries(base, [validGrid]));
    expect(passDiv.findings.some((f) => f.id === 'F03')).toBe(false);
  });

  it('F04 emits WARN for intra-bitmap duplicates and INFO for inter-provider duplicates', async () => {
    const base = createInitialFontProject();
    const png16x8 = await makeSyntheticRgbaPng(16, 8, [
      { x: 0, y: 0, w: 4, h: 4, rgba: [255, 255, 255, 255] },
    ]);

    const intraDup = createUploadedPngEntry([], {
      id: 'u-intra',
      label: 'IntraDup',
      namespace: 'mypack',
      fileName: 'dup.png',
      bytes: png16x8,
      chars: ['\uE210\uE210'],
    });
    const intraRes = await evaluateFontProject(withEntries(base, [intraDup]));
    expect(intraRes.findings.find((f) => f.id === 'F04')?.severity).toBe('WARN');

    const e1 = createRankBitmapEntry([], {
      id: 'b1',
      label: 'One',
      namespace: 'mypack',
      slug: 'one',
      charOverride: '\uE220',
    });
    const e2 = createRankBitmapEntry([], {
      id: 'b2',
      label: 'Two',
      namespace: 'mypack',
      slug: 'two',
      charOverride: '\uE220',
    });
    const interRes = await evaluateFontProject(withEntries(base, [e1, e2]));
    const f04Inter = interRes.findings.find((f) => f.id === 'F04');
    expect(f04Inter?.severity).toBe('INFO');
    expect(interRes.errors).toBe(0);
  });

  it('F05 warns on Bedrock U+E000–U+E1FF and ASCII overwrite, passes on U+E200+', async () => {
    const base = createInitialFontProject();
    const bedrockZone = createRankBitmapEntry([], {
      id: 'b-e000',
      label: 'BedrockHit',
      namespace: 'mypack',
      slug: 'e000',
      charOverride: '\uE005',
    });
    const warnBedrock = await evaluateFontProject(withEntries(base, [bedrockZone]));
    const f05Bedrock = warnBedrock.findings.find((f) => f.id === 'F05');
    expect(f05Bedrock?.severity).toBe('WARN');
    expect(f05Bedrock?.title).toContain('[SECONDARY]');

    const asciiHit = createRankBitmapEntry([], {
      id: 'b-ascii',
      label: 'AsciiHit',
      namespace: 'mypack',
      slug: 'ascii',
      charOverride: 'A',
    });
    const warnAscii = await evaluateFontProject(withEntries(base, [asciiHit]));
    expect(warnAscii.findings.find((f) => f.id === 'F05')?.severity).toBe('WARN');

    const safePua = createRankBitmapEntry([], {
      id: 'b-safe',
      label: 'Safe',
      namespace: 'mypack',
      slug: 'safe',
      charOverride: '\uE200',
    });
    const passSafe = await evaluateFontProject(withEntries(base, [safePua]));
    expect(passSafe.findings.some((f) => f.id === 'F05')).toBe(false);
  });

  it('F06 rejects uppercase Identifier, double textures/ prefix, missing .png, and missing texture file', async () => {
    const base = createInitialFontProject();
    const doubleTex = createRankBitmapEntry([], {
      id: 'b-f06',
      label: 'DoubleTex',
      namespace: 'mypack',
      slug: 'double',
    });

    const resDouble = await evaluateFontProject(
      withEntries(base, [{ ...doubleTex, fileRef: 'mypack:textures/font/rank.png' }]),
    );
    expect(resDouble.findings.find((f) => f.id === 'F06')?.severity).toBe('ERROR');

    const resUpper = await evaluateFontProject(
      withEntries(base, [{ ...doubleTex, fileRef: 'MyPack:font/Rank.png' }]),
    );
    expect(resUpper.findings.find((f) => f.id === 'F06')?.severity).toBe('ERROR');

    const resMissingTex = await evaluateFontProject(
      withEntries(base, [{ ...doubleTex, fileRef: 'mypack:font/missing.png' }]),
      { availableTexturePaths: new Set(['assets/mypack/textures/font/other.png']) },
    );
    expect(resMissingTex.findings.find((f) => f.id === 'F06')?.severity).toBe('ERROR');
  });

  it('F07 allows negative & >32 float advances without ERROR and flags fishy values with INFO', async () => {
    const base = createInitialFontProject();
    const neg = createSpaceEntry([], {
      id: 'sp-neg',
      label: 'Neg8',
      advance: -8,
      charOverride: '\uE230',
    });
    const frac = createSpaceEntry([], {
      id: 'sp-frac',
      label: 'HalfNeg',
      advance: -0.5,
      charOverride: '\uE231',
    });
    const big = createSpaceEntry([], {
      id: 'sp-big',
      label: 'Forty',
      advance: 40,
      charOverride: '\uE232',
    });
    const normal = createSpaceEntry([], {
      id: 'sp-ok',
      label: 'Eight',
      advance: 8,
      charOverride: '\uE233',
    });

    const fishyRes = await evaluateFontProject(withEntries(base, [neg, frac, big]));
    expect(fishyRes.errors).toBe(0);
    expect(fishyRes.findings.filter((f) => f.id === 'F07').length).toBe(3);
    expect(fishyRes.findings.every((f) => f.id !== 'F07' || f.severity === 'INFO')).toBe(true);

    const normalRes = await evaluateFontProject(withEntries(base, [normal]));
    expect(normalRes.findings.some((f) => f.id === 'F07')).toBe(false);
  });

  it('F08 warns when command or sample chat exceeds 256 chars and passes under 256', async () => {
    const base = createInitialFontProject();
    const longChat = 'x'.repeat(257);
    const failRes = await evaluateFontProject({ ...base, sampleChatText: longChat });
    expect(failRes.findings.find((f) => f.id === 'F08')?.severity).toBe('WARN');

    const okRes = await evaluateFontProject({ ...base, sampleChatText: 'Halo!' });
    expect(okRes.findings.some((f) => f.id === 'F08')).toBe(false);
  });

  it('F09 emits [UNVERIFIED] INFO when height > 8 and omits it when height <= 8', async () => {
    const base = createInitialFontProject();
    const tall = createRankBitmapEntry([], {
      id: 'b-tall',
      label: 'Tall',
      namespace: 'mypack',
      slug: 'tall',
      height: 12,
      ascent: 10,
    });
    const tallRes = await evaluateFontProject(withEntries(base, [tall]));
    const f09 = tallRes.findings.find((f) => f.id === 'F09');
    expect(f09?.severity).toBe('INFO');
    expect(f09?.title).toContain('[UNVERIFIED]');

    const compact = { ...tall, height: 8, ascent: 7 };
    const okRes = await evaluateFontProject(withEntries(base, [compact]));
    expect(okRes.findings.some((f) => f.id === 'F09')).toBe(false);
  });

  it('F10 validates Bedrock 16x16 grid dimensions and pixel bleeding (pass & fail)', async () => {
    const nonMult16 = await makeSyntheticRgbaPng(30, 32, []);
    const decodedBad = await decodePngRgba(nonMult16);
    expect(decodedBad.ok).toBe(true);
    if (decodedBad.ok) {
      const f10Err = evaluateBedrockGlyphGridRule(decodedBad.image);
      expect(f10Err.find((f) => f.id === 'F10')?.severity).toBe('ERROR');
    }

    // 32x32 -> 2x2 per cell. Putting pixel at (1,0) touches right edge of cell (0,0) -> WARN
    const bleedPng = await makeSyntheticRgbaPng(32, 32, [
      { x: 0, y: 0, w: 2, h: 1, rgba: [255, 255, 255, 255] },
    ]);
    const decodedBleed = await decodePngRgba(bleedPng);
    expect(decodedBleed.ok).toBe(true);
    if (decodedBleed.ok) {
      const f10Warn = evaluateBedrockGlyphGridRule(decodedBleed.image);
      expect(f10Warn.find((f) => f.id === 'F10')?.severity).toBe('WARN');
    }

    // 64x64 -> 4x4 per cell. Pixel safely inside (1,1,2x2) with transparent margins -> 0 F10 findings
    const safePng = await makeSyntheticRgbaPng(64, 64, [
      { x: 1, y: 1, w: 2, h: 2, rgba: [16, 185, 129, 255] },
    ]);
    const decodedSafe = await decodePngRgba(safePng);
    expect(decodedSafe.ok).toBe(true);
    if (decodedSafe.ok) {
      const f10Pass = evaluateBedrockGlyphGridRule(decodedSafe.image);
      expect(f10Pass.length).toBe(0);
    }
  });

  it('rejects object text component on 1.21.1 and warns on mismatched atlas split in 1.21.11+', async () => {
    const base = createInitialFontProject();
    const objOn1211 = await evaluateFontProject({
      ...base,
      targetVersion: '1.21.1',
      objectComponent: {
        enabled: true,
        mode: 'atlas',
        atlas: 'minecraft:items',
        sprite: 'minecraft:item/diamond',
        playerName: 'Alex',
        hat: true,
      },
    });
    expect(objOn1211.findings.find((f) => f.id === 'O01')?.severity).toBe('ERROR');

    const mismatch12111 = await evaluateFontProject({
      ...base,
      targetVersion: '1.21.11',
      objectComponent: {
        enabled: true,
        mode: 'atlas',
        atlas: 'minecraft:blocks',
        sprite: 'minecraft:item/emerald',
        playerName: 'Alex',
        hat: true,
      },
    });
    expect(mismatch12111.findings.find((f) => f.id === 'O02')?.severity).toBe('WARN');
  });

  it('counts padding space chars in F08, flags duplicate fileRef overwrite (F06 WARN), and parses \\u{...} codepoints', async () => {
    const base = createInitialFontProject();
    const paddedEntries: Array<FontProject['entries'][number]> = [];
    for (let i = 0; i < 110; i++) {
      paddedEntries.push(
        createRankBitmapEntry(paddedEntries, {
          id: `r-${i}`,
          label: `R${i}`,
          namespace: 'mypack',
          slug: `r_${i}`,
          spaceLeft: -1,
        }),
      );
    }
    const longRes = await evaluateFontProject({
      ...base,
      entries: paddedEntries,
      prefixSequenceIds: paddedEntries.map((e) => e.id),
      sampleChatText: 'Hi',
    });
    expect(longRes.findings.find((f) => f.id === 'F08')?.severity).toBe('WARN');

    const dupA = createRankBitmapEntry([], {
      id: 'dup-a',
      label: 'DupA',
      namespace: 'mypack',
      slug: 'same_tex',
    });
    const dupB = createRankBitmapEntry([dupA], {
      id: 'dup-b',
      label: 'DupB',
      namespace: 'mypack',
      slug: 'same_tex',
      composer: { text: 'B' },
    });
    const dupRes = await evaluateFontProject(withEntries(base, [dupA, dupB]));
    expect(dupRes.findings.find((f) => f.id === 'F06')?.severity).toBe('WARN');

    expect(parseCodepointInput('\\u{1F525}')).toBe(0x1f525);
    expect(parseCodepointInput('U+1F525')).toBe(0x1f525);
  });
});
