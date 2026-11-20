import type JSZip from 'jszip';

async function getJSZip(): Promise<typeof import('jszip')> {
  const mod = await import('jszip');
  return ((mod as { default?: typeof import('jszip') }).default || mod) as typeof import('jszip');
}
import type {
  PackFontAudit,
  PluginBundleDetection,
  PluginEcosystemKind,
  ZipEntryInfo,
  ZipInspection,
} from './types.ts';

export interface InspectZipInput {
  readonly fileName: string;
  readonly fileSizeBytes: number;
  readonly data: Uint8Array | ArrayBuffer;
}

const EMPTY_PLUGIN_BUNDLE: PluginBundleDetection = {
  ecosystems: [],
  nestedZipPaths: [],
  itemsAdderPaths: [],
  oraxenPaths: [],
  nexoPaths: [],
};

const EMPTY_FONT_AUDIT: PackFontAudit = {
  fontJsonFiles: [],
  missingTextures: [],
  negativeHeightProviders: [],
  nonPuaChars: [],
};

function isMacOsMetadataPath(path: string): boolean {
  const parts = path.split('/');
  return parts.some((segment) => segment === '__MACOSX');
}

function isAnyPuaCodepoint(cp: number): boolean {
  return (
    (cp >= 0xe000 && cp <= 0xf8ff) ||
    (cp >= 0xf0000 && cp <= 0xffffd) ||
    (cp >= 0x100000 && cp <= 0x10fffd)
  );
}

