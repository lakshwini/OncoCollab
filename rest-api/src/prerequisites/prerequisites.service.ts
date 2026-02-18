import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { Db } from 'mongodb';
import {
  MeetingPrerequisites,
  MeetingPrerequisitesResponse,
  MeetingPermissions,
  PrerequisiteProgress,
  DoctorPrerequisitesWithProgress,
} from './interfaces/prerequisite.interface';
import { UpdatePrerequisitesDto } from './dto/update-prerequisite.dto';
import { VideoGateway } from '../video/video.gateway';

@Injectable()
export class PrerequisitesService {
  private readonly logger = new Logger(PrerequisitesService.name);

  constructor(
    @InjectConnection() private readonly pgConnection: Connection,
    @Inject('PREREQUISITES_MONGO_DB') private readonly mongoDb: Db,
    @Inject(forwardRef(() => VideoGateway)) private readonly videoGateway: VideoGateway,
  ) {}

  /**
   * Vérifie les permissions d'un médecin pour une réunion (PostgreSQL)
   */
  async checkPermissions(meetingId: string, doctorId: string): Promise<MeetingPermissions> {
    const query = `
      SELECT
        mp.doctor_id,
        mr.role,
        m.created_by
      FROM meetings m
      LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id
      LEFT JOIN meeting_roles mr ON m.id = mr.meeting_id AND mp.doctor_id = mr.doctor_id
      WHERE m.id = $1 AND mp.doctor_id = $2
    `;

    const result = await this.pgConnection.query(query, [meetingId, doctorId]);

    if (!result || result.length === 0) {
      return {
        canView: false,
        canEdit: false,
        canLaunch: false,
        role: null,
      };
    }

    const { role, created_by } = result[0];
    const isOrganizer = created_by === doctorId || role === 'organizer';
    const isCoAdmin = role === 'co_admin';

    return {
      canView: true,
      canEdit: isOrganizer || isCoAdmin,
      canLaunch: isOrganizer || isCoAdmin,
      role: isOrganizer ? 'organizer' : isCoAdmin ? 'co_admin' : 'participant',
    };
  }

