-- Migration: 20261002_add_multi_bc_items.sql
-- Description: Multi-line Bons de Commande and Advertiser Organization support for Journal Alaane

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS advertiser_name TEXT DEFAULT '';
