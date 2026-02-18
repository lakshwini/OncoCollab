import { Module } from '@nestjs/common';
import { VideoGateway } from './video.gateway';
import { VideoService } from './video.service';
import { MessagesModule } from '../messages/messages.module';
import { RoomsModule } from '../rooms/rooms.module';
import { JwtConfigModule } from '../auth/jwt-config.module';

/**
 * Module de gestion de la vidéoconférence
 * Gère les connexions WebSocket, la signalisation WebRTC et le chat
 */
@Module({
  imports: [
    MessagesModule,
    RoomsModule,
    JwtConfigModule, // ✅ Utilise le module global JWT (même secret que AuthModule)
  ],
  providers: [VideoGateway, VideoService],
  exports: [VideoService, VideoGateway],
})
export class VideoModule {}
