import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { User } from '../App';
import { useLanguage } from '../i18n';
import { useWebRTC } from '../contexts/WebRTCContext';
import { useVideo } from '../contexts/VideoContext';
import {
  X,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  Share2,
  MessageSquare,
  Users,
  Send,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Download,
  MoreVertical,
  Copy,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  User as UserIcon,
  Activity,
  Stethoscope,
  PanelLeftClose,
  PanelRightClose,
  Upload,
  Search,
  RotateCcw,
  Square,
  Circle,
  Type,
  MousePointer,
  Pencil,
  ClipboardList,
} from 'lucide-react';
import { PrerequisitesTab } from './PrerequisitesTab';
import { PrerequisiteModulePlaceholder } from './PrerequisiteModulePlaceholder';
import {
  fetchMeetingPrerequisiteDetails,
  type PrerequisiteDetailsResponse,
  type PrerequisiteItemDetail,
  type ParticipantDetail,
} from '../services/prerequisites.service';

interface InitialSettings {
  micEnabled?: boolean;
  videoEnabled?: boolean;
  selectedMicrophone?: string;
  selectedCamera?: string;
  selectedSpeaker?: string;
  audioMode?: 'computer' | 'phone' | 'room' | 'none';
}

interface VideoConferenceAdvancedProps {
  onClose: () => void;
  patientName?: string;
  meetingTitle?: string;
  authToken?: string | null;
  roomId?: string;
  serverUrl?: string;
  currentUser?: User | null;
  initialSettings?: InitialSettings;
}

// Colors used throughout the component
const C = {
  bg: '#1a1a1a',
  bgHeader: '#252525',
  bgPanel: '#202020',
  bgCard: '#2a2a2a',
  bgCardHover: '#333333',
  bgControl: '#333333',
  bgControlHover: '#444444',
  border: '#333333',
  borderLight: '#444444',
  textWhite: '#ffffff',
  textGray: '#9ca3af',
  textGrayLight: '#d1d5db',
  textGrayDark: '#6b7280',
  textGrayDarker: '#4b5563',
  blue: '#3b82f6',
  blueDark: '#1d4ed8',
  blueLight: '#60a5fa',
  red: '#ef4444',
  redDark: '#dc2626',
  green: '#22c55e',
  yellow: '#eab308',
  cyan: '#22d3ee',
  orange: '#f97316',
  purple: '#a855f7',
};

// ✅ Défini HORS du composant pour éviter les remount React à chaque render
const ControlButton = ({ onClick, active, danger, children, label }: {
  onClick: () => void | Promise<void>;
  active?: boolean;
  danger?: boolean;
  children: React.ReactNode;
  label?: string;
}) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      console.log('[ControlButton] 🖱️ Button clicked');
      onClick();
    }}
    title={label}
    style={{
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      backgroundColor: danger ? '#ef4444' : active ? '#3b82f6' : '#333333',
      color: '#ffffff',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.backgroundColor = danger ? '#dc2626' : active ? '#1d4ed8' : '#444444';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.backgroundColor = danger ? '#ef4444' : active ? '#3b82f6' : '#333333';
    }}
  >
    {children}
  </button>
);

