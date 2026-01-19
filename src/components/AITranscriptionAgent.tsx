import { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  FileText, 
  Send,
  Download,
  Check,
  X,
  Sparkles,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { toast } from 'sonner@2.0.3';

interface TranscriptionSegment {
  id: string;
  speaker: string;
  timestamp: string;
  text: string;
  aiProcessed: boolean;
}

interface CompteRendu {
  id: string;
  date: string;
  participants: string[];
  summary: string;
  decisions: string[];
  actions: string[];
  nextSteps: string[];
}

interface AITranscriptionAgentProps {
  meetingId?: string;
  patientName?: string;
  onSendToChannel?: (report: CompteRendu) => void;
}

export function AITranscriptionAgent({ 
  meetingId = "RCP-2024-001",
  patientName = "Mme. Dupont",
  onSendToChannel 
}: AITranscriptionAgentProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [transcriptionSegments, setTranscriptionSegments] = useState<TranscriptionSegment[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<CompteRendu | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Simulate recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    toast.success('Enregistrement et transcription démarrés', {
      description: "L'agent IA note tous les échanges en temps réel"
    });

    // Simulate transcription after a delay
    setTimeout(() => {
      addTranscriptionSegment({
        speaker: 'Dr. Bernard (Oncologue)',
        text: 'Bonjour à tous. Nous sommes réunis pour discuter du cas de Mme. Dupont. Radiologue, pouvez-vous nous présenter les résultats de l\'IRM ?',
      });
    }, 3000);

    setTimeout(() => {
      addTranscriptionSegment({
        speaker: 'Dr. Martin (Radiologue)',
        text: 'Oui, bien sûr. L\'IRM cérébrale montre une lésion suspecte de 2,3 cm au niveau du lobe temporal droit avec prise de contraste hétérogène.',
      });
    }, 8000);

    setTimeout(() => {
      addTranscriptionSegment({
        speaker: 'Dr. Lefevre (Chirurgien)',
        text: 'La lésion semble accessible chirurgicalement. Je propose une résection avec examen anatomopathologique extemporané.',
      });
    }, 13000);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    toast.info('Enregistrement arrêté', {
      description: 'Vous pouvez maintenant générer le compte-rendu'
    });
  };

  const addTranscriptionSegment = (data: { speaker: string; text: string }) => {
    const segment: TranscriptionSegment = {
      id: `seg-${Date.now()}`,
      speaker: data.speaker,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      text: data.text,
      aiProcessed: true,
    };
    setTranscriptionSegments(prev => [...prev, segment]);
  };

  const handleGenerateReport = () => {
    if (transcriptionSegments.length === 0) {
      toast.error('Aucune transcription disponible');
      return;
    }

    setIsGeneratingReport(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const report: CompteRendu = {
        id: `CR-${Date.now()}`,
        date: new Date().toLocaleDateString('fr-FR'),
        participants: [
          'Dr. Bernard (Oncologue)',
          'Dr. Martin (Radiologue)',
          'Dr. Lefevre (Chirurgien)',
          'Dr. Moreau (Pathologiste)',
        ],
        summary: `RCP concernant ${patientName}. Discussion multidisciplinaire portant sur la prise en charge d'une lésion cérébrale temporale droite. L'imagerie met en évidence une masse suspecte de 2,3 cm avec prise de contraste hétérogène. Consensus établi pour une approche chirurgicale initiale.`,
        decisions: [
          'Résection chirurgicale de la lésion temporale droite',
          'Examen anatomopathologique extemporané durant l\'intervention',
          'IRM de contrôle post-opératoire à J+2',
          'Consultation oncologique selon résultats histologiques',
        ],
        actions: [
          'Programmer l\'intervention chirurgicale dans les 2 semaines',
          'Consultation pré-anesthésique à planifier',
          'Préparer le dossier pour présentation en staff oncologique',
        ],
        nextSteps: [
          'Prochaine RCP : Discussion des résultats histologiques (dans 3 semaines)',
          'Planification du traitement adjuvant selon classification tumorale',
          'Suivi IRM à 3 mois',
        ],
      };

      setGeneratedReport(report);
      setIsGeneratingReport(false);
      toast.success('Compte-rendu généré avec succès', {
        description: 'Relisez et validez avant envoi au canal patient'
      });
    }, 3000);
  };

  const handleSendToChannel = () => {
    if (!generatedReport) return;

    if (onSendToChannel) {
      onSendToChannel(generatedReport);
    }

    toast.success(`Compte-rendu envoyé au canal de ${patientName}`, {
      description: 'Tous les spécialistes ont été notifiés'
    });

    // Reset
    setTranscriptionSegments([]);
    setGeneratedReport(null);
  };

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-20 right-6 h-12 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg z-40"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Agent IA Transcription
      </Button>
    );
  }

  return (
    <div className="fixed bottom-20 right-6 w-96 bg-gray-900 border border-gray-800 rounded-lg shadow-2xl z-40 flex flex-col max-h-[600px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border-b border-gray-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-white text-sm">Agent IA Transcription</h3>
              <p className="text-xs text-cyan-300">Compte-rendu automatique</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-white"
            onClick={() => setIsVisible(false)}
          >
            <EyeOff className="w-4 h-4" />
          </Button>
        </div>

        {/* Recording Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={isRecording ? 'destructive' : 'default'}
            size="sm"
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={isRecording ? '' : 'bg-cyan-600 hover:bg-cyan-700'}
          >
            {isRecording ? (
              <>
                <MicOff className="w-4 h-4 mr-2" />
                Arrêter
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Démarrer
              </>
            )}
          </Button>
          
          {isRecording && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              REC {formatDuration(recordingDuration)}
            </Badge>
          )}

          <div className="flex-1"></div>

          <Button
            variant="ghost"
            size="sm"
            disabled={transcriptionSegments.length === 0 || isRecording}
            onClick={handleGenerateReport}
            className="text-cyan-400 hover:text-cyan-300"
          >
            <FileText className="w-4 h-4 mr-1" />
            Générer CR
          </Button>
        </div>
      </div>

      {/* Content */}
      {!generatedReport ? (
        <>
          {/* Transcription View */}
          <div className="flex-1 overflow-hidden">
            <div className="p-3 bg-gray-800/50 border-b border-gray-800">
              <p className="text-xs text-gray-400">
                {isRecording 
                  ? "🎤 Transcription en temps réel..." 
                  : transcriptionSegments.length > 0
                  ? `${transcriptionSegments.length} segment(s) enregistré(s)`
                  : "Démarrez l'enregistrement pour capturer les échanges"}
              </p>
            </div>

            <ScrollArea className="h-64">
              <div className="p-3 space-y-3">
                {transcriptionSegments.map((segment) => (
                  <div
                    key={segment.id}
                    className="bg-gray-800 rounded-lg p-3 border border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-cyan-400">{segment.speaker}</span>
                      <span className="text-xs text-gray-500">{segment.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{segment.text}</p>
                    {segment.aiProcessed && (
                      <Badge className="mt-2 text-xs bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Traité par IA
                      </Badge>
                    )}
                  </div>
                ))}

                {transcriptionSegments.length === 0 && !isRecording && (
                  <div className="text-center py-8">
                    <Mic className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Aucune transcription</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Generate Report Loading */}
          {isGeneratingReport && (
            <div className="p-4 bg-gray-800/50 border-t border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-sm text-cyan-400">Génération du compte-rendu...</span>
              </div>
              <Progress value={66} className="h-1" />
              <p className="text-xs text-gray-500 mt-2">
                L'IA analyse les transcriptions et génère le compte-rendu structuré
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Report View */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <div>
                <h4 className="text-sm text-white mb-1">📋 Compte-Rendu de RCP</h4>
                <p className="text-xs text-gray-400">Généré le {generatedReport.date}</p>
              </div>

              <Separator className="bg-gray-800" />

              <div>
                <h5 className="text-xs text-cyan-400 mb-2">Participants :</h5>
                <div className="flex flex-wrap gap-1">
                  {generatedReport.participants.map((p, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs border-gray-700">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="text-xs text-cyan-400 mb-2">Résumé :</h5>
                <p className="text-sm text-gray-300 leading-relaxed">{generatedReport.summary}</p>
              </div>

              <div>
                <h5 className="text-xs text-cyan-400 mb-2">✅ Décisions :</h5>
                <ul className="space-y-1">
                  {generatedReport.decisions.map((decision, idx) => (
                    <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{decision}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h5 className="text-xs text-cyan-400 mb-2">📌 Actions à réaliser :</h5>
                <ul className="space-y-1">
                  {generatedReport.actions.map((action, idx) => (
                    <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h5 className="text-xs text-cyan-400 mb-2">🔜 Prochaines étapes :</h5>
                <ul className="space-y-1">
                  {generatedReport.nextSteps.map((step, idx) => (
                    <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-cyan-400 flex-shrink-0">→</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </ScrollArea>

          {/* Report Actions */}
          <div className="p-4 bg-gray-800/50 border-t border-gray-800 space-y-2">
            <div className="flex gap-2">
              <Button
                onClick={handleSendToChannel}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Envoyer au canal
              </Button>
              <Button
                variant="outline"
                className="border-gray-700"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGeneratedReport(null)}
              className="w-full text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4 mr-2" />
              Annuler et revenir à la transcription
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
