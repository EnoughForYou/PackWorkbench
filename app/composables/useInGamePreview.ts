import { computed, ref, watch } from 'vue';
import {
  calculateWindowGuiScale,
  simulateRawFloatCursorRuns,
} from '@core/font/bitmapMetrics.ts';
import {
  buildProjectSnippets,
  resolveProjectBindings,
} from '@core/font/packBuilder.ts';
import {
  resolveBitmapEntryRaster,
  synthesizeRankRgba,
  type RgbaRaster,
} from '@core/font/pixelSynth.ts';
import { createDefaultRankComposer } from '@core/font/presets.ts';
import type { PreviewContext } from '@core/font/types.ts';
import { useWorkbenchStore } from '@/stores/workbenchStore';

export interface MappedPreviewGlyph {
  readonly advance: number;
  readonly kind: 'bitmap' | 'space';
  readonly label: string;
  readonly raster: RgbaRaster | null;
  readonly height: number;
  readonly ascent: number;
}

const GRASS_PALETTE = ['#466f2a', '#4f7c30', '#588737', '#3d6324', '#63943f'] as const;

function deterministicHash(x: number, y: number): number {
  let n = (x * 374761393 + y * 668265263) ^ 0x5bd1e995;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (n ^ (n >>> 16)) >>> 0;
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  targetW: number,
  targetH: number,
): void {
  const sw = img.naturalWidth || img.width;
  const sh = img.naturalHeight || img.height;
  if (sw <= 0 || sh <= 0) return;
  const scale = Math.max(targetW / sw, targetH / sh);
  const drawW = sw * scale;
  const drawH = sh * scale;
  const dx = (targetW - drawW) / 2;
  const dy = (targetH - drawH) / 2;
  ctx.drawImage(img, dx, dy, drawW, drawH);
}

/**
 * Draws a synthetic angled pixel-art grass terrain scene inspired by Minecraft's
 * low-camera chat view, without shipping any vanilla Mojang assets.
 */
