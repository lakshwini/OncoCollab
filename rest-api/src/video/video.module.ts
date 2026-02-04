import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { VideoGateway } from './video.gateway';
import { VideoService } from './video.service';
import { MessagesModule } from '../messages/messages.module';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [
    MessagesModule,
    RoomsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'votre-secret-jwt-tres-securise',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [VideoGateway, VideoService],
  exports: [VideoService],
})
export class VideoModule {}
