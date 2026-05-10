import { IsOptional, IsString, IsUUID } from 'class-validator';

export class GenerateReportFromTextDto {
  @IsString()
  transcription: string;

  @IsOptional()
  @IsString()
  meetingTitle?: string;

  @IsOptional()
  @IsString()
  meetingType?: string;
}

export class ReportListQueryDto {
  @IsOptional()
  @IsUUID()
  meetingId?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class SemanticSearchDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
