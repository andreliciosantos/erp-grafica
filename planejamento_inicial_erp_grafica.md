# Master Prompt & Especificação Técnica: ERP Gráfica Modular (Node.js/PostgreSQL)

> **Instrução para a LLM / Agente de Código:**  
> Você é o Engenheiro de Software Sênior encarregado de implementar a fundação deste ERP. Leia atentamente todas as seções antes de codificar. Não tente implementar múltiplos aplicativos de uma vez. Siga rigorosamente a ordem das fases na **Seção 8**, entregando código tipado em TypeScript, sem uso de `any`, com validação de entradas via `class-validator` ou `zod`, e tratamento de erros padronizado.

---

## 1. Visão Geral e Arquitetura

O sistema é um ERP modular para gráficas de pequeno/médio porte, com arquitetura **API-First (Headless)** desacoplada. Toda a lógica de negócio, máquina de estados e cálculos residem exclusivamente no backend.

### 1.1 Clientes Suportados (Consumidores da API)
1. **Web (React/Vite/Next.js):** Gestão administrativa, financeira, comercial e relatórios.
2. **Desktop (Tauri/React):** Chão de fábrica com leitor de código de barras/QR Code e integração local com impressoras térmicas.
3. **Mobile (React Native/Expo):** Consulta de pedidos, acompanhamento de produção e força de vendas externa.
4. **Chatbot / Integração Externa (WhatsApp/Telegram via Baileys, Evolution API ou bot oficial):** Consulta de status de OS por clientes, cadastro simplificado de leads e orçamentos guiados via linguagem natural/menus.

```
                            ┌───────────────────────────────────┐
                            │        Múltiplos Clientes         │
                            │ ├─ Web Admin (React)              │
                            │ ├─ Desktop Chão de Fábrica (Tauri)│
                            │ ├─ Mobile Vendas (React Native)   │
                            │ └─ Chatbot (WhatsApp / Telegram)  │
                            └─────────────────┬─────────────────┘
                                              │ HTTPS / WSS
                                              ▼
                            ┌───────────────────────────────────┐
                            │     API Central (NestJS Node.js)  │
                            │ ├─ JWT / RBAC / Service API Keys  │
                            │ ├─ Máquina de Estados da OS       │
                            │ ├─ Motor Matemático de Preço/Corte│
                            │ └─ WebSocket Gateway (Produção)   │
                            └─────────────────┬─────────────────┘
                                              │ Prisma ORM
                                              ▼
                            ┌───────────────────────────────────┐
                            │       PostgreSQL Database         │
                            └───────────────────────────────────┘
```

---

## 2. Estrutura do Repositório (Monorepo)

O projeto utilizará **Turborepo** com gerenciador de pacotes **pnpm**:

```text
erp-grafica/
├── apps/
│   ├── api/                    # NestJS REST & WebSocket Gateway
│   ├── web/                    # Interface Web Administrativa/Comercial
│   ├── desktop/                # Chão de fábrica (Tauri + React)
│   ├── mobile/                 # App Mobile (Expo / React Native)
│   └── bot/                    # [Módulo Futuro] Worker / Webhook Chatbot
├── packages/
│   ├── database/               # Prisma Schema, Migrations, Seeds e Client exportável
│   ├── business-core/          # Funções puras: motor de corte e precificação (100% testado)
│   ├── shared-types/           # DTOs, Enums, Interfaces de Request/Response
│   └── tsconfig/               # Configurações TypeScript padronizadas
├── docker-compose.yml          # PostgreSQL 16 e Redis (filas/eventos)
├── package.json
└── turbo.json
```

---

## 3. Schema Completo do Banco de Dados (Prisma / PostgreSQL)

