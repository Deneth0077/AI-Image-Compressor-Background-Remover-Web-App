import { QualityMetrics, QualityLabel } from '@/types/image';

interface QualityParams {
  originalSize: number;
  processedSize: number;
  originalWidth: number;
  originalHeight: number;
  processedWidth: number;
  processedHeight: number;
  compressionQuality: number; // 0-100 quality setting used
  outputFormat: string;
}

export function calculateQualityMetrics({
  originalSize,
  processedSize,
  originalWidth,
  originalHeight,
  processedWidth,
  processedHeight,
  compressionQuality,
  outputFormat,
}: QualityParams): QualityMetrics {
  const reductionPercentage = Math.max(
    0,
    parseFloat((((originalSize - processedSize) / originalSize) * 100).toFixed(1))
  );

  const savedBytes = Math.max(0, originalSize - processedSize);
  const compressionRatio = originalSize > 0 ? processedSize / originalSize : 1;

  // Calculate resolution retention percentage
  const origPixels = originalWidth * originalHeight;
  const procPixels = processedWidth * processedHeight;
  const resolutionRatio = origPixels > 0 ? procPixels / origPixels : 1;

  // Composite visual score metric (0 - 100)
  // Higher weight on resolution preservation and encoder quality factor
  let score = Math.round(
    compressionQuality * 0.55 + resolutionRatio * 100 * 0.35 + Math.min(100, (1 / (compressionRatio + 0.1)) * 10) * 0.1
  );

  score = Math.max(15, Math.min(100, score));

  let label: QualityLabel = 'Medium';
  let explanation = '';

  if (score >= 88) {
    label = 'Excellent';
    explanation = 'Full visual sharpness preserved with optimal encoding efficiency.';
  } else if (score >= 74) {
    label = 'Very Good';
    explanation = 'High fidelity maintained with virtually imperceptible detail compression.';
  } else if (score >= 60) {
    label = 'Good';
    explanation = 'Balanced compression maintaining clear subject detail for web display.';
  } else {
    label = 'Medium';
    explanation = 'Strong file size reduction applied with moderate compromise on finer textures.';
  }

  const isLossless = outputFormat.toLowerCase() === 'png' && compressionQuality === 100 && resolutionRatio === 1;

  return {
    score,
    label,
    reductionPercentage,
    savedBytes,
    compressionRatio,
    isLossless,
    explanation,
  };
}
