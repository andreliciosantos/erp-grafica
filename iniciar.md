# 🚀 Guia de Inicialização do Sistema (Para LLMs e Agentes Autônomos)

Este guia foi elaborado para que qualquer **LLM, agente de IA ou desenvolvedor** consiga subir o **ERP Gráfica Modular** do zero, localmente ou com acesso externo seguro via **Cloudflare Tunnel**, sem cometer erros de ambiente ou travar processos.

---

## 📌 1. Visão Geral da Arquitetura & Portas

O projeto é um **Monorepo gerenciado por Turborepo e pnpm workspaces**:

```
ERP_GRAFICA/
├── apps/
│   ├── api/             # Backend NestJS 11 + Prisma ORM (Porta 3000)
│   └── web/             # Frontend React 18 + Vite + Tailwind CSS (Porta 5173)
├── packages/
│   ├── business-core/   # Motores de cálculo de orçamento e imposição gráfica
│   ├── database/        # Prisma Schema e scripts de banco de dados
│   ├── shared-types/    # DTOs e tipos TypeScript compartilhados
│   └── tsconfig/        # Configurações TypeScript base
├── data/
│   ├── embedded-pg/     # Binários e dados do PostgreSQL embarcado (Porta 5432)
│   └── backup_database.sql # Snapshot SQL completo para restauração
└── scripts/
    └── start-db.js      # Gerenciador do PostgreSQL embarcado
```

| Serviço | Porta Local | Protocolo | Descrição |
| :--- | :--- | :--- | :--- |
| **PostgreSQL** | `5432` | TCP | Banco de dados PostgreSQL embarcado (`erp_grafica_db`) |
| **Backend API** | `3000` | HTTP / WS | API REST (`/api/v1`), Swagger (`/docs`) e WebSockets |
| **Frontend Web** | `5173` | HTTP | Interface SPA (Vite com proxy reverso para a API) |

---

## ⚠️ 2. Regras Críticas de Execução para a LLM

1. **Terminal no Windows (PowerShell):**
   * **NUNCA execute `pnpm <comando>` diretamente**, pois a política de scripts do PowerShell (`PSSecurityException`) bloqueará a execução do `pnpm.ps1`.
   * **SEMPRE execute `pnpm.cmd <comando>`** (exemplo: `pnpm.cmd --filter api dev`).
2. **Processos Longos / Servidores (Background):**
   * O banco de dados, o backend e o frontend são **processos contínuos (daemons)**.
   * Quando usar a ferramenta de execução de comandos (ex: `run_command`), marque **`IsDaemon: true`** e defina um `WaitMsBeforeAsync` curto (ex: `5000ms`).
3. **Ordem Obrigatória de Inicialização:**
   * **1º** PostgreSQL (`start-db.js`)
   * **2º** Compilação de pacotes compartilhados e sincronização do schema
   * **3º** Backend API (`api`)
   * **4º** Frontend Web (`web`)
   * **5º** (Opcional) Túnel Cloudflare (`cloudflared`)

---

## 🛠️ 3. Passo a Passo para Subir o Sistema

### Passo 1: Iniciar o Banco de Dados PostgreSQL (Porta 5432)

O banco é embarcado no projeto via pacote `embedded-postgres`. Não requer instalação externa de PostgreSQL.

Execute em segundo plano (`IsDaemon: true`):
```powershell
node scripts/start-db.js
```

**Como testar se o banco subiu:**
```powershell
Test-NetConnection -Port 5432 -ComputerName localhost
```
*Deverá retornar: `TcpTestSucceeded : True`.*

> **💡 Resolução de Problemas (Troubleshooting Banco):**
> Se ocorrer erro de lock ou o banco não inicializar, pode existir um arquivo `postmaster.pid` órfão de uma sessão anterior finalizada abruptamente.
> Para limpar manualmente caso o script não remova automaticamente:
> ```powershell
> Remove-Item -Force "data/embedded-pg/postmaster.pid" -ErrorAction SilentlyContinue
> ```

---

### Passo 2: Compilar Pacotes Compartilhados e Sincronizar Schema

Antes de subir a API ou a Web, os pacotes internos precisam estar compilados e o schema do banco sincronizado:

```powershell
# 1. Compilar tipos compartilhados
pnpm.cmd --filter @erp/shared-types build

# 2. Compilar gerador do Prisma e cliente do banco
pnpm.cmd --filter @erp/database build

# 3. Aplicar o schema do Prisma no PostgreSQL embarcado
pnpm.cmd --filter @erp/database exec prisma db push
```

*(Opcional - se o banco estiver vazio ou recém-clonado)*:
```powershell
# Restaurar dados padrão de fábrica (usuários, matérias-primas, máquinas, etc.)
pnpm.cmd db:restore
# OU executar a seed:
pnpm.cmd db:seed
```

