import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity'; // On utilise l'entité qu'on a créée ensemble
import * as argon2 from "argon2";
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) { }

    async create(createUserDto: CreateUserDto) {
        // Hashage du mot de passe
        createUserDto.password = await argon2.hash(createUserDto.password);
       
        // Création avec TypeORM
        const newUser = this.userRepository.create(createUserDto);
        return await this.userRepository.save(newUser);
    }

    async findAll() {
        return await this.userRepository.find();
    }

    async findOne(id: string) {
        const user = await this.userRepository.findOne({ where: { id: parseInt(id, 10) } });
        if (!user) throw new NotFoundException(`User with ID ${id} not found`);
        return user;
    }

    async findByEmail(email: string) {
        // Recherche par email avec TypeORM
        return await this.userRepository.findOne({ where: { email } });
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        await this.userRepository.update(parseInt(id, 10), updateUserDto as any);
        return this.findOne(id);
    }

    async remove(id: string) {
        return await this.userRepository.delete(parseInt(id, 10));
    }
}