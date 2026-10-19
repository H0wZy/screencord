import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  Headphones,
  User,
  Shield,
  Palette,
  Check,
  Search,
  Keyboard,
  Camera,
  Globe,
  Radio,
  Sliders,
  Volume2,
} from 'lucide-react';
import { Participant } from '../types.js';
import {
  loadShortcuts,
  saveShortcuts,
  formatShortcutDisplay,
  parseKeyEvent,
  DEFAULT_SHORTCUTS,
  ShortcutConfig,
} from '../services/shortcutManager.js';

interface SettingsModalProps {
  isOpen: boolean;
  self: Participant;
  initialTab?: string;
  onClose: () => void;
  onUpdateNickname: (newNickname: string) => void;
  onUpdateAudioSettings?: (settings: {
    inputDeviceId: string;
    outputDeviceId: string;
    videoDeviceId: string;
    inputVolume: number;
    outputVolume: number;
    profile: 'isolation' | 'studio' | 'custom';
    autoSensitivity: boolean;
  }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  self,
  initialTab = 'voice',
  onClose,
  onUpdateNickname,
  onUpdateAudioSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'shortcuts' | 'account' | 'privacy' | 'network' | 'appearance'>('voice');
  const [searchQuery, setSearchQuery] = useState('');
  const [nicknameInput, setNicknameInput] = useState(self.nickname);

  // Audio & Video Device States
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string>('default');
  const [selectedOutputId, setSelectedOutputId] = useState<string>('default');
  const [selectedVideoId, setSelectedVideoId] = useState<string>('default');

  // Volume States
  const [inputVolume, setInputVolume] = useState<number>(100);
  const [outputVolume, setOutputVolume] = useState<number>(100);

  // Input Profile
  const [inputProfile, setInputProfile] = useState<'isolation' | 'studio' | 'custom'>('custom');
  const [autoSensitivity, setAutoSensitivity] = useState<boolean>(true);
  const [manualSensitivity, setManualSensitivity] = useState<number>(50);

  // Mic Test States (40 bars)
  const [isTestingMic, setIsTestingMic] = useState<boolean>(false);
  const [vuBars, setVuBars] = useState<number[]>(new Array(40).fill(0));
  const [liveMicLevel, setLiveMicLevel] = useState<number>(0);

  // Camera Test / Preview States
  const [isTestingCam, setIsTestingCam] = useState<boolean>(false);
  const camVideoRef = useRef<HTMLVideoElement>(null);
  const camStreamRef = useRef<MediaStream | null>(null);

  // Shortcuts State
  const [shortcuts, setShortcuts] = useState<ShortcutConfig>(DEFAULT_SHORTCUTS);
  const [recordingAction, setRecordingAction] = useState<keyof ShortcutConfig | null>(null);

  const testAudioCtxRef = useRef<AudioContext | null>(null);
  const testAnalyserRef = useRef<AnalyserNode | null>(null);
  const testStreamRef = useRef<MediaStream | null>(null);
  const testAnimFrameRef = useRef<number | null>(null);

  // Initial tab override
  useEffect(() => {
    if (initialTab && ['voice', 'shortcuts', 'account', 'privacy', 'network', 'appearance'].includes(initialTab)) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab, isOpen]);

  // Load shortcuts from localStorage
  useEffect(() => {
    if (isOpen) {
      setShortcuts(loadShortcuts());
    }
  }, [isOpen]);

  // Enumerate devices on mount
  useEffect(() => {
    if (!isOpen) return;

    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter((d) => d.kind === 'audioinput');
        const outputs = devices.filter((d) => d.kind === 'audiooutput');
        const vids = devices.filter((d) => d.kind === 'videoinput');

        setAudioInputDevices(inputs);
        setAudioOutputDevices(outputs);
        setVideoDevices(vids);

        if (inputs.length > 0 && selectedInputId === 'default') {
          setSelectedInputId(inputs[0].deviceId);
        }
        if (outputs.length > 0 && selectedOutputId === 'default') {
          setSelectedOutputId(outputs[0].deviceId);
        }
        if (vids.length > 0 && selectedVideoId === 'default') {
          setSelectedVideoId(vids[0].deviceId);
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

  // ESC key press to close settings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (recordingAction) {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === 'Escape') {
          setRecordingAction(null);
          return;
        }
        const parsed = parseKeyEvent(e);
        if (parsed) {
          const updated = { ...shortcuts, [recordingAction]: parsed };
          setShortcuts(updated);
          saveShortcuts(updated);
          setRecordingAction(null);
        }
        return;
      }

      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, recordingAction, shortcuts]);

