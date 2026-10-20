import React, { useEffect, useRef } from 'react';
import { Settings, Camera, Video, Sliders } from 'lucide-react';

interface QuickVideoPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  videoDevices: MediaDeviceInfo[];
  selectedVideoId: string;
  onSelectVideo: (id: string) => void;
  onOpenVideoSettings: () => void;
}

export const QuickVideoPopover: React.FC<QuickVideoPopoverProps> = ({
  isOpen,
  onClose,
  videoDevices,
  selectedVideoId,
  onSelectVideo,
  onOpenVideoSettings,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 w-80 bg-[#111214] border border-[#2b2d31] rounded-2xl shadow-2xl p-4 text-[#dbdee1] text-xs font-sans animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#232428]">
        <div className="flex items-center gap-2">
          <Camera size={16} className="text-[#5865f2]" />
          <span className="font-bold text-white text-sm">Configuração Rápida de Câmera</span>
        </div>
      </div>

      <div className="space-y-3.5">
        {/* 1. Camera Selector Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4] flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Video size={12} className="text-[#5865f2]" />
              <span>Dispositivo de Câmera</span>
            </span>
            <span className="text-[10px] text-[#5865f2] font-semibold">{videoDevices.length} detectada(s)</span>
          </label>
          <select
            value={selectedVideoId}
            onChange={(e) => onSelectVideo(e.target.value)}
            className="w-full bg-[#1e1f22] text-white text-xs px-3 py-2 rounded-lg border border-[#2b2d31] focus:border-[#5865f2] focus:outline-none cursor-pointer hover:bg-[#232428] transition-colors"
          >
            {videoDevices.length === 0 ? (
              <option value="default">Câmera Padrão do Sistema</option>
            ) : (
              videoDevices.map((d, idx) => (
                <option key={d.deviceId || `cam-${idx}`} value={d.deviceId}>
                  {d.label || `Câmera ${idx + 1}`}
                </option>
              ))
            )}
          </select>
        </div>

        {/* 2. Resolução / Perfil de Câmera */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4] flex items-center gap-1">
            <Sliders size={12} className="text-[#57f287]" />
            <span>Perfil de Resolução & Taxa de Quadros</span>
          </label>
          <select
            defaultValue="720p"
            className="w-full bg-[#1e1f22] text-white text-xs px-3 py-2 rounded-lg border border-[#2b2d31] focus:border-[#5865f2] focus:outline-none cursor-pointer hover:bg-[#232428] transition-colors"
          >
            <option value="720p">720p HD @ 30 FPS (Fluido & Recomendado)</option>
            <option value="1080p">1080p Full HD @ 60 FPS (Alta Definição)</option>
            <option value="480p">480p SD @ 30 FPS (Economia de Banda / Baixa Latência)</option>
          </select>
        </div>
      </div>

      <div className="h-[1px] bg-[#232428] my-3" />

      {/* 3. Link to Full Video Settings */}
      <button
        onClick={() => {
          onClose();
          onOpenVideoSettings();
        }}
        className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] text-white font-medium text-xs transition-colors shadow-sm"
      >
        <Settings size={14} className="text-[#5865f2]" />
        <span>Abrir Configurações e Teste de Vídeo</span>
      </button>
    </div>
  );
};
