import sharp from 'sharp';
import { ImageFormat, ProcessingOptions } from '@/types/image';
import { calculateTargetDimensions } from './resize';
import { calculateQualityMetrics } from '../utils/quality';

export interface OptimizationResult {
  buffer: Buffer;
  finalSize: number;
  finalWidth: number;
  finalHeight: number;
  format: string;
  mimeType: string;
  compressionQuality: number;
  qualityMetrics: ReturnType<typeof calculateQualityMetrics>;
}

/**
 * Intelligent Smart Compression & Binary-Search Target-Size Optimizer
 */
export async function optimizeImageToTarget(
  inputBuffer: Buffer,
  originalWidth: number,
  originalHeight: number,
  originalSize: number,
  options: ProcessingOptions,
  hasAlpha: boolean = false
): Promise<OptimizationResult> {
  const targetSizeBytes = options.targetSizeKB * 1024;

  // 1. Determine Output Format
  let targetFormat = options.outputFormat;
  if (targetFormat === 'auto') {
    // WebP default (supports alpha and offers best quality/size ratio)
    targetFormat = 'webp';
  }

  // Ensure format handles transparency if image has alpha or bg removed
  if (hasAlpha && targetFormat === 'jpeg') {
    // JPEG doesn't support alpha transparency; fall back to WebP to maintain visual integrity
    targetFormat = 'webp';
  }

  // 2. Initial Dimension Calculation
  const initialDims = calculateTargetDimensions(originalWidth, originalHeight, options.resize);
  let currentWidth = initialDims.targetWidth;
  let currentHeight = initialDims.targetHeight;

  let bestBuffer: Buffer | null = null;
  let bestSize = Infinity;
  let bestQuality = 80;
  let bestWidth = currentWidth;
  let bestHeight = currentHeight;

  // Outer loop: Dimension scaling (if quality alone cannot hit target size)
  let dimensionAttempts = 0;
  const maxDimensionAttempts = 6;

  while (dimensionAttempts < maxDimensionAttempts) {
    // Binary Search on Compression Quality Q in range [15, 95]
    let lowQ = 15;
    let highQ = 95;
    let optimalQForDims = highQ;
    let lastBufferForDims: Buffer | null = null;
    let lastSizeForDims = Infinity;

    for (let step = 0; step < 7; step++) {
      const midQ = Math.round((lowQ + highQ) / 2);
      const testBuffer = await encodeImage(inputBuffer, targetFormat, midQ, currentWidth, currentHeight, options.rotation);
      const testSize = testBuffer.length;

      if (testSize <= targetSizeBytes) {
        // Size fits target! Store candidate and try finding higher quality
        lastBufferForDims = testBuffer;
        lastSizeForDims = testSize;
        optimalQForDims = midQ;

        if (testSize < bestSize || (testSize <= targetSizeBytes && midQ > bestQuality)) {
          bestBuffer = testBuffer;
          bestSize = testSize;
          bestQuality = midQ;
          bestWidth = currentWidth;
          bestHeight = currentHeight;
        }

        lowQ = midQ + 1; // Try higher quality
      } else {
        // Size exceeds target. Try lower quality
        highQ = midQ - 1;
      }
    }

    // Check if we found a valid encoding within target size at current dimensions
    if (bestBuffer && bestSize <= targetSizeBytes) {
      break; // Successfully optimized within target!
    }

    // If even lowest quality (Q=15) exceeds target size, reduce dimensions by 12%
    dimensionAttempts++;
    currentWidth = Math.max(50, Math.round(currentWidth * 0.88));
    currentHeight = Math.max(50, Math.round(currentHeight * 0.88));
  }

  // Fallback: If target size is extremely small (e.g. 50 KB on a huge photo), return best available compression
  if (!bestBuffer) {
    bestQuality = 30;
    bestBuffer = Buffer.from(await encodeImage(inputBuffer, targetFormat, bestQuality, currentWidth, currentHeight, options.rotation));
    bestSize = bestBuffer.length;
    bestWidth = currentWidth;
    bestHeight = currentHeight;
  }

  // Calculate MIME type
  const mimeTypeMap: Record<string, string> = {
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };
  const mimeType = mimeTypeMap[targetFormat.toLowerCase()] || 'image/webp';

  // Calculate honest visual quality metrics
  const metrics = calculateQualityMetrics({
    originalSize,
    processedSize: bestSize,
    originalWidth,
    originalHeight,
    processedWidth: bestWidth,
    processedHeight: bestHeight,
    compressionQuality: bestQuality,
    outputFormat: targetFormat,
  });

  return {
    buffer: bestBuffer,
    finalSize: bestSize,
    finalWidth: bestWidth,
    finalHeight: bestHeight,
    format: targetFormat,
    mimeType,
    compressionQuality: bestQuality,
    qualityMetrics: metrics,
  };
}

/**
 * Encodes sharp image pipeline to specified format, quality, and dimensions
 */
async function encodeImage(
  buffer: Buffer,
  format: string,
  quality: number,
  width: number,
  height: number,
  rotationAngle?: number
): Promise<Buffer> {
  // Apply auto-rotation based on EXIF tag or custom user angle (90, 180, 270)
  let pipeline = sharp(buffer);
  if (rotationAngle && rotationAngle !== 0) {
    pipeline = pipeline.rotate(rotationAngle);
  } else {
    pipeline = pipeline.rotate(); // Auto EXIF orientation correction
  }

  pipeline = pipeline.resize(width, height, {
    fit: 'inside',
    withoutEnlargement: true,
  });

  const fmt = format.toLowerCase();

  switch (fmt) {
    case 'jpeg':
    case 'jpg':
      return await pipeline
        .jpeg({
          quality,
          progressive: true,
          mozjpeg: true,
        })
        .toBuffer();

    case 'png':
      // PNG uses compression level (0-9). Map quality (10-100) to compression level & palette quantization
      const compressionLevel = Math.min(9, Math.max(1, Math.round(9 - (quality / 100) * 8)));
      return await pipeline
        .png({
          compressionLevel,
          palette: quality < 80,
          quality,
        })
        .toBuffer();

    case 'webp':
    default:
      return await pipeline
        .webp({
          quality,
          effort: 4,
          smartSubsample: true,
        })
        .toBuffer();
  }
}
