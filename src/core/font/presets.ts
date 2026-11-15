import { DEFAULT_RANK_LAYER_ORDER } from './pixelSynth.ts';
import { allocateNextSafePuaChar } from './puaAllocator.ts';
import type {
  BitmapFontEntry,
  FontProject,
  FontProjectEntry,
  RankComposerConfig,
  SpaceFontEntry,
} from './types.ts';

export interface RankPresetTemplate {
  readonly id: string;
  readonly label: string;
  readonly slug: string;
  readonly composer: Partial<RankComposerConfig>;
  readonly height?: number;
  readonly ascent?: number;
}

export const RANK_PRESET_TEMPLATES: readonly RankPresetTemplate[] = [
  {
    id: 'admin',
    label: 'ADMIN',
    slug: 'admin',
    composer: {
      text: 'ADMIN',
      iconId: 'shield',
      iconColor: '#f87171',
      textColor: '#ffffff',
      frameStyle: 'outline',
      frameColor: '#291515',
      frameBorderColor: '#ef4444',
    },
  },
  {
    id: 'vip',
    label: 'VIP',
    slug: 'vip',
    composer: {
      text: 'VIP',
      iconId: 'crown',
      iconColor: '#34d399',
      textColor: '#ffffff',
      frameStyle: 'outline',
      frameColor: '#11221b',
      frameBorderColor: '#10b981',
    },
  },
  {
    id: 'mod',
    label: 'MOD',
    slug: 'mod',
    composer: {
      text: 'MOD',
      iconId: 'star',
      iconColor: '#fbbf24',
      textColor: '#ffffff',
      frameStyle: 'outline',
      frameColor: '#261e12',
      frameBorderColor: '#f59e0b',
    },
  },
  {
    id: 'crystal',
    label: 'CRYSTAL',
    slug: 'crystal',
    composer: {
      text: 'CRYSTAL',
      iconId: 'emerald-gem',
      iconColor: '#38bdf8',
      textColor: '#ffffff',
      frameStyle: 'bevel',
      frameColor: '#0c4a6e',
      frameBorderColor: '#7dd3fc',
    },
  },
  {
    id: 'ace',
    label: 'ACE',
    slug: 'ace',
    composer: {
      text: 'ACE',
      iconId: 'ace-spade',
      iconColor: '#fda4af',
      textColor: '#ffffff',
      frameStyle: 'bevel',
      frameColor: '#9f1239',
      frameBorderColor: '#fda4af',
    },
  },
  {
    id: 'glorious',
    label: 'GLORIOUS',
    slug: 'glorious',
    composer: {
      text: 'GLORIOUS',
      iconId: 'sun-crest',
      iconColor: '#fde68a',
      textColor: '#ffffff',
      frameStyle: 'bevel',
      frameColor: '#b45309',
      frameBorderColor: '#fcd34d',
    },
  },
  {
    id: 'conqueror',
    label: 'CONQUEROR',
    slug: 'conqueror',
    composer: {
      text: 'CONQUEROR',
      iconId: 'helm',
      iconColor: '#ffedd5',
      textColor: '#ffffff',
      frameStyle: 'bevel',
      frameColor: '#9a3412',
      frameBorderColor: '#fb923c',
      badgeLayout: 'split-left',
      splitIconFrame: 'match',
      splitIconFrameColor: '#c2410c',
      splitIconBorderColor: '#fdba74',
      iconGap: 2,
    },
  },
];

export function createDefaultRankComposer(
  overrides?: Partial<RankComposerConfig>,
): RankComposerConfig {
  return {
    text: 'ADMIN',
    fontSize: '3x5',
    textColor: '#ffffff',
    shadowColor: '#0c0a09',
    frameStyle: 'outline',
    frameColor: '#1c1917',
    frameBorderColor: '#10b981',
    iconId: 'shield',
    iconColor: '#34d399',
    paddingX: 2,
    paddingY: 1,
    iconGap: 2,
    badgeLayout: 'unified',
    splitIconFrame: 'match',
    canvasWidthMode: 'auto',
    ...overrides,
  };
}

