# ❓ 06. Perguntas Frequentes (FAQ) e Guia Interativo do Swagger

Neste capítulo final, reunimos as dúvidas mais comuns dos operadores e gestores do ERP Gráfica Modular, além de um guia visual completo para qualquer pessoa testar e validar os endpoints da API pelo navegador usando o Swagger OpenAPI.

---

## 1. Perguntas Frequentes (FAQ)

### P1: Por que o sistema não me deixa arrastar uma Ordem de Serviço direto de `PENDING` para `DELIVERED`?
**Resposta**: Porque o ERP possui uma máquina de estados finitos estrita para proteger o seu estoque e os seus custos. Se um trabalho pulasse direto para "Entregue", a impressora não registraria o tempo de máquina, o operador não seria identificado e **o papel continuaria constando no almoxarifado**, gerando furo de estoque e erro contábil no DRE. Para avançar uma OS, siga o fluxo: `PENDING` -> `PRE_PRESS` -> `PRINTING` -> `FINISHING` -> `QUALITY_CONTROL` -> `READY_FOR_PICKUP` -> `DELIVERED`.

---

### P2: O que acontece com o papel no estoque se um cliente cancelar o pedido depois de aprovado?
**Resposta**: O ERP cuida disso de forma inteligente:
- Se a OS for cancelada antes de entrar em impressão (em `PENDING` ou `PRE_PRESS`), o papel ainda não havia saído do estoque físico.
- Se a OS for cancelada quando já estava em `PRINTING`, o sistema dispara automaticamente uma rotina de **estorno de estoque**, devolvendo as folhas para o almoxarifado e gerando um log de devolução.

---

### P3: Qual a diferença entre Markup e Margem de Lucro?
**Resposta**:
- A **Margem de Lucro** é o percentual do preço final de venda que sobra como lucro.
- O **Markup** é o multiplicador/divisor aplicado sobre o custo para atingir aquela margem.
- No ERP Gráfica, utilizamos o método contábil correto ($\text{Preço} = \frac{\text{Custo}}{1 - \text{Markup}}$). Se você deseja que 35% do valor da nota fiscal seja lucro bruto, informe `0.35` no campo Markup.

---

### P4: Por que o cálculo de folhas (`sheetsRequired`) dá mais folhas do que a conta matemática de divisão?
**Resposta**: Porque na indústria gráfica existe a **perda técnica de acerto (maculatura)**. Para calibrar as 4 cores de uma impressora offset (registro de encaixe, carga de água e densidade de tinta) e ajustar a faca da guilhotina, gastam-se algumas dezenas de folhas de papel. O ERP embute essa margem de segurança para que você nunca chegue ao final da tiragem com menos exemplares do que o cliente comprou!

---

### P5: O que significa o erro `400 Bad Request` com formato RFC 7807?
**Resposta**: O padrão RFC 7807 é um formato internacional de mensagens de erro amigáveis para APIs. Quando esse erro aparece, significa que algum dado obrigatório foi preenchido incorretamente (ex.: CPF com quantidade errada de dígitos, e-mail mal formatado ou dimensões com valor negativo). A resposta sempre trará um campo `message` explicando exatamente qual campo precisa de correção.

---

### P6: O que é o Ponto de Equilíbrio (Break-Even) que aparece no meu DRE?
**Resposta**: É o valor em Reais que sua gráfica precisa faturar naquele mês exclusivamente para empatar (zero lucro e zero prejuízo). Ele indica a meta mínima de vendas que o setor comercial precisa atingir antes que a empresa comece a gerar lucro líquido real.

---

## 2. Guia Interativo: Como Testar a API no Swagger OpenAPI

O **Swagger UI** é uma ferramenta interativa integrada ao ERP Gráfica que permite visualizar todos os 33 endpoints do sistema, ler suas descrições e testá-los diretamente pelo navegador, sem precisar instalar programas como Postman ou Insomnia.

### Como Acessar o Swagger
1. Certifique-se de que a API do ERP está em execução.
2. Abra o seu navegador e acesse:
   ```text
   http://localhost:3000/docs
   ```
3. Você verá a interface oficial do **ERP Gráfica Modular API**, organizada pelas 13 categorias oficiais:
   - *Autenticação*, *Usuários*, *Clientes e Fornecedores*, *Matéria-Prima e Insumos*, *Máquinas e Equipamentos*, *Modelos de Produtos*, *Orçamentos Técnicos*, *Ordens de Serviço*, *Chão de Fábrica*, *Financeiro e DRE*, *Contas a Receber*, *Despesas Operacionais* e *Colaboradores*.

---

### Passo a Passo: Fazendo Login e Autenticando com o Botão "Authorize"

Para testar endpoints protegidos (que exigem crachá de segurança / token), siga este procedimento de 1 minuto:

#### Passo 1: Fazer Login na Rota de Autenticação
1. Localize a seção **Autenticação** no Swagger.
2. Clique no endpoint `POST /api/v1/auth/login`.
3. Clique no botão **Try it out** no canto direito.
4. O Swagger já apresentará o exemplo pronto de login:
   ```json
   {
     "email": "admin@erpgrafica.com",
     "password": "admin123"
   }
   ```
5. Clique no botão azul **Execute**.
6. Na resposta (Response 200 OK), localize o campo `accessToken` e **copie apenas o texto do token** (uma longa sequência de caracteres gerada).

#### Passo 2: Inserir o Token no Cadeado "Authorize"
1. Suba até o topo da página do Swagger UI.
2. No canto superior direito, clique no botão verde **Authorize** (com ícone de um cadeado aberto).
3. No campo **Value**, cole o token copiado no passo anterior.
4. Clique em **Authorize** e em seguida em **Close**.
5. O ícone do cadeado agora estará **fechado** 🔒!

---

### Testando Operações na Prática com o Token Ativo

Agora que o token está gravado no navegador, você pode testar qualquer operação com dados gráficos realistas:

#### 1. Testar Listagem de Insumos / Papéis
- Vá em **Matéria-Prima e Insumos** -> `GET /api/v1/raw-materials`.
- Clique em **Try it out** e depois em **Execute**.
- O sistema retornará a lista completa de papéis e formatos cadastrados no estoque.

#### 2. Testar Cálculo de Orçamento Técnico Gráfico
- Vá em **Orçamentos Técnicos** -> `POST /api/v1/quotes`.
- Clique em **Try it out**. O Swagger carregará automaticamente o exemplo gráfico:
  ```json
  {
    "partyId": "ID_DO_CLIENTE",
    "markupApplied": 0.35,
    "validDays": 15,
    "notes": "Folder A4 4x4 em Couchê",
    "items": [
      {
        "productName": "Folder Institucional A4 4x4",
        "quantity": 1000,
        "widthMm": 210,
        "heightMm": 297,
        "colorsFront": 4,
        "colorsBack": 4,
        "finishingOptions": ["DOBRA"]
      }
    ]
  }
  ```
- Clique em **Execute** e veja o motor de corte retornar as folhas gastas, o aproveitamento e o preço de venda sugerido.

#### 3. Consultar o DRE Contábil
- Vá em **Financeiro e DRE** -> `GET /api/v1/financial/dre`.
- Clique em **Try it out** e informe o mês de competência (ex.: `2026-09`).
- Clique em **Execute** e visualize a demonstração hierárquica completa do resultado da empresa.

---

> [!TIP]
> **Parabéns!** Você agora domina tanto as regras de negócio da gráfica quanto o funcionamento da sua infraestrutura digital. Em caso de dúvidas adicionais, consulte os outros capítulos desta central de documentação humana!
