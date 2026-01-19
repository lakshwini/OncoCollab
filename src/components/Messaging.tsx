import { useState } from 'react';
import { Search, Send, Paperclip, MoreVertical } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';

export function Messaging() {
  const [selectedConversation, setSelectedConversation] = useState('1');
  const [message, setMessage] = useState('');

  const conversations = [
    {
      id: '1',
      name: 'Dr. Laurent Martin',
      role: 'Radiologue',
      lastMessage: 'Les images du scanner sont prêtes',
      time: '10:30',
      unread: 2,
      online: true,
    },
    {
      id: '2',
      name: 'Dr. Sophie Chen',
      role: 'Gastro-entérologue',
      lastMessage: 'Merci pour le compte-rendu',
      time: 'Hier',
      unread: 0,
      online: false,
    },
    {
      id: '3',
      name: 'Équipe RCP Thoracique',
      role: 'Groupe',
      lastMessage: 'Dr. Dubois: Rendez-vous à 10h demain',
      time: 'Hier',
      unread: 0,
      online: false,
    },
  ];

  const messages = [
    {
      id: '1',
      sender: 'Dr. Laurent Martin',
      content: 'Bonjour, j\'ai terminé l\'analyse du scanner',
      time: '10:15',
      isMe: false,
    },
    {
      id: '2',
      sender: 'Moi',
      content: 'Parfait, pouvez-vous me partager les images ?',
      time: '10:20',
      isMe: true,
    },
    {
      id: '3',
      sender: 'Dr. Laurent Martin',
      content: 'Les images du scanner sont prêtes',
      time: '10:30',
      isMe: false,
    },
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle send message
      setMessage('');
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input placeholder="Rechercher..." className="pl-10" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedConversation === conversation.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => setSelectedConversation(conversation.id)}
            >
              <div className="flex gap-3">
                <div className="relative">
                  <Avatar>
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {conversation.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-gray-900 truncate">{conversation.name}</h4>
                    <span className="text-xs text-gray-500">{conversation.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                    {conversation.unread > 0 && (
                      <Badge className="ml-2 bg-blue-600">{conversation.unread}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{conversation.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-blue-100 text-blue-700">
                LM
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-gray-900">Dr. Laurent Martin</h3>
              <p className="text-sm text-gray-600">Radiologue • En ligne</p>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-md ${msg.isMe ? 'order-2' : 'order-1'}`}>
                {!msg.isMe && (
                  <p className="text-sm text-gray-600 mb-1">{msg.sender}</p>
                )}
                <div
                  className={`rounded-lg px-4 py-3 ${
                    msg.isMe
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <Paperclip className="w-5 h-5" />
            </Button>
            <Input
              placeholder="Votre message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSendMessage}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
