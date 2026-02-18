import { createApiUrl, createAuthHeaders } from '../config/api.config';

export interface MeetingParticipant {
  doctorId: string;
  doctorName: string;
  speciality: string;
  invitationStatus: 'invited' | 'accepted' | 'declined';
  meetingRole: string | null;
}

export interface MeetingPatient {
  patientId: string;
  patientNumber: string;
  patientName: string;
  discussionOrder: number;
}

export interface Meeting {
  id: string;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  status: 'draft' | 'scheduled' | 'live' | 'postponed' | 'finished';
  createdBy: string;
  organizerId: string | null;
  organizerName: string | null;
  postponedReason: string | null;
  createdAt: string;
  updatedAt: string;
  participants: MeetingParticipant[];
  participantCount: number;
  patients: MeetingPatient[];
  patientCount: number;
}

export interface MeetingStats {
  thisMonthMeetingsCount: number;
  totalPatientsDiscussed: number;
  averageDuration: string;
}

export interface ParticipantPrerequisite {
  key: string;
  label: string;  // Backward compatibility
  label_fr?: string;  // French label
  label_en?: string;  // English label
  status: 'pending' | 'completed' | 'not_applicable';
}

export interface ParticipantWithPrerequisites {
  doctorId: string;
  firstName: string;
  lastName: string;
  email: string;
  speciality: string;
  role: string;
  invitationStatus: string;
  prerequisites: ParticipantPrerequisite[];
}

export interface MeetingDetails {
  meetingId: string;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  status: string;
  participants: ParticipantWithPrerequisites[];
}

/**
 * Récupère toutes les réunions
 * @param authToken - Token JWT pour l'authentification
 * @param doctorId - (Optionnel) Filtrer par docteur participant
 */
export async function fetchMeetings(
  authToken: string | null,
  doctorId?: string
): Promise<Meeting[]> {
  try {
    const url = doctorId
      ? createApiUrl(`/meetings?doctorId=${doctorId}`)
      : createApiUrl('/meetings');

    const response = await fetch(url, {
      method: 'GET',
      headers: createAuthHeaders(authToken),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch meetings: ${response.statusText}`);
    }

    const meetings: Meeting[] = await response.json();
    return meetings;
  } catch (error) {
    console.error('Error fetching meetings:', error);
    throw error;
  }
}

/**
 * Récupère une réunion par son ID
 * @param meetingId - ID de la réunion
 * @param authToken - Token JWT pour l'authentification
 */
export async function fetchMeetingById(
  meetingId: string,
  authToken: string | null
): Promise<Meeting> {
  try {
    const response = await fetch(createApiUrl(`/meetings/${meetingId}`), {
      method: 'GET',
      headers: createAuthHeaders(authToken),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch meeting: ${response.statusText}`);
    }

    const meeting: Meeting = await response.json();
    return meeting;
  } catch (error) {
    console.error('Error fetching meeting:', error);
    throw error;
  }
}

/**
 * Récupère les statistiques des réunions
 * @param authToken - Token JWT pour l'authentification
 */
export async function fetchMeetingsStats(
  authToken: string | null
): Promise<MeetingStats> {
  try {
    const response = await fetch(createApiUrl('/meetings/stats/summary'), {
      method: 'GET',
      headers: createAuthHeaders(authToken),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch meetings stats: ${response.statusText}`);
    }

    const stats: MeetingStats = await response.json();
    return stats;
  } catch (error) {
    console.error('Error fetching meetings stats:', error);
    throw error;
  }
}

/**
 * Récupère les détails complets d'une réunion (participants + prérequis)
 * @param meetingId - ID de la réunion
 * @param authToken - Token JWT pour l'authentification
 */
export async function fetchMeetingDetails(
  meetingId: string,
  authToken: string | null
): Promise<MeetingDetails> {
  try {
    const response = await fetch(createApiUrl(`/meetings/${meetingId}/details`), {
      method: 'GET',
      headers: createAuthHeaders(authToken),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch meeting details: ${response.statusText}`);
    }

    const details: MeetingDetails = await response.json();
    return details;
  } catch (error) {
    console.error('Error fetching meeting details:', error);
    throw error;
  }
}

