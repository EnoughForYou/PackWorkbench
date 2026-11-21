import { describe, expect, it } from 'vitest';
import {
  BitmapFontProviderSchema,
  FontDefinitionFileSchema,
  LegacyMcmetaPackSchema,
  ModernMcmetaPackSchema,
  PackMcmetaRootSchema,
  ServerPropertiesPackSchema,
  StudioProjectExportSchema,
} from '../src/core/schema/index.ts';

describe('Zod Schema Validations - Minecraft Resource Pack Specifications', () => {
  describe('pack.mcmeta validation', () => {
    it('accepts valid legacy format 34 (Java 1.21.1)', () => {
      const parsed = PackMcmetaRootSchema.safeParse({
        pack: {
          pack_format: 34,
          description: 'Custom Rank Pack',
        },
      });
      expect(parsed.success).toBe(true);
    });

    it('accepts valid modern range format [97, 1] (Java 26.3)', () => {
      const parsed = PackMcmetaRootSchema.safeParse({
        pack: {
          min_format: [97, 1],
          max_format: [97, 1],
          description: 'Wilderness Bound Rank Pack',
        },
      });
      expect(parsed.success).toBe(true);
    });

    it('rejects invalid pack_format float or non-integer', () => {
      const parsed = LegacyMcmetaPackSchema.safeParse({
        pack_format: 34.5,
        description: 'Test pack',
      });
      expect(parsed.success).toBe(false);
    });

    it('rejects modern format missing minor version in tuple', () => {
      const parsed = ModernMcmetaPackSchema.safeParse({
        min_format: [97],
        max_format: [97, 1],
        description: 'Test pack',
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe('bitmap font provider validation', () => {
    it('accepts valid bitmap provider JSON', () => {
      const parsed = BitmapFontProviderSchema.safeParse({
        type: 'bitmap',
        file: 'mypack:font/admin.png',
        ascent: 8,
        height: 9,
        chars: ['\uE200'],
      });
      expect(parsed.success).toBe(true);
    });

    it('rejects non-positive height (<= 0) which causes client crash', () => {
      const parsed = BitmapFontProviderSchema.safeParse({
        type: 'bitmap',
        file: 'mypack:font/admin.png',
        ascent: 8,
        height: 0,
        chars: ['\uE200'],
      });
      expect(parsed.success).toBe(false);
    });

    it('rejects invalid namespace character (uppercase or spaces)', () => {
      const parsed = BitmapFontProviderSchema.safeParse({
        type: 'bitmap',
        file: 'MyPack:Font/Admin.png',
        ascent: 8,
        height: 9,
        chars: ['\uE200'],
      });
      expect(parsed.success).toBe(false);
    });

    it('validates font definition file array of providers', () => {
      const parsed = FontDefinitionFileSchema.safeParse({
        providers: [
          {
            type: 'bitmap',
            file: 'mypack:font/admin.png',
            ascent: 8,
            height: 9,
            chars: ['\uE200'],
          },
        ],
      });
      expect(parsed.success).toBe(true);
    });
  });

  describe('server.properties resource-pack validation', () => {
    it('accepts valid URL and 40-character lowercase hex SHA-1', () => {
      const parsed = ServerPropertiesPackSchema.safeParse({
        resourcePackUrl: 'https://example.com/pack.zip',
        resourcePackSha1: 'da39a3ee5e6b4b0d3255bfef95601890afd80709',
        required: true,
      });
      expect(parsed.success).toBe(true);
    });

    it('rejects invalid SHA-1 hash (uppercase or non-40 hex)', () => {
      const parsed = ServerPropertiesPackSchema.safeParse({
        resourcePackUrl: 'https://example.com/pack.zip',
        resourcePackSha1: 'INVALID-SHA1',
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe('studio project export schema validation', () => {
    it('validates complete studio project structure', () => {
      const parsed = StudioProjectExportSchema.safeParse({
        version: 1,
        name: 'VIP Pack',
        description: 'Resource pack with VIP rank',
        targetVersion: '1.21.1',
        namespace: 'vippack',
        entries: [
          {
            id: 'rank-vip',
            name: 'VIP',
            codepoint: 'U+E201',
            advance: 26,
            ascent: 8,
            height: 9,
            composer: {
              text: 'VIP',
              fontSize: '5x5',
              textColor: '#fbbf24',
              shadowEnabled: true,
              shadowColor: '#3f3f3f',
              shadowOffsetX: 1,
              shadowOffsetY: 1,
              iconId: 'crown',
              iconColor: '#fbbf24',
              frameStyle: 'outline',
              frameColor: '#1a150b',
              frameBorderColor: '#f59e0b',
              paddingX: 3,
              paddingY: 2,
              iconGap: 3,
            },
          },
        ],
        prefixSequenceIds: ['rank-vip'],
      });
      expect(parsed.success).toBe(true);
    });
  });
});
