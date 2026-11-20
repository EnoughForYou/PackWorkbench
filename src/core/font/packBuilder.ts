async function getJSZip(): Promise<typeof import('jszip')> {
  const mod = await import('jszip');
  return ((mod as { default?: typeof import('jszip') }).default || mod) as typeof import('jszip');
}
import { validateResourcePackZip } from '../report.ts';
import { computeSha1ChunkedHex } from '../sha1Stream.ts';
import { measureAsync } from '../telemetry.ts';
import type { TargetVersionId, ValidationReport } from '../types.ts';
import { getVersionProfile } from '../versions.ts';
import { decodePngRgba, encodeRgbaPng } from './pngCodec.ts';
import {
  generateSyntheticPackIconRgba,
  resolveBitmapEntryRaster,
} from './pixelSynth.ts';
import {
  formatJsonUnicodeEscape,
  normalizeFontName,
  resolveEntryPrefixSequence,
  resolveProjectBindings,
  resolveProjectPrefixString,
  type ResolvedProjectBindings,
  type SpaceAdvanceBinding,
} from './puaAllocator.ts';
import {
  evaluateFontProject,
  parseTextureIdentifier,
} from './rules/fontRules.ts';
import type {
  FontProject,
  FontValidationResult,
} from './types.ts';

export {
  resolveEntryPrefixSequence,
  resolveProjectBindings,
  type ResolvedProjectBindings,
  type SpaceAdvanceBinding,
};

export function stringifyAsciiSafeJson(value: unknown, space?: number): string {
  return JSON.stringify(value, null, space).replace(/[^\x20-\x7E\n\r\t]/gu, (ch) =>
    formatJsonUnicodeEscape(ch),
  );
}

/**
 * Builds pack.mcmeta object matching verified Minecraft Java bytecode rules
 * (legacy pack_format=34 for 1.21.1; paired min_format/max_format without supported_formats for 1.21.10+).
 * Reference: docs/knowledge/00-ringkasan-perbedaan-versi.md §2
 */
export function buildPackMcmetaObject(
  targetVersion: TargetVersionId,
  description: string,
): Record<string, unknown> {
  const profile = getVersionProfile(targetVersion);
  const safeDescription =
    description.trim().length > 0
      ? description.trim()
      : `Resource Pack Font (${profile.id})`;

  if (profile.style === 'legacy') {
    return {
      pack: {
        pack_format: profile.format[0],
        description: safeDescription,
      },
    };
  }

  return {
    pack: {
      description: safeDescription,
      min_format: [profile.format[0], profile.format[1]],
      max_format: profile.format[0],
    },
  };
}

/**
 * Builds the Minecraft Java font JSON object (`assets/<ns>/font/<fontName>.json`).
 * Reference: docs/knowledge/font-dan-glyph.md §1
 */
export function buildFontJsonObject(project: FontProject): {
  readonly providers: readonly Record<string, unknown>[];
} {
  const providers: Record<string, unknown>[] = [];
  const { spaceAdvances } = resolveProjectBindings(project);

  for (const entry of project.entries) {
    if (entry.kind === 'bitmap') {
      providers.push({
        type: 'bitmap',
        file: entry.fileRef.trim(),
        ascent: entry.ascent,
        height: entry.height,
        chars: [...entry.chars],
      });
    }
  }

  if (spaceAdvances.length > 0) {
    const advances: Record<string, number> = {};
    for (const item of spaceAdvances) {
      if (!(item.char in advances)) {
        advances[item.char] = item.advance;
      }
    }
    providers.push({
      type: 'space',
      advances,
    });
  }

  return { providers };
}

export interface PluginYamlSnippets {
  readonly itemsAdderYaml: string;
  readonly oraxenYaml: string;
  readonly nexoYaml: string;
}

export interface FontSnippets {
  readonly prefixLiteral: string;
  readonly prefixEscaped: string;
  readonly luckPermsCommand: string;
  readonly placeholderApi: string;
  readonly tellrawCommand: string;
  readonly objectTellrawCommand: string | null;
  readonly pluginYaml: PluginYamlSnippets;
}

function normalizeYamlGlyphSlug(raw: string, fallbackIdx: number): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned.length > 0 ? cleaned : `glyph_${fallbackIdx}`;
}

