'use client';

import { Sparkles, ArrowDown, Shield, Zap, Image as ImageIcon } from 'lucide-react';

interface HeroSectionProps {
  onUploadClick: () => void;
}

export function HeroSection({ onUploadClick }: HeroSectionProps) {
  return (
    <div className="relative overflow-hidden pt-12 pb-8 md:pt-16 md:pb-12 text-center">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-brand-500/20 to-accent-500/20 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Hero Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 dark:bg-brand-400/10 border border-brand-500/20 text-brand-600 dark:text-brand-300 text-xs font-semibold mb-6 animate-pulse-subtle">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Next-Gen Smart Target Compression & AI Background Removal</span>
      </div>

      {/* Main Heading */}
      <h1 className="max-w-4xl mx-auto text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
        Compress Images{' '}
        <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500 dark:from-brand-300 dark:via-brand-400 dark:to-accent-400 bg-clip-text text-transparent">
          Without Losing Their Look.
        </span>
      </h1>

      {/* Subtitle */}
      <p className="max-w-2xl mx-auto mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
        Remove backgrounds, resize images, and reduce file size intelligently — all in one place. Target exact file sizes like <span className="font-semibold text-brand-600 dark:text-brand-400">1 MB</span> while preserving maximum visual quality.
      </p>

      {/* Primary CTA & Secondary Info */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          type="button"
          onClick={onUploadClick}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-base shadow-xl shadow-brand-500/25 hover:shadow-brand-500/40 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
        >
          <ImageIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>Upload Image</span>
          <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
        </button>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Fast</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Private</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span>High Quality</span>
          </div>
        </div>
      </div>
    </div>
  );
}
