// Enums
export enum Role {
  ADMIN = 'ADMIN',
  COMMERCIAL = 'COMMERCIAL',
  FINANCIAL = 'FINANCIAL',
  OPERATOR = 'OPERATOR',
  BOT_SERVICE = 'BOT_SERVICE',
}

export enum ChannelSource {
  WEB = 'WEB',
  DESKTOP = 'DESKTOP',
  MOBILE = 'MOBILE',
  WHATSAPP = 'WHATSAPP',
  TELEGRAM = 'TELEGRAM',
  API_INTEGRATION = 'API_INTEGRATION',
}

export enum PartyType {
  INDIVIDUAL = 'INDIVIDUAL',
  COMPANY = 'COMPANY',
}

export enum RawMaterialCategory {
  PAPER = 'PAPER',
  VINYL = 'VINYL',
  INK = 'INK',
  PLATE = 'PLATE',
  FINISHING = 'FINISHING',
  CONSUMABLE = 'CONSUMABLE',
}

export enum QuoteStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum WorkOrderStatus {
  PENDING = 'PENDING',
  PRE_PRESS = 'PRE_PRESS',
  PRINTING = 'PRINTING',
  FINISHING = 'FINISHING',
  QUALITY_CONTROL = 'QUALITY_CONTROL',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  DISPATCHED = 'DISPATCHED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum StageStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

// -------------------------------------------------------------
// RFC 7807 Standard Error Response
// -------------------------------------------------------------
export interface HttpErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path?: string;
}

// -------------------------------------------------------------
// Auth DTOs (Section 6.1)
// -------------------------------------------------------------
export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

// -------------------------------------------------------------
// Quotes DTOs (Section 6.2)
// -------------------------------------------------------------
export interface CreateQuoteItemDto {
  productName: string;
  rawMaterialId?: string;
  quantity: number;
  widthMm: number;
  heightMm: number;
  colorsFront: number;
  colorsBack: number;
  finishingOptions: string[];
}

export interface CreateQuoteDto {
  partyId: string;
  origin: ChannelSource;
  markupApplied: number; // e.g. 0.40 for 40%
  validDays?: number;    // default: 10 days
  items: CreateQuoteItemDto[];
  notes?: string;
}

export interface QuoteItemResponseDto {
  id: string;
  productName: string;
  quantity: number;
  sheetsRequired: number;
  itemsPerSheet: number;
  unitPrice: number;
  itemTotalAmount: number;
}

export interface QuoteResponseDto {
  id: string;
  code: number;
  partyId: string;
  status: QuoteStatus;
  origin: ChannelSource;
  totalCost: number;
  markupApplied: number;
  totalAmount: number;
  validUntil: string;
  notes?: string | null;
  items: QuoteItemResponseDto[];
}

// -------------------------------------------------------------
// Chatbot Tracking DTOs (Section 6.3)
// -------------------------------------------------------------
export interface BotOrderTrackingDto {
  orderNumber: string;
  customerName: string;
  status: WorkOrderStatus;
  statusLabelPtBr: string; // Ex: "Em Acabamento", "Pronto para Retirada"
  deliveryDate: string;
  totalAmount: number;
  paymentPending: boolean;
}

// -------------------------------------------------------------
// Stage Action DTOs (Section 6.4)
// -------------------------------------------------------------
export type StageActionType = 'START' | 'PAUSE' | 'COMPLETE';

export interface StageActionDto {
  action: StageActionType;
  machineId?: string;
  operatorId: string;
  wasteQuantity?: number;
  notes?: string;
}

// -------------------------------------------------------------
// WebSocket Event Payloads
// -------------------------------------------------------------
export interface WorkOrderStatusChangedPayload {
  workOrderId: string;
  orderNumber: string;
  previousStatus: WorkOrderStatus;
  newStatus: WorkOrderStatus;
  updatedAt: string;
}

// -------------------------------------------------------------
// Employee Types & DTOs
// -------------------------------------------------------------
export enum EmployeeDepartment {
  PRE_PRESS = 'PRE_PRESS',
  PRINTING = 'PRINTING',
  FINISHING = 'FINISHING',
  QUALITY = 'QUALITY',
  EXPEDITION = 'EXPEDITION',
  COMMERCIAL = 'COMMERCIAL',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  MAINTENANCE = 'MAINTENANCE',
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  INACTIVE = 'INACTIVE',
}

