import { Page } from '../App';
import { Calendar, Users, Video, Plus, Clock, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { MeetingPreparationStatus } from './MeetingPreparationStatus';

interface RCPMeetingsProps {
  onNavigate: (page: Page) => void;
  onNavigateToPrerequisites: (meetingInfo: { title: string; date: string; time: string }) => void;
}

export function RCPMeetings({ onNavigate, onNavigateToPrerequisites }: RCPMeetingsProps) {
  const upcomingMeetings = [
    {
      id: '1',
      title: 'RCP Oncologie Thoracique',
      date: '2025-11-11',
      time: '10:00',
      duration: '2h',
      location: 'Salle visio A',
      participants: [
        { name: 'Dr. Martin', role: 'Radiologue' },
        { name: 'Dr. Dubois', role: 'Oncologue' },
        { name: 'Dr. Laurent', role: 'Chirurgien' },
      ],
      participantsPreparation: [
        {
          id: '1',
          name: 'Dr. Martin',
          role: 'Radiologue',
          initials: 'DM',
          prerequisites: [
            { id: 'p1', title: 'Consulter dossiers patients', status: 'completed' as const },
            { id: 'p2', title: 'Analyser imageries', status: 'completed' as const },
            { id: 'p3', title: 'Préparer annotations', status: 'completed' as const },
          ],
        },
        {
          id: '2',
          name: 'Dr. Dubois',
          role: 'Oncologue',
          initials: 'DD',
          prerequisites: [
            { id: 'p1', title: 'Consulter dossiers patients', status: 'completed' as const },
            { id: 'p2', title: 'Analyser bilans biologiques', status: 'pending' as const },
            { id: 'p3', title: 'Préparer protocoles', status: 'pending' as const },
          ],
        },
        {
          id: '3',
          name: 'Dr. Laurent',
          role: 'Chirurgien',
          initials: 'DL',
          prerequisites: [
            { id: 'p1', title: 'Consulter dossiers patients', status: 'completed' as const },
            { id: 'p2', title: 'Évaluer faisabilité chirurgicale', status: 'completed' as const },
          ],
        },
      ],
      status: 'upcoming',
      patientCount: 5,
    },
    {
      id: '2',
      title: 'RCP Cancers Digestifs',
      date: '2025-11-13',
      time: '14:30',
      duration: '1h30',
      location: 'Salle visio B',
      participants: [
        { name: 'Dr. Chen', role: 'Gastro-entérologue' },
        { name: 'Dr. Dubois', role: 'Oncologue' },
        { name: 'Dr. Petit', role: 'Chirurgien' },
      ],
      participantsPreparation: [
        {
          id: '1',
          name: 'Dr. Chen',
          role: 'Gastro-entérologue',
          initials: 'DC',
          prerequisites: [
            { id: 'p1', title: 'Consulter dossiers patients', status: 'completed' as const },
            { id: 'p2', title: 'Analyser endoscopies', status: 'completed' as const },
          ],
        },
        {
          id: '2',
          name: 'Dr. Dubois',
          role: 'Oncologue',
          initials: 'DD',
          prerequisites: [
            { id: 'p1', title: 'Consulter dossiers patients', status: 'pending' as const },
            { id: 'p2', title: 'Préparer protocoles', status: 'pending' as const },
          ],
        },
        {
          id: '3',
          name: 'Dr. Petit',
          role: 'Chirurgien',
          initials: 'DP',
          prerequisites: [
            { id: 'p1', title: 'Consulter dossiers patients', status: 'completed' as const },
            { id: 'p2', title: 'Évaluer faisabilité', status: 'completed' as const },
            { id: 'p3', title: 'Préparer options opératoires', status: 'completed' as const },
          ],
        },
      ],
      status: 'upcoming',
      patientCount: 3,
    },
  ];

  const pastMeetings = [
    {
      id: '3',
      title: 'RCP Oncologie Thoracique',
      date: '2025-11-04',
      time: '10:00',
      participants: 4,
      patientCount: 6,
      status: 'completed',
    },
    {
      id: '4',
      title: 'RCP Cancers ORL',
      date: '2025-10-28',
      time: '15:00',
      participants: 5,
      patientCount: 4,
      status: 'completed',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-1">Réunions RCP</h1>
          <p className="text-gray-600">Planification et gestion des réunions de concertation</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => onNavigate('calendrier')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Voir le calendrier
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Planifier une RCP
          </Button>
        </div>
      </div>

      {/* Upcoming Meetings */}
      <div>
        <h2 className="text-gray-900 mb-4">Réunions à venir</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {upcomingMeetings.map((meeting) => (
            <Card key={meeting.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="mb-2">{meeting.title}</CardTitle>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(meeting.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{meeting.time} • {meeting.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{meeting.location}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {meeting.patientCount} patient(s)
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Preparation Status */}
                  <div className="pb-4 border-b border-gray-200">
                    <MeetingPreparationStatus 
                      participants={meeting.participantsPreparation}
                      compact={true}
                    />
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Participants ({meeting.participants.length})</p>
                    <div className="space-y-2">
                      {meeting.participants.map((participant, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs text-gray-700">
                              {participant.name.split(' ')[1]?.[0] || participant.name[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-gray-900">{participant.name}</p>
                            <p className="text-xs text-gray-500">{participant.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Button 
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => onNavigate('video')}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Rejoindre
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => onNavigateToPrerequisites({
                        title: meeting.title,
                        date: meeting.date,
                        time: meeting.time,
                      })}
                    >
                      Détails
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Past Meetings */}
      <div>
        <h2 className="text-gray-900 mb-4">Réunions passées</h2>
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {pastMeetings.map((meeting) => (
            <div key={meeting.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-gray-900 mb-1">{meeting.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(meeting.date).toLocaleDateString('fr-FR')} à {meeting.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{meeting.participants} participants</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary">{meeting.patientCount} patient(s)</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Compte-rendu
                  </Button>
                  <Button variant="ghost" size="sm">
                    Détails
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ce mois-ci</p>
                <p className="text-gray-900">12 réunions</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Patients discutés</p>
                <p className="text-gray-900">48 dossiers</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Durée moyenne</p>
                <p className="text-gray-900">1h 45min</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}