/**
 * Récupère la liste de tous les docteurs
 * @param authToken - Token JWT pour l'authentification
 */
export async function fetchDoctors(
  authToken: string | null
): Promise<any[]> {
  try {
    const response = await fetch(createApiUrl('/doctors'), {
      method: 'GET',
      headers: createAuthHeaders(authToken),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch doctors: ${response.statusText}`);
    }

    const doctors = await response.json();
    return doctors;
  } catch (error) {
    console.error('Error fetching doctors:', error);
    throw error;
  }
}

/**
 * Récupère la liste de tous les patients
 * @param authToken - Token JWT pour l'authentification
 */
export async function fetchPatients(
  authToken: string | null
): Promise<any[]> {
  try {
    const response = await fetch(createApiUrl('/patients'), {
      method: 'GET',
      headers: createAuthHeaders(authToken),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch patients: ${response.statusText}`);
    }

    const patients = await response.json();
    return patients;
  } catch (error) {
    console.error('Error fetching patients:', error);
    throw error;
  }
}

/**
 * Récupère les templates de prérequis par spécialité
 * @param authToken - Token JWT pour l'authentification
 */
export async function fetchPrerequisiteTemplates(
  authToken: string | null
): Promise<Record<string, any[]>> {
  try {
    const response = await fetch(createApiUrl('/prerequisites/templates'), {
      method: 'GET',
      headers: createAuthHeaders(authToken),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch prerequisite templates: ${response.statusText}`);
    }

    const templates = await response.json();
    return templates;
  } catch (error) {
    console.error('Error fetching prerequisite templates:', error);
    throw error;
  }
}

/**
 * Crée une nouvelle réunion
 * @param meetingData - Données de la réunion
 * @param authToken - Token JWT pour l'authentification
 */
export async function createMeeting(
  meetingData: any,
  authToken: string | null
): Promise<{ meetingId: string }> {
  try {
    const response = await fetch(createApiUrl('/meetings'), {
      method: 'POST',
      headers: {
        ...createAuthHeaders(authToken),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(meetingData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create meeting: ${response.statusText}`);
    }

    const result: { meetingId: string } = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating meeting:', error);
    throw error;
  }
}

/**
 * Met à jour une réunion
 */
export async function updateMeeting(
  meetingId: string,
  updateData: {
    title?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    status?: string;
    postponedReason?: string;
  },
  authToken: string | null,
): Promise<Meeting> {
  const response = await fetch(createApiUrl(`/meetings/${meetingId}`), {
    method: 'PUT',
    headers: {
      ...createAuthHeaders(authToken),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to update meeting: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Supprime une réunion (cascade complète)
 * Seul l'organizer ou co_admin peut supprimer
 */
export async function deleteMeeting(
  meetingId: string,
  authToken: string | null,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(createApiUrl(`/meetings/${meetingId}`), {
    method: 'DELETE',
    headers: createAuthHeaders(authToken),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to delete meeting: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Reprogramme une réunion (crée une nouvelle, marque l'ancienne comme postponed)
 * Seul l'organizer ou co_admin peut reprogrammer
 */
export async function rescheduleMeeting(
  meetingId: string,
  rescheduleData: {
    title?: string;
    startTime: string;
    endTime?: string;
    description?: string;
    postponedReason?: string;
  },
  authToken: string | null,
): Promise<{ originalMeetingId: string; newMeetingId: string }> {
  const response = await fetch(createApiUrl(`/meetings/${meetingId}/reschedule`), {
    method: 'POST',
    headers: {
      ...createAuthHeaders(authToken),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rescheduleData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to reschedule meeting: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Vérifie l'accès d'un utilisateur à une réunion (pour validation lien /meeting/:id)
 */
export async function checkMeetingAccess(
  meetingId: string,
  authToken: string | null,
): Promise<{ hasAccess: boolean; role: string; meetingTitle: string; meetingStatus: string }> {
  const response = await fetch(createApiUrl(`/meetings/${meetingId}/access`), {
    method: 'GET',
    headers: createAuthHeaders(authToken),
  });

  if (!response.ok) {
    throw new Error(`Failed to check meeting access: ${response.statusText}`);
  }

  return response.json();
}
