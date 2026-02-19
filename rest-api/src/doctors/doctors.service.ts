import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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

  async changePassword(doctorId: string, currentPassword: string, newPassword: string) {
    const doctor = await this.doctorsRepository.findOne({ where: { doctorID: doctorId } });
    if (!doctor) throw new NotFoundException('Médecin introuvable');

    const isValid = await argon2.verify(doctor.password, currentPassword);
    if (!isValid) throw new UnauthorizedException('Mot de passe actuel incorrect');

    const hashedPassword = await argon2.hash(newPassword);
    await this.doctorsRepository.update(doctorId, { password: hashedPassword });
    return { success: true, message: 'Mot de passe mis à jour avec succès' };
  }
}
