import React from 'react';
import { Invoice, InvoiceStatus } from '../types/invoice';
import { formatLegalClause } from '../lib/numberToWordsFr';
import {
  FileText,
  Layers,
  Calculator,
  Save,
  Printer,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

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
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Action Header */}
      <div className="p-4 bg-white/95 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Édition de la Facture Commerciale</span>
          </h2>
          <p className="text-[11px] text-slate-500">
            Conforme aux normes ANEP et au Décret exécutif n° 05-468
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
          >
            <Save className="w-3.5 h-3.5 text-slate-600" />
            <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onPrint}
            className="font-medium shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer (A4)</span>
          </Button>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-5 flex-1 pb-24 lg:pb-6">
        {/* Anti-Rejection Checklist Alert */}
        {validationErrors.length > 0 ? (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">
                Points de vigilance ANEP à compléter :
              </p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-700 text-[11px]">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium text-[11px]">
              Dossier conforme aux critères d'acceptation ANEP (Matricule, calculs fiscaux et arrêté en lettres valides).
            </span>
          </div>
        )}

        {/* Section 1: Références de Facturation & ANEP */}
        <Card>
          <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span>1. Références de Facturation & Ordre ANEP</span>
            </CardTitle>

            {/* Status Badges Selector */}
            <div className="flex items-center gap-1">
              {(['brouillon', 'emise', 'payee'] as InvoiceStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => onChange({ ...invoice, status: st })}
                  className="focus:outline-none"
                >
                  <Badge
                    variant={
                      invoice.status === st
                        ? st === 'payee'
                          ? 'success'
                          : st === 'emise'
                          ? 'primary'
                          : 'default'
                        : 'outline'
                    }
                    className="cursor-pointer text-[10px] capitalize font-medium"
                  >
                    {st}
                  </Badge>
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                N° de Facture Journal (Unique)
              </label>
              <Input
                type="text"
                value={invoice.invoice_number}
                onChange={(e) =>
                  onChange({ ...invoice, invoice_number: e.target.value })
                }
                className="font-mono text-xs"
                placeholder="FAC-2026-0001"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Date de Facturation
              </label>
              <Input
                type="text"
                value={invoice.invoice_date}
                onChange={(e) =>
                  onChange({ ...invoice, invoice_date: e.target.value })
                }
                className="text-xs"
                placeholder="JJ/MM/AAAA"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-blue-700 mb-1">
                N° Bon de Commande / Matricule ANEP *
              </label>
              <Input
                type="text"
                value={invoice.anep_bc_number}
                onChange={(e) =>
                  onChange({ ...invoice, anep_bc_number: e.target.value })
                }
                className="font-mono text-xs font-semibold border-blue-300 text-blue-900 bg-blue-50/30"
                placeholder="ex. 2416008452 / DEP-REGIE-CENTRE"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Date du Bon de Commande ANEP
              </label>
              <Input
                type="text"
                value={invoice.anep_bc_date}
                onChange={(e) =>
                  onChange({ ...invoice, anep_bc_date: e.target.value })
                }
                className="text-xs"
                placeholder="JJ/MM/AAAA"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Détails de l'Insertion et Parution */}
        <Card>
          <CardHeader className="p-4 pb-3 border-b border-slate-100">
            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>2. Spécifications de l'Annonce Publicitaire</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 space-y-3.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Objet / Titre de l'Annonce (Appel d'Offres, Communiqué, Mise en demeure...)
              </label>
              <textarea
                rows={2}
                value={invoice.ad_title}
                onChange={(e) =>
                  onChange({ ...invoice, ad_title: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 leading-relaxed transition-colors"
                placeholder="Intitulé exact de l'annonce telle que spécifiée sur le bon de commande..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Format / Module (Col x Ht)
                </label>
                <Input
                  type="text"
                  value={invoice.ad_format}
                  onChange={(e) =>
                    onChange({ ...invoice, ad_format: e.target.value })
                  }
                  className="text-xs"
                  placeholder="ex. 4 col x 18 cm (1/2 page)"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Date de Parution au Journal
                </label>
                <Input
                  type="text"
                  value={invoice.publication_date}
                  onChange={(e) =>
                    onChange({ ...invoice, publication_date: e.target.value })
                  }
                  className="text-xs"
                  placeholder="Édition du JJ/MM/AAAA"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  N° Édition du Journal Alaane
                </label>
                <Input
                  type="text"
                  value={invoice.edition_number}
                  onChange={(e) =>
                    onChange({ ...invoice, edition_number: e.target.value })
                  }
                  className="text-xs"
                  placeholder="ex. N° 1845"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Décompte Financier et Fiscal Algérien */}
        <Card>
          <CardHeader className="p-4 pb-3 border-b border-slate-100">
            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              <span>3. Décompte Financier en Dinars Algériens (DZD)</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Montant Hors Taxes (HT)
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={invoice.amount_ht || ''}
                    onChange={(e) =>
                      handleAmountHtChange(parseFloat(e.target.value))
                    }
                    className="font-mono text-sm font-semibold pr-10"
                    placeholder="0.00"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-mono font-medium text-slate-400">
                    DA
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Taux TVA Légale (19%)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={invoice.tva_rate}
                    onChange={(e) =>
                      handleTvaRateChange(parseFloat(e.target.value))
                    }
                    className="w-18 font-mono text-xs"
                  />
                  <div className="flex-1 relative">
                    <Input
                      type="text"
                      readOnly
                      value={invoice.tva_amount.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                      })}
                      className="font-mono text-xs bg-slate-50 text-slate-600 pr-10 cursor-not-allowed"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                      DA
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-emerald-700 mb-1">
                  Total TTC (Net à Payer)
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    readOnly
                    value={invoice.amount_ttc.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                    })}
                    className="font-mono text-sm font-bold bg-emerald-50/50 border-emerald-300 text-emerald-800 pr-10 cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-mono font-bold text-emerald-600">
                    DA
                  </span>
                </div>
              </div>
            </div>

            {/* Legal French Amount in Words */}
            <div className="pt-2">
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Mention Légale Sacramentelle en Français (Automatiquement recalculée)
              </label>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 font-serif italic leading-relaxed">
                {invoice.amount_ttc_words}
              </div>
              <p className="mt-1.5 text-[10px] text-slate-400">
                Règlement par virement bancaire : Exonéré du droit de timbre fiscal.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
