# Walkthrough Completo do Projeto — ERP Gráfica Modular

> **Documento de Arquitetura, Engenharia e Decisões de Projeto**  
> Este documento apresenta o panorama integral do sistema **ERP Gráfica Modular**, explicando minuciosamente o problema de domínio industrial que ele resolve, como cada componente foi estruturado e **os motivos técnicos e de negócio por trás de cada escolha**.

---

## 1. O Problema de Domínio: Por que ERPs Tradicionais Falham em Gráficas?

No mercado de software de gestão, a vasta maioria dos ERPs foi projetada para indústrias de **montagem** (onde partes são somadas: \(A + B = C\)) ou para o **comércio varejista** (compra por R\$ 10, vende por R\$ 20).

A indústria gráfica opera em uma lógica diametralmente oposta:
1. **Desmontagem e Geometria Bidimensional:** Compra-se matéria-prima em folhas gigantescas (chamadas de **Folhas Pai**, como 660x960mm ou 640x880mm) ou bobinas. Cada produto final (cartão de visita, folder, folheto, rótulo) precisa ser geometricamente "imposto" (cortado) sobre essa folha.
2. **Orientação e Aproveitamento:** Um item de 210x297mm (A4) pode caber em quantidades completamente diferentes se impresso em orientação retrato (direta) ou paisagem (girada em 90°). O algoritmo precisa testar ambas as permutações para minimizar o refugo de papel.
3. **Restrições Físicas das Máquinas:**
   - **Margem de Pinça (Gripper Margin):** A impressora offset precisa de dentes mecânicos (pinças) para puxar o papel para dentro dos cilindros de borracha e blanqueta. Essa área de 10mm no topo e na base não pode conter tinta nem produtos.
   - **Sangria (Bleed):** Ao guilhotinar pacotes de milhares de folhas, pequenas oscilações de lâmina ocorrem. Se a arte não tiver 3mm de margem além da linha de corte, o material sairá com filetes brancos na borda.
4. **Composição Híbrida de Custos:**
   - Custo Fixo de Setup (gravação de matrizes térmicas de alumínio CTP, acerto de tinteiros, limpeza de rolos, afinação de registro).
   - Custo Variável de Tiragem (velocidade nominal da impressora em folhas por hora, consumo proporcional de tinta, verniz e energia elétrica trifásica).
   - Acabamentos Especiais (laminação bopp fosca, verniz UV localizado, faca de corte/vinco, dobra automática).

**Conclusão de Domínio:** Sem um motor de cálculo paramétrico gráfico e um chão de fábrica que controle perdas e etapas físicas, uma gráfica opera no escuro e tem prejuízo mesmo com a produção cheia.

---

## 2. A Arquitetura Monorepo: Por que Turborepo e pnpm Workspaces?

### Estrutura do Repositório
```text
ERP_GRAFICA/
├── apps/
│   ├── api/             # Backend NestJS (REST + WebSockets + Swagger)
│   └── web/             # Frontend Web React 18 + Vite 6 + Tailwind CSS
├── packages/
│   ├── business-core/   # Motor matemático de cálculo gráfico e precificação
│   ├── database/        # Camada de dados com Prisma ORM e PostgreSQL
│   ├── shared-types/    # Tipagens TypeScript compartilhadas e Enums
│   └── tsconfig/        # Configurações canônicas de TypeScript
├── docs/                # Documentação técnica e relatórios
└── package.json         # Raiz com scripts de orquestração Turborepo
```

### Motivos da Decisão:
* **Eliminação do "Drift" de Contratos:** Em arquiteturas tradicionais com repositórios separados (um repo para o front, outro para o back), a alteração de um DTO ou enum no backend frequentemente quebra o frontend em produção. No monorepo com `@erp/shared-types`, qualquer alteração no contrato de dados é imediatamente verificada pelo TypeScript em ambos os lados em tempo de compilação.
* **Isolamento de Regras Puras (`@erp/business-core`):** O motor de corte e precificação não depende de banco de dados, nem de HTTP, nem de React. Ele é uma biblioteca agnóstica de dependências externas (apenas `decimal.js`). Isso permite que ele seja testado em frações de milissegundo e reutilizado no Backend, no Frontend Web e no futuro aplicativo Mobile sem duplicação de lógica.
* **Eficiência Extrema com pnpm:** Diferente do npm clássico que duplica gigabytes de `node_modules` em cada pasta, o pnpm utiliza um *content-addressable store* com links simbólicos (*hardlinks*). A economia de disco e o tempo de instalação de dependências diminuem em até 80%.
* **Orquestração com Turborepo:** Graças ao grafo direcionado acíclico (DAG) do Turborepo, comandos como `pnpm build` executam compilações paralelas respeitando rigorosamente a ordem de dependência dos pacotes, armazenando em cache os artefatos intocados.

---

## 3. O Motor de Negócio (`packages/business-core`)

### 3.1. Cálculo de Imposição e Corte de Folha (`sheet-cutting.ts`)
* **Entradas:** Dimensões da Folha Pai (\(L_{pai}, A_{pai}\)), Dimensões do Item (\(l_{item}, a_{item}\)), Sangria (\(s = 3\text{mm}\)), Margem de Pinça (\(p = 10\text{mm}\)), Tiragem (\(Q\)) e Margem de Perda (\(\text{waste} = 10\%\)).
* **Lógica Geométrica:**
  $$\text{Área Útil do Item: } W_{util} = l_{item} + 2s, \quad H_{util} = a_{item} + 2s$$
  $$\text{Área Útil da Folha: } L_{util} = L_{pai}, \quad A_{util} = A_{pai} - 2p$$
  O motor calcula duas permutações de corte:
  1. *Direta (Retrato):*
     $$N_{direto} = \left\lfloor \frac{L_{util}}{W_{util}} \right\rfloor \times \left\lfloor \frac{A_{util}}{H_{util}} \right\rfloor$$
  2. *Girada (Paisagem / 90°):*
     $$N_{girado} = \left\lfloor \frac{L_{util}}{H_{util}} \right\rfloor \times \left\lfloor \frac{A_{util}}{W_{util}} \right\rfloor$$
  O sistema seleciona $\max(N_{direto}, N_{girado})$, garantindo que o cliente receba o melhor aproveitamento de papel sem necessidade de cálculo manual na prancheta.
* **Folhas Necessárias:**
  $$Q_{efetiva} = \lceil Q \times (1 + \text{wasteRate}) \rceil$$
  $$\text{Folhas Pai} = \left\lceil \frac{Q_{efetiva}}{N_{aproveitamento}} \right\rceil$$

### 3.2. Formação de Preço com Precisão Arbitrária (`pricing-engine.ts`)
* **Por que `decimal.js`?** Em JavaScript, `0.1 + 0.2 === 0.30000000000000004` devido ao padrão binário IEEE 754. Em uma gráfica que imprime 100.000 folders com custos na 4ª casa decimal (ex: R\$ 0,0284 por folha), erros de arredondamento causam discrepâncias de centenas ou milhares de reais ao final do mês.
* **Fórmula do Markup Divisor:**
  Em gestão gráfica industrial, o markup não deve ser somado sobre o custo (\(Custo \times 1.35\)), pois isso distorce a margem sobre a receita bruta. Aplica-se o divisor financeiro:
  $$\text{Preço de Venda} = \frac{\text{Custo Total de Insumos}}{1 - \text{Markup}}$$
  Onde Custo Total = Custo do Papel + Custo de Máquina (Setup + Tiragem) + Acabamentos.

---

## 4. A Camada de Persistência (`packages/database`)

### Escolhas de Design:
* **PostgreSQL:** Banco de dados relacional com conformidade estrita com ACID, fundamental para integridade transacional financeira e movimentações de estoque.
* **Prisma ORM:** Abstração declarativa via `schema.prisma` com geração de cliente fortemente tipado, eliminando consultas SQL manuais propensas a falhas de sintaxe e injeção de SQL.
* **PostgreSQL Embarcado Local (`embedded-postgres`):** Para o ambiente de desenvolvimento local, o sistema utiliza uma instância binária nativa gerenciada pelo Node.js em `./data/embedded-pg`. Isso permite que qualquer desenvolvedor execute o sistema imediatamente sem necessitar instalar ou configurar serviços locais de terceiros ou Docker.
* **Controle de Acesso Baseado em Perfis (RBAC):** Modelado através do enum `Role` (`ADMIN`, `COMMERCIAL`, `FINANCIAL`, `OPERATOR`, `BOT_SERVICE`), com senhas criptografadas através de hashing unidirecional irreversível com **bcrypt** (salt rounds = 10).

---

## 5. A API Backend (`apps/api`)

### Estrutura Modular com NestJS:
1. **Módulos Independentes:** `AuthModule`, `UsersModule`, `PartiesModule`, `RawMaterialsModule`, `MachinesModule`, `QuotesModule`, `WorkOrdersModule`, `ProductionEventsModule`.
2. **Segurança e Autenticação:**
   - Tokens **JWT (JSON Web Tokens)** assinados com chave secreta e tempo de expiração curto (15m para access token, 7 dias para refresh token).
   - `@UseGuards(JwtAuthGuard, RolesGuard)` para proteção declarativa de rotas.
3. **Tratamento de Exceções Padronizado (RFC 7807):**
   - Implementação de `HttpExceptionFilter` global retornando `Problem Details` estruturado (`type`, `title`, `status`, `detail`, `instance`, `timestamp`), facilitando a depuração no cliente.
