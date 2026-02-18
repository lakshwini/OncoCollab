import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard JWT Hybride
 *
 * Utilise la stratégie 'hybrid-jwt' qui accepte :
 * - JWT custom (système actuel)
 * - JWT Supabase (nouveau système)
 *
 * ✅ Compatible avec les 2 systèmes d'authentification
 */
@Injectable()
export class HybridJwtAuthGuard extends AuthGuard('hybrid-jwt') {}
