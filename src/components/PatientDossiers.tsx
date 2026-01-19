import { useState } from 'react';
import { Page } from '../App';
import { Search, Plus, Trash2, Eye, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface PatientDossiersProps {
  onNavigate: (page: Page, dossierId?: string) => void;
}

export function PatientDossiers({ onNavigate }: PatientDossiersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const dossiers = [
    {
      id: 'D001',
      patientName: 'Martin Pierre',
      patientId: 'P-2025-001',
      type: 'Cancer du poumon',
      status: 'En cours',
      lastModified: '2025-11-10',
      responsible: 'Dr. Dubois',
    },
    {
      id: 'D002',
      patientName: 'Dupont Marie',
      patientId: 'P-2025-002',
      type: 'Cancer colorectal',
      status: 'En attente',
      lastModified: '2025-11-09',
      responsible: 'Dr. Martin',
    },
    {
      id: 'D003',
      patientName: 'Bernard Louis',
      patientId: 'P-2025-003',
      type: 'Cancer du sein',
      status: 'Validé',
      lastModified: '2025-11-08',
      responsible: 'Dr. Laurent',
    },
    {
      id: 'D004',
      patientName: 'Leroy Sophie',
      patientId: 'P-2025-004',
      type: 'Cancer de la prostate',
      status: 'En cours',
      lastModified: '2025-11-07',
      responsible: 'Dr. Dubois',
    },
    {
      id: 'D005',
      patientName: 'Moreau Jean',
      patientId: 'P-2025-005',
      type: 'Lymphome',
      status: 'En attente',
      lastModified: '2025-11-06',
      responsible: 'Dr. Chen',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Validé':
        return 'bg-green-100 text-green-700';
      case 'En cours':
        return 'bg-blue-100 text-blue-700';
      case 'En attente':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredDossiers = dossiers.filter((dossier) => {
    const matchesSearch = 
      dossier.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dossier.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dossier.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || dossier.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-1">Dossiers patients</h1>
          <p className="text-gray-600">Gestion des dossiers de concertation pluridisciplinaire</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Créer un dossier
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Rechercher par nom, ID ou type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="En attente">En attente</SelectItem>
            <SelectItem value="En cours">En cours</SelectItem>
            <SelectItem value="Validé">Validé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom du patient</TableHead>
              <TableHead>ID Patient</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Dernière modification</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDossiers.map((dossier) => (
              <TableRow key={dossier.id} className="hover:bg-gray-50">
                <TableCell>{dossier.patientName}</TableCell>
                <TableCell className="text-gray-600">{dossier.patientId}</TableCell>
                <TableCell>{dossier.type}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(dossier.status)}>
                    {dossier.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600">
                  {new Date(dossier.lastModified).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell className="text-gray-600">{dossier.responsible}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigate('dossier-detail', dossier.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredDossiers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">Aucun dossier trouvé</p>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <span>{filteredDossiers.length} dossier(s) affiché(s)</span>
        <span>•</span>
        <span>{dossiers.filter(d => d.status === 'En attente').length} en attente</span>
        <span>•</span>
        <span>{dossiers.filter(d => d.status === 'En cours').length} en cours</span>
        <span>•</span>
        <span>{dossiers.filter(d => d.status === 'Validé').length} validé(s)</span>
      </div>
    </div>
  );
}
