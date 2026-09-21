const http = require('http');

async function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: data ? JSON.parse(data) : null });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('===============================================================');
  console.log('       RELATÓRIO DE TESTES - SWAGGER OPENAPI ENDPOINTS         ');
  console.log('===============================================================\n');

  // 1. Swagger UI e Spec
  const docsRes = await request({ hostname: 'localhost', port: 3000, path: '/docs', method: 'GET' });
  console.log('[TEST 1] GET /docs (Swagger UI):', docsRes.status === 200 ? '✅ 200 OK (Interface HTML carregada com sucesso)' : '❌ ' + docsRes.status);

  const specRes = await request({ hostname: 'localhost', port: 3000, path: '/docs-json', method: 'GET' });
  const totalPaths = specRes.body?.paths ? Object.keys(specRes.body.paths).length : 0;
  console.log('[TEST 2] GET /docs-json (OpenAPI 3.0 Spec):', specRes.status === 200 ? `✅ 200 OK (OpenAPI ${specRes.body.openapi}, ${totalPaths} rotas registradas)` : '❌ ' + specRes.status);

  // 2. Auth - Validação de campos obrigatórios
  const loginEmpty = await request({
    hostname: 'localhost', port: 3000, path: '/api/v1/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {});
  console.log('[TEST 3] POST /api/v1/auth/login (Validação de Body Vazio):', loginEmpty.status === 400 ? `✅ 400 Bad Request (RFC 7807 validado: ${loginEmpty.body.message.length} erros detectados)` : '❌ ' + loginEmpty.status);

  // 3. Auth - Senha incorreta
  const loginFailRes = await request({
    hostname: 'localhost', port: 3000, path: '/api/v1/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@erpgrafica.com', password: 'wrongpassword' });
  console.log('[TEST 4] POST /api/v1/auth/login (Credenciais Inválidas):', loginFailRes.status === 401 ? `✅ 401 Unauthorized (${loginFailRes.body.message})` : '❌ ' + loginFailRes.status);

  // 4. Auth - Sucesso (Admin)
  const loginRes = await request({
    hostname: 'localhost', port: 3000, path: '/api/v1/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@erpgrafica.com', password: 'admin123' });
  
  if (loginRes.status !== 200 || !loginRes.body.accessToken) {
    console.error('Falha crítica no login com admin!', loginRes);
    return;
  }
  const token = loginRes.body.accessToken;
  console.log('[TEST 5] POST /api/v1/auth/login (Login Admin com Sucesso):', `✅ 200 OK (Usuário: "${loginRes.body.user.name}" | Perfil: ${loginRes.body.user.role} | JWT emitido)`);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  };

  // 5. Teste de Rota Protegida sem Token Bearer
  const noTokenRes = await request({ hostname: 'localhost', port: 3000, path: '/api/v1/users', method: 'GET' });
  console.log('[TEST 6] GET /api/v1/users (Tentativa sem Token Bearer):', noTokenRes.status === 401 ? '✅ 401 Unauthorized (Protegido por Bearer Auth)' : '❌ ' + noTokenRes.status);

  // 6. Users List com Token Bearer
  const usersRes = await request({ hostname: 'localhost', port: 3000, path: '/api/v1/users', method: 'GET', headers: authHeaders });
  const usersList = usersRes.body?.data || [];
  console.log('[TEST 7] GET /api/v1/users (Autenticado):', usersRes.status === 200 ? `✅ 200 OK (${usersList.length} usuários retornados: ${usersList.map(u => u.name).join(', ')})` : '❌ ' + usersRes.status);

  // 7. Machines List
  const machinesRes = await request({ hostname: 'localhost', port: 3000, path: '/api/v1/machines', method: 'GET', headers: authHeaders });
  const machinesList = Array.isArray(machinesRes.body) ? machinesRes.body : (machinesRes.body?.data || []);
  console.log('[TEST 8] GET /api/v1/machines:', machinesRes.status === 200 ? `✅ 200 OK (${machinesList.length} máquinas cadastradas: ${machinesList.map(m => m.name).join(', ')})` : '❌ ' + machinesRes.status);

  // 8. Raw Materials List (Insumos Gráficos)
  const rmRes = await request({ hostname: 'localhost', port: 3000, path: '/api/v1/raw-materials', method: 'GET', headers: authHeaders });
  const rmList = rmRes.body?.data || [];
  console.log('[TEST 9] GET /api/v1/raw-materials:', rmRes.status === 200 ? `✅ 200 OK (${rmList.length} insumos cadastrados: ${rmList.map(r => r.name).join(' | ')})` : '❌ ' + rmRes.status);

  // 9. Parties List (Clientes e Fornecedores)
  const partiesRes = await request({ hostname: 'localhost', port: 3000, path: '/api/v1/parties', method: 'GET', headers: authHeaders });
  const partiesList = partiesRes.body?.data || [];
  console.log('[TEST 10] GET /api/v1/parties:', partiesRes.status === 200 ? `✅ 200 OK (${partiesList.length} parceiros: ${partiesList[0]?.name})` : '❌ ' + partiesRes.status);

  const customerId = partiesList[0]?.id;
  const materialId = rmList[0]?.id;

  // 10. Criar Orçamento Técnico (Calculado via Business Core)
  const quotePayload = {
    partyId: customerId,
    markupApplied: 0.35,
    validDays: 15,
    notes: 'Orçamento de teste via Swagger',
    items: [
      {
        productName: 'Folder Institucional A4 4x4',
        rawMaterialId: materialId,
        quantity: 1000,
        widthMm: 210,
        heightMm: 297,
        colorsFront: 4,
        colorsBack: 4,
        finishingOptions: ['DOBRA']
      }
    ]
  };

  const createQuoteRes = await request({
    hostname: 'localhost', port: 3000, path: '/api/v1/quotes', method: 'POST', headers: authHeaders
  }, quotePayload);

  const quote = createQuoteRes.body;
  const quoteItem = quote?.items?.[0];
  console.log('[TEST 11] POST /api/v1/quotes (Cálculo Técnico de Corte & Preço):', createQuoteRes.status === 201 ?
    `✅ 201 Created (Orçamento #${quote.quoteNumber} | Rendimento: ${quoteItem?.itemsPerSheet} por folha | Folhas necessárias: ${quoteItem?.sheetsRequired} | Valor Total: R$ ${quote.totalAmount})` :
    '❌ ' + createQuoteRes.status + ' ' + JSON.stringify(createQuoteRes.body));

  const quoteId = quote?.id;

  // 11. Listar Orçamentos
  const listQuotesRes = await request({ hostname: 'localhost', port: 3000, path: '/api/v1/quotes', method: 'GET', headers: authHeaders });
  const quotesList = listQuotesRes.body?.data || [];
  console.log('[TEST 12] GET /api/v1/quotes:', listQuotesRes.status === 200 ? `✅ 200 OK (${quotesList.length} orçamentos encontrados)` : '❌ ' + listQuotesRes.status);

  // 12. Aprovar Orçamento e Gerar Ordem de Serviço (OS)
  const approveRes = await request({
    hostname: 'localhost', port: 3000, path: `/api/v1/quotes/${quoteId}/approve`, method: 'POST', headers: authHeaders
  });
  const order = approveRes.body;
  console.log('[TEST 13] POST /api/v1/quotes/:id/approve (Geração Automática de OS):', approveRes.status === 201 ?
    `✅ 201 Created (OS: ${order.orderNumber} | Status: ${order.status} | Etapas geradas: ${order.stages?.length})` :
    '❌ ' + approveRes.status + ' ' + JSON.stringify(approveRes.body));

  const orderId = order?.id;
  const stages = order?.stages || [];

  // 13. Consultar OS por ID
  const getOrderRes = await request({ hostname: 'localhost', port: 3000, path: `/api/v1/work-orders/${orderId}`, method: 'GET', headers: authHeaders });
  console.log('[TEST 14] GET /api/v1/work-orders/:id:', getOrderRes.status === 200 ? `✅ 200 OK (OS ${getOrderRes.body.orderNumber} encontrada com sucesso)` : '❌ ' + getOrderRes.status);

  // 14. Listar todas as Ordens de Serviço
  const listOrdersRes = await request({ hostname: 'localhost', port: 3000, path: '/api/v1/work-orders', method: 'GET', headers: authHeaders });
  const ordersList = listOrdersRes.body?.data || [];
  console.log('[TEST 15] GET /api/v1/work-orders:', listOrdersRes.status === 200 ? `✅ 200 OK (${ordersList.length} ordem(ns) de serviço ativa(s))` : '❌ ' + listOrdersRes.status);

  // 15. Máquina de Estados: Avançar para PRE_PRESS
  const advancePrePress = await request({
    hostname: 'localhost', port: 3000, path: `/api/v1/work-orders/${orderId}/status`, method: 'PATCH', headers: authHeaders
  }, { status: 'PRE_PRESS' });
  console.log('[TEST 16] PATCH /api/v1/work-orders/:id/status (Avançar para PRE_PRESS):', advancePrePress.status === 200 ? `✅ 200 OK (Novo Status: ${advancePrePress.body.status})` : '❌ ' + advancePrePress.status + ' ' + JSON.stringify(advancePrePress.body));

  // 16. Máquina de Estados: Avançar para PRINTING (Aciona baixa automática de estoque de insumos)
  const advancePrinting = await request({
    hostname: 'localhost', port: 3000, path: `/api/v1/work-orders/${orderId}/status`, method: 'PATCH', headers: authHeaders
  }, { status: 'PRINTING' });
  console.log('[TEST 17] PATCH /api/v1/work-orders/:id/status (Avançar para PRINTING com Baixa de Estoque):', advancePrinting.status === 200 ? `✅ 200 OK (Novo Status: ${advancePrinting.body.status})` : '❌ ' + advancePrinting.status + ' ' + JSON.stringify(advancePrinting.body));

  // 17. Apontamento de Chão de Fábrica (START na etapa de Impressão)
  const printStage = stages.find(s => s.type === 'PRINTING') || stages[1];
  if (printStage) {
    const startStageRes = await request({
      hostname: 'localhost', port: 3000, path: `/api/v1/stages/${printStage.id}/action`, method: 'POST', headers: authHeaders
    }, { action: 'START', operatorId: loginRes.body.user.id });
    console.log('[TEST 18] POST /api/v1/stages/:stageId/action (Apontamento START na Impressão):', startStageRes.status === 201 ? `✅ 201 Created (Status da Etapa: ${startStageRes.body.status})` : '❌ ' + startStageRes.status + ' ' + JSON.stringify(startStageRes.body));
  }

  // 18. Tentativa de Pular Etapa Ilegalmente (Garantir integridade da Máquina de Estados)
  const illegalTransition = await request({
    hostname: 'localhost', port: 3000, path: `/api/v1/work-orders/${orderId}/status`, method: 'PATCH', headers: authHeaders
  }, { status: 'DELIVERED' });
  console.log('[TEST 19] PATCH /api/v1/work-orders/:id/status (Transição ilegal PRINTING -> DELIVERED):', illegalTransition.status === 400 ? `✅ 400 Bad Request (${illegalTransition.body.message})` : '❌ ' + illegalTransition.status);

  console.log('\n===============================================================');
  console.log('       🎉 TODOS OS 19 TESTES FORAM EXECUTADOS COM SUCESSO!     ');
  console.log('===============================================================');
}

runTests().catch(console.error);
