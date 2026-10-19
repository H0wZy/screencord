import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Globe, Shield, Wifi, Terminal } from 'lucide-react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

interface NetworkInfo {
  localhost: string;
  lan: string[];
  vpn: { type: string; url: string; iface: string }[];
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, roomId }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [netInfo, setNetInfo] = useState<NetworkInfo | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/network-info')
        .then((res) => res.json())
        .then((data: NetworkInfo) => setNetInfo(data))
        .catch(() => {
          // Fallback if running via dev proxy
          setNetInfo({
            localhost: window.location.origin,
            lan: [],
            vpn: [],
          });
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getRoomUrl = (baseUrl: string) => {
    const clean = baseUrl.replace(/\/$/, '');
    return `${clean}/?room=${encodeURIComponent(roomId)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#313338] w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#232428] flex items-center justify-between bg-[#2b2d31]">
          <div className="flex items-center gap-2">
            <Globe className="text-[#5865f2]" size={20} />
            <h2 className="text-white font-bold text-base">Conectar Amigos na Chamada</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#949ba4] hover:text-white transition-colors p-1 rounded-lg hover:bg-[#35373c]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Option 1: Tailscale / Virtual LAN (Recommended) */}
          <div className="bg-[#2b2d31] p-4 rounded-xl border border-white/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#57f287] font-semibold text-sm">
                <Shield size={16} />
                <span>1. Tailscale / Radmin / Hamachi (Recomendado para Jogos)</span>
              </div>
              <span className="text-[11px] bg-[#23a55a]/20 text-[#57f287] px-2 py-0.5 rounded font-mono">
                P2P Direto
              </span>
            </div>
            <p className="text-xs text-[#949ba4] leading-relaxed">
              Conecte você e seus amigos na mesma rede virtual (Tailscale, Radmin VPN ou Hamachi). O tráfego de voz e tela flui diretamente entre vocês sem latência.
            </p>

            {netInfo?.vpn && netInfo.vpn.length > 0 ? (
              netInfo.vpn.map((v, idx) => {
                const inviteUrl = getRoomUrl(v.url);
                return (
                  <div key={idx} className="flex items-center gap-2 bg-[#1e1f22] p-2 rounded-lg">
                    <span className="text-xs font-mono text-[#dbdee1] truncate flex-1">{inviteUrl}</span>
                    <button
                      onClick={() => copyToClipboard(inviteUrl, `vpn-${idx}`)}
                      className="px-3 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === `vpn-${idx}` ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedKey === `vpn-${idx}` ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-xs bg-[#1e1f22] p-3 rounded-lg text-[#949ba4] font-mono">
                Nenhum IP virtual ativo detectado no momento. Se abrir o Tailscale ou Radmin, ele aparecerá aqui automaticamente.
              </div>
            )}
          </div>

          {/* Option 2: Local Wi-Fi / LAN */}
          <div className="bg-[#2b2d31] p-4 rounded-xl border border-white/5 space-y-2.5">
            <div className="flex items-center gap-2 text-[#5865f2] font-semibold text-sm">
              <Wifi size={16} />
              <span>2. Mesma Rede Wi-Fi / Rede Local (LAN)</span>
            </div>
            <p className="text-xs text-[#949ba4] leading-relaxed">
              Para amigos na mesma casa ou rede local do seu roteador:
            </p>
            {netInfo?.lan && netInfo.lan.length > 0 ? (
              netInfo.lan.map((url, idx) => {
                const inviteUrl = getRoomUrl(url);
                return (
                  <div key={idx} className="flex items-center gap-2 bg-[#1e1f22] p-2 rounded-lg">
                    <span className="text-xs font-mono text-[#dbdee1] truncate flex-1">{inviteUrl}</span>
                    <button
                      onClick={() => copyToClipboard(inviteUrl, `lan-${idx}`)}
                      className="px-3 py-1.5 bg-[#35373c] hover:bg-[#404249] text-white rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === `lan-${idx}` ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedKey === `lan-${idx}` ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-xs bg-[#1e1f22] p-3 rounded-lg text-[#949ba4] font-mono">
                {getRoomUrl(`http://localhost:3001`)}
              </div>
            )}
          </div>

          {/* Option 3: Cloudflare Quick Tunnel (Zero Install for Friends) */}
          <div className="bg-[#2b2d31] p-4 rounded-xl border border-white/5 space-y-2.5">
            <div className="flex items-center gap-2 text-[#f38630] font-semibold text-sm">
              <Terminal size={16} />
              <span>3. Cloudflare Tunnel (Sem instalar nada para seus amigos)</span>
            </div>
            <p className="text-xs text-[#949ba4] leading-relaxed">
              Para quem não quer instalar Tailscale nem Hamachi, execute este comando no terminal para criar um link mundial seguro HTTPS/WSS:
            </p>
            <div className="flex items-center gap-2 bg-[#1e1f22] p-2.5 rounded-lg border border-white/5">
              <code className="text-xs text-[#57f287] font-mono flex-1 select-all">
                cloudflared tunnel --url http://localhost:3001
              </code>
              <button
                onClick={() =>
                  copyToClipboard('cloudflared tunnel --url http://localhost:3001', 'cf-cmd')
                }
                className="p-1.5 bg-[#35373c] hover:bg-[#404249] text-white rounded-md transition-colors"
                title="Copiar comando"
              >
                {copiedKey === 'cf-cmd' ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#2b2d31] border-t border-[#232428] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-xl text-sm font-semibold transition-colors shadow-md"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
