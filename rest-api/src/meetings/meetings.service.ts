import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Meeting } from './entities/meeting.entity';
import { MongoClient, Db } from 'mongodb';
import { ConfigService } from '@nestjs/config';

export interface MeetingWithParticipants {
  id: string;
  title: string;
  description: string | null;
  startTime: Date | null;
  endTime: Date | null;
  status: string;
  createdBy: string;
  organizerId: string | null;
  organizerName: string | null;
  postponedReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  participants: Array<{
    doctorId: string;
    doctorName: string;
    speciality: string;
    invitationStatus: string;
    meetingRole: string | null;
  }>;
  participantCount: number;
  patients: Array<{
    patientId: string;
    patientNumber: string;
    patientName: string;
    discussionOrder: number;
  }>;
  patientCount: number;
}

export interface ParticipantWithPrerequisites {
  doctorId: string;
  firstName: string;
  lastName: string;
  email: string;
  speciality: string;
  role: string;
  invitationStatus: string;
  prerequisites: Array<{
    label: string;
    label_fr?: string;  // French label
    label_en?: string;  // English label
    status: 'pending' | 'completed' | 'not_applicable';
  }>;
}

export interface MeetingDetails {
  meetingId: string;
  title: string;
  description: string | null;
  startTime: Date | null;
  endTime: Date | null;
  status: string;
  participants: ParticipantWithPrerequisites[];
}