Coloque este modelo no pacote `packages/database/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ADMIN
  COMMERCIAL
  FINANCIAL
  OPERATOR
  BOT_SERVICE
}

enum ChannelSource {
  WEB
  DESKTOP
  MOBILE
  WHATSAPP
  TELEGRAM
  API_INTEGRATION
}

enum PartyType {
  INDIVIDUAL // Pessoa Física
  COMPANY    // Pessoa Jurídica
}

enum RawMaterialCategory {
  PAPER       // Papéis (Couché, Offset, Duplex, etc.)
  VINYL       // Lonas e Vinis adesivos
  INK         // Tintas, toners
  PLATE       // Chapas offset, matrizes
  FINISHING   // Vernizes, ribbons, bobinas de laminação
  CONSUMABLE  // Estopa, solventes, fita dupla face
}

enum QuoteStatus {
  DRAFT
  SENT
  APPROVED
  REJECTED
  EXPIRED
}

enum WorkOrderStatus {
  PENDING
  PRE_PRESS
  PRINTING
  FINISHING
  QUALITY_CONTROL
  READY_FOR_PICKUP
  DISPATCHED
  DELIVERED
  CANCELLED
}

enum StageStatus {
  PENDING
  IN_PROGRESS
  PAUSED
  COMPLETED
}

enum PaymentStatus {
  PENDING
  PARTIALLY_PAID
  PAID
  OVERDUE
  CANCELLED
}

// -------------------------------------------------------------
// USUÁRIOS E AUTENTICAÇÃO
// -------------------------------------------------------------
model User {
  id            String       @id @default(uuid())
  name          String
  email         String       @unique
  passwordHash  String
  role          Role         @default(OPERATOR)
  isActive      Boolean      @default(true)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  quotes        Quote[]
  workOrders    WorkOrder[]
  stageLogs     StageExecutionLog[]

  @@map("users")
}

// -------------------------------------------------------------
// CLIENTES E FORNECEDORES
// -------------------------------------------------------------
model Party {
  id            String        @id @default(uuid())
  type          PartyType     @default(INDIVIDUAL)
  name          String        // Razão Social ou Nome Completo
  tradeName     String?       // Nome Fantasia
  document      String        @unique // CPF ou CNPJ (apenas dígitos)
  email         String?
  phone         String        // Obrigatório para identificação em chatbots
  address       String?
  city          String?
  state         String?
  isCustomer    Boolean       @default(true)
  isSupplier    Boolean       @default(false)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  quotes        Quote[]
  workOrders    WorkOrder[]

  @@map("parties")
}

// -------------------------------------------------------------
// INSUMOS & MATÉRIAS-PRIMAS
// -------------------------------------------------------------
model RawMaterial {
  id             String              @id @default(uuid())
  name           String
  category       RawMaterialCategory
  unitOfMeasure  String              // UN, KG, M2, FL (Folha), ML (Metro linear)
  costPerUnit    Decimal             @db.Decimal(12, 4)
  currentStock   Decimal             @default(0) @db.Decimal(12, 4)
  minStock       Decimal             @default(0) @db.Decimal(12, 4)
  
  // Propriedades físicas (especialmente para papel e substratos planos)
  sheetWidthMm   Int?                // Ex: 660 mm
  sheetHeightMm  Int?                // Ex: 960 mm
  grammage       Int?                // Ex: 150 gsm

  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt

  stockMovements StockMovement[]
  quoteItems     QuoteItem[]

  @@map("raw_materials")
}

model StockMovement {
  id             String       @id @default(uuid())
  rawMaterialId  String
  workOrderId    String?
  quantity       Decimal      @db.Decimal(12, 4) // Positivo (entrada), Negativo (saída)
  reason         String       // "CONSUMO_PRODUCAO", "COMPRA", "PERDA_PRODUCAO", "AJUSTE"
  createdAt      DateTime     @default(now())

  rawMaterial    RawMaterial  @relation(fields: [rawMaterialId], references: [id])
  workOrder      WorkOrder?   @relation(fields: [workOrderId], references: [id])

  @@map("stock_movements")
}

// -------------------------------------------------------------
// MÁQUINAS
// -------------------------------------------------------------
model Machine {
  id            String       @id @default(uuid())
  name          String       // Ex: Heidelberg Speedmaster, Konica Minolta C3070
  hourlyRate    Decimal      @db.Decimal(10, 2) // Custo por hora de máquina
  setupMinutes  Int          @default(15)       // Tempo médio de setup
  maxSheetsHour Int?         // Velocidade nominal por hora
  isActive      Boolean      @default(true)

  stageLogs     StageExecutionLog[]

  @@map("machines")
}

// -------------------------------------------------------------
// ORÇAMENTOS (QUOTES)
// -------------------------------------------------------------
model Quote {
  id              String         @id @default(uuid())
  code            Int            @default(autoincrement()) // Ex: 1001
  partyId         String
  userId          String         // Vendedor ou BOT_SERVICE
  status          QuoteStatus    @default(DRAFT)
  origin          ChannelSource  @default(WEB)
  totalCost       Decimal        @db.Decimal(12, 2)
  markupApplied   Decimal        @db.Decimal(6, 3) // Ex: 0.40 para 40%
  totalAmount     Decimal        @db.Decimal(12, 2) // Preço de venda ao cliente
  validUntil      DateTime
  notes           String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  party           Party          @relation(fields: [partyId], references: [id])
  user            User           @relation(fields: [userId], references: [id])
  items           QuoteItem[]
  workOrder       WorkOrder?

  @@map("quotes")
}

model QuoteItem {
  id                   String       @id @default(uuid())
  quoteId              String
  rawMaterialId        String?
  productName          String       // Ex: Cartão de Visita, Folder A4 2 Dobras
  quantity             Int
  widthMm              Int          // Formato aberto (largura)
  heightMm             Int          // Formato aberto (altura)
  colorsFront          Int          // Ex: 4
  colorsBack           Int          // Ex: 4 (4x4) ou 0 (4x0)
  finishingOptions     Json         // Array de acabamentos: ["LAMINACAO_FOSCA", "CORTE_VINCO"]
  
  // Resultados do cálculo técnico
  sheetsRequired       Int
  itemsPerSheet        Int
  paperCostCalculated  Decimal      @db.Decimal(10, 2)
  finishingCostTotal   Decimal      @db.Decimal(10, 2)
  machineCostTotal     Decimal      @db.Decimal(10, 2)
  unitPrice            Decimal      @db.Decimal(10, 4)
  itemTotalAmount      Decimal      @db.Decimal(12, 2)

  quote                Quote        @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  rawMaterial          RawMaterial? @relation(fields: [rawMaterialId], references: [id])

  @@map("quote_items")
}

// -------------------------------------------------------------
// ORDENS DE SERVIÇO (CHÃO DE FÁBRICA)
// -------------------------------------------------------------
model WorkOrder {
  id              String           @id @default(uuid())
  orderNumber     String           @unique // Ex: "OS-2026-00042"
  quoteId         String           @unique
  partyId         String
  userId          String           // Criador da OS
  origin          ChannelSource    @default(WEB)
  status          WorkOrderStatus  @default(PENDING)
  priority        Int              @default(1) // 1: Baixa, 2: Normal, 3: Alta, 4: Urgente
  deliveryDate    DateTime
  fileUrl         String?          // Link do PDF/arte validada
  barcode         String           @unique // Gerado para leitura rápida no chão de fábrica
  totalAmount     Decimal          @db.Decimal(12, 2)
  paymentStatus   PaymentStatus    @default(PENDING)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  quote           Quote            @relation(fields: [quoteId], references: [id])
  party           Party            @relation(fields: [partyId], references: [id])
  user            User             @relation(fields: [userId], references: [id])
  stages          WorkOrderStage[]
  stockMovements  StockMovement[]

  @@map("work_orders")
}

model WorkOrderStage {
  id              String              @id @default(uuid())
  workOrderId     String
  stepOrder       Int                 // 1: Pré-impressão, 2: Impressão, 3: Acabamento, etc.
  name            String              // Nome da etapa
  status          StageStatus         @default(PENDING)
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  workOrder       WorkOrder           @relation(fields: [workOrderId], references: [id], onDelete: Cascade)
  logs            StageExecutionLog[]

  @@unique([workOrderId, stepOrder])
  @@map("work_order_stages")
}

model StageExecutionLog {
  id              String          @id @default(uuid())
  stageId         String
  operatorId      String
  machineId       String?
  startedAt       DateTime        @default(now())
  finishedAt      DateTime?
  wasteQuantity   Int             @default(0) // Quantidade de folhas/peças perdidas
  notes           String?

  stage           WorkOrderStage  @relation(fields: [stageId], references: [id])
  operator        User            @relation(fields: [operatorId], references: [id])
  machine         Machine?        @relation(fields: [machineId], references: [id])

  @@map("stage_execution_logs")
}
```

