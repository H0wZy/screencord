import React, { useState } from 'react';
import { Hash, Users, Copy, Check, Zap } from 'lucide-react';

interface RoomHeaderProps {
  roomId: string;
  participantCount: number;
  onOpenInvite?: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({ roomId, participantCount, onOpenInvite }) => {
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
          <span>{participantCount} {participantCount === 1 ? 'usuário' : 'usuários'}</span>
        </div>

        <div className="flex items-center gap-1 bg-[#23a55a]/15 text-[#57f287] border border-[#23a55a]/30 px-2 py-0.5 rounded text-[11px] font-semibold">
          <Zap size={12} />
          <span>Nativo / Zero-Electron</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenInvite}
          className="flex items-center gap-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-white/5 transition-all shadow-md active:scale-95"
          title="Conectar amigos via Tailscale, LAN ou Cloudflare"
        >
          <Users size={14} />
          <span>Conectar Amigos</span>
        </button>
      </div>
    </header>
  );
};
