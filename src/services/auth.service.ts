import { API_CONFIG, createApiUrl, createAuthHeaders } from '../config/api.config';
import { supabase } from '../lib/supabase';

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
  AUTH_SOURCE: 'onco_collab_auth_source', // 'custom' | 'supabase'
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
      this.saveSession(user, token, 'custom');

      return { user, token };
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  }

  /**
   * Sauvegarde la session dans le localStorage
   */
  saveSession(user: User, token: string, source: 'custom' | 'supabase' = 'custom'): void {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
    localStorage.setItem(STORAGE_KEYS.AUTH_SOURCE, source);
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
   * Retourne la source d'authentification
   */
  getAuthSource(): 'custom' | 'supabase' | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_SOURCE) as any;
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
    localStorage.removeItem(STORAGE_KEYS.AUTH_SOURCE);
  }

  /**
   * Récupère le token JWT (auto-refresh si Supabase)
   *
   * Pour les sessions Supabase, récupère toujours le token le plus récent
   * car Supabase gère le refresh token automatiquement.
   */
  async getTokenAsync(): Promise<string | null> {
    const source = this.getAuthSource();

    if (source === 'supabase') {
      if (!supabase) return localStorage.getItem(STORAGE_KEYS.TOKEN);
      // Pour Supabase: toujours récupérer la session fraîche
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        // Mettre à jour le token dans localStorage
        localStorage.setItem(STORAGE_KEYS.TOKEN, data.session.access_token);
        return data.session.access_token;
      }
      return null;
    }

    // Pour custom: retourner le token stocké
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  /**
   * Récupère le token JWT (synchrone, pour compatibilité)
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

  // ========================================
  // MÉTHODES SUPABASE AUTH
  // ========================================

  /**
   * Connexion avec Supabase Auth (email/password)
   *
   * Flow:
   * 1. Supabase authentifie l'utilisateur -> access_token
   * 2. On utilise ce token pour appeler GET /doctors (backend verifie le JWT Supabase)
   * 3. On trouve le doctor correspondant par email
   * 4. On sauvegarde la session locale
   */
  async loginWithSupabase(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    if (!supabase) throw new Error('Supabase non configuré');
    try {
      console.log('🔐 Login Supabase pour:', credentials.email);

      // 1. Authentification Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw new Error(error.message);
      }

      if (!data.session || !data.user) {
        throw new Error('Session ou utilisateur non retourné par Supabase');
      }

      console.log('✅ Authentification Supabase réussie:', data.user.email);

      // 2. Récupérer les infos doctor depuis PostgreSQL via backend
      const url = createApiUrl('/doctors');
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Impossible de récupérer les données du médecin');
      }

      const doctors = await response.json();
      const doctor = doctors.find((d: any) => d.email === credentials.email);

      if (!doctor) {
        throw new Error('Médecin non trouvé dans la base PostgreSQL');
      }

      // 3. Transformer en format User
      const user: User = {
        id: doctor.doctorId,
        nom: doctor.lastName,
        prenom: doctor.firstName,
        email: doctor.email,
        role: doctor.speciality || 'Médecin',
      };

      const token = data.session.access_token;

      // 4. Sauvegarder session avec source 'supabase'
      this.saveSession(user, token, 'supabase');

      return { user, token };
    } catch (error: any) {
      console.error('Erreur login Supabase:', error);
      throw error;
    }
  }

  /**
   * Inscription avec Supabase Auth
   */
  async signUpWithSupabase(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    if (!supabase) throw new Error('Supabase non configuré');
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.session || !data.user) {
        throw new Error('Veuillez confirmer votre email avant de vous connecter');
      }

      // Même logique que loginWithSupabase pour récupérer le doctor
      return this.loginWithSupabase(credentials);
    } catch (error: any) {
      console.error('Erreur signup Supabase:', error);
      throw error;
    }
  }

  /**
   * Envoyer un OTP Supabase par email
   */
  async sendOTPWithSupabase(email: string): Promise<void> {
    if (!supabase) throw new Error('Supabase non configuré');
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ OTP envoyé à:', email);
    } catch (error: any) {
      console.error('Erreur envoi OTP:', error);
      throw error;
    }
  }

  /**
   * Vérifier un OTP Supabase
   */
  async verifyOTPWithSupabase(email: string, token: string): Promise<{ user: User; token: string }> {
    if (!supabase) throw new Error('Supabase non configuré');
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.session || !data.user) {
        throw new Error('Session invalide après vérification OTP');
      }

      // Récupérer le doctor depuis PostgreSQL via le token Supabase
      const accessToken = data.session.access_token;
      const url = createApiUrl('/doctors');
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error('Impossible de récupérer les données du médecin après OTP');
      }

      const doctors = await response.json();
      const doctor = doctors.find((d: any) => d.email === email);

      if (!doctor) {
        throw new Error('Médecin non trouvé dans PostgreSQL');
      }

      const user: User = {
        id: doctor.doctorId,
        nom: doctor.lastName,
        prenom: doctor.firstName,
        email: doctor.email,
        role: doctor.speciality || 'Médecin',
      };

      this.saveSession(user, accessToken, 'supabase');

      return { user, token: accessToken };
    } catch (error: any) {
      console.error('Erreur vérification OTP:', error);
      throw error;
    }
  }

  /**
   * Récupérer la session Supabase active
   */
  async getSupabaseSession() {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  /**
   * Restaure la session après refresh de page
   *
   * Si source = 'supabase': vérifie que Supabase a toujours une session active.
   * Si oui, met à jour le token (Supabase peut l'avoir refresh automatiquement).
   * Si non, nettoie la session.
   *
   * Si source = 'custom': vérifie juste le timeout de 30 min.
   */
  async restoreSession(): Promise<{ user: User; token: string } | null> {
    const source = this.getAuthSource();
    const existingSession = this.getSession();

    if (!existingSession) return null;

    if (source === 'supabase') {
      if (!supabase) {
        this.logout();
        return null;
      }
      // Vérifier que Supabase a toujours une session active
      const { data } = await supabase.auth.getSession();

      if (data.session?.access_token) {
        // Mettre à jour le token (Supabase a peut-être fait un refresh)
        const updatedToken = data.session.access_token;
        localStorage.setItem(STORAGE_KEYS.TOKEN, updatedToken);
        return { user: existingSession.user, token: updatedToken };
      } else {
        // Session Supabase expirée
        this.logout();
        return null;
      }
    }

    // Pour custom: vérifier le timeout
    if (!this.isSessionValid()) {
      this.logout();
      return null;
    }

    return existingSession;
  }

  /**
   * Déconnexion Supabase
   */
  async logoutSupabase(): Promise<void> {
    if (supabase) await supabase.auth.signOut();
    this.logout(); // Nettoyer localStorage
  }
}

// Export une instance unique du service
export const authService = new AuthService();
