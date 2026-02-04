import { API_CONFIG, createApiUrl, createAuthHeaders } from '../config/api.config';

// Types pour l'authentification - correspond exactement au backend NestJS
export interface LoginCredentials {
  email: string;
  password: string;
}

// Réponse du backend: { doctor, token }
export interface AuthResponse {
  token: string;
  doctor: {
    doctorID: string;
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
    is_active: boolean;
    created_at: string;
    role: {
      roleID: number;
      roleName: string;
    };
  };
}

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
}

// Clés pour le localStorage
const STORAGE_KEYS = {
  TOKEN: 'onco_collab_token',
  USER: 'onco_collab_user',
  LAST_ACTIVITY: 'onco_collab_last_activity',
};

class AuthService {
  /**
   * Connexion d'un utilisateur avec email et mot de passe
   * Interroge la table "doctors" via le backend NestJS
   */
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const url = createApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN);
    console.log('🔐 Tentative de connexion à:', url);
    console.log('📧 Email:', credentials.email);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('📡 Réponse status:', response.status);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erreur serveur' }));
        console.error('❌ Erreur login:', error);
        throw new Error(error.message || 'Identifiants incorrects');
      }

      const data: AuthResponse = await response.json();

      // Transformer les données du backend (table doctors) en format frontend
      const user: User = {
        id: data.doctor.doctorID,
        nom: data.doctor.lastName,
        prenom: data.doctor.firstName,
        email: data.doctor.email,
        role: data.doctor.role?.roleName || 'Médecin',
      };

      const token = data.token;

      // Sauvegarder dans le localStorage
      this.saveSession(user, token);

      return { user, token };
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  }

  /**
   * Sauvegarde la session dans le localStorage
   */
  saveSession(user: User, token: string): void {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
  }

  /**
   * Récupère la session depuis le localStorage
   */
  getSession(): { user: User; token: string } | null {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);

      if (!token || !userStr) {
        return null;
      }

      const user = JSON.parse(userStr) as User;
      return { user, token };
    } catch (error) {
      console.error('Erreur lors de la récupération de la session:', error);
      return null;
    }
  }

  /**
   * Met à jour le timestamp de dernière activité
   */
  updateLastActivity(): void {
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
  }

  /**
   * Récupère le timestamp de dernière activité
   */
  getLastActivity(): number {
    const lastActivity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
    return lastActivity ? parseInt(lastActivity, 10) : Date.now();
  }

  /**
   * Déconnexion de l'utilisateur
   */
  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
  }

  /**
   * Récupère le token JWT
   */
  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  /**
   * Récupère l'utilisateur courant
   */
  getCurrentUser(): User | null {
    const session = this.getSession();
    return session?.user || null;
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  /**
   * Vérifie si la session est encore valide (30 min d'inactivité max)
   */
  isSessionValid(): boolean {
    const lastActivity = this.getLastActivity();
    const now = Date.now();
    const inactivityTime = now - lastActivity;

    // Session expirée après 30 minutes d'inactivité
    const SESSION_TIMEOUT = 30 * 60 * 1000;

    return inactivityTime < SESSION_TIMEOUT;
  }
}

// Export une instance unique du service
export const authService = new AuthService();
