# Relatório de Execução (Walkthrough) — ERP Gráfica Modular

A aplicação web (`apps/web`) foi implementada com arquitetura modular orientada a features/domínios e conta com uma **suíte completa de testes automatizados** com Vitest e React Testing Library, alcançando **100% de aprovação** (10 suítes, 60 testes). Todos os arquivos foram commitados e sincronizados com o repositório GitHub privado.

---

## 🔗 Repositório Remoto Atualizado
- **URL:** [https://github.com/andreliciosantos/erp-grafica](https://github.com/andreliciosantos/erp-grafica)
- **Últimos Commits:**
  - `e6cf911` — `feat(web): permitir acesso externo via tunnel e proxy reverso para docs e websockets`
  - `69f049d` — `test(web): implementar suite de testes automatizados com Vitest e Testing Library`
  - `bc1a47d` — `feat(web): implementar frontend web modular com React, Vite, Tailwind e Socket.io`
  - `b485649` — `docs: adicionar README completo da arquitetura e especificações do ERP`
  - `63fb9d2` — `feat: fundacao completa do ERP Grafica Modular (NestJS, Prisma, Turborepo, Swagger OpenAPI)`

---

## 🏗️ Arquitetura e Organização de Pastas

A aplicação foi estruturada no padrão **Feature-Driven / Domain-Driven Design**:

```text
apps/web/
├── index.html                      # Ponto de montagem HTML com tipografia Plus Jakarta Sans
├── package.json                    # Dependências e scripts (Vite, React 18, Tailwind, TanStack Query, Zustand)
├── vite.config.ts                  # Aliases de monorepo e proxy reverso para API, Swagger e WebSockets (:3000)
├── tailwind.config.js              # Configuração de temas e paleta industrial dark mode
├── vitest.config.ts                # Configuração do Vitest com jsdom e monorepo
├── src/
│   ├── main.tsx                    # Entrypoint com inicialização de sessão e hidratação do AuthStore
│   ├── App.tsx                     # Roteamento seguro com React Router e QueryClientProvider
│   ├── index.css                   # Tailwind directives e customizações de scrollbar e canvas
│   ├── vite-env.d.ts               # Tipagens de ambiente Vite
│   ├── config/
│   │   └── env.ts                  # URLs de endpoints e Socket.io (com detecção dinâmica de origin)
│   ├── lib/
│   │   ├── api.ts                  # Instância Axios com injeção automática de Bearer Token e interceptor 401
│   │   ├── socket.ts               # Cliente Socket.io para sincronização em tempo real do chão de fábrica
│   │   └── utils.ts                # Utilitários: cn (clsx/tailwind-merge), formatCurrency (BRL), formatDate, badges
│   ├── stores/
│   │   └── authStore.ts            # Gerenciador global de autenticação Zustand com persistência local
│   ├── types/
│   │   └── index.ts                # Tipagens de API, DTOs e reexportação segura de @erp/shared-types
│   ├── test/
│   │   ├── setup.ts                # Matchers jest-dom e cleanup automático de DOM e localStorage
│   │   └── test-utils.tsx          # Wrapper com QueryClientProvider e MemoryRouter
│   ├── components/
│   │   ├── common/                 # Design System desacoplado e reutilizável
│   │   │   ├── Button.tsx          # Variantes: primary, secondary, outline, danger, ghost, sizes
│   │   │   ├── Input.tsx           # Inputs estilizados com ícones, labels e mensagens de erro
│   │   │   ├── Select.tsx          # Selects customizados com opções e placeholders
│   │   │   ├── Card.tsx            # Cartões de interface com CardHeader, CardTitle, CardContent
│   │   │   ├── Badge.tsx           # Tags coloridas por status (primary, success, warning, danger, blue, info, purple)
│   │   │   ├── Modal.tsx           # Modais com overlay escurecido e suporte a formulários e ações
│   │   │   └── StatCard.tsx        # Cartões KPI com indicadores de tendência percentual e ícones
│   │   ├── cutting-preview/
│   │   │   └── SheetCuttingCanvas.tsx # Simulador visual interativo 2D em SVG de corte e aproveitamento de folha
│   │   └── layout/
│   │       ├── Sidebar.tsx         # Menu lateral com controle de permissão RBAC e perfil ativo
│   │       ├── Header.tsx          # Barra superior com indicador ao vivo de WebSocket e logout
│   │       ├── MainLayout.tsx      # Template unificado com Sidebar e Header
│   │       └── ProtectedRoute.tsx  # Guardião de rotas por autenticação e Role
│   └── features/
│       ├── auth/
│       │   └── LoginPage.tsx       # Tela de login com botões de preenchimento rápido (Admin, Vendedor, Operador)
│       ├── dashboard/
│       │   └── DashboardPage.tsx   # Painel com KPIs, funil das 6 etapas industriais e Ordens recentes
│       ├── quotes/
│       │   ├── QuotesListPage.tsx  # Listagem de orçamentos com busca, filtros de status e aprovação direta
│       │   └── NewQuotePage.tsx    # Orçamentação técnica com simulador 2D e cálculo de markup ao vivo
│       ├── work-orders/
│       │   ├── WorkOrdersPage.tsx  # Quadro Kanban com 6 colunas industriais e escuta ativa Socket.io
│       │   ├── KanbanColumn.tsx    # Coluna do quadro com contadores e destaque visual
│       │   ├── KanbanCard.tsx      # Cartão de OS com badges de prioridade, entrega e código de barras
│       │   ├── OrderDetailsModal.tsx # Modal com histórico de etapas e apontamentos de máquina
│       │   └── StageActionModal.tsx  # Modal para operador iniciar etapa, pausar ou concluir com perdas
│       ├── raw-materials/
│       │   └── RawMaterialsPage.tsx # Gestão de estoque de papéis e insumos com alerta de estoque mínimo
│       ├── machines/
│       │   └── MachinesPage.tsx    # Parque gráfico: impressoras offset/digitais, taxa horária e setup
│       ├── parties/
│       │   └── PartiesPage.tsx     # Cadastro de clientes (PF/PJ) e fornecedores com busca
│       └── users/
│           └── UsersPage.tsx       # Gestão de operadores e usuários do sistema com atribuição de papéis
```

---

## 🎨 Principais Funcionalidades Entregues

### 1. Simulador Visual 2D de Corte (`SheetCuttingCanvas`)
- Renderização visual SVG interativa mostrando a **Folha Pai** (ex: 660x960mm).
- Identificação clara das **Margens de Pinça** (10mm topo/base) e **Sangrias** (3mm).
- Grid com os itens dispostos na melhor orientação calculada automaticamente pelo motor `@erp/business-core` (direto vs. rotacionado a 90°).
- Indicador percentual de aproveitamento útil da folha e contagem de folhas pai necessárias.

### 2. Formação de Preço Técnico em Tempo Real
- Cálculo instantâneo integrado a `@erp/business-core` (`calculateQuotePricing`):
  - Custo de Papel = `Folhas_Necessárias * Custo_Unitário`
  - Tempo de Máquina = `Setup + (Folhas / Velocidade_Nominal)`
  - Custo de Impressão = `Tempo_Máquina * Taxa_Hora_Máquina`
  - Acabamentos Especiais (Dobra, Laminação Fosca, Verniz UV, Corte Especial)
  - Preço de Venda Final = `Custo_Total / (1 - Markup)`
  - Preço Unitário por Peça

### 3. Chão de Fábrica Kanban com Sincronização em Tempo Real
- Fluxo industrial modelado em 6 etapas:
  1. `Aguardando (PENDING)`
  2. `Pré-Impressão / CTP (PRE_PRESS)`
  3. `Impressão Offset/Digital (PRINTING)`
  4. `Acabamento e Corte (FINISHING)`
  5. `Controle de Qualidade (QUALITY_CONTROL)`
  6. `Pronto p/ Retirada (READY_FOR_PICKUP)`
- Conexão bidirecional via **Socket.io** escutando eventos de fábrica (`work_order_created`, `stage_status_updated`, `production_logged`).
- Modal para apontamento de operador: registro de operador, máquina utilizada, data/hora e quantidade de refugo/folhas perdidas.

---

## 🧪 Suíte de Testes Automatizados (100% de Aprovação)

| Arquivo de Teste | Área Coberta | Qtd Testes | Status |
| :--- | :--- | :---: | :---: |
| `src/lib/utils.test.ts` | Formatação BRL, datas, prioridades, status e `cn` | 16 | ✅ Passou |
| `src/stores/authStore.test.ts` | Login, logout, persistência em localStorage | 5 | ✅ Passou |
| `src/components/common/Button.test.tsx` | Variantes, loading, disabled e cliques | 6 | ✅ Passou |
| `src/components/common/Badge.test.tsx` | Cores de status e tamanhos | 6 | ✅ Passou |
| `src/components/common/Input.test.tsx` | Labels, erros, helper text e digitação | 5 | ✅ Passou |
| `src/components/common/Modal.test.tsx` | Abertura/fechamento e footer | 4 | ✅ Passou |
| `src/components/common/StatCard.test.tsx` | Título, valor, subtítulo, ícone e tendências (+/-) | 4 | ✅ Passou |
| `src/components/cutting-preview/SheetCuttingCanvas.test.tsx` | SVG da folha pai, grid de itens e giro 90° | 4 | ✅ Passou |
| `src/features/auth/LoginPage.test.tsx` | Formulário, preenchimento rápido e submissão | 5 | ✅ Passou |
| `src/features/work-orders/KanbanCard.test.tsx` | Cartão de OS no Kanban, cliente e avanço rápido | 5 | ✅ Passou |

**Total:** 10 arquivos de teste, **60 testes executados, 60 aprovados, 0 falhas**.

---

## ⚡ Comandos para Execução

### Rodar todos os testes do frontend:
```bash
pnpm --filter web test
```

### Rodar testes em modo interativo (watch mode):
```bash
pnpm --filter web test:watch
```

### Compilar o frontend em modo de produção:
```bash
pnpm --filter web build
```

### Iniciar o frontend em desenvolvimento:
```bash
pnpm --filter web dev
```
