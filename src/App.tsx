import { useState, useEffect, useMemo } from 'react';
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
import { PrerequisiteFormPage, type PrerequisiteFormContext } from './components/PrerequisiteFormPage';
import { PrerequisitesPreparationPage } from './components/PrerequisitesPreparationPage';
import { ScheduleRCPModal } from './components/ScheduleRCPModal';
import { FloatingVideoWindow } from './components/FloatingVideoWindow';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { authService } from './services/auth.service';
import { LanguageProvider } from './i18n';
import { WebRTCProvider, useWebRTC } from './contexts/WebRTCContext';
import { VideoProvider, useVideo } from './contexts/VideoContext';

export type UserRole = 'radiologue' | 'oncologue' | 'chirurgien' | 'pathologiste' | 'infirmier' | 'coordinateur' | 'pharmacien' | 'admin';

/**
 * Fenêtre vidéo flottante qui apparaît quand on navigue hors de la page vidéo
 * tout en restant connecté à une room WebRTC
 * ⭐ Utilise useMemo pour éviter les remount inutiles
 */
function FloatingVideoOverlay({ currentPage, meetingTitle }: { currentPage: string; meetingTitle: string }) {
  const { currentRoomId, participants, leaveRoom } = useWebRTC();
  const { stream, isMicOn, isCameraOn, setMicOn, setCameraOn } = useVideo();

  // N'afficher que si on est connecté à une room ET pas sur la page vidéo
  if (!currentRoomId || currentPage === 'video') {
    return null;
  }

  // Collecter les remote streams avec useMemo pour éviter les recréations inutiles
  const remoteStreams = useMemo(() => {
    const map = new Map<string, MediaStream>();
    participants.forEach((p, socketId) => {
      if (p.stream) {
        map.set(socketId, p.stream);
      }
    });
    return map;
  }, [participants]);

  console.log('[App] 🪟 FloatingVideoOverlay actif - room=' + currentRoomId + ', remotes=' + remoteStreams.size + ', page=' + currentPage);

  return (
    <FloatingVideoWindow
      meetingId={currentRoomId}
      meetingTitle={meetingTitle}
      localStream={stream}
      remoteStreams={remoteStreams}
      isVideoEnabled={isCameraOn}
      isAudioEnabled={isMicOn}
      onToggleVideo={() => setCameraOn(!isCameraOn)}
      onToggleAudio={() => setMicOn(!isMicOn)}
      onClose={leaveRoom}
    />
  );
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type Page = 'dashboard' | 'dossiers' | 'dossier-detail' | 'reunions' | 'video' | 'workspace' | 'messagerie' | 'agentia' | 'calendrier' | 'aide' | 'parametres' | 'prerequisites' | 'mes-prerequis' | 'prerequisite-form' | 'prerequisite-preparation';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(null);
  const [selectedMeetingInfo, setSelectedMeetingInfo] = useState<{
    meetingId?: string;
    title: string;
    date: string;
    time: string;
    roomId?: string;
    patientName?: string;
  } | null>(null);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [prerequisiteContext, setPrerequisiteContext] = useState<PrerequisiteFormContext | null>(null);

  // Restaurer la session au chargement de la page (async pour Supabase auto-refresh)
  useEffect(() => {
    authService.restoreSession().then((restored) => {
      if (restored) {
        const { user, token } = restored;

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
      } else {
        // Vérifier si une session existait mais a expiré
        const oldSession = authService.getSession();
        if (oldSession) {
          authService.logout();
          toast.error('Session expirée. Veuillez vous reconnecter.');
        }
      }
    }).catch(() => {
      authService.logout();
    });
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

  const handleLogout = async () => {
    const source = authService.getAuthSource();
    if (source === 'supabase') {
      await authService.logoutSupabase();
    } else {
      authService.logout();
    }
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

  const navigateFromPrerequisites = (page: Page) => {
    if (page === 'video' && selectedMeetingInfo?.meetingId && !selectedMeetingInfo.roomId) {
      setSelectedMeetingInfo((prev) =>
        prev ? { ...prev, roomId: prev.meetingId } : prev
      );
    }
    setCurrentPage(page);
  };

  const navigateToPrerequisites = (meetingInfo: { meetingId?: string; title: string; date: string; time: string; roomId?: string; patientName?: string }) => {
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

  const navigateToPrerequisiteForm = (context: PrerequisiteFormContext) => {
    setPrerequisiteContext(context);
    window.history.pushState({}, '', `/prerequisite/${encodeURIComponent(context.prerequisiteId)}`);
    setCurrentPage('prerequisite-form');
  };

  const navigateToPrerequisitePreparation = (meetingId: string, meetingTitle: string) => {
    setSelectedMeetingInfo({
      meetingId,
      title: meetingTitle,
      date: new Date().toISOString(),
      time: new Date().toLocaleTimeString(),
    });
    setCurrentPage('prerequisite-preparation');
  };

  // ⭐ UN SEUL PROVIDER GLOBAL pour toute l'application
  // Cela garantit que le socket et les PeerConnections persistent
  return (
    <VideoProvider>
      <WebRTCProvider>
        <LanguageProvider>
          {!isAuthenticated ? (
            // Page de login
            <>
              <LoginPage onLogin={handleLogin} />
              <Toaster />
            </>
          ) : (
            // Application authentifiée
            <>
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
                      {currentPage === 'reunions' && <RCPMeetings onNavigate={navigateTo} onNavigateToPrerequisites={navigateToPrerequisites} onNavigateToVideo={navigateToVideo} currentUser={currentUser} authToken={authToken} />}
                      {currentPage === 'prerequisites' && selectedMeetingInfo && (
                        <MeetingPrerequisitesCheck
                          onNavigate={navigateFromPrerequisites}
                          onOpenPrerequisiteForm={navigateToPrerequisiteForm}
                          userRole={currentUser!.role}
                          meetingId={selectedMeetingInfo.meetingId}
                          meetingTitle={selectedMeetingInfo.title}
                          meetingDate={selectedMeetingInfo.date}
                          meetingTime={selectedMeetingInfo.time}
                        />
                      )}
                      {currentPage === 'workspace' && <WorkspaceDocuments userName={currentUser!.name} userRole={currentUser!.role} />}
                      {currentPage === 'messagerie' && <Messaging />}
                      {currentPage === 'agentia' && <AgentIA onNavigate={navigateTo} />}
                      {currentPage === 'calendrier' && <CalendarAdvanced onNavigate={navigateTo} onNavigateToPrerequisitePreparation={navigateToPrerequisitePreparation} onNavigateToPrerequisites={navigateToPrerequisites} onOpenPrerequisiteForm={navigateToPrerequisiteForm} currentUser={currentUser!} authToken={authToken} />}
                      {currentPage === 'aide' && <HelpGuide />}
                      {currentPage === 'parametres' && <Settings user={currentUser!} />}
                      {currentPage === 'mes-prerequis' && (
                        <MyPrerequisites
                          userRole={currentUser!.role}
                          onNavigate={navigateTo}
                          onOpenPrerequisiteForm={navigateToPrerequisiteForm}
                          onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
                          onOpenPrerequisitePreparation={navigateToPrerequisitePreparation}
                        />
                      )}
                      {currentPage === 'prerequisite-form' && prerequisiteContext && (
                        <PrerequisiteFormPage
                          key={`${prerequisiteContext.meetingId}::${prerequisiteContext.prerequisiteId}::${prerequisiteContext.role}`}
                          context={prerequisiteContext}
                          onBack={() => {
                            setCurrentPage(prerequisiteContext.returnPage);
                          }}
                        />
                      )}
                      {currentPage === 'prerequisite-preparation' && selectedMeetingInfo?.meetingId && (
                        <PrerequisitesPreparationPage
                          meetingId={selectedMeetingInfo.meetingId}
                          meetingTitle={selectedMeetingInfo.title}
                          userRole={currentUser!.role}
                          authToken={authToken}
                          onNavigate={navigateTo}
                        />
                      )}
                    </main>
                  </div>

                  {/* Schedule RCP Modal */}
                  <ScheduleRCPModal
                    isOpen={isScheduleModalOpen}
                    onClose={() => setIsScheduleModalOpen(false)}
                    currentUserId={currentUser!.id}
                    currentUserName={currentUser!.name}
                    authToken={authToken}
                    onSuccess={() => {
                      // Refresh the meetings list after creating a new one
                      toast.success('Réunion créée avec succès!');
                    }}
                  />

                  <Toaster />
                </div>
              )}

              {/* Fenêtre vidéo flottante - visible quand connecté à une room mais pas sur la page vidéo */}
              <FloatingVideoOverlay
                currentPage={currentPage}
                meetingTitle={selectedMeetingInfo?.title || 'RCP'}
              />
            </>
          )}
        </LanguageProvider>
      </WebRTCProvider>
    </VideoProvider>
  );
}