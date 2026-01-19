import { Page } from '../App';
import { 
  Calendar, 
  FolderOpen, 
  Video, 
  Clock, 
  Users, 
  FileText, 
  TrendingUp, 
  Image,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Activity
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';

interface DashboardAdvancedProps {
  onNavigate: (page: Page, dossierId?: string) => void;
}

export function DashboardAdvanced({ onNavigate }: DashboardAdvancedProps) {
  const upcomingMeetings = [
    {
      id: '1',
      title: 'RCP - Patient T.D.',
      date: '2024-10-03',
      time: '09:00',
      status: 'Confirmé',
      participants: 4,
      cancerType: 'Thoracique'
    },
    {
      id: '2',
      title: 'RCP - Patient P.M.',
      date: '2024-10-09',
      time: '14:00',
      status: 'En attente',
      participants: 3,
      cancerType: 'Digestif'
    },
  ];

  const recentDossiers = [
    {
      id: 'D001',
      patientName: 'Jean Dupont',
      patientInitials: 'JD',
      type: 'Cancer du poumon',
      status: 'En attente',
      lastModified: '15/07/2024',
      urgency: 'high'
    },
    {
      id: 'D002',
      patientName: 'Marie Curie',
      patientInitials: 'MC',
      type: 'Cancer colorectal',
      status: 'Validé',
      lastModified: '14/07/2024',
      urgency: 'low'
    },
    {
      id: 'D003',
      patientName: 'Paul Lemoine',
      patientInitials: 'PL',
      type: 'Lymphome',
      status: 'En cours',
      lastModified: '12/07/2024',
      urgency: 'medium'
    },
  ];

  const stats = [
    { 
      label: 'Dossiers actifs', 
      value: '24', 
      change: '+3 ce mois',
      icon: FolderOpen, 
      color: 'text-blue-400', 
      bg: 'bg-blue-600/20' 
    },
    { 
      label: 'RCP planifiées', 
      value: '12', 
      change: '+2 cette semaine',
      icon: Video, 
      color: 'text-green-400', 
      bg: 'bg-green-600/20' 
    },
    { 
      label: 'En attente validation', 
      value: '8', 
      change: 'Urgent',
      icon: Clock, 
      color: 'text-yellow-400', 
      bg: 'bg-yellow-600/20' 
    },
    { 
      label: 'Équipe médicale', 
      value: '18', 
      change: 'Spécialistes',
      icon: Users, 
      color: 'text-purple-400', 
      bg: 'bg-purple-600/20' 
    },
  ];

  const aiSuggestions = [
    {
      id: '1',
      type: 'planning',
      title: 'RCP suggérée pour 3 nouveaux dossiers',
      description: 'Meilleur créneau: Mercredi 16 Oct à 10:00',
      action: 'Planifier'
    },
    {
      id: '2',
      type: 'analysis',
      title: 'Analyse IA disponible',
      description: '2 imageries prêtes pour revue automatique',
      action: 'Voir'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Validé':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'En cours':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'En attente':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1419] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white mb-1">Tableau de bord</h1>
          <p className="text-gray-400">Vue d'ensemble de votre activité RCP</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            onClick={() => onNavigate('calendrier')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Planifier une RCP
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => onNavigate('dossiers')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau dossier
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-[#1a1f2e] border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-white text-3xl mt-2">{stat.value}</p>
                  <p className="text-gray-500 text-xs mt-1">{stat.change}</p>
                </div>
                <div className={`w-14 h-14 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-7 h-7 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Suggestions */}
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Suggestions AgentIA
              </CardTitle>
              <CardDescription className="text-gray-400">
                Recommandations intelligentes pour optimiser votre workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiSuggestions.map((suggestion) => (
                <div 
                  key={suggestion.id}
                  className="p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors cursor-pointer border border-blue-800/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-white">{suggestion.title}</p>
                      <p className="text-sm text-gray-400 mt-1">{suggestion.description}</p>
                    </div>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 ml-4">
                      {suggestion.action}
                    </Button>
                  </div>
                </div>
              ))}
              <Button 
                variant="link" 
                className="w-full text-blue-400 hover:text-blue-300"
                onClick={() => onNavigate('agentia')}
              >
                Voir toutes les suggestions
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Recent Dossiers */}
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Dossiers récents</CardTitle>
                  <CardDescription className="text-gray-400">
                    Vos derniers dossiers patients
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                  onClick={() => onNavigate('dossiers')}
                >
                  Voir tout
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentDossiers.map((dossier) => (
                <div 
                  key={dossier.id}
                  className="p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors cursor-pointer"
                  onClick={() => onNavigate('dossier-detail', dossier.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12 bg-blue-600">
                        <AvatarFallback className="bg-blue-600 text-white">
                          {dossier.patientInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white">{dossier.patientName}</p>
                          <Badge className={getStatusColor(dossier.status)}>
                            {dossier.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{dossier.type}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Modifié le {dossier.lastModified}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                    >
                      Ouvrir
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Meetings */}
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-400" />
                Prochaines RCP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingMeetings.map((meeting) => (
                <div 
                  key={meeting.id}
                  className="p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors cursor-pointer"
                  onClick={() => onNavigate('reunions')}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-white text-sm">{meeting.title}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(meeting.date).toLocaleDateString('fr-FR')} • {meeting.time}
                      </p>
                    </div>
                    <Badge 
                      variant="secondary"
                      className={
                        meeting.status === 'Confirmé' 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }
                    >
                      {meeting.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users className="w-3 h-3" />
                    {meeting.participants} participants
                  </div>
                </div>
              ))}
              <Button 
                variant="outline" 
                className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                onClick={() => onNavigate('calendrier')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Voir le calendrier
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Activité du mois</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">Dossiers traités</span>
                  <span className="text-white">18/24</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">RCP complétées</span>
                  <span className="text-white">8/12</span>
                </div>
                <Progress value={67} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">Rapports validés</span>
                  <span className="text-white">15/18</span>
                </div>
                <Progress value={83} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">État du système</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-300">Serveurs</span>
                </div>
                <span className="text-sm text-green-400">Opérationnel</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-300">Sauvegarde</span>
                </div>
                <span className="text-sm text-green-400">Actif</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-300">AgentIA</span>
                </div>
                <span className="text-sm text-green-400">En ligne</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
