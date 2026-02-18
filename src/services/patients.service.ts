import { createApiUrl, createAuthHeaders } from '../config/api.config';

export interface Patient {
  patientId: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex?: string;
}

/**
 * Récupère tous les patients
 */
export async function fetchPatients(authToken: string | null): Promise<Patient[]> {
  try {
    const response = await fetch(createApiUrl('/patients'), {
      method: 'GET',
      headers: createAuthHeaders(authToken),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch patients: ${response.statusText}`);
    }

    const patients: Patient[] = await response.json();
    return patients;
  } catch (error) {
    console.error('Error fetching patients:', error);
    throw error;
  }
}
