# Documentação Técnica e Planos de Implementação — ERP Gráfica Modular

Esta pasta reúne os planos de implementação, relatórios de execução e especificações arquiteturais do projeto.

---

## 📑 Índice de Documentos

1. **[Plano de Implementação — Frontend Web](plano_implementacao_frontend_web.md)**
   - Especificação da arquitetura baseada em features/domínios para o React 18 + Vite 6.
   - Detalhamento do simulador 2D de aproveitamento de corte (`SheetCuttingCanvas`).
   - Mapeamento das 6 etapas do Chão de Fábrica Kanban com sincronização via WebSockets.
   - Design System, controle de acesso RBAC e gestão de estado Zustand.

2. **[Plano de Implementação — Suíte de Testes do Frontend Web](plano_implementacao_suite_testes_frontend.md)**
   - Configuração da infraestrutura de testes unitários e de componentes com Vitest 3, React Testing Library e JSDOM.
   - Casos de teste detalhados para utilitários, autenticação, componentes do design system, simulador SVG e telas.
   - Verificação e garantia de 100% de aprovação (60/60 testes).

3. **[Relatório de Execução (Walkthrough)](walkthrough_relatorio_execucao.md)**
   - Histórico consolidado de tudo o que foi implementado, testado e publicado.
   - Tabela de resultados dos testes automatizados.
   - Comandos práticos de execução, compilação e desenvolvimento.
   - Histórico de commits e integração com o repositório remoto no GitHub.
