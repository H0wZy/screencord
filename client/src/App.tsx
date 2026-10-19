import React, { useState, useEffect } from 'react';
import { ChannelView } from './components/ChannelView.js';
import { SettingsModal } from './components/SettingsModal.js';
import { ScreenShare, Headphones, Zap, Shield, ArrowRight, Gamepad2, Settings } from 'lucide-react';
import { Participant } from './types.js';

export const App: React.FC = () => {
  const [inRoom, setInRoom] = useState(false);
  const [roomId, setRoomId] = useState('general');
  const [nickname, setNickname] = useState('');
  const [isLobbySettingsOpen, setIsLobbySettingsOpen] = useState(false);

  useEffect(() => {
    // Check URL parameters for room query
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomId(roomParam);
    }

    // Default nickname from local storage or random generator
    const savedName = localStorage.getItem('screencord_nick');
    if (savedName) {
      setNickname(savedName);
    } else {
      const randomNick = `Gamer_${Math.floor(1000 + Math.random() * 9000)}`;
      setNickname(randomNick);
    }
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !roomId.trim()) return;

    localStorage.setItem('screencord_nick', nickname.trim());

    // Update browser URL without reloading
    const newUrl = `${window.location.pathname}?room=${encodeURIComponent(roomId.trim())}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    setInRoom(true);
  };

  const handleLeave = () => {
    setInRoom(false);
  };

  if (inRoom) {
    return (
      <ChannelView
        roomId={roomId.trim()}
        initialNickname={nickname.trim()}
        onLeaveRoom={handleLeave}
      />
    );
  }

  const dummySelf: Participant = {
    id: 'local_preview',
    nickname: nickname || 'Gamer',
    socketId: '',
    isMuted: false,
    isDeafened: false,
    isCameraOn: false,
    isScreenSharing: false,
    screenSourceType: null,
    hasScreenAudio: false,
    isSpeaking: false,
  };

  return (
    <div className="min-h-screen bg-[#1e1f22] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#5865f2]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#57f287]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Settings */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => setIsLobbySettingsOpen(true)}
          className="flex items-center gap-2 bg-[#2b2d31] hover:bg-[#35373c] text-[#dbdee1] hover:text-white px-4 py-2 rounded-full border border-white/5 transition-colors text-xs font-semibold shadow-md"
        >
          <Settings size={16} />
          <span>Configurações & Mic</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md bg-[#2b2d31] rounded-2xl p-8 border border-[#232428] shadow-2xl relative z-10 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-[#5865f2] flex items-center justify-center text-white shadow-xl shadow-[#5865f2]/20 mb-1">
            <ScreenShare size={36} />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">SCREENCORD</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-[#23a55a]/20 text-[#57f287] border border-[#23a55a]/40 px-2 py-0.5 rounded-full">
              Desktop Native
            </span>
          </div>
          <p className="text-xs text-[#949ba4] max-w-xs">
            Self-hosted voice & screen sharing for gamers. Zero Electron bloat. Peak FPS.
          </p>
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-3 gap-2 text-[11px] text-[#dbdee1] font-medium">
          <div className="flex flex-col items-center text-center p-2 rounded-lg bg-[#1e1f22]/70 border border-white/5">
            <Zap size={16} className="text-[#fee75c] mb-1" />
            <span>&lt;80MB RAM</span>
          </div>
          <div className="flex flex-col items-center text-center p-2 rounded-lg bg-[#1e1f22]/70 border border-white/5">
            <Headphones size={16} className="text-[#5865f2] mb-1" />
            <span>PC Sound</span>
          </div>
          <div className="flex flex-col items-center text-center p-2 rounded-lg bg-[#1e1f22]/70 border border-white/5">
            <Gamepad2 size={16} className="text-[#57f287] mb-1" />
            <span>60 FPS</span>
          </div>
        </div>

        {/* Join Room Form */}
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#b5bac1]">
              Your Nickname
            </label>
            <input
              type="text"
              required
              maxLength={24}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. MasterChief"
              className="w-full bg-[#1e1f22] text-white px-4 py-3 rounded-lg border border-[#232428] focus:border-[#5865f2] focus:outline-hidden text-sm transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#b5bac1]">
              Room Code
            </label>
            <input
              type="text"
              required
              maxLength={32}
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              placeholder="e.g. general, gaming, lobby"
              className="w-full bg-[#1e1f22] text-white px-4 py-3 rounded-lg border border-[#232428] focus:border-[#5865f2] focus:outline-hidden text-sm font-mono transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-[#5865f2]/25 transition-all duration-150 flex items-center justify-center gap-2 active:scale-98"
          >
            <span>Enter Call</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Quick Room Suggestions */}
        <div className="flex items-center justify-center gap-2 text-xs text-[#949ba4]">
          <span>Quick rooms:</span>
          {['general', 'lobby', 'gaming'].map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setRoomId(name)}
              className="hover:text-white underline transition-colors"
            >
              #{name}
            </button>
          ))}
        </div>

        {/* Privacy Note */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#80848e] border-t border-[#232428] pt-4">
          <Shield size={13} />
          <span>100% Peer-to-Peer & Localhost. Zero telemetry.</span>
        </div>
      </div>

      {/* Lobby Settings Modal */}
      <SettingsModal
        isOpen={isLobbySettingsOpen}
        self={dummySelf}
        onClose={() => setIsLobbySettingsOpen(false)}
        onUpdateNickname={(newNick) => {
          setNickname(newNick);
          localStorage.setItem('screencord_nick', newNick);
        }}
      />
    </div>
  );
};
export default App;
