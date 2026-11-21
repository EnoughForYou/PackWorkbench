import type { Finding, TargetVersionId } from '../types.ts';

export type PreviewContext = 'Chat' | 'TAB' | 'Nametag';

export type RankFrameStyle = 'none' | 'solid' | 'bevel' | 'pill' | 'outline' | 'ribbon';

export type CanvasWidthMode = 'auto' | 'fixed';

export type RankBadgeLayout = 'unified' | 'split-left';

export type SplitIconFrameMode = 'match' | 'none';

export type RankLayerId = 'frame' | 'shadow' | 'icon' | 'text' | 'paint';

export interface RankLayerStyle {
  readonly opacity: number;
  readonly offsetX: number;
  readonly offsetY: number;
}

export type RankLayerStyleMap = Readonly<
  Partial<Record<RankLayerId, Partial<RankLayerStyle>>>
>;

export type PixelIconId =
  | 'none'
  | 'crown'
  | 'shield'
  | 'star'
  | 'gem'
  | 'bolt'
  | 'flag'
  | 'sword-mark'
  | 'leaf'
  | 'crystal-shard'
  | 'ace-spade'
  | 'sun-crest'
  | 'helm'
  | 'wings'
  | 'flame'
  | 'heart'
  | 'skull'
  | 'diamond-ring'
  | 'trident'
  | 'compass'
  | 'trophy'
  | 'anvil'
  | 'moon'
  | 'wing-crest'
  | 'pixel-orb'
  | 'lock'
  | 'play-btn'
  | 'check-badge'
  | 'ban-sign'
  | 'snowflake'
  | 'hourglass'
  | 'emerald-gem'
  | 'amethyst-shard'
  | 'ingot'
  | 'grass-cube'
  | 'discord-pad';

export type PixelFontSize = '3x5' | '5x5';

export type FontSourceType = 'pixel-builtin' | 'google-font';

export interface GoogleFontConfig {
  readonly family: string;
  readonly category?: 'sans-serif' | 'serif' | 'display' | 'monospace' | 'handwriting';
  readonly weight: number;
  readonly fontSizePx: number;
  readonly style?: 'normal' | 'italic';
}

export interface RankLayerVisibility {
  readonly frame: boolean;
  readonly icon: boolean;
  readonly text: boolean;
  readonly shadow: boolean;
  readonly paint: boolean;
}

export interface RankComposerConfig {
  readonly text: string;
  readonly fontSize: PixelFontSize;
  readonly textColor: string;
  readonly shadowColor: string;
  readonly frameStyle: RankFrameStyle;
  readonly frameColor: string;
  readonly frameBorderColor: string;
  readonly iconId: PixelIconId;
  readonly iconColor: string;
  readonly paddingX: number;
  readonly paddingY: number;
  readonly iconGap: number;
  readonly badgeLayout?: RankBadgeLayout;
  readonly splitIconFrame?: SplitIconFrameMode;
  readonly splitIconFrameColor?: string;
  readonly splitIconBorderColor?: string;
  readonly canvasWidthMode?: CanvasWidthMode;
  readonly customWidth?: number;
  readonly fontSource?: FontSourceType;
  readonly googleFont?: GoogleFontConfig;
}

export type PaintEditMap = Readonly<Record<string, string | null>>;

export interface BitmapFontEntry {
  readonly kind: 'bitmap';
  readonly id: string;
  readonly label: string;
  readonly sourceMode: 'composer' | 'uploaded-png';
  readonly fileRef: string;
  readonly height: number;
  readonly ascent: number;
  readonly chars: readonly string[];
  readonly spaceLeft: number;
  readonly spaceRight: number;
  readonly composer: RankComposerConfig;
  readonly layerVisibility: RankLayerVisibility;
  readonly layerOrder?: readonly RankLayerId[];
  readonly layerStyles?: RankLayerStyleMap;
  readonly paintEdits: PaintEditMap;
  readonly uploadedPngBytes?: Uint8Array;
  readonly uploadedPngFileName?: string;
  readonly cachedCustomRaster?: { width: number; height: number; rgba: Uint8ClampedArray };
}

export interface SpaceFontEntry {
  readonly kind: 'space';
  readonly id: string;
  readonly label: string;
  readonly char: string;
  readonly advance: number;
}

export type FontProjectEntry = BitmapFontEntry | SpaceFontEntry;

export interface ObjectComponentConfig {
  readonly enabled: boolean;
  readonly mode: 'atlas' | 'player';
  readonly atlas: string;
  readonly sprite: string;
  readonly playerName: string;
  readonly hat: boolean;
}

export interface FontProject {
  readonly targetVersion: TargetVersionId;
  readonly namespace: string;
  readonly fontName: string;
  readonly packDescription: string;
  readonly includePackPng: boolean;
  readonly entries: readonly FontProjectEntry[];
  readonly previewContext: PreviewContext;
  readonly guiScale: 1 | 2 | 3 | 4;
  readonly forceUnicode: boolean;
  readonly luckPermsGroup: string;
  readonly luckPermsWeight: number;
  readonly prefixSequenceIds: readonly string[];
  readonly sampleChatText: string;
  readonly objectComponent: ObjectComponentConfig;
}

export interface DecodedRgbaImage {
  readonly width: number;
  readonly height: number;
  readonly rgba: Uint8ClampedArray;
  readonly hasAlphaChannel: boolean;
  readonly colorType: number;
  readonly bitDepth: number;
  readonly interlace: number;
}

export type PngDecodeResult =
  | { readonly ok: true; readonly image: DecodedRgbaImage }
  | { readonly ok: false; readonly error: string };

export interface CellGlyphMetric {
  readonly row: number;
  readonly col: number;
  readonly codepoint: number;
  readonly char: string;
  readonly actualGlyphWidth: number;
  readonly advance: number;
}

export interface BitmapGlyphMetrics {
  readonly imageWidth: number;
  readonly imageHeight: number;
  readonly cols: number;
  readonly rows: number;
  readonly cellW: number;
  readonly cellH: number;
  readonly scale: number;
  readonly top: number;
  readonly bottom: number;
  readonly primaryActualGlyphWidth: number;
  readonly primaryAdvance: number;
  readonly cells: readonly CellGlyphMetric[];
}

export interface FontFinding extends Finding {
  readonly entryId?: string;
  readonly field?: string;
}

export interface FontValidationResult {
  readonly findings: readonly FontFinding[];
  readonly errors: number;
  readonly warns: number;
  readonly infos: number;
  readonly metricsByEntryId: Readonly<Record<string, BitmapGlyphMetrics>>;
  readonly decodeErrorsByEntryId: Readonly<Record<string, string>>;
}
