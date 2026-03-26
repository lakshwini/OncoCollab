import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OlgaController } from './olga.controller';
import { OlgaService } from './olga.service';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [OlgaController],
  providers: [OlgaService],
  exports: [OlgaService],
})
export class OlgaModule {}