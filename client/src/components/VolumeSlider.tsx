import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface VolumeSliderProps {
  label: string;
  volume: number; // 0.0 to 2.0
  onChange: (newVolume: number) => void;
}

export const VolumeSlider: React.FC<VolumeSliderProps> = ({ label, volume, onChange }) => {
  const percentage = Math.round(volume * 100);
  const isMuted = volume === 0;

  return (
    <div className="flex flex-col gap-1.5 p-2 bg-[#2b2d31] rounded-lg shadow-lg border border-[#1f2023] w-48 text-xs">
      <div className="flex items-center justify-between text-[#949ba4] font-semibold uppercase tracking-wider">
        <span>{label}</span>
        <span className="text-[#dbdee1] font-mono">{percentage}%</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(isMuted ? 1.0 : 0)}
          className="text-[#b5bac1] hover:text-white transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={16} className="text-[#da373c]" /> : <Volume2 size={16} />}
        </button>
        <input
          type="range"
          min="0"
          max="2"
          step="0.05"
          value={volume}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-[#4e5058] rounded-lg appearance-none cursor-pointer accent-[#5865f2]"
        />
      </div>
    </div>
  );
};
