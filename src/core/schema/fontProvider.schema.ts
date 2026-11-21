import { z } from 'zod';

/**
 * Validates namespaced resource location pattern (namespace:path).
 * Allowed characters: lowercase letters, numbers, underscores, dots, hyphens, and forward slashes.
 */
export const NamespacedIdSchema = z.string().regex(
  /^[a-z0-9_.-]+:[a-z0-9_./-]+$/,
  { message: 'Format berkas wajib berupa nama ber-namespace valid (contoh: "mypack:font/rank.png").' }
);

/**
 * Zod schema for Minecraft bitmap font provider definition.
 * Reference: docs/knowledge/02-font-provider-dan-kompresi.md §1
 */
export const BitmapFontProviderSchema = z.object({
  type: z.literal('bitmap', {
    message: 'type provider wajib bernilai "bitmap".',
  }),
  file: NamespacedIdSchema,
  ascent: z.number().int({ message: 'ascent wajib berupa bilangan bulat.' }),
  height: z.number().int({ message: 'height wajib berupa bilangan bulat.' }).positive({
    message: 'height wajib bernilai positif (>= 1). Nilai <= 0 memicu crash client Minecraft.',
  }),
  chars: z.array(z.string().min(1, { message: 'Karakter baris tidak boleh kosong.' }), {
    message: 'chars wajib berupa array string baris karakter glif.',
  }).min(1, { message: 'Array chars minimal memiliki 1 elemen baris.' }),
});

/**
 * Root font definition file (assets/<namespace>/font/*.json) schema.
 */
export const FontDefinitionFileSchema = z.object({
  providers: z.array(BitmapFontProviderSchema, {
    message: 'providers wajib berupa array penyedia font.',
  }).min(1, { message: 'Array providers wajib memuat minimal 1 provider.' }),
});

export type BitmapFontProvider = z.infer<typeof BitmapFontProviderSchema>;
export type FontDefinitionFile = z.infer<typeof FontDefinitionFileSchema>;
