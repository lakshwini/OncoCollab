import { useEffect, useState } from 'react';
import { Page } from '../App';
import { Calendar, FolderOpen, Video, Clock, Users, FileText, TrendingUp, Image, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { createApiUrl, createAuthHeaders } from '../config/api.config';

interface DashboardProps {
  onNavigate: (page: Page, dossierId?: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  // State for data
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
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

        // 1️⃣ Fetch dossiers
        const dossiersRes = await fetch(createApiUrl('/patients/dossiers/list'), { headers });
        if (dossiersRes.ok) {
          const dossiersData = await dossiersRes.json();
          // Remove duplicates (keep most recent)
          const uniqueDossiers = Array.from(
            new Map(dossiersData.map((d: any) => [d.patientId, d])).values()
          ).slice(0, 5); // Show last 5
          setDossiers(uniqueDossiers);
        }

        // 2️⃣ Fetch meetings
        const meetingsRes = await fetch(createApiUrl('/meetings'), { headers });
        if (meetingsRes.ok) {
          const meetingsData = await meetingsRes.json();
          setMeetings(meetingsData.slice(0, 2)); // Show next 2
        }

        // 3️⃣ Fetch stats
        const statsRes = await fetch(createApiUrl('/patients/stats/dashboard'), { headers });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const quickActions = [
    { label: 'Créer un dossier', icon: FolderOpen, action: () => onNavigate('dossiers') },
    { label: 'Planifier une RCP', icon: Calendar, action: () => onNavigate('calendrier') },
    { label: 'Accéder à l\'imagerie', icon: Image, action: () => onNavigate('dossiers') },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finished':
        return 'bg-green-100 text-green-700';
      case 'live':
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'draft':
      case 'postponed':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'scheduled': 'Programmée',
      'draft': 'Brouillon',
      'live': 'En direct',
      'postponed': 'Reportée',
      'finished': 'Terminée',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-gray-900 mb-1">Tableau de bord</h1>
        <p className="text-gray-600">Vue d'ensemble de votre activité RCP</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid - Dynamic */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Dossiers actifs</p>
                <p className="text-gray-900 text-2xl font-semibold">{stats.activeDossiers}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">RCP programmées</p>
                <p className="text-gray-900 text-2xl font-semibold">{meetings.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Video className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">En attente</p>
                <p className="text-gray-900 text-2xl font-semibold">
                  {stats.statusStats.find((s: any) => s.status === 'draft')?.count || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Participants totaux</p>
                <p className="text-gray-900 text-2xl font-semibold">{meetings.length * 3}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
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
            {meetings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucune réunion programmée</p>
              </div>
            ) : (
              <>
                {meetings.map((meeting) => (
                  <div key={meeting.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-gray-900">{meeting.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {meeting.startTime ? new Date(meeting.startTime).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          }) : 'Date non définie'}
                        </p>
                      </div>
                      <Badge className={getStatusColor(meeting.status)}>
                        {getStatusLabel(meeting.status)}
                      </Badge>
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
              </>
            )}
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
            {dossiers.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun dossier disponible</p>
              </div>
            ) : (
              <>
                {dossiers.map((dossier) => (
                  <div
                    key={dossier.patientId}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => onNavigate('dossier-detail', dossier.patientId)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-gray-900">
                          {dossier.firstName} {dossier.lastName}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">{dossier.patientNumber}</p>
                      </div>
                      {dossier.meetingStatus && (
                        <Badge className={getStatusColor(dossier.meetingStatus)}>
                          {getStatusLabel(dossier.meetingStatus)}
                        </Badge>
                      )}
                    </div>
                    {dossier.lastModified && (
                      <p className="text-xs text-gray-500">
                        Modifié le {new Date(dossier.lastModified).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onNavigate('dossiers')}
                >
                  Voir tous les dossiers
                </Button>
              </>
            )}
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
