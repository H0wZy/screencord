import React, { useState, useEffect, useRef } from 'react';
import { Participant, RemoteStream, ServerMessage, ChatMessage } from '../types.js';
import { SignalingClient } from '../webrtc/signalingClient.js';
import { PeerManager } from '../webrtc/peerManager.js';
import { MediaCaptureService } from '../webrtc/mediaCapture.js';
import { AudioDetector } from '../webrtc/audioDetector.js';
import { AudioMixer } from '../webrtc/audioMixer.js';
import { RoomHeader } from './RoomHeader.js';
import { StreamGrid } from './StreamGrid.js';
import { ControlBar } from './ControlBar.js';
import { ScreenPickerModal } from './ScreenPickerModal.js';
import { SettingsModal } from './SettingsModal.js';
import { InviteModal } from './InviteModal.js';
import { ChannelChat } from './ChannelChat.js';
import { enumerateMediaDevices } from '../services/deviceService.js';
import { loadShortcuts, matchesShortcut, shouldIgnoreKeyEvent } from '../services/shortcutManager.js';

interface ChannelViewProps {
  roomId: string;
  initialNickname: string;
  onLeaveRoom: () => void;
}

export const ChannelView: React.FC<ChannelViewProps> = ({
  roomId,
  initialNickname,
  onLeaveRoom,
}) => {
  const [self, setSelf] = useState<Participant>({
    id: '',
    nickname: initialNickname,
    socketId: '',
    isMuted: false,
    isDeafened: false,
    isCameraOn: false,
    isScreenSharing: false,
    screenSourceType: null,
    hasScreenAudio: false,
    isSpeaking: false,
  });

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localUserStream, setLocalUserStream] = useState<MediaStream | null>(null);
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-call',
      senderId: 'system',
      nickname: 'Screencord',
      text: `Chamada de voz e tela iniciada em #${roomId}. Convide amigos pelo botão "Conectar Amigos" acima!`,
      timestamp: Date.now(),
    },
  ]);

  // Audio and Video Devices
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string>('default');
  const [selectedOutputId, setSelectedOutputId] = useState<string>('default');
  const [selectedVideoId, setSelectedVideoId] = useState<string>('default');

  // Audio Volumes & Profiles
  const [inputVolume, setInputVolume] = useState<number>(100);
  const [outputVolume, setOutputVolume] = useState<number>(100);
  const [inputProfile, setInputProfile] = useState<'isolation' | 'studio' | 'custom'>('custom');

  // Modals & Navigation
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<string>('voice');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isTheater, setIsTheater] = useState(false);
  const [, setMixerVersion] = useState(0);

  const signalingRef = useRef<SignalingClient | null>(null);
  const peerManagerRef = useRef<PeerManager | null>(null);
  const audioDetectorRef = useRef<AudioDetector | null>(null);
  const audioMixerRef = useRef<AudioMixer | null>(null);

  // Load and refresh devices
  const refreshDevices = async () => {
    const res = await enumerateMediaDevices();
    setAudioInputs(res.audioInputs);
    setAudioOutputs(res.audioOutputs);
    setVideoInputs(res.videoInputs);

    if (res.audioInputs.length > 0 && selectedInputId === 'default') {
      setSelectedInputId(res.audioInputs[0].deviceId);
    }
    if (res.audioOutputs.length > 0 && selectedOutputId === 'default') {
      setSelectedOutputId(res.audioOutputs[0].deviceId);
    }
    if (res.videoInputs.length > 0 && selectedVideoId === 'default') {
      setSelectedVideoId(res.videoInputs[0].deviceId);
    }
  };

  useEffect(() => {
    refreshDevices();
    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
      return () => navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
    }
  }, []);

  // WebRTC & Signaling Setup
  useEffect(() => {
    // 1. Initialize Audio Mixer
    const audioMixer = new AudioMixer();
    audioMixerRef.current = audioMixer;

    // 2. Initialize Signaling and PeerManager
    const signaling = new SignalingClient();
    signalingRef.current = signaling;

    const peerManager = new PeerManager(signaling);
    peerManagerRef.current = peerManager;

    // 3. Audio Detector for local speaking halo
    const audioDetector = new AudioDetector((isSpeaking) => {
      setSelf((prev) => {
        if (prev.isSpeaking !== isSpeaking) {
          signaling.updateState({ isSpeaking });
          return { ...prev, isSpeaking };
        }
        return prev;
      });
    });
    audioDetectorRef.current = audioDetector;

    // 4. Handle incoming remote tracks
    peerManager.onRemoteTrack = ({ peerId, track, stream, isScreen }) => {
      if (track.kind === 'audio') {
        audioMixer.attachAudioTrack(peerId, track, isScreen ? 'screen' : 'voice');
      }

      setRemoteStreams((prev) => {
        const existingIdx = prev.findIndex((s) => s.peerId === peerId && s.type === (isScreen ? 'screen' : 'camera'));
        const hasAudio = stream.getAudioTracks().length > 0;
        const newEntry: RemoteStream = {
          peerId,
          stream,
          type: isScreen ? 'screen' : 'camera',
          hasAudio,
        };

        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = newEntry;
          return next;
        }
        return [...prev, newEntry];
      });
    };

    peerManager.onPeerDisconnected = (peerId) => {
      audioMixer.cleanupPeer(peerId);
      setRemoteStreams((prev) => prev.filter((s) => s.peerId !== peerId));
    };

    // 5. Connect and subscribe to signaling events
    signaling.connect().then(() => {
      signaling.joinRoom(roomId, initialNickname);
    });

    const unsubscribe = signaling.subscribe((msg: ServerMessage) => {
      switch (msg.type) {
        case 'room-joined': {
          setSelf((prev) => ({
            ...prev,
            id: msg.payload.selfId,
          }));
          peerManager.setSelfId(msg.payload.selfId);
          setParticipants(msg.payload.existingParticipants);

          for (const peer of msg.payload.existingParticipants) {
            peerManager.initiateCall(peer.id);
          }
          break;
        }

        case 'user-joined': {
          setParticipants((prev) => {
            if (prev.some((p) => p.id === msg.payload.id)) return prev;
            return [...prev, msg.payload];
          });
          setMessages((prev) => [
            ...prev,
            {
              id: `join-${Date.now()}`,
              senderId: 'system',
              nickname: 'Screencord',
              text: `${msg.payload.nickname} entrou na chamada.`,
              timestamp: Date.now(),
            },
          ]);
          break;
        }

        case 'user-left': {
          const leavingPeer = participants.find((p) => p.id === msg.payload.peerId);
          peerManager.closePeer(msg.payload.peerId);
          setParticipants((prev) => prev.filter((p) => p.id !== msg.payload.peerId));
          setRemoteStreams((prev) => prev.filter((s) => s.peerId !== msg.payload.peerId));
          if (leavingPeer) {
            setMessages((prev) => [
              ...prev,
              {
                id: `leave-${Date.now()}`,
                senderId: 'system',
                nickname: 'Screencord',
                text: `${leavingPeer.nickname} saiu da chamada.`,
                timestamp: Date.now(),
              },
            ]);
          }
          break;
        }

        case 'signal-offer': {
          peerManager.handleOffer(msg.payload.fromPeerId, msg.payload.sdp);
          break;
        }

        case 'signal-answer': {
          peerManager.handleAnswer(msg.payload.fromPeerId, msg.payload.sdp);
          break;
        }

        case 'signal-ice-candidate': {
          peerManager.handleIceCandidate(msg.payload.fromPeerId, msg.payload.candidate);
          break;
        }

        case 'user-state-changed': {
          setParticipants((prev) =>
            prev.map((p) => (p.id === msg.payload.peerId ? { ...p, ...msg.payload.state } : p))
          );
          break;
        }

        case 'chat-message': {
          setMessages((prev) => [...prev, msg.payload]);
          break;
        }
      }
    });

    // 6. Request microphone permission on join
    MediaCaptureService.captureUserMedia({ audio: true, video: false })
      .then((stream) => {
        setLocalUserStream(stream);
        peerManager.setLocalUserStream(stream);
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioDetector.start(audioTrack);
        }
      })
      .catch((err) => {
        console.warn('Microphone permission not granted or device absent:', err);
      });

    return () => {
      unsubscribe();
      signaling.disconnect();
      peerManager.closeAll();
      audioDetector.stop();
      MediaCaptureService.stopStream(localUserStream);
      MediaCaptureService.stopStream(localScreenStream);
    };
  }, [roomId, initialNickname]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreKeyEvent(e)) return;
      const shortcuts = loadShortcuts();

      if (matchesShortcut(e, shortcuts.toggleMute)) {
        e.preventDefault();
        handleToggleMic();
      } else if (matchesShortcut(e, shortcuts.toggleDeafen)) {
        e.preventDefault();
        handleToggleDeafen();
      } else if (matchesShortcut(e, shortcuts.toggleCamera)) {
        e.preventDefault();
        handleToggleCamera();
      } else if (matchesShortcut(e, shortcuts.toggleScreen)) {
        e.preventDefault();
        if (self.isScreenSharing) {
          handleStopScreenShare();
        } else {
          setIsScreenModalOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [self.isMuted, self.isDeafened, self.isCameraOn, self.isScreenSharing, localUserStream, localScreenStream]);

  // Toggle Microphone
  const handleToggleMic = () => {
    if (!localUserStream) return;
    const audioTrack = localUserStream.getAudioTracks()[0];
    if (audioTrack) {
      const nextMuted = !self.isMuted;
      audioTrack.enabled = !nextMuted;
      setSelf((prev) => ({ ...prev, isMuted: nextMuted }));
      signalingRef.current?.updateState({ isMuted: nextMuted });
    }
  };

  // Toggle Deafen
  const handleToggleDeafen = () => {
    const nextDeafened = !self.isDeafened;
    audioMixerRef.current?.setDeafen(nextDeafened);
    setSelf((prev) => ({ ...prev, isDeafened: nextDeafened }));
    signalingRef.current?.updateState({ isDeafened: nextDeafened });
  };

  // Toggle Camera
  const handleToggleCamera = async () => {
    if (self.isCameraOn) {
      if (localUserStream) {
        localUserStream.getVideoTracks().forEach((t) => t.stop());
        const remainingTracks = localUserStream.getAudioTracks();
        const newStream = new MediaStream(remainingTracks);
        setLocalUserStream(newStream);
        peerManagerRef.current?.setLocalUserStream(newStream);
      }
      setSelf((prev) => ({ ...prev, isCameraOn: false }));
      signalingRef.current?.updateState({ isCameraOn: false });
    } else {
      try {
        const camConstraints: MediaStreamConstraints = {
          video:
            selectedVideoId && selectedVideoId !== 'default'
              ? { deviceId: { exact: selectedVideoId } }
              : true,
          audio: false,
        };
        const camStream = await navigator.mediaDevices.getUserMedia(camConstraints);
        const videoTrack = camStream.getVideoTracks()[0];
        if (videoTrack && localUserStream) {
          localUserStream.addTrack(videoTrack);
          const newStream = new MediaStream(localUserStream.getTracks());
          setLocalUserStream(newStream);
          peerManagerRef.current?.setLocalUserStream(newStream);
        }
        setSelf((prev) => ({ ...prev, isCameraOn: true }));
        signalingRef.current?.updateState({ isCameraOn: true });
      } catch (err) {
        console.warn('Could not enable camera:', err);
      }
    }
  };

  // Switch Camera Device
  const handleSelectCamera = async (deviceId: string) => {
    setSelectedVideoId(deviceId);
    if (self.isCameraOn && localUserStream) {
      const oldVideo = localUserStream.getVideoTracks()[0];
      if (oldVideo) {
        oldVideo.stop();
        localUserStream.removeTrack(oldVideo);
      }
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: deviceId && deviceId !== 'default' ? { deviceId: { exact: deviceId } } : true,
          audio: false,
        });
        const newTrack = camStream.getVideoTracks()[0];
        if (newTrack) {
          localUserStream.addTrack(newTrack);
          const newStream = new MediaStream(localUserStream.getTracks());
          setLocalUserStream(newStream);
          peerManagerRef.current?.setLocalUserStream(newStream);
        }
      } catch (err) {
        console.warn('Failed to switch camera device:', err);
      }
    }
  };

  // Start Screen Sharing
  const handleStartScreenShare = async (surface: 'monitor' | 'window') => {
    try {
      const { stream, surfaceType, hasAudio } = await MediaCaptureService.captureDisplayMedia(surface);
      setLocalScreenStream(stream);
      peerManagerRef.current?.setLocalScreenStream(stream);

      stream.getVideoTracks()[0].onended = () => {
        handleStopScreenShare();
      };

      setSelf((prev) => ({
        ...prev,
        isScreenSharing: true,
        screenSourceType: surfaceType,
        hasScreenAudio: hasAudio,
      }));

      signalingRef.current?.updateState({
        isScreenSharing: true,
        screenSourceType: surfaceType,
        hasScreenAudio: hasAudio,
      });
    } catch (err) {
      console.warn('Screen share canceled or denied by user:', err);
    }
  };

  // Stop Screen Sharing
  const handleStopScreenShare = () => {
    MediaCaptureService.stopStream(localScreenStream);
    setLocalScreenStream(null);
    peerManagerRef.current?.setLocalScreenStream(null);

    setSelf((prev) => ({
      ...prev,
      isScreenSharing: false,
      screenSourceType: null,
      hasScreenAudio: false,
    }));

    signalingRef.current?.updateState({
      isScreenSharing: false,
      screenSourceType: null,
      hasScreenAudio: false,
    });
  };

  const getVolume = (peerId: string, type: 'voice' | 'screen') => {
    return audioMixerRef.current?.getVolume(peerId, type) ?? 1.0;
  };

  const handleSetVolume = (peerId: string, type: 'voice' | 'screen', volume: number) => {
    audioMixerRef.current?.setVolume(peerId, type, volume);
    setMixerVersion((v) => v + 1);
  };

  const handleUpdateNickname = (newNickname: string) => {
    setSelf((prev) => ({ ...prev, nickname: newNickname }));
    localStorage.setItem('screencord_nick', newNickname);
    signalingRef.current?.updateState({});
  };

  const handleSendMessage = (text: string) => {
    signalingRef.current?.sendChat(text);
  };

  const handleUpdateAudioSettings = async (settings: {
    inputDeviceId: string;
    outputDeviceId: string;
    videoDeviceId: string;
    inputVolume: number;
    outputVolume: number;
    profile: 'isolation' | 'studio' | 'custom';
    autoSensitivity: boolean;
  }) => {
    setSelectedInputId(settings.inputDeviceId);
    setSelectedOutputId(settings.outputDeviceId);
    setSelectedVideoId(settings.videoDeviceId);
    setInputVolume(Math.round(settings.inputVolume * 100));
    setOutputVolume(Math.round(settings.outputVolume * 100));
    setInputProfile(settings.profile);

    try {
      const constraints: MediaTrackConstraints = {
        deviceId: settings.inputDeviceId && settings.inputDeviceId !== 'default'
          ? { exact: settings.inputDeviceId }
          : undefined,
        echoCancellation: settings.profile !== 'studio',
        noiseSuppression: settings.profile !== 'studio',
        autoGainControl: settings.autoSensitivity,
      };

      const newStream = await navigator.mediaDevices.getUserMedia({ audio: constraints });
      const newAudioTrack = newStream.getAudioTracks()[0];

      if (newAudioTrack && localUserStream) {
        const oldAudioTrack = localUserStream.getAudioTracks()[0];
        if (oldAudioTrack) {
          oldAudioTrack.stop();
          localUserStream.removeTrack(oldAudioTrack);
        }
        localUserStream.addTrack(newAudioTrack);
        peerManagerRef.current?.setLocalUserStream(localUserStream);
        audioDetectorRef.current?.start(newAudioTrack);
      }
    } catch (err) {
      console.warn('Failed to switch audio input device:', err);
    }
  };

  const openSettingsTab = (tab: string = 'voice') => {
    setSettingsInitialTab(tab);
    setIsSettingsOpen(true);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#313338]">
      {/* Top Room Header */}
      <RoomHeader
        roomId={roomId}
        participantCount={participants.length + 1}
        onOpenInvite={() => setIsInviteOpen(true)}
      />

      {/* Main Call Stage: Avatars (Voice-only) or 16:9 Video Grid */}
      <div className="bg-[#1e1f22] border-b border-[#232428] shrink-0 flex flex-col items-center justify-center">
        <StreamGrid
          self={self}
          participants={participants}
          localScreenStream={localScreenStream}
          localUserStream={localUserStream}
          remoteStreams={remoteStreams}
          isTheater={isTheater}
          onToggleTheater={() => setIsTheater(!isTheater)}
          getVolume={getVolume}
          onSetVolume={handleSetVolume}
          onTurnOffCamera={handleToggleCamera}
        />

        {/* Floating Call Controls (Below video stage, never obscuring video!) */}
        <ControlBar
          self={self}
          isScreenSharing={self.isScreenSharing}
          onToggleMic={handleToggleMic}
          onToggleDeafen={handleToggleDeafen}
          onToggleCamera={handleToggleCamera}
          onRequestScreenShare={() => setIsScreenModalOpen(true)}
          onStopScreenShare={handleStopScreenShare}
          onDisconnect={onLeaveRoom}
          onOpenSettings={openSettingsTab}
          audioInputs={audioInputs}
          audioOutputs={audioOutputs}
          videoInputs={videoInputs}
          selectedInputId={selectedInputId}
          selectedOutputId={selectedOutputId}
          selectedVideoId={selectedVideoId}
          onSelectInput={setSelectedInputId}
          onSelectOutput={setSelectedOutputId}
          onSelectVideo={handleSelectCamera}
          inputVolume={inputVolume}
          outputVolume={outputVolume}
          onInputVolumeChange={setInputVolume}
          onOutputVolumeChange={setOutputVolume}
          profile={inputProfile}
          onProfileChange={setInputProfile}
        />
      </div>

      {/* Bottom Half: Discord Channel Text Chat */}
      <ChannelChat
        roomId={roomId}
        messages={messages}
        onSendMessage={handleSendMessage}
        selfId={self.id}
      />

      {/* Invite Friends Modal */}
      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        roomId={roomId}
      />

      {/* Screen Selection Modal */}
      <ScreenPickerModal
        isOpen={isScreenModalOpen}
        onClose={() => setIsScreenModalOpen(false)}
        onSelectSource={handleStartScreenShare}
      />

      {/* Voice & Audio Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        self={self}
        initialTab={settingsInitialTab}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateNickname={handleUpdateNickname}
        onUpdateAudioSettings={handleUpdateAudioSettings}
      />
    </div>
  );
};
