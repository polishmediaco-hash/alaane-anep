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
} from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const temoinInputRef = useRef<HTMLInputElement>(null);
  const temoinCameraInputRef = useRef<HTMLInputElement>(null);

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
    <div className="flex flex-col h-full bg-slate-50/60 border-r border-slate-200 select-none">
      {/* Studio Header Bar */}
      <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between">
        {/* Document Selector Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'bc' | 'temoin')}
        >
          <TabsList className="bg-slate-100 p-0.5 h-9">
            <TabsTrigger
              value="bc"
              className="gap-1.5 text-xs py-1 px-3 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Bon de Commande</span>
              {bcImage && (
                <CheckCircle2 className="w-3 h-3 text-emerald-600 ml-0.5" />
              )}
            </TabsTrigger>

            <TabsTrigger
              value="temoin"
              className="gap-1.5 text-xs py-1 px-3 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>Témoin (Pige)</span>
              {temoinImage && (
                <CheckCircle2 className="w-3 h-3 text-emerald-600 ml-0.5" />
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Viewport Control Tools */}
        {currentImage && (
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleZoomOut}
              title="Zoom arrière"
            >
              <ZoomOut className="w-3.5 h-3.5 text-slate-600" />
            </Button>
            <span className="text-[11px] font-mono font-medium text-slate-600 px-1 min-w-[38px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleZoomIn}
              title="Zoom avant"
            >
              <ZoomIn className="w-3.5 h-3.5 text-slate-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleRotate}
              title="Pivoter de 90°"
            >
              <RotateCw className="w-3.5 h-3.5 text-slate-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleResetZoom}
              title="Réinitialiser la vue"
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
            </Button>
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
          isDropOver
            ? 'bg-blue-50/50 border-2 border-dashed border-blue-400'
            : 'bg-slate-100/50'
        } ${zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}`}
      >
        {/* Hidden File and Camera Inputs */}
        {/* File Pickers */}
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

        {/* Direct iPhone Camera Inputs with capture="environment" */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) onFileSelected(e.target.files[0]);
          }}
        />
        <input
          ref={temoinCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
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
              className="max-h-[75vh] w-auto object-contain rounded-lg shadow-md border border-slate-200 pointer-events-none"
            />
          </div>
        ) : (
          /* Empty State Dropzone */
          <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-slate-200/90 text-center flex flex-col items-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
              <UploadCloud className="w-7 h-7 stroke-[1.75px]" />
            </div>

            <h3 className="text-base font-semibold text-slate-900 mb-1">
              {activeTab === 'bc'
                ? "Numériser le Bon de Commande ANEP"
                : "Joindre le Témoin de Parution"}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mb-6 leading-relaxed">
              Scannez le document avec l'appareil photo de votre smartphone ou importez une image/PDF.
            </p>

            <div className="flex flex-col gap-2.5 w-full">
              {/* iPhone Direct Camera Button */}
              <Button
                variant="primary"
                onClick={() => {
                  if (activeTab === 'bc') {
                    cameraInputRef.current?.click();
                  } else {
                    temoinCameraInputRef.current?.click();
                  }
                }}
                className="w-full font-medium"
              >
                <Camera className="w-4 h-4" />
                <span>Prendre une photo (Appareil)</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (activeTab === 'bc') {
                      fileInputRef.current?.click();
                    } else {
                      temoinInputRef.current?.click();
                    }
                  }}
                  className="flex-1 text-xs"
                >
                  <FileImage className="w-3.5 h-3.5 text-slate-600" />
                  <span>Importer un fichier</span>
                </Button>

                {activeTab === 'bc' && (
                  <Button
                    variant="secondary"
                    onClick={onLoadSample}
                    className="flex-1 text-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Exemple ANEP</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 w-full flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <span>Glissez-déposez ou collez une capture d'écran</span>
            </div>
          </div>
        )}

        {/* AI Multimodal Analysis Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-white/85 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center">
            <div className="relative mb-4">
              <div className="w-14 h-14 rounded-full border-3 border-blue-100 border-t-blue-600 animate-spin flex items-center justify-center" />
              <Sparkles className="w-5 h-5 text-blue-600 absolute inset-0 m-auto animate-pulse" />
            </div>

            <h4 className="text-sm font-semibold text-slate-900 mb-1">
              Extraction Vision par Gemini 3.8 Flash...
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">
              Déchiffrement automatique : N° de Bon de Commande, objet d'annonce, dates, dimensions et montants HT.
            </p>

            <div className="w-44 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        {/* Floating Change Image Action */}
        {currentImage && !isAnalyzing && (
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (activeTab === 'bc') fileInputRef.current?.click();
                else temoinInputRef.current?.click();
              }}
              className="bg-white/95 backdrop-blur-xs text-xs shadow-md"
            >
              <RefreshCw className="w-3 h-3 text-slate-600" />
              <span>Remplacer le document</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
