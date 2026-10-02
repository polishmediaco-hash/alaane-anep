import React from 'react';
import { Invoice, InvoiceItem, InvoiceStatus } from '../types/invoice';
import { formatLegalClause } from '../lib/numberToWordsFr';
import {
  FileText,
  Calculator,
  Save,
  Printer,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Plus,
  Trash2,
  Copy,
  ArrowRight,
  Eye,
  Building,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface InvoiceEditorProps {
  invoice: Invoice;
  onChange: (updated: Invoice) => void;
  onSave: () => void;
  onPrint: () => void;
  isSaving: boolean;
  onOpenPeek?: () => void;
  hasScannedDocuments?: boolean;
  onContinueToPreview?: () => void;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  invoice,
  onChange,
  onSave,
  onPrint,
  isSaving,
  onOpenPeek,
  hasScannedDocuments = false,
  onContinueToPreview,
}) => {
  // Recalculates financial totals from all items
  const recalculateTotals = (items: InvoiceItem[], tvaRate: number = invoice.tva_rate): Partial<Invoice> => {
    const totalHt = Math.round(
      items.reduce((sum, it) => sum + (Number(it.amount_ht) || 0), 0) * 100
    ) / 100;
    const tvaAmount = Math.round(totalHt * (tvaRate / 100) * 100) / 100;
    const amountTtc = Math.round((totalHt + tvaAmount) * 100) / 100;
    const amountTtcWords = formatLegalClause(amountTtc);

    const first = items[0];

    return {
      items,
      amount_ht: totalHt,
      tva_rate: tvaRate,
      tva_amount: tvaAmount,
      amount_ttc: amountTtc,
      amount_ttc_words: amountTtcWords,
      anep_bc_number: first ? first.anep_bc_number : '',
      anep_bc_date: first ? first.anep_bc_date : '',
      ad_title: first ? first.ad_title : '',
      ad_format: first ? first.ad_format : '',
      publication_date: first ? first.publication_date : '',
      edition_number: first ? first.edition_number : '',
    };
  };

  // Modify a specific line item
  const handleItemChange = (index: number, patch: Partial<InvoiceItem>) => {
    const updatedItems = [...invoice.items];
    updatedItems[index] = { ...updatedItems[index], ...patch };
    const totals = recalculateTotals(updatedItems, invoice.tva_rate);
    onChange({
      ...invoice,
      ...totals,
    });
  };

  // Add a new empty Bon de Commande line
  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: crypto.randomUUID(),
      anep_bc_number: '',
      anep_bc_date: invoice.invoice_date,
      advertiser_name: invoice.advertiser_name || '',
      ad_title: '',
      publication_date: invoice.invoice_date,
      edition_number: '',
      ad_format: '4 colonnes x 15 cm (1/2 page)',
      amount_ht: 0,
    };
    const updatedItems = [...invoice.items, newItem];
    const totals = recalculateTotals(updatedItems, invoice.tva_rate);
    onChange({
      ...invoice,
      ...totals,
    });
  };

  // Duplicate an existing line item
  const handleDuplicateItem = (index: number) => {
    const itemToDuplicate = invoice.items[index];
    const duplicated: InvoiceItem = {
      ...itemToDuplicate,
      id: crypto.randomUUID(),
      anep_bc_number: itemToDuplicate.anep_bc_number ? `${itemToDuplicate.anep_bc_number}-BIS` : '',
    };
    const updatedItems = [...invoice.items, duplicated];
    const totals = recalculateTotals(updatedItems, invoice.tva_rate);
    onChange({
      ...invoice,
      ...totals,
    });
  };

  // Remove a line item
  const handleRemoveItem = (index: number) => {
    if (invoice.items.length <= 1) return;
    const updatedItems = invoice.items.filter((_, i) => i !== index);
    const totals = recalculateTotals(updatedItems, invoice.tva_rate);
    onChange({
      ...invoice,
      ...totals,
    });
  };

  // Handle global TVA rate update
  const handleTvaRateChange = (rate: number) => {
    const validRate = isNaN(rate) ? 0 : Math.max(0, rate);
    const totals = recalculateTotals(invoice.items, validRate);
    onChange({
      ...invoice,
      ...totals,
    });
  };

  // Pre-flight ANEP compliance checks
  const validationErrors: string[] = [];
  if (!invoice.invoice_number || invoice.invoice_number.trim().length < 3) {
    validationErrors.push("Numéro de facture journal manquant.");
  }
  if (!invoice.advertiser_name || invoice.advertiser_name.trim().length < 3) {
    validationErrors.push("Organisme ordonnateur ('Pour le compte de') obligatoire pour l'ANEP.");
  }
  if (invoice.items.length === 0) {
    validationErrors.push("Au moins un Bon de Commande (ligne d'insertion) est requis.");
  }
  invoice.items.forEach((item, idx) => {
    if (!item.anep_bc_number || item.anep_bc_number.trim().length < 3) {
      validationErrors.push(`Ligne #${idx + 1} : Numéro Bon de Commande ANEP manquant.`);
    }
    if (!item.amount_ht || item.amount_ht <= 0) {
      validationErrors.push(`Ligne #${idx + 1} : Montant Hors Taxes (HT) doit être supérieur à 0 DA.`);
    }
    if (!item.ad_title || item.ad_title.trim().length < 3) {
      validationErrors.push(`Ligne #${idx + 1} : Objet ou titre de l'annonce requis.`);
    }
  });

  return (
    <div className="flex flex-col h-full bg-slate-50/70 overflow-y-auto select-none">
      {/* Editor Sub-Action Bar: Minimalist & Clean */}
      <div className="h-12 px-4 sm:px-6 bg-white border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-700" />
          <h2 className="text-xs font-bold text-slate-900 tracking-tight">
            Facturation Multi-BC
          </h2>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            {invoice.items.length} Ordre{invoice.items.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasScannedDocuments && onOpenPeek && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenPeek}
              className="text-xs h-7.5 px-2.5"
              title="Vérifier le scan sans quitter la page"
            >
              <Eye className="w-3.5 h-3.5 mr-1 text-slate-600" />
              <span>Vérifier Scan</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="text-xs h-7.5 px-2.5"
          >
            <Save className="w-3.5 h-3.5 mr-1 text-slate-600" />
            <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={onPrint}
            className="text-xs h-7.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-medium"
          >
            <Printer className="w-3.5 h-3.5 mr-1" />
            <span>Imprimer</span>
          </Button>
        </div>
      </div>

      <div className="p-3 sm:p-5 lg:p-6 space-y-4 max-w-5xl mx-auto w-full pb-24 lg:pb-8">
        {/* Compliance Feedback Banner */}
        {validationErrors.length > 0 ? (
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-amber-800">
                Critères de conformité ANEP à compléter :
              </span>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-700 text-[11px]">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium text-[11px]">
              Dossier conforme aux critères d'acceptation ANEP (Lignes détaillées, TVA 19% et arrêté en toutes lettres).
            </span>
          </div>
        )}

        {/* SECTION 1: En-tête de Facture & Client Ordonnateur (Borderless Editorial Container) */}
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                1. En-tête de Facturation & Client Ordonnateur
              </h3>
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
              {(['brouillon', 'emise', 'payee'] as InvoiceStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => onChange({ ...invoice, status: st })}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-medium capitalize transition-all ${
                    invoice.status === st
                      ? st === 'payee'
                        ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                        : st === 'emise'
                        ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                        : 'bg-slate-200 text-slate-800 font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                N° de Facture Journal (Unique) *
              </label>
              <Input
                type="text"
                value={invoice.invoice_number}
                onChange={(e) =>
                  onChange({ ...invoice, invoice_number: e.target.value })
                }
                className="font-mono text-xs font-semibold bg-white border-slate-200 focus-visible:ring-slate-900"
                placeholder="FAC-2026-0001"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Date de Facturation
              </label>
              <Input
                type="text"
                value={invoice.invoice_date}
                onChange={(e) =>
                  onChange({ ...invoice, invoice_date: e.target.value })
                }
                className="text-xs bg-white border-slate-200 focus-visible:ring-slate-900"
                placeholder="JJ/MM/AAAA"
              />
            </div>

            {/* Mandatory ANEP Clause: POUR LE COMPTE DE */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-900 mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-700" />
                <span>Pour le compte de (Organisme Client) *</span>
              </label>
              <Input
                type="text"
                value={invoice.advertiser_name || ''}
                onChange={(e) =>
                  onChange({ ...invoice, advertiser_name: e.target.value })
                }
                className="text-xs font-medium bg-white border-slate-300 focus-visible:ring-slate-900 text-slate-900"
                placeholder="ex. Direction des Travaux Publics (DTP) — Alger"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Bons de Commande ANEP (1 à N Lignes - Flat Item Rows) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span>2. Bons de Commande & Ordres d'Insertion</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-semibold">
                  {invoice.items.length} {invoice.items.length > 1 ? 'Ordres' : 'Ordre'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Chaque bon de commande ANEP correspond à une ligne distincte sur la facture légale.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="text-xs h-8 px-3 border-slate-300 hover:bg-slate-100 text-slate-800 font-medium"
            >
              <Plus className="w-3.5 h-3.5 mr-1 text-slate-700" />
              <span>+ Ajouter un Bon de Commande</span>
            </Button>
          </div>

          {/* Line Items List */}
          {invoice.items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs transition-shadow hover:shadow-xs"
            >
              {/* Row Header */}
              <div className="px-3.5 py-2.5 bg-slate-50/90 border-b border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    Bon de Commande : {item.anep_bc_number || 'En attente de matricule'}
                  </span>
                  {item.amount_ht > 0 && (
                    <span className="text-[11px] font-mono font-semibold text-slate-600 ml-2">
                      ({item.amount_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA HT)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDuplicateItem(idx)}
                    title="Dupliquer cette ligne"
                    className="h-7 w-7 text-slate-500 hover:text-slate-800"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>

                  {invoice.items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveItem(idx)}
                      title="Supprimer cette ligne"
                      className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Row Inputs */}
              <div className="p-3.5 sm:p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      N° Bon de Commande / Matricule ANEP *
                    </label>
                    <Input
                      type="text"
                      value={item.anep_bc_number}
                      onChange={(e) =>
                        handleItemChange(idx, { anep_bc_number: e.target.value })
                      }
                      className="font-mono text-xs font-semibold bg-white border-slate-200 focus-visible:ring-slate-900"
                      placeholder="ex. 2416008452 / DEP-REGIE"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Date du Bon de Commande ANEP
                    </label>
                    <Input
                      type="text"
                      value={item.anep_bc_date}
                      onChange={(e) =>
                        handleItemChange(idx, { anep_bc_date: e.target.value })
                      }
                      className="text-xs bg-white border-slate-200 focus-visible:ring-slate-900"
                      placeholder="JJ/MM/AAAA"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Montant Hors Taxes (HT) *
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        value={item.amount_ht || ''}
                        onChange={(e) =>
                          handleItemChange(idx, {
                            amount_ht: Math.max(0, parseFloat(e.target.value) || 0),
                          })
                        }
                        className="font-mono text-xs font-bold text-slate-900 pr-10 bg-white border-slate-200 focus-visible:ring-slate-900"
                        placeholder="0.00"
                      />
                      <span className="absolute right-3 top-2 text-xs font-mono font-medium text-slate-400">
                        DA
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Objet / Titre de l'Annonce (Appel d'offres, Prorogation, Avis...) *
                  </label>
                  <textarea
                    rows={2}
                    value={item.ad_title}
                    onChange={(e) =>
                      handleItemChange(idx, { ad_title: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 leading-relaxed transition-colors"
                    placeholder="Intitulé officiel de l'annonce d'après l'ordre ANEP..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Format / Module
                    </label>
                    <Input
                      type="text"
                      value={item.ad_format}
                      onChange={(e) =>
                        handleItemChange(idx, { ad_format: e.target.value })
                      }
                      className="text-xs bg-white border-slate-200 focus-visible:ring-slate-900"
                      placeholder="ex. 4 col x 18 cm (1/2 page)"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Date de Parution au Journal
                    </label>
                    <Input
                      type="text"
                      value={item.publication_date}
                      onChange={(e) =>
                        handleItemChange(idx, { publication_date: e.target.value })
                      }
                      className="text-xs bg-white border-slate-200 focus-visible:ring-slate-900"
                      placeholder="Édition du JJ/MM/AAAA"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      N° Édition Journal
                    </label>
                    <Input
                      type="text"
                      value={item.edition_number}
                      onChange={(e) =>
                        handleItemChange(idx, { edition_number: e.target.value })
                      }
                      className="text-xs bg-white border-slate-200 focus-visible:ring-slate-900"
                      placeholder="ex. N° 1845"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* SECTION 3: Décompte Financier et Fiscal Consolidé (Borderless Clean Financial Table) */}
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                3. Décompte Consolidé en Dinars Algériens (DZD)
              </h3>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Total Montant HT ({invoice.items.length} BC)
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    readOnly
                    value={invoice.amount_ht.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                    })}
                    className="font-mono text-sm font-bold bg-slate-50 text-slate-900 pr-10 cursor-not-allowed border-slate-200"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-mono font-medium text-slate-400">
                    DA
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
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
                    className="w-18 font-mono text-xs bg-white border-slate-200 focus-visible:ring-slate-900"
                  />
                  <div className="flex-1 relative">
                    <Input
                      type="text"
                      readOnly
                      value={invoice.tva_amount.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                      })}
                      className="font-mono text-xs bg-slate-50 text-slate-700 pr-10 cursor-not-allowed border-slate-200"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                      DA
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-900 mb-1">
                  NET À PAYER (TOTAL TTC)
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    readOnly
                    value={invoice.amount_ttc.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                    })}
                    className="font-mono text-sm font-bold bg-slate-50 border-slate-300 text-slate-950 pr-10 cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-mono font-bold text-slate-900">
                    DA
                  </span>
                </div>
              </div>
            </div>

            {/* Legal French Amount in Words */}
            <div className="pt-2">
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Arrêté Sacramental en Toutes Lettres (Norme ANEP)
              </label>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 font-serif italic leading-relaxed">
                {invoice.amount_ttc_words}
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                Règlement par virement bancaire sur compte BNA : Exonéré du droit de timbre fiscal (Art. 251).
              </p>
            </div>
          </div>
        </div>

        {/* Forward CTA to Preview */}
        {onContinueToPreview && (
          <div className="pt-2 flex justify-end">
            <Button
              variant="default"
              size="lg"
              onClick={onContinueToPreview}
              className="w-full sm:w-auto font-semibold text-xs min-h-[42px] px-6 bg-slate-900 hover:bg-slate-800 text-white shadow-2xs"
            >
              <span>Visualiser la Facture Légale A4 ({invoice.items.length} BC)</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
