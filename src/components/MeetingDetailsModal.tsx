import { X, User, CheckCircle, Clock, XCircle } from 'lucide-react';
import { MeetingDetails, ParticipantWithPrerequisites } from '../services/meetings.service';
import { useLanguage } from '../i18n';
import { getPrerequisiteLabel } from '../i18n/prerequisite-labels';

interface MeetingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingDetails: MeetingDetails | null;
  isLoading: boolean;
}

export function MeetingDetailsModal({
  isOpen,
  onClose,
  meetingDetails,
  isLoading,
}: MeetingDetailsModalProps) {
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'organizer':
        return 'bg-purple-100 text-purple-800';
      case 'co_admin':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'organizer':
        return 'Organisateur';
      case 'co_admin':
        return 'Co-admin';
      default:
        return 'Participant';
    }
  };

  const getPrerequisiteIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'not_applicable':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPrerequisiteStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-orange-600';
      case 'not_applicable':
        return 'text-gray-400';
      default:
        return 'text-gray-600';
    }
  };

  const getPrerequisiteStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Complété';
      case 'pending':
        return 'En attente';
      case 'not_applicable':
        return 'Non applicable';
      default:
        return status;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {meetingDetails?.title || 'Détails de la réunion'}
            </h2>
            {meetingDetails?.description && (
              <p className="text-sm text-gray-600 mt-1">{meetingDetails.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : meetingDetails ? (
            <div className="space-y-6">
              {/* Info si participant (ne voit que ses prérequis) */}
              {meetingDetails.participants.length === 1 && 
               meetingDetails.participants[0].role === 'participant' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    ℹ️ <strong>Vous êtes participant.</strong> Vous voyez uniquement vos propres prérequis pour cette réunion.
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Participants ({meetingDetails.participants.length})
                </h3>
                <div className="space-y-4">
                  {meetingDetails.participants.map((participant: ParticipantWithPrerequisites) => (
                    <div
                      key={participant.doctorId}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-900">
                                {participant.firstName} {participant.lastName}
                              </h4>
                              <span
                                className={'px-2 py-1 rounded text-xs font-medium ' + getRoleBadgeColor(participant.role)}
                              >
                                {getRoleLabel(participant.role)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{participant.email}</p>
                            <p className="text-sm text-gray-500">{participant.speciality}</p>
                          </div>
                        </div>
                      </div>

                      {participant.prerequisites.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-bold">
                              {participant.prerequisites.length} Prérequis
                            </span>
                            <span className="text-xs text-gray-600">
                              ({participant.prerequisites.filter((p: any) => p.status === 'completed').length} complétés)
                            </span>
                          </p>
                          <div className="space-y-2">
                            {participant.prerequisites.map((prereq, index) => {
                              // Display label in the correct language
                              const displayLabel = language === 'fr' 
                                ? (prereq.label_fr || prereq.label) 
                                : (prereq.label_en || prereq.label_fr || prereq.label);

                              return (
                              <div
                                key={index}
                                className={`p-3 rounded-lg border-2 transition flex items-start justify-between ${
                                  prereq.status === 'completed'
                                    ? 'bg-green-50 border-green-200'
                                    : prereq.status === 'pending'
                                    ? 'bg-orange-50 border-orange-200'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="pt-0.5">
                                    {getPrerequisiteIcon(prereq.status)}
                                  </div>
                                  <div className="flex-1">
                                    <p className={`text-sm font-medium ${
                                      prereq.status === 'completed'
                                        ? 'text-green-900'
                                        : prereq.status === 'pending'
                                        ? 'text-orange-900'
                                        : 'text-gray-900'
                                    }`}>
                                      {displayLabel}
                                    </p>
                                  </div>
                                </div>
                                <span className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ml-2 ${
                                  prereq.status === 'completed'
                                    ? 'bg-green-100 text-green-700'
                                    : prereq.status === 'pending'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {getPrerequisiteStatusLabel(prereq.status)}
                                </span>
                              </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {participant.prerequisites.length === 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-sm text-gray-500 italic">Aucun prérequis</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Aucun détail disponible
            </div>
          )}
        </div>

        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
