import { useState, useEffect, useCallback } from 'react';
import {
  Invoice,
  InvoiceItem,
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
  SAMPLE_ANEP_BC_ITEMS,
  generateSampleBonDeCommandeCanvas,
} from './lib/sampleData';

import { Navbar } from './components/Navbar';
import { StepProgressBar, WorkflowStep } from './components/StepProgressBar';
import { DocumentStudio } from './components/DocumentStudio';
import { InvoiceEditor } from './components/InvoiceEditor';
import { InvoicePreview } from './components/InvoicePreview';
import { DocumentPeekDrawer } from './components/DocumentPeekDrawer';
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
  const [scannedBcDocuments, setScannedBcDocuments] = useState<
    { id: string; label: string; url: string }[]
  >([]);
  const [activeBcIndex, setActiveBcIndex] = useState(0);
  const [temoinImage, setTemoinImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPeekOpen, setIsPeekOpen] = useState(false);

  // Guided Linear Workflow Navigation
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('scan');
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

    const initialItem: InvoiceItem = {
      id: crypto.randomUUID(),
      anep_bc_number: '',
      anep_bc_date: formattedDate,
      advertiser_name: "Direction des Travaux Publics (DTP) — Wilaya d'Alger",
      ad_title: '',
      publication_date: formattedDate,
      edition_number: '',
      ad_format: '4 colonnes x 15 cm (1/2 page)',
      amount_ht: 0,
    };

    return {
      id: crypto.randomUUID(),
      invoice_number: invNum,
      invoice_date: formattedDate,
      advertiser_name: "Direction des Travaux Publics (DTP) — Wilaya d'Alger",
      items: [initialItem],
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

  // Recalculate totals helper
  const updateInvoiceWithItem = (
    inv: Invoice,
    itemIndex: number,
    itemData: Partial<InvoiceItem>
  ): Invoice => {
    const items = [...inv.items];
    if (!items[itemIndex]) {
      items[itemIndex] = {
        id: crypto.randomUUID(),
        anep_bc_number: '',
        anep_bc_date: inv.invoice_date,
        ad_title: '',
        publication_date: inv.invoice_date,
        edition_number: '',
        ad_format: '4 colonnes x 15 cm (1/2 page)',
        amount_ht: 0,
      };
    }

    items[itemIndex] = {
      ...items[itemIndex],
      ...itemData,
    };

    const totalHt = Math.round(
      items.reduce((sum, it) => sum + (Number(it.amount_ht) || 0), 0) * 100
    ) / 100;
    const tvaAmount = Math.round(totalHt * (inv.tva_rate / 100) * 100) / 100;
    const amountTtc = Math.round((totalHt + tvaAmount) * 100) / 100;
    const amountTtcWords = formatLegalClause(amountTtc);

    const first = items[0];

    return {
      ...inv,
      items,
      amount_ht: totalHt,
      tva_amount: tvaAmount,
      amount_ttc: amountTtc,
      amount_ttc_words: amountTtcWords,
      anep_bc_number: first ? first.anep_bc_number : '',
      anep_bc_date: first ? first.anep_bc_date : '',
      ad_title: first ? first.ad_title : '',
      ad_format: first ? first.ad_format : '',
      publication_date: first ? first.publication_date : '',
      edition_number: first ? first.edition_number : '',
    };
  };

  // Process uploaded document with Gemini 3.8 Flash
  const handleFileSelected = async (file: File) => {
    // 1. Instant local image preview
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setScannedBcDocuments((prev) => {
        const next = [...prev];
        const docLabel = `BC #${activeBcIndex + 1}`;
        next[activeBcIndex] = {
          id: currentInvoice.items[activeBcIndex]?.id || crypto.randomUUID(),
          label: docLabel,
          url: dataUrl,
        };
        return next;
      });
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

      setCurrentInvoice((prev) => {
        const updated = updateInvoiceWithItem(prev, activeBcIndex, {
          anep_bc_number: extracted.anep_bc_number,
          anep_bc_date: extracted.anep_bc_date,
          advertiser_name: extracted.advertiser_name,
          ad_title: extracted.ad_title,
          publication_date: extracted.publication_date,
          ad_format: extracted.ad_format,
          amount_ht: extracted.amount_ht,
        });

        if (extracted.advertiser_name && (!prev.advertiser_name || prev.advertiser_name.includes('Alger'))) {
          updated.advertiser_name = extracted.advertiser_name;
        }

        return updated;
      });

      // Upload to Supabase Storage if online
      if (isSupabaseConnected()) {
        uploadScanDocument(file, 'anep_bc').then((url) => {
          if (url) {
            setCurrentInvoice((prev) => {
              const items = [...prev.items];
              if (items[activeBcIndex]) {
                items[activeBcIndex].bc_image_url = url;
              }
              return { ...prev, items };
            });
          }
        });
      }

      showToast(`Données extraites avec succès pour le BC #${activeBcIndex + 1} !`);
      // Advance to editor step
      setWorkflowStep('editor');
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

    showToast("Témoin de parution joint avec succès au dossier.");
  };

  // Add another Bon de Commande action
  const handleAddAnotherBc = () => {
    const newIdx = currentInvoice.items.length;
    const newItem: InvoiceItem = {
      id: crypto.randomUUID(),
      anep_bc_number: '',
      anep_bc_date: currentInvoice.invoice_date,
      advertiser_name: currentInvoice.advertiser_name || '',
      ad_title: '',
      publication_date: currentInvoice.invoice_date,
      edition_number: '',
      ad_format: '4 colonnes x 15 cm (1/2 page)',
      amount_ht: 0,
    };

    setCurrentInvoice((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    setActiveBcIndex(newIdx);
    setWorkflowStep('scan');
    setMobileTab('scan');
    showToast(`Ligne BC #${newIdx + 1} ajoutée. Numérisez le document correspondant.`);
  };

  // Load Built-in Realistic ANEP Multi-BC Sample Documents
  const handleLoadSample = () => {
    const canvas1 = generateSampleBonDeCommandeCanvas(1);
    const canvas2 = generateSampleBonDeCommandeCanvas(2);

    setScannedBcDocuments([
      {
        id: SAMPLE_ANEP_BC_ITEMS[0].id,
        label: 'BC #1 (Appel d’Offres)',
        url: canvas1,
      },
      {
        id: SAMPLE_ANEP_BC_ITEMS[1].id,
        label: 'BC #2 (Prorogation)',
        url: canvas2,
      },
    ]);
    setActiveBcIndex(0);

    const items = [...SAMPLE_ANEP_BC_ITEMS];
    const totalHt = items.reduce((sum, it) => sum + it.amount_ht, 0); // 240,000 DA
    const tvaAmount = Math.round(totalHt * 0.19 * 100) / 100; // 45,600 DA
    const totalTtc = totalHt + tvaAmount; // 285,600 DA
    const words = formatLegalClause(totalTtc);

    setCurrentInvoice((prev) => ({
      ...prev,
      advertiser_name: "Direction des Travaux Publics (DTP) — Wilaya d'Alger",
      items,
      amount_ht: totalHt,
      tva_rate: 19.0,
      tva_amount: tvaAmount,
      amount_ttc: totalTtc,
      amount_ttc_words: words,
      anep_bc_number: items[0].anep_bc_number,
      anep_bc_date: items[0].anep_bc_date,
      ad_title: items[0].ad_title,
      ad_format: items[0].ad_format,
      publication_date: items[0].publication_date,
      edition_number: items[0].edition_number,
    }));

    showToast("Exemple multi-BC ANEP chargé : 2 Bons de Commande prêts pour facturation !");
  };

  // New Invoice action
  const handleNewInvoice = () => {
    const nextSeq = invoices.length + 1;
    setCurrentInvoice(generateNewInvoice(nextSeq));
    setScannedBcDocuments([]);
    setActiveBcIndex(0);
    setTemoinImage(null);
    setWorkflowStep('scan');
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
      showToast(`Facture ${saved.invoice_number} (${saved.items.length} BC) enregistrée.`);
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
    setWorkflowStep('editor');
    setDesktopRightTab('editor');
    setMobileTab('editor');
    showToast(`Facture dupliquée sous ${nextNum}.`);
  };

  // Native Print
  const handlePrint = () => {
    setWorkflowStep('preview');
    setDesktopRightTab('preview');
    setMobileTab('preview');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Step Progress Bar Click Handler
  const handleStepClick = (step: WorkflowStep) => {
    setWorkflowStep(step);
    setMobileTab(step);
    if (step === 'preview') {
      setDesktopRightTab('preview');
    } else {
      setDesktopRightTab('editor');
    }
  };

  // Handle Mobile Tab Switch
  const handleMobileTabChange = (tab: MobileTab) => {
    if (tab === 'history') {
      setIsHistoryOpen(true);
    } else {
      setMobileTab(tab);
      setWorkflowStep(tab);
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

      {/* Guided 3-Step Workflow Progress Bar */}
      <StepProgressBar
        currentStep={workflowStep}
        onStepClick={handleStepClick}
        itemCount={currentInvoice.items.length}
        invoiceNumber={currentInvoice.invoice_number}
      />

      {/* Responsive Workbench: Split Screen on Desktop (>= 1024px), Single Tab View on Mobile (< 1024px) */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Desktop View (>= 1024px) */}
        <div className="hidden lg:flex flex-1 w-full h-full overflow-hidden">
          {/* Left Studio: Source Scanned Document Studio (44%) */}
          <div className="w-[44%] h-full flex flex-col document-studio border-r border-slate-200">
            <DocumentStudio
              bcImage={scannedBcDocuments[activeBcIndex]?.url || null}
              temoinImage={temoinImage}
              bcDocuments={scannedBcDocuments}
              activeBcIndex={activeBcIndex}
              onSelectBcIndex={(idx) => setActiveBcIndex(idx)}
              onAddAnotherBc={handleAddAnotherBc}
              isAnalyzing={isAnalyzing}
              onFileSelected={handleFileSelected}
              onLoadSample={handleLoadSample}
              onTemoinSelected={handleTemoinSelected}
              onContinueToEditor={() => {
                setWorkflowStep('editor');
                setDesktopRightTab('editor');
              }}
            />
          </div>

          {/* Right Studio: Verification Form & Live Printable A4 Invoice (56%) */}
          <div className="w-[56%] h-full flex flex-col bg-slate-50 editor-panel">
            {/* Desktop Switcher: Formulaire vs Aperçu A4 */}
            <div className="h-11 bg-white border-b border-slate-200 px-4 flex items-center justify-between no-print shrink-0">
              <div className="flex items-center gap-1.5">
                <Button
                  variant={desktopRightTab === 'editor' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setDesktopRightTab('editor');
                    setWorkflowStep('editor');
                  }}
                  className="h-8 text-xs font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1" />
                  <span>Vérification & Lignes ({currentInvoice.items.length} BC)</span>
                </Button>

                <Button
                  variant={desktopRightTab === 'preview' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setDesktopRightTab('preview');
                    setWorkflowStep('preview');
                  }}
                  className="h-8 text-xs font-medium"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  <span>Aperçu Impression A4</span>
                </Button>
              </div>

              {/* Quick Invoice Number & Total Badge */}
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span>Total TTC :</span>
                <Badge variant="primary" className="font-mono text-xs font-bold">
                  {currentInvoice.amount_ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
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
                  onOpenPeek={() => setIsPeekOpen(true)}
                  hasScannedDocuments={scannedBcDocuments.length > 0}
                  onContinueToPreview={() => {
                    setWorkflowStep('preview');
                    setDesktopRightTab('preview');
                  }}
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
                bcImage={scannedBcDocuments[activeBcIndex]?.url || null}
                temoinImage={temoinImage}
                bcDocuments={scannedBcDocuments}
                activeBcIndex={activeBcIndex}
                onSelectBcIndex={(idx) => setActiveBcIndex(idx)}
                onAddAnotherBc={handleAddAnotherBc}
                isAnalyzing={isAnalyzing}
                onFileSelected={handleFileSelected}
                onLoadSample={handleLoadSample}
                onTemoinSelected={handleTemoinSelected}
                onContinueToEditor={() => {
                  setWorkflowStep('editor');
                  setMobileTab('editor');
                }}
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
                onOpenPeek={() => setIsPeekOpen(true)}
                hasScannedDocuments={scannedBcDocuments.length > 0}
                onContinueToPreview={() => {
                  setWorkflowStep('preview');
                  setMobileTab('preview');
                }}
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

      {/* Mobile Floating Peek Drawer for Live Document Verification */}
      <DocumentPeekDrawer
        isOpen={isPeekOpen}
        onClose={() => setIsPeekOpen(false)}
        bcImages={scannedBcDocuments}
        temoinImage={temoinImage}
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
          setWorkflowStep('editor');
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
