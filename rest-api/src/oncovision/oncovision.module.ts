import { Module } from '@nestjs/common';
import { OncovisionService } from './oncovision.service';

@Module({
  providers: [OncovisionService],
  exports: [OncovisionService],
})
export class OncovisionModule {}
