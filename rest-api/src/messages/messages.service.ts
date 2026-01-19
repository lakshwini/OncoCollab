import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'; // Import TypeORM
import { Repository } from 'typeorm';              // Import Repository
import { Message } from './entities/message.entity'; // Utilise l'entité qu'on a créée
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
    // Le constructeur utilise maintenant le Repository Postgres
    constructor(
        @InjectRepository(Message) 
        private readonly messageRepository: Repository<Message>
    ) { }

    async create(createMessageDto: CreateMessageDto) {
        // Avec TypeORM, on utilise create() puis save()
        const newMessage = this.messageRepository.create(createMessageDto);
        return await this.messageRepository.save(newMessage);
    }

    findAll() {
        // Pour un panel admin futur
        return this.messageRepository.find();
    }

    async findByRoom(roomId: string): Promise<Message[]> {
        // Remplace le .find().sort().exec() de Mongo par find() avec options
        return await this.messageRepository.find({
            where: { roomId: roomId },
            order: { createdAt: 'ASC' } // Tri par date croissante
        });
    }

    async remove(id: string) {
        // Suppression par ID (TypeORM)
        return await this.messageRepository.delete(id);
    }
}