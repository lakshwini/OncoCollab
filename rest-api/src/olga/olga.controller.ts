import { Controller, Get, Param } from '@nestjs/common';
import { OlgaService } from './olga.service';

@Controller()
export class OlgaController {
  constructor(private readonly olgaService: OlgaService) {}

  @Get('prerequisite-form/:role')
  async getPrerequisiteFormForRole(@Param('role') role: string) {
    return this.olgaService.getFormByRole(role);
  }

  @Get('olga/form/:role')
  async getFormForRole(@Param('role') role: string) {
    return this.olgaService.getFormForRole(role);
  }
}