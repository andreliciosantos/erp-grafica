const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>ERP Gráfica Modular - Fluxograma Operacional</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background-color: #090e18;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #f1f5f9;
      display: inline-block;
      padding: 40px;
      min-width: 1400px;
    }
    .header {
      margin-bottom: 30px;
      padding: 24px 32px;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border: 1px solid #334155;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .badge-container {
      display: flex;
      gap: 10px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .badge {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 4px 10px;
      border-radius: 9999px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .badge-sky {
      background: rgba(14, 165, 233, 0.15);
      color: #38bdf8;
      border-color: rgba(14, 165, 233, 0.3);
    }
    .badge-indigo {
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border-color: rgba(99, 102, 241, 0.3);
    }
    .badge-amber {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border-color: rgba(245, 158, 11, 0.3);
    }
    h1 {
      font-size: 26px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }
    p.subtitle {
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.5;
    }
    .chart-card {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7);
    }
    .footer {
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #64748b;
      padding: 0 8px;
    }
    /* Mermaid customization */
    .mermaid {
      display: flex;
      justify-content: center;
    }
    .mermaid svg {
      max-width: none !important;
      height: auto;
    }
    /* Node and cluster enhancements */
    .node rect, .node circle, .node polygon {
      stroke-width: 1.5px !important;
    }
    .cluster rect {
      stroke-width: 1.5px !important;
      rx: 12px !important;
      ry: 12px !important;
    }
    .edgePath path {
      stroke-width: 2px !important;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="badge-container">
      <span class="badge badge-sky">Arquitetura Monorepo</span>
      <span class="badge">Aproveitamento de Folha 2D</span>
      <span class="badge badge-indigo">WebSockets Realtime</span>
      <span class="badge badge-amber">Baixa Automática de Estoque</span>
      <span class="badge">DRE Gerencial em Tempo Real</span>
    </div>
    <h1>🖨️ ERP GRÁFICA MODULAR — FLUXOGRAMA OPERACIONAL INTEGRADO</h1>
    <p class="subtitle">
      Mapa de processos de alto desempenho: desde o primeiro contato do cliente até a engenharia de corte, ordem de produção, chão de fábrica, entrega e apuração contábil.
    </p>
  </div>

  <div class="chart-card" id="diagram-container">
    <pre class="mermaid">
flowchart TD
    %% 1. COMERCIAL E ENGENHARIA
    subgraph S1["1. COMERCIAL & ENGENHARIA DE ORÇAMENTOS"]
        A1["Cliente entra em contato<br/>(Balcão, WhatsApp, E-mail ou Telefone)"] --> B1{"Tipo de Demanda?"}
        
        B1 -- "Produto Padronizado" --> C1["Catálogo Rápido (1-Clique)<br/>• Cartões de Visita 300g (4x4)<br/>• Panfletos 100x140mm Couchê 115g<br/>• Folders 2 Dobras, Banners e Pastas"]
        B1 -- "Projeto Sob Medida" --> D1["Calculadora Paramétrica<br/>• Formato aberto personalizado (LxA mm)<br/>• Substrato, gramatura e acabamentos<br/>• Padrão de cores (4x4, 4x0, 1x1, 1x0)"]
        
        C1 --> E1["Motor Matemático (@erp/business-core)<br/>1. Imposição 2D: Arranjo Direto vs 90° (Melhor rendimento)<br/>2. Margem de Pinça (10mm) e Sangria (3mm)<br/>3. Folhas pai com perda operacional técnica (10%)<br/>4. Custo: Papel + Setup + Hora-Máquina + Acabamentos<br/>5. Formação de Preço via Markup Divisor: Custo / (1 - Markup)"]
        D1 --> E1
        
        E1 --> F1["Proposta Comercial Emitida<br/>• Preço Total e Unitário<br/>• Folhas e Insumos Necessários<br/>• Envio via Link / PDF / WhatsApp"]
        
        F1 --> G1{"Cliente Aprovou?"}
        G1 -- "Não" --> H1["Status: REJEITADO<br/>(Proposta arquivada no CRM)"]
        G1 -- "Sim" --> I1["Aprovação Comercial"]
    end

    %% 2. LIBERAÇÃO COMERCIAL & ENTRADA FINANCEIRA
    subgraph S2["2. LIBERAÇÃO COMERCIAL & ENTRADA FINANCEIRA"]
        I1 --> J1["Transação Atômica no Backend (ACID):<br/>• Cria Ordem de Serviço (OS-YYYY-XXXXX)<br/>• Gera Código de Barras Code-128 único<br/>• Instancia Etapas Fabris Obrigatórias<br/>• Status inicial: PENDING (Liberação)<br/>• Emite evento WebSocket para o Chão de Fábrica"]
        
        J1 --> K1["Definição do Plano de Pagamento:<br/>• Padrão: 50% de Sinal + 50% na Retirada<br/>• À Vista Antecipado (100%)<br/>• Parcelado Corporativo (Boleto / Cartão)"]
        
        K1 --> L1["Recebimento do Sinal (50%)<br/>• Baixa de parcela no Contas a Receber<br/>• Geração automática de Recibo PNG em Alta Resolução<br/>• Disparo de Comprovante no WhatsApp com 1 toque"]
        
        L1 --> M1["OS Liberada para a Produção<br/>Status: PRE_PRESS"]
    end

    %% 3. PCP, PRÉ-IMPRESSÃO & CORTE INICIAL
    subgraph S3["3. PCP, PRÉ-IMPRESSÃO & CORTE PRIMÁRIO"]
        M1 --> N1["Emissão da Ficha Técnica (Job Ticket):<br/>• Formato A4 (Prancheta) ou Bobina Térmica 80mm<br/>• Código de barras Code-128 legível por bipador<br/>• Miniatura vetorial do plano de corte de folha<br/>• Checklist de etapas e acabamentos para operador"]
        
        N1 --> O1["Pré-Impressão & CTP:<br/>• Preflight de arquivo (formato, sangrias e resolução)<br/>• Gravação de chapas de alumínio CTP ou RIP Digital<br/>• Apontamento de conclusão da Pré-Impressão"]
        
        O1 --> P1["Corte Inicial da Folha Pai (Guilhotina):<br/>• Almoxarifado separa folhas inteiras (BB 66x96cm ou AA 64x88cm)<br/>• Fracionamento para o formato exato de entrada na impressora"]
    end

    %% 4. CHÃO DE FÁBRICA & IMPRESSÃO
    subgraph S4["4. CHÃO DE FÁBRICA & IMPRESSÃO"]
        P1 --> Q1["Transição da OS para: PRINTING"]
        
        Q1 --> R1["⚡ BAIXA AUTOMÁTICA DE ESTOQUE<br/>• Sistema debita do estoque as folhas calculadas (sheetsRequired)<br/>• Registra log imutável de movimentação (CONSUMO_PRODUCAO)<br/>• Alerta caso atinja o estoque mínimo de segurança"]
        
        R1 --> S1_OP["Apontamento na Impressora (Offset / Digital):<br/>• Operador bipa código de barras da OS: Ação START<br/>• Rodagem da tiragem e acerto de tinteiros/registro<br/>• Operador conclui: Ação COMPLETE<br/>• Registro de perda técnica/maculatura (wasteQuantity)"]
        
        S1_OP --> T1["Transição da OS para: FINISHING"]
        
        T1 --> U1["Acabamentos Sequenciais:<br/>• Plastificação / Laminação BOPP Fosca ou Brilho<br/>• Verniz UV Localizado / Hot Stamping<br/>• Corte e Vinco / Dobra / Refile Trilateral na Guilhotina<br/>• Apontamento por operadores com horários e perdas"]
    end

    %% 5. CONTROLE DE QUALIDADE & EXPEDIÇÃO
    subgraph S5["5. CONTROLE DE QUALIDADE, EMBALAGEM & EXPEDIÇÃO"]
        U1 --> V1["Transição da OS para: QUALITY_CONTROL<br/>• Conferência de fidelidade cromática, registro e esquadro<br/>• Verificação da tiragem líquida final"]
        
        V1 --> W1["Transição da OS para: READY_FOR_PICKUP<br/>• Empacotamento com etiqueta adesiva térmica 80mm<br/>• Disparo de Mensagem Automática no WhatsApp:<br/>'🎉 Olá! Seu pedido OS-xxxxx está embalado e pronto para retirada!'"]
        
        W1 --> X1{"Modalidade de Entrega?"}
        X1 -- "Retirada no Balcão" --> Y1["Cliente comparece à gráfica"]
        X1 -- "Logística / Motoboy" --> Z1["Status: DISPATCHED<br/>Despachado com guia de remessa"]
    end

    %% 6. LIQUIDAÇÃO FINANCEIRA & DRE GERENCIAL
    subgraph S6["6. LIQUIDAÇÃO FINANCEIRA, DRE & INTELIGÊNCIA"]
        Y1 --> AA1["Cobrança do Saldo Restante (50%)<br/>• Quitação rápida no Balcão (PIX, Dinheiro, Cartão)<br/>• Baixa do segundo título no Contas a Receber"]
        Z1 --> AA1
        
        AA1 --> AB1["Protocolo de Entrega Finalizado<br/>Status da OS: DELIVERED"]
        
        AB1 --> AC1["Consolidação Contábil Automática (DRE Gerencial):<br/>1.0 RECEITA BRUTA: Faturamento total da OS<br/>1.1 (-) Impostos sobre Vendas (Simples Nacional / Presumido)<br/>2.0 (=) RECEITA LÍQUIDA<br/>3.0 (-) CPV: Papel real + Chapas CTP + Tintas + Hora-Máquina<br/>4.0 (=) MARGEM DE CONTRIBUIÇÃO (LUCRO BRUTO)<br/>5.0 (-) OPEX: Aluguel + Energia Trifásica + Softwares + Salários<br/>6.0 (=) EBITDA: Lucro Operacional Líquido Real da Gráfica"]
        
        AC1 --> AD1["Fluxo de Caixa & Ponto de Equilíbrio:<br/>• Conciliação bancária entre recebimentos e despesas operacionais<br/>• Acompanhamento do Break-Even mensal em tempo real"]
    end

    %% EXCEÇÃO DE CANCELAMENTO
    Q1 -.->|Se Cancelado| CANCEL1["Status: CANCELLED<br/>• ESTORNO AUTOMÁTICO DE ESTOQUE<br/>• Devolve as folhas consumidas ao saldo do almoxarifado"]
    CANCEL1 -.->|Reversão contábil| AC1
    </pre>
  </div>

  <div class="footer">
    <span>ERP Gráfica Modular • Engenharia Gráfica e Gestão Integrada</span>
    <span>Turborepo • NestJS • Prisma • PostgreSQL • React • WebSockets • Decimal.js</span>
  </div>

  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: 'dark',
      themeVariables: {
        darkMode: true,
        background: '#0f172a',
        primaryColor: '#1e293b',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#38bdf8',
        lineColor: '#64748b',
        secondaryColor: '#1e1b4b',
        tertiaryColor: '#0f172a',
        clusterBkg: '#131d31',
        clusterBorder: '#334155',
        edgeLabelBackground: '#0b1120',
        nodeBorder: '#38bdf8',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontSize: '13px'
      },
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        curve: 'basis'
      }
    });

    window.addEventListener('load', () => {
      // Small timeout to allow mermaid SVG to render completely
      setTimeout(() => {
        window.mermaidReady = true;
      }, 1500);
    });
  </script>