function detectPluginBundle(entries: readonly ZipEntryInfo[]): PluginBundleDetection {
  const itemsAdderPaths: string[] = [];
  const oraxenPaths: string[] = [];
  const nexoPaths: string[] = [];
  const nestedZipPaths: string[] = [];

  let hasPackTexturesDir = false;
  let hasGlyphsYml = false;

  for (const entry of entries) {
    if (isMacOsMetadataPath(entry.path)) continue;
    const p = entry.path;

    if (!entry.dir && p.toLowerCase().endsWith('.zip')) {
      nestedZipPaths.push(p);
    }

    if (/(?:^|\/)pack\/textures\//i.test(p)) {
      hasPackTexturesDir = true;
    }
    if (/(?:^|\/)glyphs\/[^/]+\.ya?ml$/i.test(p)) {
      hasGlyphsYml = true;
    }

    if (
      !entry.dir &&
      (/(?:^|\/)ItemsAdder[^/]*\/data\/(?:items_packs|resource_pack)\//i.test(p) ||
        /(?:^|\/)items_packs\/[^/]+\/.+\.ya?ml$/i.test(p) ||
        /(?:^|\/)contents\/[^/]+\/(?:configs|resourcepack)\//i.test(p))
    ) {
      if (itemsAdderPaths.length < 10) itemsAdderPaths.push(p);
    }

    if (
      !entry.dir &&
      (/(?:^|\/)Oraxen[^/]*\/(?:items|glyphs|pack)\//i.test(p) ||
        /(?:^|\/)Oraxen\/.+\.ya?ml$/i.test(p))
    ) {
      if (oraxenPaths.length < 10) oraxenPaths.push(p);
    }

    if (
      !entry.dir &&
      (/(?:^|\/)Nexo[^/]*\/(?:items|glyphs|pack)\//i.test(p) ||
        /(?:^|\/)pack\/external_packs\//i.test(p))
    ) {
      if (nexoPaths.length < 10) nexoPaths.push(p);
    }
  }

  // Fallback Oraxen signal when root starts directly with glyphs/*.yml + pack/textures/ (without Oraxen wrapper)
  if (oraxenPaths.length === 0 && nexoPaths.length === 0 && hasPackTexturesDir && hasGlyphsYml) {
    const sampleGlyph = entries.find(
      (e) => !e.dir && /(?:^|\/)glyphs\/[^/]+\.ya?ml$/i.test(e.path),
    );
    if (sampleGlyph) {
      oraxenPaths.push(sampleGlyph.path);
    }
  }

  const ecosystems: PluginEcosystemKind[] = [];
  if (itemsAdderPaths.length > 0) ecosystems.push('itemsadder');
  if (oraxenPaths.length > 0) ecosystems.push('oraxen');
  if (nexoPaths.length > 0) ecosystems.push('nexo');

  return {
    ecosystems,
    nestedZipPaths,
    itemsAdderPaths,
    oraxenPaths,
    nexoPaths,
  };
}

async function auditFontJsonInZip(
  zip: JSZip,
  entries: readonly ZipEntryInfo[],
  packPrefix: string,
): Promise<PackFontAudit> {
  const fileSet = new Set<string>();
  const fontJsonFiles: string[] = [];
  const assetsPrefix = `${packPrefix}assets/`;

  for (const entry of entries) {
    if (entry.dir || isMacOsMetadataPath(entry.path)) continue;
    fileSet.add(entry.path);
    if (entry.path.startsWith(assetsPrefix)) {
      const rel = entry.path.slice(assetsPrefix.length);
      if (/^[^/]+\/font\/.+\.json$/.test(rel)) {
        fontJsonFiles.push(entry.path);
      }
    }
  }

  if (fontJsonFiles.length === 0) {
    return EMPTY_FONT_AUDIT;
  }

  const missingTextures: string[] = [];
  const negativeHeightProviders: string[] = [];
  const nonPuaChars: string[] = [];
  const seenMissing = new Set<string>();
  const seenNonPua = new Set<string>();

  for (const fontPath of fontJsonFiles) {
    const fileObj = zip.file(fontPath);
    if (!fileObj) continue;
    let parsed: unknown;
    try {
      const raw = await fileObj.async('string');
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }

    if (!parsed || typeof parsed !== 'object') continue;
    const providers = (parsed as { providers?: unknown }).providers;
    if (!Array.isArray(providers)) continue;

    for (const provider of providers) {
      if (!provider || typeof provider !== 'object') continue;
      const rec = provider as Record<string, unknown>;
      if (rec.type !== 'bitmap') continue;

      const fileRef = typeof rec.file === 'string' ? rec.file.trim() : '';
      const height = typeof rec.height === 'number' ? rec.height : 8;
      const ascent = typeof rec.ascent === 'number' ? rec.ascent : 0;
      const chars = Array.isArray(rec.chars)
        ? rec.chars.filter((c): c is string => typeof c === 'string')
        : [];

      if (fileRef.length > 0) {
        const colonIdx = fileRef.indexOf(':');
        const texNs = colonIdx === -1 ? 'minecraft' : fileRef.slice(0, colonIdx);
        const texRel = colonIdx === -1 ? fileRef : fileRef.slice(colonIdx + 1);
        const normalizedRel = texRel.startsWith('textures/')
          ? texRel.slice('textures/'.length)
          : texRel;
        const expectedPath = `${packPrefix}assets/${texNs}/textures/${normalizedRel}`;
        if (!fileSet.has(expectedPath) && !seenMissing.has(expectedPath)) {
          seenMissing.add(expectedPath);
          missingTextures.push(`${fileRef} → ${expectedPath}`);
        }
      }

      if (height <= 0 || ascent < -512) {
        negativeHeightProviders.push(
          `${fontPath}: ${fileRef || '(tanpa file)'} (height=${height}, ascent=${ascent})`,
        );
      }

      const cellCount = chars.reduce((sum, row) => sum + Array.from(row).length, 0);
      if (cellCount > 0 && cellCount <= 4) {
        for (const row of chars) {
          for (const ch of Array.from(row)) {
            const cp = ch.codePointAt(0) ?? 0;
            if (cp > 0x7e && !isAnyPuaCodepoint(cp) && cp >= 0x3400 && cp <= 0xfaff) {
              const hex = `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
              if (!seenNonPua.has(hex) && nonPuaChars.length < 12) {
                seenNonPua.add(hex);
                nonPuaChars.push(`${hex} (${fileRef || fontPath})`);
              }
            }
          }
        }
      }
    }
  }

  return {
    fontJsonFiles,
    missingTextures,
    negativeHeightProviders,
    nonPuaChars,
  };
}

/**
 * Extracts a nested ZIP archive stored inside a multi-plugin/creator bundle ZIP.
 */
export async function extractNestedZipEntry(
  data: Uint8Array | ArrayBuffer,
  nestedPath: string,
): Promise<Uint8Array | null> {
  const JSZip = await getJSZip();
  const zip = await JSZip.loadAsync(data);
  const target = zip.file(nestedPath);
  if (!target || target.dir) return null;
  return target.async('uint8array');
}

/**
 * Inspects a ZIP archive in memory without executing or rendering any assets.
 * Pure Node/Browser module (works with ArrayBuffer or Uint8Array).
 */
export async function inspectZipBuffer(
  input: InspectZipInput,
): Promise<ZipInspection> {
  let zip: JSZip;
  try {
    const JSZip = await getJSZip();
    zip = await JSZip.loadAsync(input.data);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return {
      validZip: false,
      parseError: detail,
      fileName: input.fileName,
      fileSizeBytes: input.fileSizeBytes,
      entries: [],
      hasRootMcmeta: false,
      wrapperFolder: null,
      packPrefix: '',
      mcmetaRawText: null,
      pluginBundle: EMPTY_PLUGIN_BUNDLE,
      fontAudit: EMPTY_FONT_AUDIT,
    };
  }

  const entries: ZipEntryInfo[] = [];
  for (const obj of Object.values(zip.files)) {
    entries.push({
      path: obj.name,
      dir: obj.dir,
    });
  }

  const pluginBundle = detectPluginBundle(entries);

  const rootMcmetaFile = zip.file('pack.mcmeta');
  if (rootMcmetaFile && !rootMcmetaFile.dir) {
    const mcmetaRawText = await rootMcmetaFile.async('string');
    const fontAudit = await auditFontJsonInZip(zip, entries, '');
    return {
      validZip: true,
      fileName: input.fileName,
      fileSizeBytes: input.fileSizeBytes,
      entries,
      hasRootMcmeta: true,
      wrapperFolder: null,
      packPrefix: '',
      mcmetaRawText,
      pluginBundle,
      fontAudit,
    };
  }

  // Check for single wrapper directory containing pack.mcmeta (e.g. "MyPack/pack.mcmeta")
  const nestedMcmetaEntries = entries.filter(
    (entry) =>
      !entry.dir &&
      !isMacOsMetadataPath(entry.path) &&
      entry.path.endsWith('/pack.mcmeta'),
  );

  if (nestedMcmetaEntries.length === 1) {
    const candidate = nestedMcmetaEntries[0]!;
    const wrapperFolder = candidate.path.slice(0, -'/pack.mcmeta'.length);
    const packPrefix = `${wrapperFolder}/`;
    const nestedFile = zip.file(candidate.path);
    const mcmetaRawText = nestedFile ? await nestedFile.async('string') : null;
    const fontAudit = await auditFontJsonInZip(zip, entries, packPrefix);
    return {
      validZip: true,
      fileName: input.fileName,
      fileSizeBytes: input.fileSizeBytes,
      entries,
      hasRootMcmeta: false,
      wrapperFolder,
      packPrefix,
      mcmetaRawText,
      pluginBundle,
      fontAudit,
    };
  }

  return {
    validZip: true,
    fileName: input.fileName,
    fileSizeBytes: input.fileSizeBytes,
    entries,
    hasRootMcmeta: false,
    wrapperFolder: null,
    packPrefix: '',
    mcmetaRawText: null,
    pluginBundle,
    fontAudit: EMPTY_FONT_AUDIT,
  };
}
