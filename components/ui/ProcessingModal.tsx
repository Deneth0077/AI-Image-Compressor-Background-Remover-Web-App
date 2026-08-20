'use client';

import { Loader2, CheckCircle2, Sparkles, Layers, Image as ImageIcon, Sliders } from 'lucide-react';
import { ProcessingStage } from '@/types/processing';

interface ProcessingModalProps {
  isOpen: boolean;
  stage: ProcessingStage;
  message: string;
}

export function ProcessingModal({ isOpen, stage, message }: ProcessingModalProps) {
  if (!isOpen || stage === 'idle' || stage === 'complete') return null;

  const steps: { stage: ProcessingStage; label: string; icon: any }[] = [
    { stage: 'uploading', label: 'Uploading image...', icon: ImageIcon },
    { stage: 'analyzing', label: 'Analyzing image metadata...', icon: Sparkles },
    { stage: 'removing_bg', label: 'Removing background...', icon: Layers },
    { stage: 'resizing', label: 'Optimizing dimensions...', icon: Sliders },
    { stage: 'compressing', label: 'Smart compressing target size...', icon: Sparkles },
    { stage: 'finalizing', label: 'Generating final output...', icon: CheckCircle2 },
  ];

  const getStepStatus = (stepStage: ProcessingStage) => {
    const stageOrder: ProcessingStage[] = [
      'uploading',
      'analyzing',
      'removing_bg',
      'resizing',
      'compressing',
      'finalizing',
      'complete',
    ];

    const currentIndex = stageOrder.indexOf(stage);
    const stepIndex = stageOrder.indexOf(stepStage);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        {/* Animated Spinner Icon */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-500/20 to-accent-500/20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>

        <div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Processing Image...
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Applying intelligent compression & AI optimization
          </p>
        </div>

        {/* Step-by-Step Progress Timeline */}
        <div className="space-y-3 text-left bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
          {steps.map((step) => {
            const status = getStepStatus(step.stage);
            const Icon = step.icon;

            return (
              <div key={step.stage} className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${
                    status === 'completed'
                      ? 'bg-emerald-500 text-white'
                      : status === 'active'
                      ? 'bg-brand-500 text-white animate-pulse'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}
                >
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : status === 'active' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                  )}
                </div>

                <span
                  className={`text-xs font-semibold ${
                    status === 'active'
                      ? 'text-brand-600 dark:text-brand-400 font-bold'
                      : status === 'completed'
                      ? 'text-slate-700 dark:text-slate-300'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
