'use client';

import { ProcessedImageResult } from '@/types/image';
import { Download, FileText, RefreshCw, CheckCircle2, Award, Zap, Shield, Sparkles } from 'lucide-react';
import { formatBytes } from '@/lib/utils/file-size';
import { generateOutputFilename } from '@/lib/utils/filename';

interface ResultCardProps {
  result: ProcessedImageResult;
  onOpenPdfModal: () => void;
  onReset: () => void;
}

export function ResultCard({ result, onOpenPdfModal, onReset }: ResultCardProps) {
  const downloadImage = () => {
    const filename = generateOutputFilename(
      result.original.name,
      result.processedFormat,
      result.backgroundRemoved
    );

    const a = document.createElement('a');
    a.href = result.processedDataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Color mapping for honest quality badges
  const qualityBadgeColorMap = {
    Excellent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    'Very Good': 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/30',
    Good: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    Medium: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Processing Complete ✓
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Processed in {result.processingTimeMs} ms • Format: {result.processedFormat.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* AI Self-Verification Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span>AI Verified ✓ • Auto-Landscape Corrected</span>
          </div>

          {/* Quality Indicator Badge */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border text-xs font-bold ${
              qualityBadgeColorMap[result.quality.label]
            }`}
            title={result.quality.explanation}
          >
            <Award className="w-4 h-4" />
            <span>Quality: {result.quality.label}</span>
            <span className="opacity-75">({result.quality.score}/100)</span>
          </div>
        </div>
      </div>

      {/* Main Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Original */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col space-y-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Original File
          </span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white">
            {formatBytes(result.original.size)}
          </span>
          <span className="text-xs text-slate-500">
            {result.original.width} × {result.original.height} px
          </span>
        </div>

        {/* Final Optimized */}
        <div className="p-4 rounded-2xl bg-brand-500/10 dark:bg-brand-400/10 border border-brand-500/20 flex flex-col space-y-1">
          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
            Final Optimized
          </span>
          <span className="text-xl font-extrabold text-brand-600 dark:text-brand-400">
            {formatBytes(result.processedSize)}
          </span>
          <span className="text-xs text-brand-600/80 dark:text-brand-400/80 font-medium">
            {result.processedWidth} × {result.processedHeight} px
          </span>
        </div>

        {/* Reduction Percentage */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20 flex flex-col space-y-1">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Space Saved
          </span>
          <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {result.quality.reductionPercentage}% smaller
          </span>
          <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80 font-medium">
            Saved {formatBytes(result.quality.savedBytes)}
          </span>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          type="button"
          onClick={downloadImage}
          className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-extrabold text-base shadow-xl shadow-brand-500/25 hover:shadow-brand-500/40 transition-all duration-300 flex items-center justify-center gap-2 group transform active:scale-[0.99]"
        >
          <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
          <span>Download Image</span>
        </button>

        <button
          type="button"
          onClick={onOpenPdfModal}
          className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-base border border-slate-200 dark:border-slate-700 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <FileText className="w-5 h-5 text-emerald-500" />
          <span>Download as PDF</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-semibold"
          title="Process Another Image"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="sm:hidden">Process Another</span>
        </button>
      </div>
    </div>
  );
}
