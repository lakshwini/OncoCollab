import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Req,
  Res,
  Inject,
  forwardRef,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { SemanticSearchDto } from './dto/generate-report.dto';
import { VideoGateway } from '../video/video.gateway';

interface AuthRequest {
  user: { sub?: string; doctorID?: string; email?: string };
}

@Controller()
@UseGuards(JwtAuthGuard)
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(
    private readonly reportsService: ReportsService,
    @Inject(forwardRef(() => VideoGateway))
    private readonly videoGateway: VideoGateway,
  ) {}

  /**
   * Déclenché par le bouton 🎤 "Générer le rapport" de la visio.
   * Reçoit un blob audio (multipart 'audio'), le meetingId depuis l'URL.
   */
  @Post('meetings/:meetingId/generate-report')
  @UseInterceptors(FileInterceptor('audio', {
    limits: { fileSize: 200 * 1024 * 1024 }, // 200 Mo max
  }))
  async generateReport(
    @Param('meetingId') meetingId: string,
    @UploadedFile() audio: Express.Multer.File,
    @Req() req: AuthRequest,
  ) {
    if (!audio) {
      throw new BadRequestException('Fichier audio manquant (champ "audio")');
    }

    const doctorId = req.user.doctorID || req.user.sub;
    if (!doctorId) {
      throw new BadRequestException('Identifiant docteur introuvable dans le JWT');
    }

    const { report, participantIds, pdfUrl } =
      await this.reportsService.generateFromAudio({
        audio: audio.buffer,
        audioFilename: audio.originalname || 'meeting.webm',
        audioMimeType: audio.mimetype,
        meetingId,
        generatedBy: doctorId,
      });

    // Notifier tous les participants en temps réel via Socket.IO
    this.videoGateway.broadcastReportReady(meetingId, {
      reportId: report.id,
      meetingId,
      title: report.title,
      summary: report.summary,
      pdfUrl,
      participantIds,
      generatedBy: doctorId,
      generatedAt: report.generatedAt?.toISOString?.() || new Date().toISOString(),
    });

    return {
      success: true,
      reportId: report.id,
      pdfUrl,
      title: report.title,
      summary: report.summary,
      structuredData: report.structuredData,
      participantsNotified: participantIds.length,
    };
  }

  /**
   * Étape 1 — Transcription seule (Whisper).
   * Reçoit l'audio, retourne la transcription texte pour relecture utilisateur.
   * Ne persiste rien en base.
   */
  @Post('meetings/:meetingId/transcribe')
  @UseInterceptors(FileInterceptor('audio', {
    limits: { fileSize: 200 * 1024 * 1024 },
  }))
  async transcribeAudio(
    @Param('meetingId') meetingId: string,
    @UploadedFile() audio: Express.Multer.File,
    @Req() req: AuthRequest,
  ) {
    if (!audio) throw new BadRequestException('Fichier audio manquant (champ "audio")');
    this.logger.log(`[TRANSCRIBE] meeting=${meetingId}, size=${audio.size} bytes`);

    const result = await this.reportsService.transcribeOnly({
      audio: audio.buffer,
      audioFilename: audio.originalname || 'meeting.webm',
      audioMimeType: audio.mimetype,
    });

    this.logger.log(`[TRANSCRIBE] OK — ${result.transcription.length} chars`);
    return {
      success: true,
      transcription: result.transcription,
      language: result.language,
      segments: result.segments,
    };
  }

  /**
   * Étape 2 — Génération du rapport depuis une transcription déjà validée.
   * Reçoit la transcription texte, fait Gemini → PDF → sauvegarde → notif Socket.IO.
   */
  @Post('meetings/:meetingId/generate-from-transcript')
  async generateFromTranscript(
    @Param('meetingId') meetingId: string,
    @Body() body: { transcription: string; language?: string },
    @Req() req: AuthRequest,
  ) {
    const doctorId = req.user.doctorID || req.user.sub;
    if (!doctorId) throw new BadRequestException('Identifiant docteur introuvable dans le JWT');
    if (!body?.transcription?.trim()) throw new BadRequestException('Transcription manquante ou vide');

    this.logger.log(`[GENERATE-FROM-TRANSCRIPT] meeting=${meetingId}, doctor=${doctorId}`);

    const { report, participantIds, pdfUrl } = await this.reportsService.generateFromTranscript({
      transcription: body.transcription,
      meetingId,
      generatedBy: doctorId,
      language: body.language,
    });

    this.videoGateway.broadcastReportReady(meetingId, {
      reportId: report.id,
      meetingId,
      title: report.title,
      summary: report.summary,
      pdfUrl,
      participantIds,
      generatedBy: doctorId,
      generatedAt: report.generatedAt?.toISOString?.() || new Date().toISOString(),
    });

    this.logger.log(`[GENERATE-FROM-TRANSCRIPT] ✅ report=${report.id}, pdfUrl=${pdfUrl}`);

    return {
      success: true,
      reportId: report.id,
      pdfUrl,
      title: report.title,
      summary: report.summary,
      structuredData: report.structuredData,
      participantsNotified: participantIds.length,
    };
  }

  @Get('reports/:id')
  getReport(@Param('id') id: string) {
    return this.reportsService.findById(id);
  }

  @Get('meetings/:meetingId/reports')
  listByMeeting(@Param('meetingId') meetingId: string) {
    return this.reportsService.findByMeeting(meetingId);
  }

  @Get('reports/search/semantic')
  async semanticSearch(@Query() q: SemanticSearchDto, @Req() req: AuthRequest) {
    const doctorId = req.user.doctorID || req.user.sub;
    if (!doctorId) throw new BadRequestException('Docteur inconnu');
    if (!q.query) throw new BadRequestException('Paramètre "query" requis');
    const limit = q.limit ? Math.min(50, parseInt(q.limit, 10) || 10) : 10;
    return this.reportsService.semanticSearch(doctorId, q.query, limit);
  }

  /**
   * Récupère les rapports générés pour le docteur authentifié
   * (par sa participation aux réunions)
   */
  @Get('doctors/reports/list')
  async getMyReports(@Req() req: AuthRequest) {
    const doctorId = req.user.doctorID || req.user.sub;
    if (!doctorId) throw new BadRequestException('Docteur inconnu');
    return this.reportsService.findByDoctor(doctorId, 100);
  }

}

// ─────────────────────────────────────────────────────────────────────
// Controller public pour servir les PDF (utilisé en fallback quand Supabase
// n'est pas configuré). Pas de JWT requis car les noms de fichiers contiennent
// un UUID v4 — impossible à deviner. Les liens ne fuitent que vers les
// participants autorisés via doctor_personal_files.
// ─────────────────────────────────────────────────────────────────────
@Controller('reports/file')
export class ReportsFileController {
  @Get(':filename')
  serveLocalPdf(@Param('filename') filename: string, @Res() res: Response) {
    if (
      filename.includes('/') ||
      filename.includes('..') ||
      !filename.endsWith('.pdf')
    ) {
      throw new BadRequestException('Nom de fichier invalide');
    }
    const dir = process.env.LOCAL_REPORTS_DIR || '/data/reports';
    const filePath = path.join(dir, filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('PDF introuvable');
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    fs.createReadStream(filePath).pipe(res);
  }
}
