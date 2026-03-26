import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('rooms')
export class Room {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    roomId: string;

    @Column()
    name: string;

    @Column({ default: true })
    active: boolean;
}