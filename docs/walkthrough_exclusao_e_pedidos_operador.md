# Atualização do Sistema: Exclusão de Entidades e Criação de Pedidos para Operadores

Nesta atualização, atendemos a duas demandas essenciais do sistema:
1. **Exclusão de Entidades no Frontend e Backend**: Botões e modais de confirmação para exclusão de Orçamentos, Máquinas, Insumos/Papéis, Clientes/Fornecedores, Usuários e Ordens de Serviço (OS).
2. **Criação de Pedidos pelo Operador**: O operador agora possui acesso aos menus de Orçamentos e Clientes, além de poder cadastrar novos pedidos e Ordens de Serviço diretamente no Chão de Fábrica (Kanban) através de um modal simplificado e rápido.

---

## 🚀 O que foi Implementado

### 1. Backend (NestJS & Prisma)

- **Máquinas (`/machines`)**:
  - Adicionado endpoint `DELETE /machines/:id` com proteção de rota `@Roles(Role.ADMIN)`.
  - Tratamento de integridade: desvincula logs de máquinas (`machineId = null`) antes de remover a máquina.
- **Insumos & Matérias-Primas (`/raw-materials`)**:
  - Adicionado endpoint `DELETE /raw-materials/:id` com proteção `@Roles(Role.ADMIN)`.
  - Tratamento de integridade: remove movimentações de estoque e desvincula itens de orçamento vinculados em transação Prisma.
- **Clientes e Fornecedores (`/parties`)**:
  - Adicionado endpoint `DELETE /parties/:id` com proteção `@Roles(Role.ADMIN, Role.COMMERCIAL)`.
  - Validação de regras de negócio: impede exclusão se houver Ordens de Serviço vinculadas ao cliente e remove orçamentos pendentes em cascata controlada.
  - Adicionado `Role.OPERATOR` ao `POST /parties` para permitir que operadores também cadastrem clientes quando necessário.
- **Usuários & Acesso (`/users`)**:
  - Adicionado endpoint `DELETE /users/:id` com proteção `@Roles(Role.ADMIN)`.
  - Auditoria e conformidade: se o usuário possuir histórico operacional (orçamentos gerados, ordens de serviço ou apontamentos de fábrica), a conta é desativada (`isActive: false`) preservando o histórico de rastreabilidade. Se não possuir vínculos, é excluído definitivamente.
- **Orçamentos (`/quotes`)**:
  - Adicionado endpoint `DELETE /quotes/:id` com proteção `@Roles(Role.ADMIN, Role.COMMERCIAL, Role.OPERATOR)`.
  - Concedida permissão para `Role.OPERATOR` em `POST /quotes`, `GET /quotes` e `POST /quotes/:id/approve`.
  - Exclusão em transação atômica que remove etapas, logs de chão de fábrica, movimentações e a própria OS caso já tivesse sido gerada.
- **Ordens de Serviço (`/work-orders`)**:
  - Criado DTO `CreateDirectOrderDto` com validações via `class-validator` (`partyId`, `productName`, `quantity`, `priority`, `deliveryDays`, `totalAmount`, `notes`).
  - Adicionado endpoint `POST /work-orders` permitindo que operadores, comerciais e administradores cadastrem pedidos diretamente no PCP.
  - O backend gera automaticamente o Orçamento (`status: APPROVED`), calcula valores unitários, gera o número da OS (`OS-AAAA-XXXXX`), código de barras e instancia as 5 etapas fabris padrão.
  - Adicionado endpoint `DELETE /work-orders/:id` com remoção controlada de etapas, logs de apontamento e movimentações de estoque, retornando o orçamento vinculado para `status: DRAFT`.

---

### 2. Frontend Web (`apps/web`)

- **Navegação e Permissões (`Sidebar.tsx`)**:
  - Incluído `Role.OPERATOR` nas opções de menu **Orçamentos** e **Clientes & Fornec.**, permitindo que operadores consultem e cadastrem clientes e orçamentos técnicos.
- **Chão de Fábrica & Kanban (`WorkOrdersPage.tsx` e `CreateOrderModal.tsx`)**:
  - Adicionado botão de destaque **"+ Novo Pedido / OS"** no topo da tela do PCP.
  - Desenvolvido o componente `CreateOrderModal.tsx`, com seleção ágil de cliente, descrição do produto gráfico, quantidade, prioridade, prazo e valor.
  - Adicionado botão de lixeira com modal de confirmação de exclusão de OS na visualização em Tabela e dentro do modal `OrderDetailsModal.tsx`.
- **Exclusão de Orçamentos (`QuotesListPage.tsx`)**:
  - Adicionado botão de lixeira na tabela de orçamentos acionando modal de confirmação com resumo do produto e valor antes da exclusão.
- **Exclusão de Máquinas Gráficas (`MachinesPage.tsx`)**:
  - Adicionado botão de lixeira em cada card de máquina com modal de confirmação.
- **Exclusão de Insumos & Papéis (`RawMaterialsPage.tsx`)**:
  - Adicionada coluna de ações com botão de exclusão e modal de confirmação informando o estoque atual e custo unitário.
- **Exclusão de Clientes (`PartiesPage.tsx`)**:
  - Adicionada coluna de ações com botão de exclusão e modal de confirmação.
- **Exclusão / Desativação de Usuários (`UsersPage.tsx`)**:
  - Adicionada coluna de ações com botão de exclusão e modal de confirmação explicando a regra de preservação do histórico de auditoria.

---

### 3. Validação e Qualidade

- **Compilação Backend**: `pnpm --filter api build` executado com **0 erros** e NestJS iniciado com todos os endpoints mapeados.
- **Compilação Frontend**: `pnpm --filter web build` executado com **0 erros** via TypeScript e Vite.
- **Suíte de Testes Frontend**: Todos os **60 testes em 10 arquivos** foram executados com **100% de aprovação**.
- **Suíte de Testes Backend**: Todos os **19 testes em 4 arquivos** foram executados com **100% de aprovação**.
- **Suíte de Testes Business Core**: Todos os **8 testes** de cálculo gráfico foram executados com **100% de aprovação**.
