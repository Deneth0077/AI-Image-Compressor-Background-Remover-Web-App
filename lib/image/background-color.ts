import sharp from 'sharp';
import { BackgroundType } from '@/types/image';

interface ApplyBackgroundParams {
  inputBuffer: Buffer;
  backgroundType: BackgroundType;
  customColor?: string;
  width: number;
  height: number;
}

export async function applyBackgroundColor({
  inputBuffer,
  backgroundType,
  customColor,
  width,
  height,
}: ApplyBackgroundParams): Promise<Buffer> {
  // If transparent requested, return original image unchanged (preserving alpha)
  if (backgroundType === 'transparent') {
    return inputBuffer;
  }

  let hexColor = '#FFFFFF';
  if (backgroundType === 'white') {
    hexColor = '#FFFFFF';
  } else if (backgroundType === 'black') {
    hexColor = '#000000';
  } else if (backgroundType === 'custom' && customColor) {
    hexColor = customColor.startsWith('#') ? customColor : `#${customColor}`;
  }

  try {
    // Flatten transparent background onto solid color canvas
    return await sharp(inputBuffer)
      .flatten({ background: hexColor })
      .png()
      .toBuffer();
  } catch {
    return inputBuffer;
  }
}
