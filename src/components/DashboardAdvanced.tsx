import { useEffect, useState } from 'react';
import { Page } from '../App';
import {
  Calendar,
  FolderOpen,
  Video,
  Clock,
  Users,
  Plus,
  ArrowRight,
  Activity,
  AlertCircle,
  Loader
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { useLanguage } from '../i18n';
import { createApiUrl, createAuthHeaders } from '../config/api.config';

interface DashboardAdvancedProps {
  onNavigate: (page: Page, dossierId?: string) => void;
}

export function DashboardAdvanced({ onNavigate }: DashboardAdvancedProps) {
  const { language, t } = useLanguage();
  
  const [meetings, setMeetings] = useState<any[]>([]);
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [stats, setStats] = useState({ activeDossiers: 0, statusStats: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('onco_collab_token');
        if (!token) {
          setError('Non authentifié');
          return;
        }

        const headers = createAuthHeaders(token);

        // Fetch meetings
        const meetingsRes = await fetch(createApiUrl('/meetings'), { headers });
        if (meetingsRes.ok) {
          const meetingsData = await meetingsRes.json();
          setMeetings(meetingsData.slice(0, 3)); // Show up to 3
        }

        // Fetch dossiers
        const dossiersRes = await fetch(createApiUrl('/patients/dossiers/list'), { headers });
        if (dossiersRes.ok) {
          const dossiersData = await dossiersRes.json();
          const uniqueDossiers = Array.from(
            new Map(dossiersData.map((d: any) => [d.patientId, d])).values()
          ).slice(0, 3); // Show up to 3
          setDossiers(uniqueDossiers);
        }

        // Fetch stats
        const statsRes = await fetch(createApiUrl('/patients/stats/dashboard'), { headers });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      labelKey: 'activeDossiers',
      value: stats.activeDossiers,
      changeKey: 'thisMonth',
      changePrefix: '0 ',
      icon: FolderOpen,
      color: 'text-blue-400',
      bg: 'bg-blue-600/20'
    },
    {
      labelKey: 'plannedRCP',
      value: meetings.length,
      changeKey: 'thisWeek',
      changePrefix: '0 ',
      icon: Video,
      color: 'text-green-400',
      bg: 'bg-green-600/20'
    },
    {
      labelKey: 'awaitingValidation',
      value: stats.statusStats.find((s: any) => s.status === 'draft')?.count || 0,
      changeKey: 'urgent',
      changePrefix: '',
      icon: Clock,
      color: 'text-yellow-400',
      bg: 'bg-yellow-600/20'
    },
    {
      labelKey: 'medicalTeam',
      value: meetings.length > 0 ? meetings.length * 3 : 0,
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
      scheduled: t.dashboard.confirmed,
      draft: t.dashboard.pending,
      live: t.dashboard.inProgress,
      finished: t.dashboard.validated,
    };
    return statusMap[statusKey] || statusKey;
  };

  const getStatusColor = (statusKey: string) => {
    switch (statusKey) {
      case 'validated':
      case 'finished':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inProgress':
      case 'live':
      case 'scheduled':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'pending':
      case 'draft':
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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419] p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

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

      {/* Error Alert */}
      {error && (
        <Card className="bg-red-500/20 border-red-500/30">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
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

          {/* Recent Dossiers - DYNAMIC */}
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
              {dossiers.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Aucun dossier disponible</p>
                </div>
              ) : (
                dossiers.map((dossier) => (
                  <div
                    key={dossier.patientId}
                    className="p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors cursor-pointer"
                    onClick={() => onNavigate('dossier-detail', dossier.patientId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12 bg-blue-600">
                          <AvatarFallback className="bg-blue-600 text-white">
                            {getInitials(dossier.firstName, dossier.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white">{dossier.firstName} {dossier.lastName}</p>
                            {dossier.meetingStatus && (
                              <Badge className={getStatusColor(dossier.meetingStatus)}>
                                {getStatusLabel(dossier.meetingStatus)}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mt-1">{dossier.patientNumber}</p>
                          {dossier.lastModified && (
                            <p className="text-xs text-gray-500 mt-1">
                              {t.common.modifiedOn} {new Date(dossier.lastModified).toLocaleDateString('fr-FR')}
                            </p>
                          )}
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
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Meetings - DYNAMIC */}
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-400" />
                {t.dashboard.upcomingRCP}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {meetings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Aucune réunion programmée</p>
                </div>
              ) : (
                <>
                  {meetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors cursor-pointer"
                      onClick={() => onNavigate('reunions')}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-white text-sm">{meeting.title}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {meeting.startTime ? new Date(meeting.startTime).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : 'Date non définie'}
                          </p>
                        </div>
                        {meeting.status && (
                          <Badge
                            variant="secondary"
                            className={getStatusColor(meeting.status)}
                          >
                            {getStatusLabel(meeting.status)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
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



        </div>
      </div>
    </div>
  );
}
