import type {
  BitmapFontEntry,
  FontProject,
  FontProjectEntry,
  SpaceFontEntry,
} from './types.ts';

export const PUA_START = 0xe000;
export const PUA_BEDROCK_SAFE_START = 0xe200;
export const PUA_END = 0xf8ff;

export function formatCodepointHex(cp: number): string {
  return `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
}

export function formatJsonUnicodeEscape(ch: string): string {
  const cp = ch.codePointAt(0);
  if (cp === undefined) return '';
  if (cp <= 0xffff) {
    return `\\u${cp.toString(16).toUpperCase().padStart(4, '0')}`;
  }
  // Surrogate pair for JSON/MC escape compatibility or raw UTF-8 char
  const offset = cp - 0x10000;
  const high = 0xd800 + (offset >> 10);
  const low = 0xdc00 + (offset & 0x3ff);
  return `\\u${high.toString(16).toUpperCase().padStart(4, '0')}\\u${low.toString(16).toUpperCase().padStart(4, '0')}`;
}

export function parseCodepointInput(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const bracedMatch = /^\\u\{([0-9a-fA-F]{1,6})\}$/i.exec(trimmed);
  if (bracedMatch) {
    const cp = Number.parseInt(bracedMatch[1]!, 16);
    if (cp >= 0 && cp <= 0x10ffff) {
      return cp;
    }
  }

  const uPlusMatch = /^(?:U\+|\\u|0x)?([0-9a-fA-F]{4,6})$/i.exec(trimmed);
  if (uPlusMatch && trimmed.length > 1) {
    const cp = Number.parseInt(uPlusMatch[1]!, 16);
    if (cp >= 0 && cp <= 0x10ffff) {
      return cp;
    }
  }

  const cps = Array.from(trimmed);
  if (cps.length === 1) {
    return cps[0]!.codePointAt(0) ?? null;
  }

  return null;
}

export function normalizeFontName(fontName: string): string {
  const cleaned = fontName.trim().toLowerCase().replace(/\.json$/i, '');
  return cleaned || 'default';
}

export function isBedrockReservedPua(cp: number): boolean {
  return cp >= 0xe000 && cp <= 0xe1ff;
}

export function isPrivateUseCodepoint(cp: number): boolean {
  return (
    (cp >= 0xe000 && cp <= 0xf8ff) ||
    (cp >= 0xf0000 && cp <= 0xffffd) ||
    (cp >= 0x100000 && cp <= 0x10fffd)
  );
}

export function collectUsedCodepoints(
  entries: readonly FontProjectEntry[],
): Set<number> {
  const used = new Set<number>();
  for (const entry of entries) {
    if (entry.kind === 'bitmap') {
      for (const row of entry.chars) {
        for (const ch of Array.from(row)) {
          const cp = ch.codePointAt(0);
          if (cp !== undefined && cp !== 0) {
            used.add(cp);
          }
        }
      }
    } else {
      const cp = entry.char.codePointAt(0);
      if (cp !== undefined && cp !== 0) {
        used.add(cp);
      }
    }
  }
  return used;
}

/**
 * Allocates the next free codepoint starting at U+E200 to avoid Bedrock HUD/controller pages (U+E000–U+E1FF).
 * Reference: docs/knowledge/bedrock-geyser.md §2
 */
export function allocateNextSafePuaChar(
  entries: readonly FontProjectEntry[],
  startFrom = PUA_BEDROCK_SAFE_START,
): string {
  const used = collectUsedCodepoints(entries);
  const start = Math.max(PUA_BEDROCK_SAFE_START, startFrom);
  for (let cp = start; cp <= PUA_END; cp++) {
    if (!used.has(cp)) {
      return String.fromCodePoint(cp);
    }
  }
  return String.fromCodePoint(PUA_BEDROCK_SAFE_START);
}

export interface SpaceAdvanceBinding {
  readonly char: string;
  readonly advance: number;
  readonly source: 'explicit' | 'padding';
}

export interface ResolvedProjectBindings {
  readonly spaceAdvances: readonly SpaceAdvanceBinding[];
  readonly paddingCharByAdvance: ReadonlyMap<number, string>;
}

/**
 * Resolves explicit SpaceFontEntry items plus any non-zero spaceLeft/spaceRight
 * padding on composer BitmapFontEntry items into a non-colliding PUA binding set.
 */
export function resolveProjectBindings(
  project: FontProject,
): ResolvedProjectBindings {
  const explicitByAdvance = new Map<number, string>();
  const spaceAdvances: SpaceAdvanceBinding[] = [];
  const syntheticEntries = [...project.entries];

  for (const entry of project.entries) {
    if (entry.kind === 'space' && Array.from(entry.char).length === 1) {
      spaceAdvances.push({
        char: entry.char,
        advance: entry.advance,
        source: 'explicit',
      });
      if (!explicitByAdvance.has(entry.advance)) {
        explicitByAdvance.set(entry.advance, entry.char);
      }
    }
  }

  const paddingCharByAdvance = new Map<number, string>();
  for (const entry of project.entries) {
    if (entry.kind !== 'bitmap' || entry.sourceMode !== 'composer') continue;
    for (const padVal of [entry.spaceLeft, entry.spaceRight]) {
      if (padVal === 0 || !Number.isFinite(padVal)) continue;
      if (explicitByAdvance.has(padVal)) {
        paddingCharByAdvance.set(padVal, explicitByAdvance.get(padVal)!);
        continue;
      }
      if (!paddingCharByAdvance.has(padVal)) {
        const allocatedChar = allocateNextSafePuaChar(
          syntheticEntries,
          0xe2e0,
        );
        paddingCharByAdvance.set(padVal, allocatedChar);
        const virtualSpace: SpaceFontEntry = {
          kind: 'space',
          id: `__pad_${padVal}`,
          label: `Padding ${padVal}`,
          char: allocatedChar,
          advance: padVal,
        };
        syntheticEntries.push(virtualSpace);
        spaceAdvances.push({
          char: allocatedChar,
          advance: padVal,
          source: 'padding',
        });
      }
    }
  }

  return { spaceAdvances, paddingCharByAdvance };
}

export function resolveEntryPrefixSequence(
  entry: BitmapFontEntry,
  paddingCharByAdvance: ReadonlyMap<number, string>,
): string {
  const glyphChar = Array.from(entry.chars[0] ?? '')[0] ?? '';
  if (!glyphChar) return '';
  if (entry.sourceMode !== 'composer') return glyphChar;
  const left =
    entry.spaceLeft !== 0
      ? (paddingCharByAdvance.get(entry.spaceLeft) ?? '')
      : '';
  const right =
    entry.spaceRight !== 0
      ? (paddingCharByAdvance.get(entry.spaceRight) ?? '')
      : '';
  return `${left}${glyphChar}${right}`;
}

export function resolveProjectPrefixString(project: FontProject): string {
  const { paddingCharByAdvance } = resolveProjectBindings(project);
  const parts: string[] = [];

  const seqIds =
    project.prefixSequenceIds.length > 0
      ? project.prefixSequenceIds
      : project.entries
          .filter((e) => e.kind === 'bitmap')
          .slice(0, 1)
          .map((e) => e.id);

  for (const id of seqIds) {
    const entry = project.entries.find((e) => e.id === id);
    if (!entry) continue;
    if (entry.kind === 'space') {
      parts.push(entry.char);
    } else {
      parts.push(resolveEntryPrefixSequence(entry, paddingCharByAdvance));
    }
  }

  return parts.join('');
}
