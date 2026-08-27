import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface OncoVisionRoomInfo {
  roomId: string;
  roomName: string;
  imageId: string;
}

interface OncoVisionUploadResult {
  id: string;
}

interface PathoCollabWsi {
  wsi_id: string;
  filename?: string;
}

@Injectable()
export class OncovisionService {
  private readonly logger = new Logger(OncovisionService.name);
  private readonly oncovisionBaseUrl: string;
  private readonly pathocollabBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.oncovisionBaseUrl = (
      this.configService.get<string>('ONCOVISION_BASE_URL') || 'http://localhost:8010'
    ).replace(/\/$/, '');
    this.pathocollabBaseUrl = (
      this.configService.get<string>('PATHOCOLLAB_API_URL') || 'http://localhost:18004'
    ).replace(/\/$/, '');
  }

  /**
   * Récupère (ou crée) la room d'annotation collaborative OncoVision liée à une réunion.
   *
   * La room est identifiée par son `roomName`, dans laquelle on stocke le `meetingId`
   * OncoCollab. Les images annotées sont les lames PathoCollab des patients de la
   * réunion, exportées au préalable vers le registre d'images OncoVision.
   */
  async createOrGetCollaborationRoom(meetingId: string, patientIds: string[]): Promise<string | null> {
    try {
      const existing = await this.findRoomByName(meetingId);
      if (existing) return existing.roomId;

      const imageIds = await this.exportPatientImages(patientIds);
      if (!imageIds.length) return null;

      // Une room OncoVision est rattachée à une seule image : on prend la première exportée.
      return await this.createRoom(meetingId, imageIds[0]);
    } catch (err) {
      this.logger.warn(`Impossible de créer/récupérer la room OncoVision pour la réunion ${meetingId}: ${err}`);
      return null;
    }
  }

  private async findRoomByName(roomName: string): Promise<OncoVisionRoomInfo | null> {
    const { data: rooms } = await axios.get<OncoVisionRoomInfo[]>(`${this.oncovisionBaseUrl}/draw/rooms`);
    return rooms.find((room) => room.roomName === roomName) ?? null;
  }

  private async createRoom(roomName: string, imageId: string): Promise<string | null> {
    const { data: created } = await axios.post<OncoVisionRoomInfo>(`${this.oncovisionBaseUrl}/draw/rooms`, {
      name: roomName,
      imageId,
    });
    return created.roomId ?? null;
  }

  /**
   * Exporte vers OncoVision les lames PathoCollab des patients donnés et retourne
   * les identifiants d'image OncoVision correspondants.
   */
  private async exportPatientImages(patientIds: string[]): Promise<string[]> {
    const imageIds: string[] = [];

    for (const patientId of patientIds) {
      const wsis = await this.fetchPatientWsis(patientId);

      for (const wsi of wsis) {
        const imageId = await this.exportWsiImage(patientId, wsi);
        if (imageId) imageIds.push(imageId);
      }
    }

    return imageIds;
  }

  private async fetchPatientWsis(patientId: string): Promise<PathoCollabWsi[]> {
    try {
      const { data } = await axios.get<{ wsis?: PathoCollabWsi[]; slides?: PathoCollabWsi[] }>(
        `${this.pathocollabBaseUrl}/api/wsi/patients/${encodeURIComponent(patientId)}/wsis`,
      );
      return data.wsis ?? data.slides ?? [];
    } catch (err) {
      this.logger.warn(`Impossible de récupérer les lames PathoCollab du patient ${patientId}: ${err}`);
      return [];
    }
  }

  private async exportWsiImage(patientId: string, wsi: PathoCollabWsi): Promise<string | null> {
    try {
      const downloadUrl = `${this.pathocollabBaseUrl}/api/wsi/patients/${encodeURIComponent(patientId)}/${encodeURIComponent(wsi.wsi_id)}/download`;
      const { data: fileData, headers } = await axios.get<ArrayBuffer>(downloadUrl, {
        responseType: 'arraybuffer',
      });

      const filename = wsi.filename || `${wsi.wsi_id}.tiff`;
      const contentType = headers['content-type'] || 'application/octet-stream';

      const form = new FormData();
      form.append('file', new Blob([fileData], { type: contentType }), filename);

      const { data: uploaded } = await axios.post<OncoVisionUploadResult>(
        `${this.oncovisionBaseUrl}/viewer/images`,
        form,
      );

      return uploaded.id ?? null;
    } catch (err) {
      this.logger.warn(`Impossible d'exporter la lame ${wsi.wsi_id} du patient ${patientId} vers OncoVision: ${err}`);
      return null;
    }
  }
}
