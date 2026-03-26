import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Clock, Circle, Loader2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { useLanguage } from '../i18n';
import { OlgaDynamicForm } from './OlgaDynamicForm';
import {
  prerequisitesService,
  type MyPrerequisiteItem,
  type MyMeetingPrerequisites,
} from '../services/prerequisites.service';
import type { Page } from '../App';

interface PrerequisitesPreparationPageProps {
  meetingId: string;
  meetingTitle: string;
  userRole: string;
  authToken: string | null;
  onNavigate: (page: Page) => void;
}

function StatusIcon({ status }: { status: MyPrerequisiteItem['status'] }) {
  if (status === 'done') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  if (status === 'in_progress') return <Clock className="w-4 h-4 text-orange-500" />;
  return <Circle className="w-4 h-4 text-red-500" />;
}

function StatusBadge({ status }: { status: MyPrerequisiteItem['status'] }) {
  const label = status === 'done' ? 'Fait' : status === 'in_progress' ? 'En cours' : 'Non fait';
  const colors = {
    done: 'bg-green-100 text-green-700',
    in_progress: 'bg-orange-100 text-orange-700',
    pending: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status]}`}>
      {label}
    </span>
  );
}

function getStatusColor(status: MyPrerequisiteItem['status']): string {
  if (status === 'done') return '#22c55e';
  if (status === 'in_progress') return '#f97316';
  return '#ef4444';
}

export function PrerequisitesPreparationPage({
  meetingId,
  meetingTitle,
  userRole,
  authToken,
  onNavigate,
}: PrerequisitesPreparationPageProps) {
  const { t } = useLanguage();
  const [prerequisites, setPrerequisites] = useState<MyPrerequisiteItem[]>([]);
  const [selectedPrerequisiteId, setSelectedPrerequisiteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Charger les prérequis au montage
  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        setLoading(true);
        setError(null);

        const allPrerequisites = await prerequisitesService.getMyPrerequisites();
        const meetingPrerequisites = allPrerequisites.find((m) => m.meeting_id === meetingId);

        if (meetingPrerequisites) {
          setPrerequisites(meetingPrerequisites.prerequisites);
          // Sélectionner le premier prérequis par défaut
          if (meetingPrerequisites.prerequisites.length > 0) {
            setSelectedPrerequisiteId(meetingPrerequisites.prerequisites[0].id);
          }
        } else {
          setError('Aucun prérequis trouvé pour cette réunion');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des prérequis');
      } finally {
        setLoading(false);
      }
    };

    loadPrerequisites();
  }, [meetingId]);

  // Récupérer le prérequis actuellement sélectionné
  const selectedPrerequisite = prerequisites.find((p) => p.id === selectedPrerequisiteId) || null;

  // Mettre à jour le statut d'un prérequis
  const updatePrerequisiteStatus = async (itemId: string, newStatus: 'pending' | 'in_progress' | 'done') => {
    try {
      setUpdatingStatusId(itemId);
      await prerequisitesService.updatePrerequisiteStatus(meetingId, itemId, newStatus);

      // Mettre à jour l'état local
      setPrerequisites((prev) =>
        prev.map((p) =>
          p.id === itemId ? { ...p, status: newStatus, completed: newStatus === 'done' } : p,
        ),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du statut';
      setError(message);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#f9fafb]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Chargement des prérequis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f9fafb]">
      {/* Header */}
      <div className="bg-white px-10 py-7 border-b border-gray-100">
        <div className="flex items-center gap-5 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('mes-prerequis')}
            className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Préparer les tâches</h1>
            <p className="text-sm text-gray-500 mt-1.5">{meetingTitle}</p>
          </div>
        </div>

        {/* Progress bar */}
        {prerequisites.length > 0 && (
          <div className="flex items-center gap-4 max-w-md">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-medium text-gray-600">Progression</span>
                <span className="text-sm font-semibold text-blue-600">
                  {prerequisites.filter((p) => p.status === 'done').length}/{prerequisites.length}
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out rounded-full"
                  style={{
                    width: `${
                      prerequisites.length > 0
                        ? Math.round(
                            (prerequisites.filter((p) => p.status === 'done').length /
                              prerequisites.length) *
                              100,
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content - 2 columns */}
      <div className="flex-1 overflow-hidden p-10">
        <div className="flex gap-8 h-full max-w-7xl mx-auto">
          {/* LEFT: Prerequisites List */}
          <div className="w-80 flex flex-col">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Tâches</h2>
                <p className="text-xs text-gray-500 mt-1.5">{prerequisites.length} tâche{prerequisites.length !== 1 ? 's' : ''}</p>
              </div>

              <div className="flex-1 overflow-y-auto">
                {error && (
                  <Alert variant="destructive" className="m-4">
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                {prerequisites.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400 p-6">
                    <div className="text-center">
                      <Circle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">Aucune tâche à afficher</p>
                    </div>
                  </div>
                ) : (
                  <ul className="space-y-2 p-4">
                    {prerequisites.map((prereq) => (
                      <li key={prereq.id}>
                        <button
                          onClick={() => setSelectedPrerequisiteId(prereq.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            selectedPrerequisiteId === prereq.id
                              ? 'bg-blue-50 border-l-4 border-l-blue-500 text-gray-900 shadow-sm'
                              : 'text-gray-700 hover:bg-gray-50 border-l-4 border-l-transparent'
                          }`}
                        >
                          <StatusIcon status={prereq.status} />
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{prereq.label}</p>
                          </div>
                          {prereq.status === 'done' && (
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Olga Form */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedPrerequisite ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
                {/* Header with Status */}
                <div className="px-8 py-7 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-shrink-0">
                        <StatusIcon status={selectedPrerequisite.status} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-900">{selectedPrerequisite.label}</h2>
                        <div className="flex items-center gap-3 mt-2.5">
                          <StatusBadge status={selectedPrerequisite.status} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Management Buttons - Segmented Control */}
                  <div className="inline-flex gap-1 p-1 bg-gray-100 rounded-full">
                    <button
                      onClick={() => updatePrerequisiteStatus(selectedPrerequisite.id, 'pending')}
                      disabled={updatingStatusId === selectedPrerequisite.id}
                      className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
                        selectedPrerequisite.status === 'pending'
                          ? 'bg-red-500 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                      }`}
                    >
                      {updatingStatusId === selectedPrerequisite.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Circle className="w-3 h-3" />
                          Non fait
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => updatePrerequisiteStatus(selectedPrerequisite.id, 'in_progress')}
                      disabled={updatingStatusId === selectedPrerequisite.id}
                      className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
                        selectedPrerequisite.status === 'in_progress'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                      }`}
                    >
                      {updatingStatusId === selectedPrerequisite.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          En cours
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => updatePrerequisiteStatus(selectedPrerequisite.id, 'done')}
                      disabled={updatingStatusId === selectedPrerequisite.id}
                      className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
                        selectedPrerequisite.status === 'done'
                          ? 'bg-green-500 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                      }`}
                    >
                      {updatingStatusId === selectedPrerequisite.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-3 h-3" />
                          Terminé
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Form Container - Spacious */}
                <div className="flex-1 overflow-y-auto p-8">
                  {selectedPrerequisiteId && (
                    <OlgaDynamicForm
                      key={`${meetingId}::${selectedPrerequisiteId}::${userRole}`}
                      meetingId={meetingId}
                      role={userRole}
                      items={[
                        {
                          key: selectedPrerequisite.key || selectedPrerequisite.id,
                          label: selectedPrerequisite.label,
                          status: selectedPrerequisite.status,
                          source: selectedPrerequisite.source,
                          reference_id: selectedPrerequisite.reference_id,
                          value: selectedPrerequisite.value,
                        },
                      ]}
                      prerequisiteId={selectedPrerequisiteId}
                      language="fr"
                      title={selectedPrerequisite.label}
                      variant="light"
                      onSaved={() => {
                        setPrerequisites((prev) =>
                          prev.map((p) =>
                            p.id === selectedPrerequisiteId ? { ...p, status: 'done' as const } : p,
                          ),
                        );
                      }}
                      onError={(message) => {
                        setError(message);
                      }}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 mb-5">
                    <Circle className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900">Sélectionnez une tâche</p>
                  <p className="text-sm text-gray-500 mt-2">Choisissez une tâche pour commencer</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
