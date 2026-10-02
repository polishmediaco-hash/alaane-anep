import React from 'react';
import {
  Sparkles,
  Settings,
  History,
  Plus,
  Printer,
  Camera,
  FileText,
  Eye,
} from 'lucide-react';
import { Button } from './ui/button';

export type WorkflowStep = 'scan' | 'editor' | 'preview';

interface NavbarProps {
  currentStep: WorkflowStep;
  onStepChange: (step: WorkflowStep) => void;
  invoiceCount: number;
  bcCount: number;
  totalTtc: number;
  onNewInvoice: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenChat: () => void;
  onPrint: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStep,
  onStepChange,
  invoiceCount,
  bcCount,
  totalTtc,
  onNewInvoice,
  onOpenHistory,
  onOpenSettings,
  onOpenChat,
  onPrint,
}) => {
  return (
    <nav className="h-[52px] bg-white border-b border-slate-200/90 px-3 lg:px-5 flex items-center justify-between sticky top-0 z-40 select-none pt-safe shrink-0 shadow-2xs">
      {/* Brand & Newspaper Identity */}
      <div className="flex items-center gap-2.5">
        <div
          className="relative flex items-center cursor-pointer"
          onClick={onNewInvoice}
          title="Journal Alaane — Nouvelle Facture"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
            <img
              src="/assets/alaane-logo.png"
              alt="Alaane Logo"
              className="w-6 h-6 object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white" />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-xs lg:text-sm tracking-tight text-slate-900">
            Journal Alaane
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200 hidden sm:inline">
            جريدة الآن
          </span>
          <span className="text-slate-300 hidden md:inline">|</span>
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase hidden md:inline">
            Facturation ANEP
          </span>
        </div>
      </div>

      {/* Center: Sleek Segmented Workflow Step Switcher (Desktop Only) */}
      <div className="hidden lg:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
        <button
          type="button"
          onClick={() => onStepChange('scan')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            currentStep === 'scan'
              ? 'bg-white text-slate-900 shadow-2xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Camera className="w-3.5 h-3.5 text-slate-600" />
          <span>1. Numérisation</span>
        </button>

        <button
          type="button"
          onClick={() => onStepChange('editor')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            currentStep === 'editor'
              ? 'bg-white text-slate-900 shadow-2xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-slate-600" />
          <span>2. Facturation ({bcCount} BC)</span>
        </button>

        <button
          type="button"
          onClick={() => onStepChange('preview')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            currentStep === 'preview'
              ? 'bg-white text-slate-900 shadow-2xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-slate-600" />
          <span>3. Aperçu A4</span>
        </button>
      </div>

      {/* Right Action Group */}
      <div className="flex items-center gap-2">
        {/* Live Net TTC Pill */}
        {totalTtc > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono text-xs">
            <span className="text-[10px] text-slate-500 font-medium uppercase">TTC:</span>
            <span className="font-bold text-slate-900">
              {totalTtc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
            </span>
          </div>
        )}

        {/* AI Assistant Chat Trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenChat}
          className="text-xs h-8 px-2.5 gap-1.5 border-slate-200 text-slate-800 bg-white hover:bg-slate-50 hover:border-slate-300"
          title="Ouvrir l'Assistant IA Journal Alaane"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline font-medium">Assistant IA</span>
        </Button>

        {/* New Invoice Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onNewInvoice}
          className="text-xs h-8 px-2.5 hidden sm:inline-flex"
          title="Créer une nouvelle facture"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>Nouvelle</span>
        </Button>

        {/* Print Button (Primary CTA) */}
        <Button
          variant="default"
          size="sm"
          onClick={onPrint}
          className="text-xs h-8 px-3 font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-2xs"
          title="Imprimer la facture au format A4"
        >
          <Printer className="w-3.5 h-3.5 mr-1" />
          <span className="hidden md:inline">Imprimer A4</span>
          <span className="inline md:hidden">Imprimer</span>
        </Button>

        <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />

        {/* History Button */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onOpenHistory}
          className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative"
          title={`Historique (${invoiceCount} factures)`}
          aria-label="Historique"
        >
          <History className="w-4 h-4" />
          {invoiceCount > 0 && (
            <span className="absolute 1 top-1 right-1 w-2 h-2 rounded-full bg-slate-900" />
          )}
        </Button>

        {/* Settings Button (Pure Publisher Profile) */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onOpenSettings}
          className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          title="Paramètres de l'Éditeur & Identité Journal Alaane"
          aria-label="Paramètres"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </nav>
  );
};
