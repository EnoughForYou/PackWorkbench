import type { GoogleFontConfig } from './types.ts';

export type GoogleFontCategory =
  | 'sans-serif'
  | 'serif'
  | 'display'
  | 'monospace'
  | 'handwriting';

export type FontFilterCategory = 'all' | 'pixel-retro' | GoogleFontCategory;

export interface GoogleFontItem {
  readonly family: string;
  readonly category: GoogleFontCategory;
  readonly weights: readonly number[];
  readonly isPixel?: boolean;
  readonly previewText?: string;
  readonly description?: string;
}

export const CURATED_GOOGLE_FONTS: readonly GoogleFontItem[] = [
  // Pixel / Retro Fonts
  {
    family: 'Press Start 2P',
    category: 'display',
    weights: [400],
    isPixel: true,
    previewText: 'VIP+',
    description: 'Classic 8-bit arcade bitmap aesthetic',
  },
  {
    family: 'Silkscreen',
    category: 'display',
    weights: [400, 700],
    isPixel: true,
    previewText: 'MVP',
    description: 'Compact pixel font with clean crisp edges',
  },
  {
    family: 'VT323',
    category: 'monospace',
    weights: [400],
    isPixel: true,
    previewText: 'HERO',
    description: 'Vintage CRT terminal pixel typeface',
  },
  {
    family: 'Pixelify Sans',
    category: 'display',
    weights: [400, 500, 600, 700],
    isPixel: true,
    previewText: 'LEGEND',
    description: 'Modern variable pixel font for Minecraft UI',
  },
  {
    family: 'Chakra Petch',
    category: 'sans-serif',
    weights: [300, 400, 500, 600, 700],
    isPixel: true,
    previewText: 'CHAMP',
    description: 'Chiseled techno retro font inspired by mech HUDs',
  },
  {
    family: 'Rubik Glitch',
    category: 'display',
    weights: [400],
    isPixel: true,
    previewText: 'GLITCH',
    description: 'Cyberpunk corrupted pixel display font',
  },
  {
    family: 'Tiny5',
    category: 'display',
    weights: [400],
    isPixel: true,
    previewText: 'RANK',
    description: 'Ultra-compact 5x5 pixel matrix font',
  },
  {
    family: 'Jacquard 12',
    category: 'display',
    weights: [400],
    isPixel: true,
    previewText: 'GUILD',
    description: 'Intricate woven pixel tapestry aesthetic',
  },
  {
    family: 'DotGothic16',
    category: 'sans-serif',
    weights: [400],
    isPixel: true,
    previewText: 'ADMIN',
    description: 'Old-school Japanese dot matrix bitmap font',
  },
  {
    family: 'Honk',
    category: 'display',
    weights: [400],
    isPixel: true,
    previewText: 'BOOST',
    description: 'Playful vibrant chromatic display font',
  },

  // Sans-Serif Fonts
  {
    family: 'Onest',
    category: 'sans-serif',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    previewText: 'PRO',
    description: 'Geometric sans with high legibility at micro sizes',
  },
  {
    family: 'Inter',
    category: 'sans-serif',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    previewText: 'SERVER',
    description: 'Neutral UI workhorse engineered for screens',
  },
  {
    family: 'Montserrat',
    category: 'sans-serif',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    previewText: 'TOP',
    description: 'Urban geometric sans with wide proportions',
  },
  {
    family: 'Poppins',
    category: 'sans-serif',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    previewText: 'MASTER',
    description: 'Friendly circular geometric sans-serif',
  },
  {
    family: 'Outfit',
    category: 'sans-serif',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    previewText: 'ELITE',
    description: 'Modern neo-grotesque designed for badges & chips',
  },
  {
    family: 'Plus Jakarta Sans',
    category: 'sans-serif',
    weights: [200, 300, 400, 500, 600, 700, 800],
    previewText: 'WARRIOR',
    description: 'Contemporary humanist sans with warm geometric shapes',
  },
  {
    family: 'Roboto',
    category: 'sans-serif',
    weights: [100, 300, 400, 500, 700, 900],
    previewText: 'PLAYER',
    description: 'Balanced dual nature mechanical yet friendly',
  },
  {
    family: 'Open Sans',
    category: 'sans-serif',
    weights: [300, 400, 500, 600, 700, 800],
    previewText: 'ONLINE',
    description: 'Clean open forms optimized for print, web, and UI',
  },
  {
    family: 'Lato',
    category: 'sans-serif',
    weights: [100, 300, 400, 700, 900],
    previewText: 'MOD',
    description: 'Semi-rounded details conveying warmth and stability',
  },
  {
    family: 'Raleway',
    category: 'sans-serif',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    previewText: 'PRIME',
    description: 'Elegant headings typeface with unique alternate letters',
  },
  {
    family: 'Nunito',
    category: 'sans-serif',
    weights: [200, 300, 400, 600, 700, 800, 900],
    previewText: 'ROOKIE',
    description: 'Well-balanced rounded terminal sans-serif',
  },
  {
    family: 'Rubik',
    category: 'sans-serif',
    weights: [300, 400, 500, 600, 700, 800, 900],
    previewText: 'LORD',
    description: 'Slightly rounded corners with solid rectangular weight',
  },

  // Monospace Fonts
  {
    family: 'JetBrains Mono',
    category: 'monospace',
    weights: [100, 200, 300, 400, 500, 600, 700, 800],
    previewText: 'DEV',
    description: 'Developer monospace with tall x-height & crisp coding glyphs',
  },
  {
    family: 'Space Grotesk',
    category: 'sans-serif',
    weights: [300, 400, 500, 600, 700],
    previewText: 'TECH',
    description: 'Proportional grotesque variant of Space Mono',
  },
  {
    family: 'Space Mono',
    category: 'monospace',
    weights: [400, 700],
    previewText: 'CYBER',
    description: 'Retro-futuristic fixed-width font with 1960s space era vibe',
  },
  {
    family: 'Roboto Mono',
    category: 'monospace',
    weights: [100, 200, 300, 400, 500, 600, 700],
    previewText: 'CODE',
    description: 'Monospace companion to Roboto with sharp geometric terminals',
  },
  {
    family: 'Fira Code',
    category: 'monospace',
    weights: [300, 400, 500, 600, 700],
    previewText: 'ROOT',
    description: 'Iconic programmer monospace with rich ligature support',
  },
  {
    family: 'Source Code Pro',
    category: 'monospace',
    weights: [200, 300, 400, 500, 600, 700, 900],
    previewText: 'CORE',
    description: 'Adobe open-source monospaced suite designed for UI & terminal',
  },
  {
    family: 'IBM Plex Mono',
    category: 'monospace',
    weights: [100, 200, 300, 400, 500, 600, 700],
    previewText: 'SYS',
    description: 'Engineered corporate monospace celebrating human vs machine',
  },
  {
    family: 'Ubuntu Mono',
    category: 'monospace',
    weights: [400, 700],
    previewText: 'SHELL',
    description: 'Distinctive rounded monospace with Linux desktop heritage',
  },

  // Display Fonts
  {
    family: 'Righteous',
    category: 'display',
    weights: [400],
    previewText: 'EPIC',
    description: 'Retro art-deco sci-fi display letterforms',
  },
  {
    family: 'Orbitron',
    category: 'display',
    weights: [400, 500, 600, 700, 800, 900],
    previewText: 'TITAN',
    description: 'Futuristic geometric display font for sci-fi server themes',
  },
  {
    family: 'Bangers',
    category: 'display',
    weights: [400],
    previewText: 'BOOM',
    description: 'Mid-20th century comic-book styled bold display font',
  },
  {
    family: 'Bungee',
    category: 'display',
    weights: [400],
    previewText: 'RANK',
    description: 'Urban sign-inspired heavy block display font',
  },
  {
    family: 'Audiowide',
    category: 'display',
    weights: [400],
    previewText: 'NEXUS',
    description: 'Techno futuristic display font with angular tubular strokes',
  },
  {
    family: 'Russo One',
    category: 'display',
    weights: [400],
    previewText: 'BEAST',
    description: 'Bold impact display font with thick muscular shapes',
  },
  {
    family: 'Faster One',
    category: 'display',
    weights: [400],
    previewText: 'SPEED',
    description: 'Horizontal speed-line racing display typeface',
  },
  {
    family: 'Black Ops One',
    category: 'display',
    weights: [400],
    previewText: 'OPS',
    description: 'Military military-stencil styled heavy display font',
  },

  // Serif Fonts
  {
    family: 'Cinzel',
    category: 'serif',
    weights: [400, 500, 600, 700, 800, 900],
    previewText: 'MYTHIC',
    description: 'Roman classical proportions inspired by first-century inscriptions',
  },
  {
    family: 'Playfair Display',
    category: 'serif',
    weights: [400, 500, 600, 700, 800, 900],
    previewText: 'NOBLE',
    description: 'High-contrast transitional serif with classical elegance',
  },
  {
    family: 'Merriweather',
    category: 'serif',
    weights: [300, 400, 700, 900],
    previewText: 'KING',
    description: 'Sturdy text serif designed to be highly readable on screens',
  },

  // Handwriting Fonts
  {
    family: 'Permanent Marker',
    category: 'handwriting',
    weights: [400],
    previewText: 'CHAOS',
    description: 'Looks and feels like drawing with a real heavy felt-tip marker',
  },
  {
    family: 'Caveat',
    category: 'handwriting',
    weights: [400, 500, 600, 700],
    previewText: 'CREW',
    description: 'Playful brush handwriting with natural lively rhythm',
  },
  {
    family: 'Pacifico',
    category: 'handwriting',
    weights: [400],
    previewText: 'VIBE',
    description: '1950s American surf-culture inspired brush script',
  },
];

