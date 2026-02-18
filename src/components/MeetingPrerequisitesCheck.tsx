import { useState, useEffect } from 'react';
import { Page, UserRole } from '../App';
import { CheckCircle2, Circle, Video, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { prerequisitesService } from '../services/prerequisites.service';
import { MeetingPrerequisites, PrerequisiteItem } from '../types/prerequisites';
import { authService } from '../services/auth.service';

interface MeetingPrerequisitesCheckProps {
  onNavigate: (page: Page) => void;
  userRole: UserRole;
  meetingId?: string; // ID de la réunion
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
}

export function MeetingPrerequisitesCheck({
  onNavigate,
  meetingId,
  meetingTitle,
  meetingDate,
  meetingTime,
}: MeetingPrerequisitesCheckProps) {
  const [meetingData, setMeetingData] = useState<MeetingPrerequisites | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  // Charger les prérequis de la réunion
  useEffect(() => {
    loadPrerequisites();
  }, [meetingId]);

  const loadPrerequisites = async () => {
    if (!meetingId) {
      setError('ID de réunion manquant');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await prerequisitesService.getMeetingPrerequisites(meetingId, false);
      setMeetingData(data);
    } catch (err) {
      console.error('Erreur lors du chargement des prérequis:', err);
      setError('Impossible de charger les prérequis. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const togglePrerequisite = async (item: PrerequisiteItem) => {
    if (!meetingData || !meetingId) return;

    const updateKey = item.key;
    if (updatingItems.has(updateKey)) return;

    try {
      setUpdatingItems((prev) => new Set(prev).add(updateKey));

      const newStatus = item.status === 'done' ? 'pending' : 'done';

      const updatedMeeting = await prerequisitesService.updateMyPrerequisites(meetingId, {
        items: [{ key: item.key, status: newStatus, reference_id: item.reference_id }],
      });

      setMeetingData(updatedMeeting);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du prérequis:', err);
      setError('Impossible de mettre à jour le prérequis. Veuillez réessayer.');
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(updateKey);
        return newSet;
      });
    }
  };

  const handleJoinMeeting = async () => {
    if (!canJoin || !meetingId) return;

    try {
      const check = await prerequisitesService.canLaunchMeeting(meetingId);
      if (check.canLaunch) {
        onNavigate('video');
      } else {
        setError(check.reason || 'Impossible de rejoindre la réunion');
      }
    } catch (err) {
      console.error('Erreur lors de la vérification:', err);
      onNavigate('video'); // Rejoindre quand même en cas d'erreur
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des prérequis...</p>
        </div>
      </div>
    );
  }

  if (!meetingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-900 mb-4">Aucune donnée de prérequis disponible</p>
            <Button onClick={() => onNavigate('reunions')}>Retour aux réunions</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const user = authService.getCurrentUser();
  const myDoctor = meetingData.doctors.find((d) => d.doctor_id === user?.id);

  if (!myDoctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-900 mb-4">Vous n'êtes pas assigné à cette réunion</p>
            <Button onClick={() => onNavigate('reunions')}>Retour aux réunions</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const prerequisites = myDoctor.items;
  const requiredPrerequisites = prerequisites; // Tous sont obligatoires dans ce système
  const requiredCompleted = prerequisites.filter((p) => p.status === 'done').length;
  const totalCompleted = myDoctor.progress.completed;
  const progressPercentage = myDoctor.progress.percentage;
  const canJoin = requiredCompleted === requiredPrerequisites.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Button variant="ghost" onClick={() => onNavigate('reunions')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux réunions
          </Button>
          <h1 className="text-gray-900 mb-1">Vérification des pré-requis</h1>
          <p className="text-gray-600">Complétez les pré-requis avant de rejoindre la réunion</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Erreur Alert */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
                <Button
                  variant="link"
                  className="ml-2 text-red-600 underline"
                  onClick={loadPrerequisites}
                >
                  Réessayer
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Meeting Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="mb-2">{meetingTitle}</CardTitle>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      📅{' '}
                      {new Date(meetingDate).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p>🕐 {meetingTime}</p>
                    <p>
                      👤 Patient: <strong>{meetingData.patient_id}</strong>
                    </p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  {myDoctor.speciality}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Progression ({totalCompleted}/{prerequisites.length})
                  </span>
                  <span className="text-gray-900">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>

              {/* Required items status */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">
                  <span className="text-gray-600">Pré-requis obligatoires : </span>
                  <span className={canJoin ? 'text-green-600' : 'text-orange-600'}>
                    {requiredCompleted}/{requiredPrerequisites.length} complétés
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Warning Alert if not ready */}
          {!canJoin && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                Vous devez compléter tous les pré-requis obligatoires avant de rejoindre la réunion.
              </AlertDescription>
            </Alert>
          )}

          {/* Prerequisites List */}
          <Card>
            <CardHeader>
              <CardTitle>Pré-requis pour {myDoctor.speciality}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {prerequisites.map((prerequisite) => {
                  const isChecked = prerequisite.status === 'done';
                  const isUpdating = updatingItems.has(prerequisite.key);

                  return (
                    <div
                      key={prerequisite.key}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                        isChecked
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200 hover:border-blue-300'
                      } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                      onClick={() => !isUpdating && togglePrerequisite(prerequisite)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {isUpdating ? (
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                          ) : isChecked ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`${isChecked ? 'text-green-900' : 'text-gray-900'}`}>
                              {prerequisite.label}
                            </h3>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                              Obligatoire
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {prerequisite.source === 'orthanc' ? '📷 Imagerie' : '📄 Document'}
                            </Badge>
                            {prerequisite.reference_id && (
                              <span className="text-xs text-gray-500">Réf: {prerequisite.reference_id}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => onNavigate('reunions')}>
              Annuler
            </Button>
            <Button
              className={`flex-1 ${
                canJoin ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
              }`}
              disabled={!canJoin}
              onClick={handleJoinMeeting}
            >
              <Video className="w-4 h-4 mr-2" />
              {canJoin ? 'Rejoindre la réunion' : 'Pré-requis incomplets'}
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center text-sm text-gray-500">
            <p>
              💡 Cochez chaque élément une fois que vous l'avez complété. Les pré-requis obligatoires doivent
              être complétés pour accéder à la réunion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
