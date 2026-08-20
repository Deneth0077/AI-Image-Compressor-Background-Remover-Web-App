import { NextRequest, NextResponse } from 'next/server';
import { generateMultiPagePdfFromImages } from '@/lib/pdf/generator';
import { PdfOptions } from '@/types/pdf';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const imagesToEmbed: Array<{ imageBuffer: Buffer; mimeType: string }> = [];
    let pdfOptions: PdfOptions = {
      pageSize: 'a4',
      fitMode: 'fit',
      margin: 20,
    };
    let filename = 'document.pdf';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      const rawDataUrls: string[] = body.dataUrls || (body.dataUrl ? [body.dataUrl] : []);

      if (rawDataUrls.length === 0) {
        return NextResponse.json({ error: 'At least one image Data URL is required' }, { status: 400 });
      }

      for (const dataUrl of rawDataUrls) {
        const matches = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (matches) {
          imagesToEmbed.push({
            mimeType: matches[1],
            imageBuffer: Buffer.from(matches[2], 'base64'),
          });
        }
      }

      if (body.options) {
        pdfOptions = { ...pdfOptions, ...body.options };
      }
      if (body.filename) {
        filename = body.filename;
      }
    } else {
      const formData = await req.formData();
      const files = formData.getAll('file') as File[];
      if (files.length === 0) {
        return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
      }

      for (const file of files) {
        imagesToEmbed.push({
          mimeType: file.type || 'image/png',
          imageBuffer: Buffer.from(await file.arrayBuffer()),
        });
      }

      pdfOptions = {
        pageSize: (formData.get('pageSize') as any) || 'a4',
        fitMode: (formData.get('fitMode') as any) || 'fit',
        margin: Number(formData.get('margin') || 20),
      };
      if (formData.get('filename')) {
        filename = formData.get('filename') as string;
      }
    }

    const pdfBuffer = await generateMultiPagePdfFromImages({
      images: imagesToEmbed,
      options: pdfOptions,
    });

    const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    const pdfBytes = new Uint8Array(pdfBuffer);

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Content-Length': pdfBytes.byteLength.toString(),
      },
    });
  } catch (err: any) {
    console.error('PDF generation error:', err);
    return NextResponse.json(
      { error: 'Failed to generate PDF document. Please try again.' },
      { status: 500 }
    );
  }
}
