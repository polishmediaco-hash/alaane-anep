import React, { useState, useEffect } from 'react';
import { PublisherProfile } from '../types/invoice';
import { CloudConfig, getSavedConfig, saveConfig } from '../lib/supabase';
import {
  Settings,
  Sparkles,
  Database,
  Building,
  Save,
  CheckCircle2,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  publisher: PublisherProfile;
  onSavePublisher: (publisher: PublisherProfile) => void;
  onConfigUpdated: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  publisher,
  onSavePublisher,
  onConfigUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'publisher' | 'cloud'>('publisher');
  const [config, setConfig] = useState<CloudConfig>({
    supabaseUrl: '',
    supabaseAnonKey: '',
  });
  const [localPublisher, setLocalPublisher] = useState<PublisherProfile>(publisher);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(getSavedConfig());
      setLocalPublisher(publisher);
    }
  }, [isOpen, publisher]);

  const handleSaveAll = () => {
    saveConfig(config);
    onSavePublisher(localPublisher);
    onConfigUpdated();
    setShowSavedFeedback(true);
    setTimeout(() => {
      setShowSavedFeedback(false);
      onClose();
    }, 800);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        {/* Modal Header */}
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-slate-900">
                Paramètres Légaux & Profil Éditeur
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Coordonnées fiscales Journal Alaane, compte bancaire BNA et synchronisation cloud
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'publisher' | 'cloud')}
          className="flex flex-col flex-1"
        >
          <div className="px-5 pt-3 border-b border-slate-100">
            <TabsList className="bg-slate-100 p-0.5 h-8">
              <TabsTrigger
                value="publisher"
                className="gap-2 text-xs py-1 px-3 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs"
              >
                <Building className="w-3.5 h-3.5 text-slate-700" />
                <span>Identité Journal Alaane</span>
              </TabsTrigger>

              <TabsTrigger
                value="cloud"
                className="gap-2 text-xs py-1 px-3 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs"
              >
                <Database className="w-3.5 h-3.5 text-slate-700" />
                <span>Base de Données Cloud</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Form Body */}
          <div className="p-5 overflow-y-auto max-h-[60vh]">
            <TabsContent value="cloud" className="space-y-4 m-0">
              {/* Supabase Database & Storage */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3.5">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-700" />
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Base de Données Supabase (Optionnel)
                  </label>
                </div>

                <p className="text-[11px] text-slate-500">
                  Si non configuré, l'application fonctionne parfaitement en <strong className="text-slate-800">Mode Local</strong> avec sauvegarde automatique dans votre navigateur.
                </p>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Supabase Project URL
                  </label>
                  <Input
                    type="text"
                    value={config.supabaseUrl || ''}
                    onChange={(e) =>
                      setConfig({ ...config, supabaseUrl: e.target.value })
                    }
                    placeholder="https://xyzcompany.supabase.co"
                    className="font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Supabase Anon Public Key
                  </label>
                  <Input
                    type="password"
                    value={config.supabaseAnonKey || ''}
                    onChange={(e) =>
                      setConfig({ ...config, supabaseAnonKey: e.target.value })
                    }
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="publisher" className="space-y-4 m-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Nom du Journal
                  </label>
                  <Input
                    type="text"
                    value={localPublisher.name}
                    onChange={(e) =>
                      setLocalPublisher({ ...localPublisher, name: e.target.value })
                    }
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Raison Sociale de l'Éditeur
                  </label>
                  <Input
                    type="text"
                    value={localPublisher.legal_name}
                    onChange={(e) =>
                      setLocalPublisher({
                        ...localPublisher,
                        legal_name: e.target.value,
                      })
                    }
                    className="text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Adresse du Siège Social
                  </label>
                  <Input
                    type="text"
                    value={localPublisher.address}
                    onChange={(e) =>
                      setLocalPublisher({
                        ...localPublisher,
                        address: e.target.value,
                      })
                    }
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Téléphone
                  </label>
                  <Input
                    type="text"
                    value={localPublisher.phone}
                    onChange={(e) =>
                      setLocalPublisher({
                        ...localPublisher,
                        phone: e.target.value,
                      })
                    }
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Email Commercial
                  </label>
                  <Input
                    type="email"
                    value={localPublisher.email}
                    onChange={(e) =>
                      setLocalPublisher({
                        ...localPublisher,
                        email: e.target.value,
                      })
                    }
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Registre de Commerce (R.C.)
                  </label>
                  <Input
                    type="text"
                    value={localPublisher.rc}
                    onChange={(e) =>
                      setLocalPublisher({ ...localPublisher, rc: e.target.value })
                    }
                    className="font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    N° Identification Fiscale (N.I.F.)
                  </label>
                  <Input
                    type="text"
                    value={localPublisher.nif}
                    onChange={(e) =>
                      setLocalPublisher({ ...localPublisher, nif: e.target.value })
                    }
                    className="font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    N° Identification Statistique (N.I.S.)
                  </label>
                  <Input
                    type="text"
                    value={localPublisher.nis}
                    onChange={(e) =>
                      setLocalPublisher({ ...localPublisher, nis: e.target.value })
                    }
                    className="font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Article d'Imposition (AI)
                  </label>
                  <Input
                    type="text"
                    value={localPublisher.article_imposition}
                    onChange={(e) =>
                      setLocalPublisher({
                        ...localPublisher,
                        article_imposition: e.target.value,
                      })
                    }
                    className="font-mono text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Banque & Compte RIB (20 Chiffres)
                  </label>
                  <Input
                    type="text"
                    value={localPublisher.rib}
                    onChange={(e) =>
                      setLocalPublisher({ ...localPublisher, rib: e.target.value })
                    }
                    className="font-mono text-xs"
                    placeholder="001 00620 0300012345 67"
                  />
                </div>
              </div>
            </TabsContent>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="text-xs text-emerald-600 font-medium">
              {showSavedFeedback && (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Paramètres enregistrés avec succès
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Fermer
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAll}
                className="font-medium"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Enregistrer</span>
              </Button>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
