import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { MeetingReport } from './entities/meeting-report.entity';
import { MeetingTranscript } from './entities/meeting-transcript.entity';
import { DoctorPersonalFile } from '../personal-files/entities/personal-file.entity';

import { ReportsService } from './reports.service';
import { ReportsController, ReportsFileController } from './reports.controller';
import { ReportsStorageService } from './reports-storage.service';
import { PipelineClient } from './pipeline.client';

import { AuthModule } from '../auth/auth.module';
import { VideoModule } from '../video/video.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MeetingReport,
      MeetingTranscript,
      DoctorPersonalFile,
    ]),
    ConfigModule,
    MulterModule.register({ storage: memoryStorage() }),
    AuthModule,
    forwardRef(() => VideoModule),
  ],
  controllers: [ReportsController, ReportsFileController],
  providers: [ReportsService, ReportsStorageService, PipelineClient],
  exports: [ReportsService],
})
export class ReportsModule {}
