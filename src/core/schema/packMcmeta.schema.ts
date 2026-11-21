import { z } from 'zod';

/**
 * Zod schema for legacy pack.mcmeta format (Minecraft 1.21.1 and earlier).
 * Requires integer `pack_format`.
 */
export const LegacyMcmetaPackSchema = z.object({
  pack_format: z.number().int({ message: 'pack_format wajib berupa bilangan bulat.' }).min(1, { message: 'pack_format minimal 1.' }),
  description: z.union([
    z.string(),
    z.record(z.string(), z.unknown()),
    z.array(z.unknown()),
  ], { message: 'description wajib berupa string, objek teks komponen, atau array.' }),
  supported_formats: z.union([
    z.number().int(),
    z.tuple([z.number().int(), z.number().int()]),
    z.object({
      min_inclusive: z.number().int(),
      max_inclusive: z.number().int(),
    }),
  ]).optional(),
});

/**
 * Zod schema for modern era pack.mcmeta format (Minecraft 1.21.10+ / 26.x).
 * Uses min_format and max_format tuples [major, minor].
 */
export const ModernMcmetaPackSchema = z.object({
  min_format: z.tuple([z.number().int(), z.number().int()], {
    message: 'min_format wajib berupa tuple [major, minor] bilangan bulat.',
  }),
  max_format: z.tuple([z.number().int(), z.number().int()], {
    message: 'max_format wajib berupa tuple [major, minor] bilangan bulat.',
  }),
  description: z.union([
    z.string(),
    z.record(z.string(), z.unknown()),
    z.array(z.unknown()),
  ]),
});

/**
 * Root pack.mcmeta schema supporting both single pack_format and modern range formats.
 */
export const PackMcmetaRootSchema = z.object({
  pack: z.union([ModernMcmetaPackSchema, LegacyMcmetaPackSchema]),
});

export type LegacyMcmetaPack = z.infer<typeof LegacyMcmetaPackSchema>;
export type ModernMcmetaPack = z.infer<typeof ModernMcmetaPackSchema>;
export type PackMcmetaRoot = z.infer<typeof PackMcmetaRootSchema>;