export function buildPluginYamlSnippets(project: FontProject): PluginYamlSnippets {
  const ns = (project.namespace || 'mypack').trim().toLowerCase() || 'mypack';
  const fontName = normalizeFontName(project.fontName);

  const iaLines: string[] = [
    `# ItemsAdder: plugins/ItemsAdder/data/items_packs/${ns}/${fontName}.yml`,
    'info:',
    `  namespace: ${ns}`,
    'font_images:',
  ];
  const oraxenLines: string[] = [
    `# Oraxen: plugins/Oraxen/glyphs/${ns}_${fontName}.yml`,
  ];
  const nexoLines: string[] = [
    `# Nexo: plugins/Nexo/glyphs/${ns}_${fontName}.yml (or drop ZIP into pack/external_packs/)`,
  ];

  const usedSlugs = new Set<string>();
  let bitmapIdx = 0;

  for (const entry of project.entries) {
    if (entry.kind !== 'bitmap') continue;
    bitmapIdx++;
    let slug = normalizeYamlGlyphSlug(entry.label, bitmapIdx);
    while (usedSlugs.has(slug)) {
      slug = `${slug}_${bitmapIdx}`;
    }
    usedSlugs.add(slug);

    const parsed = parseTextureIdentifier(entry.fileRef);
    const relPath = parsed.path || `font/${entry.id}.png`;
    const texNs = parsed.namespace || ns;
    const pathNoPng = relPath.endsWith('.png')
      ? relPath.slice(0, -'.png'.length)
      : relPath;
    const firstChar = Array.from(entry.chars[0] ?? '')[0] ?? '';
    const escapedSymbol = firstChar ? formatJsonUnicodeEscape(firstChar) : '\\uE200';
    const placeholder = `:${ns}_${slug}:`;

    iaLines.push(
      `  ${slug}:`,
      `    permission: ${ns}.font.${slug}`,
      '    show_in_gui: false',
      `    path: "${relPath}"`,
      `    symbol: "${escapedSymbol}"`,
      `    scale_ratio: ${entry.height}`,
      `    y_position: ${entry.ascent}`,
    );

    oraxenLines.push(
      `${slug}:`,
      `  texture: ${pathNoPng}`,
      `  ascent: ${entry.ascent}`,
      `  height: ${entry.height}`,
      '  chat:',
      '    placeholders:',
      `      - "${placeholder}"`,
      `    permission: "${ns}.font.${slug}"`,
    );

    nexoLines.push(
      `${slug}:`,
      `  texture: ${texNs}:${relPath}`,
      `  ascent: ${entry.ascent}`,
      `  height: ${entry.height}`,
      '  chat:',
      '    placeholders:',
      `      - "${placeholder}"`,
    );
  }

  return {
    itemsAdderYaml: `${iaLines.join('\n')}\n`,
    oraxenYaml: `${oraxenLines.join('\n')}\n`,
    nexoYaml: `${nexoLines.join('\n')}\n`,
  };
}

export function buildProjectSnippets(project: FontProject): FontSnippets {
  const prefixLiteral = resolveProjectPrefixString(project);
  const prefixEscaped = Array.from(prefixLiteral)
    .map(formatJsonUnicodeEscape)
    .join('');

  const group = project.luckPermsGroup.trim() || 'default';
  const weight = Number.isInteger(project.luckPermsWeight)
    ? project.luckPermsWeight
    : 100;
  const ns = (project.namespace || 'mypack').trim().toLowerCase();
  const fontName = normalizeFontName(project.fontName);
  const fontId = `${ns}:${fontName}`;

  const luckPermsCommand = `/lp group ${group} meta setprefix ${weight} "${prefixLiteral}"`;
  const placeholderApi = `%luckperms_prefix% (use font "${fontId}" in chat/TAB/scoreboard)`;

  const tellrawPayload = {
    text: '',
    extra: [
      { text: prefixLiteral, font: fontId },
      { text: ` ${project.sampleChatText || 'P0TAT0D0G: Hi, thanks for using my tools!'}` },
    ],
  };
  const tellrawCommand = `/tellraw @a ${stringifyAsciiSafeJson(tellrawPayload)}`;

  let objectTellrawCommand: string | null = null;
  if (project.objectComponent.enabled) {
    const objNode =
      project.objectComponent.mode === 'player'
        ? {
            type: 'object',
            player: { name: project.objectComponent.playerName || 'Alex' },
            hat: project.objectComponent.hat,
          }
        : {
            type: 'object',
            atlas: project.objectComponent.atlas || 'minecraft:items',
            sprite: project.objectComponent.sprite || 'minecraft:item/diamond',
          };
    objectTellrawCommand = `/tellraw @a ${stringifyAsciiSafeJson({
      text: '',
      extra: [objNode, { text: ` ${project.sampleChatText || 'Hi!'}` }],
    })}`;
  }

  return {
    prefixLiteral,
    prefixEscaped,
    luckPermsCommand,
    placeholderApi,
    tellrawCommand,
    objectTellrawCommand,
    pluginYaml: buildPluginYamlSnippets(project),
  };
}

