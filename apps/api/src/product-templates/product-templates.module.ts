import { Module } from '@nestjs/common';
import { ProductTemplatesService } from './product-templates.service';
import { ProductTemplatesController } from './product-templates.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductTemplatesController],
  providers: [ProductTemplatesService],
  exports: [ProductTemplatesService],
})
export class ProductTemplatesModule {}
