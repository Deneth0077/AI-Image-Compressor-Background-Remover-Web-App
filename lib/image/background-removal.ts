import sharp from 'sharp';
import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal-node';

export interface BackgroundRemovalResult {
  success: boolean;
  buffer: Buffer;
  mimeType: string;
  hasAlpha: boolean;
  providerUsed: string;
  error?: string;
}

export interface IBackgroundRemovalProvider {
  name: string;
  removeBackground(inputBuffer: Buffer): Promise<BackgroundRemovalResult>;
}

/**
 * External AI API Provider (Remove.bg with auto-retry type=product for documents/cards)
 */
export class ExternalAiApiProvider implements IBackgroundRemovalProvider {
  name = 'external-ai-api (Remove.bg)';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async removeBackground(inputBuffer: Buffer): Promise<BackgroundRemovalResult> {
    try {
      const formData = new FormData();
      formData.append('size', 'auto');
      formData.append('type', 'auto');
      formData.append('image_file', new Blob([new Uint8Array(inputBuffer)]), 'input.png');

      let response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apiKey.trim(),
        },
        body: formData,
      });

      // If 'auto' failed with 400 (unknown foreground), retry with 'product' type for ID cards / documents
      if (!response.ok && response.status === 400) {
        console.warn('Remove.bg type=auto returned 400. Retrying with type=product...');
        const retryFormData = new FormData();
        retryFormData.append('size', 'auto');
        retryFormData.append('type', 'product');
        retryFormData.append('image_file', new Blob([new Uint8Array(inputBuffer)]), 'input.png');

        response = await fetch('https://api.remove.bg/v1.0/removebg', {
          method: 'POST',
          headers: {
            'X-Api-Key': this.apiKey.trim(),
          },
          body: retryFormData,
        });
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error(`Remove.bg API error [${response.status}]:`, errorText);
        throw new Error(`Remove.bg API responded with status ${response.status}: ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const outputBuffer = Buffer.from(arrayBuffer);

      return {
        success: true,
        buffer: outputBuffer,
        mimeType: 'image/png',
        hasAlpha: true,
        providerUsed: this.name,
      };
    } catch (err: any) {
      console.error('ExternalAiApiProvider error:', err?.message || err);
      return {
        success: false,
        buffer: inputBuffer,
        mimeType: 'image/png',
        hasAlpha: false,
        providerUsed: this.name,
        error: err?.message || 'External background removal API error',
      };
    }
  }
}

/**
 * Local Neural Network ML Provider (@imgly/background-removal-node)
 */
export class ImglyAiProvider implements IBackgroundRemovalProvider {
  name = 'imgly-ai-local';

  async removeBackground(inputBuffer: Buffer): Promise<BackgroundRemovalResult> {
    try {
      const blob = new Blob([new Uint8Array(inputBuffer)]);
      const outputBlob = await imglyRemoveBackground(blob);
      const arrayBuffer = await outputBlob.arrayBuffer();
      const outputBuffer = Buffer.from(arrayBuffer);

      return {
        success: true,
        buffer: outputBuffer,
        mimeType: 'image/png',
        hasAlpha: true,
        providerUsed: this.name,
      };
    } catch (err: any) {
      return {
        success: false,
        buffer: inputBuffer,
        mimeType: 'image/png',
        hasAlpha: false,
        providerUsed: this.name,
        error: err?.message || 'imgly AI background removal failed',
      };
    }
  }
}

/**
 * Local Smart Threshold & Multi-Cluster Perimeter Segmentation Provider
 * Adaptive 40-point border sampling, mean background color clustering & anti-aliased edge masking
 */
export class LocalSmartSegmentationProvider implements IBackgroundRemovalProvider {
  name = 'local-smart-keyer';

  async removeBackground(inputBuffer: Buffer): Promise<BackgroundRemovalResult> {
    try {
      const image = sharp(inputBuffer);
      const meta = await image.metadata();
      const width = meta.width || 800;
      const height = meta.height || 600;

      // Extract raw RGBA pixel data
      const { data } = await image
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const length = data.length;
      const alphaBuffer = Buffer.alloc(width * height);

      // 40-Point Perimeter Sampling (Outer margins + Corners)
      const borderSamples: Array<[number, number, number]> = [];
      const numSamplesPerEdge = 10;

      for (let i = 0; i < numSamplesPerEdge; i++) {
        const stepX = Math.round((i / (numSamplesPerEdge - 1)) * (width - 1));
        const stepY = Math.round((i / (numSamplesPerEdge - 1)) * (height - 1));

        for (const marginFrac of [0.01, 0.04]) {
          const topY = Math.round(height * marginFrac);
          const botY = Math.round(height * (1 - marginFrac));
          const leftX = Math.round(width * marginFrac);
          const rightX = Math.round(width * (1 - marginFrac));

          const topIdx = (topY * width + stepX) * 4;
          const botIdx = (botY * width + stepX) * 4;
          const leftIdx = (stepY * width + leftX) * 4;
          const rightIdx = (stepY * width + rightX) * 4;

          borderSamples.push([data[topIdx], data[topIdx + 1], data[topIdx + 2]]);
          borderSamples.push([data[botIdx], data[botIdx + 1], data[botIdx + 2]]);
          borderSamples.push([data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]]);
          borderSamples.push([data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]]);
        }
      }

      // Calculate mean background color
      let sumR = 0, sumG = 0, sumB = 0;
      for (const [r, g, b] of borderSamples) {
        sumR += r;
        sumG += g;
        sumB += b;
      }
      const meanR = sumR / borderSamples.length;
      const meanG = sumG / borderSamples.length;
      const meanB = sumB / borderSamples.length;

      const centerX = width / 2;
      const centerY = height / 2;
      const maxDistFromCenter = Math.sqrt(centerX * centerX + centerY * centerY);

      for (let i = 0; i < length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const pixelIdx = i / 4;

        const x = pixelIdx % width;
        const y = Math.floor(pixelIdx / width);

        // Minimum distance to any perimeter sample
        let minSampleDiff = Infinity;
        for (const [br, bg, bb] of borderSamples) {
          const diff = Math.sqrt(
            0.3 * (r - br) ** 2 + 0.59 * (g - bg) ** 2 + 0.11 * (b - bb) ** 2
          );
          if (diff < minSampleDiff) {
            minSampleDiff = diff;
          }
        }

        // Distance to mean background color
        const meanBgDiff = Math.sqrt(
          0.3 * (r - meanR) ** 2 + 0.59 * (g - meanG) ** 2 + 0.11 * (b - meanB) ** 2
        );

        // Use minimum of sample diff and mean diff
        const effectiveColorDiff = Math.min(minSampleDiff, meanBgDiff * 0.9);

        // Distance from image center normalized [0.0 (center) to 1.0 (corner)]
        const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2) / maxDistFromCenter;

        // Position-dependent threshold
        const isOuterMargin = x < width * 0.18 || x > width * 0.82 || y < height * 0.18 || y > height * 0.82;
        const bgThreshold = isOuterMargin ? 60 : 35 + (1 - distFromCenter) * 22;

        let alpha = 255;
        if (effectiveColorDiff < bgThreshold) {
          alpha = 0; // 100% transparent background
        } else if (effectiveColorDiff < bgThreshold + 30) {
          // Smooth edge anti-aliasing
          alpha = Math.round(((effectiveColorDiff - bgThreshold) / 30) * 255);
        }

        alphaBuffer[pixelIdx] = alpha;
      }

      // Smooth mask with Gaussian blur for clean anti-aliased edge
      const maskPng = await sharp(alphaBuffer, {
        raw: { width, height, channels: 1 },
      })
        .blur(1.5)
        .png()
        .toBuffer();

      // Composite original image with generated alpha mask
      const resultBuffer = await sharp(inputBuffer)
        .ensureAlpha()
        .composite([{ input: maskPng, blend: 'dest-in' }])
        .png()
        .toBuffer();

      return {
        success: true,
        buffer: Buffer.from(resultBuffer),
        mimeType: 'image/png',
        hasAlpha: true,
        providerUsed: this.name,
      };
    } catch (err: any) {
      return {
        success: false,
        buffer: Buffer.from(inputBuffer),
        mimeType: 'image/png',
        hasAlpha: false,
        providerUsed: this.name,
        error: err?.message || 'Local background keying failed',
      };
    }
  }
}

/**
 * Main Service Abstraction (Factory + Multi-Tier Fallback Pipeline)
 */
export class BackgroundRemovalService {
  async removeBackground(inputBuffer: Buffer): Promise<BackgroundRemovalResult> {
    const apiKey = process.env.BACKGROUND_REMOVAL_API_KEY;
    const providers: IBackgroundRemovalProvider[] = [];

    // 1. External Remove.bg AI API (if API Key provided in .env.local)
    if (apiKey && apiKey.trim().length > 0) {
      providers.push(new ExternalAiApiProvider(apiKey));
    }

    // 2. Neural Network Local AI (@imgly/background-removal-node)
    providers.push(new ImglyAiProvider());

    // 3. Sharp Multi-Point Perimeter & Contrast Keyer Fallback
    providers.push(new LocalSmartSegmentationProvider());

    let orientedBuffer = inputBuffer;
    try {
      orientedBuffer = await sharp(inputBuffer).rotate().toBuffer();
    } catch {
      orientedBuffer = inputBuffer;
    }

    for (const provider of providers) {
      try {
        console.log(`[BackgroundRemoval] Attempting provider: ${provider.name}...`);
        const result = await provider.removeBackground(orientedBuffer);
        if (result.success && result.hasAlpha) {
          console.log(`[BackgroundRemoval] SUCCESS using ${provider.name}`);
          return result;
        }
      } catch (e: any) {
        console.warn(`[BackgroundRemoval] Provider ${provider.name} error:`, e?.message || e);
      }
    }

    // Fallback if all providers fail
    const keyer = new LocalSmartSegmentationProvider();
    return await keyer.removeBackground(orientedBuffer);
  }
}

export const backgroundRemovalService = new BackgroundRemovalService();
