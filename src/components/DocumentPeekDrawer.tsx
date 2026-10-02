import React, { useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  FileText,
  Eye,
  Layers,
} from 'lucide-react';
import { Button } from './ui/button';

interface DocumentPeekDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bcImages: { id: string; label: string; url: string }[];
  temoinImage: string | null;
}

export const DocumentPeekDrawer: React.FC<DocumentPeekDrawerProps> = ({
  isOpen,
  onClose,
  bcImages,
  temoinImage,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(
    bcImages[0]?.id || 'temoin'
  );
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Sync selected doc when drawer opens or documents change
  React.useEffect(() => {
    if (isOpen && bcImages.length > 0) {
      const exists = bcImages.some((d) => d.id === selectedDocId);
      if (!exists && selectedDocId !== 'temoin') {
        setSelectedDocId(bcImages[0].id);
      } else if (selectedDocId === 'temoin' && !temoinImage) {
        setSelectedDocId(bcImages[0].id);
      }
    }
  }, [isOpen, bcImages, temoinImage]);

  if (!isOpen) return null;

  const currentImageUrl =
    selectedDocId === 'temoin'
      ? (temoinImage || bcImages[0]?.url || null)
      : (bcImages.find((d) => d.id === selectedDocId)?.url || bcImages[0]?.url || null);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-900">
            Contrôle Document Source
          </span>
        </div>

        {/* Zoom & Rotate Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleZoomOut}
            title="Zoom -"
            className="h-8 w-8"
          >
            <ZoomOut className="w-3.5 h-3.5 text-slate-700" />
          </Button>
          <span className="text-[11px] font-mono font-bold text-slate-700 w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleZoomIn}
            title="Zoom +"
            className="h-8 w-8"
          >
            <ZoomIn className="w-3.5 h-3.5 text-slate-700" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleRotate}
            title="Pivoter"
            className="h-8 w-8"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-700" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleReset}
            title="Réinitialiser"
            className="h-8 w-8"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-700" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="ml-2 h-8 text-xs font-semibold text-slate-700"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            <span>Fermer</span>
          </Button>
        </div>
      </div>

      {/* Subheader: Switch between multiple BCs or Témoin */}
      <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-500 uppercase shrink-0">
          Document :
        </span>
        {bcImages.map((bc, idx) => (
          <button
            key={bc.id}
            type="button"
            onClick={() => {
              setSelectedDocId(bc.id);
              handleReset();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors min-h-[36px] ${
              selectedDocId === bc.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>{bc.label || `BC #${idx + 1}`}</span>
          </button>
        ))}

        {temoinImage && (
          <button
            type="button"
            onClick={() => {
              setSelectedDocId('temoin');
              handleReset();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors min-h-[36px] ${
              selectedDocId === 'temoin'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Témoin de parution</span>
          </button>
        )}
      </div>

      {/* Main Document Viewer Canvas */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-900/90 relative">
        {currentImageUrl ? (
          <div
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.15s ease-out',
            }}
            className="origin-center max-w-full max-h-full flex items-center justify-center"
          >
            <img
              src={currentImageUrl}
              alt="Scan Document Source"
              className="max-h-[80vh] w-auto object-contain rounded-lg shadow-2xl border border-slate-700 select-none"
            />
          </div>
        ) : (
          <div className="text-center text-slate-400 text-xs p-6 bg-slate-800/80 rounded-xl border border-slate-700 max-w-sm">
            <p className="font-semibold text-slate-200 mb-1">
              Aucun document source numérisé pour cette ligne
            </p>
            <p className="text-[11px] text-slate-400">
              Importez ou photographiez un bon de commande dans l'étape Numérisation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