function drawGrassChatBackdrop(
  ctx: CanvasRenderingContext2D,
  logicalW: number,
  logicalH: number,
  scaleMultiplier: number,
): void {
  const tile = 3;
  for (let y = 0; y < logicalH; y += tile) {
    const depth = 0.72 + (y / logicalH) * 0.36;
    const shearOffset = Math.floor(y * 0.45);
    for (let x = 0; x < logicalW + tile; x += tile) {
      const worldX = Math.floor((x + shearOffset) / (tile * 2));
      const worldY = Math.floor(y / tile);
      const idx = deterministicHash(worldX, worldY) % GRASS_PALETTE.length;
      const base = GRASS_PALETTE[idx] ?? '#4f7c30';
      ctx.fillStyle = base;
      ctx.fillRect(
        x * scaleMultiplier,
        y * scaleMultiplier,
        tile * scaleMultiplier,
        tile * scaleMultiplier,
      );
      if ((deterministicHash(worldX + 7, worldY + 13) & 3) === 0) {
        ctx.fillStyle = depth > 0.9 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
        ctx.fillRect(
          x * scaleMultiplier,
          y * scaleMultiplier,
          tile * scaleMultiplier,
          scaleMultiplier,
        );
      }
    }
  }
  const haze = ctx.createLinearGradient(0, 0, 0, logicalH * scaleMultiplier);
  haze.addColorStop(0, 'rgba(9, 14, 8, 0.28)');
  haze.addColorStop(1, 'rgba(8, 12, 7, 0.1)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, logicalW * scaleMultiplier, logicalH * scaleMultiplier);
}

/**
 * Draws a synthetic third-person superflat sky + grass terrain + original pixel avatar,
 * replicating Minecraft F5 nametag framing without copyrighted assets or watermarks.
 */
function drawThirdPersonWorldBackdrop(
  ctx: CanvasRenderingContext2D,
  logicalW: number,
  logicalH: number,
  scaleMultiplier: number,
  drawAvatar: boolean,
): { readonly headTopY: number; readonly cx: number } {
  const horizonY = Math.round(logicalH * 0.46);

  // Clear blue daytime sky gradient with subtle horizon atmospheric band
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY * scaleMultiplier);
  skyGrad.addColorStop(0, '#78a8ff');
  skyGrad.addColorStop(0.65, '#9ec3ff');
  skyGrad.addColorStop(1, '#c8deff');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, logicalW * scaleMultiplier, horizonY * scaleMultiplier);

  // Flat distant block clouds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.fillRect(18 * scaleMultiplier, 8 * scaleMultiplier, 36 * scaleMultiplier, 4 * scaleMultiplier);
  ctx.fillRect(
    (logicalW - 62) * scaleMultiplier,
    12 * scaleMultiplier,
    42 * scaleMultiplier,
    5 * scaleMultiplier,
  );

  // Superflat perspective grass rows from horizon down to foreground
  for (let py = horizonY; py < logicalH; py++) {
    const t = (py - horizonY) / Math.max(1, logicalH - horizonY);
    const cellW = Math.max(1, Math.round(1 + t * 5));
    const band = Math.floor(Math.pow(t, 0.65) * 14);
    for (let px = 0; px < logicalW; px += cellW) {
      const colIdx = Math.floor((px - logicalW / 2) / cellW);
      const shadeIdx = deterministicHash(colIdx, band) % GRASS_PALETTE.length;
      ctx.fillStyle = GRASS_PALETTE[shadeIdx] ?? '#4f7c30';
      ctx.fillRect(
        px * scaleMultiplier,
        py * scaleMultiplier,
        cellW * scaleMultiplier,
        scaleMultiplier,
      );
    }
    if (t < 0.16) {
      ctx.fillStyle = `rgba(182, 212, 255, ${0.42 * (1 - t / 0.16)})`;
      ctx.fillRect(0, py * scaleMultiplier, logicalW * scaleMultiplier, scaleMultiplier);
    }
  }

  // Synthetic original third-person voxel character centered below horizon
  // Scale up so character (28 units tall) fills ~40% of the frame vertically
  const cx = Math.round(logicalW / 2);
  const footY = Math.round(logicalH * 0.88);
  const targetCharH = Math.round(logicalH * 0.40);
  const charScale = Math.max(1.8, Math.round((targetCharH / 28) * 10) / 10);
  const headTopY = footY - Math.round(28 * charScale);

  if (!drawAvatar) {
    return { headTopY, cx };
  }

  // Ground contact shadow under character
  ctx.fillStyle = 'rgba(15, 28, 10, 0.35)';
  ctx.fillRect(
    Math.round((cx - 5 * charScale) * scaleMultiplier),
    Math.round((footY - charScale) * scaleMultiplier),
    Math.round(10 * charScale * scaleMultiplier),
    Math.max(1, Math.round(2 * charScale * scaleMultiplier)),
  );

  const pxRect = (ox: number, oy: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.round((cx + ox * charScale) * scaleMultiplier),
      Math.round((footY + oy * charScale) * scaleMultiplier),
      Math.max(1, Math.round(w * charScale * scaleMultiplier)),
      Math.max(1, Math.round(h * charScale * scaleMultiplier)),
    );
  };

  // Legs (olive-slate trousers & boots)
  pxRect(-3, -11, 3, 11, '#5d8443');
  pxRect(0, -11, 3, 11, '#52763a');
  pxRect(-3, -2, 3, 2, '#d89b28');
  pxRect(0, -2, 3, 2, '#c0871d');

  // Torso (synthetic adventurer vest + belt)
  pxRect(-3, -20, 6, 9, '#6e9c4e');
  pxRect(-2, -19, 4, 6, '#e5aa3e');
  pxRect(-3, -13, 6, 2, '#5c3419');

  // Arms
  pxRect(-5, -20, 2, 9, '#5d8443');
  pxRect(3, -20, 2, 9, '#52763a');
  pxRect(-5, -14, 2, 2, '#e5aa3e');
  pxRect(3, -14, 2, 2, '#c8902a');

  // Head + headband + subtle eyes (synthetic non-Mojang rig)
  pxRect(-4, -28, 8, 8, '#6e9c4e');
  pxRect(-4, -27, 8, 1, '#58823c');
  pxRect(-4, -25, 8, 2, '#e8a829');
  pxRect(-3, -25, 1, 1, '#151821');
  pxRect(2, -25, 1, 1, '#151821');
  pxRect(-4, -21, 8, 1, '#59823d');

  return { headTopY, cx };
}

