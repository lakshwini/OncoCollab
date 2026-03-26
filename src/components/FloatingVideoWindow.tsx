import { useState, useRef, useEffect } from 'react';
import { X, Minimize2, Maximize2, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import { Button } from './ui/button';

interface FloatingVideoWindowProps {
  meetingId: string;
  meetingTitle: string;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onClose: () => void;
}

/**
 * Fenêtre vidéo flottante draggable et resizable
 * Reste active même en navigation
 */
export function FloatingVideoWindow({
  meetingId,
  meetingTitle,
  localStream,
  remoteStreams,
  isVideoEnabled,
  isAudioEnabled,
  onToggleVideo,
  onToggleAudio,
  onClose,
}: FloatingVideoWindowProps) {
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 80 });
  const [size, setSize] = useState({ width: 400, height: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const windowRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Afficher les flux vidéo AVEC stabilité
  useEffect(() => {
    if (!localVideoRef.current) return;
    
    if (localStream) {
      localVideoRef.current.srcObject = localStream;
      console.log('[FloatingVideo] ✅ Local stream attaché');
    }
  }, [localStream]);

  useEffect(() => {
    remoteStreams.forEach((stream, socketId) => {
      const videoElement = remoteVideosRef.current.get(socketId);
      if (videoElement && stream) {
        videoElement.srcObject = stream;
        console.log(`[FloatingVideo] ✅ Remote stream ${socketId.slice(0, 6)} attaché`);
      }
    });
  }, [remoteStreams]);

  // Gestion du drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(e.clientX - dragStart.x, window.innerWidth - size.width));
      const newY = Math.max(0, Math.min(e.clientY - dragStart.y, window.innerHeight - size.height));
      setPosition({ x: newX, y: newY });
    } else if (isResizing) {
      const newWidth = Math.max(300, resizeStart.width + (e.clientX - resizeStart.x));
      const newHeight = Math.max(200, resizeStart.height + (e.clientY - resizeStart.y));
      setSize({ width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, position, size]);

  // Gestion du resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    });
  };

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-lg shadow-2xl p-4 cursor-pointer hover:bg-blue-700 transition z-50"
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          <span className="font-medium">{meetingTitle}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={windowRef}
      className="fixed bg-gray-900 rounded-lg shadow-2xl overflow-hidden border border-gray-700 z-50"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Video className="w-4 h-4" />
          <span className="font-medium text-sm truncate">{meetingTitle}</span>
        </div>
        <div className="flex items-center gap-1 no-drag">
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20 h-7 w-7 p-0"
            onClick={() => setIsMinimized(true)}
          >
            <Minimize2 className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20 h-7 w-7 p-0"
            onClick={onClose}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Contenu vidéo */}
      <div className="relative h-full bg-black">
        {/* Vidéo locale (petite, en coin) */}
        <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg z-10">
          {/* Video element always in DOM to preserve srcObject */}
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover mirror"
            style={{ display: localStream && isVideoEnabled ? 'block' : 'none' }}
          />
          {!(localStream && isVideoEnabled) && (
            <div className="w-full h-full flex items-center justify-center text-white">
              <VideoOff className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Vidéos distantes (grille) */}
        <div className="w-full h-full grid gap-2 p-2">
          {Array.from(remoteStreams.entries()).map(([socketId, stream]) => (
            <video
              key={socketId}
              ref={(el) => {
                if (el) remoteVideosRef.current.set(socketId, el);
              }}
              autoPlay
              playsInline
              className="w-full h-full object-cover rounded"
            />
          ))}
          {remoteStreams.size === 0 && (
            <div className="flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">En attente des participants...</p>
              </div>
            </div>
          )}
        </div>

        {/* Contrôles */}
        <div className="absolute bottom-4 left-4 flex gap-2 no-drag">
          <Button
            size="sm"
            variant={isVideoEnabled ? 'default' : 'destructive'}
            onClick={onToggleVideo}
            className="shadow-lg"
          >
            {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            variant={isAudioEnabled ? 'default' : 'destructive'}
            onClick={onToggleAudio}
            className="shadow-lg"
          >
            {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Handle de resize */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize no-drag"
        style={{
          background: 'linear-gradient(135deg, transparent 50%, #3b82f6 50%)',
        }}
        onMouseDown={handleResizeStart}
      />
    </div>
  );
}
