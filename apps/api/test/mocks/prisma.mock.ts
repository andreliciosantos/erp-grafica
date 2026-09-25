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
  let receivables: any[] = [];
  let operatingExpenses: any[] = [];
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
      findUnique: vi.fn(async ({ where, include }: any) => {
        const w = workOrders.find((item) => item.id === where.id);
        if (!w) return null;
        const res = { ...w };
        if (include?.receivables) {
          res.receivables = receivables.filter((r) => r.workOrderId === w.id);
        }
        if (include?.party && !res.party) {
          res.party = parties.find((p) => p.id === w.partyId) || null;
        }
        if (include?.quote && !res.quote) {
          res.quote = quotes.find((q) => q.id === w.quoteId) || null;
        }
        return res;
      }),
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
        let list = [...workOrders];
        if (where?.status?.not) {
          list = list.filter((w) => w.status !== where.status.not);
        }
        if (where?.createdAt?.gte && where?.createdAt?.lte) {
          list = list.filter((w) => {
            const d = new Date(w.createdAt);
            return d >= where.createdAt.gte && d <= where.createdAt.lte;
          });
        }
        if (where?.party?.phone?.contains) {
          list = list.filter((w) => w.party?.phone?.includes(where.party.phone.contains));
        }
        if (where?.orderNumber?.contains) {
          list = list.filter((w) => w.orderNumber?.includes(where.orderNumber.contains));
        }
        return list.map((w) => ({
          ...w,
          quote: w.quote || quotes.find((q) => q.id === w.quoteId) || {
            items: [{ productName: 'Material Gráfico Teste' }],
          },
        }));
      }),
      count: vi.fn(async () => workOrders.length),
      create: vi.fn(async ({ data }: any) => {
        const w = {
          id: `wo-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          paymentStatus: PaymentStatus.PENDING,
          ...data,
          party: parties.find((p) => p.id === data.partyId) || { name: 'Cliente Teste', phone: '5511988887777' },
          stages: data.stages?.create?.map((s: any, idx: number) => ({
            id: `stage-${idx + 1}`,
            workOrderId: `wo-${Date.now()}`,
            logs: [],
            ...s,
          })) || [],
          stockMovements: [],
          quote: data.quote || quotes.find((q) => q.id === data.quoteId) || {
            items: [{ rawMaterialId: 'rm-couche-1', sheetsRequired: 50 }],
          },
        };
        workOrders.push(w);
        return w;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const w = workOrders.find((x) => x.id === where.id);
        if (w) Object.assign(w, data, { updatedAt: new Date() });
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
      findFirst: vi.fn(async ({ where }: any) => {
        return stockMovements.find((m) => m.workOrderId === where?.workOrderId) || null;
      }),
      findMany: vi.fn(async ({ where }: any) => {
        return stockMovements.filter((m) => m.workOrderId === where?.workOrderId);
      }),
      create: vi.fn(async ({ data }: any) => {
        const m = { id: `sm-${Date.now()}`, ...data };
        stockMovements.push(m);
        return m;
      }),
    },
    receivable: {
      findUnique: vi.fn(async ({ where }: any) => {
        const r = receivables.find((item) => item.id === where.id);
        if (!r) return null;
        return {
          ...r,
          party: parties.find((p) => p.id === r.partyId) || null,
          workOrder: workOrders.find((w) => w.id === r.workOrderId) || null,
        };
      }),
      findMany: vi.fn(async ({ where }: any = {}) => {
        let list = [...receivables];
        if (where?.AND) {
          for (const cond of where.AND) {
            if (cond.status?.not) {
              list = list.filter((r) => r.status !== cond.status.not);
            }
            if (cond.partyId) {
              list = list.filter((r) => r.partyId === cond.partyId);
            }
            if (cond.workOrderId) {
              list = list.filter((r) => r.workOrderId === cond.workOrderId);
            }
            if (cond.status && typeof cond.status === 'string') {
              list = list.filter((r) => r.status === cond.status);
            }
            if (cond.OR) {
              list = list.filter((r) => {
                return cond.OR.some((subCond: any) => {
                  if (subCond.status && subCond.dueDate?.lt) {
                    return r.status === subCond.status && new Date(r.dueDate) < subCond.dueDate.lt;
                  }
                  if (subCond.status) return r.status === subCond.status;
                  if (subCond.description?.contains) {
                    return r.description?.toLowerCase().includes(subCond.description.contains.toLowerCase());
                  }
                  if (subCond.party?.name?.contains) {
                    const party = parties.find((p) => p.id === r.partyId);
                    return party?.name?.toLowerCase().includes(subCond.party.name.contains.toLowerCase());
                  }
                  return false;
                });
              });
            }
          }
        }
        if (where?.status?.not) {
          list = list.filter((r) => r.status !== where.status.not);
        }
        if (where?.workOrderId) {
          list = list.filter((r) => r.workOrderId === where.workOrderId);
        }
        if (where?.OR) {
          list = list.filter((r) => {
            return where.OR.some((subCond: any) => {
              if (subCond.status === PaymentStatus.PAID && subCond.paidAt) {
                return r.status === PaymentStatus.PAID && r.paidAt && new Date(r.paidAt) >= subCond.paidAt.gte && new Date(r.paidAt) <= subCond.paidAt.lte;
              }
              if (subCond.status?.in && subCond.dueDate) {
                return subCond.status.in.includes(r.status) && new Date(r.dueDate) >= subCond.dueDate.gte && new Date(r.dueDate) <= subCond.dueDate.lte;
              }
              return false;
            });
          });
        }
        return list.map((r) => ({
          ...r,
          party: parties.find((p) => p.id === r.partyId) || null,
          workOrder: workOrders.find((w) => w.id === r.workOrderId) || null,
        }));
      }),
      count: vi.fn(async ({ where }: any = {}) => {
        const res = await mock.receivable.findMany({ where });
        return res.length;
      }),
      create: vi.fn(async ({ data }: any) => {
        const r = {
          id: `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          paidAt: null,
          notes: null,
          barcode: null,
          documentNumber: null,
          paymentMethod: null,
          ...data,
          party: parties.find((p) => p.id === data.partyId) || null,
          workOrder: workOrders.find((w) => w.id === data.workOrderId) || null,
        };
        receivables.push(r);
        return r;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const r = receivables.find((x) => x.id === where.id);
        if (r) {
          Object.assign(r, data, { updatedAt: new Date() });
          r.party = parties.find((p) => p.id === r.partyId) || null;
          r.workOrder = workOrders.find((w) => w.id === r.workOrderId) || null;
        }
        return r;
      }),
      delete: vi.fn(async ({ where }: any) => {
        const idx = receivables.findIndex((x) => x.id === where.id);
        if (idx >= 0) {
          const [removed] = receivables.splice(idx, 1);
          return removed;
        }
        return null;
      }),
      deleteMany: vi.fn(async ({ where }: any) => {
        const before = receivables.length;
        receivables = receivables.filter((r) => {
          if (where.workOrderId && r.workOrderId === where.workOrderId) {
            if (where.status?.in && where.status.in.includes(r.status)) return false;
          }
          return true;
        });
        return { count: before - receivables.length };
      }),
    },
    operatingExpense: {
      findMany: vi.fn(async ({ where }: any = {}) => {
        let list = [...operatingExpenses];
        if (where?.status?.not) {
          list = list.filter((e) => e.status !== where.status.not);
        }
        if (where?.competenceDate?.gte && where?.competenceDate?.lte) {
          list = list.filter((e) => {
            const d = new Date(e.competenceDate);
            return d >= where.competenceDate.gte && d <= where.competenceDate.lte;
          });
        }
        if (where?.OR) {
          list = list.filter((e) => {
            return where.OR.some((subCond: any) => {
              if (subCond.status === PaymentStatus.PAID && subCond.paidAt) {
                return e.status === PaymentStatus.PAID && e.paidAt && new Date(e.paidAt) >= subCond.paidAt.gte && new Date(e.paidAt) <= subCond.paidAt.lte;
              }
              if (subCond.status?.in && subCond.dueDate) {
                return subCond.status.in.includes(e.status) && new Date(e.dueDate) >= subCond.dueDate.gte && new Date(e.dueDate) <= subCond.dueDate.lte;
              }
              return false;
            });
          });
        }
        return list;
      }),
      create: vi.fn(async ({ data }: any) => {
        const e = {
          id: `opex-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        operatingExpenses.push(e);
        return e;
      }),
      findUnique: vi.fn(async ({ where }: any) => {
        return operatingExpenses.find((e) => e.id === where.id) || null;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const idx = operatingExpenses.findIndex((e) => e.id === where.id);
        if (idx === -1) throw new Error('Not found');
        operatingExpenses[idx] = { ...operatingExpenses[idx], ...data, updatedAt: new Date() };
        return operatingExpenses[idx];
      }),
      delete: vi.fn(async ({ where }: any) => {
        const idx = operatingExpenses.findIndex((e) => e.id === where.id);
        if (idx === -1) throw new Error('Not found');
        const [deleted] = operatingExpenses.splice(idx, 1);
        return deleted;
      }),
      count: vi.fn(async () => operatingExpenses.length),
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
      receivables,
      operatingExpenses,
    },
  };

  return mock;
}
