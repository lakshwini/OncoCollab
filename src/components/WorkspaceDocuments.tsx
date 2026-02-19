import { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  FileText,
  Clock,
  Share2,
  Loader,
  AlertCircle,
  FileQuestion
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
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
import { useLanguage } from '../i18n';
import { createApiUrl, createAuthHeaders } from '../config/api.config';

interface Document {
  id: string;
  name: string;
  patient: string;
  type: string;
  lastModified: string;
  status: string;
  owner: string;
  shared: boolean;
}

interface WorkspaceDocumentsProps {
  userName?: string;
  userRole?: string;
}

export function WorkspaceDocuments({
  userName = "Dr. Martin",
  userRole = "Cardiologue"
}: WorkspaceDocumentsProps) {
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('onco_collab_token');
        if (!token) {
          setDocuments([]);
          return;
        }

        const headers = createAuthHeaders(token);
        const res = await fetch(createApiUrl('/documents'), { headers });

        if (res.ok) {
          const data = await res.json();
          setDocuments(Array.isArray(data) ? data : []);
        } else if (res.status === 404) {
          setDocuments([]);
        } else {
          throw new Error('Erreur lors du chargement des documents');
        }
      } catch (err) {
        console.error('Error loading documents:', err);
        setError('Erreur lors du chargement des documents');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const getStatusLabel = (statusKey: string) => {
    const statusMap: Record<string, string> = {
      awaitingValidation: t.workspace.awaitingValidation,
      validated: t.statuses.validated,
      shared: t.workspace.shared,
    };
    return statusMap[statusKey] || statusKey;
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.patient.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const pendingValidation = documents.filter((doc) => doc.status === 'awaitingValidation');
  const sharedDocs = documents.filter((doc) => doc.shared);
  const myDocumentsCount = documents.filter((doc) => doc.owner === 'Vous' || doc.owner === 'You').length;
  const sharedCount = sharedDocs.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419] p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Chargement des documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1419] p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white mb-1">{t.workspace.title}</h1>
          <p className="text-gray-400">{t.workspace.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            {t.workspace.addDocument}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="bg-red-500/20 border-red-500/30">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#1a1f2e] border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{t.workspace.myDocuments}</p>
                <p className="text-white text-2xl mt-1">{myDocumentsCount}</p>
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
                <p className="text-gray-400 text-sm">{t.workspace.sharedWithMe}</p>
                <p className="text-white text-2xl mt-1">{sharedCount}</p>
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
                <p className="text-gray-400 text-sm">{t.workspace.reportsToValidate}</p>
                <p className="text-white text-2xl mt-1">
                  {pendingValidation.length}
                  {pendingValidation.length > 0 && (
                    <Badge className="ml-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      <Clock className="w-3 h-3 mr-1" />
                    </Badge>
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">{t.workspace.allDocuments}</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder={t.workspace.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-700 text-white w-80"
                    />
                  </div>
                </div>
              </div>

              {documents.length > 0 && (
                <div className="flex items-center gap-3 mt-4">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <SelectValue placeholder={t.common.type} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.workspace.allTypes}</SelectItem>
                      <SelectItem value="report">{language === 'fr' ? 'Rapport' : 'Report'}</SelectItem>
                      <SelectItem value="analysis">{language === 'fr' ? 'Analyse' : 'Analysis'}</SelectItem>
                      <SelectItem value="protocol">{language === 'fr' ? 'Protocole' : 'Protocol'}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        <SelectValue placeholder={t.common.status} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.workspace.allStatuses}</SelectItem>
                      <SelectItem value="validated">{t.statuses.validated}</SelectItem>
                      <SelectItem value="pending">{t.statuses.pending}</SelectItem>
                      <SelectItem value="shared">{t.workspace.shared}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardHeader>

            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileQuestion className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">{language === 'fr' ? 'Aucun document disponible pour le moment.' : 'No documents available at the moment.'}</p>
                  <p className="text-gray-500 text-sm">
                    {language === 'fr'
                      ? 'Les documents apparaîtront ici une fois ajoutés dans la base de données.'
                      : 'Documents will appear here once added to the database.'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead className="text-gray-400">{t.workspace.documentName.toUpperCase()}</TableHead>
                      <TableHead className="text-gray-400">{t.common.patient.toUpperCase()}</TableHead>
                      <TableHead className="text-gray-400">{t.workspace.lastModification.toUpperCase()}</TableHead>
                      <TableHead className="text-gray-400">{t.common.status.toUpperCase()}</TableHead>
                      <TableHead className="text-gray-400">{t.common.actions.toUpperCase()}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((doc) => (
                      <TableRow key={doc.id} className="border-gray-800 hover:bg-gray-800/50">
                        <TableCell className="text-white">{doc.name}</TableCell>
                        <TableCell className="text-gray-300">{doc.patient}</TableCell>
                        <TableCell className="text-gray-400">{doc.lastModified}</TableCell>
                        <TableCell>
                          <Badge className={
                            doc.status === 'awaitingValidation'
                              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                              : doc.status === 'validated'
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : doc.status === 'shared'
                              ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                              : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                          }>
                            {getStatusLabel(doc.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                            >
                              {t.common.details}
                            </Button>
                            {doc.status === 'awaitingValidation' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
                              >
                                {t.common.validate}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {pendingValidation.length > 0 && (
            <Card className="bg-[#1a1f2e] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  {t.workspace.reportsToValidate}
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
                            {t.common.view}
                          </Button>
                          <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700">
                            {t.common.validate}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {sharedDocs.length > 0 && (
            <Card className="bg-[#1a1f2e] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-purple-400" />
                  {t.workspace.sharedWithMe}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sharedDocs.slice(0, 3).map((doc) => (
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
          )}

        </div>
      </div>
    </div>
  );
}