/**
 * Formats byte count into human-readable string (e.g. 5.42 MB, 947 KB, 120 B)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);

  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(dm))} ${sizes[idx]}`;
}

/**
 * Converts megabytes to kilobytes
 */
export function mbToKb(mb: number): number {
  return Math.round(mb * 1024);
}

/**
 * Converts kilobytes to bytes
 */
export function kbToBytes(kb: number): number {
  return Math.round(kb * 1024);
}

/**
 * Calculates reduction percentage between original and processed sizes
 */
export function calculateReductionPercentage(originalSize: number, processedSize: number): number {
  if (originalSize <= 0) return 0;
  const reduction = ((originalSize - processedSize) / originalSize) * 100;
  return Math.max(0, Math.min(99.9, parseFloat(reduction.toFixed(1))));
}
