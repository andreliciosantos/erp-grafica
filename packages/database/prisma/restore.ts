import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

export async function restoreFromSnapshot() {
  const jsonPath = path.resolve(__dirname, 'seed-data.json');
  if (!fs.existsSync(jsonPath)) {
    console.log('⚠️ No seed-data.json snapshot found to restore.');
    return false;
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log('🔄 Restoring database from snapshot seed-data.json...');

  // 1. Users
  for (const user of data.users || []) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: user,
      create: user,
    });
  }

  // 2. Parties
  for (const party of data.parties || []) {
    await prisma.party.upsert({
      where: { id: party.id },
      update: party,
      create: party,
    });
  }

  // 3. Raw Materials
  for (const rm of data.rawMaterials || []) {
    await prisma.rawMaterial.upsert({
      where: { id: rm.id },
      update: rm,
      create: rm,
    });
  }

  // 4. Machines
  for (const m of data.machines || []) {
    await prisma.machine.upsert({
      where: { id: m.id },
      update: m,
      create: m,
    });
  }

  // 5. Product Templates
  for (const pt of data.productTemplates || []) {
    await prisma.productTemplate.upsert({
      where: { id: pt.id },
      update: pt,
      create: pt,
    });
  }

  // 6. Employees
  for (const emp of data.employees || []) {
    await prisma.employee.upsert({
      where: { id: emp.id },
      update: emp,
      create: emp,
    });
  }

  // 7. Operating Expenses
  for (const exp of data.operatingExpenses || []) {
    await prisma.operatingExpense.upsert({
      where: { id: exp.id },
      update: exp,
      create: exp,
    });
  }

  // 8. Quotes and QuoteItems
  for (const quote of data.quotes || []) {
    const { items, ...quoteData } = quote;
    await prisma.quote.upsert({
      where: { id: quoteData.id },
      update: quoteData,
      create: quoteData,
    });

    if (items && items.length > 0) {
      for (const item of items) {
        await prisma.quoteItem.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    }
  }

  // 9. Work Orders and Stages
  for (const wo of data.workOrders || []) {
    const { stages, ...woData } = wo;
    await prisma.workOrder.upsert({
      where: { id: woData.id },
      update: woData,
      create: woData,
    });

    if (stages && stages.length > 0) {
      for (const stage of stages) {
        const { logs, ...stageData } = stage;
        await prisma.workOrderStage.upsert({
          where: { id: stageData.id },
          update: stageData,
          create: stageData,
        });

        if (logs && logs.length > 0) {
          for (const log of logs) {
            await prisma.stageExecutionLog.upsert({
              where: { id: log.id },
              update: log,
              create: log,
            });
          }
        }
      }
    }
  }

  // 10. Receivables
  for (const rec of data.receivables || []) {
    await prisma.receivable.upsert({
      where: { id: rec.id },
      update: rec,
      create: rec,
    });
  }

  // 11. Stock Movements
  for (const sm of data.stockMovements || []) {
    await prisma.stockMovement.upsert({
      where: { id: sm.id },
      update: sm,
      create: sm,
    });
  }

  console.log('✅ Database successfully restored from snapshot!');
  return true;
}

if (require.main === module) {
  restoreFromSnapshot()
    .catch((err) => {
      console.error('❌ Error restoring database:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
