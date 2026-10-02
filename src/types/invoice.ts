export interface AnepBonDeCommandeData {
  anep_bc_number: string;
  anep_bc_date: string;
  ad_title: string;
  publication_date: string;
  ad_format: string;
  amount_ht: number;
  tva_amount: number;
  amount_ttc: number;
  amount_ttc_words: string;
}

export type InvoiceStatus = 'brouillon' | 'emise' | 'payee' | 'rejetee';

export interface InvoiceItem {
  id: string;
  anep_bc_number: string;
  anep_bc_date: string;
  ad_title: string;
  publication_date: string;
  edition_number: string;
  ad_format: string;
  amount_ht: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  anep_bc_number: string;
  anep_bc_date: string;
  ad_title: string;
  ad_format: string;
  publication_date: string;
  edition_number: string;
  amount_ht: number;
  tva_rate: number;
  tva_amount: number;
  amount_ttc: number;
  amount_ttc_words: string;
  status: InvoiceStatus;
  client_name: string;
  client_address: string;
  client_nif: string;
  client_nis: string;
  bc_image_url?: string;
  temoin_image_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PublisherProfile {
  id: string;
  name: string;
  legal_name: string;
  address: string;
  phone: string;
  email: string;
  rc: string;
  nif: string;
  nis: string;
  article_imposition: string;
  bank_name: string;
  bank_agency: string;
  rib: string;
  logo_url: string;
  director_title: string;
  director_name: string;
}

export interface ClientProfile {
  name: string;
  department: string;
  address: string;
  nif: string;
  nis: string;
  rc: string;
}

export const DEFAULT_PUBLISHER: PublisherProfile = {
  id: 'alaane_main',
  name: 'Journal Alaane',
  legal_name: 'SARL ALAANE PRESSE ET ÉDITION',
  address: '05, Rue Didouche Mourad, Alger Centre, Algérie',
  phone: '+213 (0) 21 74 12 34',
  email: 'contact@alaane-dz.com',
  rc: '16/00-0987654 B 21',
  nif: '002116098765432',
  nis: '002116098765432',
  article_imposition: '16012345678',
  bank_name: "Banque Nationale d'Algérie (BNA)",
  bank_agency: 'Agence Didouche Mourad (620)',
  rib: '001 00620 0300012345 67',
  logo_url: '/assets/alaane-logo.png',
  director_title: 'Le Directeur de la Publication',
  director_name: 'Direction Générale',
};

export const DEFAULT_ANEP_CLIENT: ClientProfile = {
  name: "ANEP - Entreprise Nationale de Communication, d'Édition et de Publicité",
  department: "Direction de l'Édition et de la Publicité (DEP) — Régie d'Alger",
  address: '01, Avenue Pasteur, Alger, Algérie',
  nif: '099916000000000',
  nis: '099916000000000',
  rc: '16/00-0012345 B 99',
};
