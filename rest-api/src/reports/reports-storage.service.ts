import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../auth/supabase.service';

/**
 * Wrapper Supabase Storage pour les PDF de rapports RCP.
 *
 * Comportement :
 *  - Si SUPABASE_SERVICE_KEY est défini ET valide → upload vers Supabase et renvoie l'URL publique
 *  - Sinon → renvoie une URL relative servie par le backend lui-même
 *    (le PDF reste lisible depuis le volume Docker partagé `pipeline_reports`)
 *
 * Dans tous les cas, le PDF n'est JAMAIS écrit sur le PC de l'utilisateur :
 * il vit soit dans Supabase Storage (cloud), soit dans le volume Docker du backend.
 */
@Injectable()
export class ReportsStorageService {
  private readonly logger = new Logger(ReportsStorageService.name);
  private readonly bucket: string;
  private readonly supabaseEnabled: boolean;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly config: ConfigService,
  ) {
    this.bucket = this.config.get<string>(
      'SUPABASE_REPORTS_BUCKET',
      'meeting-reports',
    );

    // Considéré activé seulement si la service key n'est pas le placeholder
    const serviceKey = this.config.get<string>('SUPABASE_SERVICE_KEY', '');
    this.supabaseEnabled =
      !!serviceKey &&
      serviceKey !== 'your_service_key_here' &&
      serviceKey.length > 30;

    if (!this.supabaseEnabled) {
      this.logger.warn(
        'SUPABASE_SERVICE_KEY non configurée — fallback : PDF servi par le backend depuis /data/reports',
      );
    } else {
      this.logger.log(`Supabase Storage activé (bucket=${this.bucket})`);
    }
  }

  /**
   * Upload un PDF. Renvoie une URL accessible.
   *  - Supabase activé → URL publique Supabase
   *  - Sinon → URL relative type "/reports/file/<filename>" qui sera servie par le backend
   */
  async uploadPdf(
    filename: string,
    pdfBuffer: Buffer,
  ): Promise<{ url: string; storage: 'supabase' | 'local' }> {
    if (!this.supabaseEnabled) {
      // Pas de Supabase → on s'appuie sur le volume partagé `pipeline_reports`
      // et on construira une URL relative servie par le backend.
      const url = `/reports/file/${encodeURIComponent(filename)}`;
      this.logger.log(`PDF stocké en local (volume Docker), URL=${url}`);
      return { url, storage: 'local' };
    }

    const supabase = this.supabaseService.getClient();

    let { error } = await supabase.storage
      .from(this.bucket)
      .upload(filename, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error && /Bucket not found/i.test(error.message)) {
      this.logger.warn(`Bucket '${this.bucket}' inexistant — création`);
      // @ts-ignore — l'API admin supabase nécessite la service key
      const { error: createErr } = await supabase.storage.createBucket(
        this.bucket,
        { public: true },
      );
      if (createErr) {
        this.logger.warn(
          `Création bucket Supabase échouée (${createErr.message}) — fallback local`,
        );
        const url = `/reports/file/${encodeURIComponent(filename)}`;
        return { url, storage: 'local' };
      }
      const retry = await supabase.storage
        .from(this.bucket)
        .upload(filename, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });
      error = retry.error;
    }

    if (error) {
      this.logger.warn(
        `Upload Supabase échoué (${error.message}) — fallback local`,
      );
      const url = `/reports/file/${encodeURIComponent(filename)}`;
      return { url, storage: 'local' };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(this.bucket).getPublicUrl(filename);

    this.logger.log(`PDF uploadé sur Supabase: ${publicUrl}`);
    return { url: publicUrl, storage: 'supabase' };
  }
}
