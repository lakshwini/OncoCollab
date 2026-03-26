import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Module global de configuration JWT
 * Configure JwtModule UNE SEULE FOIS avec le secret depuis .env
 * Tous les autres modules doivent importer ce module au lieu de configurer JWT séparément
 */
@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');

        if (!secret) {
          throw new Error('❌ JWT_SECRET non défini dans .env ! La sécurité de l\'application est compromise.');
        }

        console.log('🔐 JWT configuré avec secret depuis .env');

        return {
          secret,
          signOptions: {
            expiresIn: '24h', // Token valide 24h
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [JwtModule],
})
export class JwtConfigModule {}