4. **Documentação Viva e Interativa (Swagger OpenAPI):**
   - Configurado em `/docs` com suporte a autenticação Bearer JWT persistente. Permite testar todos os 19 endpoints da API diretamente do navegador sem necessidade de softwares externos como Postman ou Insomnia.
5. **Gateway WebSocket (`events.gateway.ts`):**
   - Utilização de **Socket.io** com CORS aberto e suporte a WebSocket nativo. Emite eventos industriais em tempo real (`work_order_created`, `stage_status_updated`, `production_logged`) para atualizar instantaneamente os quadros Kanban dos operadores na fábrica.

---

## 6. O Frontend Web (`apps/web`)

### Arquitetura Orientada a Features (Feature-Driven Design)
Em vez de organizar o código apenas por tipo técnico (`components/`, `views/`, `containers/`), o frontend agrupa os arquivos pelas **capacidades de negócio** da aplicação:

* **`features/auth/`:** Tela de login com preenchimento rápido em 1 clique para demonstração ágil.
* **`features/dashboard/`:** Painel executivo com cards estatísticos de faturamento e visualização do funil das 6 etapas industriais.
* **`features/quotes/`:** Orçamentação com o componente exclusivo `SheetCuttingCanvas` (SVG interativo) que desenha visualmente a folha de papel, a pinça vermelha pontilhada, a sangria e a disposição dos itens.
* **`features/work-orders/`:** Chão de Fábrica Kanban dinâmico com 6 colunas, suporte completo a **Drag and Drop** (`@hello-pangea/dnd`), cartões de OS com códigos de barras, visualização em lista/tabela responsiva, modal de histórico completo e modal de apontamento do operador (com registro de operador, máquina, horários e perda de papel). Permite também a criação direta de novas ordens de serviço por operadores e administradores.
* **`features/users/` (Módulo de Funcionários / Operadores):** Gestão completa da equipe gráfica (Administradores, Comerciais, Financeiros e Operadores de Chão de Fábrica), com listagem com badges de papéis, criação e exclusão segura de colaboradores.
* **`features/raw-materials/`, `machines/`, `parties/`:** Módulos de gestão de insumos, parque de máquinas e clientes/fornecedores com ações completas de listagem, cadastro e **exclusão segura** com confirmação preventiva.

### Tecnologias do Frontend:
* **React 18 com Vite 6:** Tempo de inicialização instantâneo e Hot Module Replacement (HMR) sub-milissegundo.
* **Tailwind CSS com Dark Mode por Classe (`darkMode: 'class'`):** Design System flexível com controle determinístico de temas claro e escuro.
* **TanStack Query (React Query v5):** Gerenciamento inteligente de estado remoto do servidor (caching, invalidação declarativa de mutações e prevenção de requisições redundantes).
* **Zustand:** Gerenciamento de estado de autenticação e tema visual (`themeStore`) extremamente leve com sincronização automática com o `localStorage`.
* **@hello-pangea/dnd:** Biblioteca moderna de arrastar e soltar (Drag and Drop) acessível, fluida e compatível com React 18 e dispositivos móveis.

---

## 7. Arquitetura Mobile First e Ergonomia de Interface

A interface foi inteiramente adaptada seguindo os princípios rígidos de **Mobile First**, garantindo que tanto um operador utilizando um smartphone ou tablet de chão de fábrica quanto um diretor em um monitor 4K tenham uma experiência impecável sem quebras de layout:

1. **Navegação Adaptativa (Slide-Over Drawer):**
   - Em telas móveis (`< 768px`), a barra lateral (`Sidebar`) transforma-se em um *drawer* deslizante suave com efeito de sobreposição (*backdrop blur*), acessível através do botão hamburguer no cabeçalho.
   - Ao tocar em qualquer rota ou no botão de fechar (`X`), o menu se fecha automaticamente, liberando a área de trabalho para a produção.
2. **Quadro Kanban Touch com Scroll Snap:**
   - Em dispositivos móveis, colunas de Kanban rígidas costumam quebrar a largura da tela. A solução implementada utiliza contêiner com `snap-x snap-mandatory` e rolagem horizontal suave, onde cada coluna possui largura adaptada (`w-[280px] sm:w-[320px] shrink-0 snap-center`). O operador desliza o dedo entre as fases da produção como se estivesse em um aplicativo nativo.
3. **Ergonomia de Toque (Touch Targets):**
   - Todos os botões e áreas interativas respeitam a recomendação ergonômica mínima de 36px a 46px de altura (`min-h-[40px]`), prevenindo toques acidentais em telas sensíveis ao toque industriais.
4. **Tabelas com Envelopamento Responsivo:**
   - As tabelas de insumos, máquinas, clientes e colaboradores possuem contêineres com overflow horizontal controlado (`overflow-x-auto`) e quebra de palavras estratégica, permitindo leitura confortável sem desconfigurar a barra de rolagem da janela principal.

---

## 8. Sistema de Temas (Claro / Escuro) e Paleta Pastel Agradável

Para atender tanto a ambientes industriais escuros quanto escritórios com iluminação solar direta, o sistema conta com uma alternância dinâmica de tema:

### 8.1. Arquitetura de Tema Blindada e Inicialização Garantida
* **Padrão Escuro (Dark-first):** O sistema agora adota o tema escuro como padrão industrial absoluto. Usuários que acessam a aplicação pela primeira vez ou abrem em computadores corporativos recebem instantaneamente a experiência escura imersiva, sem que a preferência do sistema operacional force o tema claro indesejado.
* **Prevenção de FOUC (Flash of Unstyled Content):** Um script síncrono inline posicionado no `<head>` do `index.html` avalia a chave `erp_theme` no `localStorage` antes mesmo do primeiro frame ser renderizado pelo navegador, injetando a classe `.dark` no elemento `<html>` de forma atômica e eliminando flashes brancos na tela.
* **Controle Intuitivo de Dois Botões (Segmented Control):** A barra lateral esquerda (`Sidebar`) agora conta com um seletor visual explícito `[ ☀️ Claro | 🌙 Escuro ]`, que destaca com precisão qual modo está ativo no momento e permite troca direta com um único clique.
* **Acesso Universal no Cabeçalho Móvel e Desktop (`Header`):** Além do menu lateral, o cabeçalho superior inclui uma versão compacta do `ThemeToggle`, permitindo que operadores no celular ou no tablet alternem o tema a qualquer segundo sem precisar abrir gavetas laterais.

### 8.2. A Filosofia das Cores Pastel
Ao invés de cores primárias ultra-saturadas que causam cansaço visual (*visual fatigue*) em operadores que passam 8 horas olhando para telas de acompanhamento, o ERP adota uma paleta em tons pastel:
* **Verde Salvia & Menta Pastel (`pastel.sage`, `pastel.mint`):** Representam sucesso, etapas concluídas e botões de ação positiva de forma suave e relaxante.
* **Lavanda Pastel (`pastel.lavender`):** Utilizado para status intermediários, pré-impressão e destaques informativos.
* **Pêssego & Âmbar Suave (`pastel.peach`):** Indicam etapas em andamento e alertas preventivos sem gerar estresse visual.
* **Rosa Blush Pastel (`pastel.blush`):** Ações de perigo e exclusão com suavidade cromática, mas mantendo a clareza de atenção.
* **Gelo & Azul Suave (`pastel.ice`, `brand`):** Identidade visual principal para navegação e botões primários.

### 8.3. Acessibilidade e Contraste WCAG 2.1 AA
* No **Tema Claro**, os badges e botões combinam fundos pastel muito sutis (`bg-emerald-50`, `bg-amber-50`) com tipografia escura de alto contraste (`text-emerald-700`, `text-amber-700`), garantindo legibilidade absoluta.
* No **Tema Escuro**, as superfícies utilizam fundos neutros profundos (`bg-slate-900`, `bg-slate-850`) com acentos pastel translúcidos (`bg-emerald-500/15 text-emerald-400`), eliminando o brilho excessivo e poupando energia em telas OLED.

---

## 9. A Suíte de Testes Automatizados

O sistema conta com **100% de aprovação** nos testes automatizados em todos os pacotes:

1. **`@erp/business-core`:** Testes de estresse para os cálculos geométricos de corte, permutações de 90° e fórmulas de precificação com precisão arbitrária.
2. **`apps/api` (Jest):** 19 testes automatizados cobrindo serviços e controladores, além do script de integração `test-swagger.cjs` que valida o fluxo de ponta a ponta (login, clientes, insumos, máquinas, orçamentos, OS e eventos).
3. **`apps/web` (Vitest + Testing Library + JSDOM):** **94 testes** distribuídos em **16 arquivos** cobrindo:
   - Utilitários de formatação e parsing (`formatters.test.ts`): validação de BRL, moedas, inteiros, grandezas e máscaras de CPF/CNPJ e Telefone.
   - Componente monetário (`CurrencyInput.test.tsx`): formatação durante digitação, blur com 2 casas decimais e prefixo `R$`.
   - Componente de grandezas físicas (`NumberInput.test.tsx`): sufixos contextuais (`mm`, `un`, `%`), separadores de milhar e limites `min`/`max`.
   - Gerenciamento de Tema Zustand (`themeStore.test.ts`): alternância, persistência em localStorage e sincronização com a classe `.dark` do DOM.
   - Barra lateral responsiva (`Sidebar.test.tsx`): renderização de rotas, drawer móvel e seletor segmentado de tema.
   - Layout mestre móvel (`MainLayout.test.tsx`): abertura e fechamento do menu hamburguer em dispositivos móveis.
   - Utilitários e formatadores monetários BRL (`utils.test.ts`).
   - Estado de autenticação Zustand (login, logout, hidratação de sessão).
   - Componentes visuais do Design System (Button, Badge, Input, Select, Modal, StatCard).
   - Canvas SVG de imposição de folha pai (`SheetCuttingCanvas`).
   - Formulário de login e cartão Kanban de OS.

