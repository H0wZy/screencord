import React from 'react';
import {
  Mic,
  MicOff,
  Headphones,
  Video,
  VideoOff,
  ScreenShare,
  PhoneOff,
  Activity,
} from 'lucide-react';
import { Participant } from '../types.js';

interface ControlBarProps {
  self: Participant;
  isScreenSharing: boolean;
  onToggleMic: () => void;
  onToggleDeafen: () => void;
  onToggleCamera: () => void;
  onRequestScreenShare: () => void;
  onStopScreenShare: () => void;
  onDisconnect: () => void;
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
}) => {
  return (
    <div className="h-20 bg-[#1e1f22] border-t border-[#232428] px-6 flex items-center justify-between shrink-0 shadow-xl">
      {/* Left: User Profile Pill */}
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
            Voice Connected
          </span>
        </div>
      </div>

      {/* Center: Controls Buttons */}
      <div className="flex items-center gap-3">
        {/* Mute Mic */}
        <button
          onClick={onToggleMic}
          className={`p-3.5 rounded-full transition-all duration-150 active:scale-95 shadow-md ${
            self.isMuted
              ? 'bg-[#da373c] text-white hover:bg-[#c02e34]'
              : 'bg-[#2b2d31] text-[#dbdee1] hover:bg-[#35373c] hover:text-white'
          }`}
          title={self.isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {self.isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* Deafen */}
        <button
          onClick={onToggleDeafen}
          className={`p-3.5 rounded-full transition-all duration-150 active:scale-95 shadow-md ${
            self.isDeafened
              ? 'bg-[#da373c] text-white hover:bg-[#c02e34]'
              : 'bg-[#2b2d31] text-[#dbdee1] hover:bg-[#35373c] hover:text-white'
          }`}
          title={self.isDeafened ? 'Undeafen' : 'Deafen (Mute All Sound)'}
        >
          <Headphones size={20} />
        </button>

        {/* Camera Toggle */}
        <button
          onClick={onToggleCamera}
          className={`p-3.5 rounded-full transition-all duration-150 active:scale-95 shadow-md ${
            self.isCameraOn
              ? 'bg-[#23a55a] text-white hover:bg-[#1f924f]'
              : 'bg-[#2b2d31] text-[#dbdee1] hover:bg-[#35373c] hover:text-white'
          }`}
          title={self.isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {self.isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        {/* Screen Share Toggle */}
        <button
          onClick={isScreenSharing ? onStopScreenShare : onRequestScreenShare}
          className={`flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm transition-all duration-150 active:scale-95 shadow-md ${
            isScreenSharing
              ? 'bg-[#23a55a] text-white hover:bg-[#1f924f] animate-pulse'
              : 'bg-[#5865f2] text-white hover:bg-[#4752c4]'
          }`}
          title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen / Game'}
        >
          <ScreenShare size={20} />
          <span>{isScreenSharing ? 'Stop Streaming' : 'Share Screen'}</span>
        </button>

        {/* Disconnect */}
        <button
          onClick={onDisconnect}
          className="p-3.5 rounded-full bg-[#da373c] hover:bg-[#c02e34] text-white transition-all duration-150 active:scale-95 shadow-md ml-2"
          title="Disconnect from Room"
        >
          <PhoneOff size={20} />
        </button>
      </div>

      {/* Right: Low Latency Indicator */}
      <div className="flex items-center gap-2 text-xs text-[#949ba4] font-medium bg-[#232428] px-3.5 py-2 rounded-full border border-white/5">
        <Activity size={16} className="text-[#57f287]" />
        <span>RTC Low-Latency</span>
        <span className="text-[#57f287] font-mono">60 FPS</span>
      </div>
    </div>
  );
};
