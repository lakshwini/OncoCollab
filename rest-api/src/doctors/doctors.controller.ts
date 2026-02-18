import {
  Controller,
  Get,
  Post,
  Delete,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DataSource } from 'typeorm';
import { DoctorsStorageService } from './doctors-storage.service';

@Controller('doctors')
@UseGuards(JwtAuthGuard)
export class DoctorsController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly storageService: DoctorsStorageService,
  ) {}

  @Get()
  async findAll() {
    const doctors = await this.dataSource.query(`
      SELECT
        d.doctorid as "doctorId",
        d.email,
        d.firstname as "firstName",
        d.lastname as "lastName",
        COALESCE(r.rolename, 'Non spécifié') as speciality,
        d.is_active as "isActive",
        d.profile_image_url as "profileImageUrl"
      FROM doctors d
      LEFT JOIN roles r ON d.roleid = r.roleid
      WHERE d.is_active = true
      ORDER BY d.lastname, d.firstname
    `);
    return doctors;
  }

  /**
   * Upload une photo de profil
   * POST /doctors/profile-image
   */
  @Post('profile-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    const doctorId = req.user.doctorID || req.user.sub;

    if (!file) {
      throw new Error('Aucun fichier fourni');
    }

    const url = await this.storageService.uploadProfileImage(
      doctorId,
      file.buffer,
      file.originalname,
    );

    return {
      success: true,
      profileImageUrl: url,
    };
  }

  /**
   * Supprime la photo de profil
   * DELETE /doctors/profile-image
   */
  @Delete('profile-image')
  async deleteProfileImage(@Request() req: any) {
    const doctorId = req.user.doctorID || req.user.sub;
    await this.storageService.deleteProfileImage(doctorId);

    return {
      success: true,
      message: 'Photo de profil supprimée',
    };
  }

  /**
   * Récupère l'URL de la photo de profil
   * GET /doctors/:id/profile-image
   */
  @Get(':id/profile-image')
  async getProfileImage(@Param('id') doctorId: string) {
    const url = await this.storageService.getProfileImageUrl(doctorId);
    const initials = await this.storageService.getInitials(doctorId);

    return {
      profileImageUrl: url,
      initials,
    };
  }
}
