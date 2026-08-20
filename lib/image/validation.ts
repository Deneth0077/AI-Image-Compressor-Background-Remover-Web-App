import sharp from 'sharp';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  metadata?: {
    format: string;
    width: number;
    height: number;
    space: string;
    channels: number;
    hasAlpha: boolean;
    size: number;
  };
}

const DEFAULT_MAX_MB = 25;

export function getMaxUploadSizeMB(): number {
  const envVal = process.env.MAX_UPLOAD_SIZE_MB;
  if (envVal && !isNaN(Number(envVal))) {
    return Number(envVal);
  }
  return DEFAULT_MAX_MB;
}

/**
 * Validates file buffer header magic bytes and metadata using Sharp
 */
export async function validateImageBuffer(buffer: Buffer): Promise<ValidationResult> {
  const maxBytes = getMaxUploadSizeMB() * 1024 * 1024;

  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Empty file provided. Please upload a valid image file.' };
  }

  if (buffer.length > maxBytes) {
    return {
      valid: false,
      error: `File size (${(buffer.length / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed upload limit of ${getMaxUploadSizeMB()} MB.`,
    };
  }

  // Magic bytes check
  const header = buffer.slice(0, 12);
  const isPng = header.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpeg = header.slice(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  const isGif = header.slice(0, 4).toString('ascii').startsWith('GIF8');
  const isWebp = header.slice(0, 4).toString('ascii') === 'RIFF' && header.slice(8, 12).toString('ascii') === 'WEBP';
  const isHeif = header.slice(4, 12).toString('ascii').includes('ftypheic') || header.slice(4, 12).toString('ascii').includes('ftypmif1');

  if (!isPng && !isJpeg && !isGif && !isWebp && !isHeif) {
    // Try sharp format probe in case header differs
    try {
      const probeMeta = await sharp(buffer).metadata();
      if (!probeMeta.format) {
        return {
          valid: false,
          error: 'We couldn’t process this file format. Please upload a JPG, PNG, WebP, GIF, or HEIC image.',
        };
      }
    } catch {
      return {
        valid: false,
        error: 'Unsupported or corrupted image file. Please try another JPG, PNG, or WebP file.',
      };
    }
  }

  try {
    const meta = await sharp(buffer).metadata();

    if (!meta.width || !meta.height) {
      return { valid: false, error: 'Corrupted image file with missing dimension metadata.' };
    }

    if (meta.width > 20000 || meta.height > 20000) {
      return { valid: false, error: 'Image dimensions are exceptionally large (max 20,000 x 20,000 px supported).' };
    }

    return {
      valid: true,
      metadata: {
        format: meta.format || 'unknown',
        width: meta.width,
        height: meta.height,
        space: meta.space || 'srgb',
        channels: meta.channels || 3,
        hasAlpha: Boolean(meta.hasAlpha),
        size: buffer.length,
      },
    };
  } catch (err) {
    return {
      valid: false,
      error: 'We couldn’t process this image. The file may be damaged or corrupted.',
    };
  }
}
