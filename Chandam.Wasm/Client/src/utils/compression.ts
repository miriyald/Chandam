/**
 * Browser-native gzip compression/decompression for IndexedDB storage.
 * Uses CompressionStream/DecompressionStream APIs.
 */

export async function compressToGzip(text: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const stream = new Blob([encoder.encode(text)]).stream();
  const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
  const reader = compressedStream.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalBytes += value.length;
  }

  const result = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

export async function decompressFromGzip(compressed: Uint8Array): Promise<string> {
  const stream = new Blob([new Uint8Array(compressed) as unknown as BlobPart]).stream();
  const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
  const reader = decompressedStream.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalBytes += value.length;
  }

  const allBytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    allBytes.set(chunk, offset);
    offset += chunk.length;
  }

  return new TextDecoder('utf-8').decode(allBytes);
}
