import React, { useEffect, useRef } from 'react';
import { Settings, Mic, Headphones, Volume2, Shield } from 'lucide-react';

interface QuickAudioPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  inputDevices: MediaDeviceInfo[];
  outputDevices: MediaDeviceInfo[];
  selectedInputId: string;
  selectedOutputId: string;
  onSelectInput: (id: string) => void;
  onSelectOutput: (id: string) => void;
  inputVolume: number;
  outputVolume: number;
  onInputVolumeChange: (vol: number) => void;
  onOutputVolumeChange: (vol: number) => void;
  profile: 'isolation' | 'studio' | 'custom';
  onProfileChange: (p: 'isolation' | 'studio' | 'custom') => void;
  isDeafened: boolean;
  onToggleDeafen: () => void;
  onOpenVoiceSettings: () => void;
}

export const QuickAudioPopover: React.FC<QuickAudioPopoverProps> = ({
  isOpen,
  onClose,
  inputDevices,
  outputDevices,
  selectedInputId,
  selectedOutputId,
  onSelectInput,
  onSelectOutput,
  inputVolume,
  outputVolume,
  onInputVolumeChange,
  onOutputVolumeChange,
  profile,
  onProfileChange,
  isDeafened,
  onToggleDeafen,
  onOpenVoiceSettings,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
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
      {/* Popover Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#232428]">
        <div className="flex items-center gap-2">
          <Mic size={16} className="text-[#5865f2]" />
          <span className="font-bold text-white text-sm">Configuração Rápida de Áudio</span>
        </div>
      </div>

      <div className="space-y-3.5">
        {/* 1. Microfone Input Device Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4] flex items-center justify-between">
            <span>Dispositivo de Entrada</span>
            <span className="text-[10px] text-[#5865f2] font-semibold">{inputDevices.length} detectado(s)</span>
          </label>
          <select
            value={selectedInputId}
            onChange={(e) => onSelectInput(e.target.value)}
            className="w-full bg-[#1e1f22] text-white text-xs px-3 py-2 rounded-lg border border-[#2b2d31] focus:border-[#5865f2] focus:outline-none cursor-pointer hover:bg-[#232428] transition-colors"
          >
            {inputDevices.length === 0 ? (
              <option value="default">Microfone Padrão do Sistema</option>
            ) : (
              inputDevices.map((d, idx) => (
                <option key={d.deviceId || `mic-${idx}`} value={d.deviceId}>
                  {d.label || `Microfone ${idx + 1}`}
                </option>
              ))
            )}
          </select>
        </div>

        {/* 2. Perfil de Voz */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4] flex items-center gap-1">
            <Shield size={12} className="text-[#57f287]" />
            <span>Perfil de Processamento</span>
          </label>
          <select
            value={profile}
            onChange={(e) => onProfileChange(e.target.value as any)}
            className="w-full bg-[#1e1f22] text-white text-xs px-3 py-2 rounded-lg border border-[#2b2d31] focus:border-[#5865f2] focus:outline-none cursor-pointer hover:bg-[#232428] transition-colors"
          >
            <option value="isolation">Isolamento de Voz (Cancelamento de Ruído Forte)</option>
            <option value="studio">Estúdio (Alta Fidelidade 48kHz)</option>
            <option value="custom">Padrão / Personalizado</option>
          </select>
        </div>

        {/* 3. Alto-falante Output Device Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4] flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Headphones size={12} className="text-[#5865f2]" />
              <span>Dispositivo de Saída</span>
            </span>
            <span className="text-[10px] text-[#5865f2] font-semibold">{outputDevices.length} detectado(s)</span>
          </label>
          <select
            value={selectedOutputId}
            onChange={(e) => onSelectOutput(e.target.value)}
            className="w-full bg-[#1e1f22] text-white text-xs px-3 py-2 rounded-lg border border-[#2b2d31] focus:border-[#5865f2] focus:outline-none cursor-pointer hover:bg-[#232428] transition-colors"
          >
            {outputDevices.length === 0 ? (
              <option value="default">Alto-falante Padrão do Sistema</option>
            ) : (
              outputDevices.map((d, idx) => (
                <option key={d.deviceId || `out-${idx}`} value={d.deviceId}>
                  {d.label || `Alto-falante ${idx + 1}`}
                </option>
              ))
            )}
          </select>
        </div>

        {/* 4. Volume de Entrada Slider */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-[#dbdee1] font-medium">Volume de entrada (Ganho)</span>
            <span className="text-white font-mono font-semibold">{inputVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={inputVolume}
            onChange={(e) => onInputVolumeChange(Number(e.target.value))}
            className="w-full h-1.5 bg-[#35373c] rounded-lg appearance-none cursor-pointer accent-[#5865f2]"
          />
        </div>

        {/* 5. Volume de Saída Slider */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-[#dbdee1] font-medium flex items-center gap-1">
              <Volume2 size={12} className="text-[#57f287]" />
              <span>Volume de saída geral</span>
            </span>
            <span className="text-white font-mono font-semibold">{outputVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={outputVolume}
            onChange={(e) => onOutputVolumeChange(Number(e.target.value))}
            className="w-full h-1.5 bg-[#35373c] rounded-lg appearance-none cursor-pointer accent-[#5865f2]"
          />
        </div>

        {/* 6. Desativar Áudio Checkbox */}
        <label className="flex items-center justify-between p-2 rounded-lg bg-[#1e1f22] border border-[#2b2d31] cursor-pointer hover:bg-[#232428] transition-colors">
          <span className="text-white text-xs font-medium">Desativar áudio (Ensurdecer)</span>
          <input
            type="checkbox"
            checked={isDeafened}
            onChange={onToggleDeafen}
            className="w-4 h-4 rounded border-gray-600 text-[#5865f2] focus:ring-0 focus:ring-offset-0 bg-[#2b2d31]"
          />
        </label>
      </div>

      <div className="h-[1px] bg-[#232428] my-3" />

      {/* 7. Shortcut to Full Voice Settings */}
      <button
        onClick={() => {
          onClose();
          onOpenVoiceSettings();
        }}
        className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] text-white font-medium text-xs transition-colors shadow-sm"
      >
        <Settings size={14} className="text-[#5865f2]" />
        <span>Abrir Configurações Completas de Voz</span>
      </button>
    </div>
  );
};
