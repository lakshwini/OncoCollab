import { useState } from 'react';
import { 
  Search, 
  Plus, 
  Users, 
  Archive, 
  X,
  MoreVertical,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  FolderOpen,
  MessageSquare,
  Calendar,
  FileText,
  Video,
  ChevronDown,
  Filter,
  CheckCircle2,
  Clock,
  ArchiveRestore
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { toast } from 'sonner@2.0.3';

interface Channel {
  id: string;
  patientName: string;
  patientId: string;
  cancerType: string;
  description: string;
  status: 'actif' | 'traitement' | 'suivi' | 'archive';
  createdAt: string;
  createdBy: 'IA' | 'Manuel';
  specialists: Specialist[];
  lastActivity: string;
  messagesCount: number;
  documentsCount: number;
}

interface Specialist {
  id: string;
  name: string;
  role: string;
  initials: string;
}

const allSpecialists = [
  { id: '1', name: 'Dr. Martin', role: 'Radiologue', initials: 'DM' },
  { id: '2', name: 'Dr. Bernard', role: 'Oncologue', initials: 'DB' },
  { id: '3', name: 'Dr. Lefevre', role: 'Chirurgien', initials: 'DL' },
  { id: '4', name: 'Dr. Moreau', role: 'Pathologiste', initials: 'DM' },
  { id: '5', name: 'Dr. Rossi', role: 'Radiologue', initials: 'DR' },
  { id: '6', name: 'Dr. Dubois', role: 'Oncologue médical', initials: 'DD' },
  { id: '7', name: 'Dr. Laurent', role: 'Radiothérapeute', initials: 'DL' },
];

const mockChannels: Channel[] = [
  {
    id: '1',
    patientName: 'Mme. Dupont Marie',
    patientId: 'P-2024-00156',
    cancerType: 'Cancer du sein triple négatif',
    description: 'Patient diagnostiquée avec cancer du sein stade III. Nécessite traitement multidisciplinaire avec chirurgie suivie de chimiothérapie adjuvante.',
    status: 'traitement',
    createdAt: '2024-05-15',
    createdBy: 'IA',
    specialists: [
      { id: '2', name: 'Dr. Bernard', role: 'Oncologue', initials: 'DB' },
      { id: '3', name: 'Dr. Lefevre', role: 'Chirurgien', initials: 'DL' },
      { id: '1', name: 'Dr. Martin', role: 'Radiologue', initials: 'DM' },
    ],
    lastActivity: '2024-06-18',
    messagesCount: 47,
    documentsCount: 12,
  },
  {
    id: '2',
    patientName: 'M. Dubois Jean',
    patientId: 'P-2024-00187',
    cancerType: 'Cancer du poumon non à petites cellules',
    description: 'Adénocarcinome pulmonaire stade IIB. Planification de résection chirurgicale et radiothérapie.',
    status: 'actif',
    createdAt: '2024-06-10',
    createdBy: 'IA',
    specialists: [
      { id: '2', name: 'Dr. Bernard', role: 'Oncologue', initials: 'DB' },
      { id: '5', name: 'Dr. Rossi', role: 'Radiologue', initials: 'DR' },
      { id: '7', name: 'Dr. Laurent', role: 'Radiothérapeute', initials: 'DL' },
    ],
    lastActivity: '2024-06-18',
    messagesCount: 23,
    documentsCount: 8,
  },
  {
    id: '3',
    patientName: 'Mme. Lefebvre Sophie',
    patientId: 'P-2024-00098',
    cancerType: 'Mélanome stade II',
    description: 'Mélanome cutané avec envahissement ganglionnaire. Traité avec succès, en suivi post-thérapeutique.',
    status: 'archive',
    createdAt: '2024-03-20',
    createdBy: 'Manuel',
    specialists: [
      { id: '3', name: 'Dr. Lefevre', role: 'Chirurgien', initials: 'DL' },
      { id: '2', name: 'Dr. Bernard', role: 'Oncologue', initials: 'DB' },
    ],
    lastActivity: '2024-05-30',
    messagesCount: 65,
    documentsCount: 15,
  },
];

export function PatientChannelsManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'actif' | 'archive'>('actif');
  const [channels, setChannels] = useState<Channel[]>(mockChannels);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showChannelDetail, setShowChannelDetail] = useState(false);
  
  // Create channel form
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelId, setNewChannelId] = useState('');
  const [newCancerType, setNewCancerType] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedSpecialists, setSelectedSpecialists] = useState<Specialist[]>([]);

  const filteredChannels = channels.filter(channel => {
    const matchesSearch = channel.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         channel.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         channel.cancerType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = selectedTab === 'actif' 
      ? channel.status !== 'archive' 
      : channel.status === 'archive';
    return matchesSearch && matchesTab;
  });

  const handleCreateChannel = () => {
    if (!newChannelName || !newCancerType || selectedSpecialists.length === 0) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    const newChannel: Channel = {
      id: `channel-${Date.now()}`,
      patientName: newChannelName,
      patientId: newChannelId || `P-2024-${Math.floor(Math.random() * 1000).toString().padStart(5, '0')}`,
      cancerType: newCancerType,
      description: newDescription,
      status: 'actif',
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: 'Manuel',
      specialists: selectedSpecialists,
      lastActivity: new Date().toISOString().split('T')[0],
      messagesCount: 0,
      documentsCount: 0,
    };

    setChannels([newChannel, ...channels]);
    toast.success(`Canal "${newChannelName}" créé avec succès`, {
      description: `${selectedSpecialists.length} spécialiste(s) ajouté(s)`
    });
    
    // Reset form
    setNewChannelName('');
    setNewChannelId('');
    setNewCancerType('');
    setNewDescription('');
    setSelectedSpecialists([]);
    setShowCreateDialog(false);
  };

  const handleArchiveChannel = (channelId: string) => {
    setChannels(channels.map(ch => 
      ch.id === channelId ? { ...ch, status: 'archive' as const } : ch
    ));
    toast.info('Canal archivé avec succès');
  };

  const handleRestoreChannel = (channelId: string) => {
    setChannels(channels.map(ch => 
      ch.id === channelId ? { ...ch, status: 'actif' as const } : ch
    ));
    toast.success('Canal restauré avec succès');
  };

  const handleDeleteChannel = (channelId: string) => {
    setChannels(channels.filter(ch => ch.id !== channelId));
    toast.success('Canal supprimé définitivement');
  };

  const toggleSpecialist = (specialist: Specialist) => {
    const exists = selectedSpecialists.find(s => s.id === specialist.id);
    if (exists) {
      setSelectedSpecialists(selectedSpecialists.filter(s => s.id !== specialist.id));
    } else {
      setSelectedSpecialists([...selectedSpecialists, specialist]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'actif': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'traitement': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'suivi': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'archive': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="h-full bg-[#0f1419] text-white">
      {/* Header */}
      <div className="border-b border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl text-white mb-2">Gestion des Canaux Patients</h1>
            <p className="text-gray-400">
              Canaux créés automatiquement par l'IA ou manuellement par les spécialistes
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Créer un canal manuellement
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Rechercher par nom de patient, ID ou type de cancer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
            />
          </div>
          <Button variant="outline" className="border-gray-800 text-gray-400 hover:text-white">
            <Filter className="w-4 h-4 mr-2" />
            Filtres
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)} className="flex-1">
        <div className="border-b border-gray-800 px-6">
          <TabsList className="bg-transparent">
            <TabsTrigger value="actif" className="data-[state=active]:bg-blue-600">
              Canaux Actifs ({channels.filter(c => c.status !== 'archive').length})
            </TabsTrigger>
            <TabsTrigger value="archive" className="data-[state=active]:bg-gray-700">
              <Archive className="w-4 h-4 mr-2" />
              Archives ({channels.filter(c => c.status === 'archive').length})
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="p-6">
            <div className="grid gap-4">
              {filteredChannels.map((channel) => (
                <div
                  key={channel.id}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg text-white">{channel.patientName}</h3>
                        <Badge variant="outline" className="text-xs">
                          {channel.patientId}
                        </Badge>
                        <Badge className={`text-xs border ${getStatusColor(channel.status)}`}>
                          {channel.status}
                        </Badge>
                        {channel.createdBy === 'IA' && (
                          <Badge className="text-xs bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                            Créé par IA
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-blue-400 mb-3">
                        <FolderOpen className="w-4 h-4" />
                        {channel.cancerType}
                      </div>
                      <p className="text-sm text-gray-400 mb-4">{channel.description}</p>
                      
                      {/* Specialists */}
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-500">Équipe :</span>
                        <div className="flex -space-x-2">
                          {channel.specialists.slice(0, 5).map((specialist) => (
                            <Avatar key={specialist.id} className="w-8 h-8 border-2 border-gray-900">
                              <AvatarFallback className="bg-blue-600 text-white text-xs">
                                {specialist.initials}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {channel.specialists.length > 5 && (
                            <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-900 flex items-center justify-center">
                              <span className="text-xs text-gray-400">+{channel.specialists.length - 5}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          {channel.messagesCount} messages
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          {channel.documentsCount} documents
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Dernière activité : {channel.lastActivity}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                        <DropdownMenuItem onClick={() => {
                          setSelectedChannel(channel);
                          setShowChannelDetail(true);
                        }}>
                          <FolderOpen className="w-4 h-4 mr-2" />
                          Voir le détail
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Ajouter un spécialiste
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-800" />
                        {channel.status === 'archive' ? (
                          <DropdownMenuItem onClick={() => handleRestoreChannel(channel.id)}>
                            <ArchiveRestore className="w-4 h-4 mr-2" />
                            Restaurer
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleArchiveChannel(channel.id)}>
                            <Archive className="w-4 h-4 mr-2" />
                            Archiver
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="text-red-400"
                          onClick={() => handleDeleteChannel(channel.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer définitivement
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-800">
                    <Button size="sm" variant="outline" className="border-gray-700 text-gray-400 hover:text-white">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Ouvrir chat
                    </Button>
                    <Button size="sm" variant="outline" className="border-gray-700 text-gray-400 hover:text-white">
                      <Video className="w-4 h-4 mr-2" />
                      Lancer RCP
                    </Button>
                    <Button size="sm" variant="outline" className="border-gray-700 text-gray-400 hover:text-white">
                      <Calendar className="w-4 h-4 mr-2" />
                      Planifier
                    </Button>
                  </div>
                </div>
              ))}

              {filteredChannels.length === 0 && (
                <div className="text-center py-12">
                  <Archive className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Aucun canal trouvé</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </Tabs>

      {/* Create Channel Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un nouveau canal patient</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom du patient *</Label>
                <Input
                  placeholder="Ex: Mme. Dupont Marie"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label>ID Patient (optionnel)</Label>
                <Input
                  placeholder="Ex: P-2024-00156"
                  value={newChannelId}
                  onChange={(e) => setNewChannelId(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type de cancer *</Label>
              <Input
                placeholder="Ex: Cancer du sein triple négatif"
                value={newCancerType}
                onChange={(e) => setNewCancerType(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Description détaillée du cas, stade, traitement prévu..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="bg-gray-800 border-gray-700 min-h-24"
              />
            </div>

            <div className="space-y-2">
              <Label>Spécialistes à ajouter * ({selectedSpecialists.length} sélectionné(s))</Label>
              <div className="grid grid-cols-2 gap-2 p-4 bg-gray-800 rounded-lg max-h-48 overflow-y-auto">
                {allSpecialists.map((specialist) => {
                  const isSelected = selectedSpecialists.find(s => s.id === specialist.id);
                  return (
                    <div
                      key={specialist.id}
                      onClick={() => toggleSpecialist(specialist)}
                      className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className={isSelected ? 'bg-blue-700' : 'bg-gray-600'}>
                          {specialist.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{specialist.name}</p>
                        <p className="text-xs text-gray-400">{specialist.role}</p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-gray-700">
              Annuler
            </Button>
            <Button onClick={handleCreateChannel} className="bg-blue-600 hover:bg-blue-700">
              Créer le canal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
