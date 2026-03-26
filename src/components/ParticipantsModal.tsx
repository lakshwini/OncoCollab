import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';
import { useLanguage } from '../i18n';
import type { Meeting } from '../services/meetings.service';

interface ParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting | null;
}

export function ParticipantsModal({
  isOpen,
  onClose,
  meeting,
}: ParticipantsModalProps) {
  const { language } = useLanguage();

  if (!meeting || !isOpen) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <Badge className="bg-emerald-900/40 text-emerald-200 border-emerald-700/60 text-xs flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {language === 'fr' ? 'Confirmé' : 'Confirmed'}
          </Badge>
        );
      case 'declined':
        return (
          <Badge className="bg-red-900/40 text-red-200 border-red-700/60 text-xs flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            {language === 'fr' ? 'Refusé' : 'Declined'}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-orange-900/40 text-orange-200 border-orange-700/60 text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {language === 'fr' ? 'En attente' : 'Pending'}
          </Badge>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a1f2e] border border-gray-700/50 rounded-lg text-white max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-700/50 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{meeting.title}</h2>
            <p className="text-sm text-gray-400 mt-2">
              {language === 'fr' ? 'Participants de la réunion' : 'Meeting Participants'}
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
        <div className="p-6 space-y-3">
          {meeting.participants && meeting.participants.length > 0 ? (
            meeting.participants.map((participant) => {
              const initials = (
                (participant.doctorName.split(' ')[0]?.[0] ?? '') +
                (participant.doctorName.split(' ')[1]?.[0] ?? '')
              ).toUpperCase();

              return (
                <div
                  key={participant.doctorId}
                  className="flex items-center gap-4 p-4 rounded-lg bg-gray-800/40 hover:bg-gray-800/60 transition-colors border border-gray-700/30"
                >
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback className="bg-blue-600 text-white font-bold text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{participant.doctorName}</p>
                    <p className="text-xs text-gray-400 truncate">{participant.speciality}</p>
                  </div>

                  <div className="flex-shrink-0">
                    {getStatusBadge(participant.invitationStatus)}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">
                {language === 'fr' ? 'Aucun participant' : 'No participants'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700/50 p-4 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {language === 'fr' ? 'Fermer' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  );
}
