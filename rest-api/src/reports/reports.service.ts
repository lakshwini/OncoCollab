import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MeetingReport } from './entities/meeting-report.entity';
import { MeetingTranscript } from './entities/meeting-transcript.entity';
import { DoctorPersonalFile } from '../personal-files/entities/personal-file.entity';
import { PipelineClient } from './pipeline.client';
import { ReportsStorageService } from './reports-storage.service';
import { QdrantService } from '../qdrant/qdrant.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(MeetingReport)
    private readonly reportRepo: Repository<MeetingReport>,
    @InjectRepository(MeetingTranscript)
    private readonly transcriptRepo: Repository<MeetingTranscript>,
    @InjectRepository(DoctorPersonalFile)
    private readonly personalFileRepo: Repository<DoctorPersonalFile>,
    private readonly dataSource: DataSource,
    private readonly pipeline: PipelineClient,
    private readonly storage: ReportsStorageService,
    private readonly qdrant: QdrantService,
  ) {}

  /**
   * Pipeline complet déclenché depuis la visio :
   * 1. envoyer l'audio au microservice Python
   * 2. récupérer PDF + JSON structuré + embedding
   * 3. uploader le PDF sur Supabase
   * 4. persister meeting_transcripts + meeting_reports en Postgres
   * 5. distribuer une ligne dans doctor_personal_files pour CHAQUE participant
   * 6. upsert dans Qdrant pour la recherche sémantique
   */
  async generateFromAudio(opts: {
    audio: Buffer;
    audioFilename: string;
    audioMimeType?: string;
    meetingId: string;
    generatedBy: string;
    language?: string;
  }) {
    // Récupère le titre + le statut de la réunion + les participants
    const meetingRows = await this.dataSource.query(
      `SELECT id, title FROM meetings WHERE id = $1`,
      [opts.meetingId],
    );
    if (!meetingRows.length) {
      throw new NotFoundException(`Réunion ${opts.meetingId} introuvable`);
    }
    const meetingTitle = meetingRows[0].title || 'Compte-rendu de RCP';

    const participantRows = await this.dataSource.query(
      `SELECT doctor_id FROM meeting_participants WHERE meeting_id = $1`,
      [opts.meetingId],
    );
    const participantIds: string[] = participantRows.map((r: any) => r.doctor_id);
    if (!participantIds.includes(opts.generatedBy)) {
      participantIds.push(opts.generatedBy);
    }

    // 1+2 — Pipeline Python
    const pipelineRes = await this.pipeline.generateReportFromAudio({
      audio: opts.audio,
      audioFilename: opts.audioFilename,
      audioMimeType: opts.audioMimeType,
      meetingId: opts.meetingId,
      meetingTitle,
      meetingType: 'RCP',
      language: opts.language || 'fr',
    });

    // 3 — Récupération du PDF binaire + upload (Supabase OU fallback local)
    const pdfBuffer = await this.pipeline.fetchPdf(pipelineRes.pdf_filename);
    const { url: pdfUrl, storage: pdfStorage } = await this.storage.uploadPdf(
      pipelineRes.pdf_filename,
      pdfBuffer,
    );
    this.logger.log(
      `PDF stocké via ${pdfStorage}: ${pdfUrl} (${pdfBuffer.length} bytes)`,
    );

    // 4 — Persistance Postgres
    const transcript = await this.transcriptRepo.save(
      this.transcriptRepo.create({
        meetingId: opts.meetingId,
        rawTranscript: pipelineRes.transcription || '',
        language: pipelineRes.language || opts.language || 'fr',
        createdBy: opts.generatedBy,
      }),
    );

    const structured = pipelineRes.structured_data || {};
    const summary = (structured as any).summary || '';

    const report = await this.reportRepo.save(
      this.reportRepo.create({
        id: pipelineRes.report_id,
        meetingId: opts.meetingId,
        transcriptId: transcript.id,
        title: meetingTitle,
        summary,
        structuredData: structured,
        pdfUrl,
        pdfFilename: pipelineRes.pdf_filename,
        pdfSizeBytes: pdfBuffer.length,
        status: 'ready',
        generatedBy: opts.generatedBy,
      }),
    );

    // 5 — Distribuer dans le dossier personnel de chaque participant
    for (const doctorId of participantIds) {
      try {
        await this.personalFileRepo.save(
          this.personalFileRepo.create({
            doctorId,
            reportId: report.id,
            meetingId: opts.meetingId,
            fileType: 'pdf',
            fileName: pipelineRes.pdf_filename,
            fileUrl: pdfUrl,
            fileSize: pdfBuffer.length,
            isRead: doctorId === opts.generatedBy, // déjà lu par celui qui a généré
          }),
        );
      } catch (err: any) {
        // Doublon (UNIQUE doctor_id+report_id) → on ignore, c'est attendu si on regénère
        if (!String(err?.message || '').includes('duplicate')) {
          this.logger.warn(
            `Échec ajout dossier perso pour ${doctorId}: ${err?.message}`,
          );
        }
      }
    }

    // 6 — Upsert Qdrant
    try {
      await this.qdrant.upsertReport(report.id, pipelineRes.embedding, {
        meetingId: opts.meetingId,
        reportId: report.id,
        title: meetingTitle,
        summary,
        participants: participantIds,
        generatedBy: opts.generatedBy,
        generatedAt: report.generatedAt?.toISOString?.() || new Date().toISOString(),
      });
      await this.reportRepo.update(report.id, { qdrantPointId: report.id });
    } catch (err) {
      this.logger.warn(
        `Qdrant upsert échoué (non bloquant): ${(err as Error).message}`,
      );
    }

    return {
      report,
      participantIds,
      pdfUrl,
    };
  }

  /**
   * Étape 1 du flow 2-passes : transcription seule via Whisper.
   * Ne persiste rien en base — le résultat est renvoyé au frontend pour relecture.
   */
  async transcribeOnly(opts: {
    audio: Buffer;
    audioFilename: string;
    audioMimeType?: string;
    language?: string;
  }) {
    return this.pipeline.transcribeAudio(opts);
  }

  /**
   * Étape 2 du flow 2-passes : génère le rapport depuis une transcription déjà validée.
   * Identique à generateFromAudio mais court-circuite Whisper.
   */
  async generateFromTranscript(opts: {
    transcription: string;
    meetingId: string;
    generatedBy: string;
    language?: string;
  }) {
    const meetingRows = await this.dataSource.query(
      `SELECT id, title FROM meetings WHERE id = $1`,
      [opts.meetingId],
    );
    if (!meetingRows.length) {
      throw new NotFoundException(`Réunion ${opts.meetingId} introuvable`);
    }
    const meetingTitle = meetingRows[0].title || 'Compte-rendu de RCP';

    const participantRows = await this.dataSource.query(
      `SELECT doctor_id FROM meeting_participants WHERE meeting_id = $1`,
      [opts.meetingId],
    );
    const participantIds: string[] = participantRows.map((r: any) => r.doctor_id);
    if (!participantIds.includes(opts.generatedBy)) {
      participantIds.push(opts.generatedBy);
    }

    // Pipeline Python : Gemini + PDF (Whisper déjà fait côté frontend)
    const pipelineRes = await this.pipeline.generateReportFromText({
      transcription: opts.transcription,
      meetingId: opts.meetingId,
      meetingTitle,
      meetingType: 'RCP',
    });

    const pdfBuffer = await this.pipeline.fetchPdf(pipelineRes.pdf_filename);
    const { url: pdfUrl, storage: pdfStorage } = await this.storage.uploadPdf(
      pipelineRes.pdf_filename,
      pdfBuffer,
    );
    this.logger.log(`PDF stocké via ${pdfStorage}: ${pdfUrl} (${pdfBuffer.length} bytes)`);

    const transcript = await this.transcriptRepo.save(
      this.transcriptRepo.create({
        meetingId: opts.meetingId,
        rawTranscript: opts.transcription,
        language: opts.language || 'fr',
        createdBy: opts.generatedBy,
      }),
    );

    const structured = pipelineRes.structured_data || {};
    const summary = (structured as any).summary || '';

    const report = await this.reportRepo.save(
      this.reportRepo.create({
        id: pipelineRes.report_id,
        meetingId: opts.meetingId,
        transcriptId: transcript.id,
        title: meetingTitle,
        summary,
        structuredData: structured,
        pdfUrl,
        pdfFilename: pipelineRes.pdf_filename,
        pdfSizeBytes: pdfBuffer.length,
        status: 'ready',
        generatedBy: opts.generatedBy,
      }),
    );

    for (const doctorId of participantIds) {
      try {
        await this.personalFileRepo.save(
          this.personalFileRepo.create({
            doctorId,
            reportId: report.id,
            meetingId: opts.meetingId,
            fileType: 'pdf',
            fileName: pipelineRes.pdf_filename,
            fileUrl: pdfUrl,
            fileSize: pdfBuffer.length,
            isRead: doctorId === opts.generatedBy,
          }),
        );
      } catch (err: any) {
        if (!String(err?.message || '').includes('duplicate')) {
          this.logger.warn(`Échec ajout dossier perso pour ${doctorId}: ${err?.message}`);
        }
      }
    }

    try {
      await this.qdrant.upsertReport(report.id, pipelineRes.embedding, {
        meetingId: opts.meetingId,
        reportId: report.id,
        title: meetingTitle,
        summary,
        participants: participantIds,
        generatedBy: opts.generatedBy,
        generatedAt: report.generatedAt?.toISOString?.() || new Date().toISOString(),
      });
      await this.reportRepo.update(report.id, { qdrantPointId: report.id });
    } catch (err) {
      this.logger.warn(`Qdrant upsert échoué (non bloquant): ${(err as Error).message}`);
    }

    return { report, participantIds, pdfUrl };
  }

  // ── CRUD utilitaires ───────────────────────────────────────────

  async findById(id: string) {
    const r = await this.reportRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException(`Rapport ${id} introuvable`);
    return r;
  }

  async findByMeeting(meetingId: string) {
    return this.reportRepo.find({
      where: { meetingId },
      order: { generatedAt: 'DESC' },
    });
  }

  async findByDoctor(doctorId: string, limit = 50) {
    return this.dataSource.query(
      `SELECT mr.id, mr.meeting_id, mr.title, mr.summary, mr.pdf_url,
              mr.pdf_filename, mr.status, mr.generated_at,
              m.title AS meeting_title
       FROM meeting_reports mr
       JOIN meeting_participants mp ON mp.meeting_id = mr.meeting_id
       LEFT JOIN meetings m ON m.id = mr.meeting_id
       WHERE mp.doctor_id = $1
       ORDER BY mr.generated_at DESC
       LIMIT $2`,
      [doctorId, limit],
    );
  }

  /**
   * Recherche sémantique : on embed la query côté Python puis on interroge Qdrant.
   */
  async semanticSearch(doctorId: string, query: string, limit = 10) {
    const vector = await this.pipeline.embed(query);
    const results = await this.qdrant.search(vector, limit);

    // Filtre : on ne renvoie que les rapports auxquels le docteur a accès
    const accessibleIds = await this.dataSource.query(
      `SELECT mr.id
       FROM meeting_reports mr
       JOIN meeting_participants mp ON mp.meeting_id = mr.meeting_id
       WHERE mp.doctor_id = $1`,
      [doctorId],
    );
    const allowed = new Set(accessibleIds.map((r: any) => r.id));

    return results
      .filter((r) => allowed.has(String(r.id)))
      .map((r) => ({
        reportId: r.id,
        score: r.score,
        ...(r.payload || {}),
      }));
  }
}
