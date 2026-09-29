const PptxGenJS = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

const pres = new PptxGenJS();

// Define Layout 16:9 Widescreen (13.333 x 7.5 inches)
pres.defineLayout({ name: 'WIDE_16_9', width: 13.333, height: 7.5 });
pres.layout = 'WIDE_16_9';

// Color Palette
const COLORS = {
  bgDark: '0F172A',      // Slate 900
  bgDarkAlt: '1E293B',   // Slate 800
  bgLight: 'F8FAFC',     // Slate 50
  cardBg: 'FFFFFF',      // White
  cardBorder: 'E2E8F0',  // Slate 200
  cardBorderDark: '334155', // Slate 700
  textDark: '0F172A',    // Slate 900
  textMuted: '64748B',   // Slate 500
  textLight: 'FFFFFF',   // White
  textLightMuted: '94A3B8', // Slate 400
  primary: '2563EB',     // Blue 600
  primaryDark: '1D4ED8', // Blue 700
  accent: '4F46E5',      // Indigo 600
  emerald: '10B981',     // Emerald 500
  amber: 'F59E0B',       // Amber 500
  cyan: '06B6D4',        // Cyan 500
};

// Helper: Common Header for Content Slides
function addSlideHeader(slide, category, title, subtitle, isDark = false) {
  // Category Badge Pill
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8,
    y: 0.45,
    w: 2.4,
    h: 0.32,
    rectRadius: 0.15,
    fill: { color: isDark ? '1E293B' : 'EFF6FF' },
    line: { color: isDark ? '3B82F6' : 'BFDBFE', width: 1 },
  });

  slide.addText(category.toUpperCase(), {
    x: 0.8,
    y: 0.45,
    w: 2.4,
    h: 0.32,
    fontSize: 9,
    fontFace: 'Arial',
    bold: true,
    color: isDark ? '60A5FA' : '2563EB',
    align: 'center',
    valign: 'middle',
  });

  // Main Title
  slide.addText(title, {
    x: 0.8,
    y: 0.85,
    w: 11.7,
    h: 0.5,
    fontSize: 22,
    fontFace: 'Arial',
    bold: true,
    color: isDark ? COLORS.textLight : COLORS.textDark,
  });

  // Subtitle
  slide.addText(subtitle, {
    x: 0.8,
    y: 1.35,
    w: 11.7,
    h: 0.35,
    fontSize: 12,
    fontFace: 'Arial',
    color: isDark ? COLORS.textLightMuted : COLORS.textMuted,
  });
}

// Helper: Common Footer
function addSlideFooter(slide, currentSlide, totalSlides, isDark = false) {
  // Line
  slide.addShape(pres.ShapeType.line, {
    x: 0.8,
    y: 6.95,
    w: 11.73,
    h: 0,
    line: { color: isDark ? '334155' : 'E2E8F0', width: 1 },
  });

  // Text
  slide.addText('ERP Gráfica Modular • Apresentação de MVP', {
    x: 0.8,
    y: 7.02,
    w: 6.0,
    h: 0.3,
    fontSize: 9,
    fontFace: 'Arial',
    color: isDark ? '64748B' : '94A3B8',
    valign: 'middle',
  });

  // Slide Number
  slide.addText(`${currentSlide} / ${totalSlides}`, {
    x: 10.5,
    y: 7.02,
    w: 2.03,
    h: 0.3,
    fontSize: 9,
    fontFace: 'Arial',
    bold: true,
    color: isDark ? '64748B' : '94A3B8',
    align: 'right',
    valign: 'middle',
  });
}

// Helper: Card Container
function addCard(slide, x, y, w, h, isDark = false) {
  slide.addShape(pres.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.12,
    fill: { color: isDark ? COLORS.bgDarkAlt : COLORS.cardBg },
    line: { color: isDark ? COLORS.cardBorderDark : COLORS.cardBorder, width: 1 },
  });
}

// Helper: Image with styled frame
function addScreenshot(slide, imagePath, x, y, w, h) {
  // Frame background / border
  slide.addShape(pres.ShapeType.roundRect, {
    x: x - 0.08,
    y: y - 0.08,
    w: w + 0.16,
    h: h + 0.16,
    rectRadius: 0.1,
    fill: { color: 'FFFFFF' },
    line: { color: 'CBD5E1', width: 1.5 },
  });

  slide.addImage({
    path: imagePath,
    x,
    y,
    w,
    h,
  });
}

const TOTAL_SLIDES = 10;

