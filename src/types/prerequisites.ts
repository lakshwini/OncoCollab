/**
 * Types pour la gestion des prérequis RCP
 */

export interface PrerequisiteItem {
  key: string;
  label: string;  // Backward compatibility
  label_fr?: string;  // French label
  label_en?: string;  // English label
  status: 'pending' | 'done';
  source: 'orthanc' | 'document';
  reference_id: string | null;
}

export interface PrerequisiteProgress {
  total: number;
  completed: number;
  percentage: number;
}

export interface DoctorPrerequisites {
  doctor_id: string;
  speciality: string;
  items: PrerequisiteItem[];
  progress: PrerequisiteProgress;
}

export interface MeetingPrerequisites {
  meeting_id: string;
  patient_id: string;
  status: 'in_progress' | 'ready';
  doctors: DoctorPrerequisites[];
  globalProgress: PrerequisiteProgress;
}

export interface UpdatePrerequisiteRequest {
  items: {
    key: string;
    status: 'pending' | 'done';
    reference_id?: string | null;
  }[];
}

export interface CanLaunchResponse {
  canLaunch: boolean;
  reason?: string;
}
