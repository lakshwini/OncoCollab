import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/updated-room.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RoomsService {
    constructor(
        @InjectRepository(Room)
        private readonly roomRepository: Repository<Room>,
    ) { }

    async create(createRoomDto: CreateRoomDto): Promise<Room> {
        // Préparation des données avec l'UUID
        const roomData = {
            ...createRoomDto,
            roomId: uuidv4(),
            active: true
        };
       
        // On crée l'instance et on la sauvegarde
        const newRoom = this.roomRepository.create(roomData);
        return await this.roomRepository.save(newRoom);
    }

    async findAll(): Promise<Room[]> {
        return await this.roomRepository.find();
    }

    async findOne(id: string): Promise<Room> {

        const room = await this.roomRepository.findOne({
            where: { id: parseInt(id, 10) }
        });
        if (!room) throw new NotFoundException(`Room with ID ${id} not found`);
        return room;
    }

    async update(id: string, updateRoomDto: UpdateRoomDto): Promise<Room> {
        await this.roomRepository.update(parseInt(id, 10), updateRoomDto as any);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        await this.roomRepository.delete(parseInt(id, 10));
    }

    async disable(id: string): Promise<Room> {
        await this.roomRepository.update(parseInt(id, 10), { active: false } as any);
        return this.findOne(id);
    }

    async enable(id: string): Promise<Room> {
        await this.roomRepository.update(parseInt(id, 10), { active: true } as any);
        return this.findOne(id);
    }
}