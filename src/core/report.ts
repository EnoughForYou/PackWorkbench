import { evaluateMcmetaText } from './rules/mcmetaRules.ts';
import { evaluateZipRules } from './rules/zipRules.ts';
import { measureAsync } from './telemetry.ts';
import type {
  Finding,
  TargetVersionId,
  ValidationReport,
  ValidationSummary,
} from './types.ts';
import { DEFAULT_TARGET_VERSION } from './versions.ts';
import { type InspectZipInput, inspectZipBuffer } from './zipReader.ts';

function summarizeFindings(findings: readonly Finding[]): ValidationSummary {
  let errors = 0;
  let warns = 0;
  let infos = 0;
  for (const item of findings) {
    if (item.severity === 'ERROR') errors++;
    else if (item.severity === 'WARN') warns++;
    else infos++;
  }
  return { errors, warns, infos };
}

/**
 * Validates an already-inspected ZIP (sync after initial ZIP inspection, useful when
 * the user switches target version dropdown without re-unzipping the archive).
 */
export function buildValidationReportFromInspection(
  zipInspection: Awaited<ReturnType<typeof inspectZipBuffer>>,
  targetVersion: TargetVersionId,
): ValidationReport {
  const zipFindings = evaluateZipRules(zipInspection);

  if (zipInspection.validZip && zipInspection.mcmetaRawText !== null) {
    const mcmetaEval = evaluateMcmetaText(
      zipInspection.mcmetaRawText,
      targetVersion,
    );
    const findings = [...zipFindings, ...mcmetaEval.findings];
    return {
      targetVersion,
      autoDetectedTarget: mcmetaEval.autoDetectedTarget,
      compatibleVersions: mcmetaEval.compatibleVersions,
      detectedPackInfo: mcmetaEval.parsedInfo,
      findings,
      summary: summarizeFindings(findings),
      zipInspection,
    };
  }

  return {
    targetVersion,
    autoDetectedTarget: null,
    compatibleVersions: [],
    detectedPackInfo: null,
    findings: zipFindings,
    summary: summarizeFindings(zipFindings),
    zipInspection,
  };
}

/**
 * Full resource pack validation pipeline for Node tests or browser usage.
 */
export async function validateResourcePackZip(
  input: InspectZipInput,
  targetVersion?: TargetVersionId,
): Promise<ValidationReport> {
  return measureAsync('zip:validate', async () => {
    const inspection = await inspectZipBuffer(input);
    const initialReport = buildValidationReportFromInspection(
      inspection,
      targetVersion ?? DEFAULT_TARGET_VERSION,
    );

    // When caller did not force a target version, switch automatically to detected compatible target
    if (
      targetVersion === undefined &&
      initialReport.autoDetectedTarget !== null &&
      initialReport.autoDetectedTarget !== initialReport.targetVersion
    ) {
      return buildValidationReportFromInspection(
        inspection,
        initialReport.autoDetectedTarget,
      );
    }

    return initialReport;
  });
}

export interface ServerPropertiesOptions {
  readonly downloadUrl: string;
  readonly sha1Hex: string;
  readonly requireResourcePack?: boolean;
  readonly includeResourcePackId?: boolean;
  readonly resourcePackId?: string;
  readonly includeResourcePackPrompt?: boolean;
  readonly resourcePackPrompt?: string;
}

/**
 * Generates server.properties snippet for Minecraft Java server resource packs.
 * Reference: docs/knowledge/java-1.21.1.md §7 & docs/knowledge/java-26.3.md §7
 */
export function generateServerPropertiesSnippet(
  options: ServerPropertiesOptions,
): string {
  const trimmedUrl = options.downloadUrl.trim();
  const resourcePackUrl =
    trimmedUrl.length > 0
      ? trimmedUrl
      : 'https://example.com/resourcepack.zip';
  const requirePack = options.requireResourcePack ?? true;

  const lines: string[] = [
    `resource-pack=${resourcePackUrl}`,
    `resource-pack-sha1=${options.sha1Hex.toLowerCase()}`,
    `require-resource-pack=${requirePack ? 'true' : 'false'}`,
  ];

  if (options.includeResourcePackId) {
    const idVal = (options.resourcePackId ?? '').trim();
    lines.push(
      `resource-pack-id=${idVal.length > 0 ? idVal : '00000000-0000-4000-8000-000000000000'}`,
    );
  }

  if (options.includeResourcePackPrompt) {
    const promptVal = (options.resourcePackPrompt ?? '').trim();
    lines.push(
      `resource-pack-prompt=${promptVal.length > 0 ? promptVal : '{"text":"Silakan pasang resource pack server untuk tampilan terbaik."}'}`,
    );
  }

  return lines.join('\n');
}
