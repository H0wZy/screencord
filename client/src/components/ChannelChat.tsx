import React, { useState, useRef, useEffect } from 'react';
import { Send, Hash, MessageSquare } from 'lucide-react';
import { ChatMessage } from '../types.js';

interface ChannelChatProps {
  roomId: string;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  selfId: string;
}

export const ChannelChat: React.FC<ChannelChatProps> = ({
  roomId,
  messages,
  onSendMessage,
  selfId,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#313338] border-t border-[#232428]">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Welcome header */}
        <div className="pt-2 pb-4 border-b border-white/5">
          <div className="w-12 h-12 rounded-full bg-[#35373c] flex items-center justify-center text-white mb-2">
            <Hash size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">Bem-vindo a #{roomId}!</h3>
          <p className="text-xs text-[#949ba4] mt-1">
            Este é o início do canal #{roomId}. Você pode conversar por texto e compartilhar arquivos aqui enquanto está na chamada.
          </p>
        </div>

        {/* Message List */}
        {messages.map((msg) => {
          const isSelf = msg.senderId === selfId;
          return (
            <div key={msg.id} className="flex items-start gap-3 group hover:bg-[#2e3035] -mx-4 px-4 py-1.5 rounded-lg transition-colors">
              <div className="w-9 h-9 rounded-full bg-[#5865f2] flex items-center justify-center text-white text-xs font-bold uppercase shrink-0 mt-0.5">
                {msg.nickname.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className={`text-sm font-semibold ${isSelf ? 'text-[#5865f2]' : 'text-white'}`}>
                    {msg.nickname}
                  </span>
                  <span className="text-[11px] text-[#949ba4]">{formatTime(msg.timestamp)}</span>
                </div>
                <p className="text-sm text-[#dbdee1] leading-relaxed break-words">{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 bg-[#313338]">
        <div className="flex items-center gap-2 bg-[#383a40] px-4 py-2.5 rounded-xl border border-white/5 focus-within:border-[#5865f2]/50 transition-colors">
          <MessageSquare size={18} className="text-[#949ba4]" />
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Conversar em #${roomId}...`}
            className="flex-1 bg-transparent text-sm text-white placeholder-[#949ba4] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="text-[#949ba4] hover:text-[#5865f2] disabled:opacity-30 disabled:hover:text-[#949ba4] transition-colors p-1"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};
