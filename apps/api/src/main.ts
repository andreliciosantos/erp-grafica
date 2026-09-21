import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Prefixo global para versionamento da API
  app.setGlobalPrefix('api/v1');

  // Habilitar CORS para clientes Web e Mobile
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Validação global com class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Filtro global de exceções conforme RFC 7807
  app.useGlobalFilters(new HttpExceptionFilter());

  // Configuração interativa do Swagger OpenAPI para testes direto no navegador
  const config = new DocumentBuilder()
    .setTitle('ERP Gráfica Modular API')
    .setDescription(
      'Documentação interativa e playground para testes de endpoints do ERP Gráfica Modular (Web & Mobile)'
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Insira o token JWT gerado em /api/v1/auth/login',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'ERP Gráfica - Swagger API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 ERP Gráfica Modular API rodando na porta: ${port}`);
  logger.log(`🔗 API Base URL: http://localhost:${port}/api/v1`);
  logger.log(`📖 Documentação Interativa (Swagger): http://localhost:${port}/docs`);
  logger.log(`📡 WebSocket Gateway ativo em: ws://localhost:${port}`);
}

bootstrap();
