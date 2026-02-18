import { createApiUrl, createAuthHeaders } from '../config/api.config';
import { authService } from './auth.service';

// ── Types for GET /prerequisites/meeting/:id/details ──────────────────────────

export interface PrerequisiteItemDetail {
  key: string;
  label: string;
  label_fr?: string;
  label_en?: string;
  status: 'pending' | 'in_progress' | 'done';
  source: 'orthanc' | 'document' | null;
  reference_id: string | null;
}

export interface ParticipantDetail {
  doctor_id: string;
  firstname: string;
  lastname: string;
  email: string;
  speciality: string;
  meeting_role: string;
  items: PrerequisiteItemDetail[];
  progress: { completed: number; total: number; percentage: number };
}

export interface PrerequisiteDetailsResponse {
  meeting: {
    id: string;
    title: string;
    description: string | null;
    start_time: string | null;
    status: string;
  };
  patient: {
    patient_id: string;
    code_patient: string;
    firstname: string;
    lastname: string;
    fullname: string;
  } | null;
  participants: ParticipantDetail[];
  globalProgress: { completed: number; total: number; percentage: number };
  prerequisites_status: 'in_progress' | 'ready';
}

/**
 * Récupère les détails complets d'une réunion : participants + prérequis MongoDB
 * Admin (organizer/co_admin) → voit tout
 * Participant simple → voit uniquement ses propres prérequis
 */
export async function fetchMeetingPrerequisiteDetails(
  meetingId: string,
  authToken: string | null,
): Promise<PrerequisiteDetailsResponse> {
  const token = authToken ?? authService.getToken();
  const response = await fetch(
    createApiUrl(`/prerequisites/meeting/${meetingId}/details`),
    { method: 'GET', headers: createAuthHeaders(token) },
  );
  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`Impossible de charger les prérequis : ${text}`);
  }
  return response.json();
}

export interface PrerequisiteTemplate {
  key: string;
  label: string;
  source?: 'orthanc' | 'document' | 'form';
}

/**
 * Récupère les templates de prérequis pour toutes les spécialités
 */
export async function fetchPrerequisiteTemplates(authToken: string | null): Promise<Record<string, PrerequisiteTemplate[]>> {
  try {
    const response = await fetch(createApiUrl('/prerequisites/templates'), {
      method: 'GET',
      headers: createAuthHeaders(authToken),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch prerequisite templates: ${response.statusText}`);
    }

    const templates: Record<string, PrerequisiteTemplate[]> = await response.json();
    return templates;
  } catch (error) {
    console.error('Error fetching prerequisite templates:', error);
    throw error;
  }
}

// Service singleton pour compatibilité avec l'ancien code
export const prerequisitesService = {
  getMyPrerequisites: async () => {
    try {
      const token = authService.getToken();
      console.log('[MyPrerequisites] Fetching with token:', token ? '✓ présent' : '✗ absent');
      
      const response = await fetch(createApiUrl('/prerequisites/me'), {
        method: 'GET',
        headers: createAuthHeaders(token),
      });
      
      console.log('[MyPrerequisites] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[MyPrerequisites] Error response:', errorText);
        throw new Error(`Failed to fetch my prerequisites: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[MyPrerequisites] Data received:', data);
      return data;
    } catch (error) {
      console.error('[MyPrerequisites] Error:', error);
      throw error;
    }
  },

  getMeetingPrerequisites: async (meetingId: string, all: boolean = false) => {
    try {
      const token = authService.getToken();
      const url = all ? `/prerequisites/meeting/${meetingId}/all` : `/prerequisites/meeting/${meetingId}`;
      const response = await fetch(createApiUrl(url), {
        method: 'GET',
        headers: createAuthHeaders(token),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[MeetingPrerequisites] Error:', errorText);
        throw new Error(`Failed to fetch prerequisites: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('[MeetingPrerequisites] Error:', error);
      throw error;
    }
  },

  updateMyPrerequisites: async (meetingId: string, data: any) => {
    try {
      const token = authService.getToken();
      const response = await fetch(createApiUrl(`/prerequisites/meeting/${meetingId}`), {
        method: 'PATCH',
        headers: {
          ...createAuthHeaders(token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[UpdatePrerequisites] Error:', errorText);
        throw new Error(`Failed to update prerequisites: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('[UpdatePrerequisites] Error:', error);
      throw error;
    }
  },

  canLaunchMeeting: async (meetingId: string) => {
    try {
      const token = authService.getToken();
      const response = await fetch(createApiUrl(`/prerequisites/meeting/${meetingId}/can-launch`), {
        method: 'GET',
        headers: createAuthHeaders(token),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CanLaunch] Error:', errorText);
        throw new Error(`Failed to check launch status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('[CanLaunch] Error:', error);
      throw error;
    }
  },
};
