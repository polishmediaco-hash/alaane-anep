import React from 'react';
import { Invoice, InvoiceStatus } from '../types/invoice';
import { formatLegalClause } from '../lib/numberToWordsFr';
import {
  FileText,
  Calendar,
  Layers,
  Calculator,
  Save,
  Printer,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';

interface InvoiceEditorProps {
  invoice: Invoice;
  onChange: (updated: Invoice) => void;
  onSave: () => void;
  onPrint: () => void;
  isSaving: boolean;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  invoice,
  onChange,
  onSave,
  onPrint,
  isSaving,
}) => {
  // Reactive calculation when HT or TVA rate changes
  const handleAmountHtChange = (value: number) => {
    const amountHt = isNaN(value) ? 0 : Math.max(0, value);
    const tvaAmount = Math.round(amountHt * (invoice.tva_rate / 100) * 100) / 100;
    const amountTtc = Math.round((amountHt + tvaAmount) * 100) / 100;
    const words = formatLegalClause(amountTtc);

    onChange({
      ...invoice,
      amount_ht: amountHt,
      tva_amount: tvaAmount,
      amount_ttc: amountTtc,
      amount_ttc_words: words,
    });
  };

  const handleTvaRateChange = (rate: number) => {
    const tvaRate = isNaN(rate) ? 0 : Math.max(0, rate);
    const tvaAmount = Math.round(invoice.amount_ht * (tvaRate / 100) * 100) / 100;
    const amountTtc = Math.round((invoice.amount_ht + tvaAmount) * 100) / 100;
    const words = formatLegalClause(amountTtc);

    onChange({
      ...invoice,
      tva_rate: tvaRate,
      tva_amount: tvaAmount,
      amount_ttc: amountTtc,
      amount_ttc_words: words,
    });
  };

  // Pre-flight validation checks to prevent ANEP invoice rejection
  const validationErrors: string[] = [];
  if (!invoice.anep_bc_number || invoice.anep_bc_number.trim().length < 4) {
    validationErrors.push("Numéro Bon de Commande ANEP manquant ou incomplet.");
  }
  if (!invoice.amount_ht || invoice.amount_ht <= 0) {
    validationErrors.push("Montant Hors Taxes (HT) doit être supérieur à 0.");
  }
  if (!invoice.ad_title || invoice.ad_title.trim().length < 3) {
    validationErrors.push("Objet / Titre de l'annonce requis.");
  }
  if (!invoice.publication_date) {
    validationErrors.push("Date de parution requise pour le rapprochement comptable.");
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-y-auto">
      {/* Action Header */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Édition de la Facture Commerciale</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Conforme aux normes ANEP et au Décret exécutif n° 05-468
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
          >
            <Save className="w-3.5 h-3.5 text-slate-400" />
            <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>

          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950 transition-all active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer (A4)</span>
          </button>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-6 flex-1">
        {/* Anti-Rejection Checklist Alert */}
        {validationErrors.length > 0 ? (
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Points de vigilance ANEP à compléter :</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-200/90 text-[11px]">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium text-[11px]">
              Dossier conforme aux critères d'acceptation ANEP (Matricule, calculs fiscaux et arrêté en lettres valides).
            </span>
          </div>
        )}

        {/* Section 1: Références de Facturation & ANEP */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>1. Références de Facturation & Ordre ANEP</span>
            </h3>
            {/* Status Selector */}
            <div className="flex items-center gap-1">
              {(['brouillon', 'emise', 'payee'] as InvoiceStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => onChange({ ...invoice, status: st })}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                    invoice.status === st
                      ? st === 'payee'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : st === 'emise'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'bg-slate-700 text-slate-300'
                      : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                N° de Facture Journal (Unique)
              </label>
              <input
                type="text"
                value={invoice.invoice_number}
                onChange={(e) => onChange({ ...invoice, invoice_number: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                placeholder="FAC-2026-0001"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Date de Facturation
              </label>
              <input
                type="text"
                value={invoice.invoice_date}
                onChange={(e) => onChange({ ...invoice, invoice_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                placeholder="JJ/MM/AAAA"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-emerald-400 mb-1">
                N° Bon de Commande / Matricule ANEP *
              </label>
              <input
                type="text"
                value={invoice.anep_bc_number}
                onChange={(e) => onChange({ ...invoice, anep_bc_number: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold focus:outline-none focus:border-emerald-400"
                placeholder="ex. 2416008452 / DEP-REGIE-CENTRE"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Date du Bon de Commande ANEP
              </label>
              <input
                type="text"
                value={invoice.anep_bc_date}
                onChange={(e) => onChange({ ...invoice, anep_bc_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                placeholder="JJ/MM/AAAA"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Détails de l'Insertion et Parution */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/80 pb-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>2. Spécifications de l'Annonce Publicitaire</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Objet / Titre de l'Annonce (Appel d'Offres, Communiqué, Mise en demeure...)
              </label>
              <textarea
                rows={2}
                value={invoice.ad_title}
                onChange={(e) => onChange({ ...invoice, ad_title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 leading-relaxed"
                placeholder="Intitulé exact de l'annonce telle que spécifiée sur le bon de commande..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Format / Module (Col x Ht)
                </label>
                <input
                  type="text"
                  value={invoice.ad_format}
                  onChange={(e) => onChange({ ...invoice, ad_format: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="ex. 4 col x 18 cm (1/2 page)"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Date de Parution au Journal
                </label>
                <input
                  type="text"
                  value={invoice.publication_date}
                  onChange={(e) => onChange({ ...invoice, publication_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="Édition du JJ/MM/AAAA"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  N° Édition du Journal Alaane
                </label>
                <input
                  type="text"
                  value={invoice.edition_number}
                  onChange={(e) => onChange({ ...invoice, edition_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="ex. N° 1845"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Décompte Financier et Fiscal Algérien */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/80 pb-2">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span>3. Décompte Financier en Dinars Algériens (DZD)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Montant Hors Taxes (HT)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={invoice.amount_ht || ''}
                  onChange={(e) => handleAmountHtChange(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm font-semibold focus:outline-none focus:border-emerald-500"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-2 text-xs font-mono text-slate-500">DA</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Taux TVA Légale (19%)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={invoice.tva_rate}
                  onChange={(e) => handleTvaRateChange(parseFloat(e.target.value))}
                  className="w-20 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
                <div className="flex-1 relative">
                  <input
                    type="text"
                    readOnly
                    value={invoice.tva_amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300 font-mono text-xs cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-2 text-xs font-mono text-slate-500">DA</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-emerald-400 mb-1">
                Total TTC (Net à Payer)
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={invoice.amount_ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                  className="w-full px-3 py-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono text-sm font-bold cursor-not-allowed"
                />
                <span className="absolute right-3 top-2 text-xs font-mono text-emerald-400">DA</span>
              </div>
            </div>
          </div>

          {/* Legal French Amount in Words */}
          <div className="pt-2">
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Mention Légale Sacramentelle en Français (Automatiquement recalculée)
            </label>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 font-serif italic leading-relaxed">
              {invoice.amount_ttc_words}
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              * Règlement par virement bancaire : Exonéré du droit de timbre fiscal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
