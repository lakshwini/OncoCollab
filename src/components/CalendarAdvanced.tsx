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
  Users,
  ArrowLeft,
  Calendar,
  Eye,
  FileText,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useLanguage } from '../i18n';
import { ScheduleRCPModal } from './ScheduleRCPModal';
import { PrerequisitesModal } from './PrerequisitesModal';
import { ParticipantsModal } from './ParticipantsModal';
import { fetchMeetings, type Meeting } from '../services/meetings.service';
import type { PrerequisiteFormContext } from './PrerequisiteFormPage';

interface CalendarAdvancedProps {
  onNavigate: (page: Page) => void;
  onNavigateToPrerequisitePreparation?: (meetingId: string, meetingTitle: string) => void;
  onNavigateToPrerequisites?: (meetingInfo: { meetingId?: string; title: string; date: string; time: string; roomId?: string; patientName?: string }) => void;
  onOpenPrerequisiteForm?: (context: PrerequisiteFormContext) => void;
  currentUser?: User;
  authToken?: string | null;
}

interface DayMeeting extends Meeting {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  topPercent: number;
  heightPercent: number;
}

function meetingStatusColor(status: Meeting['status']): string {
  switch (status) {
    case 'live': return 'bg-emerald-500';
    case 'scheduled': return 'bg-blue-500';
    case 'finished': return 'bg-slate-500';
    case 'postponed': return 'bg-orange-500';
    default: return 'bg-gray-500';
  }
}

function ParticipantStatusBadge({ invitationStatus, t }: { invitationStatus: string; t: any }) {
  if (invitationStatus === 'accepted') {
    return (
      <Badge className="bg-emerald-900/40 text-emerald-200 border-emerald-700/60 text-xs">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        {t.statuses.confirmed}
      </Badge>
    );
  }
  if (invitationStatus === 'declined') {
    return (
      <Badge className="bg-red-900/40 text-red-200 border-red-700/60 text-xs">
        <XCircle className="w-3 h-3 mr-1" />
        {t.statuses.refused}
      </Badge>
    );
  }
  return (
    <Badge className="bg-orange-900/40 text-orange-200 border-orange-700/60 text-xs">
      <AlertCircle className="w-3 h-3 mr-1" />
      {t.statuses.pending}
    </Badge>
  );
}

