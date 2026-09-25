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
      'Documentação interativa e playground OpenAPI 3.0 para a API do ERP Gráfica Modular (Web, Mobile e Integrações).\n\n' +
      '### Como Testar Rotas Protegidas:\n' +
      '1. Faça login em `POST /api/v1/auth/login` com as credenciais (ex: admin@erpgrafica.com / admin123).\n' +
      '2. Copie o `accessToken` retornado.\n' +
      '3. Clique no botão verde **Authorize** no topo desta página e cole o token.\n' +
      '4. Todos os endpoints autenticados passarão a responder normalmente com seus dados.',
    )
    .setVersion('1.0.0')
    .addTag('Autenticação', 'Autenticação de usuários e emissão de tokens JWT')
    .addTag('Usuários', 'Gestão administrativa de contas de acesso e perfis (RBAC)')
    .addTag('Clientes e Fornecedores', 'Cadastro unificado de pessoas físicas e jurídicas (PF/PJ)')
    .addTag('Matéria-Prima e Insumos', 'Gestão de papéis, chapas, tintas, consumíveis e estoque')
    .addTag('Máquinas e Equipamentos', 'Parque fabril, custos/hora, tempos de setup e velocidades nominais')
    .addTag('Modelos de Produtos', 'Gabaritos pré-definidos para orçamentação ágil')
    .addTag('Orçamentos Técnicos', 'Cálculo de corte, aproveitamento de folha, consumo e markup')
    .addTag('Ordens de Serviço', 'Controle da esteira produtiva, estados e baixa de estoque')
    .addTag('Chão de Fábrica - Apontamentos', 'Apontamentos em tempo real de operadores, tempos e perdas nas etapas')
    .addTag('Financeiro e DRE', 'Demonstração do Resultado do Exercício (DRE) gerencial e fluxo de caixa')
    .addTag('Contas a Receber', 'Gestão de títulos, parcelamento automático de OSs e liquidações')
    .addTag('Despesas Operacionais', 'Custos fixos e variáveis (OPEX) e duplicação mensal')
    .addTag('Colaboradores e RH', 'Cadastro de funcionários, turnos, salários e rateio de custo homem/hora')
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
