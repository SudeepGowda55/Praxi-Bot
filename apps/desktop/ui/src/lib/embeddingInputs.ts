export const MIN_EMBEDDING_INT = 1;
export const MAX_EMBEDDING_DIMENSIONS = 4096;

/** Parse a positive integer typed by the user (digits only, >= 1, optionally <= max). */
export function parsePositiveInt(raw: string, max?: number): number | null {
  const text = raw.trim();
  if (!/^\d+$/.test(text)) {
    return null;
  }
  const value = Number(text);
  if (!Number.isSafeInteger(value) || value < MIN_EMBEDDING_INT) {
    return null;
  }
  if (max !== undefined && value > max) {
    return null;
  }
  return value;
}
