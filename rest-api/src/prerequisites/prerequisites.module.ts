import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongoClient, Db } from 'mongodb';
import { PrerequisitesController } from './prerequisites.controller';
import { PrerequisitesService } from './prerequisites.service';
import { JwtConfigModule } from '../auth/jwt-config.module';
import { VideoModule } from '../video/video.module';

/**
 * Fournisseur MongoDB injecté proprement via factory NestJS
 * Garantit que la connexion est établie AVANT toute requête
 */
const MongoDbProvider = {
  provide: 'PREREQUISITES_MONGO_DB',
  useFactory: async (configService: ConfigService): Promise<Db> => {
    const uri = configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017';
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('oncocollab_prerequisites');
    console.log('[PrerequisitesModule] ✅ MongoDB connecté: oncocollab_prerequisites');
    return db;
  },
  inject: [ConfigService],
};

/**
 * Module de gestion des prérequis de réunions RCP
 * Combine PostgreSQL (permissions) et MongoDB (état des prérequis)
 */
@Module({
  imports: [
    ConfigModule,
    JwtConfigModule,
    forwardRef(() => VideoModule),
  ],
  controllers: [PrerequisitesController],
  providers: [MongoDbProvider, PrerequisitesService],
  exports: [PrerequisitesService],
})
export class PrerequisitesModule {}
