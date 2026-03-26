import { Inject, Injectable, Logger } from '@nestjs/common';
import { Db } from 'mongodb';
import { getPrerequisiteTemplatesForSpeciality } from './prerequisite-templates';

type TemplateSource = 'document' | 'orthanc' | 'form';

export interface GeneratorDoctorInput {
  doctor_id?: string;
  doctorId?: string;
  speciality?: string;
}

export interface GeneratedMeetingPrerequisites {
  meeting_id: string;
  status: 'in_progress';
  doctors: Array<{
    doctor_id: string;
    speciality: string;
    items: Array<{
      key: string;
      label: string;
      status: 'pending';
      source: 'document' | 'orthanc';
    }>;
  }>;
}

@Injectable()
export class PrerequisiteGeneratorService {
  private readonly logger = new Logger(PrerequisiteGeneratorService.name);

  constructor(
    @Inject('PREREQUISITES_MONGO_DB') private readonly mongoDb: Db,
  ) {}

  private normalizeSource(source?: TemplateSource): 'document' | 'orthanc' {
    if (source === 'orthanc') {
      return 'orthanc';
    }

    // Le schema cible accepte uniquement document|orthanc
    return 'document';
  }

  private buildDoctorItems(speciality: string) {
    const templates = getPrerequisiteTemplatesForSpeciality(speciality);

    return templates.map((template) => ({
      key: template.key,
      label: template.label || template.label_fr || template.label_en || template.key,
      status: 'pending' as const,
      source: this.normalizeSource(template.source),
    }));
  }

  async generatePrerequisitesForMeeting(
    meetingId: string,
    doctors: GeneratorDoctorInput[],
  ): Promise<GeneratedMeetingPrerequisites> {
    const normalizedDoctors = doctors
      .map((doctor) => ({
        doctor_id: doctor.doctor_id || doctor.doctorId || '',
        speciality: doctor.speciality || 'Non spécifié',
      }))
      .filter((doctor) => doctor.doctor_id.length > 0);

    const prerequisitesDoc: GeneratedMeetingPrerequisites = {
      meeting_id: meetingId,
      status: 'in_progress',
      doctors: normalizedDoctors.map((doctor) => ({
        doctor_id: doctor.doctor_id,
        speciality: doctor.speciality,
        items: this.buildDoctorItems(doctor.speciality),
      })),
    };

    await this.mongoDb.collection('meeting_prerequisites').updateOne(
      { meeting_id: meetingId },
      {
        $set: prerequisitesDoc,
      },
      { upsert: true },
    );

    this.logger.log(
      `Prerequis generes pour meeting ${meetingId}: ${prerequisitesDoc.doctors.length} medecin(s)`,
    );

    return prerequisitesDoc;
  }
}