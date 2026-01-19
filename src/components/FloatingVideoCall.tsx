import { useState } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone,
  Maximize2,
  Minimize2,
  Move,
  Users,
  MessageSquare
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';

interface FloatingVideoCallProps {
  meetingTitle?: string;
  participants?: number;
  duration?: string;
  onMaximize?: () => void;
  onClose?: () => void;
}

export function FloatingVideoCall({ 
  meetingTitle = "RCP - Mme. Dupont",
  participants = 4,
  duration = "14:32",
  onMaximize,
  onClose 
}: FloatingVideoCallProps) {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - 320;
      const maxY = window.innerHeight - (isMinimized ? 80 : 240);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add event listeners for dragging
  useState(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  });

  return (
    <div
      className="fixed z-50 transition-all"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '320px' : '320px',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      <div className="bg-[#0f1419] border-2 border-gray-800 rounded-lg shadow-2xl overflow-hidden">
        {/* Header - Draggable */}
        <div
          onMouseDown={handleMouseDown}
          className="bg-gray-900 px-4 py-2 flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-gray-800"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{meetingTitle}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>⏱ {duration}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {participants}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-white"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            {onMaximize && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-400 hover:text-white"
                onClick={onMaximize}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-red-400"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Video Content - Only show when not minimized */}
        {!isMinimized && (
          <>
            {/* Video Display */}
            <div className="relative aspect-video bg-black">
              {videoEnabled ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">VR</span>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-center">
                    <VideoOff className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Caméra désactivée</p>
                  </div>
                </div>
              )}

              {/* Participant thumbnails */}
              <div className="absolute bottom-2 right-2 flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-12 h-12 bg-gray-800 rounded border border-gray-700 flex items-center justify-center"
                  >
                    <Avatar className="w-full h-full">
                      <AvatarFallback className="bg-gray-700 text-white text-xs">
                        D{i}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                ))}
              </div>

              {/* Status badges */}
              <div className="absolute top-2 left-2 flex gap-2">
                <Badge className="bg-red-600 text-white text-xs">
                  REC {duration}
                </Badge>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-gray-900 px-3 py-2 flex items-center justify-center gap-2 border-t border-gray-800">
              <Button
                variant={micEnabled ? 'secondary' : 'destructive'}
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={() => setMicEnabled(!micEnabled)}
              >
                {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </Button>

              <Button
                variant={videoEnabled ? 'secondary' : 'destructive'}
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={() => setVideoEnabled(!videoEnabled)}
              >
                {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </Button>

              <Button
                variant="secondary"
                size="icon"
                className="h-9 w-9 rounded-full"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>

              <Button
                variant="destructive"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={onClose}
              >
                <Phone className="w-4 h-4 rotate-[135deg]" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Drag Indicator */}
      {isDragging && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded whitespace-nowrap">
          <Move className="w-3 h-3 inline mr-1" />
          Déplacer la fenêtre
        </div>
      )}
    </div>
  );
}
