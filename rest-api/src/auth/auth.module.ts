import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DoctorsModule } from '../doctors/doctors.module';
import { JwtConfigModule } from './jwt-config.module';
import { JwtStrategy } from './jwt.strategy';
import { SupabaseService } from './supabase.service';
import { HybridJwtStrategy } from './hybrid-jwt.strategy';

@Module({
    imports: [
        forwardRef(() => DoctorsModule), // ✅ Correction dépendance circulaire
        JwtConfigModule, // ✅ Utilise le module global JWT
        PassportModule,
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        JwtStrategy, // ✅ Stratégie JWT custom (existante)
        SupabaseService, // ✅ NOUVEAU: Service Supabase
        HybridJwtStrategy, // ✅ NOUVEAU: Stratégie hybride (custom + Supabase)
    ],
    exports: [AuthService, SupabaseService],
})
export class AuthModule { }
