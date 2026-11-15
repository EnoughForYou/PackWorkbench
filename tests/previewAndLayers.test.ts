import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RANK_LAYER_ORDER,
  synthesizeRankRgba,
  type RgbaRaster,
} from '../src/core/font/pixelSynth.ts';
import { createDefaultRankComposer } from '../src/core/font/presets.ts';
import type { RankLayerId } from '../src/core/font/types.ts';

// Pure algorithmic recreation of reorderLayer from InspectorLayersTab.vue
function simulateReorderLayer(
  currentOrder: readonly RankLayerId[] | undefined,
  sourceId: RankLayerId,
  targetId: RankLayerId,
  position: 'above' | 'below',
): readonly RankLayerId[] {
  if (sourceId === targetId) return currentOrder ?? DEFAULT_RANK_LAYER_ORDER;
  const raw = currentOrder && currentOrder.length > 0 ? currentOrder : DEFAULT_RANK_LAYER_ORDER;
  const uiOrder = [...raw].reverse();
  const withoutSource = uiOrder.filter((id) => id !== sourceId);
  const targetIdx = withoutSource.indexOf(targetId);
  if (targetIdx < 0) return raw;
  const insertIdx = position === 'above' ? targetIdx : targetIdx + 1;
  withoutSource.splice(insertIdx, 0, sourceId);
  return withoutSource.reverse();
}

// Pure algorithmic recreation of parseChatText from useInGamePreview.ts
function simulateParseChatText(rawChat: string): { readonly playerName: string; readonly msgText: string } {
  const trimmed = (rawChat || 'P0TAT0D0G: Hi, thanks for using my tools!').trim();
  const colonIdx = trimmed.indexOf(':');
  if (colonIdx > 0) {
    const playerName = trimmed.slice(0, colonIdx).trim() || 'P0TAT0D0G';
    const msgText = trimmed.slice(colonIdx);
    return { playerName, msgText };
  }
  return { playerName: trimmed || 'P0TAT0D0G', msgText: '' };
}

describe('Studio Layer Drag Reorder & In-Game Preview Engine', () => {
  it('correctly reorders layers from top-to-bottom UI drag into composite layerOrder', () => {
    // Default composite order: ['frame', 'shadow', 'icon', 'text', 'paint']
    // UI top-to-bottom display: ['paint', 'text', 'icon', 'shadow', 'frame']
    const base = DEFAULT_RANK_LAYER_ORDER;

    // Drag 'paint' below 'text'
    const r1 = simulateReorderLayer(base, 'paint', 'text', 'below');
    // UI should be: ['text', 'paint', 'icon', 'shadow', 'frame']
    // Composite order: ['frame', 'shadow', 'icon', 'paint', 'text']
    expect([...r1].reverse()).toEqual(['text', 'paint', 'icon', 'shadow', 'frame']);
    expect(r1).toEqual(['frame', 'shadow', 'icon', 'paint', 'text']);

    // Drag 'frame' above 'text'
    const r2 = simulateReorderLayer(base, 'frame', 'text', 'above');
    // UI should be: ['paint', 'frame', 'text', 'icon', 'shadow']
    // Composite order: ['shadow', 'icon', 'text', 'frame', 'paint']
    expect([...r2].reverse()).toEqual(['paint', 'frame', 'text', 'icon', 'shadow']);

    // Drag onto self is a no-op
    const r3 = simulateReorderLayer(base, 'icon', 'icon', 'above');
    expect(r3).toEqual(base);

    // Drag unknown layer is safe no-op
    const r4 = simulateReorderLayer(base, 'shadow', 'nonexistent' as RankLayerId, 'above');
    expect(r4).toEqual(base);
  });

  it('parses chat messages with player name and body cleanly, falling back safely on edge cases', () => {
    const std = simulateParseChatText('P0TAT0D0G: Hi, thanks for using my tools!');
    expect(std.playerName).toBe('P0TAT0D0G');
    expect(std.msgText).toBe(': Hi, thanks for using my tools!');

    const spaceColon = simulateParseChatText('Notch : GG everyone');
    expect(spaceColon.playerName).toBe('Notch');
    expect(spaceColon.msgText).toBe(': GG everyone');

    const noColon = simulateParseChatText('Steve');
    expect(noColon.playerName).toBe('Steve');
    expect(noColon.msgText).toBe('');

    const empty = simulateParseChatText('');
    expect(empty.playerName).toBe('P0TAT0D0G');
    expect(empty.msgText).toBe(': Hi, thanks for using my tools!');
  });

  it('synthesizes high-fidelity badges for all 4 procedural TAB player ranks', () => {
    const vip = synthesizeRankRgba(
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
    );
    expect(vip.width).toBeGreaterThan(16);
    expect(vip.height).toBeGreaterThan(6);
    expect(vip.rgba.length).toBe(vip.width * vip.height * 4);

    const mvp = synthesizeRankRgba(
      createDefaultRankComposer({
        text: 'MVP',
        fontSize: '3x5',
        textColor: '#f43f5e',
        shadowColor: '#4c0519',
        frameStyle: 'bevel',
        iconId: 'crown',
      }),
      { frame: true, icon: true, text: true, shadow: true, paint: false },
    );
    expect(mvp.width).toBeGreaterThan(16);
    expect(mvp.height).toBeGreaterThan(6);

    const mod = synthesizeRankRgba(
      createDefaultRankComposer({
        text: 'MOD',
        fontSize: '3x5',
        iconId: 'shield',
      }),
      { frame: true, icon: true, text: true, shadow: true, paint: false },
    );
    expect(mod.width).toBeGreaterThan(16);

    const pro = synthesizeRankRgba(
      createDefaultRankComposer({
        text: 'PRO',
        fontSize: '3x5',
        frameStyle: 'pill',
        iconId: 'gem',
      }),
      { frame: true, icon: true, text: true, shadow: true, paint: false },
    );
    expect(pro.width).toBeGreaterThan(16);
  });
});