// ==========================================
// SLIDE 1: CAPA (HERO DARK)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.bgDark };

  // Decorative top banner bar
  slide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.15,
    fill: { color: COLORS.primary },
    line: { color: COLORS.primary },
  });

  // Top Badge
  slide.addShape(pres.ShapeType.roundRect, {
    x: 1.0,
    y: 1.1,
    w: 3.2,
    h: 0.38,
    rectRadius: 0.19,
    fill: { color: '1E293B' },
    line: { color: '3B82F6', width: 1.5 },
  });

  slide.addText('🖨️  MVP SHOWCASE • INDÚSTRIA GRÁFICA', {
    x: 1.0,
    y: 1.1,
    w: 3.2,
    h: 0.38,
    fontSize: 10,
    fontFace: 'Arial',
    bold: true,
    color: '60A5FA',
    align: 'center',
    valign: 'middle',
  });

  // Main Title
  slide.addText('ERP Gráfica Modular', {
    x: 1.0,
    y: 1.7,
    w: 11.3,
    h: 1.1,
    fontSize: 44,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.textLight,
  });

  // Subtitle
  slide.addText(
    'Plataforma Especializada de Gestão & Engenharia para a Indústria Gráfica:\nDa Imposição e Corte de Folha ao DRE em Tempo Real',
    {
      x: 1.0,
      y: 2.85,
      w: 11.3,
      h: 0.9,
      fontSize: 18,
      fontFace: 'Arial',
      color: COLORS.textLightMuted,
      lineSpacingMultiple: 1.2,
    }
  );

  // 3 Feature Highlight Cards
  const cards = [
    {
      title: '📐 Engenharia & Imposição',
      desc: 'Cálculo algorítmico do aproveitamento de folha (90° e direto) com sangrias e pinças.',
      color: '2563EB',
    },
    {
      title: '⚙️ PCP & Chão de Fábrica',
      desc: 'Quadro Kanban com máquina de estados rigorosa e baixa automática de estoque na impressão.',
      color: '10B981',
    },
    {
      title: '📊 DRE & Saúde Financeira',
      desc: 'DRE gerencial instantâneo, margem de contribuição e contas a receber integrados.',
      color: 'F59E0B',
    },
  ];

  cards.forEach((c, idx) => {
    const cardX = 1.0 + idx * 3.85;
    const cardY = 4.0;
    const cardW = 3.6;
    const cardH = 1.6;

    slide.addShape(pres.ShapeType.roundRect, {
      x: cardX,
      y: cardY,
      w: cardW,
      h: cardH,
      rectRadius: 0.12,
      fill: { color: '1E293B' },
      line: { color: '334155', width: 1 },
    });

    slide.addShape(pres.ShapeType.rect, {
      x: cardX,
      y: cardY,
      w: cardW,
      h: 0.08,
      fill: { color: c.color },
      line: { color: c.color },
    });

    slide.addText(c.title, {
      x: cardX + 0.25,
      y: cardY + 0.2,
      w: cardW - 0.5,
      h: 0.35,
      fontSize: 13,
      fontFace: 'Arial',
      bold: true,
      color: COLORS.textLight,
    });

    slide.addText(c.desc, {
      x: cardX + 0.25,
      y: cardY + 0.6,
      w: cardW - 0.5,
      h: 0.85,
      fontSize: 10,
      fontFace: 'Arial',
      color: COLORS.textLightMuted,
      lineSpacingMultiple: 1.15,
    });
  });

  // Technology Pills at Bottom
  const techPills = ['Turborepo', 'NestJS v11', 'React 18 + Vite', 'PostgreSQL', 'Prisma ORM', 'Decimal.js', 'Vitest'];
  techPills.forEach((tech, idx) => {
    slide.addShape(pres.ShapeType.roundRect, {
      x: 1.0 + idx * 1.65,
      y: 6.0,
      w: 1.55,
      h: 0.32,
      rectRadius: 0.08,
      fill: { color: '0F2344' },
      line: { color: '1E3A8A', width: 1 },
    });

    slide.addText(tech, {
      x: 1.0 + idx * 1.65,
      y: 6.0,
      w: 1.55,
      h: 0.32,
      fontSize: 9,
      fontFace: 'Arial',
      bold: true,
      color: '93C5FD',
      align: 'center',
      valign: 'middle',
    });
  });

  addSlideFooter(slide, 1, TOTAL_SLIDES, true);
}

