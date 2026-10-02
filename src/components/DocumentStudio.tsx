import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Camera,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  FileImage,
  Sparkles,
  FileText,
  CheckCircle2,
  Eye,
  RefreshCw,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { Button } from './ui/button';

interface DocumentStudioProps {
  bcImage: string | null;
  temoinImage: string | null;
  bcDocuments?: { id: string; label: string; url: string }[];
  activeBcIndex?: number;
  onSelectBcIndex?: (idx: number) => void;
  onAddAnotherBc?: () => void;
  isAnalyzing: boolean;
  onFileSelected: (file: File) => void;
  onLoadSample: () => void;
  onTemoinSelected: (file: File) => void;
  onContinueToEditor?: () => void;
}

export const DocumentStudio: React.FC<DocumentStudioProps> = ({
  bcImage,
  temoinImage,
  bcDocuments = [],
  activeBcIndex = 0,
  onSelectBcIndex,
  onAddAnotherBc,
  isAnalyzing,
  onFileSelected,
  onLoadSample,
  onTemoinSelected,
  onContinueToEditor,
}) => {
  const [activeTab, setActiveTab] = useState<'bc' | 'temoin'>('bc');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDropOver, setIsDropOver] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const temoinInputRef = useRef<HTMLInputElement>(null);
  const temoinCameraInputRef = useRef<HTMLInputElement>(null);

  // Active document resolution
  const activeBcDoc = bcDocuments[activeBcIndex];
  const activeBcImage = activeBcDoc?.url || bcImage;
  const currentImage = activeTab === 'bc' ? activeBcImage : temoinImage;

  // Clipboard Paste Support (Cmd+V / Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            if (activeTab === 'bc') {
              onFileSelected(file);
            } else {
              onTemoinSelected(file);
            }
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeTab, onFileSelected, onTemoinSelected]);

  // Reset viewport when active image changes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  }, [currentImage, activeTab, activeBcIndex]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.4));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  // Pan interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropOver(true);
  };

  const handleDragLeave = () => setIsDropOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (activeTab === 'bc') {
        onFileSelected(file);
      } else {
        onTemoinSelected(file);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/70 select-none">
      {/* Studio Header Bar: Minimalist Document Tabs */}
      <div className="h-12 px-3 sm:px-4 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
          {bcDocuments.length > 0 ? (
            bcDocuments.map((doc, idx) => (
              <button
                key={doc.id || idx}
                type="button"
                onClick={() => {
                  setActiveTab('bc');
                  if (onSelectBcIndex) onSelectBcIndex(idx);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                  activeTab === 'bc' && activeBcIndex === idx
                    ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{doc.label || `BC #${idx + 1}`}</span>
                {doc.url && (
                  <CheckCircle2
                    className={`w-3 h-3 ${
                      activeTab === 'bc' && activeBcIndex === idx ? 'text-emerald-400' : 'text-emerald-600'
                    }`}
                  />
                )}
              </button>
            ))
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('bc')}
              className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'bc'
                  ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Bon de Commande</span>
              {bcImage && <CheckCircle2 className="w-3 h-3 text-emerald-600 ml-0.5" />}
            </button>
          )}

          {/* Add Another BC Button */}
          {onAddAnotherBc && (
            <button
              type="button"
              onClick={onAddAnotherBc}
              title="Ajouter un autre Bon de Commande à cette facture"
              className="px-2 py-1 rounded-md text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-slate-700" />
              <span className="hidden sm:inline">+ Nouveau BC</span>
            </button>
          )}

          {/* Témoin Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('temoin')}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'temoin'
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Témoin (Pige)</span>
            {temoinImage && <CheckCircle2 className="w-3 h-3 text-emerald-600 ml-0.5" />}
          </button>
        </div>

        {/* Quick Sample Trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={onLoadSample}
          className="text-xs h-7.5 px-2.5 hidden sm:inline-flex"
          title="Charger un exemple de Bon de Commande ANEP"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1 text-slate-600" />
          <span>Exemple ANEP</span>
        </Button>
      </div>

      {/* Hidden File and Camera Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onFileSelected(e.target.files[0]);
          }
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onFileSelected(e.target.files[0]);
          }
        }}
      />
      <input
        ref={temoinInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onTemoinSelected(e.target.files[0]);
          }
        }}
      />
      <input
        ref={temoinCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onTemoinSelected(e.target.files[0]);
          }
        }}
      />

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`flex-1 relative overflow-hidden flex items-center justify-center bg-slate-100/70 select-none ${
          isDropOver ? 'ring-2 ring-slate-900 bg-slate-200/50' : ''
        } ${zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}`}
      >
        {currentImage ? (
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
            className="max-w-[90%] max-h-[90%] flex items-center justify-center pointer-events-none"
          >
            <img
              src={currentImage}
              alt="Scan Document ANEP"
              className="max-w-full max-h-full object-contain rounded-lg shadow-md border border-slate-300/80 bg-white"
            />
          </div>
        ) : (
          /* Empty / Upload Dropzone */
          <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-xs mb-4">
              <UploadCloud className="w-7 h-7 stroke-[1.5]" />
            </div>

            <h3 className="text-sm font-bold text-slate-900 mb-1">
              {activeTab === 'bc'
                ? `Numériser ${activeBcDoc?.label || 'Bon de Commande'}`
                : 'Joindre le Témoin de Parution'}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mb-5 leading-relaxed">
              Photographiez l'ordre d'insertion avec votre iPhone ou déposez un fichier PDF/PNG.
            </p>

            <div className="flex flex-col gap-2 w-full">
              <Button
                variant="default"
                onClick={() => {
                  if (activeTab === 'bc') cameraInputRef.current?.click();
                  else temoinCameraInputRef.current?.click();
                }}
                className="w-full font-medium min-h-[42px] bg-slate-900 hover:bg-slate-800 text-white"
              >
                <Camera className="w-4 h-4 mr-1.5" />
                <span>Prendre en photo (Caméra iPhone)</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (activeTab === 'bc') fileInputRef.current?.click();
                    else temoinInputRef.current?.click();
                  }}
                  className="flex-1 text-xs h-9 bg-white"
                >
                  <FileImage className="w-3.5 h-3.5 mr-1 text-slate-600" />
                  <span>Importer fichier</span>
                </Button>

                {activeTab === 'bc' && (
                  <Button
                    variant="outline"
                    onClick={onLoadSample}
                    className="flex-1 text-xs h-9 bg-white"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-slate-600" />
                    <span>Exemple réel</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 w-full text-[11px] text-slate-400">
              <span>Glissez-déposez ou collez une capture (Cmd+V)</span>
            </div>
          </div>
        )}

        {/* AI Multimodal Analysis Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
            <div className="relative mb-3">
              <div className="w-12 h-12 rounded-full border-3 border-slate-200 border-t-slate-900 animate-spin flex items-center justify-center" />
              <Sparkles className="w-5 h-5 text-slate-900 absolute inset-0 m-auto animate-pulse" />
            </div>

            <h4 className="text-xs font-bold text-slate-900 mb-1">
              Extraction Vision Gemini Flash...
            </h4>
            <p className="text-[11px] text-slate-500 max-w-xs mb-3 leading-relaxed">
              Déchiffrement : N° Bon de Commande, organisme client, objet d'annonce, dimensions et montants HT.
            </p>

            <div className="w-36 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-slate-900 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        {/* Floating Frosted-Glass Viewer Control Pill (Apple Pro App Craft) */}
        {currentImage && !isAnalyzing && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-md px-2 py-1 rounded-full border border-slate-200/90 shadow-lg">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleZoomOut}
              title="Zoom arrière"
              className="h-7 w-7 text-slate-700 hover:text-slate-900 rounded-full"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>

            <span className="text-[11px] font-mono font-medium text-slate-600 px-1 min-w-[36px] text-center">
              {Math.round(zoom * 100)}%
            </span>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleZoomIn}
              title="Zoom avant"
              className="h-7 w-7 text-slate-700 hover:text-slate-900 rounded-full"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>

            <div className="h-3 w-px bg-slate-200 mx-0.5" />

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleRotate}
              title="Pivoter de 90°"
              className="h-7 w-7 text-slate-700 hover:text-slate-900 rounded-full"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleResetZoom}
              title="Réinitialiser l'affichage"
              className="h-7 w-7 text-slate-700 hover:text-slate-900 rounded-full"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>

            <div className="h-3 w-px bg-slate-200 mx-0.5" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (activeTab === 'bc') fileInputRef.current?.click();
                else temoinInputRef.current?.click();
              }}
              title="Remplacer le document"
              className="h-7 text-[11px] px-2 text-slate-700 hover:text-slate-900 rounded-full font-medium"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              <span>Changer</span>
            </Button>
          </div>
        )}
      </div>

      {/* Forward Progression Bar */}
      {onContinueToEditor && currentImage && (
        <div className="h-12 px-4 bg-white border-t border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600">
            <span className="font-semibold text-slate-900">Document chargé.</span>{' '}
            <span className="hidden sm:inline">Passez à l'étape suivante pour vérifier les montants.</span>
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={onContinueToEditor}
            className="text-xs h-7.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-medium"
          >
            <span>Passer à la Facturation</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};
