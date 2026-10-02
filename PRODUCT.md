# Product Truth: Alaane-ANEP Invoicing

## 1. Purpose & Core Value
An automated administrative billing application for **Journal *Alaane*** (جريدة الآن) to process **ANEP** (*Entreprise Nationale de Communication, d'Édition et de Publicité*) insertion orders (*Bons de Commande*) and produce legally compliant Algerian commercial invoices on both **iPhone (as a mobile web app / camera scanner)** and Desktop.

---

## 2. Platforms & Hardware Context
- **Primary:** iPhone (iOS Safari / PWA Standalone with direct camera capture, bottom navigation, and safe-area support).
- **Secondary:** Desktop (Executive workstation with side-by-side split screen and laser printer integration).

---

## 3. Core Mobile Workflows
1. **Snap & Scan on iPhone:**
   - Tap "Prendre en photo" $\rightarrow$ opens iPhone camera directly.
   - Or pick photo from iPhone gallery / paste screenshot.
2. **AI Multimodal Extraction (Gemini 3.8 Flash):**
   - Automatically extracts order number, date, ad title, format (cm/col), and pre-tax amount (HT).
3. **Touch-Friendly Fiscal Verification:**
   - Real-time recalculation of 19% TVA, Total TTC, and French words in Dinars Algériens.
   - Number pad keyboard (`inputmode="decimal"`).
4. **Instant A4 Print & PDF:**
   - View rendered A4 sheet on phone.
   - 1-tap Print via AirPrint / native iOS sharing.
5. **Offline & Cloud Sync:**
   - LocalStorage offline resilience + Supabase PostgreSQL synchronization.
