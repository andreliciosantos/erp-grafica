export * from '@erp/shared-types';

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

export interface PartyItem {
  id: string;
  type: string;
  name: string;
  tradeName?: string | null;
  document: string;
  email?: string | null;
  phone: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  isCustomer: boolean;
  isSupplier: boolean;
  createdAt: string;
}

export interface RawMaterialItem {
  id: string;
  name: string;
  category: string;
  unitOfMeasure: string;
  costPerUnit: number;
  currentStock: number;
  minStock: number;
  sheetWidthMm?: number | null;
  sheetHeightMm?: number | null;
  grammage?: number | null;
  createdAt: string;
}

export interface MachineItem {
  id: string;
  name: string;
  hourlyRate: number;
  setupMinutes: number;
  maxSheetsHour?: number | null;
  isActive: boolean;
}

export interface WorkOrderStageItem {
  id: string;
  workOrderId: string;
  stepOrder: number;
  name: string;
  status: string;
  logs?: Array<{
    id: string;
    operatorId: string;
    machineId?: string | null;
    startedAt: string;
    finishedAt?: string | null;
    wasteQuantity: number;
    notes?: string | null;
    operator?: {
      name: string;
    };
    machine?: {
      name: string;
    };
  }>;
}

export interface WorkOrderItem {
  id: string;
  orderNumber: string;
  productName?: string;
  quoteId: string;
  partyId: string;
  userId: string;
  origin: string;
  status: string;
  priority: number;
  deliveryDate: string;
  barcode: string;
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
  updatedAt?: string;
  fileUrl?: string | null;
  party?: PartyItem;
  stages?: WorkOrderStageItem[];
  quote?: any;
}
