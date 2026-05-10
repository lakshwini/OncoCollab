import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PersonalFilesService } from './personal-files.service';

interface AuthRequest {
  user: { sub?: string; doctorID?: string; email?: string };
}

@Controller('personal-files')
@UseGuards(JwtAuthGuard)
export class PersonalFilesController {
  constructor(private readonly service: PersonalFilesService) {}

  private getDoctorId(req: AuthRequest): string {
    const id = req.user.doctorID || req.user.sub;
    if (!id) throw new BadRequestException('Docteur introuvable dans le JWT');
    return id;
  }

  @Get()
  list(@Req() req: AuthRequest) {
    return this.service.listForDoctor(this.getDoctorId(req));
  }

  @Get('unread-count')
  async unreadCount(@Req() req: AuthRequest) {
    const count = await this.service.unreadCountForDoctor(this.getDoctorId(req));
    return { count };
  }

  @Patch(':id/read')
  markRead(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.service.markRead(this.getDoctorId(req), id);
  }

  @Delete(':id')
  remove(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.service.remove(this.getDoctorId(req), id);
  }
}