export function createRankBitmapEntry(
  existingEntries: readonly FontProjectEntry[],
  options: {
    readonly id: string;
    readonly label: string;
    readonly namespace: string;
    readonly slug: string;
    readonly composer?: Partial<RankComposerConfig>;
    readonly height?: number;
    readonly ascent?: number;
    readonly spaceLeft?: number;
    readonly spaceRight?: number;
    readonly charOverride?: string;
  },
): BitmapFontEntry {
  const char =
    options.charOverride ?? allocateNextSafePuaChar(existingEntries);
  const height = options.height ?? 9;
  const ascent = options.ascent ?? 8;
  return {
    kind: 'bitmap',
    id: options.id,
    label: options.label,
    sourceMode: 'composer',
    fileRef: `${options.namespace}:font/rank_${options.slug}.png`,
    height,
    ascent,
    chars: [char],
    spaceLeft: options.spaceLeft ?? -1,
    spaceRight: options.spaceRight ?? 0,
    composer: createDefaultRankComposer(options.composer),
    layerVisibility: {
      frame: true,
      icon: true,
      text: true,
      shadow: true,
      paint: true,
    },
    layerOrder: [...DEFAULT_RANK_LAYER_ORDER],
    layerStyles: {},
    paintEdits: {},
  };
}

export function createSpaceEntry(
  existingEntries: readonly FontProjectEntry[],
  options: {
    readonly id: string;
    readonly label: string;
    readonly advance: number;
    readonly charOverride?: string;
  },
): SpaceFontEntry {
  return {
    kind: 'space',
    id: options.id,
    label: options.label,
    char: options.charOverride ?? allocateNextSafePuaChar(existingEntries),
    advance: options.advance,
  };
}

export function createUploadedPngEntry(
  existingEntries: readonly FontProjectEntry[],
  options: {
    readonly id: string;
    readonly label: string;
    readonly namespace: string;
    readonly fileName: string;
    readonly bytes: Uint8Array;
    readonly chars?: readonly string[];
    readonly height?: number;
    readonly ascent?: number;
  },
): BitmapFontEntry {
  const safeBase = options.fileName
    .toLowerCase()
    .replace(/\.png$/i, '')
    .replace(/[^a-z0-9_.-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'custom_glyph';
  const defaultChar = allocateNextSafePuaChar(existingEntries);

  return {
    kind: 'bitmap',
    id: options.id,
    label: options.label,
    sourceMode: 'uploaded-png',
    fileRef: `${options.namespace}:font/${safeBase}.png`,
    height: options.height ?? 8,
    ascent: options.ascent ?? 7,
    chars: options.chars ?? [defaultChar],
    spaceLeft: 0,
    spaceRight: 0,
    composer: createDefaultRankComposer({ text: 'ICON', iconId: 'none' }),
    layerVisibility: {
      frame: false,
      icon: false,
      text: false,
      shadow: false,
      paint: true,
    },
    paintEdits: {},
    uploadedPngBytes: options.bytes,
    uploadedPngFileName: options.fileName,
  };
}

export function createInitialFontProject(): FontProject {
  const entries: FontProjectEntry[] = [];

  for (const tpl of RANK_PRESET_TEMPLATES) {
    entries.push(
      createRankBitmapEntry(entries, {
        id: `rank-${tpl.id}`,
        label: tpl.label,
        namespace: 'mypack',
        slug: tpl.slug,
        composer: tpl.composer,
        height: tpl.height ?? 9,
        ascent: tpl.ascent ?? 8,
        spaceLeft: -1,
        spaceRight: 0,
      }),
    );
  }

  const negSpace = createSpaceEntry(entries, {
    id: 'space-neg4',
    label: 'Space -4px',
    advance: -4,
  });
  entries.push(negSpace);

  const firstRank = entries[0]!;

  return {
    targetVersion: '26.3',
    namespace: 'mypack',
    fontName: 'default',
    packDescription: 'Rank Badges & Custom Font',
    includePackPng: true,
    entries,
    previewContext: 'Chat',
    guiScale: 2,
    forceUnicode: false,
    luckPermsGroup: 'admin',
    luckPermsWeight: 100,
    prefixSequenceIds: [firstRank.id],
    sampleChatText: 'P0TAT0D0G: Hi, thanks for using my tools!',
    objectComponent: {
      enabled: false,
      mode: 'atlas',
      atlas: 'minecraft:items',
      sprite: 'minecraft:item/diamond',
      playerName: 'Alex',
      hat: true,
    },
  };
}
