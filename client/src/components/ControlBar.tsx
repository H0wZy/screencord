import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Headphones,
  Video,
  VideoOff,
  ScreenShare,
  PhoneOff,
  Activity,
  Settings,
  ChevronUp,
} from 'lucide-react';
import { Participant } from '../types.js';
import { QuickAudioPopover } from './QuickAudioPopover.js';
import { QuickVideoPopover } from './QuickVideoPopover.js';

interface ControlBarProps {
  self: Participant;
  isScreenSharing: boolean;
  onToggleMic: () => void;
  onToggleDeafen: () => void;
  onToggleCamera: () => void;
  onRequestScreenShare: () => void;
  onStopScreenShare: () => void;
  onDisconnect: () => void;
  onOpenSettings: (initialTab?: string) => void;
  // Audio & Video Devices
  audioInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
  selectedInputId: string;
  selectedOutputId: string;
  selectedVideoId: string;
  onSelectInput: (id: string) => void;
  onSelectOutput: (id: string) => void;
  onSelectVideo: (id: string) => void;
  inputVolume: number;
  outputVolume: number;
  onInputVolumeChange: (vol: number) => void;
  onOutputVolumeChange: (vol: number) => void;
  profile: 'isolation' | 'studio' | 'custom';
  onProfileChange: (p: 'isolation' | 'studio' | 'custom') => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  self,
  isScreenSharing,
  onToggleMic,
  onToggleDeafen,
  onToggleCamera,
  onRequestScreenShare,
  onStopScreenShare,
  onDisconnect,
  onOpenSettings,
  audioInputs,
  audioOutputs,
  videoInputs,
  selectedInputId,
  selectedOutputId,
  selectedVideoId,
  onSelectInput,
  onSelectOutput,
  onSelectVideo,
  inputVolume,
  outputVolume,
  onInputVolumeChange,
  onOutputVolumeChange,
  profile,
  onProfileChange,
}) => {
  const [isAudioPopoverOpen, setIsAudioPopoverOpen] = useState(false);
  const [isVideoPopoverOpen, setIsVideoPopoverOpen] = useState(false);

  return (
    <div className="h-20 bg-[#1e1f22] border-t border-[#232428] px-6 flex items-center justify-between shrink-0 shadow-xl w-full">
      {/* Left: User Profile Pill with Quick Settings Gear */}
      <div className="flex items-center gap-3 bg-[#232428] py-2 px-3.5 rounded-full border border-white/5">
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-[#5865f2] flex items-center justify-center font-bold text-white text-sm uppercase shadow">
            {self.nickname.slice(0, 2)}
          </div>
          <div
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1e1f22] ${
              self.isSpeaking ? 'bg-[#23a55a]' : 'bg-[#23a55a]'
            }`}
          />
        </div>
        <div className="flex flex-col">
          <span className="text-white text-sm font-semibold leading-tight">{self.nickname}</span>
          <span className="text-[11px] text-[#23a55a] font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#23a55a]" />
            Voz Conectada
          </span>
        </div>
        <button
          onClick={() => onOpenSettings('voice')}
          className="p-1.5 rounded-full text-[#949ba4] hover:text-white hover:bg-[#35373c] transition-colors ml-1"
          title="Configurações de Usuário e Áudio"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Center: Controls Buttons with Split Chevrons (Matches user screenshot) */}
      <div className="flex items-center gap-3">
        {/* Split Mic Button with Chevron Popover */}
        <div className="relative flex items-center bg-[#2b2d31] rounded-full p-1 shadow-md">
          <button
            onClick={onToggleMic}
            className={`p-2.5 rounded-full transition-all duration-150 active:scale-95 ${
              self.isMuted
                ? 'bg-[#da373c] text-white hover:bg-[#c02e34]'
                : 'text-[#dbdee1] hover:bg-[#35373c] hover:text-white'
            }`}
            title={self.isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
          >
            {self.isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button
            onClick={() => {
              setIsAudioPopoverOpen(!isAudioPopoverOpen);
              setIsVideoPopoverOpen(false);
            }}
            className={`p-1.5 pr-2 rounded-r-full text-[#949ba4] hover:text-white hover:bg-[#35373c] transition-colors ${
              isAudioPopoverOpen ? 'text-white bg-[#35373c]' : ''
            }`}
            title="Opções de Dispositivos e Volume de Áudio"
          >
            <ChevronUp size={15} />
          </button>

          {/* Quick Audio Popover */}
          <QuickAudioPopover
            isOpen={isAudioPopoverOpen}
            onClose={() => setIsAudioPopoverOpen(false)}
            inputDevices={audioInputs}
            outputDevices={audioOutputs}
            selectedInputId={selectedInputId}
            selectedOutputId={selectedOutputId}
            onSelectInput={onSelectInput}
            onSelectOutput={onSelectOutput}
            inputVolume={inputVolume}
            outputVolume={outputVolume}
            onInputVolumeChange={onInputVolumeChange}
            onOutputVolumeChange={onOutputVolumeChange}
            profile={profile}
            onProfileChange={onProfileChange}
            isDeafened={self.isDeafened}
            onToggleDeafen={onToggleDeafen}
            onOpenVoiceSettings={() => onOpenSettings('voice')}
          />
        </div>

        {/* Deafen Button */}
        <button
          onClick={onToggleDeafen}
          className={`p-3.5 rounded-full transition-all duration-150 active:scale-95 shadow-md ${
            self.isDeafened
              ? 'bg-[#da373c] text-white hover:bg-[#c02e34]'
              : 'bg-[#2b2d31] text-[#dbdee1] hover:bg-[#35373c] hover:text-white'
          }`}
          title={self.isDeafened ? 'Desativar ensurdecer' : 'Ensurdecer (Desativar todo áudio)'}
        >
          <Headphones size={20} />
        </button>

        {/* Split Camera Button with Chevron Popover */}
        <div className="relative flex items-center bg-[#2b2d31] rounded-full p-1 shadow-md">
          <button
            onClick={onToggleCamera}
            className={`p-2.5 rounded-full transition-all duration-150 active:scale-95 ${
              self.isCameraOn
                ? 'bg-[#23a55a] text-white hover:bg-[#1f924f]'
                : 'text-[#dbdee1] hover:bg-[#35373c] hover:text-white'
            }`}
            title={self.isCameraOn ? 'Desligar Câmera' : 'Ligar Câmera'}
          >
            {self.isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
          </button>
          <button
            onClick={() => {
              setIsVideoPopoverOpen(!isVideoPopoverOpen);
              setIsAudioPopoverOpen(false);
            }}
            className={`p-1.5 pr-2 rounded-r-full text-[#949ba4] hover:text-white hover:bg-[#35373c] transition-colors ${
              isVideoPopoverOpen ? 'text-white bg-[#35373c]' : ''
            }`}
            title="Selecionar Câmera / Dispositivo de Vídeo"
          >
            <ChevronUp size={15} />
          </button>

          {/* Quick Video Popover */}
          <QuickVideoPopover
            isOpen={isVideoPopoverOpen}
            onClose={() => setIsVideoPopoverOpen(false)}
            videoDevices={videoInputs}
            selectedVideoId={selectedVideoId}
            onSelectVideo={onSelectVideo}
            onOpenVideoSettings={() => onOpenSettings('video')}
          />
        </div>

        {/* Screen Share Toggle */}
        <button
          onClick={isScreenSharing ? onStopScreenShare : onRequestScreenShare}
          className={`flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm transition-all duration-150 active:scale-95 shadow-md ${
            isScreenSharing
              ? 'bg-[#23a55a] text-white hover:bg-[#1f924f] animate-pulse'
              : 'bg-[#5865f2] text-white hover:bg-[#4752c4]'
          }`}
          title={isScreenSharing ? 'Parar Transmissão' : 'Compartilhar Tela / Jogo'}
        >
          <ScreenShare size={20} />
          <span>{isScreenSharing ? 'Parar Tela' : 'Compartilhar Tela'}</span>
        </button>

        {/* Settings Gear Button */}
        <button
          onClick={() => onOpenSettings('voice')}
          className="p-3.5 rounded-full bg-[#2b2d31] text-[#dbdee1] hover:bg-[#35373c] hover:text-white transition-all duration-150 active:scale-95 shadow-md"
          title="Configurações de Voz, Microfone e Áudio"
        >
          <Settings size={20} />
        </button>

        {/* Disconnect Phone */}
        <button
          onClick={onDisconnect}
          className="p-3.5 rounded-full bg-[#da373c] hover:bg-[#c02e34] text-white transition-all duration-150 active:scale-95 shadow-md ml-2"
          title="Desconectar da Chamada"
        >
          <PhoneOff size={20} />
        </button>
      </div>

      {/* Right: Low Latency Indicator */}
      <div className="flex items-center gap-2 text-xs text-[#949ba4] font-medium bg-[#232428] px-3.5 py-2 rounded-full border border-white/5">
        <Activity size={16} className="text-[#57f287]" />
        <span>RTC Ultra-Lite</span>
        <span className="text-[#57f287] font-mono">60 FPS</span>
      </div>
    </div>
  );
};
