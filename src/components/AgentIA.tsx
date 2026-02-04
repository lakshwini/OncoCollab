import { useState } from 'react';
import { Page } from '../App';
import { Bot, Send, Sparkles, Calendar, Users, FileText, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useLanguage } from '../i18n';

interface AgentIAProps {
  onNavigate: (page: Page) => void;
}

export function AgentIA({ onNavigate }: AgentIAProps) {
  const { language, t } = useLanguage();
  const [message, setMessage] = useState('');

  const suggestions = [
    {
      id: '1',
      icon: Calendar,
      title: language === 'fr' ? 'Planifier la prochaine RCP' : 'Schedule the next RCP',
      description: language === 'fr' ? 'AgentIA propose le 18 novembre à 14h selon les disponibilités' : 'AgentIA suggests November 18 at 2pm based on availability',
      action: language === 'fr' ? 'Accepter la proposition' : 'Accept the proposal',
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      id: '2',
      icon: Users,
      title: language === 'fr' ? 'Ajouter Dr. Laurent à la RCP du 11/11' : 'Add Dr. Laurent to the 11/11 RCP',
      description: language === 'fr' ? 'Son expertise en chirurgie thoracique serait pertinente pour 2 dossiers' : 'His expertise in thoracic surgery would be relevant for 2 files',
      action: language === 'fr' ? 'Ajouter le participant' : 'Add participant',
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      id: '3',
      icon: FileText,
      title: language === 'fr' ? 'Analyser l\'imagerie du patient P-2025-001' : 'Analyze patient P-2025-001 imagery',
      description: language === 'fr' ? 'Scanner thoracique prêt pour analyse automatique' : 'Thoracic CT scan ready for automatic analysis',
      action: language === 'fr' ? 'Lancer l\'analyse' : 'Start analysis',
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
  ];

  const conversationHistory = [
    {
      id: '1',
      sender: 'user',
      message: language === 'fr' ? 'Quels sont les prochains dossiers à valider ?' : 'What are the next files to validate?',
      time: '10:00',
    },
    {
      id: '2',
      sender: 'ai',
      message: language === 'fr'
        ? 'Il y a actuellement 3 dossiers en attente de validation :\n\n1. Dossier P-2025-002 (Marie Dupont) - Cancer colorectal\n2. Dossier P-2025-005 (Jean Moreau) - Lymphome\n3. Dossier P-2025-007 (Claire Bernard) - Cancer du sein\n\nSouhaitez-vous que je vous affiche les détails de l\'un de ces dossiers ?'
        : 'There are currently 3 files awaiting validation:\n\n1. File P-2025-002 (Marie Dupont) - Colorectal cancer\n2. File P-2025-005 (Jean Moreau) - Lymphoma\n3. File P-2025-007 (Claire Bernard) - Breast cancer\n\nWould you like me to show you the details of one of these files?',
      time: '10:01',
    },
  ];

  const autoReports = [
    {
      id: '1',
      title: language === 'fr' ? 'Compte-rendu RCP du 04/11/2025' : 'RCP Report 04/11/2025',
      status: language === 'fr' ? 'Généré' : 'Generated',
      statusKey: 'generated',
      patients: 6,
      date: '2025-11-04',
    },
    {
      id: '2',
      title: language === 'fr' ? 'Compte-rendu RCP du 28/10/2025' : 'RCP Report 28/10/2025',
      status: t.statuses.validated,
      statusKey: 'validated',
      patients: 4,
      date: '2025-10-28',
    },
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle send message
      setMessage('');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-gray-900">{t.agentIA.title}</h1>
            <p className="text-gray-600">{t.agentIA.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                {t.agentIA.discussionWith}
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
              {conversationHistory.map((item) => (
                <div
                  key={item.id}
                  className={`flex ${item.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${item.sender === 'user' ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-lg px-4 py-3 ${
                        item.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line">{item.message}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>

            <div className="border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <Input
                  placeholder={t.agentIA.placeholder}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleSendMessage}
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Suggestions Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.agentIA.autoSuggestions}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {suggestions.map((suggestion) => {
                const Icon = suggestion.icon;
                return (
                  <div key={suggestion.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 ${suggestion.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${suggestion.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm text-gray-900 mb-1">{suggestion.title}</h4>
                        <p className="text-xs text-gray-600">{suggestion.description}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="w-full">
                      {suggestion.action}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.agentIA.generatedReports}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {autoReports.map((report) => (
                <div key={report.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm text-gray-900">{report.title}</h4>
                    <Badge
                      variant={report.statusKey === 'validated' ? 'default' : 'secondary'}
                      className={report.statusKey === 'validated' ? 'bg-green-600' : ''}
                    >
                      {report.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    {report.patients} {t.common.patients} • {new Date(report.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                  </p>
                  {report.statusKey === 'generated' && (
                    <Button size="sm" variant="outline" className="w-full text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {t.agentIA.validateReport}
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t.agentIA.quickActions}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => onNavigate('dossiers')}
            >
              <FileText className="w-4 h-4 mr-2" />
              {t.agentIA.analyzeFile}
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => onNavigate('calendrier')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {t.agentIA.scheduleRCP}
            </Button>
            <Button
              variant="outline"
              className="justify-start"
            >
              <Users className="w-4 h-4 mr-2" />
              {t.agentIA.manageParticipants}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
