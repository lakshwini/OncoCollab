import { useState } from 'react';
import { Page } from '../App';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { useLanguage } from '../i18n';

interface CalendarAdvancedProps {
  onNavigate: (page: Page) => void;
}

export function CalendarAdvanced({ onNavigate }: CalendarAdvancedProps) {
  const { language, t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date(2024, 9, 1)); // October 2024
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const aiSuggestions = [
    { id: '1', date: language === 'fr' ? 'Mercredi 16 Oct. à 10:00' : 'Wednesday Oct 16 at 10:00', participants: 9, available: 10 },
    { id: '2', date: language === 'fr' ? 'Jeudi 17 Oct. à 14:30' : 'Thursday Oct 17 at 2:30 PM', participants: 8, available: 10 },
    { id: '3', date: language === 'fr' ? 'Vendredi 18 Oct. à 09:00' : 'Friday Oct 18 at 9:00 AM', participants: 10, available: 10 },
  ];

  const participants = [
    { id: '1', name: 'Dr. Lefevre', role: language === 'fr' ? 'Oncologue' : 'Oncologist', statusKey: 'confirmed', avatar: 'DL' },
    { id: '2', name: 'Dr. Martin', role: language === 'fr' ? 'Radiologue' : 'Radiologist', statusKey: 'pending', avatar: 'DM' },
    { id: '3', name: 'Dr. Bernard', role: language === 'fr' ? 'Pathologiste' : 'Pathologist', statusKey: 'refused', avatar: 'DB' },
  ];

  const events = [
    {
      id: '1',
      date: 3,
      title: 'RCP - Patient T.D.',
      time: '09:00',
      statusKey: 'confirmed',
      color: 'bg-green-500',
    },
    {
      id: '2',
      date: 9,
      title: 'RCP - Patient P.M.',
      time: '14:00',
      statusKey: 'cancelled',
      color: 'bg-red-500',
    },
    {
      id: '3',
      date: 11,
      title: 'RCP - Patient J.L.',
      time: '10:00',
      statusKey: 'pending',
      color: 'bg-yellow-600',
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

  const monthName = currentDate.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' });

  const weekDays = language === 'fr'
    ? [t.calendar.days.sun, t.calendar.days.mon, t.calendar.days.tue, t.calendar.days.wed, t.calendar.days.thu, t.calendar.days.fri, t.calendar.days.sat]
    : [t.calendar.days.sun, t.calendar.days.mon, t.calendar.days.tue, t.calendar.days.wed, t.calendar.days.thu, t.calendar.days.fri, t.calendar.days.sat];

  const days = [];
  for (let i = 0; i < (startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1); i++) {
    days.push(
      <div key={`empty-${i}`} className="aspect-square p-2 bg-[#1a1f2e]/30"></div>
    );
  }

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

  const getStatusLabel = (statusKey: string) => {
    const statusMap: Record<string, string> = {
      confirmed: t.statuses.confirmed,
      pending: t.statuses.pending,
      refused: t.statuses.refused,
    };
    return statusMap[statusKey] || statusKey;
  };

  return (
    <div className="min-h-screen bg-[#0f1419] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white mb-1">{t.calendar.title}</h1>
          <p className="text-gray-400">{t.calendar.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
            <CalendarIcon className="w-4 h-4 mr-2" />
            {t.calendar.syncGoogle}
          </Button>
          <Button variant="outline" className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
            <CalendarIcon className="w-4 h-4 mr-2" />
            {t.calendar.syncOutlook}
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            {t.calendar.newRCP}
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
                    <TabsTrigger value="month">{t.calendar.month}</TabsTrigger>
                    <TabsTrigger value="week">{t.calendar.week}</TabsTrigger>
                    <TabsTrigger value="day">{t.calendar.day}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>

            <CardContent>
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-0 mb-2">
                {weekDays.map((day) => (
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Planning Assistance */}
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">{t.calendar.aiPlanning}</CardTitle>
              <CardDescription className="text-gray-400">
                {t.calendar.slotSuggestions}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-400">
                {t.calendar.bestMomentsIntro}
              </p>
              {aiSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white text-sm">{suggestion.date}</p>
                      <p className="text-xs text-gray-400 mt-1">{suggestion.participants}/{suggestion.available} {t.calendar.participantsAvailable}</p>
                    </div>
                  </div>
                  <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 mt-2">
                    {t.common.plan}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Participants Status */}
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">{t.calendar.participants}</CardTitle>
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
                    {participant.statusKey === 'confirmed' && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {getStatusLabel(participant.statusKey)}
                      </Badge>
                    )}
                    {participant.statusKey === 'pending' && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {getStatusLabel(participant.statusKey)}
                      </Badge>
                    )}
                    {participant.statusKey === 'refused' && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                        <XCircle className="w-3 h-3 mr-1" />
                        {getStatusLabel(participant.statusKey)}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              <Button variant="link" className="w-full text-blue-400 hover:text-blue-300 text-sm">
                {t.calendar.viewAllParticipants}
              </Button>
            </CardContent>
          </Card>

          {/* Invitations */}
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">{t.calendar.invitations}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white text-sm">{t.calendar.reminderSent}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      24h {t.calendar.beforeRCP}
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
