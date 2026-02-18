import { Controller, Get, UseGuards, Request, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DataSource } from 'typeorm';

@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Récupère TOUS les patients (pour admin)
   * GET /patients
   */
  @Get()
  async findAll() {
    const patients = await this.dataSource.query(`
      SELECT
        patientid as "patientId",
        patient_number as "patientNumber",
        firstname as "firstName",
        lastname as "lastName",
        dateofbirth as "dateOfBirth",
        sex
      FROM patients
      ORDER BY lastname, firstname
    `);
    return patients;
  }

  /**
   * Récupère les DOSSIERS du doctor connecté (dossiers patients pour lesquels il est responsable)
   * GET /patients/dossiers/list
   * 
   * Structure: Patient + meeting_patients pour lier aux réunions RCP
   */
  @Get('dossiers/list')
  async getDossiersList(@Request() req: any) {
    const doctorId = req.user.doctorID || req.user.sub;

    const dossiers = await this.dataSource.query(
      `SELECT DISTINCT
        p.patientid as "patientId",
        p.firstname as "firstName",
        p.lastname as "lastName",
        p.patient_number as "patientNumber",
        p.dateofbirth as "dateOfBirth",
        p.sex,
        p.created_at as "createdAt",
        mpart.doctor_id as "responsibleDoctor",
        d.firstname as "doctorFirstName",
        d.lastname as "doctorLastName",
        m.id as "meetingId",
        m.title as "meetingTitle",
        m.status as "meetingStatus",
        m.updated_at as "lastModified"
      FROM patients p
      LEFT JOIN meeting_patients mp ON p.patientid = mp.patient_id
      LEFT JOIN meetings m ON mp.meeting_id = m.id
      LEFT JOIN meeting_participants mpart ON m.id = mpart.meeting_id
      LEFT JOIN doctors d ON mpart.doctor_id = d.doctorid
      WHERE mpart.doctor_id = $1 OR m.id IN (
        SELECT meeting_id FROM meeting_participants WHERE doctor_id = $1
      )
      ORDER BY p.lastname, p.firstname, m.updated_at DESC`,
      [doctorId]
    );

    return dossiers;
  }

  /**
   * Récupère les STATS pour le dashboard (nombre de dossiers, statuts, etc.)
   * GET /patients/stats/dashboard
   */
  @Get('stats/dashboard')
  async getDashboardStats(@Request() req: any) {
    const doctorId = req.user.doctorID || req.user.sub;

    // Nombre de dossiers actifs
    const activeDossiers = await this.dataSource.query(
      `SELECT COUNT(DISTINCT p.patientid) as count
       FROM patients p
       LEFT JOIN meeting_patients mp ON p.patientid = mp.patient_id
       LEFT JOIN meetings m ON mp.meeting_id = m.id
       LEFT JOIN meeting_participants mpart ON m.id = mpart.meeting_id
       WHERE mpart.doctor_id = $1`,
      [doctorId]
    );

    // Stats par statut de réunion
    const statusStats = await this.dataSource.query(
      `SELECT 
        m.status as status,
        COUNT(DISTINCT p.patientid) as count
       FROM patients p
       LEFT JOIN meeting_patients mp ON p.patientid = mp.patient_id
       LEFT JOIN meetings m ON mp.meeting_id = m.id
       LEFT JOIN meeting_participants mpart ON m.id = mpart.meeting_id
       WHERE mpart.doctor_id = $1
       GROUP BY m.status`,
      [doctorId]
    );

    return {
      activeDossiers: activeDossiers[0]?.count || 0,
      statusStats: statusStats || [],
    };
  }

  /**
   * Récupère la liste complète des patients avec prise_en_charge (pour table)
   * GET /patients/prise-en-charge/table
   * Structure:
   * - patientName (firstname + lastname)
   * - patientId (patient_number)
   * - type (prise_en_charge_patient.type)
   * - status (status.label)
   * - lastModified (prise_en_charge_patient.date_modification)
   * - responsable (doctors.firstname + lastname)
   */
  @Get('prise-en-charge/table')
  async getPatientsTable() {
    const patients = await this.dataSource.query(
      `SELECT DISTINCT ON (p.patientid)
        p.patientid as "patientId",
        p.firstname as "firstName",
        p.lastname as "lastName",
        p.patient_number as "patientNumber",
        COALESCE(pec.type, '') as type,
        COALESCE(s.label, 'en_attente') as status,
        pec.date_modification as "dateModification",
        COALESCE(d.firstname, '') as "doctorFirstName",
        COALESCE(d.lastname, '') as "doctorLastName"
      FROM patients p
      LEFT JOIN prise_en_charge_patient pec ON pec.patientid = p.patientid
      LEFT JOIN doctors d ON pec.responsableid = d.doctorid
      LEFT JOIN status s ON pec.status_id = s.status_id
      ORDER BY p.patientid, p.lastname, p.firstname`
    );

    return patients;
  }

  /**
   * Récupère un DOSSIER spécifique par ID
   * GET /patients/:patientId
   */
  @Get(':patientId')
  async getDossierDetail(@Param('patientId') patientId: string) {
    const patient = await this.dataSource.query(
      `SELECT
        p.patientid as "patientId",
        p.firstname as "firstName",
        p.lastname as "lastName",
        p.patient_number as "patientNumber",
        p.dateofbirth as "dateOfBirth",
        p.sex,
        p.created_at as "createdAt",
        EXTRACT(YEAR FROM AGE(NOW(), p.dateofbirth))::int as age
      FROM patients p
      WHERE p.patientid = $1`,
      [patientId]
    );

    if (!patient || patient.length === 0) {
      return null;
    }

    const patient_data = patient[0];

    // Récupérer les réunions associées à ce patient
    const meetings = await this.dataSource.query(
      `SELECT
        m.id as "meetingId",
        m.title as "meetingTitle",
        m.status as "status",
        m.updated_at as "lastModified",
        d.doctorid as "responsibleDoctorId",
        d.firstname as "doctorFirstName",
        d.lastname as "doctorLastName"
      FROM meetings m
      LEFT JOIN meeting_patients mp ON m.id = mp.meeting_id
      LEFT JOIN meeting_participants mpart ON m.id = mpart.meeting_id
      LEFT JOIN doctors d ON mpart.doctor_id = d.doctorid
      WHERE mp.patient_id = $1
      ORDER BY m.updated_at DESC
      LIMIT 1`,
      [patientId]
    );

    return {
      ...patient_data,
      meeting: meetings[0] || null,
    };
  }
}
