# Plano de Implementação — Frontend Web (React + Vite + Tailwind + Kanban)

Planejamento arquitetural e de engenharia para a construção do Frontend Web (`apps/web`) do **ERP Gráfica Modular**, garantindo desacoplamento de responsabilidades, separação estrita de camadas (Feature-Driven Design), design system corporativo moderno e integração reativa via WebSockets com a API backend NestJS e com o motor de cálculo `@erp/business-core`.

---

## 🎯 Objetivos de Negócio e Funcionais

1. **Dashboard Executivo e Industrial:**
   - Métricas em tempo real de faturamento cotado, ordens ativas e alertas de estoque mínimo de papel.
   - Visão do funil de produção agrupado pelas 6 etapas gráficas industriais.
2. **Orçamento Técnico com Simulador Visual 2D (`/quotes/new`):**
   - Renderização SVG interativa da folha pai (ex: 660x960mm) com margens de pinça (10mm) e sangrias (3mm).
   - Cálculo automático da melhor orientação geométrica (retrato direto vs giro 90°) usando `@erp/business-core`.
   - Formação de preço em tempo real considerando folhas necessárias, custo de insumos, horas de máquina (setup + velocidade nominal) e markup comercial.
3. **Chão de Fábrica Kanban (`/work-orders`):**
   - 6 colunas representando as etapas de produção:
     1. Aguardando (`PENDING`)
     2. Pré-Impressão / CTP (`PRE_PRESS`)
     3. Impressão Offset/Digital (`PRINTING`)
     4. Acabamento e Corte (`FINISHING`)
     5. Controle de Qualidade (`QUALITY_CONTROL`)
     6. Pronto p/ Retirada (`READY_FOR_PICKUP`)
   - Sincronização em tempo real via **Socket.io** para múltiplos operadores.
   - Modal de apontamento de máquina com operador, máquina utilizada, data/hora e refugo/perda de folhas.
4. **Cadastros Base da Indústria Gráfica:**
   - Clientes e Fornecedores (`/parties`)
   - Estoque de Insumos e Papéis com gramatura e formato de folha (`/raw-materials`)
   - Parque de Máquinas com velocidade nominal e taxa horária (`/machines`)
   - Gestão de Usuários e Cargos com RBAC (`/users`)
5. **Autenticação Segura:**
   - Login JWT com persistência Zustand e atalhos rápidos de demonstração (Admin, Comercial, Operador).

---

## 🏗️ Estrutura Arquitetural Proposta

```text
apps/web/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── src/
│   ├── components/
│   │   ├── common/                  # Design System desacoplado
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── StatCard.tsx
│   │   ├── cutting-preview/         # Simulador visual SVG
│   │   │   └── SheetCuttingCanvas.tsx
│   │   └── layout/                  # Estrutura base da interface
│   │       ├── Sidebar.tsx
│   │       ├── Header.tsx
│   │       ├── MainLayout.tsx
│   │       └── ProtectedRoute.tsx
│   ├── features/                    # Módulos de domínio independentes
│   │   ├── auth/                    # LoginPage
│   │   ├── dashboard/               # DashboardPage
│   │   ├── quotes/                  # QuotesListPage e NewQuotePage
│   │   ├── work-orders/             # Chão de Fábrica Kanban e modais
│   │   ├── raw-materials/           # Gestão de Papéis e Insumos
│   │   ├── machines/                # Parque Gráfico
│   │   ├── parties/                 # Clientes e Fornecedores
│   │   └── users/                   # Usuários e Perfis
│   ├── stores/                      # Zustand (authStore)
│   ├── lib/                         # Axios api, Socket.io, utils
│   ├── config/                      # Variáveis de ambiente
│   └── types/                       # Interfaces TypeScript e DTOs
```

---

## 🛡️ Controle de Acesso Baseado em Perfis (RBAC)

- **ADMIN:** Acesso irrestrito a todas as telas, relatórios, cadastros e parametrizações.
- **COMMERCIAL:** Foco em Orçamentos, Clientes e acompanhamento de prazos de entrega.
- **OPERATOR:** Acesso restrito ao Chão de Fábrica Kanban para apontamentos de máquina e perdas, redirecionado diretamente após login.
