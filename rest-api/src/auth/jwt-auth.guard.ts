import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard JWT HYBRIDE pour les requêtes HTTP
 *
 * Essaie d'abord la stratégie 'jwt' (custom, rapide),
 * puis 'hybrid-jwt' (custom + Supabase) en cas d'échec.
 *
 * ✅ Compatible avec JWT custom (login existant)
 * ✅ Compatible avec JWT Supabase (nouveau login)
 * ✅ Ne casse pas l'existant
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard(['jwt', 'hybrid-jwt']) {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Token invalide ou expiré');
    }
    return user;
  }
}
