import { useState, useEffect } from 'react';
import { Page } from '../App';
import { Search, Plus, Eye, Filter, Loader, AlertCircle, FolderOpen } from 'lucide-react';
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
import { useLanguage } from '../i18n';
import { createApiUrl, createAuthHeaders } from '../config/api.config';

interface PatientData {
  patientId: string;
  firstName: string;
  lastName: string;
  patientNumber: string;
  type: string;
  status: string;
  dateModification: string;
  doctorFirstName: string;
  doctorLastName: string;
}

interface PatientDossiersProps {
  onNavigate: (page: Page, dossierId?: string) => void;
}

export function PatientDossiers({ onNavigate }: PatientDossiersProps) {
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les patients depuis l'API
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('onco_collab_token');
        if (!token) {
          setError('Non authentifié');
          return;
        }

        const headers = createAuthHeaders(token);
        const res = await fetch(createApiUrl('/patients/prise-en-charge/table'), { headers });

        if (res.ok) {
          const data = await res.json();
          setPatients(data || []);
        } else if (res.status === 404 || res.status === 500) {
          // Endpoint pas encore disponible, afficher message vide gracieux
          setPatients([]);
        } else {
          throw new Error('Erreur lors du chargement des données');
        }
      } catch (err) {
        console.error('Error loading patients:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'en_cours': 'En cours',
      'en_attente': 'En attente',
      'valide': 'Validé',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valide':
        return 'bg-green-100 text-green-700';
      case 'en_cours':
        return 'bg-blue-100 text-blue-700';
      case 'en_attente':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.patientNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const uniqueStatuses = Array.from(new Set(patients.map(p => p.status)));

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Chargement des patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-1">{t.patientDossiers.title}</h1>
          <p className="text-gray-600">{t.patientDossiers.subtitle}</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          {t.patientDossiers.createDossier}
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder={t.patientDossiers.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder={t.patientDossiers.filterByStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.patientDossiers.allStatuses}</SelectItem>
            {uniqueStatuses.map(status => (
              <SelectItem key={status} value={status}>{getStatusLabel(status)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredPatients.length === 0 && !error ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">{t.patientDossiers.noDossiersFound}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.patientDossiers.patientName}</TableHead>
                <TableHead>{t.patientDossiers.patientId}</TableHead>
                <TableHead>{t.common.type}</TableHead>
                <TableHead>{t.common.status}</TableHead>
                <TableHead>{t.patientDossiers.lastModification}</TableHead>
                <TableHead>{t.patientDossiers.responsible}</TableHead>
                <TableHead className="text-right">{t.common.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient.patientId} className="hover:bg-gray-50">
                  <TableCell>{patient.firstName} {patient.lastName}</TableCell>
                  <TableCell className="text-gray-600">{patient.patientNumber}</TableCell>
                  <TableCell>{patient.type}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(patient.status)}>
                      {getStatusLabel(patient.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {new Date(patient.dateModification).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-gray-600">{patient.doctorFirstName} {patient.doctorLastName}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onNavigate('dossier-detail', patient.patientId)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Stats */}
      {filteredPatients.length > 0 && (
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <span>{filteredPatients.length} {t.patientDossiers.dossiersDisplayed}</span>
          {uniqueStatuses.map((status, idx) => {
            const count = patients.filter(p => p.status === status).length;
            return (
              <span key={status}>
                {idx > 0 && <span>•</span>}
                {count} {getStatusLabel(status).toLowerCase()}
                {idx < uniqueStatuses.length - 1 && <span> • </span>}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
