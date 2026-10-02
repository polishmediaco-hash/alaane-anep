import React from 'react';
import { FileText, Sparkles, Database, Settings, History, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';

interface NavbarProps {
  hasGeminiKey: boolean;
  isSupabaseOnline: boolean;
  invoiceCount: number;
  onNewInvoice: () => void;
  onLoadSample: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  hasGeminiKey,
  isSupabaseOnline,
  invoiceCount,
  onNewInvoice,
  onLoadSample,
  onOpenHistory,
  onOpenSettings,
}) => {
  return (
    <nav className="h-16 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Brand & Newspaper Identity */}
      <div className="flex items-center gap-3">
        <div className="relative group cursor-pointer" onClick={onNewInvoice}>
          <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center overflow-hidden shadow-sm">
            <img
              src="/assets/alaane-logo.png"
              alt="Alaane Logo"
              className="w-8 h-8 object-contain"
              onError={(e) => {
                // Fallback to text icon if logo fails
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base lg:text-lg tracking-tight text-white flex items-center gap-2">
              Journal Alaane
              <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                جريدة الآن
              </span>
            </h1>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:inline">
              Facturation ANEP
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono hidden md:block">
            Système d'automatisation des Bons de Commande & Factures Légales (Décret 05-468)
          </p>
        </div>
      </div>

      {/* Connectivity Status Badges */}
      <div className="hidden xl:flex items-center gap-2 text-xs">
        {/* Gemini Vision Status */}
        <div
          onClick={onOpenSettings}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
            hasGeminiKey
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/60'
              : 'bg-amber-950/60 text-amber-300 border-amber-500/30 hover:bg-amber-900/60'
          }`}
          title="Cliquez pour configurer la clé Gemini"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="font-medium">
            Gemini 3.8 Flash : {hasGeminiKey ? 'Actif' : 'Clé requise'}
          </span>
          {hasGeminiKey ? (
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          ) : (
            <AlertCircle className="w-3 h-3 text-amber-400" />
          )}
        </div>

        {/* Supabase Status */}
        <div
          onClick={onOpenSettings}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
            isSupabaseOnline
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/60'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
          }`}
          title="Cliquez pour configurer Supabase"
        >
          <Database className="w-3.5 h-3.5" />
          <span>{isSupabaseOnline ? 'Supabase Connecté' : 'Mode Local'}</span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onLoadSample}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-lg transition-all shadow-sm"
          title="Charger un exemple réel de Bon de Commande ANEP"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Exemple ANEP</span>
        </button>

        <button
          onClick={onNewInvoice}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-lg transition-all shadow-sm shadow-emerald-900/20"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Nouvelle</span>
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        <button
          onClick={onOpenHistory}
          className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-all"
        >
          <History className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Historique</span>
          {invoiceCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-700 text-emerald-400 font-bold border border-slate-600">
              {invoiceCount}
            </span>
          )}
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 rounded-lg transition-all"
          title="Paramètres API & Éditeur"
          aria-label="Paramètres"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};
