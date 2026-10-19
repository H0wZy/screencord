import React, { useState, useEffect, useRef } from 'react';
import { Participant, RemoteStream, ServerMessage } from '../types.js';
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
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTheater, setIsTheater] = useState(false);
  const [, setMixerVersion] = useState(0);

  const signalingRef = useRef<SignalingClient | null>(null);
  const peerManagerRef = useRef<PeerManager | null>(null);
  const audioDetectorRef = useRef<AudioDetector | null>(null);
  const audioMixerRef = useRef<AudioMixer | null>(null);

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
      console.log(`[ChannelView] Remote track from ${peerId}, kind=${track.kind}, isScreen=${isScreen}`);
      
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

          // Initiate WebRTC call with existing peers in the room
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
          break;
        }

        case 'user-left': {
          peerManager.closePeer(msg.payload.peerId);
          setParticipants((prev) => prev.filter((p) => p.id !== msg.payload.peerId));
          setRemoteStreams((prev) => prev.filter((s) => s.peerId !== msg.payload.peerId));
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
      }
    });

    // 6. Request microphone permission by default on join
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
        const camStream = await MediaCaptureService.captureUserMedia({ video: true, audio: false });
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
    // Notify room peers
    signalingRef.current?.updateState({});
  };

  const handleUpdateAudioSettings = async (settings: {
    inputDeviceId: string;
    outputDeviceId: string;
    inputVolume: number;
    outputVolume: number;
    profile: 'isolation' | 'studio' | 'custom';
    autoSensitivity: boolean;
  }) => {
    console.log('[ChannelView] Applying audio settings:', settings);
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

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#1e1f22]">
      {/* Top Room Header */}
      <RoomHeader roomId={roomId} participantCount={participants.length + 1} />

      {/* Main Content Area: Streams & Video Grid */}
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
      />

      {/* Bottom Control Bar */}
      <ControlBar
        self={self}
        isScreenSharing={self.isScreenSharing}
        onToggleMic={handleToggleMic}
        onToggleDeafen={handleToggleDeafen}
        onToggleCamera={handleToggleCamera}
        onRequestScreenShare={() => setIsScreenModalOpen(true)}
        onStopScreenShare={handleStopScreenShare}
        onDisconnect={onLeaveRoom}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Screen Selection Modal */}
      <ScreenPickerModal
        isOpen={isScreenModalOpen}
        onClose={() => setIsScreenModalOpen(false)}
        onSelectSource={handleStartScreenShare}
      />

      {/* Discord-style Voice & Audio Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        self={self}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateNickname={handleUpdateNickname}
        onUpdateAudioSettings={handleUpdateAudioSettings}
      />
    </div>
  );
};
