import { useState, useEffect } from 'react';
import { Page, UserRole } from '../App';
import { CheckCircle2, Circle, Video, ChevronDown, ChevronUp, AlertCircle, Loader2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { useLanguage } from '../i18n';
import { prerequisitesService } from '../services/prerequisites.service';
import { MeetingPrerequisites, PrerequisiteItem } from '../types/prerequisites';
import { authService } from '../services/auth.service';

interface MyPrerequisitesProps {
  userRole: UserRole;
  onNavigate: (page: Page) => void;
  onOpenScheduleModal?: () => void;
}

export function MyPrerequisites({ onNavigate, onOpenScheduleModal }: MyPrerequisitesProps) {
  const { t, language } = useLanguage();
  const [meetings, setMeetings] = useState<MeetingPrerequisites[]>([]);
  const [expandedMeetings, setExpandedMeetings] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  // Charger les prérequis au montage du composant
  useEffect(() => {
    loadMyPrerequisites();
  }, []);

  const loadMyPrerequisites = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[MyPrerequisites] Chargement des prérequis...');
      const data = await prerequisitesService.getMyPrerequisites();
      console.log('[MyPrerequisites] Données reçues:', data);
      setMeetings(data);
      // Expand la première réunion par défaut
      if (data.length > 0) {
        setExpandedMeetings(new Set([data[0].meeting_id]));
      }
    } catch (err: any) {
      console.error('[MyPrerequisites] Erreur complète:', err);
      const errorMsg = err?.message || 'Unknown error';
      setError(`${t.myPrerequisites.errorLoading} (${errorMsg})`);
    } finally {
      setLoading(false);
    }
  };

  const toggleMeeting = (meetingId: string) => {
    setExpandedMeetings((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(meetingId)) {
        newSet.delete(meetingId);
      } else {
        newSet.add(meetingId);
      }
      return newSet;
    });
  };

  const togglePrerequisite = async (meetingId: string, item: PrerequisiteItem) => {
    const updateKey = `${meetingId}-${item.key}`;
    if (updatingItems.has(updateKey)) return; // Éviter les doubles clics

    try {
      setUpdatingItems((prev) => new Set(prev).add(updateKey));

      const newStatus = item.status === 'done' ? 'pending' : 'done';

      // Mettre à jour via l'API
      const updatedMeeting = await prerequisitesService.updateMyPrerequisites(meetingId, {
        items: [{ key: item.key, status: newStatus, reference_id: item.reference_id }],
      });

      // Mettre à jour l'état local
      setMeetings((prevMeetings) =>
        prevMeetings.map((m) => (m.meeting_id === meetingId ? updatedMeeting : m))
      );
    } catch (err) {
      console.error('Erreur lors de la mise à jour du prérequis:', err);
      setError(t.myPrerequisites.errorUpdating);
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(updateKey);
        return newSet;
      });
    }
  };

  const getTotalStats = () => {
    let totalCompleted = 0;
    let totalPrerequisites = 0;

    meetings.forEach((meeting) => {
      // Compter les prérequis du médecin connecté
      const user = authService.getCurrentUser();
      const myDoctor = meeting.doctors.find((d) => d.doctor_id === user?.id);
      if (myDoctor) {
        totalCompleted += myDoctor.progress.completed;
        totalPrerequisites += myDoctor.progress.total;
      }
    });

    const percentage = totalPrerequisites > 0 ? (totalCompleted / totalPrerequisites) * 100 : 0;
    return { totalCompleted, totalPrerequisites, percentage };
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de vos prérequis...</p>
        </div>
      </div>
    );
  }

  const totalStats = getTotalStats();
  const user = authService.getCurrentUser();

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-1">{t.myPrerequisites.title}</h1>
          <p className="text-gray-600">{t.myPrerequisites.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => onNavigate('reunions')} className="bg-blue-600 hover:bg-blue-700">
            <Video className="w-4 h-4 mr-2" />
            {t.myPrerequisites.viewMeetings}
          </Button>
          {onOpenScheduleModal && (
            <Button
              onClick={onOpenScheduleModal}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Programmer une RCP
            </Button>
          )}
        </div>
      </div>

      {/* Erreur Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
            <Button
              variant="link"
              className="ml-2 text-red-600 underline"
              onClick={loadMyPrerequisites}
            >
              {t.myPrerequisites.retry}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Global Stats Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-gray-900 mb-1">{t.myPrerequisites.globalProgress}</h3>
              <p className="text-sm text-gray-600">
                {totalStats.totalCompleted} / {totalStats.totalPrerequisites}{' '}
                {t.myPrerequisites.prerequisitesCompleted}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl text-blue-600">{Math.round(totalStats.percentage)}%</p>
            </div>
          </div>
          <Progress value={totalStats.percentage} className="h-3" />
        </CardContent>
      </Card>

      {/* Meetings List */}
      <div className="space-y-4">
        <h2 className="text-gray-900">
          {t.myPrerequisites.upcomingMeetings} ({meetings.length})
        </h2>

        {meetings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">{t.myPrerequisites.noMeetings}</p>
            </CardContent>
          </Card>
        ) : (
          meetings.map((meeting) => {
            const isExpanded = expandedMeetings.has(meeting.meeting_id);
            const myDoctor = meeting.doctors.find((d) => d.doctor_id === user?.id);

            if (!myDoctor) return null; // Ne pas afficher si pas de prérequis pour ce médecin

            const stats = myDoctor.progress;
            const isComplete = stats.completed === stats.total;

            return (
              <Card key={meeting.meeting_id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => toggleMeeting(meeting.meeting_id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle>Réunion #{meeting.meeting_id}</CardTitle>
                        {isComplete ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            ✓ {t.common.ready}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            {stats.completed}/{stats.total} {t.common.completed}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Patient:</span>
                            <span>{meeting.patient_id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Spécialité:</span>
                            <span>{myDoctor.speciality}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Progress value={stats.percentage} className="h-2" />
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent>
                    <div className="space-y-2 pt-2 border-t border-gray-200">
                      {myDoctor.items.map((item) => {
                        const isChecked = item.status === 'done';
                        const updateKey = `${meeting.meeting_id}-${item.key}`;
                        const isUpdating = updatingItems.has(updateKey);
                        
                        // Display label in the correct language
                        const displayLabel = language === 'fr' 
                          ? (item.label_fr || item.label) 
                          : (item.label_en || item.label);

                        return (
                          <div
                            key={item.key}
                            className={`p-3 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                              isChecked
                                ? 'bg-green-50 border-green-200'
                                : 'bg-white border-gray-200 hover:border-blue-300'
                            } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                            onClick={() => !isUpdating && togglePrerequisite(meeting.meeting_id, item)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                {isUpdating ? (
                                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                ) : isChecked ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <span
                                  className={`text-sm ${
                                    isChecked ? 'text-green-900' : 'text-gray-900'
                                  }`}
                                >
                                  {displayLabel}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {item.source === 'orthanc' ? '📷 Imagerie' : '📄 Document'}
                                  </Badge>
                                  {item.reference_id && (
                                    <span className="text-xs text-gray-500">
                                      Réf: {item.reference_id}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          onNavigate('reunions');
                        }}
                      >
                        {t.myPrerequisites.viewDetails}
                      </Button>
                      <Button
                        className={`flex-1 ${
                          isComplete
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          if (isComplete) {
                            onNavigate('video');
                          }
                        }}
                        disabled={!isComplete}
                      >
                        <Video className="w-4 h-4 mr-2" />
                        {isComplete ? t.common.join : t.myPrerequisites.prerequisitesIncomplete}
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900">
            💡 <strong>{t.myPrerequisites.tip}:</strong> {t.myPrerequisites.tipText}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
