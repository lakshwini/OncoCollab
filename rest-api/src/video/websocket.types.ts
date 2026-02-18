// Événements que le Serveur envoie aux Clients

export interface ParticipantPayload {
  socketId: string;
  doctorId: string;
  firstName: string;
  lastName: string;
  role: 'organizer' | 'co_admin' | 'participant';
  speciality?: string;
  avatarUrl?: string | null;
  micEnabled: boolean;
  videoEnabled: boolean;
}

export interface ServerToClientEvents {
  // Envoie l'ID de l'utilisateur qui vient de se connecter
  "user-joined": (participant: ParticipantPayload) => void;

  // Envoie la liste de tous les utilisateurs déjà connectés dans la room
  "get-existing-users": (users: ParticipantPayload[]) => void;

  // Notifie qu'un utilisateur s'est déconnecté
  "user-left": (socketId: string) => void;

  // Relai de l'Offer SDP
  "receiving-offer": (offer: RTCSessionDescriptionInit, fromId: string) => void;

  // Relai de l'Answer SDP à l'utilisateur qui a envoyé l'offer
  "receiving-answer": (answer: RTCSessionDescriptionInit, fromId: string) => void;

  // Relai des ICE Candidates
  "receiving-ice-candidate": (candidate: RTCIceCandidateInit, fromId: string) => void;

  // Réception d'un message du chat
  "receive-chat-message": (message: {
    id: string;
    content: string;
    senderId: string;
    messageType: string;
    createdAt: Date;
  }) => void;

  // Historique des messages
  "message-history": (messages: any[]) => void;

  // Changement de statut média d'un participant
  "media-status-changed": (data: { socketId: string; doctorId?: string; micEnabled: boolean; videoEnabled: boolean; timestamp?: Date }) => void;

  // Mise à jour temps réel des statuts micro/caméra
  "participant-media-update": (data: { socketId: string; doctorId?: string; micEnabled: boolean; videoEnabled: boolean; timestamp?: Date }) => void;

  // Infos détaillées du participant local
  "self-info": (participant: ParticipantPayload) => void;

  // Événement d'erreur
  "error": (error: { message: string }) => void;

  // Notification de connexion dupliquée
  "connection-duplicate": (data: { message: string }) => void;

  // Mise à jour temps réel d'un prérequis (broadcast à tous les participants de la room)
  "prerequisite-updated": (data: {
    meeting_id: string;
    doctor_id: string;
    key: string;
    status: 'pending' | 'in_progress' | 'done';
  }) => void;
}

// Événements que le Client envoie au Serveur
// Note: NestJS @SubscribeMessage receives a single payload object
export interface ClientToServerEvents {
  // Le client rejoint une room spécifique
  "join-room": (payload: { roomId: string; micEnabled?: boolean; videoEnabled?: boolean } | string) => void;

  // Envoi de l'Offer SDP à un autre utilisateur spécifique
  "sending-offer": (payload: { offer: RTCSessionDescriptionInit; toId: string }) => void;

  // Envoi de l'Answer SDP à l'utilisateur qui a envoyé l'offer
  "sending-answer": (payload: { answer: RTCSessionDescriptionInit; toId: string }) => void;

  // Envoi des ICE Candidates à un autre utilisateur spécifique
  "sending-ice-candidate": (payload: { candidate: RTCIceCandidateInit; toId: string }) => void;

  // Envoi d'un message du chat
  // Note: senderId est maintenant extrait du JWT côté backend (plus sécurisé)
  "send-chat-message": (payload: { content: string; roomId: string; meetingId?: string }) => void;

  // Changement de statut média (micro/vidéo)
  "media-status-change": (payload: { roomId: string; micEnabled: boolean; videoEnabled: boolean }) => void;

  // Mise à jour temps réel des statuts micro/caméra (alias)
  "media-update": (payload: { roomId: string; micEnabled: boolean; videoEnabled: boolean }) => void;
}