import { useState } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  Share2, 
  MessageSquare,
  Users,
  Send,
  Paperclip
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';

interface VideoConferenceProps {
  onClose: () => void;
}

export function VideoConference({ onClose }: VideoConferenceProps) {
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [chatMessage, setChatMessage] = useState('');

  const participants = [
    { id: '1', name: 'Dr. Martin', role: 'Radiologue', active: true },
    { id: '2', name: 'Dr. Dubois', role: 'Oncologue', active: true },
    { id: '3', name: 'Dr. Laurent', role: 'Chirurgien', active: false },
  ];

  const chatMessages = [
    { id: '1', user: 'Dr. Martin', message: 'Je partage les images du scanner', time: '10:05' },
    { id: '2', user: 'Dr. Dubois', message: 'Merci, je les vois bien', time: '10:06' },
    { id: '3', user: 'Dr. Laurent', message: 'Pouvez-vous zoomer sur la zone suspecte ?', time: '10:07' },
  ];

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      // Handle send message
      setChatMessage('');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-white mb-1">RCP Oncologie Thoracique</h2>
          <p className="text-sm text-gray-400">11 novembre 2025 • 10:00</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-gray-700">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 p-6 flex flex-col gap-4">
          {/* Main Video */}
          <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white text-2xl">MD</span>
                </div>
                <p className="text-white">Dr. Marie Dubois</p>
                <p className="text-gray-400 text-sm">Oncologue</p>
              </div>
            </div>
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded">
              <p className="text-sm">Vous</p>
            </div>
          </div>

          {/* Participant Thumbnails */}
          <div className="grid grid-cols-3 gap-4 h-32">
            {participants.filter(p => p.id !== '2').map((participant) => (
              <div key={participant.id} className="bg-gray-800 rounded-lg overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <span className="text-white">{participant.name.split(' ')[1][0]}</span>
                    </div>
                    <p className="text-white text-sm">{participant.name}</p>
                  </div>
                </div>
                {participant.active && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Discussion
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900">{msg.user}</span>
                    <span className="text-xs text-gray-500">{msg.time}</span>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Input
                  placeholder="Votre message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button 
                  size="icon" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleSendMessage}
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-center gap-4">
        <Button
          variant={micEnabled ? 'secondary' : 'destructive'}
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={() => setMicEnabled(!micEnabled)}
        >
          {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>

        <Button
          variant={videoEnabled ? 'secondary' : 'destructive'}
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={() => setVideoEnabled(!videoEnabled)}
        >
          {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>

        <Button
          variant="secondary"
          size="icon"
          className="rounded-full w-12 h-12"
        >
          <Share2 className="w-5 h-5" />
        </Button>

        <Button
          variant="secondary"
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={() => setShowChat(!showChat)}
        >
          <MessageSquare className="w-5 h-5" />
        </Button>

        <Button
          variant="secondary"
          size="icon"
          className="rounded-full w-12 h-12"
        >
          <Users className="w-5 h-5" />
        </Button>

        <Button
          variant="destructive"
          size="icon"
          className="rounded-full w-12 h-12 ml-4"
          onClick={onClose}
        >
          <Phone className="w-5 h-5 rotate-[135deg]" />
        </Button>
      </div>
    </div>
  );
}
