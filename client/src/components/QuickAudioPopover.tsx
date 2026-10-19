import React, { useState, useEffect, useRef } from 'react';
import { Settings, ChevronRight, Check } from 'lucide-react';

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
  const [activeSubmenu, setActiveSubmenu] = useState<'input' | 'output' | 'profile' | null>(null);
  const [vuLevel, setVuLevel] = useState(0);
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

  // Live microphone VU level animation
  useEffect(() => {
    if (!isOpen) return;
    let animId: number;
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let stream: MediaStream | null = null;

    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((s) => {
        stream = s;
        audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        const source = audioCtx.createMediaStreamSource(s);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const update = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setVuLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animId = requestAnimationFrame(update);
        };
        update();
      })
      .catch(() => {
        // Fallback simulation if mic is busy
      });

    return () => {
      cancelAnimationFrame(animId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (audioCtx) audioCtx.close();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentInputLabel =
    inputDevices.find((d) => d.deviceId === selectedInputId)?.label || 'Padrão do Sistema';
  const currentOutputLabel =
    outputDevices.find((d) => d.deviceId === selectedOutputId)?.label || 'Padrão do Sistema';

  const profileLabelMap: Record<string, string> = {
    isolation: 'Isolamento de Voz',
    studio: 'Estúdio',
    custom: 'Personalizado',
  };

  const BAR_COUNT = 20;
  const activeBars = Math.round((vuLevel / 100) * BAR_COUNT);

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 w-72 bg-[#111214] border border-[#2b2d31] rounded-2xl shadow-2xl p-3 text-[#dbdee1] text-xs font-sans animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      {/* Submenu Overlay if an item is expanded */}
      {activeSubmenu ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#232428]">
            <span className="font-semibold text-white">
              {activeSubmenu === 'input'
                ? 'Dispositivo de entrada'
                : activeSubmenu === 'output'
                ? 'Dispositivo de saída'
                : 'Perfil de entrada'}
            </span>
            <button
              onClick={() => setActiveSubmenu(null)}
              className="text-[#949ba4] hover:text-white text-[11px]"
            >
              Voltar
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 py-1">
            {activeSubmenu === 'input' &&
              inputDevices.map((d) => (
                <button
                  key={d.deviceId || 'default'}
                  onClick={() => {
                    onSelectInput(d.deviceId);
                    setActiveSubmenu(null);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                    selectedInputId === d.deviceId
                      ? 'bg-[#5865f2] text-white font-medium'
                      : 'hover:bg-[#2b2d31] text-[#dbdee1]'
                  }`}
                >
                  <span className="truncate pr-2">{d.label || 'Microfone Padrão'}</span>
                  {selectedInputId === d.deviceId && <Check size={14} />}
                </button>
              ))}

            {activeSubmenu === 'output' &&
              outputDevices.map((d) => (
                <button
                  key={d.deviceId || 'default'}
                  onClick={() => {
                    onSelectOutput(d.deviceId);
                    setActiveSubmenu(null);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                    selectedOutputId === d.deviceId
                      ? 'bg-[#5865f2] text-white font-medium'
                      : 'hover:bg-[#2b2d31] text-[#dbdee1]'
                  }`}
                >
                  <span className="truncate pr-2">{d.label || 'Alto-falante Padrão'}</span>
                  {selectedOutputId === d.deviceId && <Check size={14} />}
                </button>
              ))}

            {activeSubmenu === 'profile' &&
              (['isolation', 'studio', 'custom'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    onProfileChange(p);
                    setActiveSubmenu(null);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                    profile === p
                      ? 'bg-[#5865f2] text-white font-medium'
                      : 'hover:bg-[#2b2d31] text-[#dbdee1]'
                  }`}
                >
                  <span>{profileLabelMap[p]}</span>
                  {profile === p && <Check size={14} />}
                </button>
              ))}
          </div>
        </div>
      ) : (
        /* Main Popover Menu (Matches user screenshot 1:1) */
        <div className="space-y-3">
          {/* 1. Input Device */}
          <button
            onClick={() => setActiveSubmenu('input')}
            className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-[#2b2d31] transition-colors group text-left"
          >
            <div className="flex flex-col truncate pr-2">
              <span className="text-white font-medium text-xs">Dispositivo de entrada</span>
              <span className="text-[11px] text-[#949ba4] truncate">{currentInputLabel}</span>
            </div>
            <ChevronRight size={16} className="text-[#949ba4] group-hover:text-white shrink-0" />
          </button>

          {/* 2. Input Profile */}
          <button
            onClick={() => setActiveSubmenu('profile')}
            className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-[#2b2d31] transition-colors group text-left"
          >
            <div className="flex flex-col truncate pr-2">
              <span className="text-white font-medium text-xs">Perfil de entrada</span>
              <span className="text-[11px] text-[#949ba4] truncate">{profileLabelMap[profile]}</span>
            </div>
            <ChevronRight size={16} className="text-[#949ba4] group-hover:text-white shrink-0" />
          </button>

          {/* 3. Output Device */}
          <button
            onClick={() => setActiveSubmenu('output')}
            className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-[#2b2d31] transition-colors group text-left"
          >
            <div className="flex flex-col truncate pr-2">
              <span className="text-white font-medium text-xs">Dispositivo de saída</span>
              <span className="text-[11px] text-[#949ba4] truncate">{currentOutputLabel}</span>
            </div>
            <ChevronRight size={16} className="text-[#949ba4] group-hover:text-white shrink-0" />
          </button>

          <div className="h-[1px] bg-[#232428] my-1" />

          {/* 4. Volume de Entrada */}
          <div className="space-y-1.5 px-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#dbdee1] font-medium">Volume de entrada</span>
              <span className="text-[#949ba4] font-mono">{inputVolume}%</span>
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

          {/* 5. Nível de Entrada (Live Animated Bars from screenshot) */}
          <div className="space-y-1 px-1">
            <span className="text-[11px] text-[#dbdee1] font-medium">Nível de entrada</span>
            <div className="flex items-center gap-1 h-3 bg-[#1e1f22] p-1 rounded-md">
              {Array.from({ length: BAR_COUNT }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-full rounded-sm transition-colors duration-75 ${
                    i < activeBars ? 'bg-[#57f287]' : 'bg-[#2b2d31]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 6. Volume de Saída */}
          <div className="space-y-1.5 px-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#dbdee1] font-medium">Volume de saída</span>
              <span className="text-[#949ba4] font-mono">{outputVolume}%</span>
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

          <div className="h-[1px] bg-[#232428] my-1" />

          {/* 7. Desativar Áudio Checkbox */}
          <label className="flex items-center justify-between px-1 py-1 cursor-pointer hover:bg-[#2b2d31] rounded-lg transition-colors">
            <span className="text-white text-xs font-medium">Desativar áudio</span>
            <input
              type="checkbox"
              checked={isDeafened}
              onChange={onToggleDeafen}
              className="w-4 h-4 rounded border-gray-600 text-[#5865f2] focus:ring-0 focus:ring-offset-0 bg-[#2b2d31]"
            />
          </label>

          {/* 8. Configurações de Voz Button */}
          <button
            onClick={() => {
              onClose();
              onOpenVoiceSettings();
            }}
            className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#2b2d31] text-[#dbdee1] hover:text-white transition-colors"
          >
            <Settings size={15} />
            <span className="font-medium text-xs">Configurações de voz</span>
          </button>
        </div>
      )}
    </div>
  );
};
