import React, { useState, useEffect, useRef } from 'react';
import { MicOff, Headphones, Volume2, CameraOff } from 'lucide-react';
import { Participant } from '../types.js';
import { VolumeSlider } from './VolumeSlider.js';

interface UserTileProps {
  participant: Participant;
  isSelf?: boolean;
  videoTrack?: MediaStreamTrack | null;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
  onTurnOffCamera?: () => void;
}

const UserTileComponent: React.FC<UserTileProps> = ({
  participant,
  isSelf = false,
  videoTrack = null,
  volume = 1.0,
  onVolumeChange,
  onTurnOffCamera,
}) => {
  const [showVolume, setShowVolume] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (videoTrack) {
        videoRef.current.srcObject = new MediaStream([videoTrack]);
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [videoTrack]);

  const getAvatarColor = (name: string) => {
    const colors = ['bg-[#5865f2]', 'bg-[#57f287]', 'bg-[#fee75c]', 'bg-[#eb459e]', 'bg-[#ed4245]'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const hasVideo = participant.isCameraOn && videoTrack;

  // 1. Camera Video Tile (16:9 side-by-side card like Image 4)
  if (hasVideo) {
    return (
      <div
        className={`relative group bg-black rounded-2xl overflow-hidden border border-white/10 shadow-xl aspect-video w-full max-h-[50vh] flex items-center justify-center ${
          participant.isSpeaking ? 'ring-2 ring-[#23a55a]' : ''
        }`}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf}
          className="w-full h-full aspect-video object-contain"
        />

        {/* Bottom Left: Participant Name & Status */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-[#1e1f22]/85 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold text-white border border-white/5">
          <span>{participant.nickname}</span>
          {isSelf && <span className="text-[#949ba4] font-normal text-[11px]">(Você)</span>}
          {participant.isMuted && <MicOff size={14} className="text-[#da373c] ml-1" />}
          {participant.isDeafened && <Headphones size={14} className="text-[#da373c] ml-1" />}
        </div>

        {/* Hover Controls: Turn Off Camera (if self) or Volume (if remote) */}
        <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {isSelf && onTurnOffCamera && (
            <button
              onClick={onTurnOffCamera}
              className="flex items-center gap-1.5 bg-[#1e1f22]/90 hover:bg-[#35373c] text-white px-3 py-1.5 rounded-lg text-xs font-medium border border-white/5 shadow-md transition-colors"
            >
              <CameraOff size={14} />
              <span>Desligar Câmera</span>
            </button>
          )}

          {!isSelf && onVolumeChange && (
            <div className="relative">
              <button
                onClick={() => setShowVolume(!showVolume)}
                className="bg-[#1e1f22]/90 hover:bg-[#35373c] p-2 rounded-lg text-[#dbdee1] transition-colors border border-white/5"
                title="Ajustar Volume"
              >
                <Volume2 size={16} />
              </button>
              {showVolume && (
                <div className="absolute right-0 top-10 z-50">
                  <VolumeSlider
                    label={`Volume de ${participant.nickname}`}
                    volume={volume}
                    onChange={onVolumeChange}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Avatar Tile for Voice-only (Image 3)
  return (
    <div className="flex flex-col items-center gap-2.5 p-3 rounded-2xl hover:bg-white/5 transition-colors group">
      <div className="relative">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold uppercase shadow-xl transition-all duration-200 ${getAvatarColor(
            participant.nickname
          )} ${
            participant.isSpeaking
              ? 'ring-4 ring-[#23a55a] shadow-[0_0_20px_rgba(35,165,90,0.6)] scale-105'
              : 'ring-2 ring-white/10'
          }`}
        >
          {participant.nickname.slice(0, 2)}
        </div>

        {/* Muted / Deafened Badge */}
        {participant.isMuted && (
          <div className="absolute bottom-0 right-0 bg-[#da373c] text-white p-1 rounded-full border-2 border-[#1e1f22] shadow">
            <MicOff size={13} />
          </div>
        )}
        {participant.isDeafened && (
          <div className="absolute bottom-0 right-0 bg-[#da373c] text-white p-1 rounded-full border-2 border-[#1e1f22] shadow">
            <Headphones size={13} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-white max-w-[120px] truncate">
          {participant.nickname}
        </span>
        {isSelf && <span className="text-[11px] text-[#949ba4]">(Você)</span>}

        {!isSelf && onVolumeChange && (
          <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowVolume(!showVolume)}
              className="text-[#949ba4] hover:text-white p-1"
              title="Ajustar Volume"
            >
              <Volume2 size={14} />
            </button>
            {showVolume && (
              <div className="absolute left-1/2 -translate-x-1/2 top-7 z-50">
                <VolumeSlider
                  label={`Volume de ${participant.nickname}`}
                  volume={volume}
                  onChange={onVolumeChange}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const UserTile = React.memo(UserTileComponent);
