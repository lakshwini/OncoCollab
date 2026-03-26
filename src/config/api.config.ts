// Configuration centralisée de l'API
const isDevelopment = (import.meta as any).env.DEV;
const isProduction = (import.meta as any).env.PROD;

// Détection automatique de HTTPS/WSS
const USE_HTTPS = (import.meta as any).env.VITE_USE_HTTPS === 'true';
const protocol = USE_HTTPS ? 'https' : 'http';
const wsProtocol = USE_HTTPS ? 'wss' : 'ws';

// Configuration du serveur backend
export const API_CONFIG = {
  // URL de base du serveur API (NestJS sur port 3002)
  BASE_URL: (import.meta as any).env.VITE_API_URL || `${protocol}://localhost:3002`,

  // URL WebSocket (pour Socket.IO - même serveur NestJS)
  WEBSOCKET_URL: (import.meta as any).env.VITE_WS_URL || `${protocol}://localhost:3002`,

  // Informations sur la configuration actuelle
  IS_HTTPS: USE_HTTPS,
  PROTOCOL: protocol,
  WS_PROTOCOL: wsProtocol,

  // Configuration Socket.IO
  SOCKET_CONFIG: {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling'],
    // Permettre les connexions non sécurisées en développement
    rejectUnauthorized: !isDevelopment,
  },

  // Configuration WebRTC - Serveurs STUN/TURN
  // 🌐 TURN est récupéré depuis les variables d'environnement (coturn Docker)
  // ⚠️ IMPORTANT: Les serveurs TURN réels seront AUSSI récupérés via WebSocket lors du join-room (redondance)
  ICE_SERVERS: {
    iceServers: [
      // Serveurs STUN publics (Google) - toujours disponibles en fallback
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      
      // Serveur TURN depuis Docker (coturn) - configuration principale
      ...(
        (import.meta as any).env.VITE_TURN_URL &&
        (import.meta as any).env.VITE_TURN_USERNAME &&
        (import.meta as any).env.VITE_TURN_PASSWORD
          ? [{
              urls: (import.meta as any).env.VITE_TURN_URL,
              username: (import.meta as any).env.VITE_TURN_USERNAME,
              credential: (import.meta as any).env.VITE_TURN_PASSWORD,
            }]
          : []
      ),
      
      // Serveur TURN de secours (optionnel)
      ...(
        (import.meta as any).env.VITE_TURN_URL_BACKUP &&
        (import.meta as any).env.VITE_TURN_USERNAME_BACKUP &&
        (import.meta as any).env.VITE_TURN_PASSWORD_BACKUP
          ? [{
              urls: (import.meta as any).env.VITE_TURN_URL_BACKUP,
              username: (import.meta as any).env.VITE_TURN_USERNAME_BACKUP,
              credential: (import.meta as any).env.VITE_TURN_PASSWORD_BACKUP,
            }]
          : []
      ),
    ],
  },

  // Endpoints de l'API
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      PROFILE: '/auth/profile',
    },
    VIDEO: {
      ICE_CONFIG: '/video/ice-config',
      TURN_CONFIG: '/video/turn-config',
      HEALTH: '/video/health',
    },
    USERS: '/users',
    MESSAGES: '/messages',
    ROOMS: '/rooms',
    DOCTORS: '/doctors',
    PATIENTS: '/patients',
  },
};

// Helper pour créer une URL complète
export const createApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper pour les headers avec authentification
export const createAuthHeaders = (token: string | null): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

export default API_CONFIG;
