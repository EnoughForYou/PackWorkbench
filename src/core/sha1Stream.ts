import { sha1 } from '@noble/hashes/legacy';
import { bytesToHex } from '@noble/hashes/utils';

export const DEFAULT_SHA1_CHUNK_BYTES = 4 * 1024 * 1024; // 4 MiB

export interface IncrementalSha1 {
  update(chunk: Uint8Array): void;
  digestHex(): string;
}

/**
 * Creates a streaming SHA-1 instance backed by @noble/hashes/legacy
 * so arbitrarily large files can be hashed chunk-by-chunk without holding
 * the entire file buffer in memory.
 */
export function createIncrementalSha1(): IncrementalSha1 {
  const hasher = sha1.create();
  return {
    update(chunk: Uint8Array): void {
      hasher.update(chunk);
    },
    digestHex(): string {
      return bytesToHex(hasher.digest());
    },
  };
}

/**
 * Computes SHA-1 across a Uint8Array in slices (useful for Node/unit verification).
 */
export function computeSha1ChunkedHex(
  data: Uint8Array,
  chunkSize = DEFAULT_SHA1_CHUNK_BYTES,
  onProgress?: (ratio: number) => void,
): string {
  const hasher = createIncrementalSha1();
  const total = data.byteLength;
  if (total === 0) {
    onProgress?.(1);
    return hasher.digestHex();
  }

  for (let offset = 0; offset < total; offset += chunkSize) {
    const end = Math.min(offset + chunkSize, total);
    hasher.update(data.subarray(offset, end));
    onProgress?.(end / total);
  }

  return hasher.digestHex();
}