// ==========================================
// SLIDE 2: O DESAFIO DO SETOR GRÁFICO (A DOR)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.bgLight };
  addSlideHeader(
    slide,
    'Contexto & Mercado',
    'Por que ERPs genéricos falham na Indústria Gráfica?',
    'A física da folha inteira e a engenharia de custos gráfica não cabem em softwares de prateleira.'
  );

  // Left Column: 3 Problem Cards
  const problems = [
    {
      badge: 'FÍSICA DA FOLHA INTEIRA',
      title: 'Imposição, Corte e Sangria',
      text: 'Papéis são adquiridos em grandes formatos (66x96cm, 64x88cm). Saber quantas peças cabem na folha, descontando a margem de pinça da impressora e a sangria do refile, é um cálculo geométrico que define o lucro ou o prejuízo.',
    },
    {
      badge: 'PRECIFICAÇÃO COMPLEXA',
      title: 'Composição Técnica de Custo',
      text: 'O preço gráfico não é uma margem percentual sobre um produto pronto. Ele envolve consumo de substrato, tempo de acerto (setup), tiragem/velocidade de máquina, chapas CTP, tintas CMYK e etapas de acabamento terceirizadas.',
    },
    {
      badge: 'CHÃO DE FÁBRICA & ESTOQUE',
      title: 'Descompasso entre Vendas e Produção',
      text: 'Sistemas genéricos não dão baixa automática no estoque no momento em que a folha entra na máquina de impressão, causando rupturas de matéria-prima, retrabalhos e falta de rastreabilidade de custos.',
    },
  ];

  problems.forEach((p, idx) => {
    const yPos = 1.9 + idx * 1.6;
    addCard(slide, 0.8, yPos, 5.6, 1.45);

    slide.addText(p.badge, {
      x: 1.05,
      y: yPos + 0.12,
      w: 5.1,
      h: 0.22,
      fontSize: 8.5,
      fontFace: 'Arial',
      bold: true,
      color: COLORS.primary,
    });

    slide.addText(p.title, {
      x: 1.05,
      y: yPos + 0.35,
      w: 5.1,
      h: 0.32,
      fontSize: 12.5,
      fontFace: 'Arial',
      bold: true,
      color: COLORS.textDark,
    });

    slide.addText(p.text, {
      x: 1.05,
      y: yPos + 0.68,
      w: 5.1,
      h: 0.7,
      fontSize: 9.5,
      fontFace: 'Arial',
      color: COLORS.textMuted,
      lineSpacingMultiple: 1.15,
    });
  });

  // Right Column: Big Comparison Card
  addCard(slide, 6.7, 1.9, 5.8, 4.65);

  slide.addShape(pres.ShapeType.rect, {
    x: 6.7,
    y: 1.9,
    w: 5.8,
    h: 0.1,
    fill: { color: COLORS.accent },
    line: { color: COLORS.accent },
  });

  slide.addText('COMPARAÇÃO DIRETA DE MERCADO', {
    x: 7.0,
    y: 2.15,
    w: 5.2,
    h: 0.25,
    fontSize: 10,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.accent,
  });

  slide.addText('Sistemas Tradicionais vs. ERP Gráfica Modular', {
    x: 7.0,
    y: 2.45,
    w: 5.2,
    h: 0.4,
    fontSize: 16,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.textDark,
  });

  const compItems = [
    {
      title: '❌ ERPs de Comércio (Bling, Tiny, Omie):',
      desc: 'Tratam produtos como mercadoria pronta de prateleira (código de barras e estoque unitário). Não calculam aproveitamento de folha nem horas de setup de máquinas industriais.',
      color: 'DC2626',
    },
    {
      title: '⚠️ Softwares Gráficos Legados:',
      desc: 'Sistemas desktop pesados, tecnologias dos anos 2000, interfaces antiquadas, sem APIs abertas, sem WebSockets em tempo real e de difícil manutenção.',
      color: 'D97706',
    },
    {
      title: '✅ Nossa Solução (ERP Gráfica):',
      desc: 'Monorepo moderno, motor matemático puro com precisão Decimal.js, interface web SPA responsiva, rastreabilidade visual Kanban e DRE gerencial atualizado a cada ordem.',
      color: '16A34A',
    },
  ];

  compItems.forEach((ci, idx) => {
    const itemY = 3.0 + idx * 1.15;
    slide.addText(ci.title, {
      x: 7.0,
      y: itemY,
      w: 5.2,
      h: 0.28,
      fontSize: 11,
      fontFace: 'Arial',
      bold: true,
      color: ci.color,
    });

    slide.addText(ci.desc, {
      x: 7.0,
      y: itemY + 0.3,
      w: 5.2,
      h: 0.75,
      fontSize: 9.5,
      fontFace: 'Arial',
      color: COLORS.textMuted,
      lineSpacingMultiple: 1.15,
    });
  });

  addSlideFooter(slide, 2, TOTAL_SLIDES);
}

// ==========================================
// SLIDE 3: DASHBOARD EXECUTIVO & RBAC
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.bgLight };
  addSlideHeader(
    slide,
    'Central de Comando',
    'Dashboard Executivo em Tempo Real & Controle por Perfis (RBAC)',
    'Visão consolidada da operação fabril e financeira com estrito controle de privilégios de acesso.'
  );

  // Left Column
  addCard(slide, 0.8, 1.9, 4.8, 4.65);

  slide.addText('DESTAQUES DO PAINEL', {
    x: 1.05,
    y: 2.1,
    w: 4.3,
    h: 0.25,
    fontSize: 9.5,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.primary,
  });

  slide.addText('Gestão Visual & Indicadores Chave', {
    x: 1.05,
    y: 2.35,
    w: 4.3,
    h: 0.35,
    fontSize: 14,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.textDark,
  });

  const dashHighlights = [
    {
      label: '⚡ Métricas Operacionais Vivas',
      text: 'Total de ordens em produção, orçamentos aguardando aprovação e avisos de insumos com estoque baixo.',
    },
    {
      label: '🔐 4 Perfis de Acesso Estritos (RBAC)',
      text: '• ADMIN: Acesso e parametrização geral\n• COMMERCIAL: Orçamentos e clientes\n• FINANCIAL: DRE, contas a pagar e receber\n• OPERATOR: Apontamento no chão de fábrica',
    },
    {
      label: '🎨 Design System Profissional',
      text: 'Interface intuitiva em React + Tailwind CSS com suporte nativo a temas claro e escuro.',
    },
    {
      label: '🛡️ Autenticação Segura',
      text: 'Proteção via tokens JWT criptografados e controle de sessão.',
    },
  ];

  dashHighlights.forEach((dh, idx) => {
    const dy = 2.8 + idx * 0.92;
    slide.addText(dh.label, {
      x: 1.05,
      y: dy,
      w: 4.3,
      h: 0.25,
      fontSize: 10.5,
      fontFace: 'Arial',
      bold: true,
      color: COLORS.textDark,
    });

    slide.addText(dh.text, {
      x: 1.05,
      y: dy + 0.24,
      w: 4.3,
      h: 0.65,
      fontSize: 9,
      fontFace: 'Arial',
      color: COLORS.textMuted,
      lineSpacingMultiple: 1.15,
    });
  });

  // Right Column: Real Screenshot
  addScreenshot(slide, 'scripts/screenshots/02_dashboard.png', 5.85, 1.95, 6.65, 3.95);

  // Caption below screenshot
  slide.addText('📸 Interface real do Dashboard executivo capturada diretamente da versão em execução (localhost:5173)', {
    x: 5.85,
    y: 6.15,
    w: 6.65,
    h: 0.3,
    fontSize: 8.5,
    fontFace: 'Arial',
    italic: true,
    color: COLORS.textMuted,
    align: 'center',
  });

  addSlideFooter(slide, 3, TOTAL_SLIDES);
}