---

### Passo 3: Iniciar o Backend API NestJS (Porta 3000)

Execute em segundo plano (`IsDaemon: true`):
```powershell
pnpm.cmd --filter api dev
```

* **URL Base da API:** `http://localhost:3000/api/v1`
* **Swagger Interativo:** `http://localhost:3000/docs`
* **WebSocket Gateway:** `ws://localhost:3000`

**Como testar se a API subiu:**
Execute no terminal uma requisição de teste:
```powershell
node -e "const http = require('http'); http.get('http://localhost:3000/docs', res => console.log('API Status:', res.statusCode));"
```
*Deverá retornar: `API Status: 200`.*

---

### Passo 4: Iniciar o Frontend Web Vite (Porta 5173)

Execute em segundo plano (`IsDaemon: true`):
```powershell
pnpm.cmd --filter web dev --host
```

* **URL de Acesso:** `http://localhost:5173`

**Como testar se o Frontend subiu:**
```powershell
node -e "const http = require('http'); http.get('http://localhost:5173', res => console.log('Web Status:', res.statusCode));"
```
*Deverá retornar: `Web Status: 200`.*

---

## 🌐 4. Como Colocar para Rodar via Cloudflare Tunnel (`cloudflared`)

### Por que apontar o túnel APENAS para a porta 5173?
No arquivo [`apps/web/vite.config.ts`](file:///c:/Users/Micro/Documents/Projetos/ERP_GRAFICA/apps/web/vite.config.ts), o servidor Vite está configurado com `allowedHosts: true` e **proxy reverso integrado**:
* Todas as chamadas para `/api` são repassadas internamente para `http://localhost:3000/api`
* Todas as chamadas para `/docs` são repassadas para `http://localhost:3000/docs`
* Conexões WebSockets em `/socket.io` são repassadas para `ws://localhost:3000`

Portanto, **basta criar um único túnel apontando para o Vite (`http://localhost:5173`)** para disponibilizar tanto a interface quanto a API e o WebSocket sob o mesmo domínio HTTPS, com zero problemas de CORS!

### Comando de Inicialização do Túnel:

Execute em segundo plano (`IsDaemon: true`):
```powershell
cloudflared tunnel --url http://localhost:5173
```

### Como obter a URL pública:
Abra o arquivo de log gerado pela execução do comando ou leia a saída do processo e procure pela linha contendo `.trycloudflare.com`.

Exemplo de saída do `cloudflared`:
```
2026-09-29T18:40:00Z INF +--------------------------------------------------------------------------------------------+
2026-09-29T18:40:00Z INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
2026-09-29T18:40:00Z INF |  https://exemplo-aleatorio-subdominio.trycloudflare.com                                    |
2026-09-29T18:40:00Z INF +--------------------------------------------------------------------------------------------+
```

A URL `https://*.trycloudflare.com` fornecida é o endereço público com SSL ativo que qualquer usuário na internet ou dispositivo mobile pode acessar.

---

## 🔑 5. Credenciais de Acesso e Teste de Fluxo

### Administrador Geral do Sistema (Root):
* **E-mail:** `admin@erpgrafica.com`
* **Senha:** `admin123`

### Como testar o fluxo de Senha Temporária e Primeiro Login:
1. Acesse o ERP logado como `admin@erpgrafica.com`.
2. Vá até o menu lateral **Usuários** (`/users`).
3. Clique em **"Cadastrar Usuário"**.
4. Preencha Nome, E-mail, Perfil e defina uma **Senha Temporária** (ex: `Temp@2026`).
5. Faça logout ou abra uma aba anônima.
6. Faça login com o e-mail do colaborador e a senha temporária.
7. O sistema interceptará o login e exibirá a tela:
   **"Primeiro Acesso ao Sistema: Cadastre sua Senha Definitiva"**.
8. Ao salvar a nova senha, o sistema grava a senha definitiva e libera o acesso ao ERP.

---

## 🩺 6. Script One-Liner de Verificação de Saúde do Sistema

Para verificar o status completo de todos os serviços de uma só vez, a LLM pode rodar este comando:

```powershell
node -e "
const net = require('net');
const http = require('http');

function checkPort(port, name) {
  return new Promise((resolve) => {
    const s = net.createConnection({ port }, () => {
      resolve('✅ ' + name + ' (Porta ' + port + '): ATIVO');
      s.end();
    });
    s.on('error', () => resolve('❌ ' + name + ' (Porta ' + port + '): PARADO'));
  });
}

async function run() {
  console.log('--- DIAGNÓSTICO DOS SERVIÇOS ---');
  console.log(await checkPort(5432, 'PostgreSQL'));
  console.log(await checkPort(3000, 'Backend API NestJS'));
  console.log(await checkPort(5173, 'Frontend Web Vite'));
}

run();
"
```