---

## 4. Regras de Negócio e Algoritmos Puros (`packages/business-core`)

Implemente a lógica abaixo como funções TypeScript puras e crie testes unitários antes de integrá-las aos serviços do NestJS.

### 4.1 Algoritmo de Corte e Aproveitamento de Folha

Dado o formato pai do papel ($L_{\text{pai}} \times A_{\text{pai}}$), o formato do item aberto ($l_{\text{item}} \times a_{\text{item}}$), a sangria $s$ em todos os lados (padrão $3\text{ mm}$) e a margem de pinça $p$ da máquina (padrão $10\text{ mm}$ no topo e na base):

1. **Dimensões úteis do item:**
   $$l_{\text{util}} = l_{\text{item}} + (2 \times s)$$
   $$a_{\text{util}} = a_{\text{item}} + (2 \times s)$$

2. **Dimensões úteis da folha pai (descontando margem de pinça):**
   $$L_{\text{util\_pai}} = L_{\text{pai}}$$
   $$A_{\text{util\_pai}} = A_{\text{pai}} - (2 \times p)$$

3. **Cálculo de Arranjo Direto (Retrato):**
   $$N_{\text{direto}} = \left\lfloor \frac{L_{\text{util\_pai}}}{l_{\text{util}}} \right\rfloor \times \left\lfloor \frac{A_{\text{util\_pai}}}{a_{\text{util}}} \right\rfloor$$

