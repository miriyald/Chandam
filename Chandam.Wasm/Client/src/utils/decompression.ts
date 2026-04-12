/**
 * Browser-native decompression utilities using DecompressionStream API
 * Supports gzip and deflate formats (widely supported in all modern browsers)
 */

/**
 * Decompress a gzip file using browser's native DecompressionStream API
 * @param url - URL of the .gz file to decompress
 * @returns Promise<string> - Decompressed text content
 */
export async function decompressGzip(url: string): Promise<string> {
  try {
    console.log(`Decompression: Fetching ${url}`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get compressed bytes as ReadableStream
    const compressedStream = response.body;

    if (!compressedStream) {
      throw new Error('Response body is null');
    }

    // Use browser's native Gzip decompression
    const decompressedStream = compressedStream.pipeThrough(
      new DecompressionStream('gzip')
    );

    // Read decompressed data
    const reader = decompressedStream.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalBytes += value.length;
    }

    // Combine chunks and decode as UTF-8 text
    const allBytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      allBytes.set(chunk, offset);
      offset += chunk.length;
    }

    const text = new TextDecoder('utf-8').decode(allBytes);
    console.log(`Decompression: ${url} → ${text.length} chars (${totalBytes} bytes)`);
    return text;
  } catch (error) {
    console.error('Decompression failed:', error);
    throw error;
  }
}

/**
 * Export for C# JS Interop
 * Called from WasmRuleLoaderService via JSRuntime.InvokeAsync
 */
if (typeof window !== 'undefined') {
  (window as any).decompressGzip = decompressGzip;
}
