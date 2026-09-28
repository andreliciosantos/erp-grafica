import { Module } from '@nestjs/common';
import { QuickServicePresetsService } from './quick-service-presets.service';
import { QuickServicePresetsController } from './quick-service-presets.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuickServicePresetsController],
  providers: [QuickServicePresetsService],
  exports: [QuickServicePresetsService],
})
export class QuickServicePresetsModule {}
