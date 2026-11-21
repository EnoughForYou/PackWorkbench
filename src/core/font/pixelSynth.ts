import type {
  BitmapFontEntry,
  DecodedRgbaImage,
  PaintEditMap,
  PixelFontSize,
  PixelIconId,
  RankComposerConfig,
  RankFrameStyle,
  RankLayerId,
  RankLayerStyleMap,
  RankLayerVisibility,
} from './types.ts';

export const DEFAULT_RANK_LAYER_ORDER: readonly RankLayerId[] = [
  'frame',
  'shadow',
  'icon',
  'text',
  'paint',
];

export interface RgbaRaster {
  readonly width: number;
  readonly height: number;
  readonly rgba: Uint8ClampedArray;
}

export interface PixelIconDefinition {
  readonly id: PixelIconId;
  readonly label: string;
  readonly width: number;
  readonly height: number;
  readonly rows: readonly string[];
}

/**
 * 100% original procedural 3x5 pixel font glyphs (zero Mojang/vanilla assets).
 * Each string row uses '#' for solid pixel and '.' for transparent.
 */
const GLYPHS_3X5: Readonly<Record<string, readonly string[]>> = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  B: ['##.', '#.#', '##.', '#.#', '##.'],
  C: ['.###', '#...', '#...', '#...', '.###'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'],
  F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.###', '#...', '#.##', '#..#', '.###'],
  H: ['#.#', '#.#', '###', '#.#', '#.#'],
  I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..#', '..#', '..#', '#.#', '.#.'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'],
  L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
  N: ['#..#', '##.#', '#.##', '#..#', '#..#'],
  O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  P: ['##.', '#.#', '##.', '#..', '#..'],
  Q: ['.#.', '#.#', '#.#', '.##', '..#'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.###', '#...', '.##.', '...#', '###.'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'],
  V: ['#.#', '#.#', '#.#', '.#.', '.#.'],
  W: ['#...#', '#...#', '#.#.#', '##.##', '#...#'],
  X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
  Z: ['###', '..#', '.#.', '#..', '###'],
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '2': ['###', '..#', '###', '#..', '###'],
  '3': ['###', '..#', '##.', '..#', '###'],
  '4': ['#.#', '#.#', '###', '..#', '..#'],
  '5': ['###', '#..', '###', '..#', '###'],
  '6': ['###', '#..', '###', '#.#', '###'],
  '7': ['###', '..#', '.#.', '.#.', '.#.'],
  '8': ['###', '#.#', '###', '#.#', '###'],
  '9': ['###', '#.#', '###', '..#', '###'],
  '[': ['##', '#.', '#.', '#.', '##'],
  ']': ['##', '.#', '.#', '.#', '##'],
  '(': ['.#', '#.', '#.', '#.', '.#'],
  ')': ['#.', '.#', '.#', '.#', '#.'],
  '-': ['...', '...', '###', '...', '...'],
  _: ['...', '...', '...', '...', '###'],
  '+': ['...', '.#.', '###', '.#.', '...'],
  '=': ['...', '###', '...', '###', '...'],
  '!': ['#', '#', '#', '.', '#'],
  '?': ['###', '..#', '.##', '...', '.#.'],
  ':': ['.', '#', '.', '#', '.'],
  ',': ['.', '.', '.', '#', '#'],
  '.': ['.', '.', '.', '.', '#'],
  "'": ['#', '#', '.', '.', '.'],
  '"': ['#.#', '#.#', '...', '...', '...'],
  '#': ['#.#', '###', '#.#', '###', '#.#'],
  '%': ['#.#', '..#', '.#.', '#..', '#.#'],
  '<': ['..#', '.#.', '#..', '.#.', '..#'],
  '>': ['#..', '.#.', '..#', '.#.', '#..'],
  '|': ['#', '#', '#', '#', '#'],
  '~': ['...', '.#.', '#.#', '...', '...'],
  '/': ['..#', '..#', '.#.', '#..', '#..'],
  '*': ['#.#', '.#.', '#.#', '...', '...'],
  ' ': ['..', '..', '..', '..', '..'],
};

/**
 * 100% original procedural 5x5 wider pixel font glyphs for larger badges.
 */
const GLYPHS_5X5: Readonly<Record<string, readonly string[]>> = {
  A: ['.###.', '#...#', '#####', '#...#', '#...#'],
  B: ['####.', '#...#', '####.', '#...#', '####.'],
  C: ['.####', '#....', '#....', '#....', '.####'],
  D: ['####.', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '####.', '#....', '#####'],
  F: ['#####', '#....', '####.', '#....', '#....'],
  G: ['.####', '#....', '#.###', '#...#', '.####'],
  H: ['#...#', '#...#', '#####', '#...#', '#...#'],
  I: ['#####', '..#..', '..#..', '..#..', '#####'],
  J: ['..###', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '###..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '####.', '#....', '#....'],
  Q: ['.###.', '#...#', '#.#.#', '#..##', '.####'],
  R: ['####.', '#...#', '####.', '#..#.', '#...#'],
  S: ['.####', '#....', '.###.', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  Y: ['#...#', '.#.#.', '..#..', '..#..', '..#..'],
  Z: ['#####', '...#.', '..#..', '.#...', '#####'],
  '0': ['.###.', '#..##', '#.#.#', '##..#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '.###.'],
  '2': ['####.', '....#', '.###.', '#....', '#####'],
  '3': ['####.', '....#', '.###.', '....#', '####.'],
  '4': ['#..#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '####.'],
  '6': ['.###.', '#....', '####.', '#...#', '.###.'],
  '7': ['#####', '...#.', '..#..', '.#...', '.#...'],
  '8': ['.###.', '#...#', '.###.', '#...#', '.###.'],
  '9': ['.###.', '#...#', '.####', '....#', '.###.'],
  '[': ['##', '#.', '#.', '#.', '##'],
  ']': ['##', '.#', '.#', '.#', '##'],
  '(': ['.#', '#.', '#.', '#.', '.#'],
  ')': ['#.', '.#', '.#', '.#', '#.'],
  '-': ['...', '...', '###', '...', '...'],
  _: ['...', '...', '...', '...', '####'],
  '+': ['...', '.#.', '###', '.#.', '...'],
  '=': ['...', '####', '...', '####', '...'],
  '!': ['#', '#', '#', '.', '#'],
  '?': ['.###.', '#...#', '..##.', '.....', '..#..'],
  ':': ['.', '#', '.', '#', '.'],
  ',': ['.', '.', '.', '#', '#'],
  '.': ['.', '.', '.', '.', '#'],
  "'": ['#', '#', '.', '.', '.'],
  '"': ['#.#', '#.#', '...', '...', '...'],
  '#': ['.#.#.', '#####', '.#.#.', '#####', '.#.#.'],
  '%': ['#...#', '...#.', '..#..', '.#...', '#...#'],
  '<': ['..#', '.#.', '#..', '.#.', '..#'],
  '>': ['#..', '.#.', '..#', '.#.', '#..'],
  '|': ['#', '#', '#', '#', '#'],
  '~': ['....', '.#.#', '#.#.', '....', '....'],
  '/': ['...#', '..#.', '.#..', '#...', '#...'],
  '*': ['#.#', '.#.', '#.#', '...', '...'],
  ' ': ['...', '...', '...', '...', '...'],
};

const FALLBACK_GLYPH_3X5: readonly string[] = ['###', '#.#', '#.#', '#.#', '###'];
const FALLBACK_GLYPH_5X5: readonly string[] = [
  '#####',
  '#...#',
  '#...#',
  '#...#',
  '#####',
];

/**
 * 100% original geometric pixel icon matrices (5x5 / 7x5 / 5x6).
 * Strictly zero vanilla Mojang sprites or third-party assets.
 */
export const PIXEL_ICONS: readonly PixelIconDefinition[] = [
  { id: 'none', label: 'No Icon', width: 0, height: 0, rows: [] },
  {
    id: 'crown',
    label: 'Crown',
    width: 7,
    height: 5,
    rows: [
      '#..#..#',
      '##.#.##',
      '#######',
      '#######',
      '.#####.',
    ],
  },
  {
    id: 'shield',
    label: 'Shield',
    width: 5,
    height: 5,
    rows: [
      '#####',
      '##.##',
      '#####',
      '.###.',
      '..#..',
    ],
  },
  {
    id: 'star',
    label: 'Star',
    width: 5,
    height: 5,
    rows: [
      '..#..',
      '.###.',
      '#####',
      '.###.',
      '..#..',
    ],
  },
  {
    id: 'gem',
    label: 'Gem',
    width: 5,
    height: 5,
    rows: [
      '.###.',
      '##.##',
      '#####',
      '.###.',
      '..#..',
    ],
  },
  {
    id: 'crystal-shard',
    label: 'Crystal Shard',
    width: 5,
    height: 6,
    rows: [
      '..#..',
      '.###.',
      '##.##',
      '#####',
      '.###.',
      '..#..',
    ],
  },
  {
    id: 'ace-spade',
    label: 'Ace Spade',
    width: 7,
    height: 6,
    rows: [
      '...#...',
      '..###..',
      '.#####.',
      '#######',
      '.##.##.',
      '..###..',
    ],
  },
  {
    id: 'sun-crest',
    label: 'Sun Crest',
    width: 7,
    height: 5,
    rows: [
      '#..#..#',
      '.#####.',
      '###.###',
      '.#####.',
      '#..#..#',
    ],
  },
  {
    id: 'helm',
    label: 'Conqueror Helm',
    width: 7,
    height: 6,
    rows: [
      '..###..',
      '.#####.',
      '#######',
      '##.#.##',
      '##...##',
      '.#...#.',
    ],
  },
  {
    id: 'wings',
    label: 'Wings',
    width: 7,
    height: 5,
    rows: [
      '##...##',
      '###.###',
      '.#####.',
      '..###..',
      '...#...',
    ],
  },
  {
    id: 'bolt',
    label: 'Bolt',
    width: 5,
    height: 5,
    rows: [
      '..##.',
      '.##..',
      '#####',
      '..##.',
      '.##..',
    ],
  },
  {
    id: 'flame',
    label: 'Flame',
    width: 5,
    height: 5,
    rows: [
      '..#..',
      '.##..',
      '.###.',
      '#####',
      '.###.',
    ],
  },
  {
    id: 'sword-mark',
    label: 'Blade',
    width: 5,
    height: 5,
    rows: [
      '...##',
      '..##.',
      '###..',
      '.##..',
      '#..#.',
    ],
  },
  {
    id: 'trident',
    label: 'Trident',
    width: 5,
    height: 5,
    rows: [
      '#.#.#',
      '#####',
      '..#..',
      '..#..',
      '..#..',
    ],
  },
  {
    id: 'trophy',
    label: 'Trophy',
    width: 7,
    height: 5,
    rows: [
      '#######',
      '#.###.#',
      '.#####.',
      '..###..',
      '.#####.',
    ],
  },
  {
    id: 'flag',
    label: 'Banner',
    width: 5,
    height: 5,
    rows: [
      '####.',
      '#####',
      '####.',
      '#....',
      '#....',
    ],
  },
  {
    id: 'heart',
    label: 'Heart',
    width: 5,
    height: 5,
    rows: [
      '.#.#.',
      '#####',
      '#####',
      '.###.',
      '..#..',
    ],
  },
  {
    id: 'skull',
    label: 'Skull',
    width: 5,
    height: 5,
    rows: [
      '.###.',
      '#####',
      '#.#.#',
      '#####',
      '.#.#.',
    ],
  },
  {
    id: 'diamond-ring',
    label: 'Hollow Diamond',
    width: 5,
    height: 5,
    rows: [
      '..#..',
      '.#.#.',
      '#...#',
      '.#.#.',
      '..#..',
    ],
  },
  {
    id: 'compass',
    label: 'Compass',
    width: 5,
    height: 5,
    rows: [
      '..#..',
      '.###.',
      '#.#.#',
      '.###.',
      '..#..',
    ],
  },
  {
    id: 'anvil',
    label: 'Forge Anvil',
    width: 7,
    height: 5,
    rows: [
      '.######',
      '#######',
      '..###..',
      '..###..',
      '.#####.',
    ],
  },
  {
    id: 'moon',
    label: 'Crescent Moon',
    width: 5,
    height: 5,
    rows: [
      '..###',
      '.##..',
      '##...',
      '.##..',
      '..###',
    ],
  },
  {
    id: 'leaf',
    label: 'Leaf',
    width: 5,
    height: 5,
    rows: [
      '..###',
      '.####',
      '####.',
      '.##..',
      '#....',
    ],
  },
  {
    id: 'wing-crest',
    label: 'Laurel Crest',
    width: 7,
    height: 5,
    rows: [
      '##...##',
      '.#.#.#.',
      '..###..',
      '.##.##.',
      '#.....#',
    ],
  },
  {
    id: 'pixel-orb',
    label: 'Orb Core',
    width: 5,
    height: 5,
    rows: [
      '.###.',
      '##.##',
      '#.#.#',
      '##.##',
      '.###.',
    ],
  },
  {
    id: 'lock',
    label: 'Lock',
    width: 5,
    height: 6,
    rows: [
      '.###.',
      '.#.#.',
      '#####',
      '##-##',
      '#####',
      '-###-',
    ],
  },
  {
    id: 'play-btn',
    label: 'Stream Play',
    width: 7,
    height: 5,
    rows: [
      '.+###+.',
      '##++###',
      '##+++##',
      '##++###',
      '.-###-.',
    ],
  },
  {
    id: 'check-badge',
    label: 'Verified Check',
    width: 6,
    height: 5,
    rows: [
      '....+#',
      '...+#.',
      '+.#-..',
      '.##...',
      '..-...',
    ],
  },
  {
    id: 'ban-sign',
    label: 'Banned',
    width: 5,
    height: 5,
    rows: [
      '.###.',
      '##+##',
      '#+###',
      '###+#',
      '-###-',
    ],
  },
  {
    id: 'snowflake',
    label: 'Frozen',
    width: 5,
    height: 5,
    rows: [
      '#.#.#',
      '.+#+.',
      '##+##',
      '.+#+.',
      '#.#.#',
    ],
  },
  {
    id: 'hourglass',
    label: 'Trial Glass',
    width: 5,
    height: 6,
    rows: [
      '#####',
      '.#+#.',
      '..#..',
      '..#..',
      '.#+#.',
      '-----',
    ],
  },
  {
    id: 'emerald-gem',
    label: 'Emerald',
    width: 6,
    height: 6,
    rows: [
      '.++++.',
      '+####-',
      '+#++#-',
      '##+##-',
      '-####-',
      '.----.',
    ],
  },
  {
    id: 'amethyst-shard',
    label: 'Amethyst',
    width: 6,
    height: 6,
    rows: [
      '...++.',
      '..+##-',
      '.+##-.',
      '+##-..',
      '##-...',
      '--....',
    ],
  },
  {
    id: 'ingot',
    label: 'Metal Ingot',
    width: 7,
    height: 5,
    rows: [
      '.+++++.',
      '+#####-',
      '##+++##',
      '######-',
      '.-----.',
    ],
  },
  {
    id: 'grass-cube',
    label: 'Builder Block',
    width: 6,
    height: 6,
    rows: [
      '.++++.',
      '++++++',
      '+#++#+',
      '-####-',
      '-####-',
      '.----.',
    ],
  },
  {
    id: 'discord-pad',
    label: 'Community Pad',
    width: 7,
    height: 5,
    rows: [
      '.#####.',
      '#######',
      '#+###+#',
      '#######',
      '.#...#.',
    ],
  },
];

const ICON_MAP: Readonly<Record<PixelIconId, PixelIconDefinition>> =
  Object.fromEntries(PIXEL_ICONS.map((icon) => [icon.id, icon])) as Record<
    PixelIconId,
    PixelIconDefinition
  >;

export function getPixelIconDefinition(id: PixelIconId): PixelIconDefinition {
  return ICON_MAP[id] ?? ICON_MAP.none;
}

export function parseHexRgba(
  hex: string,
  fallback: readonly [number, number, number, number] = [255, 255, 255, 255],
): readonly [number, number, number, number] {
  const clean = hex.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    return [
      Number.parseInt(clean.slice(0, 2), 16),
      Number.parseInt(clean.slice(2, 4), 16),
      Number.parseInt(clean.slice(4, 6), 16),
      255,
    ];
  }
  if (/^[0-9a-fA-F]{8}$/.test(clean)) {
    return [
      Number.parseInt(clean.slice(0, 2), 16),
      Number.parseInt(clean.slice(2, 4), 16),
      Number.parseInt(clean.slice(4, 6), 16),
      Number.parseInt(clean.slice(6, 8), 16),
    ];
  }
  return fallback;
}

function setPixel(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  color: readonly [number, number, number, number],
): void {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const idx = (y * width + x) * 4;
  rgba[idx] = color[0];
  rgba[idx + 1] = color[1];
  rgba[idx + 2] = color[2];
  rgba[idx + 3] = color[3];
}

function resolveTextGlyphs(
  text: string,
  fontSize: PixelFontSize,
): readonly (readonly string[])[] {
  const table = fontSize === '5x5' ? GLYPHS_5X5 : GLYPHS_3X5;
  const fallback =
    fontSize === '5x5' ? FALLBACK_GLYPH_5X5 : FALLBACK_GLYPH_3X5;
  const upper = text.toUpperCase();
  const glyphs: (readonly string[])[] = [];
  for (const ch of upper) {
    glyphs.push(table[ch] ?? fallback);
  }
  return glyphs;
}

function measureTextWidth(
  glyphs: readonly (readonly string[])[],
  letterSpacing = 1,
): number {
  if (glyphs.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < glyphs.length; i++) {
    const g = glyphs[i]!;
    const w = g[0]?.length ?? 0;
    total += w;
    if (i < glyphs.length - 1) {
      total += letterSpacing;
    }
  }
  return total;
}

function drawPattern(
  rgba: Uint8ClampedArray,
  canvasW: number,
  canvasH: number,
  rows: readonly string[],
  startX: number,
  startY: number,
  color: readonly [number, number, number, number],
): void {
  for (let ry = 0; ry < rows.length; ry++) {
    const row = rows[ry]!;
    for (let rx = 0; rx < row.length; rx++) {
      if (row[rx] === '#') {
        setPixel(rgba, canvasW, canvasH, startX + rx, startY + ry, color);
      }
    }
  }
}

function blendPixel(
  rgba: Uint8ClampedArray,
  canvasW: number,
  canvasH: number,
  x: number,
  y: number,
  color: readonly [number, number, number, number],
  opacityPct = 100,
): void {
  if (x < 0 || y < 0 || x >= canvasW || y >= canvasH) return;
  const clampedOpacity = Math.max(0, Math.min(100, opacityPct)) / 100;
  const effectiveAlpha = Math.round(color[3] * clampedOpacity);
  if (effectiveAlpha <= 0) return;

  const idx = (y * canvasW + x) * 4;
  if (effectiveAlpha >= 255) {
    rgba[idx] = color[0];
    rgba[idx + 1] = color[1];
    rgba[idx + 2] = color[2];
    rgba[idx + 3] = 255;
    return;
  }

  const sa = effectiveAlpha / 255;
  const da = (rgba[idx + 3] ?? 0) / 255;
  const outA = sa + da * (1 - sa);
  if (outA <= 0) return;

  rgba[idx] = Math.round(
    (color[0] * sa + (rgba[idx] ?? 0) * da * (1 - sa)) / outA,
  );
  rgba[idx + 1] = Math.round(
    (color[1] * sa + (rgba[idx + 1] ?? 0) * da * (1 - sa)) / outA,
  );
  rgba[idx + 2] = Math.round(
    (color[2] * sa + (rgba[idx + 2] ?? 0) * da * (1 - sa)) / outA,
  );
  rgba[idx + 3] = Math.round(outA * 255);
}

function shadeRgba(
  color: readonly [number, number, number, number],
  factor: number,
): readonly [number, number, number, number] {
  if (factor >= 1) {
    const lift = factor - 1;
    return [
      Math.min(255, Math.round(color[0] + (255 - color[0]) * lift)),
      Math.min(255, Math.round(color[1] + (255 - color[1]) * lift)),
      Math.min(255, Math.round(color[2] + (255 - color[2]) * lift)),
      color[3],
    ];
  }
  return [
    Math.max(0, Math.round(color[0] * factor)),
    Math.max(0, Math.round(color[1] * factor)),
    Math.max(0, Math.round(color[2] * factor)),
    color[3],
  ];
}

function drawFrameRect(
  rgba: Uint8ClampedArray,
  canvasW: number,
  canvasH: number,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  frameStyle: RankFrameStyle,
  frameColor: readonly [number, number, number, number],
  borderColor: readonly [number, number, number, number],
  opacityPct: number,
): void {
  if (frameStyle === 'none' || boxW <= 0 || boxH <= 0) return;
  const bevelDark = shadeRgba(frameColor, 0.56);
  for (let ly = 0; ly < boxH; ly++) {
    for (let lx = 0; lx < boxW; lx++) {
      const gx = boxX + lx;
      const gy = boxY + ly;
      if (frameStyle === 'pill') {
        const isCorner =
          (lx === 0 || lx === boxW - 1) && (ly === 0 || ly === boxH - 1);
        if (isCorner) continue;
        const isEdge =
          lx === 0 ||
          lx === boxW - 1 ||
          ly === 0 ||
          ly === boxH - 1 ||
          ((lx === 1 || lx === boxW - 2) && (ly === 1 || ly === boxH - 2));
        blendPixel(
          rgba,
          canvasW,
          canvasH,
          gx,
          gy,
          isEdge ? borderColor : frameColor,
          opacityPct,
        );
      } else if (frameStyle === 'bevel') {
        const isCorner =
          (lx === 0 || lx === boxW - 1) && (ly === 0 || ly === boxH - 1);
        if (isCorner) continue;
        const isHighlight = ly === 0 || lx === 0;
        const isShadowEdge = ly === boxH - 1 || lx === boxW - 1;
        const pixelColor = isShadowEdge
          ? bevelDark
          : isHighlight
            ? borderColor
            : frameColor;
        blendPixel(rgba, canvasW, canvasH, gx, gy, pixelColor, opacityPct);
      } else if (frameStyle === 'outline') {
        const isEdge =
          lx === 0 || lx === boxW - 1 || ly === 0 || ly === boxH - 1;
        blendPixel(
          rgba,
          canvasW,
          canvasH,
          gx,
          gy,
          isEdge ? borderColor : frameColor,
          opacityPct,
        );
      } else if (frameStyle === 'ribbon') {
        const midY = Math.floor(boxH / 2);
        const isNotch =
          (lx === 0 || lx === boxW - 1) && Math.abs(ly - midY) <= 1;
        if (isNotch) continue;
        const isEdge = ly === 0 || ly === boxH - 1;
        blendPixel(
          rgba,
          canvasW,
          canvasH,
          gx,
          gy,
          isEdge ? borderColor : frameColor,
          opacityPct,
        );
      } else {
        blendPixel(rgba, canvasW, canvasH, gx, gy, frameColor, opacityPct);
      }
    }
  }
}

function drawPatternBlended(
  rgba: Uint8ClampedArray,
  canvasW: number,
  canvasH: number,
  rows: readonly string[],
  startX: number,
  startY: number,
  color: readonly [number, number, number, number],
  opacityPct = 100,
  silhouetteOnly = false,
): void {
  const hiColor = silhouetteOnly ? color : shadeRgba(color, 1.38);
  const loColor = silhouetteOnly ? color : shadeRgba(color, 0.58);
  for (let ry = 0; ry < rows.length; ry++) {
    const row = rows[ry]!;
    for (let rx = 0; rx < row.length; rx++) {
      const ch = row[rx];
      if (!ch || ch === '.') continue;
      const tone =
        ch === '+' ? hiColor : ch === '-' ? loColor : color;
      blendPixel(
        rgba,
        canvasW,
        canvasH,
        startX + rx,
        startY + ry,
        tone,
        opacityPct,
      );
    }
  }
}

export function applyPaintEditsToRaster(
  raster: RgbaRaster,
  paintEdits: PaintEditMap,
  paintVisible = true,
  paintOpacityPct = 100,
  paintOffsetX = 0,
  paintOffsetY = 0,
): RgbaRaster {
  const entries = Object.entries(paintEdits);
  if (!paintVisible || entries.length === 0 || paintOpacityPct <= 0) {
    return raster;
  }

  const next = new Uint8ClampedArray(raster.rgba);
  const ox = Math.round(paintOffsetX);
  const oy = Math.round(paintOffsetY);
  for (const [coord, value] of entries) {
    const commaIdx = coord.indexOf(',');
    if (commaIdx <= 0) continue;
    const rawX = Number.parseInt(coord.slice(0, commaIdx), 10);
    const rawY = Number.parseInt(coord.slice(commaIdx + 1), 10);
    if (!Number.isInteger(rawX) || !Number.isInteger(rawY)) continue;
    const x = rawX + ox;
    const y = rawY + oy;
    if (x < 0 || y < 0 || x >= raster.width || y >= raster.height) continue;

    if (value === null) {
      setPixel(next, raster.width, raster.height, x, y, [0, 0, 0, 0]);
    } else {
      const color = parseHexRgba(value);
      blendPixel(next, raster.width, raster.height, x, y, color, paintOpacityPct);
    }
  }

  return {
    width: raster.width,
    height: raster.height,
    rgba: next,
  };
}

export interface SynthesizeRankOptions {
  readonly layerOrder?: readonly RankLayerId[];
  readonly layerStyles?: RankLayerStyleMap;
  readonly cachedCustomRaster?: { width: number; height: number; rgba: Uint8ClampedArray };
}

function drawCustomRaster(
  rgba: Uint8ClampedArray,
  canvasW: number,
  canvasH: number,
  raster: { width: number; height: number; rgba: Uint8ClampedArray },
  startX: number,
  startY: number,
  textColor: readonly [number, number, number, number],
  opacityPct = 100,
): void {
  for (let ry = 0; ry < raster.height; ry++) {
    for (let rx = 0; rx < raster.width; rx++) {
      const srcIdx = (ry * raster.width + rx) * 4;
      const sa = raster.rgba[srcIdx + 3] ?? 0;
      if (sa === 0) continue;
      const sr = raster.rgba[srcIdx] ?? 255;
      const sg = raster.rgba[srcIdx + 1] ?? 255;
      const sb = raster.rgba[srcIdx + 2] ?? 255;
      const r = Math.round((sr * textColor[0]) / 255);
      const g = Math.round((sg * textColor[1]) / 255);
      const b = Math.round((sb * textColor[2]) / 255);
      const a = Math.round((sa * textColor[3]) / 255);
      blendPixel(
        rgba,
        canvasW,
        canvasH,
        startX + rx,
        startY + ry,
        [r, g, b, a],
        opacityPct,
      );
    }
  }
}

function drawCustomRasterSilhouette(
  rgba: Uint8ClampedArray,
  canvasW: number,
  canvasH: number,
  raster: { width: number; height: number; rgba: Uint8ClampedArray },
  startX: number,
  startY: number,
  shadowColor: readonly [number, number, number, number],
  opacityPct = 100,
): void {
  for (let ry = 0; ry < raster.height; ry++) {
    for (let rx = 0; rx < raster.width; rx++) {
      const srcIdx = (ry * raster.width + rx) * 4;
      const sa = raster.rgba[srcIdx + 3] ?? 0;
      if (sa === 0) continue;
      const a = Math.round((sa * shadowColor[3]) / 255);
      blendPixel(
        rgba,
        canvasW,
        canvasH,
        startX + rx,
        startY + ry,
        [shadowColor[0], shadowColor[1], shadowColor[2], a],
        opacityPct,
      );
    }
  }
}

function getLayerStyle(
  styles: RankLayerStyleMap | undefined,
  layer: RankLayerId,
): { readonly opacity: number; readonly offsetX: number; readonly offsetY: number } {
  const raw = styles?.[layer];
  return {
    opacity:
      raw?.opacity !== undefined
        ? Math.max(0, Math.min(100, Math.round(raw.opacity)))
        : 100,
    offsetX:
      raw?.offsetX !== undefined
        ? Math.max(-8, Math.min(8, Math.round(raw.offsetX)))
        : 0,
    offsetY:
      raw?.offsetY !== undefined
        ? Math.max(-8, Math.min(8, Math.round(raw.offsetY)))
        : 0,
  };
}

function normalizeLayerOrder(
  order?: readonly RankLayerId[],
): readonly RankLayerId[] {
  if (!order || order.length === 0) return DEFAULT_RANK_LAYER_ORDER;
  const seen = new Set<RankLayerId>();
  const cleaned: RankLayerId[] = [];
  for (const id of order) {
    if (DEFAULT_RANK_LAYER_ORDER.includes(id) && !seen.has(id)) {
      seen.add(id);
      cleaned.push(id);
    }
  }
  for (const id of DEFAULT_RANK_LAYER_ORDER) {
    if (!seen.has(id)) cleaned.push(id);
  }
  return cleaned;
}

/**
 * Synthesizes an RGBA pixel raster from RankComposerConfig + layerVisibility + freehand paintEdits.
 * Supports both 'unified' and 'split-left' (Icon far-left, separated from Rank text on right) layouts,
 * as well as custom layerOrder and per-layer opacity/offsetX/offsetY.
 * 100% pure TypeScript, zero DOM/canvas dependencies, zero Mojang assets.
 */
export function synthesizeRankRgba(
  composer: RankComposerConfig,
  visibility: RankLayerVisibility,
  paintEdits: PaintEditMap = {},
  options?: SynthesizeRankOptions,
): RgbaRaster {
  const padX = Math.max(0, Math.min(16, Math.round(composer.paddingX)));
  const padY = Math.max(0, Math.min(16, Math.round(composer.paddingY)));
  const iconGap = Math.max(0, Math.min(8, Math.round(composer.iconGap)));
  const hasBorder =
    visibility.frame &&
    (composer.frameStyle === 'outline' ||
      composer.frameStyle === 'pill' ||
      composer.frameStyle === 'bevel');
  const borderPad = hasBorder ? 1 : 0;
  const ribbonExtra =
    visibility.frame && composer.frameStyle === 'ribbon' ? 2 : 0;

  const customRaster =
    composer.fontSource === 'google-font' && options?.cachedCustomRaster
      ? options.cachedCustomRaster
      : undefined;

  const iconDef = getPixelIconDefinition(composer.iconId);
  const showIcon = visibility.icon && iconDef.width > 0 && iconDef.height > 0;
  const glyphs = !customRaster && visibility.text
    ? resolveTextGlyphs(composer.text, composer.fontSize)
    : [];
  const textW = customRaster
    ? (visibility.text ? customRaster.width : 0)
    : measureTextWidth(glyphs, 1);
  const textH = customRaster
    ? (visibility.text ? customRaster.height : 0)
    : (glyphs.length > 0 ? 5 : 0);

  const hasGlyphContent = showIcon || textH > 0;
  const shadowExtraX = visibility.shadow ? 1 : 0;
  const shadowExtraY = visibility.shadow && hasGlyphContent ? 1 : 0;
  // Equalize top vertical clearance with drop-shadow + bottom clearance (2px top = 2px bottom)
  const topShadowPadY = visibility.shadow && hasGlyphContent ? 1 : 0;

  const isSplitLeft = composer.badgeLayout === 'split-left' && showIcon;
  const splitIconHasFrame =
    isSplitLeft &&
    visibility.frame &&
    composer.frameStyle !== 'none' &&
    composer.splitIconFrame !== 'none';
  const splitIconPadX = splitIconHasFrame
    ? Math.max(1, Math.min(2, padX || 1)) + borderPad + ribbonExtra
    : 0;

  const contentH =
    Math.max(showIcon ? iconDef.height : 0, textH, 1) + shadowExtraY;
  const height = Math.max(
    5,
    contentH + (padY + borderPad) * 2 + topShadowPadY,
  );

  let autoWidth = 4;
  let iconOriginX = padX + borderPad + ribbonExtra;
  let textOriginX = iconOriginX;
  let iconBoxW = 0;
  let rankBoxX = 0;
  let rankBoxW = 0;

  if (isSplitLeft) {
    const splitGap = Math.max(1, iconGap);
    iconBoxW = iconDef.width + shadowExtraX + splitIconPadX * 2;
    iconOriginX = splitIconPadX;
    rankBoxX = iconBoxW + splitGap;

    const rankContentW = textW > 0 ? textW + shadowExtraX : 6;
    rankBoxW = rankContentW + (padX + borderPad + ribbonExtra) * 2;
    textOriginX = rankBoxX + padX + borderPad + ribbonExtra;
    autoWidth = Math.max(4, rankBoxX + rankBoxW);
  } else {
    let contentW = 0;
    if (showIcon && textW > 0) {
      contentW = iconDef.width + iconGap + textW + shadowExtraX;
    } else if (showIcon) {
      contentW = iconDef.width + shadowExtraX;
    } else if (textW > 0) {
      contentW = textW + shadowExtraX;
    } else {
      contentW = 8;
    }
    autoWidth = Math.max(4, contentW + (padX + borderPad + ribbonExtra) * 2);
    iconOriginX = padX + borderPad + ribbonExtra;
    textOriginX = showIcon
      ? iconOriginX + iconDef.width + (textW > 0 ? iconGap : 0)
      : iconOriginX;
  }

  const fixedWidth =
    composer.canvasWidthMode === 'fixed' &&
    composer.customWidth !== undefined &&
    Number.isFinite(composer.customWidth)
      ? Math.max(4, Math.min(256, Math.round(composer.customWidth)))
      : autoWidth;
  const width = fixedWidth;
  if (width !== autoWidth && !isSplitLeft) {
    const delta = width - autoWidth;
    const centerShift = Math.floor(delta / 2);
    iconOriginX += centerShift;
    textOriginX += centerShift;
  } else if (width > autoWidth && isSplitLeft) {
    const extraW = width - autoWidth;
    rankBoxW += extraW;
    textOriginX += Math.floor(extraW / 2);
  }

  let rgba = new Uint8ClampedArray(width * height * 4);

  const frameColor = parseHexRgba(composer.frameColor, [28, 25, 23, 255]);
  const borderColor = parseHexRgba(
    composer.frameBorderColor,
    [16, 185, 129, 255],
  );
  const splitIconFrameColor = composer.splitIconFrameColor
    ? parseHexRgba(composer.splitIconFrameColor, frameColor)
    : frameColor;
  const splitIconBorderColor = composer.splitIconBorderColor
    ? parseHexRgba(composer.splitIconBorderColor, borderColor)
    : borderColor;
  const iconColor = parseHexRgba(composer.iconColor, [52, 211, 153, 255]);
  const textColor = parseHexRgba(composer.textColor, [255, 255, 255, 255]);
  const shadowColor = parseHexRgba(composer.shadowColor, [12, 10, 9, 220]);

  const contentOriginY = padY + borderPad + topShadowPadY;
  const iconY =
    contentOriginY +
    Math.max(0, Math.floor((contentH - shadowExtraY - iconDef.height) / 2));
  const textY =
    contentOriginY +
    Math.max(0, Math.floor((contentH - shadowExtraY - textH) / 2));

  const frameStyleCfg = getLayerStyle(options?.layerStyles, 'frame');
  const shadowStyleCfg = getLayerStyle(options?.layerStyles, 'shadow');
  const iconStyleCfg = getLayerStyle(options?.layerStyles, 'icon');
  const textStyleCfg = getLayerStyle(options?.layerStyles, 'text');
  const paintStyleCfg = getLayerStyle(options?.layerStyles, 'paint');

  const drawOrder = normalizeLayerOrder(options?.layerOrder);

  for (const layerId of drawOrder) {
    if (layerId === 'frame') {
      if (!visibility.frame || composer.frameStyle === 'none') continue;
      if (isSplitLeft) {
        if (splitIconHasFrame) {
          drawFrameRect(
            rgba,
            width,
            height,
            frameStyleCfg.offsetX,
            frameStyleCfg.offsetY,
            iconBoxW,
            height,
            composer.frameStyle,
            splitIconFrameColor,
            splitIconBorderColor,
            frameStyleCfg.opacity,
          );
        }
        drawFrameRect(
          rgba,
          width,
          height,
          rankBoxX + frameStyleCfg.offsetX,
          frameStyleCfg.offsetY,
          rankBoxW,
          height,
          composer.frameStyle,
          frameColor,
          borderColor,
          frameStyleCfg.opacity,
        );
      } else {
        drawFrameRect(
          rgba,
          width,
          height,
          frameStyleCfg.offsetX,
          frameStyleCfg.offsetY,
          width,
          height,
          composer.frameStyle,
          frameColor,
          borderColor,
          frameStyleCfg.opacity,
        );
      }
    } else if (layerId === 'shadow') {
      if (!visibility.shadow) continue;
      if (showIcon) {
        drawPatternBlended(
          rgba,
          width,
          height,
          iconDef.rows,
          iconOriginX + 1 + iconStyleCfg.offsetX + shadowStyleCfg.offsetX,
          iconY + 1 + iconStyleCfg.offsetY + shadowStyleCfg.offsetY,
          shadowColor,
          shadowStyleCfg.opacity,
          true,
        );
      }
      if (visibility.text) {
        if (customRaster) {
          drawCustomRasterSilhouette(
            rgba,
            width,
            height,
            customRaster,
            textOriginX + 1 + textStyleCfg.offsetX + shadowStyleCfg.offsetX,
            textY + 1 + textStyleCfg.offsetY + shadowStyleCfg.offsetY,
            shadowColor,
            shadowStyleCfg.opacity,
          );
        } else if (glyphs.length > 0) {
          let tx = textOriginX;
          for (const glyph of glyphs) {
            drawPatternBlended(
              rgba,
              width,
              height,
              glyph,
              tx + 1 + textStyleCfg.offsetX + shadowStyleCfg.offsetX,
              textY + 1 + textStyleCfg.offsetY + shadowStyleCfg.offsetY,
              shadowColor,
              shadowStyleCfg.opacity,
              true,
            );
            tx += (glyph[0]?.length ?? 0) + 1;
          }
        }
      }
    } else if (layerId === 'icon') {
      if (!showIcon) continue;
      drawPatternBlended(
        rgba,
        width,
        height,
        iconDef.rows,
        iconOriginX + iconStyleCfg.offsetX,
        iconY + iconStyleCfg.offsetY,
        iconColor,
        iconStyleCfg.opacity,
      );
    } else if (layerId === 'text') {
      if (visibility.text) {
        if (customRaster) {
          drawCustomRaster(
            rgba,
            width,
            height,
            customRaster,
            textOriginX + textStyleCfg.offsetX,
            textY + textStyleCfg.offsetY,
            textColor,
            textStyleCfg.opacity,
          );
        } else if (glyphs.length > 0) {
          let tx = textOriginX;
          for (const glyph of glyphs) {
            drawPatternBlended(
              rgba,
              width,
              height,
              glyph,
              tx + textStyleCfg.offsetX,
              textY + textStyleCfg.offsetY,
              textColor,
              textStyleCfg.opacity,
            );
            tx += (glyph[0]?.length ?? 0) + 1;
          }
        }
      }
    } else if (layerId === 'paint') {
      const painted = applyPaintEditsToRaster(
        { width, height, rgba },
        paintEdits,
        visibility.paint,
        paintStyleCfg.opacity,
        paintStyleCfg.offsetX,
        paintStyleCfg.offsetY,
      );
      rgba = new Uint8ClampedArray(painted.rgba);
    }
  }

  return { width, height, rgba };
}

/**
 * Resolves the RGBA raster for either a composed rank entry or an uploaded PNG.
 */
export function resolveBitmapEntryRaster(
  entry: BitmapFontEntry,
  decodedUpload?: DecodedRgbaImage,
): RgbaRaster | null {
  if (entry.sourceMode === 'uploaded-png') {
    if (!decodedUpload) return null;
    const paintStyle = getLayerStyle(entry.layerStyles, 'paint');
    return applyPaintEditsToRaster(
      {
        width: decodedUpload.width,
        height: decodedUpload.height,
        rgba: decodedUpload.rgba,
      },
      entry.paintEdits,
      entry.layerVisibility.paint,
      paintStyle.opacity,
      paintStyle.offsetX,
      paintStyle.offsetY,
    );
  }
  return synthesizeRankRgba(
    entry.composer,
    entry.layerVisibility,
    entry.paintEdits,
    {
      layerOrder: entry.layerOrder,
      layerStyles: entry.layerStyles,
      cachedCustomRaster:
        entry.composer.fontSource === 'google-font'
          ? entry.cachedCustomRaster
          : undefined,
    },
  );
}

/**
 * Generates an original 16x16 procedural pack.png RGBA raster (zero Mojang assets).
 */
export function generateSyntheticPackIconRgba(): RgbaRaster {
  const size = 16;
  const rgba = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const border = x === 0 || y === 0 || x === size - 1 || y === size - 1;
      const innerGrid =
        x >= 4 &&
        x <= 11 &&
        y >= 4 &&
        y <= 11 &&
        ((x === 4 || x === 11 || y === 4 || y === 11) ||
          (x >= 6 && x <= 9 && y >= 6 && y <= 9));
      if (border) {
        setPixel(rgba, size, size, x, y, [16, 185, 129, 255]);
      } else if (innerGrid) {
        setPixel(rgba, size, size, x, y, [52, 211, 153, 255]);
      } else {
        setPixel(rgba, size, size, x, y, [28, 25, 23, 255]);
      }
    }
  }
  return { width: size, height: size, rgba };
}
