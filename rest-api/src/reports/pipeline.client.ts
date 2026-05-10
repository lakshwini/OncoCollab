import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * Client HTTP qui parle au microservice Python (FastAPI) :
 *   - POST /generate-report  (audio multipart → PDF + structured + embedding)
 *   - POST /generate-report-from-text
 *   - POST /embed
 *   - GET  /pdf/{filename}   (récupération binaire pour Supabase upload)
 *
 * Utilise le FormData natif de Node 18+ et le Blob natif (undici).
 * Aucune dépendance externe (pas de `form-data`).
 */
@Injectable()
export class PipelineClient {
  private readonly logger = new Logger(PipelineClient.name);
  private readonly axios: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    const baseURL = this.config.get<string>(
      'PIPELINE_URL',
      'http://python-pipeline:8000',
    );
    this.axios = axios.create({
      baseURL,
      timeout: 5 * 60 * 1000, // 5 min — Whisper peut être long sur du long audio
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    this.logger.log(`Pipeline client configuré: ${baseURL}`);
  }

  async transcribeAudio(opts: {
    audio: Buffer;
    audioFilename: string;
    audioMimeType?: string;
    language?: string;
  }): Promise<{ transcription: string; language: string; segments: any[] }> {
    const form = new FormData();
    const blob = new Blob([new Uint8Array(opts.audio)], {
      type: opts.audioMimeType || 'audio/webm',
    });
    form.append('audio', blob, opts.audioFilename);
    if (opts.language) form.append('language', opts.language);

    this.logger.log(`Appel pipeline /transcribe (${opts.audio.length} bytes)`);
    const res = await this.axios.post('/transcribe', form);
    return res.data as { transcription: string; language: string; segments: any[] };
  }

  async generateReportFromAudio(opts: {
    audio: Buffer;
    audioFilename: string;
    audioMimeType?: string;
    meetingId: string;
    meetingTitle?: string;
    meetingType?: string;
    language?: string;
  }) {
    // FormData et Blob sont globaux en Node 18+ (undici)
    const form = new FormData();
    const blob = new Blob([new Uint8Array(opts.audio)], {
      type: opts.audioMimeType || 'audio/webm',
    });
    form.append('audio', blob, opts.audioFilename);
    form.append('meeting_id', opts.meetingId);
    if (opts.meetingTitle) form.append('meeting_title', opts.meetingTitle);
    if (opts.meetingType) form.append('meeting_type', opts.meetingType);
    if (opts.language) form.append('language', opts.language);

    this.logger.log(
      `Appel pipeline /generate-report (meeting=${opts.meetingId}, audio=${opts.audioFilename}, ${opts.audio.length} bytes)`,
    );

    const res = await this.axios.post('/generate-report', form);
    return res.data as PipelineReportResponse;
  }

  async generateReportFromText(opts: {
    transcription: string;
    meetingId: string;
    meetingTitle?: string;
    meetingType?: string;
  }) {
    const res = await this.axios.post('/generate-report-from-text', {
      transcription: opts.transcription,
      meeting_id: opts.meetingId,
      meeting_title: opts.meetingTitle,
      meeting_type: opts.meetingType,
    });
    return res.data as PipelineReportResponse;
  }

  async fetchPdf(filename: string): Promise<Buffer> {
    const res = await this.axios.get(`/pdf/${encodeURIComponent(filename)}`, {
      responseType: 'arraybuffer',
    });
    return Buffer.from(res.data);
  }

  async embed(text: string): Promise<number[]> {
    const res = await this.axios.post('/embed', { text });
    return (res.data?.embedding ?? []) as number[];
  }
}

export interface PipelineReportResponse {
  success: boolean;
  report_id: string;
  pdf_path: string;
  pdf_filename: string;
  transcription?: string;
  language?: string;
  structured_data: Record<string, unknown>;
  embedding: number[];
  embedding_dim: number;
  embedding_text?: string;
}