export function VideoConferenceAdvanced({
  onClose,
  patientName,
  meetingTitle = 'RCP',
  authToken,
  roomId,
  currentUser,
  initialSettings,
}: VideoConferenceAdvancedProps) {
  const { language } = useLanguage();
  const {
    joinRoom,
    leaveRoom,
    fullLeaveRoom,
    connectionStatus,
    participants,
    mySocketId,
  } = useWebRTC();
  const {
    stream: localStream,
    isMicOn: isMicEnabled,
    isCameraOn: isVideoEnabled,
    setMicOn,
    setCameraOn,
    replaceVideoTrack,
  } = useVideo();

  const currentDoctorName = currentUser?.name || 'Docteur';
  const currentDoctorRole = currentUser?.role || 'medecin';
  const currentDoctorInitials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'DR';

  const displayPatientName = patientName || 'Patient';
  const ROOM_ID = roomId || meetingTitle.replace(/\s+/g, '-').toLowerCase();

  // Media states
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const showLocalVideo = Boolean(localStream && (isVideoEnabled || isScreenSharing));

  // UI states
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [leftPanelTab, setLeftPanelTab] = useState<'patient' | 'documents' | 'imagery' | 'prerequisites'>('patient');
  const [rightPanelTab, setRightPanelTab] = useState<'chat' | 'participants'>('chat');
  const [chatMessage, setChatMessage] = useState('');
  const [viewMode, setViewMode] = useState<'video' | 'imagery' | 'prerequisites'>('video');

  // ── Prérequis ──────────────────────────────────────────────────────────────
  const [prereqData, setPrereqData] = useState<PrerequisiteDetailsResponse | null>(null);
  const [prereqLoading, setPrereqLoading] = useState(false);
  const [prereqError, setPrereqError] = useState<string | null>(null);
  const [activePrereqItem, setActivePrereqItem] = useState<PrerequisiteItemDetail | null>(null);
  const [activePrereqDoctor, setActivePrereqDoctor] = useState<ParticipantDetail | null>(null);
  const [selectedImagery, setSelectedImagery] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [annotationTool, setAnnotationTool] = useState<'cursor' | 'pen' | 'text' | 'rectangle' | 'circle'>('cursor');
  const [searchDoc, setSearchDoc] = useState('');

  const localVideoGridRef = useRef<HTMLVideoElement>(null);
  const localVideoMiniRef = useRef<HTMLVideoElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  
  // ⭐ CRITIQUE: Référence persistante au stream - jamais stale
  const localStreamRef = useRef<MediaStream | null>(null);
  
  // Maintenir localStreamRef à jour avec le stream du contexte
  useEffect(() => {
    localStreamRef.current = localStream;
    console.log('[VideoConf] 📌 localStreamRef updated:', localStream ? 'stream present' : 'no stream');
  }, [localStream]);

  // Callback refs pour garantir que srcObject est appliqué dès le montage DOM
  const attachLocalVideoGrid = useCallback((el: HTMLVideoElement | null) => {
    localVideoGridRef.current = el;
    if (el && localStreamRef.current) {
      el.srcObject = localStreamRef.current;
      console.log('[VideoConf] ✅ Stream attaché à localVideoGridRef');
    }
  }, []);

  const attachLocalVideoMini = useCallback((el: HTMLVideoElement | null) => {
    localVideoMiniRef.current = el;
    if (el && localStreamRef.current) {
      el.srcObject = localStreamRef.current;
      console.log('[VideoConf] ✅ Stream attaché à localVideoMiniRef');
    }
  }, []);

  // Chat
  const [chatMessages, setChatMessages] = useState<{ id: string; user: string; time: string; message: string }[]>([]);

  // Mock data
  const documents = [
    { id: '1', name: 'Compte-rendu anatomopathologique', type: 'pdf', date: '12/01/2026', owner: 'Dr. Moreau', size: '2.4 MB' },
    { id: '2', name: 'Bilan sanguin complet', type: 'pdf', date: '10/01/2026', owner: 'Laboratoire', size: '1.1 MB' },
    { id: '3', name: 'Ordonnance chimiothérapie', type: 'pdf', date: '08/01/2026', owner: 'Dr. Bernard', size: '0.5 MB' },
    { id: '4', name: 'Notes de consultation', type: 'doc', date: '05/01/2026', owner: currentDoctorName, size: '0.3 MB' },
  ];

  const imageries = [
    { id: '1', name: 'IRM Cerebrale', type: 'IRM', date: '12/01/2026', slices: 24, status: 'Complet' },
    { id: '2', name: 'Scanner Thoracique', type: 'CT', date: '10/01/2026', slices: 48, status: 'Complet' },
    { id: '3', name: 'TEP Scan', type: 'PET', date: '05/01/2026', slices: 32, status: 'Complet' },
    { id: '4', name: 'Echographie abdominale', type: 'US', date: '02/01/2026', slices: 12, status: 'Partiel' },
  ];

  const patientInfo = {
    id: 'PAT-2026-001',
    name: displayPatientName,
    age: 58,
    gender: 'F',
    bloodType: 'A+',
    Cancer: ['Pulmonaire'],
    diagnosis: 'Cancer pulmonaire - Stade II',
    lastVisit: '12/01/2026',
    nextRCP: '03/02/2026',
  };

  // ⚠️ CRITIQUE : NE PAS mettre joinRoom/leaveRoom dans les deps.
  // Quand joinRoom() appelle setCurrentRoomId(), leaveRoom est recréé (nouvelle ref).
  // Si leaveRoom est dans les deps, React appelle l'ancien cleanup → stopAllMedia()
  // → caméra et micro forcés à OFF → l'état du pré-meeting est perdu.
  const joinRoomRef = useRef(joinRoom);
  const leaveRoomRef = useRef(leaveRoom);
  joinRoomRef.current = joinRoom;
  leaveRoomRef.current = leaveRoom;

  // ✅ Le stream est déjà configuré par PreMeetingSetup via VideoContext.
  // NE PAS recréer le stream ici — cela causerait une race condition avec joinRoom
  // et casserait les PeerConnections.
  useEffect(() => {
    if (initialSettings) {
      console.log('[VideoConf] 🎬 Pré-meeting settings reçus (stream déjà configuré):', {
        mic: initialSettings.micEnabled,
        camera: initialSettings.videoEnabled,
      });
    }
  }, []);

  useEffect(() => {
    if (!ROOM_ID) {
      return;
    }

    console.log('[VideoConf] 🚪 Rejoindre room avec device settings');
    joinRoomRef.current(ROOM_ID, authToken || '');
    return () => leaveRoomRef.current();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ROOM_ID, authToken]);

  // Re-attach stream to BOTH video refs whenever stream/state changes.
  // ✅ Aussi appeler .play() explicitement après toggle ON pour forcer le rendu
  useEffect(() => {
    const stream = localStreamRef.current;

    if (!stream) {
      console.log('[VideoConf] ⚠️ Pas de stream à attacher');
      return;
    }

    // ✅ TOUJOURS ré-assigner + .play() pour garantir l'affichage après toggle
    if (localVideoGridRef.current) {
      localVideoGridRef.current.srcObject = stream;
      localVideoGridRef.current.play().catch(() => {});
      const videoTrack = stream.getVideoTracks()[0];
      console.log('[VideoConf] ✅ Stream attaché à localVideoGridRef - videoTrack.enabled =', videoTrack?.enabled);
    }

    if (localVideoMiniRef.current) {
      localVideoMiniRef.current.srcObject = stream;
      localVideoMiniRef.current.play().catch(() => {});
      const videoTrack = stream.getVideoTracks()[0];
      console.log('[VideoConf] ✅ Stream attaché à localVideoMiniRef - videoTrack.enabled =', videoTrack?.enabled);
    }

    // Log state pour debug
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];
    console.log('[VideoConf] 📊 Stream state: viewMode=' + viewMode + ', videoTrack.enabled=' + videoTrack?.enabled + ', audioTrack.enabled=' + audioTrack?.enabled);
  }, [localStream, viewMode, isVideoEnabled, isMicEnabled]);

  // ── Chargement des prérequis (lazy : uniquement quand l'onglet est ouvert) ──
  useEffect(() => {
    if (leftPanelTab !== 'prerequisites') return;
    if (prereqData !== null) return; // déjà chargé
    if (!roomId) {
      setPrereqError(language === 'fr' ? 'ID réunion manquant' : 'Missing meeting ID');
      return;
    }

    let cancelled = false;
    setPrereqLoading(true);
    setPrereqError(null);

    fetchMeetingPrerequisiteDetails(roomId, authToken ?? null)
      .then(data => {
        if (!cancelled) {
          setPrereqData(data);
          setPrereqLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error('[VideoConf] ❌ Erreur chargement prérequis:', err);
          setPrereqError(err.message ?? (language === 'fr' ? 'Erreur de chargement' : 'Load error'));
          setPrereqLoading(false);
        }
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftPanelTab, roomId]);

  const handleSelectPrereqItem = useCallback(
    (item: PrerequisiteItemDetail, doctor: ParticipantDetail) => {
      setActivePrereqItem(item);
      setActivePrereqDoctor(doctor);
      setViewMode('prerequisites');
    },
    [],
  );

  const handleClosePrereqModule = useCallback(() => {
    setActivePrereqItem(null);
    setActivePrereqDoctor(null);
    setViewMode('video');
  }, []);

  const remoteParticipants = useMemo(() => {
    return Array.from(participants.entries()).filter(([id]) => id !== mySocketId);
  }, [participants, mySocketId]);

  const remoteStreams = useMemo(() => {
    const map = new Map<string, MediaStream>();
    remoteParticipants.forEach(([id, participant]) => {
      if (participant.stream) {
        map.set(id, participant.stream);
      }
    });
    return map;
  }, [remoteParticipants]);

  const handleSendMessage = () => {
    const content = chatMessage.trim();
    if (!content) {
      return;
    }
    setChatMessages(prev => [...prev, {
      id: String(Date.now()),
      user: 'Vous',
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      message: content,
    }]);
    setChatMessage('');
  };

  const restoreCameraTrack = useCallback(async () => {
    try {
      await setCameraOn(true, initialSettings?.selectedCamera);
    } catch (error) {
      console.error('[VideoConf] ❌ Erreur restore camera:', error);
    }
  }, [setCameraOn, initialSettings]);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing) {
        screenStreamRef.current?.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
        setIsScreenSharing(false);
        await restoreCameraTrack();
        return;
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) {
        return;
      }

      screenStreamRef.current = screenStream;
      replaceVideoTrack(screenTrack);
      setIsScreenSharing(true);

      screenTrack.onended = () => {
        setIsScreenSharing(false);
        screenStreamRef.current = null;
        restoreCameraTrack();
      };
    } catch (err) {
      console.error('[VideoConf] ❌ Erreur partage ecran:', err);
    }
  }, [isScreenSharing, replaceVideoTrack, restoreCameraTrack]);

  // ✅ Déléguer entièrement au VideoContext - il gère tracks + state
  const handleToggleMic = useCallback(async () => {
    console.log('[VideoConf] 🎤 ========== TOGGLE MIC CLICKED ==========');
    console.log('[VideoConf] 🎤 État actuel:', isMicEnabled);
    console.log('[VideoConf] 🎤 Nouveau état:', !isMicEnabled);
    try {
      await setMicOn(!isMicEnabled);
      console.log('[VideoConf] ✅ Mic toggled successfully');
    } catch (error) {
      console.error('[VideoConf] ❌ Erreur toggle mic:', error);
    }
  }, [isMicEnabled, setMicOn]);

  const handleToggleCamera = useCallback(async () => {
    console.log('[VideoConf] 📹 ========== TOGGLE CAMERA CLICKED ==========');
    console.log('[VideoConf] 📹 État actuel:', isVideoEnabled);
    console.log('[VideoConf] 📹 Nouveau état:', !isVideoEnabled);
    try {
      await setCameraOn(!isVideoEnabled);
      console.log('[VideoConf] ✅ Camera toggled successfully');
    } catch (error) {
      console.error('[VideoConf] ❌ Erreur toggle camera:', error);
    }
  }, [isVideoEnabled, setCameraOn]);

  const handleToggleLeftPanel = useCallback(() => {
    console.log('[VideoConf] 📂 Toggle left panel');
    setLeftPanelOpen(prev => !prev);
  }, []);

  const handleToggleRightPanel = useCallback(() => {
    console.log('[VideoConf] 💬 Toggle right panel');
    if (rightPanelOpen && rightPanelTab === 'chat') {
      setRightPanelOpen(false);
    } else {
      setRightPanelOpen(true);
      setRightPanelTab('chat');
    }
  }, [rightPanelOpen, rightPanelTab]);

  const handleToggleParticipants = useCallback(() => {
    console.log('[VideoConf] 👥 Toggle participants');
    if (rightPanelOpen && rightPanelTab === 'participants') {
      setRightPanelOpen(false);
    } else {
      setRightPanelOpen(true);
      setRightPanelTab('participants');
    }
  }, [rightPanelOpen, rightPanelTab]);

  const totalParticipants = Math.max(1, participants.size || 1);

  // Translations
  const txt = {
    you: language === 'fr' ? 'Vous' : 'You',
    cameraOff: language === 'fr' ? 'Camera desactivee' : 'Camera off',
    waitingParticipants: language === 'fr' ? 'En attente de participants' : 'Waiting for participants',
    noMessages: language === 'fr' ? 'Aucun message' : 'No messages',
    messagePlaceholder: language === 'fr' ? 'Message...' : 'Message...',
    noOtherParticipant: language === 'fr' ? 'Aucun autre participant' : 'No other participants',
    connected: language === 'fr' ? 'Connecte' : 'Connected',
    selectImagery: language === 'fr' ? 'Selectionnez une imagerie dans le panel de gauche' : 'Select imagery from the left panel',
    hide: language === 'fr' ? 'Masquer' : 'Hide',
    quit: language === 'fr' ? 'Quitter' : 'Leave',
    addDocument: language === 'fr' ? 'Ajouter un document' : 'Add document',
    search: language === 'fr' ? 'Rechercher...' : 'Search...',
    suspectZone: language === 'fr' ? 'Zone suspecte' : 'Suspect zone',
    age: language === 'fr' ? 'Age' : 'Age',
    bloodType: language === 'fr' ? 'Groupe sanguin' : 'Blood type',
    allergies: language === 'fr' ? 'Allergies' : 'Allergies',
    diagnostic: language === 'fr' ? 'Diagnostic' : 'Diagnosis',
    lastVisit: language === 'fr' ? 'Derniere visite' : 'Last visit',
    nextRCP: language === 'fr' ? 'Prochaine RCP' : 'Next RCP',
    years: language === 'fr' ? 'ans' : 'years',
    slices: language === 'fr' ? 'coupes' : 'slices',
    prerequisites: language === 'fr' ? 'Prérequis' : 'Prereqs',
    prereqSelectPrompt: language === 'fr'
      ? 'Sélectionnez un prérequis dans le panneau gauche'
      : 'Select a prerequisite from the left panel',
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: C.bg,
      zIndex: 999999,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* ===== HEADER ===== */}
      <div style={{
        height: '48px',
        backgroundColor: C.bgHeader,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        {/* Left: Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '28px', height: '28px',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Video size={14} color="white" />
          </div>
          <div>
            <span style={{ color: C.textWhite, fontWeight: 500, fontSize: '14px' }}>{meetingTitle}</span>
            {displayPatientName !== 'Patient' && (
              <span style={{ color: C.textGrayDark, fontSize: '12px', marginLeft: '8px' }}>• {displayPatientName}</span>
            )}
          </div>
        </div>

        {/* Right: Status + controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Connection status */}
          {(() => {
            const isGreen = connectionStatus === 'Connecte' || connectionStatus === 'Connecté' || connectionStatus === 'En room';
            return (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '2px 8px', borderRadius: '4px', fontSize: '12px',
                backgroundColor: isGreen ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
                color: isGreen ? C.green : C.yellow,
              }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  backgroundColor: isGreen ? C.green : C.yellow,
                }} />
                {isGreen ? 'Connecté' : connectionStatus}
              </div>
            );
          })()}

          {/* View mode toggle */}
          <div style={{
            display: 'flex', alignItems: 'center',
            backgroundColor: C.bgControl, borderRadius: '6px', padding: '2px',
          }}>
            {['video', 'imagery'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                style={{
                  height: '24px', padding: '0 8px', fontSize: '11px',
                  border: 'none', borderRadius: '4px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px',
                  backgroundColor: viewMode === mode ? C.bgControlHover : 'transparent',
                  color: viewMode === mode ? C.textWhite : C.textGray,
                }}
              >
                {mode === 'video' ? <Video size={12} /> : <ImageIcon size={12} />}
                {mode === 'video' ? 'Video' : 'Imagerie'}
              </button>
            ))}
          </div>

          {/* Close */}
          <button
            onClick={() => { fullLeaveRoom(); onClose(); }}
            style={{ width: '32px', height: '32px', border: 'none', backgroundColor: 'transparent', color: C.textGray, cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ===== MAIN AREA ===== */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* ===== LEFT PANEL ===== */}
        {leftPanelOpen && (
          <div style={{
            width: '280px', backgroundColor: C.bgPanel,
            borderRight: `1px solid ${C.border}`,
            display: 'flex', flexDirection: 'column', flexShrink: 0,
          }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
              {[
                { id: 'patient', icon: UserIcon, label: 'Patient' },
                { id: 'documents', icon: FileText, label: 'Docs' },
                { id: 'imagery', icon: ImageIcon, label: 'Images' },
                { id: 'prerequisites', icon: ClipboardList, label: txt.prerequisites },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setLeftPanelTab(tab.id as any)}
                  style={{
                    flex: 1, padding: '10px 4px', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    fontSize: '11px', backgroundColor: 'transparent',
                    color: leftPanelTab === tab.id ? C.blueLight : C.textGray,
                    borderBottom: leftPanelTab === tab.id ? `2px solid ${C.blueLight}` : '2px solid transparent',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <tab.icon size={14} /> {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
              {/* PATIENT TAB */}
              {leftPanelTab === 'patient' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    backgroundColor: C.bgCard, borderRadius: '12px', padding: '12px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                  }}>
                    <div style={{
                      width: '46px', height: '46px', borderRadius: '12px',
                      backgroundColor: 'rgba(59,130,246,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <UserIcon size={24} color={C.blue} />
                    </div>
                    <div>
                      <p style={{ color: C.textWhite, fontSize: '14px', fontWeight: 500, margin: 0 }}>{patientInfo.name}</p>
                      <p style={{ color: C.textGrayDark, fontSize: '12px', margin: '4px 0 0' }}>{patientInfo.id}</p>
                    </div>
                  </div>

                  <div style={{ backgroundColor: C.bgCard, borderRadius: '12px', padding: '12px' }}>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} color={C.textGray} />
                        <span style={{ color: C.textGray, fontSize: '12px', minWidth: '90px' }}>{txt.age}</span>
                        <span style={{ color: C.textWhite, fontSize: '12px' }}>{patientInfo.age} {txt.years}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={16} color={C.textGray} />
                        <span style={{ color: C.textGray, fontSize: '12px', minWidth: '90px' }}>{txt.bloodType}</span>
                        <span style={{ color: C.textWhite, fontSize: '12px' }}>{patientInfo.bloodType}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Stethoscope size={16} color={C.textGray} />
                        <span style={{ color: C.textGray, fontSize: '12px', minWidth: '90px' }}>{txt.diagnostic}</span>
                        <span style={{ color: C.textWhite, fontSize: '12px' }}>{patientInfo.diagnosis}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} color={C.textGray} />
                        <span style={{ color: C.textGray, fontSize: '12px', minWidth: '90px' }}>{txt.lastVisit}</span>
                        <span style={{ color: C.textWhite, fontSize: '12px' }}>{patientInfo.lastVisit}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} color={C.textGray} />
                        <span style={{ color: C.textGray, fontSize: '12px', minWidth: '90px' }}>{txt.nextRCP}</span>
                        <span style={{ color: C.textWhite, fontSize: '12px' }}>{patientInfo.nextRCP}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DOCUMENTS TAB */}
              {leftPanelTab === 'documents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <Search size={14} color={C.textGray} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        placeholder={txt.search}
                        value={searchDoc}
                        onChange={(e) => setSearchDoc(e.target.value)}
                        style={{
                          width: '100%', padding: '8px 8px 8px 30px',
                          borderRadius: '8px', border: 'none', backgroundColor: C.bgCard,
                          color: C.textWhite, fontSize: '12px', outline: 'none',
                        }}
                      />
                    </div>
                    <button
                      style={{
                        padding: '8px 10px', border: 'none', borderRadius: '8px',
                        backgroundColor: C.blue, color: 'white', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Upload size={16} />
                    </button>
                  </div>

                  {documents
                    .filter(doc => doc.name.toLowerCase().includes(searchDoc.toLowerCase()))
                    .map((doc) => (
                      <div
                        key={doc.id}
                        style={{
                          padding: '10px', borderRadius: '10px', backgroundColor: C.bgCard,
                          display: 'flex', alignItems: 'center', gap: '10px',
                          border: `1px solid ${C.border}`,
                        }}
                      >
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '8px',
                          backgroundColor: 'rgba(59,130,246,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <FileText size={20} color={C.blue} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: C.textWhite, fontSize: '12px', margin: 0, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {doc.name}
                          </p>
                          <p style={{ color: C.textGrayDark, fontSize: '11px', margin: '4px 0 0' }}>{doc.owner} • {doc.date}</p>
                        </div>
                        <button style={{ border: 'none', backgroundColor: 'transparent', color: C.textGray, cursor: 'pointer' }}>
                          <Download size={16} />
                        </button>
                      </div>
                    ))}

                  {documents.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <FileText size={40} color={C.textGrayDarker} style={{ margin: '0 auto 8px' }} />
                      <p style={{ color: C.textGrayDark, fontSize: '13px', margin: 0 }}>{txt.addDocument}</p>
                    </div>
                  )}
                </div>
              )}

              {/* IMAGERY TAB */}
              {leftPanelTab === 'imagery' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {imageries.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => { setSelectedImagery(img.id); setViewMode('imagery'); }}
                      style={{
                        padding: '12px', borderRadius: '10px', cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: selectedImagery === img.id ? 'rgba(59,130,246,0.15)' : C.bgCard,
                        border: selectedImagery === img.id ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
                      }}
                      onMouseEnter={e => {
                        if (selectedImagery !== img.id) e.currentTarget.style.backgroundColor = C.bgCardHover;
                      }}
                      onMouseLeave={e => {
                        if (selectedImagery !== img.id) e.currentTarget.style.backgroundColor = C.bgCard;
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{
                          width: '48px', height: '48px', borderRadius: '8px',
                          backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <ImageIcon size={24} color={C.cyan} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: C.textWhite, fontSize: '13px', fontWeight: 500, margin: 0 }}>{img.name}</p>
                          <p style={{ color: C.textGrayDark, fontSize: '11px', margin: '2px 0' }}>{img.type} • {img.slices} {txt.slices}</p>
                          <p style={{ color: C.textGrayDarker, fontSize: '11px', margin: 0 }}>{img.date}</p>
                        </div>
                        <span style={{
                          padding: '2px 8px', borderRadius: '4px', fontSize: '11px',
                          backgroundColor: img.status === 'Complet' ? 'rgba(34,197,94,0.15)' : 'rgba(156,163,175,0.15)',
                          color: img.status === 'Complet' ? C.green : C.textGray,
                        }}>{img.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* PREREQUISITES TAB */}
              {leftPanelTab === 'prerequisites' && (
                <PrerequisitesTab
                  data={prereqData}
                  loading={prereqLoading}
                  error={prereqError}
                  language={language as 'fr' | 'en'}
                  onSelectItem={handleSelectPrereqItem}
                />
              )}
            </div>

            {/* Hide button */}
            <button
              onClick={() => setLeftPanelOpen(false)}
              style={{
                margin: '8px', padding: '6px 12px', border: 'none', borderRadius: '6px',
                backgroundColor: 'transparent', color: C.textGrayDark, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = C.textWhite; }}
              onMouseLeave={e => { e.currentTarget.style.color = C.textGrayDark; }}
            >
              <PanelLeftClose size={16} />
              {txt.hide}
            </button>
          </div>
        )}

        {/* Left panel show button */}
        {!leftPanelOpen && (
          <button
            onClick={() => setLeftPanelOpen(true)}
            style={{
              position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
              zIndex: 10, width: '32px', height: '32px', border: 'none', borderRadius: '50%',
              backgroundColor: C.bgControl, color: C.textWhite, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ChevronRight size={16} />
          </button>
        )}

        {/* ===== CENTER - VIDEO / IMAGERY ===== */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {viewMode === 'prerequisites' ? (
            /* PREREQUISITES MODULE – zone centrale */
            activePrereqItem && activePrereqDoctor ? (
              <PrerequisiteModulePlaceholder
                item={activePrereqItem}
                doctor={activePrereqDoctor}
                language={language as 'fr' | 'en'}
                onClose={handleClosePrereqModule}
              />
            ) : (
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: C.textGrayDark, fontSize: '13px',
              }}>
                {txt.prereqSelectPrompt}
              </div>
            )
          ) : viewMode === 'imagery' ? (
            /* IMAGERY VIEW */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Imagery toolbar */}
              <div style={{
                height: '40px', backgroundColor: C.bgHeader,
                borderBottom: `1px solid ${C.border}`,
                padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {[
                    { id: 'cursor', icon: MousePointer },
                    { id: 'pen', icon: Pencil },
                    { id: 'text', icon: Type },
                    { id: 'rectangle', icon: Square },
                    { id: 'circle', icon: Circle },
                  ].map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => setAnnotationTool(tool.id as any)}
                      style={{
                        width: '28px', height: '28px', border: 'none', borderRadius: '4px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: annotationTool === tool.id ? C.blue : 'transparent',
                        color: annotationTool === tool.id ? C.textWhite : C.textGray,
                        transition: 'all 0.15s',
                      }}
                    >
                      <tool.icon size={14} />
                    </button>
                  ))}
                  <div style={{ width: '1px', height: '20px', backgroundColor: C.borderLight, margin: '0 4px' }} />
                  <button style={{
                    width: '28px', height: '28px', border: 'none', borderRadius: '4px',
                    backgroundColor: 'transparent', color: C.textGray, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <RotateCcw size={14} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => setZoomLevel(Math.max(25, zoomLevel - 25))} style={{
                    width: '28px', height: '28px', border: 'none', borderRadius: '4px',
                    backgroundColor: 'transparent', color: C.textGray, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ZoomOut size={14} />
                  </button>
                  <span style={{ color: C.textWhite, fontSize: '12px', width: '48px', textAlign: 'center' }}>{zoomLevel}%</span>
                  <button onClick={() => setZoomLevel(Math.min(400, zoomLevel + 25))} style={{
                    width: '28px', height: '28px', border: 'none', borderRadius: '4px',
                    backgroundColor: 'transparent', color: C.textGray, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ZoomIn size={14} />
                  </button>
                  <button style={{
                    width: '28px', height: '28px', border: 'none', borderRadius: '4px',
                    backgroundColor: 'transparent', color: C.textGray, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Maximize2 size={14} />
                  </button>
                </div>
              </div>

              {/* Imagery viewer */}
              <div style={{
                flex: 1, backgroundColor: '#000', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden',
              }}>
                {selectedImagery ? (
                  <div style={{ transform: `scale(${zoomLevel / 100})`, transition: 'transform 0.2s' }}>
                    <div style={{ width: '500px', height: '500px', position: 'relative' }}>
                      <div style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        border: `4px solid rgba(34,211,238,0.4)`,
                        background: 'linear-gradient(135deg, #0f172a, rgba(30,64,175,0.2), #0f172a)',
                      }}>
                        <div style={{
                          position: 'absolute', top: '50%', left: '50%',
                          transform: 'translate(-50%, -50%)', width: '75%', height: '75%',
                        }}>
                          <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
                            <ellipse cx="100" cy="100" rx="70" ry="80" fill="none" stroke="rgba(96,165,250,0.3)" strokeWidth="2" />
                            <path d="M 100 30 Q 140 50 140 100 Q 140 150 100 170 Q 60 150 60 100 Q 60 50 100 30" fill="rgba(59,130,246,0.2)" stroke="rgba(96,165,250,0.5)" strokeWidth="1.5" />
                            <circle cx="120" cy="90" r="20" fill="none" stroke="#22d3ee" strokeWidth="2" strokeDasharray="3,3" />
                            <line x1="140" y1="80" x2="180" y2="50" stroke="#22d3ee" strokeWidth="1" />
                            <text x="182" y="48" fill="#22d3ee" fontSize="10">{txt.suspectZone}</text>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <ImageIcon size={64} color={C.textGrayDarker} style={{ margin: '0 auto 12px' }} />
                    <p style={{ color: C.textGrayDark, margin: 0 }}>{txt.selectImagery}</p>
                  </div>
                )}

                {/* Mini video overlay in imagery mode */}
                <div style={{ position: 'absolute', bottom: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{
                    width: '160px', aspectRatio: '16/9',
                    backgroundColor: C.bgCard, borderRadius: '10px', overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)', border: `1px solid ${C.borderLight}`,
                    position: 'relative',
                  }}>
                    {/* Video element always in DOM so srcObject persists */}
                    <video ref={attachLocalVideoMini} autoPlay muted playsInline
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)',
                        display: showLocalVideo ? 'block' : 'none',
                      }} />
                    {/* Avatar when camera is off */}
                    {!showLocalVideo && (
                      <div style={{
                        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '50%', backgroundColor: C.blue,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: '14px', fontWeight: 600,
                        }}>{currentDoctorInitials}</div>
                      </div>
                    )}
                    <div style={{
                      position: 'absolute', bottom: '4px', left: '4px',
                      backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: '4px',
                      padding: '2px 6px', fontSize: '11px', color: 'white',
                    }}>{txt.you}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* VIDEO VIEW — active speaker large + small tiles strip */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px', gap: '8px', overflow: 'hidden' }}>
              {/* Main stage: active speaker or self */}
              <div style={{
                flex: 1, backgroundColor: C.bgCard, borderRadius: '12px', overflow: 'hidden',
                position: 'relative', minHeight: 0,
              }}>
                {remoteStreams.size > 0 ? (
                  /* Show first remote participant as main speaker */
                  (() => {
                    const [mainId, mainStream] = Array.from(remoteStreams.entries())[0];
                    const mainParticipant = participants.get(mainId);
                    const mainName = mainParticipant?.name || `Participant ${mainId.slice(0, 6)}`;
                    const mainInitials = mainParticipant?.name
                      ? mainParticipant.name.split(' ').map(n => n[0]).join('').toUpperCase()
                      : 'P';
                    const mainVideoOn = mainParticipant?.videoEnabled !== false;
                    return (
                      <>
                        {/* Video toujours dans le DOM, caché si caméra off */}
                        <video autoPlay playsInline
                          style={{
                            width: '100%', height: '100%', objectFit: 'cover',
                            display: mainVideoOn ? 'block' : 'none',
                          }}
                          ref={(video) => { if (video) video.srcObject = mainStream; }}
                        />
                        {/* Avatar quand caméra off */}
                        {!mainVideoOn && (
                          <div style={{
                            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                          }}>
                            {mainParticipant?.avatarUrl ? (
                              <img src={mainParticipant.avatarUrl} alt={mainName}
                                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '12px' }} />
                            ) : (
                              <div style={{
                                width: '80px', height: '80px', borderRadius: '50%', backgroundColor: C.purple,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: '28px', fontWeight: 600, marginBottom: '12px',
                              }}>{mainInitials}</div>
                            )}
                            <p style={{ color: C.textWhite, fontSize: '16px', margin: 0, fontWeight: 500 }}>{mainName}</p>
                            <p style={{ color: C.textGrayDark, fontSize: '13px', margin: '6px 0 0' }}>{txt.cameraOff}</p>
                          </div>
                        )}
                        {/* Overlay nom + statut */}
                        <div style={{
                          position: 'absolute', bottom: '12px', left: '12px',
                          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                          borderRadius: '8px', padding: '6px 12px',
                          display: 'flex', alignItems: 'center', gap: '8px',
                        }}>
                          <span style={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>{mainName}</span>
                          {mainParticipant?.speciality && (
                            <span style={{ color: C.textGray, fontSize: '11px' }}>• {mainParticipant.speciality}</span>
                          )}
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {mainParticipant && !mainParticipant.micEnabled && (
                              <div style={{
                                width: '24px', height: '24px', borderRadius: '50%', backgroundColor: C.red,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}><MicOff size={12} color="white" /></div>
                            )}
                            {mainParticipant && !mainParticipant.videoEnabled && (
                              <div style={{
                                width: '24px', height: '24px', borderRadius: '50%', backgroundColor: C.textGrayDark,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}><VideoOff size={12} color="white" /></div>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()
                ) : (
                  /* Alone — show self as main */
                  <>
                    <video ref={attachLocalVideoGrid} autoPlay muted playsInline
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)',
                        display: showLocalVideo ? 'block' : 'none',
                      }} />
                    {!showLocalVideo && (
                      <div style={{
                        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{
                          width: '80px', height: '80px', borderRadius: '50%', backgroundColor: C.blue,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: '28px', fontWeight: 600, marginBottom: '12px',
                        }}>{currentDoctorInitials}</div>
                        <p style={{ color: C.textWhite, fontSize: '16px', margin: 0, fontWeight: 500 }}>{currentDoctorName}</p>
                        <p style={{ color: C.textGrayDark, fontSize: '13px', margin: '6px 0 0' }}>{txt.cameraOff}</p>
                      </div>
                    )}
                    <div style={{
                      position: 'absolute', bottom: '12px', left: '12px',
                      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                      borderRadius: '8px', padding: '6px 12px',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                      <span style={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>{currentDoctorName}</span>
                      <span style={{
                        backgroundColor: 'rgba(59,130,246,0.8)', color: 'white',
                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px',
                      }}>{txt.you}</span>
                    </div>
                  </>
                )}

                {/* Floating local preview (picture-in-picture) when remote participants exist */}
                {remoteStreams.size > 0 && (
                  <div style={{
                    position: 'absolute', bottom: '12px', right: '12px',
                    width: '180px', aspectRatio: '16/9',
                    backgroundColor: C.bgCard, borderRadius: '10px', overflow: 'hidden',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.6)', border: `2px solid ${C.borderLight}`,
                  }}>
                    <video ref={attachLocalVideoGrid} autoPlay muted playsInline
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)',
                        display: showLocalVideo ? 'block' : 'none',
                      }} />
                    {!showLocalVideo && (
                      <div style={{
                        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '50%', backgroundColor: C.blue,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: '14px', fontWeight: 600,
                        }}>{currentDoctorInitials}</div>
                      </div>
                    )}
                    <div style={{
                      position: 'absolute', bottom: '4px', left: '6px',
                      backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: '4px',
                      padding: '2px 6px', fontSize: '11px', color: 'white',
                    }}>{txt.you}</div>
                    <div style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '3px' }}>
                      {!isMicEnabled && (
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '50%', backgroundColor: C.red,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}><MicOff size={10} color="white" /></div>
                      )}
                      {!isVideoEnabled && (
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '50%', backgroundColor: C.textGrayDark,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}><VideoOff size={10} color="white" /></div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom strip: additional remote participants (if more than 1) */}
              {remoteStreams.size > 1 && (
                <div style={{
                  height: '120px', display: 'flex', gap: '8px', flexShrink: 0,
                }}>
                  {Array.from(remoteStreams.entries()).slice(1).map(([id, stream]) => {
                    const participant = participants.get(id);
                    const name = participant?.name || `Participant ${id.slice(0, 6)}`;
                    const initials = participant?.name
                      ? participant.name.split(' ').map(n => n[0]).join('').toUpperCase()
                      : 'P';
                    const videoOn = participant?.videoEnabled !== false;
                    return (
                      <div key={id} style={{
                        flex: '0 0 200px', backgroundColor: C.bgCard, borderRadius: '10px',
                        overflow: 'hidden', position: 'relative',
                      }}>
                        <video autoPlay playsInline
                          style={{
                            width: '100%', height: '100%', objectFit: 'cover',
                            display: videoOn ? 'block' : 'none',
                          }}
                          ref={(video) => { if (video) video.srcObject = stream; }}
                        />
                        {!videoOn && (
                          <div style={{
                            width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <div style={{
                              width: '40px', height: '40px', borderRadius: '50%', backgroundColor: C.purple,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontSize: '14px', fontWeight: 600,
                            }}>{initials}</div>
                          </div>
                        )}
                        <div style={{
                          position: 'absolute', bottom: '4px', left: '6px',
                          backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '4px',
                          padding: '2px 6px', fontSize: '11px', color: 'white',
                          display: 'flex', alignItems: 'center', gap: '4px',
                        }}>
                          <span>{name}</span>
                          {participant && !participant.micEnabled && <MicOff size={10} color={C.red} />}
                          {participant && !participant.videoEnabled && <VideoOff size={10} color={C.textGray} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Waiting placeholder when alone — shown below main video */}
              {remoteStreams.size === 0 && (
                <div style={{
                  height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '12px', flexShrink: 0,
                }}>
                  <Users size={18} color={C.textGrayDarker} />
                  <span style={{ color: C.textGray, fontSize: '13px' }}>{txt.waitingParticipants}</span>
                  <code style={{
                    backgroundColor: 'rgba(59,130,246,0.1)', color: C.blueLight,
                    padding: '3px 8px', borderRadius: '4px', fontSize: '12px',
                  }}>{ROOM_ID.length > 20 ? ROOM_ID.slice(0, 20) + '...' : ROOM_ID}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(ROOM_ID)}
                    style={{
                      width: '24px', height: '24px', border: 'none', borderRadius: '4px',
                      backgroundColor: 'transparent', color: C.textGray, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Copy size={12} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===== RIGHT PANEL ===== */}
        {rightPanelOpen && (
          <div style={{
            width: '280px', backgroundColor: C.bgPanel,
            borderLeft: `1px solid ${C.border}`,
            display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
          }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
              <button
                onClick={() => setRightPanelTab('chat')}
                style={{
                  flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  fontSize: '13px', backgroundColor: 'transparent',
                  color: rightPanelTab === 'chat' ? C.blueLight : C.textGray,
                  borderBottom: rightPanelTab === 'chat' ? `2px solid ${C.blueLight}` : '2px solid transparent',
                }}
              >
                <MessageSquare size={16} /> Chat
              </button>
              <button
                onClick={() => setRightPanelTab('participants')}
                style={{
                  flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  fontSize: '13px', backgroundColor: 'transparent',
                  color: rightPanelTab === 'participants' ? C.blueLight : C.textGray,
                  borderBottom: rightPanelTab === 'participants' ? `2px solid ${C.blueLight}` : '2px solid transparent',
                }}
              >
                <Users size={16} /> ({totalParticipants})
              </button>
            </div>

            {rightPanelTab === 'chat' ? (
              <>
                {/* Chat messages */}
                <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
                  {chatMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', paddingTop: '32px' }}>
                      <MessageSquare size={40} color={C.textGrayDarker} style={{ margin: '0 auto 8px' }} />
                      <p style={{ color: C.textGrayDark, fontSize: '13px' }}>{txt.noMessages}</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {chatMessages.map((msg) => (
                        <div key={msg.id} style={{
                          display: 'flex', justifyContent: msg.user === 'Vous' ? 'flex-end' : 'flex-start',
                        }}>
                          <div style={{ maxWidth: '85%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                              <span style={{ fontSize: '11px', color: C.textGrayDark }}>{msg.user}</span>
                              <span style={{ fontSize: '11px', color: C.textGrayDarker }}>{msg.time}</span>
                            </div>
                            <div style={{
                              borderRadius: '16px', padding: '8px 12px',
                              backgroundColor: msg.user === 'Vous' ? C.blue : C.bgControl,
                              color: 'white', fontSize: '13px',
                            }}>
                              {msg.message}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chat input */}
                <div style={{ padding: '12px', borderTop: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      placeholder={txt.messagePlaceholder}
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      style={{
                        flex: 1, height: '36px', padding: '0 12px',
                        backgroundColor: C.bgCard, border: 'none', borderRadius: '8px',
                        color: C.textWhite, fontSize: '13px', outline: 'none',
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      style={{
                        width: '36px', height: '36px', border: 'none', borderRadius: '8px',
                        backgroundColor: C.blue, color: 'white', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Participants list */
              <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Me */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '8px', backgroundColor: C.bgCard, borderRadius: '10px',
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', backgroundColor: C.blue,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '13px', fontWeight: 600, flexShrink: 0,
                    }}>{currentDoctorInitials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: C.textWhite, fontSize: '13px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentDoctorName}</p>
                      <p style={{ color: C.textGrayDark, fontSize: '11px', margin: '2px 0 0' }}>{currentDoctorRole}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {isMicEnabled ? <Mic size={14} color={C.green} /> : <MicOff size={14} color={C.red} />}
                      {isVideoEnabled ? <Video size={14} color={C.green} /> : <VideoOff size={14} color={C.textGrayDark} />}
                    </div>
                  </div>

                  {/* Remote participants */}
                  {remoteParticipants.map(([id, participant]) => (
                    <div key={id} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '8px', borderRadius: '10px', transition: 'background-color 0.2s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.bgCard; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%', backgroundColor: C.purple,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '13px', fontWeight: 600, flexShrink: 0,
                      }}>{participant.firstName?.[0] || 'P'}{participant.lastName?.[0] || ''}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: C.textWhite, fontSize: '13px', margin: 0 }}>{participant.name || `Participant ${id.slice(0, 6)}`}</p>
                        <p style={{ color: C.textGrayDark, fontSize: '11px', margin: '2px 0 0' }}>{txt.connected}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {participant.micEnabled ? <Mic size={14} color={C.green} /> : <MicOff size={14} color={C.red} />}
                        {participant.videoEnabled ? <Video size={14} color={C.green} /> : <VideoOff size={14} color={C.textGrayDark} />}
                      </div>
                    </div>
                  ))}

                  {remoteParticipants.length === 0 && (
                    <p style={{ color: C.textGrayDark, fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
                      {txt.noOtherParticipant}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Hide button */}
            <button
              onClick={() => setRightPanelOpen(false)}
              style={{
                margin: '8px', padding: '6px 12px', border: 'none', borderRadius: '6px',
                backgroundColor: 'transparent', color: C.textGrayDark, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = C.textWhite; }}
              onMouseLeave={e => { e.currentTarget.style.color = C.textGrayDark; }}
            >
              <PanelRightClose size={16} />
              {txt.hide}
            </button>
          </div>
        )}

        {/* Right panel show button */}
        {!rightPanelOpen && (
          <button
            onClick={() => setRightPanelOpen(true)}
            style={{
              position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
              zIndex: 10, width: '32px', height: '32px', border: 'none', borderRadius: '50%',
              backgroundColor: C.bgControl, color: C.textWhite, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* ===== BOTTOM CONTROL BAR ===== */}
      <div style={{
        height: '64px', backgroundColor: C.bgHeader,
        borderTop: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 16px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Left panel toggle */}
          <ControlButton onClick={handleToggleLeftPanel} active={leftPanelOpen}>
            <FolderOpen size={20} />
          </ControlButton>

          <div style={{ width: '1px', height: '24px', backgroundColor: C.borderLight, margin: '0 4px' }} />

          {/* Mic */}
          <ControlButton onClick={handleToggleMic} danger={!isMicEnabled}>
            {isMicEnabled ? <Mic size={20} /> : <MicOff size={20} />}
          </ControlButton>

          {/* Camera */}
          <ControlButton onClick={handleToggleCamera} danger={!isVideoEnabled}>
            {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
          </ControlButton>

          {/* Screen share */}
          <ControlButton onClick={toggleScreenShare} active={isScreenSharing}>
            <Share2 size={20} />
          </ControlButton>

          <div style={{ width: '1px', height: '24px', backgroundColor: C.borderLight, margin: '0 4px' }} />

          {/* Chat */}
          <ControlButton
            onClick={handleToggleRightPanel}
            active={rightPanelOpen && rightPanelTab === 'chat'}
          >
            <MessageSquare size={20} />
          </ControlButton>

          {/* Participants */}
          <ControlButton
            onClick={handleToggleParticipants}
            active={rightPanelOpen && rightPanelTab === 'participants'}
          >
            <Users size={20} />
          </ControlButton>

          {/* More */}
          <ControlButton onClick={() => {}}>
            <MoreVertical size={20} />
          </ControlButton>

          <div style={{ width: '1px', height: '24px', backgroundColor: C.borderLight, margin: '0 8px' }} />

          {/* Leave */}
          <button
            onClick={() => { fullLeaveRoom(); onClose(); }}
            style={{
              height: '44px', padding: '0 20px', borderRadius: '22px',
              border: 'none', backgroundColor: C.red, color: 'white',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              fontWeight: 500, fontSize: '14px', transition: 'background-color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.redDark; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.red; }}
          >
            <Phone size={20} style={{ transform: 'rotate(135deg)' }} />
            {txt.quit}
          </button>
        </div>
      </div>
    </div>
  );
}
