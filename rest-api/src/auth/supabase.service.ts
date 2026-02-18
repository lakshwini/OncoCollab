import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Service Supabase pour l'authentification et le storage
 * Utilisé en parallèle avec l'auth custom existante
 */
@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || 'https://dmkemeabdlbfozybpvmq.supabase.co';
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY') || 'sb_publishable_k9FBqfmjIc9gtI88pMhQQw_2slEUJbD';

    this.supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialisé');
  }

  /**
   * Retourne le client Supabase
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Vérifie la validité d'un token JWT Supabase
   */
  async verifySupabaseToken(token: string): Promise<any> {
    try {
      const { data, error } = await this.supabase.auth.getUser(token);

      if (error) {
        console.error('[Supabase] Erreur vérification token:', error);
        return null;
      }

      return data.user;
    } catch (error) {
      console.error('[Supabase] Exception vérification token:', error);
      return null;
    }
  }

  /**
   * Créer un utilisateur Supabase
   */
  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(`Erreur signup Supabase: ${error.message}`);
    }

    return data;
  }

  /**
   * Connexion utilisateur Supabase
   */
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(`Erreur login Supabase: ${error.message}`);
    }

    return data;
  }

  /**
   * Envoyer un OTP par email
   */
  async sendOTP(email: string) {
    const { data, error } = await this.supabase.auth.signInWithOtp({
      email,
    });

    if (error) {
      throw new Error(`Erreur envoi OTP: ${error.message}`);
    }

    return data;
  }

  /**
   * Vérifier un OTP
   */
  async verifyOTP(email: string, token: string) {
    const { data, error } = await this.supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      throw new Error(`Erreur vérification OTP: ${error.message}`);
    }

    return data;
  }

  /**
   * Déconnexion
   */
  async signOut() {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw new Error(`Erreur déconnexion: ${error.message}`);
    }
  }
}
