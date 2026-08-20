import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { validateImageBuffer } from '@/lib/image/validation';
import { backgroundRemovalService } from '@/lib/image/background-removal';
import { applyBackgroundColor } from '@/lib/image/background-color';
import { optimizeImageToTarget } from '@/lib/image/compression';
import { analyzeImageOrientation, verifyProcessedResult } from '@/lib/image/ai-analyzer';
import { BackgroundType, ImageFormat, ProcessingOptions, ResizeMode } from '@/types/image';

export const maxDuration = 60; // Max 60s execution

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Please upload an image file.' },
        { status: 400 }
      );
    }

    // Extract options
    const targetSizeKB = Number(formData.get('targetSizeKB') || 1024);
    const outputFormat = (formData.get('outputFormat') || 'auto') as ImageFormat;
    const removeBackground = formData.get('removeBackground') === 'true';
    const backgroundType = (formData.get('backgroundType') || 'transparent') as BackgroundType;
    const customBackgroundColor = (formData.get('customBackgroundColor') as string) || '#FFFFFF';

    const resizeMode = (formData.get('resizeMode') || 'original') as ResizeMode;
    const customWidth = formData.get('customWidth') ? Number(formData.get('customWidth')) : undefined;
    const customHeight = formData.get('customHeight') ? Number(formData.get('customHeight')) : undefined;
    const lockAspectRatio = formData.get('lockAspectRatio') !== 'false';
    const rotation = formData.get('rotation') ? Number(formData.get('rotation')) : 0;

    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);

    // 1. Server-side File Validation
    const validation = await validateImageBuffer(buffer);
    if (!validation.valid || !validation.metadata) {
      return NextResponse.json(
        { error: validation.error || 'Invalid or unsupported image file.' },
        { status: 400 }
      );
    }

    const { width: originalWidth, height: originalHeight, format: originalFormat } = validation.metadata;
    const originalSize = file.size;

    // 1.5 AI Orientation Analysis & EXIF Auto-Rotation
    const aiAnalysis = await analyzeImageOrientation(buffer);
    let effectiveRotation = rotation;

    if (rotation === 0 && aiAnalysis.needsRotation) {
      effectiveRotation = aiAnalysis.optimalRotation;
    }

    // Apply EXIF auto-orientation or user-specified rotation angle
    try {
      if (effectiveRotation !== 0) {
        buffer = Buffer.from(await sharp(buffer).rotate(effectiveRotation).toBuffer());
      } else {
        buffer = Buffer.from(await sharp(buffer).rotate().toBuffer()); // Auto EXIF orientation correction
      }
    } catch {
      // Keep original buffer if rotation transform fails
    }

    // Re-calculate dimensions post-rotation
    let currentWidth = originalWidth;
    let currentHeight = originalHeight;
    try {
      const metaAfterRotate = await sharp(buffer).metadata();
      if (metaAfterRotate.width && metaAfterRotate.height) {
        currentWidth = metaAfterRotate.width;
        currentHeight = metaAfterRotate.height;
      }
    } catch {
      if (effectiveRotation === 90 || effectiveRotation === 270) {
        currentWidth = originalHeight;
        currentHeight = originalWidth;
      }
    }

    // 2. Background Removal (if enabled)
    let bgRemovedSuccess = false;
    let hasAlphaChannel = validation.metadata.hasAlpha || removeBackground;

    if (removeBackground) {
      const bgResult = await backgroundRemovalService.removeBackground(buffer);
      if (bgResult.success) {
        buffer = Buffer.from(bgResult.buffer);
        bgRemovedSuccess = true;
        hasAlphaChannel = true;
      } else {
        console.warn('Background removal warning:', bgResult.error);
      }
    }

    // 3. Background Color Compositing
    if (bgRemovedSuccess || hasAlphaChannel) {
      buffer = Buffer.from(
        await applyBackgroundColor({
          inputBuffer: buffer,
          backgroundType,
          customColor: customBackgroundColor,
          width: currentWidth,
          height: currentHeight,
        })
      );
    }

    // Update alpha status after background flattening
    if (backgroundType !== 'transparent') {
      hasAlphaChannel = false;
    }

    // 4. Options Construction
    const processingOptions: ProcessingOptions = {
      targetSizeKB,
      outputFormat,
      removeBackground,
      backgroundType,
      customBackgroundColor,
      rotation: 0,
      resize: {
        mode: resizeMode,
        customWidth,
        customHeight,
        lockAspectRatio,
      },
    };

    // 5. Intelligent Target-Size Optimization Algorithm
    const result = await optimizeImageToTarget(
      buffer,
      currentWidth,
      currentHeight,
      originalSize,
      processingOptions,
      hasAlphaChannel
    );

    // 6. AI Verification Check
    const aiVerification = await verifyProcessedResult(result.buffer, removeBackground);

    const processingTimeMs = Date.now() - startTime;
    const base64Data = result.buffer.toString('base64');
    const processedDataUrl = `data:${result.mimeType};base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      processedDataUrl,
      original: {
        name: file.name,
        size: originalSize,
        width: originalWidth,
        height: originalHeight,
        mimeType: file.type || `image/${originalFormat}`,
        format: originalFormat,
      },
      processed: {
        size: result.finalSize,
        width: result.finalWidth,
        height: result.finalHeight,
        format: result.format,
        mimeType: result.mimeType,
      },
      quality: result.qualityMetrics,
      backgroundRemoved: bgRemovedSuccess,
      aiAnalysis,
      aiVerification,
      processingTimeMs,
    });
  } catch (err: any) {
    console.error('Image processing error:', err);
    return NextResponse.json(
      { error: 'We couldn’t process this image. Please try another JPG, PNG, or WebP file.' },
      { status: 500 }
    );
  }
}
