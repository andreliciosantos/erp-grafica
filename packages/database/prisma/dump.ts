import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function dump() {
  console.log('📦 Exporting database snapshot...');
  const data = {
    users: await prisma.user.findMany(),
    parties: await prisma.party.findMany(),
    rawMaterials: await prisma.rawMaterial.findMany(),
    stockMovements: await prisma.stockMovement.findMany(),
    machines: await prisma.machine.findMany(),
    quotes: await prisma.quote.findMany({ include: { items: true } }),
    workOrders: await prisma.workOrder.findMany({
      include: {
        stages: {
          include: { logs: true },
        },
      },
    }),
    employees: await prisma.employee.findMany(),
    operatingExpenses: await prisma.operatingExpense.findMany(),
    receivables: await prisma.receivable.findMany(),
    productTemplates: await prisma.productTemplate.findMany(),
  };

  const outputPath = path.resolve(__dirname, 'seed-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');

  console.log('✅ Database snapshot exported successfully to:', outputPath);
  console.log(
    Object.entries(data)
      .map(([key, val]) => ` - ${key}: ${(val as any[]).length} records`)
      .join('\n')
  );
}

dump()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
