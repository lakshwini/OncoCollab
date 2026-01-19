import { useState } from 'react';
import { Page, UserRole } from '../App';
import { CheckCircle2, Circle, Video, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';

interface Prerequisite {
  id: string;
  title: string;
  description: string;
  required: boolean;
}

interface MeetingPrerequisitesCheckProps {
  onNavigate: (page: Page) => void;
  userRole: UserRole;
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
}

const prerequisitesByRole: Record<UserRole, Prerequisite[]> = {
  radiologue: [
    {
      id: 'rad1',
      title: 'Consulter les dossiers patients',
      description: 'Vérifier tous les dossiers patients à discuter',
      required: true,
    },
    {
      id: 'rad2',
      title: 'Analyser les imageries',
      description: 'Examiner toutes les imageries (Scanner, IRM, TEP-scan)',
      required: true,
    },
    {
      id: 'rad3',
      title: 'Préparer les annotations',
      description: 'Annoter les images clés et préparer les mesures',
      required: true,
    },
    {
      id: 'rad4',
      title: 'Vérifier le matériel de partage',
      description: 'Tester le partage d\'écran et la qualité vidéo',
      required: false,
    },
  ],
  oncologue: [
    {
      id: 'onc1',
      title: 'Consulter les dossiers patients',
      description: 'Vérifier tous les dossiers patients à discuter',
      required: true,
    },
    {
      id: 'onc2',
      title: 'Analyser les bilans biologiques',
      description: 'Examiner les résultats des analyses sanguines et marqueurs',
      required: true,
    },
    {
      id: 'onc3',
      title: 'Préparer les protocoles de traitement',
      description: 'Définir les options thérapeutiques possibles',
      required: true,
    },
    {
      id: 'onc4',
      title: 'Vérifier les contre-indications',
      description: 'Consulter les comorbidités et traitements en cours',
      required: true,
    },
    {
      id: 'onc5',
      title: 'Préparer les essais cliniques disponibles',
      description: 'Lister les essais cliniques pertinents',
      required: false,
    },
  ],
  chirurgien: [
    {
      id: 'chir1',
      title: 'Consulter les dossiers patients',
      description: 'Vérifier tous les dossiers patients à discuter',
      required: true,
    },
    {
      id: 'chir2',
      title: 'Évaluer la faisabilité chirurgicale',
      description: 'Analyser les imageries pour définir l\'opérabilité',
      required: true,
    },
    {
      id: 'chir3',
      title: 'Préparer les options opératoires',
      description: 'Définir les techniques chirurgicales envisageables',
      required: true,
    },
    {
      id: 'chir4',
      title: 'Évaluer les risques périopératoires',
      description: 'Analyser l\'état général et les risques anesthésiques',
      required: true,
    },
  ],
  pathologiste: [
    {
      id: 'path1',
      title: 'Consulter les dossiers patients',
      description: 'Vérifier tous les dossiers patients à discuter',
      required: true,
    },
    {
      id: 'path2',
      title: 'Analyser les résultats anatomopathologiques',
      description: 'Examiner les prélèvements et les analyses histologiques',
      required: true,
    },
    {
      id: 'path3',
      title: 'Vérifier les marqueurs immunohistochimiques',
      description: 'Consulter les résultats des tests moléculaires',
      required: true,
    },
    {
      id: 'path4',
      title: 'Préparer les lames microscopiques',
      description: 'Sélectionner les lames à présenter si nécessaire',
      required: false,
    },
  ],
  admin: [
    {
      id: 'adm1',
      title: 'Vérifier la liste des participants',
      description: 'Confirmer la présence de tous les participants requis',
      required: true,
    },
    {
      id: 'adm2',
      title: 'Préparer l\'ordre du jour',
      description: 'Organiser la liste des patients à discuter',
      required: true,
    },
    {
      id: 'adm3',
      title: 'Vérifier le matériel technique',
      description: 'Tester la connexion vidéo et le matériel de projection',
      required: true,
    },
  ],
};

export function MeetingPrerequisitesCheck({
  onNavigate,
  userRole,
  meetingTitle,
  meetingDate,
  meetingTime,
}: MeetingPrerequisitesCheckProps) {
  const prerequisites = prerequisitesByRole[userRole] || [];
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const togglePrerequisite = (id: string) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const requiredPrerequisites = prerequisites.filter((p) => p.required);
  const requiredCompleted = requiredPrerequisites.filter((p) => checkedItems.has(p.id)).length;
  const totalCompleted = prerequisites.filter((p) => checkedItems.has(p.id)).length;
  const progressPercentage = (totalCompleted / prerequisites.length) * 100;
  const canJoin = requiredCompleted === requiredPrerequisites.length;

  const getRoleLabel = (role: UserRole): string => {
    const labels: Record<UserRole, string> = {
      radiologue: 'Radiologue',
      oncologue: 'Oncologue',
      chirurgien: 'Chirurgien',
      pathologiste: 'Pathologiste',
      admin: 'Administrateur',
    };
    return labels[role];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => onNavigate('reunions')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux réunions
          </Button>
          <h1 className="text-gray-900 mb-1">Vérification des pré-requis</h1>
          <p className="text-gray-600">Complétez les pré-requis avant de rejoindre la réunion</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Meeting Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="mb-2">{meetingTitle}</CardTitle>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      📅 {new Date(meetingDate).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p>🕐 {meetingTime}</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  {getRoleLabel(userRole)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Progression ({totalCompleted}/{prerequisites.length})
                  </span>
                  <span className="text-gray-900">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>

              {/* Required items status */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">
                  <span className="text-gray-600">Pré-requis obligatoires : </span>
                  <span className={canJoin ? 'text-green-600' : 'text-orange-600'}>
                    {requiredCompleted}/{requiredPrerequisites.length} complétés
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Warning Alert if not ready */}
          {!canJoin && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                Vous devez compléter tous les pré-requis obligatoires avant de rejoindre la réunion.
              </AlertDescription>
            </Alert>
          )}

          {/* Prerequisites List */}
          <Card>
            <CardHeader>
              <CardTitle>Pré-requis pour {getRoleLabel(userRole)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {prerequisites.map((prerequisite) => {
                  const isChecked = checkedItems.has(prerequisite.id);
                  return (
                    <div
                      key={prerequisite.id}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                        isChecked
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => togglePrerequisite(prerequisite.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {isChecked ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`${isChecked ? 'text-green-900' : 'text-gray-900'}`}>
                              {prerequisite.title}
                            </h3>
                            {prerequisite.required && (
                              <Badge
                                variant="outline"
                                className="bg-red-50 text-red-700 border-red-200 text-xs"
                              >
                                Obligatoire
                              </Badge>
                            )}
                          </div>
                          <p className={`text-sm ${isChecked ? 'text-green-700' : 'text-gray-600'}`}>
                            {prerequisite.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onNavigate('reunions')}
            >
              Annuler
            </Button>
            <Button
              className={`flex-1 ${
                canJoin
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              disabled={!canJoin}
              onClick={() => canJoin && onNavigate('video')}
            >
              <Video className="w-4 h-4 mr-2" />
              {canJoin ? 'Rejoindre la réunion' : 'Pré-requis incomplets'}
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center text-sm text-gray-500">
            <p>
              💡 Cochez chaque élément une fois que vous l'avez complété. Les pré-requis obligatoires
              doivent être complétés pour accéder à la réunion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