---

## 10. Infraestrutura de Tunelamento (Cloudflare Tunnel)

Para viabilizar a demonstração pública do sistema para testes de clientes ou parceiros externos sem a complexidade de alugar servidores de nuvem provisórios ou abrir portas inseguras no roteador:
* **Binário Nativo `cloudflared`:** Cria uma conexão de saída (*outbound*) criptografada para a rede edge global da Cloudflare.
* **Certificado SSL Automático (HTTPS):** Gera uma URL segura (ex: `https://...trycloudflare.com`) sem telas de aviso de segurança.
* **Proxy Unificado no Vite:** O túnel aponta para a porta `5173`. O Vite, por sua vez, atua como *Reverse Proxy*, redirecionando chamadas `/api` e `/docs` para a porta `3000` e canais `/socket.io` para o WebSocket Gateway, garantindo que qualquer usuário externo consiga interagir com o front, o back e os websockets em uma única URL.

---

## 11. Formatação Inteligente de Entradas Numéricas, Monetárias e Máscaras (BRL)

Para solucionar de forma definitiva o problema clássico de navegadores em que campos `<input type="number">` descartam a vírgula do teclado numérico brasileiro ABNT2 ou anulam o valor para `NaN`, foi introduzida uma camada completa de componentes de formulário especializados:

### 11.1. `CurrencyInput`: Valores Monetários em Reais (R$)
* **Prefixo Fixo e Elegante:** Exibe o prefixo `R$` estilizado à esquerda do campo.
* **Digitação Natural com Vírgula ou Ponto:** O usuário pode digitar `1250,5` ou `1250.5` sem que o navegador trave ou descarte a pontuação.
* **Separadores de Milhar em Tempo Real:** Conforme o usuário digita, números grandes são pontuados instantaneamente (ex: `1.500`).
* **Auto-correção de Casas Decimais no `onBlur`:** Ao sair do campo, o valor é automaticamente arredondado e formatado com duas casas decimais obrigatórias (ex: `1500` vira `1.500,00`; `0,8` vira `0,80`).
* **Contrato Limpo com o Estado:** Emite diretamente o tipo primitivo `number` via prop `onChangeValue(num)`, desacoplando a máscara visual do modelo de dados da API.

### 11.2. `NumberInput`: Quantidades e Grandezas Físicas Gráficas
* **Sufixos Físicos Especializados:** Exibe unidades contextuais à direita do campo:
  - `mm` para largura e altura de folhas e formatos abertos;
  - `g/m²` para gramaturas de papéis (ex: Couché 150g/m²);
  - `un` ou `fl` para tiragens e estoques de folhas;
  - `min` para tempos de setup e acerto de máquinas;
  - `fl/h` para velocidades nominais de equipamentos;
  - `%` para margem de lucro e markups comerciais;
  - `dias` para prazos de produção e expedição.
* **Filtragem de Caracteres Inválidos:** Impede a digitação inadvertida de notações científicas (`e`, `+`, `-`) comuns em inputs numéricos padrão.

### 11.3. `MaskedInput`: Identificadores Fiscais e Comunicação
* **CPF e CNPJ Dinâmicos (`maskType="cpfCnpj"`):** Adapta-se automaticamente ao comprimento digitado, exibindo `000.000.000-00` até 11 dígitos e convertendo suavemente para `00.000.000/0000-00` para pessoas jurídicas.
* **Telefones e WhatsApp (`maskType="phone"`):** Formata com precisão números fixos de 10 dígitos `(11) 3333-4444` e celulares de 11 dígitos com o 9º dígito móvel `(11) 98765-4321`.
* **Sanitização Transparente:** Mantém a interface legível e amigável, enquanto as requisições para a API enviam os dígitos limpos para indexação no banco de dados.

---

## 12. Universalização da Funcionalidade de Edição em Todas as Entidades (CRUD Completo)

Para proporcionar controle operacional irrestrito e eliminar a necessidade de re-cadastros manuais por pequenos erros de digitação, a funcionalidade de **Edição Completa** foi implementada e padronizada em todos os módulos e entidades do ERP Gráfica:

### 12.1. Insumos Gráficos & Papéis (`RawMaterialsPage.tsx`)
* **Ação de Edição:** Botão com ícone `Edit2` integrado à tabela ao lado da exclusão.
* **Modal Reativo:** Abre com os dados do insumo selecionado (nome, categoria, unidade de medida, dimensões da folha pai, gramatura, custo unitário e estoques).
* **Persistência Backend:** Rota `PUT /api/v1/raw-materials/:id` sincronizada via TanStack Query.

### 12.2. Parque Gráfico & Máquinas de Impressão (`MachinesPage.tsx`)
* **Ação de Edição:** Botão de edição presente no cabeçalho de cada card de máquina.
* **Modal Reativo:** Permite calibrar a taxa horária de máquina (`hourlyRate`), tempo de setup (`setupMinutes`) e velocidade nominal de tiragem (`maxSheetsHour`).
* **Persistência Backend:** Rota `PUT /api/v1/machines/:id`.

### 12.3. Clientes & Parceiros Comerciais (`PartiesPage.tsx`)
* **Ação de Edição:** Botão de edição na tabela de parceiros.
* **Modal Reativo:** Edição completa de razão social, nome fantasia, documento fiscal com máscara automática, canais de contato e endereço.
* **Persistência Backend:** Rota `PUT /api/v1/parties/:id`.

### 12.4. Gestão de Usuários & Acessos (`UsersPage.tsx`)
* **Ação de Edição:** Permite atualizar o nome, e-mail, perfil de permissão (`Role`) e alternar o status da conta entre Ativo e Inativo.
* **Gestão Segura de Credenciais:** Campo de senha opcional na edição; caso deixado em branco, a hash bcrypt existente é estritamente preservada no banco.
* **Persistência Backend:** Rota `PUT /api/v1/users/:id`.

### 12.5. Chão de Fábrica & Ordens de Serviço (`WorkOrdersPage.tsx`)
* **Novo Endpoint no Backend:** Implementação de `PUT /api/v1/work-orders/:id` no NestJS (`WorkOrdersController` e `WorkOrdersService`) via `UpdateWorkOrderDto`.
* **Consistência Transacional:** Atualiza atomicamente a `WorkOrder` (cliente, prioridade, data de entrega recalculada a partir do prazo, valor total) e propaga as alterações para o `Quote` e o `QuoteItem` correspondente (nome do produto, tiragem e recálculo proporcional do preço unitário).
* **Disparo em Tempo Real:** Emite o evento `work_order_status_changed` via WebSocket Gateway, atualizando instantaneamente os quadros Kanban dos operadores conectados.
* **Pontos de Acesso na Interface:**
  - Botão de edição na visão em Tabela de Ordens de Serviço.
  - Botão "Editar Ordem de Serviço" dentro do modal de detalhes (`OrderDetailsModal.tsx`).
  - Formulário unificado em `CreateOrderModal.tsx`, operando de forma transparente tanto em modo de criação (`POST`) quanto em modo de edição (`PUT`).

---

## 13. Arquitetura Unificada de Temas: Claro, Escuro e Sincronização Automática com o Dispositivo (Mobile First)

Atendendo à necessidade de permitir alternância manual do tema a qualquer momento pelo usuário no site, ao mesmo tempo em que o site acompanha organicamente a preferência do dispositivo móvel com as cores nativas do projeto (fundo grafite escuro `#090e18`, tons pastel suaves e ausência de distorção de cores pelos motores de auto-escurecimento mobile):

### 13.1. Declaração do Contrato de Renderização com o Navegador (`apps/web/index.html`)
* **Metatag `color-scheme`:** Inclusão de `<meta name="color-scheme" content="light dark" />`, instruindo os motores Blink/V8 (Android Chrome) e WebKit (iOS Safari) de que o site possui sua própria paleta de alta fidelidade tanto para o modo claro quanto para o modo escuro, desativando a heurística de "Force Dark Mode / Auto-darken web contents" dos navegadores móveis.
* **Metatag Dinâmica `theme-color`:** Controla a cor da barra de status e da interface do sistema operacional móvel (`#090e18` para escuro, `#f8fafc` para claro), atualizada em tempo real conforme o tema ativo.
* **Script de Inicialização Anti-FOUC (Flash of Unstyled Content):** Executado sincronicamente no `<head>` antes da renderização do DOM, lendo a chave `erp_theme` no `localStorage` ou delegando para a mídia nativa `(prefers-color-scheme: dark)` quando o modo for `system` ou na primeira visita do usuário.

### 13.2. Gerenciador Global Reativo de Tema (`apps/web/src/stores/themeStore.ts`)
* **Tipagem Estrita Tripartite:** `Theme = 'light' | 'dark' | 'system'`.
* **Estado Resolvido (`resolvedTheme: 'light' | 'dark'`):** Mantém a derivação exata entre o que o usuário selecionou e o que o motor de renderização CSS deve aplicar na raiz (`html.dark` ou `html.light`).
* **Listener Ativo de Mudança de SO:** Registra `window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ...)` para capturar transições automáticas do dispositivo (ex: modo noturno agendado por horário no celular), adaptando o layout dinamicamente em tempo de execução sem exigir recarregamento de página.

