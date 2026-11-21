import { z } from 'zod';

export const FrameStyleSchema = z.enum([
  'bevel',
  'outline',
  'pill',
  'solid',
  'ribbon',
  'none',
]);

export const RankFontSizeSchema = z.enum(['3x5', '5x5']);

export const RankComposerSchema = z.object({
  text: z.string().default(''),
  fontSize: RankFontSizeSchema.default('5x5'),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#ffffff'),
  shadowEnabled: z.boolean().default(true),
  shadowColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#3f3f3f'),
  shadowOffsetX: z.number().int().default(1),
  shadowOffsetY: z.number().int().default(1),
  iconId: z.string().default('shield'),
  iconColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#9b73be'),
  frameStyle: FrameStyleSchema.default('bevel'),
  frameColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#1e1f29'),
  frameBorderColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#9b73be'),
  paddingX: z.number().int().min(0).default(3),
  paddingY: z.number().int().min(0).default(2),
  iconGap: z.number().int().min(0).default(3),
});

export const StudioEntryExportSchema = z.object({
  id: z.string(),
  name: z.string(),
  codepoint: z.string().regex(/^U\+[0-9a-fA-F]{4,6}$/),
  advance: z.number().int(),
  ascent: z.number().int(),
  height: z.number().int().positive(),
  composer: RankComposerSchema,
});

export const StudioProjectExportSchema = z.object({
  version: z.literal(1),
  name: z.string().min(1).default('My Minecraft Rank Pack'),
  description: z.string().default('Resource pack dibuat dengan Pack Workbench'),
  targetVersion: z.enum([
    '1.21.1',
    '1.21.2',
    '1.21.4',
    '1.21.5',
    '1.21.6',
    '1.21.8',
    '1.21.9',
    '1.21.10',
    '1.21.11',
    '26.1.2',
    '26.2',
    '26.3',
  ]),
  namespace: z.string().regex(/^[a-z0-9_.-]+$/).default('mypack'),
  entries: z.array(StudioEntryExportSchema),
  prefixSequenceIds: z.array(z.string()).default([]),
});

export type StudioProjectExport = z.infer<typeof StudioProjectExportSchema>;
export type StudioEntryExport = z.infer<typeof StudioEntryExportSchema>;
