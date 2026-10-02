import React from 'react';
import { Camera, FileText, Eye, History, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

export type MobileTab = 'scan' | 'editor' | 'preview' | 'history';

interface MobileTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  onOpenSettings: () => void;
  hasUnsavedChanges?: boolean;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  onTabChange,
  onOpenSettings,
  hasUnsavedChanges = false,
}) => {
  const tabs = [
    {
      id: 'scan' as MobileTab,
      label: 'Scanner',
      icon: Camera,
    },
    {
      id: 'editor' as MobileTab,
      label: 'Facture',
      icon: FileText,
      badge: hasUnsavedChanges,
    },
    {
      id: 'preview' as MobileTab,
      label: 'Aperçu A4',
      icon: Eye,
    },
    {
      id: 'history' as MobileTab,
      label: 'Historique',
      icon: History,
    },
  ];

  return (
    <nav className="mobile-tab-bar fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 lg:hidden pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative flex flex-col items-center justify-center min-h-[44px] min-w-[48px] py-1 px-3 rounded-xl transition-all text-xs font-medium',
                isActive
                  ? 'text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-900 active:scale-95'
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'w-5 h-5 transition-transform',
                    isActive ? 'scale-110 stroke-[2.25px]' : 'stroke-[1.75px]'
                  )}
                />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-slate-900 animate-pulse" />
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>
            </button>
          );
        })}

        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[48px] py-1 px-3 rounded-xl transition-all text-xs font-medium text-slate-500 hover:text-slate-900 active:scale-95"
          title="Paramètres de l'entreprise"
        >
          <Settings className="w-5 h-5 stroke-[1.75px]" />
          <span className="text-[11px] mt-1 tracking-tight">Réglages</span>
        </button>
      </div>
    </nav>
  );
};