// ==========================================
// SLIDE 4: ENGENHARIA GRÁFICA & ORÇAMENTOS
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.bgLight };
  addSlideHeader(
    slide,
    'Engenharia & Precificação',
    'Motor de Imposição Automática & Formação Técnica de Preço',
    'Matemática arbitrária com Decimal.js eliminando sobras de corte e erros de arredondamento financeiro.'
  );

  // Left Column
  addCard(slide, 0.8, 1.9, 4.8, 4.65);

  slide.addText('MOTOR MATEMÁTICO (@erp/business-core)', {
    x: 1.05,
    y: 2.1,
    w: 4.3,
    h: 0.25,
    fontSize: 9.5,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.primary,
  });

  slide.addText('Aproveitamento Inteligente da Folha', {
    x: 1.05,
    y: 2.35,
    w: 4.3,
    h: 0.35,
    fontSize: 14,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.textDark,
  });

  const quoteSteps = [
    {
      title: '1. Otimização de Rotação (90° vs Direto)',
      desc: 'O sistema testa simultaneamente as duas disposições na folha inteira para escolher a opção que gera o maior número de peças e o menor descarte de papel.',
    },
    {
      title: '2. Desconto de Sangria & Pinça de Impressora',
      desc: 'Respeita rigorosamente a área não imprimível onde a máquina agarra o papel (pinça) e a área extra para o refile perfeito da guilhotina.',
    },
    {
      title: '3. Formação Transparente do Custo Real',
      desc: 'Custo de papel consumido + custo de hora/máquina (setup + tiragem) + chapas CTP + acabamentos. Aplicação do markup comercial em cima do custo exato.',
    },
    {
      title: '4. Conversão Instantânea para OS',
      desc: 'Ao ser aprovado pelo cliente, o orçamento gera imediatamente uma Ordem de Serviço pronta para o chão de fábrica.',
    },
  ];

  quoteSteps.forEach((qs, idx) => {
    const qy = 2.8 + idx * 0.93;
    slide.addText(qs.title, {
      x: 1.05,
      y: qy,
      w: 4.3,
      h: 0.25,
      fontSize: 10.5,
      fontFace: 'Arial',
      bold: true,
      color: COLORS.textDark,
    });

    slide.addText(qs.desc, {
      x: 1.05,
      y: qy + 0.24,
      w: 4.3,
      h: 0.65,
      fontSize: 9,
      fontFace: 'Arial',
      color: COLORS.textMuted,
      lineSpacingMultiple: 1.15,
    });
  });

  // Right Column: Real Screenshot (Novo Orçamento)
  addScreenshot(slide, 'scripts/screenshots/05_novo_orcamento.png', 5.85, 1.95, 6.65, 3.95);

  slide.addText('📸 Simulador e criador de orçamentos técnicos com cálculo instantâneo de peças por folha e formação de preço', {
    x: 5.85,
    y: 6.15,
    w: 6.65,
    h: 0.3,
    fontSize: 8.5,
    fontFace: 'Arial',
    italic: true,
    color: COLORS.textMuted,
    align: 'center',
  });

  addSlideFooter(slide, 4, TOTAL_SLIDES);
}