function drawMiniHeadAvatar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  scaleMultiplier: number,
  accent: string,
): void {
  const s = scaleMultiplier;
  ctx.fillStyle = '#6e9c4e';
  ctx.fillRect(x * s, y * s, size * s, size * s);
  ctx.fillStyle = accent;
  ctx.fillRect(x * s, (y + 3) * s, size * s, 2 * s);
  ctx.fillStyle = '#151821';
  ctx.fillRect((x + 1) * s, (y + 3) * s, s, s);
  ctx.fillRect((x + size - 2) * s, (y + 3) * s, s, s);
}

function drawPingBars(
  ctx: CanvasRenderingContext2D,
  rightX: number,
  bottomY: number,
  scaleMultiplier: number,
  bars = 5,
): void {
  const s = scaleMultiplier;
  for (let i = 0; i < 5; i++) {
    const bh = 2 + i;
    const bx = rightX - (5 - i) * 2;
    const by = bottomY - bh;
    ctx.fillStyle = i < bars ? '#22c55e' : 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(bx * s, by * s, s, bh * s);
  }
}

function drawRaster(
  ctx: CanvasRenderingContext2D,
  raster: RgbaRaster,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  scaleMultiplier: number,
): void {
  if (typeof document === 'undefined' || raster.width <= 0 || raster.height <= 0) return;
  const off = document.createElement('canvas');
  off.width = raster.width;
  off.height = raster.height;
  const octx = off.getContext('2d');
  if (!octx) return;
  octx.putImageData(
    new ImageData(new Uint8ClampedArray(raster.rgba), raster.width, raster.height),
    0,
    0,
  );
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    off,
    Math.round(dx * scaleMultiplier),
    Math.round(dy * scaleMultiplier),
    Math.round(dw * scaleMultiplier),
    Math.round(dh * scaleMultiplier),
  );
}

function measureMinecraftText(
  ctx: CanvasRenderingContext2D,
  text: string,
  scaleMultiplier: number,
  fontSize: number,
): number {
  const s = scaleMultiplier;
  const sizePx = Math.max(7, Math.round(fontSize * s));
  ctx.font = `bold ${sizePx}px "Minecraft", "JetBrains Mono", "Courier New", monospace`;
  return Math.ceil(ctx.measureText(text).width / s);
}

function drawMinecraftText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  scaleMultiplier: number,
  fontSize: number,
): number {
  const s = scaleMultiplier;
  const sizePx = Math.max(7, Math.round(fontSize * s));
  ctx.font = `bold ${sizePx}px "Minecraft", "JetBrains Mono", "Courier New", monospace`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  const rx = Math.round(x * s);
  const ry = Math.round(y * s);
  const shadowOffset = Math.max(1, Math.round(s));

  // 1px Minecraft shadow offset
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillText(text, rx + shadowOffset, ry + shadowOffset);

  // Foreground text
  ctx.fillStyle = color;
  ctx.fillText(text, rx, ry);

  return Math.ceil(ctx.measureText(text).width / s);
}

function parseChatText(rawChat: string): { readonly playerName: string; readonly msgText: string } {
  const trimmed = (rawChat || 'P0TAT0D0G: Hi, thanks for using my tools!').trim();
  const colonIdx = trimmed.indexOf(':');
  if (colonIdx > 0) {
    const playerName = trimmed.slice(0, colonIdx).trim() || 'P0TAT0D0G';
    const msgText = trimmed.slice(colonIdx);
    return { playerName, msgText };
  }
  return { playerName: trimmed || 'P0TAT0D0G', msgText: '' };
}

interface TabPlayerEntry {
  readonly name: string;
  readonly avatarAccent: string;
  readonly raster: RgbaRaster;
  readonly isActive: boolean;
  readonly ping: number;
}

let cachedOtherTabRasters: readonly RgbaRaster[] | null = null;

