import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Service de gestion de la configuration TURN (Traversal Using Relays around NAT)
 * Gère les serveurs TURN pour le relais WebRTC en cas d'impossibilité de connexion P2P directe
 */
@Injectable()
export class TurnService {
  private readonly logger = new Logger(TurnService.name);

  private readonly turnUrl: string = '';
  private readonly turnUsername: string = '';
  private readonly turnPassword: string = '';

  constructor(private configService: ConfigService) {
    this.turnUrl = this.configService.get<string>('TURN_URL') || '';
    this.turnUsername = this.configService.get<string>('TURN_USERNAME') || '';
    this.turnPassword = this.configService.get<string>('TURN_PASSWORD') || '';

    if (!this.turnUrl) {
      this.logger.warn(
        '⚠️ Aucun serveur TURN configuré. Les connexions P2P par NAT/Firewall échoueront.'
      );
    } else {
      this.logger.log(`✅ Serveur TURN configuré: ${this.turnUrl}`);
    }
  }

  /**
   * Récupère la configuration ICE complète
   * Incluant les serveurs STUN (Google) et TURN (si configuré)
   */
  getIceServersConfig(): RTCConfiguration {
    const iceServers: RTCIceServer[] = [
      // Serveurs STUN publics (Google) - toujours disponibles
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ];

    // Ajouter le serveur TURN si configuré
    if (this.turnUrl && this.turnUsername && this.turnPassword) {
      iceServers.push({
        urls: this.turnUrl,
        username: this.turnUsername,
        credential: this.turnPassword,
      });
    }

    return { iceServers };
  }

  /**
   * Récupère seulement les données TURN pour le frontend
   */
  getTurnServerConfig() {
    return {
      enabled: !!this.turnUrl,
      turnUrl: this.turnUrl,
      turnUsername: this.turnUsername,
      // Ne pas renvoyer le mot de passe directement - il doit être géré côté backend
      // Le frontend recevra la config et l'utilisera via le backend
    };
  }

  /**
   * Crée un ICE server pour WebRTC avec fallback STUN
   */
  createIceConfiguration(): RTCConfiguration {
    return this.getIceServersConfig();
  }

  /**
   * Vérifie si le serveur TURN est disponible
   */
  isTurnConfigured(): boolean {
    return !!this.turnUrl && !!this.turnUsername && !!this.turnPassword;
  }
}
