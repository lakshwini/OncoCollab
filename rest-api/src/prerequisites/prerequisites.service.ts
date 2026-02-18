import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { MongoClient, Db } from 'mongodb';
import { ConfigService } from '@nestjs/config';
import {
  MeetingPrerequisites,
  MeetingPrerequisitesResponse,
  MeetingPermissions,
  PrerequisiteProgress,
  DoctorPrerequisitesWithProgress,
} from './interfaces/prerequisite.interface';
import { UpdatePrerequisitesDto } from './dto/update-prerequisite.dto';

@Injectable()
export class PrerequisitesService {
  private mongoDb: Db;

  constructor(
    @InjectConnection() private readonly pgConnection: Connection,
    private readonly configService: ConfigService,
  ) {
    this.initMongo();
  }

  /**
   * Initialise la connexion MongoDB
   */
  private async initMongo() {
    const mongoUri = this.configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017';
    const client = await MongoClient.connect(mongoUri);
    this.mongoDb = client.db('oncocollab_prerequisites');
    console.log('✅ MongoDB connecté pour les prérequis');
  }

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
    // Vérifier les permissions
    const permissions = await this.checkPermissions(meetingId, doctorId);
    if (!permissions.canView) {
      throw new ForbiddenException('Vous n\'avez pas accès aux prérequis de cette réunion');
    }

    // Récupérer les prérequis MongoDB
    const prerequisites = await this.mongoDb
      .collection<MeetingPrerequisites>('meeting_prerequisites')
      .findOne({ meeting_id: meetingId });

    if (!prerequisites) {
      throw new NotFoundException('Prérequis non trouvés pour cette réunion');
    }

    // Filtrer par docteur si non admin
    let doctorsData = prerequisites.doctors;
    if (!isAdmin && !permissions.canEdit) {
      doctorsData = doctorsData.filter(d => d.doctor_id === doctorId);
    }

    // Calculer l'avancement pour chaque docteur
    const doctorsWithProgress: DoctorPrerequisitesWithProgress[] = doctorsData.map(doctor => ({
      ...doctor,
      progress: this.calculateProgress(doctor.items),
    }));

    // Calculer l'avancement global
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
   * Récupère tous les prérequis d'un médecin (toutes ses réunions)
   */
  async getMyPrerequisites(doctorId: string): Promise<MeetingPrerequisitesResponse[]> {
    console.log(`[PrerequisitesService] Récupération des prérequis pour docteur: ${doctorId}`);

    // 1. Récupérer les réunions du médecin (PostgreSQL)
    const meetingsQuery = `
      SELECT DISTINCT m.id as meeting_id, m.title, m.start_time
      FROM meetings m
      INNER JOIN meeting_participants mp ON m.id = mp.meeting_id
      WHERE mp.doctor_id = $1
      ORDER BY m.start_time DESC NULLS LAST
    `;

    const meetings = await this.pgConnection.query(meetingsQuery, [doctorId]);
    console.log(`[PrerequisitesService] ${meetings.length} réunions trouvées pour docteur ${doctorId}`);

    // 2. Pour chaque réunion, récupérer les prérequis depuis MongoDB
    const results = await Promise.all(
      meetings.map(async (meeting: any) => {
        try {
          console.log(`[PrerequisitesService] Recherche prérequis: meeting_id=${meeting.meeting_id}, doctor_id=${doctorId}`);
          
          // Récupérer les prérequis MongoDB
          const prereqs = await this.mongoDb
            .collection<MeetingPrerequisites>('meeting_prerequisites')
            .findOne({ meeting_id: meeting.meeting_id });

          if (!prereqs) {
            console.log(`[PrerequisitesService] Aucun prérequis trouvé pour meeting ${meeting.meeting_id}`);
            return null;
          }

          // Filtrer pour obtenir UNIQUEMENT les prérequis du docteur connecté
          const doctorPrereq = prereqs.doctors.find(d => d.doctor_id === doctorId);
          if (!doctorPrereq) {
            console.log(`[PrerequisitesService] Pas de prérequis pour docteur ${doctorId} dans meeting ${meeting.meeting_id}`);
            return null;
          }

          console.log(`[PrerequisitesService] ${doctorPrereq.items.length} prérequis trouvés pour ${doctorId}`);

          // Calculer l'avancement
          const progress = this.calculateProgress(doctorPrereq.items);

          return {
            meeting_id: meeting.meeting_id,
            patient_id: prereqs.patient_id,
            status: prereqs.status,
            doctors: [
              {
                ...doctorPrereq,
                progress,
              },
            ],
            globalProgress: progress,
          } as MeetingPrerequisitesResponse;
        } catch (error) {
          console.error(`[PrerequisitesService] Erreur pour meeting ${meeting.meeting_id}:`, error);
          return null;
        }
      }),
    );

    const validResults = results.filter(r => r !== null) as MeetingPrerequisitesResponse[];
    console.log(`[PrerequisitesService] Retour de ${validResults.length} réunions avec prérequis`);
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
    // Vérifier les permissions
    const permissions = await this.checkPermissions(meetingId, doctorId);
    if (!permissions.canView) {
      throw new ForbiddenException('Vous n\'avez pas accès à cette réunion');
    }

    // Mettre à jour MongoDB avec arrayFilters
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
    }

