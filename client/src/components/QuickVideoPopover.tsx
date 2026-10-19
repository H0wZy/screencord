import React, { useEffect, useRef } from 'react';
import { Settings, Check, Camera } from 'lucide-react';

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
      className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 w-72 bg-[#111214] border border-[#2b2d31] rounded-2xl shadow-2xl p-3 text-[#dbdee1] text-xs font-sans animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-[#232428]">
        <Camera size={14} className="text-[#5865f2]" />
        <span className="font-semibold text-white">Dispositivo de Câmera</span>
      </div>

      <div className="max-h-48 overflow-y-auto space-y-1 py-1">
        {videoDevices.length === 0 ? (
          <div className="p-2 text-center text-[#949ba4] text-[11px]">
            Nenhuma câmera encontrada
          </div>
        ) : (
          videoDevices.map((d) => (
            <button
              key={d.deviceId || 'default'}
              onClick={() => {
                onSelectVideo(d.deviceId);
                onClose();
              }}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                selectedVideoId === d.deviceId
                  ? 'bg-[#5865f2] text-white font-medium'
                  : 'hover:bg-[#2b2d31] text-[#dbdee1]'
              }`}
            >
              <span className="truncate pr-2">{d.label || 'Câmera Padrão'}</span>
              {selectedVideoId === d.deviceId && <Check size={14} />}
            </button>
          ))
        )}
      </div>

      <div className="h-[1px] bg-[#232428] my-2" />

      <button
        onClick={() => {
          onClose();
          onOpenVideoSettings();
        }}
        className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#2b2d31] text-[#dbdee1] hover:text-white transition-colors"
      >
        <Settings size={15} />
        <span className="font-medium text-xs">Configurações de vídeo</span>
      </button>
    </div>
  );
};
