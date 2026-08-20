'use client';

import { useState, useEffect } from 'react';
import { ImageUploader } from '../upload/ImageUploader';
import { BeforeAfterPreview } from './BeforeAfterPreview';
import { OptimizationControls } from './OptimizationControls';
import { ResultCard } from '../result/ResultCard';
import { PdfPreviewModal, PdfPreviewItem } from '../pdf/PdfPreviewModal';
import { ProcessingModal } from '../ui/ProcessingModal';

import {
  ProcessingOptions,
  ProcessedImageResult,
  ImageMetadata,
  BatchImageItem,
} from '@/types/image';
import { ProcessingStage } from '@/types/processing';
import {
  ArrowLeft,
  RotateCcw,
  RotateCw,
  Plus,
  Trash2,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
  Layers,
} from 'lucide-react';
import { formatBytes } from '@/lib/utils/file-size';

interface ImageWorkspaceProps {
  initialRemoveBackground?: boolean;
}

export function ImageWorkspace({ initialRemoveBackground = true }: ImageWorkspaceProps) {
  const [items, setItems] = useState<BatchImageItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Processing Options State (removeBackground DEFAULT ALWAYS TRUE for automatic background removal!)
  const [options, setOptions] = useState<ProcessingOptions>({
    targetSizeKB: 1024, // 1 MB default
    outputFormat: 'auto',
    removeBackground: true,
    backgroundType: 'transparent',
    customBackgroundColor: '#FFFFFF',
    resize: {
      mode: 'original',
      lockAspectRatio: true,
    },
    rotation: 0,
  });

  // Processing Stage & Modal State
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('idle');
  const [stageMessage, setStageMessage] = useState<string>('');
  const [processingError, setProcessingError] = useState<string | null>(null);

  // PDF Preview Modal State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.originalUrl) {
          URL.revokeObjectURL(item.originalUrl);
        }
      });
    };
  }, [items]);

  const activeItem = items[activeIndex] || null;

  const handleFilesSelected = (files: File[]) => {
    setProcessingError(null);

    const newItems: BatchImageItem[] = [];

    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      const id = Math.random().toString(36).substring(7);

      const newItem: BatchImageItem = {
        id,
        file,
        originalUrl: url,
        rotation: 0,
        status: 'idle',
        originalMeta: {
          name: file.name,
          size: file.size,
          width: 800,
          height: 600,
          mimeType: file.type || 'image/png',
          format: file.name.split('.').pop() || 'png',
        },
      };

      // Load metadata dimensions
      const img = new Image();
      img.onload = () => {
        setItems((prev) =>
          prev.map((it) =>
            it.id === id
              ? {
                  ...it,
                  originalMeta: {
                    ...it.originalMeta,
                    width: img.width,
                    height: img.height,
                  },
                }
              : it
          )
        );
      };
      img.src = url;

      newItems.push(newItem);
    });

    const updatedList = [...items, ...newItems];
    setItems(updatedList);
    if (items.length === 0) {
      setActiveIndex(0);
    }

    // Auto-trigger automatic background removal & processing for all uploaded files immediately!
    setTimeout(() => {
      handleProcessAll(updatedList);
    }, 100);
  };

  const [isRotatingInline, setIsRotatingInline] = useState<boolean>(false);

  const handleRotateActive = async (target: number | 'left' | 'right') => {
    if (!activeItem || isRotatingInline) return;

    let newRotation = activeItem.rotation;
    if (typeof target === 'number') {
      newRotation = (Math.round(target) % 360 + 360) % 360;
    } else {
      const delta = target === 'left' ? -90 : 90;
      newRotation = (activeItem.rotation + delta + 360) % 360;
    }

    const updatedItem: BatchImageItem = {
      ...activeItem,
      rotation: newRotation,
    };

    // Update rotation state immediately in UI
    setItems((prev) =>
      prev.map((it, idx) => (idx === activeIndex ? updatedItem : it))
    );

    try {
      setIsRotatingInline(true);
      const result = await processSingleItem(updatedItem);
      setItems((prev) =>
        prev.map((it, idx) =>
          idx === activeIndex
            ? { ...updatedItem, status: 'complete', result }
            : it
        )
      );
    } catch (err: any) {
      setProcessingError(err.message);
    } finally {
      setIsRotatingInline(false);
    }
  };

  const handleRemoveItem = (indexToRemove: number) => {
    const target = items[indexToRemove];
    if (target && target.originalUrl && target.originalUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(target.originalUrl);
      } catch {
        // Safe memory release
      }
    }

    setItems((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (activeIndex >= indexToRemove && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const handleReset = () => {
    items.forEach((item) => {
      if (item.originalUrl && item.originalUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(item.originalUrl);
        } catch {
          // Safe memory release
        }
      }
    });
    setItems([]);
    setActiveIndex(0);
    setProcessingError(null);
    setProcessingStage('idle');
  };

  const processSingleItem = async (item: BatchImageItem): Promise<ProcessedImageResult> => {
    const formData = new FormData();
    formData.append('file', item.file);
    formData.append('targetSizeKB', options.targetSizeKB.toString());
    formData.append('outputFormat', options.outputFormat);
    formData.append('removeBackground', options.removeBackground ? 'true' : 'false');
    formData.append('backgroundType', options.backgroundType);
    if (options.customBackgroundColor) {
      formData.append('customBackgroundColor', options.customBackgroundColor);
    }

    formData.append('resizeMode', options.resize.mode);
    if (options.resize.customWidth) {
      formData.append('customWidth', options.resize.customWidth.toString());
    }
    if (options.resize.customHeight) {
      formData.append('customHeight', options.resize.customHeight.toString());
    }
    formData.append('lockAspectRatio', options.resize.lockAspectRatio ? 'true' : 'false');
    formData.append('rotation', item.rotation.toString());

    const response = await fetch('/api/image/process', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || `Failed to process image "${item.file.name}".`);
    }

    return {
      id: item.id,
      original: data.original,
      originalDataUrl: item.originalUrl,
      processedDataUrl: data.processedDataUrl,
      processedSize: data.processed.size,
      processedWidth: data.processed.width,
      processedHeight: data.processed.height,
      processedFormat: data.processed.format,
      mimeType: data.processed.mimeType,
      quality: data.quality,
      backgroundRemoved: data.backgroundRemoved,
      processingTimeMs: data.processingTimeMs,
    };
  };

  const handleProcessAll = async (listToProcess?: BatchImageItem[]) => {
    const targetItems = listToProcess && listToProcess.length > 0 ? listToProcess : items;
    if (targetItems.length === 0) return;

    setProcessingError(null);
    setProcessingStage('uploading');
    setStageMessage(`Uploading ${targetItems.length} ${targetItems.length === 1 ? 'image' : 'images'}...`);

    const updatedItems = [...targetItems];

    for (let i = 0; i < updatedItems.length; i++) {
      const item = updatedItems[i];
      setStageMessage(`Processing image ${i + 1} of ${updatedItems.length}: ${item.file.name}...`);
      setProcessingStage(options.removeBackground ? 'removing_bg' : 'compressing');

      try {
        const result = await processSingleItem(item);
        updatedItems[i] = {
          ...item,
          status: 'complete',
          result,
        };
        setItems([...updatedItems]);
      } catch (err: any) {
        updatedItems[i] = {
          ...item,
          status: 'error',
          errorMessage: err.message,
        };
        setItems([...updatedItems]);
      }
    }

    setProcessingStage('finalizing');
    setStageMessage('Finalizing batch outputs...');

    setTimeout(() => {
      setProcessingStage('complete');
    }, 400);
  };

  // Compile processed PDF preview items
  const compiledPdfPreviewItems: PdfPreviewItem[] = items
    .filter((it) => it.result)
    .map((it) => ({
      dataUrl: it.result!.processedDataUrl,
      width: it.result!.processedWidth,
      height: it.result!.processedHeight,
      name: it.file.name,
    }));

  const handleOptionsChange = (updated: ProcessingOptions) => {
    setOptions(updated);
    if (activeItem && updated.rotation !== undefined && updated.rotation !== activeItem.rotation) {
      handleRotateActive(updated.rotation);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* 1. UPLOAD VIEW (When no files selected) */}
      {items.length === 0 && (
        <div className="space-y-6">
          <ImageUploader onFilesSelected={handleFilesSelected} maxSizeMB={25} />
        </div>
      )}

      {/* 2. BATCH EDITOR WORKSPACE VIEW */}
      {items.length > 0 && activeItem && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Top Bar Navigation & Batch Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Clear All
              </button>

              <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 cursor-pointer transition-colors">
                <Plus className="w-4 h-4" />
                Add More Images
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
                  onChange={(e) => {
                    if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* Rotation & PDF Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Rotation buttons */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => handleRotateActive('left')}
                  className="p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                  title="Rotate Left 90°"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-bold px-1 text-slate-500">
                  {activeItem.rotation}°
                </span>
                <button
                  type="button"
                  onClick={() => handleRotateActive('right')}
                  className="p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                  title="Rotate Right 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              {/* Multi-Page PDF Download Trigger */}
              {compiledPdfPreviewItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download Batch PDF ({compiledPdfPreviewItems.length} Pages)</span>
                </button>
              )}
            </div>
          </div>

          {/* BATCH THUMBNAIL STRIP SELECTOR */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {items.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setActiveIndex(idx)}
                className={`relative flex-shrink-0 cursor-pointer rounded-2xl border-2 p-1.5 transition-all w-28 group ${
                  idx === activeIndex
                    ? 'border-brand-500 bg-brand-500/10 shadow-lg scale-105'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="relative h-16 w-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center">
                  <img
                    src={item.result ? item.result.processedDataUrl : item.originalUrl}
                    alt={item.file.name}
                    className="max-h-full max-w-full object-contain transition-transform"
                    style={{ transform: `rotate(${item.rotation}deg)` }}
                  />

                  {/* Status Badge */}
                  {item.status === 'complete' && (
                    <div className="absolute top-1 right-1 p-0.5 rounded-full bg-emerald-500 text-white">
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-1.5 px-1">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[65px]">
                    #{idx + 1} {item.file.name}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveItem(idx);
                    }}
                    className="text-slate-400 hover:text-red-500 p-0.5"
                    title="Remove Image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* User Error Banner */}
          {processingError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 flex items-start gap-3 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Processing Error</p>
                <p className="text-xs mt-0.5">{processingError}</p>
              </div>
            </div>
          )}

          {/* Dual Grid Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Interactive Image Preview / Result View (7 Columns) */}
            <div className="lg:col-span-7 space-y-6">
              {activeItem.result ? (
                <BeforeAfterPreview
                  originalUrl={activeItem.originalUrl}
                  processedUrl={activeItem.result.processedDataUrl}
                  result={activeItem.result}
                  rotation={activeItem.rotation}
                  onRotate={(newAngle) => handleRotateActive(newAngle)}
                  isRotating={isRotatingInline}
                />
              ) : (
                <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-2xl p-4 flex items-center justify-center min-h-[400px]">
                  <img
                    src={activeItem.originalUrl}
                    alt={activeItem.file.name}
                    className="max-h-[460px] max-w-full object-contain rounded-xl transition-transform duration-300"
                    style={{ transform: `rotate(${activeItem.rotation}deg)` }}
                  />
                  <div className="absolute top-4 left-4 bg-slate-950/80 text-white text-xs font-bold px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/10">
                    Preview #{activeIndex + 1}: {activeItem.file.name} ({activeItem.rotation}°)
                  </div>
                </div>
              )}

              {/* Action Toolbar Right Under Preview (Matching User Screenshot Layout) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-md">
                {/* Left side actions */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Clear All
                  </button>

                  <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 cursor-pointer transition-colors">
                    <Plus className="w-4 h-4" />
                    Add More Images
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
                      onChange={(e) => {
                        if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Right side rotation pill & PDF download */}
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {/* Compact Rotation Pill Control (matching screenshot) */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => handleRotateActive('left')}
                      disabled={processingStage !== 'idle' && processingStage !== 'complete'}
                      className="p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                      title="Rotate Left 90°"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <span className="text-[12px] font-extrabold px-2 text-slate-700 dark:text-slate-200">
                      {activeItem.rotation}°
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRotateActive('right')}
                      disabled={processingStage !== 'idle' && processingStage !== 'complete'}
                      className="p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                      title="Rotate Right 90°"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Multi-Page PDF Download Button */}
                  {compiledPdfPreviewItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsPdfModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Download Batch PDF ({compiledPdfPreviewItems.length} Pages)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Statistics & Download Card (when active item is complete) */}
              {activeItem.result && (
                <ResultCard
                  result={activeItem.result}
                  onOpenPdfModal={() => setIsPdfModalOpen(true)}
                  onReset={handleReset}
                />
              )}
            </div>

            {/* Right Column: Optimization Control Panel (5 Columns) */}
            <div className="lg:col-span-5 space-y-4">
              <OptimizationControls
                options={{ ...options, rotation: activeItem ? activeItem.rotation : (options.rotation || 0) }}
                onChange={handleOptionsChange}
                onProcess={() => handleProcessAll()}
                isProcessing={processingStage !== 'idle' && processingStage !== 'complete'}
              />

              {/* Batch Processing CTA Button */}
              {items.length > 1 && (
                <button
                  type="button"
                  disabled={processingStage !== 'idle' && processingStage !== 'complete'}
                  onClick={() => handleProcessAll()}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-brand-500 hover:from-emerald-500 hover:to-brand-400 text-white font-extrabold text-base shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Process All {items.length} Images</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. MULTI-STEP PROCESSING MODAL */}
      <ProcessingModal
        isOpen={processingStage !== 'idle' && processingStage !== 'complete'}
        stage={processingStage}
        message={stageMessage}
      />

      {/* 4. MULTI-PAGE PDF PREVIEW & GENERATION MODAL */}
      {compiledPdfPreviewItems.length > 0 && (
        <PdfPreviewModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          items={compiledPdfPreviewItems}
        />
      )}
    </div>
  );
}