### 13.3. Seletor de Três Estados e Toggle Compacto (`ThemeToggle.tsx`)
* **Seletor Segmentado (Barra Lateral):** Três botões intuitivos (`[ ☀️ Claro | 🌙 Escuro | 💻 Auto ]`), com indicador contextual de status (`Escuro Ativo`, `Claro Ativo`, `Auto (Escuro)` ou `Auto (Claro)`).
* **Toggle Compacto (Cabeçalho Superior):** Botão circular de alternância rápida, permitindo transitar instantaneamente entre claro e escuro em qualquer dispositivo ou tamanho de tela.

---

## 14. Módulo de Despesas Operacionais (OPEX): Gestão Estrutural, Contas Recorrentes e Alicerce Financeiro

Atendendo à necessidade de gerenciar os gastos da gráfica que **não estão vinculados diretamente ao custo de matérias-primas e insumos de uma ordem de serviço específica**, foi concebido e implementado o módulo completo de **Despesas Operacionais (OPEX)**:

### 14.1. Separação Contábil Estratégica (CPV vs. OPEX)
* **Custos dos Produtos Vendidos (CPV / Custos Diretos):** Papéis, chapas CTP, tintas da tiragem e taxas de máquina orçados diretamente na OS via `@erp/business-core`.
* **Despesas Operacionais (OPEX):** Custos fixos e despesas variáveis essenciais para manter o parque fabril e os escritórios funcionando mês a mês:
  - **Aluguel & Estrutura:** Galpão industrial, IPTU, condomínio.
  - **Utilidades & Energia:** Energia elétrica predial, água, internet dedicada (essencial para envio/recebimento de arquivos pesados de pré-impressão), telefonia.
  - **Softwares & Licenças:** Assinaturas Adobe Creative Cloud (InDesign, Illustrator, Photoshop), Softwares RIP (Caldera/Onyx), ERP, Antivírus, Hospedagem.
  - **Administrativo & Contábil:** Honorários do escritório de contabilidade, assessoria jurídica, materiais de escritório, copa e limpeza.
  - **Comercial & Marketing:** Anúncios Google/Meta, mostruários e catálogos para clientes.
  - **Manutenção Predial:** Compressores de ar, instalações elétricas gerais.
  - **Tributos, Taxas & Bancos:** Tarifas bancárias, taxas de boletos, licenças de bombeiros (AVCB) e ambientais.

### 14.2. Contas Recorrentes com Limite de Renovação e Credor Avulso
* **Recorrência Inteligente:** Despesas fixas (Aluguel, Softwares, Internet) podem ser marcadas como `isRecurring = true`, com periodicidade mensal/anual e campo específico para **Data Limite da Recorrência / Renovação** (`recurrenceEndDate`), alertando sobre o fim de contratos de locação ou ciclos de licenças.
* **Duplicação com 1 Clique (`duplicateNextMonth`):** Botão dedicado na tabela e nos cards que projeta e replica a despesa recorrente para o mês seguinte com vencimento ajustado, respeitando a data de renovação.
* **Credor Avulso Flexível (`beneficiaryName`):** Permite vincular um fornecedor cadastrado na base de parceiros (`Party`) ou simplesmente preencher o nome de um credor avulso (ex: CEMIG, Imobiliária Souza), agilizando lançamentos de contas de consumo e prestadores esporádicos sem burocracia cadastral.

### 14.3. Backend NestJS e Persistência PostgreSQL (`packages/database` e `apps/api`)
* **Modelo Prisma `OperatingExpense`:** Armazena descrição, categoria, tipo (Fixa vs. Variável), valor decimal, vencimento, data de competência, status (`PENDING`, `PAID`, `OVERDUE`, `CANCELLED`), método de pagamento, linha digitável/código PIX e número do documento.
* **Agrupamento e Métricas Consolidadas (`GET /operating-expenses/summary`):** Retorna o total previsto do mês, total quitado, total pendente, total vencido, proporção entre despesas fixas e variáveis e o rateio percentual por categoria em tempo $\mathcal{O}(N)$.
* **Liquidação Rápida (`PATCH /operating-expenses/:id/pay`):** Registra o pagamento com data efetiva, valor efetivo e forma de pagamento.

### 14.4. Interface Web Reativa e Mobile-First (`apps/web`)
* **Seletor de Competência:** Filtro dinâmico por ano-mês (`YYYY-MM`) com atualização instantânea de todos os indicadores.
* **Grid de 4 KPIs:** Total do Mês, Despesas Pagas (% liquidada), Contas a Vencer e Alertas de Contas Vencidas.
* **Barra Multi-Segmentada de Distribuição:** Representação gráfica visual proporcional do destino dos recursos financeiros no mês.
* **Tabela e Cards Responsivos:** Suporte total a desktop e smartphone, com botões para Liquidação Rápida (`CheckCircle2`), Replicar Recorrência (`CalendarPlus`), Edição (`Edit2`) e Remoção (`Trash2`).
* **Rota Protegida `/expenses`:** Integrada ao menu lateral e acessível aos perfis `ADMIN`, `FINANCIAL` e `COMMERCIAL`.

---

## 15. Fase 1: Inteligência Financeira e Chão de Fábrica de Alta Precisão

Consolidando os alicerces operacionais da gráfica, a **Fase 1 do Roadmap** entregou uma suíte integrada que conecta o atendimento de balcão, a ordem de serviço fabril e a contabilidade gerencial em tempo real:

### 15.1. Módulo de Contas a Receber (Receivables)
* **Parcelamento Automático da OS:**
  - **Sinal 50% + 50% na Retirada:** Padrão industrial do setor gráfico para garantir a compra da matéria-prima (papel/chapas) antes do início da tiragem.
  - **À Vista Antecipado (100%):** Pagamento integral antecipado com conciliação imediata.
  - **Parcelado Customizado (ex: 3x, 4x, 6x):** Geração com datas mensais consecutivas e distribuição precisa de resíduos de centavos.
* **Baixa Rápida de Recebimento (`PayReceivableModal.tsx`):**
  - Modal para registro de pagamento parcial ou total informando valor recebido, data de efetivação, meio de pagamento (PIX, Cartão, Boleto, Dinheiro) e comprovante/observações.
  - Sincronização automática do status financeiro da Ordem de Serviço (`PAID`, `PARTIALLY_PAID`, `PENDING`).
* **Painel Executivo e Controle de Inadimplência (`ReceivablesPage.tsx`):**
  - Indicadores em tempo real: Previsão de Receita Mensal, Total Efetivamente Liquidado, A Receber no Prazo e Taxa de Inadimplência com destaque visual para recebíveis vencidos (`OVERDUE`).
  - Filtros instantâneos por texto (cliente, OS, documento), status de liquidação e mês de competência.
  - Tabela para monitores de escritório e cards ergonômicos para visualização em smartphones.

### 15.2. DRE Gerencial em Tempo Real (`DrePage.tsx` e `/financial/dre`)
* **Estrutura Contábil Padronizada:**
  1. **1.0 RECEITA OPERACIONAL BRUTA:** Faturamento total consolidado das Ordens de Serviço faturadas no período.
  2. **1.1 (-) Deduções e Impostos sobre Vendas:** Aplicação paramétrica de alíquota tributária (padrão Simples Nacional 6,0%).
  3. **2.0 (=) RECEITA OPERACIONAL LÍQUIDA:** Base líquida de geração de caixa.
  4. **3.0 (-) CUSTO DOS PRODUTOS VENDIDOS (CPV):** Apuração detalhada de matérias-primas e insumos fabris:
     - Papéis e substratos planos.
     - Hora-máquina de impressão, tintas e setups.
     - Acabamentos gráficos (plastificação, verniz, dobra, vinco, refile).
  5. **4.0 (=) LUCRO BRUTO (MARGEM DE CONTRIBUIÇÃO):** Diferença entre a receita líquida e os custos diretos, revelando a rentabilidade pura dos serviços.
  6. **5.0 (-) DESPESAS OPERACIONAIS (OPEX):** Confronto automático com os gastos fixos e variáveis lançados no módulo de Despesas Operacionais (Aluguel, Energia, Adobe/RIP, Administrativo, Comercial).
  7. **6.0 (=) RESULTADO OPERACIONAL (EBITDA):** Geração operacional de lucro antes de juros e amortizações.
* **Indicadores Estratégicos:**
  - **Margem de Contribuição Percentual:** Mede quanto cada real faturado contribui para pagar a estrutura fixa.
  - **Margem EBITDA Operacional:** Percentual de lucro retido pela operação fabril.
  - **Ponto de Equilíbrio (Break-Even):** Montante mínimo em reais que a gráfica precisa faturar no mês para cobrir exatamente a soma de seus custos diretos e despesas operacionais.
* **Interface Interativa:** Tabela sanfonada expansível para auditoria analítica dos componentes de CPV e OPEX, e barra multi-segmentada de distribuição de receitas.

### 15.3. Ficha Técnica de Produção (Job Ticket) e Código de Barras Vetorial
* **Emissão em Dois Formatos Oficiais (`JobTicketModal.tsx`):**
  - **📄 Formato A4 Industrial:** Ficha completa de produção para pranchetas de máquinas, contendo dados do cliente, tiragem, formato aberto/fechado, tipo de papel e gramatura, cores (ex: 4x4, 4x0), previsão de entrega, notas de acabamento e checklist com vistos dos operadores por etapa fabril (CTP, Impressão, Dobra, Controle de Qualidade).
  - **🧾 Formato Térmica 80mm:** Layout condensado de alta densidade para impressoras de recibo/etiquetas térmicas de balcão e caixas de expedição.