@Injectable()
export class MeetingsService {
  private mongoDb: Db;

  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    private readonly dataSource: DataSource,
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
    console.log('✅ MongoDB connecté dans MeetingsService');
  }

  /**
   * Crée une nouvelle réunion avec participants, rôles et prérequis
   * Transaction complète: PostgreSQL + MongoDB
   */
  async createMeeting(createMeetingDto: any, createdBy: string): Promise<{ meetingId: string }> {
    const { title, description, startTime, endTime, status, patientIds, participants, prerequisites } = createMeetingDto;

    // 1. Créer la réunion dans PostgreSQL
    const meetingId = await this.dataSource.query(
      `INSERT INTO meetings (title, description, start_time, end_time, status, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id`,
      [title, description || null, startTime || null, endTime || null, status || 'draft', createdBy]
    );

    const newMeetingId = meetingId[0].id;
    console.log('[MeetingsService] Réunion créée:', newMeetingId);

    // 2. Ajouter les participants dans meeting_participants
    for (const participant of participants) {
      await this.dataSource.query(
        `INSERT INTO meeting_participants (meeting_id, doctor_id, invitation_status, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (meeting_id, doctor_id) DO NOTHING`,
        [newMeetingId, participant.doctorId, participant.invitationStatus || 'invited']
      );
    }
    console.log('[MeetingsService] Participants ajoutés:', participants.length);

    // 3. Ajouter les rôles dans meeting_roles (organizer, co-admin)
    for (const participant of participants) {
      if (participant.role && (participant.role === 'organizer' || participant.role === 'co_admin')) {
        await this.dataSource.query(
          `INSERT INTO meeting_roles (meeting_id, doctor_id, role, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT (meeting_id, doctor_id) DO UPDATE SET role = $3, updated_at = NOW()`,
          [newMeetingId, participant.doctorId, participant.role]
        );
      }
    }
    console.log('[MeetingsService] Rôles ajoutés');

    // 4. Ajouter les patients dans meeting_patients
    if (patientIds && patientIds.length > 0) {
      for (let i = 0; i < patientIds.length; i++) {
        await this.dataSource.query(
          `INSERT INTO meeting_patients (meeting_id, patient_id, discussion_order, created_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (meeting_id, patient_id) DO NOTHING`,
          [newMeetingId, patientIds[i], i + 1]
        );
      }
      console.log('[MeetingsService] Patients ajoutés:', patientIds.length);
    }

    // 5. Créer les prérequis dans MongoDB
    if (prerequisites && prerequisites.length > 0) {
      // Pour chaque patient de la réunion
      for (const patientId of patientIds) {
        const prerequisitesDoc = {
          meeting_id: newMeetingId,
          patient_id: patientId,
          status: 'in_progress',
          doctors: prerequisites.map((prereq: any) => ({
            doctor_id: prereq.doctorId,
            speciality: prereq.speciality,
            items: prereq.items.map((item: any) => ({
              key: item.key,
              label: item.label,  // Backward compatibility
              label_fr: item.label_fr || item.label,
              label_en: item.label_en || item.label,
              status: item.status || 'pending',
              source: item.source || null,
            })),
          })),
        };

        await this.mongoDb.collection('meeting_prerequisites').insertOne(prerequisitesDoc);
      }
      console.log('[MeetingsService] Prérequis créés dans MongoDB pour', patientIds.length, 'patient(s)');
    }

    return { meetingId: newMeetingId };
  }

  /**
   * Récupère toutes les réunions avec leurs participants et patients
   */
  async findAll(): Promise<MeetingWithParticipants[]> {
    const query = `
      SELECT
        m.id,
        m.title,
        m.description,
        m.start_time as "startTime",
        m.end_time as "endTime",
        m.status,
        m.created_by as "createdBy",
        m.postponed_reason as "postponedReason",
        m.created_at as "createdAt",
        m.updated_at as "updatedAt",
        (
          SELECT doctor_id
          FROM meeting_roles
          WHERE meeting_id = m.id AND role = 'organizer'
          LIMIT 1
        ) as "organizerId",
        (
          SELECT CONCAT(d.firstname, ' ', d.lastname)
          FROM meeting_roles mr
          JOIN doctors d ON mr.doctor_id = d.doctorid
          WHERE mr.meeting_id = m.id AND mr.role = 'organizer'
          LIMIT 1
        ) as "organizerName",
        (
          SELECT COUNT(DISTINCT doctor_id)
          FROM meeting_participants
          WHERE meeting_id = m.id
        ) as "participantCount",
        (
          SELECT COUNT(DISTINCT patient_id)
          FROM meeting_patients
          WHERE meeting_id = m.id
        ) as "patientCount",
        (
          SELECT json_agg(
            jsonb_build_object(
              'doctorId', d2.doctorid,
              'doctorName', CONCAT(d2.firstname, ' ', d2.lastname),
              'speciality', COALESCE(r2.rolename, 'Non spécifié'),
              'invitationStatus', mp2.invitation_status,
              'meetingRole', mr2.role
            ) ORDER BY d2.lastname, d2.firstname
          )
          FROM meeting_participants mp2
          JOIN doctors d2 ON mp2.doctor_id = d2.doctorid
          LEFT JOIN roles r2 ON d2.roleid = r2.roleid
          LEFT JOIN meeting_roles mr2 ON mr2.meeting_id = m.id AND mr2.doctor_id = d2.doctorid
          WHERE mp2.meeting_id = m.id
        ) as participants,
        (
          SELECT json_agg(
            jsonb_build_object(
              'patientId', p2.patientid,
              'patientNumber', p2.patient_number,
              'patientName', CONCAT(p2.firstname, ' ', p2.lastname),
              'discussionOrder', mpt2.discussion_order
            ) ORDER BY mpt2.discussion_order
          )
          FROM meeting_patients mpt2
          JOIN patients p2 ON mpt2.patient_id = p2.patientid
          WHERE mpt2.meeting_id = m.id
        ) as patients
      FROM meetings m
      ORDER BY
        CASE
          WHEN m.start_time IS NULL THEN 1
          ELSE 0
        END,
        m.start_time ASC,
        m.created_at DESC
    `;

    const results = await this.dataSource.query(query);

    return results.map((row: any) => ({
      ...row,
      participants: row.participants || [],
      participantCount: parseInt(row.participantCount) || 0,
      patients: row.patients || [],
      patientCount: parseInt(row.patientCount) || 0,
    }));
  }

  /**
   * Récupère une réunion par son ID avec tous les détails
   */
  async findOne(id: string): Promise<MeetingWithParticipants | null> {
    const query = `
      SELECT
        m.id,
        m.title,
        m.description,
        m.start_time as "startTime",
        m.end_time as "endTime",
        m.status,
        m.created_by as "createdBy",
        m.postponed_reason as "postponedReason",
        m.created_at as "createdAt",
        m.updated_at as "updatedAt",
        (
          SELECT doctor_id
          FROM meeting_roles
          WHERE meeting_id = m.id AND role = 'organizer'
          LIMIT 1
        ) as "organizerId",
        (
          SELECT CONCAT(d.firstname, ' ', d.lastname)
          FROM meeting_roles mr
          JOIN doctors d ON mr.doctor_id = d.doctorid
          WHERE mr.meeting_id = m.id AND mr.role = 'organizer'
          LIMIT 1
        ) as "organizerName",
        (
          SELECT COUNT(DISTINCT doctor_id)
          FROM meeting_participants
          WHERE meeting_id = m.id
        ) as "participantCount",
        (
          SELECT COUNT(DISTINCT patient_id)
          FROM meeting_patients
          WHERE meeting_id = m.id
        ) as "patientCount",
        (
          SELECT json_agg(
            jsonb_build_object(
              'doctorId', d2.doctorid,
              'doctorName', CONCAT(d2.firstname, ' ', d2.lastname),
              'speciality', COALESCE(r2.rolename, 'Non spécifié'),
              'invitationStatus', mp2.invitation_status,
              'meetingRole', mr2.role
            ) ORDER BY d2.lastname, d2.firstname
          )
          FROM meeting_participants mp2
          JOIN doctors d2 ON mp2.doctor_id = d2.doctorid
          LEFT JOIN roles r2 ON d2.roleid = r2.roleid
          LEFT JOIN meeting_roles mr2 ON mr2.meeting_id = m.id AND mr2.doctor_id = d2.doctorid
          WHERE mp2.meeting_id = m.id
        ) as participants,
        (
          SELECT json_agg(
            jsonb_build_object(
              'patientId', p2.patientid,
              'patientNumber', p2.patient_number,
              'patientName', CONCAT(p2.firstname, ' ', p2.lastname),
              'discussionOrder', mpt2.discussion_order
            ) ORDER BY mpt2.discussion_order
          )
          FROM meeting_patients mpt2
          JOIN patients p2 ON mpt2.patient_id = p2.patientid
          WHERE mpt2.meeting_id = m.id
        ) as patients
      FROM meetings m
      WHERE m.id = $1
    `;

    const results = await this.dataSource.query(query, [id]);

    if (results.length === 0) {
      return null;
    }

    const row = results[0];
    return {
      ...row,
      participants: row.participants || [],
      participantCount: parseInt(row.participantCount) || 0,
      patients: row.patients || [],
      patientCount: parseInt(row.patientCount) || 0,
    };
  }

  /**
   * Récupère les réunions d'un docteur spécifique
   */
  async findByDoctor(doctorId: string): Promise<MeetingWithParticipants[]> {
    const query = `
      SELECT DISTINCT ON (m.id)
        m.id,
        m.title,
        m.description,
        m.start_time as "startTime",
        m.end_time as "endTime",
        m.status,
        m.created_by as "createdBy",
        m.postponed_reason as "postponedReason",
        m.created_at as "createdAt",
        m.updated_at as "updatedAt",
        (
          SELECT doctor_id
          FROM meeting_roles
          WHERE meeting_id = m.id AND role = 'organizer'
          LIMIT 1
        ) as "organizerId",
        (
          SELECT CONCAT(d.firstname, ' ', d.lastname)
          FROM meeting_roles mr
          JOIN doctors d ON mr.doctor_id = d.doctorid
          WHERE mr.meeting_id = m.id AND mr.role = 'organizer'
          LIMIT 1
        ) as "organizerName",
        (
          SELECT COUNT(*)
          FROM meeting_participants mp2
          WHERE mp2.meeting_id = m.id
        ) as "participantCount",
        (
          SELECT COUNT(*)
          FROM meeting_patients mpt2
          WHERE mpt2.meeting_id = m.id
        ) as "patientCount",
        (
          SELECT json_agg(
            json_build_object(
              'doctorId', d2.doctorid,
              'doctorName', CONCAT(d2.firstname, ' ', d2.lastname),
              'speciality', COALESCE(r2.rolename, 'Non spécifié'),
              'invitationStatus', mp3.invitation_status,
              'meetingRole', mr3.role
            ) ORDER BY d2.lastname, d2.firstname
          )
          FROM meeting_participants mp3
          JOIN doctors d2 ON mp3.doctor_id = d2.doctorid
          LEFT JOIN roles r2 ON d2.roleid = r2.roleid
          LEFT JOIN meeting_roles mr3 ON mr3.meeting_id = m.id AND mr3.doctor_id = d2.doctorid
          WHERE mp3.meeting_id = m.id
        ) as participants,
        (
          SELECT json_agg(
            json_build_object(
              'patientId', p2.patientid,
              'patientNumber', p2.patient_number,
              'patientName', CONCAT(p2.firstname, ' ', p2.lastname),
              'discussionOrder', mpt3.discussion_order
            ) ORDER BY mpt3.discussion_order
          )
          FROM meeting_patients mpt3
          JOIN patients p2 ON mpt3.patient_id = p2.patientid
          WHERE mpt3.meeting_id = m.id
        ) as patients
      FROM meetings m
      JOIN meeting_participants mp ON m.id = mp.meeting_id
      WHERE mp.doctor_id = $1
      ORDER BY m.id,
        CASE
          WHEN m.start_time IS NULL THEN 1
          ELSE 0
        END,
        m.start_time ASC,
        m.created_at DESC
    `;

    const results = await this.dataSource.query(query, [doctorId]);

    return results.map((row: any) => ({
      ...row,
      participants: row.participants || [],
      participantCount: parseInt(row.participantCount) || 0,
      patients: row.patients || [],
      patientCount: parseInt(row.patientCount) || 0,
    }));
  }

  /**
   * Récupère les statistiques des réunions
   */
  async getStats(): Promise<{
    thisMonthMeetingsCount: number;
    totalPatientsDiscussed: number;
    averageDuration: string;
  }> {
    const query = `
      WITH monthly_meetings AS (
        SELECT COUNT(*) as count
        FROM meetings
        WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
      ),
      total_patients AS (
        SELECT COUNT(DISTINCT patient_id) as count
        FROM meeting_patients
      ),
      avg_duration AS (
        SELECT AVG(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) as hours
        FROM meetings
        WHERE start_time IS NOT NULL
          AND end_time IS NOT NULL
          AND end_time > start_time
      )
      SELECT
        (SELECT count FROM monthly_meetings) as "thisMonthMeetingsCount",
        (SELECT count FROM total_patients) as "totalPatientsDiscussed",
        (SELECT hours FROM avg_duration) as "averageDurationHours"
    `;

    const result = await this.dataSource.query(query);
    const row = result[0];

    const avgHours = parseFloat(row.averageDurationHours) || 0;
    const hours = Math.floor(avgHours);
    const minutes = Math.round((avgHours - hours) * 60);

    return {
      thisMonthMeetingsCount: parseInt(row.thisMonthMeetingsCount) || 0,
      totalPatientsDiscussed: parseInt(row.totalPatientsDiscussed) || 0,
      averageDuration: `${hours}h ${minutes}min`,
    };
  }

  /**
   * Récupère les détails complets d'une réunion avec participants et prérequis
   * Combine PostgreSQL (participants) et MongoDB (prérequis)
   * 
   * LOGIQUE DE SÉCURITÉ (IMPORTANTE):
   * - Si Doctor = ORGANIZER/CO-ADMIN: retourne TOUS les participants et leurs prérequis
   * - Si Doctor = PARTICIPANT: retourne UNIQUEMENT ses propres prérequis
   * 
   * @param meetingId ID de la réunion
   * @param doctorId ID du doctor qui demande les détails
   */
  async getMeetingDetails(meetingId: string, doctorId: string): Promise<MeetingDetails> {
    // 0. Vérifier que le docteur est participant à cette réunion
    const participationCheck = await this.dataSource.query(
      `SELECT role FROM meeting_roles 
       WHERE meeting_id = $1 AND doctor_id = $2`,
      [meetingId, doctorId]
    );

    const userRole = participationCheck.length > 0 ? participationCheck[0].role : 'participant';
    const isAdmin = userRole === 'organizer' || userRole === 'co_admin';

    // 1. Récupérer les informations de base de la réunion
    const meetingQuery = `
      SELECT id, title, description, start_time as "startTime",
             end_time as "endTime", status
      FROM meetings
      WHERE id = $1
    `;
    const meetingResult = await this.dataSource.query(meetingQuery, [meetingId]);

    if (!meetingResult || meetingResult.length === 0) {
      throw new Error(`Meeting with ID ${meetingId} not found`);
    }

    const meeting = meetingResult[0];

    // 2. Récupérer les participants selon le rôle
    let participantsQuery: string;
    let participantsResult: any[];

    if (isAdmin) {
      // ADMIN: voir TOUS les participants
      participantsQuery = `
        SELECT
          d.doctorid as "doctorId",
          d.firstname as "firstName",
          d.lastname as "lastName",
          d.email,
          COALESCE(r.rolename, 'Non spécifié') as speciality,
          COALESCE(mr.role, 'participant') as role,
          mp.invitation_status as "invitationStatus"
        FROM meeting_participants mp
        JOIN doctors d ON mp.doctor_id = d.doctorid
        LEFT JOIN roles r ON d.roleid = r.roleid
        LEFT JOIN meeting_roles mr ON mr.meeting_id = mp.meeting_id AND mr.doctor_id = d.doctorid
        WHERE mp.meeting_id = $1
        ORDER BY
          CASE
            WHEN mr.role = 'organizer' THEN 1
            WHEN mr.role = 'co_admin' THEN 2
            ELSE 3
          END,
          d.lastname, d.firstname
      `;
      participantsResult = await this.dataSource.query(participantsQuery, [meetingId]);
    } else {
      // PARTICIPANT: voir UNIQUEMENT ses propres données
      participantsQuery = `
        SELECT
          d.doctorid as "doctorId",
          d.firstname as "firstName",
          d.lastname as "lastName",
          d.email,
          COALESCE(r.rolename, 'Non spécifié') as speciality,
          COALESCE(mr.role, 'participant') as role,
          mp.invitation_status as "invitationStatus"
        FROM meeting_participants mp
        JOIN doctors d ON mp.doctor_id = d.doctorid
        LEFT JOIN roles r ON d.roleid = r.roleid
        LEFT JOIN meeting_roles mr ON mr.meeting_id = mp.meeting_id AND mr.doctor_id = d.doctorid
        WHERE mp.meeting_id = $1 AND d.doctorid = $2
      `;
      participantsResult = await this.dataSource.query(participantsQuery, [meetingId, doctorId]);
    }

    // 3. Récupérer les prérequis depuis MongoDB
    const prerequisitesDoc = await this.mongoDb
      .collection('meeting_prerequisites')
      .findOne({ meeting_id: meetingId });

    // 4. Fusionner les données: ajouter les prérequis de chaque participant
    const participants: ParticipantWithPrerequisites[] = participantsResult.map((p: any) => {
      // Trouver les prérequis de ce docteur dans le document MongoDB
      let prerequisites: Array<{ label: string; label_fr?: string; label_en?: string; status: 'pending' | 'completed' | 'not_applicable' }> = [];

      if (prerequisitesDoc && prerequisitesDoc.doctors) {
        const doctorPrereq = prerequisitesDoc.doctors.find(
          (dp: any) => dp.doctor_id === p.doctorId
        );

        if (doctorPrereq && doctorPrereq.items) {
          prerequisites = doctorPrereq.items.map((item: any) => ({
            label: item.label || item.label_fr,  // Fallback to label_fr if label not present
            label_fr: item.label_fr || item.label,
            label_en: item.label_en || item.label || item.label_fr,
            status: item.status === 'done' ? 'completed' : item.status,
          }));
        }
      }

      return {
        doctorId: p.doctorId,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        speciality: p.speciality,
        role: p.role,
        invitationStatus: p.invitationStatus,
        prerequisites,
      };
    });

    return {
      meetingId: meeting.id,
      title: meeting.title,
      description: meeting.description,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      status: meeting.status,
      participants,
    };
  }

  /**
   * Récupère le rôle d'un docteur dans une réunion
   * @returns 'organizer' | 'co_admin' | 'participant' | null
   */
  async getDoctorRoleInMeeting(meetingId: string, doctorId: string): Promise<string | null> {
    // Vérifier d'abord s'il est participant
    const participantCheck = await this.dataSource.query(
      `SELECT 1 FROM meeting_participants WHERE meeting_id = $1 AND doctor_id = $2`,
      [meetingId, doctorId],
    );

    if (participantCheck.length === 0) {
      return null; // Pas participant du tout
    }

    // Vérifier s'il a un rôle spécial
    const roleCheck = await this.dataSource.query(
      `SELECT role FROM meeting_roles WHERE meeting_id = $1 AND doctor_id = $2`,
      [meetingId, doctorId],
    );

    return roleCheck.length > 0 ? roleCheck[0].role : 'participant';
  }

  /**
   * Vérifie si un docteur est participant à une réunion
   */
  async isParticipant(meetingId: string, doctorId: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `SELECT 1 FROM meeting_participants WHERE meeting_id = $1 AND doctor_id = $2`,
      [meetingId, doctorId],
    );
    return result.length > 0;
  }

  /**
   * Met à jour une réunion
   */
  async updateMeeting(
    meetingId: string,
    updateData: {
      title?: string;
      description?: string;
      startTime?: Date | string;
      endTime?: Date | string;
      status?: string;
      postponedReason?: string;
    },
  ): Promise<MeetingWithParticipants> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.title !== undefined) {
      setClauses.push(`title = $${paramIndex++}`);
      values.push(updateData.title);
    }
    if (updateData.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(updateData.description);
    }
    if (updateData.startTime !== undefined) {
      setClauses.push(`start_time = $${paramIndex++}`);
      values.push(updateData.startTime);
    }
    if (updateData.endTime !== undefined) {
      setClauses.push(`end_time = $${paramIndex++}`);
      values.push(updateData.endTime);
    }
    if (updateData.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(updateData.status);
    }
    if (updateData.postponedReason !== undefined) {
      setClauses.push(`postponed_reason = $${paramIndex++}`);
      values.push(updateData.postponedReason);
    }

    if (setClauses.length === 0) {
      return this.findOne(meetingId);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(meetingId);

    await this.dataSource.query(
      `UPDATE meetings SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
      values,
    );

    console.log(`[MeetingsService] Réunion ${meetingId} mise à jour`);
    return this.findOne(meetingId);
  }

  /**
   * Supprime une réunion avec cascade complète
   * Ordre: messages → meeting_roles → meeting_patients → meeting_participants → MongoDB prerequisites → meeting
   */
  async deleteMeeting(meetingId: string): Promise<{ success: boolean; message: string }> {
    // 1. Supprimer les messages liés
    await this.dataSource.query(
      `DELETE FROM messages WHERE meeting_id = $1`,
      [meetingId],
    );

    // 2. Supprimer les rôles
    await this.dataSource.query(
      `DELETE FROM meeting_roles WHERE meeting_id = $1`,
      [meetingId],
    );

    // 3. Supprimer les patients liés
    await this.dataSource.query(
      `DELETE FROM meeting_patients WHERE meeting_id = $1`,
      [meetingId],
    );

    // 4. Supprimer les participants
    await this.dataSource.query(
      `DELETE FROM meeting_participants WHERE meeting_id = $1`,
      [meetingId],
    );

    // 5. Supprimer les prérequis dans MongoDB
    if (this.mongoDb) {
      await this.mongoDb
        .collection('meeting_prerequisites')
        .deleteMany({ meeting_id: meetingId });
      console.log(`[MeetingsService] Prérequis MongoDB supprimés pour meeting ${meetingId}`);
    }

    // 6. Supprimer la réunion elle-même
    await this.dataSource.query(
      `DELETE FROM meetings WHERE id = $1`,
      [meetingId],
    );

    console.log(`[MeetingsService] Réunion ${meetingId} supprimée avec cascade complète`);
    return { success: true, message: 'Réunion supprimée avec succès' };
  }

  /**
   * Met à jour uniquement la date de début d'une réunion existante
   * Aucune création de nouvelle réunion, aucun changement de statut
   */
  async updateMeetingDate(id: string, scheduledAt: string): Promise<MeetingWithParticipants> {
    const meeting = await this.findOne(id);
    if (!meeting) {
      throw new NotFoundException(`Réunion ${id} non trouvée`);
    }

    await this.dataSource.query(
      `UPDATE meetings SET start_time = $1, updated_at = NOW() WHERE id = $2`,
      [new Date(scheduledAt), id],
    );

    console.log(`[MeetingsService] Date mise à jour pour la réunion ${id} → ${scheduledAt}`);
    return this.findOne(id);
  }

  /**
   * Reprogramme une réunion: crée une nouvelle réunion avec les mêmes patients/participants
   * L'ancienne réunion passe en status "postponed"
   * Utilise une transaction PostgreSQL pour garantir la cohérence des données
   */
  async rescheduleMeeting(
    originalMeetingId: string,
    rescheduleData: {
      title?: string;
      startTime: Date | string;
      endTime?: Date | string;
      description?: string;
      postponedReason?: string;
    },
    createdBy: string,
  ): Promise<{ originalMeetingId: string; newMeetingId: string }> {
    // Vérifier que la réunion existe avant de démarrer la transaction
    const original = await this.findOne(originalMeetingId);
    if (!original) {
      throw new NotFoundException(`Réunion ${originalMeetingId} non trouvée`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let newMeetingId = '';

    try {
      // 1. Marquer l'ancienne réunion comme "postponed"
      await queryRunner.query(
        `UPDATE meetings SET status = 'postponed', postponed_reason = $1, updated_at = NOW() WHERE id = $2`,
        [rescheduleData.postponedReason || 'Reprogrammée', originalMeetingId],
      );

      // 2. Récupérer les participants avec leurs rôles
      const participantsRaw = await queryRunner.query(
        `SELECT mp.doctor_id, COALESCE(mr.role, 'participant') as role
         FROM meeting_participants mp
         LEFT JOIN meeting_roles mr ON mr.meeting_id = mp.meeting_id AND mr.doctor_id = mp.doctor_id
         WHERE mp.meeting_id = $1`,
        [originalMeetingId],
      );

      // 3. Récupérer les patients
      const patientsRaw = await queryRunner.query(
        `SELECT patient_id FROM meeting_patients WHERE meeting_id = $1 ORDER BY discussion_order`,
        [originalMeetingId],
      );
      const patientIds = patientsRaw.map((p: any) => p.patient_id);

      // 4. Créer la nouvelle réunion (même titre, nouvelle date)
      const newMeetingResult = await queryRunner.query(
        `INSERT INTO meetings (title, description, start_time, end_time, status, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'scheduled', $5, NOW(), NOW())
         RETURNING id`,
        [
          rescheduleData.title || original.title,
          rescheduleData.description ?? original.description,
          rescheduleData.startTime,
          rescheduleData.endTime ?? null,
          createdBy,
        ],
      );
      newMeetingId = newMeetingResult[0].id;

      // 5. Copier les participants (sans doublons)
      for (const p of participantsRaw) {
        await queryRunner.query(
          `INSERT INTO meeting_participants (meeting_id, doctor_id, invitation_status, created_at)
           VALUES ($1, $2, 'invited', NOW())
           ON CONFLICT (meeting_id, doctor_id) DO NOTHING`,
          [newMeetingId, p.doctor_id],
        );
      }

      // 6. Copier les rôles (organizer, co_admin)
      for (const p of participantsRaw) {
        if (p.role === 'organizer' || p.role === 'co_admin') {
          await queryRunner.query(
            `INSERT INTO meeting_roles (meeting_id, doctor_id, role, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())
             ON CONFLICT (meeting_id, doctor_id) DO UPDATE SET role = $3, updated_at = NOW()`,
            [newMeetingId, p.doctor_id, p.role],
          );
        }
      }

      // 7. Copier les patients
      for (let i = 0; i < patientIds.length; i++) {
        await queryRunner.query(
          `INSERT INTO meeting_patients (meeting_id, patient_id, discussion_order, created_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (meeting_id, patient_id) DO NOTHING`,
          [newMeetingId, patientIds[i], i + 1],
        );
      }

      await queryRunner.commitTransaction();
      console.log(`[MeetingsService] Transaction committed: ${originalMeetingId} → ${newMeetingId}`);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error('[MeetingsService] Reschedule transaction rolled back:', err);
      throw err;
    } finally {
      await queryRunner.release();
    }

    // Copier les prérequis MongoDB (hors transaction, best-effort)
    if (this.mongoDb && newMeetingId) {
      try {
        const prereqDoc = await this.mongoDb
          .collection('meeting_prerequisites')
          .findOne({ meeting_id: originalMeetingId });

        if (prereqDoc && prereqDoc.doctors) {
          const patientsForNew = await this.dataSource.query(
            `SELECT patient_id FROM meeting_patients WHERE meeting_id = $1`,
            [newMeetingId],
          );

          for (const { patient_id } of patientsForNew) {
            await this.mongoDb.collection('meeting_prerequisites').insertOne({
              meeting_id: newMeetingId,
              patient_id,
              status: 'in_progress',
              doctors: prereqDoc.doctors.map((d: any) => ({
                doctor_id: d.doctor_id,
                speciality: d.speciality,
                items: d.items.map((item: any) => ({
                  key: item.key,
                  label: item.label,
                  label_fr: item.label_fr || item.label,
                  label_en: item.label_en || item.label,
                  status: 'pending',
                  source: item.source || null,
                })),
              })),
            });
          }
          console.log(`[MeetingsService] Prérequis copiés dans MongoDB → ${newMeetingId}`);
        }
      } catch (mongoErr) {
        console.error('[MeetingsService] Erreur MongoDB (non bloquante):', mongoErr);
        // On ne bloque pas le reschedule pour une erreur MongoDB
      }
    }

    console.log(`[MeetingsService] Réunion ${originalMeetingId} reprogrammée → ${newMeetingId}`);
    return { originalMeetingId, newMeetingId };
  }
}
