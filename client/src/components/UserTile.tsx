import React, { useState, useEffect, useRef } from 'react';
import { MicOff, Headphones, Volume2 } from 'lucide-react';
import { Participant } from '../types.js';
import { VolumeSlider } from './VolumeSlider.js';

interface UserTileProps {
  participant: Participant;
  isSelf?: boolean;
  videoTrack?: MediaStreamTrack | null;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
}

export const UserTile: React.FC<UserTileProps> = ({
  participant,
  isSelf = false,
  videoTrack = null,
  volume = 1.0,
  onVolumeChange,
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

  // Generate deterministic avatar color based on nickname
  const getAvatarColor = (name: string) => {
    const colors = ['bg-[#5865f2]', 'bg-[#57f287]', 'bg-[#fee75c]', 'bg-[#eb459e]', 'bg-[#ed4245]'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div
      className={`relative group flex flex-col items-center justify-center bg-[#2b2d31] rounded-lg overflow-hidden transition-all duration-200 aspect-video min-w-[220px] max-w-sm w-full border-2 ${
        participant.isSpeaking ? 'border-[#23a55a] speaking-ring' : 'border-transparent'
      }`}
    >
      {/* Video stream if camera is on */}
      {participant.isCameraOn && videoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf}
          className="w-full h-full object-cover rounded-md"
        />
      ) : (
        /* Avatar when camera is off */
        <div className="flex flex-col items-center gap-2">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold uppercase shadow-md ${getAvatarColor(
              participant.nickname
            )}`}
          >
            {participant.nickname.slice(0, 2)}
          </div>
        </div>
      )}

      {/* Top Left: Badges */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5">
        {participant.isMuted && (
          <div className="bg-[#1e1f22]/90 p-1.5 rounded-full text-[#da373c]" title="Muted">
            <MicOff size={14} />
          </div>
        )}
        {participant.isDeafened && (
          <div className="bg-[#1e1f22]/90 p-1.5 rounded-full text-[#da373c]" title="Deafened">
            <Headphones size={14} />
          </div>
        )}
      </div>

      {/* Top Right: Volume Settings for Remote Peers */}
      {!isSelf && onVolumeChange && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <button
              onClick={() => setShowVolume(!showVolume)}
              className="bg-[#1e1f22]/90 hover:bg-[#35373c] p-1.5 rounded-full text-[#dbdee1] transition-colors"
              title="Adjust Volume"
            >
              <Volume2 size={14} />
            </button>
            {showVolume && (
              <div className="absolute right-0 top-8 z-50">
                <VolumeSlider
                  label={`${participant.nickname}'s Voice`}
                  volume={volume}
                  onChange={onVolumeChange}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom overlay: Participant Name */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-[#1e1f22]/80 backdrop-blur-xs px-2.5 py-1 rounded text-xs font-medium text-white">
        <span>{participant.nickname}</span>
        {isSelf && <span className="text-[#949ba4] text-[10px]">(You)</span>}
      </div>
    </div>
  );
};
