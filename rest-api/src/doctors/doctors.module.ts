import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { DoctorsStorageService } from './doctors-storage.service';
import { Doctor } from './doctors.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Doctor]),
    forwardRef(() => AuthModule), // ✅ Correction dépendance circulaire
  ],
  providers: [DoctorsService, DoctorsStorageService],
  controllers: [DoctorsController],
  exports: [DoctorsService, DoctorsStorageService],
})
export class DoctorsModule {}