    // Vérifier si tous les prérequis sont complétés
    const updated = await this.mongoDb
      .collection<MeetingPrerequisites>('meeting_prerequisites')
      .findOne({ meeting_id: meetingId });

    if (updated) {
      const allCompleted = updated.doctors.every(doctor =>
        doctor.items.every(item => item.status === 'done'),
      );

      // Mettre à jour le statut global
      if (allCompleted) {
        await this.mongoDb.collection('meeting_prerequisites').updateOne(
          { meeting_id: meetingId },
          { $set: { status: 'ready' } },
        );
      }
    }

    // Retourner les prérequis mis à jour
    return this.getMeetingPrerequisites(meetingId, doctorId, permissions.canEdit);
  }

  /**
   * Vérifie si une réunion peut être lancée
   */
  async canLaunchMeeting(meetingId: string, doctorId: string): Promise<{ canLaunch: boolean; reason?: string }> {
    // Vérifier les permissions
    const permissions = await this.checkPermissions(meetingId, doctorId);
    if (!permissions.canLaunch) {
      return { canLaunch: false, reason: 'Vous n\'avez pas la permission de lancer cette réunion' };
    }

    // Vérifier l'état des prérequis
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

    // Mettre à jour PostgreSQL
    await this.pgConnection.query(
      `UPDATE meetings SET status = 'live' WHERE id = $1`,
      [meetingId],
    );

    return {
      success: true,
      message: 'Réunion lancée avec succès',
    };
  }

  /**
   * Reporte une réunion (update PostgreSQL)
   */
  async postponeMeeting(meetingId: string, doctorId: string): Promise<{ success: boolean; message: string }> {
    // Vérifier les permissions
    const permissions = await this.checkPermissions(meetingId, doctorId);
    if (!permissions.canEdit) {
      throw new ForbiddenException('Vous n\'avez pas la permission de reporter cette réunion');
    }

    // Mettre à jour PostgreSQL
    await this.pgConnection.query(
      `UPDATE meetings SET status = 'postponed' WHERE id = $1`,
      [meetingId],
    );

    return {
      success: true,
      message: 'Réunion reportée avec succès',
    };
  }

  /**
   * Récupère les détails complets d'une réunion avec participants et patient
   * TOUT depuis PostgreSQL + MongoDB (aucune donnée statique)
   */
  async getMeetingDetailsWithParticipants(meetingId: string, doctorId: string) {
    // 1️⃣ Vérifier les permissions
    const permissions = await this.checkPermissions(meetingId, doctorId);
    if (!permissions.canView) {
      throw new ForbiddenException('Vous n\'avez pas accès à cette réunion');
    }

    // 2️⃣ Récupérer les infos de la réunion + premier patient (PostgreSQL)
    // meetings n'a pas de colonne patient_id directe → on passe par meeting_patients
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
        s.name as speciality,
        mr.role as meeting_role
      FROM meeting_participants mp
      INNER JOIN doctors d ON mp.doctor_id = d.doctorid
      LEFT JOIN specialties s ON d.speciality_id = s.id
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
      // Trouver les prérequis de ce médecin dans MongoDB
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
        meeting_role: participant.meeting_role || 'participant', // Si pas de rôle => participant
        items: items,
        progress: {
          completed,
          total,
          percentage,
        },
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
   * Récupère la liste des réunions du médecin connecté
   * Pour afficher dans la page Meetings (TOUT dynamique)
   */
  async getMyMeetings(doctorId: string) {
    // Récupérer les meetings où le médecin participe (PostgreSQL)
    const query = `
      SELECT DISTINCT
        m.id,
        m.title,
        m.description,
        m.start_time,
        m.status,
        p.patient_id,
        p.code_patient,
        p.firstname as patient_firstname,
        p.lastname as patient_lastname,
        (SELECT COUNT(*) FROM meeting_participants mp2 WHERE mp2.meeting_id = m.id) as participants_count
      FROM meetings m
      INNER JOIN meeting_participants mp ON m.id = mp.meeting_id
      LEFT JOIN patients p ON m.patient_id = p.patient_id
      WHERE mp.doctor_id = $1
        AND m.status IN ('scheduled', 'pending', 'in_progress')
      ORDER BY m.start_time DESC
    `;

    const meetings = await this.pgConnection.query(query, [doctorId]);

    // Enrichir chaque meeting avec les prérequis
    const enrichedMeetings = await Promise.all(
      meetings.map(async (meeting: any) => {
        // Récupérer les prérequis MongoDB
        const prerequisites = await this.mongoDb
          .collection<MeetingPrerequisites>('meeting_prerequisites')
          .findOne({ meeting_id: meeting.id });

        if (!prerequisites) {
          return {
            ...meeting,
            patient_fullname: meeting.patient_firstname && meeting.patient_lastname
              ? `${meeting.patient_firstname} ${meeting.patient_lastname}`
              : null,
            global_progress: { completed: 0, total: 0, percentage: 0 },
          };
        }

        // Calculer l'avancement global
        const allItems = prerequisites.doctors.flatMap((d) => d.items);
        const completed = allItems.filter((item) => item.status === 'done').length;
        const total = allItems.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          ...meeting,
          patient_fullname: meeting.patient_firstname && meeting.patient_lastname
            ? `${meeting.patient_firstname} ${meeting.patient_lastname}`
            : null,
          global_progress: {
            completed,
            total,
            percentage,
          },
        };
      }),
    );

    return enrichedMeetings;
  }
}
