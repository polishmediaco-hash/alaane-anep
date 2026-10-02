import { AnepBonDeCommandeData, InvoiceItem } from '../types/invoice';
import { amountToFrenchWordsDZD } from './numberToWordsFr';

export const SAMPLE_ANEP_BC: AnepBonDeCommandeData = {
  anep_bc_number: '2416008452 / DEP-REGIE-CENTRE',
  anep_bc_date: '02/10/2026',
  advertiser_name: "Direction des Travaux Publics (DTP) — Wilaya d'Alger",
  ad_title: "Avis d'Appel d'Offres National Ouvert N° 08/DTP/2026 — Travaux de Réhabilitation du Réseau Routier",
  publication_date: '05/10/2026',
  ad_format: '4 colonnes x 18 cm (72 cm/col) — 1/2 Page Recto',
  amount_ht: 185000.0,
  tva_amount: 35150.0,
  amount_ttc: 220150.0,
  amount_ttc_words: amountToFrenchWordsDZD(220150.0),
};

export const SAMPLE_ANEP_BC_ITEMS: InvoiceItem[] = [
  {
    id: 'bc-item-01',
    anep_bc_number: '2416008452 / DEP-REGIE-CENTRE',
    anep_bc_date: '02/10/2026',
    advertiser_name: "Direction des Travaux Publics (DTP) — Wilaya d'Alger",
    ad_title: "Avis d'Appel d'Offres National Ouvert N° 08/DTP/2026 — Travaux de Réhabilitation du Réseau Routier (Lot 02)",
    publication_date: '05/10/2026',
    edition_number: 'N° 1845',
    ad_format: '4 col x 18 cm (72 cm/col) — 1/2 Page Recto',
    amount_ht: 185000.0,
  },
  {
    id: 'bc-item-02',
    anep_bc_number: '2416008510 / DEP-REGIE-CENTRE',
    anep_bc_date: '03/10/2026',
    advertiser_name: "Direction des Travaux Publics (DTP) — Wilaya d'Alger",
    ad_title: "Avis de Prorogation de Délai N° 01/2026 — Appel d'Offres N° 08/DTP/2026",
    publication_date: '08/10/2026',
    edition_number: 'N° 1848',
    ad_format: '2 col x 12 cm (24 cm/col) — 1/4 Page',
    amount_ht: 55000.0,
  },
];

/**
 * Creates a synthetic realistic ANEP Bon de Commande image on an in-memory canvas
 * and returns it as a data URL (PNG) so the user can immediately test pan/zoom and AI analysis.
 */
