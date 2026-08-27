import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';

export class SaveTranscriptionBlockDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsString()
  speakerName?: string;

  @IsOptional()
  @IsUUID()
  speakerId?: string;

  @IsNumber()
  blockOrder: number;

  @IsOptional()
  @IsNumber()
  timestampSeconds?: number;

  @IsOptional()
  @IsString()
  source?: 'speechcore' | 'whisper' | 'manual';
}
