import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './doctors.entity';
import * as argon2 from 'argon2';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,
  ) {}

  async findAll(): Promise<Doctor[]> {
    return this.doctorsRepository.find();
  }

  async findByEmail(email: string): Promise<Doctor | null> {
    return this.doctorsRepository.findOne({
      where: { email },
      relations: ['role'],
    });
  }

  async create(doctorData: Partial<Doctor>): Promise<Doctor> {
    if (doctorData.password) {
      doctorData.password = await argon2.hash(doctorData.password);
    }
    const doctor = this.doctorsRepository.create(doctorData);
    return this.doctorsRepository.save(doctor);
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await argon2.hash(newPassword);
    await this.doctorsRepository.update(id, { password: hashedPassword });
  }
}
