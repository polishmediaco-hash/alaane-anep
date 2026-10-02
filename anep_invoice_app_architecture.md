# ANEP Invoice Automation App

## 1. System Overview
This application automates the generation of legally compliant Algerian commercial invoices for ANEP (Agence Nationale d'Édition et de Publicité). It uses the Gemini API's multimodal capabilities to read physical or digital insertion orders (*Bons de Commande*) and maps the extracted data directly into a printable invoice template.

## 2. Application Workflow
1. **Input Stage:** The user uploads an image (JPG/PNG) or PDF of the ANEP *Bon de Commande* and any handwritten notes regarding publication dates.
2. **AI Processing (Gemini Vision):** The application sends the document to the Gemini API with a strict JSON schema prompt to extract required fields (dates, amounts, ad sizes).
3. **Data Mapping:** The application calculates any missing financial data (like calculating the 19% TVA and Total TTC if only the HT is provided) and maps the JSON to the invoice template.
4. **Output Stage:** The app generates a structured, printable invoice document ready for the *cachet humide* (wet seal) and signature.

## 3. Data Model (Gemini Structured Output Schema)
To ensure the Gemini API returns data that your app can use to fill the template, use this JSON schema in your API request:

```json
{
  "type": "object",
  "properties": {
    "anep_bc_number": {
      "type": "string",
      "description": "The order number (Numéro du Bon de Commande) from ANEP."
    },
    "anep_bc_date": {
      "type": "string",
      "description": "The date on the Bon de Commande."
    },
    "ad_title": {
      "type": "string",
      "description": "The title or subject of the advertisement."
    },
    "publication_date": {
      "type": "string",
      "description": "The requested date of publication for the ad."
    },
    "ad_format": {
      "type": "string",
      "description": "The size or module of the advertisement (e.g., 1/4 page, 1/2 page)."
    },
    "amount_ht": {
      "type": "number",
      "description": "The pre-tax amount (Montant HT) in Algerian Dinars."
    },
    "tva_amount": {
      "type": "number",
      "description": "The 19% TVA amount. Calculate this if missing: amount_ht * 0.19."
    },
    "amount_ttc": {
      "type": "number",
      "description": "The total amount including tax (Montant TTC). amount_ht + tva_amount."
    },
    "amount_ttc_words": {
      "type": "string",
      "description": "The amount_ttc written out fully in French letters (e.g., 'Cent mille Dinars Algériens')."
    }
  },
  "required": ["anep_bc_number", "anep_bc_date", "ad_title", "ad_format", "amount_ht", "amount_ttc"]
}
```

## 4. System Prompt for Gemini
Use the following prompt in your application's backend when calling the Gemini API:

> **System Prompt:**
> You are an expert administrative assistant in Algeria specializing in commercial billing. Your task is to analyze the provided image of an ANEP (Agence Nationale d'Édition et de Publicité) 'Bon de Commande' (insertion order). 
> 
> Extract the exact order number, date, ad title, format, and pricing. If the TVA (19%) or Total TTC is not explicitly written on the form, you must calculate them accurately based on the Montant HT. You must also spell out the Total TTC in French words for the `amount_ttc_words` field. Output the final data strictly matching the provided JSON schema.

## 5. UI Implementation Checklist
*   **File Uploader component:** To accept the ANEP order images.
*   **Form inputs:** To allow manual correction of the AI-extracted JSON data before finalizing (critical for legal compliance).
*   **Document Viewer/Renderer:** A view that injects the JSON variables into your HTML/CSS or Google Docs template.
*   **Print/Export Button:** To output the final invoice for physical stamping.