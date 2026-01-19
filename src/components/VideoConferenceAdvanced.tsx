import { useState } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  Share2, 
  MessageSquare,
  Users,
  Send,
  Paperclip,
  FileText,
  FolderOpen,
  PenTool,
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Download,
  ChevronRight,
  ChevronDown,
  File,
  CheckCircle2,
  Clock,
  Filter
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { ParticipantCard, type ParticipantWithPrerequisites, type Prerequisite } from './ParticipantCard';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from './ui/dropdown-menu';

interface VideoConferenceAdvancedProps {
  onClose: () => void;
  patientName?: string;
  meetingTitle?: string;
}

export function VideoConferenceAdvanced({ 
  onClose,
  patientName = "Mme. Dupont",
  meetingTitle = "RCP - Mme. Dupont"
}: VideoConferenceAdvancedProps) {
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('chat');
  const [chatMessage, setChatMessage] = useState('');
  const [selectedTool, setSelectedTool] = useState<'cursor' | 'pen' | 'text' | 'rectangle' | 'circle'>('cursor');
  const [showImagery, setShowImagery] = useState(true);
  const [documentsPanelOpen, setDocumentsPanelOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantWithPrerequisites | null>(null);
  const [showParticipantCard, setShowParticipantCard] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  const participants: ParticipantWithPrerequisites[] = [
    { 
      id: '1', 
      name: 'Vous (Dr. Martin)', 
      role: 'Radiologue', 
      initials: 'DM', 
      active: true, 
      micOn: true, 
      videoOn: true, 
      status: 'En ligne',
      email: 'a.martin@oncollab.fr',
      specialization: 'Imagerie médicale',
      prerequisites: [
        { id: 'p1-1', title: 'Consulter le dossier patient', description: 'Révision complète du dossier médical', status: 'completed', category: 'Préparation générale' },
        { id: 'p1-2', title: 'Analyser IRM cérébrale', description: 'Examen du 12/05/24', status: 'completed', category: 'Examens médicaux' },
        { id: 'p1-3', title: 'Préparer les annotations', description: 'Zones suspectes à signaler', status: 'completed', category: 'Examens médicaux' },
      ]
    },
    { 
      id: '2', 
      name: 'Dr. Bernard', 
      role: 'Oncologue', 
      initials: 'DB', 
      active: true, 
      micOn: true, 
      videoOn: false, 
      status: 'En ligne',
      email: 's.bernard@oncollab.fr',
      specialization: 'Oncologie médicale',
      prerequisites: [
        { id: 'p2-1', title: 'Consulter le dossier patient', description: 'Révision complète du dossier médical', status: 'completed', category: 'Préparation générale' },
        { id: 'p2-2', title: 'Analyser les bilans biologiques', description: 'Résultats du 10/05/24', status: 'completed', category: 'Examens médicaux' },
        { id: 'p2-3', title: 'Préparer protocole de traitement', description: 'Recommandations thérapeutiques', status: 'pending', category: 'Recommandations' },
        { id: 'p2-4', title: 'Mise à jour du compte-rendu', description: 'Synthèse des consultations', status: 'pending', category: 'Documentation' },
      ]
    },
    { 
      id: '3', 
      name: 'Dr. Lefevre', 
      role: 'Chirurgien', 
      initials: 'DL', 
      active: true, 
      micOn: false, 
      videoOn: true, 
      status: 'En ligne',
      email: 'p.lefevre@oncollab.fr',
      specialization: 'Chirurgie oncologique',
      prerequisites: [
        { id: 'p3-1', title: 'Consulter le dossier patient', description: 'Révision complète du dossier médical', status: 'completed', category: 'Préparation générale' },
        { id: 'p3-2', title: 'Évaluer la faisabilité chirurgicale', description: 'Analyse des images et du bilan', status: 'completed', category: 'Recommandations' },
        { id: 'p3-3', title: 'Préparer les options opératoires', description: 'Différentes approches chirurgicales', status: 'completed', category: 'Recommandations' },
      ]
    },
    { 
      id: '4', 
      name: 'Dr. Moreau', 
      role: 'Pathologiste', 
      initials: 'DM', 
      active: true, 
      micOn: true, 
      videoOn: true, 
      status: 'En ligne',
      email: 'l.moreau@oncollab.fr',
      specialization: 'Anatomopathologie',
      prerequisites: [
        { id: 'p4-1', title: 'Consulter le dossier patient', description: 'Révision complète du dossier médical', status: 'completed', category: 'Préparation générale' },
        { id: 'p4-2', title: 'Analyser la biopsie', description: 'Examen histologique complet', status: 'completed', category: 'Examens médicaux' },
        { id: 'p4-3', title: 'Rédiger le compte-rendu anatomopathologique', description: 'Synthèse des résultats', status: 'completed', category: 'Documentation' },
      ]
    },
    { 
      id: '5', 
      name: 'Dr. Rossi', 
      role: 'Radiologue', 
      initials: 'DR', 
      active: true, 
      micOn: true, 
      videoOn: true, 
      status: 'En ligne',
      email: 'm.rossi@oncollab.fr',
      specialization: 'Médecine nucléaire',
      prerequisites: [
        { id: 'p5-1', title: 'Consulter le dossier patient', description: 'Révision complète du dossier médical', status: 'pending', category: 'Préparation générale' },
        { id: 'p5-2', title: 'Analyser TEP Scan', description: 'Examen du 02/05/24', status: 'completed', category: 'Examens médicaux' },
        { id: 'p5-3', title: 'Préparer la synthèse imagerie', description: 'Comparaison avec examens antérieurs', status: 'pending', category: 'Examens médicaux' },
      ]
    },
    { 
      id: '6', 
      name: 'Dr. Benali', 
      role: 'Oncologue', 
      initials: 'SB', 
      active: true, 
      micOn: true, 
      videoOn: false, 
      status: 'En ligne',
      email: 's.benali@oncollab.fr',
      specialization: 'Radiothérapie',
      prerequisites: [
        { id: 'p6-1', title: 'Consulter le dossier patient', description: 'Révision complète du dossier médical', status: 'completed', category: 'Préparation générale' },
        { id: 'p6-2', title: 'Évaluer les possibilités de radiothérapie', description: 'Analyse du volume tumoral', status: 'pending', category: 'Recommandations' },
      ]
    },
  ];

  const chatMessages = [
    { id: '1', user: 'Dr. Bernard', time: '10:05', message: 'Bonjour à tous. Concentrons-nous sur la lésion visible sur la coupe axiale 12.' },
    { id: '2', user: 'Vous', time: '10:06', message: "Bien reçu. J'affiche l'image et j'annote la zone en question." },
  ];

  const imageryFiles = [
    { id: '1', name: 'IRM cérébrale 12/05/24', type: 'IRM', status: 'Ouvert', doctor: 'Dr. Martin' },
    { id: '2', name: 'TEP Scan 02/05/24', type: 'TEP', status: 'Actif', doctor: 'Dr. Rossi' },
    { id: '3', name: 'Biopsie_Path.docx', type: 'Document', status: 'Ouvert', doctor: '' },
  ];

  const documents = [
    { id: '1', name: 'Compte-rendu anatomopathologique', owner: 'Dr. Moreau', shared: true },
    { id: '2', name: 'Rapport de biopsie', owner: 'Dr. Bernard', shared: true },
    { id: '3', name: 'Protocole de chimiothérapie - H. Langevin', owner: 'Dr. Lefevre', shared: false },
  ];

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      setChatMessage('');
    }
  };

  const handleOpenParticipantCard = (participant: ParticipantWithPrerequisites) => {
    setSelectedParticipant(participant);
    setShowParticipantCard(true);
  };

  // Get unique roles for filter
  const uniqueRoles = Array.from(new Set(participants.map(p => p.role)));
  
  // Filter participants by role
  const filteredParticipants = roleFilter 
    ? participants.filter(p => p.role === roleFilter)
    : participants;

  // Calculate readiness for each participant
  const getParticipantReadiness = (participant: ParticipantWithPrerequisites) => {
    const completed = participant.prerequisites.filter(p => p.status === 'completed').length;
    const total = participant.prerequisites.length;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  return (
    <div className="fixed inset-0 bg-[#1a1f2e] z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#0f1419] px-6 py-3 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-white text-sm">OncoFlow</span>
          </div>
          <Separator orientation="vertical" className="h-6 bg-gray-700" />
          <div>
            <h2 className="text-white text-sm">{meetingTitle}</h2>
            <p className="text-xs text-gray-400">18/06/2024 • <span className="text-green-400">⏱ 00:14:32</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-800">
            <Users className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-gray-800">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Patient Info & Documents */}
        <div className="w-60 bg-[#0f1419] border-r border-gray-800 flex flex-col">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-12 h-12 bg-blue-600">
                <AvatarFallback className="bg-blue-600 text-white">MD</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white text-sm">{patientName}</p>
                <p className="text-xs text-gray-400">ID: 789456123</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Infos Patient
              </button>
              <button className="w-full text-left px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Documents
              </button>
              <button className="w-full text-left px-3 py-2 rounded text-sm bg-blue-900/30 text-blue-300 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Examens
              </button>
              <button className="w-full text-left px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-2">
                <Users className="w-4 h-4" />
                Historique
              </button>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          <ScrollArea className="flex-1 p-3">
            <div className="space-y-1">
              <div className="text-xs text-gray-500 px-2 mb-2">Rechercher un examen...</div>
              {imageryFiles.map((file) => (
                <div
                  key={file.id}
                  className={`p-2 rounded text-xs hover:bg-gray-800 cursor-pointer transition-colors ${
                    file.status === 'Ouvert' ? 'bg-blue-900/20 border border-blue-800' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white truncate">{file.name}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{file.doctor}</p>
                      <Badge variant="secondary" className="mt-1 text-xs py-0 px-1 h-auto">
                        {file.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Center - Video/Imagery Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          {showImagery && (
            <div className="bg-[#0f1419] px-4 py-2 flex items-center gap-2 border-b border-gray-800">
              <div className="flex items-center gap-1 bg-gray-800 rounded p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${selectedTool === 'cursor' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setSelectedTool('cursor')}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${selectedTool === 'pen' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setSelectedTool('pen')}
                >
                  <PenTool className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${selectedTool === 'text' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setSelectedTool('text')}
                >
                  <Type className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${selectedTool === 'rectangle' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setSelectedTool('rectangle')}
                >
                  <Square className="w-4 h-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6 bg-gray-700" />

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1"></div>

              <div className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded text-xs flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                Suggestion IA : Zone suspecte détectée
              </div>
            </div>
          )}

          <div className="flex-1 p-6 flex gap-4 overflow-hidden">
            {/* Main Display - Imagery or Video */}
            <div className="flex-1 flex flex-col gap-3">
              {/* Main imagery/video */}
              <div className="flex-1 bg-black rounded-lg overflow-hidden relative">
                {showImagery ? (
                  <div className="w-full h-full flex items-center justify-center">
                    {/* Medical imaging placeholder - brain scan */}
                    <div className="relative w-full h-full flex items-center justify-center p-8">
                      <div className="relative w-full max-w-2xl aspect-square">
                        {/* Brain scan circle */}
                        <div className="absolute inset-0 rounded-full border-4 border-cyan-500/50 bg-gradient-to-br from-slate-900 via-blue-900/30 to-slate-900">
                          {/* Inner brain structure */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4">
                            <svg viewBox="0 0 200 200" className="w-full h-full">
                              {/* Brain illustration */}
                              <ellipse cx="100" cy="100" rx="70" ry="80" fill="none" stroke="rgba(96, 165, 250, 0.3)" strokeWidth="2"/>
                              <path d="M 100 30 Q 140 50 140 100 Q 140 150 100 170 Q 60 150 60 100 Q 60 50 100 30" fill="rgba(59, 130, 246, 0.2)" stroke="rgba(96, 165, 250, 0.5)" strokeWidth="1.5"/>
                              
                              {/* Annotation area */}
                              <circle cx="120" cy="90" r="20" fill="none" stroke="#22d3ee" strokeWidth="2" strokeDasharray="3,3"/>
                              <line x1="140" y1="80" x2="170" y2="60" stroke="#22d3ee" strokeWidth="1.5"/>
                            </svg>
                          </div>
                        </div>
                        
                        {/* Thumbnails on right */}
                        <div className="absolute right-0 top-0 bottom-0 w-24 flex flex-col gap-2 p-2">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className={`aspect-square rounded border-2 ${i === 1 ? 'border-cyan-400' : 'border-gray-700'} bg-slate-800/50 cursor-pointer hover:border-cyan-500 transition-colors`}>
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full border border-cyan-600/30 bg-blue-900/20"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-white text-2xl">VR</span>
                      </div>
                      <p className="text-white">Vous (Radiologue)</p>
                      <p className="text-gray-400 text-sm">En ligne</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Participant videos */}
              <div className="grid grid-cols-3 gap-2 h-28">
                {participants.slice(1).map((participant) => (
                  <div key={participant.id} className="bg-[#0f1419] rounded-lg overflow-hidden relative border border-gray-800">
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                      <Avatar className="w-12 h-12 bg-gray-700 mb-1">
                        <AvatarFallback className="bg-gray-700 text-white text-sm">{participant.initials}</AvatarFallback>
                      </Avatar>
                      <p className="text-white text-xs text-center truncate w-full">{participant.name}</p>
                      <p className="text-gray-500 text-xs">{participant.role}</p>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1">
                      {!participant.micOn && (
                        <div className="w-5 h-5 bg-red-500/80 rounded-full flex items-center justify-center">
                          <MicOff className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {!participant.videoOn && (
                        <div className="w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center">
                          <VideoOff className="w-3 h-3 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Chat & Participants */}
        {showSidebar && (
          <div className="w-80 bg-[#0f1419] border-l border-gray-800 flex flex-col">
            <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-4 bg-transparent border-b border-gray-800 rounded-none h-12">
                <TabsTrigger value="chat" className="data-[state=active]:bg-gray-800 text-gray-400 data-[state=active]:text-white rounded-none">
                  <MessageSquare className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="participants" className="data-[state=active]:bg-gray-800 text-gray-400 data-[state=active]:text-white rounded-none">
                  <Users className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="docs" className="data-[state=active]:bg-gray-800 text-gray-400 data-[state=active]:text-white rounded-none">
                  <FileText className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="share" className="data-[state=active]:bg-gray-800 text-gray-400 data-[state=active]:text-white rounded-none">
                  <Share2 className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
                <div className="p-4 border-b border-gray-800">
                  <h3 className="text-white text-sm">Chat de la réunion</h3>
                  <p className="text-xs text-gray-500 mt-1">Les messages sont archivés par dossier</p>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white">{msg.user}</span>
                          <span className="text-xs text-gray-500">{msg.time}</span>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-3">
                          <p className="text-sm text-gray-300">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="p-4 border-t border-gray-800">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white h-9 w-9">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Input
                      placeholder="Écrire un message..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                    />
                    <Button 
                      size="icon" 
                      className="bg-blue-600 hover:bg-blue-700 h-9 w-9"
                      onClick={handleSendMessage}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="participants" className="flex-1 mt-0 overflow-hidden">
                <div className="p-4 border-b border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white text-sm">Participants ({filteredParticipants.length})</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-sm transition-all h-7 px-2 text-gray-400 hover:text-white hover:bg-gray-800">
                        <Filter className="w-3 h-3" />
                        {roleFilter || 'Tous'}
                        <ChevronDown className="w-3 h-3" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1a1f2e] border-gray-700">
                        <DropdownMenuLabel className="text-gray-400 text-xs">Filtrer par rôle</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuItem 
                          onClick={() => setRoleFilter(null)}
                          className="text-white hover:bg-gray-800 cursor-pointer"
                        >
                          Tous les participants ({participants.length})
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        {uniqueRoles.map((role) => {
                          const count = participants.filter(p => p.role === role).length;
                          return (
                            <DropdownMenuItem 
                              key={role}
                              onClick={() => setRoleFilter(role)}
                              className="text-white hover:bg-gray-800 cursor-pointer"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>{role}</span>
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  {count}
                                </Badge>
                              </div>
                            </DropdownMenuItem>
                          );
                        })} 
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {roleFilter && (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {roleFilter}
                      </Badge>
                      <button 
                        onClick={() => setRoleFilter(null)}
                        className="text-xs text-gray-500 hover:text-gray-300"
                      >
                        Effacer le filtre
                      </button>
                    </div>
                  )}
                </div>
                
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-3">
                    {filteredParticipants.map((p) => {
                      const readiness = getParticipantReadiness(p);
                      const isReady = readiness === 100;
                      
                      return (
                        <div 
                          key={p.id} 
                          className="p-3 rounded hover:bg-gray-800 transition-colors cursor-pointer border border-transparent hover:border-gray-700"
                          onClick={() => handleOpenParticipantCard(p)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="relative">
                                <Avatar className="w-10 h-10 bg-blue-600">
                                  <AvatarFallback className="bg-blue-600 text-white text-sm">{p.initials}</AvatarFallback>
                                </Avatar>
                                {/* Readiness indicator */}
                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#0f1419] flex items-center justify-center ${
                                  isReady ? 'bg-green-500' : 'bg-amber-500'
                                }`}>
                                  {isReady ? (
                                    <CheckCircle2 className="w-3 h-3 text-white" />
                                  ) : (
                                    <Clock className="w-3 h-3 text-white" />
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm">{p.name}</p>
                                <p className="text-xs text-gray-400">{p.role}</p>
                                {/* Prerequisites progress */}
                                <div className="mt-2 space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className={isReady ? 'text-green-400' : 'text-amber-400'}>
                                      {p.prerequisites.filter(pr => pr.status === 'completed').length}/{p.prerequisites.length} pré-requis
                                    </span>
                                    <span className="text-gray-500">{readiness.toFixed(0)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                                    <div 
                                      className={`h-1.5 rounded-full transition-all ${
                                        isReady ? 'bg-green-500' : 'bg-amber-500'
                                      }`}
                                      style={{ width: `${readiness}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1 ml-2">
                              {p.micOn ? (
                                <Mic className="w-4 h-4 text-green-400" />
                              ) : (
                                <MicOff className="w-4 h-4 text-gray-500" />
                              )}
                              {p.videoOn ? (
                                <Video className="w-4 h-4 text-green-400" />
                              ) : (
                                <VideoOff className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="docs" className="flex-1 mt-0 overflow-hidden">
                <div className="p-4 border-b border-gray-800">
                  <h3 className="text-white text-sm">Documents partagés</h3>
                </div>
                
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="p-3 rounded bg-gray-800 hover:bg-gray-750 transition-colors cursor-pointer">
                        <div className="flex items-start gap-3">
                          <File className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm truncate">{doc.name}</p>
                            <p className="text-xs text-gray-400 mt-1">{doc.owner}</p>
                            {doc.shared && (
                              <Badge variant="secondary" className="mt-2 text-xs">Partagé</Badge>
                            )}
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="share" className="flex-1 mt-0">
                <div className="p-4">
                  <h3 className="text-white text-sm mb-4">Partager l'écran</h3>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager mon écran
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-[#0f1419] px-6 py-4 flex items-center justify-between border-t border-gray-800">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => setShowImagery(!showImagery)}>
            <ImageIcon className="w-4 h-4 mr-2" />
            {showImagery ? 'Masquer imagerie' : 'Afficher imagerie'}
          </Button>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button
            variant={micEnabled ? 'secondary' : 'destructive'}
            size="icon"
            className="rounded-full w-12 h-12"
            onClick={() => setMicEnabled(!micEnabled)}
          >
            {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>

          <Button
            variant={videoEnabled ? 'secondary' : 'destructive'}
            size="icon"
            className="rounded-full w-12 h-12"
            onClick={() => setVideoEnabled(!videoEnabled)}
          >
            {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="rounded-full w-12 h-12"
          >
            <Share2 className="w-5 h-5" />
          </Button>

          <Button
            variant={showSidebar ? 'default' : 'secondary'}
            size="icon"
            className="rounded-full w-12 h-12"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <MessageSquare className="w-5 h-5" />
          </Button>

          <Button
            variant="destructive"
            size="icon"
            className="rounded-full w-12 h-12 ml-4"
            onClick={onClose}
          >
            <Phone className="w-5 h-5 rotate-[135deg]" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Guide visio disponible</span>
        </div>
      </div>

      {/* Participant Details Modal */}
      <ParticipantCard
        participant={selectedParticipant}
        open={showParticipantCard}
        onClose={() => setShowParticipantCard(false)}
      />
    </div>
  );
}