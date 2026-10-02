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
  isSupabaseConnected,
} from './lib/supabase';
import {
  SAMPLE_ANEP_BC_ITEMS,
  generateSampleBonDeCommandeCanvas,
} from './lib/sampleData';

import { Navbar, WorkflowStep } from './components/Navbar';
import { DocumentStudio } from './components/DocumentStudio';
import { InvoiceEditor } from './components/InvoiceEditor';
import { InvoicePreview } from './components/InvoicePreview';
import { DocumentPeekDrawer } from './components/DocumentPeekDrawer';
import { AiChatWindow } from './components/AiChatWindow';
import { HistoryModal } from './components/HistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { MobileTabBar, MobileTab } from './components/MobileTabBar';

import { CheckCircle2, Sparkles } from 'lucide-react';

export function App() {
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

  // Workflow State & Navigation
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('scan');
  const [mobileTab, setMobileTab] = useState<MobileTab>('scan');

  // Modals & Chat Windows
  const [isChatOpen, setIsChatOpen] = useState(false);
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

  // Refresh and load cached data on mount
  const refreshConfigAndData = useCallback(async () => {
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
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      }
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

  // Process uploaded document with Gemini Flash
  const handleFileSelected = async (file: File) => {
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

    setIsAnalyzing(true);
    try {
      const extracted = await analyzeBonDeCommande(file);

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
      setWorkflowStep('editor');
      setMobileTab('editor');
    } catch (err: any) {
      console.warn('Extraction error:', err);
      showToast(`Extraction IA : ${err?.message || 'Document traité en mode local.'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle Témoin de Parution Upload
  const handleTemoinSelected = async (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setTemoinImage(dataUrl);
      setCurrentInvoice((prev) => ({
        ...prev,
        temoin_image_url: dataUrl,
      }));
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
    setMobileTab('editor');
    showToast(`Facture dupliquée sous ${nextNum}.`);
  };

  // Native Print
  const handlePrint = () => {
    setWorkflowStep('preview');
    setMobileTab('preview');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Step Switcher Handler
  const handleStepClick = (step: WorkflowStep) => {
    setWorkflowStep(step);
    setMobileTab(step);
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
      {/* Unified 52px Executive Navigation Bar */}
      <Navbar
        currentStep={workflowStep}
        onStepChange={handleStepClick}
        invoiceCount={invoices.length}
        bcCount={currentInvoice.items.length}
        totalTtc={currentInvoice.amount_ttc}
        onNewInvoice={handleNewInvoice}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onPrint={handlePrint}
      />

      {/* Main Workbench: Split Screen on Desktop (>= 1024px), Single Tab on Mobile (< 1024px) */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Desktop Split Studio (>= 1024px) */}
        <div className="hidden lg:flex flex-1 w-full h-full overflow-hidden">
          {/* Left Studio: Scanned Document Canvas (44%) */}
          <div className="w-[44%] h-full flex flex-col document-studio border-r border-slate-200/90">
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
              }}
            />
          </div>

          {/* Right Studio: Verification Form OR Live Printable A4 Invoice (56%) */}
          <div className="w-[56%] h-full flex flex-col bg-slate-50/60 editor-panel overflow-hidden">
            {workflowStep === 'preview' ? (
              <InvoicePreview
                invoice={currentInvoice}
                publisher={publisher}
                onPrint={handlePrint}
              />
            ) : (
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
                }}
              />
            )}
          </div>
        </div>

        {/* Mobile View (< 1024px): Fullscreen single view with bottom navigation bar */}
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

      {/* Floating AI Assistant Trigger Pill (Desktop) */}
      <div className="hidden lg:block fixed bottom-5 right-5 z-30">
        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 border border-slate-700 select-none text-xs font-semibold cursor-pointer"
          title="Ouvrir l'Assistant IA Journal Alaane"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Assistant IA</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      </div>

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

      {/* AI Chatbot Window (Desktop & iPhone) */}
      <AiChatWindow
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        invoice={currentInvoice}
        publisher={publisher}
        onApplyAction={(action) => {
          if (action.type === 'update_invoice_fields') {
            setCurrentInvoice((prev) => ({
              ...prev,
              ...action.payload,
            }));
            showToast("Modifications appliquées à la facture.");
          }
        }}
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
        <div className="fixed bottom-20 lg:bottom-5 left-1/2 -translate-x-1/2 lg:left-auto lg:right-5 lg:translate-x-0 z-50 p-2.5 px-4 rounded-xl bg-slate-900 text-white text-xs shadow-xl backdrop-blur-md flex items-center gap-2.5 animate-in slide-in-from-bottom-2 duration-200">
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
