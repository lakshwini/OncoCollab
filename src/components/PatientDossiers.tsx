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
import { useLanguage } from '../i18n';

interface PatientDossiersProps {
  onNavigate: (page: Page, dossierId?: string) => void;
}

export function PatientDossiers({ onNavigate }: PatientDossiersProps) {
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const dossiers = [
    {
      id: 'D001',
      patientName: 'Martin Pierre',
      patientId: 'P-2025-001',
      type: language === 'fr' ? 'Cancer du poumon' : 'Lung cancer',
      statusKey: 'inProgress',
      lastModified: '2025-11-10',
      responsible: 'Dr. Dubois',
    },
    {
      id: 'D002',
      patientName: 'Dupont Marie',
      patientId: 'P-2025-002',
      type: language === 'fr' ? 'Cancer colorectal' : 'Colorectal cancer',
      statusKey: 'pending',
      lastModified: '2025-11-09',
      responsible: 'Dr. Martin',
    },
    {
      id: 'D003',
      patientName: 'Bernard Louis',
      patientId: 'P-2025-003',
      type: language === 'fr' ? 'Cancer du sein' : 'Breast cancer',
      statusKey: 'validated',
      lastModified: '2025-11-08',
      responsible: 'Dr. Laurent',
    },
    {
      id: 'D004',
      patientName: 'Leroy Sophie',
      patientId: 'P-2025-004',
      type: language === 'fr' ? 'Cancer de la prostate' : 'Prostate cancer',
      statusKey: 'inProgress',
      lastModified: '2025-11-07',
      responsible: 'Dr. Dubois',
    },
    {
      id: 'D005',
      patientName: 'Moreau Jean',
      patientId: 'P-2025-005',
      type: language === 'fr' ? 'Lymphome' : 'Lymphoma',
      statusKey: 'pending',
      lastModified: '2025-11-06',
      responsible: 'Dr. Chen',
    },
  ];

  const getStatusLabel = (statusKey: string) => {
    const statusMap: Record<string, string> = {
      validated: t.statuses.validated,
      inProgress: t.statuses.inProgress,
      pending: t.statuses.pending,
    };
    return statusMap[statusKey] || statusKey;
  };

  const getStatusColor = (statusKey: string) => {
    switch (statusKey) {
      case 'validated':
        return 'bg-green-100 text-green-700';
      case 'inProgress':
        return 'bg-blue-100 text-blue-700';
      case 'pending':
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

    const matchesStatus = statusFilter === 'all' || dossier.statusKey === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
            <SelectItem value="pending">{t.statuses.pending}</SelectItem>
            <SelectItem value="inProgress">{t.statuses.inProgress}</SelectItem>
            <SelectItem value="validated">{t.statuses.validated}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
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
            {filteredDossiers.map((dossier) => (
              <TableRow key={dossier.id} className="hover:bg-gray-50">
                <TableCell>{dossier.patientName}</TableCell>
                <TableCell className="text-gray-600">{dossier.patientId}</TableCell>
                <TableCell>{dossier.type}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(dossier.statusKey)}>
                    {getStatusLabel(dossier.statusKey)}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600">
                  {new Date(dossier.lastModified).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
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
          <p className="text-gray-600">{t.patientDossiers.noDossiersFound}</p>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <span>{filteredDossiers.length} {t.patientDossiers.dossiersDisplayed}</span>
        <span>•</span>
        <span>{dossiers.filter(d => d.statusKey === 'pending').length} {t.statuses.pending.toLowerCase()}</span>
        <span>•</span>
        <span>{dossiers.filter(d => d.statusKey === 'inProgress').length} {t.statuses.inProgress.toLowerCase()}</span>
        <span>•</span>
        <span>{dossiers.filter(d => d.statusKey === 'validated').length} {t.statuses.validated.toLowerCase()}</span>
      </div>
    </div>
  );
}
