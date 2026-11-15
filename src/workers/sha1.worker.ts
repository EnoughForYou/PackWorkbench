import {
  createIncrementalSha1,
  DEFAULT_SHA1_CHUNK_BYTES,
} from '../core/sha1Stream.ts';

export interface Sha1WorkerRequest {
  readonly type: 'hash';
  readonly jobId: number;
  readonly file: Blob;
  readonly chunkSize?: number;
}

export type Sha1WorkerResponse =
  | {
      readonly type: 'progress';
      readonly jobId: number;
      readonly bytesRead: number;
      readonly totalBytes: number;
      readonly ratio: number;
    }
  | {
      readonly type: 'done';
      readonly jobId: number;
      readonly sha1Hex: string;
    }
  | {
      readonly type: 'error';
      readonly jobId: number;
      readonly message: string;
    };

let activeJobId = 0;

self.addEventListener('message', (event: MessageEvent<Sha1WorkerRequest>) => {
  const payload = event.data;
  if (!payload || payload.type !== 'hash') {
    return;
  }

  activeJobId = payload.jobId;
  void processHashJob(payload);
});

async function processHashJob(request: Sha1WorkerRequest): Promise<void> {
  const { jobId, file } = request;
  const chunkSize = request.chunkSize ?? DEFAULT_SHA1_CHUNK_BYTES;
  const totalBytes = file.size;

  try {
    const hasher = createIncrementalSha1();

    if (totalBytes === 0) {
      self.postMessage({
        type: 'progress',
        jobId,
        bytesRead: 0,
        totalBytes: 0,
        ratio: 1,
      } satisfies Sha1WorkerResponse);
      self.postMessage({
        type: 'done',
        jobId,
        sha1Hex: hasher.digestHex(),
      } satisfies Sha1WorkerResponse);
      return;
    }

    for (let offset = 0; offset < totalBytes; offset += chunkSize) {
      if (jobId !== activeJobId) {
        return; // Superseded by a newer file selection
      }
      const end = Math.min(offset + chunkSize, totalBytes);
      const buffer = await file.slice(offset, end).arrayBuffer();
      if (jobId !== activeJobId) {
        return;
      }
      hasher.update(new Uint8Array(buffer));
      self.postMessage({
        type: 'progress',
        jobId,
        bytesRead: end,
        totalBytes,
        ratio: end / totalBytes,
      } satisfies Sha1WorkerResponse);
    }

    if (jobId !== activeJobId) {
      return;
    }

    self.postMessage({
      type: 'done',
      jobId,
      sha1Hex: hasher.digestHex(),
    } satisfies Sha1WorkerResponse);
  } catch (err) {
    if (jobId !== activeJobId) {
      return;
    }
    const detail = err instanceof Error ? err.message : String(err);
    self.postMessage({
      type: 'error',
      jobId,
      message: detail,
    } satisfies Sha1WorkerResponse);
  }
}
