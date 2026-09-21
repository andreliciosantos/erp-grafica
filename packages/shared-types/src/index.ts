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