// ==========================================
// SLIDE 5: PCP & CHÃO DE FÁBRICA (KANBAN)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.bgLight };
  addSlideHeader(
    slide,
    'Produção & Chão de Fábrica',
    'Rastreabilidade Total com Kanban e Baixa Automática no Estoque',
    'Máquina de estados sequencial rigorosa com sincronização em tempo real via WebSockets.'
  );

  // Left Column
  addCard(slide, 0.8, 1.9, 4.8, 4.65);

  slide.addText('MÁQUINA DE ESTADOS DA PRODUÇÃO', {
    x: 1.05,
    y: 2.1,
    w: 4.3,
    h: 0.25,
    fontSize: 9.5,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.emerald,
  });

  slide.addText('Esteira Produtiva Sem Gargalos', {
    x: 1.05,
    y: 2.35,
    w: 4.3,
    h: 0.35,
    fontSize: 14,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.textDark,
  });

  const pcpFeatures = [
    {
      title: '📍 Fluxo Sequencial Estrito',
      desc: 'PENDENTE ➔ PRÉ-IMPRESSÃO ➔ IMPRESSÃO ➔ ACABAMENTO ➔ CONTROLE DE QUALIDADE ➔ PRONTO ➔ ENTREGUE. Impede que etapas sejam puladas.',
    },
    {
      title: '📦 Baixa Automática de Matéria-Prima',
      desc: 'Ao transicionar a OS para "IMPRESSÃO", a quantidade de folhas calculada na engenharia é automaticamente deduzida do estoque físico.',
    },
    {
      title: '⏱️ Apontamento de Chão de Fábrica',
      desc: 'Operadores acionam START, PAUSE e COMPLETE na máquina, registrando tempos reais de produção e perdas para auditoria.',
    },
    {
      title: '📡 Sincronização em Tempo Real',
      desc: 'Gateway WebSocket atualiza o quadro Kanban simultaneamente em todos os terminais da gráfica sem necessidade de recarregar a página.',
    },
  ];

  pcpFeatures.forEach((pf, idx) => {
    const py = 2.8 + idx * 0.93;
    slide.addText(pf.title, {
      x: 1.05,
      y: py,
      w: 4.3,
      h: 0.25,
      fontSize: 10.5,
      fontFace: 'Arial',
      bold: true,
      color: COLORS.textDark,
    });

    slide.addText(pf.desc, {
      x: 1.05,
      y: py + 0.24,
      w: 4.3,
      h: 0.65,
      fontSize: 9,
      fontFace: 'Arial',
      color: COLORS.textMuted,
      lineSpacingMultiple: 1.15,
    });
  });

  // Right Column: Real Screenshot (Kanban)
  addScreenshot(slide, 'scripts/screenshots/03_kanban_producao.png', 5.85, 1.95, 6.65, 3.95);

  slide.addText('📸 Quadro Kanban de ordens de serviço com cartões informando cliente, tiragem, prazos e operadores', {
    x: 5.85,
    y: 6.15,
    w: 6.65,
    h: 0.3,
    fontSize: 8.5,
    fontFace: 'Arial',
    italic: true,
    color: COLORS.textMuted,
    align: 'center',
  });

  addSlideFooter(slide, 5, TOTAL_SLIDES);
}

// ==========================================
// SLIDE 6: GESTÃO DE ESTOQUE & INSUMOS
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.bgLight };
  addSlideHeader(
    slide,
    'Supply Chain & Estoque',
    'Controle Especializado de Papéis e Matérias-Primas Gráficas',
    'Catálogo modelado para formatos de folha inteira, gramaturas industriais e custos de reposição.'
  );

  // Left Column
  addCard(slide, 0.8, 1.9, 4.8, 4.65);

  slide.addText('GESTÃO DE SUBSTRATOS', {
    x: 1.05,
    y: 2.1,
    w: 4.3,
    h: 0.25,
    fontSize: 9.5,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.primary,
  });

  slide.addText('Precisão em Folhas e Gramaturas', {
    x: 1.05,
    y: 2.35,
    w: 4.3,
    h: 0.35,
    fontSize: 14,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.textDark,
  });

  const stockFeatures = [
    {
      title: '📄 Atributos Gráficos Nativos',
      desc: 'Cadastro detalhado: Couché (Brilho/Fosco), Offset, Cartão Duplex, Kraft, com largura/altura da folha inteira (ex: 660x960 mm) e gramatura em g/m².',
    },
    {
      title: '🔄 Rastreabilidade de Consumo Real',
      desc: 'Histórico auditável: cada baixa no estoque é vinculada ao ID da Ordem de Serviço que a consumiu, garantindo rastreabilidade contra desvios.',
    },
    {
      title: '🚨 Ponto de Reposição & Alertas',
      desc: 'Níveis mínimos pré-configurados que sinalizam a necessidade de compra antes que a impressora fique ociosa por falta de papel.',
    },
    {
      title: '💰 Custos Médios Dinâmicos',
      desc: 'Alterações no preço do papel refletem imediatamente nos cálculos de novos orçamentos, blindando a margem da empresa contra a inflação.',
    },
  ];

  stockFeatures.forEach((sf, idx) => {
    const sy = 2.8 + idx * 0.93;
    slide.addText(sf.title, {
      x: 1.05,
      y: sy,
      w: 4.3,
      h: 0.25,
      fontSize: 10.5,
      fontFace: 'Arial',
      bold: true,
      color: COLORS.textDark,
    });

    slide.addText(sf.desc, {
      x: 1.05,
      y: sy + 0.24,
      w: 4.3,
      h: 0.65,
      fontSize: 9,
      fontFace: 'Arial',
      color: COLORS.textMuted,
      lineSpacingMultiple: 1.15,
    });
  });

  // Right Column: Real Screenshot (Estoque)
  addScreenshot(slide, 'scripts/screenshots/06_estoque_insumos.png', 5.85, 1.95, 6.65, 3.95);

  slide.addText('📸 Painel de estoque com especificações de papéis, formatos de folha, gramaturas e quantidades disponíveis', {
    x: 5.85,
    y: 6.15,
    w: 6.65,
    h: 0.3,
    fontSize: 8.5,
    fontFace: 'Arial',
    italic: true,
    color: COLORS.textMuted,
    align: 'center',
  });

  addSlideFooter(slide, 6, TOTAL_SLIDES);
}

