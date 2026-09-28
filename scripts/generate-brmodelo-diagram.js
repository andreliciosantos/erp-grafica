const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>brModelo - Modelo Conceitual e Lógico (DER) - ERP Gráfica Modular</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background-color: #f1f5f9;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 30px;
      display: inline-block;
      min-width: 2200px;
    }
    .brmodelo-window {
      background: #ffffff;
      border: 2px solid #cbd5e1;
      border-radius: 12px;
      box-shadow: 0 20px 40px -10px rgba(0,0,0,0.15);
      overflow: hidden;
    }
    .window-titlebar {
      background: linear-gradient(90deg, #1e293b 0%, #334155 100%);
      color: #ffffff;
      padding: 16px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
    }
    .window-title {
      font-size: 20px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .window-badge {
      background: #38bdf8;
      color: #0f172a;
      font-size: 11px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .window-subtitle {
      font-size: 14px;
      color: #94a3b8;
    }
    .toolbar-info {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 12px 28px;
      display: flex;
      gap: 24px;
      font-size: 13px;
      color: #475569;
    }
    .toolbar-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .toolbar-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .canvas-container {
      background-color: #ffffff;
      background-image: 
        linear-gradient(to right, #f1f5f9 1px, transparent 1px),
        linear-gradient(to bottom, #f1f5f9 1px, transparent 1px);
      background-size: 20px 20px;
      position: relative;
      padding: 40px;
    }
    svg {
      display: block;
    }
    .footer-bar {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 14px 28px;
      font-size: 13px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>

<div class="brmodelo-window">
  <div class="window-titlebar">
    <div class="window-title">
      <span>📐 brModelo — Diagrama Entidade-Relacionamento (DER Conceitual & Lógico)</span>
      <span class="window-badge">Notação Peter Chen Estendida</span>
    </div>
    <div class="window-subtitle">
      ERP Gráfica Modular • Projeto de Banco de Dados Relacional PostgreSQL / Prisma
    </div>
  </div>

  <div class="toolbar-info">
    <div class="toolbar-item">
      <span class="toolbar-dot" style="background:#3b82f6;"></span>
      <strong>Entidades:</strong> 15 Tabelas Modeladas
    </div>
    <div class="toolbar-item">
      <span class="toolbar-dot" style="background:#f59e0b;"></span>
      <strong>Relacionamentos:</strong> 17 Vínculos com Losangos e Cardinalidades (0,1), (1,1), (0,n), (1,n)
    </div>
    <div class="toolbar-item">
      <span class="toolbar-dot" style="background:#10b981;"></span>
      <strong>Chaves:</strong> [PK] Primária | [FK] Estrangeira | [UK] Unicidade
    </div>
    <div class="toolbar-item">
      <span class="toolbar-dot" style="background:#8b5cf6;"></span>
      <strong>Precisão Gráfica:</strong> Decimal(12,4) para Insumos e Decimal(12,2) para Financeiro
    </div>
  </div>

  <div class="canvas-container">
    <svg width="2100" height="1950" viewBox="0 0 2100 1950" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Filtro de sombra suave -->
        <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.10"/>
        </filter>
      </defs>

      <!-- ============================================================
           ZONAS AGRUPADORAS EM CORES SUAVES
           ============================================================ -->
      <!-- Zona 1: Comercial -->
      <rect x="30" y="30" width="1020" height="660" rx="16" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1.5" stroke-dasharray="6 4"/>
      <text x="50" y="58" font-family="'Segoe UI', sans-serif" font-size="13" font-weight="700" fill="#1d4ed8" letter-spacing="1">EIXO 1: COMERCIAL, CLIENTES E ENGENHARIA DE ORÇAMENTOS</text>

      <!-- Zona 2: Almoxarifado / Estoque -->
      <rect x="1080" y="30" width="980" height="660" rx="16" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5" stroke-dasharray="6 4"/>
      <text x="1100" y="58" font-family="'Segoe UI', sans-serif" font-size="13" font-weight="700" fill="#15803d" letter-spacing="1">EIXO 2: ALMOXARIFADO, MATÉRIAS-PRIMAS E DESPESAS</text>

      <!-- Zona 3: Produção & PCP -->
      <rect x="30" y="730" width="1020" height="780" rx="16" fill="#faf5ff" stroke="#e9d5ff" stroke-width="1.5" stroke-dasharray="6 4"/>
      <text x="50" y="758" font-family="'Segoe UI', sans-serif" font-size="13" font-weight="700" fill="#7e22ce" letter-spacing="1">EIXO 3: PCP, CHÃO DE FÁBRICA, MÁQUINAS E APONTAMENTO</text>

      <!-- Zona 4: Financeiro & Apoio -->
      <rect x="1080" y="730" width="980" height="780" rx="16" fill="#fffbeb" stroke="#fde68a" stroke-width="1.5" stroke-dasharray="6 4"/>
      <text x="1100" y="758" font-family="'Segoe UI', sans-serif" font-size="13" font-weight="700" fill="#b45309" letter-spacing="1">EIXO 4: FATURAMENTO, RECEBÍVEIS E MODELOS RÁPIDOS</text>

      <!-- Zona 5: Recursos Humanos e Condições -->
      <rect x="30" y="1550" width="2030" height="360" rx="16" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="6 4"/>
      <text x="50" y="1578" font-family="'Segoe UI', sans-serif" font-size="13" font-weight="700" fill="#475569" letter-spacing="1">EIXO 5: RECURSOS HUMANOS (RH) E CONDIÇÕES COMERCIAIS GLOBAIS</text>

      <!-- ============================================================
           LINHAS DE CONEXÃO E CARDINALIDADES (BRMODELO)
           TODAS COM fill="none" PARA NÃO GERAR MANCHAS PRETAS!
           ============================================================ -->
      
      <!-- USUARIO (260, 200) <--> [EMITE] (410, 200) <--> ORCAMENTO (570, 200) -->
      <line x1="260" y1="200" x2="365" y2="200" stroke="#334155" stroke-width="2"/>
      <line x1="455" y1="200" x2="570" y2="200" stroke="#334155" stroke-width="2"/>
      <text x="270" y="190" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(1,1)</text>
      <text x="530" y="190" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(0,n)</text>

      <!-- PARCEIRO (840, 200) <--> [SOLICITA] (705, 200) <--> ORCAMENTO (570, 200) -->
      <line x1="840" y1="200" x2="755" y2="200" stroke="#334155" stroke-width="2"/>
      <line x1="655" y1="200" x2="570" y2="200" stroke="#334155" stroke-width="2"/>
      <text x="785" y="190" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(1,1)</text>
      <text x="600" y="190" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(0,n)</text>

      <!-- ORCAMENTO (570, 310) <--> [CONTEM] (570, 420) <--> ITEM_ORCAMENTO (570, 520) -->
      <line x1="570" y1="310" x2="570" y2="385" stroke="#334155" stroke-width="2"/>
      <line x1="570" y1="445" x2="570" y2="520" stroke="#334155" stroke-width="2"/>
      <text x="580" y="340" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(1,1)</text>
      <text x="580" y="505" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(1,n)</text>

      <!-- ITEM_ORCAMENTO (700, 580) <--> [UTILIZA] (920, 580) <--> MATERIA_PRIMA (1140, 310) -->
      <path d="M 700 580 L 875 580" fill="none" stroke="#334155" stroke-width="2"/>
      <path d="M 965 580 L 1140 580 L 1140 310" fill="none" stroke="#334155" stroke-width="2"/>
      <text x="710" y="570" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(0,n)</text>
      <text x="1105" y="335" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(0,1)</text>

      <!-- ORCAMENTO (470, 260) <--> [GERA] (360, 420) <--> ORDEM_SERVICO (360, 840) -->
      <path d="M 470 260 L 360 260 L 360 385" fill="none" stroke="#334155" stroke-width="2"/>
      <path d="M 360 445 L 360 840" fill="none" stroke="#334155" stroke-width="2"/>
      <text x="430" y="250" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(1,1)</text>
      <text x="370" y="825" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(0,1)</text>

      <!-- PARCEIRO (940, 310) <--> [CONTRATA] (710, 800) <--> ORDEM_SERVICO (480, 860) -->
      <path d="M 940 310 L 940 800 L 765 800" fill="none" stroke="#334155" stroke-width="2"/>
      <path d="M 655 800 L 480 800 L 480 840" fill="none" stroke="#334155" stroke-width="2"/>
      <text x="950" y="340" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(1,1)</text>
      <text x="490" y="825" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(0,n)</text>

      <!-- ORDEM_SERVICO (360, 1100) <--> [DIVIDIDA] (360, 1190) <--> ETAPA_OS (360, 1270) -->
      <line x1="360" y1="1100" x2="360" y2="1165" stroke="#334155" stroke-width="2"/>
      <line x1="360" y1="1215" x2="360" y2="1270" stroke="#334155" stroke-width="2"/>
      <text x="370" y="1130" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(1,1)</text>
      <text x="370" y="1255" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(1,n)</text>

      <!-- ETAPA_OS (480, 1340) <--> [REGISTRA] (590, 1340) <--> APONTAMENTO_ETAPA (700, 1340) -->
      <line x1="480" y1="1340" x2="540" y2="1340" stroke="#334155" stroke-width="2"/>
      <line x1="640" y1="1340" x2="700" y2="1340" stroke="#334155" stroke-width="2"/>
      <text x="490" y="1330" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(1,1)</text>
      <text x="660" y="1330" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(0,n)</text>

      <!-- USUARIO (150, 310) <--> [EXECUTA] (150, 1420) <--> APONTAMENTO_ETAPA (700, 1420) -->
      <path d="M 150 310 L 150 1420 L 590 1420" fill="none" stroke="#334155" stroke-width="2"/>
      <line x1="635" y1="1420" x2="700" y2="1420" stroke="#334155" stroke-width="2"/>
      <text x="160" y="340" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(1,1)</text>
      <text x="655" y="1410" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(0,n)</text>

      <!-- MAQUINA (830, 1220) <--> [ALOCA] (830, 1270) <--> APONTAMENTO_ETAPA (830, 1320) -->
      <line x1="830" y1="1220" x2="830" y2="1245" stroke="#334155" stroke-width="2"/>
      <line x1="830" y1="1295" x2="830" y2="1320" stroke="#334155" stroke-width="2"/>
      <text x="840" y="1235" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(0,1)</text>
      <text x="840" y="1310" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(0,n)</text>

      <!-- ORDEM_SERVICO (480, 890) <--> [BAIXA] (610, 890) <--> MOVIMENTACAO_ESTOQUE (740, 890) -->
      <line x1="480" y1="890" x2="565" y2="890" stroke="#334155" stroke-width="2"/>
      <line x1="655" y1="890" x2="740" y2="890" stroke="#334155" stroke-width="2"/>
      <text x="490" y="880" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(0,1)</text>
      <text x="700" y="880" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(0,n)</text>

      <!-- MATERIA_PRIMA (1250, 310) <--> [MOVIMENTA] (1250, 890) <--> MOVIMENTACAO_ESTOQUE (950, 890) -->
      <path d="M 1250 310 L 1250 890 L 1055 890" fill="none" stroke="#334155" stroke-width="2"/>
      <line x1="975" y1="890" x2="950" y2="890" stroke="#334155" stroke-width="2"/>
      <text x="1260" y="340" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(1,1)</text>
      <text x="960" y="880" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(0,n)</text>

      <!-- ORDEM_SERVICO (480, 960) <--> [FATURA] (1110, 960) <--> RECEBIVEL (1180, 960) -->
      <path d="M 480 960 L 1060 960" fill="none" stroke="#334155" stroke-width="2"/>
      <line x1="1155" y1="960" x2="1180" y2="960" stroke="#334155" stroke-width="2"/>
      <text x="500" y="950" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(0,1)</text>
      <text x="1155" y="950" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(0,n)</text>

      <!-- PARCEIRO (1040, 200) <--> [DEVEDOR] (1330, 770) <--> RECEBIVEL (1330, 860) -->
      <path d="M 1040 200 L 1330 200 L 1330 745" fill="none" stroke="#334155" stroke-width="2"/>
      <line x1="1330" y1="795" x2="1330" y2="860" stroke="#334155" stroke-width="2"/>
      <text x="1055" y="190" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(1,1)</text>
      <text x="1340" y="840" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(0,n)</text>

      <!-- PARCEIRO (1040, 150) <--> [CREDOR] (1530, 150) <--> DESPESA_OPERACIONAL (1630, 150) -->
      <line x1="1040" y1="150" x2="1485" y2="150" stroke="#334155" stroke-width="2"/>
      <line x1="1575" y1="150" x2="1630" y2="150" stroke="#334155" stroke-width="2"/>
      <text x="1055" y="140" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(0,1)</text>
      <text x="1590" y="140" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(0,n)</text>

      <!-- MATERIA_PRIMA (1360, 250) <--> [SUGERIDA] (1680, 500) <--> MODELO_PRODUTO (1680, 860) -->
      <path d="M 1360 250 L 1680 250 L 1680 475" fill="none" stroke="#334155" stroke-width="2"/>
      <line x1="1680" y1="525" x2="1680" y2="860" stroke="#334155" stroke-width="2"/>
      <text x="1370" y="240" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(0,1)</text>
      <text x="1690" y="840" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#dc2626">(0,n)</text>


      <!-- ============================================================
           LOSANGOS DE RELACIONAMENTO (ESTILO CLÁSSICO BRMODELO)
           ============================================================ -->
      
      <!-- [EMITE] -->
      <g transform="translate(410, 200)">
        <polygon points="0,-22 45,0 0,22 -45,0" fill="#fef08a" stroke="#ca8a04" stroke-width="1.8" filter="url(#shadow)"/>
        <text x="0" y="4" font-family="'Segoe UI', sans-serif" font-size="10" font-weight="800" fill="#854d0e" text-anchor="middle">EMITE</text>
      </g>

      <!-- [SOLICITA] -->
      <g transform="translate(705, 200)">
        <polygon points="0,-22 48,0 0,22 -48,0" fill="#fef08a" stroke="#ca8a04" stroke-width="1.8" filter="url(#shadow)"/>
        <text x="0" y="4" font-family="'Segoe UI', sans-serif" font-size="10" font-weight="800" fill="#854d0e" text-anchor="middle">SOLICITA</text>
      </g>

      <!-- [CONTEM] -->
      <g transform="translate(570, 415)">
        <polygon points="0,-22 45,0 0,22 -45,0" fill="#fef08a" stroke="#ca8a04" stroke-width="1.8" filter="url(#shadow)"/>
        <text x="0" y="4" font-family="'Segoe UI', sans-serif" font-size="10" font-weight="800" fill="#854d0e" text-anchor="middle">CONTÉM</text>
      </g>

      <!-- [UTILIZA] -->
      <g transform="translate(920, 580)">
        <polygon points="0,-22 45,0 0,22 -45,0" fill="#fef08a" stroke="#ca8a04" stroke-width="1.8" filter="url(#shadow)"/>
        <text x="0" y="4" font-family="'Segoe UI', sans-serif" font-size="10" font-weight="800" fill="#854d0e" text-anchor="middle">UTILIZA</text>
      </g>

      <!-- [GERA] -->
      <g transform="translate(360, 415)">
        <polygon points="0,-22 40,0 0,22 -40,0" fill="#fef08a" stroke="#ca8a04" stroke-width="1.8" filter="url(#shadow)"/>
        <text x="0" y="4" font-family="'Segoe UI', sans-serif" font-size="10" font-weight="800" fill="#854d0e" text-anchor="middle">GERA</text>
      </g>

      <!-- [CONTRATA] -->
      <g transform="translate(710, 800)">
        <polygon points="0,-22 52,0 0,22 -52,0" fill="#fef08a" stroke="#ca8a04" stroke-width="1.8" filter="url(#shadow)"/>
        <text x="0" y="4" font-family="'Segoe UI', sans-serif" font-size="10" font-weight="800" fill="#854d0e" text-anchor="middle">CONTRATA</text>
      </g>

      <!-- [DIVIDIDA] -->
      <g transform="translate(360, 1190)">
        <polygon points="0,-22 52,0 0,22 -52,0" fill="#fef08a" stroke="#ca8a04" stroke-width="1.8" filter="url(#shadow)"/>
        <text x="0" y="4" font-family="'Segoe UI', sans-serif" font-size="10" font-weight="800" fill="#854d0e" text-anchor="middle">DIVIDIDA</text>
      </g>

      <!-- [REGISTRA] -->
      <g transform="translate(590, 1340)">
        <polygon points="0,-22 48,0 0,22 -48,0" fill="#fef08a" stroke="#ca8a04" stroke-width="1.8" filter="url(#shadow)"/>
        <text x="0" y="4" font-family="'Segoe UI', sans-serif" font-size="10" font-weight="800" fill="#854d0e" text-anchor="middle">REGISTRA</text>
      </g>

      <!-- [EXECUTA] -->
      <g transform="translate(610, 1420)">
        <polygon points="0,-20 45,0 0,20 -45,0" fill="#fef08a" stroke="#ca8a04" stroke-width="1.8" filter="url(#shadow)"/>
        <text x="0" y="4" font-family="'Segoe UI', sans-serif" font-size="10" font-weight="800" fill="#854d0e" text-anchor="middle">EXECUTA</text>
      </g>

      <!-- [ALOCA] -->
      <g transform="translate(830, 1270)">
        <polygon points="0,-22 42,0 0,22 -42,0" fill="#fef08a" stroke="#ca8a04" stroke-width="1.8" filter="url(#shadow)"/>
        <text x="0" y="4" font-family="'Segoe UI', sans-serif" font-size="10" font-weight="800" fill="#854d0e" text-anchor="middle">ALOCA</text>
      </g>

      <!-- [BAIXA] -->
      <g transform="translate(610, 890)">
        <polygon points="0,-22 45,0 0,22 -45,0" fill="#fef08a" stroke="#ca8a04" stroke-width="1.8" filter="url(#shadow)"/>
        <text x="0" y="4" font-family="'Segoe UI', sans-serif" font-size="10" font-weight="800" fill="#854d0e" text-anchor="middle">BAIXA</text>
      </g>

      <!-- [MOVIMENTA] -->
      <g transform="translate(1015, 890)">
        <polygon points="0,-22 55,0 0,22 -55,0" fill="#fef08a" stroke="#ca8a04" stroke-width="1.8" filter="url(#shadow)"/>
        <text x="0" y="4" font-family="'Segoe UI', sans-serif" font-size="9" font-weight="800" fill="#854d0e" text-anchor="middle">MOVIMENTA</text>
      </g>

      <!-- [FATURA] -->
      <g transform="translate(1110, 960)">
        <polygon points="0,-22 46,0 0,22 -46,0" fill="#fef08a" stroke="#ca8a04" stroke-width="1.8" filter="url(#shadow)"/>
        <text x="0" y="4" font-family="'Segoe UI', sans-serif" font-size="10" font-weight="800" fill="#854d0e" text-anchor="middle">FATURA</text>
      </g>

      <!-- [DEVEDOR] -->
      <g transform="translate(1330, 770)">
        <polygon points="0,-22 50,0 0,22 -50,0" fill="#fef08a" stroke="#ca8a04" stroke-width="1.8" filter="url(#shadow)"/>
        <text x="0" y="4" font-family="'Segoe UI', sans-serif" font-size="10" font-weight="800" fill="#854d0e" text-anchor="middle">DEVEDOR</text>
      </g>

      <!-- [CREDOR] -->
      <g transform="translate(1530, 150)">
        <polygon points="0,-22 46,0 0,22 -46,0" fill="#fef08a" stroke="#ca8a04" stroke-width="1.8" filter="url(#shadow)"/>
        <text x="0" y="4" font-family="'Segoe UI', sans-serif" font-size="10" font-weight="800" fill="#854d0e" text-anchor="middle">CREDOR</text>
      </g>

      <!-- [SUGERIDA] -->
      <g transform="translate(1680, 500)">
        <polygon points="0,-22 52,0 0,22 -52,0" fill="#fef08a" stroke="#ca8a04" stroke-width="1.8" filter="url(#shadow)"/>
        <text x="0" y="4" font-family="'Segoe UI', sans-serif" font-size="10" font-weight="800" fill="#854d0e" text-anchor="middle">SUGERIDA</text>
      </g>


      <!-- ============================================================
           ENTIDADES (RETÂNGULOS ESTILO BRMODELO COM CABEÇALHO)
           ============================================================ -->

      <!-- 1. USUARIO (users) -->
      <g transform="translate(60, 110)" filter="url(#shadow)">
        <rect width="200" height="200" rx="8" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
        <path d="M 0 8 Q 0 0 8 0 L 192 0 Q 200 0 200 8 L 200 32 L 0 32 Z" fill="#1e293b"/>
        <text x="100" y="21" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">USUARIO (users)</text>
        <text x="12" y="52" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#b91c1c">🔑 id : VARCHAR(36) [PK]</text>
        <text x="12" y="72" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• name : VARCHAR(255)</text>
        <text x="12" y="92" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="600" fill="#0369a1">• email : VARCHAR(255) [UK]</text>
        <text x="12" y="112" font-family="'Segoe UI', sans-serif" font-size="11" fill="#64748b">• passwordHash : VARCHAR</text>
        <text x="12" y="132" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• role : Enum(Role)</text>
        <text x="12" y="152" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• isActive : BOOLEAN</text>
        <text x="12" y="172" font-family="'Segoe UI', sans-serif" font-size="11" fill="#64748b">• createdAt : TIMESTAMP</text>
      </g>

      <!-- 2. PARCEIRO (parties) -->
      <g transform="translate(840, 110)" filter="url(#shadow)">
        <rect width="200" height="200" rx="8" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
        <path d="M 0 8 Q 0 0 8 0 L 192 0 Q 200 0 200 8 L 200 32 L 0 32 Z" fill="#1e293b"/>
        <text x="100" y="21" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">PARCEIRO (parties)</text>
        <text x="12" y="52" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#b91c1c">🔑 id : VARCHAR(36) [PK]</text>
        <text x="12" y="72" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• type : Enum(PartyType)</text>
        <text x="12" y="92" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• name : VARCHAR(255)</text>
        <text x="12" y="112" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="600" fill="#0369a1">• document : VARCHAR [UK]</text>
        <text x="12" y="132" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• phone : VARCHAR(50)</text>
        <text x="12" y="152" font-family="'Segoe UI', sans-serif" font-size="11" fill="#16a34a">• isCustomer : BOOLEAN</text>
        <text x="12" y="172" font-family="'Segoe UI', sans-serif" font-size="11" fill="#ea580c">• isSupplier : BOOLEAN</text>
      </g>

      <!-- 3. ORCAMENTO (quotes) -->
      <g transform="translate(470, 110)" filter="url(#shadow)">
        <rect width="200" height="200" rx="8" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
        <path d="M 0 8 Q 0 0 8 0 L 192 0 Q 200 0 200 8 L 200 32 L 0 32 Z" fill="#1d4ed8"/>
        <text x="100" y="21" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">ORCAMENTO (quotes)</text>
        <text x="12" y="52" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#b91c1c">🔑 id : VARCHAR(36) [PK]</text>
        <text x="12" y="72" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="600" fill="#0369a1">• code : SERIAL [UK]</text>
        <text x="12" y="92" font-family="'Segoe UI', sans-serif" font-size="11" fill="#4338ca">🔗 partyId : VARCHAR [FK]</text>
        <text x="12" y="112" font-family="'Segoe UI', sans-serif" font-size="11" fill="#4338ca">🔗 userId : VARCHAR [FK]</text>
        <text x="12" y="132" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• status : Enum(QuoteStatus)</text>
        <text x="12" y="152" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• markupApplied : DECIMAL</text>
        <text x="12" y="172" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#15803d">• totalAmount : DECIMAL(12,2)</text>
      </g>

      <!-- 4. ITEM_ORCAMENTO (quote_items) -->
      <g transform="translate(470, 520)" filter="url(#shadow)">
        <rect width="230" height="150" rx="8" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
        <path d="M 0 8 Q 0 0 8 0 L 222 0 Q 230 0 230 8 L 230 30 L 0 30 Z" fill="#2563eb"/>
        <text x="115" y="20" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">ITEM_ORCAMENTO</text>
        <text x="12" y="48" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#b91c1c">🔑 id : VARCHAR(36) [PK]</text>
        <text x="12" y="66" font-family="'Segoe UI', sans-serif" font-size="11" fill="#4338ca">🔗 quoteId : VARCHAR [FK-Cascade]</text>
        <text x="12" y="84" font-family="'Segoe UI', sans-serif" font-size="11" fill="#4338ca">🔗 rawMaterialId : VARCHAR [FK]</text>
        <text x="12" y="102" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• productName : VARCHAR</text>
        <text x="12" y="120" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• sheetsRequired : INT</text>
        <text x="12" y="138" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#15803d">• itemTotalAmount : DECIMAL</text>
      </g>

      <!-- 5. MATERIA_PRIMA (raw_materials) -->
      <g transform="translate(1140, 110)" filter="url(#shadow)">
        <rect width="220" height="200" rx="8" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
        <path d="M 0 8 Q 0 0 8 0 L 212 0 Q 220 0 220 8 L 220 32 L 0 32 Z" fill="#15803d"/>
        <text x="110" y="21" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">MATERIA_PRIMA</text>
        <text x="12" y="52" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#b91c1c">🔑 id : VARCHAR(36) [PK]</text>
        <text x="12" y="72" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• name : VARCHAR(255)</text>
        <text x="12" y="92" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• category : RawMaterialCat</text>
        <text x="12" y="112" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• costPerUnit : DECIMAL(12,4)</text>
        <text x="12" y="132" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#047857">• currentStock : DECIMAL(12,4)</text>
        <text x="12" y="152" font-family="'Segoe UI', sans-serif" font-size="11" fill="#dc2626">• minStock : DECIMAL(12,4)</text>
        <text x="12" y="172" font-family="'Segoe UI', sans-serif" font-size="11" fill="#475569">• sheetWidthMm / HeightMm</text>
      </g>

      <!-- 6. DESPESA_OPERACIONAL (operating_expenses) -->
      <g transform="translate(1630, 110)" filter="url(#shadow)">
        <rect width="210" height="200" rx="8" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
        <path d="M 0 8 Q 0 0 8 0 L 202 0 Q 210 0 210 8 L 210 32 L 0 32 Z" fill="#b45309"/>
        <text x="105" y="21" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">DESPESA_OPERACIONAL</text>
        <text x="12" y="52" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#b91c1c">🔑 id : VARCHAR(36) [PK]</text>
        <text x="12" y="72" font-family="'Segoe UI', sans-serif" font-size="11" fill="#4338ca">🔗 supplierId : VARCHAR [FK]</text>
        <text x="12" y="92" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• description : VARCHAR</text>
        <text x="12" y="112" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• category : ExpenseCategory</text>
        <text x="12" y="132" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#b91c1c">• amount : DECIMAL(12,2)</text>
        <text x="12" y="152" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• dueDate / competenceDate</text>
        <text x="12" y="172" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• status : PaymentStatus</text>
      </g>

      <!-- 7. ORDEM_SERVICO (work_orders) -->
      <g transform="translate(240, 840)" filter="url(#shadow)">
        <rect width="240" height="260" rx="8" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
        <path d="M 0 8 Q 0 0 8 0 L 232 0 Q 240 0 240 8 L 240 32 L 0 32 Z" fill="#7e22ce"/>
        <text x="120" y="21" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">ORDEM_SERVICO (work_orders)</text>
        <text x="12" y="52" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#b91c1c">🔑 id : VARCHAR(36) [PK]</text>
        <text x="12" y="72" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="600" fill="#0369a1">• orderNumber : VARCHAR [UK]</text>
        <text x="12" y="92" font-family="'Segoe UI', sans-serif" font-size="11" fill="#4338ca">🔗 quoteId : VARCHAR [FK, UK]</text>
        <text x="12" y="112" font-family="'Segoe UI', sans-serif" font-size="11" fill="#4338ca">🔗 partyId : VARCHAR [FK]</text>
        <text x="12" y="132" font-family="'Segoe UI', sans-serif" font-size="11" fill="#4338ca">🔗 userId : VARCHAR [FK]</text>
        <text x="12" y="152" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="600" fill="#0369a1">• barcode : VARCHAR [UK]</text>
        <text x="12" y="172" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#7e22ce">• status : WorkOrderStatus</text>
        <text x="12" y="192" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• priority : INT (1..4)</text>
        <text x="12" y="212" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• deliveryDate : TIMESTAMP</text>
        <text x="12" y="232" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#15803d">• totalAmount : DECIMAL(12,2)</text>
        <text x="12" y="250" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• paymentStatus : PaymentStat</text>
      </g>

      <!-- 8. MOVIMENTACAO_ESTOQUE (stock_movements) -->
      <g transform="translate(740, 840)" filter="url(#shadow)">
        <rect width="210" height="160" rx="8" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
        <path d="M 0 8 Q 0 0 8 0 L 202 0 Q 210 0 210 8 L 210 32 L 0 32 Z" fill="#059669"/>
        <text x="105" y="21" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">MOVIMENTACAO_ESTOQUE</text>
        <text x="12" y="52" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#b91c1c">🔑 id : VARCHAR(36) [PK]</text>
        <text x="12" y="72" font-family="'Segoe UI', sans-serif" font-size="11" fill="#4338ca">🔗 rawMaterialId : VARCHAR [FK]</text>
        <text x="12" y="92" font-family="'Segoe UI', sans-serif" font-size="11" fill="#4338ca">🔗 workOrderId : VARCHAR [FK]</text>
        <text x="12" y="112" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#047857">• quantity : DECIMAL(12,4)</text>
        <text x="12" y="132" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• reason : VARCHAR(100)</text>
        <text x="12" y="150" font-family="'Segoe UI', sans-serif" font-size="11" fill="#64748b">• createdAt : TIMESTAMP</text>
      </g>

      <!-- 9. RECEBIVEL (receivables) -->
      <g transform="translate(1180, 860)" filter="url(#shadow)">
        <rect width="220" height="200" rx="8" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
        <path d="M 0 8 Q 0 0 8 0 L 212 0 Q 220 0 220 8 L 220 32 L 0 32 Z" fill="#d97706"/>
        <text x="110" y="21" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">RECEBIVEL (receivables)</text>
        <text x="12" y="52" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#b91c1c">🔑 id : VARCHAR(36) [PK]</text>
        <text x="12" y="72" font-family="'Segoe UI', sans-serif" font-size="11" fill="#4338ca">🔗 workOrderId : VARCHAR [FK-SetNull]</text>
        <text x="12" y="92" font-family="'Segoe UI', sans-serif" font-size="11" fill="#4338ca">🔗 partyId : VARCHAR [FK]</text>
        <text x="12" y="112" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• installmentNumber / Total</text>
        <text x="12" y="132" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#15803d">• amount : DECIMAL(12,2)</text>
        <text x="12" y="152" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• dueDate / paidAt</text>
        <text x="12" y="172" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• status : PaymentStatus</text>
        <text x="12" y="190" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• paymentMethod : Method</text>
      </g>

      <!-- 10. MODELO_PRODUTO (product_templates) -->
      <g transform="translate(1570, 860)" filter="url(#shadow)">
        <rect width="220" height="200" rx="8" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
        <path d="M 0 8 Q 0 0 8 0 L 212 0 Q 220 0 220 8 L 220 32 L 0 32 Z" fill="#0284c7"/>
        <text x="110" y="21" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">MODELO_PRODUTO</text>
        <text x="12" y="52" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#b91c1c">🔑 id : VARCHAR(36) [PK]</text>
        <text x="12" y="72" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• name : VARCHAR(255)</text>
        <text x="12" y="92" font-family="'Segoe UI', sans-serif" font-size="11" fill="#4338ca">🔗 defaultRawMaterialId [FK]</text>
        <text x="12" y="112" font-family="'Segoe UI', sans-serif" font-size="11" fill="#4338ca">🔗 defaultMachineId [FK]</text>
        <text x="12" y="132" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• defaultMarkupPercent</text>
        <text x="12" y="152" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• defaultWidthMm / HeightMm</text>
        <text x="12" y="172" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• isActive : BOOLEAN</text>
      </g>

      <!-- 11. ETAPA_OS (work_order_stages) -->
      <g transform="translate(260, 1270)" filter="url(#shadow)">
        <rect width="220" height="150" rx="8" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
        <path d="M 0 8 Q 0 0 8 0 L 212 0 Q 220 0 220 8 L 220 30 L 0 30 Z" fill="#6b21a8"/>
        <text x="110" y="20" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">ETAPA_OS (stages)</text>
        <text x="12" y="48" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#b91c1c">🔑 id : VARCHAR(36) [PK]</text>
        <text x="12" y="68" font-family="'Segoe UI', sans-serif" font-size="11" fill="#4338ca">🔗 workOrderId : VARCHAR [FK-Cascade]</text>
        <text x="12" y="88" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#334155">• stepOrder : INT (1..5)</text>
        <text x="12" y="108" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• name : VARCHAR(100)</text>
        <text x="12" y="128" font-family="'Segoe UI', sans-serif" font-size="11" fill="#7e22ce">• status : StageStatus</text>
      </g>

      <!-- 12. APONTAMENTO_ETAPA (stage_execution_logs) -->
      <g transform="translate(700, 1320)" filter="url(#shadow)">
        <rect width="210" height="160" rx="8" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
        <path d="M 0 8 Q 0 0 8 0 L 202 0 Q 210 0 210 8 L 210 30 L 0 30 Z" fill="#4c1d95"/>
        <text x="105" y="20" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">APONTAMENTO_ETAPA</text>
        <text x="12" y="48" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#b91c1c">🔑 id : VARCHAR(36) [PK]</text>
        <text x="12" y="68" font-family="'Segoe UI', sans-serif" font-size="11" fill="#4338ca">🔗 stageId : VARCHAR [FK]</text>
        <text x="12" y="88" font-family="'Segoe UI', sans-serif" font-size="11" fill="#4338ca">🔗 operatorId : VARCHAR [FK]</text>
        <text x="12" y="108" font-family="'Segoe UI', sans-serif" font-size="11" fill="#4338ca">🔗 machineId : VARCHAR [FK]</text>
        <text x="12" y="128" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• startedAt / finishedAt</text>
        <text x="12" y="146" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#dc2626">• wasteQuantity : INT (Refugo)</text>
      </g>

      <!-- 13. MAQUINA (machines) -->
      <g transform="translate(730, 1060)" filter="url(#shadow)">
        <rect width="200" height="160" rx="8" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
        <path d="M 0 8 Q 0 0 8 0 L 192 0 Q 200 0 200 8 L 200 30 L 0 30 Z" fill="#0f766e"/>
        <text x="100" y="20" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">MAQUINA (machines)</text>
        <text x="12" y="48" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#b91c1c">🔑 id : VARCHAR(36) [PK]</text>
        <text x="12" y="68" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• name : VARCHAR(255)</text>
        <text x="12" y="88" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#047857">• hourlyRate : DECIMAL(10,2)</text>
        <text x="12" y="108" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• setupMinutes : INT (15m)</text>
        <text x="12" y="128" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• maxSheetsHour : INT</text>
        <text x="12" y="148" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• isActive : BOOLEAN</text>
      </g>

      <!-- 14. COLABORADOR (employees) -->
      <g transform="translate(60, 1630)" filter="url(#shadow)">
        <rect width="230" height="230" rx="8" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
        <path d="M 0 8 Q 0 0 8 0 L 222 0 Q 230 0 230 8 L 230 32 L 0 32 Z" fill="#334155"/>
        <text x="115" y="21" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">COLABORADOR (employees)</text>
        <text x="12" y="52" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#b91c1c">🔑 id : VARCHAR(36) [PK]</text>
        <text x="12" y="72" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• name : VARCHAR(255)</text>
        <text x="12" y="92" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="600" fill="#0369a1">• document : VARCHAR [UK]</text>
        <text x="12" y="112" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="600" fill="#0369a1">• registration : VARCHAR [UK]</text>
        <text x="12" y="132" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• role : VARCHAR(100)</text>
        <text x="12" y="152" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• department : EmployeeDep</text>
        <text x="12" y="172" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• shift : WorkShift</text>
        <text x="12" y="192" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• monthlySalary : DECIMAL</text>
        <text x="12" y="212" font-family="'Segoe UI', sans-serif" font-size="11" fill="#047857">• hourlyRate : DECIMAL (R$/h)</text>
      </g>

      <!-- 15. CONDICAO_PAGAMENTO (payment_conditions) -->
      <g transform="translate(600, 1630)" filter="url(#shadow)">
        <rect width="230" height="230" rx="8" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
        <path d="M 0 8 Q 0 0 8 0 L 222 0 Q 230 0 230 8 L 230 32 L 0 32 Z" fill="#0f766e"/>
        <text x="115" y="21" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">CONDICAO_PAGAMENTO</text>
        <text x="12" y="52" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#b91c1c">🔑 id : VARCHAR(36) [PK]</text>
        <text x="12" y="72" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• name : VARCHAR(255)</text>
        <text x="12" y="92" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• installmentsCount : INT</text>
        <text x="12" y="112" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• downPaymentPercent : DEC</text>
        <text x="12" y="132" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• intervalDays : INT</text>
        <text x="12" y="152" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• dayOffsets : JSONB</text>
        <text x="12" y="172" font-family="'Segoe UI', sans-serif" font-size="11" fill="#16a34a">• isDefault : BOOLEAN</text>
        <text x="12" y="192" font-family="'Segoe UI', sans-serif" font-size="11" fill="#334155">• isActive : BOOLEAN</text>
      </g>

      <!-- NOTA DE LEGENDA BRMODELO -->
      <g transform="translate(1100, 1630)" filter="url(#shadow)">
        <rect width="900" height="230" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
        <path d="M 0 8 Q 0 0 8 0 L 892 0 Q 900 0 900 8 L 900 32 L 0 32 Z" fill="#334155"/>
        <text x="450" y="21" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">LEGENDA DA NOTAÇÃO BRMODELO & REGRAS DE INTEGRIDADE</text>
        <text x="24" y="60" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#1e293b">1. Cardinalidades nas Linhas de Relacionamento:</text>
        <text x="40" y="80" font-family="'Segoe UI', sans-serif" font-size="11" fill="#475569">• (1,1) : Participação Obrigatória Unária (ex: Toda OS pertence obrigatoriamente a exatamente 1 cliente).</text>
        <text x="40" y="98" font-family="'Segoe UI', sans-serif" font-size="11" fill="#475569">• (0,n) : Participação Opcional Múltipla (ex: Um cliente pode ter zero ou infinitas ordens de serviço).</text>
        <text x="40" y="116" font-family="'Segoe UI', sans-serif" font-size="11" fill="#475569">• (1,n) : Participação Obrigatória Múltipla (ex: Toda OS é dividida obrigatoriamente em pelo menos 1 etapa).</text>
        <text x="24" y="145" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#1e293b">2. Ações de Exclusão (ON DELETE):</text>
        <text x="40" y="165" font-family="'Segoe UI', sans-serif" font-size="11" fill="#b91c1c">• CASCADE: A exclusão do pai deleta os filhos (Quote -> QuoteItems | WorkOrder -> WorkOrderStages).</text>
        <text x="40" y="183" font-family="'Segoe UI', sans-serif" font-size="11" fill="#d97706">• SET NULL: A exclusão desvincula mas preserva o histórico contábil (WorkOrder -> Receivables).</text>
        <text x="40" y="201" font-family="'Segoe UI', sans-serif" font-size="11" fill="#15803d">• RESTRICT: Protege registros mestres contra exclusão acidental se houver movimentações (Users, Parties).</text>
      </g>
    </svg>
  </div>

  <div class="footer-bar">
    <span>Gerado para: ERP Gráfica Modular • Diretório: documentacao_humana</span>
    <span>brModelo v3.0 / brModelo Web Compatible • PostgreSQL 15+ Schema</span>
  </div>
</div>

</body>
</html>`;

async function main() {
  const rootDir = 'C:\\Users\\Micro\\Documents\\Projetos\\ERP_GRAFICA';
  const htmlPath = path.join(rootDir, 'brmodelo_temp.html');
  const pngPath = path.join(rootDir, 'documentacao_humana', 'brmodelo_diagrama_er.png');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  console.log('1. Escrevendo arquivo HTML com diagrama brModelo corrigido...');
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');

  console.log('2. Iniciando Edge Headless com DevTools Protocol...');
  const tmpUserData = path.join(os.tmpdir(), 'edge_cdp_brmodelo_' + Date.now());
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=' + tmpUserData,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    console.log('3. Conectando via CDP na porta 9224...');
    const versionRes = await fetch('http://127.0.0.1:9224/json/version');
    const versionData = await versionRes.json();
    console.log('Navegador conectado:', versionData.Browser);

    const listRes = await fetch('http://127.0.0.1:9224/json/list');
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

    await new Promise(r => setTimeout(r, 2500));

    const finalWidth = 2300;
    const finalHeight = 2200;

    console.log('5. Configurando viewport: ' + finalWidth + 'x' + finalHeight + 'px (Retina 2x)...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: finalWidth,
      height: finalHeight,
      deviceScaleFactor: 2,
      mobile: false
    });

    await new Promise(r => setTimeout(r, 1000));

    console.log('6. Capturando screenshot em alta definição PNG...');
    const screenshotRes = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true
    });

    const buffer = Buffer.from(screenshotRes.data, 'base64');
    fs.writeFileSync(pngPath, buffer);
    console.log('7. Sucesso absoluto! Imagem brModelo salva em: ' + pngPath + ' (' + (buffer.length / 1024 / 1024).toFixed(2) + ' MB)');

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
