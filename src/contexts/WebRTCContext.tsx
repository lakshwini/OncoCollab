import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents, ParticipantPayload } from '../types/video';
import { API_CONFIG } from '../config/api.config';
import { useVideo } from './VideoContext';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface Participant {
  socketId: string;
  doctorId?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role?: string;
  speciality?: string;
  avatarUrl?: string | null;
  stream?: MediaStream;
  micEnabled: boolean;
  videoEnabled: boolean;
}

const normalizeParticipantPayload = (participant: ParticipantPayload | string): ParticipantPayload => {
  if (typeof participant !== 'string') {
    return participant;
  }
  return {
    socketId: participant,
    doctorId: participant,
    firstName: 'Participant',
    lastName: participant.slice(0, 6),
    role: 'participant',
    speciality: 'Participant',
    avatarUrl: null,
    micEnabled: true,
    videoEnabled: true,
  };
};

interface PrerequisiteUpdatePayload {
  meeting_id: string;
  doctor_id: string;
  key: string;
  status: 'pending' | 'in_progress' | 'done';
}

interface WebRTCContextType {
  // Connexion
  isConnected: boolean;
  mySocketId: string | null;
  connectionStatus: string;

  // Media
  localStream: MediaStream | null;
  isMicEnabled: boolean;
  isVideoEnabled: boolean;
  toggleMic: () => void;
  toggleVideo: () => void;

  // Participants
  participants: Map<string, Participant>;
  activeSpeakerId: string | null;
  audioLevels: Map<string, number>;

  // Room
  joinRoom: (meetingId: string, token: string) => Promise<void>;
  leaveRoom: () => void;
  fullLeaveRoom: () => void;
  currentRoomId: string | null;

  // Prérequis temps réel
  lastPrerequisiteUpdate: PrerequisiteUpdatePayload | null;

  // ✅ WebRTC Monitoring & TURN debugging
  getConnectionStats: () => Promise<any>;
  startMonitoring: (intervalMs?: number) => () => void;
}

const WebRTCContext = createContext<WebRTCContextType | undefined>(undefined);

