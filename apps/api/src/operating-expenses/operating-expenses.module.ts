import { Module } from '@nestjs/common';
import { OperatingExpensesService } from './operating-expenses.service';
import { OperatingExpensesController } from './operating-expenses.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OperatingExpensesController],
  providers: [OperatingExpensesService],
  exports: [OperatingExpensesService],
})
export class OperatingExpensesModule {}