</body>
</html>`;

async function main() {
  const rootDir = 'C:\\Users\\Micro\\Documents\\Projetos\\ERP_GRAFICA';
  const htmlPath = path.join(rootDir, 'fluxograma_temp.html');
  const pngPath = path.join(rootDir, 'fluxograma_erp_grafica.png');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  console.log('1. Escrevendo arquivo HTML com diagrama Mermaid...');
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');

  console.log('2. Iniciando Edge Headless com DevTools Protocol...');
  const tmpUserData = path.join(os.tmpdir(), 'edge_cdp_flowchart_' + Date.now());
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=' + tmpUserData,
    'about:blank'
  ]);

  // Aguarda inicialização do Edge
  await new Promise(r => setTimeout(r, 2000));

  try {
    console.log('3. Conectando via CDP...');
    const versionRes = await fetch('http://127.0.0.1:9222/json/version');
    const versionData = await versionRes.json();
    console.log('Navegador conectado:', versionData.Browser);

    // Obtém a aba já aberta pelo Edge
    const listRes = await fetch('http://127.0.0.1:9222/json/list');
    const targets = await listRes.json();
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    const wsUrl = pageTarget.webSocketDebuggerUrl;

    console.log('4. Abrindo WebSocket de automação...');
    const ws = new WebSocket(wsUrl);

    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const { resolve, reject } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const reqId = id++;
        callbacks.set(reqId, { resolve, reject });
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    await new Promise((resolve) => ws.onopen = resolve);
    console.log('WebSocket CDP conectado!');

    await send('Page.enable');
    await send('DOM.enable');

    console.log('Navegando para o arquivo HTML...');
    const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
    await send('Page.navigate', { url: fileUrl });

    console.log('5. Aguardando renderização do Mermaid...');
    // Aguarda window.mermaidReady ser true
    let isReady = false;
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 500));
      const evalRes = await send('Runtime.evaluate', {
        expression: 'Boolean(window.mermaidReady && document.querySelector(".mermaid svg"))'
      });
      if (evalRes?.result?.value) {
        isReady = true;
        break;
      }
    }

    if (!isReady) {
      console.warn('Aviso: Timeout aguardando mermaidReady, prosseguindo com captura...');
    } else {
      console.log('Mermaid renderizado com sucesso!');
    }

    // Calcula dimensões do documento
    const dimensionsRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const body = document.body;
        const rect = body.getBoundingClientRect();
        return {
          width: Math.ceil(rect.width),
          height: Math.ceil(rect.height),
          scrollWidth: body.scrollWidth,
          scrollHeight: body.scrollHeight
        };
      })()`,
      returnByValue: true
    });

    const dims = dimensionsRes?.result?.value || { width: 1600, height: 3200 };
    const finalWidth = Math.max(dims.width, dims.scrollWidth || 0, 1500) + 40;
    const finalHeight = Math.max(dims.height, dims.scrollHeight || 0, 2000) + 40;

    console.log('6. Dimensões calculadas do fluxograma: ' + finalWidth + 'x' + finalHeight + 'px');

    // Define métricas com fator de escala 2x para nitidez Retina HD
    await send('Emulation.setDeviceMetricsOverride', {
      width: finalWidth,
      height: finalHeight,
      deviceScaleFactor: 2,
      mobile: false
    });

    await new Promise(r => setTimeout(r, 1000));

    console.log('7. Capturando imagem PNG em alta definição...');
    const screenshotRes = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true
    });

    const buffer = Buffer.from(screenshotRes.data, 'base64');
    fs.writeFileSync(pngPath, buffer);
    console.log('8. Sucesso! Imagem salva em: ' + pngPath + ' (' + (buffer.length / 1024 / 1024).toFixed(2) + ' MB)');

    ws.close();
  } catch (err) {
    console.error('Erro durante a geração:', err);
  } finally {
    edge.kill();
    try {
      fs.unlinkSync(htmlPath);
    } catch (_) {}
  }
}

main();
