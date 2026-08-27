import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TranscriptionLiveService } from './transcription-live.service';
import { TranscriptionLiveController } from './transcription-live.controller';
import { TranscriptionBlock } from '../reports/entities/transcription-block.entity';
import { MeetingTranscript } from '../reports/entities/meeting-transcript.entity';
import { VideoModule } from '../video/video.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TranscriptionBlock, MeetingTranscript]),
    forwardRef(() => VideoModule),
  ],
  providers: [TranscriptionLiveService],
  controllers: [TranscriptionLiveController],
  exports: [TranscriptionLiveService],
})
export class TranscriptionLiveModule {}
