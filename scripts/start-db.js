const { default: EmbeddedPostgres } = require('embedded-postgres');
const fs = require('fs');
const path = require('path');
const net = require('net');

const PORT = 5432;
const DB_DIR = path.resolve(__dirname, '../data/embedded-pg');
const PID_FILE = path.join(DB_DIR, 'postmaster.pid');

function isPortInUse(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .once('listening', () => {
        tester.once('close', () => resolve(false)).close();
      })
      .listen(port);
  });
}

async function start() {
  const inUse = await isPortInUse(PORT);
  if (inUse) {
    console.log(`✅ PostgreSQL já está rodando e escutando na porta ${PORT}.`);
    return;
  }

  // Remove postmaster.pid órfão caso o processo anterior tenha terminado abruptamente
  if (fs.existsSync(PID_FILE)) {
    try {
      fs.unlinkSync(PID_FILE);
      console.log('🧹 Arquivo postmaster.pid órfão removido com sucesso.');
    } catch (e) {
      console.warn('⚠️ Aviso ao tentar remover postmaster.pid:', e.message);
    }
  }

  console.log(`🚀 Iniciando PostgreSQL embarcado na porta ${PORT} (diretório: ${DB_DIR})...`);
  const ep = new EmbeddedPostgres({
    port: PORT,
    databaseDir: DB_DIR,
  });

  await ep.start();
  console.log(`🎉 PostgreSQL iniciado com sucesso e pronto para conexões na porta ${PORT}!`);

  // Manter o processo ativo se executado diretamente
  process.on('SIGINT', async () => {
    console.log('\n🛑 Encerrando PostgreSQL...');
    try {
      await ep.stop();
    } catch (_) {}
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Encerrando PostgreSQL...');
    try {
      await ep.stop();
    } catch (_) {}
    process.exit(0);
  });
}

start().catch((err) => {
  console.error('❌ Erro fatal ao iniciar PostgreSQL:', err);
  process.exit(1);
});
