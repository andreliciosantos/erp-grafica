import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './events/events.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PartiesModule } from './parties/parties.module';
import { RawMaterialsModule } from './raw-materials/raw-materials.module';
import { MachinesModule } from './machines/machines.module';
import { QuotesModule } from './quotes/quotes.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    EventsModule,
    AuthModule,
    UsersModule,
    PartiesModule,
    RawMaterialsModule,
    MachinesModule,
    QuotesModule,
    WorkOrdersModule,
  ],
})
export class AppModule {}
