import React, { useState } from 'react';
import { Monitor, AppWindow, X, Volume2, ShieldCheck } from 'lucide-react';

interface ScreenPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSource: (surface: 'monitor' | 'window') => void;
}

export const ScreenPickerModal: React.FC<ScreenPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectSource,
}) => {
  const [selectedTab, setSelectedTab] = useState<'monitor' | 'window'>('monitor');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-[#313338] w-full max-w-lg rounded-xl overflow-hidden shadow-2xl border border-[#232428] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232428]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Screenshare</span>
            <span className="text-xs bg-[#5865f2] px-2 py-0.5 rounded text-white font-normal uppercase">
              Ultra-Lite
            </span>
          </h2>
          <button
            onClick={onClose}
            className="text-[#949ba4] hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#232428] px-6 bg-[#2b2d31]">
          <button
            onClick={() => setSelectedTab('monitor')}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm transition-all border-b-2 ${
              selectedTab === 'monitor'
                ? 'border-[#5865f2] text-white'
                : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
            }`}
          >
            <Monitor size={18} />
            <span>Entire Screen</span>
          </button>
          <button
            onClick={() => setSelectedTab('window')}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm transition-all border-b-2 ${
              selectedTab === 'window'
                ? 'border-[#5865f2] text-white'
                : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
            }`}
          >
            <AppWindow size={18} />
            <span>Applications</span>
          </button>
        </div>

        {/* Body Description */}
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-start gap-3 bg-[#2b2d31] p-4 rounded-lg border border-[#232428]">
            <div className="p-2 rounded-lg bg-[#5865f2]/10 text-[#5865f2] mt-0.5">
              <Volume2 size={22} />
            </div>
            <div className="flex flex-col gap-1 text-xs">
              <span className="text-white font-semibold">Important: Stream PC Audio</span>
              <p className="text-[#949ba4] leading-relaxed">
                When the browser screen selection prompt appears, make sure to check the{' '}
                <strong className="text-[#57f287]">"Also share system audio"</strong> checkbox at the bottom left to capture game, video, and PC sounds directly for your friends!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#949ba4]">
            <ShieldCheck size={16} className="text-[#23a55a]" />
            <span>Zero Electron bloat • Hardware accelerated 60 FPS • Direct low latency</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#2b2d31] border-t border-[#232428]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white hover:underline transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onClose();
              onSelectSource(selectedTab);
            }}
            className="flex items-center gap-2 bg-[#5865f2] hover:bg-[#4752c4] text-white font-semibold text-sm px-6 py-2.5 rounded-lg shadow-md transition-all active:scale-95"
          >
            <span>Go Live</span>
          </button>
        </div>
      </div>
    </div>
  );
};
