import { type JsonNode, parseJsonPreserveNumberTokens } from '../mcmeta.ts';
import type {
  Finding,
  McmetaParsedInfo,
  PackFormatTuple,
  TargetVersionId,
  VersionProfile,
} from '../types.ts';
import {
  comparePackFormat,
  formatTupleLabel,
  getVersionProfile,
  LAST_PRE_MINOR_CLIENT_FORMAT,
  MAX_MINOR_SENTINEL,
  VERSION_PROFILES,
} from '../versions.ts';

interface ExtractedFields {
  readonly hasPackFormatKey: boolean;
  readonly packFormat?: number;
  readonly packFormatInvalid: boolean;

  readonly hasSupportedFormatsKey: boolean;
  readonly supportedFormats?: readonly [number, number];
  readonly supportedFormatsInvalid: boolean;

  readonly hasMinKey: boolean;
  readonly minFormat?: PackFormatTuple;
  readonly minFormatInvalid: boolean;

  readonly hasMaxKey: boolean;
  readonly maxFormat?: PackFormatTuple;
  readonly maxFormatInvalid: boolean;

  readonly hasDescription: boolean;
}

export interface McmetaEvaluation {
  readonly findings: readonly Finding[];
  readonly parsedInfo: McmetaParsedInfo | null;
  readonly compatibleVersions: readonly TargetVersionId[];
  readonly autoDetectedTarget: TargetVersionId | null;
}

function isNonNegativeIntNode(node: JsonNode): {
  ok: true;
  value: number;
} | {
  ok: false;
  isFloat: boolean;
  reason: string;
} {
  if (node.kind !== 'number') {
    return {
      ok: false,
      isFloat: false,
      reason: `bertipe ${node.kind}, seharusnya integer non-negatif`,
    };
  }
  if (node.isFloatLiteral || !Number.isInteger(node.value)) {
    return {
      ok: false,
      isFloat: true,
      reason: `berisi angka desimal/float (${node.raw})`,
    };
  }
  if (node.value < 0) {
    return {
      ok: false,
      isFloat: false,
      reason: `berisi bilangan negatif (${node.raw})`,
    };
  }
  return { ok: true, value: node.value };
}

function parseTupleField(
  node: JsonNode,
  fieldName: 'min_format' | 'max_format',
  isUpperBound: boolean,
  schemaFindings: Finding[],
): PackFormatTuple | null {
  if (node.kind === 'number') {
    const check = isNonNegativeIntNode(node);
    if (!check.ok) {
      schemaFindings.push(
        createM02Finding(
          fieldName,
          check.reason,
          check.isFloat,
          isUpperBound ? '69 atau [97, 1]' : '69 atau [69, 0]',
        ),
      );
      return null;
    }
    return [check.value, isUpperBound ? MAX_MINOR_SENTINEL : 0];
  }

  if (node.kind === 'array') {
    if (node.items.length < 1 || node.items.length > 2) {
      schemaFindings.push(
        createM02Finding(
          fieldName,
          `panjang array ${node.items.length}, seharusnya [major, minor] atau integer`,
          false,
          '[69, 0]',
        ),
      );
      return null;
    }

    const majorCheck = isNonNegativeIntNode(node.items[0]!);
    if (!majorCheck.ok) {
      schemaFindings.push(
        createM02Finding(
          `${fieldName}[0]`,
          majorCheck.reason,
          majorCheck.isFloat,
          '[69, 0]',
        ),
      );
      return null;
    }

    if (node.items.length === 1) {
      return [majorCheck.value, isUpperBound ? MAX_MINOR_SENTINEL : 0];
    }

    const minorCheck = isNonNegativeIntNode(node.items[1]!);
    if (!minorCheck.ok) {
      schemaFindings.push(
        createM02Finding(
          `${fieldName}[1]`,
          minorCheck.reason,
          minorCheck.isFloat,
          '[97, 1]',
        ),
      );
      return null;
    }

    return [majorCheck.value, minorCheck.value];
  }

  schemaFindings.push(
    createM02Finding(
      fieldName,
      `bertipe ${node.kind}, seharusnya integer atau [major, minor]`,
      false,
      '[69, 0]',
    ),
  );
  return null;
}

