export type ProcessingStage =
  | 'idle'
  | 'uploading'
  | 'analyzing'
  | 'removing_bg'
  | 'resizing'
  | 'compressing'
  | 'finalizing'
  | 'complete'
  | 'error';

export interface ProcessingState {
  stage: ProcessingStage;
  progress: number; // 0 - 100
  message: string;
  error?: string;
}
