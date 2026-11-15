import { describe, expect, it } from 'vitest';
import { validateResourcePackZip } from '../src/core/report.ts';
import { evaluateMcmetaText } from '../src/core/rules/mcmetaRules.ts';
import type { TargetVersionId } from '../src/core/types.ts';
import { buildMinimalValidPackZip } from './helpers/syntheticPack.ts';

describe('pack.mcmeta rules M01–M10 & PRD §9 scenarios', () => {
  it('PRD Case 1: minimal valid synthetic packs pass cleanly for all 6 target versions', async () => {
    const validCases: Array<{
      readonly target: TargetVersionId;
      readonly mcmeta: Record<string, unknown>;
    }> = [
      {
        target: '1.21.1',
        mcmeta: { pack: { description: '1.21.1 Pack', pack_format: 34 } },
      },
      {
        target: '1.21.10',
        mcmeta: {
          pack: {
            description: '1.21.10 Pack',
            min_format: [69, 0],
            max_format: 69,
          },
        },
      },
      {
        target: '1.21.11',
        mcmeta: {
          pack: {
            description: '1.21.11 Pack',
            min_format: [75, 0],
            max_format: 75,
          },
        },
      },
      {
        target: '26.1.2',
        mcmeta: {
          pack: {
            description: '26.1.2 Pack',
            min_format: [84, 0],
            max_format: 84,
          },
        },
      },
      {
        target: '26.2',
        mcmeta: {
          pack: {
            description: '26.2 Pack',
            min_format: [88, 0],
            max_format: 88,
          },
        },
      },
      {
        target: '26.3',
        mcmeta: {
          pack: {
            description: '26.3 Pack',
            min_format: [97, 1],
            max_format: 97,
          },
        },
      },
    ];

    for (const item of validCases) {
      const zipBytes = await buildMinimalValidPackZip(item.mcmeta);
      const report = await validateResourcePackZip(
        {
          fileName: `${item.target}.zip`,
          fileSizeBytes: zipBytes.byteLength,
          data: zipBytes,
        },
        item.target,
      );
      expect(report.summary.errors, `Errors for ${item.target}`).toBe(0);
      expect(report.summary.warns, `Warnings for ${item.target}`).toBe(0);
      expect(report.compatibleVersions).toContain(item.target);
    }
  });

  it('M01 flags invalid JSON, UTF-8 BOM, non-object root, and missing "pack" key', () => {
    const syntaxErr = evaluateMcmetaText('{ "pack": { ', '1.21.10');
    expect(syntaxErr.findings.find((f) => f.id === 'M01')?.severity).toBe(
      'ERROR',
    );

    const bomErr = evaluateMcmetaText(
      '\uFEFF{"pack":{"description":"BOM","pack_format":34}}',
      '1.21.1',
    );
    const bomM01 = bomErr.findings.find((f) => f.id === 'M01');
    expect(bomM01?.severity).toBe('ERROR');
    expect(bomM01?.message).toContain('UTF-8 BOM');

    const arrayRoot = evaluateMcmetaText('[1, 2, 3]', '1.21.10');
    expect(arrayRoot.findings.find((f) => f.id === 'M01')?.severity).toBe(
      'ERROR',
    );

    const missingPackObj = evaluateMcmetaText(
      '{"other": {"description": "test"}}',
      '1.21.10',
    );
    expect(missingPackObj.findings.find((f) => f.id === 'M01')?.severity).toBe(
      'ERROR',
    );
  });

  it('PRD Case 3 / M02 catches float literals (69.0) via JSON tokens without false positives in description strings', () => {
    const floatMin = evaluateMcmetaText(
      '{"pack":{"description":"Valid v1.0","min_format":69.0,"max_format":69}}',
      '1.21.10',
    );
    const m02 = floatMin.findings.find((f) => f.id === 'M02');
    expect(m02?.severity).toBe('ERROR');
    expect(m02?.message).toContain('min_format');
    expect(m02?.message).toContain('69.0');

    const floatInsideTuple = evaluateMcmetaText(
      '{"pack":{"description":"test","min_format":[97, 0],"max_format":[97, 1.0]}}',
      '26.3',
    );
    expect(floatInsideTuple.findings.find((f) => f.id === 'M02')?.severity).toBe(
      'ERROR',
    );

    const floatInDescriptionOnly = evaluateMcmetaText(
      '{"pack":{"description":"Supports 69.0 and 97.1 cleanly","min_format":69,"max_format":69}}',
      '1.21.10',
    );
    expect(
      floatInDescriptionOnly.findings.some((f) => f.severity === 'ERROR'),
    ).toBe(false);
  });

  it('PRD Case 6 / M03 requires min_format & max_format paired and ordered', () => {
    const missingMax = evaluateMcmetaText(
      '{"pack":{"description":"only min","min_format":69}}',
      '1.21.10',
    );
    expect(missingMax.findings.find((f) => f.id === 'M03')?.severity).toBe(
      'ERROR',
    );

    const missingMin = evaluateMcmetaText(
      '{"pack":{"description":"only max","max_format":75}}',
      '1.21.11',
    );
    expect(missingMin.findings.find((f) => f.id === 'M03')?.severity).toBe(
      'ERROR',
    );

    const invertedRange = evaluateMcmetaText(
      '{"pack":{"description":"inverted","min_format":[97, 2],"max_format":[97, 1]}}',
      '26.3',
    );
    expect(invertedRange.findings.find((f) => f.id === 'M03')?.severity).toBe(
      'ERROR',
    );
  });

  it('PRD Case 4 / M04 forbids supported_formats when min_format.major > 64 on target >= 1.21.10', () => {
    const bad = evaluateMcmetaText(
      JSON.stringify({
        pack: {
          description: 'Invalid supported_formats > 64',
          min_format: [69, 0],
          max_format: 75,
          supported_formats: [69, 75],
        },
      }),
      '1.21.10',
    );
    const m04 = bad.findings.find((f) => f.id === 'M04');
    expect(m04?.severity).toBe('ERROR');
  });

  it('PRD Case 5 / M05 rejects pack_format > 64 alone without min_format/max_format on target >= 1.21.10', () => {
    const res = evaluateMcmetaText(
      JSON.stringify({
        pack: {
          description: 'pack_format 75 alone',
          pack_format: 75,
        },
      }),
      '1.21.11',
    );
    const m05 = res.findings.find((f) => f.id === 'M05');
    expect(m05?.severity).toBe('ERROR');
  });

  it('M06 detects out-of-range targets including [97, 0] vs 26.3 ([97, 1]) and legacy-only packs on 1.21.10+', () => {
    // max_format: [97, 0] stops at 97.0, whereas 26.3 is [97, 1] -> TOO_OLD (M06)
    const minorMismatch = evaluateMcmetaText(
      JSON.stringify({
        pack: {
          description: '26.3 snapshot vs release',
          min_format: [97, 0],
          max_format: [97, 0],
        },
      }),
      '26.3',
    );
    const m06Minor = minorMismatch.findings.find((f) => f.id === 'M06');
    expect(m06Minor?.severity).toBe('ERROR');
    expect(m06Minor?.fixHint).toContain('integer 97');

    // max_format: 97 expands to [97, 2147483647] -> compatible with 26.3 ([97, 1])
    const minorWildcard = evaluateMcmetaText(
      JSON.stringify({
        pack: {
          description: '26.3 wildcard upper minor',
          min_format: [97, 0],
          max_format: 97,
        },
      }),
      '26.3',
    );
    expect(minorWildcard.findings.some((f) => f.severity === 'ERROR')).toBe(
      false,
    );

    // Legacy pack on 1.21.10 -> M06
    const legacyOnModern = evaluateMcmetaText(
      JSON.stringify({
        pack: { description: 'legacy only', pack_format: 34 },
      }),
      '1.21.10',
    );
    expect(legacyOnModern.findings.find((f) => f.id === 'M06')?.severity).toBe(
      'ERROR',
    );

    // Legacy supported_formats-only pack on 1.21.10 -> M06
    const supportedOnlyOnModern = evaluateMcmetaText(
      JSON.stringify({
        pack: { description: 'sup only', supported_formats: [34, 64] },
      }),
      '1.21.10',
    );
    expect(
      supportedOnlyOnModern.findings.find((f) => f.id === 'M06')?.severity,
    ).toBe('ERROR');
  });

  it('M07 enforces pack_format 34 and Pack.a supported_formats containment on target 1.21.1', () => {
    const missingPackFormat = evaluateMcmetaText(
      JSON.stringify({
        pack: {
          description: 'only min/max',
          min_format: 34,
          max_format: 64,
        },
      }),
      '1.21.1',
    );
    expect(missingPackFormat.findings.find((f) => f.id === 'M07')?.severity).toBe(
      'ERROR',
    );

    const wrongPackFormat = evaluateMcmetaText(
      JSON.stringify({
        pack: { description: 'wrong format', pack_format: 46 },
      }),
      '1.21.1',
    );
    expect(wrongPackFormat.findings.find((f) => f.id === 'M07')?.severity).toBe(
      'ERROR',
    );

    // 1.21.1/client.jar atm.a: if pack_format is outside supported_formats, supported_formats is ignored
    const mismatchedBounds = evaluateMcmetaText(
      JSON.stringify({
        pack: {
          description: 'inconsistent',
          pack_format: 15,
          supported_formats: [32, 34],
        },
      }),
      '1.21.1',
    );
    expect(mismatchedBounds.findings.find((f) => f.id === 'M07')?.severity).toBe(
      'ERROR',
    );

    const validWithRange = evaluateMcmetaText(
      JSON.stringify({
        pack: {
          description: 'multi legacy',
          pack_format: 18,
          supported_formats: { min_inclusive: 18, max_inclusive: 46 },
        },
      }),
      '1.21.1',
    );
    expect(validWithRange.findings.some((f) => f.severity === 'ERROR')).toBe(
      false,
    );
  });

  it('PRD Case 7 & Decision A3 / M08 validates full cross-era packs and distinguishes ERROR vs WARN on incomplete cross-era', () => {
    const completeCrossEra = JSON.stringify({
      pack: {
        description: 'Cross-era complete',
        pack_format: 34,
        supported_formats: [34, 64],
        min_format: 34,
        max_format: 69,
      },
    });

    const on1211 = evaluateMcmetaText(completeCrossEra, '1.21.1');
    expect(on1211.findings.some((f) => f.severity === 'ERROR')).toBe(false);
    expect(on1211.findings.some((f) => f.severity === 'WARN')).toBe(false);

    const on12110 = evaluateMcmetaText(completeCrossEra, '1.21.10');
    expect(on12110.findings.some((f) => f.severity === 'ERROR')).toBe(false);
    expect(on12110.findings.some((f) => f.severity === 'WARN')).toBe(false);

    // Decision A3: min <= 64 and max >= 65 missing supported_formats -> ERROR on >= 1.21.10, WARN on 1.21.1
    const incompleteCrossEra = JSON.stringify({
      pack: {
        description: 'Missing supported_formats',
        pack_format: 34,
        min_format: 34,
        max_format: 69,
      },
    });

    const modernResult = evaluateMcmetaText(incompleteCrossEra, '1.21.10');
    const modernM08 = modernResult.findings.find((f) => f.id === 'M08');
    expect(modernM08?.severity).toBe('ERROR');

    const legacyResult = evaluateMcmetaText(incompleteCrossEra, '1.21.1');
    const legacyM08 = legacyResult.findings.find((f) => f.id === 'M08');
    expect(legacyM08?.severity).toBe('WARN');
    expect(legacyResult.findings.some((f) => f.severity === 'ERROR')).toBe(
      false,
    );
  });

  it('M09 handles missing/blank description vs Text Component descriptions, and M10 reports accurate compatible versions', () => {
    const emptyDesc = evaluateMcmetaText(
      JSON.stringify({ pack: { description: '   ', min_format: 84, max_format: 88 } }),
      '26.1.2',
    );
    expect(emptyDesc.findings.find((f) => f.id === 'M09')?.severity).toBe('INFO');
    const m10 = emptyDesc.findings.find((f) => f.id === 'M10');
    expect(m10?.severity).toBe('INFO');
    expect(emptyDesc.compatibleVersions).toEqual(['26.1.2', '26.2']);
    expect(emptyDesc.autoDetectedTarget).toBe('26.2');

    const textComponentDesc = evaluateMcmetaText(
      JSON.stringify({
        pack: {
          description: { text: 'Colored Pack', color: 'gold' },
          min_format: 84,
          max_format: 84,
        },
      }),
      '26.1.2',
    );
    expect(textComponentDesc.findings.some((f) => f.id === 'M09')).toBe(false);
    expect(textComponentDesc.compatibleVersions).toEqual(['26.1.2']);
    expect(textComponentDesc.autoDetectedTarget).toBe('26.1.2');
  });
});
