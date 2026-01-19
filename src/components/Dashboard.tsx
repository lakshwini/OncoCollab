import { Page } from '../App';
import { Calendar, FolderOpen, Video, Clock, Users, FileText, TrendingUp, Image } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface DashboardProps {
  onNavigate: (page: Page, dossierId?: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const upcomingMeetings = [
    {
      id: '1',
      title: 'RCP Oncologie Thoracique',
      date: '2025-11-11',
      time: '10:00',
      participants: ['Dr. Martin', 'Dr. Dubois', 'Dr. Laurent'],
    },
    {
      id: '2',
      title: 'RCP Cancers Digestifs',
      date: '2025-11-13',
      time: '14:30',
      participants: ['Dr. Chen', 'Dr. Dubois', 'Dr. Petit'],
    },
  ];

  const recentDossiers = [
    {
      id: 'D001',
      patientName: 'Martin P.',
      type: 'Cancer du poumon',
      status: 'En cours',
      lastModified: '2025-11-10',
    },
    {
      id: 'D002',
      patientName: 'Dupont M.',
      type: 'Cancer colorectal',
      status: 'En attente',
      lastModified: '2025-11-09',
    },
    {
      id: 'D003',
      patientName: 'Bernard L.',
      type: 'Cancer du sein',
      status: 'Validé',
      lastModified: '2025-11-08',
    },
  ];

  const stats = [
    { label: 'Dossiers actifs', value: '24', icon: FolderOpen, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'RCP ce mois', value: '12', icon: Video, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'En attente', value: '8', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Participants', value: '18', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  const quickActions = [
    { label: 'Créer un dossier', icon: FolderOpen, action: () => onNavigate('dossiers') },
    { label: 'Planifier une RCP', icon: Calendar, action: () => onNavigate('calendrier') },
    { label: 'Accéder à l\'imagerie', icon: Image, action: () => onNavigate('dossiers') },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Validé':
        return 'bg-green-100 text-green-700';
      case 'En cours':
        return 'bg-blue-100 text-blue-700';
      case 'En attente':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-gray-900 mb-1">Tableau de bord</h1>
        <p className="text-gray-600">Vue d'ensemble de votre activité RCP</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Meetings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Prochaines réunions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingMeetings.map((meeting) => (
              <div key={meeting.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-gray-900">{meeting.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(meeting.date).toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                      })} à {meeting.time}
                    </p>
                  </div>
                  <Badge variant="outline">{meeting.participants.length} participants</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{meeting.participants.join(', ')}</span>
                </div>
              </div>
            ))}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => onNavigate('reunions')}
            >
              Voir toutes les réunions
            </Button>
          </CardContent>
        </Card>

        {/* Recent Dossiers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Dossiers récents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentDossiers.map((dossier) => (
              <div 
                key={dossier.id} 
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => onNavigate('dossier-detail', dossier.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-gray-900">{dossier.patientName}</h4>
                    <p className="text-sm text-gray-600 mt-1">{dossier.type}</p>
                  </div>
                  <Badge className={getStatusColor(dossier.status)}>
                    {dossier.status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  Modifié le {new Date(dossier.lastModified).toLocaleDateString('fr-FR')}
                </p>
              </div>
            ))}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => onNavigate('dossiers')}
            >
              Voir tous les dossiers
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto py-4 flex flex-col gap-2"
                  onClick={action.action}
                >
                  <Icon className="w-6 h-6" />
                  <span>{action.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestion */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-gray-900 mb-1">Suggestion AgentIA</h4>
              <p className="text-sm text-gray-700 mb-3">
                AgentIA vous propose de planifier la prochaine RCP selon les disponibilités des participants.
              </p>
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => onNavigate('agentia')}
              >
                Voir les suggestions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
