import { useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, User } from 'lucide-react';
import { useWebRTC } from '../contexts/WebRTCContext';

/**
 * Composant pour afficher les bulles de participants en temps réel
 * Synchronisé avec WebRTC Context
 */
export function ParticipantBubbles() {
  const { participants, mySocketId, localStream, isMicEnabled, isVideoEnabled } = useWebRTC();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {/* MA BULLE (local) */}
      <LocalParticipantBubble
        stream={localStream}
        isMicEnabled={isMicEnabled}
        isVideoEnabled={isVideoEnabled}
      />

      {/* BULLES PARTICIPANTS DISTANTS */}
      {Array.from(participants.entries()).map(([socketId, participant]) => (
        <RemoteParticipantBubble
          key={socketId}
          participant={participant}
        />
      ))}

      {/* MESSAGE SI SEUL */}
      {participants.size === 0 && (
        <div className="col-span-full text-center text-gray-400 py-8">
          <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">En attente des participants...</p>
        </div>
      )}
    </div>
  );
}

/**
 * Bulle pour le participant local (moi)
 */
function LocalParticipantBubble({
  stream,
  isMicEnabled,
  isVideoEnabled
}: {
  stream: MediaStream | null;
  isMicEnabled: boolean;
  isVideoEnabled: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video shadow-lg border-2 border-blue-500">
      {/* Vidéo locale */}
      {stream && isVideoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover mirror"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
          <User className="w-16 h-16 text-white" />
        </div>
      )}

      {/* Badge "Vous" */}
      <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
        Vous
      </div>

      {/* Icônes statut */}
      <div className="absolute bottom-2 right-2 flex gap-1">
        {!isMicEnabled && (
          <div className="bg-red-600 p-1.5 rounded-full">
            <MicOff className="w-3 h-3 text-white" />
          </div>
        )}
        {!isVideoEnabled && (
          <div className="bg-red-600 p-1.5 rounded-full">
            <VideoOff className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Bulle pour un participant distant
 */
function RemoteParticipantBubble({
  participant
}: {
  participant: {
    socketId: string;
    doctorId?: string;
    name?: string;
    role?: string;
    stream?: MediaStream;
    micEnabled: boolean;
    videoEnabled: boolean;
  };
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  const displayName = participant.name || `Participant ${participant.socketId.slice(0, 6)}`;
  const initials = participant.name
    ? participant.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'DR';

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video shadow-lg border-2 border-gray-700 hover:border-gray-500 transition">
      {/* Vidéo distante */}
      {participant.stream && participant.videoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {initials}
            </div>
            <p className="text-white text-xs">{displayName}</p>
          </div>
        </div>
      )}

      {/* Nom + Rôle */}
      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur">
        <p className="font-medium">{displayName}</p>
        {participant.role && (
          <p className="text-gray-300 text-[10px]">{participant.role}</p>
        )}
      </div>

      {/* Icônes statut */}
      <div className="absolute bottom-2 right-2 flex gap-1">
        {!participant.micEnabled && (
          <div className="bg-red-600 p-1.5 rounded-full">
            <MicOff className="w-3 h-3 text-white" />
          </div>
        )}
        {!participant.videoEnabled && (
          <div className="bg-red-600 p-1.5 rounded-full">
            <VideoOff className="w-3 h-3 text-white" />
          </div>
        )}
        {participant.micEnabled && (
          <div className="bg-green-600 p-1.5 rounded-full">
            <Mic className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
