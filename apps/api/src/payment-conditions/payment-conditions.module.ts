import { Module } from '@nestjs/common';
import { PaymentConditionsService } from './payment-conditions.service';
import { PaymentConditionsController } from './payment-conditions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentConditionsController],
  providers: [PaymentConditionsService],
  exports: [PaymentConditionsService],
})
export class PaymentConditionsModule {}
