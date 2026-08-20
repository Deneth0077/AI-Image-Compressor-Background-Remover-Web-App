'use client';

import { useState, useRef, MouseEvent, TouchEvent } from 'react';
import {
  Columns,
  Split,
  Eye,
  Sparkles,
  RotateCcw,
  RotateCw,
  Rotate3d,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import { formatBytes } from '@/lib/utils/file-size';
import { ProcessedImageResult } from '@/types/image';

interface BeforeAfterPreviewProps {
  originalUrl: string;
  processedUrl: string;
  result: ProcessedImageResult;
  rotation?: number;
  onRotate?: (newAngle: number) => void;
  isRotating?: boolean;
}

export function BeforeAfterPreview({
  originalUrl,
  processedUrl,
  result,
  rotation = 0,
  onRotate,
  isRotating = false,
}: BeforeAfterPreviewProps) {
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'processed'>('slider');
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 - 100
  const [showCustomAngle, setShowCustomAngle] = useState(false);
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

  const handleAngleChange = (newAngle: number) => {
    const normalized = (Math.round(newAngle) % 360 + 360) % 360;
    if (onRotate) {
      onRotate(normalized);
    }
  };

  const transformStyle = rotation ? { transform: `rotate(${rotation}deg)` } : undefined;

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* 1. VIEW MODE SWITCHER & ROTATION TOOLBAR HEADER */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between bg-slate-100 dark:bg-slate-900/90 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 gap-3">
        {/* Left Side: View Mode Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              viewMode === 'slider'
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            Split Slider
          </button>

          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              viewMode === 'side-by-side'
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            Side by Side
          </button>

          <button
            type="button"
            onClick={() => setViewMode('processed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              viewMode === 'processed'
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Processed Only
          </button>
        </div>

        {/* Right Side: Quick Rotate Controls & Reduction Badge */}
        <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
          {/* ROTATION CONTROL PILL BAR */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            {/* Rotate Left 90° */}
            <button
              type="button"
              disabled={isRotating}
              onClick={() => handleAngleChange(rotation - 90)}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              title="Rotate Left 90°"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Quick Angle Presets */}
            {[0, 90, 180, 270].map((angle) => (
              <button
                key={angle}
                type="button"
                disabled={isRotating}
                onClick={() => handleAngleChange(angle)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold transition-all ${
                  rotation === angle
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400'
                }`}
              >
                {angle}°
              </button>
            ))}

            {/* Rotate Right 90° */}
            <button
              type="button"
              disabled={isRotating}
              onClick={() => handleAngleChange(rotation + 90)}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              title="Rotate Right 90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Custom Slider Toggle */}
            <button
              type="button"
              onClick={() => setShowCustomAngle(!showCustomAngle)}
              className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                showCustomAngle
                  ? 'bg-accent-500 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Custom Angle Slider"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{result.quality.reductionPercentage}% Smaller</span>
          </div>
        </div>
      </div>

      {/* 2. EXPANDABLE FINE-TUNING ANGLE SLIDER BAR */}
      {showCustomAngle && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-brand-500/10 via-slate-100 to-accent-500/10 dark:from-brand-500/20 dark:via-slate-900/90 dark:to-accent-500/20 border border-brand-500/30 shadow-md space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
            <span className="flex items-center gap-1.5">
              <Rotate3d className="w-4 h-4 text-brand-500" />
              Fine Angle Adjustment:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-brand-600 dark:text-brand-400 text-sm font-extrabold">{rotation}°</span>
              <button
                type="button"
                onClick={() => handleAngleChange(0)}
                className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-slate-700"
              >
                Reset 0°
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isRotating}
              onClick={() => handleAngleChange(rotation - 15)}
              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50"
            >
              -15°
            </button>

            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => handleAngleChange(Number(e.target.value))}
              className="w-full accent-brand-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
            />

            <button
              type="button"
              disabled={isRotating}
              onClick={() => handleAngleChange(rotation + 15)}
              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50"
            >
              +15°
            </button>

            <div className="flex items-center gap-1 min-w-[70px]">
              <input
                type="number"
                min={0}
                max={360}
                value={rotation}
                onChange={(e) => handleAngleChange(Number(e.target.value))}
                className="w-14 px-1.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <span className="text-xs text-slate-500 font-bold">°</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN PREVIEW CONTAINER */}
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
            <div className="absolute top-4 right-4 bg-brand-600/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-xl backdrop-blur-md z-10 border border-white/20 flex items-center gap-1.5">
              <span>Processed: {formatBytes(result.processedSize)}</span>
              {rotation > 0 && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold">({rotation}°)</span>}
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
              {result.processedWidth} × {result.processedHeight} px | {formatBytes(result.processedSize)} {rotation > 0 ? `| ${rotation}°` : ''}
            </div>
          </div>
        )}
      </div>

      {/* 4. COMPARISON METRICS PILL FOOTER */}
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

