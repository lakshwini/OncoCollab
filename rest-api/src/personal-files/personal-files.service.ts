import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorPersonalFile } from './entities/personal-file.entity';

@Injectable()
export class PersonalFilesService {
  constructor(
    @InjectRepository(DoctorPersonalFile)
    private readonly repo: Repository<DoctorPersonalFile>,
  ) {}

  async listForDoctor(doctorId: string) {
    return this.repo.find({
      where: { doctorId },
      order: { createdAt: 'DESC' },
    });
  }

  async unreadCountForDoctor(doctorId: string): Promise<number> {
    return this.repo.count({ where: { doctorId, isRead: false } });
  }

  async markRead(doctorId: string, fileId: string) {
    const file = await this.repo.findOne({ where: { id: fileId } });
    if (!file) throw new NotFoundException('Fichier introuvable');
    if (file.doctorId !== doctorId) {
      throw new ForbiddenException(`Ce fichier ne fait pas partie de votre dossier personnel`);
    }
    file.isRead = true;
    file.accessCount = (file.accessCount || 0) + 1;
    file.lastAccessedAt = new Date();
    return this.repo.save(file);
  }

  async remove(doctorId: string, fileId: string) {
    const file = await this.repo.findOne({ where: { id: fileId } });
    if (!file) throw new NotFoundException('Fichier introuvable');
    if (file.doctorId !== doctorId) {
      throw new ForbiddenException(`Suppression interdite`);
    }
    // ⚠️ On supprime uniquement la référence dans le dossier perso, pas le PDF Supabase ni le report
    await this.repo.delete({ id: fileId });
    return { success: true };
  }
}
