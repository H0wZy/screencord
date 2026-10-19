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
}) => {
  // Combine all participants: self + remote participants
  const allParticipants = [self, ...participants];

  // Active screen shares: local screen share or remote screen shares
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

  const primaryScreen = activeScreens[0] || null;

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
      {/* 1. Theater Mode / Active Screen Share View */}
      {primaryScreen && (
        <div className="w-full flex justify-center">
          <StreamTile
            stream={primaryScreen.stream}
            presenterName={primaryScreen.presenterName}
            surfaceType={primaryScreen.surfaceType}
            hasAudio={primaryScreen.hasAudio}
            isSelf={primaryScreen.isSelf}
            isTheater={isTheater}
            streamVolume={getVolume(primaryScreen.peerId, 'screen')}
            onToggleTheater={onToggleTheater}
            onVolumeChange={(vol) => onSetVolume(primaryScreen.peerId, 'screen', vol)}
          />
        </div>
      )}

      {/* 2. Participant Video / Voice Tiles */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#949ba4] px-1">
          Voice Participants ({allParticipants.length})
        </h3>
        <div className="flex flex-wrap items-center gap-4">
          {allParticipants.map((p) => {
            const isSelf = p.id === self.id;
            let videoTrack: MediaStreamTrack | null = null;

            if (isSelf) {
              videoTrack = localUserStream?.getVideoTracks()[0] || null;
            } else {
              const camStream = remoteStreams.find((s) => s.peerId === p.id && s.type === 'camera');
              videoTrack = camStream?.stream.getVideoTracks()[0] || null;
            }

            return (
              <UserTile
                key={p.id}
                participant={p}
                isSelf={isSelf}
                videoTrack={videoTrack}
                volume={getVolume(p.id, 'voice')}
                onVolumeChange={(vol) => onSetVolume(p.id, 'voice', vol)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
