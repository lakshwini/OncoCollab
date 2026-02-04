import { useState } from 'react';
import {
  BookOpen,
  Video,
  Users,
  Calendar,
  FileText,
  Settings,
  HelpCircle,
  CheckCircle2,
  ChevronRight,
  Play,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { useLanguage } from '../i18n';

export function HelpGuide() {
  const { language, t } = useLanguage();
  const [activeGuide, setActiveGuide] = useState<string | null>(null);

  const quickStartGuides = [
    {
      id: 'join-meeting',
      title: language === 'fr' ? 'Comment rejoindre une réunion RCP' : 'How to join an RCP meeting',
      icon: Video,
      duration: '2 min',
      steps: language === 'fr' ? [
        'Accédez à la section "Calendrier" depuis le menu latéral',
        'Cliquez sur la réunion prévue dans le calendrier',
        'Cliquez sur le bouton "Rejoindre la réunion"',
        'Vérifiez vos paramètres audio/vidéo',
        'Cliquez sur "Entrer dans la salle"'
      ] : [
        'Go to the "Calendar" section from the sidebar',
        'Click on the scheduled meeting in the calendar',
        'Click the "Join meeting" button',
        'Check your audio/video settings',
        'Click "Enter the room"'
      ]
    },
    {
      id: 'create-dossier',
      title: language === 'fr' ? 'Comment créer un dossier patient' : 'How to create a patient file',
      icon: FileText,
      duration: '3 min',
      steps: language === 'fr' ? [
        'Allez dans "Patients" dans le menu',
        'Cliquez sur "Nouveau dossier patient"',
        'Remplissez les informations obligatoires (nom, prénom, date de naissance)',
        'Ajoutez les documents médicaux nécessaires',
        'Définissez le statut initial (En attente, En cours)',
        'Cliquez sur "Créer le dossier"'
      ] : [
        'Go to "Patients" in the menu',
        'Click on "New patient file"',
        'Fill in the required information (name, surname, date of birth)',
        'Add the necessary medical documents',
        'Set the initial status (Pending, In progress)',
        'Click "Create file"'
      ]
    },
    {
      id: 'share-documents',
      title: language === 'fr' ? 'Comment partager des documents' : 'How to share documents',
      icon: FileText,
      duration: '2 min',
      steps: language === 'fr' ? [
        'Ouvrez votre espace de travail',
        'Sélectionnez le document à partager',
        'Cliquez sur "Partager"',
        'Choisissez les participants avec qui partager',
        'Définissez les permissions (lecture seule ou édition)',
        'Cliquez sur "Envoyer"'
      ] : [
        'Open your workspace',
        'Select the document to share',
        'Click "Share"',
        'Choose the participants to share with',
        'Set permissions (read-only or edit)',
        'Click "Send"'
      ]
    },
    {
      id: 'annotate-imagery',
      title: language === 'fr' ? 'Comment annoter une imagerie' : 'How to annotate imagery',
      icon: FileText,
      duration: '3 min',
      steps: language === 'fr' ? [
        'Ouvrez le dossier patient contenant l\'imagerie',
        'Cliquez sur l\'imagerie DICOM à annoter',
        'Sélectionnez l\'outil d\'annotation (crayon, texte, forme)',
        'Ajoutez vos annotations sur les zones d\'intérêt',
        'Les suggestions IA apparaîtront automatiquement',
        'Sauvegardez vos annotations'
      ] : [
        'Open the patient file containing the imagery',
        'Click on the DICOM image to annotate',
        'Select the annotation tool (pen, text, shape)',
        'Add your annotations on areas of interest',
        'AI suggestions will appear automatically',
        'Save your annotations'
      ]
    }
  ];

  const faqItems = language === 'fr' ? [
    {
      question: 'Comment réinitialiser mon mot de passe ?',
      answer: 'Sur la page de connexion, cliquez sur "Mot de passe oublié ?" et suivez les instructions. Un email sécurisé vous sera envoyé avec un lien de réinitialisation valide pendant 1 heure.'
    },
    {
      question: 'Pourquoi suis-je déconnecté automatiquement ?',
      answer: 'Pour des raisons de sécurité, votre session expire automatiquement après 30 minutes d\'inactivité. Cela garantit la protection des données médicales sensibles.'
    },
    {
      question: 'Comment l\'IA suggère-t-elle des créneaux de réunion ?',
      answer: 'L\'assistant IA analyse les disponibilités de tous les participants via leurs calendriers synchronisés et propose automatiquement les meilleurs créneaux où le maximum de participants sont disponibles.'
    },
    {
      question: 'Les conversations de chat sont-elles sauvegardées ?',
      answer: 'Oui, toutes les conversations de chat pendant les réunions RCP sont automatiquement archivées et associées au dossier patient correspondant pour une traçabilité complète.'
    },
    {
      question: 'Comment synchroniser mon calendrier Google ou Outlook ?',
      answer: 'Allez dans Paramètres > Intégrations, puis cliquez sur "Synchroniser avec Google Calendar" ou "Synchroniser avec Outlook". Suivez les instructions d\'autorisation pour connecter votre compte.'
    },
    {
      question: 'Qu\'arrive-t-il aux annotations IA ?',
      answer: 'Les suggestions d\'annotations IA sont présentées comme des calques séparés. Vous pouvez les valider, les modifier ou les rejeter. Une fois validées, elles sont intégrées au rapport final avec traçabilité complète.'
    }
  ] : [
    {
      question: 'How to reset my password?',
      answer: 'On the login page, click on "Forgot password?" and follow the instructions. A secure email will be sent to you with a reset link valid for 1 hour.'
    },
    {
      question: 'Why am I automatically logged out?',
      answer: 'For security reasons, your session automatically expires after 30 minutes of inactivity. This ensures the protection of sensitive medical data.'
    },
    {
      question: 'How does AI suggest meeting slots?',
      answer: 'The AI assistant analyzes the availability of all participants via their synchronized calendars and automatically suggests the best slots where the maximum number of participants are available.'
    },
    {
      question: 'Are chat conversations saved?',
      answer: 'Yes, all chat conversations during RCP meetings are automatically archived and associated with the corresponding patient file for complete traceability.'
    },
    {
      question: 'How to sync my Google or Outlook calendar?',
      answer: 'Go to Settings > Integrations, then click on "Sync with Google Calendar" or "Sync with Outlook". Follow the authorization instructions to connect your account.'
    },
    {
      question: 'What happens to AI annotations?',
      answer: 'AI annotation suggestions are presented as separate layers. You can validate, modify or reject them. Once validated, they are integrated into the final report with complete traceability.'
    }
  ];

  const videoTutorials = [
    {
      id: '1',
      title: language === 'fr' ? 'Démarrage rapide - Vue d\'ensemble de OncoCollab' : 'Quick Start - OncoCollab Overview',
      duration: '5:30',
      thumbnail: '🎬',
      description: language === 'fr' ? 'Découvrez les fonctionnalités principales de la plateforme' : 'Discover the main features of the platform'
    },
    {
      id: '2',
      title: language === 'fr' ? 'Organiser une réunion RCP complète' : 'Organizing a complete RCP meeting',
      duration: '8:15',
      thumbnail: '📹',
      description: language === 'fr' ? 'De la planification à la génération du rapport final' : 'From planning to final report generation'
    },
    {
      id: '3',
      title: language === 'fr' ? 'Utiliser l\'assistant IA pour la planification' : 'Using the AI assistant for planning',
      duration: '4:45',
      thumbnail: '🤖',
      description: language === 'fr' ? 'Optimisez vos planifications avec l\'intelligence artificielle' : 'Optimize your planning with artificial intelligence'
    },
    {
      id: '4',
      title: language === 'fr' ? 'Annotations collaboratives sur imagerie médicale' : 'Collaborative annotations on medical imagery',
      duration: '6:20',
      thumbnail: '🖼️',
      description: language === 'fr' ? 'Travaillez en équipe sur les images DICOM' : 'Work as a team on DICOM images'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0f1419] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white mb-1">{t.help.title}</h1>
          <p className="text-gray-400">
            {t.help.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
            <Download className="w-4 h-4 mr-2" />
            {t.help.downloadPdf}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="guides" className="space-y-6">
        <TabsList className="bg-[#1a1f2e] border border-gray-800">
          <TabsTrigger value="guides">{t.help.quickGuides}</TabsTrigger>
          <TabsTrigger value="videos">{t.help.videoTutorials}</TabsTrigger>
          <TabsTrigger value="faq">{t.help.faq}</TabsTrigger>
        </TabsList>

        {/* Quick Start Guides */}
        <TabsContent value="guides" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {quickStartGuides.map((guide) => (
              <Card key={guide.id} className="bg-[#1a1f2e] border-gray-800">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <guide.icon className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white">{guide.title}</CardTitle>
                        <CardDescription className="text-gray-400 mt-1">
                          {t.help.duration}: {guide.duration}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {guide.steps.map((step, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs">{index + 1}</span>
                        </div>
                        <p className="text-gray-300 text-sm">{step}</p>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                    onClick={() => setActiveGuide(guide.id)}
                  >
                    {t.help.followGuide}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Resources */}
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">{t.help.additionalResources}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-800 rounded-lg">
                <Settings className="w-8 h-8 text-blue-400 mb-3" />
                <h4 className="text-white mb-2">{t.help.initialSetup}</h4>
                <p className="text-sm text-gray-400 mb-3">
                  {t.help.initialSetupDesc}
                </p>
                <Button variant="link" className="text-blue-400 hover:text-blue-300 p-0">
                  {t.help.learnMore} →
                </Button>
              </div>

              <div className="p-4 bg-gray-800 rounded-lg">
                <Users className="w-8 h-8 text-purple-400 mb-3" />
                <h4 className="text-white mb-2">{t.help.teamManagement}</h4>
                <p className="text-sm text-gray-400 mb-3">
                  {t.help.teamManagementDesc}
                </p>
                <Button variant="link" className="text-blue-400 hover:text-blue-300 p-0">
                  {t.help.learnMore} →
                </Button>
              </div>

              <div className="p-4 bg-gray-800 rounded-lg">
                <Calendar className="w-8 h-8 text-green-400 mb-3" />
                <h4 className="text-white mb-2">{t.help.synchronization}</h4>
                <p className="text-sm text-gray-400 mb-3">
                  {t.help.synchronizationDesc}
                </p>
                <Button variant="link" className="text-blue-400 hover:text-blue-300 p-0">
                  {t.help.learnMore} →
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Video Tutorials */}
        <TabsContent value="videos" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {videoTutorials.map((video) => (
              <Card key={video.id} className="bg-[#1a1f2e] border-gray-800">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gray-900 rounded-t-lg flex items-center justify-center text-6xl">
                    {video.thumbnail}
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white mb-2">{video.title}</h3>
                        <p className="text-sm text-gray-400">{video.description}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {video.duration}
                      </Badge>
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <Play className="w-4 h-4 mr-2" />
                      {t.help.watch}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq" className="space-y-6">
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-blue-400" />
                {t.help.faqTitle}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {t.help.faqSubtitle}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-gray-800">
                    <AccordionTrigger className="text-white hover:text-blue-400">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-400">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">{t.help.needMoreHelp}</CardTitle>
              <CardDescription className="text-gray-400">
                {t.help.supportAvailable}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Button className="bg-blue-600 hover:bg-blue-700">
                {t.help.contactSupport}
              </Button>
              <Button variant="outline" className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                {t.help.reportIssue}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