// ==========================================
// SLIDE 7: MÓDULO FINANCEIRO & DRE GERENCIAL
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.bgLight };
  addSlideHeader(
    slide,
    'Gestão Financeira',
    'DRE Gerencial em Tempo Real, Contas a Receber e OPEX',
    'Conexão direta entre o chão de fábrica e a apuração contábil do resultado líquido da empresa.'
  );

  // Left Column
  addCard(slide, 0.8, 1.9, 4.8, 4.65);

  slide.addText('SAÚDE FINANCEIRA & RESULTADOS', {
    x: 1.05,
    y: 2.1,
    w: 4.3,
    h: 0.25,
    fontSize: 9.5,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.amber,
  });

  slide.addText('DRE Gerencial & Fluxo Financeiro', {
    x: 1.05,
    y: 2.35,
    w: 4.3,
    h: 0.35,
    fontSize: 14,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.textDark,
  });

  const finFeatures = [
    {
      title: '📈 Estrutura Contábil Automatizada',
      desc: '(+) Receita Bruta\n(-) Deduções e Devoluções\n(-) CPV (Papel, Tintas, Chapas e Hora-Máquina)\n(=) Margem de Contribuição\n(-) Despesas Fixas Operacionais (OPEX)\n(=) Resultado Líquido do Exercício.',
    },
    {
      title: '💳 Contas a Receber Flexível',
      desc: 'Geração automática de títulos a receber vinculados às OSs com condições à vista, faturamento a prazo ou 50/50.',
    },
    {
      title: '📋 Despesas Operacionais (OPEX)',
      desc: 'Controle de custos fixos (aluguel, salários, energia elétrica, manutenção preventiva de máquinas) com suporte a despesas recorrentes.',
    },
  ];

  finFeatures.forEach((ff, idx) => {
    const fy = 2.75 + idx * 1.25;
    slide.addText(ff.title, {
      x: 1.05,
      y: fy,
      w: 4.3,
      h: 0.25,
      fontSize: 10.5,
      fontFace: 'Arial',
      bold: true,
      color: COLORS.textDark,
    });

    slide.addText(ff.desc, {
      x: 1.05,
      y: fy + 0.24,
      w: 4.3,
      h: 0.95,
      fontSize: 9,
      fontFace: 'Arial',
      color: COLORS.textMuted,
      lineSpacingMultiple: 1.15,
    });
  });

  // Right Column: Real Screenshot (DRE)
  addScreenshot(slide, 'scripts/screenshots/07_dre_financeiro.png', 5.85, 1.95, 6.65, 3.95);

  slide.addText('📸 Demonstração do Resultado do Exercício (DRE) gerencial atualizada em tempo real conforme as ordens avançam', {
    x: 5.85,
    y: 6.15,
    w: 6.65,
    h: 0.3,
    fontSize: 8.5,
    fontFace: 'Arial',
    italic: true,
    color: COLORS.textMuted,
    align: 'center',
  });

  addSlideFooter(slide, 7, TOTAL_SLIDES);
}

// ==========================================
// SLIDE 8: ARQUITETURA TÉCNICA & ENGENHARIA DE SOFTWARE
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.bgDark };
  addSlideHeader(
    slide,
    'Engenharia de Software',
    'Arquitetura Tecnológica Moderna, Resiliente e Escalável',
    'Monorepo de alta performance com TypeScript estrito, NestJS, React, Prisma e 174 testes automatizados.',
    true
  );

  // 4 Architecture Column Cards
  const archCards = [
    {
      title: '⚡ Monorepo & Core',
      tech: 'Turborepo + pnpm',
      items: [
        'Compartilhamento de código e tipos em tempo de compilação',
        'Motor matemático isolado (@erp/business-core)',
        'Pipelines de build paralelos com cache inteligente',
        'Contratos compartilhados (@erp/shared-types)',
      ],
      color: '3B82F6',
    },
    {
      title: '🚀 Backend API',
      tech: 'NestJS v11 + TypeScript',
      items: [
        'Arquitetura modular orientada a serviços',
        'WebSockets Gateway para atualizações em tempo real',
        'Tratamento padronizado de erros via RFC 7807',
        '19 endpoints documentados e testados no Swagger',
      ],
      color: '10B981',
    },
    {
      title: '💻 Frontend Web',
      tech: 'React 18 + Vite + Tailwind',
      items: [
        'Single Page Application (SPA) ultra rápida',
        'TanStack Query para cache e revalidação otimizada',
        'Zustand para gerenciamento reativo de estado global',
        'Componentes reutilizáveis com Lucide Icons',
      ],
      color: 'F59E0B',
    },
    {
      title: '🗄️ Dados & Qualidade',
      tech: 'PostgreSQL + Prisma + Vitest',
      items: [
        'Banco relacional com integridade estrita e migrações',
        'Decimal.js eliminando bugs de ponto flutuante',
        '174 testes unitários e de integração contínuos',
        'Seeds automáticos para restauração rápida de dados',
      ],
      color: '8B5CF6',
    },
  ];

  archCards.forEach((ac, idx) => {
    const ax = 0.8 + idx * 2.98;
    const ay = 1.95;
    const aw = 2.8;
    const ah = 4.65;

    slide.addShape(pres.ShapeType.roundRect, {
      x: ax,
      y: ay,
      w: aw,
      h: ah,
      rectRadius: 0.12,
      fill: { color: '1E293B' },
      line: { color: '334155', width: 1 },
    });

    slide.addShape(pres.ShapeType.rect, {
      x: ax,
      y: ay,
      w: aw,
      h: 0.08,
      fill: { color: ac.color },
      line: { color: ac.color },
    });

    slide.addText(ac.title, {
      x: ax + 0.2,
      y: ay + 0.2,
      w: aw - 0.4,
      h: 0.3,
      fontSize: 12.5,
      fontFace: 'Arial',
      bold: true,
      color: COLORS.textLight,
    });

    slide.addText(ac.tech, {
      x: ax + 0.2,
      y: ay + 0.48,
      w: aw - 0.4,
      h: 0.22,
      fontSize: 9.5,
      fontFace: 'Arial',
      bold: true,
      color: ac.color,
    });

    ac.items.forEach((it, iIdx) => {
      const iy = ay + 0.9 + iIdx * 0.85;
      slide.addText(`• ${it}`, {
        x: ax + 0.2,
        y: iy,
        w: aw - 0.4,
        h: 0.75,
        fontSize: 9,
        fontFace: 'Arial',
        color: COLORS.textLightMuted,
        lineSpacingMultiple: 1.15,
      });
    });
  });

  addSlideFooter(slide, 8, TOTAL_SLIDES, true);
}

