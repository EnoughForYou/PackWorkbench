import { z } from 'zod';

/**
 * Zod schema for server.properties resource pack configuration snippet.
 * Validates direct URL or file path and strict 40-character lowercase SHA-1 checksum.
 */
export const ServerPropertiesPackSchema = z.object({
  resourcePackUrl: z.string().min(1, { message: 'URL atau path resource-pack tidak boleh kosong.' }),
  resourcePackSha1: z.string().regex(
    /^[0-9a-f]{40}$/,
    { message: 'resource-pack-sha1 wajib berupa string heksadesimal 40 karakter huruf kecil.' }
  ),
  required: z.boolean().default(false),
  prompt: z.string().optional(),
});

export type ServerPropertiesPack = z.infer<typeof ServerPropertiesPackSchema>;
