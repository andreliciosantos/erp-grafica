import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@erp/shared-types';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKeyHeader = request.headers['x-api-key'];
    const expectedApiKey = this.configService.get<string>(
      'BOT_API_KEY',
      'bot-secret-key-grafica-2026'
    );

    if (!apiKeyHeader || apiKeyHeader !== expectedApiKey) {
      throw new UnauthorizedException('API Key inválida ou ausente no cabeçalho x-api-key.');
    }

    // Vincula o usuário virtual com Role.BOT_SERVICE na requisição
    request.user = {
      id: 'system-bot-service',
      name: 'Chatbot Automation Service',
      email: 'bot@system.internal',
      role: Role.BOT_SERVICE,
      isActive: true,
    };

    return true;
  }
}