export interface BuiltFontPackResult {
  readonly zipBytes: Uint8Array;
  readonly fileName: string;
  readonly sha1Hex: string;
  readonly fontJsonText: string;
  readonly mcmetaText: string;
  readonly fontValidation: FontValidationResult;
  readonly zipValidation: ValidationReport;
  readonly snippets: FontSnippets;
}

interface EncodedEntryAsset {
  readonly zipTexturePath: string;
  readonly textureNs: string;
  readonly textureRelPath: string;
  readonly pngBytes: Uint8Array;
}

async function encodeProjectBitmapTextures(
  project: FontProject,
): Promise<EncodedEntryAsset[]> {
  const ns = (project.namespace || 'mypack').trim().toLowerCase() || 'mypack';
  const assets: EncodedEntryAsset[] = [];

  for (const entry of project.entries) {
    if (entry.kind !== 'bitmap') continue;
    const parsedRef = parseTextureIdentifier(entry.fileRef);
    const textureNs = parsedRef.namespace || ns;
    const textureRelPath = parsedRef.path || `font/${entry.id}.png`;
    const zipTexturePath =
      parsedRef.expectedZipTexturePath ?? `assets/${ns}/textures/font/${entry.id}.png`;

    if (entry.sourceMode === 'uploaded-png') {
      if (!entry.uploadedPngBytes) continue;
      if (
        entry.layerVisibility.paint &&
        Object.keys(entry.paintEdits).length > 0
      ) {
        const decoded = await decodePngRgba(entry.uploadedPngBytes);
        if (decoded.ok) {
          const painted = resolveBitmapEntryRaster(entry, decoded.image)!;
          const reencoded = await encodeRgbaPng(
            painted.width,
            painted.height,
            painted.rgba,
          );
          assets.push({
            zipTexturePath,
            textureNs,
            textureRelPath,
            pngBytes: reencoded,
          });
          continue;
        }
      }
      assets.push({
        zipTexturePath,
        textureNs,
        textureRelPath,
        pngBytes: entry.uploadedPngBytes,
      });
    } else {
      const raster = resolveBitmapEntryRaster(entry);
      if (raster) {
        const pngBytes = await encodeRgbaPng(
          raster.width,
          raster.height,
          raster.rgba,
        );
        assets.push({
          zipTexturePath,
          textureNs,
          textureRelPath,
          pngBytes,
        });
      }
    }
  }

  return assets;
}

/**
 * Assembles the Java Edition resource pack ZIP in memory, validates font rules F01–F09,
 * validates the resulting ZIP against Phase 1 validator (asserting 0 errors when font is valid),
 * and computes its exact SHA-1 digest.
 */
export async function buildFontResourcePack(
  project: FontProject,
): Promise<BuiltFontPackResult> {
  return measureAsync('font:build-pack', async () => {
    const fontValidation = await evaluateFontProject(project);
    const mcmetaObj = buildPackMcmetaObject(
      project.targetVersion,
      project.packDescription,
    );
    const mcmetaText = `${JSON.stringify(mcmetaObj, null, 2)}\n`;
    const fontJsonObj = buildFontJsonObject(project);
    const fontJsonText = `${stringifyAsciiSafeJson(fontJsonObj, 2)}\n`;

    const JSZip = await getJSZip();
    const zip = new JSZip();
    zip.file('pack.mcmeta', mcmetaText);

    if (project.includePackPng) {
      const icon = generateSyntheticPackIconRgba();
      const iconPng = await encodeRgbaPng(icon.width, icon.height, icon.rgba);
      zip.file('pack.png', iconPng);
    }

    const ns = (project.namespace || 'mypack').trim().toLowerCase() || 'mypack';
    const fontName = normalizeFontName(project.fontName);
    zip.file(`assets/${ns}/font/${fontName}.json`, fontJsonText);

    const encodedTextures = await encodeProjectBitmapTextures(project);
    for (const asset of encodedTextures) {
      zip.file(asset.zipTexturePath, asset.pngBytes);
    }

    const zipBytes = await zip.generateAsync({ type: 'uint8array' });
    const fileName = `${ns}-font-${project.targetVersion}.zip`;
    const zipValidation = await validateResourcePackZip(
      {
        fileName,
        fileSizeBytes: zipBytes.byteLength,
        data: zipBytes,
      },
      project.targetVersion,
    );
    const sha1Hex = computeSha1ChunkedHex(zipBytes);
    const snippets = buildProjectSnippets(project);

    return {
      zipBytes,
      fileName,
      sha1Hex,
      fontJsonText,
      mcmetaText,
      fontValidation,
      zipValidation,
      snippets,
    };
  });
}

