import { useState } from 'react';
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
  Maximize2
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

interface DossierDetailProps {
  dossierId: string;
  onBack: () => void;
}

export function DossierDetail({ dossierId, onBack }: DossierDetailProps) {
  const [status, setStatus] = useState('En cours');
  const [notes, setNotes] = useState('');
  const [showImageAnnotator, setShowImageAnnotator] = useState(false);

  const dossierData = {
    id: dossierId,
    patientName: 'Martin Pierre',
    patientId: 'P-2025-001',
    age: 64,
    type: 'Cancer du poumon',
    status: status,
    responsible: 'Dr. Marie Dubois',
    createdDate: '2025-10-15',
    lastModified: '2025-11-10',
  };

  const history = [
    {
      date: '2025-11-10 14:30',
      user: 'Dr. Dubois',
      action: 'Ajout d\'imagerie scanner thoracique',
    },
    {
      date: '2025-11-09 10:15',
      user: 'Dr. Laurent',
      action: 'Modification du statut en "En cours"',
    },
    {
      date: '2025-10-15 09:00',
      user: 'Dr. Dubois',
      action: 'Création du dossier',
    },
  ];

  const documents = [
    { name: 'Compte-rendu biopsie.pdf', type: 'PDF', size: '2.4 MB', date: '2025-10-20' },
    { name: 'Analyses sanguines.pdf', type: 'PDF', size: '1.1 MB', date: '2025-10-18' },
    { name: 'Résultats PET-scan.pdf', type: 'PDF', size: '3.7 MB', date: '2025-10-25' },
  ];

  const images = [
    { name: 'Scanner thoracique - Coupe 1', type: 'DICOM', date: '2025-11-10' },
    { name: 'Scanner thoracique - Coupe 2', type: 'DICOM', date: '2025-11-10' },
    { name: 'Scanner thoracique - Coupe 3', type: 'DICOM', date: '2025-11-10' },
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-gray-900 mb-1">Dossier {dossierData.patientName}</h1>
            <p className="text-gray-600">{dossierData.patientId} • {dossierData.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="En attente">En attente</SelectItem>
              <SelectItem value="En cours">En cours</SelectItem>
              <SelectItem value="Validé">Validé</SelectItem>
            </SelectContent>
          </Select>
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
              <p className="text-gray-900">{dossierData.patientName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Âge</p>
              <p className="text-gray-900">{dossierData.age} ans</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Type de cancer</p>
              <p className="text-gray-900">{dossierData.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Médecin référent</p>
              <p className="text-gray-900">{dossierData.responsible}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Date de création</p>
              <p className="text-gray-900">
                {new Date(dossierData.createdDate).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Statut actuel</p>
              <Badge className={getStatusColor(dossierData.status)}>
                {dossierData.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

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
          <TabsTrigger value="historique">
            <History className="w-4 h-4 mr-2" />
            Historique
          </TabsTrigger>
        </TabsList>

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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div 
                    key={index} 
                    className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                    onClick={() => setShowImageAnnotator(true)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-500" />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary">
                          <Maximize2 className="w-4 h-4 mr-1" />
                          Visualiser
                        </Button>
                        <Button size="sm" variant="secondary">
                          <Pencil className="w-4 h-4 mr-1" />
                          Annoter
                        </Button>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <p className="text-white text-sm">{image.name}</p>
                      <p className="text-white/70 text-xs mt-1">{image.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
              <div className="space-y-2">
                {documents.map((doc, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-gray-900">{doc.name}</p>
                        <p className="text-sm text-gray-600">{doc.size} • {new Date(doc.date).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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

        <TabsContent value="historique" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Historique des modifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div className="flex-1 pb-4 border-b border-gray-200 last:border-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-gray-900">{item.action}</p>
                        <p className="text-sm text-gray-500">{item.date}</p>
                      </div>
                      <p className="text-sm text-gray-600">Par {item.user}</p>
                    </div>
                  </div>
                ))}
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
