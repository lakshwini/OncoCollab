import { useState, useEffect } from 'react';
import { Page, UserRole } from '../App';
import {
  CheckCircle2,
  Circle,
  Clock,
  Video,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  AlertCircle,
  Loader2,
  Users,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { useLanguage } from '../i18n';
import {
  prerequisitesService,
  type MyMeetingPrerequisites,
  type MyPrerequisiteItem,
  type ParticipantPrerequisites,
} from '../services/prerequisites.service';

interface Props {
  userRole: UserRole;
  onNavigate: (page: Page) => void;
  onOpenScheduleModal?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusColor(status: MyPrerequisiteItem['status']): string {
  if (status === 'done') return '#22c55e';
  if (status === 'in_progress') return '#f97316';
  return '#ef4444';
}

function StatusIcon({ status }: { status: MyPrerequisiteItem['status'] }) {
  if (status === 'done') return <CheckCircle2 className="w-4 h-4" style={{ color: '#22c55e' }} />;
  if (status === 'in_progress') return <Clock className="w-4 h-4" style={{ color: '#f97316' }} />;
  return <Circle className="w-4 h-4" style={{ color: '#ef4444' }} />;
}

function MeetingStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    scheduled: { label: 'Planifiée', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    live: { label: 'En cours', className: 'bg-green-100 text-green-700 border-green-200' },
    draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-600 border-gray-200' },
    finished: { label: 'Terminée', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    postponed: { label: 'Reportée', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  };
  const { label, className } = map[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' };
  return <Badge className={`text-xs ${className}`}>{label}</Badge>;
}

// ── Composant principal ───────────────────────────────────────────────────────

export function MyPrerequisites({ onNavigate, onOpenScheduleModal }: Props) {
  const { t } = useLanguage();
  const [meetings, setMeetings] = useState<MyMeetingPrerequisites[]>([]);
  const [expandedMeetings, setExpandedMeetings] = useState<Set<string>>(new Set());
  const [adminExpanded, setAdminExpanded] = useState<Set<string>>(new Set());
  const [adminData, setAdminData] = useState<Record<string, ParticipantPrerequisites[]>>({});
  const [adminLoading, setAdminLoading] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await prerequisitesService.getMyPrerequisites();
      setMeetings(data);
      // Ouvrir la première réunion par défaut
      if (data.length > 0) {
        setExpandedMeetings(new Set([data[0].meeting_id]));
      }
    } catch (err: any) {
      setError(err?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const toggleMeeting = (id: string) =>
    setExpandedMeetings((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const handleToggle = async (meetingId: string, item: MyPrerequisiteItem) => {
    const newCompleted = !item.completed;
    const newStatus: MyPrerequisiteItem['status'] = newCompleted ? 'done' : 'pending';

    // Optimistic update
    setMeetings((prev) =>
      prev.map((m) =>
        m.meeting_id !== meetingId
          ? m
          : {
              ...m,
              prerequisites: m.prerequisites.map((p) =>
                p.id === item.id ? { ...p, completed: newCompleted, status: newStatus } : p,
              ),
            },
      ),
    );

    try {
      await prerequisitesService.togglePrerequisiteItem(meetingId, item.id, newCompleted);
    } catch (err: any) {
      // Revert on error
      setMeetings((prev) =>
        prev.map((m) =>
          m.meeting_id !== meetingId
            ? m
            : {
                ...m,
                prerequisites: m.prerequisites.map((p) =>
                  p.id === item.id ? { ...p, completed: item.completed, status: item.status } : p,
                ),
              },
        ),
      );
      setError(err?.message ?? 'Impossible de mettre à jour le prérequis');
    }
  };

  const loadAdminView = async (meetingId: string) => {
    // Toggle collapse if already loaded
    if (adminExpanded.has(meetingId)) {
      setAdminExpanded((prev) => { const s = new Set(prev); s.delete(meetingId); return s; });
      return;
    }

    // Load participants
    setAdminLoading((prev) => new Set(prev).add(meetingId));
    try {
      const participants = await prerequisitesService.getAllParticipantsPrerequisites(meetingId);
      setAdminData((prev) => ({ ...prev, [meetingId]: participants }));
      setAdminExpanded((prev) => new Set(prev).add(meetingId));
    } catch (err: any) {
      setError(err?.message ?? 'Impossible de charger les prérequis des participants');
    } finally {
      setAdminLoading((prev) => { const s = new Set(prev); s.delete(meetingId); return s; });
    }
  };

  // ── Stats globales ──────────────────────────────────────────────────────────

  const totalDone = meetings.reduce(
    (acc, m) => acc + m.prerequisites.filter((p) => p.status === 'done').length,
    0,
  );
  const totalAll = meetings.reduce((acc, m) => acc + m.prerequisites.length, 0);
  const globalPct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Chargement de vos prérequis…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{t.myPrerequisites.title}</h1>
          <p className="text-gray-500 text-sm">{t.myPrerequisites.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onNavigate('reunions')} className="bg-blue-600 hover:bg-blue-700">
            <Video className="w-4 h-4 mr-2" />
            {t.myPrerequisites.viewMeetings}
          </Button>
          {onOpenScheduleModal && (
            <Button onClick={onOpenScheduleModal} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Programmer une RCP
            </Button>
          )}
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
            <Button variant="link" className="ml-2 text-red-600 underline p-0 h-auto" onClick={load}>
              {t.myPrerequisites.retry}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Carte progression globale */}
      <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-gray-800">{t.myPrerequisites.globalProgress}</p>
              <p className="text-sm text-gray-500">
                {totalDone} / {totalAll} {t.myPrerequisites.prerequisitesCompleted}
              </p>
            </div>
            <span className="text-3xl font-bold text-blue-600">{globalPct}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${globalPct}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des réunions */}
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-700">
          {t.myPrerequisites.upcomingMeetings} ({meetings.length})
        </h2>

        {meetings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              {t.myPrerequisites.noMeetings}
            </CardContent>
          </Card>
        ) : (
          meetings.map((meeting) => {
            const isOpen = expandedMeetings.has(meeting.meeting_id);
            const done = meeting.prerequisites.filter((p) => p.status === 'done').length;
            const total = meeting.prerequisites.length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const allDone = total > 0 && done === total;
            const adminOpen = adminExpanded.has(meeting.meeting_id);
            const loadingAdmin = adminLoading.has(meeting.meeting_id);

            return (
              <Card
                key={meeting.meeting_id}
                className={`transition-shadow hover:shadow-md ${allDone ? 'border-green-200' : ''}`}
              >
                {/* Header réunion */}
                <CardHeader
                  className="cursor-pointer select-none pb-3"
                  onClick={() => toggleMeeting(meeting.meeting_id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <CardTitle className="text-base truncate">{meeting.meeting_title}</CardTitle>
                        <MeetingStatusBadge status={meeting.meeting_status} />
                        {meeting.is_admin && (
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                            Admin
                          </Badge>
                        )}
                        {allDone ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                            ✓ Complété
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                            {done}/{total}
                          </Badge>
                        )}
                      </div>

                      {/* Barre de progression */}
                      {total > 0 && (
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                          <div
                            className={`h-1.5 rounded-full transition-all ${allDone ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {isOpen
                      ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />}
                  </div>
                </CardHeader>

                {/* Corps expandable */}
                {isOpen && (
                  <CardContent className="pt-0 space-y-3">

                    {/* Mes prérequis */}
                    {total === 0 ? (
                      <p className="text-sm text-gray-400 italic py-2">
                        Aucun prérequis défini pour cette réunion.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {meeting.prerequisites.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleToggle(meeting.meeting_id, item); }}
                            className="w-full flex items-center gap-3 p-2 rounded-lg text-left transition-opacity hover:opacity-80 active:opacity-60"
                            style={{
                              cursor: 'pointer',
                              backgroundColor:
                                item.status === 'done'
                                  ? 'rgba(34,197,94,0.08)'
                                  : item.status === 'in_progress'
                                  ? 'rgba(249,115,22,0.08)'
                                  : 'rgba(239,68,68,0.06)',
                              border: 'none',
                            }}
                          >
                            <StatusIcon status={item.status} />
                            <span
                              className="text-sm flex-1"
                              style={{ color: statusColor(item.status) }}
                            >
                              {item.label}
                            </span>
                            <span
                              className="text-xs font-medium capitalize"
                              style={{ color: statusColor(item.status) }}
                            >
                              {item.status === 'done'
                                ? 'Fait'
                                : item.status === 'in_progress'
                                ? 'En cours'
                                : 'À faire'}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Bouton admin */}
                    {meeting.is_admin && (
                      <div className="pt-2 border-t border-gray-100">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-purple-700 border-purple-200 hover:bg-purple-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            loadAdminView(meeting.meeting_id);
                          }}
                          disabled={loadingAdmin}
                        >
                          {loadingAdmin ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Users className="w-4 h-4 mr-2" />
                          )}
                          {adminOpen
                            ? 'Masquer les prérequis des participants'
                            : 'Voir les prérequis des participants'}
                          {!loadingAdmin && (
                            adminOpen
                              ? <ChevronUp className="w-4 h-4 ml-auto" />
                              : <ChevronRight className="w-4 h-4 ml-auto" />
                          )}
                        </Button>

                        {/* Vue participants */}
                        {adminOpen && adminData[meeting.meeting_id] && (
                          <div className="mt-3 space-y-2">
                            {adminData[meeting.meeting_id].length === 0 ? (
                              <p className="text-sm text-gray-400 text-center py-2">
                                Aucun participant trouvé.
                              </p>
                            ) : (
                              adminData[meeting.meeting_id].map((participant, pIdx) => {
                                const pDone = participant.prerequisites.filter((x) => x.status === 'done').length;
                                const pTotal = participant.prerequisites.length;
                                const pPct = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;

                                return (
                                  <div
                                    key={pIdx}
                                    className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div>
                                        <p className="text-sm font-medium text-gray-800">
                                          {participant.doctor_name}
                                        </p>
                                        <p className="text-xs text-gray-500">{participant.doctor_email}</p>
                                      </div>
                                      <span className="text-xs text-gray-500">
                                        {pDone}/{pTotal} ({pPct}%)
                                      </span>
                                    </div>

                                    {pTotal === 0 ? (
                                      <p className="text-xs text-gray-400 italic">
                                        Aucun prérequis défini.
                                      </p>
                                    ) : (
                                      <div className="space-y-1">
                                        {participant.prerequisites.map((item, iIdx) => (
                                          <div
                                            key={iIdx}
                                            className="flex items-center gap-2 text-sm"
                                          >
                                            <StatusIcon status={item.status} />
                                            <span style={{ color: statusColor(item.status) }}>
                                              {item.label}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => { e.stopPropagation(); onNavigate('reunions'); }}
                      >
                        {t.myPrerequisites.viewDetails}
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Aide */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900">
            💡 <strong>{t.myPrerequisites.tip} :</strong> {t.myPrerequisites.tipText}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
