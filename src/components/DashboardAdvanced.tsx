import { Page } from '../App';
import {
  Calendar,
  FolderOpen,
  Video,
  Clock,
  Users,
  Plus,
  ArrowRight,
  Activity
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { useLanguage } from '../i18n';

interface DashboardAdvancedProps {
  onNavigate: (page: Page, dossierId?: string) => void;
}

export function DashboardAdvanced({ onNavigate }: DashboardAdvancedProps) {
  const { language, t } = useLanguage();

  const upcomingMeetings = [
    {
      id: '1',
      title: 'RCP - Patient T.D.',
      date: '2024-10-03',
      time: '09:00',
      statusKey: 'confirmed',
      participants: 4,
      cancerType: 'Thoracique'
    },
    {
      id: '2',
      title: 'RCP - Patient P.M.',
      date: '2024-10-09',
      time: '14:00',
      statusKey: 'pending',
      participants: 3,
      cancerType: 'Digestif'
    },
  ];

  const recentDossiers = [
    {
      id: 'D001',
      patientName: 'Jean Dupont',
      patientInitials: 'JD',
      type: language === 'fr' ? 'Cancer du poumon' : 'Lung cancer',
      statusKey: 'pending',
      lastModified: '15/07/2024',
      urgency: 'high'
    },
    {
      id: 'D002',
      patientName: 'Marie Curie',
      patientInitials: 'MC',
      type: language === 'fr' ? 'Cancer colorectal' : 'Colorectal cancer',
      statusKey: 'validated',
      lastModified: '14/07/2024',
      urgency: 'low'
    },
    {
      id: 'D003',
      patientName: 'Paul Lemoine',
      patientInitials: 'PL',
      type: language === 'fr' ? 'Lymphome' : 'Lymphoma',
      statusKey: 'inProgress',
      lastModified: '12/07/2024',
      urgency: 'medium'
    },
  ];

  const stats = [
    {
      labelKey: 'activeDossiers',
      value: '24',
      changeKey: 'thisMonth',
      changePrefix: '+3 ',
      icon: FolderOpen,
      color: 'text-blue-400',
      bg: 'bg-blue-600/20'
    },
    {
      labelKey: 'plannedRCP',
      value: '12',
      changeKey: 'thisWeek',
      changePrefix: '+2 ',
      icon: Video,
      color: 'text-green-400',
      bg: 'bg-green-600/20'
    },
    {
      labelKey: 'awaitingValidation',
      value: '8',
      changeKey: 'urgent',
      changePrefix: '',
      icon: Clock,
      color: 'text-yellow-400',
      bg: 'bg-yellow-600/20'
    },
    {
      labelKey: 'medicalTeam',
      value: '18',
      changeKey: 'specialists',
      changePrefix: '',
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-600/20'
    },
  ];

  const aiSuggestions = [
    {
      id: '1',
      type: 'planning',
      titleKey: 'rcpSuggested',
      descriptionKey: 'bestSlot',
      action: t.common.plan
    },
    {
      id: '2',
      type: 'analysis',
      titleKey: 'aiAnalysisAvailable',
      descriptionKey: 'imagesReadyReview',
      action: t.common.view
    },
  ];

  const getStatusLabel = (statusKey: string) => {
    const statusMap: Record<string, string> = {
      confirmed: t.dashboard.confirmed,
      pending: t.dashboard.pending,
      inProgress: t.dashboard.inProgress,
      validated: t.dashboard.validated,
    };
    return statusMap[statusKey] || statusKey;
  };

  const getStatusColor = (statusKey: string) => {
    switch (statusKey) {
      case 'validated':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inProgress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'confirmed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getDashboardText = (key: string) => {
    return (t.dashboard as Record<string, string>)[key] || key;
  };

  return (
    <div className="min-h-screen bg-[#0f1419] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white mb-1">{t.dashboard.title}</h1>
          <p className="text-gray-400">{t.dashboard.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            onClick={() => onNavigate('calendrier')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {t.dashboard.planRCP}
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => onNavigate('dossiers')}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t.dashboard.newDossier}
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
                  <p className="text-gray-400 text-sm">{getDashboardText(stat.labelKey)}</p>
                  <p className="text-white text-3xl mt-2">{stat.value}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {stat.changePrefix}{getDashboardText(stat.changeKey)}
                  </p>
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
                {t.dashboard.aiSuggestions}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {t.dashboard.aiSuggestionsDesc}
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
                      <p className="text-white">{getDashboardText(suggestion.titleKey)}</p>
                      <p className="text-sm text-gray-400 mt-1">{getDashboardText(suggestion.descriptionKey)}</p>
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
                {t.dashboard.viewAllSuggestions}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Recent Dossiers */}
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">{t.dashboard.recentDossiers}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {t.dashboard.recentDossiersDesc}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                  onClick={() => onNavigate('dossiers')}
                >
                  {t.common.viewAll}
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
                          <Badge className={getStatusColor(dossier.statusKey)}>
                            {getStatusLabel(dossier.statusKey)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{dossier.type}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {t.common.modifiedOn} {dossier.lastModified}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                    >
                      {t.common.open}
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
                {t.dashboard.upcomingRCP}
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
                        {new Date(meeting.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')} • {meeting.time}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={getStatusColor(meeting.statusKey)}
                    >
                      {getStatusLabel(meeting.statusKey)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users className="w-3 h-3" />
                    {meeting.participants} {t.common.participants}
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                onClick={() => onNavigate('calendrier')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {t.dashboard.viewCalendar}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">{t.dashboard.monthActivity}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">{t.dashboard.processedDossiers}</span>
                  <span className="text-white">18/24</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">{t.dashboard.completedRCP}</span>
                  <span className="text-white">8/12</span>
                </div>
                <Progress value={67} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">{t.dashboard.validatedReports}</span>
                  <span className="text-white">15/18</span>
                </div>
                <Progress value={83} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">{t.dashboard.systemStatus}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-300">{t.dashboard.servers}</span>
                </div>
                <span className="text-sm text-green-400">{t.dashboard.operational}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-300">{t.dashboard.backup}</span>
                </div>
                <span className="text-sm text-green-400">{t.dashboard.active}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-300">AgentIA</span>
                </div>
                <span className="text-sm text-green-400">{t.dashboard.online}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
