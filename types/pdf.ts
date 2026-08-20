export type PdfPageSize = 'a4' | 'letter' | 'original';
export type PdfFitMode = 'fit' | 'fill' | 'original';

export interface PdfOptions {
  pageSize: PdfPageSize;
  fitMode: PdfFitMode;
  margin: number; // in points (e.g. 20)
}
