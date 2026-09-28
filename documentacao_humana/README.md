# 📚 ERP Gráfica Modular — Central de Documentação Humana

Seja muito bem-vindo à central de documentação e treinamento do **ERP Gráfica Modular**.

Este conjunto de manuais foi escrito especialmente para **humanos** — empresários, diretores de produção, orçamentistas, vendedores, operadores de máquinas, analistas financeiros e administradores de TI —, com linguagem clara, objetiva, rica em exemplos reais do dia a dia gráfico e livre de jargões técnicos indecifráveis.

---

## 🗺️ Mapa de Leitura por Perfil de Usuário

Para facilitar o seu aprendizado, preparamos trilhas rápidas de leitura de acordo com a sua função na gráfica:

| Perfil / Cargo | Manuais Recomendados | Foco Principal |
| :--- | :--- | :--- |
| **👑 Diretor / Proprietário** | [01 - Visão Geral](01_visao_geral_e_guia_de_inicio_rapido.md)<br>[05 - Financeiro e DRE](05_manual_financeiro_contas_e_dre.md) | Margem de contribuição, ponto de equilíbrio (Break-even), EBITDA, lucratividade por produto e fluxo de caixa. |
| **💼 Vendedor / Orçamentista** | [01 - Visão Geral](01_visao_geral_e_guia_de_inicio_rapido.md)<br>[02 - Comercial e Orçamentos](02_manual_comercial_e_engenharia_de_orcamentos.md) | Cadastro de clientes, cálculo de corte de papel, aproveitamento de folha inteira, aplicação de markup e aprovação de propostas. |
| **🏭 Gerente de Produção / PCP** | [03 - Produção e PCP](03_manual_producao_pcp_e_chao_de_fabrica.md)<br>[04 - Estoque e Máquinas](04_manual_estoque_insumos_e_maquinas.md) | Quadro Kanban, máquina de estados da OS, esteira de etapas, capacidade de máquinas, tempos de setup e controle de refugo. |
| **🖨️ Operador de Máquina / Chão de Fábrica** | [03 - Produção e PCP](03_manual_producao_pcp_e_chao_de_fabrica.md) | Apontamento em tempo real (`START`, `PAUSE`, `COMPLETE`), registro de desperdício/acerto e tempos operacionais. |
| **💰 Financeiro / Faturamento** | [05 - Financeiro e DRE](05_manual_financeiro_contas_e_dre.md) | Parcelamento automático de ordens de serviço, baixa de recebíveis via PIX/Boleto, despesas fixas/variáveis e DRE contábil. |
| **💻 Administrador de TI / Integrador** | [06 - FAQ e Swagger UI](06_faq_e_guia_de_testes_swagger.md)<br>[07 - DER e Arquitetura de Dados](07_diagrama_entidade_relacionamento_e_arquitetura_de_dados.md)<br>[08 - Modelagem brModelo e Importação](08_guia_modelagem_brmodelo_e_importacao.md)<br>[01 - Visão Geral](01_visao_geral_e_guia_de_inicio_rapido.md) | Permissões de usuários (RBAC), integração via API REST, testes com Swagger, modelagem do banco (DER), modelo brModelo (.brm, .sql, .json) e integridade referencial. |

---

## 📑 Índice Completo dos Manuais

Clique no capítulo desejado para iniciar a sua leitura:

1. [**01. Visão Geral e Guia de Início Rápido**](01_visao_geral_e_guia_de_inicio_rapido.md)
   - O que é o ERP Gráfica Modular e quais problemas ele resolve.
   - O fluxo completo de uma gráfica (do orçamento ao faturamento).
   - Primeiro acesso, login e entendimento dos níveis de acesso (Admin, Comercial, Financeiro e Operador).

