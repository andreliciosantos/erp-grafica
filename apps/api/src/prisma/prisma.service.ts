import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@erp/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('✅ Connected to PostgreSQL Database via Prisma');
    } catch (error) {
      this.logger.warn(
        '⚠️ Could not connect to PostgreSQL on startup. Ensure DATABASE_URL is accessible or Docker container is running.'
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
