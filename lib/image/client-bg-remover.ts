'use client';

/**
 * Client-Side ML Neural Network AI Background Remover
 * Executes ISNet ML segmentation model inside browser WebGL/WebAssembly
 */
export async function removeBackgroundClient(file: File): Promise<File | null> {
  try {
    const { removeBackground } = await import('@imgly/background-removal');
    console.log('[ClientAiBgRemover] Starting in-browser ML neural background removal...');

    const resultBlob = await removeBackground(file, {
      progress: (key, current, total) => {
        console.log(`[ClientAiBgRemover] ${key}: ${Math.round((current / total) * 100)}%`);
      },
    });

    const resultFile = new File([resultBlob], file.name.replace(/\.[^/.]+$/, '') + '-nobg.png', {
      type: 'image/png',
    });

    console.log('[ClientAiBgRemover] Browser ML removal successful!');
    return resultFile;
  } catch (err: any) {
    console.warn('[ClientAiBgRemover] In-browser AI removal error or unsupported:', err?.message || err);
    return null;
  }
}
