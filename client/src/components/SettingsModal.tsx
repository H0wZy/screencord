import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  Headphones,
  User,
  Shield,
  Palette,
  Check,
  Sparkles,
  Volume2,
  Sliders,
  Radio,
  Search,
} from 'lucide-react';
import { Participant } from '../types.js';

interface SettingsModalProps {
  isOpen: boolean;
  self: Participant;
  onClose: () => void;
  onUpdateNickname: (newNickname: string) => void;
  onUpdateAudioSettings?: (settings: {
    inputDeviceId: string;
    outputDeviceId: string;
    inputVolume: number;
    outputVolume: number;
    profile: 'isolation' | 'studio' | 'custom';
    autoSensitivity: boolean;
  }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  self,
  onClose,
  onUpdateNickname,
  onUpdateAudioSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'account' | 'privacy' | 'appearance'>('voice');
  const [nicknameInput, setNicknameInput] = useState(self.nickname);

  // Audio Device States
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string>('default');
  const [selectedOutputId, setSelectedOutputId] = useState<string>('default');

  // Volume States
  const [inputVolume, setInputVolume] = useState<number>(100);
  const [outputVolume, setOutputVolume] = useState<number>(100);

  // Input Profile
  const [inputProfile, setInputProfile] = useState<'isolation' | 'studio' | 'custom'>('custom');
  const [autoSensitivity, setAutoSensitivity] = useState<boolean>(true);
  const [manualSensitivity, setManualSensitivity] = useState<number>(50);

  // Mic Test States
  const [isTestingMic, setIsTestingMic] = useState<boolean>(false);
  const [vuBars, setVuBars] = useState<number[]>(new Array(40).fill(0));
  const [liveMicLevel, setLiveMicLevel] = useState<number>(0);

  const testAudioCtxRef = useRef<AudioContext | null>(null);
  const testAnalyserRef = useRef<AnalyserNode | null>(null);
  const testStreamRef = useRef<MediaStream | null>(null);
  const testAnimFrameRef = useRef<number | null>(null);

  // Enumerate devices on mount
  useEffect(() => {
    if (!isOpen) return;

    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter((d) => d.kind === 'audioinput');
        const outputs = devices.filter((d) => d.kind === 'audiooutput');

        setAudioInputDevices(inputs);
        setAudioOutputDevices(outputs);

        if (inputs.length > 0 && selectedInputId === 'default') {
          setSelectedInputId(inputs[0].deviceId);
        }
        if (outputs.length > 0 && selectedOutputId === 'default') {
          setSelectedOutputId(outputs[0].deviceId);
        }
      } catch (err) {
        console.warn('Failed to enumerate media devices:', err);
      }
    };

    loadDevices();
    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
    };
  }, [isOpen]);

  // Handle ESC key press to close settings (Discord behavior)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Clean up mic test on modal close
  const stopMicTest = () => {
    if (testAnimFrameRef.current) {
      cancelAnimationFrame(testAnimFrameRef.current);
      testAnimFrameRef.current = null;
    }
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach((t) => t.stop());
      testStreamRef.current = null;
    }
    if (testAudioCtxRef.current && testAudioCtxRef.current.state !== 'closed') {
      testAudioCtxRef.current.close();
      testAudioCtxRef.current = null;
    }
    setIsTestingMic(false);
    setVuBars(new Array(40).fill(0));
    setLiveMicLevel(0);
  };

  const startMicTest = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedInputId && selectedInputId !== 'default'
          ? { deviceId: { exact: selectedInputId } }
          : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      testStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      testAudioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      testAnalyserRef.current = analyser;

      setIsTestingMic(true);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!testAnalyserRef.current) return;
        testAnalyserRef.current.getByteFrequencyData(dataArray);

        // Map dataArray into 40 VU bars
        const barsCount = 40;
        const newBars: number[] = [];
        let totalSum = 0;

        for (let i = 0; i < barsCount; i++) {
          const index = Math.floor((i / barsCount) * bufferLength);
          const val = (dataArray[index] || 0) / 255;
          newBars.push(val);
          totalSum += dataArray[index] || 0;
        }

        const avg = totalSum / bufferLength;
        const normalizedAvg = Math.min(100, Math.round((avg / 128) * 100));

        setVuBars(newBars);
        setLiveMicLevel(normalizedAvg);

        testAnimFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err) {
      console.warn('Failed to start microphone test:', err);
      stopMicTest();
    }
  };

  const handleToggleMicTest = () => {
    if (isTestingMic) {
      stopMicTest();
    } else {
      startMicTest();
    }
  };

  const handleClose = () => {
    stopMicTest();
    if (onUpdateAudioSettings) {
      onUpdateAudioSettings({
        inputDeviceId: selectedInputId,
        outputDeviceId: selectedOutputId,
        inputVolume: inputVolume / 100,
        outputVolume: outputVolume / 100,
        profile: inputProfile,
        autoSensitivity,
      });
    }
    onClose();
  };

  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    if (nicknameInput.trim()) {
      onUpdateNickname(nicknameInput.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-[#313338] text-[#dbdee1] overflow-hidden animate-in fade-in duration-150">
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-[#2b2d31] flex flex-col justify-between py-12 px-6 shrink-0 border-r border-[#1f2023]">
        <div className="flex flex-col gap-6">
          {/* User Profile Mini Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-[#35373c]">
            <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center font-bold text-white text-base uppercase shadow-md">
              {self.nickname.slice(0, 2)}
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm leading-tight truncate">{self.nickname}</span>
              <span className="text-[11px] text-[#949ba4] hover:text-white cursor-pointer transition-colors">
                Editar perfil ✏️
              </span>
            </div>
          </div>

          {/* Search box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar"
              disabled
              className="w-full bg-[#1e1f22] text-xs px-3 py-1.5 pl-8 rounded text-[#949ba4] focus:outline-hidden"
            />
            <Search size={14} className="absolute left-2.5 top-2 text-[#949ba4]" />
          </div>

          {/* Navigation Items */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4] px-2 mb-1">
              Configurações do Usuário
            </span>
            <button
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                activeTab === 'account'
                  ? 'bg-[#35373c] text-white font-semibold'
                  : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
              }`}
            >
              <User size={18} />
              <span>Conta</span>
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                activeTab === 'privacy'
                  ? 'bg-[#35373c] text-white font-semibold'
                  : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
              }`}
            >
              <Shield size={18} />
              <span>Dados e privacidade</span>
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4] px-2 mb-1">
              Experiência
            </span>
            <button
              onClick={() => setActiveTab('voice')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                activeTab === 'voice'
                  ? 'bg-[#35373c] text-white font-semibold'
                  : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
              }`}
            >
              <Mic size={18} />
              <span>Voz e vídeo</span>
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                activeTab === 'appearance'
                  ? 'bg-[#35373c] text-white font-semibold'
                  : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
              }`}
            >
              <Palette size={18} />
              <span>Aparência</span>
            </button>
          </div>
        </div>

        {/* Minimalist open source footer */}
        <div className="text-[11px] text-[#949ba4] flex flex-col gap-1 border-t border-[#35373c] pt-4">
          <span className="text-white font-semibold">Screencord Desktop</span>
          <span>100% Grátis & Open Source</span>
        </div>
      </aside>

      {/* MAIN CONTENT PANEL */}
      <main className="flex-1 overflow-y-auto px-12 py-12 flex justify-between relative">
        <div className="w-full max-w-2xl flex flex-col gap-8 pb-16">
          {/* TAB 1: VOZ E VÍDEO (VOICE & VIDEO) */}
          {activeTab === 'voice' && (
            <div className="flex flex-col gap-8 animate-in fade-in duration-100">
              <h1 className="text-xl font-bold text-white tracking-tight">Voz</h1>

              {/* ROW 1: INPUT AND OUTPUT DEVICES */}
              <div className="grid grid-cols-2 gap-6">
                {/* Microfone Dropdown */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#b5bac1]">
                    Microfone
                  </label>
                  <div className="relative">
                    <select
                      value={selectedInputId}
                      onChange={(e) => setSelectedInputId(e.target.value)}
                      className="w-full bg-[#1e1f22] text-white text-sm font-medium px-3.5 py-2.5 rounded-md border border-[#1f2023] focus:border-[#5865f2] focus:outline-hidden appearance-none cursor-pointer"
                    >
                      {audioInputDevices.length === 0 ? (
                        <option value="default">Padrão do Sistema</option>
                      ) : (
                        audioInputDevices.map((d, idx) => (
                          <option key={d.deviceId || idx} value={d.deviceId}>
                            {d.label || `Microfone ${idx + 1}`}
                          </option>
                        ))
                      )}
                    </select>
                    <div className="absolute right-3.5 top-3 pointer-events-none text-[#949ba4]">▾</div>
                  </div>
                </div>

                {/* Alto-falante Dropdown */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#b5bac1]">
                    Alto-falante
                  </label>
                  <div className="relative">
                    <select
                      value={selectedOutputId}
                      onChange={(e) => setSelectedOutputId(e.target.value)}
                      className="w-full bg-[#1e1f22] text-white text-sm font-medium px-3.5 py-2.5 rounded-md border border-[#1f2023] focus:border-[#5865f2] focus:outline-hidden appearance-none cursor-pointer"
                    >
                      {audioOutputDevices.length === 0 ? (
                        <option value="default">Padrão do Sistema</option>
                      ) : (
                        audioOutputDevices.map((d, idx) => (
                          <option key={d.deviceId || idx} value={d.deviceId}>
                            {d.label || `Alto-falante ${idx + 1}`}
                          </option>
                        ))
                      )}
                    </select>
                    <div className="absolute right-3.5 top-3 pointer-events-none text-[#949ba4]">▾</div>
                  </div>
                </div>
              </div>

              {/* ROW 2: VOLUME SLIDERS */}
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-[#b5bac1]">
                    <span>Volume do Microfone</span>
                    <span className="font-mono text-white">{inputVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={inputVolume}
                    onChange={(e) => setInputVolume(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-[#4e5058] rounded-lg appearance-none cursor-pointer accent-[#5865f2]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-[#b5bac1]">
                    <span>Volume do Alto-falante</span>
                    <span className="font-mono text-white">{outputVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={outputVolume}
                    onChange={(e) => setOutputVolume(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-[#4e5058] rounded-lg appearance-none cursor-pointer accent-[#5865f2]"
                  />
                </div>
              </div>

              {/* ROW 3: TESTE DO MICROFONE (MIC TEST & VU METER) */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleToggleMicTest}
                    className={`px-5 py-2.5 rounded font-semibold text-sm transition-all shadow-md active:scale-98 ${
                      isTestingMic
                        ? 'bg-[#da373c] text-white hover:bg-[#c02e34]'
                        : 'bg-[#5865f2] text-white hover:bg-[#4752c4]'
                    }`}
                  >
                    {isTestingMic ? 'Parar teste' : 'Teste do microfone'}
                  </button>

                  {/* Animated Vertical Bars VU Meter (exact from Discord screenshot!) */}
                  <div className="flex items-center gap-[3px] bg-[#1e1f22] px-4 py-3 rounded-lg border border-[#232428] flex-1 h-11 overflow-hidden">
                    {vuBars.map((level, i) => {
                      const isActive = isTestingMic && level > 0.05;
                      const heightPercent = isTestingMic ? Math.max(15, Math.min(100, Math.round(level * 100))) : 15;
                      const barColor =
                        i > 32 ? 'bg-[#da373c]' : i > 24 ? 'bg-[#fee75c]' : 'bg-[#5865f2]';

                      return (
                        <div
                          key={i}
                          style={{ height: `${heightPercent}%` }}
                          className={`w-[4px] rounded-xs transition-all duration-75 ${
                            isActive ? barColor : 'bg-[#3f4147]'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                <span className="text-xs text-[#949ba4]">
                  Precisa de ajuda? Confira nosso{' '}
                  <span className="text-[#00a8fc] hover:underline cursor-pointer">
                    guia de solução de problemas
                  </span>
                  .
                </span>
              </div>

              <div className="h-[1px] bg-[#3f4147] my-2" />

              {/* ROW 4: PERFIL DE ENTRADA (AUDIO PROFILES) */}
              <div className="flex flex-col gap-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#b5bac1]">
                  Perfil de entrada
                </span>

                <div className="flex flex-col gap-3">
                  {/* Option 1: Isolamento de Voz */}
                  <label
                    onClick={() => setInputProfile('isolation')}
                    className={`flex items-start gap-3.5 p-3.5 rounded-lg border cursor-pointer transition-all ${
                      inputProfile === 'isolation'
                        ? 'bg-[#2b2d31] border-[#5865f2]'
                        : 'bg-[#2b2d31]/50 border-transparent hover:bg-[#2b2d31]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="audio_profile"
                      checked={inputProfile === 'isolation'}
                      onChange={() => setInputProfile('isolation')}
                      className="mt-1 accent-[#5865f2]"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">Isolamento de Voz</span>
                      <span className="text-xs text-[#949ba4]">
                        Só a sua linda voz: deixe o Screencord equalizar o ruído e cancelar eco.
                      </span>
                    </div>
                  </label>

                  {/* Option 2: Estúdio */}
                  <label
                    onClick={() => setInputProfile('studio')}
                    className={`flex items-start gap-3.5 p-3.5 rounded-lg border cursor-pointer transition-all ${
                      inputProfile === 'studio'
                        ? 'bg-[#2b2d31] border-[#5865f2]'
                        : 'bg-[#2b2d31]/50 border-transparent hover:bg-[#2b2d31]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="audio_profile"
                      checked={inputProfile === 'studio'}
                      onChange={() => setInputProfile('studio')}
                      className="mt-1 accent-[#5865f2]"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">Estúdio</span>
                      <span className="text-xs text-[#949ba4]">
                        Áudio puro: microfone aberto e sem processamento (ideal para instrumentos ou jogos).
                      </span>
                    </div>
                  </label>

                  {/* Option 3: Personalizado */}
                  <label
                    onClick={() => setInputProfile('custom')}
                    className={`flex items-start gap-3.5 p-3.5 rounded-lg border cursor-pointer transition-all ${
                      inputProfile === 'custom'
                        ? 'bg-[#2b2d31] border-[#5865f2]'
                        : 'bg-[#2b2d31]/50 border-transparent hover:bg-[#2b2d31]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="audio_profile"
                      checked={inputProfile === 'custom'}
                      onChange={() => setInputProfile('custom')}
                      className="mt-1 accent-[#5865f2]"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">Personalizado</span>
                      <span className="text-xs text-[#949ba4]">
                        Modo avançado: me dê todos os botões e mostradores!
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* ROW 5: SENSIBILIDADE DE ENTRADA */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">
                    Ajustar Automaticamente a Sensibilidade de Entrada
                  </span>
                  <button
                    onClick={() => setAutoSensitivity(!autoSensitivity)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                      autoSensitivity ? 'bg-[#5865f2]' : 'bg-[#4e5058]'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        autoSensitivity ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-xs text-[#949ba4] leading-relaxed">
                  Controla quanto som o Screencord transmite do seu microfone. Fale para testar seu microfone — se o medidor estiver cheio, o Screencord está transmitindo sua bela voz.
                </p>

                {/* Sensitivity Meter Bar with Threshold Handle */}
                <div className="relative w-full h-3 bg-[#1e1f22] rounded-full overflow-hidden border border-[#232428] mt-1">
                  {/* Live Level Fill */}
                  <div
                    style={{ width: `${liveMicLevel}%` }}
                    className="h-full bg-gradient-to-r from-[#23a55a] via-[#57f287] to-[#fee75c] transition-all duration-75"
                  />
                  {/* Threshold mark if manual */}
                  {!autoSensitivity && (
                    <div
                      style={{ left: `${manualSensitivity}%` }}
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-md cursor-ew-resize"
                    />
                  )}
                </div>

                {!autoSensitivity && (
                  <div className="flex items-center justify-between text-xs text-[#949ba4] mt-1">
                    <span>Silencioso (0%)</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={manualSensitivity}
                      onChange={(e) => setManualSensitivity(parseInt(e.target.value, 10))}
                      className="w-48 h-1.5 bg-[#4e5058] rounded-lg appearance-none cursor-pointer accent-[#5865f2]"
                    />
                    <span>Alto (100%)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CONTA (ACCOUNT) */}
          {activeTab === 'account' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-100">
              <h1 className="text-xl font-bold text-white tracking-tight">Minha Conta</h1>

              {/* User Banner / Card */}
              <div className="bg-[#1e1f22] rounded-xl overflow-hidden border border-[#232428] shadow-md">
                <div className="h-24 bg-gradient-to-r from-[#5865f2] to-[#eb459e]" />
                <div className="p-6 flex items-end justify-between -mt-10">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-[#2b2d31] p-1.5 shadow-xl">
                      <div className="w-full h-full rounded-full bg-[#5865f2] flex items-center justify-center text-white text-2xl font-bold uppercase">
                        {self.nickname.slice(0, 2)}
                      </div>
                    </div>
                    <div className="flex flex-col mt-4">
                      <span className="text-white text-lg font-bold">{self.nickname}</span>
                      <span className="text-xs text-[#949ba4]">Self-Hosted Peer</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-[#232428]">
                  <form onSubmit={handleSaveNickname} className="flex flex-col gap-3 max-w-sm">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#b5bac1]">
                      Alterar Apelido
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={nicknameInput}
                        onChange={(e) => setNicknameInput(e.target.value)}
                        className="bg-[#2b2d31] text-white text-sm px-3.5 py-2 rounded-md border border-[#35373c] focus:border-[#5865f2] focus:outline-hidden flex-1"
                      />
                      <button
                        type="submit"
                        className="bg-[#5865f2] hover:bg-[#4752c4] text-white font-semibold text-xs px-4 py-2 rounded-md transition-colors"
                      >
                        Salvar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DADOS E PRIVACIDADE */}
          {activeTab === 'privacy' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-100">
              <h1 className="text-xl font-bold text-white tracking-tight">Dados e Privacidade</h1>
              <div className="bg-[#2b2d31] p-6 rounded-xl border border-[#232428] flex flex-col gap-4">
                <div className="flex items-center gap-2 text-[#57f287] font-semibold text-sm">
                  <Check size={18} />
                  <span>Zero Rastreamento Ativado</span>
                </div>
                <p className="text-xs text-[#949ba4] leading-relaxed">
                  O Screencord não coleta nem transmite dados biométricos, gravações de voz ou telemetria para servidores de terceiros. Todas as conexões de vídeo, tela e áudio são transmitidas diretamente entre os nós locais via WebRTC peer-to-peer.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: APARÊNCIA */}
          {activeTab === 'appearance' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-100">
              <h1 className="text-xl font-bold text-white tracking-tight">Aparência</h1>
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#b5bac1]">Tema</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border-2 border-[#5865f2] bg-[#1e1f22] flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-semibold text-white">Escuro (Discord Original)</span>
                    <Check size={16} className="text-[#5865f2]" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TOP RIGHT: DISCORD-STYLE ESC CLOSE BUTTON */}
        <div className="flex flex-col items-center gap-1.5 shrink-0 pl-6">
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full border-2 border-[#b5bac1] hover:border-white text-[#b5bac1] hover:text-white flex items-center justify-center transition-colors cursor-pointer group"
            title="Fechar (ESC)"
          >
            <X size={18} className="group-hover:scale-110 transition-transform" />
          </button>
          <span className="text-[11px] font-bold text-[#b5bac1] tracking-wider uppercase">ESC</span>
        </div>
      </main>
    </div>
  );
};
