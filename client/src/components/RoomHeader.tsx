import React, { useState } from 'react';
import { Hash, Users, Copy, Check, Zap } from 'lucide-react';

interface RoomHeaderProps {
  roomId: string;
  participantCount: number;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({ roomId, participantCount }) => {
  const [copied, setCopied] = useState(false);

  const copyRoomLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <header className="h-14 bg-[#2b2d31] border-b border-[#1f2023] px-6 flex items-center justify-between shrink-0 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-white font-bold text-base">
          <Hash size={20} className="text-[#80848e]" />
          <span>{roomId}</span>
        </div>

        <div className="h-4 w-[1px] bg-[#3f4147]" />

        <div className="flex items-center gap-1.5 bg-[#1e1f22] px-2.5 py-1 rounded text-xs text-[#949ba4] font-medium">
          <Users size={14} className="text-[#5865f2]" />
          <span>{participantCount} {participantCount === 1 ? 'user' : 'users'}</span>
        </div>

        <div className="flex items-center gap-1 bg-[#23a55a]/15 text-[#57f287] border border-[#23a55a]/30 px-2 py-0.5 rounded text-[11px] font-semibold">
          <Zap size={12} />
          <span>Zero-Electron</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={copyRoomLink}
          className="flex items-center gap-1.5 bg-[#313338] hover:bg-[#383a40] text-[#dbdee1] hover:text-white px-3 py-1.5 rounded-md text-xs font-medium border border-white/5 transition-colors shadow-xs"
          title="Copy room link to invite friends"
        >
          {copied ? <Check size={14} className="text-[#57f287]" /> : <Copy size={14} />}
          <span>{copied ? 'Link Copied!' : 'Invite Friends'}</span>
        </button>
      </div>
    </header>
  );
};
