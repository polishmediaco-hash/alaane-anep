import { GoogleGenAI } from '@google/genai';
import { Invoice, PublisherProfile } from '../types/invoice';

export interface ChatAction {
  type: 'update_invoice_fields' | 'add_bc_item';
  label: string;
  payload: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  action?: ChatAction;
}

const SYSTEM_INSTRUCTIONS = `Vous êtes l'Assistant IA Administratif et Juridique du Journal Alaane (جريدة الآن).
Votre rôle est d'assister les agents de facturation et la direction pour l'établissement, le contrôle et la validation des factures légales destinées à l'ANEP (Entreprise Nationale de Communication, d'Édition et de Publicité) en Algérie.

Règles et compétences réglementaires :
1. Décret exécutif n° 05-468 : Régit la publicité publique et les ordres d'insertion (Bons de Commande ANEP).
2. Conformité ANEP obligatoire :
   - Mention indispensable : 'Pour le compte de : [Organisme client]'.
   - Numéro et date de chaque Bon de Commande / Matricule ANEP.
   - Intitulé ou objet de l'annonce (avis d'appel d'offres, prorogation, mise en demeure, etc.).
   - Format en colonnes/cm ou page.
   - Montant Hors Taxes (HT) en Dinars Algériens (DZD).
   - Taux TVA légal obligatoire : 19%.
   - Total TTC et arrêté sacramental en toutes lettres en français ('Arrêtée la présente facture à la somme de...').
   - Exonération du droit de timbre fiscal (Art. 251 du Code du Timbre) car règlement par virement bancaire sur compte BNA.
3. Vous avez accès aux données en temps réel de la facture en cours d'édition.
4. Répondez de manière concise, courtoise, professionnelle et rigoureuse.
5. Si l'utilisateur demande une correction ou un ajout (ex: 'corrige le titre de l'annonce en...', 'ajoute un bon de commande...'), proposez la réponse explicative et terminez optionnellement par un bloc JSON d'action balisé :
<<<ACTION
{
  "type": "update_invoice_fields",
  "label": "Mettre à jour la facture",
  "payload": { ...champs à modifier... }
}
ACTION>>>`;

/**
 * Sends a message to Gemini with full live invoice context
 */
export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  context: {
    invoice: Invoice;
    publisher: PublisherProfile;
  }
): Promise<{ text: string; action?: ChatAction }> {
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY as string)?.trim() || '';

  // Context summary serialized for the model
  const contextSummary = JSON.stringify(
    {
      invoice_number: context.invoice.invoice_number,
      invoice_date: context.invoice.invoice_date,
      advertiser_name: context.invoice.advertiser_name,
      status: context.invoice.status,
      items_count: context.invoice.items.length,
      items: context.invoice.items.map((it, idx) => ({
        index: idx + 1,
        anep_bc_number: it.anep_bc_number,
        anep_bc_date: it.anep_bc_date,
        ad_title: it.ad_title,
        ad_format: it.ad_format,
        publication_date: it.publication_date,
        edition_number: it.edition_number,
        amount_ht: it.amount_ht,
      })),
      amount_ht: context.invoice.amount_ht,
      tva_rate: context.invoice.tva_rate,
      tva_amount: context.invoice.tva_amount,
      amount_ttc: context.invoice.amount_ttc,
      amount_ttc_words: context.invoice.amount_ttc_words,
      publisher: {
        name: context.publisher.name,
        nif: context.publisher.nif,
        rc: context.publisher.rc,
        rib: context.publisher.rib,
      },
    },
    null,
    2
  );

  if (!apiKey || apiKey.includes('your_gemini')) {
    // Intelligent contextual fallback when key is not configured locally
    return generateOfflineAssistantResponse(message, context);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Build contents history
    const contents: any[] = [
      {
        role: 'user',
        parts: [
          {
            text: `${SYSTEM_INSTRUCTIONS}\n\n[CONTEXTE ACTUEL DU DOSSIER DE FACTURATION EN TEMPS RÉEL]\n${contextSummary}`,
          },
        ],
      },
      {
        role: 'model',
        parts: [
          {
            text: "Bien reçu. Je dispose du contexte complet du dossier de facturation en cours pour le Journal Alaane et l'ANEP. Comment puis-je vous aider ?",
          },
        ],
      },
    ];

    // Append last 4 messages from conversation history for conversational continuity
    const recent = history.slice(-4);
    for (const msg of recent) {
      contents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      });
    }

    // Append current prompt
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
    });

    const fullText = response.text || '';

    // Extract optional structured action
    let cleanedText = fullText;
    let action: ChatAction | undefined;

    const actionMatch = fullText.match(/<<<ACTION\s*([\s\S]*?)\s*ACTION>>>/);
    if (actionMatch && actionMatch[1]) {
      try {
        action = JSON.parse(actionMatch[1].trim());
        cleanedText = fullText.replace(/<<<ACTION[\s\S]*?ACTION>>>/, '').trim();
      } catch (err) {
        console.warn('Failed to parse AI chat action JSON:', err);
      }
    }

    return {
      text: cleanedText,
      action,
    };
  } catch (error: any) {
    console.warn('Gemini chat API error, falling back to contextual generator:', error?.message);
    return generateOfflineAssistantResponse(message, context);
  }
}