export function generateSampleBonDeCommandeCanvas(orderIndex: 1 | 2 = 1): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background Paper (subtle off-white scanned look)
  ctx.fillStyle = '#fcfbf7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer document frame
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

  // Header Banner: République Algérienne
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px serif';
  ctx.textAlign = 'center';
  ctx.fillText('RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE', canvas.width / 2, 85);
  ctx.font = 'italic 18px serif';
  ctx.fillText('الجمهورية الجزائرية الديمقراطية الشعبية', canvas.width / 2, 115);

  // Divider
  ctx.beginPath();
  ctx.moveTo(80, 135);
  ctx.lineTo(canvas.width - 80, 135);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#047857';
  ctx.stroke();

  // ANEP Header Block
  ctx.textAlign = 'left';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillStyle = '#047857';
  ctx.fillText('ANEP — Entreprise Nationale de Communication,', 80, 185);
  ctx.fillText("d'Édition et de Publicité", 80, 220);

  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText("Direction de l'Édition et de la Publicité (DEP) — Régie d'Alger", 80, 255);
  ctx.fillText('01, Avenue Pasteur, Alger — Tél: 021 73 76 78 / NIF: 099916000000000', 80, 280);

  // Box: Title BON DE COMMANDE
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(80, 310, canvas.width - 160, 75);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.strokeRect(80, 310, canvas.width - 160, 75);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("BON DE COMMANDE / ORDRE D'INSERTION PRESSE", canvas.width / 2, 355);

  const isSecond = orderIndex === 2;
  const bcNum = isSecond ? 'ANEP-2416008510 / DEP-REGIE-CENTRE' : 'ANEP-2416008452 / DEP-REGIE-CENTRE';
  const bcDate = isSecond ? '03 Octobre 2026' : '02 Octobre 2026';
  const parutionDate = isSecond ? 'Édition du 08 Octobre 2026' : 'Édition du 05 Octobre 2026';
  const adTitle = isSecond ? 'Avis de Prorogation de Délai N° 01/2026' : "Avis d'Appel d'Offres National Ouvert N° 08/DTP/2026";
  const adSub = isSecond ? "Objet : Appel d'Offres N° 08/DTP/2026 — Prolongation dépôt offres" : 'Objet : Travaux de réhabilitation et modernisation du réseau routier (Lot 02)';
  const adFmt = isSecond ? '2 colonnes x 12 cm' : '4 colonnes x 18 cm';
  const adTotalCol = isSecond ? '(Total: 24 cm/col)' : '(Total: 72 cm/col)';
  const adModule = isSecond ? 'Module : 1/4 Page' : 'Module : 1/2 Page Recto';
  const amountHtStr = isSecond ? '55 000,00 DA' : '185 000,00 DA';
  const tvaStr = isSecond ? '10 450,00 DA' : '35 150,00 DA';
  const ttcStr = isSecond ? '65 450,00 DA' : '220 150,00 DA';
  const lettersStr = isSecond ? 'Soixante-cinq mille quatre cent cinquante Dinars Algériens TTC' : 'Deux cent vingt mille cent cinquante Dinars Algériens TTC';

  // Order Metadata Block
  ctx.textAlign = 'left';
  ctx.font = 'bold 20px monospace';
  ctx.fillStyle = '#dc2626';
  ctx.fillText('N° COMMANDE : ' + bcNum, 90, 430);

  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('Date d’émission : ' + bcDate, 700, 430);

  // Beneficiary Journal
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(80, 460, canvas.width - 160, 110);
  ctx.fillStyle = '#047857';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('JOURNAL MANDATÉ : QUOTIDIEN NATIONAL "ALAANE" (جريدة الآن)', 100, 495);
  ctx.fillStyle = '#334155';
  ctx.font = '16px sans-serif';
  ctx.fillText('Langue de publication : Français et Arabe', 100, 525);
  ctx.fillText('Date(s) de parution requise(s) : ' + parutionDate, 100, 550);

  // Advertiser / Donneur d'ordre
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText("ORGANISME CLIENT : Direction des Travaux Publics (DTP) — Wilaya d'Alger", 100, 615);

  // Insertion Specifications Table
  const tableY = 650;
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(80, tableY, canvas.width - 160, 45);
  ctx.strokeStyle = '#0f172a';
  ctx.strokeRect(80, tableY, canvas.width - 160, 45);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('DÉSIGNATION / OBJET DE L’ANNONCE', 95, tableY + 28);
  ctx.fillText('FORMAT / MODULE', 680, tableY + 28);
  ctx.fillText('MONTANT HT (DZD)', 950, tableY + 28);

  // Table Content
  ctx.strokeRect(80, tableY + 45, canvas.width - 160, 220);
  ctx.font = '16px sans-serif';
  ctx.fillText(adTitle, 95, tableY + 80);
  ctx.font = 'italic 15px sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(adSub, 95, tableY + 110);
  ctx.fillText('Notice de mise en conformité réglementaire (BOMOP / Presse Quotidienne)', 95, tableY + 135);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(adFmt, 680, tableY + 80);
  ctx.font = '14px sans-serif';
  ctx.fillText(adTotalCol, 680, tableY + 110);
  ctx.fillText(adModule, 680, tableY + 135);

  ctx.font = 'bold 20px monospace';
  ctx.fillText(amountHtStr, 950, tableY + 80);

  // Totals Box
  const totalsY = 950;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(600, totalsY, 520, 180);
  ctx.strokeRect(600, totalsY, 520, 180);

  ctx.font = '17px sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.fillText('Total Hors Taxes (Montant HT) :', 620, totalsY + 40);
  ctx.fillText('TVA applicable (19,00 %) :', 620, totalsY + 80);
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#047857';
  ctx.fillText('NET À FACTURER (TTC) :', 620, totalsY + 135);

  ctx.font = 'bold 18px monospace';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'right';
  ctx.fillText(amountHtStr, 1100, totalsY + 40);
  ctx.fillText(tvaStr, 1100, totalsY + 80);
  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = '#047857';
  ctx.fillText(ttcStr, 1100, totalsY + 135);

  // Written Amount
  ctx.textAlign = 'left';
  ctx.fillStyle = '#1e293b';
  ctx.font = 'italic 16px serif';
  ctx.fillText('Arrêté le présent bon de commande à la somme de :', 80, 1180);
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(lettersStr, 80, 1210);

  // Wet Stamp & Signature Simulator (Circular Purple/Blue Seal)
  ctx.save();
  ctx.translate(900, 1370);
  ctx.rotate(-0.08);

  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 95, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 85, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#2563eb';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★ ANEP — RÉGIE PUBLICITAIRE ★', 0, -45);
  ctx.fillText("DIRECTION DE L'ÉDITION", 0, -25);
  ctx.fillText('ALGER', 0, 0);
  ctx.font = 'bold 11px monospace';
  ctx.fillText('SERVICE ORDONNANCEMENT', 0, 30);
  ctx.fillText('02 OCT 2026', 0, 50);

  // Hand signature scribble
  ctx.beginPath();
  ctx.moveTo(-40, 10);
  ctx.bezierCurveTo(-20, -10, 20, 30, 40, -5);
  ctx.bezierCurveTo(50, -30, 10, -10, 60, 20);
  ctx.strokeStyle = '#1d4ed8';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.restore();

  // Footer Legal Note
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  ctx.font = '13px sans-serif';
  ctx.fillText(
    "Mention obligatoire : Joindre impérativement la facture en 3 exemplaires originaux et le témoin de parution complet.",
    canvas.width / 2,
    1540
  );

  return canvas.toDataURL('image/png');
}
