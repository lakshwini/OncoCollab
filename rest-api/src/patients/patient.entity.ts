import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  patientID: string;

  @Column({ unique: true })
  patient_number: string;

  @Column()
  lastName: string;

  @Column()
  firstName: string;

  @Column({ type: 'date' })
  dateOfBirth: Date;

  @Column({ type: 'char', length: 1 })
  sex: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}