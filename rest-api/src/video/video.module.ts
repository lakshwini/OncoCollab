import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VideoGateway } from './video.gateway';
import { VideoService } from './video.service';
import { VideoController } from './video.controller';
import { TurnService } from './turn.service';
import { MessagesModule } from '../messages/messages.module';
import { RoomsModule } from '../rooms/rooms.module';
import { JwtConfigModule } from '../auth/jwt-config.module';

/**
 * Module de gestion de la vidéoconférence
 * Gère les connexions WebSocket, la signalisation WebRTC, le chat, et la config TURN
 */
@Module({
  imports: [
    ConfigModule, // ✅ Pour accéder aux variables d'environnement
    MessagesModule,
    RoomsModule,
    JwtConfigModule, // ✅ Utilise le module global JWT (même secret que AuthModule)
  ],
  controllers: [VideoController],
  providers: [VideoGateway, VideoService, TurnService],
  exports: [VideoService, VideoGateway, TurnService],
})
export class VideoModule {}
