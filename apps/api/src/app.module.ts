import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { EventsModule } from './events/events.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PartiesModule } from './parties/parties.module';
import { RawMaterialsModule } from './raw-materials/raw-materials.module';
import { MachinesModule } from './machines/machines.module';
import { QuotesModule } from './quotes/quotes.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';
import { EmployeesModule } from './employees/employees.module';
import { OperatingExpensesModule } from './operating-expenses/operating-expenses.module';
import { ReceivablesModule } from './receivables/receivables.module';
import { FinancialModule } from './financial/financial.module';
import { ProductTemplatesModule } from './product-templates/product-templates.module';
import { PaymentConditionsModule } from './payment-conditions/payment-conditions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    MailModule,
    EventsModule,
    AuthModule,
    UsersModule,
    PartiesModule,
    RawMaterialsModule,
    MachinesModule,
    QuotesModule,
    WorkOrdersModule,
    EmployeesModule,
    OperatingExpensesModule,
    ReceivablesModule,
    FinancialModule,
    ProductTemplatesModule,
    PaymentConditionsModule,
  ],
})
export class AppModule {}
