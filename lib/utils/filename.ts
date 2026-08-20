/**
 * Generates an optimized output filename based on original name, background removal state, and target format
 */
export function generateOutputFilename(
  originalName: string,
  outputFormat: string,
  bgRemoved: boolean
): string {
  // Strip extension
  const lastDotIndex = originalName.lastIndexOf('.');
  const baseName = lastDotIndex > 0 ? originalName.substring(0, lastDotIndex) : originalName;
  
  // Sanitize base name (alphanumeric, hyphens, underscores)
  const sanitized = baseName
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'image';

  const suffix = bgRemoved ? '-no-background' : '-optimized';
  const extension = outputFormat.toLowerCase() === 'jpeg' ? 'jpg' : outputFormat.toLowerCase();

  return `${sanitized}${suffix}.${extension}`;
}
