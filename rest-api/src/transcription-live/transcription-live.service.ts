import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TranscriptionBlock } from '../reports/entities/transcription-block.entity';
import { MeetingTranscript } from '../reports/entities/meeting-transcript.entity';
import { SaveTranscriptionBlockDto } from '../reports/dto/save-transcription-block.dto';

@Injectable()
export class TranscriptionLiveService {
  private readonly logger = new Logger(TranscriptionLiveService.name);

  constructor(
    @InjectRepository(TranscriptionBlock)
    private readonly blockRepo: Repository<TranscriptionBlock>,
    @InjectRepository(MeetingTranscript)
    private readonly transcriptRepo: Repository<MeetingTranscript>,
  ) {}

  /**
   * Sauvegarde un bloc de transcription (une prise de parole)
   */
  async saveTranscriptionBlock(
    meetingId: string,
    dto: SaveTranscriptionBlockDto,
  ): Promise<TranscriptionBlock> {
    this.logger.debug(
      `📝 Sauvegarde bloc transcription: meeting=${meetingId}, speaker=${dto.speakerName}, order=${dto.blockOrder}`,
    );

    if (!dto.text || dto.text.trim().length === 0) {
      throw new BadRequestException('Le texte du bloc ne peut pas être vide');
    }

    const block = this.blockRepo.create({
      meetingId,
      speakerId: dto.speakerId,
      speakerName: dto.speakerName || 'Inconnu',
      text: dto.text.trim(),
      blockOrder: dto.blockOrder,
      timestampSeconds: dto.timestampSeconds,
      source: dto.source || 'speechcore',
    });

    const saved = await this.blockRepo.save(block);
    this.logger.log(`✅ Bloc sauvegardé: ${saved.id}`);
    return saved;
  }

  /**
   * Récupère tous les blocs d'une réunion
   */
  async getTranscriptionBlocks(meetingId: string): Promise<TranscriptionBlock[]> {
    this.logger.debug(`📖 Récupération blocs: meeting=${meetingId}`);

    const blocks = await this.blockRepo.find({
      where: { meetingId },
      order: { blockOrder: 'ASC' },
    });

    this.logger.log(`📊 ${blocks.length} blocs trouvés`);
    return blocks;
  }

  /**
   * Fusionne tous les blocs d'une réunion en une transcription complète
   * Format: "[Nom Speaker] texte du bloc\n[Nom Speaker] texte du bloc..."
   */
  async fuseMeetingTranscription(meetingId: string): Promise<{
    fullTranscription: string;
    blockCount: number;
    speakerMap: Record<string, number>; // {speakerName: blockCount}
  }> {
    this.logger.debug(`🔄 Fusion transcription: meeting=${meetingId}`);

    const blocks = await this.getTranscriptionBlocks(meetingId);

    if (blocks.length === 0) {
      this.logger.warn(`⚠️ Aucun bloc pour la fusion: ${meetingId}`);
      return {
        fullTranscription: '',
        blockCount: 0,
        speakerMap: {},
      };
    }

    // Fusionner avec labels de speakers
    const lines = blocks.map(
      (block) => `[${block.speakerName}] ${block.text}`,
    );
    const fullTranscription = lines.join('\n');

    // Compter blocs par speaker
    const speakerMap: Record<string, number> = {};
    blocks.forEach((block) => {
      const name = block.speakerName || 'Inconnu';
      speakerMap[name] = (speakerMap[name] || 0) + 1;
    });

    this.logger.log(
      `✅ Fusion complétée: ${blocks.length} blocs, speakers: ${Object.keys(speakerMap).join(', ')}`,
    );

    return {
      fullTranscription,
      blockCount: blocks.length,
      speakerMap,
    };
  }

  /**
   * Sauvegarde la transcription fusionnée dans meeting_transcripts
   */
  async saveFusedTranscript(
    meetingId: string,
    transcription: string,
    blocks: TranscriptionBlock[],
    languageCode: string = 'fr',
  ): Promise<MeetingTranscript> {
    this.logger.debug(
      `💾 Sauvegarde transcription fusionnée: meeting=${meetingId}, blocks=${blocks.length}`,
    );

    // Récupérer ou créer le transcript
    let transcript = await this.transcriptRepo.findOne({
      where: { meetingId },
    });

    if (!transcript) {
      transcript = this.transcriptRepo.create({
        meetingId,
        rawTranscript: transcription,
        language: languageCode,
        transcriptionSource: 'speechcore',
        createdBy: 'system',
      });
    } else {
      transcript.rawTranscript = transcription;
      transcript.transcriptionSource = 'speechcore';
    }

    // Sauvegarder aussi les blocs comme JSON
    transcript.speakerBlocks = blocks.map((b) => ({
      speakerId: b.speakerId,
      speakerName: b.speakerName,
      text: b.text,
      blockOrder: b.blockOrder,
      timestampSeconds: b.timestampSeconds,
    }));

    const saved = await this.transcriptRepo.save(transcript);
    this.logger.log(`✅ Transcription fusionnée sauvegardée: ${saved.id}`);
    return saved;
  }

  /**
   * Supprime les blocs d'une réunion (utile pour redémarrer une session)
   */
  async deleteTranscriptionBlocks(meetingId: string): Promise<void> {
    this.logger.debug(`🗑️ Suppression blocs: meeting=${meetingId}`);

    await this.blockRepo.delete({ meetingId });
    this.logger.log(`✅ Blocs supprimés`);
  }

  /**
   * Récupère les statistiques de transcription
   */
  async getTranscriptionStats(meetingId: string): Promise<{
    totalBlocks: number;
    totalWords: number;
    totalCharacters: number;
    speakers: string[];
    estimatedDuration: number;
  }> {
    const blocks = await this.getTranscriptionBlocks(meetingId);

    const totalWords = blocks.reduce(
      (sum, b) => sum + b.text.split(/\s+/).length,
      0,
    );
    const totalCharacters = blocks.reduce(
      (sum, b) => sum + b.text.length,
      0,
    );
    const speakers = [...new Set(blocks.map((b) => b.speakerName))];
    const estimatedDuration = blocks[blocks.length - 1]?.timestampSeconds || 0;

    return {
      totalBlocks: blocks.length,
      totalWords,
      totalCharacters,
      speakers,
      estimatedDuration,
    };
  }
}
