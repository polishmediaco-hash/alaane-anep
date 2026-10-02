# Design System & Visual Authority: Alaane-ANEP (Mobile-First Swiss Minimalist)

## 1. Visual Direction: Executive Swiss Minimalism & iOS FinTech
- **Aesthetic:** Clean, crisp, high-trust executive Swiss typography and Apple iOS FinTech.
- **Platforms:** **iPhone First (PWA / Standalone Web App)** + Responsive Desktop Studio.
- **Color Palette:**
  - **Canvas Background:** Pure soft slate `#F8FAFC` (clean, airy, daylight-readable).
  - **Surface & Cards:** Pure white `#FFFFFF` with ultra-fine borders `#E2E8F0` and soft diffusion shadows.
  - **Primary Brand / Action:** Deep Executive Navy `#0F172A` and Royal Cobalt `#2563EB` (high-contrast, crystal clear).
  - **Financial Highlights:** Refined Emerald `#059669` and Warm Gold `#D97706`.
  - **Text:** Deep Charcoal `#0F172A` (900) for headers, Slate `#475569` (600) for body, Slate `#94A3B8` (400) for captions.
  - **Anti-Slop Ban:** No pitch-black dark-mode default, no gloomy murky neon-green hacker colors, no AI purple meshes.

---

## 2. iPhone Mobile-First Native Architecture

### A. iOS PWA & Standalone Specs
- `viewport-fit=cover` with `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.
- Apple Mobile Web App tags: `apple-mobile-web-app-capable: yes`, `apple-mobile-web-app-status-bar-style: default`.
- Direct Camera Integration: `capture="environment"` allows taking a high-res photo of the paper Bon de Commande directly on iPhone.

### B. Mobile Navigation (iOS Bottom Tab Bar)
Four primary tabs (48px touch targets, haptic feel):
1. 📷 **Scanner** (Direct Camera, Photo Library, interactive zoom/rotate)
2. 📝 **Formulaire** (Touch-friendly inputs with `inputmode="decimal"`, instant 19% TVA + TTC auto-calculation)
3. 📄 **Aperçu A4** (Pixel-perfect legal A4 sheet with 1-tap Print & PDF Export)
4. 📁 **Historique** (Recent invoices list with search, status filters, and duplicate)

---

## 3. Desktop Workstation Enhancement
On large screens ($\ge 1024\text{px}$), the interface seamlessly expands into a refined two-column Swiss studio with side-by-side scanner and live preview, while maintaining the crisp daylight color scheme.
