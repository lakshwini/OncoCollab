import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn({ name: 'roleid' })
  roleID: number;

  @Column({ name: 'rolename', unique: true })
  roleName: string;
}