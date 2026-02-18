import { createApiUrl, createAuthHeaders } from '../config/api.config';

export interface Doctor {
  doctorId: string;
  email: string;
  firstName: string;
  lastName: string;
  speciality: string;
  isActive: boolean;
}

/**
 * Récupère tous les médecins actifs
 */
export async function fetchDoctors(authToken: string | null): Promise<Doctor[]> {
  try {
    const response = await fetch(createApiUrl('/doctors'), {
      method: 'GET',
      headers: createAuthHeaders(authToken),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch doctors: ${response.statusText}`);
    }

    const doctors: Doctor[] = await response.json();
    return doctors;
  } catch (error) {
    console.error('Error fetching doctors:', error);
    throw error;
  }
}