// ==========================================
// SLIDE 9: ROTEIRO DA DEMONSTRAÇÃO AO VIVO (DEMO FLOW)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.bgLight };
  addSlideHeader(
    slide,
    'Roteiro Prático',
    'Demonstração ao Vivo: O Fluxo do Pedido em 5 Passos',
    'Roteiro estruturado de 8 minutos para guiar a apresentação prática interativa com os colegas.'
  );

  const steps = [
    {
      num: 'PASSO 1',
      title: 'Login & Visão Geral',
      time: '1 minuto',
      desc: 'Acesse http://localhost:5173 com o usuário admin@erpgrafica.com. Apresente o design moderno, métricas no Dashboard e menu lateral.',
      icon: '🔐',
    },
    {
      num: 'PASSO 2',
      title: 'Engenharia de Orçamento',
      time: '2 minutos',
      desc: 'Navegue para "Novo Orçamento". Defina um produto (ex: Cartão de Visita em Couché 300g). Destaque o cálculo automático de peças por folha e aproveitamento.',
      icon: '📐',
    },
    {
      num: 'PASSO 3',
      title: 'Aprovação & Ordem de Serviço',
      time: '1 minuto',
      desc: 'Aprove o orçamento com 1 clique. O sistema cria automaticamente a Ordem de Serviço numerada e já a posiciona na esteira de produção.',
      icon: '✅',
    },
    {
      num: 'PASSO 4',
      title: 'Chão de Fábrica & Estoque',
      time: '2 minutos',
      desc: 'Acesse o Kanban (/work-orders) e mova a OS para "Impressão". Mostre na aba de Insumos (/raw-materials) a dedução automática de folhas do estoque.',
      icon: '⚙️',
    },
    {
      num: 'PASSO 5',
      title: 'Fechamento & DRE Gerencial',
      time: '2 minutos',
      desc: 'Visite a tela do DRE (/financial/dre) e Contas a Receber. Demonstre como a venda recém-aprovada alimentou a receita, custos e o lucro líquido.',
      icon: '📊',
    },
  ];

  steps.forEach((st, idx) => {
    const sx = 0.8 + idx * 2.38;
    const sy = 1.95;
    const sw = 2.22;
    const sh = 4.65;

    addCard(slide, sx, sy, sw, sh);

    // Number Badge
    slide.addShape(pres.ShapeType.roundRect, {
      x: sx + 0.15,
      y: sy + 0.18,
      w: 1.1,
      h: 0.28,
      rectRadius: 0.14,
      fill: { color: 'EFF6FF' },
      line: { color: 'BFDBFE', width: 1 },
    });

    slide.addText(st.num, {
      x: sx + 0.15,
      y: sy + 0.18,
      w: 1.1,
      h: 0.28,
      fontSize: 8.5,
      fontFace: 'Arial',
      bold: true,
      color: COLORS.primary,
      align: 'center',
      valign: 'middle',
    });

    // Time Pill
    slide.addText(st.time, {
      x: sx + 1.25,
      y: sy + 0.18,
      w: 0.8,
      h: 0.28,
      fontSize: 8,
      fontFace: 'Arial',
      color: COLORS.textMuted,
      align: 'right',
      valign: 'middle',
    });

    // Icon
    slide.addText(st.icon, {
      x: sx + 0.15,
      y: sy + 0.65,
      w: sw - 0.3,
      h: 0.5,
      fontSize: 24,
      fontFace: 'Arial',
    });

    // Step Title
    slide.addText(st.title, {
      x: sx + 0.15,
      y: sy + 1.25,
      w: sw - 0.3,
      h: 0.55,
      fontSize: 12,
      fontFace: 'Arial',
      bold: true,
      color: COLORS.textDark,
      lineSpacingMultiple: 1.1,
    });

    // Description
    slide.addText(st.desc, {
      x: sx + 0.15,
      y: sy + 1.85,
      w: sw - 0.3,
      h: 2.6,
      fontSize: 9.5,
      fontFace: 'Arial',
      color: COLORS.textMuted,
      lineSpacingMultiple: 1.2,
    });
  });

  addSlideFooter(slide, 9, TOTAL_SLIDES);
}

