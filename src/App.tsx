import { useState, useEffect, useCallback } from 'react';
import {
  Invoice,
  PublisherProfile,
  DEFAULT_PUBLISHER,
  DEFAULT_ANEP_CLIENT,
} from './types/invoice';
import { formatLegalClause } from './lib/numberToWordsFr';
import { analyzeBonDeCommande } from './lib/gemini';
import {
  fetchInvoices,
  saveInvoice,
  deleteInvoice,
  fetchPublisherProfile,
  savePublisherProfile,
  uploadScanDocument,
  getSavedConfig,
  isSupabaseConnected,
} from './lib/supabase';
import {
  SAMPLE_ANEP_BC,
  generateSampleBonDeCommandeCanvas,
} from './lib/sampleData';

import { Navbar } from './components/Navbar';
import { DocumentStudio } from './components/DocumentStudio';
import { InvoiceEditor } from './components/InvoiceEditor';
import { InvoicePreview } from './components/InvoicePreview';
import { HistoryModal } from './components/HistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { MobileTabBar, MobileTab } from './components/MobileTabBar';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';

import { Eye, Edit3, CheckCircle2 } from 'lucide-react';

export function App() {
  // Cloud & Config State
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [isSupabaseOnline, setIsSupabaseOnline] = useState(false);

  // Publisher Profile State
  const [publisher, setPublisher] = useState<PublisherProfile>(DEFAULT_PUBLISHER);

  // Invoices & Document State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bcImage, setBcImage] = useState<string | null>(null);
  const [temoinImage, setTemoinImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Navigation & Tabs
  // Mobile Tab: 'scan' | 'editor' | 'preview' | 'history'
  const [mobileTab, setMobileTab] = useState<MobileTab>('scan');
  // Desktop Right Tab: 'editor' | 'preview'
  const [desktopRightTab, setDesktopRightTab] = useState<'editor' | 'preview'>('editor');

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Working Invoice Generator
  const generateNewInvoice = (numberSequence = 1): Invoice => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const invNum = `FAC-${today.getFullYear()}-${String(numberSequence).padStart(4, '0')}`;
    const initialTtc = 0;

    return {
      id: crypto.randomUUID(),
      invoice_number: invNum,
      invoice_date: formattedDate,
      anep_bc_number: '',
      anep_bc_date: formattedDate,
      ad_title: '',
      ad_format: '4 colonnes x 15 cm (1/2 page)',
      publication_date: formattedDate,
      edition_number: '',
      amount_ht: 0,
      tva_rate: 19.0,
      tva_amount: 0,
      amount_ttc: 0,
      amount_ttc_words: formatLegalClause(initialTtc),
      status: 'emise',
      client_name: DEFAULT_ANEP_CLIENT.name,
      client_address: DEFAULT_ANEP_CLIENT.address,
      client_nif: DEFAULT_ANEP_CLIENT.nif,
      client_nis: DEFAULT_ANEP_CLIENT.nis,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  const [currentInvoice, setCurrentInvoice] = useState<Invoice>(() => generateNewInvoice());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Refresh status and load cached data on mount
  const refreshConfigAndData = useCallback(async () => {
    const config = getSavedConfig();
    setHasGeminiKey(Boolean(config.geminiApiKey?.trim()));
    setIsSupabaseOnline(isSupabaseConnected());

    const loadedPublisher = await fetchPublisherProfile();
    setPublisher(loadedPublisher);

    const loadedInvoices = await fetchInvoices();
    setInvoices(loadedInvoices);

    if (loadedInvoices.length > 0) {
      setCurrentInvoice(generateNewInvoice(loadedInvoices.length + 1));
    }
  }, []);

  useEffect(() => {
    refreshConfigAndData();
  }, [refreshConfigAndData]);

  // Global Keyboard Shortcuts (Cmd+P, Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+P / Ctrl+P -> Print
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      }
      // Cmd+S / Ctrl+S -> Save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveInvoice();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentInvoice]);

  // Process uploaded document with Gemini 3.8 Flash
  const handleFileSelected = async (file: File) => {
    // 1. Instant local image preview
    const reader = new FileReader();
    reader.onload = () => {
      setBcImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // 2. Read Gemini Key
    const config = getSavedConfig();
    const apiKey = config.geminiApiKey?.trim();

    if (!apiKey) {
      showToast("Veuillez renseigner votre clé API Gemini dans les Réglages pour activer l'extraction vision.");
      setIsSettingsOpen(true);
      return;
    }

    setIsAnalyzing(true);
    try {
      // Multimodal Vision extraction
      const extracted = await analyzeBonDeCommande(file, apiKey);

      setCurrentInvoice((prev) => ({
        ...prev,
        anep_bc_number: extracted.anep_bc_number,
        anep_bc_date: extracted.anep_bc_date,
        ad_title: extracted.ad_title,
        publication_date: extracted.publication_date,
        ad_format: extracted.ad_format,
        amount_ht: extracted.amount_ht,
        tva_amount: extracted.tva_amount,
        amount_ttc: extracted.amount_ttc,
        amount_ttc_words: extracted.amount_ttc_words,
      }));

      // Upload to Supabase Storage if online
      if (isSupabaseConnected()) {
        uploadScanDocument(file, 'anep_bc').then((url) => {
          if (url) {
            setCurrentInvoice((prev) => ({ ...prev, bc_image_url: url }));
          }
        });
      }

      showToast("Données extraites avec succès par Gemini 3.8 Flash !");
      // On mobile, automatically switch to editor tab so the user can verify immediately
      setMobileTab('editor');
    } catch (err: any) {
      console.error('Gemini vision error:', err);
      showToast(`Erreur d'analyse : ${err?.message || 'Échec de la lecture'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTemoinSelected = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setTemoinImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    if (isSupabaseConnected()) {
      uploadScanDocument(file, 'temoin_parution').then((url) => {
        if (url) {
          setCurrentInvoice((prev) => ({ ...prev, temoin_image_url: url }));
        }
      });
    }

    showToast("Témoin de parution joint avec succès au dossier de facturation.");
  };

  // Load Built-in Realistic ANEP Sample Document
  const handleLoadSample = () => {
    const sampleCanvasData = generateSampleBonDeCommandeCanvas();
    setBcImage(sampleCanvasData);

    setCurrentInvoice((prev) => ({
      ...prev,
      anep_bc_number: SAMPLE_ANEP_BC.anep_bc_number,
      anep_bc_date: SAMPLE_ANEP_BC.anep_bc_date,
      ad_title: SAMPLE_ANEP_BC.ad_title,
      publication_date: SAMPLE_ANEP_BC.publication_date,
      ad_format: SAMPLE_ANEP_BC.ad_format,
      amount_ht: SAMPLE_ANEP_BC.amount_ht,
      tva_amount: SAMPLE_ANEP_BC.tva_amount,
      amount_ttc: SAMPLE_ANEP_BC.amount_ttc,
      amount_ttc_words: SAMPLE_ANEP_BC.amount_ttc_words,
    }));

    showToast("Exemple réel ANEP chargé : Bon de commande prêt pour facturation !");
  };

  // New Invoice action
  const handleNewInvoice = () => {
    const nextSeq = invoices.length + 1;
    setCurrentInvoice(generateNewInvoice(nextSeq));
    setBcImage(null);
    setTemoinImage(null);
    setDesktopRightTab('editor');
    setMobileTab('scan');
    showToast("Nouvelle facture prête.");
  };

  // Save Invoice
  const handleSaveInvoice = async () => {
    setIsSaving(true);
    try {
      const saved = await saveInvoice(currentInvoice);
      setCurrentInvoice(saved);
      const updatedList = await fetchInvoices();
      setInvoices(updatedList);
      showToast(`Facture ${saved.invoice_number} enregistrée avec succès.`);
    } catch (e: any) {
      showToast(`Erreur d'enregistrement: ${e?.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Invoice
  const handleDeleteInvoice = async (id: string) => {
    if (confirm("Confirmez-vous la suppression de cette facture ?")) {
      await deleteInvoice(id);
      const updatedList = await fetchInvoices();
      setInvoices(updatedList);
      showToast("Facture supprimée de l'historique.");
    }
  };

  // Duplicate Invoice
  const handleDuplicateInvoice = (invoiceToDuplicate: Invoice) => {
    const nextNum = `FAC-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`;
    const duplicated: Invoice = {
      ...invoiceToDuplicate,
      id: crypto.randomUUID(),
      invoice_number: nextNum,
      invoice_date: new Date().toLocaleDateString('fr-FR'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCurrentInvoice(duplicated);
    setIsHistoryOpen(false);
    setDesktopRightTab('editor');
    setMobileTab('editor');
    showToast(`Facture dupliquée sous ${nextNum}.`);
  };

  // Native Print
  const handlePrint = () => {
    setDesktopRightTab('preview');
    setMobileTab('preview');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Handle Mobile Tab Switch
  const handleMobileTabChange = (tab: MobileTab) => {
    if (tab === 'history') {
      setIsHistoryOpen(true);
    } else {
      setMobileTab(tab);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 select-none">
      {/* Top Executive Navigation Bar */}
      <Navbar
        hasGeminiKey={hasGeminiKey}
        isSupabaseOnline={isSupabaseOnline}
        invoiceCount={invoices.length}
        onNewInvoice={handleNewInvoice}
        onLoadSample={handleLoadSample}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Responsive Workbench: Split Screen on Desktop (>= 1024px), Single Tab View on Mobile (< 1024px) */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Desktop View (>= 1024px) */}
        <div className="hidden lg:flex flex-1 w-full h-full overflow-hidden">
          {/* Left Studio: Source Scanned Document (45%) */}
          <div className="w-[45%] h-full flex flex-col document-studio border-r border-slate-200">
            <DocumentStudio
              bcImage={bcImage}
              temoinImage={temoinImage}
              isAnalyzing={isAnalyzing}
              onFileSelected={handleFileSelected}
              onLoadSample={handleLoadSample}
              onTemoinSelected={handleTemoinSelected}
            />
          </div>

          {/* Right Studio: Verification Form & Live Printable A4 Invoice (55%) */}
          <div className="w-[55%] h-full flex flex-col bg-slate-50 editor-panel">
            {/* Desktop Switcher: Formulaire vs Aperçu A4 */}
            <div className="h-11 bg-white border-b border-slate-200 px-4 flex items-center justify-between no-print shrink-0">
              <div className="flex items-center gap-1.5">
                <Button
                  variant={desktopRightTab === 'editor' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDesktopRightTab('editor')}
                  className="h-8 text-xs font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Formulaire de Facturation</span>
                </Button>

                <Button
                  variant={desktopRightTab === 'preview' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setDesktopRightTab('preview')}
                  className="h-8 text-xs font-medium"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Aperçu Impression A4</span>
                </Button>
              </div>

              {/* Quick Invoice Number Badge */}
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span>Facture :</span>
                <Badge variant="primary" className="font-mono text-xs">
                  {currentInvoice.invoice_number}
                </Badge>
              </div>
            </div>

            {/* Desktop Active Content */}
            <div className="flex-1 overflow-hidden">
              {desktopRightTab === 'editor' ? (
                <InvoiceEditor
                  invoice={currentInvoice}
                  onChange={setCurrentInvoice}
                  onSave={handleSaveInvoice}
                  onPrint={handlePrint}
                  isSaving={isSaving}
                />
              ) : (
                <InvoicePreview
                  invoice={currentInvoice}
                  publisher={publisher}
                  onPrint={handlePrint}
                />
              )}
            </div>
          </div>
        </div>

        {/* Mobile View (< 1024px): Fullscreen single tab with bottom navigation bar */}
        <div className="flex lg:hidden flex-1 w-full h-full overflow-hidden flex-col">
          {mobileTab === 'scan' && (
            <div className="flex-1 h-full overflow-hidden pb-16">
              <DocumentStudio
                bcImage={bcImage}
                temoinImage={temoinImage}
                isAnalyzing={isAnalyzing}
                onFileSelected={handleFileSelected}
                onLoadSample={handleLoadSample}
                onTemoinSelected={handleTemoinSelected}
              />
            </div>
          )}

          {mobileTab === 'editor' && (
            <div className="flex-1 h-full overflow-hidden pb-16">
              <InvoiceEditor
                invoice={currentInvoice}
                onChange={setCurrentInvoice}
                onSave={handleSaveInvoice}
                onPrint={handlePrint}
                isSaving={isSaving}
              />
            </div>
          )}

          {mobileTab === 'preview' && (
            <div className="flex-1 h-full overflow-hidden pb-16">
              <InvoicePreview
                invoice={currentInvoice}
                publisher={publisher}
                onPrint={handlePrint}
              />
            </div>
          )}
        </div>
      </main>

      {/* iPhone Mobile Bottom Navigation Bar (Hidden on desktop & print) */}
      <MobileTabBar
        activeTab={mobileTab}
        onTabChange={handleMobileTabChange}
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasUnsavedChanges={currentInvoice.amount_ht > 0}
      />

      {/* Printable Invoice Anchor for @media print */}
      <div className="hidden print:block">
        <InvoicePreview
          invoice={currentInvoice}
          publisher={publisher}
          onPrint={handlePrint}
        />
      </div>

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-5 right-4 lg:right-5 z-50 p-3 px-4 rounded-xl bg-slate-900 text-white text-xs shadow-xl backdrop-blur-md flex items-center gap-2.5 animate-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        invoices={invoices}
        onSelectInvoice={(inv) => {
          setCurrentInvoice(inv);
          setDesktopRightTab('editor');
          setMobileTab('editor');
        }}
        onDeleteInvoice={handleDeleteInvoice}
        onDuplicateInvoice={handleDuplicateInvoice}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        publisher={publisher}
        onSavePublisher={async (updated) => {
          setPublisher(updated);
          await savePublisherProfile(updated);
        }}
        onConfigUpdated={refreshConfigAndData}
      />
    </div>
  );
}
