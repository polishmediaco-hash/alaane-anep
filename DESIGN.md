# Design System & Visual Authority: Alaane-ANEP Invoicing

## 1. Design Direction: Algerian Press & Fiscal Authority
- **Surface Mode:** **Operate** (Dense, scannable billing cockpit prioritizing speed, legal precision, and effortless document comparison).
- **Core Aesthetic:** High-trust editorial ledger. Blends classic print journalism authority with modern financial workstation ergonomics.
- **Anti-Slop Guarantees:**
  - Zero AI purple/indigo gradients or generic dark mesh backgrounds.
  - Zero decorative 3-column card soup.
  - Pure physical realism: The A4 invoice preview looks and behaves identically on screen as it does when emerging from a color laser printer.

---

## 2. Color Palette & Semantics

| Token | Hex / Class | Semantic Usage |
| :--- | :--- | :--- |
| **Canvas Background** | `#0b0f19` / `bg-slate-950` | Workstation shell; dark, immersive frame that lets documents and white A4 paper pop. |
| **Panel Surface** | `#111827` / `bg-slate-900` | Toolbars, settings drawers, and control panels. |
| **Paper Canvas** | `#ffffff` / `bg-white` | Physical A4 invoice rendering with genuine print styling. |
| **Primary Accent** | `#047857` / `emerald-700` | Press Emerald: primary actions ("Imprimer", "Enregistrer"), verified status, and key totals. |
| **Secondary Accent** | `#0284c7` / `sky-600` | AI Processing pulses and active focus rings. |
| **Borders & Dividers**| `#334155` / `border-slate-700` (UI) / `#cbd5e1` (A4 Paper) | Precision hairlines that ground tabular invoice rows and control clusters. |
| **Text Primary** | `#f8fafc` / `text-slate-100` (UI) / `#0f172a` (A4 Paper) | High-contrast readability in both dark workbench and white paper contexts. |

---

## 3. Typography & Hierarchy

- **Interface Sans:** Clean, technical sans-serif (`Inter`, `Plus Jakarta Sans`, system fallbacks) for dense form inputs, toolbar controls, and metadata tags.
- **Monospace Financial Numbers:** `font-mono` with `tabular-nums` for all numeric amounts (HT, TVA, TTC, N° BC, N° Facture, RIB, NIF) to ensure perfect vertical alignment in billing tables.
- **Official Print Serif:** Classic Algerian editorial serif (`Playfair Display`, `Georgia`, or `Merriweather`) reserved exclusively for the newspaper header banner and the official title *"RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE"* and *"FACTURE COMMERCIALE"*.

---

## 4. Layout Architecture (The Split Studio)

```
[ Top Navigation: Logo | Document Title | Sync Status | Action Buttons ]
┌──────────────────────────────────────┬──────────────────────────────────────┐
│  LEFT PANEL: Document Studio (45%)   │ RIGHT PANEL: Legal Workspace (55%)   │
│                                      │                                      │
│  - Ingestion Dropzone & Paste Hook   │  - Tabs: [ Formulaire ] [ Aperçu A4] │
│  - Zoom, Pan, Rotate Toolbar         │  - Form View: Grouped legal inputs   │
│  - High-Res Bon de Commande Viewer   │  - Live A4 Canvas: Scaled sheet with  │
│  - AI Confidence & Field Highlight   │    true print margins and stamps     │
└──────────────────────────────────────┴──────────────────────────────────────┘
[ Action Footer: Keyboard shortcuts (Cmd+P, Cmd+Enter) | Auto-save status ]
```

---

## 5. Print Perfection Rules (`@media print`)
- **Dimensions:** Strict ISO A4 portrait (`210mm × 297mm`).
- **Margins:** Fixed `12mm 10mm` margin box. Zero browser-injected header/footer timestamps or URL slugs.
- **Hairlines:** Crisp `1px solid #cbd5e1` borders that render sharp on 300/600 DPI office laser printers.
- **Wet Seal Area:** A designated 70mm × 35mm framed stamping zone for *"Le Directeur de la Publication / Cachet et Signature"* with zero page-break clipping.