function parseSupportedFormats(
  node: JsonNode,
  schemaFindings: Finding[],
): readonly [number, number] | null {
  if (node.kind === 'number') {
    const check = isNonNegativeIntNode(node);
    if (!check.ok) {
      schemaFindings.push(
        createM02Finding(
          'supported_formats',
          check.reason,
          check.isFloat,
          '34 atau [34, 64]',
        ),
      );
      return null;
    }
    return [check.value, check.value];
  }

  if (node.kind === 'array') {
    if (node.items.length !== 2) {
      schemaFindings.push(
        createM02Finding(
          'supported_formats',
          `array harus berisi tepat 2 integer [min, max], ditemukan ${node.items.length} elemen`,
          false,
          '[34, 64]',
        ),
      );
      return null;
    }
    const minCheck = isNonNegativeIntNode(node.items[0]!);
    const maxCheck = isNonNegativeIntNode(node.items[1]!);
    if (!minCheck.ok) {
      schemaFindings.push(
        createM02Finding(
          'supported_formats[0]',
          minCheck.reason,
          minCheck.isFloat,
          '[34, 64]',
        ),
      );
      return null;
    }
    if (!maxCheck.ok) {
      schemaFindings.push(
        createM02Finding(
          'supported_formats[1]',
          maxCheck.reason,
          maxCheck.isFloat,
          '[34, 64]',
        ),
      );
      return null;
    }
    if (minCheck.value > maxCheck.value) {
      schemaFindings.push(
        createM02Finding(
          'supported_formats',
          `batas bawah (${minCheck.value}) lebih besar daripada batas atas (${maxCheck.value})`,
          false,
          `[${maxCheck.value}, ${minCheck.value}]`,
        ),
      );
      return null;
    }
    return [minCheck.value, maxCheck.value];
  }

  if (node.kind === 'object') {
    const minNode = node.props.get('min_inclusive');
    const maxNode = node.props.get('max_inclusive');
    if (!minNode || !maxNode) {
      schemaFindings.push(
        createM02Finding(
          'supported_formats',
          'objek supported_formats wajib memiliki "min_inclusive" dan "max_inclusive"',
          false,
          '{"min_inclusive": 34, "max_inclusive": 64}',
        ),
      );
      return null;
    }
    const minCheck = isNonNegativeIntNode(minNode);
    const maxCheck = isNonNegativeIntNode(maxNode);
    if (!minCheck.ok) {
      schemaFindings.push(
        createM02Finding(
          'supported_formats.min_inclusive',
          minCheck.reason,
          minCheck.isFloat,
          '34',
        ),
      );
      return null;
    }
    if (!maxCheck.ok) {
      schemaFindings.push(
        createM02Finding(
          'supported_formats.max_inclusive',
          maxCheck.reason,
          maxCheck.isFloat,
          '64',
        ),
      );
      return null;
    }
    if (minCheck.value > maxCheck.value) {
      schemaFindings.push(
        createM02Finding(
          'supported_formats',
          `min_inclusive (${minCheck.value}) lebih besar daripada max_inclusive (${maxCheck.value})`,
          false,
          `{"min_inclusive": ${maxCheck.value}, "max_inclusive": ${minCheck.value}}`,
        ),
      );
      return null;
    }
    return [minCheck.value, maxCheck.value];
  }

  schemaFindings.push(
    createM02Finding(
      'supported_formats',
      `bertipe ${node.kind}, seharusnya integer, array [min, max], atau objek {min_inclusive, max_inclusive}`,
      false,
      '[34, 64]',
    ),
  );
  return null;
}

function createM02Finding(
  fieldName: string,
  reason: string,
  isFloat: boolean,
  example: string,
): Finding {
  return {
    id: 'M02',
    severity: 'ERROR',
    title: isFloat
      ? `Nilai format "${fieldName}" berupa float/desimal (tidak valid)`
      : `Format nilai "${fieldName}" tidak valid`,
    message: `Field "${fieldName}" ${reason}. Codec PackFormat Minecraft menolak angka desimal (seperti 69.0) dan hanya menerima integer non-negatif atau [major, minor].`,
    fixHint: `Ubah "${fieldName}" ke bentuk integer atau array integer, misalnya ${example}.`,
    docRef: 'docs/knowledge/00-ringkasan-perbedaan-versi.md §2',
  };
}

