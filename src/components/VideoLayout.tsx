import { useEffect, useMemo, useRef } from 'react';
import { MicOff, VideoOff } from 'lucide-react';
import { useWebRTC } from '../contexts/WebRTCContext';

interface VideoLayoutProps {
  mode?: 'grid' | 'mini';
  highlightActive?: boolean;
  className?: string;
}

interface VideoTileProps {
  stream?: MediaStream;
  name: string;
  isLocal?: boolean;
  micEnabled?: boolean;
  videoEnabled?: boolean;
  isActive?: boolean;
  className?: string;
}

function VideoTile({
  stream,
  name,
  isLocal,
  micEnabled,
  videoEnabled,
  isActive,
  className,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-gray-900 ${isActive ? 'ring-2 ring-blue-500' : ''} ${className || ''}`}
    >
      {stream && videoEnabled !== false ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <VideoOff className="h-8 w-8 text-gray-500" />
        </div>
      )}

      <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
        <span>{name}</span>
        {micEnabled === false && <MicOff className="h-3 w-3 text-red-400" />}
      </div>
    </div>
  );
}

export function VideoLayout({ mode = 'grid', highlightActive = true, className }: VideoLayoutProps) {
  const { participants, mySocketId, activeSpeakerId } = useWebRTC();

  const tiles = useMemo(() => {
    const entries = Array.from(participants.entries());
    return entries.map(([id, participant]) => ({
      id,
      name: participant.name || 'Participant',
      stream: participant.stream,
      micEnabled: participant.micEnabled,
      videoEnabled: participant.videoEnabled,
      isLocal: id === mySocketId,
    }));
  }, [participants, mySocketId]);

  if (tiles.length === 0) {
    return (
      <div className={`flex h-full w-full items-center justify-center text-gray-400 ${className || ''}`}>
        En attente des participants...
      </div>
    );
  }

  if (mode === 'mini') {
    const localTile = tiles.find((tile) => tile.isLocal) || tiles[0];
    return (
      <VideoTile
        stream={localTile.stream}
        name={localTile.name}
        isLocal={localTile.isLocal}
        micEnabled={localTile.micEnabled}
        videoEnabled={localTile.videoEnabled}
        isActive={false}
        className={className}
      />
    );
  }

  const activeId = highlightActive ? activeSpeakerId : null;
  const activeTile = activeId ? tiles.find((tile) => tile.id === activeId) : tiles[0];
  const rest = activeTile ? tiles.filter((tile) => tile.id !== activeTile.id) : tiles.slice(1);

  return (
    <div className={`flex h-full w-full flex-col gap-3 ${className || ''}`}>
      {activeTile && (
        <VideoTile
          stream={activeTile.stream}
          name={activeTile.name}
          isLocal={activeTile.isLocal}
          micEnabled={activeTile.micEnabled}
          videoEnabled={activeTile.videoEnabled}
          isActive={highlightActive}
          className="h-3/5"
        />
      )}
      <div className="grid flex-1 grid-cols-2 gap-3">
        {rest.map((tile) => (
          <VideoTile
            key={tile.id}
            stream={tile.stream}
            name={tile.name}
            isLocal={tile.isLocal}
            micEnabled={tile.micEnabled}
            videoEnabled={tile.videoEnabled}
            isActive={false}
          />
        ))}
      </div>
    </div>
  );
}
