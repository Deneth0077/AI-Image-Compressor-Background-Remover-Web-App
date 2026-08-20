'use client';

import { ProcessingOptions, ImageFormat, BackgroundType, ResizeMode } from '@/types/image';
import { Layers, Sliders, Image as ImageIcon, Maximize2, Lock, Unlock, Palette, Sparkles, Check } from 'lucide-react';

interface OptimizationControlsProps {
  options: ProcessingOptions;
  onChange: (updated: ProcessingOptions) => void;
  onProcess: () => void;
  isProcessing: boolean;
}

export function OptimizationControls({
  options,
  onChange,
  onProcess,
  isProcessing,
}: OptimizationControlsProps) {
  const targetPresets = [
    { label: '100 KB', kb: 100 },
    { label: '250 KB', kb: 250 },
    { label: '500 KB', kb: 500 },
    { label: '750 KB', kb: 750 },
    { label: '1 MB', kb: 1024 },
    { label: '2 MB', kb: 2048 },
  ];

  const updateOption = <K extends keyof ProcessingOptions>(key: K, value: ProcessingOptions[K]) => {
    onChange({ ...options, [key]: value });
  };

  const updateResize = (partial: Partial<ProcessingOptions['resize']>) => {
    onChange({
      ...options,
      resize: { ...options.resize, ...partial },
    });
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-brand-500" />
          Optimization Settings
        </h3>
        <span className="text-xs text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-full font-semibold">
          AI Smart Compression
        </span>
      </div>

      {/* 1. BACKGROUND REMOVAL */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent-500" />
            AI Background Remover
          </label>
          {/* Toggle Switch */}
          <button
            type="button"
            onClick={() => updateOption('removeBackground', !options.removeBackground)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
              options.removeBackground ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                options.removeBackground ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Background Color Picker (Active when Background Removal is ON) */}
        {options.removeBackground && (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2 animate-in fade-in duration-300">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
              Result Background Color:
            </span>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => updateOption('backgroundType', 'transparent')}
                className={`flex items-center justify-center py-2 rounded-xl text-xs font-semibold border transition-all ${
                  options.backgroundType === 'transparent'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                }`}
              >
                Checkerboard
              </button>

              <button
                type="button"
                onClick={() => updateOption('backgroundType', 'white')}
                className={`flex items-center justify-center py-2 rounded-xl text-xs font-semibold border transition-all ${
                  options.backgroundType === 'white'
                    ? 'border-brand-500 bg-white text-slate-900 ring-2 ring-brand-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white text-slate-800'
                }`}
              >
                White
              </button>

              <button
                type="button"
                onClick={() => updateOption('backgroundType', 'black')}
                className={`flex items-center justify-center py-2 rounded-xl text-xs font-semibold border transition-all ${
                  options.backgroundType === 'black'
                    ? 'border-brand-500 bg-slate-950 text-white ring-2 ring-brand-500'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-950 text-slate-200'
                }`}
              >
                Black
              </button>

              <label
                className={`relative flex items-center justify-center py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all ${
                  options.backgroundType === 'custom'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Palette className="w-3.5 h-3.5 mr-1" />
                Custom
                <input
                  type="color"
                  value={options.customBackgroundColor || '#FFFFFF'}
                  onChange={(e) => {
                    updateOption('backgroundType', 'custom');
                    updateOption('customBackgroundColor', e.target.value);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 2. TARGET FILE SIZE PICKER */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-500" />
            Target File Size
          </label>
          <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
            {options.targetSizeKB >= 1024
              ? `${(options.targetSizeKB / 1024).toFixed(1)} MB`
              : `${options.targetSizeKB} KB`}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {targetPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => updateOption('targetSizeKB', preset.kb)}
              className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                options.targetSizeKB === preset.kb
                  ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-2 ring-brand-500/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom Target Size Slider & Input */}
        <div className="flex items-center gap-3 pt-1">
          <input
            type="range"
            min={50}
            max={5120}
            step={25}
            value={options.targetSizeKB}
            onChange={(e) => updateOption('targetSizeKB', Number(e.target.value))}
            className="w-full accent-brand-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
          />
          <div className="flex items-center gap-1 min-w-[90px]">
            <input
              type="number"
              min={10}
              max={25000}
              value={options.targetSizeKB}
              onChange={(e) => updateOption('targetSizeKB', Math.max(10, Number(e.target.value)))}
              className="w-16 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            <span className="text-xs text-slate-500 font-semibold">KB</span>
          </div>
        </div>
      </div>

      {/* 3. OUTPUT FORMAT SELECTOR */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-emerald-500" />
          Output Format
        </label>

        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'auto', name: 'Auto (WebP)' },
            { id: 'webp', name: 'WebP' },
            { id: 'jpeg', name: 'JPG' },
            { id: 'png', name: 'PNG' },
          ].map((fmt) => (
            <button
              key={fmt.id}
              type="button"
              onClick={() => updateOption('outputFormat', fmt.id as ImageFormat)}
              className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                options.outputFormat === fmt.id
                  ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-2 ring-brand-500/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              {fmt.name}
            </button>
          ))}
        </div>
      </div>

      {/* 4. RESIZE OPTIONS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-purple-500" />
            Resize Scale
          </label>

          <button
            type="button"
            onClick={() => updateResize({ lockAspectRatio: !options.resize.lockAspectRatio })}
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
              options.resize.lockAspectRatio
                ? 'border-brand-500/40 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                : 'border-slate-300 dark:border-slate-700 text-slate-500'
            }`}
          >
            {options.resize.lockAspectRatio ? (
              <>
                <Lock className="w-3 h-3" /> Lock Aspect Ratio
              </>
            ) : (
              <>
                <Unlock className="w-3 h-3" /> Unlock Ratio
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'original', name: 'Original (100%)' },
            { id: '75', name: '75%' },
            { id: '50', name: '50%' },
            { id: '25', name: '25%' },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => updateResize({ mode: r.id as ResizeMode })}
              className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                options.resize.mode === r.id
                  ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-2 ring-brand-500/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>

      {/* 5. IMAGE ROTATION ANGLE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            Rotate Image Angle
          </label>
          <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
            {options.rotation || 0}°
          </span>
        </div>

        {/* Quick Angle Presets */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { angle: 0, label: '0° (Upright)' },
            { angle: 90, label: '90° (Right)' },
            { angle: 180, label: '180° (Flip)' },
            { angle: 270, label: '270° (Left)' },
          ].map((item) => (
            <button
              key={item.angle}
              type="button"
              onClick={() => updateOption('rotation', item.angle)}
              className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                (options.rotation || 0) === item.angle
                  ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-2 ring-brand-500/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom Angle Range Slider */}
        <div className="flex items-center gap-3 pt-1">
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={options.rotation || 0}
            onChange={(e) => updateOption('rotation', Number(e.target.value))}
            className="w-full accent-brand-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
          />
          <div className="flex items-center gap-1 min-w-[70px]">
            <input
              type="number"
              min={0}
              max={360}
              value={options.rotation || 0}
              onChange={(e) => updateOption('rotation', (Number(e.target.value) % 360 + 360) % 360)}
              className="w-14 px-1.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            <span className="text-xs text-slate-500 font-semibold">°</span>
          </div>
        </div>
      </div>

      {/* PROCESS IMAGE PRIMARY BUTTON */}
      <button
        type="button"
        disabled={isProcessing}
        onClick={onProcess}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500 hover:from-brand-500 hover:to-accent-400 text-white font-extrabold text-base shadow-xl shadow-brand-500/25 hover:shadow-brand-500/40 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group transform active:scale-[0.99]"
      >
        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        <span>{isProcessing ? 'Processing Image...' : 'Process Image'}</span>
      </button>
    </div>
  );
}
