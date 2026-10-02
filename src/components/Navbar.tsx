import React from 'react';
import { Sparkles, Database, Settings, History, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

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
    <nav className="h-16 bg-white/95 border-b border-slate-200/90 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40 select-none pt-safe">
      {/* Brand & Newspaper Identity */}
      <div className="flex items-center gap-3">
        <div
          className="relative group cursor-pointer flex items-center"
          onClick={onNewInvoice}
          title="Accueil / Nouvelle Facture"
        >
          <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shadow-xs">
            <img
              src="/assets/alaane-logo.png"
              alt="Alaane Logo"
              className="w-7 h-7 object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm lg:text-base tracking-tight text-slate-900 flex items-center gap-2">
              Journal Alaane
              <span className="text-[11px] px-2 py-0.5 rounded font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                جريدة الآن
              </span>
            </h1>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 hidden sm:inline">
              Facturation ANEP
            </span>
          </div>
          <p className="text-[11px] text-slate-500 hidden md:block">
            Système d'automatisation des Bons de Commande & Factures Légales (Décret 05-468)
          </p>
        </div>
      </div>

      {/* Connectivity Status Badges */}
      <div className="hidden xl:flex items-center gap-2 text-xs">
        <div
          onClick={onOpenSettings}
          className="cursor-pointer"
          title="Cliquez pour configurer la clé Gemini"
        >
          <Badge
            variant={hasGeminiKey ? 'success' : 'warning'}
            className="cursor-pointer hover:opacity-90"
          >
            <Sparkles className="w-3 h-3 stroke-[2px]" />
            <span>Gemini 3.8 Flash : {hasGeminiKey ? 'Actif' : 'Clé requise'}</span>
            {hasGeminiKey ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            ) : (
              <AlertCircle className="w-3 h-3 text-amber-600" />
            )}
          </Badge>
        </div>

        <div
          onClick={onOpenSettings}
          className="cursor-pointer"
          title="Cliquez pour configurer Supabase"
        >
          <Badge
            variant={isSupabaseOnline ? 'primary' : 'secondary'}
            className="cursor-pointer hover:opacity-90"
          >
            <Database className="w-3 h-3 stroke-[2px]" />
            <span>{isSupabaseOnline ? 'Supabase Cloud' : 'Mode Local'}</span>
          </Badge>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onLoadSample}
          className="hidden sm:inline-flex"
          title="Charger un exemple réel de Bon de Commande ANEP"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Exemple ANEP</span>
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onNewInvoice}
          className="font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nouvelle</span>
        </Button>

        <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenHistory}
          className="hidden lg:inline-flex relative"
        >
          <History className="w-3.5 h-3.5 text-slate-500" />
          <span>Historique</span>
          {invoiceCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-blue-50 text-blue-700 font-bold border border-blue-200">
              {invoiceCount}
            </span>
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onOpenSettings}
          title="Paramètres API & Éditeur"
          aria-label="Paramètres"
        >
          <Settings className="w-4 h-4 text-slate-600" />
        </Button>
      </div>
    </nav>
  );
};
