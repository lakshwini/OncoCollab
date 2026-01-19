import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Eye,
  MoreVertical,
  FileText,
  Image,
  File,
  CheckCircle2,
  Clock,
  Share2
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface WorkspaceDocumentsProps {
  userName?: string;
  userRole?: string;
}

export function WorkspaceDocuments({ 
  userName = "Dr. Martin",
  userRole = "Cardiologue"
}: WorkspaceDocumentsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const documents = [
    {
      id: '1',
      name: 'Rapport RCP - Jean Dupont',
      patient: 'Jean Dupont',
      type: 'Rapport',
      lastModified: '15/07/2024',
      status: 'En attente de validation',
      statusColor: 'yellow',
      owner: 'Vous',
      shared: false
    },
    {
      id: '2',
      name: 'Analyse sanguine - Marie Curie',
      patient: 'Marie Curie',
      type: 'Analyse',
      lastModified: '14/07/2024',
      status: 'Validé',
      statusColor: 'green',
      owner: 'Dr. Lefevre',
      shared: true
    },
    {
      id: '3',
      name: 'Compte-rendu opératoire - Paul Lemoine',
      patient: 'Paul Lemoine',
      type: 'Compte-rendu',
      lastModified: '12/07/2024',
      status: 'Validé',
      statusColor: 'green',
      owner: 'Dr. Bernard',
      shared: true
    },
    {
      id: '4',
      name: 'Protocole de chimiothérapie - H. Langevin',
      patient: 'Hélène Langevin',
      type: 'Protocole',
      lastModified: '11/07/2024',
      status: 'Partagé',
      statusColor: 'blue',
      owner: 'Dr. Moreau',
      shared: true
    },
    {
      id: '5',
      name: 'Rapport RCP - Alain Prost',
      patient: 'Alain Prost',
      type: 'Rapport',
      lastModified: '10/07/2024',
      status: 'En attente de validation',
      statusColor: 'yellow',
      owner: 'Vous',
      shared: false
    },
  ];

  const recentDocuments = documents.slice(0, 3);
  const pendingValidation = documents.filter(d => d.status === 'En attente de validation');

  return (
    <div className="min-h-screen bg-[#0f1419] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white mb-1">Mon Espace de Travail</h1>
          <p className="text-gray-400">
            Gérez vos documents médicaux, validez les rapports et collaborez avec vos confrères.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un document
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#1a1f2e] border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Mes Documents</p>
                <p className="text-white text-2xl mt-1">24</p>
              </div>
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f2e] border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Partagés avec moi</p>
                <p className="text-white text-2xl mt-1">12</p>
              </div>
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <Share2 className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f2e] border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Rapports à valider</p>
                <p className="text-white text-2xl mt-1">
                  {pendingValidation.length}
                  <Badge className="ml-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    <Clock className="w-3 h-3 mr-1" />
                  </Badge>
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Documents List */}
        <div className="lg:col-span-2">
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Tous les documents</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher par nom de document, patient..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-700 text-white w-80"
                    />
                  </div>
                </div>
              </div>
              
              {/* Filters */}
              <div className="flex items-center gap-3 mt-4">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <SelectValue placeholder="Type" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="rapport">Rapport</SelectItem>
                    <SelectItem value="analyse">Analyse</SelectItem>
                    <SelectItem value="protocole">Protocole</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      <SelectValue placeholder="Statut" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="validated">Validé</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="shared">Partagé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-transparent">
                    <TableHead className="text-gray-400">NOM DU DOCUMENT</TableHead>
                    <TableHead className="text-gray-400">PATIENT</TableHead>
                    <TableHead className="text-gray-400">DERNIÈRE MODIFICATION</TableHead>
                    <TableHead className="text-gray-400">STATUT</TableHead>
                    <TableHead className="text-gray-400">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id} className="border-gray-800 hover:bg-gray-800/50">
                      <TableCell className="text-white">{doc.name}</TableCell>
                      <TableCell className="text-gray-300">{doc.patient}</TableCell>
                      <TableCell className="text-gray-400">{doc.lastModified}</TableCell>
                      <TableCell>
                        <Badge 
                          className={`
                            ${doc.statusColor === 'yellow' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : ''}
                            ${doc.statusColor === 'green' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
                            ${doc.statusColor === 'blue' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : ''}
                          `}
                        >
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                          >
                            Détails
                          </Button>
                          {doc.status === 'En attente de validation' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
                            >
                              Valider
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pending Validation */}
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                Rapports à valider
                <Badge className="ml-auto bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  {pendingValidation.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingValidation.map((doc) => (
                <div 
                  key={doc.id}
                  className="p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{doc.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{doc.patient}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs border-gray-700 text-white hover:bg-gray-700">
                          Voir
                        </Button>
                        <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700">
                          Valider
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Shared with me */}
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-purple-400" />
                Partagés avec moi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {documents.filter(d => d.shared).slice(0, 3).map((doc) => (
                <div 
                  key={doc.id}
                  className="p-2 rounded hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8 bg-purple-600">
                      <AvatarFallback className="bg-purple-600 text-white text-xs">
                        {doc.owner.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{doc.name}</p>
                      <p className="text-xs text-gray-400">{doc.owner}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Storage Info */}
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Stockage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">Utilisé</span>
                    <span className="text-white">2.4 GB / 10 GB</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '24%' }}></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Sauvegarde quotidienne automatique activée
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
