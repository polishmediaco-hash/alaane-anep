import React, { useState } from 'react';
import { Invoice, InvoiceStatus } from '../types/invoice';
import {
  X,
  Search,
  FileText,
  Calendar,
  Trash2,
  Copy,
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock,
  Ban,
} from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onDuplicateInvoice: (invoice: Invoice) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  invoices,
  onSelectInvoice,
  onDeleteInvoice,
  onDuplicateInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all');

  if (!isOpen) return null;

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.anep_bc_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.ad_title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'payee':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Payée
          </span>
        );
      case 'emise':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Émise
          </span>
        );
      case 'rejetee':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
            <Ban className="w-3 h-3" /> Rejetée
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700 text-slate-300">
            Brouillon
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white">
                Historique des Factures ANEP
              </h2>
              <p className="text-xs text-slate-400">
                {invoices.length} facture(s) enregistrée(s)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher par N° Facture, N° BC ou Titre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 mr-1" />
            {(['all', 'emise', 'payee', 'brouillon'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                  statusFilter === filter
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
                }`}
              >
                {filter === 'all' ? 'Toutes' : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Invoices List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-800/80">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
              <p className="text-sm font-medium">Aucune facture trouvée.</p>
              <p className="text-xs mt-1">Créez votre première facture depuis l'atelier.</p>
            </div>
          ) : (
            filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                className="py-3 px-3 rounded-xl hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-white">
                      {inv.invoice_number}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="font-mono text-xs text-emerald-400 font-semibold">
                      {inv.anep_bc_number}
                    </span>
                    {getStatusBadge(inv.status)}
                  </div>

                  <p className="text-xs text-slate-300 font-medium line-clamp-1">
                    {inv.ad_title}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Émise le {inv.invoice_date}
                    </span>
                    <span>•</span>
                    <span>Parution : {inv.publication_date}</span>
                    <span>•</span>
                    <span>Format : {inv.ad_format}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-emerald-400">
                      {inv.amount_ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                    </p>
                    <p className="text-[10px] text-slate-500">
                      HT : {inv.amount_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        onSelectInvoice(inv);
                        onClose();
                      }}
                      className="p-2 text-emerald-400 hover:text-white hover:bg-emerald-600 rounded-lg transition-colors"
                      title="Ouvrir dans l'atelier"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDuplicateInvoice(inv)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      title="Dupliquer la facture"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteInvoice(inv.id)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
                      title="Supprimer la facture"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