// ==========================================
// SLIDE 10: ROADMAP & CONCLUSÃO
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLORS.bgDark };
  addSlideHeader(
    slide,
    'Visão de Futuro',
    'Roadmap do Produto: Próximos Passos & Oportunidades',
    'Do MVP validado e funcional à plataforma completa de transformação digital do setor gráfico.',
    true
  );

  // Left Column: Roadmap Cards
  const futureItems = [
    {
      title: '📱 App Mobile / PWA para Operadores',
      desc: 'Leitura de QR Code na máquina com câmera do celular ou tablet para apontamento de início, pausas e perdas com 1 toque.',
    },
    {
      title: '🖨️ Integração Direta com CTP (JDF / CIP4)',
      desc: 'Envio automático das curvas de tintas e layout de imposição para as gravadoras de chapas e impressoras industriais.',
    },
    {
      title: '🌐 Portal B2B do Cliente Gráfico',
      desc: 'Área do cliente para solicitação de propostas online, upload de arquivos e aprovação digital de provas em PDF com assinatura.',
    },
    {
      title: '🤖 Inteligência Artificial Preditiva',
      desc: 'Previsão de reposição de insumos para compras antecipadas em lote com melhor preço e sugestão de precificação dinâmica.',
    },
  ];

  futureItems.forEach((fi, idx) => {
    const fy = 1.95 + idx * 1.15;

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8,
      y: fy,
      w: 6.2,
      h: 1.05,
      rectRadius: 0.1,
      fill: { color: '1E293B' },
      line: { color: '334155', width: 1 },
    });

    slide.addText(fi.title, {
      x: 1.05,
      y: fy + 0.12,
      w: 5.7,
      h: 0.28,
      fontSize: 11.5,
      fontFace: 'Arial',
      bold: true,
      color: '60A5FA',
    });

    slide.addText(fi.desc, {
      x: 1.05,
      y: fy + 0.42,
      w: 5.7,
      h: 0.55,
      fontSize: 9.5,
      fontFace: 'Arial',
      color: COLORS.textLightMuted,
      lineSpacingMultiple: 1.15,
    });
  });

  // Right Column: Conclusion & CTA Card
  addCard(slide, 7.3, 1.95, 5.2, 4.65, true);

  slide.addShape(pres.ShapeType.rect, {
    x: 7.3,
    y: 1.95,
    w: 5.2,
    h: 0.1,
    fill: { color: COLORS.emerald },
    line: { color: COLORS.emerald },
  });

  slide.addText('STATUS DO PROJETO', {
    x: 7.6,
    y: 2.2,
    w: 4.6,
    h: 0.25,
    fontSize: 10,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.emerald,
  });

  slide.addText('MVP 100% Funcional e Validado', {
    x: 7.6,
    y: 2.5,
    w: 4.6,
    h: 0.4,
    fontSize: 18,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.textLight,
  });

  const summaryPoints = [
    '✅ Regras industriais de corte e precificação implementadas',
    '✅ Fluxo completo: Comercial ➔ Produção ➔ Estoque ➔ DRE',
    '✅ 174 testes automatizados cobrindo os módulos críticos',
    '✅ API aberta com 19 rotas documentadas em OpenAPI/Swagger',
    '✅ Banco de dados resiliente e reproduzível com scripts de seed',
  ];

  summaryPoints.forEach((sp, idx) => {
    slide.addText(sp, {
      x: 7.6,
      y: 3.0 + idx * 0.48,
      w: 4.6,
      h: 0.42,
      fontSize: 10,
      fontFace: 'Arial',
      color: COLORS.textLightMuted,
    });
  });

  slide.addShape(pres.ShapeType.roundRect, {
    x: 7.6,
    y: 5.5,
    w: 4.6,
    h: 0.85,
    rectRadius: 0.1,
    fill: { color: '0F2344' },
    line: { color: '2563EB', width: 1.5 },
  });

  slide.addText('💬  Dúvidas, Sugestões & Feedback?', {
    x: 7.6,
    y: 5.5,
    w: 4.6,
    h: 0.45,
    fontSize: 12,
    fontFace: 'Arial',
    bold: true,
    color: '93C5FD',
    align: 'center',
    valign: 'middle',
  });

  slide.addText('Vamos abrir a discussão e testar juntos o sistema ao vivo!', {
    x: 7.6,
    y: 5.95,
    w: 4.6,
    h: 0.35,
    fontSize: 9.5,
    fontFace: 'Arial',
    color: 'BFDBFE',
    align: 'center',
  });

  addSlideFooter(slide, 10, TOTAL_SLIDES, true);
}

// Generate Presentation
const outputFile = path.resolve(__dirname, '../Apresentacao_ERP_Grafica_MVP.pptx');

console.log('🚀 Gerando arquivo PowerPoint com 10 slides profissionais e imagens reais...');
pres
  .writeFile({ fileName: outputFile })
  .then(() => {
    console.log(`🎉 Apresentação gerada com sucesso em:\n${outputFile}`);
  })
  .catch((err) => {
    console.error('❌ Erro ao gerar apresentação:', err);
    process.exit(1);
  });
