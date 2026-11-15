import crypto from 'node:crypto';
import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import {
  buildFontResourcePack,
  buildPluginDistributionZip,
  buildPluginYamlSnippets,
} from '../src/core/font/packBuilder.ts';
import { decodePngRgba } from '../src/core/font/pngCodec.ts';
import { createInitialFontProject } from '../src/core/font/presets.ts';
import { VERSION_PROFILES } from '../src/core/versions.ts';

describe('Font Pack Builder Round-Trip Export & Phase 1 Integration', () => {
  it('exports valid ZIP archives passing Phase 1 validator with 0 ERROR & 0 WARN for all 6 Java versions', async () => {
    const base = createInitialFontProject();

    for (const profile of VERSION_PROFILES) {
      const project = {
        ...base,
        targetVersion: profile.id,
      };
      const built = await buildFontResourcePack(project);

      expect(built.fontValidation.errors, `Font errors for ${profile.id}`).toBe(0);
      expect(
        built.zipValidation.summary.errors,
        `ZIP errors for ${profile.id}`,
      ).toBe(0);
      expect(
        built.zipValidation.summary.warns,
        `ZIP warns for ${profile.id}`,
      ).toBe(0);
      expect(built.zipValidation.compatibleVersions).toContain(profile.id);

      const nodeSha1 = crypto
        .createHash('sha1')
        .update(built.zipBytes)
        .digest('hex');
      expect(built.sha1Hex).toBe(nodeSha1);
      expect(built.sha1Hex).toMatch(/^[a-f0-9]{40}$/);

      // Inspect ZIP contents cleanly
      const zip = await JSZip.loadAsync(built.zipBytes);
      const fontJsonFile = zip.file('assets/mypack/font/default.json');
      expect(fontJsonFile).not.toBeNull();
      const parsedFont = JSON.parse(await fontJsonFile!.async('string')) as {
        providers: Array<{ type: string; file?: string; advances?: Record<string, number> }>;
      };
      expect(parsedFont.providers.some((p) => p.type === 'bitmap')).toBe(true);
      expect(parsedFont.providers.some((p) => p.type === 'space')).toBe(true);

      // Verify generated rank PNGs inside ZIP decode cleanly
      for (const slug of ['admin', 'vip', 'mod', 'crystal', 'ace', 'glorious', 'conqueror']) {
        const rankPng = zip.file(`assets/mypack/textures/font/rank_${slug}.png`);
        expect(rankPng, `Missing rank_${slug}.png`).not.toBeNull();
        const decoded = await decodePngRgba(await rankPng!.async('uint8array'));
        expect(decoded.ok).toBe(true);
      }
    }
  });

  it('generates LuckPerms, PlaceholderAPI, /tellraw, and optional object component snippets', async () => {
    const base = createInitialFontProject();
    const built = await buildFontResourcePack({
      ...base,
      targetVersion: '26.3',
      objectComponent: {
        enabled: true,
        mode: 'player',
        atlas: 'minecraft:items',
        sprite: 'minecraft:item/diamond',
        playerName: 'BuilderID',
        hat: true,
      },
    });

    expect(built.snippets.luckPermsCommand).toContain('/lp group admin meta setprefix 100');
    expect(built.snippets.placeholderApi).toContain('%luckperms_prefix%');
    expect(built.snippets.placeholderApi).toContain('mypack:default');
    expect(built.snippets.placeholderApi).not.toContain('pakai font');
    expect(built.snippets.tellrawCommand).toContain('/tellraw @a');
    expect(built.snippets.tellrawCommand).toContain('\\uE200');
    expect(built.snippets.objectTellrawCommand).toContain('"type":"object"');
    expect(built.snippets.objectTellrawCommand).toContain('BuilderID');

    // fontName with accidental .json suffix normalizes cleanly without .json.json
    const normalized = await buildFontResourcePack({
      ...base,
      fontName: 'ranks.json',
    });
    const zip = await JSZip.loadAsync(normalized.zipBytes);
    expect(zip.file('assets/mypack/font/ranks.json')).not.toBeNull();
    expect(zip.file('assets/mypack/font/ranks.json.json')).toBeNull();
  });

  it('generates ItemsAdder, Oraxen, and Nexo YAML snippets plus multi-plugin distribution ZIP bundle', async () => {
    const base = createInitialFontProject();
    const yaml = buildPluginYamlSnippets(base);

    expect(yaml.itemsAdderYaml).toContain('namespace: mypack');
    expect(yaml.itemsAdderYaml).toContain('path: "font/rank_admin.png"');
    expect(yaml.itemsAdderYaml).toContain('symbol: "\\uE200"');
    expect(yaml.itemsAdderYaml).toContain('scale_ratio: 9');
    expect(yaml.itemsAdderYaml).toContain('y_position: 8');

    expect(yaml.oraxenYaml).toContain('texture: font/rank_admin');
    expect(yaml.oraxenYaml).not.toContain('texture: font/rank_admin.png');
    expect(yaml.oraxenYaml).toContain('- ":mypack_admin:"');

    expect(yaml.nexoYaml).toContain('texture: mypack:font/rank_admin.png');
    expect(yaml.nexoYaml).toContain('ascent: 8');
    expect(yaml.nexoYaml).toContain('height: 9');

    const bundle = await buildPluginDistributionZip(base);
    expect(bundle.fileName).toBe('mypack-plugins-bundle-26.3.zip');

    const bundleZip = await JSZip.loadAsync(bundle.zipBytes);
    expect(
      bundleZip.file('Vanilla-dan-Nexo-ExternalPack/mypack-font-26.3.zip'),
    ).not.toBeNull();
    expect(
      bundleZip.file('ItemsAdder/data/items_packs/mypack/default.yml'),
    ).not.toBeNull();
    expect(
      bundleZip.file('ItemsAdder/data/resource_pack/assets/mypack/textures/font/rank_admin.png'),
    ).not.toBeNull();
    expect(bundleZip.file('Oraxen/glyphs/mypack_default.yml')).not.toBeNull();
    expect(bundleZip.file('Oraxen/pack/textures/font/rank_admin.png')).not.toBeNull();
    expect(bundleZip.file('Nexo/glyphs/mypack_default.yml')).not.toBeNull();
    expect(
      bundleZip.file('Nexo/pack/assets/mypack/textures/font/rank_admin.png'),
    ).not.toBeNull();
    expect(bundleZip.file('PANDUAN-PASANG.txt')).not.toBeNull();
  });
});
