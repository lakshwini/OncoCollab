import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '../types/video';
import { API_CONFIG } from '../config/api.config';
import { User } from '../App';
import { useLanguage } from '../i18n';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
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
} from 'lucide-react';

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

const SERVER_URL = API_CONFIG.WEBSOCKET_URL;
const ICE_SERVERS = API_CONFIG.ICE_SERVERS;

export function VideoConferenceAdvanced({
  onClose,
  patientName,
  meetingTitle = "RCP",
  authToken,
  roomId,
  serverUrl,
  currentUser,
  initialSettings
}: VideoConferenceAdvancedProps) {
  const { language } = useLanguage();
  const currentDoctorName = currentUser?.name || 'Docteur';
  const currentDoctorRole = currentUser?.role || 'medecin';
  const currentDoctorInitials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'DR';

  const displayPatientName = patientName || 'Patient';
  const ROOM_ID = roomId || meetingTitle.replace(/\s+/g, '-').toLowerCase();
  const DYNAMIC_SERVER_URL = serverUrl || SERVER_URL;

  // Media states
  const [micEnabled, setMicEnabled] = useState(initialSettings?.micEnabled ?? true);
  const [videoEnabled, setVideoEnabled] = useState(initialSettings?.videoEnabled ?? true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // UI states
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [leftPanelTab, setLeftPanelTab] = useState<'patient' | 'documents' | 'imagery'>('patient');
  const [rightPanelTab, setRightPanelTab] = useState<'chat' | 'participants'>('chat');
  const [chatMessage, setChatMessage] = useState('');
  const [viewMode, setViewMode] = useState<'video' | 'imagery'>('video');
  const [selectedImagery, setSelectedImagery] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [annotationTool, setAnnotationTool] = useState<'cursor' | 'pen' | 'text' | 'rectangle' | 'circle'>('cursor');
  const [searchDoc, setSearchDoc] = useState('');

  // WebRTC
  const socketRef = useRef<AppSocket | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const [myId, setMyId] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>("Connexion...");

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
    { id: '1', name: 'IRM Cérébrale', type: 'IRM', date: '12/01/2026', slices: 24, status: 'Complet' },
    { id: '2', name: 'Scanner Thoracique', type: 'CT', date: '10/01/2026', slices: 48, status: 'Complet' },
    { id: '3', name: 'TEP Scan', type: 'PET', date: '05/01/2026', slices: 32, status: 'Complet' },
    { id: '4', name: 'Échographie abdominale', type: 'US', date: '02/01/2026', slices: 12, status: 'Partiel' },
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

  // Stream callbacks
  const addRemoteStream = useCallback((id: string, stream: MediaStream) => {
    setRemoteStreams(prev => new Map(prev).set(id, stream));
  }, []);

  const removeRemoteStream = useCallback((id: string) => {
    setRemoteStreams(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const toggleMic = useCallback(() => {
    const newMicState = !micEnabled;
    console.log('[VideoConf] 🎤 Toggle micro:', micEnabled, '→', newMicState);
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      console.log('[VideoConf] Tracks audio:', audioTracks.length);
      audioTracks.forEach(track => {
        track.enabled = newMicState;
        console.log('[VideoConf]   - Track audio enabled:', track.enabled);
      });
    }
    setMicEnabled(newMicState);
  }, [micEnabled]);

  const toggleVideo = useCallback(() => {
    const newVideoState = !videoEnabled;
    console.log('[VideoConf] 📹 Toggle vidéo:', videoEnabled, '→', newVideoState);
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      console.log('[VideoConf] Tracks vidéo:', videoTracks.length);
      videoTracks.forEach(track => {
        track.enabled = newVideoState;
        console.log('[VideoConf]   - Track vidéo enabled:', track.enabled, 'readyState:', track.readyState);
      });
    }
    setVideoEnabled(newVideoState);
  }, [videoEnabled]);

  // Use refs for mic/video state so getMedia doesn't change identity on toggle
  const micEnabledRef = useRef(micEnabled);
  const videoEnabledRef = useRef(videoEnabled);
  useEffect(() => { micEnabledRef.current = micEnabled; }, [micEnabled]);
  useEffect(() => { videoEnabledRef.current = videoEnabled; }, [videoEnabled]);

  const getMedia = useCallback(async () => {
    try {
      console.log('[VideoConf] 📷 Demande accès média...');
      const constraints: MediaStreamConstraints = {
        video: initialSettings?.selectedCamera
          ? { deviceId: { exact: initialSettings.selectedCamera }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: initialSettings?.selectedMicrophone
          ? { deviceId: { exact: initialSettings.selectedMicrophone }, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          : { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[VideoConf] ✅ Stream obtenu, tracks:', stream.getTracks().length);

      stream.getAudioTracks().forEach(track => {
        track.enabled = micEnabledRef.current;
        console.log('[VideoConf]   - Audio track enabled:', track.enabled);
      });
      stream.getVideoTracks().forEach(track => {
        track.enabled = videoEnabledRef.current;
        console.log('[VideoConf]   - Video track enabled:', track.enabled);
      });

      setLocalStream(stream);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('[VideoConf] ✅ Stream attaché à la vidéo locale');
      }
      return stream;
    } catch (error) {
      console.error('[VideoConf] ❌ Erreur accès média:', error);
      return null;
    }
  }, [initialSettings?.selectedCamera, initialSettings?.selectedMicrophone]);

  const createPeerConnection = useCallback((targetId: string, stream: MediaStream) => {
    console.log('[VideoConf] 🔗 Création PeerConnection pour:', targetId);
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Gérer les états de connexion
    pc.onconnectionstatechange = () => {
      console.log(`[VideoConf] État connexion avec ${targetId}:`, pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.warn(`[VideoConf] ⚠️ Connexion ${pc.connectionState} avec ${targetId}`);
      } else if (pc.connectionState === 'connected') {
        console.log(`[VideoConf] ✅ Connecté avec ${targetId}`);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[VideoConf] État ICE avec ${targetId}:`, pc.iceConnectionState);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        console.log(`[VideoConf] 🧊 Envoi ICE candidate à ${targetId}`);
        socketRef.current.emit('sending-ice-candidate', { candidate: event.candidate.toJSON(), toId: targetId });
      }
    };

    pc.ontrack = (event) => {
      console.log(`[VideoConf] 📺 Track reçu de ${targetId}, streams:`, event.streams.length);
      if (event.streams[0]) {
        addRemoteStream(targetId, event.streams[0]);
      }
    };

    // Ajouter les tracks locaux
    const tracks = stream.getTracks();
    console.log(`[VideoConf] ➕ Ajout de ${tracks.length} tracks à la connexion avec ${targetId}`);
    tracks.forEach(track => {
      console.log(`[VideoConf]   - Track: ${track.kind}, enabled: ${track.enabled}`);
      pc.addTrack(track, stream);
    });

    peersRef.current.set(targetId, pc);
    return pc;
  }, [addRemoteStream]);

  // Init media
  useEffect(() => {
    getMedia();
  }, []);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // WebSocket signaling
  useEffect(() => {
    let mounted = true;

    console.log('[VideoConf] Connexion au serveur:', DYNAMIC_SERVER_URL);

    const socket = io(DYNAMIC_SERVER_URL, {
      ...API_CONFIG.SOCKET_CONFIG,
      auth: authToken ? { token: authToken } : undefined,
    });

    socket.on('connect', async () => {
      if (!mounted) return;
      console.log('[VideoConf] ✅ Connecté au serveur, socket ID:', socket.id);
      setConnectionStatus('Connecté');
      setMyId(socket.id);
      if (!localStreamRef.current) await getMedia();
      socket.emit('join-room', ROOM_ID);
      console.log('[VideoConf] Room rejoint:', ROOM_ID);
    });

    socket.on('connect_error', (error) => {
      console.error('[VideoConf] ❌ Erreur de connexion:', error);
      setConnectionStatus('Erreur de connexion');
    });

    socket.on('disconnect', (reason) => {
      console.log('[VideoConf] Déconnecté:', reason);
      setConnectionStatus('Déconnecté');
    });

    socket.on('get-existing-users', async (users: string[]) => {
      console.log('[VideoConf] 👥 Utilisateurs existants:', users);
      setConnectedUsers(users);
      let stream = localStreamRef.current;
      if (!stream) stream = await getMedia();
      if (!stream) {
        console.error('[VideoConf] ❌ Pas de stream local disponible');
        return;
      }
      for (const userId of users) {
        if (userId === socket.id || peersRef.current.has(userId)) continue;
        console.log('[VideoConf] 📞 Création offre pour:', userId);
        const pc = createPeerConnection(userId, stream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('sending-offer', { offer: pc.localDescription, toId: userId });
      }
    });

    socket.on('user-joined', async (userId: string) => {
      console.log('[VideoConf] ➕ Nouvel utilisateur rejoint:', userId);
      setConnectedUsers(prev => [...prev, userId]);
      let stream = localStreamRef.current;
      if (!stream) stream = await getMedia();
      if (!stream || peersRef.current.has(userId)) return;
      console.log('[VideoConf] 📞 Création offre pour nouvel utilisateur:', userId);
      const pc = createPeerConnection(userId, stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('sending-offer', { offer: pc.localDescription, toId: userId });
    });

    socket.on('user-left', (userId: string) => {
      console.log('[VideoConf] ➖ Utilisateur parti:', userId);
      setConnectedUsers(prev => prev.filter(id => id !== userId));
      removeRemoteStream(userId);
      peersRef.current.get(userId)?.close();
      peersRef.current.delete(userId);
    });

    socket.on('receiving-offer', async (offer: any, fromId: string) => {
      console.log('[VideoConf] 📥 Offre reçue de:', fromId);
      let stream = localStreamRef.current;
      if (!stream) stream = await getMedia();
      if (!stream) return;
      const pc = createPeerConnection(fromId, stream);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('sending-answer', { answer: pc.localDescription, toId: fromId });
      console.log('[VideoConf] 📤 Réponse envoyée à:', fromId);
    });

    socket.on('receiving-answer', async (answer: any, fromId: string) => {
      console.log('[VideoConf] 📥 Réponse reçue de:', fromId);
      const pc = peersRef.current.get(fromId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('[VideoConf] ✅ Réponse appliquée pour:', fromId);
      }
    });

    socket.on('receiving-ice-candidate', async (candidate: any, fromId: string) => {
      const pc = peersRef.current.get(fromId);
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('[VideoConf] 🧊 ICE candidate ajouté de:', fromId);
      }
    });

    socket.on('message-history', (messages: any[]) => {
      setChatMessages(messages.map(m => ({
        id: m.id || String(Date.now()),
        user: m.sender || 'Utilisateur',
        time: new Date(m.createdAt || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        message: m.content
      })));
    });

    socket.on('receive-chat-message', (content: string, senderId: string, timestamp: Date) => {
      setChatMessages(prev => [...prev, {
        id: String(Date.now()),
        user: senderId === socket.id ? 'Vous' : `Participant`,
        time: new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        message: content
      }]);
    });

    socketRef.current = socket as AppSocket;

    return () => {
      mounted = false;
      socket.disconnect();
      peersRef.current.forEach(pc => pc.close());
      peersRef.current.clear();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [DYNAMIC_SERVER_URL, ROOM_ID, authToken, createPeerConnection, getMedia, removeRemoteStream]);

  const handleSendMessage = () => {
    const content = chatMessage.trim();
    if (!content || !socketRef.current) {
      console.warn('[VideoConf] ⚠️ Impossible d\'envoyer le message:', !content ? 'vide' : 'socket non connecté');
      return;
    }
    console.log('[VideoConf] 💬 Envoi message:', content);
    socketRef.current.emit('send-chat-message', { content, roomId: ROOM_ID, senderId: socketRef.current.id || '' });
    setChatMessages(prev => [...prev, {
      id: String(Date.now()),
      user: 'Vous',
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      message: content
    }]);
    setChatMessage('');
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
        };
      } catch (err) {
        console.error('Erreur partage écran:', err);
      }
    }
  };

  const totalParticipants = 1 + remoteStreams.size;

  // Translations
  const txt = {
    you: language === 'fr' ? 'Vous' : 'You',
    cameraOff: language === 'fr' ? 'Caméra désactivée' : 'Camera off',
    waitingParticipants: language === 'fr' ? 'En attente de participants' : 'Waiting for participants',
    noMessages: language === 'fr' ? 'Aucun message' : 'No messages',
    messagePlaceholder: language === 'fr' ? 'Message...' : 'Message...',
    noOtherParticipant: language === 'fr' ? 'Aucun autre participant' : 'No other participants',
    connected: language === 'fr' ? 'Connecté' : 'Connected',
    selectImagery: language === 'fr' ? 'Sélectionnez une imagerie dans le panel de gauche' : 'Select imagery from the left panel',
    hide: language === 'fr' ? 'Masquer' : 'Hide',
    quit: language === 'fr' ? 'Quitter' : 'Leave',
    addDocument: language === 'fr' ? 'Ajouter un document' : 'Add document',
    search: language === 'fr' ? 'Rechercher...' : 'Search...',
    suspectZone: language === 'fr' ? 'Zone suspecte' : 'Suspect zone',
    age: language === 'fr' ? 'Âge' : 'Age',
    bloodType: language === 'fr' ? 'Groupe sanguin' : 'Blood type',
    allergies: language === 'fr' ? 'Allergies' : 'Allergies',
    diagnostic: language === 'fr' ? 'Diagnostic' : 'Diagnosis',
    lastVisit: language === 'fr' ? 'Dernière visite' : 'Last visit',
    nextRCP: language === 'fr' ? 'Prochaine RCP' : 'Next RCP',
    years: language === 'fr' ? 'ans' : 'years',
    slices: language === 'fr' ? 'coupes' : 'slices',
  };

  // Control button component
  const ControlButton = ({ onClick, active, danger, children, label }: {
    onClick: () => void;
    active?: boolean;
    danger?: boolean;
    children: React.ReactNode;
    label?: string;
  }) => (
    <button
      onClick={onClick}
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
        backgroundColor: danger ? C.red : active ? C.blue : C.bgControl,
        color: C.textWhite,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = danger ? C.redDark : active ? C.blueDark : C.bgControlHover;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = danger ? C.red : active ? C.blue : C.bgControl;
      }}
    >
      {children}
    </button>
  );

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
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '2px 8px', borderRadius: '4px', fontSize: '12px',
            backgroundColor: connectionStatus === 'Connecté' ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
            color: connectionStatus === 'Connecté' ? C.green : C.yellow,
          }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              backgroundColor: connectionStatus === 'Connecté' ? C.green : C.yellow,
            }} />
            {connectionStatus}
          </div>

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
                  transition: 'all 0.2s',
                }}
              >
                {mode === 'video' ? <Video size={12} /> : <ImageIcon size={12} />}
                {mode === 'video' ? 'Vidéo' : (language === 'fr' ? 'Imagerie' : 'Imagery')}
              </button>
            ))}
          </div>

          {/* Participants count */}
          <button
            onClick={() => { setRightPanelOpen(true); setRightPanelTab('participants'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '4px 8px', border: 'none', borderRadius: '4px',
              backgroundColor: 'transparent', color: C.textGray, cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            <Users size={14} />
            {totalParticipants}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              width: '28px', height: '28px', border: 'none', borderRadius: '4px',
              backgroundColor: 'transparent', color: C.textGray, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* ===== LEFT PANEL ===== */}
        {leftPanelOpen && (
          <div style={{
            width: '280px',
            backgroundColor: C.bgPanel,
            borderRight: `1px solid ${C.border}`,
            display: 'flex', flexDirection: 'column', flexShrink: 0,
            overflow: 'hidden',
          }}>
            {/* Panel tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
              {[
                { id: 'patient', icon: UserIcon, label: 'Patient' },
                { id: 'documents', icon: FileText, label: 'Docs' },
                { id: 'imagery', icon: ImageIcon, label: 'Images' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setLeftPanelTab(tab.id as any)}
                  style={{
                    flex: 1, padding: '10px 8px', border: 'none', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    fontSize: '11px', transition: 'all 0.2s',
                    backgroundColor: leftPanelTab === tab.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                    color: leftPanelTab === tab.id ? C.blueLight : C.textGray,
                    borderBottom: leftPanelTab === tab.id ? `2px solid ${C.blueLight}` : '2px solid transparent',
                  }}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Panel content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
              {/* PATIENT TAB */}
              {leftPanelTab === 'patient' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Patient avatar */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px', backgroundColor: C.bgCard, borderRadius: '10px',
                  }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      backgroundColor: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 600, fontSize: '16px',
                    }}>
                      {displayPatientName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <p style={{ color: C.textWhite, fontWeight: 500, margin: 0 }}>{patientInfo.name}</p>
                      <p style={{ color: C.textGray, fontSize: '12px', margin: 0 }}>{patientInfo.id}</p>
                    </div>
                  </div>

                  {/* Quick info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ backgroundColor: C.bgCard, padding: '10px', borderRadius: '8px' }}>
                      <p style={{ color: C.textGrayDark, fontSize: '11px', margin: 0 }}>{txt.age}</p>
                      <p style={{ color: C.textWhite, fontSize: '14px', fontWeight: 500, margin: '2px 0 0' }}>{patientInfo.age} {txt.years}</p>
                    </div>
                    <div style={{ backgroundColor: C.bgCard, padding: '10px', borderRadius: '8px' }}>
                      <p style={{ color: C.textGrayDark, fontSize: '11px', margin: 0 }}>{txt.bloodType}</p>
                      <p style={{ color: C.textWhite, fontSize: '14px', fontWeight: 500, margin: '2px 0 0' }}>{patientInfo.bloodType}</p>
                    </div>
                  </div>

                  {/* Diagnostic */}
                  <div style={{ backgroundColor: C.bgCard, padding: '12px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Stethoscope size={16} color={C.orange} />
                      <span style={{ color: C.textGray, fontSize: '11px' }}>{txt.diagnostic}</span>
                    </div>
                    <p style={{ color: C.textWhite, fontSize: '13px', margin: 0 }}>{patientInfo.diagnosis}</p>
                  </div>

                  {/* Allergies */}
                  <div style={{
                    backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                    padding: '12px', borderRadius: '10px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Activity size={16} color={C.red} />
                      <span style={{ color: C.red, fontSize: '12px', fontWeight: 500 }}>{txt.allergies}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {patientInfo.allergies.map((allergy, i) => (
                        <span key={i} style={{
                          backgroundColor: 'rgba(239,68,68,0.2)', color: '#fca5a5',
                          padding: '2px 8px', borderRadius: '4px', fontSize: '12px',
                        }}>{allergy}</span>
                      ))}
                    </div>
                  </div>

                  {/* Dates */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <Clock size={16} color={C.textGrayDark} />
                      <span style={{ color: C.textGray }}>{txt.lastVisit}:</span>
                      <span style={{ color: C.textWhite }}>{patientInfo.lastVisit}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <Calendar size={16} color={C.textGrayDark} />
                      <span style={{ color: C.textGray }}>{txt.nextRCP}:</span>
                      <span style={{ color: C.blueLight }}>{patientInfo.nextRCP}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* DOCUMENTS TAB */}
              {leftPanelTab === 'documents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Search */}
                  <div style={{ position: 'relative', marginBottom: '4px' }}>
                    <Search size={16} color={C.textGrayDark} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      placeholder={txt.search}
                      value={searchDoc}
                      onChange={(e) => setSearchDoc(e.target.value)}
                      style={{
                        width: '100%', height: '32px', paddingLeft: '32px', paddingRight: '8px',
                        backgroundColor: C.bgCard, border: 'none', borderRadius: '6px',
                        color: C.textWhite, fontSize: '13px', outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {documents.filter(d => d.name.toLowerCase().includes(searchDoc.toLowerCase())).map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        padding: '12px', backgroundColor: C.bgCard, borderRadius: '10px',
                        cursor: 'pointer', transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.bgCardHover; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.bgCard; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '8px',
                          backgroundColor: doc.type === 'pdf' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <FileText size={20} color={doc.type === 'pdf' ? '#f87171' : C.blueLight} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: C.textWhite, fontSize: '13px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</p>
                          <p style={{ color: C.textGrayDark, fontSize: '11px', margin: '2px 0 0' }}>{doc.owner} • {doc.date}</p>
                          <p style={{ color: C.textGrayDarker, fontSize: '11px', margin: '1px 0 0' }}>{doc.size}</p>
                        </div>
                        <button style={{
                          width: '32px', height: '32px', border: 'none', borderRadius: '6px',
                          backgroundColor: 'transparent', color: C.textGray, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: 0.5, transition: 'opacity 0.2s',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; }}
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button style={{
                    width: '100%', padding: '10px', marginTop: '4px',
                    border: `1px dashed ${C.textGrayDark}`, borderRadius: '8px',
                    backgroundColor: 'transparent', color: C.textGray,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    fontSize: '13px', transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.textGray; e.currentTarget.style.color = C.textWhite; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.textGrayDark; e.currentTarget.style.color = C.textGray; }}
                  >
                    <Upload size={16} />
                    {txt.addDocument}
                  </button>
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
          {viewMode === 'imagery' ? (
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
                            <ellipse cx="100" cy="100" rx="70" ry="80" fill="none" stroke="rgba(96,165,250,0.3)" strokeWidth="2"/>
                            <path d="M 100 30 Q 140 50 140 100 Q 140 150 100 170 Q 60 150 60 100 Q 60 50 100 30" fill="rgba(59,130,246,0.2)" stroke="rgba(96,165,250,0.5)" strokeWidth="1.5"/>
                            <circle cx="120" cy="90" r="20" fill="none" stroke="#22d3ee" strokeWidth="2" strokeDasharray="3,3"/>
                            <line x1="140" y1="80" x2="180" y2="50" stroke="#22d3ee" strokeWidth="1"/>
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
                    {localStream && videoEnabled ? (
                      <video ref={localVideoRef} autoPlay muted playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                    ) : (
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
            /* VIDEO GRID VIEW */
            <div style={{
              flex: 1, display: 'grid', gap: '8px', padding: '12px',
              gridTemplateColumns: totalParticipants <= 2 ? (totalParticipants === 1 ? '1fr' : '1fr 1fr') : 'repeat(2, 1fr)',
              gridTemplateRows: totalParticipants <= 2 ? '1fr' : 'repeat(2, 1fr)',
            }}>
              {/* My video */}
              <div style={{
                backgroundColor: C.bgCard, borderRadius: '12px', overflow: 'hidden',
                position: 'relative', minHeight: '180px',
              }}>
                {/* Video element always in DOM so srcObject persists across toggles */}
                <video ref={localVideoRef} autoPlay muted playsInline
                  style={{
                    width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)',
                    display: videoEnabled && localStream ? 'block' : 'none',
                  }} />
                {/* Avatar shown when camera is off */}
                {(!videoEnabled || !localStream) && (
                  <div style={{
                    width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '50%', backgroundColor: C.blue,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '22px', fontWeight: 600, marginBottom: '8px',
                    }}>{currentDoctorInitials}</div>
                    <p style={{ color: C.textWhite, fontSize: '14px', margin: 0 }}>{currentDoctorName}</p>
                    <p style={{ color: C.textGrayDark, fontSize: '12px', margin: '4px 0 0' }}>{txt.cameraOff}</p>
                  </div>
                )}
                {/* Name overlay */}
                <div style={{
                  position: 'absolute', bottom: '8px', left: '8px', right: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    borderRadius: '6px', padding: '4px 8px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <span style={{ color: 'white', fontSize: '13px' }}>{currentDoctorName}</span>
                    <span style={{
                      backgroundColor: 'rgba(59,130,246,0.8)', color: 'white',
                      padding: '1px 6px', borderRadius: '4px', fontSize: '11px',
                    }}>{txt.you}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {!micEnabled && (
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%', backgroundColor: C.red,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}><MicOff size={12} color="white" /></div>
                    )}
                    {!videoEnabled && (
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%', backgroundColor: C.textGrayDark,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}><VideoOff size={12} color="white" /></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Remote videos */}
              {Array.from(remoteStreams.entries()).map(([id, stream]) => (
                <div key={id} style={{
                  backgroundColor: C.bgCard, borderRadius: '12px', overflow: 'hidden',
                  position: 'relative', minHeight: '180px',
                }}>
                  <video autoPlay playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '180px' }}
                    ref={(video) => { if (video) video.srcObject = stream; }}
                  />
                  <div style={{
                    position: 'absolute', bottom: '8px', left: '8px',
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    borderRadius: '6px', padding: '4px 8px',
                  }}>
                    <span style={{ color: 'white', fontSize: '13px' }}>Participant {id.slice(0, 6)}</span>
                  </div>
                </div>
              ))}

              {/* Placeholder when alone */}
              {remoteStreams.size === 0 && (
                <div style={{
                  backgroundColor: 'rgba(42,42,42,0.5)', borderRadius: '12px',
                  border: `2px dashed ${C.borderLight}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '24px',
                }}>
                  <Users size={40} color={C.textGrayDarker} style={{ marginBottom: '8px' }} />
                  <p style={{ color: C.textGray, fontSize: '14px', margin: 0 }}>{txt.waitingParticipants}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                    <code style={{
                      backgroundColor: 'rgba(59,130,246,0.1)', color: C.blueLight,
                      padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
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
                      {micEnabled ? <Mic size={14} color={C.green} /> : <MicOff size={14} color={C.red} />}
                      {videoEnabled ? <Video size={14} color={C.green} /> : <VideoOff size={14} color={C.textGrayDark} />}
                    </div>
                  </div>

                  {/* Remote participants */}
                  {Array.from(remoteStreams.keys()).map((id) => (
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
                      }}>{id.slice(0, 2).toUpperCase()}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: C.textWhite, fontSize: '13px', margin: 0 }}>Participant {id.slice(0, 6)}</p>
                        <p style={{ color: C.textGrayDark, fontSize: '11px', margin: '2px 0 0' }}>{txt.connected}</p>
                      </div>
                    </div>
                  ))}

                  {remoteStreams.size === 0 && (
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
          <ControlButton onClick={() => setLeftPanelOpen(!leftPanelOpen)} active={leftPanelOpen}>
            <FolderOpen size={20} />
          </ControlButton>

          <div style={{ width: '1px', height: '24px', backgroundColor: C.borderLight, margin: '0 4px' }} />

          {/* Mic */}
          <ControlButton onClick={toggleMic} danger={!micEnabled}>
            {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
          </ControlButton>

          {/* Camera */}
          <ControlButton onClick={toggleVideo} danger={!videoEnabled}>
            {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
          </ControlButton>

          {/* Screen share */}
          <ControlButton onClick={toggleScreenShare} active={isScreenSharing}>
            <Share2 size={20} />
          </ControlButton>

          <div style={{ width: '1px', height: '24px', backgroundColor: C.borderLight, margin: '0 4px' }} />

          {/* Chat */}
          <ControlButton
            onClick={() => { setRightPanelOpen(true); setRightPanelTab('chat'); }}
            active={rightPanelOpen && rightPanelTab === 'chat'}
          >
            <MessageSquare size={20} />
          </ControlButton>

          {/* Participants */}
          <ControlButton
            onClick={() => { setRightPanelOpen(true); setRightPanelTab('participants'); }}
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
            onClick={onClose}
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
