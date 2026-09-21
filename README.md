# ERP Gráfica Modular 🖨️📦

Sistema de Gestão Empresarial (ERP) especializado para a indústria gráfica, desenvolvido em arquitetura modular monorepo de alto desempenho voltado para plataformas **Web** e **Mobile**.

---

## 🚀 Tecnologias e Arquitetura

- **Monorepo:** [Turborepo](https://turbo.build/) + [pnpm Workspaces](https://pnpm.io/)
- **Backend API:** [NestJS](https://nestjs.com/) v11 + TypeScript estrito
- **Banco de Dados & ORM:** [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM](https://www.prisma.io/)
- **Documentação & Playground:** [Swagger OpenAPI](https://swagger.io/) (`@nestjs/swagger`)
- **Precisão Matemática:** [Decimal.js](https://mikemcl.github.io/decimal.js/) para cálculos financeiros e aproveitamento de corte
- **Comunicação em Tempo Real:** [WebSocket](https://socket.io/) Gateway integrado para atualizações de chão de fábrica
- **Padronização de Erros:** [RFC 7807 (Problem Details)](https://datatracker.ietf.org/doc/html/rfc7807)
- **Testes Automatizados:** [Vitest](https://vitest.dev/)

---

## 📁 Estrutura do Projeto

```text
erp-grafica/
├── apps/
│   └── api/                    # Backend NestJS (REST + WebSocket Gateway + Swagger)
│       ├── src/
│       │   ├── auth/           # JWT, Passport, Guards de permissão (RBAC)
│       │   ├── common/         # Filtros globais RFC 7807 e interceptors
│       │   ├── events/         # Gateway WebSocket para produção em tempo real
│       │   ├── machines/       # Cadastro de impressoras (Offset e Digital)
│       │   ├── parties/        # Clientes e Fornecedores
│       │   ├── prisma/         # Conexão resiliente com o banco PostgreSQL
│       │   ├── quotes/         # Orçamentos técnicos integrados ao business-core
│       │   ├── raw-materials/  # Papéis, gramaturas, formatos e estoque
│       │   ├── users/          # Gestão de usuários e operadores
│       │   ├── work-orders/    # Ordens de Serviço, máquina de estados e chão de fábrica
│       │   ├── app.module.ts
│       │   └── main.ts         # Inicialização e setup do Swagger
│       └── test/               # Testes de integração da API
├── packages/
│   ├── business-core/          # Motor matemático puro de corte de folha e precificação
│   │   ├── src/
│   │   │   ├── sheet-cutting.ts   # Aproveitamento de folha (sangria, pinça, rotação 90°)
│   │   │   └── pricing-engine.ts  # Formação de preço, margens e markup com Decimal.js
│   │   └── tests/                 # Testes unitários com 100% de cobertura
│   ├── database/               # Prisma Schema, Seeds e Migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Modelos relacionais e Enums industriais
│   │   │   └── seed.ts         # Seed com máquinas, papéis e usuários
│   │   └── src/index.ts
│   ├── shared-types/           # Contratos, DTOs e Enums compartilhados entre API e Frontend
│   └── tsconfig/               # Presets de compilação TypeScript
├── test-swagger.cjs            # Suíte de teste automatizada dos 19 endpoints OpenAPI
├── docker-compose.yml          # Configuração de containers PostgreSQL e Redis
└── turbo.json                  # Pipelines Turborepo
```

---

## ⚡ Como Executar Localmente

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) (v20 ou superior)
- [pnpm](https://pnpm.io/) (v9 ou superior)

### 2. Instalação das Dependências
```bash
pnpm install
```

### 3. Banco de Dados e Seeds
```bash
# Executa as migrations do Prisma
pnpm db:migrate

# Popula o banco com os dados iniciais de teste (Admin, Operador, Máquinas e Insumos)
pnpm --filter @erp/database db:seed
```

### 4. Executar em Modo de Desenvolvimento (Hot-reload / Estilo Nodemon)
```bash
# Executa a API com monitoramento de arquivos e recarregamento automático
pnpm --filter api dev

# Ou na raiz para rodar o pipeline completo
pnpm dev
```

---

## 📖 Testando a API no Navegador (Swagger OpenAPI)

A API disponibiliza uma interface interativa completa para testar e inspecionar todas as chamadas direto no navegador:

- **Swagger UI:** [http://localhost:3000/docs](http://localhost:3000/docs)
- **OpenAPI JSON:** [http://localhost:3000/docs-json](http://localhost:3000/docs-json)

### Credenciais Padrão de Teste:
- **E-mail:** `admin@erpgrafica.com`
- **Senha:** `admin123`

*(Faça o login em `POST /api/v1/auth/login`, copie o `accessToken` gerado e insira no botão verde **Authorize** no topo do Swagger).*

---

## 🧪 Testes Automatizados

O projeto conta com suítes abrangentes de testes unitários e de integração:

```bash
# Executar todos os testes de todos os pacotes via Turborepo
pnpm test

# Executar a suíte de validação de ponta a ponta dos 19 endpoints da API
node test-swagger.cjs
```

---

## ⚙️ Regras Industriais Implementadas

1. **Aproveitamento de Folha:**
   - Cálculo automático do maior número de peças por folha inteira testando disposição direta e rotacionada a 90°.
   - Desconto obrigatório de sangria padrão e margem de pinça da impressora.
2. **Formação de Preço e Markup:**
   - Custo de papel calculado por peso/gramatura ou folhas necessárias.
   - Custo de hora-máquina considerando tempo de acerto (setup) e tiragem dividida pela velocidade nominal.
   - Aplicação de markup comercial sem distorções de arredondamento de ponto flutuante.
3. **Máquina de Estados de Produção:**
   - Fluxo sequencial estrito: `PENDING` ➔ `PRE_PRESS` ➔ `PRINTING` ➔ `FINISHING` ➔ `QUALITY_CONTROL` ➔ `READY_FOR_PICKUP` ➔ `DELIVERED`.
   - Baixa automática de insumos no estoque ao iniciar a fase de impressão (`PRINTING`).
   - Estorno automático em caso de cancelamento.
   - Apontamento de chão de fábrica (`START`, `PAUSE`, `COMPLETE`) com rastreamento de perdas operacionais.
