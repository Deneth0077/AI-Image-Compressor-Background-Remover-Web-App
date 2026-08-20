export type ImageFormat = 'auto' | 'jpeg' | 'png' | 'webp';

export type TargetPreset = '100KB' | '250KB' | '500KB' | '750KB' | '1MB' | '2MB' | 'custom';

export type ResizeMode = 'original' | '75' | '50' | '25' | 'custom';

export type BackgroundType = 'transparent' | 'white' | 'black' | 'custom';

export interface ResizeOptions {
  mode: ResizeMode;
  customWidth?: number;
  customHeight?: number;
  lockAspectRatio: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

export interface ProcessingOptions {
  targetSizeKB: number;
  outputFormat: ImageFormat;
  removeBackground: boolean;
  backgroundType: BackgroundType;
  customBackgroundColor?: string; // Hex color string (e.g. #FF5733)
  resize: ResizeOptions;
  rotation?: number; // 0, 90, 180, 270 degrees
}

export interface BatchImageItem {
  id: string;
  file: File;
  originalUrl: string;
  originalMeta: ImageMetadata;
  rotation: number; // 0, 90, 180, 270 degrees
  status: 'idle' | 'processing' | 'complete' | 'error';
  errorMessage?: string;
  result?: ProcessedImageResult;
}

export interface ImageMetadata {
  name: string;
  size: number; // in bytes
  width: number;
  height: number;
  mimeType: string;
  format: string;
}

export type QualityLabel = 'Excellent' | 'Very Good' | 'Good' | 'Medium';

export interface QualityMetrics {
  score: number; // 0 - 100
  label: QualityLabel;
  reductionPercentage: number;
  savedBytes: number;
  compressionRatio: number;
  isLossless: boolean;
  explanation: string;
}

export interface ProcessedImageResult {
  id: string;
  original: ImageMetadata;
  originalDataUrl: string;
  processedDataUrl: string;
  processedBuffer?: Buffer;
  processedSize: number;
  processedWidth: number;
  processedHeight: number;
  processedFormat: string;
  mimeType: string;
  quality: QualityMetrics;
  backgroundRemoved: boolean;
  processingTimeMs: number;
}
