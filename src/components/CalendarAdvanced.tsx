import { useState } from 'react';
import { Page } from '../App';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface CalendarAdvancedProps {
  onNavigate: (page: Page) => void;
}

export function CalendarAdvanced({ onNavigate }: CalendarAdvancedProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 9, 1)); // October 2024
  const [view, setView] = useState<'Mois' | 'Semaine' | 'Jour'>('Mois');

  const aiSuggestions = [
    { id: '1', date: 'Mercredi 16 Oct. à 10:00', participants: 9, available: 10, description: '9/10 participants disponibles' },
    { id: '2', date: 'Jeudi 17 Oct. à 14:30', participants: 8, available: 10, description: '8/10 participants disponibles' },
    { id: '3', date: 'Vendredi 18 Oct. à 09:00', participants: 10, available: 10, description: '9/10 participants disponibles' },
  ];

  const participants = [
    { id: '1', name: 'Dr. Lefevre', role: 'Oncologue', status: 'Confirmé', avatar: 'DL' },
    { id: '2', name: 'Dr. Martin', role: 'Radiologue', status: 'En attente', avatar: 'DM' },
    { id: '3', name: 'Dr. Bernard', role: 'Pathologiste', status: 'Refusé', avatar: 'DB' },
  ];

  const events = [
    { 
      id: '1',
      date: 3, 
      title: 'RCP - Patient T.D.', 
      time: '09:00', 
      status: 'Confirmé',
      color: 'bg-green-500',
      textColor: 'text-green-700'
    },
    { 
      id: '2',
      date: 9, 
      title: 'RCP - Patient P.M.', 
      time: '14:00', 
      status: 'Annulé',
      color: 'bg-red-500',
      textColor: 'text-red-700'
    },
    { 
      id: '3',
      date: 11, 
      title: 'RCP - Patient J.L.', 
      time: '10:00', 
      status: 'En attente',
      color: 'bg-yellow-600',
      textColor: 'text-yellow-700'
    },
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const days = [];
  // Add empty cells for days before the month starts
  for (let i = 0; i < (startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1); i++) {
    days.push(
      <div key={`empty-${i}`} className="aspect-square p-2 bg-[#1a1f2e]/30"></div>
    );
  }

  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = events.filter(e => e.date === day);

    days.push(
      <div
        key={day}
        className="aspect-square p-2 bg-[#1a1f2e] border border-gray-800 hover:bg-[#252b3b] transition-colors cursor-pointer"
      >
        <div className="flex flex-col h-full">
          <span className="text-sm text-gray-300 mb-1">{day}</span>
          <div className="space-y-1 overflow-hidden">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${event.color}`}></div>
                  <div className="truncate text-white">{event.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1419] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white mb-1">Calendrier des RCP</h1>
          <p className="text-gray-400">Planifiez et gérez les réunions de concertation pluridisciplinaire.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Synchroniser avec Google
          </Button>
          <Button variant="outline" className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Synchroniser avec Outlook
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle RCP
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-2">
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={previousMonth}
                    className="text-white hover:bg-gray-800"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <h2 className="text-white min-w-[200px] text-center capitalize">{monthName}</h2>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={nextMonth}
                    className="text-white hover:bg-gray-800"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>

                <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-auto">
                  <TabsList className="bg-gray-800">
                    <TabsTrigger value="Mois">Mois</TabsTrigger>
                    <TabsTrigger value="Semaine">Semaine</TabsTrigger>
                    <TabsTrigger value="Jour">Jour</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>

            <CardContent>
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-0 mb-2">
                {['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'].map((day) => (
                  <div key={day} className="text-center text-sm text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-0">
                {days}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - AI Suggestions & Participants */}
        <div className="space-y-6">
          {/* AI Planning Assistance */}
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Planification Assistée par IA</CardTitle>
              <CardDescription className="text-gray-400">
                Suggestions de créneaux
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-400">
                Voici les meilleurs moments pour réunir tout le monde :
              </p>
              {aiSuggestions.map((suggestion) => (
                <div 
                  key={suggestion.id}
                  className="p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white text-sm">{suggestion.date}</p>
                      <p className="text-xs text-gray-400 mt-1">{suggestion.description}</p>
                    </div>
                  </div>
                  <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 mt-2">
                    Planifier
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Participants Status */}
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Participants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 bg-blue-600">
                      <AvatarFallback className="bg-blue-600 text-white text-sm">
                        {participant.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white text-sm">{participant.name}</p>
                      <p className="text-xs text-gray-400">{participant.role}</p>
                    </div>
                  </div>
                  <div>
                    {participant.status === 'Confirmé' && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Confirmé
                      </Badge>
                    )}
                    {participant.status === 'En attente' && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        En attente
                      </Badge>
                    )}
                    {participant.status === 'Refusé' && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                        <XCircle className="w-3 h-3 mr-1" />
                        Refusé
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              <Button variant="link" className="w-full text-blue-400 hover:text-blue-300 text-sm">
                Voir tous les participants
              </Button>
            </CardContent>
          </Card>

          {/* Invitations */}
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Invitations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white text-sm">Rappel envoyé</p>
                    <p className="text-xs text-gray-400 mt-1">
                      24h avant - RCP Patient J.L.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
