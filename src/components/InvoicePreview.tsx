import React, { useState } from 'react';
import { Invoice, PublisherProfile, DEFAULT_PUBLISHER } from '../types/invoice';
import { Printer, CheckCircle2, ShieldCheck, Share2, Copy, Check } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

  // iOS / Mobile Native Share Sheet (Solves Defect 6)
  const handleShare = async () => {
    const shareData = {
      title: `Facture ANEP ${invoice.invoice_number} — Journal Alaane`,
      text: `Facture ${invoice.invoice_number} pour ANEP (${invoice.items.length} Bon(s) de Commande) — Montant TTC: ${invoice.amount_ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy invoice summary to clipboard
      await navigator.clipboard.writeText(
        `${shareData.title}\n${shareData.text}\nArrêté: ${invoice.amount_ttc_words}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 overflow-y-auto select-none">
      {/* Top Preview Control Bar (Hidden on print) */}
      <div className="p-2.5 sm:p-3 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-20 no-print shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800">
            Aperçu Direct Format A4 (Norme Algérienne)
          </span>
          <Badge variant="success" className="hidden md:inline-flex text-[10px]">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
            <span>{invoice.items.length} Bon{invoice.items.length > 1 ? 's' : ''} de Commande</span>
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* iOS Share Sheet button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="text-xs min-h-[36px]"
            title="Partager par WhatsApp, Email ou AirDrop"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>Copié !</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 mr-1 text-slate-600" />
                <span className="hidden sm:inline">Partager</span>
              </>
            )}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onPrint}
            className="font-medium text-xs shadow-xs min-h-[36px]"
          >
            <Printer className="w-3.5 h-3.5 mr-1" />
            <span>Imprimer (3 Exemplaires)</span>
          </Button>
        </div>
      </div>

      {/* A4 Paper Responsive Container Center Stage: Solves Defect 2 */}
      <div className="flex-1 p-2 sm:p-6 lg:p-8 flex justify-center items-start bg-slate-100/90 pb-24 lg:pb-8 overflow-x-auto">
        <div
          id="printable-invoice"
          className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-5 sm:p-9 shadow-lg rounded-xl flex flex-col justify-between border border-slate-200/90 shrink-0"
          style={{ boxSizing: 'border-box' }}
        >
          {/* Top Document Header */}
          <div>
            {/* National Republic Banner */}
            <div className="text-center border-b border-slate-300 pb-2 mb-3.5">
              <h4 className="text-[11px] font-serif font-bold uppercase tracking-wider text-slate-800">
                RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE
              </h4>
              <p className="text-[10px] font-serif text-slate-600">
                الجمهورية الجزائرية الديمقراطية الشعبية
              </p>
            </div>

            {/* Letterhead Grid: Publisher (Left) vs Client ANEP (Right) */}
            <div className="grid grid-cols-12 gap-3 pb-3.5 border-b-2 border-slate-900 items-start">
              {/* Publisher Identity (Journal Alaane) */}
              <div className="col-span-12 sm:col-span-7 pr-2">
                <div className="flex items-center gap-3 mb-1.5">
                  <img
                    src={publisher.logo_url || '/assets/alaane-logo.png'}
                    alt="Logo Alaane"
                    className="w-11 h-11 object-contain"
                  />
                  <div>
                    <h1 className="font-extrabold text-lg leading-tight tracking-tight uppercase text-slate-950">
                      {publisher.name}
                    </h1>
                    <p className="text-xs font-serif font-bold text-blue-900 tracking-wide">
                      جريدة الآن — Quotidien National d'Information
                    </p>
                    <p className="text-[9.5px] text-slate-600 font-medium">
                      {publisher.legal_name}
                    </p>
                  </div>
                </div>

                <div className="text-[9.5px] text-slate-700 space-y-0.5 font-sans mt-1">
                  <p>{publisher.address}</p>
                  <p>Tél : {publisher.phone} | Email : {publisher.email}</p>
                  <div className="pt-0.5 grid grid-cols-2 gap-x-2 font-mono text-[9px]">
                    <p><span className="font-semibold text-slate-900">R.C. :</span> {publisher.rc}</p>
                    <p><span className="font-semibold text-slate-900">N.I.F. :</span> {publisher.nif}</p>
                    <p><span className="font-semibold text-slate-900">N.I.S. :</span> {publisher.nis}</p>
                    <p><span className="font-semibold text-slate-900">Art. Imp. :</span> {publisher.article_imposition}</p>
                  </div>
                  <p className="pt-0.5 font-mono text-[9px]">
                    <span className="font-semibold text-slate-900">RIB ({publisher.bank_name}) :</span> {publisher.rib}
                  </p>
                </div>
              </div>

              {/* Client Box: ANEP + MANDATORY ORGANISME DONNEUR D'ORDRE (Solves Defect 4) */}
              <div className="col-span-12 sm:col-span-5 border border-slate-300 rounded-lg p-2.5 bg-slate-50/70 text-[10px]">
                <p className="font-bold uppercase text-slate-950 text-[11px] border-b border-slate-300 pb-1 mb-1 flex items-center justify-between">
                  <span>DOIT : ANEP (SPA)</span>
                  <span className="text-[9px] font-mono font-normal text-slate-500">RÉGIE PRESSE</span>
                </p>
                <p className="font-semibold text-slate-900 leading-tight">
                  {invoice.client_name}
                </p>
                <p className="text-slate-700 text-[9.5px] mt-0.5">
                  Direction de l'Édition et de la Publicité (DEP) — Régie d'Alger
                </p>
                <p className="text-slate-600 text-[9px]">{invoice.client_address}</p>
                <div className="my-1.5 pt-1 border-t border-slate-200 font-mono text-[8.5px] text-slate-700 space-y-0.5">
                  <p><span className="font-semibold">NIF :</span> {invoice.client_nif} | <span className="font-semibold">NIS :</span> {invoice.client_nis}</p>
                </div>

                {/* Mandatory ANEP Clause */}
                <div className="pt-1.5 border-t border-slate-300 bg-blue-50/50 -mx-2.5 -mb-2.5 p-2 rounded-b-lg">
                  <p className="text-[9px] font-bold text-blue-900 uppercase">
                    POUR LE COMPTE DE :
                  </p>
                  <p className="text-[10px] font-extrabold text-slate-900 leading-tight">
                    {invoice.advertiser_name || "Direction des Travaux Publics (DTP) — Wilaya d'Alger"}
                  </p>
                </div>
              </div>
            </div>

            {/* Invoice Title & Reference Strip */}
            <div className="my-3 py-2 px-3 bg-slate-50 rounded-lg border border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-tight text-slate-950">
                  FACTURE COMMERCIALE N° : <span className="font-mono text-blue-800">{invoice.invoice_number}</span>
                </h2>
                <p className="text-[10.5px] text-slate-600">
                  Date d'émission : <span className="font-semibold text-slate-900">{invoice.invoice_date}</span>
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10.5px] font-bold text-slate-800">
                  Nombre de Bons de Commande :{' '}
                </span>
                <span className="font-mono text-xs font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-slate-300 inline-block">
                  {invoice.items.length} Ordre{invoice.items.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Itemized Invoicing Table (1 to N Bons de Commande) */}
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse border border-slate-300 text-xs min-w-[540px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 text-[9.5px] uppercase font-bold tracking-wider">
                    <th className="border border-slate-300 p-2 text-left w-[18%]">Réf. Bon Commande</th>
                    <th className="border border-slate-300 p-2 text-left w-[15%]">Parution</th>
                    <th className="border border-slate-300 p-2 text-left w-[37%]">Objet / Désignation de l'Annonce</th>
                    <th className="border border-slate-300 p-2 text-center w-[15%]">Format / Module</th>
                    <th className="border border-slate-300 p-2 text-right w-[15%]">Montant HT</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id || idx} className="text-slate-800">
                      <td className="border border-slate-300 p-2 font-mono text-[9.5px] align-top">
                        <p className="font-bold text-slate-900">{item.anep_bc_number || 'Non spécifié'}</p>
                        <p className="text-[8.5px] text-slate-500">du {item.anep_bc_date}</p>
                      </td>

                      <td className="border border-slate-300 p-2 text-[10px] align-top">
                        <p className="font-medium text-slate-900">{item.publication_date}</p>
                        {item.edition_number && (
                          <p className="text-[9px] text-slate-500">{item.edition_number}</p>
                        )}
                      </td>

                      <td className="border border-slate-300 p-2 align-top">
                        <p className="font-semibold text-slate-950 text-[10.5px] leading-snug">
                          {item.ad_title}
                        </p>
                        <p className="text-[9px] text-slate-500 italic mt-0.5">
                          Publication sous régie ANEP pour le compte du donneur d'ordre
                        </p>
                      </td>

                      <td className="border border-slate-300 p-2 text-center align-top font-medium">
                        <span className="inline-block px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-[10px]">
                          {item.ad_format}
                        </span>
                      </td>

                      <td className="border border-slate-300 p-2 text-right font-mono font-bold text-slate-950 text-[11px] align-top whitespace-nowrap">
                        {item.amount_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                      </td>
                    </tr>
                  ))}

                  {/* Visual padding row if only 1 item */}
                  {invoice.items.length === 1 && (
                    <tr className="h-10">
                      <td className="border border-slate-300"></td>
                      <td className="border border-slate-300"></td>
                      <td className="border border-slate-300"></td>
                      <td className="border border-slate-300"></td>
                      <td className="border border-slate-300"></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Totals Recapitulation Block */}
            <div className="mt-3.5 flex justify-end">
              <div className="w-72 border border-slate-300 rounded-lg overflow-hidden text-xs">
                <div className="flex justify-between p-2 border-b border-slate-200 bg-slate-50/50">
                  <span className="font-semibold text-slate-700">Total Hors Taxes (HT) :</span>
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

                <div className="flex justify-between p-1.5 border-b border-slate-200 text-[9.5px] text-slate-500 bg-slate-50/30">
                  <span>Droit de timbre fiscal :</span>
                  <span className="font-mono">0,00 DA (Exonéré)</span>
                </div>

                <div className="flex justify-between p-2.5 bg-slate-900 text-white text-xs sm:text-sm font-bold">
                  <span>NET À PAYER (TTC) :</span>
                  <span className="font-mono text-emerald-400">
                    {invoice.amount_ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                  </span>
                </div>
              </div>
            </div>

            {/* Legal Statement (Montant en Toutes Lettres) */}
            <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-300 text-xs leading-relaxed">
              <p className="font-serif italic text-slate-900">
                <span className="font-semibold not-italic text-slate-950 font-sans">
                  Arrêtée la présente facture à la somme de :
                </span>{' '}
                {invoice.amount_ttc_words.replace(/^Arrêtée la présente facture à la somme de\s*:\s*/i, '')}
              </p>
              <p className="text-[9.5px] text-slate-500 mt-1 font-sans">
                * Modalité de règlement : Par virement bancaire sur compte BNA. Exonéré du droit de timbre fiscal.
              </p>
            </div>
          </div>

          {/* Bottom Official Stamping & Wet Seal Box */}
          <div className="mt-6 pt-3 border-t border-slate-200 stamp-box">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div>
                <p className="text-[10px] text-slate-600 font-sans leading-relaxed">
                  <span className="font-semibold text-slate-900">Certification de Conformité & Service Fait :</span>
                  <br />
                  Le Journal Quotidien "Alaane" certifie l'exécution régulière et fidèle des insertions publicitaires prescrites par l'ANEP sous les références ci-dessus.
                </p>
                <p className="text-[9px] text-slate-500 mt-1.5 font-medium">
                  Note : Facture établie en 3 exemplaires originaux pour remise à la régie ANEP accompagnée du témoin de parution.
                </p>
              </div>

              {/* Physical Stamp Frame */}
              <div className="text-center">
                <p className="text-xs font-bold uppercase text-slate-900 mb-0.5">
                  Pour le Journal Alaane
                </p>
                <p className="text-[10px] font-serif text-slate-700 italic mb-1.5">
                  {publisher.director_title}
                </p>
                <div className="w-52 h-24 mx-auto border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-2 text-slate-400 text-[9.5px]">
                  <ShieldCheck className="w-4 h-4 text-slate-300 mb-0.5" />
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
