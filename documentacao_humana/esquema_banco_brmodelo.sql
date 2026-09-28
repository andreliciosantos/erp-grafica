/*
================================================================================
  ERP GRÁFICA MODULAR — ESQUEMA RELACIONAL COMPLETO (DDL ANSI / POSTGRESQL)
  Compatível com brModelo, DBeaver, pgAdmin, MySQL Workbench e SqlDBM
  Data de Geração: 2026-09-28
================================================================================
  Este script contém a definição completa das 15 tabelas, chaves primárias (PK),
  chaves estrangeiras (FK), constraints de unicidade e integridade referencial.
================================================================================
*/

-- Criação dos Tipos Enumerados (Enums)
CREATE TYPE "Role" AS ENUM (
  'ADMIN', 'COMMERCIAL', 'FINANCIAL', 'OPERATOR', 'BOT_SERVICE'
);

CREATE TYPE "ChannelSource" AS ENUM (
  'WEB', 'DESKTOP', 'MOBILE', 'WHATSAPP', 'TELEGRAM', 'API_INTEGRATION'
);

CREATE TYPE "PartyType" AS ENUM (
  'INDIVIDUAL', 'COMPANY'
);

CREATE TYPE "RawMaterialCategory" AS ENUM (
  'PAPER', 'VINYL', 'INK', 'PLATE', 'FINISHING', 'CONSUMABLE'
);

CREATE TYPE "QuoteStatus" AS ENUM (
  'DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED'
);

CREATE TYPE "WorkOrderStatus" AS ENUM (
  'PENDING', 'PRE_PRESS', 'PRINTING', 'FINISHING',
  'QUALITY_CONTROL', 'READY_FOR_PICKUP', 'DISPATCHED', 'DELIVERED', 'CANCELLED'
);

CREATE TYPE "StageStatus" AS ENUM (
  'PENDING', 'IN_PROGRESS', 'PAUSED', 'COMPLETED'
);

CREATE TYPE "PaymentStatus" AS ENUM (
  'PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'
);

CREATE TYPE "EmployeeDepartment" AS ENUM (
  'PRE_PRESS', 'PRINTING', 'FINISHING', 'QUALITY',
  'EXPEDITION', 'COMMERCIAL', 'ADMINISTRATIVE', 'MAINTENANCE'
);

CREATE TYPE "EmployeeStatus" AS ENUM (
  'ACTIVE', 'ON_LEAVE', 'INACTIVE'
);

CREATE TYPE "WorkShift" AS ENUM (
  'MORNING', 'AFTERNOON', 'NIGHT', 'COMMERCIAL_HOURS'
);

CREATE TYPE "ExpenseCategory" AS ENUM (
  'RENT_FACILITIES', 'UTILITIES', 'SOFTWARE_LICENSES',
  'OFFICE_ADMINISTRATIVE', 'COMMERCIAL_MARKETING', 'MAINTENANCE_PREDIAL',
  'FINANCIAL_TAXES', 'OTHER'
);

CREATE TYPE "ExpenseType" AS ENUM (
  'FIXED', 'VARIABLE'
);

CREATE TYPE "PaymentMethod" AS ENUM (
  'BOLETO', 'PIX', 'BANK_TRANSFER', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'AUTO_DEBIT'
);

