import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  Download, 
  FileText, 
  Image as ImageIcon,
  User,
  Calendar,
  History,
  Edit,
  Save,
  Pencil,
  Maximize2,
  AlertCircle,
  Loader
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { ImageAnnotator } from './ImageAnnotator';
import { createApiUrl, createAuthHeaders } from '../config/api.config';

interface DossierDetailProps {
  dossierId: string;
  onBack: () => void;
}

export function DossierDetail({ dossierId, onBack }: DossierDetailProps) {
  const [status, setStatus] = useState('scheduled');
  const [notes, setNotes] = useState('');
  const [showImageAnnotator, setShowImageAnnotator] = useState(false);
  const [dossierData, setDossierData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load dossier data from backend
  useEffect(() => {
    const fetchDossierData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('onco_collab_token');
        if (!token) {
          setError('Non authentifié');
          return;
        }

        const headers = createAuthHeaders(token);
        const res = await fetch(createApiUrl(`/patients/${dossierId}`), { headers });

        if (!res.ok) {
          if (res.status === 404) {
            setError('Dossier non trouvé');
          } else {
            setError('Erreur lors du chargement du dossier');
          }
          return;
        }

        const data = await res.json();
        setDossierData(data);

        // Set status from meeting if available
        if (data.meeting?.status) {
          setStatus(data.meeting.status);
        }
      } catch (err) {
        console.error('Error loading dossier:', err);
        setError('Erreur serveur');
      } finally {
        setLoading(false);
      }
    };

    fetchDossierData();
  }, [dossierId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finished':
        return 'bg-green-100 text-green-700';
      case 'live':
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'draft':
      case 'postponed':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'scheduled': 'Programmée',
      'draft': 'Brouillon',
      'live': 'En direct',
      'postponed': 'Reportée',
      'finished': 'Terminée',
    };
    return labels[status] || status;
  };

  // ✅ Interface vide si pas de données
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 text-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-gray-600">Chargement du dossier...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dossierData) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6 flex items-center gap-4">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-700">{error || 'Dossier non trouvé'}</p>
              </CardContent>
            </Card>
            <Button variant="outline" className="mt-4" onClick={onBack}>
              Retour
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Afficher les vraies données from PostgreSQL
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-gray-900 mb-1">
              Dossier {dossierData.firstName} {dossierData.lastName}
            </h1>
            <p className="text-gray-600">{dossierData.patientNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {dossierData.meeting && (
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="scheduled">Programmée</SelectItem>
                <SelectItem value="live">En direct</SelectItem>
                <SelectItem value="postponed">Reportée</SelectItem>
                <SelectItem value="finished">Terminée</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Patient Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informations patient
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Nom complet</p>
              <p className="text-gray-900">{dossierData.firstName} {dossierData.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Numéro patient</p>
              <p className="text-gray-900">{dossierData.patientNumber || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Âge</p>
              <p className="text-gray-900">{dossierData.age ? `${dossierData.age} ans` : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Sexe</p>
              <p className="text-gray-900">{dossierData.sex === 'M' ? 'Masculin' : dossierData.sex === 'F' ? 'Féminin' : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Date de naissance</p>
              <p className="text-gray-900">
                {dossierData.dateOfBirth ? new Date(dossierData.dateOfBirth).toLocaleDateString('fr-FR') : '-'}
              </p>
            </div>
            {dossierData.meeting && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Statut</p>
                <Badge className={getStatusColor(status)}>
                  {getStatusLabel(status)}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Meeting Info if available */}
      {dossierData.meeting ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Réunion RCP associée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Titre</p>
                <p className="text-gray-900">{dossierData.meeting.meetingTitle}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Médecin référent</p>
                <p className="text-gray-900">
                  {dossierData.meeting.doctorFirstName} {dossierData.meeting.doctorLastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Dernière modification</p>
                <p className="text-gray-900">
                  {dossierData.meeting.lastModified ? new Date(dossierData.meeting.lastModified).toLocaleDateString('fr-FR') : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <p className="text-orange-700">Aucune réunion RCP associée à ce patient</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="imagerie" className="space-y-4">
        <TabsList>
          <TabsTrigger value="imagerie">
            <ImageIcon className="w-4 h-4 mr-2" />
            Imagerie médicale
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="w-4 h-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="notes">
            <Edit className="w-4 h-4 mr-2" />
            Notes
          </TabsTrigger>
        </TabsList>

        {/* Imagerie Tab */}
        <TabsContent value="imagerie" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Images DICOM</CardTitle>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Importer DICOM
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* ✅ Interface VIDE si pas d'images */}
              <div className="text-center py-12">
                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucune image disponible pour le moment</p>
                <p className="text-sm text-gray-400 mt-2">Les images DICOM seront affichées ici une fois téléchargées</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Documents</CardTitle>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Ajouter un document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* ✅ Interface VIDE si pas de documents */}
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun document disponible pour le moment</p>
                <p className="text-sm text-gray-400 mt-2">Les documents seront affichés ici une fois téléchargés</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notes médicales</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Ajouter des notes sur ce dossier..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[300px]"
              />
              <div className="mt-4 flex justify-end">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer les notes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Image Annotator Modal */}
      {showImageAnnotator && (
        <ImageAnnotator onClose={() => setShowImageAnnotator(false)} />
      )}
    </div>
  );
}
