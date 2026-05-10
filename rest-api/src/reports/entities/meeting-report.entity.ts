import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type ReportStatus = 'pending' | 'processing' | 'ready' | 'failed';

@Entity('meeting_reports')
export class MeetingReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'meeting_id' })
  meetingId: string;

  @Column({ type: 'uuid', name: 'transcript_id', nullable: true })
  transcriptId: string;

  @Column({ type: 'varchar', length: 255, default: 'Compte-rendu de RCP' })
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'jsonb', name: 'structured_data', nullable: true })
  structuredData: Record<string, unknown>;

  @Column({ type: 'text', name: 'pdf_url', nullable: true })
  pdfUrl: string;

  @Column({ type: 'varchar', length: 255, name: 'pdf_filename', nullable: true })
  pdfFilename: string;

  @Column({ type: 'int', name: 'pdf_size_bytes', nullable: true })
  pdfSizeBytes: number;

  @Column({ type: 'varchar', length: 64, name: 'qdrant_point_id', nullable: true })
  qdrantPointId: string;

  @Column({ type: 'varchar', length: 20, default: 'ready' })
  status: ReportStatus;

  @Column({ type: 'text', name: 'error_message', nullable: true })
  errorMessage: string;

  @Column({ type: 'uuid', name: 'generated_by', nullable: true })
  generatedBy: string;

  @CreateDateColumn({ name: 'generated_at' })
  generatedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
