import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('doctor_personal_files')
export class DoctorPersonalFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'doctor_id' })
  doctorId: string;

  @Column({ type: 'uuid', name: 'report_id', nullable: true })
  reportId: string;

  @Column({ type: 'uuid', name: 'meeting_id', nullable: true })
  meetingId: string;

  @Column({ type: 'varchar', length: 50, name: 'file_type', default: 'pdf' })
  fileType: string;

  @Column({ type: 'varchar', length: 255, name: 'file_name' })
  fileName: string;

  @Column({ type: 'text', name: 'file_url' })
  fileUrl: string;

  @Column({ type: 'int', name: 'file_size', nullable: true })
  fileSize: number;

  @Column({ type: 'boolean', name: 'is_read', default: false })
  isRead: boolean;

  @Column({ type: 'int', name: 'access_count', default: 0 })
  accessCount: number;

  @Column({ type: 'timestamp', name: 'last_accessed_at', nullable: true })
  lastAccessedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