function hasNonEmptyDescription(node: JsonNode | undefined): boolean {
  if (!node || node.kind === 'null') return false;
  if (node.kind === 'string') return node.value.trim().length > 0;
  if (node.kind === 'array') return node.items.length > 0;
  if (node.kind === 'object') {
    if (node.props.size === 0) return false;
    const textProp = node.props.get('text');
    if (
      node.props.size === 1 &&
      textProp?.kind === 'string' &&
      textProp.value.trim().length === 0
    ) {
      return false;
    }
    return true;
  }
  return false;
}

function extractPackFields(packProps: ReadonlyMap<string, JsonNode>): {
  fields: ExtractedFields;
  schemaFindings: Finding[];
} {
  const schemaFindings: Finding[] = [];

  const packFormatNode = packProps.get('pack_format');
  const hasPackFormatKey = packFormatNode !== undefined;
  let packFormat: number | undefined;
  let packFormatInvalid = false;
  if (packFormatNode !== undefined) {
    const check = isNonNegativeIntNode(packFormatNode);
    if (check.ok) {
      packFormat = check.value;
    } else {
      packFormatInvalid = true;
      schemaFindings.push(
        createM02Finding('pack_format', check.reason, check.isFloat, '34'),
      );
    }
  }

  const supportedNode = packProps.get('supported_formats');
  const hasSupportedFormatsKey = supportedNode !== undefined;
  let supportedFormats: readonly [number, number] | undefined;
  let supportedFormatsInvalid = false;
  if (supportedNode !== undefined) {
    const parsed = parseSupportedFormats(supportedNode, schemaFindings);
    if (parsed !== null) {
      supportedFormats = parsed;
    } else {
      supportedFormatsInvalid = true;
    }
  }

  const minNode = packProps.get('min_format');
  const hasMinKey = minNode !== undefined;
  let minFormat: PackFormatTuple | undefined;
  let minFormatInvalid = false;
  if (minNode !== undefined) {
    const parsed = parseTupleField(minNode, 'min_format', false, schemaFindings);
    if (parsed !== null) {
      minFormat = parsed;
    } else {
      minFormatInvalid = true;
    }
  }

  const maxNode = packProps.get('max_format');
  const hasMaxKey = maxNode !== undefined;
  let maxFormat: PackFormatTuple | undefined;
  let maxFormatInvalid = false;
  if (maxNode !== undefined) {
    const parsed = parseTupleField(maxNode, 'max_format', true, schemaFindings);
    if (parsed !== null) {
      maxFormat = parsed;
    } else {
      maxFormatInvalid = true;
    }
  }

  // M03: min_format and max_format pairing & ordering
  if (hasMinKey !== hasMaxKey) {
    const present = hasMinKey ? 'min_format' : 'max_format';
    const missing = hasMinKey ? 'max_format' : 'min_format';
    schemaFindings.push({
      id: 'M03',
      severity: 'ERROR',
      title: 'min_format dan max_format tidak berpasangan',
      message: `Ditemukan "${present}", tetapi "${missing}" tidak ada. Pada format 1.21.9+, min_format dan max_format wajib ada bersamaan.`,
      fixHint: `Tambahkan field "${missing}" di dalam objek "pack" agar rentang format lengkap (mis. "min_format": 69, "max_format": 69).`,
      docRef: 'docs/knowledge/00-ringkasan-perbedaan-versi.md §2',
    });
  } else if (minFormat && maxFormat && comparePackFormat(minFormat, maxFormat) > 0) {
    schemaFindings.push({
      id: 'M03',
      severity: 'ERROR',
      title: 'min_format lebih besar daripada max_format',
      message: `min_format ${formatTupleLabel(minFormat)} melebihi max_format ${formatTupleLabel(maxFormat, true)}.`,
      fixHint:
        'Pastikan nilai min_format lebih kecil atau sama dengan max_format.',
      docRef: 'docs/knowledge/00-ringkasan-perbedaan-versi.md §2',
    });
  }

  return {
    fields: {
      hasPackFormatKey,
      packFormat,
      packFormatInvalid,
      hasSupportedFormatsKey,
      supportedFormats,
      supportedFormatsInvalid,
      hasMinKey,
      minFormat,
      minFormatInvalid,
      hasMaxKey,
      maxFormat,
      maxFormatInvalid,
      hasDescription: hasNonEmptyDescription(packProps.get('description')),
    },
    schemaFindings,
  };
}

