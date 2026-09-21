import * as bcrypt from 'bcrypt';
import { Role, PartyType, RawMaterialCategory, QuoteStatus, WorkOrderStatus, StageStatus, PaymentStatus, ChannelSource } from '@erp/shared-types';

export function createMockPrismaService() {
  const validHash = bcrypt.hashSync('password123', 10);

  const users: any[] = [
    {
      id: 'u-admin-1',
      name: 'Admin Test',
      email: 'admin@test.com',
      passwordHash: validHash,
      role: Role.ADMIN,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 'u-op-1',
      name: 'Operator Test',
      email: 'operator@test.com',
      passwordHash: validHash,
      role: Role.OPERATOR,
      isActive: true,
      createdAt: new Date(),
    },
  ];

  const parties: any[] = [
    {
      id: 'p-client-1',
      type: PartyType.COMPANY,
      name: 'Cliente Teste Ltda',
      document: '11222333000199',
      phone: '5511988887777',
      email: 'cliente@teste.com',
      isCustomer: true,
    },
  ];

  const rawMaterials: any[] = [
    {
      id: 'rm-couche-1',
      name: 'Couché 150g',
      category: RawMaterialCategory.PAPER,
      unitOfMeasure: 'FL',
      costPerUnit: 0.85,
      currentStock: 1000,
      minStock: 200,
      sheetWidthMm: 660,
      sheetHeightMm: 960,
      grammage: 150,
    },
  ];

  const machines: any[] = [
    {
      id: 'm-speedmaster-1',
      name: 'Heidelberg Speedmaster',
      hourlyRate: 150.0,
      setupMinutes: 20,
      maxSheetsHour: 5000,
      isActive: true,
    },
  ];

  let quotes: any[] = [];
  let workOrders: any[] = [];
  let stockMovements: any[] = [];
  let stages: any[] = [];
  let stageLogs: any[] = [];
  let quoteCounter = 100;

  const mock = {
    user: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.id) return users.find((u) => u.id === where.id) || null;
        if (where.email) return users.find((u) => u.email === where.email) || null;
        return null;
      }),
      findMany: vi.fn(async () => users),
      count: vi.fn(async () => users.length),
      create: vi.fn(async ({ data }: any) => {
        const u = { id: `u-${Date.now()}`, ...data, createdAt: new Date() };
        users.push(u);
        return u;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const u = users.find((x) => x.id === where.id);
        if (u) Object.assign(u, data);
        return u;
      }),
    },
    party: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.id) return parties.find((p) => p.id === where.id) || null;
        if (where.document) return parties.find((p) => p.document === where.document) || null;
        return null;
      }),
      findFirst: vi.fn(async ({ where }: any) => {
        if (where.phone?.contains) {
          return parties.find((p) => p.phone.includes(where.phone.contains)) || null;
        }
        return parties[0] || null;
      }),
      findMany: vi.fn(async () => parties),
      count: vi.fn(async () => parties.length),
      create: vi.fn(async ({ data }: any) => {
        const p = { id: `p-${Date.now()}`, ...data };
        parties.push(p);
        return p;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const p = parties.find((x) => x.id === where.id);
        if (p) Object.assign(p, data);
        return p;
      }),
    },
    rawMaterial: {
      findUnique: vi.fn(async ({ where }: any) => {
        return rawMaterials.find((r) => r.id === where.id) || null;
      }),
      findMany: vi.fn(async () => rawMaterials),
      count: vi.fn(async () => rawMaterials.length),
      create: vi.fn(async ({ data }: any) => {
        const r = { id: `rm-${Date.now()}`, ...data };
        rawMaterials.push(r);
        return r;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const r = rawMaterials.find((x) => x.id === where.id);
        if (r) {
          if (data.currentStock?.decrement) {
            r.currentStock -= data.currentStock.decrement;
          } else if (data.currentStock?.increment) {
            r.currentStock += data.currentStock.increment;
          } else {
            Object.assign(r, data);
          }
        }
        return r;
      }),
    },
    machine: {
      findFirst: vi.fn(async () => machines[0] || null),
      findUnique: vi.fn(async ({ where }: any) => machines.find((m) => m.id === where.id) || null),
      findMany: vi.fn(async () => machines),
      create: vi.fn(async ({ data }: any) => {
        const m = { id: `m-${Date.now()}`, ...data };
        machines.push(m);
        return m;
      }),
    },
    quote: {
      findUnique: vi.fn(async ({ where }: any) => {
        return quotes.find((q) => q.id === where.id) || null;
      }),
      findMany: vi.fn(async () => quotes),
      count: vi.fn(async () => quotes.length),
      create: vi.fn(async ({ data }: any) => {
        quoteCounter++;
        const q = {
          id: `q-${Date.now()}`,
          code: quoteCounter,
          ...data,
          items: data.items?.create || [],
          party: parties.find((p) => p.id === data.partyId) || { name: 'Cliente Teste', phone: '5511988887777' },
        };
        quotes.push(q);
        return q;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const q = quotes.find((x) => x.id === where.id);
        if (q) Object.assign(q, data);
        return q;
      }),
    },
    workOrder: {
      findFirst: vi.fn(async ({ where }: any) => {
        if (where.OR) {
          for (const cond of where.OR) {
            const found = workOrders.find(
              (w) => w.id === cond.id || w.orderNumber === cond.orderNumber || w.barcode === cond.barcode
            );
            if (found) return found;
          }
        }
        return workOrders[0] || null;
      }),
      findMany: vi.fn(async ({ where }: any = {}) => {
        if (where?.party?.phone?.contains) {
          return workOrders.filter((w) => w.party.phone.includes(where.party.phone.contains));
        }
        if (where?.orderNumber?.contains) {
          return workOrders.filter((w) => w.orderNumber.includes(where.orderNumber.contains));
        }
        return workOrders;
      }),
      count: vi.fn(async () => workOrders.length),
      create: vi.fn(async ({ data }: any) => {
        const w = {
          id: `wo-${Date.now()}`,
          ...data,
          party: parties.find((p) => p.id === data.partyId) || { name: 'Cliente Teste', phone: '5511988887777' },
          stages: data.stages?.create?.map((s: any, idx: number) => ({
            id: `stage-${idx + 1}`,
            workOrderId: `wo-${Date.now()}`,
            logs: [],
            ...s,
          })) || [],
          stockMovements: [],
          quote: quotes.find((q) => q.id === data.quoteId) || {
            items: [{ rawMaterialId: 'rm-couche-1', sheetsRequired: 50 }],
          },
        };
        workOrders.push(w);
        return w;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const w = workOrders.find((x) => x.id === where.id);
        if (w) Object.assign(w, data);
        return w;
      }),
    },
    workOrderStage: {
      findUnique: vi.fn(async ({ where }: any) => {
        return stages.find((s) => s.id === where.id) || null;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const s = stages.find((x) => x.id === where.id);
        if (s) Object.assign(s, data);
        return s;
      }),
    },
    stageExecutionLog: {
      create: vi.fn(async ({ data }: any) => {
        const l = { id: `log-${Date.now()}`, ...data };
        stageLogs.push(l);
        return l;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const l = stageLogs.find((x) => x.id === where.id);
        if (l) Object.assign(l, data);
        return l;
      }),
    },
    stockMovement: {
      findMany: vi.fn(async ({ where }: any) => {
        return stockMovements.filter((m) => m.workOrderId === where.workOrderId);
      }),
      create: vi.fn(async ({ data }: any) => {
        const m = { id: `sm-${Date.now()}`, ...data };
        stockMovements.push(m);
        return m;
      }),
    },
    $transaction: vi.fn(async (cb: any) => {
      return cb(mock);
    }),
    _state: {
      users,
      parties,
      rawMaterials,
      machines,
      quotes,
      workOrders,
      stockMovements,
      stages,
      stageLogs,
    },
  };

  return mock;
}
