import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

/**
 * Service Qdrant — Base de données vectorielle pour la recherche
 * sémantique sur les comptes-rendus de RCP.
 *
 * Workflow :
 *   1. À l'init : crée la collection 'oncocollab_reports' si absente
 *   2. À la génération d'un rapport : upsert le vecteur + payload (meeting_id, report_id, summary, etc.)
 *   3. Recherche : similaritySearch(queryVector, limit) → top N rapports les plus pertinents
 */
@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new Logger(QdrantService.name);
  private client: QdrantClient;
  private readonly collection: string;
  private readonly vectorSize: number;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('QDRANT_HOST', 'qdrant');
    const port = +this.config.get<string>('QDRANT_PORT', '6333');
    this.collection = this.config.get<string>(
      'QDRANT_COLLECTION',
      'oncocollab_reports',
    );
    // Taille du vecteur par défaut = paraphrase-multilingual-MiniLM-L12-v2 = 384
    this.vectorSize = +this.config.get<string>('QDRANT_VECTOR_SIZE', '384');

    this.client = new QdrantClient({ url: `http://${host}:${port}` });
    this.logger.log(
      `Qdrant client configuré: http://${host}:${port} (collection=${this.collection})`,
    );
  }

  async onModuleInit() {
    // Crée la collection à la volée si elle n'existe pas. Robuste si Qdrant est lent à démarrer.
    try {
      await this.ensureCollection();
    } catch (err) {
      this.logger.warn(
        `Init Qdrant impossible pour le moment (${(err as Error).message}). Réessai au 1er upsert.`,
      );
    }
  }

  private async ensureCollection() {
    const collections = await this.client.getCollections();
    const exists = collections.collections?.some(
      (c) => c.name === this.collection,
    );

    if (!exists) {
      this.logger.log(`Création de la collection Qdrant '${this.collection}'`);
      await this.client.createCollection(this.collection, {
        vectors: { size: this.vectorSize, distance: 'Cosine' },
      });
    } else {
      this.logger.log(`Collection Qdrant '${this.collection}' OK`);
    }
  }

  /**
   * Upsert un rapport (vector + payload).
   * pointId est généralement l'UUID du meeting_report.
   */
  async upsertReport(
    pointId: string,
    vector: number[],
    payload: {
      meetingId: string;
      reportId: string;
      title?: string;
      summary?: string;
      participants?: string[];
      generatedBy?: string;
      generatedAt?: string;
      [k: string]: unknown;
    },
  ): Promise<void> {
    await this.ensureCollection();
    await this.client.upsert(this.collection, {
      points: [
        {
          id: pointId,
          vector,
          payload,
        },
      ],
    });
    this.logger.log(`Qdrant upsert OK (point=${pointId})`);
  }

  /**
   * Recherche sémantique. Le filter doit être au format Qdrant standard.
   * Exemple filter pour limiter à un docteur :
   *   { must: [{ key: 'participants', match: { value: doctorId } }] }
   */
  async search(
    queryVector: number[],
    limit = 10,
    filter?: Record<string, unknown>,
  ) {
    await this.ensureCollection();
    const result = await this.client.search(this.collection, {
      vector: queryVector,
      limit,
      filter: filter as any,
      with_payload: true,
    });
    return result;
  }

  async deleteByReportId(reportId: string): Promise<void> {
    try {
      await this.client.delete(this.collection, {
        points: [reportId],
      });
    } catch (err) {
      this.logger.warn(
        `Suppression Qdrant échouée pour ${reportId}: ${(err as Error).message}`,
      );
    }
  }
}
