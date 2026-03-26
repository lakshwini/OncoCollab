import { Controller, Get, Logger } from '@nestjs/common';
import { TurnService } from './turn.service';

/**
 * Contrôleur pour les endpoints vidéo
 * Fournit les configurations WebRTC, ICE servers, TURN au frontend
 */
@Controller('video')
export class VideoController {
  private readonly logger = new Logger(VideoController.name);

  constructor(private readonly turnService: TurnService) {}

  /**
   * Endpoint: GET /video/ice-config
   * Retourne la configuration ICE complète (STUN + TURN)
   */
  @Get('ice-config')
  getIceConfig() {
    this.logger.log('📡 Requête configuration ICE reçue');
    return this.turnService.getIceServersConfig();
  }

  /**
   * Endpoint: GET /video/turn-config
   * Retourne les informations TURN (disponibilité, URL)
   * Note: Le mot de passe n'est pas envoyé au client
   */
  @Get('turn-config')
  getTurnConfig() {
    this.logger.log('🌐 Requête configuration TURN reçue');
    return this.turnService.getTurnServerConfig();
  }

  /**
   * Endpoint: GET /video/health
   * Vérifie si le service vidéo est disponible et les serveurs TURN
   */
  @Get('health')
  getVideoHealth() {
    return {
      status: 'ok',
      video: {
        enabled: true,
        turn: {
          configured: this.turnService.isTurnConfigured(),
          message: this.turnService.isTurnConfigured()
            ? '✅ TURN server est configuré'
            : '⚠️ Pas de serveur TURN - P2P seulement sur réseau local',
        },
      },
    };
  }
}
