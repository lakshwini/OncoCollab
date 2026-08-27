import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Pont d'authentification serveur-à-serveur vers PathoCollab (auth-service, port 18001).
 *
 * PathoCollab a son propre système d'utilisateurs, indépendant de celui d'OncoCollab.
 * L'auth-service PathoCollab refuse les requêtes CORS depuis le navigateur pour les
 * origines de dev (localhost:5173 / localhost) — la connexion doit donc se faire côté
 * serveur (pas de CORS entre deux backends), puis le token est transmis au frontend via
 * GET /pathocollab/token.
 *
 * Compte de service dédié (pas de lien par utilisateur OncoCollab pour l'instant) :
 * oncocollab-service@hospital.fr, créé via POST /api/auth/register sur PathoCollab.
 */
@Injectable()
export class PathocollabService {
  private readonly logger = new Logger(PathocollabService.name);
  private readonly authBaseUrl: string;
  private readonly serviceEmail: string;
  private readonly servicePassword: string;

  private cachedToken: string | null = null;
  private cachedTokenExp = 0; // epoch ms

  constructor(private readonly configService: ConfigService) {
    this.authBaseUrl = (
      this.configService.get<string>('PATHOCOLLAB_AUTH_URL') || 'http://host.docker.internal:18001'
    ).replace(/\/$/, '');
    this.serviceEmail =
      this.configService.get<string>('PATHOCOLLAB_SERVICE_EMAIL') || 'oncocollab-service@hospital.fr';
    this.servicePassword = this.configService.get<string>('PATHOCOLLAB_SERVICE_PASSWORD') || '';

    if (!this.servicePassword) {
      this.logger.warn(
        'PATHOCOLLAB_SERVICE_PASSWORD non défini — le pont d\'authentification PathoCollab restera inactif.',
      );
    }
  }

  /**
   * Retourne un token PathoCollab valide, en se reconnectant si absent/expiré.
   * Retourne null si PathoCollab est injoignable (mode dégradé).
   */
  async getToken(): Promise<string | null> {
    if (!this.servicePassword) return null;

    const now = Date.now();
    if (this.cachedToken && this.cachedTokenExp > now + 30_000) {
      return this.cachedToken;
    }

    try {
      const { data } = await axios.post(`${this.authBaseUrl}/api/auth/login`, {
        email: this.serviceEmail,
        password: this.servicePassword,
      });

      const token: string | undefined = data?.access_token;
      if (!token) return null;

      this.cachedToken = token;
      this.cachedTokenExp = this.decodeExpiry(token) ?? now + 5 * 60_000;
      return token;
    } catch (err) {
      this.logger.warn(`Impossible de se connecter au compte de service PathoCollab: ${err}`);
      return null;
    }
  }

  private decodeExpiry(token: string): number | null {
    try {
      const payloadRaw = token.split('.')[1];
      const payload = JSON.parse(Buffer.from(payloadRaw, 'base64url').toString('utf8'));
      return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }
}
