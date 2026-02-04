// Configuration centralisée de l'API
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Détection automatique de HTTPS/WSS
const USE_HTTPS = import.meta.env.VITE_USE_HTTPS === 'true';
const protocol = USE_HTTPS ? 'https' : 'http';
const wsProtocol = USE_HTTPS ? 'wss' : 'ws';

// Configuration du serveur backend
export const API_CONFIG = {
  // URL de base du serveur API (NestJS sur port 3002)
  BASE_URL: import.meta.env.VITE_API_URL || `${protocol}://localhost:3002`,

  // URL WebSocket (pour Socket.IO - même serveur NestJS)
  WEBSOCKET_URL: import.meta.env.VITE_WS_URL || `${protocol}://localhost:3002`,

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

  // Configuration WebRTC
  ICE_SERVERS: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      // Ajoutez vos serveurs TURN si nécessaire
      // {
      //   urls: 'turn:your-turn-server.com:3478',
      //   username: 'username',
      //   credential: 'password'
      // }
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
