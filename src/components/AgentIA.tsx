import { useState } from 'react';
import { Page } from '../App';
import { Bot, Send, Sparkles, Calendar, Users, FileText, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface AgentIAProps {
  onNavigate: (page: Page) => void;
}

export function AgentIA({ onNavigate }: AgentIAProps) {
  const [message, setMessage] = useState('');

  const suggestions = [
    {
      id: '1',
      icon: Calendar,
      title: 'Planifier la prochaine RCP',
      description: 'AgentIA propose le 18 novembre à 14h selon les disponibilités',
      action: 'Accepter la proposition',
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      id: '2',
      icon: Users,
      title: 'Ajouter Dr. Laurent à la RCP du 11/11',
      description: 'Son expertise en chirurgie thoracique serait pertinente pour 2 dossiers',
      action: 'Ajouter le participant',
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      id: '3',
      icon: FileText,
      title: 'Analyser l\'imagerie du patient P-2025-001',
      description: 'Scanner thoracique prêt pour analyse automatique',
      action: 'Lancer l\'analyse',
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
  ];

  const conversationHistory = [
    {
      id: '1',
      sender: 'user',
      message: 'Quels sont les prochains dossiers à valider ?',
      time: '10:00',
    },
    {
      id: '2',
      sender: 'ai',
      message: 'Il y a actuellement 3 dossiers en attente de validation :\n\n1. Dossier P-2025-002 (Marie Dupont) - Cancer colorectal\n2. Dossier P-2025-005 (Jean Moreau) - Lymphome\n3. Dossier P-2025-007 (Claire Bernard) - Cancer du sein\n\nSouhaitez-vous que je vous affiche les détails de l\'un de ces dossiers ?',
      time: '10:01',
    },
  ];

  const autoReports = [
    {
      id: '1',
      title: 'Compte-rendu RCP du 04/11/2025',
      status: 'Généré',
      patients: 6,
      date: '2025-11-04',
    },
    {
      id: '2',
      title: 'Compte-rendu RCP du 28/10/2025',
      status: 'Validé',
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
            <h1 className="text-gray-900">AgentIA</h1>
            <p className="text-gray-600">Assistant intelligent pour vos RCP</p>
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
                Discussion avec AgentIA
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
                  placeholder="Posez une question à AgentIA..."
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
              <CardTitle>Suggestions automatiques</CardTitle>
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
              <CardTitle>Rapports générés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {autoReports.map((report) => (
                <div key={report.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm text-gray-900">{report.title}</h4>
                    <Badge 
                      variant={report.status === 'Validé' ? 'default' : 'secondary'}
                      className={report.status === 'Validé' ? 'bg-green-600' : ''}
                    >
                      {report.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    {report.patients} patient(s) • {new Date(report.date).toLocaleDateString('fr-FR')}
                  </p>
                  {report.status === 'Généré' && (
                    <Button size="sm" variant="outline" className="w-full text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Valider le rapport
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
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => onNavigate('dossiers')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Analyser un dossier
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => onNavigate('calendrier')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Planifier une RCP
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
            >
              <Users className="w-4 h-4 mr-2" />
              Gérer les participants
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
