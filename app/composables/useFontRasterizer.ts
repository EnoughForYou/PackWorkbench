import { ref } from 'vue';
import { buildGoogleFontsCss2Url } from '@core/font/googleFonts.ts';
import type { GoogleFontConfig } from '@core/font/types.ts';

export interface RasterizedFontResult {
  readonly width: number;
  readonly height: number;
  readonly rgba: Uint8ClampedArray;
}

export interface RasterizeOptions {
  readonly crispThreshold?: boolean;
  readonly timeoutMs?: number;
}

const loadedFontUrls = new Set<string>();
const rasterCache = new Map<string, RasterizedFontResult>();

/**
 * Trims empty transparent border padding around rasterized glyphs to provide
 * tight bounding boxes matching Minecraft procedural badge geometry.
 */
function trimRasterData(
  imageData: ImageData,
  crispThreshold = false,
): RasterizedFontResult {
  const { width, height, data } = imageData;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3] ?? 0;
      if (alpha > (crispThreshold ? 64 : 10)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return { width: 0, height: 0, rgba: new Uint8ClampedArray(0) };
  }

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const cropped = new Uint8ClampedArray(cropW * cropH * 4);

  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcIdx = ((minY + y) * width + (minX + x)) * 4;
      const dstIdx = (y * cropW + x) * 4;

      let r = data[srcIdx] ?? 255;
      let g = data[srcIdx + 1] ?? 255;
      let b = data[srcIdx + 2] ?? 255;
      let a = data[srcIdx + 3] ?? 0;

      if (crispThreshold) {
        if (a >= 96) {
          a = 255;
          r = 255;
          g = 255;
          b = 255;
        } else {
          a = 0;
        }
      }

      cropped[dstIdx] = r;
      cropped[dstIdx + 1] = g;
      cropped[dstIdx + 2] = b;
      cropped[dstIdx + 3] = a;
    }
  }

  return { width: cropW, height: cropH, rgba: cropped };
}

/**
 * Browser-side composable adapter for dynamic Google Fonts injection and pixel canvas rasterization.
 */
export function useFontRasterizer() {
  const isFontLoading = ref(false);
  const lastRasterError = ref<string | null>(null);

  /**
   * Injects Google Fonts CSS2 stylesheet into document head if not already injected.
   */
  async function ensureFontLoaded(
    config: GoogleFontConfig,
    timeoutMs = 3000,
  ): Promise<boolean> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }

    const family = config.family.trim();
    if (!family) return false;

    const weight = config.weight || 400;
    const style = config.style ?? 'normal';
    const fontSize = config.fontSizePx || 8;
    const cssUrl = buildGoogleFontsCss2Url(family, [weight]);

    if (!loadedFontUrls.has(cssUrl)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssUrl;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      loadedFontUrls.add(cssUrl);
    }

    if (!document.fonts?.load) {
      return true;
    }

    try {
      const fontSpec = `${style} ${weight} ${fontSize}px "${family}"`;
      const loadPromise = document.fonts.load(fontSpec);
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), timeoutMs);
      });

      await Promise.race([loadPromise, timeoutPromise]);
      return document.fonts.check(fontSpec);
    } catch (err) {
      lastRasterError.value = err instanceof Error ? err.message : String(err);
      return false;
    }
  }

  /**
   * Renders the given text with the specified Google Font configuration on an offscreen canvas
   * and extracts { width, height, rgba } pixel raster.
   */
  async function rasterizeText(
    text: string,
    config: GoogleFontConfig,
    options?: RasterizeOptions,
  ): Promise<RasterizedFontResult | null> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return null;
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      return { width: 0, height: 0, rgba: new Uint8ClampedArray(0) };
    }

    const family = config.family.trim();
    const weight = config.weight || 400;
    const fontSize = Math.max(4, Math.min(64, Math.round(config.fontSizePx || 8)));
    const style = config.style ?? 'normal';
    const crisp = options?.crispThreshold ?? true;
    const timeout = options?.timeoutMs ?? 3000;

    const cacheKey = `${family}:${weight}:${style}:${fontSize}:${trimmedText}:${crisp}`;
    const cached = rasterCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    isFontLoading.value = true;
    lastRasterError.value = null;

    try {
      await ensureFontLoaded(config, timeout);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        throw new Error('Canvas 2D context creation failed');
      }

      ctx.imageSmoothingEnabled = false;
      ctx.font = `${style} ${weight} ${fontSize}px "${family}", sans-serif`;

      const measured = ctx.measureText(trimmedText);
      const measuredW = Math.ceil(measured.width);
      const canvasW = Math.max(8, measuredW + 8);
      const canvasH = Math.max(8, Math.ceil(fontSize * 2) + 4);

      canvas.width = canvasW;
      canvas.height = canvasH;

      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvasW, canvasH);
      ctx.font = `${style} ${weight} ${fontSize}px "${family}", sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';

      const baselineY = Math.floor(canvasH / 2);
      ctx.fillText(trimmedText, 2, baselineY);

      const imgData = ctx.getImageData(0, 0, canvasW, canvasH);
      const result = trimRasterData(imgData, crisp);

      rasterCache.set(cacheKey, result);
      return result;
    } catch (err) {
      lastRasterError.value = err instanceof Error ? err.message : String(err);
      return null;
    } finally {
      isFontLoading.value = false;
    }
  }

  function clearCache(): void {
    rasterCache.clear();
  }

  return {
    ensureFontLoaded,
    rasterizeText,
    isFontLoading,
    lastRasterError,
    clearCache,
  };
}
