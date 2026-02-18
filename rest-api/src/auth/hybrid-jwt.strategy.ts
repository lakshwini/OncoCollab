import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from './supabase.service';
import { DataSource } from 'typeorm';

/**
 * Stratégie JWT HYBRIDE
 *
 * Accepte 2 types de tokens :
 * 1. JWT custom (généré par AuthService avec argon2)
 * 2. JWT Supabase (généré par Supabase Auth)
 *
 * ✅ NE CASSE PAS l'auth existante
 * ✅ Compatible avec les deux systèmes
 */
@Injectable()
export class HybridJwtStrategy extends PassportStrategy(Strategy, 'hybrid-jwt') {
  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService,
    private dataSource: DataSource,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true, // Pour accéder au token brut
    });
  }

  async validate(req: any, payload: any) {
    try {
      // ÉTAPE 1: Tenter validation JWT custom (existant)
      if (payload.sub && payload.email) {
        console.log('[HybridJWT] Token JWT custom détecté:', payload.email);

        // Enrichir avec doctorID depuis PostgreSQL
        const doctor = await this.dataSource.query(
          `SELECT doctorid as "doctorID", email, firstname as "firstName",
                  lastname as "lastName", roleid as "roleId"
           FROM doctors WHERE doctorid = $1`,
          [payload.sub]
        );

        if (doctor && doctor.length > 0) {
          return {
            source: 'custom',
            sub: payload.sub,
            email: payload.email,
            doctorID: doctor[0].doctorID,
            firstName: doctor[0].firstName,
            lastName: doctor[0].lastName,
            roleId: doctor[0].roleId,
          };
        }
      }

      // ÉTAPE 2: Si échec, tenter validation Supabase JWT
      const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

      if (!token) {
        throw new UnauthorizedException('Token manquant');
      }

      console.log('[HybridJWT] Tentative validation Supabase JWT');
      const supabaseUser = await this.supabaseService.verifySupabaseToken(token);

      if (!supabaseUser) {
        throw new UnauthorizedException('Token invalide (ni custom ni Supabase)');
      }

      console.log('[HybridJWT] Token Supabase valide:', supabaseUser.email);

      // ÉTAPE 3: Lien Supabase ↔ PostgreSQL via email
      const doctor = await this.dataSource.query(
        `SELECT doctorid as "doctorID", email, firstname as "firstName",
                lastname as "lastName", roleid as "roleId"
         FROM doctors WHERE email = $1`,
        [supabaseUser.email]
      );

      if (!doctor || doctor.length === 0) {
        throw new UnauthorizedException('Utilisateur Supabase non trouvé dans PostgreSQL');
      }

      return {
        source: 'supabase',
        sub: supabaseUser.id,
        email: supabaseUser.email,
        doctorID: doctor[0].doctorID,
        firstName: doctor[0].firstName,
        lastName: doctor[0].lastName,
        roleId: doctor[0].roleId,
        supabaseUserId: supabaseUser.id,
      };

    } catch (error) {
      console.error('[HybridJWT] Erreur validation:', error.message);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