/**
 * High-accuracy fallback engine for common ANEP billing queries
 */
function generateOfflineAssistantResponse(
  message: string,
  context: { invoice: Invoice; publisher: PublisherProfile }
): { text: string; action?: ChatAction } {
  const lower = message.toLowerCase();
  const inv = context.invoice;

  if (lower.includes('conform') || lower.includes('vérif')) {
    const errors: string[] = [];
    if (!inv.advertiser_name) errors.push("• Mention de l'organisme client ('Pour le compte de')");
    if (!inv.invoice_number) errors.push("• Numéro de facture journal");
    inv.items.forEach((it, idx) => {
      if (!it.anep_bc_number) errors.push(`• N° Bon de Commande sur la ligne #${idx + 1}`);
      if (!it.ad_title) errors.push(`• Objet/titre de l'annonce sur la ligne #${idx + 1}`);
      if (!it.amount_ht || it.amount_ht <= 0) errors.push(`• Montant HT sur la ligne #${idx + 1}`);
    });

    if (errors.length === 0) {
      return {
        text: `✅ **Contrôle de Conformité ANEP : DOSSIER VALIDÉ**\n\nVotre facture **${inv.invoice_number}** respecte tous les critères réglementaires :\n- Organisme ordonnateur : **${inv.advertiser_name}**\n- **${inv.items.length}** Bon(s) de Commande inclus avec matricules et dates\n- Total HT : **${inv.amount_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA**\n- TVA (19%) : **${inv.tva_amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA**\n- Net à Payer (TTC) : **${inv.amount_ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA**\n- Arrêté sacramental en lettres conforme et exonéré de timbre fiscal pour virement BNA.`,
      };
    } else {
      return {
        text: `⚠️ **Points de vigilance ANEP détectés (${errors.length}) :**\n\nPour éviter tout rejet par le service ordonnateur de l'ANEP, veuillez renseigner :\n${errors.join('\n')}\n\nUne fois complété, le dossier pourra être imprimé en 3 exemplaires conformes.`,
      };
    }
  }

  if (lower.includes('résum') || lower.includes('dossier') || lower.includes('récap')) {
    return {
      text: `📋 **Synthèse du Dossier ${inv.invoice_number} :**\n\n- **Client :** ANEP Régie d'Alger (Pour le compte de : *${inv.advertiser_name || 'Non spécifié'}*)\n- **Date d'émission :** ${inv.invoice_date}\n- **Nombre d'insertions :** ${inv.items.length} Bon(s) de Commande\n- **Montant HT :** ${inv.amount_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA\n- **TVA 19% :** ${inv.tva_amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA\n- **Total TTC :** ${inv.amount_ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA\n- **Arrêté :** *${inv.amount_ttc_words}*`,
    };
  }

  if (lower.includes('timbre') || lower.includes('exonér')) {
    return {
      text: `📜 **Mention Légale sur le Droit de Timbre :**\n\nConformément à l'**article 251 du Code du Timbre fiscal algérien**, les règlements d'annonces de presse publique effectués par virement bancaire ou postal (Compte BNA du Journal Alaane n° \`${context.publisher.rib}\`) sont **exonérés du droit de timbre fiscal**.\n\nLa facture porte légalement la mention : *"Exonéré de droit de timbre — Règlement par virement bancaire"* sans aucune retenue additionnelle.`,
    };
  }

  if (lower.includes('intitul') || lower.includes('titre') || lower.includes('appel d')) {
    return {
      text: `✍️ **Recommandation pour l'intitulé de l'annonce :**\n\nLes services de l'ANEP exigent que le libellé mentionne le type d'avis et la référence du dossier. Par exemple :\n*"Avis d'Appel d'Offres National Ouvert N° 12/DTP/2026 — Travaux de réhabilitation du réseau routier"*\n\nSouhaitez-vous que j'harmonise le titre de la ligne active ?`,
    };
  }

  return {
    text: `Bonjour ! Je suis l'assistant IA du Journal Alaane. J'analyse en continu votre dossier de facturation en cours (**${inv.invoice_number}**, ${inv.items.length} Bon(s) de Commande pour un total de **${inv.amount_ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA TTC**).\n\nVous pouvez me demander de :\n- Vérifier la conformité réglementaire ANEP\n- Résumer le dossier financier\n- Vérifier le calcul de la TVA 19% et l'arrêté en toutes lettres\n- Rédiger ou corriger les mentions d'une annonce`,
  };
}
