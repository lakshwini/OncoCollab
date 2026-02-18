/**
 * Interfaces pour la gestion des prérequis MongoDB
 * Structure exacte du document MongoDB
 */

export interface PrerequisiteItem {
  key: string;
  label: string;
  status: 'pending' | 'done';
  source: 'orthanc' | 'document';
  reference_id: string | null;
}

export interface DoctorPrerequisites {
  doctor_id: string;
  speciality: string;
  items: PrerequisiteItem[];
}

export interface MeetingPrerequisites {
  meeting_id: string;
  patient_id: string;
  status: 'in_progress' | 'ready';
  doctors: DoctorPrerequisites[];
}

/**
 * DTO pour la réponse avec calcul d'avancement
 */
export interface PrerequisiteProgress {
  total: number;
  completed: number;
  percentage: number;
}

export interface DoctorPrerequisitesWithProgress extends DoctorPrerequisites {
  progress: PrerequisiteProgress;
}

export interface MeetingPrerequisitesResponse {
  meeting_id: string;
  patient_id: string;
  status: 'in_progress' | 'ready';
  doctors: DoctorPrerequisitesWithProgress[];
  globalProgress: PrerequisiteProgress;
}

/**
 * Permission check result
 */
export interface MeetingPermissions {
  canView: boolean;
  canEdit: boolean;
  canLaunch: boolean;
  role: 'organizer' | 'co_admin' | 'participant' | null;
}
