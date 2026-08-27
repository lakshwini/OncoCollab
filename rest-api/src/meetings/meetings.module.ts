import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingsService } from './meetings.service';
import { MeetingsController } from './meetings.controller';
import { Meeting } from './entities/meeting.entity';
import { PrerequisitesModule } from '../prerequisites/prerequisites.module';
import { OncovisionModule } from '../oncovision/oncovision.module';

@Module({
  imports: [TypeOrmModule.forFeature([Meeting]), PrerequisitesModule, OncovisionModule],
  controllers: [MeetingsController],
  providers: [MeetingsService],
  exports: [MeetingsService],
})
export class MeetingsModule {}