/**
 * Evaluates M04–M08 compatibility findings for a specific Minecraft version profile.
 * Used for both selected-target reporting and M10 compatibility scanning across all profiles.
 */
function evaluateCompatibilityForProfile(
  fields: ExtractedFields,
  profile: VersionProfile,
  hasSchemaErrors: boolean,
): Finding[] {
  const findings: Finding[] = [];
  const hasValidMinMax =
    !hasSchemaErrors &&
    fields.minFormat !== undefined &&
    fields.maxFormat !== undefined &&
    comparePackFormat(fields.minFormat, fields.maxFormat) <= 0;

  if (profile.style === 'range') {
    evaluateRangeTargetRules(fields, profile, hasValidMinMax, findings);
  } else {
    evaluateLegacyTargetRules(fields, profile, findings);
  }

  // M08: Cross-era pack check (min <= 64 && max >= 65)
  if (
    hasValidMinMax &&
    fields.minFormat![0] <= LAST_PRE_MINOR_CLIENT_FORMAT &&
    fields.maxFormat![0] >= 65
  ) {
    const missingLegacyFields: string[] = [];
    if (!fields.hasPackFormatKey) {
      missingLegacyFields.push('pack_format');
    }
    if (!fields.hasSupportedFormatsKey) {
      missingLegacyFields.push('supported_formats');
    }

    const legacyPackFormatOutOfBounds =
      fields.packFormat !== undefined &&
      (fields.packFormat < 15 ||
        fields.packFormat < fields.minFormat![0] ||
        fields.packFormat > fields.maxFormat![0]);

    if (missingLegacyFields.length > 0 || legacyPackFormatOutOfBounds) {
      const severity = profile.style === 'range' ? 'ERROR' : 'WARN';
      const issueDetails: string[] = [];
      if (missingLegacyFields.length > 0) {
        issueDetails.push(
          `field ${missingLegacyFields.join(' dan ')} tidak ada`,
        );
      }
      if (legacyPackFormatOutOfBounds && fields.packFormat !== undefined) {
        issueDetails.push(
          `pack_format (${fields.packFormat}) harus >= 15 dan berada di rentang [${fields.minFormat![0]}, ${fields.maxFormat![0]}]`,
        );
      }

      findings.push({
        id: 'M08',
        severity,
        title: 'Pack lintas era kekurangan metadata kompatibilitas legacy',
        message: `Pack mencakup format <= 64 (${fields.minFormat![0]}) hingga >= 65 (${fields.maxFormat![0]}), tetapi ${issueDetails.join('; ')}. Klien 1.21.10+ (PackFormat$IntermediaryFormat) mewajibkan kedua field tersebut untuk rentang lintas era.`,
        fixHint: `Tambahkan "pack_format": ${Math.max(15, fields.minFormat![0])} dan "supported_formats": [${fields.minFormat![0]}, ${LAST_PRE_MINOR_CLIENT_FORMAT}] bersama min_format/max_format.`,
        docRef: 'docs/knowledge/00-ringkasan-perbedaan-versi.md §2 & §4',
      });
    }
  }

  return findings;
}