  // Microphone VU Meter Test
  const toggleMicTest = async () => {
    if (isTestingMic) {
      stopMicTest();
    } else {
      await startMicTest();
    }
  };

  const startMicTest = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio:
          selectedInputId && selectedInputId !== 'default'
            ? { deviceId: { exact: selectedInputId } }
            : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      testStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      testAudioCtxRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      testAnalyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      setIsTestingMic(true);

      const updateMeter = () => {
        if (!testAnalyserRef.current) return;
        testAnalyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setLiveMicLevel(normalized);

        const activeCount = Math.round((normalized / 100) * 40);
        const newBars = new Array(40).fill(0).map((_, idx) => (idx < activeCount ? 1 : 0));
        setVuBars(newBars);

        testAnimFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err) {
      console.warn('Could not start microphone test:', err);
      setIsTestingMic(false);
    }
  };

  const stopMicTest = () => {
    if (testAnimFrameRef.current) {
      cancelAnimationFrame(testAnimFrameRef.current);
      testAnimFrameRef.current = null;
    }
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach((track) => track.stop());
      testStreamRef.current = null;
    }
    if (testAudioCtxRef.current) {
      testAudioCtxRef.current.close().catch(() => {});
      testAudioCtxRef.current = null;
    }
    setIsTestingMic(false);
    setVuBars(new Array(40).fill(0));
    setLiveMicLevel(0);
  };

  // Camera preview toggle
  const toggleCameraTest = async () => {
    if (isTestingCam) {
      stopCameraTest();
    } else {
      try {
        const constraints: MediaStreamConstraints = {
          video:
            selectedVideoId && selectedVideoId !== 'default'
              ? { deviceId: { exact: selectedVideoId } }
              : true,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        camStreamRef.current = stream;
        if (camVideoRef.current) {
          camVideoRef.current.srcObject = stream;
        }
        setIsTestingCam(true);
      } catch (err) {
        console.warn('Could not start camera preview:', err);
      }
    }
  };

  const stopCameraTest = () => {
    if (camStreamRef.current) {
      camStreamRef.current.getTracks().forEach((t) => t.stop());
      camStreamRef.current = null;
    }
    if (camVideoRef.current) {
      camVideoRef.current.srcObject = null;
    }
    setIsTestingCam(false);
  };

  const handleClose = () => {
    stopMicTest();
    stopCameraTest();
    if (onUpdateAudioSettings) {
      onUpdateAudioSettings({
        inputDeviceId: selectedInputId,
        outputDeviceId: selectedOutputId,
        videoDeviceId: selectedVideoId,
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

  // Filter tabs by search
  const allTabs = [
    { id: 'voice', label: 'Voz e vídeo', icon: Mic, group: 'Experiência' },
    { id: 'shortcuts', label: 'Atalhos de teclado', icon: Keyboard, group: 'Experiência' },
    { id: 'network', label: 'Conexão e Redes', icon: Globe, group: 'Experiência' },
    { id: 'account', label: 'Conta e Perfil', icon: User, group: 'Configurações do Usuário' },
    { id: 'privacy', label: 'Dados e privacidade', icon: Shield, group: 'Configurações do Usuário' },
    { id: 'appearance', label: 'Aparência', icon: Palette, group: 'Configurações do Usuário' },
  ] as const;

  const filteredTabs = allTabs.filter(
    (t) =>
      t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex bg-[#313338] text-[#dbdee1] overflow-hidden animate-in fade-in duration-150">
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-[#2b2d31] flex flex-col justify-between py-10 px-6 shrink-0 border-r border-[#1f2023]">
        <div className="flex flex-col gap-5">
          {/* User Profile Mini Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-[#35373c]">
            <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center font-bold text-white text-base uppercase shadow-md">
              {self.nickname.slice(0, 2)}
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm leading-tight truncate">{self.nickname}</span>
              <span className="text-[11px] text-[#949ba4]">Configurações</span>
            </div>
          </div>

          {/* Interactive Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar configurações..."
              className="w-full bg-[#1e1f22] text-xs px-3 py-1.5 pl-8 rounded-lg text-white placeholder-[#949ba4] focus:outline-none focus:ring-1 focus:ring-[#5865f2] transition-all"
            />
            <Search size={14} className="absolute left-2.5 top-2 text-[#949ba4]" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-[#949ba4] hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <div className="flex flex-col gap-1 overflow-y-auto max-h-[60vh]">
            {filteredTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-[#35373c] text-white font-semibold'
                      : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-[#5865f2]' : ''} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer App Info */}
        <div className="text-[11px] text-[#949ba4] flex flex-col gap-1 pt-4 border-t border-[#35373c]">
          <span className="font-semibold text-white">Screencord v1.0.0</span>
          <span>Zero-Electron • Nativo</span>
        </div>
      </aside>

      {/* RIGHT CONTENT PANE */}
      <main className="flex-1 overflow-y-auto py-10 px-10 flex justify-between">
        <div className="max-w-2xl w-full flex flex-col gap-8">
          {/* TAB: VOZ E VÍDEO */}
          {activeTab === 'voice' && (
            <div className="flex flex-col gap-8 animate-in fade-in duration-100">
              <h1 className="text-xl font-bold text-white tracking-tight">Voz e vídeo</h1>

              {/* ROW 1: DISPOSITIVOS DE ÁUDIO */}
              <div className="grid grid-cols-2 gap-6">
                {/* Dispositivo de Entrada */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#b5bac1]">
                    Dispositivo de entrada
                  </label>
                  <select
                    value={selectedInputId}
                    onChange={(e) => setSelectedInputId(e.target.value)}
                    className="bg-[#1e1f22] text-white text-sm px-3.5 py-2.5 rounded-lg border border-[#2b2d31] focus:border-[#5865f2] focus:outline-none cursor-pointer"
                  >
                    {audioInputDevices.map((d) => (
                      <option key={d.deviceId || 'default'} value={d.deviceId}>
                        {d.label || `Microfone (${d.deviceId.slice(0, 8)})`}
                      </option>
                    ))}
                  </select>

                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex justify-between text-xs text-[#b5bac1]">
                      <span>Volume de entrada</span>
                      <span className="font-mono">{inputVolume}%</span>
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
                </div>

                {/* Dispositivo de Saída */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#b5bac1]">
                    Dispositivo de saída
                  </label>
                  <select
                    value={selectedOutputId}
                    onChange={(e) => setSelectedOutputId(e.target.value)}
                    className="bg-[#1e1f22] text-white text-sm px-3.5 py-2.5 rounded-lg border border-[#2b2d31] focus:border-[#5865f2] focus:outline-none cursor-pointer"
                  >
                    {audioOutputDevices.map((d) => (
                      <option key={d.deviceId || 'default'} value={d.deviceId}>
                        {d.label || `Alto-falante (${d.deviceId.slice(0, 8)})`}
                      </option>
                    ))}
                  </select>

                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex justify-between text-xs text-[#b5bac1]">
                      <span>Volume de saída</span>
                      <span className="font-mono">{outputVolume}%</span>
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
              </div>

              {/* ROW 2: TESTE DO MICROFONE (40 BARRAS DE VU) */}
              <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#232428] flex flex-col gap-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#b5bac1]">
                  Teste do microfone
                </span>
                <p className="text-xs text-[#949ba4]">
                  Está tendo problemas com o microfone? Clique abaixo para testá-lo e ouvir seu retorno.
                </p>

                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleMicTest}
                    className={`font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                      isTestingMic
                        ? 'bg-[#da373c] hover:bg-[#c02e34] text-white'
                        : 'bg-[#5865f2] hover:bg-[#4752c4] text-white'
                    }`}
                  >
                    {isTestingMic ? 'Parar teste' : 'Vamos verificar'}
                  </button>

                  {/* 40 Animated VU Bars */}
                  <div className="flex-1 flex items-center gap-1 h-7 bg-[#1e1f22] p-1.5 rounded-lg border border-[#232428]">
                    {vuBars.map((val, idx) => {
                      const colorClass =
                        idx < 28 ? 'bg-[#57f287]' : idx < 34 ? 'bg-[#fee75c]' : 'bg-[#ed4245]';
                      return (
                        <div
                          key={idx}
                          className={`flex-1 h-full rounded-xs transition-all duration-75 ${
                            val ? colorClass : 'bg-[#2b2d31]'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ROW 3: DISPOSITIVO DE VÍDEO / CÂMERA COM PREVIEW */}
              <div className="flex flex-col gap-4 bg-[#2b2d31] p-5 rounded-xl border border-[#232428]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera size={18} className="text-[#5865f2]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#b5bac1]">
                      Configurações de Câmera
                    </span>
                  </div>
                  <button
                    onClick={toggleCameraTest}
                    className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
                      isTestingCam
                        ? 'bg-[#da373c] text-white'
                        : 'bg-[#5865f2] hover:bg-[#4752c4] text-white'
                    }`}
                  >
                    {isTestingCam ? 'Desligar Prévia' : 'Testar Vídeo'}
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-[#b5bac1]">Selecionar Câmera</label>
                  <select
                    value={selectedVideoId}
                    onChange={(e) => setSelectedVideoId(e.target.value)}
                    className="bg-[#1e1f22] text-white text-sm px-3.5 py-2.5 rounded-lg border border-[#2b2d31] focus:border-[#5865f2] focus:outline-none cursor-pointer"
                  >
                    {videoDevices.map((d) => (
                      <option key={d.deviceId || 'default'} value={d.deviceId}>
                        {d.label || `Câmera (${d.deviceId.slice(0, 8)})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Camera Live Preview Card */}
                {isTestingCam && (
                  <div className="relative aspect-video w-full max-h-56 bg-black rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
                    <video
                      ref={camVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-contain aspect-video"
                    />
                    <span className="absolute bottom-2 left-2 bg-[#1e1f22]/90 text-[11px] font-semibold text-white px-2.5 py-1 rounded-md">
                      Prévia ao vivo
                    </span>
                  </div>
                )}
              </div>

              {/* ROW 4: PERFIS DE ÁUDIO */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#b5bac1]">
                  Perfil de Áudio
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {(['isolation', 'studio', 'custom'] as const).map((p) => (
                    <label
                      key={p}
                      onClick={() => setInputProfile(p)}
                      className={`flex flex-col gap-1 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        inputProfile === p
                          ? 'bg-[#2b2d31] border-[#5865f2]'
                          : 'bg-[#2b2d31]/50 border-transparent hover:bg-[#2b2d31]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white capitalize">
                          {p === 'isolation' ? 'Isolamento de Voz' : p === 'studio' ? 'Estúdio' : 'Personalizado'}
                        </span>
                        {inputProfile === p && <Check size={16} className="text-[#5865f2]" />}
                      </div>
                      <span className="text-[11px] text-[#949ba4] leading-relaxed">
                        {p === 'isolation'
                          ? 'Supressão profunda de ruídos e eco.'
                          : p === 'studio'
                          ? 'Som puro sem processamento.'
                          : 'Configuração flexível de microfone.'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* ROW 5: SENSIBILIDADE */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">
                    Ajustar Automaticamente Sensibilidade
                  </span>
                  <button
                    onClick={() => setAutoSensitivity(!autoSensitivity)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      autoSensitivity ? 'bg-[#5865f2]' : 'bg-[#4e5058]'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        autoSensitivity ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ATALHOS DE TECLADO */}
          {activeTab === 'shortcuts' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-100">
              <h1 className="text-xl font-bold text-white tracking-tight">Atalhos de teclado</h1>
              <p className="text-xs text-[#949ba4] leading-relaxed">
                Configure teclas de atalho personalizadas para controlar seu microfone, áudio, câmera e compartilhamento de tela mesmo durante o jogo.
              </p>

              <div className="flex flex-col gap-3 bg-[#2b2d31] p-5 rounded-xl border border-[#232428]">
                {[
                  { key: 'toggleMute', label: 'Ativar / Desativar Microfone' },
                  { key: 'toggleDeafen', label: 'Ativar / Desativar Áudio (Ensurdecer)' },
                  { key: 'toggleCamera', label: 'Ligar / Desligar Câmera' },
                  { key: 'toggleScreen', label: 'Compartilhar / Parar Tela' },
                  { key: 'pushToTalk', label: 'Push-to-Talk (Pressionar para falar)' },
                ].map((item) => {
                  const actionKey = item.key as keyof ShortcutConfig;
                  const isRecording = recordingAction === actionKey;
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-3 bg-[#1e1f22] rounded-lg border border-white/5"
                    >
                      <span className="text-sm font-medium text-white">{item.label}</span>
                      <button
                        onClick={() => setRecordingAction(isRecording ? null : actionKey)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-mono transition-all ${
                          isRecording
                            ? 'bg-[#da373c] text-white animate-pulse'
                            : 'bg-[#2b2d31] hover:bg-[#35373c] text-[#5865f2] border border-[#5865f2]/40'
                        }`}
                      >
                        {isRecording ? 'Pressione tecla (ESC p/ cancelar)' : formatShortcutDisplay(shortcuts[actionKey])}
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  setShortcuts(DEFAULT_SHORTCUTS);
                  saveShortcuts(DEFAULT_SHORTCUTS);
                }}
                className="self-start text-xs text-[#949ba4] hover:text-white underline transition-colors"
              >
                Restaurar atalhos padrões
              </button>
            </div>
          )}

          {/* TAB: CONEXÃO E REDES */}
          {activeTab === 'network' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-100">
              <h1 className="text-xl font-bold text-white tracking-tight">Conexão e Redes</h1>
              <p className="text-xs text-[#949ba4] leading-relaxed">
                O Screencord suporta conexões diretas P2P via Tailscale, Radmin VPN, Hamachi ou túneis seguros da Cloudflare.
              </p>

              <div className="space-y-4">
                <div className="bg-[#2b2d31] p-5 rounded-xl border border-white/5 space-y-2">
                  <span className="text-sm font-semibold text-[#57f287]">Tailscale (Recomendado)</span>
                  <p className="text-xs text-[#949ba4] leading-relaxed">
                    Você e seus amigos conectam no Tailscale. O tráfego de voz e tela flui via WireGuard com ping mínimo e criptografia total.
                  </p>
                </div>

                <div className="bg-[#2b2d31] p-5 rounded-xl border border-white/5 space-y-2">
                  <span className="text-sm font-semibold text-[#5865f2]">Radmin VPN / Hamachi</span>
                  <p className="text-xs text-[#949ba4] leading-relaxed">
                    Entre na mesma sala virtual. Basta os amigos usarem seu IP virtual (ex: 25.x.y.z ou 26.x.y.z) na porta 3001.
                  </p>
                </div>

                <div className="bg-[#2b2d31] p-5 rounded-xl border border-white/5 space-y-2">
                  <span className="text-sm font-semibold text-[#f38630]">Cloudflare Quick Tunnel</span>
                  <p className="text-xs text-[#949ba4] leading-relaxed">
                    Rode <code className="text-[#57f287] font-mono">cloudflared tunnel --url http://localhost:3001</code> no terminal para gerar um link mundial grátis HTTPS sem precisar que os amigos instalem nenhum programa de VPN.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CONTA */}
          {activeTab === 'account' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-100">
              <h1 className="text-xl font-bold text-white tracking-tight">Minha Conta</h1>
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
                        className="bg-[#2b2d31] text-white text-sm px-3.5 py-2 rounded-lg border border-[#35373c] focus:border-[#5865f2] focus:outline-none flex-1"
                      />
                      <button
                        type="submit"
                        className="bg-[#5865f2] hover:bg-[#4752c4] text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors shadow-md"
                      >
                        Salvar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DADOS E PRIVACIDADE */}
          {activeTab === 'privacy' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-100">
              <h1 className="text-xl font-bold text-white tracking-tight">Dados e Privacidade</h1>
              <div className="bg-[#2b2d31] p-6 rounded-xl border border-[#232428] flex flex-col gap-4">
                <div className="flex items-center gap-2 text-[#57f287] font-semibold text-sm">
                  <Check size={18} />
                  <span>Zero Rastreamento Ativado</span>
                </div>
                <p className="text-xs text-[#949ba4] leading-relaxed">
                  O Screencord é 100% livre de telemetria e rastreadores. As conexões de voz e tela são transmitidas diretamente entre os nós locais via WebRTC peer-to-peer.
                </p>
              </div>
            </div>
          )}

          {/* TAB: APARÊNCIA */}
          {activeTab === 'appearance' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-100">
              <h1 className="text-xl font-bold text-white tracking-tight">Aparência</h1>
              <div className="p-4 rounded-xl border-2 border-[#5865f2] bg-[#1e1f22] flex items-center justify-between cursor-pointer">
                <span className="text-sm font-semibold text-white">Escuro (Discord Original)</span>
                <Check size={16} className="text-[#5865f2]" />
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
