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

export function HelpGuide() {
  const [activeGuide, setActiveGuide] = useState<string | null>(null);

  const quickStartGuides = [
    {
      id: 'join-meeting',
      title: 'Comment rejoindre une réunion RCP',
      icon: Video,
      duration: '2 min',
      steps: [
        'Accédez à la section "Calendrier" depuis le menu latéral',
        'Cliquez sur la réunion prévue dans le calendrier',
        'Cliquez sur le bouton "Rejoindre la réunion"',
        'Vérifiez vos paramètres audio/vidéo',
        'Cliquez sur "Entrer dans la salle"'
      ]
    },
    {
      id: 'create-dossier',
      title: 'Comment créer un dossier patient',
      icon: FileText,
      duration: '3 min',
      steps: [
        'Allez dans "Patients" dans le menu',
        'Cliquez sur "Nouveau dossier patient"',
        'Remplissez les informations obligatoires (nom, prénom, date de naissance)',
        'Ajoutez les documents médicaux nécessaires',
        'Définissez le statut initial (En attente, En cours)',
        'Cliquez sur "Créer le dossier"'
      ]
    },
    {
      id: 'share-documents',
      title: 'Comment partager des documents',
      icon: FileText,
      duration: '2 min',
      steps: [
        'Ouvrez votre espace de travail',
        'Sélectionnez le document à partager',
        'Cliquez sur "Partager"',
        'Choisissez les participants avec qui partager',
        'Définissez les permissions (lecture seule ou édition)',
        'Cliquez sur "Envoyer"'
      ]
    },
    {
      id: 'annotate-imagery',
      title: 'Comment annoter une imagerie',
      icon: FileText,
      duration: '3 min',
      steps: [
        'Ouvrez le dossier patient contenant l\'imagerie',
        'Cliquez sur l\'imagerie DICOM à annoter',
        'Sélectionnez l\'outil d\'annotation (crayon, texte, forme)',
        'Ajoutez vos annotations sur les zones d\'intérêt',
        'Les suggestions IA apparaîtront automatiquement',
        'Sauvegardez vos annotations'
      ]
    }
  ];

  const faqItems = [
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
  ];

  const videoTutorials = [
    {
      id: '1',
      title: 'Démarrage rapide - Vue d\'ensemble de OncoLlab',
      duration: '5:30',
      thumbnail: '🎬',
      description: 'Découvrez les fonctionnalités principales de la plateforme'
    },
    {
      id: '2',
      title: 'Organiser une réunion RCP complète',
      duration: '8:15',
      thumbnail: '📹',
      description: 'De la planification à la génération du rapport final'
    },
    {
      id: '3',
      title: 'Utiliser l\'assistant IA pour la planification',
      duration: '4:45',
      thumbnail: '🤖',
      description: 'Optimisez vos planifications avec l\'intelligence artificielle'
    },
    {
      id: '4',
      title: 'Annotations collaboratives sur imagerie médicale',
      duration: '6:20',
      thumbnail: '🖼️',
      description: 'Travaillez en équipe sur les images DICOM'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0f1419] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white mb-1">Centre d'aide</h1>
          <p className="text-gray-400">
            Guides, tutoriels et FAQ pour utiliser OncoLab efficacement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
            <Download className="w-4 h-4 mr-2" />
            Guide PDF complet
          </Button>
        </div>
      </div>

      <Tabs defaultValue="guides" className="space-y-6">
        <TabsList className="bg-[#1a1f2e] border border-gray-800">
          <TabsTrigger value="guides">Guides rapides</TabsTrigger>
          <TabsTrigger value="videos">Tutoriels vidéo</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
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
                          Durée: {guide.duration}
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
                    Suivre le guide
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Resources */}
          <Card className="bg-[#1a1f2e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Ressources supplémentaires</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-800 rounded-lg">
                <Settings className="w-8 h-8 text-blue-400 mb-3" />
                <h4 className="text-white mb-2">Configuration initiale</h4>
                <p className="text-sm text-gray-400 mb-3">
                  Paramétrez votre profil et vos préférences
                </p>
                <Button variant="link" className="text-blue-400 hover:text-blue-300 p-0">
                  En savoir plus →
                </Button>
              </div>

              <div className="p-4 bg-gray-800 rounded-lg">
                <Users className="w-8 h-8 text-purple-400 mb-3" />
                <h4 className="text-white mb-2">Gestion d'équipe</h4>
                <p className="text-sm text-gray-400 mb-3">
                  Invitez et gérez les membres de votre équipe
                </p>
                <Button variant="link" className="text-blue-400 hover:text-blue-300 p-0">
                  En savoir plus →
                </Button>
              </div>

              <div className="p-4 bg-gray-800 rounded-lg">
                <Calendar className="w-8 h-8 text-green-400 mb-3" />
                <h4 className="text-white mb-2">Synchronisation</h4>
                <p className="text-sm text-gray-400 mb-3">
                  Synchronisez avec vos calendriers externes
                </p>
                <Button variant="link" className="text-blue-400 hover:text-blue-300 p-0">
                  En savoir plus →
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
                      Regarder
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
                Questions fréquemment posées
              </CardTitle>
              <CardDescription className="text-gray-400">
                Trouvez rapidement des réponses aux questions les plus courantes
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
              <CardTitle className="text-white">Besoin d'aide supplémentaire ?</CardTitle>
              <CardDescription className="text-gray-400">
                Notre équipe de support est disponible pour vous aider
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Contacter le support
              </Button>
              <Button variant="outline" className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                Signaler un problème
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
