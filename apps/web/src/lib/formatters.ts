/**
 * formatters.ts
 * Utilitários puros para formatação e parsing de moedas (BRL), números inteiros,
 * grandezas físicas e máscaras de documentos e telefones no padrão brasileiro.
 */

/**
 * Converte qualquer entrada de valor monetário (string formatada ou número) em float limpo.
 * Ex: "1.250,50" -> 1250.5 | "R$ 0,85" -> 0.85 | 1500 -> 1500
 */
export function parseCurrency(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;

  let str = String(value).replace(/[R$\s]/g, '').trim();
  if (!str) return 0;

  if (str.includes(',')) {
    // Padrão brasileiro: pontos são milhares e vírgula é decimal
    str = str.replace(/\./g, '').replace(',', '.');
  } else {
    // Não tem vírgula. Pode ser string de float ("1500.50") ou milhar ("1.500")
    const dotCount = (str.match(/\./g) || []).length;
    if (dotCount === 1) {
      const parts = str.split('.');
      if (parts[1].length === 3 && parts[0].length >= 1 && parts[0].length <= 3) {
        // Milhar (ex: "1.500" -> 1500)
        str = str.replace(/\./g, '');
      }
      // Se tiver 1 ou 2 dígitos decimais (ex: "1500.50"), mantém como float
    } else if (dotCount > 1) {
      // Múltiplos pontos: milhares (ex: "1.000.000" -> 1000000)
      str = str.replace(/\./g, '');
    }
  }

  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formata um valor monetário para exibição em campos de input durante digitação ou ao perder foco.
 * @param value Valor numérico ou string parcial
 * @param onBlur Se verdadeiro, fixa 2 casas decimais obrigatórias (ex: "1.500,00")
 */
export function formatCurrencyInput(
  value: number | string | undefined | null,
  onBlur: boolean = false
): string {
  if (value === undefined || value === null || value === '') return '';

  if (typeof value === 'number') {
    if (isNaN(value)) return '';
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  const str = String(value).trim();
  if (!str) return '';

  // Substitui múltiplos separadores por apenas um
  let normalized = str.replace(/[^\d,.]/g, '');
  
  // Normaliza o primeiro separador encontrado (seja ponto ou vírgula) para vírgula
  const firstSeparator = normalized.search(/[,.]/);
  let integerPart = '';
  let decimalPart = '';
  let hasSeparator = false;

  if (firstSeparator !== -1) {
    hasSeparator = true;
    integerPart = normalized.slice(0, firstSeparator).replace(/\D/g, '');
    decimalPart = normalized.slice(firstSeparator + 1).replace(/\D/g, '').slice(0, 2);
  } else {
    integerPart = normalized.replace(/\D/g, '');
  }

  if (onBlur) {
    const num = parseCurrency(normalized);
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }

  // Formata a parte inteira com pontos de milhar
  const formattedInteger = integerPart
    ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    : '0';

  if (hasSeparator) {
    return `${formattedInteger},${decimalPart}`;
  }

  return integerPart ? formattedInteger : '';
}

/**
 * Formata número decimal genérico (ex: medidas, peso).
 */
export function formatDecimal(
  value: number | string | undefined | null,
  decimals: number = 2,
  onBlur: boolean = false
): string {
  if (value === undefined || value === null || value === '') return '';
  const num = typeof value === 'number' ? value : parseDecimal(value);
  if (isNaN(num)) return '';

  if (onBlur) {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  }

  const str = String(value).replace('.', ',');
  return str;
}

/**
 * Converte string com vírgula ou ponto para float.
 */
export function parseDecimal(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const clean = value.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Formata número inteiro com separador de milhar brasileiro (ex: 10000 -> 10.000).
 */
export function formatInteger(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') return '';
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Converte qualquer entrada para inteiro limpo.
 */
export function parseInteger(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return Math.floor(isNaN(value) ? 0 : value);
  const digits = String(value).replace(/\D/g, '');
  const parsed = parseInt(digits, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Máscara dinâmica para CPF (11 dígitos) ou CNPJ (14 dígitos).
 */
export function maskCpfCnpj(value: string | undefined | null): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 14);

  if (digits.length <= 11) {
    // CPF: 000.000.000-00
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  // CNPJ: 00.000.000/0000-00
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/**
 * Máscara dinâmica para Telefone fixo ou WhatsApp/Celular.
 * Ex: (11) 98765-4321 ou (11) 3333-4444
 */
export function maskPhone(value: string | undefined | null): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 10) {
    // Fixo: (00) 0000-0000
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }

  // Celular: (00) 00000-0000
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}
