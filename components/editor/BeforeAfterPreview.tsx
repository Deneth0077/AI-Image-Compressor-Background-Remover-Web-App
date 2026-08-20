'use client';

import { useState, useRef, MouseEvent, TouchEvent } from 'react';
import { Columns, Split, Eye, ArrowRight, Download, Sparkles } from 'lucide-react';
import { formatBytes } from '@/lib/utils/file-size';
import { ProcessedImageResult } from '@/types/image';

interface BeforeAfterPreviewProps {
  originalUrl: string;
  processedUrl: string;
  result: ProcessedImageResult;
  rotation?: number;
}

export function BeforeAfterPreview({ originalUrl, processedUrl, result, rotation = 0 }: BeforeAfterPreviewProps) {
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'processed'>('slider');
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 - 100
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const transformStyle = rotation ? { transform: `rotate(${rotation}deg)` } : undefined;

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* View Mode Switcher Header */}
      <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'slider'
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            Split Slider
          </button>

          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'side-by-side'
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            Side by Side
          </button>

          <button
            type="button"
            onClick={() => setViewMode('processed')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'processed'
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Processed Only
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{result.quality.reductionPercentage}% Smaller</span>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-2xl min-h-[350px] sm:min-h-[450px] flex items-center justify-center">
        {/* Transparent Checkerboard Pattern Background */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#475569 1px, transparent 1px), radial-gradient(#475569 1px, #0f172a 1px)`,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 10px 10px',
          }}
        />

        {/* 1. SLIDER MODE */}
        {viewMode === 'slider' && (
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            className="relative w-full h-[380px] sm:h-[480px] select-none cursor-ew-resize overflow-hidden flex items-center justify-center"
          >
            {/* Processed (Right layer / Base) */}
            <img
              src={processedUrl}
              alt="Processed preview"
              className="absolute max-h-full max-w-full object-contain pointer-events-none transition-transform duration-200"
            />

            {/* Original (Left layer / Clipped) */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center"
              style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
            >
              <img
                src={originalUrl}
                alt="Original preview"
                className="max-h-full max-w-full object-contain transition-transform duration-200"
                style={transformStyle}
              />
            </div>

            {/* Drag Line Handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl z-20 flex items-center justify-center pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center border-2 border-brand-500 font-bold text-xs">
                ↔
              </div>
            </div>

            {/* Labels */}
            <div className="absolute top-4 left-4 bg-slate-950/80 text-white text-[11px] font-semibold px-2.5 py-1 rounded-xl backdrop-blur-md z-10 border border-white/10">
              Original: {formatBytes(result.original.size)}
            </div>
            <div className="absolute top-4 right-4 bg-brand-600/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-xl backdrop-blur-md z-10 border border-white/20">
              Processed: {formatBytes(result.processedSize)}
            </div>
          </div>
        )}

        {/* 2. SIDE BY SIDE MODE */}
        {viewMode === 'side-by-side' && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 p-4 z-10">
            {/* Original Card */}
            <div className="flex flex-col items-center space-y-2 bg-slate-950/60 p-3 rounded-2xl border border-white/10">
              <span className="text-xs font-semibold text-slate-400">Original ({formatBytes(result.original.size)})</span>
              <div className="h-[250px] w-full flex items-center justify-center overflow-hidden">
                <img src={originalUrl} alt="Original" className="max-h-full max-w-full object-contain transition-transform duration-200" style={transformStyle} />
              </div>
              <span className="text-[11px] text-slate-500">{result.original.width} × {result.original.height} px</span>
            </div>

            {/* Processed Card */}
            <div className="flex flex-col items-center space-y-2 bg-slate-950/60 p-3 rounded-2xl border border-brand-500/30">
              <span className="text-xs font-semibold text-brand-400">Processed ({formatBytes(result.processedSize)})</span>
              <div className="h-[250px] w-full flex items-center justify-center overflow-hidden">
                <img src={processedUrl} alt="Processed" className="max-h-full max-w-full object-contain transition-transform duration-200" />
              </div>
              <span className="text-[11px] text-slate-400">{result.processedWidth} × {result.processedHeight} px • {result.processedFormat.toUpperCase()}</span>
            </div>
          </div>
        )}

        {/* 3. PROCESSED ONLY MODE */}
        {viewMode === 'processed' && (
          <div className="w-full h-[380px] sm:h-[480px] p-4 flex items-center justify-center relative">
            <img src={processedUrl} alt="Processed output" className="max-h-full max-w-full object-contain z-10" />
            <div className="absolute top-4 right-4 bg-brand-600/90 text-white text-[11px] font-semibold px-3 py-1 rounded-xl backdrop-blur-md z-20">
              {result.processedWidth} × {result.processedHeight} px | {formatBytes(result.processedSize)}
            </div>
          </div>
        )}
      </div>

      {/* Comparison Metrics Pill Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="block text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Original Size</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">{formatBytes(result.original.size)}</span>
        </div>
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="block text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Optimized Size</span>
          <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{formatBytes(result.processedSize)}</span>
        </div>
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="block text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Dimensions</span>
          <span className="text-xs font-bold text-slate-900 dark:text-white">{result.original.width}×{result.original.height} → {result.processedWidth}×{result.processedHeight}</span>
        </div>
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="block text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Reduction</span>
          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">-{result.quality.reductionPercentage}%</span>
        </div>
      </div>
    </div>
  );
}
