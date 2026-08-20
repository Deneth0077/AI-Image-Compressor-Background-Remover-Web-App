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
      // Ensure Sharp converts input to clean PNG buffer for model inference
      const pngBuffer = await sharp(inputBuffer).png().toBuffer();
      const blob = new Blob([new Uint8Array(pngBuffer)], { type: 'image/png' });
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
      console.error('ImglyAiProvider error:', err?.message || err);
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

      // 1. Sample outer perimeter (4 edges)
      const borderSamples: Array<[number, number, number]> = [];
      const sampleCoords: Array<[number, number]> = [];

      for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 20))) {
        sampleCoords.push([x, 0]);
        sampleCoords.push([x, height - 1]);
      }
      for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 20))) {
        sampleCoords.push([0, y]);
        sampleCoords.push([width - 1, y]);
      }

      for (const [sx, sy] of sampleCoords) {
        const idx = (sy * width + sx) * 4;
        borderSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
      }

      // Check standard deviation of border samples
      let sumR = 0, sumG = 0, sumB = 0;
      for (const [r, g, b] of borderSamples) {
        sumR += r; sumG += g; sumB += b;
      }
      const meanR = sumR / borderSamples.length;
      const meanG = sumG / borderSamples.length;
      const meanB = sumB / borderSamples.length;

      let varR = 0, varG = 0, varB = 0;
      for (const [r, g, b] of borderSamples) {
        varR += (r - meanR) ** 2;
        varG += (g - meanG) ** 2;
        varB += (b - meanB) ** 2;
      }
      const borderStdDev = Math.sqrt((varR + varG + varB) / borderSamples.length);

      // If border has high color variance (e.g. textured desk/photo/document), fallback safely
      // without destroying internal document pixels!
      const isSolidChromaBg = borderStdDev < 20;

      const alphaBuffer = Buffer.alloc(width * height);
      // Default all pixels to fully opaque (255)
      alphaBuffer.fill(255);

      if (!isSolidChromaBg) {
        // Safe Fallback: Do not erase non-chroma backgrounds to prevent washing out documents
        return {
          success: false,
          buffer: inputBuffer,
          mimeType: 'image/png',
          hasAlpha: false,
          providerUsed: this.name,
          error: 'Background color is non-uniform; preserving document integrity.',
        };
      }

      // 2. BFS Flood-Fill starting strictly from outer border pixels
      const visited = new Uint8Array(width * height);
      const queue: number[] = [];

      const bgThreshold = 25; // Strict threshold for solid background

      const isBgPixel = (x: number, y: number) => {
        const idx = (y * width + x) * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        const diff = Math.sqrt(0.3 * (r - meanR) ** 2 + 0.59 * (g - meanG) ** 2 + 0.11 * (b - meanB) ** 2);
        return diff < bgThreshold;
      };

      // Seed outer border
      for (let x = 0; x < width; x++) {
        if (isBgPixel(x, 0)) { queue.push(0 * width + x); visited[0 * width + x] = 1; }
        if (isBgPixel(x, height - 1)) { queue.push((height - 1) * width + x); visited[(height - 1) * width + x] = 1; }
      }
      for (let y = 0; y < height; y++) {
        if (isBgPixel(0, y)) { queue.push(y * width + 0); visited[y * width + 0] = 1; }
        if (isBgPixel(width - 1, y)) { queue.push(y * width + (width - 1)); visited[y * width + (width - 1)] = 1; }
      }

      let removedCount = 0;
      let head = 0;

      while (head < queue.length) {
        const pIdx = queue[head++];
        alphaBuffer[pIdx] = 0; // Make background pixel transparent
        removedCount++;

        const px = pIdx % width;
        const py = Math.floor(pIdx / width);

        // 4-neighbor traversal
        const neighbors = [
          [px + 1, py],
          [px - 1, py],
          [px, py + 1],
          [px, py - 1],
        ];

        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = ny * width + nx;
            if (!visited[nIdx]) {
              visited[nIdx] = 1;
              if (isBgPixel(nx, ny)) {
                queue.push(nIdx);
              }
            }
          }
        }
      }

      // Safety check: If flood fill removed > 60% of total image or 0 pixels, abort to protect image
      const removedRatio = removedCount / (width * height);
      if (removedRatio > 0.6 || removedCount === 0) {
        return {
          success: false,
          buffer: inputBuffer,
          mimeType: 'image/png',
          hasAlpha: false,
          providerUsed: this.name,
          error: 'Background keyer aborted to preserve image subject integrity.',
        };
      }

      // Composite original image with generated alpha mask
      const maskPng = await sharp(alphaBuffer, {
        raw: { width, height, channels: 1 },
      })
        .blur(1.0)
        .png()
        .toBuffer();

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
