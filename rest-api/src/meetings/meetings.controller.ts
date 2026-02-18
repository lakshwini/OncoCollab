import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { CreateMeetingDto } from './dto/create-meeting.dto';

@Controller('meetings')
@UseGuards(JwtAuthGuard)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  /**
   * Crée une nouvelle réunion avec participants, rôles et prérequis
   * POST /meetings
   */
  @Post()
  async createMeeting(@Body() createMeetingDto: CreateMeetingDto, @Request() req: any) {
    const createdBy = req.user.doctorID || req.user.sub;
    return this.meetingsService.createMeeting(createMeetingDto, createdBy);
  }

  /**
   * Récupère les réunions de l'utilisateur connecté
   * GET /meetings
   *
   * SÉCURITÉ: Filtre automatiquement par doctorId du JWT
   * Un utilisateur ne voit QUE ses réunions (où il est participant)
   */
  @Get()
  async findAll(@Request() req: any) {
    // ✅ CORRECTION CRITIQUE: Toujours filtrer par doctorId du JWT
    const doctorId = req.user.doctorID || req.user.sub;

    if (!doctorId) {
      throw new Error('Utilisateur non authentifié ou doctorID manquant dans le JWT');
    }

    // Retourner UNIQUEMENT les réunions où ce docteur participe
    return this.meetingsService.findByDoctor(doctorId);
  }

  /**
   * Récupère les statistiques des réunions
   * GET /meetings/stats/summary
   */
  @Get('stats/summary')
  async getStats() {
    return this.meetingsService.getStats();
  }

  /**
   * Récupère les détails complets d'une réunion (participants + prérequis)
   * GET /meetings/:id/details
   * 
   * Logique de sécurité:
   * - ORGANIZER/CO-ADMIN: voit TOUS les participants et leurs prérequis
   * - PARTICIPANT: voit UNIQUEMENT ses propres prérequis
   */
  @Get(':id/details')
  async getMeetingDetails(@Param('id') id: string, @Request() req: any) {
    const doctorId = req.user.doctorID || req.user.sub;
    return this.meetingsService.getMeetingDetails(id, doctorId);
  }

  /**
   * Récupère une réunion par son ID
   * GET /meetings/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.meetingsService.findOne(id);
  }

  /**
   * Met à jour une réunion (titre, description, dates, status)
   * PUT /meetings/:id
   *
   * SÉCURITÉ: Seul l'organizer ou co_admin peut modifier
   */
  @Put(':id')
  async updateMeeting(
    @Param('id') id: string,
    @Body() updateData: {
      title?: string;
      description?: string;
      startTime?: Date | string;
      endTime?: Date | string;
      status?: 'draft' | 'scheduled' | 'live' | 'postponed' | 'finished';
      postponedReason?: string;
    },
    @Request() req: any,
  ) {
    const doctorId = req.user.doctorID || req.user.sub;
    const role = await this.meetingsService.getDoctorRoleInMeeting(id, doctorId);

    if (role !== 'organizer' && role !== 'co_admin') {
      throw new ForbiddenException('Seul l\'organisateur ou co-admin peut modifier cette réunion');
    }

    return this.meetingsService.updateMeeting(id, updateData);
  }

  /**
   * Supprime une réunion avec cascade complète
   * DELETE /meetings/:id
   *
   * Cascade: meeting_participants, meeting_roles, meeting_patients, messages, MongoDB prerequisites
   * SÉCURITÉ: Seul l'organizer ou co_admin peut supprimer
   */
  @Delete(':id')
  async deleteMeeting(@Param('id') id: string, @Request() req: any) {
    const doctorId = req.user.doctorID || req.user.sub;
    const role = await this.meetingsService.getDoctorRoleInMeeting(id, doctorId);

    if (role !== 'organizer' && role !== 'co_admin') {
      throw new ForbiddenException('Seul l\'organisateur ou co-admin peut supprimer cette réunion');
    }

    return this.meetingsService.deleteMeeting(id);
  }

  /**
   * Reprogramme une réunion pour le même patient
   * POST /meetings/:id/reschedule
   *
   * Crée une NOUVELLE réunion avec les mêmes patients et participants
   * L'ancienne réunion passe en status "finished" ou "postponed"
   * SÉCURITÉ: Seul l'organizer ou co_admin peut reprogrammer
   */
  @Post(':id/reschedule')
  async rescheduleMeeting(
    @Param('id') id: string,
    @Body() rescheduleData: {
      title?: string;
      startTime: Date | string;
      endTime?: Date | string;
      description?: string;
      postponedReason?: string;
    },
    @Request() req: any,
  ) {
    const doctorId = req.user.doctorID || req.user.sub;
    const role = await this.meetingsService.getDoctorRoleInMeeting(id, doctorId);

    if (role !== 'organizer' && role !== 'co_admin') {
      throw new ForbiddenException('Seul l\'organisateur ou co-admin peut reprogrammer cette réunion');
    }

    return this.meetingsService.rescheduleMeeting(id, rescheduleData, doctorId);
  }

  /**
   * Vérifie si le docteur est participant à cette réunion
   * GET /meetings/:id/access
   *
   * Utilisé pour la validation de lien /meeting/:id
   */
  @Get(':id/access')
  async checkAccess(@Param('id') id: string, @Request() req: any) {
    const doctorId = req.user.doctorID || req.user.sub;

    const meeting = await this.meetingsService.findOne(id);
    if (!meeting) {
      throw new NotFoundException('Réunion non trouvée');
    }

    const isParticipant = await this.meetingsService.isParticipant(id, doctorId);
    const role = await this.meetingsService.getDoctorRoleInMeeting(id, doctorId);

    return {
      hasAccess: isParticipant,
      role: role,
      meetingTitle: meeting.title,
      meetingStatus: meeting.status,
    };
  }
}