function evaluateRangeTargetRules(
  fields: ExtractedFields,
  profile: VersionProfile,
  hasValidMinMax: boolean,
  findings: Finding[],
): void {
  // M04: supported_formats forbidden/misaligned on 1.21.9+
  if (fields.supportedFormats !== undefined) {
    if (hasValidMinMax && fields.minFormat![0] > LAST_PRE_MINOR_CLIENT_FORMAT) {
      findings.push({
        id: 'M04',
        severity: 'ERROR',
        title: 'supported_formats dilarang saat min_format > 64',
        message: `Target ${profile.id} tidak mengizinkan field "supported_formats" ketika min_format (${formatTupleLabel(fields.minFormat!)}) berada di atas 64.`,
        fixHint:
          'Hapus field "supported_formats" dari pack.mcmeta dan cukup pertahankan "min_format" serta "max_format".',
        docRef: 'docs/knowledge/java-1.21.10.md §1',
      });
    } else if (!fields.hasMinKey && !fields.hasMaxKey) {
      if (fields.supportedFormats[1] > LAST_PRE_MINOR_CLIENT_FORMAT) {
        findings.push({
          id: 'M04',
          severity: 'ERROR',
          title: 'supported_formats melampaui batas format 64 tanpa min/max_format',
          message: `supported_formats [${fields.supportedFormats[0]}, ${fields.supportedFormats[1]}] menjangkau > 64 tanpa pasangan min_format/max_format.`,
          fixHint:
            'Gunakan min_format dan max_format untuk menargetkan versi 1.21.9+ (format >= 65).',
          docRef: 'docs/knowledge/00-ringkasan-perbedaan-versi.md §2',
        });
      }
    } else if (
      hasValidMinMax &&
      fields.minFormat![0] <= LAST_PRE_MINOR_CLIENT_FORMAT
    ) {
      const expectedMin = fields.minFormat![0];
      const maxMajor = fields.maxFormat![0];
      const minMatches = fields.supportedFormats[0] === expectedMin;
      const maxMatches =
        fields.supportedFormats[1] === maxMajor ||
        (maxMajor > LAST_PRE_MINOR_CLIENT_FORMAT &&
          fields.supportedFormats[1] === LAST_PRE_MINOR_CLIENT_FORMAT);
      if (!minMatches || !maxMatches) {
        const expectedMax = Math.min(maxMajor, LAST_PRE_MINOR_CLIENT_FORMAT);
        findings.push({
          id: 'M04',
          severity: 'ERROR',
          title: 'Rentang supported_formats tidak sinkron dengan min_format/max_format',
          message: `supported_formats [${fields.supportedFormats[0]}, ${fields.supportedFormats[1]}] tidak cocok dengan min_format/max_format untuk pack lintas era (diharapkan [${expectedMin}, ${expectedMax}]).`,
          fixHint: `Sesuaikan "supported_formats": [${expectedMin}, ${expectedMax}] agar selaras dengan PackFormat$IntermediaryFormat.`,
          docRef: 'docs/knowledge/00-ringkasan-perbedaan-versi.md §2',
        });
      }
    }
  }

  // M05: pack_format > 64 alone without min/max_format, or completely missing version declaration
  if (!fields.hasMinKey && !fields.hasMaxKey) {
    if (fields.packFormat !== undefined) {
      if (fields.packFormat > LAST_PRE_MINOR_CLIENT_FORMAT) {
        findings.push({
          id: 'M05',
          severity: 'ERROR',
          title: 'pack_format > 64 tanpa min_format dan max_format ditolak',
          message: `Target ${profile.id} menolak "pack_format": ${fields.packFormat} yang berdiri sendiri di atas format 64 tanpa pasangan min_format dan max_format.`,
          fixHint: `Ganti dengan "min_format": ${fields.packFormat} dan "max_format": ${fields.packFormat} (atau [major, minor] yang sesuai).`,
          docRef: 'docs/knowledge/java-1.21.10.md §1',
        });
        return;
      }
      // Legacy pack (pack_format <= 64) checked against 1.21.10+ -> M06 out of range
      findings.push({
        id: 'M06',
        severity: 'ERROR',
        title: `Format pack legacy tidak kompatibel dengan ${profile.id}`,
        message: `Pack hanya mendeklarasikan format lama (pack_format ${fields.packFormat}${fields.supportedFormats ? `, supported_formats [${fields.supportedFormats[0]}, ${fields.supportedFormats[1]}]` : ''}), sedangkan target ${profile.id} memakai format ${formatTupleLabel(profile.format)}.`,
        fixHint: `Perbarui pack.mcmeta dengan "min_format": [${profile.format[0]}, ${profile.format[1]}] dan "max_format": ${profile.format[0]} (serta perbarui aset bila perlu sesuai changelog versi).`,
        docRef: profile.docRef,
      });
      return;
    }

    if (!fields.packFormatInvalid && !fields.supportedFormatsInvalid) {
      if (fields.supportedFormats !== undefined) {
        if (fields.supportedFormats[1] <= LAST_PRE_MINOR_CLIENT_FORMAT) {
          findings.push({
            id: 'M06',
            severity: 'ERROR',
            title: `Format pack legacy tidak kompatibel dengan ${profile.id}`,
            message: `Pack hanya menyertakan supported_formats [${fields.supportedFormats[0]}, ${fields.supportedFormats[1]}] tanpa pack_format atau min_format/max_format, sehingga tidak kompatibel dengan target ${profile.id} (${formatTupleLabel(profile.format)}).`,
            fixHint: `Tambahkan "min_format": [${profile.format[0]}, ${profile.format[1]}] dan "max_format": ${profile.format[0]} di dalam objek "pack".`,
            docRef: profile.docRef,
          });
        }
        return;
      }

      findings.push({
        id: 'M05',
        severity: 'ERROR',
        title: 'Deklarasi versi format (min_format/max_format) tidak ditemukan',
        message: `Objek "pack" di pack.mcmeta tidak menyertakan min_format dan max_format.`,
        fixHint: `Tambahkan "min_format": [${profile.format[0]}, ${profile.format[1]}] dan "max_format": ${profile.format[0]} di dalam objek "pack".`,
        docRef: profile.docRef,
      });
      return;
    }
  }

  // M06: Check target format inside min_format..max_format
  if (hasValidMinMax) {
    const cmpMin = comparePackFormat(profile.format, fields.minFormat!);
    const cmpMax = comparePackFormat(profile.format, fields.maxFormat!);

    if (cmpMin < 0) {
      findings.push({
        id: 'M06',
        severity: 'ERROR',
        title: `Target ${profile.id} lebih lama dari min_format pack`,
        message: `Target ${profile.id} (${formatTupleLabel(profile.format)}) berada di bawah min_format ${formatTupleLabel(fields.minFormat!)}. Minecraft akan menandai pack "Incompatible / Made for a newer version".`,
        fixHint: `Turunkan min_format ke [${profile.format[0]}, ${profile.format[1]}] (atau ${profile.format[0]}) hanya jika isi aset memang kompatibel.`,
        docRef: 'docs/knowledge/00-ringkasan-perbedaan-versi.md §4',
      });
    } else if (cmpMax > 0) {
      const isMinorCapIssue =
        fields.maxFormat![0] === profile.format[0] &&
        fields.maxFormat![1] < profile.format[1];
      findings.push({
        id: 'M06',
        severity: 'ERROR',
        title: `Target ${profile.id} melampaui max_format pack`,
        message: `Target ${profile.id} (${formatTupleLabel(profile.format)}) berada di atas max_format ${formatTupleLabel(fields.maxFormat!, true)}. Minecraft akan menandai pack "Incompatible / Made for an older version".`,
        fixHint: isMinorCapIssue
          ? `Ubah "max_format" dari [${fields.maxFormat![0]}, ${fields.maxFormat![1]}] menjadi integer ${profile.format[0]} (mencakup semua minor ${profile.format[0]}.x) atau [${profile.format[0]}, ${profile.format[1]}].`
          : `Naikkan "max_format" ke ${profile.format[0]} atau [${profile.format[0]}, ${profile.format[1]}] setelah memastikan kompatibilitas aset.`,
        docRef: 'docs/knowledge/java-26.3.md §1',
      });
    }
  }
}

