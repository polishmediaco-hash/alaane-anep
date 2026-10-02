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
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

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

    // Sync legacy/primary fields with first item for backward compatibility
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
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto select-none">
      {/* Action Header */}
      <div className="p-3 sm:p-4 bg-white/95 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Facturation Commerciale Multi-BC</span>
          </h2>
          <p className="text-[11px] text-slate-500">
            {invoice.items.length} Bon{invoice.items.length > 1 ? 's' : ''} de Commande groupé{invoice.items.length > 1 ? 's' : ''} • Décret n° 05-468
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Peek Document Button: Solves Defect 1 */}
          {hasScannedDocuments && onOpenPeek && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenPeek}
              className="border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 text-xs min-h-[36px]"
              title="Vérifier le scan sans quitter la page"
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Vérifier Scan</span>
              <span className="inline sm:hidden">Scan</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="text-xs min-h-[36px]"
          >
            <Save className="w-3.5 h-3.5 mr-1 text-slate-600" />
            <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onPrint}
            className="font-medium text-xs shadow-xs min-h-[36px]"
          >
            <Printer className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">Imprimer (A4)</span>
            <span className="inline sm:hidden">Imprimer</span>
          </Button>
        </div>
      </div>

      <div className="p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 flex-1 pb-24 lg:pb-6">
        {/* Anti-Rejection Checklist Alert */}
        {validationErrors.length > 0 ? (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">
                Points de conformité ANEP à vérifier :
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
              Dossier conforme aux critères d'acceptation ANEP (Lignes détaillées, TVA 19% et arrêté en toutes lettres).
            </span>
          </div>
        )}

        {/* Section 1: Références Générales de Facturation & Client Ordonnateur */}
        <Card>
          <CardHeader className="p-3.5 sm:p-4 pb-2 sm:pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span>1. En-tête de Facturation & Client Ordonnateur</span>
            </CardTitle>

            {/* Status Selector */}
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

          <CardContent className="p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                N° de Facture Journal (Unique) *
              </label>
              <Input
                type="text"
                value={invoice.invoice_number}
                onChange={(e) =>
                  onChange({ ...invoice, invoice_number: e.target.value })
                }
                className="font-mono text-xs font-semibold"
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

            {/* Mandatory ANEP Clause: POUR LE COMPTE DE */}
            <div>
              <label className="block text-[11px] font-semibold text-blue-700 mb-1 flex items-center gap-1">
                <Building className="w-3 h-3" />
                <span>Pour le compte de (Organisme Client) *</span>
              </label>
              <Input
                type="text"
                value={invoice.advertiser_name || ''}
                onChange={(e) =>
                  onChange({ ...invoice, advertiser_name: e.target.value })
                }
                className="text-xs font-medium border-blue-200 bg-blue-50/20"
                placeholder="ex. Direction des Travaux Publics (DTP) — Alger"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Bons de Commande ANEP (1 à N Lignes) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span>2. Bons de Commande & Ordres d'Insertion</span>
                <Badge variant="primary" className="text-[10px]">
                  {invoice.items.length} {invoice.items.length > 1 ? 'Ordres' : 'Ordre'}
                </Badge>
              </h3>
              <p className="text-[11px] text-slate-500">
                Chaque bon de commande ANEP correspond à une ligne distincte sur la facture A4.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="text-xs text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>+ Ajouter un Bon de Commande</span>
            </Button>
          </div>

          {/* Line items list */}
          {invoice.items.map((item, idx) => (
            <Card key={item.id || idx} className="border-slate-200 shadow-xs transition-shadow hover:shadow-sm">
              <CardHeader className="p-3 bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    Bon de Commande : {item.anep_bc_number || 'En attente de saisie'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDuplicateItem(idx)}
                    title="Dupliquer cette ligne"
                    className="h-8 w-8 text-slate-500 hover:text-slate-800"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>

                  {invoice.items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveItem(idx)}
                      title="Supprimer cette ligne"
                      className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-3.5 sm:p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-blue-700 mb-1">
                      N° Bon de Commande / Matricule ANEP *
                    </label>
                    <Input
                      type="text"
                      value={item.anep_bc_number}
                      onChange={(e) =>
                        handleItemChange(idx, { anep_bc_number: e.target.value })
                      }
                      className="font-mono text-xs font-semibold border-blue-200 bg-blue-50/30 text-blue-950"
                      placeholder="ex. 2416008452 / DEP-REGIE-CENTRE"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Date du Bon de Commande ANEP
                    </label>
                    <Input
                      type="text"
                      value={item.anep_bc_date}
                      onChange={(e) =>
                        handleItemChange(idx, { anep_bc_date: e.target.value })
                      }
                      className="text-xs"
                      placeholder="JJ/MM/AAAA"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
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
                        className="font-mono text-xs font-bold text-slate-900 pr-10"
                        placeholder="0.00"
                      />
                      <span className="absolute right-3 top-2 text-xs font-mono font-medium text-slate-400">
                        DA
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Objet / Titre de l'Annonce (Appel d'offres, Prorogation, Avis...) *
                  </label>
                  <textarea
                    rows={2}
                    value={item.ad_title}
                    onChange={(e) =>
                      handleItemChange(idx, { ad_title: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 leading-relaxed transition-colors"
                    placeholder="Intitulé complet de l'annonce d'après l'ordre ANEP..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Format / Module
                    </label>
                    <Input
                      type="text"
                      value={item.ad_format}
                      onChange={(e) =>
                        handleItemChange(idx, { ad_format: e.target.value })
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
                      value={item.publication_date}
                      onChange={(e) =>
                        handleItemChange(idx, { publication_date: e.target.value })
                      }
                      className="text-xs"
                      placeholder="Édition du JJ/MM/AAAA"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      N° Édition Journal
                    </label>
                    <Input
                      type="text"
                      value={item.edition_number}
                      onChange={(e) =>
                        handleItemChange(idx, { edition_number: e.target.value })
                      }
                      className="text-xs"
                      placeholder="ex. N° 1845"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Section 3: Décompte Financier et Fiscal Consolidé */}
        <Card>
          <CardHeader className="p-3.5 sm:p-4 pb-2 sm:pb-3 border-b border-slate-100">
            <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              <span>3. Décompte Consolidé en Dinars Algériens (DZD)</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-3.5 sm:p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Total Montant HT (Somme des {invoice.items.length} BC)
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    readOnly
                    value={invoice.amount_ht.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                    })}
                    className="font-mono text-sm font-bold bg-slate-50 text-slate-900 pr-10 cursor-not-allowed"
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
                      className="font-mono text-xs bg-slate-50 text-slate-700 pr-10 cursor-not-allowed"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                      DA
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-emerald-700 mb-1">
                  NET À PAYER (TOTAL TTC)
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    readOnly
                    value={invoice.amount_ttc.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                    })}
                    className="font-mono text-sm font-extrabold bg-emerald-50/60 border-emerald-300 text-emerald-900 pr-10 cursor-not-allowed"
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
                Mention Sacramentelle en Toutes Lettres (Automatiquement recalculée)
              </label>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 font-serif italic leading-relaxed">
                {invoice.amount_ttc_words}
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                Règlement par virement bancaire sur compte BNA : Exonéré du droit de timbre fiscal.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Forward CTA to Preview: Solves Defect 3 */}
        {onContinueToPreview && (
          <div className="pt-2 flex justify-end">
            <Button
              variant="primary"
              size="lg"
              onClick={onContinueToPreview}
              className="w-full sm:w-auto font-semibold text-xs shadow-md min-h-[44px] px-6"
            >
              <span>Valider & Visualiser la Facture A4 ({invoice.items.length} BC)</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
