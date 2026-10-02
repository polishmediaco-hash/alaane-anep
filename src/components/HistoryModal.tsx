import React, { useState } from 'react';
import { Invoice, InvoiceStatus } from '../types/invoice';
import {
  Search,
  FileText,
  Calendar,
  Trash2,
  Copy,
  ExternalLink,
  Filter,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

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
          <Badge variant="success" className="text-[10px]">
            Payée
          </Badge>
        );
      case 'emise':
        return (
          <Badge variant="primary" className="text-[10px]">
            Émise
          </Badge>
        );
      case 'rejetee':
        return (
          <Badge variant="destructive" className="text-[10px]">
            Rejetée
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-[10px]">
            Brouillon
          </Badge>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Historique des Factures ANEP
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                {invoices.length} facture(s) enregistrée(s) dans la base
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Filter & Search Bar */}
        <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              type="text"
              placeholder="Rechercher par N° Facture, N° BC ou Titre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
            {(['all', 'emise', 'payee', 'brouillon'] as const).map((filter) => (
              <Button
                key={filter}
                variant={statusFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(filter)}
                className="h-8 text-xs capitalize"
              >
                {filter === 'all' ? 'Toutes' : filter}
              </Button>
            ))}
          </div>
        </div>

        {/* Invoices List */}
        <div className="overflow-y-auto max-h-[55vh] p-4 divide-y divide-slate-100">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-700">
                Aucune facture trouvée
              </p>
              <p className="text-xs mt-1 text-slate-500">
                Numérisez un Bon de Commande depuis l'atelier pour créer une facture.
              </p>
            </div>
          ) : (
            filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                className="py-3.5 px-3 rounded-xl hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      {inv.invoice_number}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono text-xs text-blue-700 font-semibold">
                      {inv.anep_bc_number}
                    </span>
                    {getStatusBadge(inv.status)}
                  </div>

                  <p className="text-xs text-slate-700 font-medium line-clamp-1">
                    {inv.ad_title}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
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
                    <p className="font-mono text-sm font-bold text-slate-900">
                      {inv.amount_ttc.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      DA
                    </p>
                    <p className="text-[10px] text-slate-400">
                      HT :{' '}
                      {inv.amount_ht.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      DA
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="primary"
                      size="icon-sm"
                      onClick={() => {
                        onSelectInvoice(inv);
                        onClose();
                      }}
                      title="Ouvrir dans l'atelier"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => onDuplicateInvoice(inv)}
                      title="Dupliquer la facture"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDeleteInvoice(inv.id)}
                      title="Supprimer la facture"
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