* **Motor Nativo SVG Code-128 (`Code128Svg`):**
  - Desenho vetorial matemático gerado internamente sem nenhuma dependência de bibliotecas pesadas de terceiros ou fontes TTF instaladas no SO do cliente.
  - Cálculo de dígito verificador ponderado módulo 103 integrado, legível por qualquer leitor óptico USB ou câmera de smartphone.
* **Acionamento Intuitivo:** Botão de ação rápida na tabela principal de Ordens de Serviço (`WorkOrdersPage.tsx`) e no modal de detalhes da OS (`OrderDetailsModal.tsx`).

### 15.4. Catálogo de Modelos Rápidos de Balcão (1-Clique)
* **Barra de Atalhos de Produtos Frequentes (`NewQuotePage.tsx`):**
  - Cartões de Visita (90x50mm, Couchê 300g, 4x4).
  - Panfletos Promocionais (100x140mm, Couchê 115g, 4x0).
  - Folders 2 Dobras (210x297mm, Couchê 150g, 4x4).
  - Banners Lona com Ilhós (600x900mm).
  - Adesivos em Vinil com Meio-Corte (50x50mm).
  - Pastas com Bolsa (220x310mm, Triplex 300g).
* **Seleção Instantânea de Tiragens:**
  - Pílulas de quantidade (`500`, `1.000`, `2.500`, `5.000` unidades) que pré-preenchem as especificações geométricas e acionam o motor de cálculo do `@erp/business-core` em milissegundos.
* **Sementeira Automatizada no Banco de Dados (`ProductTemplatesService`):**
  - Verificação de integridade no startup: caso a base de modelos esteja vazia, os 6 modelos padrão são automaticamente vinculados aos materiais e máquinas existentes.

### 15.5. Garantia de Qualidade e Cobertura de Testes
* **100% de Aprovação Automatizada (170 Testes em Todo o Monorepo):**
  - **Frontend (`@erp/web`):** 24 arquivos de teste e 132 casos de teste aprovados com 100% de sucesso (`vitest run`).
  - **Backend (`@erp/api`):** 6 arquivos de teste e 30 casos de teste aprovados com 100% de sucesso (`vitest run`).
  - **Motor de Negócio (`@erp/business-core`):** 2 arquivos de teste e 8 casos de teste aprovados com 100% de sucesso (`vitest run`).
  - **Build de Produção:** Compilação TypeScript (`tsc -b` e `tsc --noEmit`) e empacotamento Vite sem nenhum erro de tipagem.

---

## 16. Suporte a PWA: Instalação como Aplicativo Nativo no Balcão e Chão de Fábrica

Com o objetivo de viabilizar uma operação veloz e independente de barras de navegação de navegadores no balcão de vendas e nos postos de trabalho fabris (impressoras, guilhotinas e expedição), o sistema foi transformado em um **Progressive Web App (PWA)** de padrão industrial:

### 16.1. Web App Manifest Oficial (`manifest.webmanifest` e `manifest.json`)
* **Experiência Imersiva em Modo `standalone`:** Quando instalado, o ERP roda em janela própria com remoção de barras de endereço e menus de browser, simulando um aplicativo nativo desktop ou mobile com 100% do espaço de tela disponível para o Kanban fabril e a calculadora de orçamentos.
* **Atalhos Rápidos de Aplicativo (*App Shortcuts*):** Ao pressionar e segurar o ícone do ERP no celular ou clicar com botão direito no ícone da barra de tarefas do Windows, o sistema oferece acesso direto a:
  - Novo Orçamento (`/quotes/new`);
  - Ordens de Serviço (`/work-orders`);
  - Contas a Receber (`/receivables`);
  - Despesas Operacionais (`/expenses`);
  - DRE Gerencial (`/financial/dre`).
* **Identidade Visual e Ícones Vetoriais:** Ícone oficial de impressora com gradiente esmeralda/teal e registro CMYK (`/pwa-icon.svg`), compatível com máscaras circulares do Android (`purpose: maskable`) e padrão do iOS (`/apple-touch-icon.svg`).

### 16.2. Service Worker Inteligente com Arquitetura Híbrida de Cache (`sw.js`)
* **Pré-cacheamento do App Shell:** Na instalação, o Service Worker efetua cache automático do HTML raiz, manifesto e ícones fundamentais, permitindo inicialização imediata.
* **Estratégia Stale-While-Revalidate (Ativos Estáticos):** Para scripts JS, folhas de estilo CSS, fontes web e imagens, o Service Worker entrega instantaneamente a versão em cache e consulta a rede em background para atualizar ativos, eliminando lentidões causadas por oscilações no sinal de Wi-Fi do galpão industrial.
* **Estratégia Network-First (API e Dados em Tempo Real):** Todas as chamadas para a API REST (`/api/v1/*`) e conexões WebSocket são direcionadas prioritariamente à rede para garantir sincronismo bancário, de estoques e de OSs. Em caso de falha de conexão, uma resposta JSON amigável com status de offline é retornada.
* **Ciclo de Vida Limpo (`activate`):** Limpeza automatizada de versões defasadas de cache e controle imediato via `clients.claim()`.

### 16.3. Hook Reativo de Instalação e Interface do Usuário (`usePWAInstall` e `PwaInstallButton`)
* **Hook Especializado (`usePWAInstall.ts`):**
  - Monitora o evento nativo `beforeinstallprompt` do navegador.
  - Detecta se o aplicativo já está sendo executado em modo standalone via CSS media query `(display-mode: standalone)` ou propriedade `window.navigator.standalone`.
  - Dispara a janela nativa de instalação do Chrome/Edge através de `promptInstall()`.
* **Botão Integrado na Barra Lateral (`PwaInstallButton.tsx`):**
  - Posicionado estrategicamente no rodapé do menu lateral.
  - Altera de forma dinâmica entre **"Instalar App"** (com badge "PWA") e **"App Instalado"** (com ícone de validação verde).
  - Em dispositivos Apple (iPhone e iPad), abre automaticamente um modal com instruções visuais guiadas para instalação via botão *Compartilhar* > *"Adicionar à Tela de Início"*.

---

## 17. Otimização de Design Mobile, Tipografia e Usabilidade Touch

Com o uso intensivo do sistema em smartphones e tablets no chão de fábrica e no atendimento de balcão, foi realizada uma revisão profunda de design para telas compactas (360px a 412px), eliminando gargalos de usabilidade, textos espremidos e atritos no fluxo produtivo:

