import { useState } from 'react';
import { Page, UserRole } from '../App';
import { CheckCircle2, Circle, Calendar, Clock, Video, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { useLanguage } from '../i18n';

interface Prerequisite {
  id: string;
  titleKey: string;
  status: 'completed' | 'pending';
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  prerequisites: Prerequisite[];
}

interface MyPrerequisitesProps {
  userRole: UserRole;
  onNavigate: (page: Page) => void;
}

export function MyPrerequisites({ userRole, onNavigate }: MyPrerequisitesProps) {
  const { language, t } = useLanguage();
  const [expandedMeetings, setExpandedMeetings] = useState<Set<string>>(new Set(['1']));

  const getPrerequisiteTitle = (key: string) => {
    const titles: Record<string, Record<string, string>> = {
      consultPatientFiles: { fr: 'Consulter dossiers patients', en: 'Review patient files' },
      analyzeImaging: { fr: 'Analyser imageries', en: 'Analyze imaging' },
      prepareAnnotations: { fr: 'Préparer annotations', en: 'Prepare annotations' },
      verifyEquipment: { fr: 'Vérifier matériel partage', en: 'Verify sharing equipment' },
      analyzeBiologicalTests: { fr: 'Analyser bilans biologiques', en: 'Analyze biological tests' },
      prepareTreatmentProtocols: { fr: 'Préparer protocoles traitement', en: 'Prepare treatment protocols' },
      checkContraindications: { fr: 'Vérifier contre-indications', en: 'Check contraindications' },
      evaluateSurgicalFeasibility: { fr: 'Évaluer faisabilité chirurgicale', en: 'Evaluate surgical feasibility' },
      prepareSurgicalOptions: { fr: 'Préparer options opératoires', en: 'Prepare surgical options' },
    };
    return titles[key]?.[language] || key;
  };

  const meetings: Meeting[] = [
    {
      id: '1',
      title: language === 'fr' ? 'RCP Oncologie Thoracique' : 'Thoracic Oncology RCP',
      date: '2025-11-11',
      time: '10:00',
      duration: '2h',
      prerequisites:
        userRole === 'radiologue'
          ? [
              { id: 'p1', titleKey: 'consultPatientFiles', status: 'completed' as const },
              { id: 'p2', titleKey: 'analyzeImaging', status: 'completed' as const },
              { id: 'p3', titleKey: 'prepareAnnotations', status: 'pending' as const },
              { id: 'p4', titleKey: 'verifyEquipment', status: 'pending' as const },
            ]
          : userRole === 'oncologue'
          ? [
              { id: 'p1', titleKey: 'consultPatientFiles', status: 'completed' as const },
              { id: 'p2', titleKey: 'analyzeBiologicalTests', status: 'pending' as const },
              { id: 'p3', titleKey: 'prepareTreatmentProtocols', status: 'pending' as const },
              { id: 'p4', titleKey: 'checkContraindications', status: 'pending' as const },
            ]
          : [
              { id: 'p1', titleKey: 'consultPatientFiles', status: 'completed' as const },
              { id: 'p2', titleKey: 'evaluateSurgicalFeasibility', status: 'completed' as const },
              { id: 'p3', titleKey: 'prepareSurgicalOptions', status: 'pending' as const },
            ],
    },
    {
      id: '2',
      title: language === 'fr' ? 'RCP Cancers Digestifs' : 'Digestive Cancers RCP',
      date: '2025-11-13',
      time: '14:30',
      duration: '1h30',
      prerequisites:
        userRole === 'radiologue'
          ? [
              { id: 'p1', titleKey: 'consultPatientFiles', status: 'pending' as const },
              { id: 'p2', titleKey: 'analyzeImaging', status: 'pending' as const },
              { id: 'p3', titleKey: 'prepareAnnotations', status: 'pending' as const },
            ]
          : userRole === 'oncologue'
          ? [
              { id: 'p1', titleKey: 'consultPatientFiles', status: 'pending' as const },
              { id: 'p2', titleKey: 'analyzeBiologicalTests', status: 'pending' as const },
              { id: 'p3', titleKey: 'prepareTreatmentProtocols', status: 'pending' as const },
            ]
          : [
              { id: 'p1', titleKey: 'consultPatientFiles', status: 'pending' as const },
              { id: 'p2', titleKey: 'evaluateSurgicalFeasibility', status: 'pending' as const },
            ],
    },
    {
      id: '3',
      title: language === 'fr' ? 'RCP Cancers ORL' : 'ENT Cancers RCP',
      date: '2025-11-15',
      time: '09:00',
      duration: '1h30',
      prerequisites:
        userRole === 'radiologue'
          ? [
              { id: 'p1', titleKey: 'consultPatientFiles', status: 'pending' as const },
              { id: 'p2', titleKey: 'analyzeImaging', status: 'pending' as const },
            ]
          : userRole === 'oncologue'
          ? [
              { id: 'p1', titleKey: 'consultPatientFiles', status: 'pending' as const },
              { id: 'p2', titleKey: 'prepareTreatmentProtocols', status: 'pending' as const },
            ]
          : [
              { id: 'p1', titleKey: 'consultPatientFiles', status: 'pending' as const },
            ],
    },
  ];

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

  const togglePrerequisite = (meetingId: string, prerequisiteId: string) => {
    console.log(`Toggle prerequisite ${prerequisiteId} for meeting ${meetingId}`);
  };

  const getCompletionStats = (prerequisites: Prerequisite[]) => {
    const completed = prerequisites.filter((p) => p.status === 'completed').length;
    const total = prerequisites.length;
    const percentage = (completed / total) * 100;
    return { completed, total, percentage };
  };

  const getTotalStats = () => {
    let totalCompleted = 0;
    let totalPrerequisites = 0;
    meetings.forEach((meeting) => {
      const stats = getCompletionStats(meeting.prerequisites);
      totalCompleted += stats.completed;
      totalPrerequisites += stats.total;
    });
    const percentage = totalPrerequisites > 0 ? (totalCompleted / totalPrerequisites) * 100 : 0;
    return { totalCompleted, totalPrerequisites, percentage };
  };

  const totalStats = getTotalStats();

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-1">{t.myPrerequisites.title}</h1>
          <p className="text-gray-600">{t.myPrerequisites.subtitle}</p>
        </div>
        <Button onClick={() => onNavigate('reunions')} className="bg-blue-600 hover:bg-blue-700">
          <Video className="w-4 h-4 mr-2" />
          {t.myPrerequisites.viewMeetings}
        </Button>
      </div>

      {/* Global Stats Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-gray-900 mb-1">{t.myPrerequisites.globalProgress}</h3>
              <p className="text-sm text-gray-600">
                {totalStats.totalCompleted} / {totalStats.totalPrerequisites} {t.myPrerequisites.prerequisitesCompleted}
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
        <h2 className="text-gray-900">{t.myPrerequisites.upcomingMeetings} ({meetings.length})</h2>

        {meetings.map((meeting) => {
          const isExpanded = expandedMeetings.has(meeting.id);
          const stats = getCompletionStats(meeting.prerequisites);
          const isComplete = stats.completed === stats.total;

          return (
            <Card key={meeting.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => toggleMeeting(meeting.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle>{meeting.title}</CardTitle>
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
                          <span>
                            {meeting.time} • {meeting.duration}
                          </span>
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
                    {meeting.prerequisites.map((prerequisite) => {
                      const isChecked = prerequisite.status === 'completed';
                      return (
                        <div
                          key={prerequisite.id}
                          className={`p-3 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                            isChecked
                              ? 'bg-green-50 border-green-200'
                              : 'bg-white border-gray-200 hover:border-blue-300'
                          }`}
                          onClick={() => togglePrerequisite(meeting.id, prerequisite.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {isChecked ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <span
                              className={`flex-1 text-sm ${
                                isChecked ? 'text-green-900' : 'text-gray-900'
                              }`}
                            >
                              {getPrerequisiteTitle(prerequisite.titleKey)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={(e) => {
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
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isComplete) {
                          onNavigate('video');
                        }
                      }}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      {isComplete ? t.common.join : t.myPrerequisites.prerequisitesIncomplete}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
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
