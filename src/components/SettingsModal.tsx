import React, { useState, useEffect } from 'react';
import { PublisherProfile, DEFAULT_PUBLISHER } from '../types/invoice';
import { CloudConfig, getSavedConfig, saveConfig } from '../lib/supabase';
import {
  X,
  Settings,
  Sparkles,
  Database,
  Building,
  Save,
  CheckCircle,
  KeyRound,
  Shield,
  HelpCircle,
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'api' | 'publisher'>('api');
  const [config, setConfig] = useState<CloudConfig>({
    geminiApiKey: '',
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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white">
                Paramètres & Configurations
              </h2>
              <p className="text-xs text-slate-400">
                Clé Gemini Vision 3.8 Flash, Base de données Supabase et Mentions Légales
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4">
          <button
            onClick={() => setActiveTab('api')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'api'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>API & Connexions Cloud</span>
          </button>

          <button
            onClick={() => setActiveTab('publisher')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'publisher'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Identité Éditeur (Journal Alaane)</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'api' ? (
            <div className="space-y-6">
              {/* Gemini API Key */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Clé API Google Gemini (Vision 3.8 Flash)
                    </label>
                  </div>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>Obtenir une clé</span>
                    <HelpCircle className="w-3 h-3" />
                  </a>
                </div>

                <input
                  type="password"
                  value={config.geminiApiKey || ''}
                  onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Votre clé API est enregistrée localement dans votre navigateur (ou via <code className="text-emerald-300">.env.local</code>) et communique exclusivement avec les serveurs sécurisés de Google.
                </p>
              </div>

              {/* Supabase Database & Storage */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-sky-400" />
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Base de Données Supabase (Optionnel)
                  </label>
                </div>

                <p className="text-[11px] text-slate-400">
                  Si non configuré, l'application fonctionne parfaitement en <strong className="text-emerald-300">Mode Local</strong> avec sauvegarde dans le navigateur.
                </p>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    value={config.supabaseUrl || ''}
                    onChange={(e) => setConfig({ ...config, supabaseUrl: e.target.value })}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Supabase Anon Public Key
                  </label>
                  <input
                    type="password"
                    value={config.supabaseAnonKey || ''}
                    onChange={(e) => setConfig({ ...config, supabaseAnonKey: e.target.value })}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Publisher Legal Details */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Nom du Journal
                  </label>
                  <input
                    type="text"
                    value={localPublisher.name}
                    onChange={(e) => setLocalPublisher({ ...localPublisher, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Raison Sociale de l'Éditeur
                  </label>
                  <input
                    type="text"
                    value={localPublisher.legal_name}
                    onChange={(e) =>
                      setLocalPublisher({ ...localPublisher, legal_name: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Adresse du Siège Social
                  </label>
                  <input
                    type="text"
                    value={localPublisher.address}
                    onChange={(e) =>
                      setLocalPublisher({ ...localPublisher, address: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    value={localPublisher.phone}
                    onChange={(e) =>
                      setLocalPublisher({ ...localPublisher, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Email Commercial
                  </label>
                  <input
                    type="email"
                    value={localPublisher.email}
                    onChange={(e) =>
                      setLocalPublisher({ ...localPublisher, email: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Registre de Commerce (R.C.)
                  </label>
                  <input
                    type="text"
                    value={localPublisher.rc}
                    onChange={(e) => setLocalPublisher({ ...localPublisher, rc: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    N° Identification Fiscale (N.I.F.)
                  </label>
                  <input
                    type="text"
                    value={localPublisher.nif}
                    onChange={(e) => setLocalPublisher({ ...localPublisher, nif: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    N° Identification Statistique (N.I.S.)
                  </label>
                  <input
                    type="text"
                    value={localPublisher.nis}
                    onChange={(e) => setLocalPublisher({ ...localPublisher, nis: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Article d'Imposition (AI)
                  </label>
                  <input
                    type="text"
                    value={localPublisher.article_imposition}
                    onChange={(e) =>
                      setLocalPublisher({ ...localPublisher, article_imposition: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Banque & Compte RIB (20 Chiffres)
                  </label>
                  <input
                    type="text"
                    value={localPublisher.rib}
                    onChange={(e) => setLocalPublisher({ ...localPublisher, rib: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="001 00620 0300012345 67"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {showSavedFeedback && (
              <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                <CheckCircle className="w-4 h-4" /> Paramètres enregistrés avec succès
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={handleSaveAll}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les Paramètres</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
