import { createApiUrl } from '../config/api.config';
import { authService } from './auth.service';

/**
 * Pont d'authentification vers PathoCollab (auth-service, port 18001).
 *
 * PathoCollab a son propre système d'utilisateurs, totalement indépendant de celui
 * d'OncoCollab (pas de compte par médecin OncoCollab côté PathoCollab). L'auth-service
 * PathoCollab refuse en plus les requêtes CORS depuis le navigateur pour les origines de
 * dev (localhost:5173 / localhost) — la connexion se fait donc via le backend OncoCollab
 * (GET /pathocollab/token, serveur-à-serveur, pas de CORS), qui détient le compte de
 * service et le transmet au frontend.
 *
 * Le token est stocké sous la clé "access_token" du localStorage — celle déjà lue par
 * OpenSeadragonUrlViewer.tsx (getToken()), pour ne pas dupliquer cette logique.
 */

const TOKEN_KEY = 'access_token';

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Marge de 30s pour éviter d'utiliser un token qui expire pendant la requête.
    return !payload.exp || payload.exp * 1000 < Date.now() + 30_000;
  } catch {
    return true;
  }
}

/**
 * Retourne un token PathoCollab valide (depuis le cache localStorage, ou en le
 * redemandant au backend OncoCollab si absent/expiré). Retourne null si PathoCollab
 * est injoignable — les appelants doivent tolérer une absence de token (mode dégradé).
 */
export async function getPathoCollabToken(): Promise<string | null> {
  const cached = localStorage.getItem(TOKEN_KEY);
  if (cached && !isTokenExpired(cached)) {
    return cached;
  }

  try {
    const res = await fetch(createApiUrl('/pathocollab/token'), {
      headers: { Authorization: `Bearer ${authService.getToken() ?? ''}` },
    });
    if (!res.ok) {
      console.warn('[PathoCollabAuth] Échec de récupération du token via le backend:', res.status);
      return null;
    }
    const data = await res.json();
    if (data?.access_token) {
      localStorage.setItem(TOKEN_KEY, data.access_token);
      return data.access_token as string;
    }
    return null;
  } catch (err) {
    console.warn('[PathoCollabAuth] Backend OncoCollab injoignable pour le token PathoCollab:', err);
    return null;
  }
}

/** Raccourci pour construire un header Authorization à partir du token en cache (peut être vide). */
export function pathoCollabAuthHeader(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return token && !isTokenExpired(token) ? { Authorization: `Bearer ${token}` } : {};
}
