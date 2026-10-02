# Product Truth: Alaane-ANEP Invoice Automation

## 1. Purpose & Core Value
An automated administrative billing workstation for **Journal *Alaane*** (جريدة الآن), an Algerian daily newspaper. It transforms physical scans, photos, or digital PDFs of **ANEP** (*Agence Nationale d'Édition et de Publicité*) insertion orders (*Bons de Commande*) into legally compliant, pixel-perfect Algerian commercial invoices ready for wet-stamping (*cachet humide*), signature, and payment processing.

---

## 2. Target Users & Operating Scene
- **Primary Users:** Administrative billing officers, accountants, and commercial directors at Journal *Alaane* in Algiers.
- **Operating Context:** Fast-paced daily or weekly publication cycles where advertisements (public procurement notices, commercial ads, ministerial tenders) must be verified against ANEP orders, billed accurately with mandatory Algerian tax compliance (19% TVA, legal French amount in words), printed on A4, stamped, and archived.
- **Critical Failure Modes to Prevent:**
  - Incorrect tax arithmetic or mismatch between Montant HT and TTC.
  - Misspelled French sums in words (can cause payment rejection by ANEP accounting and treasury inspectors).
  - Misplaced Bon de Commande numbers or dates.
  - Slow, repetitive manual re-typing of newspaper legal credentials (NIF, NIS, RC, RIB).

---

## 3. Core Workflows
1. **Document Ingestion:**
   - Drag & drop or browse image/PDF.
   - Direct clipboard paste (`Cmd+V / Ctrl+V`) for immediate screenshot ingestion.
   - Built-in "Charger Exemple ANEP" for instant testing.
2. **AI Multimodal Extraction (Gemini 2.5 Flash Vision):**
   - Extracts: `anep_bc_number`, `anep_bc_date`, `ad_title`, `publication_date`, `ad_format`, `amount_ht`.
3. **Algerian Fiscal & Wording Engine:**
   - Auto-computes 19% TVA and Total TTC.
   - Auto-translates numeric totals to French currency words (*"Arrêtée la présente facture à la somme de..."*).
4. **Live Split-Screen Inspection:**
   - Side-by-side verification: Source scan on the left (with zoom/pan), editable fields and live A4 preview on the right.
5. **Print & Cloud Archiving:**
   - Native A4 print (`Cmd+P`) formatted with exact page margins, hiding all UI controls.
   - Automatic sync to **Supabase** (PostgreSQL database & scanned document storage) with local storage fallback.
   - Continuous deployment on **Vercel** with version control on **GitHub**.

---

## 4. Platform & Technology Stack
- **Platform:** Modern Web Application (Desktop-first billing workstation, responsive for mobile review).
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Motion.
- **AI Processing:** Google GenAI SDK (`@google/genai`) with Gemini 2.5 Flash Vision.
- **Backend / Database:** Supabase (`@supabase/supabase-js`, PostgreSQL `invoices` & `company_settings` tables, `anep-documents` storage bucket) + LocalStorage offline resilience.
- **Hosting & CI/CD:** Vercel + GitHub (`polishmediaco-hash/alaane-anep`).

---

## 5. Assets & Brand Commitments
- **Official Brand Assets:** Transparent high-res cutout logo of *Journal Alaane* (`Alaan-cutout-logo.png`).
- **Publisher Legal Identity:** Journal Alaane (SARL / EURL de Presse), Alger, Algérie (NIF, NIS, RC, RIB, Art. d'imposition).
- **Client Identity:** ANEP - Agence Nationale d'Édition et de Publicité (Direction Commerciale).