4. **Cálculo de Arranjo Girado (Paisagem):**
   $$N_{\text{girado}} = \left\lfloor \frac{L_{\text{util\_pai}}}{a_{\text{util}}} \right\rfloor \times \left\lfloor \frac{A_{\text{util\_pai}}}{l_{\text{util}}} \right\rfloor$$

5. **Resultado do Arranjo:**
   $$N_{\text{peças\_por\_folha}} = \max(N_{\text{direto}}, N_{\text{girado}})$$

6. **Folhas Pai Necessárias (considerando setup e perdas operacionais padrão de 10%):**
   $$\text{Tiragem\_Efetiva} = \text{Tiragem} \times 1.10$$
   $$\text{Folhas\_Necessárias} = \left\lceil \frac{\text{Tiragem\_Efetiva}}{N_{\text{peças\_por\_folha}}} \right\rceil$$

### 4.2 Formação de Preço do Orçamento

$$\text{Custo}_{\text{Papel}} = \text{Folhas\_Necessárias} \times \text{CustoUnitário}_{\text{Folha}}$$

$$\text{Tempo}_{\text{Máquina (horas)}} = \text{Setup} + \left( \frac{\text{Folhas\_Necessárias}}{\text{VelocidadeNominalHora}} \right)$$

$$\text{Custo}_{\text{Impressão}} = \text{Tempo}_{\text{Máquina}} \times \text{TaxaHoraMáquina}$$

$$\text{CustoTotalInsumos} = \text{Custo}_{\text{Papel}} + \text{Custo}_{\text{Impressão}} + \text{Custo}_{\text{Acabamentos}}$$

