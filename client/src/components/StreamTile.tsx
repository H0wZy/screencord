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
  streamVolume = 1.0,
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

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.warn('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn('Error exiting fullscreen:', err);
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative group bg-black rounded-2xl overflow-hidden border border-[#232428] shadow-2xl flex items-center justify-center w-full aspect-video ${
        isFullscreen ? 'h-screen w-screen max-h-none rounded-none' : 'max-h-[52vh]'
      }`}
    >
      {/* 16:9 Video Canvas - object-contain ensures zero crop / no cut-off */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isSelf} // Always mute self stream to avoid feedback loop
        className="w-full h-full aspect-video object-contain"
      />

      {/* Top Left: Presenter & Source Badges */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-20 pointer-events-none">
        <div className="flex items-center gap-1.5 bg-[#1e1f22]/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-md border border-white/5 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-[#ed4245] animate-pulse" />
          <span>AO VIVO</span>
          <span className="text-[#949ba4] font-normal">|</span>
          <span>{presenterName}</span>
          {isSelf && <span className="text-[#949ba4] font-normal text-[11px]">(Você)</span>}
        </div>

        <div className="flex items-center gap-1 bg-[#1e1f22]/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#dbdee1] border border-white/5 pointer-events-auto">
          {surfaceType === 'window' ? (
            <>
              <AppWindow size={14} className="text-[#5865f2]" />
              <span>Janela</span>
            </>
          ) : (
            <>
              <Monitor size={14} className="text-[#57f287]" />
              <span>Tela</span>
            </>
          )}
        </div>

        {hasAudio && (
          <div className="flex items-center gap-1 bg-[#23a55a]/20 border border-[#23a55a]/40 text-[#57f287] px-2.5 py-1.5 rounded-lg text-xs font-medium pointer-events-auto">
            <Volume2 size={14} />
            <span>Áudio ON</span>
          </div>
        )}
      </div>

      {/* Top Right: Fullscreen and Volume Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        {!isSelf && hasAudio && onVolumeChange && (
          <div className="relative">
            <button
              onClick={() => setShowVolume(!showVolume)}
              className="bg-[#1e1f22]/90 hover:bg-[#35373c] p-2 rounded-lg text-[#dbdee1] hover:text-white transition-colors shadow-md border border-white/5"
              title="Volume do Compartilhamento"
            >
              {streamVolume === 0 ? <VolumeX size={16} className="text-[#da373c]" /> : <Volume2 size={16} />}
            </button>
            {showVolume && (
              <div className="absolute right-0 top-11 z-50">
                <VolumeSlider
                  label={`Áudio de ${presenterName}`}
                  volume={streamVolume}
                  onChange={onVolumeChange}
                />
              </div>
            )}
          </div>
        )}

        <button
          onClick={toggleFullscreen}
          className="bg-[#1e1f22]/90 hover:bg-[#35373c] p-2 rounded-lg text-[#dbdee1] hover:text-white transition-colors shadow-md border border-white/5"
          title={isFullscreen ? 'Sair da Tela Cheia' : 'Assistir em Tela Cheia'}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
    </div>
  );
};