export interface BuiltPluginBundleResult {
  readonly zipBytes: Uint8Array;
  readonly fileName: string;
}

/**
 * Packages ready-to-drop plugin folders for ItemsAdder, Oraxen, and Nexo
 * alongside the vanilla / Nexo external_packs ZIP archive.
 * Reference: docs/knowledge/plugin-itemsadder-oraxen-nexo.md
 */
export async function buildPluginDistributionZip(
  project: FontProject,
): Promise<BuiltPluginBundleResult> {
  const ns = (project.namespace || 'mypack').trim().toLowerCase() || 'mypack';
  const fontName = normalizeFontName(project.fontName);
  const vanillaBuilt = await buildFontResourcePack(project);
  const yaml = buildPluginYamlSnippets(project);
  const textures = await encodeProjectBitmapTextures(project);

  const JSZip = await getJSZip();
  const bundle = new JSZip();
  bundle.file(
    `Vanilla-dan-Nexo-ExternalPack/${vanillaBuilt.fileName}`,
    vanillaBuilt.zipBytes,
  );

  bundle.file(`ItemsAdder/data/items_packs/${ns}/${fontName}.yml`, yaml.itemsAdderYaml);
  bundle.file(`Oraxen/glyphs/${ns}_${fontName}.yml`, yaml.oraxenYaml);
  bundle.file(`Nexo/glyphs/${ns}_${fontName}.yml`, yaml.nexoYaml);

  for (const asset of textures) {
    bundle.file(
      `ItemsAdder/data/resource_pack/${asset.zipTexturePath}`,
      asset.pngBytes,
    );
    bundle.file(`Oraxen/pack/textures/${asset.textureRelPath}`, asset.pngBytes);
    bundle.file(`Nexo/pack/${asset.zipTexturePath}`, asset.pngBytes);
  }

  const guideText = [
    'Pack Workbench — Panduan Pemasangan Bundle Plugin & Vanilla',
    '============================================================',
    '',
    '1. Nexo (Jalur Termudah — External Pack):',
    `   Salin file Vanilla-dan-Nexo-ExternalPack/${vanillaBuilt.fileName}`,
    '   ke plugins/Nexo/pack/external_packs/ lalu jalankan /nexo reload dan /nexo pack.',
    '',
    '2. Nexo (Jalur Glyph YAML):',
    '   Salin isi folder Nexo/ ke plugins/Nexo/ lalu jalankan /nexo reload dan /nexo pack.',
    '',
    '3. ItemsAdder:',
    '   Salin isi folder ItemsAdder/ (data/items_packs dan data/resource_pack)',
    '   ke plugins/ItemsAdder/ lalu jalankan /iareload kemudian /iazip.',
    '',
    '4. Oraxen:',
    '   Salin isi folder Oraxen/ (glyphs/ dan pack/textures/) ke plugins/Oraxen/',
    '   lalu jalankan /o reload all.',
    '',
    `Prefix LuckPerms langsung (untuk mode Vanilla/Nexo external_packs):`,
    vanillaBuilt.snippets.luckPermsCommand,
    '',
  ].join('\n');
  bundle.file('PANDUAN-PASANG.txt', guideText);

  const zipBytes = await bundle.generateAsync({ type: 'uint8array' });
  return {
    zipBytes,
    fileName: `${ns}-plugins-bundle-${project.targetVersion}.zip`,
  };
}
