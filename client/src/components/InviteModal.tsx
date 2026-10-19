import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Sparkles, Shield, Wifi, Globe, ArrowRight } from 'lucide-react';

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

let cachedNetworkInfo: NetworkInfo | null = null;

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, roomId }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [netInfo, setNetInfo] = useState<NetworkInfo | null>(cachedNetworkInfo);
  const [friendUrlInput, setFriendUrlInput] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (cachedNetworkInfo) {
      setNetInfo(cachedNetworkInfo);
      return;
    }

    const controller = new AbortController();
    fetch('/network-info', { signal: controller.signal })
      .then((res) => res.json())
      .then((data: NetworkInfo) => {
        cachedNetworkInfo = data;
        setNetInfo(data);
      })
      .catch(() => {
        const fallback: NetworkInfo = {
          localhost: window.location.origin,
          lan: [],
          vpn: [],
        };
        cachedNetworkInfo = fallback;
        setNetInfo(fallback);
      });

    return () => controller.abort();
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

  // Best recommended link (VPN > LAN > Localhost)
  const bestUrl = netInfo?.vpn && netInfo.vpn.length > 0
    ? getRoomUrl(netInfo.vpn[0].url)
    : netInfo?.lan && netInfo.lan.length > 0
    ? getRoomUrl(netInfo.lan[0])
    : getRoomUrl(window.location.origin);

  const handleJoinFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendUrlInput.trim()) return;
    let url = friendUrlInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `http://${url}`;
    }
    window.location.href = url;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div className="bg-[#313338] w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#232428] flex items-center justify-between bg-[#2b2d31]">
          <div className="flex items-center gap-2">
            <Sparkles className="text-[#5865f2]" size={20} />
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
          {/* Main One-Click Share Box */}
          <div className="bg-gradient-to-r from-[#5865f2]/20 to-[#23a55a]/20 border border-[#5865f2]/40 p-4 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Link de Convite Rápido
              </span>
              <span className="text-[11px] bg-[#23a55a] text-white px-2 py-0.5 rounded-full font-semibold">
                Pronto para Jogar
              </span>
            </div>

            <div className="flex items-center gap-2 bg-[#1e1f22] p-2.5 rounded-lg border border-white/5">
              <span className="text-xs font-mono text-[#dbdee1] truncate flex-1">{bestUrl}</span>
              <button
                onClick={() => copyToClipboard(bestUrl, 'main-copy')}
                className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
              >
                {copiedKey === 'main-copy' ? <Check size={15} /> : <Copy size={15} />}
                <span>{copiedKey === 'main-copy' ? 'Copiado!' : 'Copiar Link'}</span>
              </button>
            </div>
            <p className="text-[11px] text-[#949ba4] leading-relaxed">
              Basta enviar esse link para seu amigo colar no navegador ou no Screencord dele para entrar direto na sua sala.
            </p>
          </div>

          {/* Options for different connection types */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#b5bac1]">
              Como seus amigos vão se conectar?
            </span>

            {/* Option A: Tailscale / Radmin Gamer VPN */}
            <div className="bg-[#2b2d31] p-3.5 rounded-xl border border-white/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#23a55a]/15 text-[#57f287] flex items-center justify-center shrink-0">
                  <Shield size={18} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white">Rede Gamer (Tailscale / Radmin)</span>
                  <span className="text-[11px] text-[#949ba4] truncate">
                    {netInfo?.vpn && netInfo.vpn.length > 0
                      ? `Conectado via ${netInfo.vpn[0].type}`
                      : 'VPN direta sem lag'}
                  </span>
                </div>
              </div>

              {netInfo?.vpn && netInfo.vpn.length > 0 ? (
                <button
                  onClick={() => copyToClipboard(getRoomUrl(netInfo.vpn[0].url), 'vpn-btn')}
                  className="px-3 py-1.5 bg-[#35373c] hover:bg-[#404249] text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
                >
                  {copiedKey === 'vpn-btn' ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedKey === 'vpn-btn' ? 'Copiado' : 'Copiar Link'}</span>
                </button>
              ) : (
                <span className="text-[11px] text-[#949ba4] bg-[#1e1f22] px-2.5 py-1 rounded-md shrink-0">
                  Sem VPN ativa
                </span>
              )}
            </div>

            {/* Option B: Local Wi-Fi (Same House) */}
            <div className="bg-[#2b2d31] p-3.5 rounded-xl border border-white/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#5865f2]/15 text-[#5865f2] flex items-center justify-center shrink-0">
                  <Wifi size={18} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white">Mesmo Wi-Fi (Rede Local)</span>
                  <span className="text-[11px] text-[#949ba4] truncate">Para amigos na mesma casa</span>
                </div>
              </div>

              {netInfo?.lan && netInfo.lan.length > 0 && (
                <button
                  onClick={() => copyToClipboard(getRoomUrl(netInfo.lan[0]), 'lan-btn')}
                  className="px-3 py-1.5 bg-[#35373c] hover:bg-[#404249] text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
                >
                  {copiedKey === 'lan-btn' ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedKey === 'lan-btn' ? 'Copiado' : 'Copiar Link'}</span>
                </button>
              )}
            </div>

            {/* Option C: Cloudflare Tunnel (Zero Install for Friends) */}
            <div className="bg-[#2b2d31] p-3.5 rounded-xl border border-white/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#f38630]/15 text-[#f38630] flex items-center justify-center shrink-0">
                  <Globe size={18} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white">Cloudflare Tunnel (Mundial)</span>
                  <span className="text-[11px] text-[#949ba4] truncate">Sem VPN para os amigos</span>
                </div>
              </div>

              <button
                onClick={() => copyToClipboard('cloudflared tunnel --url http://localhost:3001', 'cf-btn')}
                className="px-3 py-1.5 bg-[#35373c] hover:bg-[#404249] text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
                title="Copiar comando para rodar no terminal"
              >
                {copiedKey === 'cf-btn' ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedKey === 'cf-btn' ? 'Copiado!' : 'Copiar Comando'}</span>
              </button>
            </div>
          </div>

          {/* Quick Join A Friend's Room */}
          <div className="pt-2 border-t border-white/5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#b5bac1] block mb-2">
              Quer entrar na chamada de um amigo?
            </span>
            <form onSubmit={handleJoinFriend} className="flex gap-2">
              <input
                type="text"
                value={friendUrlInput}
                onChange={(e) => setFriendUrlInput(e.target.value)}
                placeholder="Cole aqui o link ou IP do seu amigo..."
                className="bg-[#1e1f22] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/5 focus:border-[#5865f2] focus:outline-none flex-1"
              />
              <button
                type="submit"
                disabled={!friendUrlInput.trim()}
                className="px-4 py-2.5 bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-md shrink-0"
              >
                <span>Entrar</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#2b2d31] border-t border-[#232428] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