$$\text{PreçoVendaFinal} = \frac{\text{CustoTotalInsumos}}{1 - \text{Markup}}$$
*(onde $0 < \text{Markup} < 1$. Exemplo: se Markup = 0.40, a margem de contribuição alvo é 40%).*

---

## 5. Máquina de Estados da Ordem de Serviço (State Machine)

A transição de status da OS deve ser rigorosa e validada pelo backend:

```
[ORÇAMENTO APROVADO]
        │
        ▼
   (PENDING) ──────────┐
        │              │
        ▼              │
  (PRE_PRESS)          │
        │              │
        ▼              ▼
  (PRINTING) ───► (CANCELLED)
        │
        ▼
  (FINISHING)
        │
        ▼
(QUALITY_CONTROL)
        │
        ▼
(READY_FOR_PICKUP)
        │
        ▼
  (DELIVERED)
```

### Regras de Transição e Disparos Automáticos:
1. **`DRAFT -> APPROVED` (em Quotes):** Cria automaticamente a entidade `WorkOrder` com status `PENDING` e gera as etapas obrigatórias (`WorkOrderStage`).
2. **`PENDING -> PRE_PRESS`:** Bloqueia edições comerciais na OS.
3. **`PRE_PRESS -> PRINTING`:** Dispara a **baixa prevista/reserva de estoque** (`StockMovement`) para a quantidade de papel e insumos estimada no orçamento.
4. **`QUALITY_CONTROL -> READY_FOR_PICKUP`:**
   * Registra perdas totais de insumos (`wasteQuantity`).
   * Dispara notificação via WebSocket para a interface Web/Desktop.
   * Se a OS veio de `WHATSAPP` ou `TELEGRAM`, enfileira evento para o bot notificar o cliente: *"Seu pedido OS-xxxx está pronto para retirada!"*.
5. **Qualquer status -> `CANCELLED`:** Estorna movimentos de estoque que haviam sido baixados.

---

## 6. Contratos de API e DTOs Principais (`packages/shared-types`)

### 6.1 Autenticação (`POST /api/v1/auth/login`)
* **Request DTO:**
```typescript
export interface LoginRequestDto {
  email: string;
  password: string;
}
```
* **Response DTO:**
```typescript
export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "COMMERCIAL" | "FINANCIAL" | "OPERATOR" | "BOT_SERVICE";
  };
}
```

### 6.2 Cálculo e Criação de Orçamento (`POST /api/v1/quotes`)
* **Request DTO:**
```typescript
export interface CreateQuoteItemDto {
  productName: string;
  rawMaterialId: string;
  quantity: number;
  widthMm: number;
  heightMm: number;
  colorsFront: number;
  colorsBack: number;
  finishingOptions: string[];
}

export interface CreateQuoteDto {
  partyId: string;
  origin: "WEB" | "DESKTOP" | "MOBILE" | "WHATSAPP" | "TELEGRAM";
  markupApplied: number; // Ex: 0.35 para 35%
  validDays?: number;    // Padrão: 10 dias
  items: CreateQuoteItemDto[];
}
```
* **Response DTO:**
```typescript
export interface QuoteResponseDto {
  id: string;
  code: number;
  partyId: string;
  status: string;
  origin: string;
  totalCost: number;
  markupApplied: number;
  totalAmount: number;
  validUntil: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    sheetsRequired: number;
    itemsPerSheet: number;
    unitPrice: number;
    itemTotalAmount: number;
  }>;
}
```

### 6.3 Consulta de Status por Chatbot (`GET /api/v1/bot/orders/track`)
* **Headers:** `x-api-key: <TOKEN_SERVICO_BOT>`
* **Query Params:** `?phone=5511999999999` ou `?orderNumber=OS-2026-00042`
* **Response DTO:**
```typescript
export interface BotOrderTrackingDto {
  orderNumber: string;
  customerName: string;
  status: string;
  statusLabelPtBr: string; // Ex: "Em Acabamento", "Pronto para Retirada"
  deliveryDate: string;
  totalAmount: number;
  paymentPending: boolean;
}
```

