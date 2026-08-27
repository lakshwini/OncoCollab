import { Module } from '@nestjs/common';
import { PathocollabController } from './pathocollab.controller';
import { PathocollabService } from './pathocollab.service';

@Module({
  controllers: [PathocollabController],
  providers: [PathocollabService],
  exports: [PathocollabService],
})
export class PathocollabModule {}
