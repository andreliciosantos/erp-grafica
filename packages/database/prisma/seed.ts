import { PrismaClient, Role, PartyType, RawMaterialCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@erpgrafica.com' },
    update: {},
    create: {
      name: 'Administrador do Sistema',
      email: 'admin@erpgrafica.com',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', adminUser.email);

  // 2. Operator User
  const opPassword = await bcrypt.hash('operador123', 10);
  const opUser = await prisma.user.upsert({
    where: { email: 'operador@erpgrafica.com' },
    update: {},
    create: {
      name: 'Operador Chão de Fábrica',
      email: 'operador@erpgrafica.com',
      passwordHash: opPassword,
      role: Role.OPERATOR,
      isActive: true,
    },
  });
  console.log('✅ Operator user created:', opUser.email);

  // 3. Default Machines
  const machine1 = await prisma.machine.upsert({
    where: { id: 'm-heidelberg-speedmaster' },
    update: {},
    create: {
      id: 'm-heidelberg-speedmaster',
      name: 'Heidelberg Speedmaster SM 74 (Offset)',
      hourlyRate: 180.0,
      setupMinutes: 30,
      maxSheetsHour: 8000,
      isActive: true,
    },
  });

  const machine2 = await prisma.machine.upsert({
    where: { id: 'm-konica-c3070' },
    update: {},
    create: {
      id: 'm-konica-c3070',
      name: 'Konica Minolta AccurioPrint C3070 (Digital)',
      hourlyRate: 95.0,
      setupMinutes: 10,
      maxSheetsHour: 3000,
      isActive: true,
    },
  });
  console.log('✅ Machines seeded:', machine1.name, ',', machine2.name);

  // 4. Default Raw Materials (Papers)
  const paper1 = await prisma.rawMaterial.upsert({
    where: { id: 'rm-couche-150g-66x96' },
    update: {},
    create: {
      id: 'rm-couche-150g-66x96',
      name: 'Papel Couché Brilho 150g (660x960mm)',
      category: RawMaterialCategory.PAPER,
      unitOfMeasure: 'FL',
      costPerUnit: 0.85,
      currentStock: 5000,
      minStock: 1000,
      sheetWidthMm: 660,
      sheetHeightMm: 960,
      grammage: 150,
    },
  });

  const paper2 = await prisma.rawMaterial.upsert({
    where: { id: 'rm-offset-90g-66x96' },
    update: {},
    create: {
      id: 'rm-offset-90g-66x96',
      name: 'Papel Offset 90g (660x960mm)',
      category: RawMaterialCategory.PAPER,
      unitOfMeasure: 'FL',
      costPerUnit: 0.45,
      currentStock: 10000,
      minStock: 2000,
      sheetWidthMm: 660,
      sheetHeightMm: 960,
      grammage: 90,
    },
  });
  console.log('✅ Raw materials seeded:', paper1.name, ',', paper2.name);

  // 5. Default Party (Customer)
  const client = await prisma.party.upsert({
    where: { document: '12345678000195' },
    update: {},
    create: {
      type: PartyType.COMPANY,
      name: 'Gráfica e Editora Exemplo Ltda',
      tradeName: 'Editora Exemplo',
      document: '12345678000195',
      email: 'contato@editoraexemplo.com.br',
      phone: '5511988887777',
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      isCustomer: true,
      isSupplier: false,
    },
  });
  console.log('✅ Sample customer seeded:', client.name);

  console.log('🎉 Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
