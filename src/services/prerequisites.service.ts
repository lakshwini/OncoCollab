import { createApiUrl, createAuthHeaders } from '../config/api.config';
import { authService } from './auth.service';

const olgaFormCache = new Map<string, OlgaFormField[]>();

// ── Types for GET /prerequisites/me ───────────────────────────────────────────

export interface MyPrerequisiteItem {
  id: string;
  key: string;
  label: string;
  status: 'pending' | 'in_progress' | 'done';
  completed: boolean;
  source?: 'orthanc' | 'document' | 'form' | null;
  reference_id?: string | null;
  value?: unknown;
}

export interface MyMeetingPrerequisites {
  meeting_id: string;
  meeting_title: string;
  meeting_status: string;
  is_admin: boolean;
  speciality?: string;
  prerequisites: MyPrerequisiteItem[];
}

// ── Types for GET /prerequisites/meeting/:id/all ───────────────────────────────

export interface ParticipantPrerequisites {
  doctor_name: string;
  doctor_email: string;
  prerequisites: MyPrerequisiteItem[];
}

export interface OlgaFormFieldOption {
  label: string;
  value: string;
}

export interface OlgaFormField {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  options?: OlgaFormFieldOption[];
}

// ── Types for GET /prerequisites/meeting/:id/details ──────────────────────────

export interface PrerequisiteItemDetail {
  key: string;
  label: string;
  label_fr?: string;
  label_en?: string;
  status: 'pending' | 'in_progress' | 'done';
  source: 'orthanc' | 'document' | 'form' | null;
  reference_id: string | null;
  value?: unknown;
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

function normalizeOlgaField(node: Record<string, unknown>): OlgaFormField | null {
  const type = typeof node.type === 'string' ? node.type.toLowerCase() : 'text';
  const disallowedTypes = new Set([
    'button',
    'submit',
    'reset',
    'html',
    'content',
    'panel',
    'fieldset',
    'container',
    'group',
    'section',
    'page',
    'columns',
    'column',
    'tabs',
    'tab',
    'row',
  ]);

  if (disallowedTypes.has(type) || node.input === false) {
    return null;
  }

  const rawKey = [node.key, node.name, node.id, node.fieldKey].find(
    (value) => typeof value === 'string' && value.trim().length > 0,
  );

  if (!rawKey) {
    return null;
  }

  const label = [node.label, node.title, node.placeholder, rawKey].find(
    (value) => typeof value === 'string' && value.trim().length > 0,
  );

  const rawOptions = Array.isArray(node.options)
    ? node.options
    : Array.isArray(node.values)
      ? node.values
      : [];
  const options = rawOptions
    .map((option) => {
      if (typeof option === 'string') {
        return { label: option, value: option };
      }

      if (!option || typeof option !== 'object') {
        return null;
      }

      const record = option as Record<string, unknown>;
      const optionValue = [record.value, record.id, record.key, record.label].find(
        (value) => typeof value === 'string' && value.trim().length > 0,
      );
      const optionLabel = [record.label, record.name, optionValue].find(
        (value) => typeof value === 'string' && value.trim().length > 0,
      );

      if (!optionValue || !optionLabel) {
        return null;
      }

      return {
        label: String(optionLabel),
        value: String(optionValue),
      };
    })
    .filter((option): option is OlgaFormFieldOption => option !== null);

  return {
    key: String(rawKey).trim(),
    label: String(label).trim(),
    type,
    required: Boolean(node.required),
    placeholder: typeof node.placeholder === 'string' ? node.placeholder : undefined,
    options: options.length > 0 ? options : undefined,
  };
}

function normalizeOlgaForm(schema: unknown): OlgaFormField[] {
  const fields = new Map<string, OlgaFormField>();

  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    if (!node || typeof node !== 'object') {
      return;
    }

    const record = node as Record<string, unknown>;
    const field = normalizeOlgaField(record);
    if (field && !fields.has(field.key)) {
      fields.set(field.key, field);
    }

    Object.values(record).forEach((value) => {
      if (Array.isArray(value) || (value && typeof value === 'object')) {
        visit(value);
      }
    });
  };

  if (schema && typeof schema === 'object' && Array.isArray((schema as Record<string, unknown>).fields)) {
    visit((schema as Record<string, unknown>).fields);
  } else {
    visit(schema);
  }

  return Array.from(fields.values());
}

export async function fetchOlgaForm(
  role: string,
  authToken: string | null,
): Promise<OlgaFormField[] | null> {
  const normalizedRole = role.trim();
  if (!normalizedRole) {
    return [];
  }

  if (olgaFormCache.has(normalizedRole)) {
    return olgaFormCache.get(normalizedRole)!;
  }

  try {
    const response = await fetch(createApiUrl(`/prerequisite-form/${encodeURIComponent(normalizedRole)}`), {
      method: 'GET',
      headers: createAuthHeaders(authToken),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Formulaire Olga non disponible');
    }

    const schema = await response.json();
    const fields = normalizeOlgaForm(schema);
    olgaFormCache.set(normalizedRole, fields);
    return fields;
  } catch {
    throw new Error('Formulaire Olga non disponible');
  }
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

// ── Types for GET /prerequisites/meeting/:id ──────────────────────────────────

export interface GeneratedPrerequisiteItem {
  key: string;
  label: string;
  status: 'pending' | 'in_progress' | 'done';
  source: 'orthanc' | 'document' | null;
}

export interface GeneratedDoctorPrerequisites {
  doctor_id: string;
  speciality: string;
  items: GeneratedPrerequisiteItem[];
}

export interface GeneratedMeetingPrerequisites {
  meeting_id: string;
  doctors: GeneratedDoctorPrerequisites[];
}

/**
 * GET /prerequisites/meeting/:meetingId
 * Prérequis générés d'une réunion (shape propre post-création)
 */
export async function fetchGeneratedMeetingPrerequisites(
  meetingId: string,
  authToken: string | null,
): Promise<GeneratedMeetingPrerequisites> {
  const token = authToken ?? authService.getToken();
  const response = await fetch(createApiUrl(`/prerequisites/meeting/${meetingId}`), {
    method: 'GET',
    headers: createAuthHeaders(token),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`Impossible de charger les prérequis générés : ${text}`);
  }
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

  getOlgaForm: async (role: string): Promise<OlgaFormField[] | null> => {
    const token = authService.getToken();
    return fetchOlgaForm(role, token);
  },

  /** PATCH /prerequisites/meeting/:meetingId — update status {itemId, status} */
  updatePrerequisiteStatus: async (meetingId: string, itemId: string, status: 'pending' | 'in_progress' | 'done') => {
    const token = authService.getToken();
    const response = await fetch(createApiUrl(`/prerequisites/meeting/${meetingId}`), {
      method: 'PATCH',
      headers: { ...createAuthHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, status }),
    });
    if (!response.ok) throw new Error(`Failed to update prerequisite status: ${response.status}`);
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
