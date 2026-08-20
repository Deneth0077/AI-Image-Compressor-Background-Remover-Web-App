import { PDFDocument, PageSizes } from 'pdf-lib';
import { PdfOptions } from '@/types/pdf';
import sharp from 'sharp';

interface GeneratePdfParams {
  imageBuffer: Buffer;
  mimeType: string;
  options: PdfOptions;
}

export async function generatePdfFromImage({
  imageBuffer,
  mimeType,
  options,
}: GeneratePdfParams): Promise<Buffer> {
  return generateMultiPagePdfFromImages({
    images: [{ imageBuffer, mimeType }],
    options,
  });
}

interface GenerateMultiPagePdfParams {
  images: Array<{ imageBuffer: Buffer; mimeType: string }>;
  options: PdfOptions;
}

export async function generateMultiPagePdfFromImages({
  images,
  options,
}: GenerateMultiPagePdfParams): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  for (const imgItem of images) {
    let embeddableBuffer = imgItem.imageBuffer;
    let isPng = imgItem.mimeType.includes('png');
    let isJpeg = imgItem.mimeType.includes('jpeg') || imgItem.mimeType.includes('jpg');

    if (!isPng && !isJpeg) {
      embeddableBuffer = await sharp(imgItem.imageBuffer).png().toBuffer();
      isPng = true;
    }

    let embeddedImage;
    if (isPng) {
      embeddedImage = await pdfDoc.embedPng(embeddableBuffer);
    } else {
      embeddedImage = await pdfDoc.embedJpg(embeddableBuffer);
    }

    const imgWidth = embeddedImage.width;
    const imgHeight = embeddedImage.height;
    const imgAspectRatio = imgWidth / imgHeight;

    let pageWidth = PageSizes.A4[0];
    let pageHeight = PageSizes.A4[1];

    if (options.pageSize === 'letter') {
      pageWidth = PageSizes.Letter[0];
      pageHeight = PageSizes.Letter[1];
    } else if (options.pageSize === 'original') {
      pageWidth = Math.max(100, Math.min(2000, imgWidth));
      pageHeight = Math.max(100, Math.min(2000, imgHeight));
    }

    // Auto Orientation: Swap page dimensions if image is landscape and page is portrait (or vice versa)
    if (options.pageSize !== 'original') {
      const isImageLandscape = imgAspectRatio > 1.0;
      const isPageLandscape = pageWidth > pageHeight;

      if (isImageLandscape !== isPageLandscape) {
        const temp = pageWidth;
        pageWidth = pageHeight;
        pageHeight = temp;
      }
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const margin = options.margin || 20;

    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;

    let drawWidth = availableWidth;
    let drawHeight = availableHeight;

    if (options.fitMode === 'original') {
      drawWidth = Math.min(availableWidth, imgWidth);
      drawHeight = Math.min(availableHeight, imgHeight);

      if (drawWidth / drawHeight > imgAspectRatio) {
        drawWidth = drawHeight * imgAspectRatio;
      } else {
        drawHeight = drawWidth / imgAspectRatio;
      }
    } else if (options.fitMode === 'fit' || options.pageSize !== 'original') {
      const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
      drawWidth = imgWidth * scale;
      drawHeight = imgHeight * scale;
    }

    const x = (pageWidth - drawWidth) / 2;
    const y = (pageHeight - drawHeight) / 2;

    page.drawImage(embeddedImage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
