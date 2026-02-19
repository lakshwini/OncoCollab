import { Page, User } from '../App';
import { Calendar, Users, Video, Plus, Clock, MapPin, Info, Trash2, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { MeetingPreparationStatus } from './MeetingPreparationStatus';
import { useLanguage } from '../i18n';
import { useState, useEffect } from 'react';
import { fetchMeetings, fetchMeetingsStats, fetchMeetingDetails, deleteMeeting, rescheduleMeeting, Meeting as ApiMeeting, MeetingStats, MeetingDetails } from '../services/meetings.service';
import { MeetingDetailsModal } from './MeetingDetailsModal';
import { ScheduleRCPModal } from './ScheduleRCPModal';
import { toast } from 'sonner';

interface RCPMeetingsProps {
  onNavigate: (page: Page) => void;
  onNavigateToPrerequisites: (meetingInfo: { meetingId?: string; title: string; date: string; time: string; roomId?: string; patientName?: string }) => void;
  onNavigateToVideo?: (meetingInfo: { title: string; roomId: string; patientName?: string }) => void;
  currentUser?: User;
  authToken?: string | null;
}

export function RCPMeetings({ onNavigate, onNavigateToPrerequisites, onNavigateToVideo, currentUser, authToken }: RCPMeetingsProps) {
  const { language, t } = useLanguage();
  const [meetings, setMeetings] = useState<ApiMeeting[]>([]);
  const [stats, setStats] = useState<MeetingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State pour le modal de détails
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedMeetingDetails, setSelectedMeetingDetails] = useState<MeetingDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // State pour le modal de création
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // State pour la confirmation de suppression
  const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(null);

  // State pour le modal de reprogrammation
  const [reschedulingMeeting, setReschedulingMeeting] = useState<{ id: string; title: string } | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Fonction pour charger et afficher les détails d'une réunion
  const handleOpenDetails = async (meetingId: string) => {
    setIsDetailsModalOpen(true);
    setIsLoadingDetails(true);
    setSelectedMeetingDetails(null);

    try {
      const details = await fetchMeetingDetails(meetingId, authToken || null);
      console.log('[RCPMeetings] Détails de la réunion chargés:', details);
      setSelectedMeetingDetails(details);
    } catch (err: any) {
      console.error('[RCPMeetings] Erreur lors du chargement des détails:', err);
      // On garde le modal ouvert pour afficher l'erreur
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Fonction pour recharger les réunions après création
  const handleMeetingCreated = async () => {
    await loadData();
  };

  // Fonction pour supprimer une réunion
  const handleDeleteMeeting = async (meetingId: string) => {
    try {
      await deleteMeeting(meetingId, authToken || null);
      toast.success(language === 'fr' ? 'Réunion supprimée avec succès' : 'Meeting deleted successfully');
      setDeletingMeetingId(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || (language === 'fr' ? 'Erreur lors de la suppression' : 'Error deleting meeting'));
    }
  };

  // Fonction pour reprogrammer une réunion
  const handleRescheduleMeeting = async () => {
    if (!reschedulingMeeting || !rescheduleDate || !rescheduleTime || isRescheduling) return;

    setIsRescheduling(true);
    try {
      const startTime = new Date(`${rescheduleDate}T${rescheduleTime}`).toISOString();
      await rescheduleMeeting(
        reschedulingMeeting.id,
        { startTime, postponedReason: language === 'fr' ? 'Reprogrammée' : 'Rescheduled' },
        authToken || null,
      );
      toast.success(language === 'fr' ? 'Réunion reprogrammée avec succès' : 'Meeting rescheduled successfully');
      setReschedulingMeeting(null);
      setRescheduleDate('');
      setRescheduleTime('');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || (language === 'fr' ? 'Erreur lors de la reprogrammation' : 'Error rescheduling meeting'));
    } finally {
      setIsRescheduling(false);
    }
  };

  // Vérifier si l'utilisateur est organizer/co_admin pour une réunion
  const isAdminForMeeting = (meeting: ApiMeeting): boolean => {
    if (!currentUser) return false;
    const participant = meeting.participants?.find(p => p.doctorId === currentUser.id);
    return participant?.meetingRole === 'organizer' || participant?.meetingRole === 'co_admin';
  };

  // Fonction pour charger les données
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('[RCPMeetings] Chargement des données depuis l\'API...');

      // CRITICAL FIX: Pass currentUser.id to filter meetings only where user is participant
      const currentUserId = currentUser?.id;
      if (!currentUserId) {
        setError('Utilisateur non authentifié');
        console.error('[RCPMeetings] currentUser.id manquant!');
        setIsLoading(false);
        return;
      }

      // Charger les réunions et les stats en parallèle
      // IMPORTANT: fetchMeetings with doctorId filters to ONLY meetings where user participates
      const [meetingsData, statsData] = await Promise.all([
        fetchMeetings(authToken || null, currentUserId),
        fetchMeetingsStats(authToken || null),
      ]);

      console.log('[RCPMeetings] Réunions chargées pour docteur', currentUserId, ':', meetingsData.length, meetingsData);
      console.log('[RCPMeetings] Statistiques chargées:', statsData);

      setMeetings(meetingsData);
      setStats(statsData);
    } catch (err: any) {
      console.error('[RCPMeetings] Erreur lors du chargement des données:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les réunions et statistiques depuis l'API au montage du composant
  useEffect(() => {
    loadData();
  }, [authToken, currentUser?.id]);

  // Transformer les données API en format attendu par le composant
  const transformMeetingData = (apiMeeting: ApiMeeting) => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);

    const startTime = apiMeeting.startTime ? new Date(apiMeeting.startTime) : defaultDate;

    const duration = apiMeeting.startTime && apiMeeting.endTime
      ? `${Math.round((new Date(apiMeeting.endTime).getTime() - new Date(apiMeeting.startTime).getTime()) / (60 * 60 * 1000))}h`
      : '2h';

    // Récupérer le premier patient (pour l'affichage principal)
    const firstPatient = apiMeeting.patients && apiMeeting.patients.length > 0
      ? apiMeeting.patients[0]
      : null;

    const patientName = firstPatient
      ? `${firstPatient.patientName} (${firstPatient.patientNumber})`
      : 'Patient non spécifié';

    return {
      id: apiMeeting.id,
      title: apiMeeting.title,
      roomId: apiMeeting.id,
      patientName,
      date: startTime.toISOString().split('T')[0],
      time: startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      duration,
      location: 'Salle visio',
      participants: apiMeeting.participants.map(p => ({
        name: p.doctorName,
        role: p.speciality,
      })),
      participantsPreparation: apiMeeting.participants.map(p => ({
        id: p.doctorId,
        name: p.doctorName,
        role: p.speciality,
        initials: p.doctorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        prerequisites: [],
      })),
      status: apiMeeting.status === 'finished' ? 'completed' : 'upcoming',
      patientCount: apiMeeting.patientCount || apiMeeting.patients?.length || 0,
    };
  };

  // Séparer les réunions à venir et passées
  const upcomingMeetings = meetings
    .filter(m => m.status !== 'finished' && m.status !== 'postponed')
    .map(transformMeetingData);

  const pastMeetings = meetings
    .filter(m => m.status === 'finished' || m.status === 'postponed')
    .map(m => {
      const transformed = transformMeetingData(m);
      return {
        id: transformed.id,
        title: transformed.title,
        date: transformed.date,
        time: transformed.time,
        participants: m.participantCount,
        patientCount: 1,
        status: m.status,
      };
    });

  // Message de chargement ou d'erreur
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{language === 'fr' ? 'Chargement des réunions...' : 'Loading meetings...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-800 font-medium mb-2">{language === 'fr' ? 'Erreur' : 'Error'}</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-1">{t.meetings.title}</h1>
          <p className="text-gray-600">{t.meetings.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onNavigate('calendrier')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {t.meetings.viewCalendar}
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsScheduleModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t.meetings.planRCP}
          </Button>
        </div>
      </div>

      {/* Upcoming Meetings */}
      <div>
        <h2 className="text-gray-900 mb-4">{t.meetings.upcomingMeetings}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {upcomingMeetings.map((meeting) => (
            <Card key={meeting.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="mb-2">{meeting.title}</CardTitle>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(meeting.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{meeting.time} • {meeting.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{meeting.location}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {meeting.patientCount} {t.common.patients}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Preparation Status */}
                  <div className="pb-4 border-b border-gray-200">
                    <MeetingPreparationStatus
                      participants={meeting.participantsPreparation}
                      compact={true}
                    />
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">{t.calendar.participants} ({meeting.participants.length})</p>
                    <div className="space-y-2">
                      {meeting.participants.map((participant, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs text-gray-700">
                              {participant.name.split(' ')[1]?.[0] || participant.name[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-gray-900">{participant.name}</p>
                            <p className="text-xs text-gray-500">{participant.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleOpenDetails(meeting.id)}
                    >
                      <Info className="w-4 h-4 mr-2" />
                      {t.common.details}
                    </Button>
                    {isAdminForMeeting(meetings.find(m => m.id === meeting.id)!) && (
                      <>
                        <Button
                          variant="outline"
                          className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
                          onClick={() => setReschedulingMeeting({ id: meeting.id, title: meeting.title })}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          {language === 'fr' ? 'Reporter' : 'Reschedule'}
                        </Button>
                        <Button
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => setDeletingMeetingId(meeting.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        if (onNavigateToVideo) {
                          // ✅ CORRECTION: Utiliser meeting.id (UUID PostgreSQL) comme roomId
                          onNavigateToVideo({
                            title: meeting.title,
                            roomId: meeting.id,  // ✅ meeting.id = UUID de PostgreSQL (pas meeting.roomId)
                            patientName: meeting.patientName,
                          });
                        } else {
                          onNavigate('video');
                        }
                      }}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      {t.common.join}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Past Meetings */}
      <div>
        <h2 className="text-gray-900 mb-4">{t.meetings.pastMeetings}</h2>
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {pastMeetings.map((meeting) => (
            <div key={meeting.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-gray-900 mb-1">{meeting.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(meeting.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')} {language === 'fr' ? 'à' : 'at'} {meeting.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{meeting.participants} {t.common.participants}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary">{meeting.patientCount} {t.common.patients}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {meeting.status === 'postponed' && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                      {language === 'fr' ? 'Reportée' : 'Postponed'}
                    </Badge>
                  )}
                  <Button variant="outline" size="sm">
                    {t.meetings.report}
                  </Button>
                  <Button variant="ghost" size="sm">
                    {t.common.details}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t.meetings.thisMonth}</p>
                  <p className="text-gray-900">{stats.thisMonthMeetingsCount} {t.meetings.meetingsCount}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t.meetings.patientsDiscussed}</p>
                  <p className="text-gray-900">{stats.totalPatientsDiscussed} {t.meetings.dossiersCount}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t.meetings.averageDuration}</p>
                  <p className="text-gray-900">{stats.averageDuration}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal des détails de la réunion */}
      <MeetingDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        meetingDetails={selectedMeetingDetails}
        isLoading={isLoadingDetails}
      />

      {/* Modal de création de réunion */}
      <ScheduleRCPModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        currentUserId={currentUser?.id || ''}
        authToken={authToken || null}
        onSuccess={handleMeetingCreated}
      />

      {/* Dialogue de confirmation de suppression */}
      {deletingMeetingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {language === 'fr' ? 'Confirmer la suppression' : 'Confirm deletion'}
            </h3>
            <p className="text-gray-600 mb-6">
              {language === 'fr'
                ? 'Cette action est irréversible. La réunion, ses participants, rôles, messages et prérequis seront supprimés définitivement.'
                : 'This action is irreversible. The meeting, participants, roles, messages and prerequisites will be permanently deleted.'}
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeletingMeetingId(null)}>
                {language === 'fr' ? 'Annuler' : 'Cancel'}
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => handleDeleteMeeting(deletingMeetingId)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {language === 'fr' ? 'Supprimer' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogue de reprogrammation */}
      {reschedulingMeeting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {language === 'fr' ? 'Reprogrammer la réunion' : 'Reschedule meeting'}
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              {language === 'fr'
                ? `L'ancienne réunion "${reschedulingMeeting.title}" sera marquée comme reportée. Une nouvelle réunion sera créée avec les mêmes patients et participants.`
                : `The previous meeting "${reschedulingMeeting.title}" will be marked as postponed. A new meeting will be created with the same patients and participants.`}
            </p>
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'fr' ? 'Nouvelle date' : 'New date'}
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'fr' ? 'Nouvelle heure' : 'New time'}
                </label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" disabled={isRescheduling} onClick={() => { setReschedulingMeeting(null); setRescheduleDate(''); setRescheduleTime(''); }}>
                {language === 'fr' ? 'Annuler' : 'Cancel'}
              </Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={handleRescheduleMeeting}
                disabled={!rescheduleDate || !rescheduleTime || isRescheduling}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRescheduling ? 'animate-spin' : ''}`} />
                {isRescheduling
                  ? (language === 'fr' ? 'Reprogrammation...' : 'Rescheduling...')
                  : (language === 'fr' ? 'Reprogrammer' : 'Reschedule')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}