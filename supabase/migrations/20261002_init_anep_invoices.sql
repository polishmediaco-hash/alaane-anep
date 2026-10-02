-- Migration: 20261002_init_anep_invoices.sql
-- Description: Initial schema for Journal Alaane ANEP Invoicing Application

-- 1. Create Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    invoice_date TEXT NOT NULL,
    anep_bc_number TEXT NOT NULL,
    anep_bc_date TEXT NOT NULL,
    ad_title TEXT NOT NULL,
    ad_format TEXT NOT NULL,
    publication_date TEXT NOT NULL,
    edition_number TEXT DEFAULT '',
    amount_ht NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    tva_rate NUMERIC(5,2) NOT NULL DEFAULT 19.00,
    tva_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    amount_ttc NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    amount_ttc_words TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'emise' CHECK (status IN ('brouillon', 'emise', 'payee', 'rejetee')),
    client_name TEXT NOT NULL DEFAULT 'ANEP - Agence Nationale d''Édition et de Publicité',
    client_address TEXT NOT NULL DEFAULT '01, Avenue Pasteur, Alger',
    client_nif TEXT NOT NULL DEFAULT '099916000000000',
    client_nis TEXT NOT NULL DEFAULT '099916000000000',
    bc_image_url TEXT,
    temoin_image_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for speedy search by BC or Invoice Number
CREATE INDEX IF NOT EXISTS idx_invoices_bc_number ON public.invoices(anep_bc_number);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at DESC);

-- 2. Create Company Settings Table (Singleton profile for Journal Alaane)
CREATE TABLE IF NOT EXISTS public.company_settings (
    id TEXT PRIMARY KEY DEFAULT 'alaane_main',
    name TEXT NOT NULL DEFAULT 'Journal Alaane',
    legal_name TEXT NOT NULL DEFAULT 'SARL ALAANE PRESSE ET ÉDITION',
    address TEXT NOT NULL DEFAULT '05, Rue Didouche Mourad, Alger Centre, Algérie',
    phone TEXT NOT NULL DEFAULT '+213 (0) 21 74 12 34',
    email TEXT NOT NULL DEFAULT 'commercial@alaane-dz.com',
    rc TEXT NOT NULL DEFAULT '16/00-0987654 B 21',
    nif TEXT NOT NULL DEFAULT '002116098765432',
    nis TEXT NOT NULL DEFAULT '002116098765432',
    article_imposition TEXT NOT NULL DEFAULT '16012345678',
    bank_name TEXT NOT NULL DEFAULT 'Banque Nationale d''Algérie (BNA)',
    bank_agency TEXT NOT NULL DEFAULT 'Agence Didouche Mourad (620)',
    rib TEXT NOT NULL DEFAULT '001 00620 0300012345 67',
    logo_url TEXT NOT NULL DEFAULT '/assets/alaane-logo.png',
    director_title TEXT NOT NULL DEFAULT 'Le Directeur de la Publication',
    director_name TEXT NOT NULL DEFAULT 'Direction Générale',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default company profile if absent
INSERT INTO public.company_settings (id, name, legal_name, address, rc, nif, nis, article_imposition, bank_name, bank_agency, rib)
VALUES (
    'alaane_main',
    'Journal Alaane',
    'SARL ALAANE PRESSE ET ÉDITION',
    '05, Rue Didouche Mourad, Alger Centre, Algérie',
    '16/00-0987654 B 21',
    '002116098765432',
    '002116098765432',
    '16012345678',
    'Banque Nationale d''Algérie (BNA)',
    'Agence Didouche Mourad (620)',
    '001 00620 0300012345 67'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Bucket Configuration for Document Scans
INSERT INTO storage.buckets (id, name, public)
VALUES ('anep-documents', 'anep-documents', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Permissive public policies for authenticated / anon keys
CREATE POLICY "Allow public read on invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Allow public insert on invoices" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on invoices" ON public.invoices FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on invoices" ON public.invoices FOR DELETE USING (true);

CREATE POLICY "Allow public read on company_settings" ON public.company_settings FOR SELECT USING (true);
CREATE POLICY "Allow public update on company_settings" ON public.company_settings FOR ALL USING (true);

-- Storage bucket access policies
CREATE POLICY "Public Access anep-documents" ON storage.objects FOR SELECT USING (bucket_id = 'anep-documents');
CREATE POLICY "Public Upload anep-documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'anep-documents');
