import { ResizeOptions } from '@/types/image';

export interface CalculatedDimensions {
  targetWidth: number;
  targetHeight: number;
  scaleFactor: number;
}

export function calculateTargetDimensions(
  originalWidth: number,
  originalHeight: number,
  options: ResizeOptions
): CalculatedDimensions {
  if (!originalWidth || !originalHeight) {
    return { targetWidth: 800, targetHeight: 600, scaleFactor: 1 };
  }

  const { mode, customWidth, customHeight, lockAspectRatio, maxWidth, maxHeight } = options;

  let targetWidth = originalWidth;
  let targetHeight = originalHeight;
  const aspectRatio = originalWidth / originalHeight;

  switch (mode) {
    case '75':
      targetWidth = Math.round(originalWidth * 0.75);
      targetHeight = Math.round(originalHeight * 0.75);
      break;

    case '50':
      targetWidth = Math.round(originalWidth * 0.5);
      targetHeight = Math.round(originalHeight * 0.5);
      break;

    case '25':
      targetWidth = Math.round(originalWidth * 0.25);
      targetHeight = Math.round(originalHeight * 0.25);
      break;

    case 'custom':
      if (customWidth && customHeight) {
        if (lockAspectRatio) {
          // Adjust to fit bounds without stretching
          const widthScale = customWidth / originalWidth;
          const heightScale = customHeight / originalHeight;
          const scale = Math.min(widthScale, heightScale);
          targetWidth = Math.round(originalWidth * scale);
          targetHeight = Math.round(originalHeight * scale);
        } else {
          targetWidth = customWidth;
          targetHeight = customHeight;
        }
      } else if (customWidth) {
        targetWidth = customWidth;
        targetHeight = lockAspectRatio ? Math.round(customWidth / aspectRatio) : originalHeight;
      } else if (customHeight) {
        targetHeight = customHeight;
        targetWidth = lockAspectRatio ? Math.round(customHeight * aspectRatio) : originalWidth;
      }
      break;

    case 'original':
    default:
      targetWidth = originalWidth;
      targetHeight = originalHeight;
      break;
  }

  // Apply Max Width / Max Height constraints if present
  if (maxWidth && targetWidth > maxWidth) {
    const scale = maxWidth / targetWidth;
    targetWidth = maxWidth;
    if (lockAspectRatio) {
      targetHeight = Math.round(targetHeight * scale);
    }
  }

  if (maxHeight && targetHeight > maxHeight) {
    const scale = maxHeight / targetHeight;
    targetHeight = maxHeight;
    if (lockAspectRatio) {
      targetWidth = Math.round(targetWidth * scale);
    }
  }

  // Ensure dimensions are positive integers >= 1
  targetWidth = Math.max(1, Math.round(targetWidth));
  targetHeight = Math.max(1, Math.round(targetHeight));

  const scaleFactor = targetWidth / originalWidth;

  return { targetWidth, targetHeight, scaleFactor };
}
