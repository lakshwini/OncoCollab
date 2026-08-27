import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PathocollabService } from './pathocollab.service';

@Controller('pathocollab')
@UseGuards(JwtAuthGuard)
export class PathocollabController {
  constructor(private readonly pathocollabService: PathocollabService) {}

  /**
   * GET /pathocollab/token
   * Fournit au frontend un token PathoCollab valide (compte de service), obtenu
   * côté serveur pour contourner le CORS de l'auth-service PathoCollab.
   */
  @Get('token')
  async getToken() {
    const token = await this.pathocollabService.getToken();
    return { access_token: token };
  }
}
