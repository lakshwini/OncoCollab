import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrerequisitesController } from './prerequisites.controller';
import { PrerequisitesService } from './prerequisites.service';
import { JwtConfigModule } from '../auth/jwt-config.module';

/**
 * Module de gestion des prérequis de réunions RCP
 * Combine PostgreSQL (permissions) et MongoDB (état des prérequis)
 */
@Module({
  imports: [
    ConfigModule,
    JwtConfigModule, // Pour l'authentification
  ],
  controllers: [PrerequisitesController],
  providers: [PrerequisitesService],
  exports: [PrerequisitesService],
})
export class PrerequisitesModule {}