function evaluateLegacyTargetRules(
  fields: ExtractedFields,
  profile: VersionProfile,
  findings: Finding[],
): void {
  const targetMajor = profile.format[0]; // 34 for 1.21.1

  if (!fields.hasPackFormatKey) {
    if (!fields.packFormatInvalid) {
      findings.push({
        id: 'M07',
        severity: 'ERROR',
        title: `Target ${profile.id} mewajibkan field pack_format`,
        message: `pack.mcmeta tidak memiliki "pack_format". Minecraft ${profile.id} (format ${targetMajor}) tidak membaca min_format/max_format tanpa pack_format.`,
        fixHint: `Tambahkan "pack_format": ${targetMajor} di dalam objek "pack".`,
        docRef: 'docs/knowledge/java-1.21.1.md §1',
      });
    }
    return;
  }

  if (fields.packFormat === undefined) {
    return;
  }

  if (fields.supportedFormats !== undefined) {
    const [minSup, maxSup] = fields.supportedFormats;
    const packFormatInsideSupported =
      fields.packFormat >= minSup && fields.packFormat <= maxSup;

    if (!packFormatInsideSupported) {
      findings.push({
        id: 'M07',
        severity: 'ERROR',
        title: 'pack_format berada di luar rentang supported_formats',
        message: `pack_format (${fields.packFormat}) tidak berada di dalam supported_formats [${minSup}, ${maxSup}]. Pada ${profile.id} (Pack.a / atm.a), klien mengabaikan supported_formats dan hanya memakai pack_format.`,
        fixHint: `Pastikan pack_format berada di dalam [${minSup}, ${maxSup}] dan mencakup format ${targetMajor} (mis. "pack_format": ${targetMajor}, "supported_formats": [${Math.min(minSup, targetMajor)}, ${Math.max(maxSup, targetMajor)}]).`,
        docRef: 'docs/knowledge/java-1.21.1.md §7',
      });
      return;
    }

    if (targetMajor < minSup || targetMajor > maxSup) {
      findings.push({
        id: 'M07',
        severity: 'ERROR',
        title: `supported_formats tidak mencakup format ${targetMajor} (${profile.id})`,
        message: `Rentang supported_formats [${minSup}, ${maxSup}] tidak mencakup format ${targetMajor} yang dibutuhkan Minecraft ${profile.id}.`,
        fixHint: `Perluas supported_formats sehingga mencakup ${targetMajor}, misalnya [${Math.min(minSup, targetMajor)}, ${Math.max(maxSup, targetMajor)}].`,
        docRef: 'docs/knowledge/java-1.21.1.md §1',
      });
    }
    return;
  }

  if (fields.packFormat !== targetMajor) {
    findings.push({
      id: 'M07',
      severity: 'ERROR',
      title: `pack_format (${fields.packFormat}) tidak cocok untuk ${profile.id}`,
      message: `pack_format bernilai ${fields.packFormat} tanpa supported_formats, sedangkan Minecraft ${profile.id} membutuhkan format ${targetMajor}.`,
      fixHint: `Ubah "pack_format" menjadi ${targetMajor}, atau tambahkan "supported_formats" yang mencakup ${fields.packFormat} dan ${targetMajor}.`,
      docRef: 'docs/knowledge/java-1.21.1.md §1',
    });
  }
}

