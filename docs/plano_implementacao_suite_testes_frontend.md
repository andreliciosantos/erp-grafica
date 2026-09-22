# Plano de Implementação — Suíte de Testes do Frontend Web

Criar uma suíte de testes automatizados completa, robusta e rápida para o frontend (`apps/web`), alinhada ao ecossistema Vitest já utilizado nos outros pacotes do monorepo (`@erp/business-core` e `apps/api`), garantindo 100% de aprovação nos testes de componentes, utilitários, estado global e módulos chave.

---

## 🎯 Escopo da Suíte de Testes

1. **Infraestrutura de Testes:**
   - Adicionar `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom` e `@testing-library/user-event` nas `devDependencies` de `apps/web`.
   - Criar `apps/web/vitest.config.ts` configurado com ambiente `jsdom`, `globals: true` e aliases do monorepo.
   - Criar `apps/web/src/test/setup.ts` para carregar matchers do `jest-dom` e limpar o `localStorage` entre execuções.
   - Criar `apps/web/src/test/test-utils.tsx` com wrapper contendo `QueryClientProvider` e `BrowserRouter` para renderizar componentes conectados.
   - Adicionar scripts `"test"`, `"test:watch"` e `"test:coverage"` em `apps/web/package.json`.

2. **Áreas e Casos de Teste a Cobrir:**
   - **Utilitários e Formatadores (`src/lib/utils.test.ts`):**
     - Formatação monetária em Real brasileiro (`formatCurrency`).
     - Formatação de datas curtas e com horário (`formatDate`, `formatDateTime`).
     - Configuração de badges e variantes de status das 6 etapas industriais e pedidos (`getStatusConfig`).
     - Configuração de badges de prioridade 1 a 4 (`getPriorityConfig`).
     - Fusão de classes CSS com Tailwind (`cn`).
   - **Gerenciador de Estado e Autenticação (`src/stores/authStore.test.ts`):**
     - Login com gravação em `localStorage` e atualização reativa do Zustand.
     - Logout com limpeza de credenciais e tokens.
     - Inicialização com restauração de sessão persistida e tratamento de dados corrompidos.
   - **Design System / Componentes Comuns (`src/components/common/`):**
     - `Button.test.tsx`: Renderização de todas as variantes (`primary`, `secondary`, `danger`, `outline`, `ghost`), tamanhos, estado desabilitado, spinner de `isLoading` e eventos de clique.
     - `Badge.test.tsx`: Renderização correta com variantes (`primary`, `success`, `warning`, `danger`, `info`, `blue`, `purple`, `cyan`, `neutral`) e tamanhos (`sm`, `md`).
     - `Input.test.tsx` e `Select.test.tsx`: Exibição de labels, placeholders, mensagens de erro e disparos de digitação/seleção.
     - `Modal.test.tsx`: Visibilidade condicional (`isOpen`), botões de fechar e clique no backdrop.
     - `StatCard.test.tsx`: Título, valor, subtítulo, ícone e tendências percentuais positivas/negativas.
   - **Simulador Gráfico 2D (`src/components/cutting-preview/SheetCuttingCanvas.test.tsx`):**
     - Renderização da folha pai em SVG, áreas de sangria e pinça.
     - Cálculo visual de aproveitamento percentual e orientação direta vs. rotacionada 90°.
   - **Features & Telas (`src/features/`):**
     - `LoginPage.test.tsx`: Formulário de credenciais, botões de preenchimento rápido de demonstração (Admin, Comercial, Operador) e submissão.
     - `KanbanCard.test.tsx`: Cartão de OS com número do pedido, cliente, código de barras, prazo de entrega, prioridade e clique para detalhes.

---

## 📂 Arquivos de Teste

### Infraestrutura e Configuração
- `apps/web/vitest.config.ts`
- `apps/web/src/test/setup.ts`
- `apps/web/src/test/test-utils.tsx`

### Arquivos de Teste Implementados
- `apps/web/src/lib/utils.test.ts` (16 testes)
- `apps/web/src/stores/authStore.test.ts` (5 testes)
- `apps/web/src/components/common/Button.test.tsx` (6 testes)
- `apps/web/src/components/common/Badge.test.tsx` (6 testes)
- `apps/web/src/components/common/Input.test.tsx` (5 testes)
- `apps/web/src/components/common/Modal.test.tsx` (4 testes)
- `apps/web/src/components/common/StatCard.test.tsx` (4 testes)
- `apps/web/src/components/cutting-preview/SheetCuttingCanvas.test.tsx` (4 testes)
- `apps/web/src/features/auth/LoginPage.test.tsx` (5 testes)
- `apps/web/src/features/work-orders/KanbanCard.test.tsx` (5 testes)

---

## 🧪 Plano de Verificação

### Testes Automatizados
- Executar a suíte de testes com Vitest:
  ```bash
  pnpm --filter web test
  ```
- Validar que todos os testes passem (0 falhas).
- Validar compilação de produção sem regressões:
  ```bash
  pnpm --filter web build
  ```
