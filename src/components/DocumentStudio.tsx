import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  FileImage,
  Sparkles,
  Loader2,
  Clipboard,
  FileText,
  CheckCircle,
  Eye,
  RefreshCcw,
} from 'lucide-react';

interface DocumentStudioProps {
  bcImage: string | null;
  temoinImage: string | null;
  isAnalyzing: boolean;
  onFileSelected: (file: File) => void;
  onLoadSample: () => void;
  onTemoinSelected: (file: File) => void;
}

export const DocumentStudio: React.FC<DocumentStudioProps> = ({
  bcImage,
  temoinImage,
  isAnalyzing,
  onFileSelected,
  onLoadSample,
  onTemoinSelected,
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
  const temoinInputRef = useRef<HTMLInputElement>(null);

  const currentImage = activeTab === 'bc' ? bcImage : temoinImage;

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
  }, [currentImage, activeTab]);

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
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800 select-none">
      {/* Studio Header Bar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        {/* Document Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('bc')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              activeTab === 'bc'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Bon de Commande</span>
            {bcImage && <CheckCircle className="w-3 h-3 text-emerald-300 ml-0.5" />}
          </button>

          <button
            onClick={() => setActiveTab('temoin')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              activeTab === 'temoin'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Témoin de Parution</span>
            {temoinImage && <CheckCircle className="w-3 h-3 text-emerald-300 ml-0.5" />}
          </button>
        </div>

        {/* Viewport Control Tools */}
        {currentImage && (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={handleZoomOut}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Zoom arrière"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-slate-300 px-1.5 min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Zoom avant"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleRotate}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Pivoter de 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Réinitialiser la vue"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Studio Viewport */}
      <div
        ref={containerRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`relative flex-1 overflow-hidden flex items-center justify-center p-4 transition-colors ${
          isDropOver ? 'bg-emerald-950/20 border-2 border-dashed border-emerald-500/50' : 'bg-slate-950'
        } ${zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}`}
      >
        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) onFileSelected(e.target.files[0]);
          }}
        />
        <input
          ref={temoinInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) onTemoinSelected(e.target.files[0]);
          }}
        />

        {currentImage ? (
          /* Render Document Image with Pan, Zoom & Rotation */
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
            className="origin-center max-w-full max-h-full flex items-center justify-center"
          >
            <img
              src={currentImage}
              alt="Bon de commande ou témoin numérisé"
              className="max-h-[78vh] w-auto object-contain rounded-md shadow-2xl border border-slate-700/80 pointer-events-none"
            />
          </div>
        ) : (
          /* Empty State Dropzone */
          <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center flex flex-col items-center shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-base font-semibold text-white mb-1">
              {activeTab === 'bc'
                ? "Déposer le Bon de Commande ANEP"
                : "Joindre le Témoin de Parution (Pige)"}
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mb-6">
              Glissez-déposez un scan (JPG, PNG, PDF) ou appuyez directement sur{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-emerald-300">
                Cmd+V
              </kbd>{' '}
              pour coller une capture d'écran.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                onClick={() => {
                  if (activeTab === 'bc') {
                    fileInputRef.current?.click();
                  } else {
                    temoinInputRef.current?.click();
                  }
                }}
                className="w-full sm:flex-1 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-950"
              >
                <FileImage className="w-4 h-4" />
                <span>Parcourir le fichier</span>
              </button>

              {activeTab === 'bc' && (
                <button
                  onClick={onLoadSample}
                  className="w-full sm:flex-1 py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Exemple ANEP</span>
                </button>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/80 w-full flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <Clipboard className="w-3.5 h-3.5" />
              <span>Collez directement depuis le presse-papier</span>
            </div>
          </div>
        )}

        {/* AI Multimodal Analysis Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin flex items-center justify-center" />
              <Sparkles className="w-6 h-6 text-emerald-400 absolute inset-0 m-auto animate-pulse" />
            </div>

            <h4 className="text-base font-semibold text-white mb-1">
              Analyse Vision par Gemini 3.8 Flash...
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              Déchiffrement des mentions d'insertion, dates de parution, formats (colonnes × cm) et tarification HT ANEP.
            </p>

            <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        {/* Floating Change Image Action */}
        {currentImage && !isAnalyzing && (
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
            <button
              onClick={() => {
                if (activeTab === 'bc') fileInputRef.current?.click();
                else temoinInputRef.current?.click();
              }}
              className="py-1.5 px-3 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 backdrop-blur-md transition-colors shadow-lg"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Changer le document</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
