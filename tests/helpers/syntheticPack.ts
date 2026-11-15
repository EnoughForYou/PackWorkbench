import JSZip from 'jszip';

export interface SyntheticPackFile {
  readonly path: string;
  readonly content?: string | Uint8Array;
}

/**
 * Builds a purely synthetic in-memory resource pack ZIP archive using JSZip.
 * Never embeds any Mojang/vanilla assets.
 */
export async function buildSyntheticZip(
  files: readonly SyntheticPackFile[],
): Promise<Uint8Array> {
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.path, file.content ?? `synthetic:${file.path}`);
  }
  return zip.generateAsync({ type: 'uint8array' });
}

export async function buildMinimalValidPackZip(
  mcmetaJson: string | Record<string, unknown>,
  options?: {
    readonly includePackPng?: boolean;
    readonly includeAssets?: boolean;
    readonly wrapperFolder?: string;
    readonly extraFiles?: readonly SyntheticPackFile[];
  },
): Promise<Uint8Array> {
  const prefix = options?.wrapperFolder ? `${options.wrapperFolder}/` : '';
  const files: SyntheticPackFile[] = [
    {
      path: `${prefix}pack.mcmeta`,
      content:
        typeof mcmetaJson === 'string'
          ? mcmetaJson
          : JSON.stringify(mcmetaJson, null, 2),
    },
  ];

  if (options?.includeAssets ?? true) {
    files.push({
      path: `${prefix}assets/mypack/textures/item/placeholder.png`,
      content: 'synthetic-placeholder-bytes',
    });
  }

  if (options?.includePackPng ?? true) {
    files.push({
      path: `${prefix}pack.png`,
      content: 'synthetic-icon-bytes',
    });
  }

  if (options?.extraFiles) {
    for (const extra of options.extraFiles) {
      files.push(extra);
    }
  }

  return buildSyntheticZip(files);
}