export function CalendarAdvanced({ onNavigate, onNavigateToPrerequisitePreparation, onNavigateToPrerequisites, onOpenPrerequisiteForm, currentUser, authToken }: CalendarAdvancedProps) {
  const { language, t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'day'>('month');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isPrerequisitesModalOpen, setIsPrerequisitesModalOpen] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    loadMeetings();
  }, [authToken]);

  // CRITICAL: Reset selectedMeeting when day changes
  useEffect(() => {
    setSelectedMeeting(null);
  }, [selectedDay]);

  const loadMeetings = async () => {
    if (!authToken) {
      setLoading(false);
      return;
    }
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

  const getDayMeetings = (date: Date): DayMeeting[] => {
    return meetings
      .filter(m => {
        if (!m.startTime) return false;
        const d = new Date(m.startTime);
        return d.getFullYear() === date.getFullYear() &&
               d.getMonth() === date.getMonth() &&
               d.getDate() === date.getDate();
      })
      .map(m => {
        const start = new Date(m.startTime!);
        const end = m.endTime ? new Date(m.endTime) : new Date(start.getTime() + 60 * 60000);

        const startHour = start.getHours();
        const startMinute = start.getMinutes();
        const endHour = end.getHours();
        const endMinute = end.getMinutes();

        const minHour = 8;
        const maxHour = 20;
        const totalMinutes = (maxHour - minHour) * 60;
        const topMinutes = (startHour - minHour) * 60 + startMinute;
        const durationMinutes = (endHour - startHour) * 60 + (endMinute - startMinute);

        return {
          ...m,
          startHour,
          startMinute,
          endHour,
          endMinute,
          topPercent: (topMinutes / totalMinutes) * 100,
          heightPercent: (durationMinutes / totalMinutes) * 100,
        };
      })
      .sort((a, b) => {
        const timeA = new Date(a.startTime!);
        const timeB = new Date(b.startTime!);
        return timeB.getTime() - timeA.getTime();
      });
  };

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

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  };

  const buildMonthView = () => {
    const days: JSX.Element[] = [];

    for (let i = 0; i < (startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1); i++) {
      days.push(<div key={`empty-${i}`} className="bg-transparent" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = calendarEvents.filter(e => e.date === day);
      const dayDate = new Date(year, month, day);
      const today = isToday(dayDate);

      days.push(
        <button
          key={day}
          onClick={() => {
            setSelectedDay(dayDate);
            setView('day');
          }}
          className={`min-h-32 p-3 rounded-xl border-2 transition-all cursor-pointer text-left flex flex-col ${
            today
              ? 'bg-blue-900/30 border-blue-500 shadow-lg shadow-blue-500/30'
              : 'bg-[#1a1f2e] border-gray-700/50 hover:border-blue-500/50 hover:bg-[#202838]'
          }`}
        >
          {/* Day number */}
          <span className={`text-lg font-bold mb-2 ${today ? 'text-blue-300' : 'text-gray-300'}`}>
            {day}
          </span>

          {/* Meetings */}
          <div className="space-y-1.5 flex-1 overflow-hidden">
            {dayEvents.slice(0, 2).map((event) => (
              <div
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMeeting(event.meeting);
                }}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:shadow-md transition-all cursor-pointer truncate"
              >
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span className="font-bold">{event.time}</span>
                </div>
                <div className="text-xs mt-0.5 truncate opacity-95">{event.title}</div>
              </div>
            ))}

            {dayEvents.length > 2 && (
              <div className="text-xs text-blue-300 font-semibold px-2">
                +{dayEvents.length - 2} {language === 'fr' ? 'réunion' : 'meeting'}{dayEvents.length - 2 > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </button>
      );
    }

    return days;
  };

  // Day View
  if (view === 'day' && selectedDay) {
    const dayMeetings = getDayMeetings(selectedDay);
    const dayName = selectedDay.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const previousDay = () => {
      const prev = new Date(selectedDay);
      prev.setDate(prev.getDate() - 1);
      setSelectedDay(prev);
    };

    const nextDay = () => {
      const next = new Date(selectedDay);
      next.setDate(next.getDate() + 1);
      setSelectedDay(next);
    };

    const timeSlots: string[] = [];
    for (let h = 8; h <= 20; h++) {
      timeSlots.push(`${String(h).padStart(2, '0')}:00`);
    }

    return (
      <div className="min-h-screen bg-[#0f1419] flex flex-col">
        {/* Header */}
        <div className="bg-[#1a1f2e] border-b border-gray-700/50 px-8 py-6">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setView('month');
                  setSelectedDay(null);
                }}
                className="text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                {language === 'fr' ? 'Retour' : 'Back'}
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">{language === 'fr' ? 'Agenda du jour' : 'Day Schedule'}</h1>
                <p className="text-gray-400 text-sm mt-1 capitalize">{dayName}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={previousDay} className="border-gray-600 text-gray-300 hover:bg-gray-800">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="sm" onClick={nextDay} className="border-gray-600 text-gray-300 hover:bg-gray-800">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content - 2 Columns */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: Timeline (70%) */}
          <div className="flex-1 bg-[#151b2a] overflow-y-auto">
            <div className="min-h-full">
              <div className="flex h-full">
                {/* Time column */}
                <div className="w-32 border-r border-gray-700/50 bg-[#0f1419] py-8 px-4 flex flex-col flex-shrink-0 sticky left-0 top-0">
                  {timeSlots.map((time) => (
                    <div key={time} className="h-24 flex items-start justify-center text-xs font-bold text-gray-500 pt-2">
                      {time}
                    </div>
                  ))}
                </div>

                {/* Meetings grid */}
                <div className="flex-1 relative p-6">
                  {/* Grid lines */}
                  <div className="absolute inset-0 top-0 left-0 right-0">
                    {timeSlots.map((time, idx) => (
                      <div
                        key={`line-${time}`}
                        className="absolute left-8 right-8 border-t border-gray-800/40"
                        style={{ top: `${(idx / timeSlots.length) * 100}%` }}
                      />
                    ))}
                  </div>

                  {/* Meetings */}
                  <div className="relative h-full">
                    {dayMeetings.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-3" />
                          <p className="text-lg font-semibold text-gray-400">
                            {language === 'fr' ? 'Aucune réunion' : 'No meetings'}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {language === 'fr' ? 'Cette journée est libre' : 'This day is free'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      dayMeetings.map((meeting) => (
                        <button
                          key={meeting.id}
                          onClick={() => setSelectedMeeting(meeting)}
                          className={`absolute left-2 right-2 rounded-lg p-3 text-left shadow-md transition-all cursor-pointer group border-2 ${
                            selectedMeeting?.id === meeting.id
                              ? 'bg-gradient-to-br from-blue-500 to-cyan-600 border-blue-300 shadow-lg shadow-blue-500/50'
                              : 'bg-gradient-to-br from-blue-600 to-cyan-700 border-blue-400/60 hover:border-blue-300 hover:shadow-lg'
                          }`}
                          style={{
                            top: `calc(${meeting.topPercent}% + 2rem)`,
                            height: `${Math.max(meeting.heightPercent, 8)}%`,
                            minHeight: '70px',
                          }}
                        >
                          <div className="flex flex-col h-full justify-between">
                            {/* Time */}
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-blue-100 flex-shrink-0" />
                              <span className="text-xs font-bold text-white leading-tight">
                                {String(meeting.startHour).padStart(2, '0')}:{String(meeting.startMinute).padStart(2, '0')}
                              </span>
                            </div>

                            {/* Title */}
                            <p className="font-bold text-white text-sm group-hover:text-blue-50 transition-colors truncate">
                              {meeting.title}
                            </p>

                            {/* Participants count + avatars */}
                            <div className="flex items-center gap-1.5 text-xs">
                              <div className="flex -space-x-2">
                                {meeting.participants.slice(0, 3).map((p, i) => {
                                  const initials = ((p.doctorName.split(' ')[0]?.[0] ?? '') + (p.doctorName.split(' ')[1]?.[0] ?? '')).toUpperCase();
                                  return (
                                    <div key={i} className="w-5 h-5 bg-blue-400/80 rounded-full border border-blue-300 flex items-center justify-center text-xs font-bold text-white">
                                      {initials.slice(0, 1)}
                                    </div>
                                  );
                                })}
                              </div>
                              <span className="text-blue-50 font-semibold">{meeting.participants.length}</span>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Details Panel (30%) */}
          <div className="w-[400px] bg-[#1a1f2e] border-l border-gray-700/50 flex flex-col overflow-hidden shadow-lg">
            {selectedMeeting ? (
              <>
                {/* Details Header */}
                <div className="bg-gradient-to-r from-blue-600/40 to-cyan-700/40 border-b border-blue-500/30 p-6">
                  <h2 className="text-2xl font-bold text-white mb-1">{selectedMeeting.title}</h2>
                  <p className="text-blue-200 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {selectedMeeting.startTime && new Date(selectedMeeting.startTime).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}
                    {selectedMeeting.endTime && (
                      <> - {new Date(selectedMeeting.endTime).toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</>
                    )}
                  </p>
                </div>

                {/* Details Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Participants */}
                  <div>
                    <p className="text-sm font-bold text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {language === 'fr' ? 'Participants' : 'Participants'} ({selectedMeeting.participants.length})
                    </p>
                    <div className="space-y-2">
                      {selectedMeeting.participants.map((p) => {
                        const initials = ((p.doctorName.split(' ')[0]?.[0] ?? '') + (p.doctorName.split(' ')[1]?.[0] ?? '')).toUpperCase();
                        return (
                          <div key={p.doctorId} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/40 hover:bg-gray-800/60 transition-colors">
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-100 truncate">{p.doctorName}</p>
                              <p className="text-xs text-gray-500 truncate">{p.speciality}</p>
                            </div>
                            <ParticipantStatusBadge invitationStatus={p.invitationStatus} t={t} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t border-gray-700/50 pt-6">
                    <div className="space-y-2.5">
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm justify-start"
                        onClick={() => {
                          console.log('🔵 CLICK: Voir les participants - Meeting:', selectedMeeting?.title);
                          setIsParticipantsModalOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {language === 'fr' ? 'Voir les participants' : 'View participants'}
                      </Button>
                      <Button
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm justify-start"
                        onClick={() => {
                          if (selectedMeeting && onNavigateToPrerequisitePreparation) {
                            onNavigateToPrerequisitePreparation(selectedMeeting.id, selectedMeeting.title);
                          }
                        }}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {language === 'fr' ? 'Préparer les tâches' : 'Prepare tasks'}
                      </Button>
                      <Button
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm justify-start"
                        onClick={() => {
                          setIsPrerequisitesModalOpen(true);
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {language === 'fr' ? 'Voir les prérequis' : 'View prerequisites'}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 font-semibold">
                    {language === 'fr' ? 'Sélectionnez une réunion' : 'Select a meeting'}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    {language === 'fr' ? 'pour voir les détails' : 'to view details'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Month View
  return (
    <div className="min-h-screen bg-[#0f1419] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-1">{t.calendar.title}</h1>
            <p className="text-gray-400">{t.calendar.subtitle}</p>
          </div>
          <Button onClick={() => setIsScheduleModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            <Plus className="w-5 h-5 mr-2" />
            {t.calendar.newRCP}
          </Button>
        </div>

        {/* Calendar Card */}
        <Card className="bg-[#1a1f2e] border border-gray-700/50 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-[#1a1f2e] border-b border-gray-700/50 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={previousMonth} className="text-gray-300 hover:text-white hover:bg-gray-800">
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <h2 className="text-2xl font-bold text-white min-w-[240px] text-center capitalize">{monthName}</h2>
                <Button variant="ghost" size="icon" onClick={nextMonth} className="text-gray-300 hover:text-white hover:bg-gray-800">
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8 bg-[#151b2a]">
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : (
              <>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-3 mb-6">
                  {weekDays.map((day) => (
                    <div key={day} className="text-center text-sm font-bold text-gray-400 py-3">
                      {day.toUpperCase()}
                    </div>
                  ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7 gap-3">
                  {buildMonthView()}
                </div>

                {calendarEvents.length === 0 && !loading && (
                  <p className="text-center text-gray-400 text-sm mt-8">
                    {language === 'fr' ? 'Aucune réunion ce mois-ci.' : 'No meetings this month.'}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ScheduleRCPModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        currentUserId={currentUser?.id || ''}
        currentUserName={currentUser?.name || ''}
        authToken={authToken || null}
        onSuccess={handleMeetingCreated}
      />

      {selectedMeeting && (
        <PrerequisitesModal
          isOpen={isPrerequisitesModalOpen}
          onClose={() => setIsPrerequisitesModalOpen(false)}
          meetingId={selectedMeeting.id}
          meetingTitle={selectedMeeting.title}
          onOpenPrerequisiteForm={onOpenPrerequisiteForm}
          onPrepareClick={() => {
            if (onNavigateToPrerequisitePreparation) {
              onNavigateToPrerequisitePreparation(selectedMeeting.id, selectedMeeting.title);
            }
          }}
        />
      )}

      {selectedMeeting && (
        <ParticipantsModal
          isOpen={isParticipantsModalOpen}
          onClose={() => setIsParticipantsModalOpen(false)}
          meeting={selectedMeeting}
        />
      )}
    </div>
  );
}
