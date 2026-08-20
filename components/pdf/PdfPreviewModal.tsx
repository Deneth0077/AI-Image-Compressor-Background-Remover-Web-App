'use client';

import { useState } from 'react';
import { X, FileText, Download, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { PdfOptions, PdfPageSize, PdfFitMode } from '@/types/pdf';

export interface PdfPreviewItem {
  dataUrl: string;
  width: number;
  height: number;
  name: string;
}

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PdfPreviewItem[];
}

export function PdfPreviewModal({ isOpen, onClose, items }: PdfPreviewModalProps) {
  const [pageSize, setPageSize] = useState<PdfPageSize>('a4');
  const [fitMode, setFitMode] = useState<PdfFitMode>('fit');
  const [margin, setMargin] = useState<number>(20);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  if (!isOpen || !items || items.length === 0) return null;

  const activeItem = items[currentPageIndex] || items[0];
  const isLandscape = activeItem.width > activeItem.height;
  const isMultiPage = items.length > 1;

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      const dataUrls = items.map((item) => item.dataUrl);
      const documentName = items.length === 1
        ? `${items[0].name.replace(/\.[^/.]+$/, '')}-document.pdf`
        : `pixel-shrink-batch-${items.length}-pages.pdf`;

      const response = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataUrls,
          filename: documentName,
          options: {
            pageSize,
            fitMode,
            margin,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('PDF generation failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documentName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      console.error('PDF error:', err);
      alert('Failed to generate PDF document. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                PDF Preview & Layout Settings
              </h3>
              <p className="text-xs text-slate-500">
                {isMultiPage
                  ? `Multi-Page Document (${items.length} Pages)`
                  : `Orientation: ${isLandscape ? 'Landscape' : 'Portrait'} (Auto-detected)`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body (Grid Layout) */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Left: Interactive Canvas Preview */}
          <div className="flex flex-col items-center space-y-3">
            <div className="flex items-center justify-between w-full px-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Sheet Preview ({pageSize.toUpperCase()})
              </span>

              {isMultiPage && (
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    disabled={currentPageIndex === 0}
                    onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
                    className="p-1 rounded text-slate-600 dark:text-slate-300 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {currentPageIndex + 1} / {items.length}
                  </span>
                  <button
                    type="button"
                    disabled={currentPageIndex === items.length - 1}
                    onClick={() => setCurrentPageIndex((prev) => Math.min(items.length - 1, prev + 1))}
                    className="p-1 rounded text-slate-600 dark:text-slate-300 disabled:opacity-30"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div
              className={`relative bg-white shadow-2xl rounded-xl border border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden transition-all duration-300 ${
                isLandscape ? 'w-[280px] h-[198px]' : 'w-[210px] h-[297px]'
              }`}
              style={{ padding: `${margin / 3}px` }}
            >
              {/* Page Sheet Margins Marker */}
              <div className="w-full h-full border border-dashed border-slate-300 dark:border-slate-400 flex items-center justify-center overflow-hidden">
                <img
                  src={activeItem.dataUrl}
                  alt={`PDF page ${currentPageIndex + 1}`}
                  className={`max-w-full max-h-full transition-all duration-300 ${
                    fitMode === 'fill'
                      ? 'w-full h-full object-cover'
                      : fitMode === 'original'
                      ? 'object-none'
                      : 'object-contain'
                  }`}
                />
              </div>
            </div>

            {isMultiPage && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                Page {currentPageIndex + 1}: {activeItem.name}
              </span>
            )}
          </div>

          {/* Right: Controls & Presets */}
          <div className="space-y-5">
            {/* Page Size Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Page Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'a4', label: 'A4' },
                  { id: 'letter', label: 'Letter' },
                  { id: 'original', label: 'Original Ratio' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPageSize(p.id as PdfPageSize)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      pageSize === p.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fit Mode Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Image Sizing
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'fit', label: 'Fit to Page' },
                  { id: 'fill', label: 'Fill Page' },
                  { id: 'original', label: 'Original Size' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFitMode(f.id as PdfFitMode)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      fitMode === f.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Margin Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Page Margins</span>
                <span>{margin} pt</span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                step={5}
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {items.length} {items.length === 1 ? 'Image' : 'Images'} compiled into 1 PDF
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleDownloadPdf}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Generating PDF...' : `Download ${items.length > 1 ? `Multi-Page (${items.length} Pages)` : ''} PDF`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
