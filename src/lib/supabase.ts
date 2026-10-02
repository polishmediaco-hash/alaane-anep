import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Invoice, PublisherProfile, DEFAULT_PUBLISHER } from '../types/invoice';

const LOCAL_STORAGE_INVOICES_KEY = 'alaane_anep_invoices_v1';
const LOCAL_STORAGE_SETTINGS_KEY = 'alaane_anep_publisher_profile_v1';
const LOCAL_STORAGE_CONFIG_KEY = 'alaane_anep_cloud_config_v1';

export interface CloudConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  geminiApiKey?: string;
}

export function getSavedConfig(): CloudConfig {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const envGemini = import.meta.env.VITE_GEMINI_API_KEY || '';

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        supabaseUrl: parsed.supabaseUrl || envUrl,
        supabaseAnonKey: parsed.supabaseAnonKey || envKey,
        geminiApiKey: parsed.geminiApiKey || envGemini,
      };
    }
  } catch (e) {
    console.error('Error reading cloud config from localStorage:', e);
  }

  return {
    supabaseUrl: envUrl,
    supabaseAnonKey: envKey,
    geminiApiKey: envGemini,
  };
}

export function saveConfig(config: CloudConfig): void {
  localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(config));
}

let supabaseInstance: SupabaseClient | null = null;
let lastKnownUrl = '';
let lastKnownKey = '';

export function getSupabase(): SupabaseClient | null {
  const config = getSavedConfig();
  const url = config.supabaseUrl?.trim() || '';
  const key = config.supabaseAnonKey?.trim() || '';

  if (!url || !key || url.includes('your-project.supabase.co')) {
    supabaseInstance = null;
    return null;
  }

  if (supabaseInstance && url === lastKnownUrl && key === lastKnownKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(url, key);
    lastKnownUrl = url;
    lastKnownKey = key;
    return supabaseInstance;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    supabaseInstance = null;
    return null;
  }
}

export function isSupabaseConnected(): boolean {
  return getSupabase() !== null;
}

// ==========================================
// Invoices CRUD (Supabase with LocalStorage Fallback)
// ==========================================

export async function fetchInvoices(): Promise<Invoice[]> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as Invoice[];
      }
      console.warn('Supabase fetch failed, falling back to local:', error?.message);
    } catch (e) {
      console.warn('Supabase network error, using local fallback:', e);
    }
  }

  // LocalStorage Fallback
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_INVOICES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed reading invoices from localStorage:', e);
  }

  return [];
}

export async function saveInvoice(invoice: Invoice): Promise<Invoice> {
  const supabase = getSupabase();
  const updatedInvoice = {
    ...invoice,
    updated_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .upsert(updatedInvoice, { onConflict: 'invoice_number' })
        .select()
        .single();

      if (!error && data) {
        // Also sync local cache
        syncInvoiceToLocal(data as Invoice);
        return data as Invoice;
      }
      console.warn('Supabase save error, persisting locally:', error?.message);
    } catch (e) {
      console.warn('Supabase network error, saving to localStorage:', e);
    }
  }

  // LocalStorage persistence
  syncInvoiceToLocal(updatedInvoice);
  return updatedInvoice;
}

function syncInvoiceToLocal(invoice: Invoice) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_INVOICES_KEY);
    let list: Invoice[] = raw ? JSON.parse(raw) : [];
    const index = list.findIndex(
      (item) => item.id === invoice.id || item.invoice_number === invoice.invoice_number
    );

    if (index >= 0) {
      list[index] = invoice;
    } else {
      list.unshift(invoice);
    }
    localStorage.setItem(LOCAL_STORAGE_INVOICES_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed updating local storage:', e);
  }
}

export async function deleteInvoice(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('invoices').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete error:', e);
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_INVOICES_KEY);
    if (raw) {
      let list: Invoice[] = JSON.parse(raw);
      list = list.filter((i) => i.id !== id);
      localStorage.setItem(LOCAL_STORAGE_INVOICES_KEY, JSON.stringify(list));
    }
    return true;
  } catch (e) {
    console.error('Failed deleting from localStorage:', e);
    return false;
  }
}

// ==========================================
// Publisher Settings
// ==========================================

export async function fetchPublisherProfile(): Promise<PublisherProfile> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('id', 'alaane_main')
        .single();

      if (!error && data) {
        return data as PublisherProfile;
      }
    } catch (e) {
      console.warn('Supabase profile fetch error, using local:', e);
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_PUBLISHER, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed reading settings from localStorage:', e);
  }

  return DEFAULT_PUBLISHER;
}

export async function savePublisherProfile(profile: PublisherProfile): Promise<PublisherProfile> {
  const supabase = getSupabase();
  const updated = {
    ...profile,
    id: 'alaane_main',
    updated_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      await supabase.from('company_settings').upsert(updated, { onConflict: 'id' });
    } catch (e) {
      console.warn('Supabase profile save error:', e);
    }
  }

  localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}

// ==========================================
// Document Storage (Scans / PDFs)
// ==========================================

export async function uploadScanDocument(file: File, prefix = 'bc'): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const ext = file.name.split('.').pop() || 'png';
    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = `scans/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('anep-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.warn('Supabase storage upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('anep-documents').getPublicUrl(filePath);
    return data?.publicUrl || null;
  } catch (err) {
    console.error('Upload exception:', err);
    return null;
  }
}