### 6.4 Apontamento de Chão de Fábrica (`POST /api/v1/stages/:stageId/action`)
* **Request DTO:**
```typescript
export interface StageActionDto {
  action: "START" | "PAUSE" | "COMPLETE";
  machineId?: string;
  operatorId: string;
  wasteQuantity?: number;
  notes?: string;
}
```

---

## 7. Preparação para Canais Conversacionais (WhatsApp/Telegram)

Para viabilizar a adição do chatbot sem alterar o núcleo do sistema:
1. Todas as rotas administrativas exigem Bearer JWT (`ADMIN`, `COMMERCIAL`).
2. Rotas consumidas por robôs exigem a guard `ApiKeyGuard`, que valida o header `x-api-key` e autentica a requisição com a `Role.BOT_SERVICE`.
3. Todo cadastro ou consulta realizado via bot preenche automaticamente o campo `origin: ChannelSource.WHATSAPP` ou `TELEGRAM`.
4. Os endpoints de consulta para bot devem aceitar busca por número de telefone com ou sem DDI/DDD, normalizando para apenas dígitos.

---

## 8. Fases de Implementação Passo a Passo (Roteiro da LLM)

Execute uma fase por vez, aguardando validação antes de avançar para a próxima.

### Fase 1: Setup do Monorepo e Infraestrutura
1. Criar Monorepo com Turborepo e `pnpm`.
2. Criar `docker-compose.yml` com serviço `postgres:16-alpine`.
3. Criar o pacote `packages/database` contendo o schema Prisma da **Seção 3** e rodar a primeira migração.
4. Inicializar o app `apps/api` com NestJS, configurando `@nestjs/config`, PrismaModule e validação global via `ValidationPipe`.

### Fase 2: Business Core e Testes Unitários
1. Criar o pacote `packages/business-core`.
2. Implementar as funções matemáticas descritas na **Seção 4** (cálculo de folha pai, tiragem com perda e precificação com markup).
3. Criar suíte de testes com Vitest/Jest cobrindo casos limites (ex.: formatos que só cabem na folha girados a 90°).

### Fase 3: Autenticação e Cadastros Base
1. Implementar autenticação JWT e suporte a `API Key` para o serviço de bot.
2. Criar CRUDs completos com paginação para:
   * Usuários e Operadores (`/users`)
   * Clientes e Fornecedores (`/parties`)
   * Insumos e Papéis (`/raw-materials`)
   * Máquinas (`/machines`)

### Fase 4: Orçamentos e Ordens de Serviço
1. Implementar endpoint de criação e cálculo de orçamentos consumindo o `business-core`.
2. Implementar endpoint de aprovação de orçamento (`POST /quotes/:id/approve`) que cria a `WorkOrder` e inicializa as etapas.
3. Implementar a máquina de estados de transição da OS com movimentação de estoque automática.
4. Adicionar o Gateway WebSocket no NestJS emitindo eventos de mudança de status da OS.

### Fase 5: Endpoint Especializado para Chatbot
1. Criar o controlador `/bot` com proteção por `ApiKeyGuard`.
2. Implementar busca simplificada de OS por telefone ou código de pedido.
3. Implementar endpoint rápido para geração de orçamento prévio.

---

## 9. Convenções de Código Obrigatórias
* **Valores Monetários:** Sempre armazenar no banco como `Decimal(12, 2)` ou `Decimal(12, 4)`. No JavaScript, manipular via biblioteca `decimal.js` para evitar problemas de ponto flutuante.
* **Medidas:** Sempre em milímetros inteiros (`widthMm: 210`, `heightMm: 297`).
* **Tratamento de Exceções:** Retornar sempre o padrão HTTP RFC 7807 (`statusCode`, `message`, `error`, `timestamp`).