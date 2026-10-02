import React from 'react';
import { Camera, Check, CheckCircle2, FileText, Printer } from 'lucide-react';
import { Badge } from './ui/badge';

export type WorkflowStep = 'scan' | 'editor' | 'preview';

interface StepProgressBarProps {
  currentStep: WorkflowStep;
  onStepClick: (step: WorkflowStep) => void;
  itemCount: number;
  invoiceNumber: string;
}

export const StepProgressBar: React.FC<StepProgressBarProps> = ({
  currentStep,
  onStepClick,
  itemCount,
  invoiceNumber,
}) => {
  const steps: { id: WorkflowStep; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    {
      id: 'scan',
      label: '1. Numérisation & Reçus',
      shortLabel: '1. Scan BC',
      icon: <Camera className="w-3.5 h-3.5" />,
    },
    {
      id: 'editor',
      label: '2. Vérification & Lignes BC',
      shortLabel: '2. Vérification',
      icon: <FileText className="w-3.5 h-3.5" />,
    },
    {
      id: 'preview',
      label: '3. Facture A4 & Édition',
      shortLabel: '3. Facture A4',
      icon: <Printer className="w-3.5 h-3.5" />,
    },
  ];

  const getStepIndex = (step: WorkflowStep) => {
    switch (step) {
      case 'scan':
        return 0;
      case 'editor':
        return 1;
      case 'preview':
        return 2;
    }
  };

  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="w-full bg-white border-b border-slate-200 px-3 py-2 sm:px-4 no-print select-none shadow-xs">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        {/* Step Progression Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1">
          {steps.map((step, idx) => {
            const isActive = currentStep === step.id;
            const isCompleted = idx < currentIndex;

            return (
              <React.Fragment key={step.id}>
                {idx > 0 && (
                  <div
                    className={`h-0.5 w-3 sm:w-6 rounded-full transition-colors ${
                      idx <= currentIndex ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  />
                )}
                <button
                  type="button"
                  onClick={() => onStepClick(step.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[38px] ${
                    isActive
                      ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-xs'
                      : isCompleted
                      ? 'text-slate-700 hover:bg-slate-100'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                  </span>
                  <span className="hidden md:inline font-semibold">{step.label}</span>
                  <span className="inline md:hidden font-semibold">{step.shortLabel}</span>

                  {step.id === 'editor' && itemCount > 0 && (
                    <Badge variant="primary" className="ml-1 px-1.5 py-0 text-[10px] font-mono">
                      {itemCount} BC{itemCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Invoice reference indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-mono">
          <span className="text-slate-400">Réf :</span>
          <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {invoiceNumber}
          </span>
        </div>
      </div>
    </div>
  );
};
