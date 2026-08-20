import { ShieldCheck, Zap, Award } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-950/50 py-8 mt-16 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b border-slate-200/60 dark:border-slate-800/60 mb-6">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/40">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-500">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Smart Compression</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Binary-search optimization to hit target sizes without quality drop.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/40">
            <div className="p-2.5 rounded-xl bg-accent-500/10 text-accent-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">100% Private Processing</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Your images are processed securely and deleted immediately.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/40">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Lossless Visual Integrity</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Honest visual scoring & alpha transparency preservation.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} PixelShrink AI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">API Integration</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