function getOtherTabRasters(): readonly RgbaRaster[] {
  if (cachedOtherTabRasters) return cachedOtherTabRasters;
  cachedOtherTabRasters = [
    synthesizeRankRgba(
      createDefaultRankComposer({
        text: 'VIP',
        fontSize: '3x5',
        textColor: '#38bdf8',
        shadowColor: '#0c4a6e',
        frameStyle: 'outline',
        frameColor: '#0369a1',
        frameBorderColor: '#38bdf8',
        iconId: 'star',
        iconColor: '#bae6fd',
        paddingX: 2,
        paddingY: 1,
      }),
      { frame: true, icon: true, text: true, shadow: true, paint: false },
    ),
    synthesizeRankRgba(
      createDefaultRankComposer({
        text: 'MVP',
        fontSize: '3x5',
        textColor: '#f43f5e',
        shadowColor: '#4c0519',
        frameStyle: 'bevel',
        frameColor: '#9f1239',
        frameBorderColor: '#fda4af',
        iconId: 'crown',
        iconColor: '#fde047',
        paddingX: 2,
        paddingY: 1,
      }),
      { frame: true, icon: true, text: true, shadow: true, paint: false },
    ),
    synthesizeRankRgba(
      createDefaultRankComposer({
        text: 'MOD',
        fontSize: '3x5',
        textColor: '#22c55e',
        shadowColor: '#052e16',
        frameStyle: 'outline',
        frameColor: '#15803d',
        frameBorderColor: '#4ade80',
        iconId: 'shield',
        iconColor: '#86efac',
        paddingX: 2,
        paddingY: 1,
      }),
      { frame: true, icon: true, text: true, shadow: true, paint: false },
    ),
    synthesizeRankRgba(
      createDefaultRankComposer({
        text: 'PRO',
        fontSize: '3x5',
        textColor: '#c084fc',
        shadowColor: '#3b0764',
        frameStyle: 'pill',
        frameColor: '#7e22ce',
        frameBorderColor: '#d8b4fe',
        iconId: 'gem',
        iconColor: '#e9d5ff',
        paddingX: 2,
        paddingY: 1,
      }),
      { frame: true, icon: true, text: true, shadow: true, paint: false },
    ),
  ];
  return cachedOtherTabRasters;
}

function getTabPlayers(activeName: string, activeRaster: RgbaRaster): readonly TabPlayerEntry[] {
  const others = getOtherTabRasters();
  return [
    {
      name: activeName,
      avatarAccent: '#e8a829',
      raster: activeRaster,
      isActive: true,
      ping: 5,
    },
    {
      name: 'Alex_99',
      avatarAccent: '#38bdf8',
      raster: others[0]!,
      isActive: false,
      ping: 5,
    },
    {
      name: 'SteveCrafter',
      avatarAccent: '#ec4899',
      raster: others[1]!,
      isActive: false,
      ping: 4,
    },
    {
      name: 'Noxite',
      avatarAccent: '#22c55e',
      raster: others[2]!,
      isActive: false,
      ping: 5,
    },
    {
      name: 'PixelKnight',
      avatarAccent: '#a855f7',
      raster: others[3]!,
      isActive: false,
      ping: 4,
    },
  ];
}