export enum WorkShift {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  NIGHT = 'NIGHT',
  COMMERCIAL_HOURS = 'COMMERCIAL_HOURS',
}

export interface EmployeeItem {
  id: string;
  name: string;
  document: string;
  registration?: string | null;
  role: string;
  department: EmployeeDepartment;
  shift: WorkShift;
  status: EmployeeStatus;
  email?: string | null;
  phone: string;
  hireDate: string;
  hourlyRate?: number | null;
  monthlySalary?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeDto {
  name: string;
  document: string;
  registration?: string;
  role: string;
  department?: EmployeeDepartment;
  shift?: WorkShift;
  status?: EmployeeStatus;
  email?: string;
  phone: string;
  hireDate?: string;
  hourlyRate?: number;
  monthlySalary?: number;
  notes?: string;
}

export interface UpdateEmployeeDto {
  name?: string;
  document?: string;
  registration?: string;
  role?: string;
  department?: EmployeeDepartment;
  shift?: WorkShift;
  status?: EmployeeStatus;
  email?: string;
  phone?: string;
  hireDate?: string;
  hourlyRate?: number;
  monthlySalary?: number;
  notes?: string;
}

// -------------------------------------------------------------
// Operating Expenses (OPEX) Types & DTOs
// -------------------------------------------------------------
export enum ExpenseCategory {
  RENT_FACILITIES = 'RENT_FACILITIES',
  UTILITIES = 'UTILITIES',
  SOFTWARE_LICENSES = 'SOFTWARE_LICENSES',
  OFFICE_ADMINISTRATIVE = 'OFFICE_ADMINISTRATIVE',
  COMMERCIAL_MARKETING = 'COMMERCIAL_MARKETING',
  MAINTENANCE_PREDIAL = 'MAINTENANCE_PREDIAL',
  FINANCIAL_TAXES = 'FINANCIAL_TAXES',
  OTHER = 'OTHER',
}

export enum ExpenseType {
  FIXED = 'FIXED',
  VARIABLE = 'VARIABLE',
}

export enum PaymentMethod {
  BOLETO = 'BOLETO',
  PIX = 'PIX',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  CASH = 'CASH',
  AUTO_DEBIT = 'AUTO_DEBIT',
}

export interface OperatingExpenseItem {
  id: string;
  description: string;
  category: ExpenseCategory;
  expenseType: ExpenseType;
  amount: number;
  dueDate: string;
  paidAt?: string | null;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod | null;
  competenceDate: string;
  supplierId?: string | null;
  beneficiaryName?: string | null;
  barcode?: string | null;
  documentNumber?: string | null;
  isRecurring: boolean;
  recurrenceInterval?: string | null;
  recurrenceEndDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  supplier?: {
    id: string;
    name: string;
    tradeName?: string | null;
    document: string;
  } | null;
}

export interface CreateOperatingExpenseDto {
  description: string;
  category: ExpenseCategory;
  expenseType?: ExpenseType;
  amount: number;
  dueDate: string;
  competenceDate: string;
  supplierId?: string;
  beneficiaryName?: string;
  barcode?: string;
  documentNumber?: string;
  isRecurring?: boolean;
  recurrenceInterval?: string;
  recurrenceEndDate?: string;
  notes?: string;
  paymentMethod?: PaymentMethod;
  status?: PaymentStatus;
  paidAt?: string;
}

export interface UpdateOperatingExpenseDto {
  description?: string;
  category?: ExpenseCategory;
  expenseType?: ExpenseType;
  amount?: number;
  dueDate?: string;
  competenceDate?: string;
  supplierId?: string | null;
  beneficiaryName?: string | null;
  barcode?: string | null;
  documentNumber?: string | null;
  isRecurring?: boolean;
  recurrenceInterval?: string | null;
  recurrenceEndDate?: string | null;
  notes?: string | null;
  paymentMethod?: PaymentMethod | null;
  status?: PaymentStatus;
  paidAt?: string | null;
}

export interface PayExpenseDto {
  paidAt: string;
  paidAmount?: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface OperatingExpensesSummaryDto {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  totalCount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  fixedTotal: number;
  variableTotal: number;
  categoryBreakdown: {
    category: ExpenseCategory;
    label: string;
    total: number;
    count: number;
    percentage: number;
  }[];
}


