/**
 * Content hashing utilities for analytics
 * Uses browser-native SubtleCrypto API for SHA-256 hashing
 */

/**
 * Generate SHA-256 hash for perfect match tracking
 * Combines ruleId + poem text for unique content identification
 *
 * @param ruleId - Rule identifier (e.g., "anu-001")
 * @param poemText - Raw poem text from editor
 * @returns Promise<string> - Hex-encoded SHA-256 hash (64 characters)
 */
export async function generateContentHash(ruleId: string, poemText: string): Promise<string> {
  // Normalize input: trim whitespace, normalize Unicode
  const normalizedPoem = poemText.trim().normalize('NFC');

  // Combine rule ID and poem text with separator
  const input = `${ruleId}|${normalizedPoem}`;

  // Encode string to Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  // Hash using SubtleCrypto (browser-native)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex; // 64-character hex string
}

/**
 * Generate short hash (first 16 hex chars = 64 bits)
 * Used for compact analytics event parameters
 *
 * @param ruleId - Rule identifier
 * @param poemText - Raw poem text
 * @returns Promise<string> - Short hash (16 characters)
 */
export async function generateShortHash(ruleId: string, poemText: string): Promise<string> {
  const fullHash = await generateContentHash(ruleId, poemText);
  return fullHash.substring(0, 16); // First 64 bits
}
