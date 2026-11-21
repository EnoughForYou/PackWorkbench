import type {
  PackFormatTuple,
  TargetVersionId,
  VersionProfile,
} from './types.ts';

/**
 * Last major resource pack format version before minor-versioning was introduced in 1.21.9 (format 65.0).
 * Reference: docs/knowledge/00-ringkasan-perbedaan-versi.md
 */
export const LAST_PRE_MINOR_CLIENT_FORMAT = 64;

/**
 * Unbounded minor sentinel used by Mojang PackFormat.of(major) for inclusive upper bounds (max_format as single integer).
 * Reference: docs/knowledge/00-ringkasan-perbedaan-versi.md & 26.3/client.jar PackFormat
 */
export const MAX_MINOR_SENTINEL = 2_147_483_647;

/**
 * Client-side resource pack download limit enforced by DownloadedPackSource (250 MiB).
 * Reference: docs/knowledge/java-1.21.1.md §7 & docs/knowledge/java-26.3.md §7
 */
export const MAX_SERVER_PACK_BYTES = 250 * 1024 * 1024; // 262,144,000 bytes

/**
 * Ordered list of supported Minecraft Java Edition version profiles.
 * Reference: docs/knowledge/00-ringkasan-perbedaan-versi.md
 */
export const VERSION_PROFILES: readonly VersionProfile[] = [
  {
    id: '1.21.1',
    label: '1.21.1 (format 34)',
    format: [34, 0],
    style: 'legacy',
    supportsMinMax: false,
    docRef: 'docs/knowledge/java-1.21.1.md §1',
  },
  {
    id: '1.21.2',
    label: '1.21.2 - 1.21.3 (format 42)',
    format: [42, 0],
    style: 'legacy',
    supportsMinMax: false,
    docRef: 'docs/knowledge/java-1.21.2-1.21.4.md §1',
  },
  {
    id: '1.21.4',
    label: '1.21.4 (format 46)',
    format: [46, 0],
    style: 'legacy',
    supportsMinMax: false,
    docRef: 'docs/knowledge/java-1.21.2-1.21.4.md §1',
  },
  {
    id: '1.21.5',
    label: '1.21.5 (format 55)',
    format: [55, 0],
    style: 'legacy',
    supportsMinMax: false,
    docRef: 'docs/knowledge/java-1.21.5-1.21.8.md §1',
  },
  {
    id: '1.21.6',
    label: '1.21.6 (format 63)',
    format: [63, 0],
    style: 'legacy',
    supportsMinMax: false,
    docRef: 'docs/knowledge/java-1.21.5-1.21.8.md §1',
  },
  {
    id: '1.21.8',
    label: '1.21.7 - 1.21.8 (format 64)',
    format: [64, 0],
    style: 'legacy',
    supportsMinMax: false,
    docRef: 'docs/knowledge/java-1.21.5-1.21.8.md §1',
  },
  {
    id: '1.21.9',
    label: '1.21.9 (format 69.0)',
    format: [69, 0],
    style: 'range',
    supportsMinMax: true,
    docRef: 'docs/knowledge/java-1.21.9.md §1',
  },
  {
    id: '1.21.10',
    label: '1.21.10 (format 69.0)',
    format: [69, 0],
    style: 'range',
    supportsMinMax: true,
    docRef: 'docs/knowledge/java-1.21.10.md §1',
  },
  {
    id: '1.21.11',
    label: '1.21.11 (format 75.0)',
    format: [75, 0],
    style: 'range',
    supportsMinMax: true,
    docRef: 'docs/knowledge/java-1.21.11.md §1',
  },
  {
    id: '26.1.2',
    label: '26.1.2 (format 84.0)',
    format: [84, 0],
    style: 'range',
    supportsMinMax: true,
    docRef: 'docs/knowledge/java-26.1.2.md §1',
  },
  {
    id: '26.2',
    label: '26.2 (format 88.0)',
    format: [88, 0],
    style: 'range',
    supportsMinMax: true,
    docRef: 'docs/knowledge/java-26.2.md §1',
  },
  {
    id: '26.3',
    label: '26.3 (format 97.1)',
    format: [97, 1],
    style: 'range',
    supportsMinMax: true,
    docRef: 'docs/knowledge/java-26.3.md §1',
  },
] as const;

const PROFILE_MAP: Readonly<Record<TargetVersionId, VersionProfile>> =
  Object.fromEntries(VERSION_PROFILES.map((p) => [p.id, p])) as Record<
    TargetVersionId,
    VersionProfile
  >;

export const DEFAULT_TARGET_VERSION: TargetVersionId = '1.21.10';

export function getVersionProfile(id: TargetVersionId): VersionProfile {
  return PROFILE_MAP[id];
}

export function comparePackFormat(
  a: PackFormatTuple,
  b: PackFormatTuple,
): number {
  if (a[0] !== b[0]) {
    return a[0] - b[0];
  }
  return a[1] - b[1];
}

export function formatTupleLabel(
  tuple: PackFormatTuple,
  isUpperBound = false,
): string {
  if (isUpperBound && tuple[1] === MAX_MINOR_SENTINEL) {
    return `${tuple[0]} (semua minor)`;
  }
  return `[${tuple[0]}, ${tuple[1]}]`;
}
