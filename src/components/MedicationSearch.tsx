import { useState } from 'react';
import { 
  Search, 
  Pill, 
  Send,
  AlertCircle,
  Info,
  ExternalLink,
  BookOpen,
  Sparkles,
  Clock,
  Filter
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  metadata?: {
    medicationName?: string;
    contraindications?: string[];
    interactions?: string[];
    dosage?: string;
  };
}

const suggestedQueries = [
  "Interactions du Cisplatine avec d'autres médicaments",
  "Effets secondaires du Paclitaxel",
  "Dosage recommandé pour le 5-FU",
  "Alternatives au Doxorubicine",
  "Protocole FOLFOX en oncologie",
];

const mockMessages: Message[] = [
  {
    id: '1',
    type: 'ai',
    content: "Bonjour ! Je suis votre assistant IA spécialisé en pharmacologie oncologique. Posez-moi vos questions sur les médicaments, leurs interactions, dosages, ou protocoles de chimiothérapie.",
    timestamp: '10:00',
  },
];

export function MedicationSearch() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: `msg-${Date.now() + 1}`,
        type: 'ai',
        content: generateMockResponse(inputValue),
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        metadata: {
          medicationName: 'Cisplatine',
          contraindications: ['Insuffisance rénale sévère', 'Myélosuppression sévère', 'Grossesse'],
          interactions: ['Aminoglycosides', 'Diurétiques de l\'anse', 'Vaccins vivants'],
          dosage: '50-100 mg/m² en perfusion IV toutes les 3-4 semaines',
        },
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const generateMockResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('cisplatine') || lowerQuery.includes('interaction')) {
      return `Le **Cisplatine** est un agent alkylant platine largement utilisé dans le traitement de divers cancers.\n\n**Informations importantes :**\n\n• **Mécanisme d'action** : Forme des adduits avec l'ADN, inhibant la réplication cellulaire\n• **Indications** : Cancers testiculaires, ovariens, vésicaux, pulmonaires\n• **Voie d'administration** : Perfusion intraveineuse\n• **Surveillance** : Fonction rénale, audition, numération formule sanguine\n\n⚠️ **Précautions importantes** :\n- Hydratation préalable obligatoire\n- Surveillance de la néphrotoxicité\n- Risque d'ototoxicité\n\nSouhaitez-vous plus d'informations sur les interactions médicamenteuses ou le protocole d'administration ?`;
    }
    
    if (lowerQuery.includes('paclitaxel') || lowerQuery.includes('effet')) {
      return `Le **Paclitaxel** (Taxol) est un agent antimicrotubulaire de la famille des taxanes.\n\n**Effets secondaires principaux :**\n\n🔴 **Fréquents (>10%)** :\n• Myélosuppression (neutropénie sévère)\n• Neuropathie périphérique\n• Alopécie\n• Nausées et vomissements\n• Arthralgies et myalgies\n\n🟡 **Occasionnels (1-10%)** :\n• Réactions d'hypersensibilité\n• Bradycardie\n• Mucite\n\n**Gestion des effets secondaires** :\n- Prémédication obligatoire (corticoïdes, antihistaminiques)\n- G-CSF si neutropénie sévère\n- Surveillance cardiaque\n\nBesoin d'informations sur le dosage ou les alternatives ?`;
    }

    return `Je recherche des informations sur votre question concernant : "${query}".\n\nEn tant qu'assistant IA, je peux vous fournir des informations sur :\n\n• Mécanismes d'action des médicaments\n• Interactions médicamenteuses\n• Effets secondaires et leur gestion\n• Dosages et protocoles standards\n• Contre-indications\n• Alternatives thérapeutiques\n\n**Note** : Cette plateforme intégrera prochainement une base de données complète via le projet de scraping médical. Les informations fournies sont à titre informatif et ne remplacent pas l'avis d'un pharmacien ou d'un médecin.\n\nPouvez-vous préciser votre question ?`;
  };

  const handleSuggestedQuery = (query: string) => {
    setInputValue(query);
  };

  return (
    <div className="h-full bg-[#0f1419] flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl text-white">Recherche de Médicaments</h1>
              <p className="text-sm text-gray-400">Assistant IA spécialisé en pharmacologie oncologique</p>
            </div>
          </div>
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by IA
          </Badge>
        </div>

        <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-blue-300 mb-1">Section dédiée au projet de scraping médical</p>
            <p className="text-blue-400/70">
              Cette interface sera connectée à une base de données professionnelle de médicaments. 
              Les informations actuelles sont des exemples à des fins de démonstration.
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <Avatar className={`w-10 h-10 flex-shrink-0 ${
                  message.type === 'ai' ? 'bg-gradient-to-br from-green-600 to-emerald-600' : 'bg-blue-600'
                }`}>
                  <AvatarFallback className={message.type === 'ai' ? 'bg-transparent' : 'bg-blue-600'}>
                    {message.type === 'ai' ? (
                      <Pill className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-white">Vous</span>
                    )}
                  </AvatarFallback>
                </Avatar>

                {/* Message Content */}
                <div className={`flex-1 max-w-3xl ${message.type === 'user' ? 'flex justify-end' : ''}`}>
                  <div className={`rounded-2xl p-4 ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-900 border border-gray-800'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm opacity-80">
                        {message.type === 'ai' ? 'Assistant IA Médicaments' : 'Vous'}
                      </span>
                      <span className="text-xs opacity-60">{message.timestamp}</span>
                    </div>
                    
                    <div className="whitespace-pre-line text-sm leading-relaxed">
                      {message.content}
                    </div>

                    {/* Metadata Card */}
                    {message.metadata && (
                      <div className="mt-4 space-y-3 pt-4 border-t border-gray-800">
                        <div className="bg-gray-800/50 rounded-lg p-3">
                          <h4 className="text-sm text-blue-400 mb-2">Informations clés</h4>
                          
                          {message.metadata.dosage && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-500 mb-1">Dosage standard :</p>
                              <p className="text-sm text-gray-300">{message.metadata.dosage}</p>
                            </div>
                          )}

                          {message.metadata.contraindications && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Contre-indications :
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {message.metadata.contraindications.map((item, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs border-red-800 text-red-400">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {message.metadata.interactions && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Interactions principales :</p>
                              <div className="flex flex-wrap gap-1">
                                {message.metadata.interactions.map((item, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs border-yellow-800 text-yellow-400">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <Button size="sm" variant="outline" className="w-full border-gray-700 text-gray-400 hover:text-white">
                          <BookOpen className="w-4 h-4 mr-2" />
                          Voir la fiche complète
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4">
                <Avatar className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600">
                  <AvatarFallback className="bg-transparent">
                    <Pill className="w-5 h-5 text-white" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm text-gray-400">Recherche en cours...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Suggested Queries */}
        {messages.length <= 1 && (
          <div className="px-6 pb-4">
            <div className="max-w-4xl mx-auto">
              <p className="text-sm text-gray-500 mb-3">Suggestions de recherche :</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQueries.map((query, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestedQuery(query)}
                    className="border-gray-800 text-gray-400 hover:text-white hover:border-blue-600"
                  >
                    {query}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        <Separator className="bg-gray-800" />

        {/* Input Area */}
        <div className="p-6 bg-[#0f1419]">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Posez votre question sur un médicament, protocole ou interaction..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="pl-11 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 h-12"
                />
              </div>
              <Button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 h-12 px-6"
              >
                <Send className="w-4 h-4 mr-2" />
                Envoyer
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Les informations fournies sont à titre indicatif et ne remplacent pas l'avis d'un professionnel de santé.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
