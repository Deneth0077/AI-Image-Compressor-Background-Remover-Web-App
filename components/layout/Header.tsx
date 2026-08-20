'use client';

import { ThemeToggle } from '../ui/ThemeToggle';
import { Sparkles, Layers, Image as ImageIcon, FileText } from 'lucide-react';

interface HeaderProps {
  onSelectTab?: (tab: string) => void;
}

export function Header({ onSelectTab }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab?.('compress')}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/20 ring-1 ring-white/20">
            <Sparkles className="w-5 h-5 text-white animate-pulse-subtle" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-brand-600 to-accent-600 dark:from-white dark:via-brand-300 dark:to-accent-400 bg-clip-text text-transparent">
              PixelShrink AI
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              PRO
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
          <button
            type="button"
            onClick={() => onSelectTab?.('compress')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200"
          >
            <ImageIcon className="w-4 h-4 text-brand-500" />
            Compress & Resize
          </button>
          <button
            type="button"
            onClick={() => onSelectTab?.('bg-remover')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200"
          >
            <Layers className="w-4 h-4 text-accent-500" />
            Background Remover
          </button>
          <button
            type="button"
            onClick={() => onSelectTab?.('pdf')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200"
          >
            <FileText className="w-4 h-4 text-emerald-500" />
            Image to PDF
          </button>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
