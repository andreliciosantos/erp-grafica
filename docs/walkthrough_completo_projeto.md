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

