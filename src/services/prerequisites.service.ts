import { createApiUrl, createAuthHeaders } from '../config/api.config';
import { authService } from './auth.service';

// ── Types for GET /prerequisites/me ───────────────────────────────────────────

export interface MyPrerequisiteItem {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'done';
  completed: boolean;
}

export interface MyMeetingPrerequisites {
  meeting_id: string;
  meeting_title: string;
  meeting_status: string;
  is_admin: boolean;
  prerequisites: MyPrerequisiteItem[];
}

// ── Types for GET /prerequisites/meeting/:id/all ───────────────────────────────

export interface ParticipantPrerequisites {
  doctor_name: string;
  doctor_email: string;
  prerequisites: MyPrerequisiteItem[];
}

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

// ── Fonctions ─────────────────────────────────────────────────────────────────

/**
 * GET /prerequisites/me
 * Mes réunions + mes prérequis (+ flag is_admin)
 */
async function fetchMyPrerequisites(authToken: string | null): Promise<MyMeetingPrerequisites[]> {
  const token = authToken ?? authService.getToken();
  const response = await fetch(createApiUrl('/prerequisites/me'), {
    method: 'GET',
    headers: createAuthHeaders(token),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`Impossible de charger vos prérequis : ${text}`);
  }
  return response.json();
}

/**
 * GET /prerequisites/meeting/:meetingId/all
 * Vue admin : prérequis de tous les participants
 */
async function fetchAllParticipantsPrerequisites(
  meetingId: string,
  authToken: string | null,
): Promise<ParticipantPrerequisites[]> {
  const token = authToken ?? authService.getToken();
  const response = await fetch(
    createApiUrl(`/prerequisites/meeting/${meetingId}/all`),
    { method: 'GET', headers: createAuthHeaders(token) },
  );
  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`Impossible de charger les prérequis des participants : ${text}`);
  }
  return response.json();
}

/**
 * GET /prerequisites/meeting/:meetingId/details
 * Détails complets d'une réunion (utilisé par l'onglet vidéo)
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

export async function fetchPrerequisiteTemplates(
  authToken: string | null,
): Promise<Record<string, PrerequisiteTemplate[]>> {
  const response = await fetch(createApiUrl('/prerequisites/templates'), {
    method: 'GET',
    headers: createAuthHeaders(authToken),
  });
  if (!response.ok) throw new Error(`Failed to fetch prerequisite templates: ${response.statusText}`);
  return response.json();
}

// ── Singleton service (compatibilité ancienne API) ────────────────────────────

export const prerequisitesService = {
  /** GET /prerequisites/me */
  getMyPrerequisites: async (): Promise<MyMeetingPrerequisites[]> => {
    const token = authService.getToken();
    return fetchMyPrerequisites(token);
  },

  /** GET /prerequisites/meeting/:meetingId/all (admin) */
  getAllParticipantsPrerequisites: async (meetingId: string): Promise<ParticipantPrerequisites[]> => {
    const token = authService.getToken();
    return fetchAllParticipantsPrerequisites(meetingId, token);
  },

  /** GET /prerequisites/meeting/:meetingId or /all (ancien format, MeetingPrerequisitesCheck) */
  getMeetingPrerequisites: async (meetingId: string, all: boolean = false) => {
    const token = authService.getToken();
    const url = all
      ? `/prerequisites/meeting/${meetingId}/all`
      : `/prerequisites/meeting/${meetingId}`;
    const response = await fetch(createApiUrl(url), {
      method: 'GET',
      headers: createAuthHeaders(token),
    });
    if (!response.ok) throw new Error(`Failed to fetch prerequisites: ${response.status}`);
    return response.json();
  },

  /** PATCH /prerequisites/meeting/:meetingId */
  updateMyPrerequisites: async (meetingId: string, data: any) => {
    const token = authService.getToken();
    const response = await fetch(createApiUrl(`/prerequisites/meeting/${meetingId}`), {
      method: 'PATCH',
      headers: { ...createAuthHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to update prerequisites: ${response.status}`);
    return response.json();
  },

  /** PATCH /prerequisites/meeting/:meetingId — toggle simple {itemId, completed} */
  togglePrerequisiteItem: async (meetingId: string, itemId: string, completed: boolean) => {
    const token = authService.getToken();
    const response = await fetch(createApiUrl(`/prerequisites/meeting/${meetingId}`), {
      method: 'PATCH',
      headers: { ...createAuthHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, completed }),
    });
    if (!response.ok) throw new Error(`Failed to toggle prerequisite: ${response.status}`);
    return response.json();
  },

  /** GET /prerequisites/meeting/:meetingId/can-launch */
  canLaunchMeeting: async (meetingId: string) => {
    const token = authService.getToken();
    const response = await fetch(createApiUrl(`/prerequisites/meeting/${meetingId}/can-launch`), {
      method: 'GET',
      headers: createAuthHeaders(token),
    });
    if (!response.ok) throw new Error(`Failed to check launch status: ${response.status}`);
    return response.json();
  },
};