### 17.1. Reformulação do Kanban de Produção (PCP Mobile)
* **Barra Deslizante de Etapas (*Stage Carousel Pills*):** No topo do Kanban em telas mobile, o operador conta com uma barra horizontal deslizante com pílulas de cada etapa fabril (`Liberação`, `CTP / Pré`, `Impressão`, `Acabamento`, `Qualidade`, `Retirada`, `Entregue`), com contadores de OS em tempo real. Ao tocar em qualquer pílula, a tela realiza uma **rolagem suave automática (*smooth scroll*)** diretamente para a coluna correspondente (`kanban-col-{id}`).
* **Largura Adaptativa com *CSS Scroll Snap*:** As colunas agora utilizam `w-[86vw] sm:w-[320px] max-w-[350px] snap-start`. Isso faz com que cada etapa ocupe a visão principal do operador no smartphone, deixando uma margem de ~14% da coluna seguinte visível para orientação espacial e navegação intuitiva.
* **Ergonomia no Card e Toque Seguro (*Fitts' Law*):**
  - Botão de avançar etapa ampliado para altura mínima de **34px**, padding generoso e classe `touch-manipulation`, facilitando o acionamento veloz com o polegar.
  - Truncamento inteligente de código de barras e números de OS, evitando quebras visuais desagradáveis.

### 17.2. Tipografia e Proximidade em Cards de Indicadores (`StatCard.tsx`)
* **Eliminação de Colisão com Ícones:** O container de texto foi blindado com `min-w-0 flex-1`, e o container do ícone recebeu `shrink-0`. Isso garante que o ícone nunca seja empurrado para fora da tela ou espremido.
* **Números Tabulares e Responsividade:** Os valores monetários agora utilizam `tabular-nums truncate` e dimensionamento responsivo (`text-xl sm:text-2xl`), prevenindo que o símbolo monetário (`R$`) quebre isolado em uma linha e o número em outra.

### 17.3. DRE Gerencial com Estrutura Empilhada Adaptativa (`DrePage.tsx`)
* **Layout Adaptativo de Duas Linhas:** Em telas móveis (`< sm`), cada linha da DRE é renderizada em dois níveis confortáveis:
  - **Nível 1 (100% da largura):** Ícone expansor, código contábil e nome completo da seção (sem corte ou quebras de 5 linhas).
  - **Nível 2:** Linha inferior com a porcentagem da receita à esquerda e o valor monetário formatado à direita.
* **Cards de Distribuição de Receitas:** A legenda horizontal da barra de destinação foi convertida em um grid de cards com bordas suaves, exibindo CPV, OPEX e EBITDA de forma legível em qualquer dispositivo.

### 17.4. Calculadora Técnica de Orçamentos Responsiva (`NewQuotePage.tsx`)
* **Grade Flexível:** Campos de Tiragem, Largura Aberta, Altura Aberta e Markup Comercial foram ajustados de `grid-cols-3` rígido para `grid-cols-1 sm:grid-cols-3 gap-3`, permitindo que operadores digitem medidas sem cortes em telas menores que 640px.
* **Pílulas de Tiragens Rápidas:** O container de opções rápidas (500 un, 1.000 un, 2.500 un, etc.) agora possui `flex-wrap gap-1.5`, quebrando linhas de maneira orgânica sem vazar do container.

### 17.5. Modais e Barra Superior Touch-Friendly
* **Modais com Ações Empilhadas:** O rodapé de modais críticos (`OrderDetailsModal` e `JobTicketModal`) agora adota `flex-col-reverse sm:flex-row`, permitindo que botões como "Imprimir Ficha Técnica", "Editar" e "Fechar" tenham alvos de toque com 100% da largura útil em celulares.
* **Header Compacto:** O status de conexão WebSocket foi sintetizado para um badge inteligente com ícone e texto "Online/Offline" no mobile, preservando o espaço para o botão de saída e troca de tema.

---

## 18. Unificação do Fluxo Comercial e Produtivo: Geração Automática de Ordem de Serviço (OS)

Antes desta atualização arquitetural, o sistema apresentava uma fragmentação no fluxo de trabalho:
- Uma tela de cotação paramétrica na aba de Orçamentos;
- Uma janela simplificada na aba de Chão de Fábrica para cadastrar ordens de serviço avulsas.

Esse modelo permitia que uma OS fosse gerada sem ficha técnica de corte e sem discriminação de matérias-primas e margem de lucro. A nova arquitetura unificou o ciclo de vida do pedido:

### 18.1. Transação Atômica ACID no Backend (`POST /quotes`)
Ao cadastrar um orçamento com aproveitamento geométrico e precificação comercial via `POST /quotes`, o backend NestJS (`QuotesService`) agora executa uma transação atômica gerenciada pelo Prisma:
1. Define o status do orçamento como `APPROVED` (com suporte opcional a rascunho com `autoApprove: false`).
2. Gera o código sequencial único do orçamento (`quote.code`).
3. Formata a numeração oficial da Ordem de Serviço no padrão industrial: `OS-YYYY-XXXXX`.
4. Gera o código de barras padronizado Code-128: `OSYYYYXXXXX`.
5. Cria a `WorkOrder` com status `PENDING` ("Liberação"), prazo de entrega, prioridade normal e vínculo relacional direto com o cliente e o orçamento pai.
6. Instancia automaticamente as **5 etapas fabris padrão** (`WorkOrderStage`):
   - **Etapa 1:** Pré-impressão (CTP / Matrizes)
   - **Etapa 2:** Impressão (Offset / Digital)
   - **Etapa 3:** Acabamento (Refile / Vinco / Dobra)
   - **Etapa 4:** Controle de Qualidade
   - **Etapa 5:** Expedição / Retirada
7. Dispara o evento WebSocket `emitWorkOrderStatusChanged`, refletindo a nova OS instantaneamente nos quadros Kanban de todos os operadores da gráfica em tempo real.

### 18.2. Redirecionamento Determinístico no Frontend
- **Tela de Novo Orçamento (`NewQuotePage.tsx`):** Ao salvar um orçamento aprovado, o sistema invalida as consultas do React Query (`work-orders` e `quotes-list`) e redireciona automaticamente o usuário para a tela do Chão de Fábrica (`/work-orders`), eliminando cliques e atritos operacionais.
- **Tela do Chão de Fábrica (`WorkOrdersPage.tsx`):** O botão principal do cabeçalho agora é unificado sob o título **"Novo Pedido / Orçamento"** (ou **"Novo Orçamento"** no mobile) e redireciona diretamente para `/quotes/new` via `useNavigate`. A janela simplificada anterior foi extirpada do fluxo de criação e mantida estritamente para a edição de ordens já existentes (`onEditOrder`).
- **Lista de Orçamentos (`QuotesListPage.tsx`):** Todos os orçamentos que possuem Ordem de Serviço vinculada exibem o botão **"Ver no PCP"** com ícone Kanban, conectando o departamento comercial à produção fabril em 1 clique.

---

## 19. Experiência de Usuário In-App: Eliminação de Alertas Nativos do Navegador e Modais Customizados

Para garantir uma interface profissional e desbloquear o laço de eventos (*Event Loop*) do JavaScript no navegador dos operadores, foram removidos todos os diálogos síncronos nativos (`window.alert`, `window.confirm`):

### 19.1. Modal Personalizado de Confirmação de Baixa de Insumos (`WorkOrdersPage.tsx`)
Quando uma Ordem de Serviço é avançada para a etapa de **IMPRESSÃO** (seja pelo botão de avanço rápido no cartão ou via *Drag and Drop* entre colunas do Kanban), o estoque de matéria-prima (folhas de papel calculadas na imposição geométrica) deve ser debitado.
- Em substituição ao popup cinza e invasivo do navegador, o sistema abre um `<Modal>` in-app com identidade visual temática:
  - Cabeçalho semântico com ícones `Layers` e `Printer` e badge âmbar de aviso operacional.
  - Cartão detalhado com o número da OS, nome do cliente e valor total formatado em moeda corrente (`R$`).
  - Alerta explicativo claro: *"Avançar esta OS para Impressão consumirá automaticamente as folhas de matéria-prima calculadas no orçamento deste pedido do estoque."*
  - Botões ergonômicos e acessíveis: **"Cancelar"** e **"Confirmar e Baixar Insumos"**.

### 19.2. Sistema de Notificações Flutuantes (Toasts Reativos)
- Mensagens de sucesso ao mover ordens e eventuais alertas de erro de rede ou permissão agora utilizam um container de notificação flutuante com suporte a animação (`feedbackNotification`), ícones semânticos da Lucide (`CheckCircle2` para êxito e `AlertTriangle` para falhas) e botão de dispensa manual, sem interromper ou bloquear a digitação do operador.

### 19.3. Coexistência de Drag & Drop e Rolagem Suave no Kanban Touch
- A integração entre o motor de física `@hello-pangea/dnd` e a barra de rolagem suave com *CSS Scroll Snap* foi calibrada para prevenir conflitos de eventos de toque:
  - O operador pode deslizar horizontalmente o carrossel de etapas do Kanban no celular sem disparar arrastos acidentais.
  - Ao pressionar e arrastar especificamente o cartão de OS, o manipulador de arrasto (`dragHandleProps`) assume a translação vetorial com feedback visual de elevação (sombra e contorno colorido).

### 19.4. Supressão de Alertas Nativos no Apontamento de Produção (`StageActionModal.tsx`)
- Ao registrar início, pausa ou conclusão de etapa fabril, o sistema não dispara mais `window.alert` de confirmação.
- O fechamento da janela é instantâneo e a lista é revalidada via WebSocket e React Query.
- Se houver qualquer falha ou validação incorreta, o erro é exibido dentro do próprio modal em um badge de erro sem travar a thread de execução do navegador.

### 19.5. Divulgação Progressiva das Informações de Pagamento na OS (`OrderDetailsModal.tsx`)
- No modal de detalhes da Ordem de Serviço acionado pelo Kanban:
  - As **Etapas Industriais do Chão de Fábrica** agora são apresentadas com destaque imediatamente após o cabeçalho técnico e cliente.
  - A seção de **Contas a Receber e Parcelamento** foi deslocada para o **final do popup** e inicia **recolhida/escondida por padrão**.
  - O operador ou gestor pode revelar o cronograma financeiro completo e os botões de recebimento ("Receber" / "Recibo") clicando no botão/seta de alternância (`ChevronDown` / `ChevronUp`), preservando o foco operacional na produção.

---

## 20. Infraestrutura de Execução e Acesso Remoto Seguro (Cloudflare Tunnel)

O ecossistema está configurado para operar de forma 100% autônoma em qualquer máquina Windows/Linux de desenvolvimento ou servidor local de fábrica:

1. **PostgreSQL Embarcado Local:**
   - Instância nativa gerenciada via `embedded-postgres` operando na porta padrão `5432` com persistência em `./data/embedded-pg`.
2. **API NestJS em Background:**
   - Executada em `node.exe apps/api/dist/main.js` na porta `3000`, servindo a API REST, documentação Swagger interativa em `/docs` e o Gateway WebSocket em `/socket.io`.
3. **Frontend Vite em Background:**
   - Servido via `pnpm --filter web dev --host` na porta `5173`, com proxy reverso transparente para a API e WebSockets.
4. **Túnel Seguro de Borda Cloudflare (`cloudflared`):**
   - Túnel criptografado persistente baseado em protocolo QUIC (UDP) conectando a borda global da Cloudflare ao servidor Vite em `localhost:5173`.
   - Permite acesso remoto instantâneo via HTTPS sem necessidade de IP público estático, abertura de portas no roteador de fábrica ou configuração de NAT/Dynamic DNS.

---

## 21. Catálogo e Interface de Gestão de Orçamentos Rápidos Pré-definidos (Gabaritos Paramétricos de Balcão)

Para acelerar drasticamente o atendimento no balcão de vendas e no comercial da gráfica rápida, foi implementada uma interface completa de gerenciamento e aplicação de **Orçamentos Rápidos Pré-definidos**:

1. **Acesso Unificado e Ergonômico:**
   - **Na Listagem de Orçamentos (`QuotesListPage.tsx`):** Novo botão de destaque *"Modelos Rápidos Pré-definidos"* com ícone `Bookmark` no cabeçalho da página, permitindo consultar, cadastrar, editar e excluir gabaritos padrão a qualquer momento.
   - **Na Calculadora Técnica (`NewQuotePage.tsx`):** Seção aprimorada de *"Modelos Rápidos de Balcão (1-Clique)"* com botão *"Gerenciar Modelos"*, atalhos instantâneos e suporte a carregamento automático via parâmetro de busca na URL (`?templateId=xyz`).

2. **Interface Modal de Gestão Completa (`QuickQuotesTemplatesModal.tsx`):**
   - **Modo Lista:**
     - Barra de pesquisa em tempo real por nome do produto, formato ou matéria-prima vinculada.
     - Filtros rápidos por pílulas de categorias (*"Todos"*, *"Papelaria"*, *"Promocional"*, *"Comunicação Visual"*, *"Editorial"*, *"Embalagens"*, *"Outros"*).
     - Cards detalhados com badges técnicos: dimensões milimétricas, padrão de cores (frente/verso), insumo padrão, máquina, markup (%) e tiragens sugeridas.
     - Ações de *"Usar Modelo"*, *"Editar"* e *"Excluir"*.
   - **Modo Formulário (Criação e Edição):**
     - Atalhos de dimensões padronizadas em 1-clique: Cartão (`9x5 cm`), Panfleto (`10x14 cm`), `A5`, `A4`, `A3`, Banner (`60x90 cm`).
     - Seleção de insumo padrão e máquina conectada aos cadastros fabris.
     - Matriz de acabamentos integrados (refile, vinco/dobra, laminação fosca/brilho, verniz UV, corte especial, ilhós).
     - Configuração de markup padrão e tiragens sugeridas separadas por vírgula.
   - **Experiência Sem Alertas Nativos:**
     - Exclusão com modal in-app de confirmação personalizada (`Confirmar Exclusão`).
     - Mensagens de feedback não-intrusivas (sucesso e erro) integradas à interface.

3. **Validação de Testes Automatizados:**
   - Suíte unitária e de integração em `QuickQuotesTemplatesModal.test.tsx` e `QuotesListPage.test.tsx` cobrindo listagem, filtragem, seleção de gabarito, atalhos de dimensão e exclusão in-app.
   - 100% dos testes aprovados e compilação de produção validada.

---

## 22. Identificação Dupla de Produção no Chão de Fábrica: Número da OS e Nome do Produto

Para assegurar identificação visual imediata no chão de fábrica e evitar erros de manuseio de pilhas de papel, matrizes CTP e ordens de acabamento, o sistema agora exibe **concomitantemente o Número da OS e o Nome do Produto/Serviço** em todas as interfaces operacionais:

1. **Cartões do Quadro Kanban (`KanbanCard.tsx`):**
   - O cartão agora apresenta com destaque tipográfico o número da OS (ex.: `OS-2026-0042`) no cabeçalho com o badge de prioridade, e logo abaixo o **Nome do Produto** (ex.: *"Cartão de Visita Couché 300g 4x4"* ou *"Folder Institucional A4 2 Dobras"*).
   - O título conta com clamp de 2 linhas (`line-clamp-2`), tooltip nativo com o nome completo e transição de cor em hover para máxima legibilidade.

2. **Modal de Detalhes da Ordem de Serviço (`OrderDetailsModal.tsx`):**
   - **Título do Modal:** Atualizado para o formato `Detalhes da Ordem de Serviço: {orderNumber} - {productName}`.
   - **Card Técnico de Especificação Gráfica:** Novo bloco de destaque no topo do modal detalhando:
     - Nome do produto ou serviço gráfico;
     - Badge de tiragem produzida (`{runQuantity} un`);
     - Formato do trabalho (Largura $\times$ Altura em mm);
     - Substrato e gramatura (matéria-prima vinculada);
     - Configuração de cores (4x4, 4x0, etc.);
     - Observações técnicas comerciais para a equipe de produção.

3. **Visão em Tabela & Pesquisa em Tempo Real (`WorkOrdersPage.tsx`):**
   - Adicionada a coluna dedicada *"Produto / Descrição"* na tabela de Ordens de Serviço.
   - A barra de busca no topo do PCP agora filtra instantaneamente tanto pelo número da OS, cliente, código de barras quanto pelo **nome do produto**.

4. **Camada de Dados & Backend NestJS (`WorkOrdersService`):**
   - Consultas `findAll` e `findOne` atualizadas no Prisma para carregar o orçamento e seus itens (`quote.items.rawMaterial`), expondo `productName` de nível superior no DTO de retorno.
   - Busca no banco com filtro em profundidade (`quote.items.some.productName: { contains: search, mode: 'insensitive' }`).
   - Helper universal `getWorkOrderProductName` no frontend para fallback seguro e consistente.

5. **Garantia de Qualidade e Testes Automatizados:**
   - Testes unitários dedicados em `KanbanCard.test.tsx` e `OrderDetailsModal.test.tsx` validando a renderização conjunta do número da OS e nome do produto.
   - Teste de integração backend em `work-orders.spec.ts` validando a injeção e mapeamento do `productName`.
   - 100% dos testes aprovados e compilação de produção TypeScript/Vite verificada.

6. **Refinamento Ergonômico dos Botões de Ação na Tabela:**
   - Substituição dos botões de ação com rótulos de texto extensos (*"Ver Detalhes"*, *"Ficha"*, *"Editar"*) que causavam quebra de linha por **botões compactos de ícones** (`32x32px` com cantos arredondados, bordas sutis e cores semânticas de hover).
   - Alinhamento horizontal em linha única (`inline-flex items-center justify-end gap-1.5` com `whitespace-nowrap`), garantindo layout limpo, simétrico e profissional com acessibilidade por `title` e `aria-label`.

---

## 23. Envio e Compartilhamento de Comprovante de Pagamento como Imagem no WhatsApp

Para eliminar o atrito manual de cópia e colagem de texto cru e oferecer uma experiência comercial sofisticada ao cliente final da gráfica, foi implementado o fluxo de **geração e envio direto do comprovante como imagem PNG de alta definição no WhatsApp**:

1. **Botão de Ação Direta no Modal de Recibo (`PaymentReceiptModal.tsx`):**
   - Substituído o antigo botão simples de cópia de texto pelo botão de destaque **"Enviar Imagem no WhatsApp"** estilizado na cor oficial do WhatsApp (`#25D366`), com ícone `MessageSquare`.
   - Ao ser acionado, o sistema rasteriza o cartão do recibo em tempo real em uma imagem PNG em escala retina ($2\times$ pixel ratio) com selo de quitação, número de recibo `REC-XXXXXXXX`, cliente, CPF/CNPJ, OS vinculada, parcela, forma de pagamento e data.

2. **Fluxo de Compartilhamento Nativo com Seleção de Contato (Mobile / PWA / Android / iOS):**
   - Utilização da **Web Share API nível 2** (`navigator.share` com suporte a `files: [File]`).
   - O aplicativo redireciona o usuário diretamente para o seletor nativo de contatos do WhatsApp, onde o operador escolhe qualquer cliente de sua agenda e a imagem do comprovante é aberta já anexada à mensagem, pronta para disparo com 1 toque.

3. **Fluxo Híbrido Resiliente para Desktop / WhatsApp Web:**
   - Para ambientes de desktop ou navegadores sem suporte a compartilhamento nativo de arquivos:
     - **Cópia Automática da Imagem para a Área de Transferência:** Utilização da **Async Clipboard API** com `ClipboardItem({ 'image/png': blob })`, permitindo que o usuário apenas pressione `Ctrl+V` dentro da conversa do cliente no WhatsApp para colar a imagem instantaneamente.
     - **Download Automático do Arquivo PNG:** O arquivo `comprovante-REC-XXXXXXXX.png` é salvo no dispositivo para envio alternativo via arrastar-e-soltar.
     - **Redirecionamento para o WhatsApp:** Abertura automática de `https://api.whatsapp.com/send` no navegador ou aplicativo desktop, posicionando o usuário na tela de seleção de contatos.
     - **Feedback Visual Não-Intrusivo:** Alerta in-app orientando o operador com clareza sobre a cópia e download da imagem.

4. **Atalho Opcional para Telefone Cadastrado:**
   - Caso o cliente possua telefone registrado no cadastro (`receivable.party?.phone`), um atalho sutil *"Enviar direto para este nº"* é exibido, permitindo alternar entre escolher um contato livremente ou abrir diretamente a conversa com o número registrado.

5. **Resolução de Bloqueio no Desktop e Bypass de Bloqueador de Pop-ups:**
   - **Diagnóstico do Problema:** No ambiente desktop (Windows/Mac/Linux), navegadores baseados em Chromium (Chrome, Edge) reportavam `navigator.canShare({ files: [file] })` como verdadeiro devido ao broker nativo do Windows (`DataTransferManager`). Isso acionava a janela cinza do Windows Share em vez do WhatsApp Web, e a execução assíncrona com `await generateReceiptBlob()` expirava o *User Activation Token* do navegador, fazendo com que qualquer chamada tardia a `window.open()` fosse bloqueada silenciosamente pelo bloqueador de pop-ups do navegador.
   - **Arquitetura de Segregação Mobile vs. Desktop:**
     - Introdução da verificação `isMobileDevice()` baseada em User-Agent e capacidades de toque (`navigator.maxTouchPoints`).
     - **No Mobile:** Mantido o fluxo perfeito de Web Share nativo com arquivo PNG anexado diretamente para o app WhatsApp.
     - **No Desktop:**
       1. **Pré-Abertura Síncrona da Janela:** A janela é aberta de forma síncrona imediatamente no clique (`window.open('about:blank', '_blank')`), capturando o token de ativação do usuário antes de qualquer operação assíncrona e tornando o bloqueador de pop-ups inoperante.
       2. **Redirecionamento Direto para o WhatsApp Web:** Concluída a geração do blob, a janela aberta é redirecionada para `https://web.whatsapp.com/send` (ou com telefone se preenchido), sem desvio para o Windows Share.
       3. **Cópia para o Clipboard (`Ctrl+V`):** O blob PNG gerado é copiado para a área de transferência do sistema operacional (`navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])`), permitindo ao operador simplesmente colar a imagem no chat.
       4. **Download do Arquivo PNG:** O arquivo físico é baixado automaticamente no computador como garantia extra.
       5. **Links Diretos de Resgate no Modal:** Renderização de botões explícitos `[Abrir WhatsApp Web]` e `[Abrir no App Desktop]` (`whatsapp://send`) no alerta de feedback, garantindo que o usuário tenha um clique direto caso prefira alternar de cliente ou se uma extensão de navegador tiver impedido a nova aba.

6. **Garantia de Qualidade e Testes:**
   - Criada a suíte de testes unitários [`PaymentReceiptModal.test.tsx`](file:///c:/Users/Micro/Documents/Projetos/ERP_GRAFICA/apps/web/src/features/receivables/PaymentReceiptModal.test.tsx) cobrindo tanto o ambiente Mobile (Web Share nativo) quanto o Desktop (pré-abertura síncrona sem bloqueio de pop-up, injeção no clipboard e links de resgate).
   - 100% dos testes aprovados (148 testes em `apps/web`) e compilação de produção validada.

---

## 24. Portabilidade Total Multi-Máquinas (Ambiente `.env` e Banco de Dados Integrados)

Para viabilizar a transição instantânea de desenvolvimento entre múltiplos computadores (ex.: escritório e residência) com zero fricção e zero perda de estado ou configurações, foi estruturada a **estratégia unificada de persistência e portabilidade**:

1. **Rastreamento Temporário dos Arquivos de Ambiente (`.env`):**
   - Configurações do ecossistema (`.env` na raiz, `apps/api/.env` e `packages/database/.env`) incluídas para versionamento no GitHub, garantindo que portas, chaves JWT de desenvolvimento e string de conexão do PostgreSQL estejam prontas logo após o `git pull` (com planejamento para remoção/segregação via cofre de segredos antes do deploy em produção).

2. **Snapshot Relacional Completo (`packages/database/prisma/seed-data.json`):**
   - Script de extração [`dump.ts`](file:///c:/Users/Micro/Documents/Projetos/ERP_GRAFICA/packages/database/prisma/dump.ts) e de restauração atômica [`restore.ts`](file:///c:/Users/Micro/Documents/Projetos/ERP_GRAFICA/packages/database/prisma/restore.ts).
   - O arquivo `seed-data.json` preserva todas as tabelas e registros existentes: usuários, clientes, maquinário gráfico, matérias-primas e estoque, orçamentos, ordens de serviço com histórico de estágios, despesas operacionais e contas a receber.
   - O comando padrão `pnpm db:seed` detecta automaticamente o snapshot e executa a restauração completa idempotente via `upsert`.

3. **Automação do PostgreSQL Embarcado (`scripts/start-db.js` / `pnpm db:start`):**
   - Inicializador inteligente que detecta se a porta 5432 já está ativa.
   - Varredura e purga automática de travas residuais de processos encerrados (`postmaster.pid`), eliminando falhas de inicialização em clones novos.
   - Versionamento do diretório de dados `data/embedded-pg` no GitHub com exclusão rigorosa de sockets efêmeros e logs em `.gitignore`.

---

## 25. Ciclo de Vida de Usuários, Ativação por E-mail Real e Recuperação de Senha

Para atender aos mais elevados padrões de segurança da informação e governança corporativa, o sistema substituiu o modelo antiquado de senhas provisórias cadastradas manualmente por administradores por um **fluxo profissional de onboarding e ciclo de vida de contas baseado em e-mails reais verificados e criptografia de tokens**:

### 25.1. Motivação e Riscos Eliminados
* **Risco de Vazamento de Senha Provisória:** O envio de senhas em texto puro via chat ou anotações físicas expõe a infraestrutura a acessos não autorizados.
* **Confirmação de Identidade e Propriedade de E-mail:** Garantia de que o colaborador é proprietário legítimo da caixa postal antes de conceder acesso aos dados confidenciais do ERP (orçamentos, DRE, clientes).
* **Autonomia e Segurança:** O próprio colaborador define sua senha privada, sem que nenhum outro membro da equipe tenha ciência dela.

### 25.2. Arquitetura do Fluxo de Cadastro e Convite (Onboarding)
1. **Cadastro pelo Administrador (`UsersPage`):**
   - O administrador informa apenas **Nome**, **E-mail corporativo** e **Perfil de Permissão (Role)**.
   - O campo de senha é completamente ocultado na criação de novos usuários, exibindo uma mensagem de orientação sobre o envio automático de convite por e-mail.
   - Ao submeter o formulário (`POST /api/v1/users`), o backend cria o usuário com `emailVerified: false`, `passwordHash: null`, gera um **token criptográfico de ativação de 48 horas** (`crypto.randomBytes(32).toString('hex')`) e dispara o e-mail de boas-vindas com o link de ativação seguro (`/activate?token=...`).

2. **Ativação pelo Usuário Convidado (`ActivateAccountPage`):**
   - O colaborador clica no link recebido em seu e-mail e é direcionado à rota pública `/activate?token=...`.
   - O frontend valida o token de imediato via `GET /api/v1/auth/verify-token?token=...&type=activation`. Se o token for inválido ou expirado, uma tela de orientação orienta o usuário a solicitar reenvio.
   - Se o token for válido, o formulário exibe o e-mail confirmado bloqueado para edição e solicita que o colaborador crie e confirme sua senha (mínimo de 6 caracteres).
   - Ao submeter (`POST /api/v1/auth/activate`), o backend valida o token, gera o hash seguro da senha com `bcrypt`, marca `emailVerified: true`, limpa os tokens de uso único, gera os tokens de acesso JWT (`accessToken` e `refreshToken`) e efetua o login instantâneo do colaborador.

3. **Gestão de Convites Pendentes no Painel Administrativo:**
   - A tabela de usuários exibe a nova coluna **Confirmação** com badges semânticos:
     - `Confirmado` (verde, com ícone de verificação) para contas ativadas.
     - `Pendente` (âmbar, com ícone de e-mail) para usuários que ainda não concluíram o cadastro.
   - Para usuários pendentes, um botão de ação rápida **Reenviar Convite** (`POST /api/v1/users/:id/resend-invitation`) renova o token por mais 48 horas e dispara um novo e-mail de ativação.

### 25.3. Fluxo de Recuperação de Senha ("Esqueci minha senha")
1. **Solicitação na Tela de Login (`LoginPage`):**
   - Link discreto *"Esqueci minha senha"* abaixo do campo de senha.
   - Ao clicar, abre-se o modal de recuperação onde o usuário insere seu e-mail cadastrado.
   - Disparo de requisição para `POST /api/v1/auth/forgot-password`.
   - **Prevenção de Enumeração de E-mails:** Para evitar que agentes maliciosos descubram se um e-mail existe no sistema, a resposta da API é sempre uniforme (`"Se o e-mail estiver cadastrado, as instruções foram enviadas com sucesso"`).

2. **Geração de Token de Recuperação:**
   - Se a conta existir, um token de recuperação de uso único com expiração de **1 hora** é gerado (`resetPasswordToken` e `resetPasswordExpires`).
   - Um e-mail com template HTML responsivo é despachado contendo o botão de redefinição para `/reset-password?token=...`.

3. **Redefinição Segura (`ResetPasswordPage`):**
   - O link direciona para `/reset-password?token=...`.
   - O token é pré-validado via `GET /api/v1/auth/verify-token?token=...&type=reset`.
   - O usuário digita sua nova senha com confirmação.
   - `POST /api/v1/auth/reset-password` altera o hash da senha no banco e invalida o token imediatamente.

### 25.4. Proteção e Blindagem no Endpoint de Login (`POST /auth/login`)
* **Bloqueio de Contas Não-Ativadas:** Tentativas de login em contas sem senha definida (`passwordHash == null`) ou com `emailVerified == false` são rejeitadas com mensagens explicativas (`"Esta conta ainda não foi ativada. Verifique seu e-mail e conclua o cadastro da sua senha."`).
* **Bloqueio de Contas Desativadas:** Usuários com `isActive: false` são bloqueados imediatamente, mesmo que informem credenciais corretas.

### 25.5. Serviço de E-mail (`MailService` / `MailModule`)
* Criado módulo global NestJS com `nodemailer`.
* Suporte nativo a envio SMTP configurável via variáveis de ambiente (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `APP_URL`).
* **Fallback Inteligente em Ambiente de Desenvolvimento:** Na ausência de credenciais SMTP, o serviço registra os links de ativação e redefinição com destaque nos logs do terminal com formatação visual limpa, viabilizando testes locais sem necessidade de servidores externos.

### 25.6. Garantia de Qualidade e Cobertura de Testes
* Suíte de testes do Backend (`test/auth.spec.ts`): 13 testes cobrindo todo o ciclo de tokens, bloqueios de login, ativação e expiração.
* Suíte de testes do Frontend (`LoginPage.test.tsx`, `ActivateAccountPage.test.tsx`, `ResetPasswordPage.test.tsx`, `UsersPage.test.tsx`): 15 testes cobrindo renderização, validações de URL, preenchimento de senhas e mutações de reenvio de convite.
* **Resultado Consolidado:** 100% de testes aprovados em todo o ecossistema (198 testes automatizados).