-- =============================================================================
-- 1. USUÁRIOS E AUTENTICAÇÃO
-- =============================================================================
CREATE TABLE "users" (
  "id" VARCHAR(36) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "passwordHash" VARCHAR(255),
  "role" "Role" NOT NULL DEFAULT 'OPERATOR',
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "isRoot" BOOLEAN NOT NULL DEFAULT FALSE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "activationToken" VARCHAR(255) UNIQUE,
  "activationTokenExpires" TIMESTAMP WITH TIME ZONE,
  "resetPasswordToken" VARCHAR(255) UNIQUE,
  "resetPasswordExpires" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 2. CLIENTES E FORNECEDORES (PARCEIROS)
-- =============================================================================
CREATE TABLE "parties" (
  "id" VARCHAR(36) PRIMARY KEY,
  "type" "PartyType" NOT NULL DEFAULT 'INDIVIDUAL',
  "name" VARCHAR(255) NOT NULL,
  "tradeName" VARCHAR(255),
  "document" VARCHAR(30) NOT NULL UNIQUE,
  "email" VARCHAR(255),
  "phone" VARCHAR(50) NOT NULL,
  "address" VARCHAR(255),
  "city" VARCHAR(100),
  "state" VARCHAR(10),
  "isCustomer" BOOLEAN NOT NULL DEFAULT TRUE,
  "isSupplier" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 3. INSUMOS E MATÉRIAS-PRIMAS
-- =============================================================================
CREATE TABLE "raw_materials" (
  "id" VARCHAR(36) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "category" "RawMaterialCategory" NOT NULL,
  "unitOfMeasure" VARCHAR(20) NOT NULL,
  "costPerUnit" DECIMAL(12, 4) NOT NULL,
  "currentStock" DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
  "minStock" DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
  "sheetWidthMm" INTEGER,
  "sheetHeightMm" INTEGER,
  "grammage" INTEGER,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 4. MÁQUINAS E EQUIPAMENTOS
-- =============================================================================
CREATE TABLE "machines" (
  "id" VARCHAR(36) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "hourlyRate" DECIMAL(10, 2) NOT NULL,
  "setupMinutes" INTEGER NOT NULL DEFAULT 15,
  "maxSheetsHour" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE
);

-- =============================================================================
-- 5. ORÇAMENTOS (PROPOSTAS COMERCIAIS)
-- =============================================================================
CREATE TABLE "quotes" (
  "id" VARCHAR(36) PRIMARY KEY,
  "code" SERIAL UNIQUE,
  "partyId" VARCHAR(36) NOT NULL REFERENCES "parties"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  "userId" VARCHAR(36) NOT NULL REFERENCES "users"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
  "origin" "ChannelSource" NOT NULL DEFAULT 'WEB',
  "totalCost" DECIMAL(12, 2) NOT NULL,
  "markupApplied" DECIMAL(6, 3) NOT NULL,
  "totalAmount" DECIMAL(12, 2) NOT NULL,
  "validUntil" TIMESTAMP WITH TIME ZONE NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 6. ITENS TÉCNICOS DO ORÇAMENTO
-- =============================================================================
CREATE TABLE "quote_items" (
  "id" VARCHAR(36) PRIMARY KEY,
  "quoteId" VARCHAR(36) NOT NULL REFERENCES "quotes"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  "rawMaterialId" VARCHAR(36) REFERENCES "raw_materials"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  "productName" VARCHAR(255) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "widthMm" INTEGER NOT NULL,
  "heightMm" INTEGER NOT NULL,
  "colorsFront" INTEGER NOT NULL,
  "colorsBack" INTEGER NOT NULL,
  "finishingOptions" JSONB NOT NULL DEFAULT '[]',
  "sheetsRequired" INTEGER NOT NULL,
  "itemsPerSheet" INTEGER NOT NULL,
  "paperCostCalculated" DECIMAL(10, 2) NOT NULL,
  "finishingCostTotal" DECIMAL(10, 2) NOT NULL,
  "machineCostTotal" DECIMAL(10, 2) NOT NULL,
  "unitPrice" DECIMAL(10, 4) NOT NULL,
  "itemTotalAmount" DECIMAL(12, 2) NOT NULL
);

-- =============================================================================
-- 7. ORDENS DE SERVIÇO (CHÃO DE FÁBRICA / PCP)
-- =============================================================================
CREATE TABLE "work_orders" (
  "id" VARCHAR(36) PRIMARY KEY,
  "orderNumber" VARCHAR(50) NOT NULL UNIQUE,
  "quoteId" VARCHAR(36) NOT NULL UNIQUE REFERENCES "quotes"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  "partyId" VARCHAR(36) NOT NULL REFERENCES "parties"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  "userId" VARCHAR(36) NOT NULL REFERENCES "users"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  "origin" "ChannelSource" NOT NULL DEFAULT 'WEB',
  "status" "WorkOrderStatus" NOT NULL DEFAULT 'PENDING',
  "priority" INTEGER NOT NULL DEFAULT 1,
  "deliveryDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "fileUrl" VARCHAR(500),
  "barcode" VARCHAR(100) NOT NULL UNIQUE,
  "totalAmount" DECIMAL(12, 2) NOT NULL,
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 8. ETAPAS DE PRODUÇÃO DA OS (ESTEIRA KANBAN)
-- =============================================================================
CREATE TABLE "work_order_stages" (
  "id" VARCHAR(36) PRIMARY KEY,
  "workOrderId" VARCHAR(36) NOT NULL REFERENCES "work_orders"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  "stepOrder" INTEGER NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "status" "StageStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uq_work_order_step" UNIQUE ("workOrderId", "stepOrder")
);

-- =============================================================================
-- 9. LOGS DE APONTAMENTO EM CHÃO DE FÁBRICA
-- =============================================================================
CREATE TABLE "stage_execution_logs" (
  "id" VARCHAR(36) PRIMARY KEY,
  "stageId" VARCHAR(36) NOT NULL REFERENCES "work_order_stages"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  "operatorId" VARCHAR(36) NOT NULL REFERENCES "users"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  "machineId" VARCHAR(36) REFERENCES "machines"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP WITH TIME ZONE,
  "wasteQuantity" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT
);

-- =============================================================================
-- 10. MOVIMENTAÇÃO DE ESTOQUE (KARDEX)
-- =============================================================================
CREATE TABLE "stock_movements" (
  "id" VARCHAR(36) PRIMARY KEY,
  "rawMaterialId" VARCHAR(36) NOT NULL REFERENCES "raw_materials"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  "workOrderId" VARCHAR(36) REFERENCES "work_orders"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  "quantity" DECIMAL(12, 4) NOT NULL,
  "reason" VARCHAR(100) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 11. COLABORADORES E RH
-- =============================================================================
CREATE TABLE "employees" (
  "id" VARCHAR(36) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "document" VARCHAR(30) NOT NULL UNIQUE,
  "registration" VARCHAR(50) UNIQUE,
  "role" VARCHAR(100) NOT NULL,
  "department" "EmployeeDepartment" NOT NULL DEFAULT 'PRINTING',
  "shift" "WorkShift" NOT NULL DEFAULT 'COMMERCIAL_HOURS',
  "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
  "email" VARCHAR(255),
  "phone" VARCHAR(50) NOT NULL,
  "hireDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "hourlyRate" DECIMAL(10, 2),
  "monthlySalary" DECIMAL(10, 2),
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 12. DESPESAS OPERACIONAIS (CONTAS A PAGAR / OPEX)
-- =============================================================================
CREATE TABLE "operating_expenses" (
  "id" VARCHAR(36) PRIMARY KEY,
  "description" VARCHAR(255) NOT NULL,
  "category" "ExpenseCategory" NOT NULL,
  "expenseType" "ExpenseType" NOT NULL DEFAULT 'FIXED',
  "amount" DECIMAL(12, 2) NOT NULL,
  "dueDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "paidAt" TIMESTAMP WITH TIME ZONE,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "paymentMethod" "PaymentMethod",
  "competenceDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "supplierId" VARCHAR(36) REFERENCES "parties"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  "beneficiaryName" VARCHAR(255),
  "barcode" VARCHAR(100),
  "documentNumber" VARCHAR(100),
  "isRecurring" BOOLEAN NOT NULL DEFAULT FALSE,
  "recurrenceInterval" VARCHAR(50) DEFAULT 'MONTHLY',
  "recurrenceEndDate" TIMESTAMP WITH TIME ZONE,
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 13. CONTAS A RECEBER (FATURAMENTO E DUPLICATAS)
-- =============================================================================
CREATE TABLE "receivables" (
  "id" VARCHAR(36) PRIMARY KEY,
  "workOrderId" VARCHAR(36) REFERENCES "work_orders"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  "partyId" VARCHAR(36) NOT NULL REFERENCES "parties"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  "description" VARCHAR(255) NOT NULL,
  "installmentNumber" INTEGER NOT NULL DEFAULT 1,
  "totalInstallments" INTEGER NOT NULL DEFAULT 1,
  "amount" DECIMAL(12, 2) NOT NULL,
  "dueDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "paidAt" TIMESTAMP WITH TIME ZONE,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "paymentMethod" "PaymentMethod",
  "barcode" VARCHAR(100),
  "documentNumber" VARCHAR(100),
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 14. MODELOS RÁPIDOS DE BALCÃO
-- =============================================================================
CREATE TABLE "product_templates" (
  "id" VARCHAR(36) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "category" VARCHAR(100) NOT NULL DEFAULT 'Papelaria',
  "description" TEXT,
  "defaultWidthMm" INTEGER NOT NULL,
  "defaultHeightMm" INTEGER NOT NULL,
  "defaultColorsFront" INTEGER NOT NULL DEFAULT 4,
  "defaultColorsBack" INTEGER NOT NULL DEFAULT 4,
  "defaultFinishing" JSONB NOT NULL DEFAULT '[]',
  "defaultRawMaterialId" VARCHAR(36) REFERENCES "raw_materials"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  "defaultMachineId" VARCHAR(36) REFERENCES "machines"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  "defaultMarkupPercent" DECIMAL(5, 2) NOT NULL DEFAULT 35.00,
  "suggestedQuantities" JSONB NOT NULL DEFAULT '[500, 1000, 2500, 5000]',
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 15. CONDIÇÕES COMERCIAIS DE PAGAMENTO
-- =============================================================================
CREATE TABLE "payment_conditions" (
  "id" VARCHAR(36) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "installmentsCount" INTEGER NOT NULL DEFAULT 1,
  "downPaymentPercent" DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  "intervalDays" INTEGER NOT NULL DEFAULT 30,
  "dayOffsets" JSONB NOT NULL DEFAULT '[]',
  "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- ÍNDICES B-TREE DE ALTA PERFORMANCE
-- =============================================================================
CREATE INDEX "idx_operating_expenses_competence" ON "operating_expenses"("competenceDate");
CREATE INDEX "idx_operating_expenses_due" ON "operating_expenses"("dueDate");
CREATE INDEX "idx_operating_expenses_status" ON "operating_expenses"("status");
CREATE INDEX "idx_operating_expenses_category" ON "operating_expenses"("category");
CREATE INDEX "idx_operating_expenses_supplier" ON "operating_expenses"("supplierId");

CREATE INDEX "idx_receivables_status" ON "receivables"("status");
CREATE INDEX "idx_receivables_due" ON "receivables"("dueDate");
CREATE INDEX "idx_receivables_party" ON "receivables"("partyId");
CREATE INDEX "idx_receivables_work_order" ON "receivables"("workOrderId");
