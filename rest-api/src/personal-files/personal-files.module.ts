import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorPersonalFile } from './entities/personal-file.entity';
import { PersonalFilesService } from './personal-files.service';
import { PersonalFilesController } from './personal-files.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorPersonalFile]), AuthModule],
  controllers: [PersonalFilesController],
  providers: [PersonalFilesService],
  exports: [PersonalFilesService],
})
export class PersonalFilesModule {}
