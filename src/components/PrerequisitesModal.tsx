import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { prerequisitesService } from '../services/prerequisites.service';
import { MeetingPrerequisites } from '../types/prerequisites';
import { useLanguage } from '../i18n';
import type { PrerequisiteFormContext } from './PrerequisiteFormPage';

interface PrerequisitesModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  meetingTitle: string;
  onOpenPrerequisiteForm?: (context: PrerequisiteFormContext) => void;
  onPrepareClick: () => void;
}

export function PrerequisitesModal({
  isOpen,
  onClose,
  meetingId,
  meetingTitle,
  onOpenPrerequisiteForm,
  onPrepareClick,
}: PrerequisitesModalProps) {
  const { language } = useLanguage();
  const [meetingData, setMeetingData] = useState<MeetingPrerequisites | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && meetingId) {
      loadPrerequisites();
    }
  }, [isOpen, meetingId]);

  const loadPrerequisites = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await prerequisitesService.getMeetingPrerequisites(meetingId, false);
      setMeetingData(data);
    } catch (err) {
      console.error('Erreur lors du chargement des prérequis:', err);
      setError(language === 'fr' ? 'Impossible de charger les prérequis' : 'Failed to load prerequisites');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-emerald-900/40 text-emerald-200 border-emerald-700/60';
      case 'pending':
        return 'bg-orange-900/40 text-orange-200 border-orange-700/60';
      default:
        return 'bg-gray-900/40 text-gray-200 border-gray-700/60';
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'done') {
      return <CheckCircle2 className="w-4 h-4" />;
    }
    return <AlertCircle className="w-4 h-4" />;
  };

  const getStatusLabel = (status: string) => {
    if (language === 'fr') {
      return status === 'done' ? 'Fait' : 'À faire';
    }
    return status === 'done' ? 'Done' : 'To do';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a1f2e] border border-gray-700/50 rounded-lg text-white max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-700/50 p-6 flex items-center justify-between sticky top-0 bg-[#1a1f2e]">
          <div>
            <h2 className="text-2xl font-bold">{meetingTitle}</h2>
            <p className="text-sm text-gray-400 mt-2">
              {language === 'fr' ? 'Prérequis de la réunion' : 'Meeting Prerequisites'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-400">
                  {language === 'fr' ? 'Chargement...' : 'Loading...'}
                </p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 mb-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {!loading && meetingData && (
            <div className="space-y-6">
              {/* Progress Overview */}
              <div className="bg-gray-800/40 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-300">
                    {language === 'fr' ? 'Progression globale' : 'Global Progress'}
                  </span>
                  <Badge className="bg-blue-600/40 text-blue-200 border-blue-700/60">
                    {meetingData.globalProgress.completed} / {meetingData.globalProgress.total}
                  </Badge>
                </div>
                <div className="w-full bg-gray-900/60 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                    style={{ width: `${meetingData.globalProgress.percentage}%` }}
                  />
                </div>
              </div>

              {/* Prerequisites by Doctor */}
              <div className="space-y-4">
                {meetingData.doctors.map((doctor) => (
                  <div key={doctor.doctor_id} className="bg-gray-800/20 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-white">{doctor.speciality}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {doctor.progress.completed} / {doctor.progress.total}{' '}
                          {language === 'fr' ? 'complété' : 'completed'}
                        </p>
                      </div>
                      <Badge className={`${getStatusBadgeColor(doctor.items.every((i) => i.status === 'done') ? 'done' : 'pending')} text-xs`}>
                        {doctor.items.every((i) => i.status === 'done')
                          ? language === 'fr'
                            ? 'Complet'
                            : 'Complete'
                          : language === 'fr'
                          ? 'En cours'
                          : 'In progress'}
                      </Badge>
                    </div>

                    {/* Items */}
                    <div className="space-y-2">
                      {doctor.items.map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center gap-3 p-2 rounded hover:bg-gray-800/40 transition-colors justify-between"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`${getStatusBadgeColor(item.status)} rounded-full p-1.5 flex-shrink-0`}>
                              {getStatusIcon(item.status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-200 truncate">
                                {item.label_fr && language === 'fr' ? item.label_fr : item.label}
                              </p>
                            </div>
                            <Badge
                              className={`${getStatusBadgeColor(item.status)} text-xs whitespace-nowrap`}
                            >
                              {getStatusLabel(item.status)}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              if (onOpenPrerequisiteForm) {
                                onOpenPrerequisiteForm({
                                  meetingId,
                                  prerequisiteId: item.key,
                                  role: doctor.speciality || 'coordinateur',
                                  title: item.label_fr && language === 'fr' ? item.label_fr : item.label,
                                  returnPage: 'calendrier',
                                });
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs whitespace-nowrap"
                          >
                            {language === 'fr' ? 'Réaliser' : 'Perform'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && !meetingData && !error && (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-400">
                {language === 'fr' ? 'Aucune donnée disponible' : 'No data available'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700/50 p-4 flex gap-3 justify-end sticky bottom-0 bg-[#1a1f2e]">
          <Button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white"
          >
            {language === 'fr' ? 'Fermer' : 'Close'}
          </Button>
          <Button
            onClick={() => {
              onClose();
              onPrepareClick();
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {language === 'fr' ? 'Préparer les tâches' : 'Prepare tasks'}
          </Button>
        </div>
      </div>
    </div>
  );
}
