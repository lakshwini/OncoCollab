import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from '../roles/role.entity';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid', { name: 'doctorid' })
  doctorID: string;

  @Column({ name: 'email', unique: true })
  email: string;

  @Column({ name: 'firstname' })
  firstName: string;

  @Column({ name: 'lastname' })
  lastName: string;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'roleid', referencedColumnName: 'roleID' })
  role: Role;

  @Column({ name: 'is_active', default: true })
  is_active: boolean;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ name: 'password', default: 'L@kshwini29' })
  password: string;
}