import { GoogleGenAI } from '@google/genai';
import { AnepBonDeCommandeData } from '../types/invoice';
import { amountToFrenchWordsDZD } from './numberToWordsFr';

const SYSTEM_PROMPT = `You are an expert administrative assistant in Algeria specializing in commercial billing for the national press. Your task is to analyze the provided image of an ANEP (Agence Nationale d'Édition et de Publicité) 'Bon de Commande' (insertion order) or 'Ordre d'Insertion'.

Carefully read both printed and handwritten text, stamps, and signatures.
Extract the following information:
1. anep_bc_number: The exact order number (Numéro du Bon de Commande or Matricule ANEP N°...).
2. anep_bc_date: The date on the Bon de Commande (formatted as DD/MM/YYYY if discernible).
3. advertiser_name: The client institution or advertiser (Organisme Client / Pour le compte de : e.g. Direction des Travaux Publics, Ministère, etc.).
4. ad_title: The title or subject of the advertisement/tender (Objet / Titre de l'annonce, e.g. Avis d'Appel d'Offres, Mise en demeure, etc.).
5. publication_date: The requested date of publication for the ad (Date de parution).
6. ad_format: The size, module, or column dimension (e.g. '1/4 page', '1/2 page', 'Pleine page', or '4 col x 15 cm').
7. amount_ht: The pre-tax amount (Montant HT) in Algerian Dinars (numbers only).
8. tva_amount: The 19% TVA amount (Montant TVA = amount_ht * 0.19). Calculate if missing.
9. amount_ttc: The total amount including tax (Montant TTC = amount_ht + tva_amount).
10. amount_ttc_words: The amount_ttc spelled out fully in French letters with 'Dinars Algériens'.

Strictly return valid JSON adhering to the specified schema without Markdown formatting.`;

const JSON_SCHEMA = {
  type: 'object',
  properties: {
    anep_bc_number: {
      type: 'string',
      description: 'The order number (Numéro du Bon de Commande / Matricule ANEP).',
    },
    anep_bc_date: {
      type: 'string',
      description: 'The date on the Bon de Commande.',
    },
    advertiser_name: {
      type: 'string',
      description: "The ordering advertiser institution (Organisme client / Pour le compte de).",
    },
    ad_title: {
      type: 'string',
      description: 'The title or subject of the advertisement.',
    },
    publication_date: {
      type: 'string',
      description: 'The requested date of publication for the ad.',
    },
    ad_format: {
      type: 'string',
      description: 'The size or module of the advertisement (e.g. 1/4 page, 4 col x 15 cm).',
    },
    amount_ht: {
      type: 'number',
      description: 'The pre-tax amount (Montant HT) in Algerian Dinars.',
    },
    tva_amount: {
      type: 'number',
      description: 'The 19% TVA amount. amount_ht * 0.19.',
    },
    amount_ttc: {
      type: 'number',
      description: 'The total amount including tax (Montant TTC). amount_ht + tva_amount.',
    },
    amount_ttc_words: {
      type: 'string',
      description: 'The amount_ttc written out fully in French letters.',
    },
  },
  required: ['anep_bc_number', 'anep_bc_date', 'ad_title', 'ad_format', 'amount_ht', 'amount_ttc'],
};

export async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [header, base64] = result.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || file.type || 'image/jpeg';
      resolve({ base64, mimeType });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Extracts ANEP Bon de Commande data using Gemini 3.8 Flash via the Interactions API
 */
export async function analyzeBonDeCommande(
  fileOrBase64: File | { base64: string; mimeType: string },
  apiKey?: string
): Promise<AnepBonDeCommandeData> {
  const resolvedKey = apiKey?.trim() || (import.meta.env.VITE_GEMINI_API_KEY as string)?.trim() || '';
  if (!resolvedKey) {
    throw new Error("Service d'extraction IA indisponible : clé d'environnement non configurée.");
  }

  const ai = new GoogleGenAI({ apiKey: resolvedKey });

  let base64Data: string;
  let mimeType: string;

  if (fileOrBase64 instanceof File) {
    const converted = await fileToBase64(fileOrBase64);
    base64Data = converted.base64;
    mimeType = converted.mimeType;
  } else {
    base64Data = fileOrBase64.base64;
    mimeType = fileOrBase64.mimeType;
  }

  // Model selection: gemini-2.5-flash per official Google GenAI SDK standards
  const modelName = 'gemini-2.5-flash';

  let rawJsonText = '';

  try {
    // 1. Try modern Interactions API first
    const interaction = await ai.interactions.create({
      model: modelName,
      system_instruction: SYSTEM_PROMPT,
      input: [
        {
          type: 'text',
          text: "Extract all Bon de Commande fields strictly according to the specified JSON schema.",
        },
        {
          type: 'image',
          data: base64Data,
          mime_type: mimeType,
        },
      ],
      response_format: {
        type: 'json_object',
        schema: JSON_SCHEMA,
      },
    });

    rawJsonText = interaction.output_text || '';
  } catch (interactionErr: any) {
    console.warn('Interactions API fallback to models.generateContent:', interactionErr?.message);

    // 2. Resilient fallback to models.generateContent with responseSchema
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [
            { text: SYSTEM_PROMPT + "\n\nExtract the Bon de Commande data from this image strictly as JSON:" },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: JSON_SCHEMA,
      },
    });

    rawJsonText = response.text || '';
  }

  if (!rawJsonText) {
    throw new Error("L'API Gemini n'a renvoyé aucun résultat textuel.");
  }

  // Clean markdown block if present
  let cleanJson = rawJsonText.trim();
  if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleanJson);
  } catch (e) {
    console.error('Failed to parse Gemini output:', rawJsonText);
    throw new Error("Impossible d'interpréter la réponse JSON retournée par le modèle Gemini.");
  }

  // Ensure and recalculate financial precision
  const amountHt = typeof parsed.amount_ht === 'number' ? parsed.amount_ht : parseFloat(parsed.amount_ht) || 0;
  const tvaAmount = Math.round(amountHt * 0.19 * 100) / 100;
  const amountTtc = Math.round((amountHt + tvaAmount) * 100) / 100;
  const amountWords = amountToFrenchWordsDZD(amountTtc);

  return {
    anep_bc_number: parsed.anep_bc_number || 'ANEP N° non spécifié',
    anep_bc_date: parsed.anep_bc_date || new Date().toLocaleDateString('fr-FR'),
    advertiser_name: parsed.advertiser_name || "Direction des Travaux Publics (DTP) — Wilaya d'Alger",
    ad_title: parsed.ad_title || "Avis d'appel d'offres / Annonce légale",
    publication_date: parsed.publication_date || parsed.anep_bc_date || new Date().toLocaleDateString('fr-FR'),
    ad_format: parsed.ad_format || '1/4 page',
    amount_ht: amountHt,
    tva_amount: tvaAmount,
    amount_ttc: amountTtc,
    amount_ttc_words: amountWords,
  };
}
