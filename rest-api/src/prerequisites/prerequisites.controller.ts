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
   * Récupère TOUS les prérequis d'une réunion (admin seulement)
   */
  @Get('meeting/:meetingId/all')
  async getAllMeetingPrerequisites(@Param('meetingId') meetingId: string, @Request() req) {
    const doctorId = req.user.doctorID || req.user.sub;
    return this.prerequisitesService.getMeetingPrerequisites(meetingId, doctorId, true);
  }

  /**
   * PATCH /prerequisites/meeting/:meetingId
   * Met à jour les prérequis du médecin connecté pour une réunion
   */
  @Patch('meeting/:meetingId')
  async updateMyPrerequisites(
    @Param('meetingId') meetingId: string,
    @Body() updateDto: UpdatePrerequisitesDto,
    @Request() req,
  ) {
    const doctorId = req.user.doctorID || req.user.sub;
    return this.prerequisitesService.updateMyPrerequisites(meetingId, doctorId, updateDto);
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