2. [**02. Manual Comercial e Engenharia de Orçamentos**](02_manual_comercial_e_engenharia_de_orcamentos.md)
   - Gestão de parceiros comerciais (Clientes e Fornecedores - PF e PJ).
   - Engenharia gráfica: como o sistema calcula o corte de papel em folhas padrão (ex.: 660x960 mm), sangria, pinça e perda técnica.
   - Formação de preço: aplicação de Markup e margem real de lucro.
   - Como cadastrar, enviar e aprovar um orçamento gerando a Ordem de Serviço (OS).

3. [**03. Manual de Produção, PCP e Chão de Fábrica**](03_manual_producao_pcp_e_chao_de_fabrica.md)
   - O Quadro Kanban de produção e a visualização em lista.
   - O ciclo de vida da OS e a Máquina de Estados Finitos (regras de avanço e bloqueios de segurança).
   - O momento exato da baixa de estoque de papel (entrada em `PRINTING`) e estorno automático por cancelamento.
   - Guia prático do operador: apontamento de início, pausa, retorno e conclusão de etapas.

4. [**04. Manual de Estoque, Insumos e Máquinas**](04_manual_estoque_insumos_e_maquinas.md)
   - Cadastro de matérias-primas: papéis (gramatura e dimensões), tintas CMYK, chapas térmicas CTP e acabamentos.
   - Controle de estoque mínimo e movimentações de entrada e saída.
   - Cadastro do parque gráfico: impressoras offset, impressoras digitais, guilhotinas e dobradeiras com custos/hora e velocidades.

5. [**05. Manual Financeiro, Contas a Receber e DRE**](05_manual_financeiro_contas_e_dre.md)
   - Contas a Receber: planos automáticos (À Vista, 50% Entrada + 50% Retirada, Parcelado até 12x) e baixa de pagamentos.
   - Despesas Operacionais (OPEX): contas a pagar fixas e variáveis, e recurso de duplicação para o mês seguinte.
   - Gestão de Colaboradores e RH: turnos, salários e valor de hora/homem para composição de custos.
   - DRE Gerencial detalhado: faturamento bruto, impostos, CPV, margem de contribuição, EBITDA e ponto de equilíbrio.

6. [**06. Perguntas Frequentes (FAQ) e Guia de Testes no Swagger**](06_faq_e_guia_de_testes_swagger.md)
   - Dúvidas mais frequentes e como resolver impedimentos do dia a dia.
   - Guia visual passo a passo para testar a API no Swagger UI (`/docs`), gerar token JWT e simular operações no navegador.

7. [**07. Diagrama Entidade-Relacionamento (DER) e Arquitetura de Dados**](07_diagrama_entidade_relacionamento_e_arquitetura_de_dados.md)
   - Diagrama formal ERD em Mermaid com todas as 15 tabelas, chaves e relacionamentos.
   - Mapa conceitual de fluxo de dados entre os 4 eixos (Comercial, PCP, Estoque e Financeiro).
   - Dicionário de dados completo campo a campo de todas as entidades e enums.
   - Regras de integridade referencial, transações atômicas de baixa/estorno de estoque e rotinas de backup.

8. [**08. Guia de Modelagem no brModelo e Importação do DER**](08_guia_modelagem_brmodelo_e_importacao.md)
   - Diagrama visual de alta resolução em estilo clássico brModelo com notação Peter Chen estendida.
   - Arquivo canônico conceitual `.brm` para brModelo Desktop.
   - Arquivo de grafo `.json` para brModelo Web e ferramentas JointJS.
   - Script SQL DDL universal `esquema_banco_brmodelo.sql` para engenharia reversa imediata.

---

> [!TIP]
> **Dica de Ouro**: Se você é um novo colaborador ou orçamentista na gráfica, recomendamos começar pelo [Capítulo 01](01_visao_geral_e_guia_de_inicio_rapido.md) e depois seguir para o [Capítulo 02](02_manual_comercial_e_engenharia_de_orcamentos.md). Em menos de 20 minutos você entenderá todo o funcionamento do sistema!