/**
 * Builds standard Google Fonts CSS2 embed URL.
 * Escapes family spaces with `+` and sorts weights ascending.
 */
export function buildGoogleFontsCss2Url(
  family: string,
  weights?: readonly number[] | number[],
): string {
  const cleanFamily = family.trim().replace(/\s+/g, '+');
  const normalizedWeights =
    weights && weights.length > 0
      ? Array.from(new Set(weights)).sort((a, b) => a - b)
      : [400];
  const wghtStr = normalizedWeights.join(';');
  return `https://fonts.googleapis.com/css2?family=${cleanFamily}:wght@${wghtStr}&display=swap`;
}

/**
 * Returns all curated Google Fonts available for the offline picker.
 */
export function getCuratedGoogleFonts(): readonly GoogleFontItem[] {
  return CURATED_GOOGLE_FONTS;
}

/**
 * Looks up a curated Google Font item by family name (case-insensitive).
 */
export function getGoogleFontByFamily(family: string): GoogleFontItem | undefined {
  const target = family.trim().toLowerCase();
  return CURATED_GOOGLE_FONTS.find((f) => f.family.toLowerCase() === target);
}

/**
 * Searches and filters curated Google Fonts by keyword and category.
 */
export function searchGoogleFonts(
  query = '',
  category: FontFilterCategory = 'all',
  fonts: readonly GoogleFontItem[] = CURATED_GOOGLE_FONTS,
): readonly GoogleFontItem[] {
  const q = query.trim().toLowerCase();
  return fonts.filter((f) => {
    if (category === 'pixel-retro') {
      if (!f.isPixel) return false;
    } else if (category !== 'all') {
      if (f.category !== category) return false;
    }
    if (q.length === 0) return true;
    return (
      f.family.toLowerCase().includes(q) ||
      (f.description && f.description.toLowerCase().includes(q))
    );
  });
}

/**
 * Helper to construct a GoogleFontConfig object with safe defaults.
 */
export function createGoogleFontConfig(
  family: string,
  overrides?: Partial<GoogleFontConfig>,
): GoogleFontConfig {
  const matched = getGoogleFontByFamily(family);
  return {
    family: matched?.family ?? family,
    category: overrides?.category ?? matched?.category ?? 'sans-serif',
    weight: overrides?.weight ?? matched?.weights[0] ?? 400,
    fontSizePx: overrides?.fontSizePx ?? 8,
    style: overrides?.style ?? 'normal',
  };
}
