import React from 'react';
import { Participant, RemoteStream } from '../types.js';
import { StreamTile } from './StreamTile.js';
import { UserTile } from './UserTile.js';

interface StreamGridProps {
  self: Participant;
  participants: Participant[];
  localScreenStream: MediaStream | null;
  localUserStream: MediaStream | null;
  remoteStreams: RemoteStream[];
  isTheater: boolean;
  onToggleTheater: () => void;
  getVolume: (peerId: string, type: 'voice' | 'screen') => number;
  onSetVolume: (peerId: string, type: 'voice' | 'screen', volume: number) => void;
  onTurnOffCamera?: () => void;
}

export const StreamGrid: React.FC<StreamGridProps> = ({
  self,
  participants,
  localScreenStream,
  localUserStream,
  remoteStreams,
  isTheater,
  onToggleTheater,
  getVolume,
  onSetVolume,
  onTurnOffCamera,
}) => {
  const allParticipants = [self, ...participants];

  // 1. Gather all active screen shares
  const activeScreens: {
    stream: MediaStream;
    presenterName: string;
    peerId: string;
    isSelf: boolean;
    surfaceType: 'monitor' | 'window';
    hasAudio: boolean;
  }[] = [];

  if (localScreenStream) {
    activeScreens.push({
      stream: localScreenStream,
      presenterName: self.nickname,
      peerId: self.id,
      isSelf: true,
      surfaceType: self.screenSourceType || 'monitor',
      hasAudio: self.hasScreenAudio,
    });
  }

  for (const remote of remoteStreams) {
    if (remote.type === 'screen') {
      const p = participants.find((item) => item.id === remote.peerId);
      activeScreens.push({
        stream: remote.stream,
        presenterName: p?.nickname || 'Friend',
        peerId: remote.peerId,
        isSelf: false,
        surfaceType: p?.screenSourceType || 'monitor',
        hasAudio: remote.hasAudio,
      });
    }
  }

  // 2. Gather active camera video tiles
  const cameraUsers: {
    participant: Participant;
    videoTrack: MediaStreamTrack | null;
    isSelf: boolean;
  }[] = [];

  for (const p of allParticipants) {
    const isSelf = p.id === self.id;
    let videoTrack: MediaStreamTrack | null = null;
    if (isSelf) {
      videoTrack = localUserStream?.getVideoTracks()[0] || null;
    } else {
      const camStream = remoteStreams.find((s) => s.peerId === p.id && s.type === 'camera');
      videoTrack = camStream?.stream.getVideoTracks()[0] || null;
    }

    if (p.isCameraOn && videoTrack) {
      cameraUsers.push({ participant: p, videoTrack, isSelf });
    }
  }

  const hasAnyVideo = activeScreens.length > 0 || cameraUsers.length > 0;

  // Case A: Voice-only Call (Matches Discord Image 3 exactly)
  if (!hasAnyVideo) {
    return (
      <div className="w-full py-10 px-6 flex flex-col items-center justify-center min-h-[180px]">
        <div className="flex flex-wrap items-center justify-center gap-8 max-w-4xl">
          {allParticipants.map((p) => (
            <UserTile
              key={p.id}
              participant={p}
              isSelf={p.id === self.id}
              volume={getVolume(p.id, 'voice')}
              onVolumeChange={(vol) => onSetVolume(p.id, 'voice', vol)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Case B: Video / Screen Sharing Call (Matches Discord Image 4 & 1)
  // Total video cards (screens + cameras)
  const totalVideoCards = activeScreens.length + cameraUsers.length;
  const gridColsClass =
    totalVideoCards === 1
      ? 'max-w-4xl grid-cols-1'
      : totalVideoCards === 2
      ? 'max-w-6xl grid-cols-1 md:grid-cols-2'
      : 'max-w-6xl grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  // Participants who do NOT have active camera
  const voiceOnlyUsers = allParticipants.filter((p) => !cameraUsers.some((c) => c.participant.id === p.id));

  return (
    <div className="w-full px-6 py-4 flex flex-col items-center gap-4">
      {/* 16:9 Responsive Video Grid (Side-by-side, no vertical scroll) */}
      <div className={`w-full grid ${gridColsClass} gap-4 justify-center items-center`}>
        {/* Render Screen Shares */}
        {activeScreens.map((sc, idx) => (
          <div key={`screen-${idx}`} className="w-full flex justify-center">
            <StreamTile
              stream={sc.stream}
              presenterName={sc.presenterName}
              surfaceType={sc.surfaceType}
              hasAudio={sc.hasAudio}
              isSelf={sc.isSelf}
              isTheater={isTheater}
              streamVolume={getVolume(sc.peerId, 'screen')}
              onToggleTheater={onToggleTheater}
              onVolumeChange={(vol) => onSetVolume(sc.peerId, 'screen', vol)}
            />
          </div>
        ))}

        {/* Render Camera Streams */}
        {cameraUsers.map((cu) => (
          <div key={`cam-${cu.participant.id}`} className="w-full flex justify-center">
            <UserTile
              participant={cu.participant}
              isSelf={cu.isSelf}
              videoTrack={cu.videoTrack}
              volume={getVolume(cu.participant.id, 'voice')}
              onVolumeChange={(vol) => onSetVolume(cu.participant.id, 'voice', vol)}
              onTurnOffCamera={onTurnOffCamera}
            />
          </div>
        ))}
      </div>

      {/* Voice-only Participants Strip (if any) */}
      {voiceOnlyUsers.length > 0 && (
        <div className="flex items-center gap-4 bg-[#2b2d31]/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5">
          {voiceOnlyUsers.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full bg-[#5865f2] flex items-center justify-center text-xs font-bold text-white uppercase ${
                  p.isSpeaking ? 'ring-2 ring-[#23a55a]' : ''
                }`}
              >
                {p.nickname.slice(0, 2)}
              </div>
              <span className="text-xs text-[#dbdee1] font-medium">{p.nickname}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