  /**
   * Calcule l'avancement des prérequis
   */
  private calculateProgress(items: any[]): PrerequisiteProgress {
    const total = items.length;
    const completed = items.filter(item => item.status === 'done').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percentage };
  }

  /**
   * Récupère les prérequis d'une réunion avec calcul d'avancement
   */
  async getMeetingPrerequisites(
    meetingId: string,
    doctorId: string,
    isAdmin: boolean = false,
  ): Promise<MeetingPrerequisitesResponse> {
    const permissions = await this.checkPermissions(meetingId, doctorId);
    if (!permissions.canView) {
      throw new ForbiddenException('Vous n\'avez pas accès aux prérequis de cette réunion');
    }

    const prerequisites = await this.mongoDb
      .collection<MeetingPrerequisites>('meeting_prerequisites')
      .findOne({ meeting_id: meetingId });

    if (!prerequisites) {
      throw new NotFoundException('Prérequis non trouvés pour cette réunion');
    }

    let doctorsData = prerequisites.doctors;
    if (!isAdmin && !permissions.canEdit) {
      doctorsData = doctorsData.filter(d => d.doctor_id === doctorId);
    }

    const doctorsWithProgress: DoctorPrerequisitesWithProgress[] = doctorsData.map(doctor => ({
      ...doctor,
      progress: this.calculateProgress(doctor.items),
    }));

    const allItems = doctorsData.flatMap(d => d.items);
    const globalProgress = this.calculateProgress(allItems);

    return {
      meeting_id: prerequisites.meeting_id,
      patient_id: prerequisites.patient_id,
      status: prerequisites.status,
      doctors: doctorsWithProgress,
      globalProgress,
    };
  }

  /**
   * Récupère tous les prérequis du médecin connecté (toutes ses réunions)
   * Retourne TOUTES les réunions du médecin, même sans données MongoDB
   */
  async getMyPrerequisites(doctorId: string): Promise<MeetingPrerequisitesResponse[]> {
    this.logger.log(`Récupération des prérequis pour docteur: ${doctorId}`);

    // 1. Récupérer les réunions du médecin avec sa spécialité (PostgreSQL)
    const meetingsQuery = `
      SELECT
        m.id as meeting_id,
        m.title,
        m.start_time,
        COALESCE(r.rolename, 'Non spécifié') as speciality
      FROM meetings m
      INNER JOIN meeting_participants mp ON m.id = mp.meeting_id
      INNER JOIN doctors d ON mp.doctor_id = d.doctorid
      LEFT JOIN roles r ON d.roleid = r.roleid
      WHERE mp.doctor_id = $1
      ORDER BY m.start_time DESC NULLS LAST
    `;

    const meetings = await this.pgConnection.query(meetingsQuery, [doctorId]);
    this.logger.log(`${meetings.length} réunions trouvées pour docteur ${doctorId}`);

    // 2. Pour chaque réunion, récupérer les prérequis depuis MongoDB
    const results = await Promise.all(
      meetings.map(async (meeting: any) => {
        try {
          const prereqs = await this.mongoDb
            .collection<MeetingPrerequisites>('meeting_prerequisites')
            .findOne({ meeting_id: meeting.meeting_id });

          if (prereqs) {
            // Données MongoDB trouvées → utiliser les prérequis du médecin
            const doctorPrereq = prereqs.doctors.find(d => d.doctor_id === doctorId);
            const items = doctorPrereq?.items || [];
            const progress = this.calculateProgress(items);

            return {
              meeting_id: meeting.meeting_id,
              patient_id: prereqs.patient_id || '',
              status: prereqs.status,
              doctors: [{
                doctor_id: doctorId,
                speciality: doctorPrereq?.speciality || meeting.speciality,
                items,
                progress,
              }],
              globalProgress: progress,
            } as MeetingPrerequisitesResponse;
          }

          // Pas de données MongoDB → retourner la réunion avec liste vide
          return {
            meeting_id: meeting.meeting_id,
            patient_id: '',
            status: 'in_progress' as const,
            doctors: [{
              doctor_id: doctorId,
              speciality: meeting.speciality,
              items: [],
              progress: { total: 0, completed: 0, percentage: 0 },
            }],
            globalProgress: { total: 0, completed: 0, percentage: 0 },
          } as MeetingPrerequisitesResponse;
        } catch (error) {
          this.logger.error(`Erreur pour meeting ${meeting.meeting_id}:`, error);
          return null;
        }
      }),
    );

    const validResults = results.filter(r => r !== null) as MeetingPrerequisitesResponse[];
    this.logger.log(`Retour de ${validResults.length} réunions`);
    return validResults;
  }

  /**
   * Met à jour les prérequis d'un médecin
   */
  async updateMyPrerequisites(
    meetingId: string,
    doctorId: string,
    updateDto: UpdatePrerequisitesDto,
  ): Promise<MeetingPrerequisitesResponse> {
    const permissions = await this.checkPermissions(meetingId, doctorId);
    if (!permissions.canView) {
      throw new ForbiddenException('Vous n\'avez pas accès à cette réunion');
    }

    for (const item of updateDto.items) {
      await this.mongoDb.collection('meeting_prerequisites').updateOne(
        {
          meeting_id: meetingId,
          'doctors.doctor_id': doctorId,
        },
        {
          $set: {
            'doctors.$[doctor].items.$[item].status': item.status,
            'doctors.$[doctor].items.$[item].reference_id': item.reference_id || null,
          },
        },
        {
          arrayFilters: [
            { 'doctor.doctor_id': doctorId },
            { 'item.key': item.key },
          ],
        },
      );

      if (this.videoGateway?.server) {
        this.videoGateway.server.to(meetingId).emit('prerequisite-updated', {
          meeting_id: meetingId,
          doctor_id: doctorId,
          key: item.key,
          status: item.status,
        });
      }
    }

    const updated = await this.mongoDb
      .collection<MeetingPrerequisites>('meeting_prerequisites')
      .findOne({ meeting_id: meetingId });

    if (updated) {
      const allCompleted = updated.doctors.every(doctor =>
        doctor.items.every(item => item.status === 'done'),
      );

      if (allCompleted) {
        await this.mongoDb.collection('meeting_prerequisites').updateOne(
          { meeting_id: meetingId },
          { $set: { status: 'ready' } },
        );
      }
    }

    return this.getMeetingPrerequisites(meetingId, doctorId, permissions.canEdit);
  }

  /**
   * Vérifie si une réunion peut être lancée
   */
  async canLaunchMeeting(meetingId: string, doctorId: string): Promise<{ canLaunch: boolean; reason?: string }> {
    const permissions = await this.checkPermissions(meetingId, doctorId);
    if (!permissions.canLaunch) {
      return { canLaunch: false, reason: 'Vous n\'avez pas la permission de lancer cette réunion' };
    }

    const prerequisites = await this.mongoDb
      .collection<MeetingPrerequisites>('meeting_prerequisites')
      .findOne({ meeting_id: meetingId });

    if (!prerequisites) {
      return { canLaunch: false, reason: 'Prérequis non trouvés' };
    }

    if (prerequisites.status !== 'ready') {
      return { canLaunch: false, reason: 'Tous les prérequis ne sont pas complétés' };
    }

    return { canLaunch: true };
  }

  /**
   * Lance une réunion (update PostgreSQL)
   */
  async launchMeeting(meetingId: string, doctorId: string): Promise<{ success: boolean; message: string }> {
    const check = await this.canLaunchMeeting(meetingId, doctorId);
    if (!check.canLaunch) {
      throw new BadRequestException(check.reason);
    }

    await this.pgConnection.query(
      `UPDATE meetings SET status = 'live' WHERE id = $1`,
      [meetingId],
    );

    return { success: true, message: 'Réunion lancée avec succès' };
  }

  /**
   * Reporte une réunion (update PostgreSQL)
   */
  async postponeMeeting(meetingId: string, doctorId: string): Promise<{ success: boolean; message: string }> {
    const permissions = await this.checkPermissions(meetingId, doctorId);
    if (!permissions.canEdit) {
      throw new ForbiddenException('Vous n\'avez pas la permission de reporter cette réunion');
    }

    await this.pgConnection.query(
      `UPDATE meetings SET status = 'postponed' WHERE id = $1`,
      [meetingId],
    );

    return { success: true, message: 'Réunion reportée avec succès' };
  }

  /**
   * Récupère les détails complets d'une réunion avec participants et patient
   * PostgreSQL pour les participants + MongoDB pour les prérequis
   */
  async getMeetingDetailsWithParticipants(meetingId: string, doctorId: string) {
    // 1️⃣ Vérifier les permissions
    const permissions = await this.checkPermissions(meetingId, doctorId);
    if (!permissions.canView) {
      throw new ForbiddenException('Vous n\'avez pas accès à cette réunion');
    }

    // 2️⃣ Récupérer les infos de la réunion + premier patient (PostgreSQL)
    const meetingQuery = `
      SELECT
        m.id,
        m.title,
        m.description,
        m.start_time,
        m.status,
        p.patientid      AS patient_id,
        p.patient_number AS code_patient,
        p.firstname      AS patient_firstname,
        p.lastname       AS patient_lastname
      FROM meetings m
      LEFT JOIN meeting_patients mp ON m.id = mp.meeting_id
      LEFT JOIN patients p ON mp.patient_id = p.patientid
      WHERE m.id = $1
      ORDER BY mp.discussion_order ASC
      LIMIT 1
    `;

    const meetingResult = await this.pgConnection.query(meetingQuery, [meetingId]);

    if (!meetingResult || meetingResult.length === 0) {
      throw new NotFoundException('Réunion non trouvée');
    }

    const meeting = meetingResult[0];

    // 3️⃣ Récupérer TOUS les participants avec leurs infos complètes (PostgreSQL)
    const participantsQuery = `
      SELECT DISTINCT
        d.doctorid as doctor_id,
        d.firstname,
        d.lastname,
        d.email,
        COALESCE(r.rolename, 'Non spécifié') as speciality,
        mr.role as meeting_role
      FROM meeting_participants mp
      INNER JOIN doctors d ON mp.doctor_id = d.doctorid
      LEFT JOIN roles r ON d.roleid = r.roleid
      LEFT JOIN meeting_roles mr ON mp.meeting_id = mr.meeting_id AND mp.doctor_id = mr.doctor_id
      WHERE mp.meeting_id = $1
      ORDER BY d.lastname
    `;

    const participants = await this.pgConnection.query(participantsQuery, [meetingId]);

    // 4️⃣ Récupérer les prérequis depuis MongoDB
    const prerequisites = await this.mongoDb
      .collection<MeetingPrerequisites>('meeting_prerequisites')
      .findOne({ meeting_id: meetingId });

    // 5️⃣ Enrichir chaque participant avec ses prérequis
    const participantsWithPrerequisites = participants.map((participant: any) => {
      const doctorPrereq = prerequisites?.doctors.find(
        (d) => d.doctor_id === participant.doctor_id,
      );

      const items = doctorPrereq?.items || [];
      const completed = items.filter((item) => item.status === 'done').length;
      const total = items.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        doctor_id: participant.doctor_id,
        firstname: participant.firstname,
        lastname: participant.lastname,
        email: participant.email,
        speciality: participant.speciality || 'Généraliste',
        meeting_role: participant.meeting_role || 'participant',
        items,
        progress: { completed, total, percentage },
      };
    });

    // 6️⃣ Calculer l'avancement global
    const totalItems = participantsWithPrerequisites.reduce((sum, p) => sum + p.progress.total, 0);
    const completedItems = participantsWithPrerequisites.reduce((sum, p) => sum + p.progress.completed, 0);
    const globalPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      meeting: {
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        start_time: meeting.start_time,
        status: meeting.status,
      },
      patient: meeting.patient_id ? {
        patient_id: meeting.patient_id,
        code_patient: meeting.code_patient,
        firstname: meeting.patient_firstname,
        lastname: meeting.patient_lastname,
        fullname: `${meeting.patient_firstname} ${meeting.patient_lastname}`,
      } : null,
      participants: participantsWithPrerequisites,
      globalProgress: {
        completed: completedItems,
        total: totalItems,
        percentage: globalPercentage,
      },
      prerequisites_status: prerequisites?.status || 'in_progress',
    };
  }

  /**
   * Récupère la liste des réunions du médecin connecté avec avancement global
   */
  async getMyMeetings(doctorId: string) {
    const query = `
      SELECT DISTINCT
        m.id,
        m.title,
        m.description,
        m.start_time,
        m.status,
        (SELECT COUNT(*) FROM meeting_participants mp2 WHERE mp2.meeting_id = m.id) as participants_count
      FROM meetings m
      INNER JOIN meeting_participants mp ON m.id = mp.meeting_id
      WHERE mp.doctor_id = $1
        AND m.status IN ('scheduled', 'pending', 'in_progress')
      ORDER BY m.start_time DESC
    `;

    const meetings = await this.pgConnection.query(query, [doctorId]);

    const enrichedMeetings = await Promise.all(
      meetings.map(async (meeting: any) => {
        const prerequisites = await this.mongoDb
          .collection<MeetingPrerequisites>('meeting_prerequisites')
          .findOne({ meeting_id: meeting.id });

        if (!prerequisites) {
          return { ...meeting, global_progress: { completed: 0, total: 0, percentage: 0 } };
        }

        const allItems = prerequisites.doctors.flatMap((d) => d.items);
        const completed = allItems.filter((item) => item.status === 'done').length;
        const total = allItems.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { ...meeting, global_progress: { completed, total, percentage } };
      }),
    );

    return enrichedMeetings;
  }
}