export function WebRTCProvider({ children }: { children: React.ReactNode }) {
  // Refs (persistent entre renders)
  const socketRef = useRef<AppSocket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const streamRef = useRef<MediaStream | null>(null);
  // Buffer ICE candidates that arrive before setRemoteDescription
  const pendingIceCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  // États
  const [isConnected, setIsConnected] = useState(false);
  const [mySocketId, setMySocketId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('Déconnecté');
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [audioLevels, setAudioLevels] = useState<Map<string, number>>(new Map());
  const [lastPrerequisiteUpdate, setLastPrerequisiteUpdate] = useState<PrerequisiteUpdatePayload | null>(null);

  const {
    stream,
    isCameraOn,
    isMicOn,
    setCameraOn,
    setMicOn,
    setInMeeting,
    stopAllMedia,
  } = useVideo();

  const localStream = stream;
  const isMicEnabled = isMicOn;
  const isVideoEnabled = isCameraOn;

  // Refs pour accéder aux valeurs fraîches dans les closures socket
  const isMicOnRef = useRef(isMicOn);
  const isCameraOnRef = useRef(isCameraOn);
  isMicOnRef.current = isMicOn;
  isCameraOnRef.current = isCameraOn;

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodesRef = useRef<Map<string, AnalyserNode>>(new Map());
  const sourceNodesRef = useRef<Map<string, MediaStreamAudioSourceNode>>(new Map());
  const animationFrameRef = useRef<number | null>(null);

  // ========================================
  // 1️⃣ GESTION MEDIA LOCAL
  // ========================================

  // ✅ Mise à jour SYNCHRONE du ref — pas juste dans useEffect
  // Cela garantit que streamRef.current est toujours à jour quand les socket events arrivent
  streamRef.current = stream;

  const toggleMic = useCallback(() => {
    setMicOn(!isMicOn);
  }, [isMicOn, setMicOn]);

  const toggleVideo = useCallback(() => {
    setCameraOn(!isCameraOn);
  }, [isCameraOn, setCameraOn]);

  // Ref pour éviter d'émettre media-status-change lors du premier join
  // (join-room envoie déjà l'état initial, pas besoin de le ré-émettre)
  const hasJoinedRoomRef = useRef(false);
  const currentRoomIdRef = useRef<string | null>(null);

  useEffect(() => {
    currentRoomIdRef.current = currentRoomId;

    if (!currentRoomId) {
      // Room quittée → reset le flag
      hasJoinedRoomRef.current = false;
      return;
    }

    if (!hasJoinedRoomRef.current) {
      // Premier passage après joinRoom → skip (join-room a déjà envoyé l'état)
      hasJoinedRoomRef.current = true;
      return;
    }
  }, [currentRoomId]);

  useEffect(() => {
    if (!socketRef.current || !currentRoomIdRef.current || !hasJoinedRoomRef.current) return;

    socketRef.current.emit('media-status-change', {
      roomId: currentRoomIdRef.current,
      micEnabled: isMicOn,
      videoEnabled: isCameraOn,
    });
  }, [isMicOn, isCameraOn]);

  // ========================================
  // 2️⃣ GESTION PEER CONNECTIONS
  // ========================================

  const createPeerConnection = useCallback((targetSocketId: string, stream?: MediaStream | null) => {
    console.log(`[WebRTC] 🔗 Création PeerConnection pour: ${targetSocketId}`);

    // ❌ Prévenir les doublons: si une PC existe déjà, la retourner
    if (peerConnectionsRef.current.has(targetSocketId)) {
      console.warn(`[WebRTC] ⚠️ PeerConnection existe déjà pour ${targetSocketId}, réutilisation`);
      return peerConnectionsRef.current.get(targetSocketId)!;
    }

    // ✅ Utiliser la configuration ICE complète avec TURN depuis .env
    const iceConfig = API_CONFIG.ICE_SERVERS;
    console.log(`[WebRTC] 🧊 Configuration ICE pour ${targetSocketId}:`, {
      stun_servers: iceConfig.iceServers?.filter(s => s.urls?.toString().includes('stun')) || [],
      turn_servers: iceConfig.iceServers?.filter(s => s.urls?.toString().includes('turn'))?.map(s => ({
        urls: s.urls,
        username: s.username ? '***' : undefined
      })) || [],
    });

    const pc = new RTCPeerConnection(iceConfig);
    let isMakingOffer = false;

    // Événements de connexion
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] 🔌 État connexion ${targetSocketId}: ${pc.connectionState}`);

      if (pc.connectionState === 'connected') {
        console.log(`[WebRTC] ✅ CONNECTÉ avec ${targetSocketId}`);
        // ✅ Détecter le type de connexion établie quand c'est connecté
        detectConnectionType(pc, targetSocketId);
      } else if (pc.connectionState === 'failed') {
        console.error(`[WebRTC] ❌ ÉCHOUÉ avec ${targetSocketId} - tentative reconnexion...`);
        // Optionnellement, on pourrait tenter une reconnexion ici
      } else if (pc.connectionState === 'disconnected') {
        console.warn(`[WebRTC] 🔌 DÉCONNECTÉ (transitoire) de ${targetSocketId}`);
      } else if (pc.connectionState === 'closed') {
        console.log(`[WebRTC] 🚫 FERMÉ pour ${targetSocketId}`);
        closePeerConnection(targetSocketId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] 🧊 État ICE ${targetSocketId}: ${pc.iceConnectionState}`);

      if (pc.iceConnectionState === 'failed') {
        console.error(`[WebRTC] ❌ ICE FAILED avec ${targetSocketId}`);
      } else if (pc.iceConnectionState === 'connected') {
        console.log(`[WebRTC] ✅ ICE CONNECTÉ avec ${targetSocketId}`);
      }
    };

    // ICE Candidate emission
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        // ✅ Parse ICE candidate type (host/srflx/relay)
        const candidateStr = event.candidate.candidate;
        const parts = candidateStr.split(' ');
        const candidateType = parts[7] || 'unknown'; // typ host/srflx/relay
        const protocol = candidateStr.includes('tcp') ? 'TCP' : 'UDP';
        const address = parts[4];
        const port = parts[5];
        
        console.log(`[WebRTC] 🧊 ICE Candidate émis → ${targetSocketId}`, {
          type: candidateType,
          protocol: protocol,
          address: address,
          port: port,
          priority: parts[3],
          full_candidate: candidateStr.substring(0, 80) + '...'
        });
        
        // Log if TURN relay is detected
        if (candidateType === 'relay') {
          console.log(`[WebRTC] ✅ 🌐 TURN RELAY candidate détecté vers ${targetSocketId} - P2P direct a échoué`);
        }
        
        socketRef.current.emit('sending-ice-candidate', {
          candidate: event.candidate.toJSON(),
          toId: targetSocketId
        });
      } else if (!event.candidate) {
        console.log(`[WebRTC] 🧊 ICE gathering terminé pour ${targetSocketId}`);
      }
    };

    pc.onnegotiationneeded = async () => {
      if (isMakingOffer) return;
      if (!socketRef.current) return;

      try {
        isMakingOffer = true;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (pc.localDescription) {
          socketRef.current.emit('sending-offer', {
            offer: pc.localDescription,
            toId: targetSocketId
          });
          console.log(`[WebRTC] 🔁 Renegociation envoyee → ${targetSocketId}`);
        }
      } catch (error) {
        console.error('[WebRTC] ❌ Erreur renegociation:', error);
      } finally {
        isMakingOffer = false;
      }
    };

    // Track reçu (flux distant) 
    pc.ontrack = (event) => {
      console.log(`[WebRTC] 📺 Track REÇU de ${targetSocketId}: ${event.track.kind}`);

      if (event.streams[0]) {
        setParticipants(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(targetSocketId) || {
            socketId: targetSocketId,
            micEnabled: true,
            videoEnabled: true
          };

          newMap.set(targetSocketId, {
            ...existing,
            stream: event.streams[0],
            // ⭐ Si c'est une video, la camera est enabled
            videoEnabled: event.track.kind === 'video' ? event.track.enabled : existing.videoEnabled,
            micEnabled: event.track.kind === 'audio' ? event.track.enabled : existing.micEnabled,
          });

          console.log(`[WebRTC] ✅ Participant ${targetSocketId} mis à jour avec ${event.track.kind}`);
          return newMap;
        });
      }
    };

    // Ajouter les tracks locaux (si disponibles)
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log(`[WebRTC] ➕ Ajout track ${track.kind} → ${targetSocketId}`);
        pc.addTrack(track, stream);
      });
    }

    // Stocker la peerConnection
    peerConnectionsRef.current.set(targetSocketId, pc);
    console.log(`[WebRTC] 📝 PeerConnection créée et stockée pour ${targetSocketId}`);

    return pc;
  }, []);

  // ✅ Détecte le type de connexion établie (host/srflx/relay) et confirme l'utilisation de TURN
  const detectConnectionType = useCallback(async (pc: RTCPeerConnection, peerId: string) => {
    try {
      // Attendre un peu pour que les stats soient disponibles
      await new Promise(resolve => setTimeout(resolve, 500));

      const stats = await pc.getStats();
      let relayConnectionFound = false;
      let srflxConnectionFound = false;
      let hostConnectionFound = false;
      const connectionDetails: any = {
        active_pair: null,
        local_candidates: [],
        remote_candidates: [],
      };

      stats.forEach(report => {
        // Chercher la paire de candidats actifs (succeeded)
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          const currentRoundTripTime = report.currentRoundTripTime;
          const availableOutgoingBitrate = report.availableOutgoingBitrate;
          
          connectionDetails.active_pair = {
            rtt_ms: (currentRoundTripTime * 1000).toFixed(2),
            bitrate_mbps: (availableOutgoingBitrate / 1024 / 1024).toFixed(2),
            local_candidate_id: report.localCandidateId,
            remote_candidate_id: report.remoteCandidateId,
          };

          console.log(
            `[WebRTC] Paire de candidats active avec ${peerId}:`,
            {
              rtt: (currentRoundTripTime * 1000).toFixed(2) + 'ms',
              bitrate: (availableOutgoingBitrate / 1024 / 1024).toFixed(2) + ' Mbps',
            }
          );
        }

        // Analyser les candidats locaux et distants
        if (report.type === 'candidate') {
          const candidateType = report.candidateType; // 'host', 'srflx', 'relay'
          const candidateInfo = {
            type: candidateType,
            address: report.address,
            port: report.port,
            protocol: report.protocol,
            priority: report.priority,
          };

          if (report.address) { // Only if it's a local or remote candidate
            if (report.type === 'candidate' && !report.relatedAddress) {
              // Local candidate
              connectionDetails.local_candidates.push(candidateInfo);
            } else if (report.type === 'candidate' && report.relatedAddress) {
              // Remote candidate
              connectionDetails.remote_candidates.push(candidateInfo);
            }
          }

          if (candidateType === 'relay') {
            relayConnectionFound = true;
            console.log(
              `[WebRTC] TURN RELAY détecté avec ${peerId}: ${report.address}:${report.port} (${report.protocol})`
            );
          } else if (candidateType === 'srflx') {
            srflxConnectionFound = true;
            console.log(
              `[WebRTC] STUN candidate (srflx) détecté avec ${peerId}: ${report.address}:${report.port}`
            );
          } else if (candidateType === 'host') {
            hostConnectionFound = true;
            console.log(
              `[WebRTC] 🔗 Host candidate (P2P Direct) détecté avec ${peerId}: ${report.address}:${report.port}`
            );
          }
        }
      });

      // ✅ Résumé final du type de connexion
      console.log(`[WebRTC] ========== RÉSUMÉ CONNEXION POUR ${peerId} ==========`);
      if (relayConnectionFound) {
        console.log(`[WebRTC] ✅ 🌐 USING TURN RELAY - P2P direct a échoué, utilisant le serveur de relais`);
        console.log(`[WebRTC] 💡 Cela signifie que les utilisateurs sont derrière NAT/Firewall`);
      } else if (srflxConnectionFound) {
        console.log(`[WebRTC] ✅ 🔓 USING STUN (srflx) - P2P avec traversal de NAT`);
        console.log(`[WebRTC] 💡 Cela signifie que les adresses IP publiques ont été découvertes`);
        if (hostConnectionFound) {
          console.log(`[WebRTC] 💡 Host candidates aussi disponibles`);
        }
      } else if (hostConnectionFound) {
        console.log(`[WebRTC] ✅ 🔗 USING HOST (P2P DIRECT) - Connexion directe établie`);
        console.log(`[WebRTC] 💡 Cela signifie que les deux peers sont sur le même réseau ou sans NAT`);
      }
      
      console.log(`[WebRTC] Détails de la connexion:`, connectionDetails);
      console.log(`[WebRTC] ==================================================`);

    } catch (error) {
      console.error(`[WebRTC] ❌ Erreur détection type connexion pour ${peerId}:`, error);
    }
  }, []);

  const closePeerConnection = useCallback((socketId: string) => {
    const pc = peerConnectionsRef.current.get(socketId);

    if (pc) {
      console.log(`[WebRTC] 🔌 Fermeture PeerConnection pour: ${socketId}`);
      
      // Aller par tous les senders et les arrêter proprement
      pc.getSenders().forEach(sender => {
        try {
          pc.removeTrack(sender);
        } catch (e) {
          console.debug(`[WebRTC] Erreur lors du stop de sender:`, e);
        }
      });

      // Fermer la PC
      try {
        pc.close();
      } catch (e) {
        console.debug(`[WebRTC] Erreur lors de la fermeture PC:`, e);
      }

      peerConnectionsRef.current.delete(socketId);
      pendingIceCandidates.current.delete(socketId);
      console.log(`[WebRTC] ✅ PeerConnection fermée et supprimée: ${socketId}`);
    }

    // Retirer des participants
    setParticipants(prev => {
      const newMap = new Map(prev);
      const participant = newMap.get(socketId);
      
      if (participant && participant.stream) {
        // Arrêter tous les tracks
        participant.stream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            console.debug(`[WebRTC] Erreur lors du stop de track:`, e);
          }
        });
        console.log(`[WebRTC] 🛑 Tracks arrêtés pour ${socketId}`);
      }

      newMap.delete(socketId);
      return newMap;
    });

    console.log(`[WebRTC] ❌ Participant supprimé: ${socketId}`);
  }, []);

  // ========================================
  // 3️⃣ GESTION WEBSOCKET SIGNALING
  // ========================================

  const joinRoom = useCallback(async (meetingId: string, token: string) => {
    console.log('[WebRTC] 🚪 ========== REJOINDRE ROOM ==========');
    console.log('[WebRTC] 🚪 Room ID:', meetingId);
    console.log('[WebRTC] 🚪 Token présent:', !!token);
    console.log('[WebRTC] 🚪 WebSocket URL:', API_CONFIG.WEBSOCKET_URL);

    // Créer socket si pas déjà créé
    if (!socketRef.current) {
      console.log('[WebRTC] 🔌 Création nouvelle connexion socket...');
      const socket = io(API_CONFIG.WEBSOCKET_URL, {
        ...API_CONFIG.SOCKET_CONFIG,
        auth: { token }
      });

      socketRef.current = socket;

      // ===== ÉVÉNEMENTS SOCKET =====

      socket.on('connect', () => {
        console.log('[WebRTC] ✅ ========== SOCKET CONNECTÉ ==========');
        console.log('[WebRTC] ✅ Socket ID:', socket.id);
        console.log('[WebRTC] ✅ Socket connected:', socket.connected);
        setIsConnected(true);
        setMySocketId(socket.id ?? null);
        setConnectionStatus('Connecté');

        // ⚠️ CRITIQUE : Émettre join-room APRÈS le connect event, quand socket.id est prêt
        console.log('[WebRTC] 📡 ========== ÉMISSION JOIN-ROOM (POST-CONNECT) ==========');
        const micState = isMicOnRef.current;
        const camState = isCameraOnRef.current;
        console.log('[WebRTC] 📡 ROOM ID:', meetingId);
        console.log('[WebRTC] 📡 Mic enabled:', micState);
        console.log('[WebRTC] 📡 Caméra enabled:', camState);
        console.log('[WebRTC] 📡 Socket ID (moi):', socket.id);
        
        socket.emit('join-room', {
          roomId: meetingId,
          micEnabled: micState,
          videoEnabled: camState,
        });
        
        setCurrentRoomId(meetingId);
        setInMeeting(true);
        setConnectionStatus('En room');
        console.log(`[WebRTC] ✅ JOIN-ROOM émis pour room: ${meetingId}`);
      });

      socket.on('disconnect', (reason) => {
        console.log('[WebRTC] ❌ ========== SOCKET DÉCONNECTÉ ==========');
        console.log('[WebRTC] ❌ Raison:', reason);
        setIsConnected(false);
        setConnectionStatus('Déconnecté');
      });

      socket.on('connect_error', (error) => {
        console.error('[WebRTC] ❌ ========== ERREUR CONNEXION ==========');
        console.error('[WebRTC] ❌ Erreur:', error);
        setConnectionStatus('Erreur');
      });

      socket.on('self-info', (participant: ParticipantPayload) => {
        const normalized = normalizeParticipantPayload(participant);
        setParticipants(prev => {
          const next = new Map(prev);
          next.set(normalized.socketId, {
            socketId: normalized.socketId,
            doctorId: normalized.doctorId,
            firstName: normalized.firstName,
            lastName: normalized.lastName,
            name: `${normalized.firstName} ${normalized.lastName}`.trim(),
            role: normalized.role,
            speciality: normalized.speciality,
            avatarUrl: normalized.avatarUrl,
            micEnabled: normalized.micEnabled,
            videoEnabled: normalized.videoEnabled,
          });
          return next;
        });
      });

      // Utilisateurs déjà présents
      socket.on('get-existing-users', async (users: ParticipantPayload[]) => {
        const normalized = (users || []).map(normalizeParticipantPayload);
        console.log('[WebRTC] 👥 ========== UTILISATEURS EXISTANTS REÇUS ==========');
        console.log('[WebRTC] 👥 Nombre d\'utilisateurs:', normalized.length);
        console.log('[WebRTC] 👥 Mon socketId:', socket.id);
        console.log('[WebRTC] 👥 Liste des socketIds:', normalized.map(u => u.socketId));

        // Créer peer connection pour chaque user existant
        for (const participant of normalized) {
          const userId = participant.socketId;
          console.log(`[WebRTC] 👤 Traitement participant: ${userId} (${participant.firstName} ${participant.lastName})`);
          
          // ✅ Vérifier que ce n'est pas nous
          if (userId === socket.id) {
            console.debug(`[WebRTC] ⏭️ Ignoré (c'est nous): ${userId}`);
            continue;
          }

          // ✅ Vérifier que la PC n'existe pas déjà
          if (peerConnectionsRef.current.has(userId)) {
            console.debug(`[WebRTC] ⏭️ PC existe déjà pour: ${userId}`);
            continue;
          }

          console.log(`[WebRTC]  ========== CRÉATION PC ET OFFER POUR: ${userId} ==========`);

          try {
            const pc = createPeerConnection(userId, streamRef.current);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            if (!socket.connected) {
              console.warn('[WebRTC] ⚠️ Socket déconnecté avant d\'envoyer offer');
              return;
            }

            if (pc.localDescription) {
              console.log(`[WebRTC] Envoi OFFER vers ${userId}`);
              console.log(`[WebRTC] Type d'offre:`, pc.localDescription.type);
              socket.emit('sending-offer', {
                offer: pc.localDescription,
                toId: userId
              });
              console.log(`[WebRTC] ========== OFFER ENVOYÉE → ${userId} ==========`);
            }
          } catch (error) {
            console.error(`[WebRTC]  Erreur création offer pour ${userId}:`, error);
          }
        }

        setParticipants(prev => {
          const next = new Map(prev);
          normalized.forEach((p) => {
            next.set(p.socketId, {
              socketId: p.socketId,
              doctorId: p.doctorId,
              firstName: p.firstName,
              lastName: p.lastName,
              name: `${p.firstName} ${p.lastName}`.trim(),
              role: p.role,
              speciality: p.speciality,
              avatarUrl: p.avatarUrl,
              micEnabled: p.micEnabled,
              videoEnabled: p.videoEnabled,
            });
          });
          return next;
        });

        console.log(`[WebRTC] PeerConnections créées pour ${normalized.length} utilisateurs existants`);
      });

      // Nouvel utilisateur rejoint
      //  NE PAS créer de PC/offer ici - le nouvel utilisateur enverra l'offer
      // via get-existing-users. Si les deux côtés envoient des offers (glare),
      // les deux sont ignorées et personne ne se voit.
      socket.on('user-joined', (participant: ParticipantPayload) => {
        const normalized = normalizeParticipantPayload(participant);
        const userId = normalized.socketId;
        console.log('[WebRTC] ➕ ========== NOUVEL UTILISATEUR REJOINT ==========');
        console.log(`[WebRTC] ➕ User ID: ${userId}`);
        console.log(`[WebRTC] ➕ Nom: ${normalized.firstName} ${normalized.lastName}`);
        console.log(`[WebRTC] ➕ (Attente de son offer...)`);  

        setParticipants(prev => {
          const newMap = new Map(prev);
          if (!newMap.has(userId)) {
            newMap.set(userId, {
              socketId: userId,
              doctorId: normalized.doctorId,
              firstName: normalized.firstName,
              lastName: normalized.lastName,
              name: `${normalized.firstName} ${normalized.lastName}`.trim(),
              role: normalized.role,
              speciality: normalized.speciality,
              avatarUrl: normalized.avatarUrl,
              micEnabled: normalized.micEnabled,
              videoEnabled: normalized.videoEnabled
            });
          }
          return newMap;
        });
      });

      // Utilisateur quitte
      socket.on('user-left', (userId: string) => {
        console.log(`[WebRTC] ➖ Utilisateur parti: ${userId}`);
        closePeerConnection(userId);
        
        const remaining = peerConnectionsRef.current.size;
        console.log(`[WebRTC] 📊 ${remaining} PeerConnection(s) restante(s)`);
      });

      // Recevoir offer
      socket.on('receiving-offer', async (offer: RTCSessionDescriptionInit, fromId: string) => {
        console.log('[WebRTC] ========== OFFER REÇUE ==========');
        console.log(`[WebRTC] De: ${fromId}`);
        console.log(`[WebRTC] Type:`, offer.type);

        const currentStream = streamRef.current;
      

        try {
          let pc = peerConnectionsRef.current.get(fromId);

          if (pc) {
            
            if (pc.signalingState === 'have-local-offer') {
              // GLARE: les deux côtés ont envoyé des offers simultanément
              // Fermer l'ancienne PC et en créer une nouvelle pour accepter l'offer entrante
              console.log(`[WebRTC] 🔄 Glare avec ${fromId} — remplacement PC`);
              try { pc.close(); } catch (e) {}
              peerConnectionsRef.current.delete(fromId);
              pc = createPeerConnection(fromId, currentStream);
            } else if (pc.signalingState === 'stable') {
              // Renégociation (changement de tracks)
              console.log(`[WebRTC] 🔄 Renégociation avec ${fromId}`);
            } else {
              console.warn(`[WebRTC] ⚠️ État signaling inattendu: ${pc.signalingState} pour ${fromId}, skip`);
              return;
            }
          } else {
            // Pas de PC — en créer une nouvelle
            pc = createPeerConnection(fromId, currentStream);
          }

          await pc.setRemoteDescription(new RTCSessionDescription(offer));

          // Appliquer les ICE candidates mis en buffer avant setRemoteDescription
          const buffered = pendingIceCandidates.current.get(fromId);
          if (buffered && buffered.length > 0) {
            console.log(`[WebRTC] 🧊 Application de ${buffered.length} ICE candidates buffered pour ${fromId}`);
            for (const cand of buffered) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch (e) {
                console.debug(`[WebRTC] [ICE] Erreur candidate buffered (normal): ${e}`);
              }
            }
            pendingIceCandidates.current.delete(fromId);
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          if (pc.localDescription) {
            console.log(`[WebRTC] 📤 Envoi ANSWER vers ${fromId}`);
            socket.emit('sending-answer', {
              answer: pc.localDescription,
              toId: fromId
            });
            console.log(`[WebRTC] ✅ ========== ANSWER ENVOYÉE → ${fromId} ==========`);
          }
        } catch (error) {
          console.error(`[WebRTC] ❌ Erreur handling offer de ${fromId}:`, error);
        }
      });

      // Recevoir answer
      socket.on('receiving-answer', async (answer: RTCSessionDescriptionInit, fromId: string) => {
        console.log('[WebRTC] 📥 ========== ANSWER REÇUE ==========');
        console.log(`[WebRTC] 📥 De: ${fromId}`);
        console.log(`[WebRTC] 📥 Type:`, answer.type);

        try {
          const pc = peerConnectionsRef.current.get(fromId);
          if (!pc) {
            console.warn(`[WebRTC] ⚠️ PC n'existe pas pour ${fromId}, ignoré`);
            return;
          }

          // Appliquer la description distante (answer)
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          console.log(`[WebRTC] ✅ ========== ANSWER APPLIQUÉE POUR: ${fromId} ==========`);
          console.log(`[WebRTC] ✅ État signaling:`, pc.signalingState);
          console.log(`[WebRTC] ✅ État connexion:`, pc.connectionState);

          // Appliquer les ICE candidates mis en buffer avant setRemoteDescription
          const buffered = pendingIceCandidates.current.get(fromId);
          if (buffered && buffered.length > 0) {
            console.log(`[WebRTC] 🧊 Application de ${buffered.length} ICE candidates buffered (answer) pour ${fromId}`);
            for (const cand of buffered) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch (e) {
                console.debug(`[WebRTC] [ICE] Erreur candidate buffered (normal): ${e}`);
              }
            }
            pendingIceCandidates.current.delete(fromId);
          }
        } catch (error) {
          console.error(`[WebRTC] ❌ Erreur handling answer de ${fromId}:`, error);
        }
      });

      // Recevoir ICE candidate
      socket.on('receiving-ice-candidate', async (candidate: RTCIceCandidateInit, fromId: string) => {
        try {
          const pc = peerConnectionsRef.current.get(fromId);
          if (!pc) {
            // PC pas encore créée — mettre en buffer pour plus tard
            if (!pendingIceCandidates.current.has(fromId)) {
              pendingIceCandidates.current.set(fromId, []);
            }
            pendingIceCandidates.current.get(fromId)!.push(candidate);
            console.debug(`[WebRTC] 🧊 ICE candidate buffered (pas de PC) pour ${fromId}`);
            return;
          }

          // Si pas encore de remote description, mettre en buffer
          if (!pc.remoteDescription) {
            if (!pendingIceCandidates.current.has(fromId)) {
              pendingIceCandidates.current.set(fromId, []);
            }
            pendingIceCandidates.current.get(fromId)!.push(candidate);
            console.debug(`[WebRTC] 🧊 ICE candidate buffered (pas de remoteDesc) pour ${fromId}`);
            return;
          }

          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.debug(`[WebRTC] 🧊 ICE candidate ajouté de ${fromId} (${candidate.candidate?.slice(0, 30)}...)`);
        } catch (error) {
          console.debug(`[WebRTC] [ICE] Erreur ICE (normal): ${error}`);
        }
      });

      // Changement statut média
      socket.on('media-status-changed', (data: { socketId: string; micEnabled: boolean; videoEnabled: boolean }) => {
        console.log('[WebRTC] 🔄 Statut média changé:', data);

        setParticipants(prev => {
          const newMap = new Map(prev);
          const participant = newMap.get(data.socketId);

          if (participant) {
            newMap.set(data.socketId, {
              ...participant,
              micEnabled: data.micEnabled,
              videoEnabled: data.videoEnabled
            });
          }

          return newMap;
        });
      });

      socket.on('participant-media-update', (data: { socketId: string; micEnabled: boolean; videoEnabled: boolean }) => {
        console.log('[WebRTC]  Statut média (alias):', data);

        setParticipants(prev => {
          const newMap = new Map(prev);
          const participant = newMap.get(data.socketId);

          if (participant) {
            newMap.set(data.socketId, {
              ...participant,
              micEnabled: data.micEnabled,
              videoEnabled: data.videoEnabled
            });
          }

          return newMap;
        });
      });

      // Mise à jour temps réel d'un prérequis
      socket.on('prerequisite-updated', (data) => {
        console.log('[WebRTC] 📋 Prérequis mis à jour:', data);
        setLastPrerequisiteUpdate({ ...data, _ts: Date.now() } as any);
      });
    }
  }, [createPeerConnection, closePeerConnection, setInMeeting]);

  // Cleanup réseau uniquement (PeerConnections + socket + state)
  // NE détruit PAS le MediaStream local — le stream survit pour la floating video / navigation
  const cleanupNetwork = useCallback(() => {
    console.log(`[WebRTC] 🔌 Cleanup réseau...`);

    // Fermer TOUTES les peer connections
    console.log(`[WebRTC] 🔌 Fermeture de ${peerConnectionsRef.current.size} PeerConnection(s)...`);
    peerConnectionsRef.current.forEach((pc, socketId) => {
      try {
        pc.getSenders().forEach(sender => {
          try {
            pc.removeTrack(sender);
          } catch (e) {}
        });
        pc.close();
        console.log(`[WebRTC] ✅ PC fermée: ${socketId}`);
      } catch (error) {
        console.error(`[WebRTC] Erreur fermeture PC:`, error);
      }
    });
    peerConnectionsRef.current.clear();

    // Déconnecter socket
    if (socketRef.current) {
      console.log(`[WebRTC] 🔌 Déconnexion socket ${socketRef.current.id}`);
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Nettoyer l'état
    setParticipants(new Map());
    setCurrentRoomId(null);
    setIsConnected(false);
    setConnectionStatus('Déconnecté');
    setMySocketId(null);
    setInMeeting(false);

    console.log(`[WebRTC] ✅ Cleanup réseau terminé (stream préservé)`);
  }, [setInMeeting]);

  // leaveRoom = cleanup réseau seulement (appelé par useEffect cleanup)
  const leaveRoom = useCallback(() => {
    console.log(`[WebRTC] 🚪 Quitter room (réseau): ${currentRoomId}`);
    cleanupNetwork();
  }, [currentRoomId, cleanupNetwork]);

  // fullLeaveRoom = cleanup réseau + destruction du stream (appelé par bouton "Quitter")
  const fullLeaveRoom = useCallback(() => {
    console.log(`[WebRTC] 🚪 Quitter room COMPLÈTEMENT: ${currentRoomId}`);
    cleanupNetwork();
    stopAllMedia();
    console.log(`[WebRTC] ✅ Room quittée complètement - stream détruit`);
  }, [currentRoomId, cleanupNetwork, stopAllMedia]);

  useEffect(() => {
    if (!mySocketId) return;

    setParticipants(prev => {
      const next = new Map(prev);
      const existing = next.get(mySocketId);
      next.set(mySocketId, {
        ...(existing || { socketId: mySocketId, micEnabled: isMicEnabled, videoEnabled: isVideoEnabled }),
        stream: localStream || undefined,
        micEnabled: isMicEnabled,
        videoEnabled: isVideoEnabled,
      });
      return next;
    });

    if (!localStream) {
      console.log('[WebRTC] ⚠️ Pas de localStream pour synchroniser les PeerConnections');
      return;
    }

    const audioTrack = localStream.getAudioTracks()[0];
    const videoTrack = localStream.getVideoTracks()[0];
    const pcCount = peerConnectionsRef.current.size;

    if (pcCount > 0) {
      console.log(`[WebRTC] 🔄 Synchronisation tracks vers ${pcCount} PeerConnection(s)`,
        `audio=${audioTrack?.enabled ?? 'none'}, video=${videoTrack?.enabled ?? 'none'}`);
    }

    peerConnectionsRef.current.forEach((pc, peerId) => {
      // ⚠️ Ne pas modifier les PC fermées
      if (pc.connectionState === 'closed') return;

      const senders = pc.getSenders();

      // Sync audio
      const audioSender = senders.find(sender => sender.track?.kind === 'audio');
      if (audioTrack) {
        if (audioSender) {
          audioSender.replaceTrack(audioTrack).catch(e =>
            console.debug(`[WebRTC] replaceTrack audio failed for ${peerId}:`, e));
        } else {
          try {
            pc.addTrack(audioTrack, localStream);
            console.log(`[WebRTC] ➕ Audio track ajouté à PC ${peerId}`);
          } catch (e) {
            console.debug(`[WebRTC] addTrack audio failed for ${peerId}:`, e);
          }
        }
      } else if (audioSender) {
        try {
          pc.removeTrack(audioSender);
        } catch (e) {}
      }

      // Sync video
      const videoSender = senders.find(sender => sender.track?.kind === 'video');
      if (videoTrack) {
        if (videoSender) {
          videoSender.replaceTrack(videoTrack).catch(e =>
            console.debug(`[WebRTC] replaceTrack video failed for ${peerId}:`, e));
        } else {
          try {
            pc.addTrack(videoTrack, localStream);
            console.log(`[WebRTC] ➕ Video track ajouté à PC ${peerId}`);
          } catch (e) {
            console.debug(`[WebRTC] addTrack video failed for ${peerId}:`, e);
          }
        }
      } else if (videoSender) {
        try {
          pc.removeTrack(videoSender);
        } catch (e) {}
      }
    });
  }, [mySocketId, localStream, isMicEnabled, isVideoEnabled]);

  useEffect(() => {
    const allStreams = new Map<string, MediaStream>();

    participants.forEach((participant, id) => {
      if (participant.stream && participant.stream.getAudioTracks().length > 0) {
        allStreams.set(id, participant.stream);
      }
    });

    if (allStreams.size === 0) {
      setActiveSpeakerId(null);
      setAudioLevels(new Map());
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;

    const currentIds = new Set(allStreams.keys());
    analyserNodesRef.current.forEach((_node, id) => {
      if (!currentIds.has(id)) {
        analyserNodesRef.current.delete(id);
        const sourceNode = sourceNodesRef.current.get(id);
        if (sourceNode) {
          try {
            sourceNode.disconnect();
          } catch (e) {}
          sourceNodesRef.current.delete(id);
        }
      }
    });

    allStreams.forEach((stream, id) => {
      if (!analyserNodesRef.current.has(id)) {
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.8;

        const sourceNode = audioContext.createMediaStreamSource(stream);
        sourceNode.connect(analyser);

        analyserNodesRef.current.set(id, analyser);
        sourceNodesRef.current.set(id, sourceNode);
      }
    });

    const dataArray = new Uint8Array(256);

    const updateLevels = () => {
      const levels = new Map<string, number>();
      let maxId: string | null = null;
      let maxLevel = 0.02;

      analyserNodesRef.current.forEach((analyser, id) => {
        analyser.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i += 1) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        levels.set(id, rms);

        if (rms > maxLevel) {
          maxLevel = rms;
          maxId = id;
        }
      });

      setAudioLevels(levels);
      setActiveSpeakerId(maxId);
      animationFrameRef.current = requestAnimationFrame(updateLevels);
    };

    updateLevels();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [participants]);

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      leaveRoom();
    };
  }, []);

  // ✅ Fonction utilitaire pour monitorer les connexions WebRTC en temps réel
  // Peut être appelée pour obtenir un snapshot des statistiques de toutes les connexions
  const getConnectionStats = useCallback(async () => {
    const stats: any = {};

    for (const [peerId, pc] of peerConnectionsRef.current) {
      try {
        let connectionType = 'unknown';
        let isTurnUsed = false;
        let hostUsed = false;
        let srflxUsed = false;
        let rtt = 0;
        let bitrate = 0;

        const pcStats = await pc.getStats();
        
        pcStats.forEach(report => {
          // Analyser les paires de candidats actifs (succeeded)
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            rtt = report.currentRoundTripTime * 1000; // Convert to ms
            bitrate = report.availableOutgoingBitrate / 1024 / 1024; // Convert to Mbps
          }

          // Analyser les candidats pour identifier le type
          if (report.type === 'candidate') {
            const candidateType = report.candidateType;
            if (candidateType === 'relay') {
              isTurnUsed = true;
              connectionType = '🌐 relay (TURN)';
            } else if (candidateType === 'srflx') {
              srflxUsed = true;
              if (connectionType === 'unknown') {
                connectionType = '🔓 srflx (STUN)';
              }
            } else if (candidateType === 'host') {
              hostUsed = true;
              if (connectionType === 'unknown') {
                connectionType = '🔗 host (P2P)';
              }
            }
          }
        });

        stats[peerId] = {
          connectionState: pc.connectionState,
          iceConnectionState: pc.iceConnectionState,
          iceGatheringState: pc.iceGatheringState,
          connectionType,
          isTurnUsed,
          hostUsed,
          srflxUsed,
          rtt: Math.round(rtt),
          bitrate: Math.round(bitrate * 100) / 100,
        };

      } catch (error) {
        console.error(`[WebRTC] Erreur getConnectionStats pour ${peerId}:`, error);
        stats[peerId] = {
          connectionState: 'error',
          iceConnectionState: 'error',
          iceGatheringState: 'error',
          connectionType: 'error',
          isTurnUsed: false,
          hostUsed: false,
          srflxUsed: false,
          rtt: 0,
          bitrate: 0,
        };
      }
    }

    return stats;
  }, []);

  // ✅ Fonction pour démarrer un monitoring continu des connexions (optionnel)
  const startMonitoring = useCallback((intervalMs: number = 5000) => {
    const intervalId = setInterval(async () => {
      const stats = await getConnectionStats();
      
      if (Object.keys(stats).length > 0) {
        console.log('[WebRTC] 📊 ========== STATS CONNEXIONS WEBRTC ==========');
        Object.entries(stats).forEach(([peerId, s]: [string, any]) => {
          console.log(`[WebRTC] 📱 Peer [${peerId.substring(0, 6)}...]`, {
            state: s.connectionState,
            type: s.connectionType,
            turnUsed: s.isTurnUsed ? '✅ YES' : '❌ NO',
            hostUsed: s.hostUsed ? '✅' : '❌',
            srflxUsed: s.srflxUsed ? '✅' : '❌',
            rtt: s.rtt + 'ms',
            bitrate: s.bitrate + ' Mbps',
          });
        });
        console.log('[WebRTC] ========================================');
      }
    }, intervalMs);

    // Retourne une fonction pour arrêter le monitoring
    return () => clearInterval(intervalId);
  }, [getConnectionStats]);

  const value: WebRTCContextType = {
    isConnected,
    mySocketId,
    connectionStatus,
    localStream,
    isMicEnabled,
    isVideoEnabled,
    toggleMic,
    toggleVideo,
    participants,
    activeSpeakerId,
    audioLevels,
    joinRoom,
    leaveRoom,
    fullLeaveRoom,
    currentRoomId,
    lastPrerequisiteUpdate,
    getConnectionStats,
    startMonitoring,
  };

  return (
    <WebRTCContext.Provider value={value}>
      {children}
    </WebRTCContext.Provider>
  );
}

export function useWebRTC() {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTC must be used within WebRTCProvider');
  }
  return context;
}
