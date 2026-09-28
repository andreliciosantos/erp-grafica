const fs = require('fs');
const path = require('path');

const jsonPath = path.resolve(__dirname, '../packages/database/prisma/seed-data.json');
const sqlPath = path.resolve(__dirname, '../data/backup_database.sql');

if (!fs.existsSync(jsonPath)) {
  console.error('❌ seed-data.json não encontrado!');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

function escapeSqlValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'object') {
    // Date or Json
    if (val instanceof Date || (typeof val === 'string' && !isNaN(Date.parse(val)))) {
      return `'${val}'`;
    }
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

function generateTableInserts(tableName, rows) {
  if (!rows || rows.length === 0) return '';

  const columns = Object.keys(rows[0]).filter(k => k !== 'items' && k !== 'stages');
  const lines = [];

  lines.push(`-- Tabela: ${tableName} (${rows.length} registros)`);
  for (const row of rows) {
    const vals = columns.map(col => escapeSqlValue(row[col]));
    const quotedCols = columns.map(c => `"${c}"`).join(', ');
    lines.push(`INSERT INTO "${tableName}" (${quotedCols}) VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING;`);
  }
  lines.push('');
  return lines.join('\n');
}

let sql = `-- =============================================================
-- ERP GRÁFICA & COMUNICAÇÃO VISUAL - BACKUP COMPLETO DO BANCO
-- Gerado em: ${new Date().toISOString()}
-- =============================================================

BEGIN;

`;

// Mapeamento dos modelos para seus nomes de tabela no PostgreSQL (@@map no schema.prisma)
sql += generateTableInserts('users', data.users);
sql += generateTableInserts('parties', data.parties);
sql += generateTableInserts('raw_materials', data.rawMaterials);
sql += generateTableInserts('machines', data.machines);
sql += generateTableInserts('employees', data.employees);
sql += generateTableInserts('operating_expenses', data.operatingExpenses);
sql += generateTableInserts('payment_conditions', data.paymentConditions);
sql += generateTableInserts('quick_service_presets', data.quickServicePresets);
sql += generateTableInserts('product_templates', data.productTemplates);

// Quotes & QuoteItems
sql += generateTableInserts('quotes', (data.quotes || []).map(q => {
  const { items, ...rest } = q;
  return rest;
}));

const allQuoteItems = [];
for (const q of (data.quotes || [])) {
  if (q.items && q.items.length > 0) {
    allQuoteItems.push(...q.items);
  }
}
sql += generateTableInserts('quote_items', allQuoteItems);

// WorkOrders, Stages, Logs
const allWorkOrders = [];
const allStages = [];
const allLogs = [];

for (const wo of (data.workOrders || [])) {
  const { stages, ...woData } = wo;
  allWorkOrders.push(woData);
  if (stages && stages.length > 0) {
    for (const st of stages) {
      const { logs, ...stData } = st;
      allStages.push(stData);
      if (logs && logs.length > 0) {
        allLogs.push(...logs);
      }
    }
  }
}

sql += generateTableInserts('work_orders', allWorkOrders);
sql += generateTableInserts('work_order_stages', allStages);
sql += generateTableInserts('stage_execution_logs', allLogs);
sql += generateTableInserts('receivables', data.receivables);
sql += generateTableInserts('stock_movements', data.stockMovements);

sql += `\nCOMMIT;\n-- Fim do backup SQL\n`;

fs.writeFileSync(sqlPath, sql, 'utf-8');
console.log(`✅ Arquivo de backup SQL gerado com sucesso: ${sqlPath}`);
