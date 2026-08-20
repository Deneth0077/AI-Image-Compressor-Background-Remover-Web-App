'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { UploadCloud, Image as ImageIcon, AlertCircle, FileType, Sparkles } from 'lucide-react';
import { formatBytes } from '@/lib/utils/file-size';

interface ImageUploaderProps {
  onFilesSelected: (files: File[]) => void;
  maxSizeMB?: number;
}

export function ImageUploader({ onFilesSelected, maxSizeMB = 25 }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSelectFiles = (filesList: FileList | File[]) => {
    setErrorMessage(null);
    const validFiles: File[] = [];
    const maxBytes = maxSizeMB * 1024 * 1024;
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'avif'];

    const filesArray = Array.from(filesList);

    if (filesArray.length === 0) return;

    for (const file of filesArray) {
      if (file.size > maxBytes) {
        setErrorMessage(
          `File "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed limit of ${maxSizeMB} MB.`
        );
        return;
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!file.type.startsWith('image/') && !validExtensions.includes(ext)) {
        setErrorMessage(`Unsupported format for "${file.name}". Please upload JPG, PNG, WebP, GIF, or HEIC files.`);
        return;
      }

      validFiles.push(file);
    }

    onFilesSelected(validFiles);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelectFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelectFiles(e.target.files);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-6">
      {/* Upload Box Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-300 p-8 sm:p-12 text-center group ${
          isDragging
            ? 'border-brand-500 bg-brand-500/10 scale-[1.01] shadow-2xl shadow-brand-500/20'
            : 'border-slate-300 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/70 hover:border-brand-400 dark:hover:border-brand-500/80 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 shadow-xl shadow-slate-900/5'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif"
          onChange={handleFileChange}
          className="hidden"
          id="image-upload-input"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Animated Icon Container */}
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-500/20 via-brand-400/20 to-accent-500/20 dark:from-brand-500/30 dark:to-accent-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <UploadCloud className="w-10 h-10 text-brand-600 dark:text-brand-400 group-hover:-translate-y-1 transition-transform duration-300" />
            </div>
            <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-accent-500 text-white shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Prompt text */}
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              Drag & Drop Images Here (Batch Upload 1–10+ Images)
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              or <span className="font-semibold text-brand-600 dark:text-brand-400 underline underline-offset-4">browse multiple files</span> from your computer
            </p>
          </div>

          {/* Supported format pill list */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {['JPG', 'PNG', 'WEBP', 'GIF', 'HEIC'].map((format) => (
              <span
                key={format}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80"
              >
                {format}
              </span>
            ))}
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium ml-1">
              • Max {maxSizeMB} MB
            </span>
          </div>
        </div>
      </div>

      {/* Error Toast / Alert Box */}
      {errorMessage && (
        <div className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Upload Validation Error</p>
            <p className="text-xs mt-0.5 opacity-90">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