export function useInGamePreview() {
  const store = useWorkbenchStore();
  const customImage = ref<HTMLImageElement | null>(null);
  const customImageRevision = ref(0);

  watch(
    () => store.customBackdropUrl,
    (url) => {
      if (!url || typeof Image === 'undefined') {
        customImage.value = null;
        return;
      }
      const img = new Image();
      img.onload = () => {
        customImage.value = img;
        customImageRevision.value++;
      };
      img.src = url;
    },
    { immediate: true },
  );

  const effectiveGuiScale = computed(() =>
    calculateWindowGuiScale(
      store.fontProject.guiScale,
      store.fontProject.forceUnicode,
    ),
  );

  const snippets = computed(() => buildProjectSnippets(store.fontProject));

  const advanceMap = computed(() => {
    const proj = store.fontProject;
    const map = new Map<number, MappedPreviewGlyph>();

    const { spaceAdvances } = resolveProjectBindings(proj);
    for (const sp of spaceAdvances) {
      const cp = sp.char.codePointAt(0);
      if (cp !== undefined && !map.has(cp)) {
        map.set(cp, {
          advance: sp.advance,
          kind: 'space',
          label: `Space(${sp.advance})`,
          raster: null,
          height: 8,
          ascent: 7,
        });
      }
    }

    for (const entry of proj.entries) {
      if (entry.kind !== 'bitmap') continue;
      const metrics = store.validation.metricsByEntryId[entry.id];
      const raster = resolveBitmapEntryRaster(
        entry,
        store.decodedUploads.get(entry.id),
      );
      if (!metrics || !raster) continue;

      for (const cell of metrics.cells) {
        if (cell.codepoint === 0 || map.has(cell.codepoint)) continue;
        let cellRaster = raster;
        if (metrics.cols > 1 || metrics.rows > 1) {
          const cropped = new Uint8ClampedArray(metrics.cellW * metrics.cellH * 4);
          const ox = cell.col * metrics.cellW;
          const oy = cell.row * metrics.cellH;
          for (let y = 0; y < metrics.cellH; y++) {
            const srcStart = ((oy + y) * raster.width + ox) * 4;
            const dstStart = y * metrics.cellW * 4;
            cropped.set(
              raster.rgba.subarray(srcStart, srcStart + metrics.cellW * 4),
              dstStart,
            );
          }
          cellRaster = { width: metrics.cellW, height: metrics.cellH, rgba: cropped };
        }

        map.set(cell.codepoint, {
          advance: cell.advance,
          kind: 'bitmap',
          label: entry.label,
          raster: cellRaster,
          height: entry.height,
          ascent: entry.ascent,
        });
      }
    }
    return map;
  });

  const cursorRuns = computed(() =>
    simulateRawFloatCursorRuns(
      `${snippets.value.prefixLiteral} ${store.fontProject.sampleChatText}`,
      advanceMap.value,
      4,
    ),
  );

  function getActivePrefixTokens(): readonly {
    readonly id: string;
    readonly label: string;
    readonly kind: 'bitmap' | 'space';
    readonly raster: RgbaRaster | null;
    readonly advance: number;
    readonly height: number;
    readonly ascent: number;
  }[] {
    const proj = store.fontProject;
    const ids =
      proj.prefixSequenceIds.length > 0
        ? proj.prefixSequenceIds
        : store.selectedEntry
          ? [store.selectedEntry.id]
          : [];

    const tokens: {
      id: string;
      label: string;
      kind: 'bitmap' | 'space';
      raster: RgbaRaster | null;
      advance: number;
      height: number;
      ascent: number;
    }[] = [];

    for (const id of ids) {
      let entry = proj.entries.find((e) => e.id === id);
      if (!entry && store.selectedEntry?.id === id) {
        entry = store.selectedEntry;
      }
      if (!entry) continue;

      if (entry.kind === 'space') {
        tokens.push({
          id: entry.id,
          label: entry.label,
          kind: 'space',
          raster: null,
          advance: entry.advance,
          height: 8,
          ascent: 7,
        });
      } else if (entry.kind === 'bitmap') {
        const raster = resolveBitmapEntryRaster(
          entry,
          store.decodedUploads.get(entry.id),
        );
        const metrics = store.validation.metricsByEntryId[entry.id];
        const fallbackAdvance = raster ? raster.width + 1 : (entry.height || 9) + 1;
        const advance = metrics?.cells[0]?.advance ?? fallbackAdvance;

        tokens.push({
          id: entry.id,
          label: entry.label,
          kind: 'bitmap',
          raster,
          advance,
          height: entry.height,
          ascent: entry.ascent,
        });
      }
    }

    if (tokens.length === 0) {
      const fallbackRaster = synthesizeRankRgba(
        createDefaultRankComposer({
          text: 'VIP',
          fontSize: '3x5',
          textColor: '#ffffff',
          shadowColor: '#0c0a09',
          frameStyle: 'bevel',
          frameColor: '#e11d48',
          frameBorderColor: '#fda4af',
          iconId: 'gem',
          iconColor: '#fef08a',
        }),
        { frame: true, icon: true, text: true, shadow: true, paint: true },
      );
      tokens.push({
        id: 'fallback-vip',
        label: 'VIP',
        kind: 'bitmap',
        raster: fallbackRaster,
        advance: fallbackRaster.width + 1,
        height: 9,
        ascent: 8,
      });
    }

    return tokens;
  }

  function getActiveRankRaster(): RgbaRaster {
    const tokens = getActivePrefixTokens();
    const firstBitmap = tokens.find((t) => t.kind === 'bitmap' && t.raster);
    if (firstBitmap && firstBitmap.raster) {
      return firstBitmap.raster;
    }
    return synthesizeRankRgba(
      createDefaultRankComposer({
        text: 'VIP',
        fontSize: '3x5',
        textColor: '#ffffff',
        shadowColor: '#0c0a09',
        frameStyle: 'bevel',
        frameColor: '#e11d48',
        frameBorderColor: '#fda4af',
        iconId: 'gem',
        iconColor: '#fef08a',
      }),
      { frame: true, icon: true, text: true, shadow: true, paint: true },
    );
  }

  function renderInGameStrip(
    canvas: HTMLCanvasElement | null,
    context: PreviewContext,
    scaleMultiplier: number,
    logicalWidth?: number,
    variant: 'compact' | 'stage' = 'compact',
  ): void {
    // Subscribe explicitly to reactive state used during render
    void customImageRevision.value;
    const backdropMode = store.previewBackdropMode;
    const userImg = customImage.value;

    if (!canvas || typeof document === 'undefined') return;
    const logicalW = logicalWidth ?? (variant === 'stage' ? 320 : 232);
    const logicalH =
      backdropMode === 'solid'
        ? context === 'TAB'
          ? (variant === 'stage' ? 120 : 96)
          : context === 'Nametag'
            ? (variant === 'stage' ? 120 : 80)
            : (variant === 'stage' ? 80 : 60)
        : context === 'Nametag'
          ? variant === 'stage'
            ? 150
            : 110
          : context === 'TAB'
            ? variant === 'stage'
              ? 140
              : 110
            : variant === 'stage'
              ? 100
              : 74;

    canvas.width = logicalW * scaleMultiplier;
    canvas.height = logicalH * scaleMultiplier;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const { playerName, msgText } = parseChatText(store.fontProject.sampleChatText);
    const activeTokens = getActivePrefixTokens();
    const activeRaster = getActiveRankRaster();

    // 1. Render Backdrop Layer
    let nametagHeadTopY = Math.round(logicalH * 0.48);
    let nametagCenterX = Math.round(logicalW / 2);

    if (backdropMode === 'custom' && userImg) {
      drawCoverImage(ctx, userImg, canvas.width, canvas.height);
    } else if (backdropMode === 'world') {
      if (context === 'Chat') {
        drawGrassChatBackdrop(ctx, logicalW, logicalH, scaleMultiplier);
      } else if (context === 'TAB') {
        drawThirdPersonWorldBackdrop(ctx, logicalW, logicalH, scaleMultiplier, false);
      } else {
        const res = drawThirdPersonWorldBackdrop(ctx, logicalW, logicalH, scaleMultiplier, true);
        nametagHeadTopY = res.headTopY;
        nametagCenterX = res.cx;
      }
    } else {
      ctx.fillStyle = '#1e1f29';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. Chat Preview Scene
    if (context === 'Chat') {
      const barH = variant === 'stage' ? 24 : 20;
      // Position at bottom 20% of canvas
      const barY = logicalH - barH - (variant === 'stage' ? 6 : 4);

      // Background: rgba(0,0,0,0.5) covering full canvas width
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(
        0,
        barY * scaleMultiplier,
        logicalW * scaleMultiplier,
        barH * scaleMultiplier,
      );

      // Render all active prefix tokens horizontally respecting glyph advance
      const badgeH = Math.round(barH * 0.72);
      const fontSize = variant === 'stage' ? 10 : 9;

      let currentX = 8;
      for (const token of activeTokens) {
        const tokenH = token.height || 9;
        const scale = badgeH / tokenH;

        if (token.kind === 'space') {
          currentX += token.advance * scale;
        } else if (token.kind === 'bitmap' && token.raster) {
          const rH = Math.max(1, token.raster.height);
          const drawH = badgeH;
          const drawW = Math.max(1, Math.round(token.raster.width * (drawH / rH)));
          const drawY = barY + Math.round((barH - drawH) / 2);

          drawRaster(ctx, token.raster, currentX, drawY, drawW, drawH, scaleMultiplier);

          const advancePx = token.advance ? Math.round(token.advance * scale) : drawW + 1;
          currentX += Math.max(drawW, advancePx);
        }
      }

      // Player name text (P0TAT0D0G) in white Minecraft font
      const nameX = Math.round(currentX + 5);
      const nameY = barY + barH / 2;

      const nameW = drawMinecraftText(
        ctx,
        playerName,
        nameX,
        nameY,
        '#ffffff',
        scaleMultiplier,
        fontSize,
      );

      // Message text follows in lighter color
      if (msgText) {
        drawMinecraftText(
          ctx,
          msgText,
          nameX + nameW + 1,
          nameY,
          '#d1d5db',
          scaleMultiplier,
          fontSize,
        );
      }
      return;
    }

    // 3. TAB Preview Scene
    if (context === 'TAB') {
      const tabPlayers = getTabPlayers(playerName, activeRaster);
      const rowCount = tabPlayers.length;

      const rowH = variant === 'stage' ? 15 : 12;
      const padY = variant === 'stage' ? 5 : 4;
      const boxH = rowCount * rowH + padY * 2;
      // Centered vertically, filling ~60% of canvas height
      const boxY = Math.round((logicalH - boxH) / 2);

      // TAB list background centered in canvas, not full-width
      const boxW = Math.min(logicalW - 32, variant === 'stage' ? 230 : 190);
      const boxX = Math.round((logicalW - boxW) / 2);

      // Background: rgba(0,0,0,0.6)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(
        boxX * scaleMultiplier,
        boxY * scaleMultiplier,
        boxW * scaleMultiplier,
        boxH * scaleMultiplier,
      );

      for (let i = 0; i < rowCount; i++) {
        const p = tabPlayers[i]!;
        const rowY = boxY + padY + i * rowH;

        // Active player highlighted row
        if (p.isActive) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.fillRect(
            (boxX + 3) * scaleMultiplier,
            rowY * scaleMultiplier,
            (boxW - 6) * scaleMultiplier,
            rowH * scaleMultiplier,
          );
        }

        // 1. Mini head avatar
        const avatarSize = Math.max(7, Math.round(rowH * 0.65));
        const avatarX = boxX + 5;
        const avatarY = rowY + Math.round((rowH - avatarSize) / 2);
        drawMiniHeadAvatar(ctx, avatarX, avatarY, avatarSize, scaleMultiplier, p.avatarAccent);

        // 2. Rank badge / chain (actual pixels)
        const badgeH = Math.max(7, Math.round(rowH * 0.62));
        let badgeEndX = avatarX + avatarSize + 4;

        if (p.isActive) {
          let curX = badgeEndX;
          for (const token of activeTokens) {
            const tokenH = token.height || 9;
            const scale = badgeH / tokenH;

            if (token.kind === 'space') {
              curX += token.advance * scale;
            } else if (token.kind === 'bitmap' && token.raster) {
              const rH = Math.max(1, token.raster.height);
              const drawH = badgeH;
              const drawW = Math.max(1, Math.round(token.raster.width * (drawH / rH)));
              const drawY = rowY + Math.round((rowH - drawH) / 2);

              drawRaster(ctx, token.raster, curX, drawY, drawW, drawH, scaleMultiplier);

              const advancePx = token.advance ? Math.round(token.advance * scale) : drawW + 1;
              curX += Math.max(drawW, advancePx);
            }
          }
          badgeEndX = Math.max(badgeEndX, curX);
        } else {
          const prH = Math.max(1, p.raster.height);
          const badgeW = Math.max(1, Math.round(p.raster.width * (badgeH / prH)));
          const badgeX = badgeEndX;
          const badgeY = rowY + Math.round((rowH - badgeH) / 2);
          drawRaster(ctx, p.raster, badgeX, badgeY, badgeW, badgeH, scaleMultiplier);
          badgeEndX = badgeX + badgeW;
        }

        // 3. Player name (truncated with .. if name is exceptionally long so ping bars never overlap)
        const nameX = badgeEndX + 4;
        const nameY = rowY + rowH / 2;
        const fontSize = Math.max(7, Math.round(rowH * 0.58));
        const pingRightX = boxX + boxW - 5;
        const maxNameW = Math.max(20, pingRightX - 16 - nameX);

        let displayName = p.name;
        if (measureMinecraftText(ctx, displayName, scaleMultiplier, fontSize) > maxNameW) {
          while (displayName.length > 3 && measureMinecraftText(ctx, `${displayName}..`, scaleMultiplier, fontSize) > maxNameW) {
            displayName = displayName.slice(0, -1);
          }
          displayName = `${displayName}..`;
        }

        drawMinecraftText(
          ctx,
          displayName,
          nameX,
          nameY,
          p.isActive ? '#ffffff' : '#cbd5e1',
          scaleMultiplier,
          fontSize,
        );

        // 4. Ping bars
        const pingBottomY = rowY + rowH - 2;
        drawPingBars(ctx, pingRightX, pingBottomY, scaleMultiplier, p.ping);
      }
      return;
    }

    // 4. Third Person (Nametag) Scene
    const fontSize = variant === 'stage' ? 9 : 8;
    const nameW = measureMinecraftText(ctx, playerName, scaleMultiplier, fontSize);

    const badgeH = Math.max(8, Math.round(fontSize * 1.05));
    const gap = 4;
    const padX = 5;
    const padY = 3;

    // Precalculate total width of prefix chain
    let chainW = 0;
    for (const token of activeTokens) {
      const tokenH = token.height || 9;
      const scale = badgeH / tokenH;
      if (token.kind === 'space') {
        chainW += token.advance * scale;
      } else if (token.kind === 'bitmap' && token.raster) {
        const rH = Math.max(1, token.raster.height);
        const drawH = badgeH;
        const drawW = Math.max(1, Math.round(token.raster.width * (drawH / rH)));
        const advancePx = token.advance ? Math.round(token.advance * scale) : drawW + 1;
        chainW += Math.max(drawW, advancePx);
      }
    }
    chainW = Math.max(0, Math.round(chainW));

    const pillW = chainW + (chainW > 0 ? gap : 0) + nameW + padX * 2;
    const pillH = Math.max(badgeH, fontSize) + padY * 2;

    // Centered above the character's head, bounded within canvas
    const idealPillX = Math.round(nametagCenterX - pillW / 2);
    const pillX = Math.max(4, Math.min(logicalW - pillW - 4, idealPillX));
    // Floats ~6-8 logical pixels above head
    const pillY =
      backdropMode === 'solid'
        ? Math.round((logicalH - pillH) / 2)
        : Math.max(4, Math.round(nametagHeadTopY - pillH - 7));

    // Semi-transparent background rect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(
      pillX * scaleMultiplier,
      pillY * scaleMultiplier,
      pillW * scaleMultiplier,
      pillH * scaleMultiplier,
    );

    // Draw active prefix chain
    let curX = pillX + padX;
    for (const token of activeTokens) {
      const tokenH = token.height || 9;
      const scale = badgeH / tokenH;
      if (token.kind === 'space') {
        curX += token.advance * scale;
      } else if (token.kind === 'bitmap' && token.raster) {
        const rH = Math.max(1, token.raster.height);
        const drawH = badgeH;
        const drawW = Math.max(1, Math.round(token.raster.width * (drawH / rH)));
        const drawY = pillY + Math.round((pillH - drawH) / 2);
        drawRaster(ctx, token.raster, curX, drawY, drawW, drawH, scaleMultiplier);
        const advancePx = token.advance ? Math.round(token.advance * scale) : drawW + 1;
        curX += Math.max(drawW, advancePx);
      }
    }

    // Player name text in white
    const nameX = (chainW > 0 ? Math.max(curX, pillX + padX + chainW) + gap : pillX + padX);
    const nameY = pillY + pillH / 2;
    drawMinecraftText(
      ctx,
      playerName,
      nameX,
      nameY,
      '#ffffff',
      scaleMultiplier,
      fontSize,
    );
  }

  return {
    effectiveGuiScale,
    snippets,
    advanceMap,
    cursorRuns,
    renderInGameStrip,
    getActivePrefixTokens,
    getActiveRankRaster,
  };
}
