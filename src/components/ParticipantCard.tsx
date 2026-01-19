import { X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';

export interface Prerequisite {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  category: string;
}

export interface ParticipantWithPrerequisites {
  id: string;
  name: string;
  role: string;
  initials: string;
  active: boolean;
  micOn: boolean;
  videoOn: boolean;
  status: string;
  email?: string;
  specialization?: string;
  prerequisites: Prerequisite[];
}

interface ParticipantCardProps {
  participant: ParticipantWithPrerequisites | null;
  open: boolean;
  onClose: () => void;
}

export function ParticipantCard({ participant, open, onClose }: ParticipantCardProps) {
  if (!participant) return null;

  const completedCount = participant.prerequisites.filter(p => p.status === 'completed').length;
  const totalCount = participant.prerequisites.length;
  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isReady = completionRate === 100;

  // Group prerequisites by category
  const groupedPrerequisites = participant.prerequisites.reduce((acc, prereq) => {
    if (!acc[prereq.category]) {
      acc[prereq.category] = [];
    }
    acc[prereq.category].push(prereq);
    return acc;
  }, {} as Record<string, Prerequisite[]>);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0f1419] border-gray-800 text-white max-w-2xl max-h-[85vh] p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-800">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16 bg-blue-600">
              <AvatarFallback className="bg-blue-600 text-white text-xl">
                {participant.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-xl text-white mb-1">
                {participant.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Détails de préparation pour {participant.name}
              </DialogDescription>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 border-blue-600/30">
                  {participant.role}
                </Badge>
                {participant.specialization && (
                  <span className="text-sm text-gray-400">{participant.specialization}</span>
                )}
              </div>
              {participant.email && (
                <p className="text-sm text-gray-500 mt-1">{participant.email}</p>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Completion Status */}
        <div className="px-6 py-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm">État de préparation</h3>
              {isReady ? (
                <Badge className="bg-green-600/20 text-green-300 border-green-600/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Prêt
                </Badge>
              ) : (
                <Badge className="bg-amber-600/20 text-amber-300 border-amber-600/30">
                  <Clock className="w-3 h-3 mr-1" />
                  En préparation
                </Badge>
              )}
            </div>
            <span className="text-sm text-gray-400">
              {completedCount}/{totalCount} tâches
            </span>
          </div>
          <Progress value={completionRate} className="h-2 bg-gray-800" />
          <p className="text-xs text-gray-500 mt-2">
            {completionRate.toFixed(0)}% des pré-requis complétés
          </p>
        </div>

        {/* Prerequisites List */}
        <ScrollArea className="flex-1 px-6 py-4 max-h-[calc(85vh-280px)]">
          <div className="space-y-6">
            {Object.entries(groupedPrerequisites).map(([category, prereqs]) => (
              <div key={category}>
                <h4 className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                  {category}
                  <span className="text-xs bg-gray-800 px-2 py-0.5 rounded">
                    {prereqs.filter(p => p.status === 'completed').length}/{prereqs.length}
                  </span>
                </h4>
                <div className="space-y-3">
                  {prereqs.map((prereq) => (
                    <div
                      key={prereq.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        prereq.status === 'completed'
                          ? 'bg-green-950/20 border-green-800/30'
                          : 'bg-gray-800/50 border-gray-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {prereq.status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                          ) : (
                            <Clock className="w-5 h-5 text-amber-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm mb-1 ${
                            prereq.status === 'completed' 
                              ? 'text-green-300 line-through' 
                              : 'text-white'
                          }`}>
                            {prereq.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {prereq.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {totalCount === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Aucun pré-requis défini</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
          >
            Fermer
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}