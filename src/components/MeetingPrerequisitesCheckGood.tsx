import { useState, useEffect } from 'react';
import { Page, UserRole } from '../App';
import { Video, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import type { PrerequisiteFormContext } from './PrerequisiteFormPage';
import { prerequisitesService } from '../services/prerequisites.service';
import { MeetingPrerequisites } from '../types/prerequisites';
import { authService } from '../services/auth.service';

interface MeetingPrerequisitesCheckProps {
  onNavigate: (page: Page) => void;
  onOpenPrerequisiteForm?: (context: PrerequisiteFormContext) => void;
  userRole: UserRole;
  meetingId?: string; // ID de la réunion
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
}

export function MeetingPrerequisitesCheck({
  onNavigate,
  onOpenPrerequisiteForm,
  meetingId,
  meetingTitle,
  meetingDate,
  meetingTime,
}: MeetingPrerequisitesCheckProps) {
  const [meetingData, setMeetingData] = useState<MeetingPrerequisites | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [olgaError, setOlgaError] = useState<string | null>(null);

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
      setOlgaError(null);
      const data = await prerequisitesService.getMeetingPrerequisites(meetingId, false);
      setMeetingData(data);
    } catch (err) {
      console.error('Erreur lors du chargement des prérequis:', err);
      setError('Impossible de charger les prérequis. Veuillez réessayer.');
    } finally {
      setLoading(false);
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
  const formPrerequisites = prerequisites.filter((item) => item.source === 'form');
  const manualPrerequisites = prerequisites.filter((item) => item.source !== 'form');
  const requiredPrerequisites = prerequisites; // Tous sont obligatoires dans ce système
  const requiredCompleted = prerequisites.filter((p) => p.status === 'done').length;
  const totalCompleted = myDoctor.progress.completed;
  const progressPercentage = myDoctor.progress.percentage;
  const canJoin = requiredCompleted === requiredPrerequisites.length;

  const recalculateProgress = (items: typeof prerequisites) => {
    const total = items.length;
    const completed = items.filter((item) => item.status === 'done').length;
    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  };

  const handleToggleManualPrerequisite = async (
    itemKey: string,
    completed: boolean,
  ) => {
    if (!meetingId) {
      return;
    }

    try {
      setError(null);
      await prerequisitesService.togglePrerequisiteItem(meetingId, itemKey, completed);

      setMeetingData((previous) => {
        if (!previous) {
          return previous;
        }

        const doctors = previous.doctors.map((doctor) => {
          if (doctor.doctor_id !== myDoctor.doctor_id) {
            return doctor;
          }

          const items = doctor.items.map((item) =>
            item.key === itemKey
              ? {
                  ...item,
                  status: completed ? 'done' : 'pending',
                }
              : item,
          );

          return {
            ...doctor,
            items,
            progress: recalculateProgress(items),
          };
        });

        const allItems = doctors.flatMap((doctor) => doctor.items);
        const globalProgress = recalculateProgress(allItems);

        return {
          ...previous,
          doctors,
          globalProgress,
          status: globalProgress.total > 0 && globalProgress.completed === globalProgress.total
            ? 'ready'
            : 'in_progress',
        };
      });
    } catch (toggleError) {
      console.error('Erreur lors de la mise a jour du prerequis:', toggleError);
      setError('Impossible de mettre à jour le prérequis. Veuillez réessayer.');
    }
  };

  const openPrerequisiteFormPage = () => {
    if (!onOpenPrerequisiteForm || !meetingId || formPrerequisites.length === 0) {
      return;
    }

    const target = formPrerequisites[0];
    const resolvedPrerequisiteId =
      (target.reference_id || '').trim() ||
      (target.key || '').trim() ||
      'olga_form';

    onOpenPrerequisiteForm({
      meetingId,
      prerequisiteId: resolvedPrerequisiteId,
      role: myDoctor.speciality || 'Non spécifié',
      title: 'Réponses médicales',
      description: 'Les réponses enregistrées mettent à jour automatiquement vos prérequis de réunion.',
      language: 'fr',
      returnPage: 'prerequisites',
      items: formPrerequisites.map((item) => ({
        key: item.key,
        label: item.label,
        status: item.status,
        source: item.source,
        reference_id: item.reference_id,
        value: item.value,
      })),
    });
  };

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
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    {prerequisites.length} champ(s)
                  </Badge>
                  {formPrerequisites.length > 0 && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                      Formulaire Olga dynamique
                    </Badge>
                  )}
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Prérequis manuels</h3>
                  {manualPrerequisites.length === 0 ? (
                    <p className="text-sm text-gray-500">Aucun prérequis manuel assigné.</p>
                  ) : (
                    <div className="space-y-2">
                      {manualPrerequisites.map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2"
                        >
                          <input
                            type="checkbox"
                            checked={item.status === 'done'}
                            onChange={(event) =>
                              handleToggleManualPrerequisite(item.key, event.target.checked)
                            }
                          />
                          <span className="text-sm text-gray-800">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {formPrerequisites.length > 0 && (
                  <>
                    {olgaError && (
                      <Alert className="border-orange-200 bg-orange-50">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">{olgaError}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={openPrerequisiteFormPage}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Ouvrir le formulaire Olga
                    </Button>
                  </>
                )}
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
