const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT_DIR = path.resolve(__dirname, 'screenshots');

async function capture() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  console.log('🚀 Iniciando navegador Edge headless...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,950'],
    defaultViewport: { width: 1600, height: 950 }
  });

  const page = await browser.newPage();

  try {
    // 1. Login Page
    console.log('📸 1. Capturando tela de Login...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(OUT_DIR, '01_login.png') });

    // Fazer login
    console.log('🔑 Realizando autenticação como admin@erpgrafica.com...');
    await page.type('input[type="email"]', 'admin@erpgrafica.com');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2000));

    // 2. Dashboard
    console.log('📸 2. Capturando Dashboard...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUT_DIR, '02_dashboard.png') });

    // 3. Quadro Kanban de Ordens de Serviço (Chão de Fábrica)
    console.log('📸 3. Capturando Produção / Kanban de Ordens de Serviço...');
    await page.goto('http://localhost:5173/work-orders', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 2500));
    await page.screenshot({ path: path.join(OUT_DIR, '03_kanban_producao.png') });

    // 4. Lista de Orçamentos
    console.log('📸 4. Capturando Lista de Orçamentos...');
    await page.goto('http://localhost:5173/quotes', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUT_DIR, '04_orcamentos.png') });

    // 5. Novo Orçamento / Engenharia Gráfica
    console.log('📸 5. Capturando Novo Orçamento (Engenharia de Corte)...');
    await page.goto('http://localhost:5173/quotes/new', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUT_DIR, '05_novo_orcamento.png') });

    // 6. Insumos e Papéis (Estoque)
    console.log('📸 6. Capturando Estoque de Insumos e Matéria-Prima...');
    await page.goto('http://localhost:5173/raw-materials', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUT_DIR, '06_estoque_insumos.png') });

    // 7. DRE Financeiro
    console.log('📸 7. Capturando DRE Gerencial / Financeiro...');
    await page.goto('http://localhost:5173/financial/dre', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUT_DIR, '07_dre_financeiro.png') });

    // 8. Contas a Receber
    console.log('📸 8. Capturando Contas a Receber...');
    await page.goto('http://localhost:5173/receivables', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUT_DIR, '08_contas_receber.png') });

    // 9. Documentação Swagger OpenAPI
    console.log('📸 9. Capturando Swagger OpenAPI...');
    await page.goto('http://localhost:3000/docs', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2500));
    await page.screenshot({ path: path.join(OUT_DIR, '09_swagger_api.png') });

    console.log('✅ Todas as capturas de tela foram salvas com sucesso em scripts/screenshots!');
  } catch (err) {
    console.error('❌ Erro durante captura:', err);
  } finally {
    await browser.close();
  }
}

capture();
