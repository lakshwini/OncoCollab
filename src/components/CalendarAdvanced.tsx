import { useState, useEffect } from 'react';
import { Page, User } from '../App';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { useLanguage } from '../i18n';
import { ScheduleRCPModal } from './ScheduleRCPModal';
import { fetchMeetings, type Meeting } from '../services/meetings.service';

interface CalendarAdvancedProps {
  onNavigate: (page: Page) => void;
  currentUser?: User;
  authToken?: string | null;
}

function meetingStatusColor(status: Meeting['status']): string {
  switch (status) {
    case 'live': return 'bg-green-500';
    case 'scheduled': return 'bg-blue-500';
    case 'finished': return 'bg-slate-500';
    case 'postponed': return 'bg-orange-500';
    default: return 'bg-gray-500';
  }
}

function ParticipantStatusBadge({ invitationStatus, t }: { invitationStatus: string; t: any }) {
  if (invitationStatus === 'accepted') {
    return (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        {t.statuses.confirmed}
      </Badge>
    );
  }
  if (invitationStatus === 'declined') {
    return (
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
        <XCircle className="w-3 h-3 mr-1" />
        {t.statuses.refused}
      </Badge>
    );
  }
  return (
    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
      <AlertCircle className="w-3 h-3 mr-1" />
      {t.statuses.pending}
    </Badge>
  );
}

export function CalendarAdvanced({ onNavigate, currentUser, authToken }: CalendarAdvancedProps) {
  const { language, t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  useEffect(() => {
    loadMeetings();
  }, [authToken]);

  const loadMeetings = async () => {
    if (!authToken) { setLoading(false); return; }
    try {
      setLoading(true);
      const data = await fetchMeetings(authToken);
      setMeetings(data);
    } catch (e) {
      console.error('Error loading meetings for calendar:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleMeetingCreated = () => {
    setIsScheduleModalOpen(false);
    loadMeetings();
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Map meetings of the current month to calendar events
  const calendarEvents = meetings
    .filter(m => {
      if (!m.startTime) return false;
      const d = new Date(m.startTime);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .map(m => {
      const d = new Date(m.startTime!);
      return {
        id: m.id,
        date: d.getDate(),
        title: m.title,
        time: d.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        color: meetingStatusColor(m.status),
        meeting: m,
      };
    });

  const getDaysInMonth = (date: Date) => {
    const y = date.getFullYear();
    const mo = date.getMonth();
    const firstDay = new Date(y, mo, 1);
    const lastDay = new Date(y, mo + 1, 0);
    return {
      daysInMonth: lastDay.getDate(),
      startingDayOfWeek: firstDay.getDay(),
    };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const previousMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const monthName = currentDate.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });

  const weekDays = [
    t.calendar.days.sun, t.calendar.days.mon, t.calendar.days.tue,
    t.calendar.days.wed, t.calendar.days.thu, t.calendar.days.fri, t.calendar.days.sat,
  ];

  const days: JSX.Element[] = [];
  for (let i = 0; i < (startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1); i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square p-2 bg-[#1a1f2e]/30" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = calendarEvents.filter(e => e.date === day);
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
                className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => setSelectedMeeting(event.meeting)}
              >
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${event.color}`} />
                  <div className="truncate text-white">{event.time}</div>
                </div>
                <div className="truncate text-gray-400 mt-0.5 text-[10px]">{event.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>,
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1419] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white mb-1">{t.calendar.title}</h1>
          <p className="text-gray-400">{t.calendar.subtitle}</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsScheduleModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t.calendar.newRCP}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
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
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 gap-0 mb-2">
                    {weekDays.map((day) => (
                      <div key={day} className="text-center text-sm text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Day cells */}
                  <div className="grid grid-cols-7 gap-0">{days}</div>

                  {calendarEvents.length === 0 && !loading && (
                    <p className="text-center text-gray-600 text-sm mt-4 pb-2">
                      {language === 'fr'
                        ? 'Aucune réunion ce mois-ci.'
                        : 'No meetings this month.'}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Selected meeting details */}
          {selectedMeeting ? (
            <Card className="bg-[#1a1f2e] border-gray-800">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-white text-sm leading-snug">
                    {selectedMeeting.title}
                  </CardTitle>
                  <button
                    onClick={() => setSelectedMeeting(null)}
                    className="text-gray-500 hover:text-gray-300 text-xs shrink-0 mt-0.5"
                  >
                    ✕
                  </button>
                </div>
                {selectedMeeting.startTime && (
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {new Date(selectedMeeting.startTime).toLocaleString(
                      language === 'fr' ? 'fr-FR' : 'en-US',
                      { dateStyle: 'medium', timeStyle: 'short' },
                    )}
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-2">
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                  {t.calendar.participants} ({selectedMeeting.participants.length})
                </p>

                {selectedMeeting.participants.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    {language === 'fr' ? 'Aucun participant' : 'No participants'}
                  </p>
                ) : (
                  selectedMeeting.participants.map((p) => {
                    const parts = p.doctorName.split(' ');
                    const initials = (
                      (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
                    ).toUpperCase();
                    return (
                      <div
                        key={p.doctorId}
                        className="flex items-center justify-between p-2 rounded hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-blue-600 text-white text-xs">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white text-xs">{p.doctorName}</p>
                            <p className="text-xs text-gray-400">{p.speciality}</p>
                          </div>
                        </div>
                        <ParticipantStatusBadge invitationStatus={p.invitationStatus} t={t} />
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-[#1a1f2e] border-gray-800">
              <CardContent className="p-6 text-center text-gray-500 text-sm">
                {language === 'fr'
                  ? 'Cliquez sur une réunion pour voir les participants.'
                  : 'Click on a meeting to see participants.'}
              </CardContent>
            </Card>
          )}

          {/* Invitations reminder */}
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">{t.calendar.invitations}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white text-sm">{t.calendar.reminderSent}</p>
                    <p className="text-xs text-gray-400 mt-1">24h {t.calendar.beforeRCP}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ScheduleRCPModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        currentUserId={currentUser?.id || ''}
        authToken={authToken || null}
        onSuccess={handleMeetingCreated}
      />
    </div>
  );
}