function summarizeDeclaredFields(fields: ExtractedFields): string {
  const parts: string[] = [];
  if (fields.packFormat !== undefined) {
    parts.push(`pack_format: ${fields.packFormat}`);
  }
  if (fields.supportedFormats !== undefined) {
    parts.push(
      `supported_formats: [${fields.supportedFormats[0]}, ${fields.supportedFormats[1]}]`,
    );
  }
  if (fields.minFormat !== undefined) {
    parts.push(`min_format: ${formatTupleLabel(fields.minFormat)}`);
  }
  if (fields.maxFormat !== undefined) {
    parts.push(`max_format: ${formatTupleLabel(fields.maxFormat, true)}`);
  }
  return parts.length > 0 ? parts.join(', ') : 'tidak ada field format terbaca';
}

function pickAutoDetectedTarget(
  fields: ExtractedFields,
  compatibleVersions: readonly TargetVersionId[],
): TargetVersionId | null {
  if (compatibleVersions.length === 0) {
    return null;
  }
  // If only legacy fields are present and 1.21.1 is compatible, select 1.21.1
  if (
    fields.minFormat === undefined &&
    fields.maxFormat === undefined &&
    compatibleVersions.includes('1.21.1')
  ) {
    return '1.21.1';
  }
  // Otherwise prefer the newest compatible version targeted by the pack
  return compatibleVersions[compatibleVersions.length - 1] ?? null;
}

/**
 * Parses and validates pack.mcmeta raw UTF-8 text against a selected target version,
 * returning rules M01–M10 and compatibility detection across all 6 version profiles.
 */
