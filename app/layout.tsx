import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PixelShrink AI | Smart Image Compressor & Background Remover',
  description:
    'Remove background from images automatically, intelligently compress to target sizes (1 MB), resize, and export high-quality WebP, PNG, JPG or PDF documents.',
  keywords: [
    'image compressor',
    'background remover',
    'smart image optimization',
    'image to pdf',
    'target file size compressor',
    '1MB image compressor',
    'AI image tool',
  ],
  authors: [{ name: 'PixelShrink AI Team' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex flex-col min-h-screen">
        {children}
      </body>
    </html>
  );
}
