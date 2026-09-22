# Documentação Técnica e Arquitetural — ERP Gráfica Modular

Esta pasta reúne a documentação técnica oficial, relatórios de execução, planos de engenharia e a fundamentação teórica de computação do projeto.

---

## 📑 Índice de Documentos

1. **[Walkthrough Completo do Projeto e Decisões de Arquitetura](walkthrough_completo_projeto.md)**
   - Panorama integral do sistema de ponta a ponta.
   - Explicação detalhada dos **motivos técnicos e de negócio** de cada decisão (por que monorepo, por que Prisma/Postgres, por que Feature-Driven Design, regras de corte, precificação e websockets).

2. **[Fundamentos de Computação e Análise Tecnológica (Aula Magna)](guia_tecnologias_fundamentos_computacao.md)**
   - Texto acadêmico aprofundado na persona de um **Professor Universitário de Ciência da Computação**.
   - Teoria dos Grafos e DAGs (Turborepo), Aritmética de Ponto Flutuante IEEE-754 vs Decimal.js, Álgebra Relacional e ACID (PostgreSQL), Padrões SOLID e IoC (NestJS), Reconciliação Heurística $\mathcal{O}(N)$ do Virtual DOM (React 18 Fiber), WebSockets Full-Duplex e Tunelamento Zero Trust com QUIC.

3. **[Plano de Implementação — Frontend Web](plano_implementacao_frontend_web.md)**
   - Especificação da arquitetura baseada em features/domínios para o React 18 + Vite 6.
   - Detalhamento do simulador 2D de aproveitamento de corte (`SheetCuttingCanvas`).
   - Mapeamento das 6 etapas do Chão de Fábrica Kanban com sincronização via WebSockets.

4. **[Plano de Implementação — Suíte de Testes do Frontend Web](plano_implementacao_suite_testes_frontend.md)**
   - Configuração da infraestrutura de testes unitários e de componentes com Vitest 3, React Testing Library e JSDOM.
   - Casos de teste para utilitários, autenticação, componentes do design system, simulador SVG e telas.

5. **[Relatório de Execução (Walkthrough dos Testes)](walkthrough_relatorio_execucao.md)**
   - Histórico consolidado de tudo o que foi implementado, testado e publicado.
   - Tabela de resultados dos 60 testes automatizados aprovados (100% de sucesso).
   - Comandos práticos de execução, compilação e desenvolvimento.
