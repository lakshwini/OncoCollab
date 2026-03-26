export interface ParticipantWithRole {
  doctorId: string;
  role?: 'organizer' | 'co_admin' | 'participant';
  invitationStatus?: 'invited' | 'accepted' | 'declined';
}

export interface ParticipantPrerequisite {
  doctorId: string;
  speciality: string;
  items: Array<{
    key: string;
    label: string;  // Backward compatibility
    label_fr?: string;  // French label
    label_en?: string;  // English label
    status?: 'pending' | 'done' | 'not_applicable';
    source?: 'orthanc' | 'document' | 'form';
  }>;
}

export interface CreateMeetingDto {
  title: string;
  description?: string;
  startTime?: Date | string;
  endTime?: Date | string;
  status?: 'draft' | 'scheduled' | 'live' | 'postponed' | 'finished';
  patientIds: string[];  // Liste des patients à discuter
  participants: ParticipantWithRole[];  // Liste des participants avec leurs rôles
  prerequisites: ParticipantPrerequisite[];  // Prérequis par participant
}
