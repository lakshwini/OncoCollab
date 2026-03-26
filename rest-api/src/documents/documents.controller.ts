import { Controller, Get } from '@nestjs/common';

@Controller('documents')
export class DocumentsController {
  @Get()
  getDocuments() {
    // Temporary endpoint to keep frontend workspace stable until full document service is wired.
    return [];
  }
}