export function evaluateMcmetaText(
  rawText: string,
  targetVersion: TargetVersionId,
): McmetaEvaluation {
  const parseResult = parseJsonPreserveNumberTokens(rawText);
  if (!parseResult.ok) {
    return {
      findings: [
        {
          id: 'M01',
          severity: 'ERROR',
          title: parseResult.hasUtf8Bom
            ? 'pack.mcmeta diawali UTF-8 BOM'
            : 'pack.mcmeta bukan JSON yang valid',
          message: `Gagal mengurai JSON pack.mcmeta: ${parseResult.errorMessage}`,
          fixHint: parseResult.hasUtf8Bom
            ? 'Simpan ulang pack.mcmeta sebagai UTF-8 tanpa BOM (UTF-8 without BOM).'
            : 'Perbaiki sintaks JSON (periksa koma berlebih, tanda kutip ganda, atau kurung kurawal yang hilang).',
          docRef: 'docs/knowledge/00-ringkasan-perbedaan-versi.md §2',
        },
      ],
      parsedInfo: null,
      compatibleVersions: [],
      autoDetectedTarget: null,
    };
  }

  if (parseResult.root.kind !== 'object') {
    return {
      findings: [
        {
          id: 'M01',
          severity: 'ERROR',
          title: 'Struktur root pack.mcmeta bukan objek JSON',
          message: `Root JSON pack.mcmeta bertipe ${parseResult.root.kind}, seharusnya objek {"pack": { ... }}.`,
          fixHint:
            'Bungkus konfigurasi di dalam objek JSON root {"pack": {"description": "...", "pack_format": ...}}.',
          docRef: 'docs/knowledge/00-ringkasan-perbedaan-versi.md §2',
        },
      ],
      parsedInfo: null,
      compatibleVersions: [],
      autoDetectedTarget: null,
    };
  }

  const packNode = parseResult.root.props.get('pack');
  if (!packNode || packNode.kind !== 'object') {
    return {
      findings: [
        {
          id: 'M01',
          severity: 'ERROR',
          title: 'Objek "pack" tidak ditemukan di pack.mcmeta',
          message: !packNode
            ? 'Root JSON tidak memiliki properti "pack".'
            : `Properti "pack" bertipe ${packNode.kind}, seharusnya objek JSON.`,
          fixHint:
            'Tambahkan objek "pack" di root pack.mcmeta yang berisi description serta format versi pack.',
          docRef: 'docs/knowledge/00-ringkasan-perbedaan-versi.md §2',
        },
      ],
      parsedInfo: null,
      compatibleVersions: [],
      autoDetectedTarget: null,
    };
  }

  const { fields, schemaFindings } = extractPackFields(packNode.props);
  const hasSchemaErrors = schemaFindings.some((f) => f.severity === 'ERROR');
  const selectedProfile = getVersionProfile(targetVersion);

  const targetFindings = evaluateCompatibilityForProfile(
    fields,
    selectedProfile,
    hasSchemaErrors,
  );

  // M10: Check compatibility across all 6 profiles using exact same validator logic
  const compatibleVersions: TargetVersionId[] = [];
  if (!hasSchemaErrors) {
    for (const profile of VERSION_PROFILES) {
      const profileFindings = evaluateCompatibilityForProfile(
        fields,
        profile,
        false,
      );
      if (profileFindings.every((f) => f.severity !== 'ERROR')) {
        compatibleVersions.push(profile.id);
      }
    }
  }

  const autoDetectedTarget = pickAutoDetectedTarget(fields, compatibleVersions);

  const allFindings: Finding[] = [...schemaFindings, ...targetFindings];

  // M09: Description missing or blank
  if (!fields.hasDescription) {
    allFindings.push({
      id: 'M09',
      severity: 'INFO',
      title: 'description kosong atau tidak ada (opsional)',
      message:
        'Field "description" tidak ditemukan atau kosong di dalam objek "pack".',
      fixHint:
        'Opsional: isi "description" (string atau JSON Text Component) agar pack mudah dikenali di menu Resource Packs.',
      docRef: 'docs/knowledge/java-1.21.1.md §1',
    });
  }

  // M10: Auto-detection summary
  allFindings.push({
    id: 'M10',
    severity: 'INFO',
    title: 'Ringkasan deteksi format pack.mcmeta',
    message: `Deklarasi terbaca: ${summarizeDeclaredFields(fields)}. Versi kompatibel dari 6 profil: ${compatibleVersions.length > 0 ? compatibleVersions.join(', ') : 'tidak ada yang kompatibel tanpa ERROR'}.`,
    fixHint:
      compatibleVersions.length > 0
        ? `Pastikan target versi yang dipilih (${targetVersion}) sesuai dengan daftar versi kompatibel.`
        : 'Perbaiki temuan ERROR di atas agar pack kompatibel dengan minimal satu versi target.',
    docRef: 'docs/knowledge/00-ringkasan-perbedaan-versi.md §1',
  });

  return {
    findings: allFindings,
    parsedInfo: {
      packFormat: fields.packFormat,
      supportedFormats: fields.supportedFormats,
      minFormat: fields.minFormat,
      maxFormat: fields.maxFormat,
      hasDescription: fields.hasDescription,
    },
    compatibleVersions,
    autoDetectedTarget,
  };
}
