import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  HttpCode,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { TranscriptionLiveService } from './transcription-live.service';
import { SaveTranscriptionBlockDto } from '../reports/dto/save-transcription-block.dto';
import { TranscriptionBlock } from '../reports/entities/transcription-block.entity';
import { VideoGateway } from '../video/video.gateway';

@Controller('meetings/:meetingId/transcription')
export class TranscriptionLiveController {
  constructor(
    private readonly transcriptionLiveService: TranscriptionLiveService,
    @Inject(forwardRef(() => VideoGateway))
    private readonly videoGateway: VideoGateway,
  ) {}

  /**
   * POST /meetings/{meetingId}/transcription/block
   * Sauvegarde un bloc de transcription et le diffuse à tous les participants via Socket.IO
   */
  @Post('/block')
  @HttpCode(201)
  async saveBlock(
    @Param('meetingId') meetingId: string,
    @Body() dto: SaveTranscriptionBlockDto,
  ): Promise<{ success: boolean; block: TranscriptionBlock }> {
    if (!meetingId) {
      throw new BadRequestException('Meeting ID requis');
    }

    const block = await this.transcriptionLiveService.saveTranscriptionBlock(meetingId, dto);

    // Diffuser le bloc finalisé à tous les participants de la réunion
    this.videoGateway.broadcastTranscriptionBlock(meetingId, {
      id: block.id,
      meetingId,
      speakerName: block.speakerName,
      text: block.text,
      blockOrder: block.blockOrder,
      timestampSeconds: block.timestampSeconds,
      source: block.source,
    });

    return { success: true, block };
  }

  /**
   * GET /meetings/{meetingId}/transcription/blocks
   * Récupère tous les blocs d'une réunion (pour chargement initial)
   */
  @Get('/blocks')
  async getBlocks(
    @Param('meetingId') meetingId: string,
  ): Promise<{ success: boolean; blocks: TranscriptionBlock[]; count: number }> {
    if (!meetingId) {
      throw new BadRequestException('Meeting ID requis');
    }
    const blocks = await this.transcriptionLiveService.getTranscriptionBlocks(meetingId);
    return { success: true, blocks, count: blocks.length };
  }

  /**
   * POST /meetings/{meetingId}/transcription/fuse
   */
  @Post('/fuse')
  @HttpCode(200)
  async fuseTranscription(@Param('meetingId') meetingId: string) {
    if (!meetingId) throw new BadRequestException('Meeting ID requis');
    const result = await this.transcriptionLiveService.fuseMeetingTranscription(meetingId);
    if (result.fullTranscription) {
      const blocks = await this.transcriptionLiveService.getTranscriptionBlocks(meetingId);
      await this.transcriptionLiveService.saveFusedTranscript(meetingId, result.fullTranscription, blocks, 'fr');
    }
    return { success: true, fullTranscription: result.fullTranscription, blockCount: result.blockCount, speakerMap: result.speakerMap };
  }

  /**
   * GET /meetings/{meetingId}/transcription/stats
   */
  @Get('/stats')
  async getStats(@Param('meetingId') meetingId: string) {
    if (!meetingId) throw new BadRequestException('Meeting ID requis');
    const stats = await this.transcriptionLiveService.getTranscriptionStats(meetingId);
    return { success: true, stats };
  }

  /**
   * DELETE /meetings/{meetingId}/transcription/blocks
   */
  @Delete('/blocks')
  @HttpCode(200)
  async deleteBlocks(@Param('meetingId') meetingId: string) {
    if (!meetingId) throw new BadRequestException('Meeting ID requis');
    await this.transcriptionLiveService.deleteTranscriptionBlocks(meetingId);
    return { success: true, message: 'Tous les blocs ont été supprimés' };
  }
}
