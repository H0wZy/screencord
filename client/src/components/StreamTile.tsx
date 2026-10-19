import React, { useRef, useEffect, useState } from 'react';
import { Maximize2, Minimize2, Monitor, AppWindow, Volume2, VolumeX } from 'lucide-react';
import { VolumeSlider } from './VolumeSlider.js';

interface StreamTileProps {
  stream: MediaStream;
  presenterName: string;
  surfaceType?: 'monitor' | 'window' | null;
  hasAudio?: boolean;
  isSelf?: boolean;
  isTheater?: boolean;
  streamVolume?: number;
  onToggleTheater?: () => void;
  onVolumeChange?: (volume: number) => void;
}

export const StreamTile: React.FC<StreamTileProps> = ({
  stream,
  presenterName,
  surfaceType = 'monitor',
  hasAudio = false,
  isSelf = false,
  isTheater = false,
  streamVolume = 1.0,
  onToggleTheater,
  onVolumeChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showVolume, setShowVolume] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.warn('Error attempting fullscreen:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn('Error attempting exit fullscreen:', err);
      });
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative group bg-black rounded-lg overflow-hidden border border-[#232428] shadow-2xl flex items-center justify-center ${
        isTheater ? 'w-full h-full max-h-[85vh]' : 'w-full aspect-video min-h-[320px]'
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isSelf} // Always mute self stream to avoid feedback loop
        className="w-full h-full object-contain"
      />

      {/* Top Left: Presenter & Source Badges */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
        <div className="flex items-center gap-1.5 bg-[#1e1f22]/90 backdrop-blur-md px-3 py-1.5 rounded-md text-xs font-semibold text-white shadow-md border border-white/5">
          <span className="w-2 h-2 rounded-full bg-[#ed4245] animate-pulse" />
          <span>LIVE</span>
          <span className="text-[#949ba4] font-normal">|</span>
          <span>{presenterName}</span>
          {isSelf && <span className="text-[#949ba4] font-normal text-[11px]">(You)</span>}
        </div>

        <div className="flex items-center gap-1 bg-[#1e1f22]/90 backdrop-blur-md px-2.5 py-1.5 rounded-md text-xs font-medium text-[#dbdee1] border border-white/5">
          {surfaceType === 'window' ? (
            <>
              <AppWindow size={14} className="text-[#5865f2]" />
              <span>Window</span>
            </>
          ) : (
            <>
              <Monitor size={14} className="text-[#57f287]" />
              <span>Screen</span>
            </>
          )}
        </div>

        {hasAudio && (
          <div className="flex items-center gap-1 bg-[#23a55a]/20 border border-[#23a55a]/40 text-[#57f287] px-2.5 py-1.5 rounded-md text-xs font-medium">
            <Volume2 size={14} />
            <span>Sound ON</span>
          </div>
        )}
      </div>

      {/* Top Right: Controls (Volume, Theater, Fullscreen) */}
      <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        {!isSelf && hasAudio && onVolumeChange && (
          <div className="relative">
            <button
              onClick={() => setShowVolume(!showVolume)}
              className="bg-[#1e1f22]/90 hover:bg-[#35373c] p-2 rounded-md text-[#dbdee1] hover:text-white transition-colors"
              title="Stream Volume"
            >
              {streamVolume === 0 ? <VolumeX size={16} className="text-[#da373c]" /> : <Volume2 size={16} />}
            </button>
            {showVolume && (
              <div className="absolute right-0 top-10 z-50">
                <VolumeSlider
                  label={`${presenterName}'s Stream Sound`}
                  volume={streamVolume}
                  onChange={onVolumeChange}
                />
              </div>
            )}
          </div>
        )}

        {onToggleTheater && (
          <button
            onClick={onToggleTheater}
            className="bg-[#1e1f22]/90 hover:bg-[#35373c] p-2 rounded-md text-[#dbdee1] hover:text-white transition-colors"
            title={isTheater ? 'Exit Theater Mode' : 'Theater Mode'}
          >
            {isTheater ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        )}

        <button
          onClick={toggleFullscreen}
          className="bg-[#1e1f22]/90 hover:bg-[#35373c] p-2 rounded-md text-[#dbdee1] hover:text-white transition-colors"
          title="Fullscreen"
        >
          <Maximize2 size={16} />
        </button>
      </div>
    </div>
  );
};
