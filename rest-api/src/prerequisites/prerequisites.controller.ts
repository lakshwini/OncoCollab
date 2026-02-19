import { Controller, Get, Patch, Post, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { PrerequisitesService } from './prerequisites.service';
import { UpdatePrerequisitesDto } from './dto/update-prerequisite.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { getAllPrerequisiteTemplates, getPrerequisiteTemplatesForSpeciality } from './prerequisite-templates';

/**
 * Controller pour la gestion des prérequis de réunions RCP
 */
@Controller('prerequisites')
@UseGuards(JwtAuthGuard) // Toutes les routes nécessitent une authentification
export class PrerequisitesController {
  constructor(private readonly prerequisitesService: PrerequisitesService) {}

  /**
   * GET /prerequisites/templates
   * Récupère les templates de prérequis standards par spécialité
   * Query param: speciality (optionnel) - filtre par spécialité
   */
  @Get('templates')
  async getPrerequisiteTemplates(@Query('speciality') speciality?: string) {
    if (speciality) {
      return {
        speciality,
        templates: getPrerequisiteTemplatesForSpeciality(speciality),
      };
    }
    return getAllPrerequisiteTemplates();
  }

  /**
   * GET /prerequisites/me
   * Récupère tous les prérequis du médecin connecté
   */
  @Get('me')
  async getMyPrerequisites(@Request() req) {
    const doctorId = req.user.doctorID || req.user.sub;
    return this.prerequisitesService.getMyPrerequisites(doctorId);
  }

  /**
   * GET /prerequisites/meeting/:meetingId
   * Récupère les prérequis d'une réunion
   * - Admin: tous les prérequis
   * - Participant: uniquement ses prérequis
   */
  @Get('meeting/:meetingId')
  async getMeetingPrerequisites(@Param('meetingId') meetingId: string, @Request() req) {
    const doctorId = req.user.doctorID || req.user.sub;
    return this.prerequisitesService.getMeetingPrerequisites(meetingId, doctorId, false);
  }

  /**
   * GET /prerequisites/meeting/:meetingId/all
   * Vue admin : prérequis de tous les participants (organisateur / co-admin uniquement)
   * Retourne : [{ doctor_name, doctor_email, prerequisites: [{label, status}] }]
   */
  @Get('meeting/:meetingId/all')
  async getAllMeetingPrerequisites(@Param('meetingId') meetingId: string, @Request() req) {
    const doctorId = req.user.doctorID || req.user.sub;
    return this.prerequisitesService.getAllParticipantsPrerequisites(meetingId, doctorId);
  }

  /**
   * PATCH /prerequisites/meeting/:meetingId
   * Accepte deux formats :
   *   - { itemId, completed }   → toggle simple (MyPrerequisites.tsx)
   *   - { items: [...] }        → mise à jour batch (MeetingPrerequisitesCheck.tsx)
   */
  @Patch('meeting/:meetingId')
  async updateMyPrerequisites(
    @Param('meetingId') meetingId: string,
    @Body() body: any,
    @Request() req,
  ) {
    const doctorId = req.user.doctorID || req.user.sub;

    // Format simple : { itemId: string, completed: boolean }
    if (typeof body.itemId === 'string') {
      return this.prerequisitesService.togglePrerequisiteItem(
        meetingId,
        doctorId,
        body.itemId,
        Boolean(body.completed),
      );
    }

    // Format batch : { items: [{key, status, ...}] }
    return this.prerequisitesService.updateMyPrerequisites(meetingId, doctorId, body);
  }

  /**
   * GET /prerequisites/meeting/:meetingId/can-launch
   * Vérifie si le médecin peut lancer la réunion
   */
  @Get('meeting/:meetingId/can-launch')
  async canLaunchMeeting(@Param('meetingId') meetingId: string, @Request() req) {
    const doctorId = req.user.doctorID || req.user.sub;
    return this.prerequisitesService.canLaunchMeeting(meetingId, doctorId);
  }

  /**
   * POST /prerequisites/meeting/:meetingId/launch
   * Lance une réunion (admin seulement, prérequis complétés)
   */
  @Post('meeting/:meetingId/launch')
  async launchMeeting(@Param('meetingId') meetingId: string, @Request() req) {
    const doctorId = req.user.doctorID || req.user.sub;
    return this.prerequisitesService.launchMeeting(meetingId, doctorId);
  }

  /**
   * POST /prerequisites/meeting/:meetingId/postpone
   * Reporte une réunion (admin seulement)
   */
  @Post('meeting/:meetingId/postpone')
  async postponeMeeting(@Param('meetingId') meetingId: string, @Request() req) {
    const doctorId = req.user.doctorID || req.user.sub;
    return this.prerequisitesService.postponeMeeting(meetingId, doctorId);
  }

  /**
   * GET /prerequisites/meeting/:meetingId/details
   * Récupère les détails complets d'une réunion
   * - Infos meeting (title, description) depuis PostgreSQL
   * - TOUS les participants avec firstname, lastname, email, speciality
   * - Rôle de chaque participant (organizer/co_admin/participant)
   * - Prérequis de chaque participant depuis MongoDB
   * - Infos patient depuis PostgreSQL
   */
  @Get('meeting/:meetingId/details')
  async getMeetingDetails(@Param('meetingId') meetingId: string, @Request() req) {
    const doctorId = req.user.doctorID || req.user.sub;
    return this.prerequisitesService.getMeetingDetailsWithParticipants(meetingId, doctorId);
  }

  /**
   * GET /prerequisites/meetings
   * Récupère la liste des réunions du médecin connecté
   * Pour afficher dans la page Meetings (TOUT dynamique)
   */
  @Get('meetings')
  async getMyMeetings(@Request() req) {
    const doctorId = req.user.doctorID || req.user.sub;
    return this.prerequisitesService.getMyMeetings(doctorId);
  }
}
