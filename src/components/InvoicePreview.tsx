import React from 'react';
import { Invoice, PublisherProfile, DEFAULT_PUBLISHER } from '../types/invoice';
import { Printer, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface InvoicePreviewProps {
  invoice: Invoice;
  publisher?: PublisherProfile;
  onPrint: () => void;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoice,
  publisher = DEFAULT_PUBLISHER,
  onPrint,
}) => {
  return (
    <div className="flex flex-col h-full bg-slate-100 overflow-y-auto">
      {/* Top Preview Control Bar (Hidden on print) */}
      <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-20 no-print shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-800">
            Aperçu Direct Format A4 (Norme Algérienne)
          </span>
          <Badge variant="success" className="hidden sm:inline-flex text-[10px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Prêt pour Cachet Humide</span>
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={onPrint}
            className="font-medium shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer la Facture</span>
          </Button>
        </div>
      </div>

      {/* A4 Paper Container Center Stage */}
      <div className="flex-1 p-3 sm:p-6 lg:p-8 flex justify-center items-start bg-slate-100 pb-24 lg:pb-8">
        <div
          id="printable-invoice"
          className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-6 sm:p-10 shadow-lg rounded-xl flex flex-col justify-between border border-slate-200/80"
          style={{ boxSizing: 'border-box' }}
        >
          {/* Top Document Header */}
          <div>
            {/* National Republic Banner */}
            <div className="text-center border-b border-slate-300 pb-2 mb-4">
              <h4 className="text-[11px] font-serif font-bold uppercase tracking-wider text-slate-800">
                RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE
              </h4>
              <p className="text-[10px] font-serif text-slate-600">
                الجمهورية الجزائرية الديمقراطية الشعبية
              </p>
            </div>

            {/* Letterhead Grid: Publisher (Left) vs Client ANEP (Right) */}
            <div className="grid grid-cols-12 gap-4 pb-4 border-b-2 border-slate-900 items-start">
              {/* Publisher Identity (Journal Alaane) */}
              <div className="col-span-12 sm:col-span-7 pr-2">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={publisher.logo_url || '/assets/alaane-logo.png'}
                    alt="Logo Alaane"
                    className="w-12 h-12 object-contain"
                  />
                  <div>
                    <h1 className="font-bold text-lg leading-tight tracking-tight uppercase text-slate-950">
                      {publisher.name}
                    </h1>
                    <p className="text-xs font-serif font-bold text-blue-900 tracking-wide">
                      جريدة الآن — Quotidien National d'Information
                    </p>
                    <p className="text-[10px] text-slate-600 font-medium">
                      {publisher.legal_name}
                    </p>
                  </div>
                </div>

                <div className="text-[10px] text-slate-700 space-y-0.5 font-sans mt-2">
                  <p>{publisher.address}</p>
                  <p>Tél : {publisher.phone} | Email : {publisher.email}</p>
                  <div className="pt-1 grid grid-cols-2 gap-x-2 font-mono text-[9.5px]">
                    <p><span className="font-semibold text-slate-900">R.C. :</span> {publisher.rc}</p>
                    <p><span className="font-semibold text-slate-900">N.I.F. :</span> {publisher.nif}</p>
                    <p><span className="font-semibold text-slate-900">N.I.S. :</span> {publisher.nis}</p>
                    <p><span className="font-semibold text-slate-900">Art. Imp. :</span> {publisher.article_imposition}</p>
                  </div>
                  <p className="pt-1 font-mono text-[9.5px]">
                    <span className="font-semibold text-slate-900">RIB ({publisher.bank_name}) :</span> {publisher.rib}
                  </p>
                </div>
              </div>

              {/* Client Box: ANEP */}
              <div className="col-span-12 sm:col-span-5 border border-slate-300 rounded-lg p-3 bg-slate-50/70 text-[10.5px]">
                <p className="font-bold uppercase text-slate-950 text-xs border-b border-slate-300 pb-1 mb-1.5 flex items-center justify-between">
                  <span>DOIT :</span>
                  <span className="text-[9px] font-mono font-normal text-slate-500">CLIENT</span>
                </p>
                <p className="font-bold text-slate-900 leading-tight">
                  {invoice.client_name}
                </p>
                <p className="text-slate-700 text-[10px] mt-0.5">
                  Direction de l'Édition et de la Publicité (DEP)
                </p>
                <p className="text-slate-600 text-[10px]">{invoice.client_address}</p>
                <div className="mt-2 pt-1 border-t border-slate-200 font-mono text-[9px] text-slate-700 space-y-0.5">
                  <p><span className="font-semibold">NIF :</span> {invoice.client_nif}</p>
                  <p><span className="font-semibold">NIS :</span> {invoice.client_nis}</p>
                </div>
              </div>
            </div>

            {/* Invoice Title & Reference Strip */}
            <div className="my-4 py-2.5 px-3 bg-slate-50 rounded-lg border border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-extrabold uppercase tracking-tight text-slate-950">
                  FACTURE N° : <span className="font-mono text-blue-800">{invoice.invoice_number}</span>
                </h2>
                <p className="text-[11px] text-slate-600">
                  Date d'émission : <span className="font-semibold text-slate-900">{invoice.invoice_date}</span>
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-xs font-bold text-slate-900">
                  RÉF. BON DE COMMANDE ANEP :
                </p>
                <p className="font-mono text-xs font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-slate-300 inline-block mt-0.5">
                  {invoice.anep_bc_number}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Date BC : {invoice.anep_bc_date}
                </p>
              </div>
            </div>

            {/* Invoicing Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse border border-slate-300 text-xs min-w-[550px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 text-[10px] uppercase font-bold tracking-wider">
                    <th className="border border-slate-300 p-2 text-left w-[15%]">Réf. ANEP</th>
                    <th className="border border-slate-300 p-2 text-left w-[15%]">Parution</th>
                    <th className="border border-slate-300 p-2 text-left w-[38%]">Objet / Désignation de l'Annonce</th>
                    <th className="border border-slate-300 p-2 text-center w-[16%]">Format / Module</th>
                    <th className="border border-slate-300 p-2 text-right w-[16%]">Montant HT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-slate-800">
                    <td className="border border-slate-300 p-2.5 font-mono text-[10px] align-top">
                      <p className="font-bold text-slate-900">{invoice.anep_bc_number}</p>
                      <p className="text-[9px] text-slate-500">du {invoice.anep_bc_date}</p>
                    </td>

                    <td className="border border-slate-300 p-2.5 text-[10.5px] align-top">
                      <p className="font-medium text-slate-900">{invoice.publication_date}</p>
                      {invoice.edition_number && (
                        <p className="text-[9.5px] text-slate-500">{invoice.edition_number}</p>
                      )}
                    </td>

                    <td className="border border-slate-300 p-2.5 align-top">
                      <p className="font-semibold text-slate-950 leading-relaxed">
                        {invoice.ad_title}
                      </p>
                      <p className="text-[9.5px] text-slate-500 italic mt-0.5">
                        Publication d'avis légal sous régie ANEP
                      </p>
                    </td>

                    <td className="border border-slate-300 p-2.5 text-center align-top font-medium">
                      <span className="inline-block px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-[10.5px]">
                        {invoice.ad_format}
                      </span>
                    </td>

                    <td className="border border-slate-300 p-2.5 text-right font-mono font-bold text-slate-950 text-[11px] align-top">
                      {invoice.amount_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                    </td>
                  </tr>

                  {/* Spacer row for visual balance */}
                  <tr className="h-16">
                    <td className="border border-slate-300"></td>
                    <td className="border border-slate-300"></td>
                    <td className="border border-slate-300"></td>
                    <td className="border border-slate-300"></td>
                    <td className="border border-slate-300"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Financial Totals Recapitulation Block */}
            <div className="mt-4 flex justify-end">
              <div className="w-72 border border-slate-300 rounded-lg overflow-hidden text-xs">
                <div className="flex justify-between p-2 border-b border-slate-200 bg-slate-50/50">
                  <span className="font-semibold text-slate-700">Total Montant HT :</span>
                  <span className="font-mono font-bold text-slate-900">
                    {invoice.amount_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                  </span>
                </div>

                <div className="flex justify-between p-2 border-b border-slate-200">
                  <span className="text-slate-700">TVA ({invoice.tva_rate.toFixed(2)} %) :</span>
                  <span className="font-mono font-medium text-slate-900">
                    {invoice.tva_amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                  </span>
                </div>

                <div className="flex justify-between p-2 border-b border-slate-200 text-[10px] text-slate-500 bg-slate-50/30">
                  <span>Droit de timbre fiscal :</span>
                  <span className="font-mono">0,00 DA (Exonéré)</span>
                </div>

                <div className="flex justify-between p-2.5 bg-slate-900 text-white text-sm font-bold">
                  <span>TOTAL TTC :</span>
                  <span className="font-mono text-emerald-400">
                    {invoice.amount_ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                  </span>
                </div>
              </div>
            </div>

            {/* Legal Statement (Montant en Toutes Lettres) */}
            <div className="mt-5 p-3.5 rounded-lg bg-slate-50 border border-slate-300 text-xs leading-relaxed">
              <p className="font-serif italic text-slate-900">
                <span className="font-semibold not-italic text-slate-950 font-sans">
                  Arrêtée la présente facture à la somme de :
                </span>{' '}
                {invoice.amount_ttc_words.replace(/^Arrêtée la présente facture à la somme de\s*:\s*/i, '')}
              </p>
              <p className="text-[10px] text-slate-500 mt-1 font-sans">
                * Modalité de règlement : Par virement bancaire sur le compte RIB ci-dessus. Exonéré du droit de timbre fiscal.
              </p>
            </div>
          </div>

          {/* Bottom Official Stamping & Wet Seal Box */}
          <div className="mt-8 pt-4 border-t border-slate-200 stamp-box">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
              <div>
                <p className="text-[10.5px] text-slate-600 font-sans leading-tight">
                  <span className="font-semibold text-slate-900">Mention de Conformité :</span>
                  <br />
                  Certification de service fait et de parution régulière au Quotidien Alaane conformément à l'ordre d'insertion ANEP.
                </p>
              </div>

              {/* Physical Stamp Frame */}
              <div className="text-center">
                <p className="text-xs font-bold uppercase text-slate-900 mb-1">
                  Pour le Journal Alaane
                </p>
                <p className="text-[10.5px] font-serif text-slate-700 italic mb-2">
                  {publisher.director_title}
                </p>
                <div className="w-56 h-28 mx-auto border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-2 text-slate-400 text-[10px]">
                  <ShieldCheck className="w-5 h-5 text-slate-300 mb-1" />
                  <span>Cadre réservé au</span>
                  <span className="font-bold text-slate-600 uppercase tracking-wider">
                    Cachet Humide & Signature
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
