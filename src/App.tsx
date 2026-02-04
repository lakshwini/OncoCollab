import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { DashboardAdvanced } from './components/DashboardAdvanced';
import { PatientDossiers } from './components/PatientDossiers';
import { DossierDetail } from './components/DossierDetail';
import { RCPMeetings } from './components/RCPMeetings';
import { VideoConferenceWrapper } from './components/VideoConferenceWrapper';
import { CalendarAdvanced } from './components/CalendarAdvanced';
import { WorkspaceDocuments } from './components/WorkspaceDocuments';
import { Messaging } from './components/Messaging';
import { AgentIA } from './components/AgentIA';
import { HelpGuide } from './components/HelpGuide';
import { Settings } from './components/Settings';
import { MeetingPrerequisitesCheck } from './components/MeetingPrerequisitesCheck';
import { MyPrerequisites } from './components/MyPrerequisites';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { authService } from './services/auth.service';
import { LanguageProvider } from './i18n';

export type UserRole = 'radiologue' | 'oncologue' | 'chirurgien' | 'pathologiste' | 'infirmier' | 'coordinateur' | 'pharmacien' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type Page = 'dashboard' | 'dossiers' | 'dossier-detail' | 'reunions' | 'video' | 'workspace' | 'messagerie' | 'agentia' | 'calendrier' | 'aide' | 'parametres' | 'prerequisites' | 'mes-prerequis';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(null);
  const [selectedMeetingInfo, setSelectedMeetingInfo] = useState<{
    title: string;
    date: string;
    time: string;
    roomId?: string;
    patientName?: string;
  } | null>(null);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Restaurer la session au chargement de la page
  useEffect(() => {
    const session = authService.getSession();
    if (session && authService.isSessionValid()) {
      const { user, token } = session;

      // Transformer le user du service vers le format App.tsx
      const appUser: User = {
        id: user.id,
        name: `${user.prenom} ${user.nom}`,
        email: user.email,
        role: user.role.toLowerCase() as UserRole,
      };

      setCurrentUser(appUser);
      setAuthToken(token);
      setIsAuthenticated(true);
      setLastActivityTime(authService.getLastActivity());

      toast.success(`Session restaurée - Bienvenue, ${appUser.name}!`);
    } else if (session) {
      // Session expirée
      authService.logout();
      toast.error('Session expirée. Veuillez vous reconnecter.');
    }
  }, []);

  // Session management - 30 min auto logout
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkInactivity = setInterval(() => {
      const inactiveTime = Date.now() - lastActivityTime;
      const thirtyMinutes = 30 * 60 * 1000;
      const twentyNineMinutes = 29 * 60 * 1000;

      if (inactiveTime >= thirtyMinutes) {
        handleLogout();
        toast.error('Session expirée après 30 minutes d\'inactivité');
      } else if (inactiveTime >= twentyNineMinutes && !showInactivityWarning) {
        setShowInactivityWarning(true);
        toast.warning('Votre session expirera dans 1 minute');
      }
    }, 60000); // Check every minute

    const resetTimer = () => {
      const now = Date.now();
      setLastActivityTime(now);
      setShowInactivityWarning(false);
      // Synchroniser avec le service d'authentification
      authService.updateLastActivity();
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);

    return () => {
      clearInterval(checkInactivity);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [isAuthenticated, lastActivityTime, showInactivityWarning]);

  const handleLogin = (user: User, token?: string) => {
    setCurrentUser(user);
    setAuthToken(token || null);
    setIsAuthenticated(true);
    setLastActivityTime(Date.now());
    // La session est déjà sauvegardée dans authService.login()
    toast.success(`Bienvenue, ${user.name}!`, {
      description: 'Connexion sécurisée établie'
    });
  };

  const handleLogout = () => {
    // Nettoyer la session avec le service d'authentification
    authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setAuthToken(null);
    setCurrentPage('dashboard');
    setShowInactivityWarning(false);
    toast.info('Vous avez été déconnecté');
  };

  const navigateTo = (page: Page, dossierId?: string) => {
    setCurrentPage(page);
    if (dossierId) {
      setSelectedDossierId(dossierId);
    }
  };

  const navigateToPrerequisites = (meetingInfo: { title: string; date: string; time: string; roomId?: string; patientName?: string }) => {
    setSelectedMeetingInfo(meetingInfo);
    setCurrentPage('prerequisites');
  };

  const navigateToVideo = (meetingInfo: { title: string; roomId: string; patientName?: string }) => {
    setSelectedMeetingInfo({
      title: meetingInfo.title,
      date: new Date().toISOString(),
      time: new Date().toLocaleTimeString(),
      roomId: meetingInfo.roomId,
      patientName: meetingInfo.patientName,
    });
    setCurrentPage('video');
  };

  if (!isAuthenticated) {
    return (
      <LanguageProvider>
        <LoginPage onLogin={handleLogin} />
        <Toaster />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      {/* Video Conference - Plein écran exclusif, pas de sidebar/header */}
      {currentPage === 'video' ? (
        <VideoConferenceWrapper
          onClose={() => navigateTo('reunions')}
          meetingTitle={selectedMeetingInfo?.title || 'RCP'}
          patientName={selectedMeetingInfo?.patientName}
          roomId={selectedMeetingInfo?.roomId}
          authToken={authToken}
          currentUser={currentUser}
        />
      ) : (
        <div className="flex h-screen bg-[#0f1419]">
          <Sidebar currentPage={currentPage} onNavigate={navigateTo} userRole={currentUser!.role} />

          <div className="flex-1 flex flex-col overflow-hidden">
            <Header user={currentUser!} onLogout={handleLogout} />

            <main className="flex-1 overflow-y-auto">
              {currentPage === 'dashboard' && <DashboardAdvanced onNavigate={navigateTo} />}
              {currentPage === 'dossiers' && <PatientDossiers onNavigate={navigateTo} />}
              {currentPage === 'dossier-detail' && <DossierDetail dossierId={selectedDossierId!} onBack={() => navigateTo('dossiers')} />}
              {currentPage === 'reunions' && <RCPMeetings onNavigate={navigateTo} onNavigateToPrerequisites={navigateToPrerequisites} onNavigateToVideo={navigateToVideo} currentUser={currentUser} />}
              {currentPage === 'prerequisites' && selectedMeetingInfo && (
                <MeetingPrerequisitesCheck
                  onNavigate={navigateTo}
                  userRole={currentUser!.role}
                  meetingTitle={selectedMeetingInfo.title}
                  meetingDate={selectedMeetingInfo.date}
                  meetingTime={selectedMeetingInfo.time}
                />
              )}
              {currentPage === 'workspace' && <WorkspaceDocuments userName={currentUser!.name} userRole={currentUser!.role} />}
              {currentPage === 'messagerie' && <Messaging />}
              {currentPage === 'agentia' && <AgentIA onNavigate={navigateTo} />}
              {currentPage === 'calendrier' && <CalendarAdvanced onNavigate={navigateTo} />}
              {currentPage === 'aide' && <HelpGuide />}
              {currentPage === 'parametres' && <Settings user={currentUser!} />}
              {currentPage === 'mes-prerequis' && <MyPrerequisites userRole={currentUser!.role} onNavigate={navigateTo} />}
            </main>
          </div>
          <Toaster />
        </div>
      )}
    </LanguageProvider>
  );
}