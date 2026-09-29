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
  mustChangePassword?: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    mustChangePassword?: boolean;
  };
}

export interface FirstLoginChangePasswordDto {
  newPassword: string;
  email?: string;
  temporaryPassword?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface ForgotPasswordRequestDto {
  email: string;
}

export interface ResetPasswordRequestDto {
  token: string;
  password: string;
}

export interface ActivateAccountRequestDto {
  token: string;
  password: string;
}

export interface VerifyTokenResponseDto {
  valid: boolean;
  type: 'activation' | 'reset';
  email?: string;
  name?: string;
  message?: string;
}

export interface CreateUserRequestDto {
  name: string;
  email: string;
  password?: string;
  role?: Role;
  isActive?: boolean;
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

export interface QuoteInstallmentDto {
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
  dueDate: string;
  description?: string;
}

export interface CreateQuoteDto {
  partyId: string;
  origin?: ChannelSource;
  markupApplied: number; // e.g. 0.40 for 40%
  validDays?: number;    // default: 10 days
  items: CreateQuoteItemDto[];
  notes?: string;
  autoApprove?: boolean;
  installments?: QuoteInstallmentDto[];
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

// -------------------------------------------------------------
// Contas a Receber (Receivables) Types & DTOs
// -------------------------------------------------------------
export interface ReceivableItem {
  id: string;
  workOrderId?: string | null;
  partyId: string;
  description: string;
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
  dueDate: string;
  paidAt?: string | null;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod | null;
  barcode?: string | null;
  documentNumber?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  party?: {
    id: string;
    name: string;
    tradeName?: string | null;
    document: string;
    phone?: string | null;
  };
  workOrder?: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: WorkOrderStatus;
  } | null;
}

export interface CreateReceivableDto {
  workOrderId?: string;
  partyId: string;
  description: string;
  installmentNumber?: number;
  totalInstallments?: number;
  amount: number;
  dueDate: string;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  barcode?: string;
  documentNumber?: string;
  notes?: string;
}

export interface UpdateReceivableDto {
  partyId?: string;
  description?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  amount?: number;
  dueDate?: string;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod | null;
  barcode?: string | null;
  documentNumber?: string | null;
  notes?: string | null;
  paidAt?: string | null;
}

export interface PayReceivableDto {
  paidAt: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  discountAmount?: number;
  surchargeAmount?: number;
  paidAmount?: number;
}

export interface GenerateOrderInstallmentsDto {
  workOrderId: string;
  plan: 'FULL_ADVANCE' | 'HALF_DOWN_HALF_PICKUP' | 'CUSTOM_INSTALLMENTS';
  installmentsCount?: number;
  downPaymentPercent?: number; // ex: 50
  firstDueDate?: string;
  intervalDays?: number; // ex: 30
}

export interface ReceivablesSummaryDto {
  totalAmount: number;
  receivedAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  totalCount: number;
  receivedCount: number;
  pendingCount: number;
  overdueCount: number;
  defaultRatePercent: number; // taxa de inadimplência (% vencido / total)
}

// -------------------------------------------------------------
// DRE Gerencial & Fluxo de Caixa (Financial) Types
// -------------------------------------------------------------
export interface DreSectionItem {
  code: string;
  name: string;
  amount: number;
  percentageOfRevenue: number;
  isTotal?: boolean;
  type: 'REVENUE' | 'DEDUCTION' | 'CPV' | 'OPEX' | 'RESULT';
  children?: {
    name: string;
    amount: number;
    percentage: number;
  }[];
}

export interface DreMonthlyReportDto {
  competenceMonth: string; // YYYY-MM
  grossRevenue: number; // Receita Bruta (faturamento de OS)
  taxRatePercent: number; // Alíquota estimada (ex: 6%)
  taxDeductions: number; // Impostos deduzidos
  netRevenue: number; // Receita Líquida
  cpvTotal: number; // Custo dos Produtos Vendidos total
  cpvBreakdown: {
    paperCost: number;
    printingMachineCost: number;
    finishingCost: number;
  };
  grossProfit: number; // Lucro Bruto (Margem de Contribuição)
  grossMarginPercent: number; // Margem Bruta %
  opexTotal: number; // Despesas Operacionais totais
  opexBreakdown: {
    category: ExpenseCategory;
    label: string;
    amount: number;
  }[];
  ebitda: number; // Lucro Operacional
  ebitdaMarginPercent: number; // Margem EBITDA %
  breakEvenPoint: number; // Ponto de Equilíbrio (R$)
  sections: DreSectionItem[];
}

export interface CashFlowDayDto {
  date: string; // YYYY-MM-DD
  inflows: number; // Recebimentos totais no dia (realizados + previstos)
  outflows: number; // Pagamentos de despesas totais no dia
  realizedInflows: number; // Recebimentos confirmados/liquidados
  projectedInflows: number; // Recebimentos previstos (a vencer)
  realizedOutflows: number; // Despesas pagas
  projectedOutflows: number; // Despesas previstas (a vencer)
  netBalance: number; // inflows - outflows
  accumulatedBalance: number;
}

export interface CashFlowSummaryDto {
  month: string;
  totalInflows: number;
  totalOutflows: number;
  realizedInflows: number;
  projectedInflows: number;
  realizedOutflows: number;
  projectedOutflows: number;
  netCashFlow: number;
  days: CashFlowDayDto[];
}

// -------------------------------------------------------------
// Modelos Rápidos de Balcão (Product Templates)
// -------------------------------------------------------------
export interface ProductTemplateItem {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  defaultWidthMm: number;
  defaultHeightMm: number;
  defaultColorsFront: number;
  defaultColorsBack: number;
  defaultFinishing: string[];
  defaultRawMaterialId?: string | null;
  defaultMachineId?: string | null;
  defaultMarkupPercent: number;
  suggestedQuantities: number[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  rawMaterial?: {
    id: string;
    name: string;
    costPerUnit: number;
    sheetWidthMm?: number | null;
    sheetHeightMm?: number | null;
  } | null;
  machine?: {
    id: string;
    name: string;
    hourlyRate: number;
    setupMinutes: number;
    maxSheetsHour?: number | null;
  } | null;
}

export interface CreateProductTemplateDto {
  name: string;
  category?: string;
  description?: string;
  defaultWidthMm: number;
  defaultHeightMm: number;
  defaultColorsFront?: number;
  defaultColorsBack?: number;
  defaultFinishing?: string[];
  defaultRawMaterialId?: string;
  defaultMachineId?: string;
  defaultMarkupPercent?: number;
  suggestedQuantities?: number[];
  isActive?: boolean;
}

export interface UpdateProductTemplateDto {
  name?: string;
  category?: string;
  description?: string;
  defaultWidthMm?: number;
  defaultHeightMm?: number;
  defaultColorsFront?: number;
  defaultColorsBack?: number;
  defaultFinishing?: string[];
  defaultRawMaterialId?: string | null;
  defaultMachineId?: string | null;
  defaultMarkupPercent?: number;
  suggestedQuantities?: number[];
  isActive?: boolean;
}

// -------------------------------------------------------------
// Condições de Pagamento / Parcelamento Padrão
// -------------------------------------------------------------
export interface PaymentConditionItem {
  id: string;
  name: string;
  description?: string | null;
  installmentsCount: number;
  downPaymentPercent: number;
  intervalDays: number;
  dayOffsets: number[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentConditionDto {
  name: string;
  description?: string;
  installmentsCount: number;
  downPaymentPercent?: number;
  intervalDays?: number;
  dayOffsets?: number[];
  isDefault?: boolean;
}

export interface UpdatePaymentConditionDto {
  name?: string;
  description?: string;
  installmentsCount?: number;
  downPaymentPercent?: number;
  intervalDays?: number;
  dayOffsets?: number[];
  isDefault?: boolean;
  isActive?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isRoot?: boolean;
  emailVerified: boolean;
  mustChangePassword?: boolean;
  createdAt: string;
}

// -------------------------------------------------------------
// Modelos Prontos de Serviços Rápidos e Produção Rápida Balcão
// -------------------------------------------------------------
export interface QuickOrderItemDto {
  productName: string;
  quantity: number;
  unitPrice?: number;
  itemTotalAmount?: number;
  rawMaterialId?: string | null;
  materialQuantity?: number;
}

export interface CreateDirectOrderDto {
  partyId?: string;
  productName?: string;
  quantity?: number;
  priority?: number;
  deliveryDays?: number;
  totalAmount: number;
  notes?: string;
  items?: QuickOrderItemDto[];
  paymentMethod?: string;
  paymentStatus?: string;
  status?: string;
}

export interface QuickServicePresetItem {
  id: string;
  name: string;
  category: string;
  defaultPrice: number;
  rawMaterialId?: string | null;
  rawMaterial?: {
    id: string;
    name: string;
    unitOfMeasure: string;
    currentStock: number;
  } | null;
  materialConsumeQty?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuickServicePresetDto {
  name: string;
  category?: string;
  defaultPrice: number;
  rawMaterialId?: string | null;
  materialConsumeQty?: number;
  isActive?: boolean;
}

export interface UpdateQuickServicePresetDto {
  name?: string;
  category?: string;
  defaultPrice?: number;
  rawMaterialId?: string | null;
  materialConsumeQty?: number;
  isActive?: boolean;
}
