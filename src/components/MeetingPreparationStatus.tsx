import { CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useState } from 'react';
import { Progress } from './ui/progress';

interface Prerequisite {
  id: string;
  title: string;
  status: 'pending' | 'completed';
}

interface ParticipantPreparation {
  id: string;
  name: string;
  role: string;
  initials: string;
  prerequisites: Prerequisite[];
}

interface MeetingPreparationStatusProps {
  participants: ParticipantPreparation[];
  compact?: boolean;
}

export function MeetingPreparationStatus({ participants, compact = false }: MeetingPreparationStatusProps) {
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);

  const getReadiness = (participant: ParticipantPreparation) => {
    const completed = participant.prerequisites.filter(p => p.status === 'completed').length;
    const total = participant.prerequisites.length;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const getOverallReadiness = () => {
    const totalPrerequisites = participants.reduce((sum, p) => sum + p.prerequisites.length, 0);
    const completedPrerequisites = participants.reduce(
      (sum, p) => sum + p.prerequisites.filter(pr => pr.status === 'completed').length,
      0
    );
    return totalPrerequisites > 0 ? (completedPrerequisites / totalPrerequisites) * 100 : 0;
  };

  const readyCount = participants.filter(p => getReadiness(p) === 100).length;
  const overallReadiness = getOverallReadiness();

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Préparation globale</span>
          <span className={`${overallReadiness === 100 ? 'text-green-600' : 'text-amber-600'}`}>
            {readyCount}/{participants.length} prêts
          </span>
        </div>
        <Progress value={overallReadiness} className="h-2" />
        <div className="flex items-center gap-2 flex-wrap">
          {participants.map((participant) => {
            const readiness = getReadiness(participant);
            const isReady = readiness === 100;
            
            return (
              <div key={participant.id} className="relative group">
                <Avatar className={`w-8 h-8 cursor-pointer transition-transform hover:scale-110 ${
                  isReady ? 'ring-2 ring-green-500' : 'ring-2 ring-amber-500'
                }`}>
                  <AvatarFallback className={isReady ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                    {participant.initials}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                  isReady ? 'bg-green-500' : 'bg-amber-500'
                }`}>
                  {isReady ? (
                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                  ) : (
                    <Clock className="w-2.5 h-2.5 text-white" />
                  )}
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {participant.name}: {readiness.toFixed(0)}%
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm text-gray-900">État de préparation</h4>
        {overallReadiness === 100 ? (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Tous prêts
          </Badge>
        ) : (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            <Clock className="w-3 h-3 mr-1" />
            {readyCount}/{participants.length} prêts
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {participants.map((participant) => {
          const readiness = getReadiness(participant);
          const isReady = readiness === 100;
          const isExpanded = expandedParticipant === participant.id;
          const completedCount = participant.prerequisites.filter(p => p.status === 'completed').length;
          
          return (
            <div key={participant.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedParticipant(isExpanded ? null : participant.id)}
                className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <div className="relative">
                  <Avatar className="w-10 h-10 bg-blue-600">
                    <AvatarFallback className="bg-blue-600 text-white text-sm">
                      {participant.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                    isReady ? 'bg-green-500' : 'bg-amber-500'
                  }`}>
                    {isReady ? (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    ) : (
                      <Clock className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>

                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm text-gray-900">{participant.name}</p>
                  <p className="text-xs text-gray-500">{participant.role}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[120px]">
                      <div 
                        className={`h-1.5 rounded-full transition-all ${
                          isReady ? 'bg-green-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${readiness}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs ${isReady ? 'text-green-600' : 'text-amber-600'}`}>
                      {completedCount}/{participant.prerequisites.length}
                    </span>
                  </div>
                </div>

                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 bg-gray-50 border-t border-gray-200">
                  <div className="space-y-2 pt-2">
                    {participant.prerequisites.map((prereq) => (
                      <div key={prereq.id} className="flex items-start gap-2 text-sm">
                        {prereq.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={prereq.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-700'}>
                          {prereq.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
