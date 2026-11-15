export type Severity = 'ERROR' | 'WARN' | 'INFO';

export type TargetVersionId =
  | '1.21.1'
  | '1.21.10'
  | '1.21.11'
  | '26.1.2'
  | '26.2'
  | '26.3';

export type VersionFormatStyle = 'legacy' | 'range';

export type PackFormatTuple = readonly [major: number, minor: number];

export interface VersionProfile {
  readonly id: TargetVersionId;
  readonly label: string;
  readonly format: PackFormatTuple;
  readonly style: VersionFormatStyle;
  readonly supportsMinMax: boolean;
  readonly docRef: string;
}

export interface Finding {
  readonly id: string;
  readonly severity: Severity;
  readonly title: string;
  readonly message: string;
  readonly fixHint: string;
  readonly docRef: string;
  readonly paths?: readonly string[];
}

export interface ZipEntryInfo {
  readonly path: string;
  readonly dir: boolean;
}

export type PluginEcosystemKind = 'itemsadder' | 'oraxen' | 'nexo';

export interface PluginBundleDetection {
  readonly ecosystems: readonly PluginEcosystemKind[];
  readonly nestedZipPaths: readonly string[];
  readonly itemsAdderPaths: readonly string[];
  readonly oraxenPaths: readonly string[];
  readonly nexoPaths: readonly string[];
}

export interface PackFontAudit {
  readonly fontJsonFiles: readonly string[];
  readonly missingTextures: readonly string[];
  readonly negativeHeightProviders: readonly string[];
  readonly nonPuaChars: readonly string[];
}

export interface ZipInspection {
  readonly validZip: boolean;
  readonly parseError?: string;
  readonly fileName: string;
  readonly fileSizeBytes: number;
  readonly entries: readonly ZipEntryInfo[];
  readonly hasRootMcmeta: boolean;
  readonly wrapperFolder: string | null;
  readonly packPrefix: string;
  readonly mcmetaRawText: string | null;
  readonly pluginBundle: PluginBundleDetection;
  readonly fontAudit: PackFontAudit;
}

export interface ValidationSummary {
  readonly errors: number;
  readonly warns: number;
  readonly infos: number;
}

export interface McmetaParsedInfo {
  readonly packFormat?: number;
  readonly supportedFormats?: readonly [min: number, max: number];
  readonly minFormat?: PackFormatTuple;
  readonly maxFormat?: PackFormatTuple;
  readonly hasDescription: boolean;
}

export interface ValidationReport {
  readonly targetVersion: TargetVersionId;
  readonly autoDetectedTarget: TargetVersionId | null;
  readonly compatibleVersions: readonly TargetVersionId[];
  readonly detectedPackInfo: McmetaParsedInfo | null;
  readonly findings: readonly Finding[];
  readonly summary: ValidationSummary;
  readonly zipInspection: ZipInspection;
}
